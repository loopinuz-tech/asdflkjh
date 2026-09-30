import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  try {
    await client.query(`ALTER TYPE skill_type ADD VALUE IF NOT EXISTS 'mock';`)
    console.log("Added 'mock' to skill_type")
  } catch (err) {
    console.log("skill_type update:", err.message)
  }
  await client.end()
}

run().catch(console.error)
