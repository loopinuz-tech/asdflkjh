import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

const connectionString = process.argv[2] || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/foxford'

console.log(`Connecting to PostgreSQL at: ${connectionString.replace(/:[^:@]+@/, ':***@')}`)

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

const pool = new pg.Pool({
  connectionString,
  ssl: !isLocalhost 
    ? { rejectUnauthorized: false } 
    : false
})

async function initDB() {
  const client = await pool.connect()
  try {
    console.log('Connected to PostgreSQL successfully!')

    // 1. Run Schema
    console.log('Running schema.sql...')
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
    await client.query(schemaSql)
    console.log('Schema created successfully!')

    // 2. Run Seed
    console.log('Running seed.sql...')
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8')
    await client.query(seedSql)
    console.log('Seed data inserted successfully!')

    // 3. Ensure Admin account exists with guaranteed password 'AdminPassword123!'
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!'
    const salt = await bcrypt.genSalt(10)
    const adminHash = await bcrypt.hash(adminPassword, salt)

    const adminEmail = process.env.ADMIN_EMAIL || 'xudayberganovbackend@gmail.com'
    const adminUserRes = await client.query(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 'admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'admin'
      RETURNING id;
    `, [adminEmail, adminHash])

    const adminUserId = adminUserRes.rows[0]?.id || (
      await client.query('SELECT id FROM users WHERE email = $1', [adminEmail])
    ).rows[0].id

    await client.query(`
      INSERT INTO profiles (user_id, first_name, last_name, role, target_band, onboarding_completed)
      VALUES ($1, 'Super', 'Admin', 'admin', 9.0, true)
      ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    `, [adminUserId])
    console.log(`Superadmin verified: ${adminEmail} (password: ${adminPassword})`)

    console.log('==============================================')
    console.log('DATABASE INITIALIZATION COMPLETED SUCCESSFULLY!')
    console.log('==============================================')
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

initDB()
