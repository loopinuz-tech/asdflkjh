import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    // Default empty state
    const defaultData = {
      userName: 'Student',
      vocabCount: 0,
      targetBand: 7.0,
      currentBand: null as number | null,
      testsCompleted: 0,
      strongestSkill: null as { skill: string; score: number } | null,
      studyHoursTotal: 0,
      studyHoursThisWeek: 0,
      skillAverages: { reading: 0, listening: 0, writing: 0, speaking: 0 },
      scoreHistory: [] as any[],
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

    // Parallel fetch: profile, attempts, mastered vocab
    const [profileRes, attemptsRes, vocabRes] = await Promise.all([
      query('SELECT first_name, target_band FROM profiles WHERE user_id = $1', [userId]),
      query(
        `WITH user_attempts AS (
           -- 1. Reading & Listening
           SELECT 
             a.id, 
             a.raw_score, 
             a.estimated_band, 
             a.status::text as status, 
             a.created_at, 
             t.skill::text as skill, 
             t.title,
             COALESCE(
               NULLIF(a.time_used_seconds, 0),
               CASE 
                 WHEN a.submitted_at IS NOT NULL AND a.started_at IS NOT NULL 
                   THEN GREATEST(10, LEAST(10800, ROUND(EXTRACT(EPOCH FROM (a.submitted_at - a.started_at)))))::integer
                 ELSE 1800
               END
             ) as duration_seconds
           FROM test_attempts a
           JOIN tests t ON t.id = a.test_id
           WHERE a.user_id = $1 AND a.status IN ('scored', 'submitted')

           UNION ALL

           -- 2. Writing
           SELECT 
             ws.id, 
             ws.word_count as raw_score, 
             wf.estimated_band, 
             ws.status::text as status, 
             ws.created_at, 
             'writing' as skill, 
             wp.title,
             COALESCE(
               CASE 
                 WHEN ws.submitted_at IS NOT NULL AND ws.created_at IS NOT NULL 
                   THEN GREATEST(60, LEAST(7200, ROUND(EXTRACT(EPOCH FROM (ws.submitted_at - ws.created_at)))))::integer
                 ELSE NULL 
               END,
               GREATEST(300, LEAST(3600, COALESCE(ws.word_count, 150) * 5))
             ) as duration_seconds
           FROM writing_submissions ws
           JOIN writing_prompts wp ON wp.id = ws.prompt_id
           LEFT JOIN writing_feedback wf ON wf.submission_id = ws.id
           WHERE ws.user_id = $1 AND (ws.status IN ('submitted', 'reviewed') OR wf.estimated_band IS NOT NULL)

           UNION ALL

           -- 3. Speaking
           SELECT 
             ss.id, 
             ss.duration_seconds as raw_score, 
             sf.estimated_band, 
             ss.status::text as status, 
             ss.created_at, 
             'speaking' as skill, 
             sp.title,
             GREATEST(10, LEAST(1800, COALESCE(ss.duration_seconds, 120))) as duration_seconds
           FROM speaking_submissions ss
           JOIN speaking_prompts sp ON sp.id = ss.prompt_id
           LEFT JOIN speaking_feedback sf ON sf.submission_id = ss.id
           WHERE ss.user_id = $1 AND (ss.status IN ('submitted', 'reviewed') OR sf.estimated_band IS NOT NULL)
         )
         SELECT * FROM user_attempts
         ORDER BY created_at ASC`,
        [userId]
      ),
      query(
        "SELECT count(*) FROM user_vocabulary WHERE user_id = $1 AND status = 'mastered'",
        [userId]
      ),
    ])

    const profile = profileRes.rows[0]
    const attempts = attemptsRes.rows
    const masteredVocabCount = parseInt(vocabRes.rows[0]?.count || '0', 10)

    const targetBand = profile?.target_band ? Number(profile.target_band) : 7.0
    const userName = profile?.first_name || 'Student'

    if (attempts.length === 0) {
      return res.json({
        success: true,
        progress: {
          ...defaultData,
          userName,
          vocabCount: masteredVocabCount,
          targetBand,
        },
      })
    }

    const testsCompleted = attempts.length
    const skillScores: Record<string, number[]> = {
      reading: [],
      listening: [],
      writing: [],
      speaking: [],
    }
    const validBandScores: number[] = []

    attempts.forEach((a: any) => {
      const band = a.estimated_band ? Number(a.estimated_band) : null
      const skill = a.skill?.toLowerCase()
      if (band !== null && !isNaN(band)) {
        validBandScores.push(band)
        if (skill && skillScores[skill]) {
          skillScores[skill].push(band)
        }
      }
    })

    const currentBand =
      validBandScores.length > 0
        ? Math.round((validBandScores.reduce((s, v) => s + v, 0) / validBandScores.length) * 2) / 2
        : null

    let strongestSkill: { skill: string; score: number } | null = null
    let maxScore = -1

    for (const [skill, scores] of Object.entries(skillScores)) {
      if (scores.length > 0) {
        const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
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
    const totalSeconds = attempts.reduce((acc: number, a: any) => acc + (Number(a.duration_seconds) || 0), 0)
    const studyHoursTotal = Math.round((totalSeconds / 3600) * 10) / 10

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const attemptsThisWeek = attempts.filter((a: any) => new Date(a.created_at) >= sevenDaysAgo)
    const weekSeconds = attemptsThisWeek.reduce((acc: number, a: any) => acc + (Number(a.duration_seconds) || 0), 0)
    const studyHoursThisWeek = Math.round((weekSeconds / 3600) * 10) / 10

    const scoreHistory = attempts.map((a: any) => {
      const dateStr = new Date(a.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      const skill = a.skill?.toLowerCase()
      const band = a.estimated_band ? Number(a.estimated_band) : currentBand || targetBand

      const entry: any = { date: dateStr, overall: band }
      if (skill) entry[skill] = band
      return entry
    })

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

    const now = new Date()
    const activityMap: Record<string, number> = {}

    attempts.forEach((a: any) => {
      const d = new Date(a.created_at)
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
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

    return res.json({
      success: true,
      progress: {
        userName,
        vocabCount: masteredVocabCount,
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
      },
    })
  } catch (error: any) {
    console.error('Progress API error:', error)
    return res.status(500).json({ error: 'Failed to calculate user progress' })
  }
})

export default router
