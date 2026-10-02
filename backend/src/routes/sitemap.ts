import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'

const router = Router()

function getBaseUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '')
  const frontendUrl = process.env.FRONTEND_URL || ''
  if (frontendUrl.includes('https://edufox.uz')) return 'https://edufox.uz'
  if (frontendUrl && !frontendUrl.includes(',')) return frontendUrl.replace(/\/+$/, '')
  return 'https://edufox.uz'
}

interface TestRow {
  id: string
  slug: string | null
  skill: string
  updated_at: string | Date
  created_at: string | Date
}

export function buildSitemapXml(tests: TestRow[], baseUrl: string = getBaseUrl()): string {
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const now = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: `${cleanBase}/`, changefreq: 'daily', priority: '1.0', lastmod: now },
    { loc: `${cleanBase}/reading`, changefreq: 'daily', priority: '0.9', lastmod: now },
    { loc: `${cleanBase}/listening`, changefreq: 'daily', priority: '0.9', lastmod: now },
    { loc: `${cleanBase}/writing`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    { loc: `${cleanBase}/speaking`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    { loc: `${cleanBase}/vocabulary`, changefreq: 'daily', priority: '0.8', lastmod: now },
    { loc: `${cleanBase}/practice`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    { loc: `${cleanBase}/premium`, changefreq: 'weekly', priority: '0.7', lastmod: now },
    { loc: `${cleanBase}/about`, changefreq: 'monthly', priority: '0.6', lastmod: now },
    { loc: `${cleanBase}/terms`, changefreq: 'monthly', priority: '0.3', lastmod: now },
    { loc: `${cleanBase}/privacy`, changefreq: 'monthly', priority: '0.3', lastmod: now },
  ]

  const testUrls: Array<{ loc: string; changefreq: string; priority: string; lastmod: string }> = []

  for (const t of tests) {
    const identifier = t.slug || t.id
    const skill = (t.skill || 'reading').toLowerCase()
    const lastmod = t.updated_at
      ? new Date(t.updated_at).toISOString().split('T')[0]
      : t.created_at
      ? new Date(t.created_at).toISOString().split('T')[0]
      : now

    // Canonical test route
    testUrls.push({
      loc: `${cleanBase}/${skill}/${identifier}`,
      changefreq: 'weekly',
      priority: '0.85',
      lastmod,
    })

    // Also support /tests/:skill/:identifier route
    testUrls.push({
      loc: `${cleanBase}/tests/${skill}/${identifier}`,
      changefreq: 'weekly',
      priority: '0.80',
      lastmod,
    })
  }

  const allUrls = [...staticUrls, ...testUrls]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`
}

// 1. XML Sitemap handler
router.get(['/sitemap.xml', '/'], async (req: Request, res: Response) => {
  try {
    const result = await query<TestRow>(`
      SELECT id, slug, skill, updated_at, created_at
      FROM tests
      WHERE (status = 'published' OR status IS NULL)
        AND (is_archived = false OR is_archived IS NULL)
      ORDER BY created_at DESC
    `)

    const xml = buildSitemapXml(result.rows)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    return res.send(xml)
  } catch (error: any) {
    console.error('Error generating dynamic sitemap.xml:', error)
    // Fallback sitemap
    const xml = buildSitemapXml([])
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    return res.send(xml)
  }
})

// 2. JSON endpoint for build script or tools
router.get('/data', async (_req: Request, res: Response) => {
  try {
    const result = await query<TestRow>(`
      SELECT id, slug, title, skill, difficulty, updated_at, created_at
      FROM tests
      WHERE (status = 'published' OR status IS NULL)
        AND (is_archived = false OR is_archived IS NULL)
      ORDER BY created_at DESC
    `)
    return res.json({ success: true, tests: result.rows })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
})

export default router
