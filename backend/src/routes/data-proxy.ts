import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { optionalAuth } from '../middleware/auth.js'
import { getFullTestById } from './tests.js'

const router = Router()

// Whitelist of allowed public/authenticated tables to query
const ALLOWED_TABLES = new Set([
  'tests',
  'test_sections',
  'reading_passages',
  'listening_audio',
  'question_groups',
  'question_types',
  'questions',
  'question_options',
  'writing_prompts',
  'writing_submissions',
  'writing_feedback',
  'speaking_prompts',
  'speaking_submissions',
  'speaking_feedback',
  'test_attempts',
  'attempt_answers',
  'section_scores',
  'progress',
  'vocabulary_words',
  'user_vocabulary',
  'saved_items',
  'plans',
  'subscriptions',
  'payments',
  'profiles',
  'tags',
  'media_assets',
  'imports',
  'import_errors',
  'activity_logs',
  'admin_activity_logs',
  'notifications',
])

// Whitelist of known database columns per table to prevent SQL column errors
const TABLE_COLUMNS: Record<string, Set<string>> = {
  tests: new Set([
    'id', 'title', 'description', 'skill', 'difficulty', 'is_premium', 'access_type',
    'status', 'time_limit_minutes', 'total_questions', 'slug', 'ielts_type', 'cover_image',
    'tags', 'is_archived', 'created_by', 'created_at', 'updated_at'
  ]),
  test_sections: new Set([
    'id', 'test_id', 'title', 'order_number', 'instructions', 'description',
    'time_limit_minutes', 'passage_id', 'audio_id', 'image_url', 'created_at', 'updated_at'
  ]),
  reading_passages: new Set([
    'id', 'title', 'content', 'source', 'word_count', 'difficulty', 'status', 'created_at', 'updated_at'
  ]),
  listening_audio: new Set([
    'id', 'title', 'file_path', 'duration_seconds', 'transcript', 'is_premium', 'status', 'created_at', 'updated_at'
  ]),
  question_groups: new Set([
    'id', 'section_id', 'title', 'instruction', 'passage_id', 'media_id', 'order_number'
  ]),
  question_types: new Set([
    'id', 'name', 'slug', 'skill', 'description', 'schema_config', 'created_at', 'updated_at'
  ]),
  questions: new Set([
    'id', 'test_id', 'section_id', 'group_id', 'question_type_id', 'question_type',
    'question_number', 'instruction', 'question_text', 'question_html', 'correct_answer',
    'accepted_answers', 'passage_reference', 'image_url', 'audio_url', 'tags', 'points',
    'difficulty', 'metadata', 'explanation', 'status', 'created_at', 'updated_at'
  ]),
  question_options: new Set([
    'id', 'question_id', 'option_text', 'option_key', 'is_correct', 'order_number'
  ]),
  writing_prompts: new Set([
    'id', 'task_type', 'title', 'prompt_text', 'image_url', 'difficulty', 'is_premium', 'status', 'created_at', 'updated_at'
  ]),
  writing_submissions: new Set([
    'id', 'user_id', 'prompt_id', 'content', 'word_count', 'status', 'submitted_at', 'created_at', 'updated_at'
  ]),
  writing_feedback: new Set([
    'id', 'submission_id', 'task_achievement', 'coherence_cohesion', 'lexical_resource', 'grammatical_range',
    'estimated_band', 'feedback_text', 'is_ai_generated', 'created_at'
  ]),
  speaking_prompts: new Set([
    'id', 'part_number', 'title', 'prompt_text', 'follow_up_questions', 'difficulty', 'is_premium', 'status', 'created_at', 'updated_at'
  ]),
  speaking_submissions: new Set([
    'id', 'user_id', 'prompt_id', 'audio_path', 'duration_seconds', 'transcript', 'status', 'created_at', 'updated_at'
  ]),
  speaking_feedback: new Set([
    'id', 'submission_id', 'fluency_coherence', 'lexical_resource', 'grammatical_range', 'pronunciation',
    'estimated_band', 'feedback_text', 'is_ai_generated', 'created_at'
  ]),
  test_attempts: new Set([
    'id', 'user_id', 'test_id', 'status', 'started_at', 'submitted_at', 'time_used_seconds',
    'raw_score', 'total_points', 'estimated_band', 'created_at', 'updated_at'
  ]),
  attempt_answers: new Set([
    'id', 'attempt_id', 'question_id', 'user_answer', 'is_correct', 'points_earned', 'answered_at', 'marked_for_review'
  ]),
  section_scores: new Set([
    'id', 'attempt_id', 'section_id', 'raw_score', 'total_points', 'estimated_band'
  ]),
  progress: new Set([
    'id', 'user_id', 'skill', 'score', 'estimated_band', 'recorded_at', 'created_at'
  ]),
  vocabulary_words: new Set([
    'id', 'word', 'translation', 'definition', 'context_sentence', 'example_sentence', 'pronunciation', 'audio_url',
    'part_of_speech', 'cefr_level', 'topic', 'collocations', 'synonyms', 'difficulty', 'status', 'created_at'
  ]),
  user_vocabulary: new Set([
    'id', 'user_id', 'word_id', 'status', 'mastery_level', 'next_review_at', 'review_count',
    'created_at', 'updated_at'
  ]),
  saved_items: new Set([
    'id', 'user_id', 'item_type', 'item_id', 'title', 'metadata', 'created_at'
  ]),
  plans: new Set([
    'id', 'name', 'slug', 'price', 'currency', 'interval', 'features', 'is_active', 'sort_order', 'created_at', 'updated_at'
  ]),
  subscriptions: new Set([
    'id', 'user_id', 'plan_id', 'status', 'provider', 'provider_subscription_id', 'started_at', 'expires_at', 'created_at', 'updated_at'
  ]),
  payments: new Set([
    'id', 'user_id', 'subscription_id', 'amount', 'currency', 'status', 'provider', 'provider_payment_id', 'metadata', 'created_at', 'updated_at'
  ]),
  profiles: new Set([
    'id', 'user_id', 'first_name', 'last_name', 'avatar_url', 'telegram_id', 'telegram_username',
    'target_band', 'challenges', 'plan_timeline', 'has_taken_ielts', 'previous_score', 'estimated_level',
    'onboarding_completed', 'role', 'status', 'created_at', 'updated_at'
  ]),
  admin_activity_logs: new Set([
    'id', 'admin_id', 'action', 'target_type', 'target_id', 'details', 'created_at'
  ]),
  activity_logs: new Set([
    'id', 'user_id', 'action', 'details', 'created_at'
  ]),
  tags: new Set([
    'id', 'name', 'slug', 'color', 'created_at'
  ]),
  notifications: new Set([
    'id', 'user_id', 'title', 'message', 'type', 'link', 'is_read', 'created_at'
  ])
}

