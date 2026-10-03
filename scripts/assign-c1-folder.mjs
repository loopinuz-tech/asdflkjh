import pg from 'pg'

const DATABASE_URL = 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  const res = await client.query(`
    UPDATE vocabulary_words
    SET folder_id = 'folder-c1-academic'
    WHERE cefr_level = 'C1' OR difficulty = 'hard';
  `)
  console.log('✓ Successfully assigned words to folder-c1-academic! Updated rows:', res.rowCount)

  const check = await client.query(`
    SELECT count(id) AS total_in_folder 
    FROM vocabulary_words 
    WHERE folder_id = 'folder-c1-academic';
  `)
  console.log('Total words now in folder-c1-academic:', check.rows[0].total_in_folder)

  await client.end()
}

run().catch(console.error)
