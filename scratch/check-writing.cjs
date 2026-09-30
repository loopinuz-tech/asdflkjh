const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:1234/foxford' });
async function run() {
  const r = await pool.query("SELECT id, title, type FROM tests WHERE type = 'writing' LIMIT 5");
  console.log(r.rows);
  const p = await pool.query("SELECT id, title, task_type FROM writing_prompts LIMIT 5");
  console.log('PROMPTS:', p.rows);
  await pool.end();
}
run().catch(console.error);
