import pkg from '../backend/node_modules/pg/lib/index.js';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 1234,
  database: 'foxford',
  user: 'postgres',
  password: 'postgres'
});

async function inspectDb() {
  const users = await pool.query(`SELECT u.email, p.role, p.status FROM users u JOIN profiles p ON p.user_id = u.id`);
  console.log('Users in DB:', users.rows);

  const tests = await pool.query(`SELECT id, title, skill, status FROM tests`);
  console.log('Tests in DB:', tests.rows);

  const passages = await pool.query(`SELECT id, title FROM reading_passages`);
  console.log('Passages in DB:', passages.rows);

  const audio = await pool.query(`SELECT id, title FROM listening_audio`);
  console.log('Audio in DB:', audio.rows);

  const vocab = await pool.query(`SELECT count(*) FROM vocabulary_words`);
  console.log('Vocabulary Words count:', vocab.rows[0].count);

  const attempts = await pool.query(`SELECT count(*) FROM test_attempts`);
  console.log('Attempts count:', attempts.rows[0].count);

  await pool.end();
}

inspectDb().catch(console.error);
