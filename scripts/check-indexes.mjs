import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkIndexes() {
  await client.connect()
  const res = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `)
  console.log('Existing indexes in public schema:')
  res.rows.forEach(r => console.log(`${r.tablename}: ${r.indexname}`))
  await client.end()
}

checkIndexes().catch(console.error)
