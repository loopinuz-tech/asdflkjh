import { createClient } from '@/lib/supabase/client'
import { verifyIeltsAnswer, calculateIeltsBand } from '@/lib/ielts-grader'

export async function startTest(testId: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) throw new Error('Unauthorized')

  const attemptsTable = (supabase as any).from('test_attempts')

  // Check if there is an in_progress attempt
  const { data: existingAttempt } = await attemptsTable
    .select('*')
    .eq('user_id', session.user.id)
    .eq('test_id', testId)
    .eq('status', 'in_progress')
    .single()

  if (existingAttempt) {
    return existingAttempt.id
  }

  // Create new attempt
  const { data: attempt, error } = await attemptsTable
    .insert({
      user_id: session.user.id,
      test_id: testId,
      status: 'in_progress'
    })
    .select('id')
    .single()

  if (error) throw new Error('Failed to start test')
  return attempt.id
}

export async function saveAnswer(attemptId: string, questionId: string, answer: any) {
  const supabase = createClient()
  
  const { error } = await (supabase as any)
    .from('attempt_answers')
    .upsert({
      attempt_id: attemptId,
      question_id: questionId,
      user_answer: answer,
      answered_at: new Date().toISOString()
    }, {
      onConflict: 'attempt_id, question_id'
    })

  if (error) {
    console.error('Error saving answer:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function toggleMarkForReview(attemptId: string, questionId: string, isMarked: boolean, currentAnswer?: any) {
  const supabase = createClient()
  
  const payload: any = {
    attempt_id: attemptId,
    question_id: questionId,
    marked_for_review: isMarked,
  }
  if (currentAnswer !== undefined) {
    payload.user_answer = currentAnswer
  }
  
  const { error } = await (supabase as any)
    .from('attempt_answers')
    .upsert(payload, {
      onConflict: 'attempt_id, question_id'
    })

  if (error) return { success: false }
  return { success: true }
}

export async function submitTest(
  attemptId: string, 
  clientAnswers?: Record<string, any>,
  timeSpentSeconds?: number
) {
  const supabase = createClient()
  
  // 1. Fetch attempt and associated test info
  const { data: attempt, error: attemptError } = await (supabase as any)
    .from('test_attempts')
    .select('*, tests(*)')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    throw new Error('Test attempt not found')
  }

  // 2. Fetch all questions for this test
  const { data: questions } = await (supabase as any)
    .from('questions')
    .select('id, question_number, question_type, correct_answer, accepted_answers, points, options, question_text, explanation')
    .eq('test_id', attempt.test_id)

  // 3. Fetch user answers for this attempt
  const { data: userAnswers } = await (supabase as any)
    .from('attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId)

  const answerMap = new Map((userAnswers || []).map((a: any) => [a.question_id, a]))

  let rawScore = 0
  let totalPoints = 0
  const questionResults: Record<string, {
    questionId: string
    questionNumber: number
    isCorrect: boolean
    earned: number
    userAnswer: any
    correctAnswer: any
    acceptedAnswers: any[]
    questionType: string
    questionText?: string
    explanation?: string
  }> = {}

  if (questions && questions.length > 0) {
    for (const q of questions) {
      const qPoints = Number(q.points) || 1
      totalPoints += qPoints

      const userAnsRecord = answerMap.get(q.id) as any
      let userVal = clientAnswers?.[q.id] !== undefined ? clientAnswers[q.id] : userAnsRecord?.user_answer

      // Parse JSON if stored as string
      if (typeof userVal === 'string') {
        try { userVal = JSON.parse(userVal) } catch {}
      }

      const isAnswered = userVal !== undefined && userVal !== null && userVal !== ''
      const isCorrect = isAnswered && verifyIeltsAnswer(
        userVal,
        q.correct_answer,
        q.accepted_answers,
        q.question_type,
        q.options
      )

      const earned = isCorrect ? qPoints : 0
      rawScore += earned

      questionResults[q.id] = {
        questionId: q.id,
        questionNumber: q.question_number,
        isCorrect: !!isCorrect,
        earned,
        userAnswer: isAnswered ? userVal : null,
        correctAnswer: q.correct_answer || (Array.isArray(q.accepted_answers) ? q.accepted_answers[0] : null),
        acceptedAnswers: Array.isArray(q.accepted_answers) ? q.accepted_answers : [],
        questionType: q.question_type,
        questionText: q.question_text,
        explanation: q.explanation
      }

      // Upsert attempt_answers row so DB has full evaluation records
      if (isAnswered || userAnsRecord) {
        await (supabase as any)
          .from('attempt_answers')
          .upsert({
            attempt_id: attemptId,
            question_id: q.id,
            user_answer: isAnswered ? userVal : null,
            is_correct: !!isCorrect,
            points_earned: earned,
            answered_at: new Date().toISOString()
          }, {
            onConflict: 'attempt_id, question_id'
          })
      }
    }
  } else {
    rawScore = userAnswers?.length || 0
    totalPoints = userAnswers?.length || 1
  }

  const testSkill = (attempt.tests as any)?.skill || 'reading'
  const testType = (attempt.tests as any)?.ielts_type || 'academic'
  const estimatedBand = calculateIeltsBand(rawScore, totalPoints, testSkill, testType)

  // Calculate actual elapsed test duration in seconds (capped between 10s and 3 hours)
  const startTime = new Date(attempt.started_at || attempt.created_at || Date.now()).getTime()
  const elapsedFromStart = Math.max(10, Math.min(10800, Math.round((Date.now() - startTime) / 1000)))
  const actualTimeUsedSeconds = timeSpentSeconds && timeSpentSeconds > 0
    ? Math.min(10800, Math.max(10, Math.round(timeSpentSeconds)))
    : elapsedFromStart

  // 4. Update test attempt record
  const { error: updateError } = await (supabase as any)
    .from('test_attempts')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      time_used_seconds: actualTimeUsedSeconds,
      raw_score: rawScore,
      total_points: totalPoints,
      estimated_band: estimatedBand
    })
    .eq('id', attemptId)

  if (updateError) {
    console.error('Error updating attempt:', updateError)
    throw new Error('Failed to submit test')
  }

  // 5. Update user progress record
  if (attempt?.user_id && attempt?.tests?.skill) {
    try {
      await (supabase as any)
        .from('progress')
        .insert({
          user_id: attempt.user_id,
          skill: attempt.tests.skill,
          score: rawScore,
          estimated_band: estimatedBand,
          recorded_at: new Date().toISOString()
        })
    } catch (e) {
      console.error('Failed to insert progress record:', e)
    }
  }

  return {
    success: true,
    raw_score: rawScore,
    total_points: totalPoints,
    estimated_band: estimatedBand,
    time_used_seconds: actualTimeUsedSeconds,
    answered_count: userAnswers?.length || 0,
    skill: attempt?.tests?.skill || 'reading',
    questionResults
  }
}
