import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { query } from '../config/db.js'
import { authenticateToken, generateToken } from '../middleware/auth.js'
import {
  createAuthSession,
  getAuthSession,
  confirmAuthSession,
  provisionTelegramUser,
} from '../services/telegramBot.js'

const router = Router()

// Helper: fetch user profile with subscription status
async function getUserWithProfile(userId: string) {
  const userRes = await query(
    `SELECT u.id, u.email, u.role, u.created_at,
            p.first_name, p.last_name, p.avatar_url, p.telegram_id, p.telegram_username,
            p.target_band, p.challenges, p.plan_timeline, p.has_taken_ielts, p.previous_score,
            p.estimated_level, p.onboarding_completed, p.status as profile_status,
            s.id as subscription_id,
            s.status as subscription_status,
            s.expires_at as subscription_expires_at,
            s.started_at as subscription_started_at,
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
     WHERE u.id = $1`,
    [userId]
  )
  return userRes.rows[0] || null
}

// 1. REGISTER (Email + Password)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Insert user
    const newUserRes = await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'student')
       RETURNING id, email, role`,
      [normalizedEmail, passwordHash]
    )
    const newUser = newUserRes.rows[0]

    // Create initial profile
    await query(
      `INSERT INTO profiles (user_id, first_name, last_name, role)
       VALUES ($1, $2, $3, 'student')`,
      [newUser.id, firstName || 'Student', lastName || '']
    )

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    })

    const fullUser = await getUserWithProfile(newUser.id)

    return res.status(201).json({
      success: true,
      token,
      user: fullUser,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: error?.message || error?.toString() || 'Registration failed' })
  }
})

// 2. LOGIN (Email + Password)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const userRes = await query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = userRes.rows[0]

    if (!user.password_hash) {
      return res.status(400).json({
        error: 'This account was created via social login. Please log in with Telegram or Google.',
      })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const ADMIN_EMAILS = new Set([
      'xudayberganovbackend@gmail.com',
      'ilyoskhudayberganov@gmail.com',
      'ilyosbackend@gmail.com',
      'khilyos1219@gmail.com',
      'adilbekovfozilbek@gmail.com',
      (process.env.ADMIN_EMAIL || '').toLowerCase(),
    ].filter(Boolean))

    let effectiveRole = user.role
    if (ADMIN_EMAILS.has(normalizedEmail)) {
      effectiveRole = 'admin'
      if (user.role !== 'admin') {
        await query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id])
        await query("UPDATE profiles SET role = 'admin' WHERE user_id = $1", [user.id])
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: effectiveRole,
    })

    const fullUser = await getUserWithProfile(user.id)
    if (fullUser && ADMIN_EMAILS.has(normalizedEmail)) {
      fullUser.role = 'admin'
    }

    return res.json({
      success: true,
      token,
      user: fullUser,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return res.status(500).json({ error: error?.message || error?.toString() || 'Login failed' })
  }
})

// 3. GET CURRENT USER (/me)
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const fullUser = await getUserWithProfile(req.user!.id)
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({
      success: true,
      user: fullUser,
    })
  } catch (error: any) {
    console.error('Get me error:', error)
    return res.status(500).json({ error: 'Failed to get user profile' })
  }
})

// 4. TELEGRAM AUTH VALIDATION
router.post('/telegram', async (req: Request, res: Response) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body

    if (!id || !hash) {
      return res.status(400).json({ error: 'Invalid Telegram data' })
    }

    if (auth_date) {
      const now = Math.floor(Date.now() / 1000)
      if (now - Number(auth_date) > 86400) {
        return res.status(403).json({ error: 'Telegram authentication data has expired. Please try again.' })
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    // Check hash verification if BOT_TOKEN is provided
    if (botToken && botToken.trim() !== '') {
      const dataCheckArr: string[] = []
      const params: Record<string, any> = { id, first_name, last_name, username, photo_url, auth_date }

      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
          dataCheckArr.push(`${key}=${val}`)
        }
      }
      dataCheckArr.sort()
      const dataCheckString = dataCheckArr.join('\n')

      const secretKey = crypto.createHash('sha256').update(botToken.trim()).digest()
      const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

      if (hmac.toLowerCase() !== String(hash).toLowerCase()) {
        return res.status(403).json({ error: 'Telegram hash verification failed' })
      }
    }

    // Check if user exists with this telegram_id
    const profileRes = await query('SELECT user_id FROM profiles WHERE telegram_id = $1', [id])
    let userId: string

    if (profileRes.rows.length > 0) {
      userId = profileRes.rows[0].user_id
      // Update profile info
      await query(
        `UPDATE profiles 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             telegram_username = COALESCE($3, telegram_username),
             avatar_url = COALESCE($4, avatar_url),
             updated_at = NOW()
         WHERE user_id = $5`,
        [first_name, last_name || null, username || null, photo_url || null, userId]
      )
    } else {
      // Create new user & profile with unique synthetic email
      const email = `tg_${id}@foxford.uz`
      const newUserRes = await query(
        `INSERT INTO users (email, role)
         VALUES ($1, 'student')
         ON CONFLICT (email) DO UPDATE SET email = $1
         RETURNING id, role`,
        [email]
      )
      userId = newUserRes.rows[0].id

      await query(
        `INSERT INTO profiles (user_id, first_name, last_name, telegram_id, telegram_username, avatar_url, role)
         VALUES ($1, $2, $3, $4, $5, $6, 'student')
         ON CONFLICT (user_id) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           telegram_id = EXCLUDED.telegram_id,
           telegram_username = EXCLUDED.telegram_username,
           avatar_url = EXCLUDED.avatar_url`,
        [userId, first_name, last_name || null, id, username || null, photo_url || null]
      )
    }

    const fullUser = await getUserWithProfile(userId)
    const token = generateToken({
      id: userId,
      email: fullUser.email,
      role: fullUser.role,
    })

    const redirectUrl = fullUser.onboarding_completed ? '/dashboard' : '/onboarding'

    return res.json({
      success: true,
      token,
      user: fullUser,
      redirectUrl,
    })
  } catch (error: any) {
    console.error('Telegram auth error:', error)
    return res.status(500).json({ error: error.message || 'Telegram authentication failed' })
  }
})

// 4.1 TELEGRAM INIT SESSION (For 1-click bot login)
router.post('/telegram/init-session', async (_req: Request, res: Response) => {
  try {
    const session = createAuthSession()
    const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || 'edu_foxbot'
    const botUrl = `https://t.me/${botUsername}?start=auth_${session.id}`

    return res.json({
      success: true,
      sessionId: session.id,
      botUsername,
      botUrl,
      expiresAt: session.expiresAt,
    })
  } catch (error: any) {
    console.error('Telegram init session error:', error)
    return res.status(500).json({ error: 'Failed to initialize Telegram session' })
  }
})

