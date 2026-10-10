import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/announcement-banner
 * Returns the current announcement banner (public for students & guests)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, is_active, text, badge_text, link_url, link_text, bg_color, icon, is_closable, updated_at
       FROM announcement_banner
       ORDER BY updated_at DESC LIMIT 1;`
    )
    if (result.rows.length === 0) {
      return res.json({ banner: null })
    }
    return res.json({ banner: result.rows[0] })
  } catch (err: any) {
    console.error('Error fetching announcement banner:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

/**
 * POST /api/announcement-banner
 * Updates or creates the announcement banner (admin only)
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user?.role
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const {
      is_active = false,
      text = '',
      badge_text = '',
      link_url = '',
      link_text = '',
      bg_color = 'pink',
      icon = 'sparkles',
      is_closable = true,
    } = req.body

    const existing = await query('SELECT id FROM announcement_banner LIMIT 1;')
    let result
    if (existing.rows.length > 0) {
      result = await query(
        `UPDATE announcement_banner
         SET is_active = $1, text = $2, badge_text = $3, link_url = $4,
             link_text = $5, bg_color = $6, icon = $7, is_closable = $8,
             updated_at = NOW()
         WHERE id = $9
         RETURNING *;`,
        [Boolean(is_active), text, badge_text, link_url, link_text, bg_color, icon, Boolean(is_closable), existing.rows[0].id]
      )
    } else {
      result = await query(
        `INSERT INTO announcement_banner (is_active, text, badge_text, link_url, link_text, bg_color, icon, is_closable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *;`,
        [Boolean(is_active), text, badge_text, link_url, link_text, bg_color, icon, Boolean(is_closable)]
      )
    }

    return res.json({ success: true, banner: result.rows[0] })
  } catch (err: any) {
    console.error('Error saving announcement banner:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

export default router
