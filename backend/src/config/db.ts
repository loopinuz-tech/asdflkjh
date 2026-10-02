import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/foxford'
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

export const pool = new pg.Pool({
  connectionString,
  ssl: !isLocalhost
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
})

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params)
}

import { PART_1_PROMPTS, PART_2_PROMPTS } from '../data/speaking-seeds.js'

/**
 * Ensures critical tables exist on server startup so queries never fail with "relation does not exist"
 */
export async function ensureCoreTables(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_usd', 'fixed_uzs')),
        discount_value NUMERIC(10,2) NOT NULL,
        min_order_amount NUMERIC(10,2) DEFAULT 0,
        max_uses INTEGER DEFAULT NULL,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ DEFAULT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS saved_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_type TEXT NOT NULL CHECK (item_type IN ('question', 'vocabulary', 'writing', 'speaking', 'test')),
        item_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, item_type, item_id)
      );
    `)
    console.log('✓ Verified core database tables (coupons, saved_items)')

    // Auto-seed speaking prompts if missing or low count
    await ensureSpeakingPrompts()
  } catch (err: any) {
    console.error('Warning: Error verifying core database tables:', err.message)
  }
}

/**
 * Auto-seeds 50 Part 1 and 50 Part 2 speaking prompts if database has low count
 */
export async function ensureSpeakingPrompts(): Promise<void> {
  try {
    const res = await query('SELECT count(*) FROM speaking_prompts WHERE part_number IN (1, 2);')
    const count = parseInt(res.rows[0]?.count || '0', 10)
    if (count < 50) {
      console.log(`Speaking prompts count in DB is ${count}, auto-seeding 50 Part 1 and 50 Part 2 prompts...`)
      for (const p of PART_1_PROMPTS) {
        await query(`
          INSERT INTO speaking_prompts (part_number, title, prompt_text, follow_up_questions, difficulty, is_premium, status)
          SELECT $1, $2, $3, $4, $5, $6, $7
          WHERE NOT EXISTS (SELECT 1 FROM speaking_prompts WHERE title = $2 AND part_number = $1);
        `, [p.part_number, p.title, p.prompt_text, p.follow_up_questions, p.difficulty, p.is_premium, p.status])
      }
      for (const p of PART_2_PROMPTS) {
        await query(`
          INSERT INTO speaking_prompts (part_number, title, prompt_text, follow_up_questions, difficulty, is_premium, status)
          SELECT $1, $2, $3, $4, $5, $6, $7
          WHERE NOT EXISTS (SELECT 1 FROM speaking_prompts WHERE title = $2 AND part_number = $1);
        `, [p.part_number, p.title, p.prompt_text, p.follow_up_questions, p.difficulty, p.is_premium, p.status])
      }
      console.log('✓ Auto-seeded 50 Part 1 and 50 Part 2 speaking prompts successfully!')
    }

    // Ensure only 1 topic in Part 1 and 1 topic in Part 2 are free, all others premium
    await query(`
      WITH ranked AS (
        SELECT id, part_number,
               ROW_NUMBER() OVER (PARTITION BY part_number ORDER BY created_at ASC, id ASC) as rn
        FROM speaking_prompts
      )
      UPDATE speaking_prompts sp
      SET is_premium = CASE WHEN (r.part_number IN (1, 2) AND r.rn = 1) THEN false ELSE true END
      FROM ranked r
      WHERE sp.id = r.id;
    `)
  } catch (err: any) {
    console.error('Warning: Error auto-seeding speaking prompts:', err.message)
  }
}

