import { Router, Request, Response } from 'express'
import { processTelegramUpdate } from '../services/telegramBot.js'

const router = Router()

/**
 * 1. TELEGRAM WEBHOOK ENDPOINT
 * Can be called by Telegram when webhook is configured
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body
    if (update) {
      // Process in background to immediately return 200 OK to Telegram
      processTelegramUpdate(update).catch((err) => {
        console.error('[Telegram Webhook] Processing error:', err)
      })
    }
    return res.status(200).json({ ok: true })
  } catch (error: any) {
    console.error('[Telegram Webhook] Route error:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
})

/**
 * 2. TELEGRAM BOT STATUS & DOMAIN INSTRUCTIONS
 * Provides diagnostics for admin and client
 */
router.get('/status', async (_req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || 'edu_foxbot'
  const hasToken = Boolean(token && token.trim() !== '')

  let botInfo: any = null
  let botError: string | null = null

  if (hasToken) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      const json = (await resp.json()) as any
      if (json.ok) {
        botInfo = json.result
      } else {
        botError = json.description || 'Invalid token'
      }
    } catch (err: any) {
      botError = err.message || 'Network error fetching bot details'
    }
  }

  return res.json({
    success: true,
    botUsername,
    hasToken,
    botInfo,
    botError,
    instructions: {
      step1: "Telegram'da @BotFather ga kiring",
      step2: "/setdomain buyrug'ini yuboring",
      step3: `@${botUsername} botini tanlang`,
      step4: "Saytingiz domenini kiriting (masalan: foxford.uz yoki VPS IP)",
      step5: "Tokenni backend/.env faylida TELEGRAM_BOT_TOKEN ga yozing",
      botFatherLink: "https://t.me/BotFather",
    },
  })
})

export default router
