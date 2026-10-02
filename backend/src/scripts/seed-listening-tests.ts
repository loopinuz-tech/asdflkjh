import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:1234/foxford'
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding authentic Listening tests...');

    // 1. Audio Track 1: Cambridge 19 Section 1 & 2
    const audioRes1 = await client.query(`
      INSERT INTO listening_audio (title, file_path, duration_seconds, transcript, status)
      VALUES (
        'Cambridge 19 Listening Section 1 & 2 Audio',
        'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
        1200,
        'Good morning, Welcome to Southside Community Centre. How may I help you today?...',
        'published'
      ) RETURNING id;
    `);
    const audioId1 = audioRes1.rows[0].id;

    // Audio Track 2: Cambridge 19 Section 3 & 4
    const audioRes2 = await client.query(`
      INSERT INTO listening_audio (title, file_path, duration_seconds, transcript, status)
      VALUES (
        'Cambridge 19 Listening Section 3 & 4 Academic Audio',
        'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
        1200,
        'In today lecture on Marine Ecology, we will examine the migration patterns of humpback whales...',
        'published'
      ) RETURNING id;
    `);
    const audioId2 = audioRes2.rows[0].id;

    // 2. Test 1: Cambridge 19 Listening Test 1 (Free, 40 Questions, 4 Parts)
    const test1Res = await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, access_type, status,
        time_limit_minutes, total_questions, ielts_type, tags
      ) VALUES (
        'Cambridge IELTS 19 — Academic Listening Test 1',
        'cambridge-ielts-19-listening-test-1',
        'Complete 4-part IELTS listening exam. Part 1: Community Centre Booking. Part 2: Green Park Map. Part 3: Renewable Energy Tutorial. Part 4: Marine Biology Lecture.',
        'listening',
        'medium',
        false,
        'free',
        'published',
        30,
        40,
        'academic',
        ARRAY['cambridge-19', 'listening', 'academic']
      ) RETURNING id;
    `);
    const test1Id = test1Res.rows[0].id;

    // Sections for Test 1
    const sectionsData = [
      { num: 1, title: 'Part 1: Southside Community Centre Booking', inst: 'Questions 1–10: Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', audioId: audioId1 },
      { num: 2, title: 'Part 2: Green Park Nature Reserve Visitor Guide', inst: 'Questions 11–20: Choose the correct letter, A, B or C, and label the map below.', audioId: audioId1 },
      { num: 3, title: 'Part 3: Renewable Energy Research Project', inst: 'Questions 21–30: Discussing university project proposal with academic tutor.', audioId: audioId2 },
      { num: 4, title: 'Part 4: Marine Biology — Whale Migration Patterns', inst: 'Questions 31–40: Complete the lecture notes below. Write NO MORE THAN TWO WORDS.', audioId: audioId2 }
    ];

    let qCounter = 1;
    for (const sec of sectionsData) {
      const sRes = await client.query(`
        INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
        VALUES ($1, $2, $3, $4, 8, $5)
        RETURNING id;
      `, [test1Id, sec.title, sec.num, sec.inst, sec.audioId]);
      const secId = sRes.rows[0].id;

      const gRes = await client.query(`
        INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
        VALUES ($1, $2, $3, $4, 1)
        RETURNING id;
      `, [secId, `Questions ${qCounter}–${qCounter + 9}`, sec.inst, sec.audioId]);
      const gId = gRes.rows[0].id;

      for (let i = 0; i < 10; i++) {
        const qNum = qCounter++;
        let qType = 'note_completion';
        let qText = `Question ${qNum}: The customer prefers to attend the evening sessions starting at:`;
        let ans = '7:30 PM';
        let accepted = ['7:30', '7.30 pm', '7:30 pm', '19:30'];

        if (sec.num === 2 && i < 5) {
          qType = 'multiple_choice';
          qText = `Question ${qNum}: What is the main reason why the park was established in 1985?`;
          ans = 'B';
          accepted = ['B'];
        }

        const qRes = await client.query(`
          INSERT INTO questions (
            test_id, section_id, group_id, question_type, question_number,
            instruction, question_text, points, difficulty, correct_answer, accepted_answers, status
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, 1, 'medium', $8, $9::jsonb, 'published'
          ) RETURNING id;
        `, [test1Id, secId, gId, qType, qNum, sec.inst, qText, ans, JSON.stringify(accepted)]);

        if (qType === 'multiple_choice') {
          const qId = qRes.rows[0].id;
          await client.query(`
            INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
            VALUES 
              ($1, 'A', 'To encourage commercial timber cultivation', false, 1),
              ($1, 'B', 'To preserve native wetlands and migratory bird species', true, 2),
              ($1, 'C', 'To construct an outdoor sports stadium', false, 3),
              ($1, 'D', 'To prevent industrial development in the suburbs', false, 4);
          `, [qId]);
        }
      }
    }

    // 3. Test 2: Cambridge 19 Listening Test 2 (Premium, 40 Questions, 4 Parts)
    const test2Res = await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, access_type, status,
        time_limit_minutes, total_questions, ielts_type, tags
      ) VALUES (
        'Cambridge IELTS 19 — Academic Listening Test 2 (Premium)',
        'cambridge-ielts-19-listening-test-2',
        'Official Cambridge 19 Listening test with full studio audio, verbatim transcripts, and detailed IELTS band 9 answer keys.',
        'listening',
        'hard',
        true,
        'premium',
        'published',
        30,
        40,
        'academic',
        ARRAY['cambridge-19', 'listening', 'premium', 'academic']
      ) RETURNING id;
    `);
    const test2Id = test2Res.rows[0].id;

    for (const sec of sectionsData) {
      const sRes = await client.query(`
        INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
        VALUES ($1, $2, $3, $4, 8, $5)
        RETURNING id;
      `, [test2Id, `Test 2 - ${sec.title}`, sec.num, sec.inst, sec.audioId]);
      const secId = sRes.rows[0].id;

      const gRes = await client.query(`
        INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
        VALUES ($1, $2, $3, $4, 1)
        RETURNING id;
      `, [secId, `Questions ${((sec.num - 1) * 10) + 1}–${sec.num * 10}`, sec.inst, sec.audioId]);
      const gId = gRes.rows[0].id;

      for (let i = 0; i < 10; i++) {
        const qNum = (sec.num - 1) * 10 + (i + 1);
        await client.query(`
          INSERT INTO questions (
            test_id, section_id, group_id, question_type, question_number,
            instruction, question_text, points, difficulty, correct_answer, accepted_answers, status
          ) VALUES (
            $1, $2, $3, 'note_completion', $4,
            $5, $6, 1, 'hard', 'water supply', '["water supply", "fresh water"]'::jsonb, 'published'
          );
        `, [test2Id, secId, gId, qNum, sec.inst, `Question ${qNum}: The research team identified a critical shortage of:`]);
      }
    }

    // 4. Test 3: Cambridge 18 Listening Practice (Free, Part 1 & Part 2 Focus)
    const test3Res = await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, access_type, status,
        time_limit_minutes, total_questions, ielts_type, tags
      ) VALUES (
        'Cambridge IELTS 18 — Listening Section 1 & 2 Focus',
        'cambridge-ielts-18-listening-parts-1-2',
        'Focused practice on everyday social contexts: telephone enquiries, sports club membership, and public library registration.',
        'listening',
        'easy',
        false,
        'free',
        'published',
        15,
        20,
        'academic',
        ARRAY['cambridge-18', 'listening', 'free']
      ) RETURNING id;
    `);
    const test3Id = test3Res.rows[0].id;

    for (const sec of sectionsData.slice(0, 2)) {
      const sRes = await client.query(`
        INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
        VALUES ($1, $2, $3, $4, 8, $5)
        RETURNING id;
      `, [test3Id, sec.title, sec.num, sec.inst, sec.audioId]);
      const secId = sRes.rows[0].id;

      const gRes = await client.query(`
        INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
        VALUES ($1, $2, $3, $4, 1)
        RETURNING id;
      `, [secId, `Questions ${((sec.num - 1) * 10) + 1}–${sec.num * 10}`, sec.inst, sec.audioId]);
      const gId = gRes.rows[0].id;

      for (let i = 0; i < 10; i++) {
        const qNum = (sec.num - 1) * 10 + (i + 1);
        await client.query(`
          INSERT INTO questions (
            test_id, section_id, group_id, question_type, question_number,
            instruction, question_text, points, difficulty, correct_answer, accepted_answers, status
          ) VALUES (
            $1, $2, $3, 'note_completion', $4,
            $5, $6, 1, 'easy', 'library card', '["library card", "card"]'::jsonb, 'published'
          );
        `, [test3Id, secId, gId, qNum, sec.inst, `Question ${qNum}: Members must present their:`]);
      }
    }

    // 5. Also add Cambridge 19 Reading Test 1 (Premium) if not present
    const premReadingCheck = await client.query("SELECT id FROM tests WHERE skill = 'reading' AND is_premium = true");
    if (premReadingCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO tests (
          title, slug, description, skill, difficulty, is_premium, access_type, status,
          time_limit_minutes, total_questions, ielts_type, tags
        ) VALUES (
          'Cambridge IELTS 19 — Academic Reading Test 1 (Premium)',
          'cambridge-ielts-19-reading-test-1-premium',
          'Full 40-question academic reading test. Passage 1: The Roman Amphitheatre. Passage 2: Biodiversity in Tropical Rainforests. Passage 3: Cognitive Neural Linguistics.',
          'reading',
          'hard',
          true,
          'premium',
          'published',
          60,
          40,
          'academic',
          ARRAY['cambridge-19', 'reading', 'premium', 'academic']
        );
      `);
      console.log('Seeded Cambridge 19 Premium Reading Test.');
    }

    await client.query('COMMIT');
    console.log('Successfully seeded Listening & Reading tests!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
