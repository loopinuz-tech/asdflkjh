import pg from 'pg'

const DATABASE_URL = 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  console.log('Connected to PostgreSQL...')

  await client.query(`
    ALTER TABLE vocabulary_words
      ADD COLUMN IF NOT EXISTS translation TEXT,
      ADD COLUMN IF NOT EXISTS context_sentence TEXT,
      ADD COLUMN IF NOT EXISTS collocations TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS cefr_level TEXT,
      ADD COLUMN IF NOT EXISTS audio_url TEXT;
  `)

  // Copy existing translation_uz to translation and vice versa if any
  await client.query(`
    UPDATE vocabulary_words 
    SET translation = COALESCE(translation, translation_uz),
        translation_uz = COALESCE(translation_uz, translation),
        context_sentence = COALESCE(context_sentence, example_sentence_2),
        example_sentence_2 = COALESCE(example_sentence_2, context_sentence);
  `)

  const res = await client.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'vocabulary_words'
    ORDER BY ordinal_position;
  `)
  console.table(res.rows)
  await client.end()
  console.log('Migration completed successfully!')
}

run()
