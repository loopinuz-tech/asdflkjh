import pg from 'pg'

const DATABASE_URL = 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  const diffEnum = await client.query(`
    SELECT e.enumlabel 
    FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'difficulty_level';
  `)
  console.log('difficulty_level enum:', diffEnum.rows.map(r => r.enumlabel))

  const statusEnum = await client.query(`
    SELECT e.enumlabel 
    FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'content_status';
  `)
  console.log('content_status enum:', statusEnum.rows.map(r => r.enumlabel))

  const words = await client.query('SELECT * FROM vocabulary_words LIMIT 5')
  console.log('Existing words sample:', words.rows)

  const admins = await client.query(`
    SELECT p.user_id, p.full_name, p.role, u.email 
    FROM profiles p 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE p.role = 'admin';
  `)
  console.log('Admins:', admins.rows)

  await client.end()
}

run().catch(console.error)
