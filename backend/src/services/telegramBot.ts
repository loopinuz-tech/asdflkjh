import crypto from 'crypto'
import { query } from '../config/db.js'
import { generateToken } from '../middleware/auth.js'

export interface TelegramUserData {
  id: number | string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date?: number
  hash?: string
}

export interface AuthSession {
  id: string
  status: 'pending' | 'confirmed' | 'expired'
  createdAt: number
  expiresAt: number
  user?: any
  token?: string
  redirectUrl?: string
}

// In-memory session store for real-time bot authentication
const authSessions = new Map<string, AuthSession>()

// Cleanup old sessions every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [id, session] of authSessions.entries()) {
    if (session.expiresAt < now) {
      authSessions.delete(id)
    }
  }
}, 5 * 60 * 1000)

/**
 * Create a new authentication session
 */
export function createAuthSession(customId?: string): AuthSession {
  const id = customId || crypto.randomBytes(12).toString('hex')
  const session: AuthSession = {
    id,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  }
  authSessions.set(id, session)
  return session
}

/**
 * Retrieve an authentication session
 */
export function getAuthSession(sessionId: string): AuthSession | null {
  const session = authSessions.get(sessionId)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    session.status = 'expired'
    authSessions.delete(sessionId)
    return null
  }
  return session
}

/**
 * Helper to fetch a full user with profile and subscription info
 */
export async function getFullUserById(userId: string) {
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

/**
 * Provision or update user from Telegram credentials
 */
export async function provisionTelegramUser(tgUser: TelegramUserData) {
  const tgId = Number(tgUser.id)
  const firstName = tgUser.first_name || 'Student'
  const lastName = tgUser.last_name || ''
  const username = tgUser.username ? tgUser.username.replace(/^@/, '') : null
  const photoUrl = tgUser.photo_url || null

  // 1. Check if user with this telegram_id exists in profiles
  const profileRes = await query('SELECT user_id FROM profiles WHERE telegram_id = $1', [tgId])
  let userId: string

  if (profileRes.rows.length > 0) {
    userId = profileRes.rows[0].user_id
    await query(
      `UPDATE profiles
       SET first_name = COALESCE(NULLIF($1, ''), first_name),
           last_name = COALESCE(NULLIF($2, ''), last_name),
           telegram_username = COALESCE(NULLIF($3, ''), telegram_username),
           avatar_url = COALESCE(NULLIF($4, ''), avatar_url),
           updated_at = NOW()
       WHERE user_id = $5`,
      [firstName, lastName, username, photoUrl, userId]
    )
  } else {
    // 2. Check if a user with synthetic email already exists
    const email = `tg_${tgId}@foxford.uz`
    const userRes = await query(
      `INSERT INTO users (email, role)
       VALUES ($1, 'student')
       ON CONFLICT (email) DO UPDATE SET email = $1
       RETURNING id, role`,
      [email]
    )
    userId = userRes.rows[0].id

    await query(
      `INSERT INTO profiles (user_id, first_name, last_name, telegram_id, telegram_username, avatar_url, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'student')
       ON CONFLICT (user_id) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         telegram_id = EXCLUDED.telegram_id,
         telegram_username = EXCLUDED.telegram_username,
         avatar_url = EXCLUDED.avatar_url`,
      [userId, firstName, lastName, tgId, username, photoUrl]
    )
  }

  const fullUser = await getFullUserById(userId)
  const token = generateToken({
    id: userId,
    email: fullUser.email,
    role: fullUser.role,
  })

  const redirectUrl = fullUser.onboarding_completed ? '/dashboard' : '/onboarding'

  return { user: fullUser, token, redirectUrl }
}

/**
 * Confirm an ongoing auth session with verified Telegram data
 */
export async function confirmAuthSession(sessionId: string, tgUser: TelegramUserData) {
  let session = authSessions.get(sessionId)
  if (!session) {
    // If not already in memory, create it as confirmed
    session = {
      id: sessionId,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    }
    authSessions.set(sessionId, session)
  }

  const result = await provisionTelegramUser(tgUser)

  session.status = 'confirmed'
  session.user = result.user
  session.token = result.token
  session.redirectUrl = result.redirectUrl

  return session
}

// -------------------------------------------------------------
// Official Telegram Bot API Integration (Long Polling & Webhook)
// -------------------------------------------------------------

async function sendTelegramMessage(chatId: number | string, text: string, extra: any = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
        ...extra,
      }),
    })
  } catch (err) {
    console.error('[Telegram Bot] Failed to send message:', err)
  }
}

/**
 * Handle incoming Telegram Update (from Webhook or Polling)
 */
