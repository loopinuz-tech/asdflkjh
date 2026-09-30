import { createClient } from '@/lib/supabase/client'

export interface UserProgressData {
  userName: string
  vocabCount: number
  targetBand: number
  currentBand: number | null
  testsCompleted: number
  strongestSkill: { skill: string; score: number } | null
  studyHoursTotal: number
  studyHoursThisWeek: number
  skillAverages: {
    reading: number
    listening: number
    writing: number
    speaking: number
  }
  scoreHistory: Array<{
    date: string
    overall: number
    reading?: number
    listening?: number
    writing?: number
    speaking?: number
  }>
  skillBalance: Array<{
    subject: string
    score: number
    fullMark: number
  }>
  activityData: Array<{
    day: string
    hours: number
  }>
}

export async function getUserProgress(): Promise<UserProgressData> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const defaultEmptyState: UserProgressData = {
    userName: 'Student',
    vocabCount: 0,
    targetBand: 7.0,
    currentBand: null,
    testsCompleted: 0,
    strongestSkill: null,
    studyHoursTotal: 0,
    studyHoursThisWeek: 0,
    skillAverages: {
      reading: 0,
      listening: 0,
      writing: 0,
      speaking: 0,
    },
    scoreHistory: [],
    skillBalance: [
      { subject: 'Reading', score: 0, fullMark: 9 },
      { subject: 'Listening', score: 0, fullMark: 9 },
      { subject: 'Writing', score: 0, fullMark: 9 },
      { subject: 'Speaking', score: 0, fullMark: 9 },
      { subject: 'Vocabulary', score: 0, fullMark: 9 },
      { subject: 'Grammar', score: 0, fullMark: 9 },
    ],
    activityData: Array.from({ length: 30 }, (_, i) => ({
      day: `Day ${i + 1}`,
      hours: 0,
    })),
  }

  if (!user) {
    return defaultEmptyState
  }

  // 0. Try direct API endpoint which calculates all 4 skills using high-performance SQL CTE
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
    if (token) {
      const res = await fetch('/api/progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.progress) {
          return json.progress
        }
      }
    }
  } catch (err) {
    console.warn('Direct /api/progress fetch failed, falling back to client query:', err)
  }

  // 1. Fetch user profile, scored attempts (Reading/Listening, Writing, Speaking), and vocabulary in parallel
  const [
    { data: profile },
    { data: testAttempts },
    { data: writingSubs },
    { data: speakingSubs },
    { count: masteredVocabCount }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('target_band, first_name')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('test_attempts')
      .select(`
        id,
        raw_score,
        estimated_band,
        status,
        time_used_seconds,
        started_at,
        submitted_at,
        created_at,
        tests (
          skill,
          title
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['scored', 'submitted'])
      .order('created_at', { ascending: true }),
    supabase
      .from('writing_submissions')
      .select(`
        id,
        word_count,
        status,
        submitted_at,
        created_at,
        prompt:prompt_id (
          title
        ),
        feedback:writing_feedback (
          estimated_band
        )
      `)
      .eq('user_id', user.id),
    supabase
      .from('speaking_submissions')
      .select(`
        id,
        duration_seconds,
        status,
        created_at,
        prompt:prompt_id (
          title
        ),
        feedback:speaking_feedback (
          estimated_band
        )
      `)
      .eq('user_id', user.id),
    supabase
      .from('user_vocabulary')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'mastered')
  ])

  // Normalise all attempts into a single array
  const formattedTestAttempts = (testAttempts || []).map((a: any) => {
    let durationSec = Number(a.time_used_seconds) || 0
    if (!durationSec && a.started_at && a.submitted_at) {
      durationSec = Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000)
    }
    if (!durationSec || durationSec <= 0) durationSec = 1800
    durationSec = Math.max(10, Math.min(10800, durationSec))

    return {
      id: a.id,
      skill: a.tests?.skill?.toLowerCase() || 'reading',
      title: a.tests?.title || 'Practice Test',
      estimated_band: a.estimated_band ? Number(a.estimated_band) : null,
      created_at: a.created_at,
      duration_seconds: durationSec
    }
  })

  const formattedWriting = (writingSubs || [])
    .filter((w: any) => w.feedback?.estimated_band || w.status === 'reviewed' || w.status === 'submitted')
    .map((w: any) => {
      let durationSec = 0
      if (w.submitted_at && w.created_at) {
        durationSec = Math.round((new Date(w.submitted_at).getTime() - new Date(w.created_at).getTime()) / 1000)
      }
      if (!durationSec || durationSec <= 0) {
        durationSec = Math.max(300, Math.min(3600, (Number(w.word_count) || 150) * 5))
      }
      durationSec = Math.max(60, Math.min(7200, durationSec))

      return {
        id: w.id,
        skill: 'writing',
        title: w.prompt?.title || 'Writing Task',
        estimated_band: w.feedback?.estimated_band ? Number(w.feedback.estimated_band) : null,
        created_at: w.created_at,
        duration_seconds: durationSec
      }
    })

  const formattedSpeaking = (speakingSubs || [])
    .filter((s: any) => s.feedback?.estimated_band || s.status === 'reviewed' || s.status === 'submitted')
    .map((s: any) => ({
      id: s.id,
      skill: 'speaking',
      title: s.prompt?.title || 'Speaking Interview',
      estimated_band: s.feedback?.estimated_band ? Number(s.feedback.estimated_band) : null,
      created_at: s.created_at,
      duration_seconds: Math.max(10, Math.min(1800, Number(s.duration_seconds) || 120))
    }))

  const attempts = [...formattedTestAttempts, ...formattedWriting, ...formattedSpeaking].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const targetBand = profile?.target_band ? Number(profile.target_band) : 7.0
  const userName = profile?.first_name || 'Student'

  // If no attempts, return clean empty state with user's target band, actual name and vocab count
  if (!attempts || attempts.length === 0) {
    return {
      ...defaultEmptyState,
      userName,
      vocabCount: masteredVocabCount || 0,
      targetBand,
    }
  }

  const testsCompleted = attempts.length

  // Calculate skill scores
  const skillScores: Record<string, number[]> = {
    reading: [],
    listening: [],
    writing: [],
    speaking: [],
  }

  const validBandScores: number[] = []

  attempts.forEach((a: any) => {
    const band = a.estimated_band ? Number(a.estimated_band) : null

    const skill = (a.skill || a.tests?.skill)?.toLowerCase()
    if (band !== null && !isNaN(band)) {
      validBandScores.push(band)
      if (skill && skillScores[skill]) {
        skillScores[skill].push(band)
      }
    }
  })

  // Current overall band (average of all valid attempts rounded to nearest 0.5)
  const currentBand =
    validBandScores.length > 0
      ? Math.round(
          (validBandScores.reduce((sum, v) => sum + v, 0) /
            validBandScores.length) *
            2
        ) / 2
      : null

  // Strongest skill calculation
  let strongestSkill: { skill: string; score: number } | null = null
  let maxScore = -1

  for (const [skill, scores] of Object.entries(skillScores)) {
    if (scores.length > 0) {
      const avg =
        Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      if (avg > maxScore) {
        maxScore = avg
        strongestSkill = {
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          score: avg,
        }
      }
    }
  }

  // Calculate actual study hours based on actual time spent in each test/submission
  const totalSeconds = attempts.reduce((acc, a) => acc + (Number(a.duration_seconds) || 0), 0)
  const studyHoursTotal = Math.round((totalSeconds / 3600) * 10) / 10

  // Filter attempts in the last 7 days for weekly hours
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const attemptsThisWeek = attempts.filter(
    (a) => new Date(a.created_at) >= sevenDaysAgo
  )
  const weekSeconds = attemptsThisWeek.reduce((acc, a) => acc + (Number(a.duration_seconds) || 0), 0)
  const studyHoursThisWeek = Math.round((weekSeconds / 3600) * 10) / 10

  // Build score history timeline
  const scoreHistory = attempts.map((a: any) => {
    const dateStr = new Date(a.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const skill = (a.skill || a.tests?.skill)?.toLowerCase()
    const band = a.estimated_band ? Number(a.estimated_band) : (a.band_score ? Number(a.band_score) : currentBand || targetBand)

    const entry: any = {
      date: dateStr,
      overall: band,
    }

    if (skill) {
      entry[skill] = band
    }

    return entry
  })

  // Skill balance radar
  const getSkillAvg = (key: string) => {
    const arr = skillScores[key]
    if (!arr || arr.length === 0) return 0
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
  }

  const skillBalance = [
    { subject: 'Reading', score: getSkillAvg('reading'), fullMark: 9 },
    { subject: 'Listening', score: getSkillAvg('listening'), fullMark: 9 },
    { subject: 'Writing', score: getSkillAvg('writing'), fullMark: 9 },
    { subject: 'Speaking', score: getSkillAvg('speaking'), fullMark: 9 },
    {
      subject: 'Vocabulary',
      score: Math.min(9, Math.round(((masteredVocabCount || 0) / 20) * 10) / 10),
      fullMark: 9,
    },
    { subject: 'Grammar', score: getSkillAvg('writing') || 0, fullMark: 9 },
  ]

  // Real 30-day activity map
  const now = new Date()
  const activityMap: Record<string, number> = {}

  attempts.forEach((a) => {
    const d = new Date(a.created_at)
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)
    )
    if (diffDays >= 0 && diffDays < 30) {
      const dayKey = `Day ${30 - diffDays}`
      const hours = (Number(a.duration_seconds) || 0) / 3600
      activityMap[dayKey] = Math.round(((activityMap[dayKey] || 0) + hours) * 100) / 100
    }
  })

  const activityData = Array.from({ length: 30 }, (_, i) => {
    const dayKey = `Day ${i + 1}`
    return {
      day: dayKey,
      hours: activityMap[dayKey] || 0,
    }
  })

  return {
    userName,
    vocabCount: masteredVocabCount || 0,
    targetBand,
    currentBand,
    testsCompleted,
    strongestSkill,
    studyHoursTotal,
    studyHoursThisWeek,
    skillAverages: {
      reading: getSkillAvg('reading'),
      listening: getSkillAvg('listening'),
      writing: getSkillAvg('writing'),
      speaking: getSkillAvg('speaking'),
    },
    scoreHistory,
    skillBalance,
    activityData,
  }
}