// 4.2 TELEGRAM CHECK SESSION STATUS (Polling from frontend)
router.get('/telegram/check-session', async (req: Request, res: Response) => {
  try {
    const sessionId = String(req.query.sessionId || '')
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    const session = getAuthSession(sessionId)
    if (!session) {
      return res.json({ success: false, status: 'expired', message: 'Session expired or not found' })
    }

    if (session.status === 'confirmed') {
      return res.json({
        success: true,
        status: 'confirmed',
        token: session.token,
        user: session.user,
        redirectUrl: session.redirectUrl || '/dashboard',
      })
    }

    return res.json({
      success: true,
      status: 'pending',
      expiresIn: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
    })
  } catch (error: any) {
    console.error('Telegram check session error:', error)
    return res.status(500).json({ error: 'Failed to check Telegram session' })
  }
})

// 4.3 TELEGRAM CONFIRM SESSION (Direct or Simulated verification)
router.post('/telegram/confirm-session', async (req: Request, res: Response) => {
  try {
    const { sessionId, id, first_name, last_name, username, photo_url } = req.body
    if (!sessionId || !id) {
      return res.status(400).json({ error: 'sessionId and Telegram id are required' })
    }

    const session = await confirmAuthSession(sessionId, {
      id,
      first_name,
      last_name,
      username,
      photo_url,
    })

    return res.json({
      success: true,
      token: session.token,
      user: session.user,
      redirectUrl: session.redirectUrl || '/dashboard',
    })
  } catch (error: any) {
    console.error('Telegram confirm session error:', error)
    return res.status(500).json({ error: error.message || 'Failed to confirm Telegram session' })
  }
})

