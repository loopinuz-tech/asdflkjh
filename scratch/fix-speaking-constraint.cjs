const pg = require('../backend/node_modules/pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:1234/foxford' });

async function fix() {
  await pool.query('ALTER TABLE speaking_submissions DROP CONSTRAINT IF EXISTS speaking_submissions_status_check');
  await pool.query("ALTER TABLE speaking_submissions ADD CONSTRAINT speaking_submissions_status_check CHECK (status IN ('submitted', 'reviewed', 'completed', 'evaluated', 'scored', 'draft'))");
  console.log('Fixed speaking_submissions constraint!');
  await pool.end();
}

fix().catch(console.error);
