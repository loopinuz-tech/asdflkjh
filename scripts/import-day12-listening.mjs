import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let pg, dotenv;
try {
  pg = (await import('pg')).default;
  dotenv = (await import('dotenv')).default;
} catch {
  pg = require(path.resolve(__dirname, '../backend/node_modules/pg'));
  dotenv = require(path.resolve(__dirname, '../backend/node_modules/dotenv'));
}

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:1234/foxford';

console.log('Connecting to database...');

const client = new Client({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    await client.query('BEGIN');

    // 1. Fetch Question Types
    const qTypesRes = await client.query('SELECT id, slug FROM question_types;');
    const qTypeMap = {};
    for (const r of qTypesRes.rows) {
      qTypeMap[r.slug] = r.id;
    }
    console.log('Question types loaded:', Object.keys(qTypeMap));

    // 2. Audio file record for Day 12 Listening
    // Check if an audio record exists for Day 12, or reuse / create one
    let audioId = null;
    const existingAudioRes = await client.query(
      "SELECT id FROM listening_audio WHERE title = 'IELTS Listening Practice Test — Day 12 Audio' OR file_path = '/uploads/listening-1.mp3' ORDER BY created_at ASC LIMIT 1;"
    );

    if (existingAudioRes.rows.length > 0) {
      audioId = existingAudioRes.rows[0].id;
      console.log(`Using existing audio record: ${audioId}`);
    } else {
      const newAudioRes = await client.query(`
        INSERT INTO listening_audio (title, file_path, duration_seconds, status)
        VALUES ('IELTS Listening Practice Test — Day 12 Audio', '/uploads/listening-1.mp3', 1800, 'published')
        RETURNING id;
      `);
      audioId = newAudioRes.rows[0].id;
      console.log(`Created new audio record: ${audioId}`);
    }

    // 3. Remove existing test with same slug if re-importing
    const slug = 'ielts-listening-practice-test-day-12';
    const existingTestRes = await client.query('SELECT id FROM tests WHERE slug = $1;', [slug]);
    if (existingTestRes.rows.length > 0) {
      console.log(`Test with slug '${slug}' already exists (ID: ${existingTestRes.rows[0].id}). Cleaning up previous import...`);
      await client.query('DELETE FROM tests WHERE id = $1;', [existingTestRes.rows[0].id]);
    }

    // 4. Insert Test
    const testTitle = 'IELTS Listening Practice Test — Day 12';
    const testDesc = 'Complete 40-question IELTS Listening Practice Test (Day 12). Section 1: Library Services. Section 2: Museum Tour. Section 3: Analysis Methods & Company Strategy. Section 4: Employment Survey on Graduates.';
    const testTags = ['listening', 'cambridge', 'mock', 'day-12', 'part_1', 'part_2', 'part_3', 'part_4'];

    const testInsertRes = await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, access_type,
        status, time_limit_minutes, total_questions, ielts_type, tags
      ) VALUES (
        $1, $2, $3, 'listening', 'medium', false, 'free',
        'published', 30, 40, 'academic', $4
      ) RETURNING id;
    `, [testTitle, slug, testDesc, testTags]);

    const testId = testInsertRes.rows[0].id;
    console.log(`Created Test: "${testTitle}" (ID: ${testId})`);

    // ==========================================
    // SECTION 1: Part 1: Library Services (Q1–10)
    // ==========================================
    const sec1Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 1: Library Services', 1, 'Questions 1–10: Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec1Id = sec1Res.rows[0].id;

    const grp1Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, order_number, media_id)
      VALUES ($1, 'Questions 1–10: Library Services', 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', 1, $2)
      RETURNING id;
    `, [sec1Id, audioId]);
    const grp1Id = grp1Res.rows[0].id;

    const sec1Questions = [
      {
        num: 1,
        type: 'note_completion',
        text: 'Located in [1] Street, next to the park',
        correct: 'skellarn',
        accepted: ['skellarn', 'Skellarn']
      },
      {
        num: 2,
        type: 'note_completion',
        text: 'next to the [2]',
        correct: 'park',
        accepted: ['park', 'Park', 'the park']
      },
      {
        num: 3,
        type: 'note_completion',
        text: 'Saturdays: open until [3] p.m.',
        correct: '4:30',
        accepted: ['4:30', '4.30', '4:30 pm', '4:30 p.m.', 'half past four', '4 30']
      },
      {
        num: 4,
        type: 'note_completion',
        text: "Children's activities: a [4] club (5-13 year-olds)",
        correct: 'drama',
        accepted: ['drama', 'Drama']
      },
      {
        num: 5,
        type: 'note_completion',
        text: 'a [5] club (every other Saturday)',
        correct: 'singing',
        accepted: ['singing', 'Singing']
      },
      {
        num: 6,
        type: 'note_completion',
        text: 'Adult activities: can meet local [6] (about one a year)',
        correct: 'artists',
        accepted: ['artists', 'Artists', 'artist', 'Artist']
      },
      {
        num: 7,
        type: 'note_completion',
        text: 'Services: can borrow [7]',
        correct: 'films',
        accepted: ['films', 'Films', 'film', 'Film']
      },
      {
        num: 8,
        type: 'note_completion',
        text: 'various [8] are available',
        correct: 'magazines',
        accepted: ['magazines', 'Magazines', 'magazine', 'Magazine']
      },
      {
        num: 9,
        type: 'note_completion',
        text: 'can drop off books, etc. via the letter box (must give card [9])',
        correct: 'number',
        accepted: ['number', 'Number']
      },
      {
        num: 10,
        type: 'note_completion',
        text: 'Library shop sells: [10] (wide range)',
        correct: 'office',
        accepted: ['office', 'Office', 'stationery', 'Stationery']
      }
    ];

    for (const q of sec1Questions) {
      await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers,
          points, difficulty, status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, 'Write ONE WORD AND/OR A NUMBER', $7, $8, $9::jsonb,
          1, 'medium', 'published'
        );
      `, [
        testId, sec1Id, grp1Id, qTypeMap[q.type] || null, q.type,
        q.num, q.text, q.correct, JSON.stringify(q.accepted)
      ]);
    }
    console.log('Section 1 inserted (Q1–Q10).');

    // ==========================================
    // SECTION 2: Part 2: Museum Tour (Q11–20)
    // ==========================================
    const sec2Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 2: Museum Tour', 2, 'Questions 11–16: Choose the correct letter, A, B or C. Questions 17–20: Choose FOUR answers from the box and write the correct letter, A–F.', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec2Id = sec2Res.rows[0].id;

    // Group 1: Q11–16 (Multiple Choice)
    const grp2A_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, order_number, media_id)
      VALUES ($1, 'Questions 11–16: Museum Tour', 'Choose the correct letter, A, B or C.', 1, $2)
      RETURNING id;
    `, [sec2Id, audioId]);
    const grp2A_Id = grp2A_Res.rows[0].id;

    const mcqQ11_16 = [
      {
        num: 11,
        text: 'What does the tour guide advise the visitors to do in the museum today?',
        correct: 'A',
        options: [
          { key: 'A', text: 'see the most popular exhibits first' },
          { key: 'B', text: 'pay a brief visit to each gallery' },
          { key: 'C', text: 'go to the photography gallery last' }
        ]
      },
      {
        num: 12,
        text: 'The museum was designed by William Craven, who also designed',
        correct: 'B',
        options: [
          { key: 'A', text: 'a textile factory' },
          { key: 'B', text: 'the town hall' },
          { key: 'C', text: 'the railway station' }
        ]
      },
      {
        num: 13,
        text: 'The museum won an award for the preservation of the',
        correct: 'A',
        options: [
          { key: 'A', text: 'staircase' },
          { key: 'B', text: 'floor' },
          { key: 'C', text: 'windows' }
        ]
      },
      {
        num: 14,
        text: 'Most of the money for the project came from',
        correct: 'C',
        options: [
          { key: 'A', text: 'the public' },
          { key: 'B', text: 'the government' },
          { key: 'C', text: 'local businesses' }
        ]
      },
      {
        num: 15,
        text: 'Over the next five years, the museum will invest mainly in',
        correct: 'A',
        options: [
          { key: 'A', text: 'restoring existing collections' },
          { key: 'B', text: 'developing educational programmes' },
          { key: 'C', text: 'purchasing new objects for display' }
        ]
      },
      {
        num: 16,
        text: 'Visitors who are interested in learning more about the exhibits should',
        correct: 'C',
        options: [
          { key: 'A', text: "visit the museum's website" },
          { key: 'B', text: 'read the leaflets on display' },
          { key: 'C', text: 'attend the monthly lectures' }
        ]
      }
    ];

    for (const q of mcqQ11_16) {
      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers,
          points, difficulty, status
        ) VALUES (
          $1, $2, $3, $4, 'multiple_choice',
          $5, 'Choose the correct letter, A, B or C.', $6, $7, $8::jsonb,
          1, 'medium', 'published'
        ) RETURNING id;
      `, [
        testId, sec2Id, grp2A_Id, qTypeMap['multiple_choice'] || null,
        q.num, q.text, q.correct, JSON.stringify([q.correct])
      ]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, opt.key, opt.text, opt.key === q.correct, i + 1]);
      }
    }

    // Group 2: Q17–20 (Matching Collections)
    const grp2B_Instruction = `Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 17–20.