export async function processTelegramUpdate(update: any) {
  if (!update || !update.message) return

  const msg = update.message
  const chatId = msg.chat?.id
  const text = (msg.text || '').trim()
  const from = msg.from || {}

  if (!chatId || !text) return

  // 1. /start auth_<sessionId>
  if (text.startsWith('/start auth_')) {
    const sessionId = text.replace('/start auth_', '').trim()
    if (sessionId) {
      try {
        await confirmAuthSession(sessionId, {
          id: from.id,
          first_name: from.first_name,
          last_name: from.last_name,
          username: from.username,
        })

        const welcomeName = from.first_name || 'Student'
        await sendTelegramMessage(
          chatId,
          `🎉 *Hello, ${welcomeName}!*\n\n` +
          `✅ Your sign-in to *Foxford IELTS* platform has been successfully confirmed.\n\n` +
          `Your browser session will automatically redirect to your dashboard.\n\n` +
          `We wish you great success in your preparation! 🚀`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🌐 Open Foxford Platform',
                    url: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'https://foxford.uz',
                  },
                ],
              ],
            },
          }
        )
        return
      } catch (err: any) {
        console.error('[Telegram Bot] Error confirming session:', err)
        await sendTelegramMessage(chatId, `❌ Failed to confirm login session. Please try again from the website.`)
        return
      }
    }
  }

  // 2. /start pay_<orderNumber>
  if (text.startsWith('/start pay_')) {
    const orderNumber = text.replace('/start pay_', '').trim()
    await sendTelegramMessage(
      chatId,
      `💳 *Foxford IELTS — Payment Order #${orderNumber}*\n\n` +
      `Your subscription payment order has been recorded. Once verified, your Pro membership features will be activated immediately.\n\n` +
      `If you have questions, please reach out to @foxford_admin.`
    )
    return
  }

  // 3. /start
  if (text === '/start') {
    const name = from.first_name || 'Student'
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'https://foxford.uz'
    await sendTelegramMessage(
      chatId,
      `👋 *Hello, ${name}!*\n\n` +
      `Welcome to the official Foxford IELTS bot!\n\n` +
      `With this bot you can:\n` +
      `• Sign in to the platform with 1 click\n` +
      `• Receive real-time exam notifications and scores\n` +
      `• Manage your membership and subscription orders\n\n` +
      `Click below to visit the platform:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Visit Platform', url: frontendUrl },
            ],
            [
              { text: '💬 Support', url: 'https://t.me/edu_foxbot' },
            ],
          ],
        },
      }
    )
    return
  }

  // 4. /help
  if (text === '/help') {
    await sendTelegramMessage(
      chatId,
      `ℹ️ *Foxford Help Center*\n\n` +
      `To sign in, click "Continue with Telegram" on the website and tap "Start" in this bot.\n\n` +
      `Contact support: @foxford_admin`
    )
    return
  }

  // 5. Default fallback message in English
  const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'https://foxford.uz'
  await sendTelegramMessage(
    chatId,
    `🤖 *Foxford IELTS Assistant*\n\n` +
    `Hello! To sign in to the platform or practice IELTS mock tests, please visit our website:\n\n` +
    `• Type /start to view options.\n` +
    `• Type /help for support and instructions.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 Open Foxford Platform', url: frontendUrl }],
          [{ text: '💬 Support', url: 'https://t.me/edu_foxbot' }],
        ],
      },
    }
  )
}

let isPolling = false
let pollOffset = 0

/**
 * Start long-polling if TELEGRAM_BOT_TOKEN is set
 */
export async function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || 'edu_foxbot'

  if (!token || token.trim() === '') {
    console.log(`[Telegram Bot] Notice: TELEGRAM_BOT_TOKEN is not configured in .env.`)
    console.log(`[Telegram Bot] Bot polling is idle. Webhook & direct session authentication remain active for @${botUsername}.`)
    return
  }

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const meData = (await meRes.json()) as any

    if (!meRes.ok || !meData.ok) {
      console.warn(`[Telegram Bot] Warning: Invalid TELEGRAM_BOT_TOKEN.`, meData)
      return
    }

    console.log(`[Telegram Bot] ✅ Successfully connected to Telegram Bot: @${meData.result.username} (ID: ${meData.result.id})`)

    if (isPolling) return
    isPolling = true

    // Start background polling loop
    const runPolling = async () => {
      while (isPolling) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${pollOffset}&timeout=25`)
          if (res.ok) {
            const data = (await res.json()) as any
            if (data.ok && Array.isArray(data.result)) {
              for (const update of data.result) {
                pollOffset = update.update_id + 1
                processTelegramUpdate(update).catch((err) => console.error('[Telegram Bot] Update error:', err))
              }
            }
          } else {
            // Wait 5s on error
            await new Promise((r) => setTimeout(r, 5000))
          }
        } catch (err: any) {
          // If aborted or network dropped, wait and retry
          await new Promise((r) => setTimeout(r, 3000))
        }
      }
    }

    runPolling()
  } catch (err) {
    console.error('[Telegram Bot] Init error:', err)
  }
}
