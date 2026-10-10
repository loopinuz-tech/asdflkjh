import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import authRouter from './routes/auth.js'
import testsRouter from './routes/tests.js'
import progressRouter from './routes/progress.js'
import vocabularyRouter from './routes/vocabulary.js'
import settingsRouter from './routes/settings.js'
import adminRouter from './routes/admin.js'
import mediaRouter from './routes/media.js'
import dataProxyRouter from './routes/data-proxy.js'
import subscriptionsRouter from './routes/subscriptions.js'
import savedRouter from './routes/saved.js'
import sitemapRouter from './routes/sitemap.js'
import telegramRouter from './routes/telegram.js'
import speakingLiveRouter from './routes/speaking-live.js'
import notificationsRouter from './routes/notifications.js'
import announcementBannerRouter from './routes/announcement-banner.js'
import shadowingRouter from './routes/shadowing.js'
import { initTelegramBot } from './services/telegramBot.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
}))
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use('/uploads', express.static(uploadsDir))

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/tests', testsRouter)
app.use('/api/progress', progressRouter)
app.use('/api/vocabulary', vocabularyRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/media', mediaRouter)
app.use('/api/data', dataProxyRouter)
app.use('/api/subscriptions', subscriptionsRouter)
app.use('/api/saved', savedRouter)
app.use('/api/telegram', telegramRouter)
app.use('/api/speaking-live', speakingLiveRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/announcement-banner', announcementBannerRouter)
app.use('/api/shadowing', shadowingRouter)
app.use('/api/sitemap', sitemapRouter)
app.use('/sitemap.xml', sitemapRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
})

import { pool, ensureCoreTables } from './config/db.js'

app.listen(PORT, async () => {
  console.log(`===========================================`)
  console.log(`FOX FORD API Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  console.log(`Uploads URL:  http://localhost:${PORT}/uploads/`)
  console.log(`===========================================`)

  // Ensure critical database tables exist
  await ensureCoreTables()

  // Initialize Telegram Bot service (if TELEGRAM_BOT_TOKEN is set)
  initTelegramBot().catch((err) => {
    console.error('Failed to initialize Telegram Bot:', err)
  })
})

export default app