Information:
A: has been shown in different museums
B: consists of work by a local resident
C: has exhibits from various countries
D: is only on temporary display
E: is on loan from foreign museum
F: shows things that are no longer common`;

    const grp2B_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, order_number, media_id)
      VALUES ($1, 'Questions 17–20: Collections', $2, 2, $3)
      RETURNING id;
    `, [sec2Id, grp2B_Instruction, audioId]);
    const grp2B_Id = grp2B_Res.rows[0].id;

    const matchingOptionsQ17_20 = [
      { key: 'A', text: 'has been shown in different museums' },
      { key: 'B', text: 'consists of work by a local resident' },
      { key: 'C', text: 'has exhibits from various countries' },
      { key: 'D', text: 'is only on temporary display' },
      { key: 'E', text: 'is on loan from foreign museum' },
      { key: 'F', text: 'shows things that are no longer common' }
    ];

    const matchingQ17_20 = [
      { num: 17, text: '18th-century paintings', correct: 'C' },
      { num: 18, text: 'Farnley collection', correct: 'B' },
      { num: 19, text: 'kitchen appliances', correct: 'E' },
      { num: 20, text: 'fashion gallery', correct: 'D' }
    ];

    for (const q of matchingQ17_20) {
      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers,
          points, difficulty, status
        ) VALUES (
          $1, $2, $3, $4, 'multiple_choice',
          $5, 'Choose the correct letter, A–F.', $6, $7, $8::jsonb,
          1, 'medium', 'published'
        ) RETURNING id;
      `, [
        testId, sec2Id, grp2B_Id, qTypeMap['multiple_choice'] || null,
        q.num, q.text, q.correct, JSON.stringify([q.correct])
      ]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < matchingOptionsQ17_20.length; i++) {
        const opt = matchingOptionsQ17_20[i];
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, opt.key, opt.text, opt.key === q.correct, i + 1]);
      }
    }
    console.log('Section 2 inserted (Q11–Q20).');

    // ==========================================
    // SECTION 3: Part 3: Analysis Methods & Company Strategy (Q21–30)
    // ==========================================
    const sec3Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 3: Analysis Methods & Company Strategy', 3, 'Questions 21–25: Choose FIVE letters from the box and write letters A–G. Questions 26–30: Choose the correct letter, A, B or C.', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec3Id = sec3Res.rows[0].id;

    // Group 1: Q21–25 (Matching Analysis Methods)
    const grp3A_Instruction = `Choose FIVE letters from the box and write letters A–G, next to questions 21–25.

