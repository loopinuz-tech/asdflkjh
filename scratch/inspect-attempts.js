import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 1234,
  database: 'foxford',
  user: 'postgres',
  password: 'postgres'
});

async function main() {
  const r1 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'test_attempts'");
  console.log('test_attempts:', r1.rows.map(c => `${c.column_name} (${c.data_type})`));

  const r2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attempt_answers'");
  console.log('attempt_answers:', r2.rows.map(c => `${c.column_name} (${c.data_type})`));

  const r3 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions'");
  console.log('questions:', r3.rows.map(c => `${c.column_name} (${c.data_type})`));

  const r4 = await pool.query("SELECT a.*, p.first_name, p.last_name, u.email, t.title FROM test_attempts a LEFT JOIN profiles p ON p.user_id = a.user_id LEFT JOIN users u ON u.id = a.user_id LEFT JOIN tests t ON t.id = a.test_id ORDER BY a.created_at DESC LIMIT 5");
  console.log('recent attempts count:', r4.rows.length);
  if (r4.rows.length > 0) {
    console.log('sample attempt:', JSON.stringify(r4.rows[0], null, 2));
  }

  await pool.end();
}

main().catch(console.error);
