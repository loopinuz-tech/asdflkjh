import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

import { generateMovieShadowingAi, normalizeDialogueLines } from '../utils/movie-shadowing-ai.js'

const router = Router()

/**
 * Extracts a YouTube Video ID from various link formats
 */
export function extractYoutubeId(urlOrId: string): string {
  if (!urlOrId) return ''
  const trimmed = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  )
  return match ? match[1] : trimmed
}

/**
 * POST /api/shadowing/ai-generate
 * Admin: Automatically analyzes a YouTube movie clip and generates metadata and synchronized dialogue scripts with Uzbek translations
 */
router.post('/ai-generate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user?.role
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { youtube_url, gemini_api_key } = req.body
    if (!youtube_url || !String(youtube_url).trim()) {
      return res.status(400).json({ error: 'YouTube URL or Video ID is required' })
    }

    const aiData = await generateMovieShadowingAi(String(youtube_url).trim(), gemini_api_key)
    return res.json({
      success: true,
      data: aiData,
      message: `AI successfully generated ${aiData.dialogue_lines.length} synchronized dialogue lines with Uzbek translations.`,
    })
  } catch (err: any) {
    console.error('Error generating shadowing AI data:', err)
    return res.status(500).json({ error: err.message || 'Failed to auto-generate movie data' })
  }
})

/**
 * GET /api/shadowing
 * Public / Authenticated: Returns all active movie shadowing clips
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { level, accent, search } = req.query
    let sql = `
      SELECT id, title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines, is_active, created_at
      FROM shadowing_videos
      WHERE is_active = true
    `
    const params: any[] = []

    if (level && level !== 'all') {
      params.push(String(level).toUpperCase())
      sql += ` AND UPPER(cefr_level) = $${params.length}`
    }

    if (accent && accent !== 'all') {
      params.push(String(accent).toLowerCase())
      sql += ` AND LOWER(accent) = $${params.length}`
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim().toLowerCase()}%`)
      sql += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(movie_title) LIKE $${params.length})`
    }

    sql += ' ORDER BY created_at ASC;'

    const result = await query(sql, params)
    return res.json({ videos: result.rows })
  } catch (err: any) {
    console.error('Error fetching shadowing videos:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch shadowing clips' })
  }
})

/**
 * GET /api/shadowing/:id
 * Returns a single movie shadowing clip
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT * FROM shadowing_videos WHERE id = $1 LIMIT 1;`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shadowing video not found' })
    }
    return res.json({ video: result.rows[0] })
  } catch (err: any) {
    console.error('Error fetching shadowing video:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch shadowing clip' })
  }
})

/**
 * POST /api/shadowing
 * Admin only: Create a new YouTube movie clip for shadowing
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user?.role
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const {
      title,
      movie_title,
      youtube_url,
      cefr_level = 'B2',
      accent = 'American',
      duration = '2:00',
      description = '',
      dialogue_lines = [],
    } = req.body

    if (!title || !movie_title || !youtube_url) {
      return res.status(400).json({ error: 'Title, movie title, and YouTube URL are required' })
    }

    const youtube_id = extractYoutubeId(youtube_url)
    if (!youtube_id) {
      return res.status(400).json({ error: 'Invalid YouTube URL provided' })
    }

    const normalizedLines = normalizeDialogueLines(dialogue_lines)

    const result = await query(
      `INSERT INTO shadowing_videos (
        title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`,
      [
        title.trim(),
        movie_title.trim(),
        youtube_url.trim(),
        youtube_id,
        cefr_level,
        accent,
        duration.trim(),
        description.trim(),
        JSON.stringify(normalizedLines),
      ]
    )

    return res.status(201).json({ video: result.rows[0], message: 'Movie shadowing clip created successfully' })
  } catch (err: any) {
    console.error('Error creating shadowing video:', err)
    return res.status(500).json({ error: err.message || 'Failed to create shadowing clip' })
  }
})

/**
 * PUT /api/shadowing/:id
 * Admin only: Update an existing shadowing clip
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user?.role
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.params
    const {
      title,
      movie_title,
      youtube_url,
      cefr_level,
      accent,
      duration,
      description,
      dialogue_lines,
      is_active,
    } = req.body

    const existing = await query('SELECT * FROM shadowing_videos WHERE id = $1;', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Shadowing video not found' })
    }

    const current = existing.rows[0]
    const updatedUrl = youtube_url !== undefined ? youtube_url.trim() : current.youtube_url
    const updatedYoutubeId = extractYoutubeId(updatedUrl)

    const normalizedLines =
      dialogue_lines !== undefined
        ? normalizeDialogueLines(dialogue_lines)
        : Array.isArray(current.dialogue_lines)
        ? normalizeDialogueLines(current.dialogue_lines)
        : current.dialogue_lines

    const result = await query(
      `UPDATE shadowing_videos
       SET title = $1,
           movie_title = $2,
           youtube_url = $3,
           youtube_id = $4,
           cefr_level = $5,
           accent = $6,
           duration = $7,
           description = $8,
           dialogue_lines = $9,
           is_active = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *;`,
      [
        title !== undefined ? title.trim() : current.title,
        movie_title !== undefined ? movie_title.trim() : current.movie_title,
        updatedUrl,
        updatedYoutubeId,
        cefr_level !== undefined ? cefr_level : current.cefr_level,
        accent !== undefined ? accent : current.accent,
        duration !== undefined ? duration.trim() : current.duration,
        description !== undefined ? description.trim() : current.description,
        JSON.stringify(normalizedLines),
        is_active !== undefined ? Boolean(is_active) : current.is_active,
        id,
      ]
    )

    return res.json({ video: result.rows[0], message: 'Clip updated successfully' })
  } catch (err: any) {
    console.error('Error updating shadowing video:', err)
    return res.status(500).json({ error: err.message || 'Failed to update clip' })
  }
})

/**
 * DELETE /api/shadowing/:id
 * Admin only: Delete a shadowing clip
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user?.role
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.params
    const result = await query('DELETE FROM shadowing_videos WHERE id = $1 RETURNING id;', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clip not found' })
    }

    return res.json({ success: true, message: 'Movie shadowing clip deleted' })
  } catch (err: any) {
    console.error('Error deleting shadowing clip:', err)
    return res.status(500).json({ error: err.message || 'Failed to delete clip' })
  }
})

export default router
