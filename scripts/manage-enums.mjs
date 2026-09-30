import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  const res = await client.query(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE typname = 'question_category';
  `)
  const existing = res.rows.map(r => r.enumlabel)
  console.log('Existing question_category enums:', existing)

  const toAdd = [
    'multiple_response',
    'writing_task_1',
    'writing_task_2',
    'speaking_part_1',
    'speaking_part_2',
    'speaking_part_3'
  ]

  for (const val of toAdd) {
    if (!existing.includes(val)) {
      try {
        await client.query(`ALTER TYPE question_category ADD VALUE IF NOT EXISTS '${val}';`)
        console.log(`Added enum value: ${val}`)
      } catch (err) {
        console.log(`Note for ${val}:`, err.message)
      }
    }
  }

  // Also ensure skill_type includes writing, speaking, reading, listening, mock
  const skillRes = await client.query(`
    SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'skill_type';
  `)
  console.log('Skill types:', skillRes.rows.map(r => r.enumlabel))

  await client.end()
}

run().catch(console.error)
