import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { query, pool } from '../config/db.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import {
  parseIeltsHtmlWithGemini,
  parseIeltsPdfWithGemini,
  parseIeltsTextWithGemini,
  generateListeningTestWithGemini,
} from '../utils/gemini-html-parser.js'

const router = Router()

// Apply admin guard to all admin routes
router.use(authenticateToken, requireAdmin)

// 1. ADMIN DASHBOARD STATS
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalTestsRes,
      publishedTestsRes,
      draftTestsRes,
      totalQuestionsRes,
      readingTestsRes,
      listeningTestsRes,
      writingPromptsRes,
      speakingPromptsRes,
      totalUsersRes,
      activeSubsRes,
      totalAttemptsRes,
      recentAttemptsRes,
    ] = await Promise.all([
      query('SELECT count(*) FROM tests'),
      query("SELECT count(*) FROM tests WHERE status = 'published'"),
      query("SELECT count(*) FROM tests WHERE status = 'draft'"),
      query('SELECT count(*) FROM questions'),
      query("SELECT count(*) FROM tests WHERE skill = 'reading'"),
      query("SELECT count(*) FROM tests WHERE skill = 'listening'"),
      query('SELECT count(*) FROM writing_prompts'),
      query('SELECT count(*) FROM speaking_prompts'),
      query('SELECT count(*) FROM profiles'),
      query("SELECT count(*) FROM subscriptions WHERE status = 'active'"),
      query("SELECT (SELECT count(*) FROM test_attempts WHERE status != 'in_progress') + (SELECT count(*) FROM writing_submissions) + (SELECT count(*) FROM speaking_submissions) as count"),
      query(
        `WITH all_recent AS (
           SELECT a.id, a.test_id, a.created_at, a.submitted_at, a.estimated_band, a.status::text as status,
                  t.title as test_title, p.first_name, p.last_name
           FROM test_attempts a
           JOIN tests t ON t.id = a.test_id
           LEFT JOIN profiles p ON p.user_id = a.user_id
           WHERE a.status != 'in_progress' OR EXISTS (SELECT 1 FROM attempt_answers aa WHERE aa.attempt_id = a.id)

           UNION ALL

           SELECT ws.id, ws.prompt_id as test_id, ws.created_at, COALESCE(ws.submitted_at, ws.created_at) as submitted_at,
                  wf.estimated_band, ws.status::text as status,
                  wp.title as test_title, p.first_name, p.last_name
           FROM writing_submissions ws
           JOIN writing_prompts wp ON wp.id = ws.prompt_id
           LEFT JOIN writing_feedback wf ON wf.submission_id = ws.id
           LEFT JOIN profiles p ON p.user_id = ws.user_id

           UNION ALL

           SELECT ss.id, ss.prompt_id as test_id, ss.created_at, ss.created_at as submitted_at,
                  sf.estimated_band, ss.status::text as status,
                  sp.title as test_title, p.first_name, p.last_name
           FROM speaking_submissions ss
           JOIN speaking_prompts sp ON sp.id = ss.prompt_id
           LEFT JOIN speaking_feedback sf ON sf.submission_id = ss.id
           LEFT JOIN profiles p ON p.user_id = ss.user_id
         )
         SELECT * FROM all_recent ORDER BY created_at DESC LIMIT 10`
      ),
    ])

    // Calculate real disk and storage statistics
    const possibleUploadDirs = [
      path.resolve(process.cwd(), 'backend', 'uploads'),
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(__dirname, '..', '..', 'uploads'),
      path.resolve(__dirname, '..', 'uploads'),
    ]
    const uploadsDir = possibleUploadDirs.find((p) => fs.existsSync(p)) || path.resolve(process.cwd(), 'uploads')

    let diskStats = {
      totalGb: 0,
      usedGb: 0,
      freeGb: 0,
      usedPercent: 0,
    }

    try {
      if (typeof (fs as any).statfsSync === 'function') {
        const stats = (fs as any).statfsSync(uploadsDir)
        const totalBytes = Number(stats.blocks) * Number(stats.bsize)
        const freeBytes = Number(stats.bfree) * Number(stats.bsize)
        const usedBytes = totalBytes - freeBytes
        diskStats = {
          totalGb: Math.round((totalBytes / (1024 ** 3)) * 10) / 10,
          usedGb: Math.round((usedBytes / (1024 ** 3)) * 10) / 10,
          freeGb: Math.round((freeBytes / (1024 ** 3)) * 10) / 10,
          usedPercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0,
        }
      }
    } catch (e) {
      console.warn('Could not read disk stats:', e)
    }

    // Media uploads folder size (audio tracks, diagrams, student uploads)
    let uploadsSizeMb = 0
    let uploadsCount = 0
    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir).filter((f) => !f.startsWith('.'))
        uploadsCount = files.length
        let totalUploadsBytes = 0
        for (const file of files) {
          const filePath = path.join(uploadsDir, file)
          const st = fs.statSync(filePath)
          totalUploadsBytes += st.size
        }
        uploadsSizeMb = Math.round((totalUploadsBytes / (1024 * 1024)) * 10) / 10
      }
    } catch (e) {
      console.warn('Could not read uploads dir size:', e)
    }

    // Database size query (real PostgreSQL database size)
    let dbSizePretty = 'N/A'
    let dbSizeBytes = 0
    try {
      const dbSizeRes = await query("SELECT pg_size_pretty(pg_database_size(current_database())) as size_pretty, pg_database_size(current_database()) as size_bytes")
      if (dbSizeRes.rows.length > 0) {
        dbSizeBytes = Number(dbSizeRes.rows[0].size_bytes)
        const sizeInMb = (dbSizeBytes / (1024 * 1024)).toFixed(1)
        dbSizePretty = `${sizeInMb} MB`
      }
    } catch (e) {
      console.warn('Could not read db size:', e)
    }

    return res.json({
      success: true,
      stats: {
        totalTests: parseInt(totalTestsRes.rows[0].count, 10),
        publishedTests: parseInt(publishedTestsRes.rows[0].count, 10),
        draftTests: parseInt(draftTestsRes.rows[0].count, 10),
        totalQuestions: parseInt(totalQuestionsRes.rows[0].count, 10),
        readingTests: parseInt(readingTestsRes.rows[0].count, 10),
        listeningTests: parseInt(listeningTestsRes.rows[0].count, 10),
        writingPrompts: parseInt(writingPromptsRes.rows[0].count, 10),
        speakingPrompts: parseInt(speakingPromptsRes.rows[0].count, 10),
        totalUsers: parseInt(totalUsersRes.rows[0].count, 10),
        activeSubscribers: parseInt(activeSubsRes.rows[0].count, 10),
        totalAttempts: parseInt(totalAttemptsRes.rows[0].count, 10),
        recentAttempts: recentAttemptsRes.rows,
        storage: {
          totalGb: diskStats.totalGb,
          usedGb: diskStats.usedGb,
          freeGb: diskStats.freeGb,
          usedPercent: diskStats.usedPercent,
          uploadsSizeMb,
          uploadsCount,
          dbSizePretty,
          dbSizeBytes,
        },
      },
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return res.status(500).json({ error: 'Failed to fetch admin dashboard statistics' })
  }
})

