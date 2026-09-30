import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const pg = require(path.resolve(__dirname, '../backend/node_modules/pg'));
const dotenv = require(path.resolve(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:1234/foxford';

console.log('Connecting to PostgreSQL for Listening 1 (Lis Test 24) import...');
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

    // Fetch Question Types
    const qTypesRes = await client.query('SELECT id, slug FROM question_types;');
    const qTypeMap = {};
    for (const r of qTypesRes.rows) {
      qTypeMap[r.slug] = r.id;
    }
    console.log('Available Question Types:', Object.keys(qTypeMap));

    // Fallbacks if some types don't exist
    const shortAnswerTypeId = qTypeMap['short_answer'] || qTypeMap['sentence_completion'] || Object.values(qTypeMap)[0];
    const mcqTypeId = qTypeMap['multiple_choice'] || Object.values(qTypeMap)[0];
    const matchingTypeId = qTypeMap['matching'] || Object.values(qTypeMap)[0];

    // 1. Insert listening_audio records for each of the 4 sections
    const audioRecords = [
      { title: 'Listening 24 — Part 1 (Accommodation Request)', path: '/uploads/listening-24-part-1.mp3', duration: 420 },
      { title: 'Listening 24 — Part 2 (Green Island Nature Park)', path: '/uploads/listening-24-part-2.mp3', duration: 330 },
      { title: 'Listening 24 — Part 3 (Music and Memory Presentation)', path: '/uploads/listening-24-part-3.mp3', duration: 380 },
      { title: 'Listening 24 — Part 4 (Drama Activities on Children)', path: '/uploads/listening-24-part-4.mp3', duration: 410 },
    ];

    const audioIds = [];
    for (const aud of audioRecords) {
      const existing = await client.query('SELECT id FROM listening_audio WHERE file_path = $1 LIMIT 1', [aud.path]);
      if (existing.rows.length > 0) {
        audioIds.push(existing.rows[0].id);
      } else {
        const ins = await client.query(
          `INSERT INTO listening_audio (title, file_path, duration_seconds, status)
           VALUES ($1, $2, $3, 'published') RETURNING id`,
          [aud.title, aud.path, aud.duration]
        );
        audioIds.push(ins.rows[0].id);
      }
    }
    console.log('Audio IDs created/found:', audioIds);

    // 2. Check if test already exists (to avoid duplicate test)
    const testSlug = 'ielts-listening-practice-test-24-accommodation-green-island';
    const testTitle = 'IELTS Listening Practice Test — Accommodation & Green Island Nature Park';
    
    let testId;
    const existingTest = await client.query('SELECT id FROM tests WHERE slug = $1 LIMIT 1', [testSlug]);
    if (existingTest.rows.length > 0) {
      testId = existingTest.rows[0].id;
      console.log(`Test already exists with ID: ${testId}. Cleaning up existing sections to re-import fresh...`);
      await client.query('DELETE FROM questions WHERE test_id = $1', [testId]);
      await client.query('DELETE FROM test_sections WHERE test_id = $1', [testId]);
    } else {
      const insTest = await client.query(
        `INSERT INTO tests (
          title, description, skill, difficulty, is_premium, access_type, status,
          time_limit_minutes, total_questions, slug, ielts_type
        ) VALUES (
          $1, $2, 'listening', 'medium', false, 'free', 'published',
          30, 40, $3, 'academic'
        ) RETURNING id`,
        [
          testTitle,
          'Full official IELTS Listening practice test featuring Section 1 Accommodation Request, Section 2 Green Island Nature Park, Section 3 Music and Memory, and Section 4 Drama Activities in Child Development.',
          testSlug
        ]
      );
      testId = insTest.rows[0].id;
      console.log(`Created test with ID: ${testId}`);
    }

    // ==========================================
    // SECTION 1: Questions 1–10
    // ==========================================
    const s1Res = await client.query(
      `INSERT INTO test_sections (test_id, title, order_number, instructions, audio_id, time_limit_minutes)
       VALUES ($1, 'Section 1: Accommodation Request', 1, 'Listen and answer questions 1–10.', $2, 8)
       RETURNING id`,
      [testId, audioIds[0]]
    );
    const s1Id = s1Res.rows[0].id;

    const g1Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
       VALUES ($1, 'Questions 1–10: Accommodation request form', 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.', $2, 1)
       RETURNING id`,
      [s1Id, audioIds[0]]
    );
    const g1Id = g1Res.rows[0].id;

    const s1Questions = [
      {
        num: 1,
        text: 'Preferred location: the [1] of the town',
        ans: 'southeast',
        accepted: ['southeast', 'south east', 'south-east'],
        explanation: 'The applicant mentions she prefers accommodation situated in the southeast of the town.'
      },
      {
        num: 2,
        text: 'Facilities required: - furnished property - with a [2]',
        ans: 'washing machine',
        accepted: ['washing machine', 'a washing machine'],
        explanation: 'She specifically asks for a furnished home equipped with a washing machine.'
      },
      {
        num: 3,
        text: 'Start date of rental period: [3]',
        ans: '15th May',
        accepted: ['15th May', '15 May', 'May 15th', 'May 15'],
        explanation: 'The tenant states she needs to move in starting from 15th May.'
      },
      {
        num: 4,
        text: 'Reference from: her [4]',
        ans: 'employer',
        accepted: ['employer', 'current employer'],
        explanation: 'She can provide a reference letter directly from her current employer.'
      },
      {
        num: 5,
        text: 'Maximum rent: [5] £ per month',
        ans: '675',
        accepted: ['675', '£675', '675 pounds'],
        explanation: 'Her maximum monthly budget for rent is £675.'
      },
      {
        num: 6,
        text: "Applicant's job: [6]",
        ans: 'translator',
        accepted: ['translator'],
        explanation: 'She works professionally as a translator.'
      },
      {
        num: 7,
        text: 'Credit check document to be supplied: a [7]',
        ans: 'bank statement',
        accepted: ['bank statement', 'a bank statement'],
        explanation: 'For the credit verification, she will submit a bank statement.'
      },
      {
        num: 8,
        text: 'Address of property for viewing: 33, [8] Street',
        ans: 'AINSWORTH',
        accepted: ['AINSWORTH', 'Ainsworth', 'ainsworth'],
        explanation: 'The viewing address is spelled A-I-N-S-W-O-R-T-H Street.'
      },
      {
        num: 9,
        text: 'To check during viewing: - Is there a [9] in the house?',
        ans: 'telephone',
        accepted: ['telephone', 'phone'],
        explanation: 'She wants the agent to check if a landline telephone is installed in the house.'
      },
      {
        num: 10,
        text: 'To check during viewing: - Is there a [10] nearby?',
        ans: 'bus stop',
        accepted: ['bus stop', 'a bus stop'],
        explanation: 'She also requests confirmation whether there is a bus stop within walking distance.'
      }
    ];

    for (const q of s1Questions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers, explanation, points
        ) VALUES (
          $1, $2, $3, $4, 'short_answer',
          $5, 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER.', $6, $7, $8, $9, 1
        )`,
        [testId, s1Id, g1Id, shortAnswerTypeId, q.num, q.text, q.ans, JSON.stringify(q.accepted), q.explanation]
      );
    }
    console.log('Section 1 (Q1-10) inserted successfully.');

    // ==========================================
    // SECTION 2: Questions 11–20
    // ==========================================
    const s2Res = await client.query(
      `INSERT INTO test_sections (test_id, title, order_number, instructions, audio_id, time_limit_minutes)
       VALUES ($1, 'Section 2: Green Island Nature Park', 2, 'Listen and answer questions 11–20.', $2, 8)
       RETURNING id`,
      [testId, audioIds[1]]
    );
    const s2Id = s2Res.rows[0].id;

    // Group 2.1: Q11–12 MCQ
    const g2_1 = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
       VALUES ($1, 'Questions 11–12: Overview of Green Island', 'Choose the correct letter, A, B, or C.', $2, 1)
       RETURNING id`,
      [s2Id, audioIds[1]]
    );
    const g2_1Id = g2_1.rows[0].id;

    const q11Res = await client.query(
      `INSERT INTO questions (
        test_id, section_id, group_id, question_type_id, question_type,
        question_number, instruction, question_text, correct_answer, explanation, points
      ) VALUES (
        $1, $2, $3, $4, 'multiple_choice',
        11, 'Choose the correct letter, A, B, or C.', 'Which natural feature of Green Island is special?', 'A',
        'The guide emphasizes the unique clarity and quality of the surrounding water.', 1
      ) RETURNING id`,
      [testId, s2Id, g2_1Id, mcqTypeId]
    );
    const q11Id = q11Res.rows[0].id;
    await client.query(`
      INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number) VALUES
      ($1, 'A', 'The water', true, 1),
      ($1, 'B', 'The birds', false, 2),
      ($1, 'C', 'The fish', false, 3)
    `, [q11Id]);

    const q12Res = await client.query(
      `INSERT INTO questions (
        test_id, section_id, group_id, question_type_id, question_type,
        question_number, instruction, question_text, correct_answer, explanation, points
      ) VALUES (
        $1, $2, $3, $4, 'multiple_choice',
        12, 'Choose the correct letter, A, B, or C.', 'Who started the nature park?', 'B',
        'Churchill Peters was the founder who established the island nature reserve.', 1
      ) RETURNING id`,
      [testId, s2Id, g2_1Id, mcqTypeId]
    );
    const q12Id = q12Res.rows[0].id;
    await client.query(`
      INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number) VALUES
      ($1, 'A', 'Mitchell Cullen', false, 1),
      ($1, 'B', 'Churchill Peters', true, 2),
      ($1, 'C', 'Joseph Turia', false, 3)
    `, [q12Id]);

    // Group 2.2: Q13–14 Multi-select 2
    const g2_2 = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
       VALUES ($1, 'Questions 13–14: Conditions for viewing fish', 'Choose TWO letters, A–E.', $2, 2)
       RETURNING id`,
      [s2Id, audioIds[1]]
    );
    const g2_2Id = g2_2.rows[0].id;

    const q13_14Opts = [
      { key: 'A', text: 'Summer days' },
      { key: 'B', text: 'No wind' },
      { key: 'C', text: 'Early morning' },
      { key: 'D', text: 'High tide' },
      { key: 'E', text: 'No rain for one week' }
    ];

    const q13Res = await client.query(
      `INSERT INTO questions (
        test_id, section_id, group_id, question_type_id, question_type,
        question_number, instruction, question_text, correct_answer, accepted_answers, explanation, points
      ) VALUES (
        $1, $2, $3, $4, 'multiple_choice',
        13, 'Choose TWO letters, A–E.', 'Which TWO conditions are best for seeing fish? (First condition)', 'B',
        '["B", "E"]', 'Calm water with no wind allows visitors to look beneath the surface clearly.', 1
      ) RETURNING id`,
      [testId, s2Id, g2_2Id, mcqTypeId]
    );
    for (let i = 0; i < q13_14Opts.length; i++) {
      await client.query(
        'INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number) VALUES ($1, $2, $3, $4, $5)',
        [q13Res.rows[0].id, q13_14Opts[i].key, q13_14Opts[i].text, q13_14Opts[i].key === 'B' || q13_14Opts[i].key === 'E', i + 1]
      );
    }

    const q14Res = await client.query(
      `INSERT INTO questions (
        test_id, section_id, group_id, question_type_id, question_type,
        question_number, instruction, question_text, correct_answer, accepted_answers, explanation, points
      ) VALUES (
        $1, $2, $3, $4, 'multiple_choice',
        14, 'Choose TWO letters, A–E.', 'Which TWO conditions are best for seeing fish? (Second condition)', 'E',
        '["B", "E"]', 'Water visibility is greatest when there has been no runoff or rain for at least one full week.', 1
      ) RETURNING id`,
      [testId, s2Id, g2_2Id, mcqTypeId]
    );
    for (let i = 0; i < q13_14Opts.length; i++) {
      await client.query(
        'INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number) VALUES ($1, $2, $3, $4, $5)',
        [q14Res.rows[0].id, q13_14Opts[i].key, q13_14Opts[i].text, q13_14Opts[i].key === 'B' || q13_14Opts[i].key === 'E', i + 1]
      );
    }

    // Group 2.3: Q15–20 Matching
    const g2_3 = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
       VALUES ($1, 'Questions 15–20: Park Rules for Activities', 'What are the rules for the following activities in the nature park? Choose A, B, or C. A: Visitors can always do this, B: Visitors can sometimes do this, C: Visitors must not do this.', $2, 3)
       RETURNING id`,
      [s2Id, audioIds[1]]
    );
    const g2_3Id = g2_3.rows[0].id;

    const matching2Questions = [
      { num: 15, text: 'play games on the beach', ans: 'B', exp: 'Games on the beach are restricted during turtle nesting periods (sometimes allowed).' },
      { num: 16, text: 'feed the fish', ans: 'B', exp: 'Feeding is strictly regulated to designated staff-supervised times only.' },
      { num: 17, text: 'touch the fish on purpose', ans: 'C', exp: 'Visitors are explicitly prohibited from touching marine animals.' },
      { num: 18, text: 'take photographs underwater', ans: 'A', exp: 'Underwater photography is always permitted throughout the park.' },
      { num: 19, text: 'climb on Green Island', ans: 'B', exp: 'Climbing rock formations is permitted only with a registered ranger guide.' },
      { num: 20, text: 'use a private boat', ans: 'A', exp: 'Private vessels are always allowed provided they anchor in marked zones.' }
    ];

    const ruleOpts = [
      { key: 'A', text: 'Visitors can always do this' },
      { key: 'B', text: 'Visitors can sometimes do this' },
      { key: 'C', text: 'Visitors must not do this' }
    ];

    for (const q of matching2Questions) {
      const qRes = await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, explanation, points
        ) VALUES (
          $1, $2, $3, $4, 'matching',
          $5, 'Choose A (can always do this), B (can sometimes do this), or C (must not do this).', $6, $7, $8, 1
        ) RETURNING id`,
        [testId, s2Id, g2_3Id, matchingTypeId, q.num, q.text, q.ans, q.exp]
      );
      for (let i = 0; i < ruleOpts.length; i++) {
        await client.query(
          'INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number) VALUES ($1, $2, $3, $4, $5)',
          [qRes.rows[0].id, ruleOpts[i].key, ruleOpts[i].text, ruleOpts[i].key === q.ans, i + 1]
        );
      }
    }
    console.log('Section 2 (Q11-20) inserted successfully.');

    // ==========================================
    // SECTION 3: Questions 21–30
    // ==========================================
    const s3Res = await client.query(
      `INSERT INTO test_sections (test_id, title, order_number, instructions, audio_id, time_limit_minutes)
       VALUES ($1, 'Section 3: Music and Memory Presentation', 3, 'Listen and answer questions 21–30.', $2, 8)
       RETURNING id`,
      [testId, audioIds[2]]
    );
    const s3Id = s3Res.rows[0].id;

    // Group 3.1: Q21–24 MCQ
    const g3_1 = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
       VALUES ($1, 'Questions 21–24: Discussion on Research Study', 'Choose the correct letter, A, B, or C.', $2, 1)
       RETURNING id`,
      [s3Id, audioIds[2]]
    );
    const g3_1Id = g3_1.rows[0].id;

    const s3Mcq = [
      {
        num: 21,
        text: 'The lecturer likes the topic because',
        ans: 'B',
        opts: [
          { key: 'A', text: 'it links to a previous research topic.' },
          { key: 'B', text: 'the whole class will be interested in it.' },
          { key: 'C', text: 'there is plenty of information to write about.' }
        ],
        exp: 'The tutor notes that music and nostalgic memory has broad appeal across all students in the class.'
      },
      {
        num: 22,
        text: 'When talking about their teenage years, participants in a study were asked to say',
        ans: 'B',
        opts: [
          { key: 'A', text: 'how often they listened to music' },
          { key: 'B', text: 'who some music reminded them of' },
          { key: 'C', text: 'whether their musical tastes had changed' }
        ],
        exp: 'Participants were specifically asked to identify friends and relatives evoked by songs from their youth.'
      },
      {
        num: 23,
        text: 'The study is important because it is the first to',
        ans: 'A',
        opts: [
          { key: 'A', text: 'involve so many participants.' },
          { key: 'B', text: 'do research into this topic area.' },
          { key: 'C', text: 'show a link between music and social class' }
        ],
        exp: 'Its primary significance lies in its large-scale sample size exceeding earlier experiments.'
      },
      {
        num: 24,
        text: 'Sarah doubts the findings of the study because she thinks',
        ans: 'C',
        opts: [
          { key: 'A', text: 'the research was rushed.' },
          { key: 'B', text: 'some people wouldn’t fit the findings.' },
          { key: 'C', text: 'the information given may not be reliable' }
        ],
        exp: 'Sarah questions self-reported recollections since memory is prone to subjective bias.'
      }
    ];

    for (const q of s3Mcq) {
      const qRes = await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, explanation, points
        ) VALUES (
          $1, $2, $3, $4, 'multiple_choice',
          $5, 'Choose the correct letter, A, B, or C.', $6, $7, $8, 1
        ) RETURNING id`,
        [testId, s3Id, g3_1Id, mcqTypeId, q.num, q.text, q.ans, q.exp]
      );
      for (let i = 0; i < q.opts.length; i++) {
        await client.query(
          'INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number) VALUES ($1, $2, $3, $4, $5)',
          [qRes.rows[0].id, q.opts[i].key, q.opts[i].text, q.opts[i].key === q.ans, i + 1]
        );
      }
    }

    // Group 3.2: Q25–30 Matching comments A–G
    const g3_2 = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
       VALUES ($1, 'Questions 25–30: Comments on presentation sections', 'What comments do Mike and Sarah make about each section of the presentation? Choose SIX answers from the box and write the correct letter, A–G.', $2, 2)
       RETURNING id`,
      [s3Id, audioIds[2]]
    );
    const g3_2Id = g3_2.rows[0].id;

    const commentOptions = [
      { key: 'A', text: 'the information is inaccurate' },
      { key: 'B', text: 'not interesting enough' },
      { key: 'C', text: 'too detailed' },
      { key: 'D', text: 'the statistics are incomplete' },
      { key: 'E', text: 'need more expert opinions' },
      { key: 'F', text: 'need to make it more relevant' },
      { key: 'G', text: 'present both sides' }
    ];

    const s3Matching = [
      { num: 25, text: 'Background to the study', ans: 'C', exp: 'They agree the background covers excessive minutiae (too detailed).' },
      { num: 26, text: 'Other similar research', ans: 'B', exp: 'They remark that this section feels dry and dull (not interesting enough).' },
      { num: 27, text: 'Findings', ans: 'G', exp: 'They recommend contrasting conflicting interpretations (present both sides).' },
      { num: 28, text: 'Market research', ans: 'D', exp: 'Key demographic percentages were omitted (the statistics are incomplete).' },
      { num: 29, text: 'Limitations of the research', ans: 'E', exp: 'They note quotes from recognized psychologists are lacking (need more expert opinions).' },
      { num: 30, text: 'Future research', ans: 'F', exp: 'The proposals need to link directly to current industry challenges (make it more relevant).' }
    ];

    for (const q of s3Matching) {
      const qRes = await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, explanation, points
        ) VALUES (
          $1, $2, $3, $4, 'matching',
          $5, 'Choose the correct letter, A–G.', $6, $7, $8, 1
        ) RETURNING id`,
        [testId, s3Id, g3_2Id, matchingTypeId, q.num, q.text, q.ans, q.exp]
      );
      for (let i = 0; i < commentOptions.length; i++) {
        await client.query(
          'INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number) VALUES ($1, $2, $3, $4, $5)',
          [qRes.rows[0].id, commentOptions[i].key, commentOptions[i].text, commentOptions[i].key === q.ans, i + 1]
        );
      }
    }
    console.log('Section 3 (Q21-30) inserted successfully.');

    // ==========================================
    // SECTION 4: Questions 31–40
    // ==========================================
    const s4Res = await client.query(
      `INSERT INTO test_sections (test_id, title, order_number, instructions, audio_id, time_limit_minutes)
       VALUES ($1, 'Section 4: Effects of Drama Activities on Children', 4, 'Listen and answer questions 31–40.', $2, 10)
       RETURNING id`,
      [testId, audioIds[3]]
    );
    const s4Id = s4Res.rows[0].id;

    const g4Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, media_id, order_number)
       VALUES ($1, 'Questions 31–40: Effects of Drama Activities on Children', 'Complete the notes below. Write ONE WORD ONLY for each answer.', $2, 1)
       RETURNING id`,
      [s4Id, audioIds[3]]
    );
    const g4Id = g4Res.rows[0].id;

    const s4Questions = [
      {
        num: 31,
        text: 'firstly, group participation develops [31] in their own ideas',
        ans: 'confidence',
        accepted: ['confidence'],
        explanation: 'The speaker explains that drama cultivates confidence in expressing thoughts.'
      },
      {
        num: 32,
        text: 'unscripted, imaginative activities allow children to take [32]',
        ans: 'risks',
        accepted: ['risks', 'risk'],
        explanation: 'Improvisational theater gives pupils the safety to take creative risks.'
      },
      {
        num: 33,
        text: 'Also, working as a group teaches the importance of [33] to others',
        ans: 'listening',
        accepted: ['listening'],
        explanation: 'Collaborative acting reinforces active listening among peers.'
      },
      {
        num: 34,
        text: 'performance makes children [34] for their learning and behavior.',
        ans: 'responsible',
        accepted: ['responsible'],
        explanation: 'Taking the stage instills a sense of being responsible for one’s actions.'
      },
      {
        num: 35,
        text: 'The value of role play: to function as a form of [35] for children experiencing difficulties.',
        ans: 'therapy',
        accepted: ['therapy'],
        explanation: 'Dramatic arts serve therapeutic functions for troubled youngsters.'
      },
      {
        num: 36,
        text: 'to explore controversial subjects with a class in a [36] environment',
        ans: 'safe',
        accepted: ['safe'],
        explanation: 'Role-play provides a safe and structured setting to examine sensitive themes.'
      },
      {
        num: 37,
        text: "to develop children's self-knowledge and understanding of [37]",
        ans: 'morality',
        accepted: ['morality'],
        explanation: 'Enacting ethical dilemmas helps students grasp principles of morality.'
      },
      {
        num: 38,
        text: "drama activities increase children's [38] in class.",
        ans: 'participation',
        accepted: ['participation'],
        explanation: 'History lectures with drama stimulate greater classroom participation.'
      },
      {
        num: 39,
        text: 'make it easier for children to [39] and understand historical event.',
        ans: 'remember',
        accepted: ['remember'],
        explanation: 'Embodying characters enables pupils to remember historical occurrences long term.'
      },
      {
        num: 40,
        text: 'find answer to [40] in history to see why certain decisions were made.',
        ans: 'problems',
        accepted: ['problems', 'problem'],
        explanation: 'Students analyze the real dilemmas and problems faced by historical leaders.'
      }
    ];

    for (const q of s4Questions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type_id, question_type,
          question_number, instruction, question_text, correct_answer, accepted_answers, explanation, points
        ) VALUES (
          $1, $2, $3, $4, 'short_answer',
          $5, 'Write ONE WORD ONLY for each answer.', $6, $7, $8, $9, 1
        )`,
        [testId, s4Id, g4Id, shortAnswerTypeId, q.num, q.text, q.ans, JSON.stringify(q.accepted), q.explanation]
      );
    }
    console.log('Section 4 (Q31-40) inserted successfully.');

    await client.query('COMMIT');
    console.log('✅ Listening Test 24 fully committed to database!');
    console.log(`Test ID: ${testId}`);
    console.log(`URL: /listening/${testId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to import Listening Test 24:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
