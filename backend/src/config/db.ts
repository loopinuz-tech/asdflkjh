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

      CREATE TABLE IF NOT EXISTS live_speaking_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(255),
        part VARCHAR(50) DEFAULT '1',
        mode VARCHAR(50) DEFAULT 'roast',
        estimated_band NUMERIC(3,1) DEFAULT 6.0,
        transcript JSONB DEFAULT '[]'::jsonb,
        feedback_summary TEXT,
        duration_seconds INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        link VARCHAR(255) DEFAULT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS announcement_banner (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        is_active BOOLEAN NOT NULL DEFAULT false,
        text TEXT NOT NULL DEFAULT '',
        badge_text TEXT DEFAULT '',
        link_url TEXT DEFAULT '',
        link_text TEXT DEFAULT '',
        bg_color TEXT NOT NULL DEFAULT 'pink',
        icon TEXT NOT NULL DEFAULT 'sparkles',
        is_closable BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO announcement_banner (id, is_active, text, badge_text, link_url, link_text, bg_color, icon, is_closable)
      SELECT '00000000-0000-0000-0000-000000000099', false, 'New IELTS Mock tests are live! Test your skills now 🎯', 'NEW', '/practice', 'Start Practice', 'pink', 'sparkles', true
      WHERE NOT EXISTS (SELECT 1 FROM announcement_banner);

      CREATE TABLE IF NOT EXISTS shadowing_videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        movie_title TEXT NOT NULL,
        youtube_url TEXT NOT NULL,
        youtube_id TEXT NOT NULL,
        cefr_level TEXT NOT NULL DEFAULT 'B2',
        accent TEXT NOT NULL DEFAULT 'American',
        duration TEXT DEFAULT '2:30',
        description TEXT DEFAULT '',
        dialogue_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_shadowing_level ON shadowing_videos(cefr_level);
      CREATE INDEX IF NOT EXISTS idx_shadowing_accent ON shadowing_videos(accent);

      CREATE TABLE IF NOT EXISTS shadowing_pipeline_cache (
        youtube_id VARCHAR(32) PRIMARY KEY,
        pipeline_version VARCHAR(32) NOT NULL DEFAULT 'v2.0',
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_shadowing_cache_version ON shadowing_pipeline_cache(pipeline_version);
    `)
    console.log('✓ Verified core database tables (coupons, saved_items, live_speaking_sessions, notifications, announcement_banner, shadowing_videos, shadowing_pipeline_cache)')

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

