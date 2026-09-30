import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    await client.connect()
    const res = await client.query('SELECT current_database(), version();')
    console.log('Connected to DB successfully:', res.rows[0])
    await client.end()
  } catch (err) {
    console.error('Connection failed:', err)
  }
}

run()
