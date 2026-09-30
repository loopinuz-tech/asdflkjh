import pg from 'pg'
import fs from 'fs'
const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function migrate() {
  await client.connect()
  console.log('Connected to PostgreSQL')
  const sql = fs.readFileSync('supabase/migrations/20260916000001_performance_indexes.sql', 'utf-8')
  await client.query(sql)
  console.log('Migration executed successfully!')
  await client.end()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
