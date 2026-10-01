import pg from 'pg'

const DATABASE_URL = 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    await client.connect()
    console.log('Connected to Render PostgreSQL!')

    // 1. Add missing columns to vocabulary_words
    await client.query(`
      ALTER TABLE vocabulary_words
        ADD COLUMN IF NOT EXISTS translation_uz TEXT,
        ADD COLUMN IF NOT EXISTS example_sentence_2 TEXT,
        ADD COLUMN IF NOT EXISTS synonyms TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS antonyms TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS folder_id TEXT;
    `)
    console.log('✓ Successfully added missing columns to vocabulary_words: translation_uz, example_sentence_2, synonyms, antonyms, folder_id')

    // 2. Also check if user_vocabulary has all necessary columns
    await client.query(`
      ALTER TABLE user_vocabulary
        ADD COLUMN IF NOT EXISTS folder_id TEXT;
    `)
    console.log('✓ Successfully checked user_vocabulary columns')

    // 3. Test querying vocabulary_words columns to verify
    const colRes = await client.query(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vocabulary_words'
      ORDER BY ordinal_position;
    `)
    console.log('\n--- Updated columns of vocabulary_words ---')
    console.table(colRes.rows)

    await client.end()
  } catch (err) {
    console.error('Migration failed:', err)
  }
}

run()