const JSONB_COLUMNS = new Set([
  'accepted_answers',
  'metadata',
  'schema_config',
  'options',
  'user_answer',
  'raw_json',
  'parsed_json',
  'warnings',
  'details'
])

function serializeIfJsonb(key: string, val: any): any {
  if (val === undefined || val === null) return val
  if (JSONB_COLUMNS.has(key)) {
    if (typeof val === 'object') return JSON.stringify(val)
    if (typeof val === 'string') {
      try {
        JSON.parse(val)
        return val
      } catch {
        return JSON.stringify(val)
      }
    }
    return JSON.stringify(val)
  }
  return val
}

// 1. QUERY TABLE (GET)
router.get('/:table', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { table } = req.params

    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: `Table '${table}' not accessible` })
    }

    const { select = '*', limit = 500, order, count, ...filters } = req.query
    const selectStr = String(select)

    // A. Special Handler: Nested Test loading for useTestLoader (supports id or slug)
    const testFilter = filters.id || filters['id'] || filters.slug || filters['slug']
    if (table === 'tests' && testFilter && (selectStr.includes('sections') || selectStr.includes('questions'))) {
      const rawIdOrSlug = String(testFilter).replace(/^eq\./, '')
      if (rawIdOrSlug) {
        const test = await getFullTestById(rawIdOrSlug)
        return res.json({
          success: true,
          data: test ? [test] : [],
          count: test ? 1 : 0
        })
      }
    }

    // Filter select columns against known database columns
    const validColumns = TABLE_COLUMNS[table]
    let cleanSelect = '*'
    if (select && select !== '*') {
      // Split by commas, skip anything with relation syntax like questions(...) or prompt:...
      const cols = selectStr
        .split(',')
        .map((c) => c.trim())
        .filter((c) => !c.includes(':') && !c.includes('(') && !c.includes(')'))
        .filter((c) => /^[a-zA-Z0-9_.*]+$/.test(c))
        .filter((c) => !validColumns || c === '*' || validColumns.has(c))

      cleanSelect = cols.length > 0 ? cols.join(', ') : '*'
    }

    let sql = ''
    let hasAlias = false
    const isTestAttempts = table === 'test_attempts'
    const isSpeakingSubmissions = table === 'speaking_submissions'
    const isWritingSubmissions = table === 'writing_submissions'
    const isTestSections = table === 'test_sections'

    if (isTestAttempts && (selectStr.includes('tests') || selectStr.includes('test'))) {
      hasAlias = true
      sql = `
        SELECT ta.*, t.title as test_title, t.skill as test_skill
        FROM test_attempts ta
        LEFT JOIN tests t ON t.id = ta.test_id
      `
    } else if (isSpeakingSubmissions && (selectStr.includes('prompt') || selectStr.includes('feedback'))) {
      hasAlias = true
      sql = `
        SELECT ss.*,
               sp.title as prompt_title, sp.part_number as prompt_part_number,
               sf.estimated_band as feedback_overall_band
        FROM speaking_submissions ss
        LEFT JOIN speaking_prompts sp ON sp.id = ss.prompt_id
        LEFT JOIN speaking_feedback sf ON sf.submission_id = ss.id
      `
    } else if (isWritingSubmissions && (selectStr.includes('prompt') || selectStr.includes('feedback'))) {
      hasAlias = true
      sql = `
        SELECT ws.*,
               wp.title as prompt_title, wp.task_type as prompt_task_type,
               wf.estimated_band as feedback_overall_band
        FROM writing_submissions ws
        LEFT JOIN writing_prompts wp ON wp.id = ws.prompt_id
        LEFT JOIN writing_feedback wf ON wf.submission_id = ws.id
      `
    } else if (isTestSections && (selectStr.includes('passage') || selectStr.includes('audio'))) {
      hasAlias = true
      sql = `
        SELECT ts.*,
               p.title as passage_title, p.content as passage_content,
               a.title as audio_title, a.file_path as audio_file_path
        FROM test_sections ts
        LEFT JOIN reading_passages p ON p.id = ts.passage_id
        LEFT JOIN listening_audio a ON a.id = ts.audio_id
      `
    } else if (table === 'questions' && (selectStr.includes('tests') || selectStr.includes('test'))) {
      hasAlias = true
      sql = `
        SELECT q.*, t.title as test_title, t.skill as test_skill
        FROM questions q
        LEFT JOIN tests t ON t.id = q.test_id
      `
    } else if (table === 'user_vocabulary' && selectStr.includes('vocabulary_words')) {
      hasAlias = true
      sql = `
        SELECT uv.*,
               vw.word as vw_word, vw.part_of_speech as vw_part_of_speech,
               vw.definition as vw_definition, vw.example_sentence as vw_example_sentence,
               vw.pronunciation as vw_pronunciation
        FROM user_vocabulary uv
        LEFT JOIN vocabulary_words vw ON vw.id = uv.word_id
      `
    } else {
      sql = `SELECT ${cleanSelect} FROM ${table}`
    }

    const params: any[] = []
    const conditions: string[] = []

    // Security: user privacy enforcement
    const currentUserId = req.user?.id
    const isAdmin = req.user?.role === 'admin'

    if (['user_vocabulary', 'saved_items', 'activity_logs'].includes(table) && !isAdmin) {
      if (!currentUserId) {
        return res.json({ success: true, data: [], count: 0 })
      }
      params.push(currentUserId)
      conditions.push(`${hasAlias && table === 'test_attempts' ? 'ta.' : ''}user_id = $${params.length}`)
    }

    // Handle 'or' filter e.g. expires_at.is.null,expires_at.gt.2026-09-23... or first_name.ilike.%Ali%,last_name.ilike.%Ali%
    const orQuery = req.query.or || filters.or
    if (orQuery && typeof orQuery === 'string') {
      const orParts = orQuery.split(',').map(s => s.trim()).filter(Boolean)
      const orConditions: string[] = []
      for (const part of orParts) {
        const firstDot = part.indexOf('.')
        if (firstDot === -1) continue
        const col = part.slice(0, firstDot).replace(/[^a-zA-Z0-9_]/g, '')
        if (validColumns && !validColumns.has(col)) continue
        const rest = part.slice(firstDot + 1)
        const colPrefix = hasAlias
          ? (isTestAttempts ? 'ta.' : (isSpeakingSubmissions ? 'ss.' : (isWritingSubmissions ? 'ws.' : (isTestSections ? 'ts.' : (table === 'questions' ? 'q.' : (table === 'user_vocabulary' ? 'uv.' : ''))))))
          : ''
        const fullCol = `${colPrefix}${col}`

        if (rest.startsWith('is.')) {
          const isVal = rest.slice(3).toLowerCase()
          if (isVal === 'null') orConditions.push(`${fullCol} IS NULL`)
          else if (isVal === 'not.null' || isVal === 'not null') orConditions.push(`${fullCol} IS NOT NULL`)
          else if (isVal === 'true') orConditions.push(`${fullCol} IS TRUE`)
          else if (isVal === 'false') orConditions.push(`${fullCol} IS FALSE`)
        } else if (rest.startsWith('gt.')) {
          params.push(rest.slice(3))
          orConditions.push(`${fullCol} > $${params.length}`)
        } else if (rest.startsWith('gte.')) {
          params.push(rest.slice(4))
          orConditions.push(`${fullCol} >= $${params.length}`)
        } else if (rest.startsWith('lt.')) {
          params.push(rest.slice(3))
          orConditions.push(`${fullCol} < $${params.length}`)
        } else if (rest.startsWith('lte.')) {
          params.push(rest.slice(4))
          orConditions.push(`${fullCol} <= $${params.length}`)
        } else if (rest.startsWith('eq.')) {
          params.push(rest.slice(3))
          orConditions.push(`${fullCol} = $${params.length}`)
        } else if (rest.startsWith('neq.')) {
          params.push(rest.slice(4))
          orConditions.push(`${fullCol} != $${params.length}`)
        } else if (rest.startsWith('ilike.')) {
          params.push(rest.slice(6))
          orConditions.push(`${fullCol} ILIKE $${params.length}`)
        } else if (rest.startsWith('like.')) {
          params.push(rest.slice(5))
          orConditions.push(`${fullCol} LIKE $${params.length}`)
        }
      }
      if (orConditions.length > 0) {
        conditions.push(`(${orConditions.join(' OR ')})`)
      }
    }

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'offset', 'head', 'or'].includes(key)) continue
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '')
      if (!cleanKey) continue
      if (validColumns && !validColumns.has(cleanKey)) continue

      const colPrefix = hasAlias
        ? (isTestAttempts ? 'ta.' : (isSpeakingSubmissions ? 'ss.' : (isWritingSubmissions ? 'ws.' : (isTestSections ? 'ts.' : (table === 'questions' ? 'q.' : (table === 'user_vocabulary' ? 'uv.' : ''))))))
        : ''
      const fullCol = `${colPrefix}${cleanKey}`
      const valStr = String(value)

      if (valStr.startsWith('eq.')) {
        const eqVal = valStr.slice(3)
        // If filtering by an invalid or undefined uuid/id, safely return empty result instead of crashing Postgres
        if ((cleanKey === 'id' || cleanKey.endsWith('_id')) && (eqVal === 'undefined' || eqVal === 'null' || !eqVal)) {
          return res.json({ success: true, data: [], count: 0 })
        }

        // If querying 'tests' table by 'id' but the value is NOT a valid UUID, search by slug instead!
        if (table === 'tests' && cleanKey === 'id') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eqVal)
          if (!isUuid) {
            params.push(eqVal)
            conditions.push(`slug = $${params.length}`)
            continue
          }
        }

        params.push(eqVal)
        conditions.push(`${fullCol} = $${params.length}`)
      } else if (valStr.startsWith('neq.')) {
        params.push(valStr.slice(4))
        conditions.push(`${fullCol} != $${params.length}`)
      } else if (valStr.startsWith('lte.')) {
        params.push(valStr.slice(4))
        conditions.push(`${fullCol} <= $${params.length}`)
      } else if (valStr.startsWith('gte.')) {
        params.push(valStr.slice(4))
        conditions.push(`${fullCol} >= $${params.length}`)
      } else if (valStr.startsWith('lt.')) {
        params.push(valStr.slice(3))
        conditions.push(`${fullCol} < $${params.length}`)
      } else if (valStr.startsWith('gt.')) {
        params.push(valStr.slice(3))
        conditions.push(`${fullCol} > $${params.length}`)
      } else if (valStr.startsWith('ilike.')) {
        params.push(valStr.slice(6))
        conditions.push(`${fullCol} ILIKE $${params.length}`)
      } else if (valStr.startsWith('like.')) {
        params.push(valStr.slice(5))
        conditions.push(`${fullCol} LIKE $${params.length}`)
      } else if (valStr.startsWith('is.')) {
        const isVal = valStr.slice(3).toLowerCase()
        if (isVal === 'null') {
          conditions.push(`${fullCol} IS NULL`)
        } else if (isVal === 'not.null' || isVal === 'not null') {
          conditions.push(`${fullCol} IS NOT NULL`)
        } else if (isVal === 'true') {
          conditions.push(`${fullCol} IS TRUE`)
        } else if (isVal === 'false') {
          conditions.push(`${fullCol} IS FALSE`)
        } else {
          params.push(isVal)
          conditions.push(`${fullCol} = $${params.length}`)
        }
      } else if (valStr.startsWith('in.')) {
        const inVals = valStr.slice(3).replace(/[()]/g, '').split(',').map(s => s.trim())
        params.push(inVals)
        conditions.push(`${fullCol} = ANY($${params.length})`)
      } else {
        params.push(valStr)
        conditions.push(`${fullCol} = $${params.length}`)
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    if (order) {
      const orderStr = String(order)
      const parts = orderStr.split('.')
      const col = parts[0].replace(/[^a-zA-Z0-9_]/g, '')
      if (!validColumns || validColumns.has(col)) {
        const dir = parts[1]?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
        const colPrefix = (isTestAttempts ? 'ta.' : (isSpeakingSubmissions ? 'ss.' : (isWritingSubmissions ? 'ws.' : '')))
        sql += ` ORDER BY ${colPrefix}${col} ${dir}`
      }
    }

    if (limit) {
      params.push(Math.min(500, Number(limit) || 100))
      sql += ` LIMIT $${params.length}`
    }

    const result = await query(sql, params)

    // Transform joined relational results to match Supabase shape
    let rows = result.rows
    if (isTestAttempts) {
      rows = rows.map((r: any) => {
        const testObj = r.test_title ? { title: r.test_title, skill: r.test_skill } : null
        return {
          ...r,
          test: testObj,
          tests: testObj,
        }
      })
    } else if (isSpeakingSubmissions) {
      rows = rows.map((r: any) => ({
        ...r,
        prompt: r.prompt_title ? { title: r.prompt_title, part_number: r.prompt_part_number } : null,
        feedback: r.feedback_overall_band !== undefined && r.feedback_overall_band !== null
          ? { overall_band: r.feedback_overall_band }
          : null,
      }))
    } else if (isWritingSubmissions) {
      rows = rows.map((r: any) => ({
        ...r,
        prompt: r.prompt_title ? { title: r.prompt_title, task_type: r.prompt_task_type } : null,
        feedback: r.feedback_overall_band !== undefined && r.feedback_overall_band !== null
          ? { overall_band: r.feedback_overall_band }
          : null,
      }))
    } else if (isTestSections) {
      rows = rows.map((r: any) => ({
        ...r,
        passage: r.passage_id ? { id: r.passage_id, title: r.passage_title, content: r.passage_content } : null,
        audio: r.audio_id ? { id: r.audio_id, title: r.audio_title, file_path: r.audio_file_path } : null,
      }))
    } else if (table === 'questions' && (selectStr.includes('tests') || selectStr.includes('test'))) {
      rows = rows.map((r: any) => ({
        ...r,
        tests: r.test_title ? { title: r.test_title, skill: r.test_skill } : null,
        test: r.test_title ? { title: r.test_title, skill: r.test_skill } : null,
      }))
    } else if (table === 'user_vocabulary' && selectStr.includes('vocabulary_words')) {
      rows = rows.map((r: any) => ({
        ...r,
        vocabulary_words: r.vw_word ? {
          id: r.word_id,
          word: r.vw_word,
          part_of_speech: r.vw_part_of_speech,
          definition: r.vw_definition,
          example_sentence: r.vw_example_sentence,
          pronunciation: r.vw_pronunciation,
        } : null,
      }))
    }

    // Attach options when questions are queried with options
    if (table === 'questions' && selectStr.includes('options') && rows.length > 0) {
      const qIds = rows.map((r: any) => r.id)
      const optionsRes = await query(
        `SELECT * FROM question_options WHERE question_id = ANY($1) ORDER BY order_number ASC`,
        [qIds]
      )
      const optionsByQ = new Map<string, any[]>()
      for (const opt of optionsRes.rows) {
        if (!optionsByQ.has(opt.question_id)) optionsByQ.set(opt.question_id, [])
        optionsByQ.get(opt.question_id)!.push(opt)
      }
      rows = rows.map((r: any) => ({
        ...r,
        options: optionsByQ.get(r.id) || [],
      }))
    }

    let totalCount = rows.length
    if (count === 'exact') {
      let countSql = `SELECT count(*) FROM ${table}`
      if (conditions.length > 0) {
        // Replace aliases if any for simple count
        const simpleConditions = conditions.map(c => c.replace(/^(ta\.|ss\.|ws\.)/, ''))
        countSql += ` WHERE ${simpleConditions.join(' AND ')}`
      }
      const countRes = await query(countSql, params.slice(0, conditions.length))
      totalCount = parseInt(countRes.rows[0].count, 10)
    }

    return res.json({
      success: true,
      data: rows,
      count: totalCount,
    })
  } catch (error: any) {
    console.error(`Data proxy error for ${req.params.table}:`, error)
    return res.status(500).json({ error: error.message || 'Database query failed' })
  }
})

