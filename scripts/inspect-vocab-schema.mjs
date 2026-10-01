import pg from 'pg'

const DATABASE_URL = 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    await client.connect()
    console.log('✓ Successfully connected to PostgreSQL Database on Render!')

    const res = await client.query(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vocabulary_words'
      ORDER BY ordinal_position;
    `)

    console.log('\n--- Columns of vocabulary_words ---')
    console.table(res.rows)

    const allTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    console.log('\n--- All Public Tables ---')
    console.log(allTables.rows.map(r => r.table_name).join(', '))

    await client.end()
  } catch (err) {
    console.error('Database inspection failed:', err)
  }
}

run()
