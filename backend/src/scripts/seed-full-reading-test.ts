import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectionString =
  process.argv[2] ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:1234/foxford';

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString,
  ssl: !isLocalhost ? { rejectUnauthorized: false } : false,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding IELTS Academic Reading Test 3 from Full Reading Test.html...');

    // 0. Remove older version of this test if exists to avoid duplicates
    const slug = 'ielts-academic-reading-test-3';
    const existingTest = await client.query('SELECT id FROM tests WHERE slug = $1', [slug]);
    if (existingTest.rows.length > 0) {
      console.log('Deleting existing test with slug:', slug);
      await client.query('DELETE FROM tests WHERE id = $1', [existingTest.rows[0].id]);
    }

    // 1. Load HTML file to extract exact passages
    const htmlPath = path.resolve(__dirname, '../../../Full Reading Test.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    function getSectionBetween(startMarker: string, endMarker: string) {
      const s = htmlContent.indexOf(startMarker);
      if (s === -1) return '';
      const e = endMarker ? htmlContent.indexOf(endMarker, s) : htmlContent.length;
      return htmlContent.substring(s, e);
    }

    function extractPassageBody(raw: string) {
      const start = raw.indexOf('<div class="passage">');
      if (start === -1) return raw;
      const contentStart = start + '<div class="passage">'.length;
      const lastClose = raw.lastIndexOf('</div>');
      const secondLastClose = raw.lastIndexOf('</div>', lastClose - 1);
      return raw.substring(contentStart, secondLastClose).trim();
    }

    const p1Raw = getSectionBetween('id="p1_passage"', 'id="p1_questions"');
    const p2Raw = getSectionBetween('id="p2_passage"', 'id="p2_questions"');
    const p3Raw = getSectionBetween('id="p3_passage"', 'id="p3_questions"');

    const p1Body = extractPassageBody(p1Raw);
    const p2Body = extractPassageBody(p2Raw);
    const p3Body = extractPassageBody(p3Raw);

    // 2. Insert Reading Passages
    const p1Res = await client.query(
      `INSERT INTO reading_passages (title, content, difficulty, status)
       VALUES ($1, $2, 'medium', 'published') RETURNING id`,
      ['Feeding the World', p1Body]
    );
    const passage1Id = p1Res.rows[0].id;

    const p2Res = await client.query(
      `INSERT INTO reading_passages (title, content, difficulty, status)
       VALUES ($1, $2, 'medium', 'published') RETURNING id`,
      ['Ideal Homes', p2Body]
    );
    const passage2Id = p2Res.rows[0].id;

    const p3Res = await client.query(
      `INSERT INTO reading_passages (title, content, difficulty, status)
       VALUES ($1, $2, 'hard', 'published') RETURNING id`,
      ['Some views on the use of headphones', p3Body]
    );
    const passage3Id = p3Res.rows[0].id;

    // 3. Insert Main Test
    const testRes = await client.query(
      `INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, access_type, status,
        time_limit_minutes, total_questions, ielts_type, tags
      ) VALUES (
        'IELTS Academic Reading Test 3',
        $1,
        'Authentic IELTS Academic Reading Mock Test with 40 questions. Passage 1: Feeding the World (Agriculture & Sustainability). Passage 2: Ideal Homes (Architecture & Passive Cooling). Passage 3: Some views on the use of headphones (Sociology & Modern Work).',
        'reading',
        'medium',
        false,
        'free',
        'published',
        60,
        40,
        'academic',
        ARRAY['reading', 'cambridge', 'mock', 'academic', 'test-3']
      ) RETURNING id`,
      [slug]
    );
    const testId = testRes.rows[0].id;
    console.log('Created Test ID:', testId);

    // -------------------------------------------------------------
    // SECTION 1: Passage 1 (Questions 1–13)
    // -------------------------------------------------------------
    const sec1Res = await client.query(
      `INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, passage_id)
       VALUES ($1, 'Reading Passage 1', 1, 'You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1.', 20, $2)
       RETURNING id`,
      [testId, passage1Id]
    );
    const sec1Id = sec1Res.rows[0].id;

    // Group 1.1: Q1–4 Matching Opinions with People
    const grp1Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 1–4: Match opinions with people', 'Match each opinion with the correct person, A, B, C, or D.', $2, 1)
       RETURNING id`,
      [sec1Id, passage1Id]
    );
    const grp1Id = grp1Res.rows[0].id;

    const peopleOptions = [
      { label: 'A', text: 'Kenneth Cassman' },
      { label: 'B', text: 'Bill Liebhardt' },
      { label: 'C', text: 'Vaclav Smil' },
      { label: 'D', text: 'Ron Olson' },
    ];

    const p1MatchingQuestions = [
      { num: 1, text: "Without the use of synthetic fertilizers, the world's population would be severely depleted.", ans: 'C' },
      { num: 2, text: 'We need agricultural methods that work for farmers in different parts of the world.', ans: 'A' },
      { num: 3, text: 'In the future, the quantity of fertilizer used in traditional agriculture can be reduced.', ans: 'D' },
      { num: 4, text: 'The output from organic soils is very near that from standard farming methods.', ans: 'B' },
    ];

    for (const q of p1MatchingQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'matching_features', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec1Id, grp1Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: peopleOptions }),
        ]
      );
    }

    // Group 1.2: Q5–9 YES / NO / NOT GIVEN
    const grp2Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 5–9: YES / NO / NOT GIVEN', 'Do the following statements agree with the claims of the writer in Reading Passage 1? Choose YES, NO, or NOT GIVEN.', $2, 2)
       RETURNING id`,
      [sec1Id, passage1Id]
    );
    const grp2Id = grp2Res.rows[0].id;

    const ynngOptions = [
      { label: 'YES', text: 'YES' },
      { label: 'NO', text: 'NO' },
      { label: 'NOT GIVEN', text: 'NOT GIVEN' },
    ];

    const p1YnngQuestions = [
      { num: 5, text: 'There are only two real farming options worth considering.', ans: 'NO' },
      { num: 6, text: 'Farmers need to act on locally relevant information.', ans: 'YES' },
      { num: 7, text: 'Chemical fertilizers are expensive to produce.', ans: 'NOT GIVEN' },
      { num: 8, text: 'Successful organic farming requires crop rotation.', ans: 'YES' },
      { num: 9, text: 'Farmers are unable to meet demand for grain.', ans: 'NO' },
    ];

    for (const q of p1YnngQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'yes_no_not_given', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec1Id, grp2Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: ynngOptions }),
        ]
      );
    }

    // Group 1.3: Q10–13 Summary Completion
    const grp3Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 10–13: Complete the summary', 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.', $2, 3)
       RETURNING id`,
      [sec1Id, passage1Id]
    );
    const grp3Id = grp3Res.rows[0].id;

    const p1SummaryQuestions = [
      {
        num: 10,
        text: 'A leading American agronomist is concerned that unless we improve our approach to food production, the world will face serious shortages by the year 2050. A government team which looked ahead at British [10] came up with a similar prediction.',
        ans: 'farming',
        accepted: ['farming', 'Farming'],
      },
      {
        num: 11,
        text: 'The pro-technology lobby believes in using crops which are [11] as well as relying heavily on agro-chemicals.',
        ans: 'genetically modified',
        accepted: ['genetically modified', 'Genetically modified', 'genetically-modified'],
      },
      {
        num: 12,
        text: 'On the other hand, [12] farmers believe passionately in natural techniques.',
        ans: 'organic',
        accepted: ['organic', 'Organic'],
      },
      {
        num: 13,
        text: 'The real problem is, however, that both natural and [13] fertilizers damage the ecosystem.',
        ans: 'chemical',
        accepted: ['chemical', 'Chemical', 'synthetic'],
      },
    ];

    for (const q of p1SummaryQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, points
        ) VALUES ($1, $2, $3, 'summary_completion', $4, $5, $6, $7, 1)`,
        [
          testId, sec1Id, grp3Id, q.num, q.text, q.ans,
          JSON.stringify(q.accepted),
        ]
      );
    }

    // -------------------------------------------------------------
    // SECTION 2: Passage 2 (Questions 14–26)
    // -------------------------------------------------------------
    const sec2Res = await client.query(
      `INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, passage_id)
       VALUES ($1, 'Reading Passage 2', 2, 'You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2.', 20, $2)
       RETURNING id`,
      [testId, passage2Id]
    );
    const sec2Id = sec2Res.rows[0].id;

    // Group 2.1: Q14–18 Match Information to Paragraphs
    const grp4Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 14–18: Match information to paragraphs', 'Reading Passage 2 has eleven paragraphs, A–K. Which paragraph contains the following information? Write the correct letter, A–K.', $2, 1)
       RETURNING id`,
      [sec2Id, passage2Id]
    );
    const grp4Id = grp4Res.rows[0].id;

    const paragraphOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((l) => ({
      label: l,
      text: `Paragraph ${l}`,
    }));

    const p2MatchingInfoQuestions = [
      { num: 14, text: 'Reasons why a particular construction material is advantageous', ans: 'G' },
      { num: 15, text: 'An example of a construction design which benefits domestic interaction', ans: 'E' },
      { num: 16, text: 'A description of a house that is ventilated naturally', ans: 'A' },
      { num: 17, text: 'An example of self-sufficient energy supply', ans: 'J' },
      { num: 18, text: 'Suggested methods of reducing temperatures in urban areas', ans: 'C' },
    ];

    for (const q of p2MatchingInfoQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'matching_information', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec2Id, grp4Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: paragraphOptions }),
        ]
      );
    }

    // Group 2.2: Q19–22 Match People with Ideas
    const grp5Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 19–22: Match people with ideas', 'Look at the following researchers and the list of ideas below. Match each researcher with the correct idea, A–G.', $2, 2)
       RETURNING id`,
      [sec2Id, passage2Id]
    );
    const grp5Id = grp5Res.rows[0].id;

    const ideasOptions = [
      { label: 'A', text: 'Cool roofs can significantly decrease cooling demand in tropical and sub-tropical regions' },
      { label: 'B', text: 'Wind towers have been successfully tested in hot climates' },
      { label: 'C', text: 'The layout of modern Malaysian cities should incorporate traditional cooling concepts' },
      { label: 'D', text: 'Modern homes should be designed to cool naturally without air-conditioning' },
      { label: 'E', text: 'Energy-efficient building design can eliminate the need for standard heating and cooling' },
      { label: 'F', text: 'New building materials should be subsidized by governments in developing countries' },
      { label: 'G', text: 'There is a very simple solution that can save on the cost of air-conditioning' },
    ];

    const p2PeopleQuestions = [
      { num: 19, text: 'Muhammad Peter Davis', ans: 'D' },
      { num: 20, text: 'Arthur Rosenfeld', ans: 'G' },
      { num: 21, text: 'R van der Ley', ans: 'A' },
      { num: 22, text: 'Amory Lovins', ans: 'E' },
    ];

    for (const q of p2PeopleQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'matching_features', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec2Id, grp5Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: ideasOptions }),
        ]
      );
    }

    // Group 2.3: Q23–26 TRUE / FALSE / NOT GIVEN
    const grp6Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 23–26: TRUE / FALSE / NOT GIVEN', 'Do the following statements agree with the information given in Reading Passage 2? Write TRUE, FALSE, or NOT GIVEN.', $2, 3)
       RETURNING id`,
      [sec2Id, passage2Id]
    );
    const grp6Id = grp6Res.rows[0].id;

    const tfngOptions = [
      { label: 'TRUE', text: 'TRUE' },
      { label: 'FALSE', text: 'FALSE' },
      { label: 'NOT GIVEN', text: 'NOT GIVEN' },
    ];

    const p2TfngQuestions = [
      { num: 23, text: 'The air temperature in modern Malaysian houses is typically lower than outdoor temperatures.', ans: 'FALSE' },
      { num: 24, text: 'The construction industry is more to blame for excessive energy consumption than other industries.', ans: 'TRUE' },
      { num: 25, text: 'The use of wind towers for cooling is widespread across modern Southeast Asia.', ans: 'FALSE' },
      { num: 26, text: "The 'super-windows' promoted by Amory Lovins are manufactured in developing nations.", ans: 'NOT GIVEN' },
    ];

    for (const q of p2TfngQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'true_false_not_given', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec2Id, grp6Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: tfngOptions }),
        ]
      );
    }

    // -------------------------------------------------------------
    // SECTION 3: Passage 3 (Questions 27–40)
    // -------------------------------------------------------------
    const sec3Res = await client.query(
      `INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, passage_id)
       VALUES ($1, 'Reading Passage 3', 3, 'You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3.', 20, $2)
       RETURNING id`,
      [testId, passage3Id]
    );
    const sec3Id = sec3Res.rows[0].id;

    // Group 3.1: Q27–31 YES / NO / NOT GIVEN
    const grp7Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 27–31: YES / NO / NOT GIVEN', 'Do the following statements agree with the claims of the writer in Reading Passage 3? Choose YES, NO, or NOT GIVEN.', $2, 1)
       RETURNING id`,
      [sec3Id, passage3Id]
    );
    const grp7Id = grp7Res.rows[0].id;

    const p3YnngQuestions = [
      { num: 27, text: 'Young people are easily persuaded by surveys that listening to music is beneficial.', ans: 'NOT GIVEN' },
      { num: 28, text: 'Different studies share the same conclusion about headphone usage in the workplace.', ans: 'YES' },
      { num: 29, text: 'Some doctors recommend wearing headphones while commuting to reduce stress.', ans: 'NOT GIVEN' },
      { num: 30, text: 'Nathaniel Baldwin was a respected government scientist when he created headphones.', ans: 'NO' },
      { num: 31, text: 'The effect of the invention of headphones on modern culture was immediately recognized.', ans: 'YES' },
    ];

    for (const q of p3YnngQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'yes_no_not_given', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec3Id, grp7Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: ynngOptions }),
        ]
      );
    }

    // Group 3.2: Q32–36 Multiple Choice
    const grp8Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 32–36: Multiple choice', 'Choose the correct letter, A, B, C, or D.', $2, 2)
       RETURNING id`,
      [sec3Id, passage3Id]
    );
    const grp8Id = grp8Res.rows[0].id;

    const p3McQuestions = [
      {
        num: 32,
        text: 'What does the writer suggest about a service economy?',
        options: [
          { label: 'A', text: 'The work is mentally demanding' },
          { label: 'B', text: 'It provides employment for younger workers' },
          { label: 'C', text: "It is a small part of a country's economy" },
          { label: 'D', text: 'Workers have to live in urban centres' },
        ],
        ans: 'A',
      },
      {
        num: 33,
        text: 'When the writer mentions the historical evidence for early music he is',
        options: [
          { label: 'A', text: 'emphasizing the technical complexity of primitive musical instruments.' },
          { label: 'B', text: 'pointing out that music was always created for ceremonial purposes.' },
          { label: 'C', text: 'suggesting that listening to music has traditionally been a collective experience.' },
          { label: 'D', text: 'questioning the assumption that modern people listen to more music than their ancestors.' },
        ],
        ans: 'C',
      },
      {
        num: 34,
        text: 'What does the writer say about the social consequences of headphone usage?',
        options: [
          { label: 'A', text: 'It discourages people from attending live performances.' },
          { label: 'B', text: 'It damages interpersonal communication within families.' },
          { label: 'C', text: 'It encourages anti-social behavior among teenagers.' },
          { label: 'D', text: 'It creates a boundary between the listener and their surroundings.' },
        ],
        ans: 'D',
      },
      {
        num: 35,
        text: 'What does the writer say about personal identity in the fifth paragraph?',
        options: [
          { label: 'A', text: 'People choose music that mirrors their inner emotions.' },
          { label: 'B', text: 'Headphones allow people to curate a private soundscape in public.' },
          { label: 'C', text: 'Music choices reflect subconscious social status.' },
          { label: 'D', text: 'Listening habits vary dramatically across generations.' },
        ],
        ans: 'B',
      },
      {
        num: 36,
        text: 'Why does the writer quote Jonah Lehrer in the final paragraph?',
        options: [
          { label: 'A', text: 'To illustrate how creative problem-solving requires periods of distraction.' },
          { label: 'B', text: 'To argue that silence is better for concentration than music.' },
          { label: 'C', text: 'To warn against the dangers of sensory overload in open-plan offices.' },
          { label: 'D', text: 'To support the claim that background noise impairs cognitive stamina.' },
        ],
        ans: 'A',
      },
    ];

    for (const q of p3McQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec3Id, grp8Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: q.options }),
        ]
      );
    }

    // Group 3.3: Q37–40 Summary Completion with Word Bank
    const grp9Res = await client.query(
      `INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
       VALUES ($1, 'Questions 37–40: Complete the summary', 'Complete the summary below using the list of words, A–I, below. Choose the correct letter, A–I.', $2, 3)
       RETURNING id`,
      [sec3Id, passage3Id]
    );
    const grp9Id = grp9Res.rows[0].id;

    const wordBankOptions = [
      { label: 'A', text: 'A - courtesy' },
      { label: 'B', text: 'B - relationship' },
      { label: 'C', text: 'C - difficulty' },
      { label: 'D', text: 'D - countryside' },
      { label: 'E', text: 'E - suburbs' },
      { label: 'F', text: 'F - language' },
      { label: 'G', text: 'G - barriers' },
      { label: 'H', text: 'H - obstacles' },
      { label: 'I', text: 'I - disapproval' },
    ];

    const p3SummaryQuestions = [
      {
        num: 37,
        text: 'The impact of headphone use on public life. Sociologist Michael Bull has explored the complex [37] that headphones have with public spaces.',
        ans: 'B',
      },
      {
        num: 38,
        text: 'Living in the centre of cities is becoming popular, as people become less keen on living in the [38].',
        ans: 'E',
      },
      {
        num: 39,
        text: 'Commuters and pedestrians use headphones to construct invisible [39] against the noise and intrusion of city life.',
        ans: 'G',
      },
      {
        num: 40,
        text: 'While some see this as an erosion of civic [40], Bull argues it is a functional adaptation to modern urban living.',
        ans: 'A',
      },
    ];

    for (const q of p3SummaryQuestions) {
      await client.query(
        `INSERT INTO questions (
          test_id, section_id, group_id, question_type, question_number, question_text, correct_answer, accepted_answers, metadata, points
        ) VALUES ($1, $2, $3, 'summary_completion', $4, $5, $6, $7, $8, 1)`,
        [
          testId, sec3Id, grp9Id, q.num, q.text, q.ans,
          JSON.stringify([q.ans]),
          JSON.stringify({ options: wordBankOptions }),
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Successfully seeded IELTS Academic Reading Test 3 with all 40 questions!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