// 2. INSERT ROW(S) (POST) - Supports single object or array
router.post('/:table', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { table } = req.params

    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: `Table '${table}' not accessible` })
    }

    const body = req.body
    if (!body) {
      return res.status(400).json({ error: 'Body required' })
    }

    const items = Array.isArray(body) ? body : [body]
    if (items.length === 0) {
      return res.status(201).json({ success: true, data: [] })
    }

    const validColumns = TABLE_COLUMNS[table]
    const insertedRows: any[] = []

    for (const item of items) {
      if (!item || typeof item !== 'object') continue

      // Auto-inject user_id if column exists and user is authenticated
      if (req.user && !item.user_id && ['profiles', 'test_attempts', 'user_vocabulary', 'saved_items', 'progress', 'writing_submissions', 'speaking_submissions'].includes(table)) {
        item.user_id = req.user.id
      }

      if (table === 'user_vocabulary') {
        if (item.mastery_level === undefined && item.srs_stage !== undefined) {
          item.mastery_level = Number(item.srs_stage) || 0
        }
        if (item.status && !['new', 'learning', 'review', 'mastered'].includes(item.status)) {
          item.status = 'learning'
        }
      }

      const keys = Object.keys(item).filter((k) => /^[a-zA-Z0-9_]+$/.test(k) && (!validColumns || validColumns.has(k)))
      if (keys.length === 0) continue

      const values = keys.map((k) => serializeIfJsonb(k, item[k]))

      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      let sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
      if (table === 'user_vocabulary') {
        sql += ` ON CONFLICT (user_id, word_id) DO UPDATE SET 
                 mastery_level = EXCLUDED.mastery_level, 
                 status = EXCLUDED.status, 
                 next_review_at = EXCLUDED.next_review_at, 
                 review_count = user_vocabulary.review_count + 1, 
                 updated_at = NOW()`
      } else if (table === 'saved_items') {
        sql += ` ON CONFLICT (user_id, item_type, item_id) DO NOTHING`
      } else if (table === 'attempt_answers') {
        sql += ` ON CONFLICT (attempt_id, question_id) DO UPDATE SET 
                 user_answer = COALESCE(EXCLUDED.user_answer, attempt_answers.user_answer), 
                 marked_for_review = COALESCE(EXCLUDED.marked_for_review, attempt_answers.marked_for_review),
                 is_correct = COALESCE(EXCLUDED.is_correct, attempt_answers.is_correct), 
                 points_earned = COALESCE(EXCLUDED.points_earned, attempt_answers.points_earned), 
                 answered_at = NOW()`
      }
      sql += ` RETURNING *`

      const result = await query(sql, values)
      if (result.rows.length > 0) {
        insertedRows.push(result.rows[0])
      }
    }

    const responseData = Array.isArray(body) ? insertedRows : (insertedRows[0] || null)
    return res.status(201).json({ success: true, data: responseData })
  } catch (error: any) {
    console.error(`Insert proxy error for ${req.params.table}:`, error)
    return res.status(500).json({ error: error.message || 'Insert failed' })
  }
})

