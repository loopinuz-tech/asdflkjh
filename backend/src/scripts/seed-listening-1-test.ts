import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const connectionString = process.argv[2] || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/foxford';
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString,
  ssl: !isLocalhost ? { rejectUnauthorized: false } : false
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding IELTS Listening Test 1 (Version K5002) with 4 parts and 1 shared audio...');

    // 0. Remove older version of this test if previously inserted to avoid duplicates
    const existingTest = await client.query(`SELECT id FROM tests WHERE slug = 'ielts-listening-practice-test-1-k5002'`);
    if (existingTest.rows.length > 0) {
      console.log('Deleting existing test version...');
      await client.query(`DELETE FROM tests WHERE id = $1`, [existingTest.rows[0].id]);
    }

    // 1. Audio Track: 1 MP3 for all 4 parts
    const audioRes = await client.query(`
      INSERT INTO listening_audio (title, file_path, duration_seconds, transcript, status)
      VALUES (
        'IELTS Listening Test 1 — Full Audio (Parts 1–4)',
        '/uploads/listening-1.mp3',
        1800,
        'Full 4-part audio track for Version K5002',
        'published'
      ) RETURNING id;
    `);
    const audioId = audioRes.rows[0].id;
    console.log('Created audio with ID:', audioId);

    // 2. Insert Test
    const testRes = await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, access_type, status,
        time_limit_minutes, total_questions, ielts_type, tags
      ) VALUES (
        'IELTS Listening Practice Test 1 (Version K5002)',
        'ielts-listening-practice-test-1-k5002',
        'Authentic IELTS Listening Exam (Version K5002) with 40 questions. Part 1: Job Details. Part 2: Accommodation & Local Map. Part 3: Eyewitness Reliability. Part 4: Plastics Exhibition.',
        'listening',
        'medium',
        false,
        'free',
        'published',
        30,
        40,
        'academic',
        ARRAY['listening', 'cambridge', 'mock', 'k5002', 'part_1', 'part_2', 'part_3', 'part_4']
      ) RETURNING id;
    `);
    const testId = testRes.rows[0].id;
    console.log('Created Test with ID:', testId);

    // -------------------------------------------------------------
    // PART 1: Job Details (Questions 1–10)
    // -------------------------------------------------------------
    const sec1Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 1: Job Details', 1, 'Questions 1–10: Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec1Id = sec1Res.rows[0].id;

    const grp1Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
      VALUES ($1, 'Questions 1–10: Job Details', 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.', $2, 1)
      RETURNING id;
    `, [sec1Id, audioId]);
    const grp1Id = grp1Res.rows[0].id;

    const part1Questions = [
      {
        num: 1,
        text: 'Job available now in the: [1] Branch',
        ans: 'Station',
        accepted: ['Station', 'station', 'Station Road', 'station road']
      },
      {
        num: 2,
        text: 'Days/hours of work: [2] (all day)',
        ans: 'Sunday',
        accepted: ['Sunday', 'sunday', 'Sundays', 'sundays']
      },
      {
        num: 3,
        text: 'Working on checkout: [3] Heavy items',
        ans: 'lifting',
        accepted: ['lifting', 'Lifting']
      },
      {
        num: 4,
        text: 'Dealing with customer enquiries: [4] The plants',
        ans: 'watering',
        accepted: ['watering', 'Watering']
      },
      {
        num: 5,
        text: 'Good: [5] skills',
        ans: 'communication',
        accepted: ['communication', 'Communication']
      },
      {
        num: 6,
        text: 'Basic ability in: [6] skills',
        ans: 'maths',
        accepted: ['maths', 'Maths', 'math', 'Math']
      },
      {
        num: 7,
        text: 'Interview arranged for: [7] on Wednesday this week',
        ans: '5',
        accepted: ['5', '5pm', '5 pm', '5:00', '5:00 pm', '5.00', '5.00 pm', '17:00']
      },
      {
        num: 8,
        text: 'Name of interviewer: Maria [8]',
        ans: 'Rapana',
        accepted: ['Rapana', 'rapana']
      },
      {
        num: 9,
        text: 'Contact number: [9]',
        ans: '021 303 8874',
        accepted: ['021 303 8874', '0213038874', '021-303-8874']
      },
      {
        num: 10,
        text: 'Should take his: [10] to the interview',
        ans: 'passport',
        accepted: ['passport', 'Passport']
      }
    ];

    for (const q of part1Questions) {
      await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number,
          instruction, question_text, correct_answer, accepted_answers, points
        ) VALUES ($1, $2, $3, 'note_completion', $4, 'Write ONE WORD AND/OR A NUMBER for each answer.', $5, $6, $7, 1);
      `, [testId, sec1Id, grp1Id, q.num, q.text, q.ans, JSON.stringify(q.accepted)]);
    }

    // -------------------------------------------------------------
    // PART 2: Accommodation Features & Local Area Map (Questions 11–20)
    // -------------------------------------------------------------
    const sec2Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 2: Accommodation & Local Area Map', 2, 'Questions 11–14: Which type of accommodation includes the following features? Questions 15–20: Label the map below.', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec2Id = sec2Res.rows[0].id;

    // Group 1: 11–14 (Matching Features)
    const grp2A_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
      VALUES ($1, 'Questions 11–14: Types of accommodation', 'Which type of accommodation includes the following features?\nWrite the correct letter, A, B or C, next to questions 11–14.\n\nA: the flat\nB: the house\nC: the hostel', $2, 1)
      RETURNING id;
    `, [sec2Id, audioId]);
    const grp2A_Id = grp2A_Res.rows[0].id;

    const accomOptions = [
      { key: 'A', text: 'the flat' },
      { key: 'B', text: 'the house' },
      { key: 'C', text: 'the hostel' }
    ];

    const part2AQuestions = [
      { num: 11, text: 'a garden', ans: 'A' },
      { num: 12, text: 'a garage', ans: 'A' },
      { num: 13, text: 'an alarm system', ans: 'B' },
      { num: 14, text: 'new furniture', ans: 'B' }
    ];

    for (const q of part2AQuestions) {
      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number,
          instruction, question_text, correct_answer, accepted_answers, points
        ) VALUES ($1, $2, $3, 'multiple_choice', $4, 'Choose the correct letter, A, B or C.', $5, $6, $7, 1)
        RETURNING id;
      `, [testId, sec2Id, grp2A_Id, q.num, q.text, q.ans, JSON.stringify([q.ans, q.ans.toLowerCase()])]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < accomOptions.length; i++) {
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, accomOptions[i].key, accomOptions[i].text, accomOptions[i].key === q.ans, i + 1]);
      }
    }

    // Group 2: 15–20 (Map Labeling)
    const grp2B_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
      VALUES ($1, 'Questions 15–20: Map of the area', 'Label the map below. Write the correct letter, A–J, next to questions 15–20.', $2, 2)
      RETURNING id;
    `, [sec2Id, audioId]);
    const grp2B_Id = grp2B_Res.rows[0].id;

    const mapOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(l => ({
      key: l,
      text: `Location ${l}`
    }));

    const part2BQuestions = [
      { num: 15, text: 'the bank', ans: 'E' },
      { num: 16, text: 'the house', ans: 'I' },
      { num: 17, text: 'the hostel', ans: 'J' },
      { num: 18, text: 'the flat', ans: 'A' },
      { num: 19, text: 'the post office', ans: 'C' },
      { num: 20, text: 'the bus stop', ans: 'G' }
    ];

    const mapHtmlHeader = `<div class="mb-4 text-center"><img src="/uploads/map-k5002.png" alt="Map for Questions 15–20" class="max-w-full sm:max-w-md mx-auto rounded-xl border border-border shadow-xs" /></div>`;

    for (let idx = 0; idx < part2BQuestions.length; idx++) {
      const q = part2BQuestions[idx];
      const qHtml = (idx === 0 ? mapHtmlHeader : '') + `<p class="font-medium">${q.num}. <strong>${q.text}</strong></p>`;

      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number,
          instruction, question_text, question_html, image_url, correct_answer, accepted_answers, points
        ) VALUES ($1, $2, $3, 'multiple_choice', $4, 'Write the correct letter, A–J.', $5, $6, '/uploads/map-k5002.png', $7, $8, 1)
        RETURNING id;
      `, [testId, sec2Id, grp2B_Id, q.num, q.text, qHtml, q.ans, JSON.stringify([q.ans, q.ans.toLowerCase()])]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < mapOptions.length; i++) {
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, mapOptions[i].key, mapOptions[i].text, mapOptions[i].key === q.ans, i + 1]);
      }
    }

    // -------------------------------------------------------------
    // PART 3: Eyewitness Reliability & Child Witnesses (Questions 21–30)
    // -------------------------------------------------------------
    const sec3Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 3: Eyewitness Reliability', 3, 'Questions 21–26: Choose the correct letter, A, B or C. Questions 27–30: Choose FOUR answers from the box (A–F).', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec3Id = sec3Res.rows[0].id;

    // Group 1: 21–26 (MCQs)
    const grp3A_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
      VALUES ($1, 'Questions 21–26: Eyewitness reliability', 'Choose the correct letter, A, B or C.', $2, 1)
      RETURNING id;
    `, [sec3Id, audioId]);
    const grp3A_Id = grp3A_Res.rows[0].id;

    const part3AQuestions = [
      {
        num: 21,
        text: 'Eleanor thinks eyewitnesses are believed when',
        ans: 'B',
        options: [
          { key: 'A', text: 'they are respected members of the community.' },
          { key: 'B', text: 'they make their statements with confidence.' },
          { key: 'C', text: 'they use sophisticated language in their accounts.' }
        ]
      },
      {
        num: 22,
        text: 'What concerns Eleanor and Jamie about the texts they have read so far?',
        ans: 'C',
        options: [
          { key: 'A', text: 'No clear conclusions are reached.' },
          { key: 'B', text: 'The studies involved comparatively few people.' },
          { key: 'C', text: 'Some of the data were gathered some time ago.' }
        ]
      },
      {
        num: 23,
        text: 'They agree that the most significant factor affecting eyewitness reliability is',
        ans: 'B',
        options: [
          { key: 'A', text: 'how good the lighting is.' },
          { key: 'B', text: 'how long the event lasts.' },
          { key: 'C', text: 'how far away the witness is.' }
        ]
      },
      {
        num: 24,
        text: 'Jamie criticises photo-identifications, saying witnesses',
        ans: 'A',
        options: [
          { key: 'A', text: 'fail to compare the photos with their memory of the event.' },
          { key: 'B', text: 'are not properly briefed about the procedure.' },
          { key: 'C', text: 'become easily influenced by a figure of authority.' }
        ]
      },
      {
        num: 25,
        text: "They agree that the term 'naive observer' means a person who",
        ans: 'C',
        options: [
          { key: 'A', text: 'has no experience of a police investigation.' },
          { key: 'B', text: 'did not realise they were witnessing a crime.' },
          { key: 'C', text: 'was not present at the incident.' }
        ]
      },
      {
        num: 26,
        text: 'They have learned that witnesses are reluctant to change their opinions because',
        ans: 'A',
        options: [
          { key: 'A', text: 'they do not want to appear foolish.' },
          { key: 'B', text: 'they fear the legal consequences.' },
          { key: 'C', text: 'they are keen for the case to be concluded.' }
        ]
      }
    ];

    for (const q of part3AQuestions) {
      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number,
          instruction, question_text, correct_answer, accepted_answers, points
        ) VALUES ($1, $2, $3, 'multiple_choice', $4, 'Choose the correct letter, A, B or C.', $5, $6, $7, 1)
        RETURNING id;
      `, [testId, sec3Id, grp3A_Id, q.num, q.text, q.ans, JSON.stringify([q.ans, q.ans.toLowerCase()])]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < q.options.length; i++) {
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, q.options[i].key, q.options[i].text, q.options[i].key === q.ans, i + 1]);
      }
    }

    // Group 2: 27–30 (Interview stages & Problems with child witnesses)
    const grp3B_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
      VALUES ($1, 'Questions 27–30: Problems with child witnesses', 'What problem may there be with child witnesses at each of the following stages of an interview?\nChoose FOUR answers from the box (A–F):\n\nA: frightened by the unfamiliar environment\nB: influenced by the interviewer\nC: not understanding the difference between truth and lies\nD: unwillingness to say they don''t know\nE: confused by the terminology\nF: distrust of the interviewer', $2, 2)
      RETURNING id;
    `, [sec3Id, audioId]);
    const grp3B_Id = grp3B_Res.rows[0].id;

    const childProblemOptions = [
      { key: 'A', text: 'frightened by the unfamiliar environment' },
      { key: 'B', text: 'influenced by the interviewer' },
      { key: 'C', text: 'not understanding the difference between truth and lies' },
      { key: 'D', text: "unwillingness to say they don't know" },
      { key: 'E', text: 'confused by the terminology' },
      { key: 'F', text: 'distrust of the interviewer' }
    ];

    const part3BQuestions = [
      { num: 27, text: 'Rapport', ans: 'A' },
      { num: 28, text: 'Open-ended questions', ans: 'E' },
      { num: 29, text: 'Closed questions', ans: 'C' },
      { num: 30, text: 'Closure', ans: 'F' }
    ];

    for (const q of part3BQuestions) {
      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number,
          instruction, question_text, correct_answer, accepted_answers, points
        ) VALUES ($1, $2, $3, 'multiple_choice', $4, 'Choose the correct letter, A–F.', $5, $6, $7, 1)
        RETURNING id;
      `, [testId, sec3Id, grp3B_Id, q.num, q.text, q.ans, JSON.stringify([q.ans, q.ans.toLowerCase()])]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < childProblemOptions.length; i++) {
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, childProblemOptions[i].key, childProblemOptions[i].text, childProblemOptions[i].key === q.ans, i + 1]);
      }
    }

    // -------------------------------------------------------------
    // PART 4: Plastics Exhibition (Questions 31–40)
    // -------------------------------------------------------------
    const sec4Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 4: Plastics Exhibition', 4, 'Questions 31–40: Complete the notes below. Write ONE WORD ONLY for each answer.', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec4Id = sec4Res.rows[0].id;

    const grp4Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
      VALUES ($1, 'Questions 31–40: Plastics exhibition', 'Complete the notes below. Write ONE WORD ONLY for each answer.', $2, 1)
      RETURNING id;
    `, [sec4Id, audioId]);
    const grp4Id = grp4Res.rows[0].id;

    const part4Questions = [
      {
        num: 31,
        text: 'semi-synthetics, e.g. commercial celluloid–used [31] and acid',
        ans: 'cotton',
        accepted: ['cotton', 'Cotton']
      },
      {
        num: 32,
        text: 'experiments making plastics from [32] products were unsuccessful',
        ans: 'milk',
        accepted: ['milk', 'Milk']
      },
      {
        num: 33,
        text: 'earliest fabric to be produced was artificial [33]',
        ans: 'silk',
        accepted: ['silk', 'Silk']
      },
      {
        num: 34,
        text: 'first plastic produced in a [34]',
        ans: 'laboratory',
        accepted: ['laboratory', 'Laboratory', 'lab', 'Lab']
      },
      {
        num: 35,
        text: 'invented by a [35] called Hendrik Baekeland',
        ans: 'chemist',
        accepted: ['chemist', 'Chemist']
      },
      {
        num: 36,
        text: 'unusual because it becomes [36] when heated',
        ans: 'hard',
        accepted: ['hard', 'Hard']
      },
      {
        num: 37,
        text: 'older plastic objects may release acidic [37]',
        ans: 'gases',
        accepted: ['gases', 'Gases', 'gas', 'Gas']
      },
      {
        num: 38,
        text: 'plastic objects degrade in [38]',
        ans: 'light',
        accepted: ['light', 'Light', 'sunlight', 'Sunlight']
      },
      {
        num: 39,
        text: 'chandelier made using recycled [39]',
        ans: 'pens',
        accepted: ['pens', 'Pens', 'pen', 'Pen']
      },
      {
        num: 40,
        text: 'car made in Japan from semi-synthetic materials based on substances found in [40]',
        ans: 'wood',
        accepted: ['wood', 'Wood']
      }
    ];

    for (const q of part4Questions) {
      await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number,
          instruction, question_text, correct_answer, accepted_answers, points
        ) VALUES ($1, $2, $3, 'note_completion', $4, 'Write ONE WORD ONLY for each answer.', $5, $6, $7, 1);
      `, [testId, sec4Id, grp4Id, q.num, q.text, q.ans, JSON.stringify(q.accepted)]);
    }

    await client.query('COMMIT');
    console.log('✅ Successfully seeded IELTS Listening Test 1 (Version K5002) with 40 questions across 4 parts!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed listening test:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
