import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 1234,
  database: 'foxford',
  user: 'postgres',
  password: 'postgres'
});

async function checkCols() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_vocabulary'
  `);
  console.log('Columns of user_vocabulary:', res.rows);
  await pool.end();
}

checkCols().catch(console.error);
