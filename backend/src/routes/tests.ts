import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'
import { verifyIeltsAnswer, calculateIeltsBand } from '../utils/ielts-grader.js'
import { evaluateEssayWithGemini } from '../utils/gemini-evaluator.js'
import { evaluateSpeakingWithGemini } from '../utils/gemini-speaking-evaluator.js'

const router = Router()

// 1. LIST TESTS
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { skill, difficulty, search, limit = 50, page = 1 } = req.query

    let sql = `
      SELECT t.id, t.title, t.description, t.skill, t.difficulty, t.is_premium,
             t.access_type, t.status, t.time_limit_minutes, t.total_questions,
             t.slug, t.ielts_type, t.cover_image, t.tags, t.created_at,
             COUNT(DISTINCT q.id) as questions_count
      FROM tests t
      LEFT JOIN questions q ON q.test_id = t.id
      WHERE (t.status = 'published' OR t.status IS NULL)
        AND (t.is_archived = false OR t.is_archived IS NULL)
    `
    const params: any[] = []

    if (skill && skill !== 'all') {
      params.push(skill)
      sql += ` AND t.skill = $${params.length}`
    }

    if (difficulty && difficulty !== 'all') {
      params.push(difficulty)
      sql += ` AND t.difficulty = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      sql += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`
    }

    sql += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    const offset = (Number(page) - 1) * Number(limit)
    params.push(Number(limit), offset)

    const result = await query(sql, params)
    return res.json({ success: true, tests: result.rows })
  } catch (error: any) {
    console.error('List tests error:', error)
    return res.status(500).json({ error: 'Failed to fetch tests' })
  }
})

