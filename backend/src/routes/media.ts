import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'
import { optionalAuth } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Cloudinary setup (if env vars provided) ─────────────────────────────────
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  console.log('[Media] Cloudinary storage enabled ✅')
} else {
  console.warn('[Media] Cloudinary env vars not set — falling back to local disk ⚠️')
}

// ─── Local disk fallback (ephemeral on Render) ────────────────────────────────
const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Use memoryStorage so we can pipe to Cloudinary OR write to disk
const memStorage = multer.memoryStorage()
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage: useCloudinary ? memStorage : diskStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
})

const router = Router()

// ─── POST /api/media/upload ───────────────────────────────────────────────────
router.post('/upload', optionalAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // ── Path A: Cloudinary ──────────────────────────────────────────────────
    if (useCloudinary) {
      const mimeType = req.file.mimetype
      const isImage = mimeType.startsWith('image/')
      const isAudio = mimeType.startsWith('audio/')

      // Convert buffer to base64 data URI for upload_stream alternative
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'foxford',
            resource_type: isAudio ? 'video' : isImage ? 'image' : 'raw',
            use_filename: false,
            unique_filename: true,
            // Optimize images automatically
            ...(isImage && {
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            }),
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        uploadStream.end(req.file!.buffer)
      })

      return res.json({
        success: true,
        fileUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        filename: uploadResult.original_filename,
        size: uploadResult.bytes,
        mimetype: req.file.mimetype,
        width: uploadResult.width,
        height: uploadResult.height,
        provider: 'cloudinary',
      })
    }

    // ── Path B: Local disk (dev / ephemeral fallback) ───────────────────────
    const fileUrl = `/uploads/${(req.file as Express.Multer.File & { filename: string }).filename}`
    return res.json({
      success: true,
      fileUrl,
      filename: (req.file as any).filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      provider: 'local',
    })
  } catch (error: any) {
    console.error('[Media] Upload error:', error)
    return res.status(500).json({ error: 'Failed to upload file', details: error.message })
  }
})

// ─── DELETE /api/media/delete ─────────────────────────────────────────────────
router.delete('/delete', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { publicId, fileUrl } = req.body

    if (useCloudinary && publicId) {
      await cloudinary.uploader.destroy(publicId)
      return res.json({ success: true, message: 'File deleted from Cloudinary' })
    }

    // Local disk delete
    if (fileUrl) {
      const filename = path.basename(fileUrl)
      const filePath = path.join(uploadsDir, filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      return res.json({ success: true, message: 'File deleted from local disk' })
    }

    return res.status(400).json({ error: 'No publicId or fileUrl provided' })
  } catch (error: any) {
    console.error('[Media] Delete error:', error)
    return res.status(500).json({ error: 'Failed to delete file', details: error.message })
  }
})

// ─── GET /api/media/config ────────────────────────────────────────────────────
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    provider: useCloudinary ? 'cloudinary' : 'local',
    cloudName: useCloudinary ? process.env.CLOUDINARY_CLOUD_NAME : null,
    maxFileSize: '50MB',
  })
})

export default router
