import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * Helper to create a notification for a user from any backend event (test completion, etc.)
 */
export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: string = 'info',
  link: string | null = null
) {
  try {
    const result = await query(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
      RETURNING *;
    `, [userId, title, message, type, link])
    return result.rows[0]
  } catch (err: any) {
    console.error('Failed to create notification for user:', err.message)
    return null
  }
}

/**
 * GET /api/notifications
 * Returns list of notifications for the current user and unread count
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const unreadOnly = req.query.unread_only === 'true'

    let sql = `
      SELECT id, user_id, title, message, type, link, is_read, created_at
      FROM notifications
      WHERE user_id = $1
    `
    const params: any[] = [userId]

    if (unreadOnly) {
      sql += ` AND is_read = false`
    }

    sql += ` ORDER BY created_at DESC LIMIT $2`
    params.push(limit)

    const result = await query(sql, params)

    const unreadRes = await query(
      `SELECT count(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    )
    const unreadCount = unreadRes.rows[0]?.count || 0

    res.json({
      notifications: result.rows,
      unread_count: unreadCount,
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * GET /api/notifications/unread-count
 * Quick count endpoint for polling / badge
 */
router.get('/unread-count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const unreadRes = await query(
      `SELECT count(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    )
    res.json({ unread_count: unreadRes.rows[0]?.count || 0 })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    const result = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id, is_read`,
      [id, userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true, notification: result.rows[0] })
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
router.post('/mark-all-read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const result = await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    )
    res.json({ success: true, updated_count: result.rowCount })
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for current user
 */
router.delete('/clear-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const result = await query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [userId]
    )
    res.json({ success: true, deleted_count: result.rowCount })
  } catch (error: any) {
    console.error('Error clearing all notifications:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    const result = await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true, id })
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * POST /api/notifications
 * Create a new notification (supports single user or admin broadcast)
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id
    const currentUserRole = req.user!.role
    const { title, message, type = 'info', link = null, user_id, broadcast = false } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' })
    }

    // Admin broadcast to all users
    if (broadcast && currentUserRole === 'admin') {
      await query(`
        INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
        SELECT id, $1, $2, $3, $4, false, NOW() FROM users;
      `, [title, message, type, link])

      return res.json({ success: true, broadcast: true })
    }

    // Single notification
    const targetUserId = user_id || currentUserId
    const result = await query(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
      RETURNING *;
    `, [targetUserId, title, message, type, link])

    res.status(201).json({ success: true, notification: result.rows[0] })
  } catch (error: any) {
    console.error('Error creating notification:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