// 2. GET SINGLE TEST DETAILS WITH FULL STRUCTURE (supports UUID or slug)
export async function getFullTestById(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  const testRes = await query(
    `SELECT id, title, description, skill, difficulty, is_premium, access_type,
            time_limit_minutes, total_questions, slug, ielts_type, cover_image, tags
     FROM tests WHERE ${isUuid ? 'id = $1::uuid' : 'slug = $1'}`,
    [idOrSlug]
  )

  if (testRes.rows.length === 0) {
    return null
  }

  const test = testRes.rows[0]
  const testId = test.id

  // Fetch sections
  const sectionsRes = await query(
    `SELECT s.id, s.title, s.order_number, s.instructions, s.description,
            s.time_limit_minutes, s.image_url,
            p.id as passage_id, p.title as passage_title, p.content as passage_content,
            a.id as audio_id, a.title as audio_title, a.file_path as audio_file_path
     FROM test_sections s
     LEFT JOIN reading_passages p ON p.id = s.passage_id
     LEFT JOIN listening_audio a ON a.id = s.audio_id
     WHERE s.test_id = $1
     ORDER BY s.order_number ASC`,
    [testId]
  )

  const sections = []

  for (const sec of sectionsRes.rows) {
    // Fetch question groups for this section
    const groupsRes = await query(
      `SELECT g.id, g.title, g.instruction, g.order_number,
              p.id as passage_id, p.title as passage_title, p.content as passage_content,
              a.id as audio_id, a.title as audio_title, a.file_path as audio_file_path
       FROM question_groups g
       LEFT JOIN reading_passages p ON p.id = g.passage_id
       LEFT JOIN listening_audio a ON a.id = g.media_id
       WHERE g.section_id = $1
       ORDER BY g.order_number ASC`,
      [sec.id]
    )

    const groups = []

    for (const grp of groupsRes.rows) {
      // Fetch questions for this group
      const questionsRes = await query(
        `SELECT q.id, q.question_type, q.question_number, q.instruction,
                q.question_text, q.question_html, q.correct_answer, q.accepted_answers,
                q.passage_reference, q.image_url, q.audio_url, q.points, q.difficulty, q.explanation,
                q.metadata
         FROM questions q
         WHERE q.group_id = $1
         ORDER BY q.question_number ASC`,
        [grp.id]
      )

      const questions = []

      for (const q of questionsRes.rows) {
        // Fetch options from question_options table
        const optionsRes = await query(
          `SELECT id, option_key, option_text, is_correct, order_number
           FROM question_options
           WHERE question_id = $1
           ORDER BY order_number ASC`,
          [q.id]
        )

        // If no rows in question_options, fall back to metadata.options (seeded inline)
        let options = optionsRes.rows
        if (options.length === 0 && Array.isArray(q.metadata?.options) && q.metadata.options.length > 0) {
          options = q.metadata.options.map((opt: any, idx: number) => ({
            id: `meta-opt-${q.id}-${idx}`,
            option_key: opt.label || opt.option_key || String.fromCharCode(65 + idx),
            option_text: opt.text || opt.option_text || '',
            is_correct: false,
            order_number: idx + 1,
          }))
        }

        questions.push({
          ...q,
          options,
        })
      }

      groups.push({
        id: grp.id,
        title: grp.title,
        instruction: grp.instruction,
        order_number: grp.order_number,
        passage: grp.passage_id ? {
          id: grp.passage_id,
          title: grp.passage_title,
          content: grp.passage_content,
        } : (sec.passage_id ? {
          id: sec.passage_id,
          title: sec.passage_title,
          content: sec.passage_content,
        } : null),
        audio: grp.audio_id ? {
          id: grp.audio_id,
          title: grp.audio_title,
          file_path: grp.audio_file_path,
        } : (sec.audio_id ? {
          id: sec.audio_id,
          title: sec.audio_title,
          file_path: sec.audio_file_path,
        } : null),
        media: grp.audio_id ? {
          id: grp.audio_id,
          title: grp.audio_title,
          file_path: grp.audio_file_path,
        } : (sec.audio_id ? {
          id: sec.audio_id,
          title: sec.audio_title,
          file_path: sec.audio_file_path,
        } : null),
        questions,
      })
    }

    sections.push({
      id: sec.id,
      title: sec.title,
      order_number: sec.order_number,
      instructions: sec.instructions,
      description: sec.description,
      time_limit_minutes: sec.time_limit_minutes,
      passage: sec.passage_id ? {
        id: sec.passage_id,
        title: sec.passage_title,
        content: sec.passage_content,
      } : null,
      audio: sec.audio_id ? {
        id: sec.audio_id,
        title: sec.audio_title,
        file_path: sec.audio_file_path,
      } : null,
      media: sec.audio_id ? {
        id: sec.audio_id,
        title: sec.audio_title,
        file_path: sec.audio_file_path,
      } : null,
      groups,
    })
  }

  // Collect all questions from groups
  const allQuestions: any[] = []
  for (const s of sections) {
    for (const g of s.groups) {
      for (const q of g.questions) {
        allQuestions.push(q)
      }
    }
  }

  // Also query questions directly associated with test_id
  const directQuestionsRes = await query(
    `SELECT q.* FROM questions q WHERE q.test_id = $1 ORDER BY q.question_number ASC`,
    [testId]
  )
  let finalQuestions = allQuestions
  if (directQuestionsRes.rows.length > allQuestions.length) {
    const qIds = directQuestionsRes.rows.map(q => q.id)
    const optionsRes = await query(
      `SELECT * FROM question_options WHERE question_id = ANY($1) ORDER BY order_number ASC`,
      [qIds]
    )
    const optionsByQ = new Map<string, any[]>()
    for (const opt of optionsRes.rows) {
      if (!optionsByQ.has(opt.question_id)) optionsByQ.set(opt.question_id, [])
      optionsByQ.get(opt.question_id)!.push(opt)
    }
    finalQuestions = directQuestionsRes.rows.map(q => ({
      ...q,
      options: optionsByQ.get(q.id) || []
    }))
  }

  return {
    ...test,
    sections,
    questions: finalQuestions,
  }
}

router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const test = await getFullTestById(id)

    if (!test) {
      return res.status(404).json({ error: 'Test not found' })
    }

    return res.json({ success: true, test })
  } catch (error: any) {
    console.error('Get test error:', error)
    return res.status(500).json({ error: 'Failed to load test details' })
  }
})