// 2. ADMIN TESTS LIST & CRUD
router.get('/tests', async (req: Request, res: Response) => {
  try {
    const { skill, status, search, limit = 100 } = req.query

    let sql = `
      SELECT t.*, COUNT(q.id) as question_count
      FROM tests t
      LEFT JOIN questions q ON q.test_id = t.id
      WHERE 1=1
    `
    const params: any[] = []

    if (skill && skill !== 'all') {
      params.push(skill)
      sql += ` AND t.skill = $${params.length}`
    }

    if (status && status !== 'all') {
      params.push(status)
      sql += ` AND t.status = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      sql += ` AND t.title ILIKE $${params.length}`
    }

    sql += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT $${params.length + 1}`
    params.push(Number(limit))

    const result = await query(sql, params)
    return res.json({ success: true, tests: result.rows })
  } catch (error: any) {
    console.error('Admin tests list error:', error)
    return res.status(500).json({ error: 'Failed to fetch tests' })
  }
})

router.post('/tests', async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.id
    const { title, description, skill, difficulty, isPremium, timeLimitMinutes, accessType } = req.body

    const result = await query(
      `INSERT INTO tests (title, description, skill, difficulty, is_premium, access_type, time_limit_minutes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
       RETURNING *`,
      [
        title,
        description || null,
        skill || 'reading',
        difficulty || 'medium',
        !!isPremium,
        accessType || 'free',
        Number(timeLimitMinutes) || 60,
        adminId,
      ]
    )

    return res.status(201).json({ success: true, test: result.rows[0] })
  } catch (error: any) {
    console.error('Admin create test error:', error)
    return res.status(500).json({ error: 'Failed to create test' })
  }
})

