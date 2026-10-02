import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// 1. GET SETTINGS
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    const userRes = await query(
      `SELECT u.email, p.first_name, p.last_name, p.avatar_url, p.target_band,
              p.telegram_id, p.telegram_username, p.onboarding_completed,
              s.status as plan_status, pl.name as plan_name
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       LEFT JOIN plans pl ON pl.id = s.plan_id
       WHERE u.id = $1`,
      [userId]
    )

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const row = userRes.rows[0]

    return res.json({
      success: true,
      settings: {
        email: row.email,
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        avatarUrl: row.avatar_url || '',
        targetBand: row.target_band ? Number(row.target_band) : 7.0,
        telegramId: row.telegram_id || null,
        telegramUsername: row.telegram_username || null,
        planName: row.plan_name || 'Free Trial',
        planStatus: row.plan_status || 'active',
        onboardingCompleted: !!row.onboarding_completed,
      },
    })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// 2. UPDATE PROFILE SETTINGS
router.put('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { firstName, lastName, targetBand, avatarUrl, telegramUsername } = req.body

    const updates: string[] = ['updated_at = NOW()']
    const params: any[] = []

    if (firstName !== undefined) {
      params.push(firstName)
      updates.push(`first_name = $${params.length}`)
    }

    if (lastName !== undefined) {
      params.push(lastName)
      updates.push(`last_name = $${params.length}`)
    }

    if (targetBand !== undefined) {
      params.push(targetBand ? parseFloat(targetBand) : null)
      updates.push(`target_band = $${params.length}`)
    }

    if (avatarUrl !== undefined) {
      params.push(avatarUrl)
      updates.push(`avatar_url = $${params.length}`)
    }

    if (telegramUsername !== undefined) {
      const cleanUsername = telegramUsername ? String(telegramUsername).replace(/^@/, '').trim() : null
      params.push(cleanUsername)
      updates.push(`telegram_username = $${params.length}`)
    }

    params.push(userId)
    const sql = `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${params.length}`

    await query(sql, params)
    return res.json({ success: true, message: 'Settings updated successfully' })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return res.status(500).json({ error: 'Failed to update settings' })
  }
})

// 3. ONBOARDING SUBMIT
router.post('/onboarding', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { targetBand, challenges, planTimeline, hasTakenIelts, previousScore, estimatedLevel } = req.body

    await query(
      `UPDATE profiles
       SET target_band = $1,
           challenges = $2,
           plan_timeline = $3,
           has_taken_ielts = $4,
           previous_score = $5,
           estimated_level = $6,
           onboarding_completed = true,
           updated_at = NOW()
       WHERE user_id = $7`,
      [
        targetBand !== 'Not sure' && targetBand ? parseFloat(targetBand) : null,
        challenges || [],
        planTimeline || null,
        !!hasTakenIelts,
        previousScore ? parseFloat(previousScore) : null,
        estimatedLevel || null,
        userId,
      ]
    )

    return res.json({ success: true, message: 'Onboarding completed successfully' })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return res.status(500).json({ error: 'Failed to save onboarding data' })
  }
})

export default router
