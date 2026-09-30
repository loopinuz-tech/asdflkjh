import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const distDir = path.join(rootDir, 'dist')

// 1. Resolve site base URL
const BASE_URL = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  'https://edufox.uz'
).replace(/\/+$/, '')

// Helper to load env file lines
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const k = trimmed.substring(0, idx).trim()
      let v = trimmed.substring(idx + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      env[k] = v
    }
  }
  return env
}

const envBackend = parseEnv(path.resolve(rootDir, '../backend/.env'))
const envRoot = parseEnv(path.resolve(rootDir, '../.env'))
const envLocal = parseEnv(path.resolve(rootDir, '.env.local'))

const DATABASE_URL =
  process.env.DATABASE_URL ||
  envBackend.DATABASE_URL ||
  envRoot.DATABASE_URL ||
  envLocal.DATABASE_URL ||
  'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

const BACKEND_API_URL = (
  process.env.VITE_BACKEND_URL ||
  envLocal.VITE_BACKEND_URL ||
  'https://edufox-backend.onrender.com'
).replace(/\/+$/, '')

// Known seed fallback tests in case database and API are unreachable during offline builds
const FALLBACK_TESTS = [
  {
    slug: 'ielts-academic-reading-test-3',
    skill: 'reading',
    updated_at: '2026-09-28'
  },
  {
    slug: 'ielts-listening-practice-test-1',
    skill: 'listening',
    updated_at: '2026-09-28'
  }
]

async function fetchTestsFromDatabase() {
  try {
    // Try dynamically importing pg if available
    let pg
    try {
      pg = await import('pg')
    } catch {
      try {
        const { pathToFileURL } = await import('url')
        const backendPgPath = path.resolve(rootDir, '../backend/node_modules/pg/lib/index.js')
        if (fs.existsSync(backendPgPath)) {
          pg = await import(pathToFileURL(backendPgPath).href)
        }
      } catch (e) {
        console.warn('Backend pg import failed:', e.message)
      }
    }

    if (!pg || !DATABASE_URL) return null

    const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
    const Client = pg.default?.Client || pg.Client
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: !isLocalhost ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000
    })

    await client.connect()
    const res = await client.query(`
      SELECT id, slug, skill, updated_at, created_at
      FROM tests
      WHERE (status = 'published' OR status IS NULL)
        AND (is_archived = false OR is_archived IS NULL)
      ORDER BY created_at DESC;
    `)
    await client.end()

    if (res.rows && res.rows.length > 0) {
      console.log(`✓ Fetched ${res.rows.length} tests directly from PostgreSQL for sitemap`)
      return res.rows
    }
  } catch (err) {
    console.warn('Note: Could not query database directly for sitemap:', err.message)
  }
  return null
}

function fetchTestsFromApi() {
  return new Promise((resolve) => {
    const url = `${BACKEND_API_URL}/api/sitemap/data`
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { timeout: 4000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.success && Array.isArray(json.tests) && json.tests.length > 0) {
            console.log(`✓ Fetched ${json.tests.length} tests from backend API for sitemap`)
            return resolve(json.tests)
          }
        } catch {}
        resolve(null)
      })
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => {
      req.destroy()
      resolve(null)
    })
  })
}

function generateXml(tests) {
  const now = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: now },
    { loc: `${BASE_URL}/reading`, changefreq: 'daily', priority: '0.9', lastmod: now },
    { loc: `${BASE_URL}/listening`, changefreq: 'daily', priority: '0.9', lastmod: now },
    { loc: `${BASE_URL}/writing`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    { loc: `${BASE_URL}/speaking`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    { loc: `${BASE_URL}/vocabulary`, changefreq: 'daily', priority: '0.8', lastmod: now },
    { loc: `${BASE_URL}/practice`, changefreq: 'weekly', priority: '0.8', lastmod: now },
    { loc: `${BASE_URL}/premium`, changefreq: 'weekly', priority: '0.7', lastmod: now },
    { loc: `${BASE_URL}/about`, changefreq: 'monthly', priority: '0.6', lastmod: now },
    { loc: `${BASE_URL}/terms`, changefreq: 'monthly', priority: '0.3', lastmod: now },
    { loc: `${BASE_URL}/privacy`, changefreq: 'monthly', priority: '0.3', lastmod: now },
  ]

  const testUrls = []
  const seenUrls = new Set()

  for (const t of tests) {
    const identifier = t.slug || t.id
    if (!identifier) continue
    const skill = (t.skill || 'reading').toLowerCase()
    const lastmod = t.updated_at
      ? new Date(t.updated_at).toISOString().split('T')[0]
      : t.created_at
      ? new Date(t.created_at).toISOString().split('T')[0]
      : now

    const primaryUrl = `${BASE_URL}/${skill}/${identifier}`
    if (!seenUrls.has(primaryUrl)) {
      seenUrls.add(primaryUrl)
      testUrls.push({
        loc: primaryUrl,
        changefreq: 'weekly',
        priority: '0.85',
        lastmod
      })
    }

    const testRoute = `${BASE_URL}/tests/${skill}/${identifier}`
    if (!seenUrls.has(testRoute)) {
      seenUrls.add(testRoute)
      testUrls.push({
        loc: testRoute,
        changefreq: 'weekly',
        priority: '0.80',
        lastmod
      })
    }
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
</urlset>
`
}

function generateRobotsTxt() {
  return `# robots.txt for EduFox (FOX FORD) IELTS Platform
User-agent: *
Allow: /
Allow: /reading
Allow: /listening
Allow: /writing
Allow: /speaking
Allow: /vocabulary
Allow: /practice
Allow: /premium
Allow: /about
Allow: /privacy
Allow: /terms
Allow: /reading/*
Allow: /listening/*
Allow: /tests/reading/*
Allow: /tests/listening/*
Allow: /tests/writing/*
Allow: /tests/speaking/*

# Disallow private user states & admin panel
Disallow: /admin
Disallow: /admin/*
Disallow: /dashboard/settings
Disallow: /settings
Disallow: /auth/callback
Disallow: /onboarding

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml
`
}

async function main() {
  console.log('🔄 Generating sitemap.xml and robots.txt for EduFox...')

  // 1. Try live API first (reflects live deployed database on Render!), then DB, then Fallback
  let tests = await fetchTestsFromApi()
  if (!tests || tests.length === 0) {
    tests = await fetchTestsFromDatabase()
  }
  if (!tests || tests.length === 0) {
    console.log(`ℹ Using ${FALLBACK_TESTS.length} verified fallback test entries for sitemap`)
    tests = FALLBACK_TESTS
  }

  const xml = generateXml(tests)
  const robots = generateRobotsTxt()

  // Ensure directories exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  const publicSitemap = path.join(publicDir, 'sitemap.xml')
  const publicRobots = path.join(publicDir, 'robots.txt')

  fs.writeFileSync(publicSitemap, xml, 'utf8')
  fs.writeFileSync(publicRobots, robots, 'utf8')
  console.log(`✓ Wrote ${publicSitemap}`)
  console.log(`✓ Wrote ${publicRobots}`)

  // Also write to dist/ if it exists (for post-build)
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8')
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robots, 'utf8')
    console.log('✓ Synced sitemap.xml and robots.txt to dist/')
  }

  console.log(`✅ Sitemap generation completed with ${tests.length} tests included!`)
}

main().catch((err) => {
  console.error('Failed to generate sitemap:', err)
})
