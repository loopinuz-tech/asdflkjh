const path = require('path');
const pg = require(path.resolve(__dirname, '../backend/node_modules/pg'));
require(path.resolve(__dirname, '../backend/node_modules/dotenv')).config({ path: path.resolve(__dirname, '../backend/.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    const countsBefore = {
      test_attempts: (await client.query('SELECT count(*) FROM test_attempts')).rows[0].count,
      attempt_answers: (await client.query('SELECT count(*) FROM attempt_answers')).rows[0].count,
      section_scores: (await client.query('SELECT count(*) FROM section_scores')).rows[0].count,
      writing_submissions: (await client.query('SELECT count(*) FROM writing_submissions')).rows[0].count,
      writing_feedback: (await client.query('SELECT count(*) FROM writing_feedback')).rows[0].count,
      speaking_submissions: (await client.query('SELECT count(*) FROM speaking_submissions')).rows[0].count,
      speaking_feedback: (await client.query('SELECT count(*) FROM speaking_feedback')).rows[0].count,
      progress: (await client.query('SELECT count(*) FROM progress')).rows[0].count,
    };
    console.log('Counts before deletion:', countsBefore);

    // Perform deletion in a transaction
    await client.query('BEGIN');

    // 1. Delete reading/listening attempt answers and section scores
    await client.query('DELETE FROM attempt_answers');
    await client.query('DELETE FROM section_scores');
    await client.query('DELETE FROM test_attempts');

    // 2. Delete writing feedback and submissions
    await client.query('DELETE FROM writing_feedback');
    await client.query('DELETE FROM writing_submissions');

    // 3. Delete speaking feedback and submissions
    await client.query('DELETE FROM speaking_feedback');
    await client.query('DELETE FROM speaking_submissions');

    // 4. Delete progress history
    await client.query('DELETE FROM progress');

    await client.query('COMMIT');
    console.log('Successfully cleared all test attempts, submissions, and attempt progress!');

    const countsAfter = {
      test_attempts: (await client.query('SELECT count(*) FROM test_attempts')).rows[0].count,
      attempt_answers: (await client.query('SELECT count(*) FROM attempt_answers')).rows[0].count,
      section_scores: (await client.query('SELECT count(*) FROM section_scores')).rows[0].count,
      writing_submissions: (await client.query('SELECT count(*) FROM writing_submissions')).rows[0].count,
      writing_feedback: (await client.query('SELECT count(*) FROM writing_feedback')).rows[0].count,
      speaking_submissions: (await client.query('SELECT count(*) FROM speaking_submissions')).rows[0].count,
      speaking_feedback: (await client.query('SELECT count(*) FROM speaking_feedback')).rows[0].count,
      progress: (await client.query('SELECT count(*) FROM progress')).rows[0].count,
    };
    console.log('Counts after deletion:', countsAfter);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during clearing attempts:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