// 4.4 TELEGRAM DIRECT / DEMO LOGIN
router.post('/telegram/direct', async (req: Request, res: Response) => {
  try {
    const { username, id, first_name, last_name } = req.body

    const cleanUsername = (username || '').replace(/^@/, '').trim()
    const targetId = id || Math.floor(100000000 + Math.random() * 900000000)

    const result = await provisionTelegramUser({
      id: targetId,
      first_name: first_name || (cleanUsername ? cleanUsername : 'Student'),
      last_name: last_name || '',
      username: cleanUsername || undefined,
    })

    return res.json({
      success: true,
      token: result.token,
      user: result.user,
      redirectUrl: result.redirectUrl || '/dashboard',
    })
  } catch (error: any) {
    console.error('Telegram direct login error:', error)
    return res.status(500).json({ error: error.message || 'Direct Telegram authentication failed' })
  }
})

// 5. GOOGLE OAUTH
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, name, picture, sub } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const nameParts = (name || '').split(' ')
    const firstName = nameParts[0] || 'Student'
    const lastName = nameParts.slice(1).join(' ') || ''

    let userRes = await query('SELECT id, email, role FROM users WHERE email = $1', [normalizedEmail])
    let userId: string

    const ADMIN_EMAILS = new Set([
      'xudayberganovbackend@gmail.com',
      'ilyoskhudayberganov@gmail.com',
      'ilyosbackend@gmail.com',
      'khilyos1219@gmail.com',
      'adilbekovfozilbek@gmail.com',
      (process.env.ADMIN_EMAIL || '').toLowerCase(),
    ].filter(Boolean))

    const isExplicitAdmin = ADMIN_EMAILS.has(normalizedEmail)
    const assignedRole = isExplicitAdmin ? 'admin' : 'student'

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id
      if (isExplicitAdmin && userRes.rows[0].role !== 'admin') {
        await query("UPDATE users SET role = 'admin' WHERE id = $1", [userId])
        await query("UPDATE profiles SET role = 'admin' WHERE user_id = $1", [userId])
      }
      await query(
        `UPDATE profiles 
         SET avatar_url = COALESCE($1, avatar_url),
             updated_at = NOW()
         WHERE user_id = $2`,
        [picture || null, userId]
      )
    } else {
      const newUserRes = await query(
        `INSERT INTO users (email, role)
         VALUES ($1, $2)
         RETURNING id, role`,
        [normalizedEmail, assignedRole]
      )
      userId = newUserRes.rows[0].id

      await query(
        `INSERT INTO profiles (user_id, first_name, last_name, avatar_url, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, firstName, lastName, picture || null, assignedRole]
      )
    }

    const fullUser = await getUserWithProfile(userId)
    if (fullUser && isExplicitAdmin) {
      fullUser.role = 'admin'
    }
    const token = generateToken({
      id: userId,
      email: fullUser.email,
      role: fullUser.role,
    })

    const redirectUrl = fullUser.onboarding_completed ? '/dashboard' : '/onboarding'

    return res.json({
      success: true,
      token,
      user: fullUser,
      redirectUrl,
    })
  } catch (error: any) {
    console.error('Google auth error:', error)
    return res.status(500).json({ error: error?.message || error?.toString() || 'Google authentication failed' })
  }
})

export default router
