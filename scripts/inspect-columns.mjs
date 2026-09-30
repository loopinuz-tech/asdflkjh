import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const pg = require(path.resolve(__dirname, '../backend/node_modules/pg'))
const dotenv = require(path.resolve(__dirname, '../backend/node_modules/dotenv'))
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') })
const { Client } = pg

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:1234/foxford'
const client = new Client({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false }
})

async function checkColumns() {
  await client.connect()
  const tables = ['tests', 'test_sections', 'question_groups', 'questions', 'question_options', 'reading_passages', 'listening_audio', 'profiles']
  for (const table of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [table])
    console.log(`Table ${table}:`, res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '))
  }
  await client.end()
}

checkColumns()
