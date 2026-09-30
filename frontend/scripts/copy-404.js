import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const src = path.join(distDir, 'index.html')
const dest = path.join(distDir, '404.html')

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest)
  console.log('✓ Generated dist/404.html for SPA fallback routing')
}