// 3. UPDATE ROW (PUT / PATCH)
router.put('/:table/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params

    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: `Table '${table}' not accessible` })
    }

    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Valid ID required for update' })
    }

    const body = req.body
    const validColumns = TABLE_COLUMNS[table]
    const keys = Object.keys(body).filter((k) => /^[a-zA-Z0-9_]+$/.test(k) && k !== 'updated_at' && k !== 'id' && (!validColumns || validColumns.has(k)))
    if (keys.length === 0) {
      return res.status(400).json({ error: 'No valid columns provided' })
    }

    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`)
    const values = keys.map((k) => serializeIfJsonb(k, body[k]))
    values.push(id)

    const hasUpdatedAt = TABLE_COLUMNS[table]?.has('updated_at')
    const updatedAtClause = hasUpdatedAt ? ', updated_at = NOW()' : ''
    const whereClause = table === 'profiles' ? `(id = $${values.length} OR user_id = $${values.length})` : `id = $${values.length}`
    const sql = `UPDATE ${table} SET ${setClauses.join(', ')}${updatedAtClause} WHERE ${whereClause} RETURNING *`
    const result = await query(sql, values)

    return res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error(`Update proxy error for ${req.params.table}:`, error)
    return res.status(500).json({ error: error.message || 'Update failed' })
  }
})

// 4. DELETE ROWS (DELETE) - by ID or by query filters
router.delete('/:table/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params

    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: `Table '${table}' not accessible` })
    }

    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Valid ID required for deletion' })
    }

    await query(`DELETE FROM ${table} WHERE id = $1`, [id])
    return res.json({ success: true, message: 'Deleted successfully' })
  } catch (error: any) {
    console.error(`Delete proxy error for ${req.params.table}:`, error)
    return res.status(500).json({ error: error.message || 'Delete failed' })
  }
})

router.delete('/:table', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { table } = req.params

    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: `Table '${table}' not accessible` })
    }

    const validColumns = TABLE_COLUMNS[table]
    const whereClauses: string[] = []
    const values: any[] = []

    for (const [key, val] of Object.entries(req.query)) {
      if (!validColumns || !validColumns.has(key)) continue
      const strVal = String(val)
      if (strVal.startsWith('eq.')) {
        const eqVal = strVal.slice(3)
        if (eqVal === 'undefined' || eqVal === 'null' || !eqVal) {
          return res.status(400).json({ error: `Invalid ${key} value for deletion` })
        }
        values.push(eqVal)
        whereClauses.push(`${key} = $${values.length}`)
      } else if (strVal.startsWith('neq.')) {
        const neqVal = strVal.slice(4)
        if (neqVal === 'undefined' || neqVal === 'null' || !neqVal) {
          continue
        }
        values.push(neqVal)
        whereClauses.push(`${key} != $${values.length}`)
      } else if (strVal.startsWith('in.(') && strVal.endsWith(')')) {
        const inVals = strVal.slice(4, -1).split(',').map((v) => v.trim()).filter(Boolean)
        if (inVals.length > 0) {
          const placeholders = inVals.map((v) => {
            values.push(v)
            return `$${values.length}`
          }).join(', ')
          whereClauses.push(`${key} IN (${placeholders})`)
        }
      }
    }

    if (whereClauses.length === 0) {
      return res.status(400).json({ error: 'Delete query requires at least one valid filter' })
    }

    const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`
    await query(sql, values)
    return res.json({ success: true, message: 'Deleted successfully' })
  } catch (error: any) {
    console.error(`Delete query proxy error for ${req.params.table}:`, error)
    return res.status(500).json({ error: error.message || 'Delete failed' })
  }
})

export default router