Characteristics:
A: it will save a lot of business time and effort
B: it is visualized
C: it does not fit our company
D: it will take too long
E: it is easy to use
F: it is difficult to apply
G: it is suitable to almost all sized companies`;

    const grp3A_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, order_number, media_id)
      VALUES ($1, 'Questions 21–25: Analysis Methods', $2, 1, $3)
      RETURNING id;
    `, [sec3Id, grp3A_Instruction, audioId]);
    const grp3A_Id = grp3A_Res.rows[0].id;

    const matchingOptionsQ21_25 = [
      { key: 'A', text: 'it will save a lot of business time and effort' },
      { key: 'B', text: 'it is visualized' },
      { key: 'C', text: 'it does not fit our company' },
      { key: 'D', text: 'it will take too long' },
      { key: 'E', text: 'it is easy to use' },
      { key: 'F', text: 'it is difficult to apply' },
      { key: 'G', text: 'it is suitable to almost all sized companies' }
    ];

    const matchingQ21_25 = [
      { num: 21, text: 'PEST', correct: 'C' },
      { num: 22, text: 'Drill Down', correct: 'D' },
      { num: 23, text: 'PMI', correct: 'E' },
      { num: 24, text: 'Pareto', correct: 'A' },
      { num: 25, text: 'SWOT', correct: 'G' }
    ];

    for (const q of matchingQ21_25) {
      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers,
          points, difficulty, status
        ) VALUES (
          $1, $2, $3, $4, 'multiple_choice',
          $5, 'Choose the correct letter, A–G.', $6, $7, $8::jsonb,
          1, 'medium', 'published'
        ) RETURNING id;
      `, [
        testId, sec3Id, grp3A_Id, qTypeMap['multiple_choice'] || null,
        q.num, q.text, q.correct, JSON.stringify([q.correct])
      ]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < matchingOptionsQ21_25.length; i++) {
        const opt = matchingOptionsQ21_25[i];
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, opt.key, opt.text, opt.key === q.correct, i + 1]);
      }
    }

    // Group 2: Q26–30 (Multiple Choice)
    const grp3B_Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, order_number, media_id)
      VALUES ($1, 'Questions 26–30: Company Evaluation & Report', 'Choose the correct letter, A, B or C.', 2, $2)
      RETURNING id;
    `, [sec3Id, audioId]);
    const grp3B_Id = grp3B_Res.rows[0].id;

    const mcqQ26_30 = [
      {
        num: 26,
        text: 'What does Frances consider as the best strength of the company?',
        correct: 'B',
        options: [
          { key: 'A', text: 'reputation' },
          { key: 'B', text: 'experienced employees' },
          { key: 'C', text: 'management' }
        ]
      },
      {
        num: 27,
        text: 'What factor did Sam overlook for the future growth of the company?',
        correct: 'B',
        options: [
          { key: 'A', text: 'seek for cheaper suppliers' },
          { key: 'B', text: 'set up an overseas office' },
          { key: 'C', text: 'compete with major competitors' }
        ]
      },
      {
        num: 28,
        text: 'Which of the following can be the threat to a company?',
        correct: 'C',
        options: [
          { key: 'A', text: 'increasing competition' },
          { key: 'B', text: 'outdated technology' },
          { key: 'C', text: 'new legislation' }
        ]
      },
      {
        num: 29,
        text: 'What has Sam learned from the research?',
        correct: 'C',
        options: [
          { key: 'A', text: 'using better tools' },
          { key: 'B', text: 'cost of a success business' },
          { key: 'C', text: 'gap between reality and theory' }
        ]
      },
      {
        num: 30,
        text: "What is the professor's suggestion for the report?",
        correct: 'A',
        options: [
          { key: 'A', text: 'give a final determination' },
          { key: 'B', text: 'reorganize a clear structure' },
          { key: 'C', text: 'add more detailed information' }
        ]
      }
    ];

    for (const q of mcqQ26_30) {
      const qRes = await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers,
          points, difficulty, status
        ) VALUES (
          $1, $2, $3, $4, 'multiple_choice',
          $5, 'Choose the correct letter, A, B or C.', $6, $7, $8::jsonb,
          1, 'medium', 'published'
        ) RETURNING id;
      `, [
        testId, sec3Id, grp3B_Id, qTypeMap['multiple_choice'] || null,
        q.num, q.text, q.correct, JSON.stringify([q.correct])
      ]);
      const qId = qRes.rows[0].id;

      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
          VALUES ($1, $2, $3, $4, $5);
        `, [qId, opt.key, opt.text, opt.key === q.correct, i + 1]);
      }
    }
    console.log('Section 3 inserted (Q21–Q30).');

    // ==========================================
    // SECTION 4: Part 4: Employment Survey on Graduates (Q31–40)
    // ==========================================
    const sec4Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, audio_id)
      VALUES ($1, 'Part 4: Employment Survey on Graduates', 4, 'Questions 31–40: Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.', 8, $2)
      RETURNING id;
    `, [testId, audioId]);
    const sec4Id = sec4Res.rows[0].id;

    const grp4Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, order_number, media_id)
      VALUES ($1, 'Questions 31–40: Employment Survey on Graduates', 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.', 1, $2)
      RETURNING id;
    `, [sec4Id, audioId]);
    const grp4Id = grp4Res.rows[0].id;

    const sec4Questions = [
      {
        num: 31,
        type: 'note_completion',
        text: 'Overview: interviews from which subject: [31]',
        correct: 'business management',
        accepted: ['business management', 'Business Management', 'Business management']
      },
      {
        num: 32,
        type: 'note_completion',
        text: 'two research methods: email questionnaires and [32]',
        correct: 'phone interviews',
        accepted: ['phone interviews', 'Phone Interviews', 'telephone interviews', 'phone interview']
      },
      {
        num: 33,
        type: 'note_completion',
        text: 'Findings: 32% of students tended to acquire another [33]',
        correct: 'qualification',
        accepted: ['qualification', 'Qualification', 'qualifications']
      },
      {
        num: 34,
        type: 'note_completion',
        text: 'only 4% were unemployed; most of the students work in the [34] sector',
        correct: 'public',
        accepted: ['public', 'Public']
      },
      {
        num: 35,
        type: 'note_completion',
        text: 'majority are happy with: [35]',
        correct: 'career development',
        accepted: ['career development', 'Career Development']
      },
      {
        num: 36,
        type: 'note_completion',
        text: 'Feedback — Useful skills learned in college: working as a [36] member',
        correct: 'team',
        accepted: ['team', 'Team']
      },
      {
        num: 37,
        type: 'note_completion',
        text: 'personal organization; [37] ability',
        correct: 'problem solving',
        accepted: ['problem solving', 'Problem Solving', 'problem-solving']
      },
      {
        num: 38,
        type: 'note_completion',
        text: 'Useless skills: [38] (lack of training)',
        correct: 'presentations',
        accepted: ['presentations', 'Presentations', 'presentation']
      },
      {
        num: 39,
        type: 'note_completion',
        text: 'advice on [39] (unnecessary)',
        correct: 'essay writing',
        accepted: ['essay writing', 'Essay Writing']
      },
      {
        num: 40,
        type: 'note_completion',
        text: 'advice on finding a [40] (not enough)',
        correct: 'job',
        accepted: ['job', 'Job']
      }
    ];

    for (const q of sec4Questions) {
      await client.query(`
        INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers,
          points, difficulty, status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, 'Write NO MORE THAN TWO WORDS', $7, $8, $9::jsonb,
          1, 'medium', 'published'
        );
      `, [
        testId, sec4Id, grp4Id, qTypeMap[q.type] || null, q.type,
        q.num, q.text, q.correct, JSON.stringify(q.accepted)
      ]);
    }
    console.log('Section 4 inserted (Q31–Q40).');

    await client.query('COMMIT');
    console.log('TRANSACTION COMMITTED SUCCESSFULLY!');

    // 5. Verification
    const countRes = await client.query('SELECT count(*) FROM questions WHERE test_id = $1;', [testId]);
    console.log(`Verification: Total questions in database for test ${testId}: ${countRes.rows[0].count} / 40`);

    const sectionsRes = await client.query('SELECT count(*) FROM test_sections WHERE test_id = $1;', [testId]);
    console.log(`Verification: Total sections in database: ${sectionsRes.rows[0].count} / 4`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed! Rolled back transaction:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