// 3. START OR RESUME ATTEMPT
router.post('/:id/attempt', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: rawTestId } = req.params
    const userId = req.user!.id

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTestId)
    let testId = rawTestId
    if (!isUuid) {
      const testLookup = await query('SELECT id FROM tests WHERE slug = $1 LIMIT 1', [rawTestId])
      if (testLookup.rows.length === 0) {
        return res.status(404).json({ error: 'Test not found' })
      }
      testId = testLookup.rows[0].id
    }

    // Check for existing in_progress attempt
    const existingAttempt = await query(
      `SELECT id FROM test_attempts
       WHERE user_id = $1 AND test_id = $2 AND status = 'in_progress'
       LIMIT 1`,
      [userId, testId]
    )

    if (existingAttempt.rows.length > 0) {
      return res.json({ success: true, attemptId: existingAttempt.rows[0].id })
    }

    // Create new attempt
    const newAttempt = await query(
      `INSERT INTO test_attempts (user_id, test_id, status, started_at)
       VALUES ($1, $2, 'in_progress', NOW())
       RETURNING id`,
      [userId, testId]
    )

    return res.status(201).json({ success: true, attemptId: newAttempt.rows[0].id })
  } catch (error: any) {
    console.error('Start attempt error:', error)
    return res.status(500).json({ error: 'Failed to start test attempt' })
  }
})

// 4. SAVE ANSWER
router.post('/attempt/:attemptId/answer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params
    const { questionId, answer } = req.body

    await query(
      `INSERT INTO attempt_answers (attempt_id, question_id, user_answer, answered_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET user_answer = $3, answered_at = NOW()`,
      [attemptId, questionId, JSON.stringify(answer)]
    )

    return res.json({ success: true })
  } catch (error: any) {
    console.error('Save answer error:', error)
    return res.status(500).json({ error: 'Failed to save answer' })
  }
})

// 5. TOGGLE MARK FOR REVIEW
router.post('/attempt/:attemptId/review', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params
    const { questionId, isMarked } = req.body

    await query(
      `INSERT INTO attempt_answers (attempt_id, question_id, marked_for_review)
       VALUES ($1, $2, $3)
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET marked_for_review = $3`,
      [attemptId, questionId, isMarked]
    )

    return res.json({ success: true })
  } catch (error: any) {
    console.error('Toggle review error:', error)
    return res.status(500).json({ error: 'Failed to update review status' })
  }
})