router.put('/tests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, skill, difficulty, isPremium, status, timeLimitMinutes, accessType } = req.body

    const result = await query(
      `UPDATE tests
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           skill = COALESCE($3, skill),
           difficulty = COALESCE($4, difficulty),
           is_premium = COALESCE($5, is_premium),
           status = COALESCE($6, status),
           time_limit_minutes = COALESCE($7, time_limit_minutes),
           access_type = COALESCE($8, access_type),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, description, skill, difficulty, isPremium, status, timeLimitMinutes, accessType, id]
    )

    return res.json({ success: true, test: result.rows[0] })
  } catch (error: any) {
    console.error('Admin update test error:', error)
    return res.status(500).json({ error: 'Failed to update test' })
  }
})

router.delete('/tests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await query('DELETE FROM tests WHERE id = $1', [id])
    return res.json({ success: true, message: 'Test deleted successfully' })
  } catch (error: any) {
    console.error('Admin delete test error:', error)
    return res.status(500).json({ error: 'Failed to delete test' })
  }
})

// 3. ADMIN USERS MANAGEMENT
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { search, role, limit = 100 } = req.query

    let sql = `
      SELECT u.id, u.id as user_id, u.email, u.role, u.created_at,
             p.first_name, p.last_name, p.avatar_url, p.telegram_username,
             p.target_band, p.previous_score, p.onboarding_completed, p.status,
             ((SELECT count(*) FROM test_attempts WHERE user_id = u.id AND (status != 'in_progress' OR EXISTS (SELECT 1 FROM attempt_answers aa WHERE aa.attempt_id = test_attempts.id))) + (SELECT count(*) FROM writing_submissions WHERE user_id = u.id) + (SELECT count(*) FROM speaking_submissions WHERE user_id = u.id)) as attempts_count,
             s.id as subscription_id,
             s.status as subscription_status,
             s.expires_at as subscription_expires_at,
             s.started_at as subscription_started_at,
             pl.id as plan_id,
             pl.name as plan_name,
             pl.slug as plan_slug,
             (u.role = 'admin' OR (s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW()))) as is_premium
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT sub.id, sub.status, sub.expires_at, sub.started_at, sub.plan_id
        FROM subscriptions sub
        WHERE sub.user_id = u.id AND sub.status = 'active' AND (sub.expires_at IS NULL OR sub.expires_at > NOW())
        ORDER BY sub.created_at DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN plans pl ON pl.id = s.plan_id
      WHERE 1=1
    `
    const params: any[] = []

    if (role && role !== 'all') {
      params.push(role)
      sql += ` AND u.role = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      sql += ` AND (u.email ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length})`
    }

    sql += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1}`
    params.push(Number(limit))

    const result = await query(sql, params)
    return res.json({ success: true, users: result.rows })
  } catch (error: any) {
    console.error('Admin users list error:', error)
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { role } = req.body // 'student' | 'admin'

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id])
    await query('UPDATE profiles SET role = $1, updated_at = NOW() WHERE user_id = $2', [role, id])

    return res.json({ success: true, message: `User role updated to ${role}` })
  } catch (error: any) {
    console.error('Admin update user role error:', error)
    return res.status(500).json({ error: 'Failed to update user role' })
  }
})

router.put('/users/:id/premium', async (req: Request, res: Response) => {
  try {
    const { id } = req.params // target user_id
    const { action, planSlug = 'monthly', durationDays = 30 } = req.body // action: 'grant' | 'revoke'

    if (action === 'revoke') {
      // Set all active subscriptions to 'cancelled'
      await query(
        `UPDATE subscriptions 
         SET status = 'cancelled', updated_at = NOW() 
         WHERE user_id = $1 AND status = 'active'`,
        [id]
      )

      await query(
        `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
         VALUES ($1, 'revoke_premium', 'user', $2, $3)`,
        [req.user!.id, id, JSON.stringify({ reason: 'Admin revoked premium membership' })]
      )

      return res.json({
        success: true,
        message: 'Premium membership successfully revoked',
        is_premium: false,
      })
    }

    if (action === 'grant') {
      // Find or default plan
      const planRes = await query('SELECT id, name, slug FROM plans WHERE slug = $1 LIMIT 1', [planSlug])
      let planId = planRes.rows[0]?.id
      if (!planId) {
        const fallbackPlan = await query('SELECT id FROM plans ORDER BY sort_order ASC LIMIT 1')
        planId = fallbackPlan.rows[0]?.id
      }

      // Calculate expiry date: if durationDays <= 0, lifetime (expires_at = null)
      const expiresAt = durationDays && durationDays > 0
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      // First cancel any existing active subscriptions for cleanliness
      await query(
        `UPDATE subscriptions 
         SET status = 'cancelled', updated_at = NOW() 
         WHERE user_id = $1 AND status = 'active'`,
        [id]
      )

      // Insert new active subscription
      const newSub = await query(
        `INSERT INTO subscriptions (user_id, plan_id, status, provider, started_at, expires_at)
         VALUES ($1, $2, 'active', 'admin_grant', NOW(), $3)
         RETURNING *`,
        [id, planId, expiresAt]
      )

      await query(
        `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
         VALUES ($1, 'grant_premium', 'user', $2, $3)`,
        [req.user!.id, id, JSON.stringify({ planSlug, durationDays, expiresAt })]
      )

      return res.json({
        success: true,
        message: `Premium granted successfully (${durationDays > 0 ? `${durationDays} days` : 'Lifetime'})`,
        subscription: newSub.rows[0],
        is_premium: true,
      })
    }

    return res.status(400).json({ error: "Invalid action. Use 'grant' or 'revoke'." })
  } catch (error: any) {
    console.error('Admin update user premium error:', error)
    return res.status(500).json({ error: error.message || 'Failed to update user premium status' })
  }
})

router.put('/users/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { suspended } = req.body

    const newStatus = suspended ? 'suspended' : 'active'
    await query('UPDATE profiles SET status = $1, updated_at = NOW() WHERE user_id = $2', [newStatus, id])

    await query(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'user', $3, $4)`,
      [req.user!.id, suspended ? 'user_suspended' : 'user_restored', id, JSON.stringify({ status: newStatus })]
    )

    return res.json({ success: true, status: newStatus })
  } catch (error: any) {
    console.error('Admin suspend user error:', error)
    return res.status(500).json({ error: 'Failed to update user status' })
  }
})

router.delete('/users/:id', async (req: Request, res: Response) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    const currentAdminId = req.user!.id

    if (id === currentAdminId) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' })
    }

    const userCheck = await client.query('SELECT id, email, role FROM users WHERE id = $1', [id])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const targetUser = userCheck.rows[0]

    // Complete cascading cleanup in transaction
    await client.query('BEGIN')

    // 1. Delete test attempts and answers
    await client.query('DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE user_id = $1)', [id])
    await client.query('DELETE FROM section_scores WHERE attempt_id IN (SELECT id FROM test_attempts WHERE user_id = $1)', [id])
    await client.query('DELETE FROM test_attempts WHERE user_id = $1', [id])

    // 2. Delete writing submissions and feedback
    await client.query('DELETE FROM writing_feedback WHERE submission_id IN (SELECT id FROM writing_submissions WHERE user_id = $1)', [id])
    await client.query('DELETE FROM writing_submissions WHERE user_id = $1', [id])

    // 3. Delete speaking submissions and feedback
    await client.query('DELETE FROM speaking_feedback WHERE submission_id IN (SELECT id FROM speaking_submissions WHERE user_id = $1)', [id])
    await client.query('DELETE FROM speaking_submissions WHERE user_id = $1', [id])

    // 4. Delete user vocabulary, progress, saved items
    await client.query('DELETE FROM user_vocabulary WHERE user_id = $1', [id])
    await client.query('DELETE FROM saved_items WHERE user_id = $1', [id])
    await client.query('DELETE FROM progress WHERE user_id = $1', [id])

    // 5. Delete subscriptions and payments
    await client.query('DELETE FROM subscriptions WHERE user_id = $1', [id])
    await client.query('DELETE FROM payments WHERE user_id = $1', [id])

    // 6. Delete activity logs, audit logs, and admin activity logs
    await client.query('DELETE FROM activity_logs WHERE user_id = $1', [id])
    await client.query('DELETE FROM audit_logs WHERE admin_user_id = $1', [id])
    await client.query('DELETE FROM admin_activity_logs WHERE admin_id = $1 OR target_id = $1::text', [id])

    // 7. Nullify foreign key references in content created by this user
    await client.query('UPDATE tests SET created_by = NULL WHERE created_by = $1', [id])
    await client.query('UPDATE imports SET created_by = NULL WHERE created_by = $1', [id])
    await client.query('UPDATE media_assets SET created_by = NULL WHERE created_by = $1', [id])

    // 8. Delete profile and user
    await client.query('DELETE FROM profiles WHERE user_id = $1', [id])
    await client.query('DELETE FROM users WHERE id = $1', [id])

    await client.query('COMMIT')

    console.log(`[Admin] User ${id} (${targetUser.email}) and all associated records permanently deleted by admin ${currentAdminId}`)

    return res.json({
      success: true,
      message: `User ${targetUser.email} and all associated data have been permanently deleted`,
    })
  } catch (error: any) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore rollback error
    }
    console.error('Admin delete user error:', error)
    return res.status(500).json({ error: error.message || 'Failed to delete user and associated data' })
  } finally {
    client.release()
  }
})

