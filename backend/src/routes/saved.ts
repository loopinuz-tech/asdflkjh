import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/saved
 * Returns all saved items for the authenticated user with joined entity details
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    const savedRes = await query(
      'SELECT id, item_type, item_id, created_at FROM saved_items WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    const rawItems = savedRes.rows
    if (rawItems.length === 0) {
      return res.json({
        success: true,
        items: [],
        counts: { all: 0, test: 0, question: 0, vocabulary: 0, writing: 0, speaking: 0 },
      })
    }

    // Group IDs by item_type for efficient batch queries
    const testIds: string[] = []
    const questionIds: string[] = []
    const vocabIds: string[] = []
    const writingIds: string[] = []
    const speakingIds: string[] = []

    for (const item of rawItems) {
      if (item.item_type === 'test') testIds.push(item.item_id)
      else if (item.item_type === 'question') questionIds.push(item.item_id)
      else if (item.item_type === 'vocabulary') vocabIds.push(item.item_id)
      else if (item.item_type === 'writing') writingIds.push(item.item_id)
      else if (item.item_type === 'speaking') speakingIds.push(item.item_id)
    }

    // Fetch entity details in parallel
    const [testsRes, questionsRes, vocabRes, writingRes, speakingRes] = await Promise.all([
      testIds.length > 0
        ? query(
            'SELECT id, title, slug, skill, difficulty, time_limit_minutes, is_premium, access_type, description FROM tests WHERE id = ANY($1)',
            [testIds]
          )
        : Promise.resolve({ rows: [] }),
      questionIds.length > 0
        ? query(
            `SELECT q.id, q.question_number, q.question_type, q.instruction, q.question_text, q.explanation, q.test_id,
                    t.title as test_title, t.skill as test_skill, t.slug as test_slug
             FROM questions q
             LEFT JOIN tests t ON t.id = q.test_id
             WHERE q.id = ANY($1)`,
            [questionIds]
          )
        : Promise.resolve({ rows: [] }),
      vocabIds.length > 0
        ? query(
            'SELECT id, word, definition, example_sentence, pronunciation, part_of_speech, topic, difficulty FROM vocabulary_words WHERE id = ANY($1)',
            [vocabIds]
          )
        : Promise.resolve({ rows: [] }),
      writingIds.length > 0
        ? query(
            'SELECT id, task_type, title, prompt_text, image_url, difficulty FROM writing_prompts WHERE id = ANY($1)',
            [writingIds]
          )
        : Promise.resolve({ rows: [] }),
      speakingIds.length > 0
        ? query(
            'SELECT id, part_number, title, prompt_text, follow_up_questions, difficulty FROM speaking_prompts WHERE id = ANY($1)',
            [speakingIds]
          )
        : Promise.resolve({ rows: [] }),
    ])

    const testMap = new Map(testsRes.rows.map((r: any) => [r.id, r]))
    const questionMap = new Map(questionsRes.rows.map((r: any) => [r.id, r]))
    const vocabMap = new Map(vocabRes.rows.map((r: any) => [r.id, r]))
    const writingMap = new Map(writingRes.rows.map((r: any) => [r.id, r]))
    const speakingMap = new Map(speakingRes.rows.map((r: any) => [r.id, r]))

    const items: any[] = []
    const counts = { all: 0, test: 0, question: 0, vocabulary: 0, writing: 0, speaking: 0 }

    for (const item of rawItems) {
      let details: any = null

      if (item.item_type === 'test') {
        details = testMap.get(item.item_id)
      } else if (item.item_type === 'question') {
        details = questionMap.get(item.item_id)
      } else if (item.item_type === 'vocabulary') {
        details = vocabMap.get(item.item_id)
      } else if (item.item_type === 'writing') {
        details = writingMap.get(item.item_id)
      } else if (item.item_type === 'speaking') {
        details = speakingMap.get(item.item_id)
      }

      // If the target entity was permanently deleted from DB, skip it
      if (details) {
        items.push({
          id: item.id,
          item_type: item.item_type,
          item_id: item.item_id,
          created_at: item.created_at,
          details,
        })
        counts.all++
        if (item.item_type in counts) {
          counts[item.item_type as keyof typeof counts]++
        }
      }
    }

    return res.json({
      success: true,
      items,
      counts,
    })
  } catch (error: any) {
    console.error('Fetch saved items error:', error)
    return res.status(500).json({ error: 'Failed to fetch saved items' })
  }
})

/**
 * GET /api/saved/ids
 * Returns a map of saved item IDs for quick client-side bookmark state lookup
 */
router.get('/ids', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const result = await query(
      'SELECT item_type, item_id FROM saved_items WHERE user_id = $1',
      [userId]
    )

    const idsMap: Record<string, boolean> = {}
    for (const row of result.rows) {
      idsMap[`${row.item_type}:${row.item_id}`] = true
      idsMap[row.item_id] = true
    }

    return res.json({ success: true, ids: idsMap })
  } catch (error: any) {
    console.error('Fetch saved ids error:', error)
    return res.status(500).json({ error: 'Failed to fetch saved IDs' })
  }
})

/**
 * POST /api/saved/toggle
 * Toggles a bookmark for a specific item_type and item_id
 */
router.post('/toggle', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { item_type, item_id } = req.body

    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'item_type and item_id are required' })
    }

    const validTypes = ['question', 'vocabulary', 'writing', 'speaking', 'test']
    if (!validTypes.includes(item_type)) {
      return res.status(400).json({ error: `Invalid item_type. Allowed: ${validTypes.join(', ')}` })
    }

    // Check if item is already bookmarked
    const existing = await query(
      'SELECT id FROM saved_items WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [userId, item_type, item_id]
    )

    if (existing.rows.length > 0) {
      await query('DELETE FROM saved_items WHERE id = $1', [existing.rows[0].id])
      return res.json({
        success: true,
        saved: false,
        message: 'Item removed from bookmarks',
      })
    } else {
      const inserted = await query(
        'INSERT INTO saved_items (user_id, item_type, item_id) VALUES ($1, $2, $3) RETURNING id, item_type, item_id, created_at',
        [userId, item_type, item_id]
      )
      return res.json({
        success: true,
        saved: true,
        message: 'Item saved successfully',
        item: inserted.rows[0],
      })
    }
  } catch (error: any) {
    console.error('Toggle saved item error:', error)
    return res.status(500).json({ error: 'Failed to toggle saved item' })
  }
})

/**
 * DELETE /api/saved/:id
 * Removes a bookmark by bookmark ID or entity ID
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const result = await query(
      'DELETE FROM saved_items WHERE (id = $1 OR item_id = $1) AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved item not found' })
    }

    return res.json({ success: true, message: 'Item removed from bookmarks' })
  } catch (error: any) {
    console.error('Delete saved item error:', error)
    return res.status(500).json({ error: 'Failed to delete saved item' })
  }
})

export default router