// 6. SUBMIT TEST & GRADE
router.post('/attempt/:attemptId/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params
    const userId = req.user!.id

    // Fetch attempt details
    const attemptRes = await query(
      `SELECT a.id, a.user_id, a.test_id, t.skill, t.title
       FROM test_attempts a
       JOIN tests t ON t.id = a.test_id
       WHERE a.id = $1`,
      [attemptId]
    )

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Test attempt not found' })
    }

    const attempt = attemptRes.rows[0]

    // Fetch all questions with options for this test
    const questionsRes = await query(
      `SELECT q.id, q.question_number, q.question_type, q.correct_answer, q.accepted_answers, q.points,
              COALESCE(
                (SELECT json_agg(json_build_object('option_key', o.option_key, 'option_text', o.option_text, 'is_correct', o.is_correct))
                 FROM question_options o WHERE o.question_id = q.id), '[]'::json
              ) as options
       FROM questions q
       WHERE q.test_id = $1`,
      [attempt.test_id]
    )
    const questions = questionsRes.rows

    // Fetch user answers
    const answersRes = await query(
      `SELECT id, question_id, user_answer
       FROM attempt_answers
       WHERE attempt_id = $1`,
      [attemptId]
    )
    const answersMap = new Map<string, any>(answersRes.rows.map((a: any) => [a.question_id, a]))

    let rawScore = 0
    let totalPoints = 0

    for (const q of questions) {
      const qPoints = Number(q.points) || 1
      totalPoints += qPoints

      const userAnsRecord = answersMap.get(q.id)
      let userVal = userAnsRecord?.user_answer

      // Parse JSON if stored as string
      if (typeof userVal === 'string') {
        try { userVal = JSON.parse(userVal) } catch {}
      }

      const isCorrect = verifyIeltsAnswer(
        userVal,
        q.correct_answer,
        q.accepted_answers,
        q.question_type,
        q.options
      )

      const earned = isCorrect ? qPoints : 0
      rawScore += earned

      if (userAnsRecord) {
        await query(
          `UPDATE attempt_answers
           SET is_correct = $1, points_earned = $2
           WHERE id = $3`,
          [isCorrect, earned, userAnsRecord.id]
        )
      }
    }

    const estimatedBand = calculateIeltsBand(
      rawScore,
      totalPoints > 0 ? totalPoints : questions.length,
      attempt.skill || 'reading',
      attempt.ielts_type || 'academic'
    )

    // Update attempt record
    const clientTimeUsed = req.body?.time_used_seconds ? Number(req.body.time_used_seconds) : null
    await query(
      `UPDATE test_attempts
       SET status = 'submitted',
           submitted_at = NOW(),
           time_used_seconds = COALESCE($5, GREATEST(10, LEAST(10800, ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(started_at, created_at))))))),
           raw_score = $1,
           total_points = $2,
           estimated_band = $3
       WHERE id = $4`,
      [rawScore, totalPoints, estimatedBand, attemptId, clientTimeUsed]
    )

    // Record progress
    if (attempt.skill) {
      await query(
        `INSERT INTO progress (user_id, skill, score, estimated_band, recorded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, attempt.skill, rawScore, estimatedBand]
      )
    }

    return res.json({
      success: true,
      raw_score: rawScore,
      total_points: totalPoints,
      estimated_band: estimatedBand,
      answered_count: answersRes.rows.length,
      skill: attempt.skill || 'reading',
    })
  } catch (error: any) {
    console.error('Submit test error:', error)
    return res.status(500).json({ error: 'Failed to submit test' })
  }
})

// 7. GET ATTEMPT DETAILS (For review & results)
router.get('/attempt/:attemptId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params
    const userId = req.user!.id

    const attemptRes = await query(
      `SELECT a.*, t.title as test_title, t.skill as test_skill, t.time_limit_minutes
       FROM test_attempts a
       JOIN tests t ON t.id = a.test_id
       WHERE a.id = $1 AND (a.user_id = $2 OR $3 = 'admin')`,
      [attemptId, userId, req.user!.role]
    )

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' })
    }

    const answersRes = await query(
      `SELECT aa.*, q.question_number, q.question_type, q.question_text,
              q.correct_answer, q.explanation
       FROM attempt_answers aa
       JOIN questions q ON q.id = aa.question_id
       WHERE aa.attempt_id = $1
       ORDER BY q.question_number ASC`,
      [attemptId]
    )

    return res.json({
      success: true,
      attempt: attemptRes.rows[0],
      answers: answersRes.rows,
    })
  } catch (error: any) {
    console.error('Get attempt error:', error)
    return res.status(500).json({ error: 'Failed to fetch attempt' })
  }
})

// 8. EVALUATE ESSAY WITH GEMINI AI
router.post('/evaluate-essay', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { content, taskType, taskTitle, promptText } = req.body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Essay content is required' })
    }

    const evaluation = await evaluateEssayWithGemini(
      content,
      taskType || 'task2',
      taskTitle || 'IELTS Writing',
      promptText || ''
    )

    return res.json({
      success: true,
      evaluation,
    })
  } catch (error: any) {
    console.error('Gemini essay evaluation error:', error)
    return res.status(500).json({ error: 'Failed to evaluate essay with AI' })
  }
})

// 9. EVALUATE SPEAKING WITH GEMINI AI
router.post('/evaluate-speaking', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      audioBase64,
      mimeType,
      durationSeconds,
      partNumber,
      promptTitle,
      promptText,
      followUpQuestions,
    } = req.body

    const evaluation = await evaluateSpeakingWithGemini({
      audioBase64,
      mimeType,
      durationSeconds: Number(durationSeconds) || 45,
      partNumber: Number(partNumber) || 1,
      promptTitle: promptTitle || 'IELTS Speaking',
      promptText: promptText || '',
      followUpQuestions: Array.isArray(followUpQuestions) ? followUpQuestions : [],
    })

    return res.json({
      success: true,
      evaluation,
    })
  } catch (error: any) {
    console.error('Gemini speaking evaluation error:', error)
    return res.status(500).json({ error: 'Failed to evaluate speaking response with AI' })
  }
})

export default router