// 4. READING PASSAGES MANAGEMENT
router.get('/passages', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM reading_passages ORDER BY created_at DESC LIMIT 100')
    return res.json({ success: true, passages: result.rows })
  } catch (error: any) {
    console.error('Admin passages error:', error)
    return res.status(500).json({ error: 'Failed to fetch passages' })
  }
})
router.post('/passages', async (req: Request, res: Response) => {
  try {
    const { title, content, difficulty, source, wordCount } = req.body

    const result = await query(
      `INSERT INTO reading_passages (title, content, difficulty, source, word_count, status)
       VALUES ($1, $2, $3, $4, $5, 'published')
       RETURNING *`,
      [title, content, difficulty || 'medium', source || null, Number(wordCount) || null]
    )

    return res.status(201).json({ success: true, passage: result.rows[0] })
  } catch (error: any) {
    console.error('Admin create passage error:', error)
    return res.status(500).json({ error: 'Failed to create passage' })
  }
})

// 5. ADMIN STUDENT ATTEMPTS & RESULTS REPORTING (Unifies Reading, Listening, Writing, and Speaking)
router.get('/attempts', async (req: Request, res: Response) => {
  try {
    const { search, skill, status, userId, page = 1, limit = 25, sortBy = 'created_at' } = req.query

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 25))
    const offset = (pageNum - 1) * limitNum

    const allAttemptsCte = `
      WITH all_attempts AS (
        -- 1. Reading & Listening (from test_attempts)
        SELECT 
          a.id,
          a.user_id,
          a.test_id,
          'test' as attempt_type,
          a.status::text as status,
          a.started_at,
          COALESCE(a.submitted_at, a.created_at) as submitted_at,
          a.time_used_seconds,
          a.raw_score,
          a.total_points,
          a.estimated_band,
          a.created_at,
          t.title as test_title,
          t.skill as test_skill,
          t.ielts_type as test_ielts_type,
          t.time_limit_minutes,
          t.difficulty::text as test_difficulty,
          (SELECT COUNT(*) FROM attempt_answers aa WHERE aa.attempt_id = a.id AND aa.is_correct = true) as correct_count,
          (SELECT COUNT(*) FROM attempt_answers aa WHERE aa.attempt_id = a.id AND aa.is_correct = false AND aa.user_answer IS NOT NULL) as incorrect_count
        FROM test_attempts a
        JOIN tests t ON t.id = a.test_id
        WHERE a.status != 'in_progress' OR EXISTS (SELECT 1 FROM attempt_answers aa WHERE aa.attempt_id = a.id)

        UNION ALL

        -- 2. Writing (from writing_submissions)
        SELECT 
          ws.id,
          ws.user_id,
          ws.prompt_id as test_id,
          'writing' as attempt_type,
          ws.status::text as status,
          ws.created_at as started_at,
          COALESCE(ws.submitted_at, ws.created_at) as submitted_at,
          0 as time_used_seconds,
          ws.word_count as raw_score,
          150 as total_points,
          wf.estimated_band,
          ws.created_at,
          wp.title as test_title,
          'writing' as test_skill,
          'academic' as test_ielts_type,
          (CASE WHEN wp.task_type = 'task_1' THEN 20 ELSE 40 END) as time_limit_minutes,
          wp.difficulty::text as test_difficulty,
          ws.word_count as correct_count,
          0 as incorrect_count
        FROM writing_submissions ws
        JOIN writing_prompts wp ON wp.id = ws.prompt_id
        LEFT JOIN writing_feedback wf ON wf.submission_id = ws.id

        UNION ALL

        -- 3. Speaking (from speaking_submissions)
        SELECT 
          ss.id,
          ss.user_id,
          ss.prompt_id as test_id,
          'speaking' as attempt_type,
          ss.status::text as status,
          ss.created_at as started_at,
          ss.created_at as submitted_at,
          ss.duration_seconds as time_used_seconds,
          ss.duration_seconds as raw_score,
          60 as total_points,
          sf.estimated_band,
          ss.created_at,
          sp.title as test_title,
          'speaking' as test_skill,
          'academic' as test_ielts_type,
          15 as time_limit_minutes,
          sp.difficulty::text as test_difficulty,
          ss.duration_seconds as correct_count,
          0 as incorrect_count
        FROM speaking_submissions ss
        JOIN speaking_prompts sp ON sp.id = ss.prompt_id
        LEFT JOIN speaking_feedback sf ON sf.submission_id = ss.id
      )
    `

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (skill && skill !== 'all') {
      params.push(skill)
      whereClause += ` AND a.test_skill = $${params.length}`
    }

    if (status && status !== 'all') {
      params.push(status)
      whereClause += ` AND a.status = $${params.length}`
    }

    if (userId) {
      params.push(userId)
      whereClause += ` AND a.user_id = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      whereClause += ` AND (a.test_title ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    }

    // 1. Fetch Summary Stats across all attempts
    const statsRes = await query(`
      ${allAttemptsCte}
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN a.status IN ('submitted', 'reviewed', 'scored') THEN 1 END) as submitted_count,
        COUNT(CASE WHEN a.status = 'in_progress' THEN 1 END) as in_progress_count,
        ROUND(AVG(CASE WHEN a.status IN ('submitted', 'reviewed', 'scored') AND a.estimated_band IS NOT NULL THEN a.estimated_band END)::numeric, 1) as avg_band,
        COUNT(CASE WHEN a.status IN ('submitted', 'reviewed', 'scored') AND a.estimated_band >= 7.0 THEN 1 END) as high_band_count
      FROM all_attempts a
      LEFT JOIN profiles p ON p.user_id = a.user_id
      LEFT JOIN users u ON u.id = a.user_id
      ${whereClause}
    `, params)

    const stats = {
      totalAttempts: parseInt(statsRes.rows[0]?.total_attempts || '0', 10),
      submittedCount: parseInt(statsRes.rows[0]?.submitted_count || '0', 10),
      inProgressCount: parseInt(statsRes.rows[0]?.in_progress_count || '0', 10),
      avgBand: parseFloat(statsRes.rows[0]?.avg_band || '0') || 0,
      highBandCount: parseInt(statsRes.rows[0]?.high_band_count || '0', 10),
    }

    // 2. Fetch paginated attempts list
    let orderCol = 'a.created_at'
    if (sortBy === 'submitted_at') orderCol = 'a.submitted_at'
    else if (sortBy === 'estimated_band') orderCol = 'a.estimated_band'
    else if (sortBy === 'raw_score') orderCol = 'a.raw_score'

    const listParams = [...params, limitNum, offset]
    const listRes = await query(`
      ${allAttemptsCte}
      SELECT 
        a.id, a.user_id, a.test_id, a.attempt_type, a.status, a.started_at, a.submitted_at,
        a.time_used_seconds, a.raw_score, a.total_points, a.estimated_band, a.created_at,
        a.test_title, a.test_skill, a.test_ielts_type,
        a.time_limit_minutes, a.test_difficulty,
        p.first_name, p.last_name, p.avatar_url, p.telegram_username, p.target_band,
        u.email as user_email,
        a.correct_count,
        a.incorrect_count
      FROM all_attempts a
      LEFT JOIN profiles p ON p.user_id = a.user_id
      LEFT JOIN users u ON u.id = a.user_id
      ${whereClause}
      ORDER BY ${orderCol} DESC NULLS LAST
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, listParams)

    return res.json({
      success: true,
      stats,
      attempts: listRes.rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        test_id: r.test_id,
        attempt_type: r.attempt_type || 'test',
        status: r.status,
        started_at: r.started_at,
        submitted_at: r.submitted_at,
        time_used_seconds: r.time_used_seconds,
        raw_score: r.raw_score,
        total_points: r.total_points,
        estimated_band: r.estimated_band ? parseFloat(r.estimated_band) : null,
        created_at: r.created_at,
        student: {
          id: r.user_id,
          first_name: r.first_name || 'Anonymous',
          last_name: r.last_name || '',
          email: r.user_email || 'No email',
          avatar_url: r.avatar_url,
          telegram_username: r.telegram_username,
          target_band: r.target_band,
        },
        test: {
          id: r.test_id,
          title: r.test_title,
          skill: r.test_skill,
          ielts_type: r.test_ielts_type,
          time_limit_minutes: r.time_limit_minutes,
          difficulty: r.test_difficulty,
        },
        correct_count: parseInt(r.correct_count || '0', 10),
        incorrect_count: parseInt(r.incorrect_count || '0', 10),
      })),
      pagination: {
        total: stats.totalAttempts,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(stats.totalAttempts / limitNum) || 1,
      },
    })
  } catch (error: any) {
    console.error('Admin attempts list error:', error)
    return res.status(500).json({ error: 'Failed to fetch student attempts' })
  }
})

// 6. ADMIN SINGLE ATTEMPT DIAGNOSTIC DETAILS (Question-by-Question / Essay / Speaking Breakdown)
router.get('/attempts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 1. Check test_attempts first (reading / listening)
    const attemptRes = await query(`
      SELECT 
        a.*,
        t.title as test_title, t.skill as test_skill, t.ielts_type as test_ielts_type,
        t.time_limit_minutes, t.difficulty as test_difficulty, t.description as test_description,
        p.first_name, p.last_name, p.avatar_url, p.telegram_username, p.target_band,
        u.email as user_email
      FROM test_attempts a
      JOIN tests t ON t.id = a.test_id
      LEFT JOIN profiles p ON p.user_id = a.user_id
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.id = $1
    `, [id])

    if (attemptRes.rows.length === 0) {
      // 2. Check writing_submissions
      const writingRes = await query(`
        SELECT 
          ws.id, ws.user_id, ws.prompt_id as test_id, ws.content, ws.word_count, ws.status,
          ws.created_at, COALESCE(ws.submitted_at, ws.created_at) as submitted_at,
          wp.title as test_title, 'writing' as test_skill, 'academic' as test_ielts_type,
          wp.prompt_text, wp.task_type, wp.image_url, wp.difficulty as test_difficulty,
          wf.task_achievement, wf.coherence_cohesion, wf.lexical_resource, wf.grammatical_range,
          wf.estimated_band, wf.feedback_text,
          p.first_name, p.last_name, p.avatar_url, p.telegram_username, p.target_band,
          u.email as user_email
        FROM writing_submissions ws
        JOIN writing_prompts wp ON wp.id = ws.prompt_id
        LEFT JOIN writing_feedback wf ON wf.submission_id = ws.id
        LEFT JOIN profiles p ON p.user_id = ws.user_id
        LEFT JOIN users u ON u.id = ws.user_id
        WHERE ws.id = $1
      `, [id])

      if (writingRes.rows.length > 0) {
        const wr = writingRes.rows[0]
        return res.json({
          success: true,
          attempt: {
            id: wr.id,
            status: wr.status,
            started_at: wr.created_at,
            submitted_at: wr.submitted_at,
            time_used_seconds: 0,
            raw_score: wr.word_count,
            total_points: 150,
            estimated_band: wr.estimated_band ? parseFloat(wr.estimated_band) : null,
            created_at: wr.created_at,
            test: {
              id: wr.test_id,
              title: wr.test_title,
              skill: 'writing',
              ielts_type: 'academic',
              difficulty: wr.test_difficulty,
              time_limit_minutes: wr.task_type === 'task_1' ? 20 : 40,
              description: wr.prompt_text,
            },
            student: {
              id: wr.user_id,
              first_name: wr.first_name || 'Anonymous',
              last_name: wr.last_name || '',
              email: wr.user_email || 'No email',
              avatar_url: wr.avatar_url,
              telegram_username: wr.telegram_username,
              target_band: wr.target_band,
            },
          },
          student: {
            id: wr.user_id,
            first_name: wr.first_name || 'Anonymous',
            last_name: wr.last_name || '',
            email: wr.user_email || 'No email',
            avatar_url: wr.avatar_url,
            telegram_username: wr.telegram_username,
            target_band: wr.target_band,
          },
          test: {
            id: wr.test_id,
            title: wr.test_title,
            skill: 'writing',
            ielts_type: 'academic',
            difficulty: wr.test_difficulty,
            time_limit_minutes: wr.task_type === 'task_1' ? 20 : 40,
            description: wr.prompt_text,
          },
          writingDetail: {
            task_achievement: wr.task_achievement ? parseFloat(wr.task_achievement) : null,
            coherence_cohesion: wr.coherence_cohesion ? parseFloat(wr.coherence_cohesion) : null,
            lexical_resource: wr.lexical_resource ? parseFloat(wr.lexical_resource) : null,
            grammatical_range: wr.grammatical_range ? parseFloat(wr.grammatical_range) : null,
            feedback_text: wr.feedback_text || '',
            content: wr.content,
            word_count: wr.word_count,
            image_url: wr.image_url,
            task_type: wr.task_type,
          },
          summary: {
            totalQuestions: 1,
            answeredCount: 1,
            correctCount: 1,
            incorrectCount: 0,
            unansweredCount: 0,
            accuracyPercentage: 100,
          },
          questions: [],
        })
      }

      // 3. Check speaking_submissions
      const speakingRes = await query(`
        SELECT 
          ss.id, ss.user_id, ss.prompt_id as test_id, ss.audio_path, ss.duration_seconds, ss.transcript, ss.status,
          ss.created_at, ss.created_at as submitted_at,
          sp.title as test_title, 'speaking' as test_skill, 'academic' as test_ielts_type,
          sp.prompt_text, sp.part_number, sp.difficulty as test_difficulty,
          sf.fluency_coherence, sf.lexical_resource, sf.grammatical_range, sf.pronunciation,
          sf.estimated_band, sf.feedback_text,
          p.first_name, p.last_name, p.avatar_url, p.telegram_username, p.target_band,
          u.email as user_email
        FROM speaking_submissions ss
        JOIN speaking_prompts sp ON sp.id = ss.prompt_id
        LEFT JOIN speaking_feedback sf ON sf.submission_id = ss.id
        LEFT JOIN profiles p ON p.user_id = ss.user_id
        LEFT JOIN users u ON u.id = ss.user_id
        WHERE ss.id = $1
      `, [id])

      if (speakingRes.rows.length > 0) {
        const sr = speakingRes.rows[0]
        return res.json({
          success: true,
          attempt: {
            id: sr.id,
            status: sr.status,
            started_at: sr.created_at,
            submitted_at: sr.submitted_at,
            time_used_seconds: sr.duration_seconds,
            raw_score: sr.duration_seconds,
            total_points: 60,
            estimated_band: sr.estimated_band ? parseFloat(sr.estimated_band) : null,
            created_at: sr.created_at,
            test: {
              id: sr.test_id,
              title: sr.test_title,
              skill: 'speaking',
              ielts_type: 'academic',
              difficulty: sr.test_difficulty,
              time_limit_minutes: 15,
              description: sr.prompt_text,
            },
            student: {
              id: sr.user_id,
              first_name: sr.first_name || 'Anonymous',
              last_name: sr.last_name || '',
              email: sr.user_email || 'No email',
              avatar_url: sr.avatar_url,
              telegram_username: sr.telegram_username,
              target_band: sr.target_band,
            },
          },
          student: {
            id: sr.user_id,
            first_name: sr.first_name || 'Anonymous',
            last_name: sr.last_name || '',
            email: sr.user_email || 'No email',
            avatar_url: sr.avatar_url,
            telegram_username: sr.telegram_username,
            target_band: sr.target_band,
          },
          test: {
            id: sr.test_id,
            title: sr.test_title,
            skill: 'speaking',
            ielts_type: 'academic',
            difficulty: sr.test_difficulty,
            time_limit_minutes: 15,
            description: sr.prompt_text,
          },
          speakingDetail: {
            fluency_coherence: sr.fluency_coherence ? parseFloat(sr.fluency_coherence) : null,
            lexical_resource: sr.lexical_resource ? parseFloat(sr.lexical_resource) : null,
            grammatical_range: sr.grammatical_range ? parseFloat(sr.grammatical_range) : null,
            pronunciation: sr.pronunciation ? parseFloat(sr.pronunciation) : null,
            feedback_text: sr.feedback_text || '',
            audio_path: sr.audio_path,
            duration_seconds: sr.duration_seconds,
            transcript: sr.transcript,
            part_number: sr.part_number,
          },
          summary: {
            totalQuestions: 1,
            answeredCount: 1,
            correctCount: 1,
            incorrectCount: 0,
            unansweredCount: 0,
            accuracyPercentage: 100,
          },
          questions: [],
        })
      }

      return res.status(404).json({ error: 'Attempt not found' })
    }

    const r = attemptRes.rows[0]

    // 2. Fetch all test questions and left join the attempt answers
    const questionsRes = await query(`
      SELECT 
        q.id as question_id,
        q.question_number,
        q.question_type,
        q.question_text,
        q.instruction,
        q.correct_answer,
        q.accepted_answers,
        q.points,
        q.explanation,
        q.passage_reference,
        aa.id as answer_id,
        aa.user_answer,
        aa.is_correct,
        aa.points_earned,
        aa.marked_for_review,
        aa.answered_at
      FROM questions q
      LEFT JOIN attempt_answers aa ON aa.question_id = q.id AND aa.attempt_id = $1
      WHERE q.test_id = $2
      ORDER BY q.question_number ASC
    `, [id, r.test_id])

    // Also fetch question options if any (for multiple choice options lookup)
    const qIds = questionsRes.rows.map(q => q.question_id)
    const optionsRes = await query(
      `SELECT * FROM question_options WHERE question_id = ANY($1) ORDER BY order_number ASC`,
      [qIds]
    )
    const optionsMap = new Map<string, any[]>()
    for (const opt of optionsRes.rows) {
      if (!optionsMap.has(opt.question_id)) optionsMap.set(opt.question_id, [])
      optionsMap.get(opt.question_id)!.push(opt)
    }

    let correctCount = 0
    let incorrectCount = 0
    let unansweredCount = 0

    const questions = questionsRes.rows.map(q => {
      let userAns = q.user_answer
      if (typeof userAns === 'string') {
        try { userAns = JSON.parse(userAns) } catch { }
      }

      const isAnswered = userAns !== undefined && userAns !== null && userAns !== ''
      const isCorrect = isAnswered && (q.is_correct === true || (
        q.correct_answer && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
      ))

      if (!isAnswered) {
        unansweredCount++
      } else if (isCorrect) {
        correctCount++
      } else {
        incorrectCount++
      }

      return {
        questionId: q.question_id,
        questionNumber: q.question_number,
        questionType: q.question_type,
        questionText: q.question_text,
        instruction: q.instruction,
        correctAnswer: q.correct_answer,
        acceptedAnswers: Array.isArray(q.accepted_answers) ? q.accepted_answers : [],
        points: q.points || 1,
        explanation: q.explanation,
        passageReference: q.passage_reference,
        options: optionsMap.get(q.question_id) || [],
        userAnswer: isAnswered ? userAns : null,
        isCorrect: isAnswered ? !!isCorrect : null,
        status: isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered',
        pointsEarned: isCorrect ? (q.points || 1) : 0,
        markedForReview: !!q.marked_for_review,
        answeredAt: q.answered_at,
      }
    })

    const totalQuestions = questions.length
    const accuracyPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

    return res.json({
      success: true,
      attempt: {
        id: r.id,
        status: r.status,
        started_at: r.started_at,
        submitted_at: r.submitted_at,
        time_used_seconds: r.time_used_seconds,
        raw_score: r.raw_score,
        total_points: r.total_points,
        estimated_band: r.estimated_band ? parseFloat(r.estimated_band) : null,
        created_at: r.created_at,
      },
      student: {
        id: r.user_id,
        first_name: r.first_name || 'Anonymous',
        last_name: r.last_name || '',
        email: r.user_email || 'No email',
        avatar_url: r.avatar_url,
        telegram_username: r.telegram_username,
        target_band: r.target_band,
      },
      test: {
        id: r.test_id,
        title: r.test_title,
        skill: r.test_skill,
        ielts_type: r.test_ielts_type,
        time_limit_minutes: r.time_limit_minutes,
        difficulty: r.test_difficulty,
        description: r.test_description,
      },
      summary: {
        totalQuestions,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracyPercentage,
      },
      questions,
    })
  } catch (error: any) {
    console.error('Admin attempt details error:', error)
    return res.status(500).json({ error: 'Failed to fetch attempt details' })
  }
})

// 12. AUTOMATIC GEMINI AI TEST PARSERS
router.post('/parse-html-ai', async (req: Request, res: Response) => {
  try {
    const { html, fileName } = req.body
    if (!html || typeof html !== 'string' || !html.trim()) {
      return res.status(400).json({ error: 'HTML content is required for parsing' })
    }

    const parsedTest = await parseIeltsHtmlWithGemini(html, fileName)
    return res.json({
      success: true,
      parsedTest,
    })
  } catch (error: any) {
    console.error('Admin HTML AI parsing error:', error)
    return res.status(500).json({ error: error.message || 'Failed to parse HTML test with Gemini AI' })
  }
})

// Native PDF Gemini AI Parser
router.post('/parse-pdf-ai', async (req: Request, res: Response) => {
  try {
    const { pdfBase64, fileName } = req.body
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ error: 'Valid PDF data (base64) is required' })
    }

    const parsedTest = await parseIeltsPdfWithGemini(pdfBase64, fileName)
    return res.json({
      success: true,
      parsedTest,
    })
  } catch (error: any) {
    console.error('Admin PDF AI parsing error:', error)
    return res.status(500).json({ error: error.message || 'Failed to parse PDF test with Gemini AI' })
  }
})

// Raw Text / OCR Gemini AI Parser
router.post('/parse-text-ai', async (req: Request, res: Response) => {
  try {
    const { text, fileName } = req.body
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required for parsing' })
    }

    const parsedTest = await parseIeltsTextWithGemini(text, fileName)
    return res.json({
      success: true,
      parsedTest,
    })
  } catch (error: any) {
    console.error('Admin Text AI parsing error:', error)
    return res.status(500).json({ error: error.message || 'Failed to parse text test with Gemini AI' })
  }
})

// Audio Transcript to IELTS Listening Test Generator
router.post('/parse-audio-transcript-ai', async (req: Request, res: Response) => {
  try {
    const { transcript, audioUrl, title } = req.body
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ error: 'Audio transcript or dialogue text is required' })
    }

    const parsedTest = await generateListeningTestWithGemini(transcript, audioUrl, title)
    return res.json({
      success: true,
      parsedTest,
    })
  } catch (error: any) {
    console.error('Admin Audio AI parsing error:', error)
    return res.status(500).json({ error: error.message || 'Failed to generate IELTS Listening test from transcript' })
  }
})

// Delete Import History Record
router.delete('/imports/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await query('DELETE FROM imports WHERE id = $1', [id])
    return res.json({ success: true, message: 'Import record deleted' })
  } catch (error: any) {
    console.error('Admin delete import error:', error)
    return res.status(500).json({ error: 'Failed to delete import record' })
  }
})


// 13. PLANS & PRICING MANAGEMENT
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM plans ORDER BY sort_order ASC, created_at ASC')
    return res.json({ success: true, plans: result.rows })
  } catch (error: any) {
    console.error('Admin fetch plans error:', error)
    return res.status(500).json({ error: 'Failed to fetch membership plans' })
  }
})

router.put('/plans/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, price, currency, interval, features, is_active, sort_order } = req.body

    const result = await query(
      `UPDATE plans
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           currency = COALESCE($3, currency),
           interval = COALESCE($4, interval),
           features = COALESCE($5, features),
           is_active = COALESCE($6, is_active),
           sort_order = COALESCE($7, sort_order),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name,
        typeof price === 'number' ? price : (price ? Number(price) : null),
        currency,
        interval,
        Array.isArray(features) ? features : null,
        typeof is_active === 'boolean' ? is_active : null,
        typeof sort_order === 'number' ? sort_order : null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' })
    }

    return res.json({ success: true, plan: result.rows[0] })
  } catch (error: any) {
    console.error('Admin update plan error:', error)
    return res.status(500).json({ error: 'Failed to update plan' })
  }
})

