// Test DB size queries on Render PostgreSQL
const { Client } = require('pg')

async function test() {
  const client = new Client({
    connectionString: 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford',
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('Connected!')
    
    // Test 1: pg_database_size
    try {
      const r1 = await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as size, current_database() as dbname")
      console.log('DB Size:', r1.rows[0])
    } catch(e) {
      console.log('pg_database_size error:', e.message)
    }
    
    // Test 2: pg_total_relation_size (per table)
    try {
      const r2 = await client.query(`
        SELECT schemaname, tablename,
               pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `)
      console.log('Table sizes:', r2.rows)
    } catch(e) {
      console.log('Table size error:', e.message)
    }
    
    // Test 3: Check current user role
    const r3 = await client.query("SELECT current_user, pg_is_in_recovery()")
    console.log('User info:', r3.rows[0])
    
  } finally {
    await client.end()
  }
}
test().catch(console.error)
