import pg from 'pg'

const connectionString = 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('Connected to DB.')

  // Check if user_id column exists
  const check = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'vocabulary_words' AND column_name = 'user_id'
  `)

  if (check.rows.length === 0) {
    console.log('Adding user_id column to vocabulary_words...')
    await client.query(`
      ALTER TABLE vocabulary_words
      ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    `)
    console.log('✓ user_id column added!')
  } else {
    console.log('user_id column already exists.')
  }

  // Also check existing words in vocabulary_words
  const countRes = await client.query('SELECT count(*) FROM vocabulary_words')
  console.log(`Total words in vocabulary_words: ${countRes.rows[0].count}`)

  await client.end()
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