// 14. COUPONS & PROMO CODES MANAGEMENT
router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT c.*,
             (CASE 
                WHEN c.expires_at IS NOT NULL AND c.expires_at < NOW() THEN 'expired'
                WHEN c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN 'exhausted'
                WHEN NOT c.is_active THEN 'inactive'
                ELSE 'active'
              END) as status
      FROM coupons c
      ORDER BY c.created_at DESC
    `)
    return res.json({ success: true, coupons: result.rows })
  } catch (error: any) {
    console.error('Admin fetch coupons error:', error)
    return res.status(500).json({ error: 'Failed to fetch coupons' })
  }
})

router.post('/coupons', async (req: Request, res: Response) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Coupon code is required' })
    }
    if (discount_value === undefined || Number(discount_value) <= 0) {
      return res.status(400).json({ error: 'Valid discount value is required' })
    }

    const cleanCode = code.trim().toUpperCase()

    // Robust expiry date handling
    let parsedExpiry: Date | null = null
    if (expires_at) {
      const d = new Date(expires_at)
      if (!isNaN(d.getTime())) {
        parsedExpiry = d
      }
    }

    // Ensure valid discount type
    const validDiscountTypes = ['percentage', 'fixed_usd', 'fixed_uzs']
    const cleanDiscountType = validDiscountTypes.includes(discount_type) ? discount_type : 'percentage'

    const cleanMinOrder = min_order_amount && !isNaN(Number(min_order_amount)) ? Number(min_order_amount) : 0
    const cleanMaxUses = max_uses && !isNaN(Number(max_uses)) && Number(max_uses) > 0 ? Math.floor(Number(max_uses)) : null

    const result = await query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        cleanCode,
        cleanDiscountType,
        Number(discount_value),
        cleanMinOrder,
        cleanMaxUses,
        parsedExpiry,
        is_active !== undefined ? !!is_active : true,
      ]
    )

    return res.status(201).json({ success: true, coupon: result.rows[0] })
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Coupon with this code already exists' })
    }
    console.error('Admin create coupon error:', error)
    return res.status(500).json({ error: error.message || 'Failed to create coupon' })
  }
})

router.put('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body

    let parsedExpiry: Date | null = null
    let hasExpiryUpdate = false
    if (expires_at !== undefined) {
      hasExpiryUpdate = true
      if (expires_at) {
        const d = new Date(expires_at)
        if (!isNaN(d.getTime())) parsedExpiry = d
      }
    }

    const result = await query(
      `UPDATE coupons
       SET discount_type = COALESCE($1, discount_type),
           discount_value = COALESCE($2, discount_value),
           min_order_amount = COALESCE($3, min_order_amount),
           max_uses = CASE WHEN $4::boolean THEN $5::integer ELSE max_uses END,
           expires_at = CASE WHEN $6::boolean THEN $7::timestamptz ELSE expires_at END,
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        discount_type || null,
        discount_value !== undefined && !isNaN(Number(discount_value)) ? Number(discount_value) : null,
        min_order_amount !== undefined && !isNaN(Number(min_order_amount)) ? Number(min_order_amount) : null,
        max_uses !== undefined,
        max_uses && !isNaN(Number(max_uses)) ? Math.floor(Number(max_uses)) : null,
        hasExpiryUpdate,
        parsedExpiry,
        typeof is_active === 'boolean' ? is_active : null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    return res.json({ success: true, coupon: result.rows[0] })
  } catch (error: any) {
    console.error('Admin update coupon error:', error)
    return res.status(500).json({ error: error.message || 'Failed to update coupon' })
  }
})

router.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await query('DELETE FROM coupons WHERE id = $1', [id])
    return res.json({ success: true, message: 'Coupon deleted successfully' })
  } catch (error: any) {
    console.error('Admin delete coupon error:', error)
    return res.status(500).json({ error: 'Failed to delete coupon' })
  }
})

export default router

