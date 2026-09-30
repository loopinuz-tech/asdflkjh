import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function seed() {
  await client.connect()
  console.log('Connected for seeding admin data...')

  // 1. Insert missing question types into question_types table
  const newTypes = [
    { name: 'Multiple Response', slug: 'multiple_response', skill: 'reading', description: 'Choose multiple correct answers from a list' },
    { name: 'Writing Task 1', slug: 'writing_task_1', skill: 'writing', description: 'Describe visual information (graph, chart, map, diagram) in at least 150 words' },
    { name: 'Writing Task 2', slug: 'writing_task_2', skill: 'writing', description: 'Write a formal essay of at least 250 words in response to a point of view, argument or problem' },
    { name: 'Speaking Part 1', slug: 'speaking_part_1', skill: 'speaking', description: 'Introduction and general interview about familiar topics (4-5 minutes)' },
    { name: 'Speaking Part 2', slug: 'speaking_part_2', skill: 'speaking', description: 'Individual long turn / Cue Card with 1 minute preparation (3-4 minutes)' },
    { name: 'Speaking Part 3', slug: 'speaking_part_3', skill: 'speaking', description: 'Two-way discussion on abstract issues linked to Part 2 (4-5 minutes)' }
  ]

  for (const t of newTypes) {
    await client.query(`
      INSERT INTO question_types (name, slug, skill, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET name = $1, description = $4;
    `, [t.name, t.slug, t.skill, t.description])
  }
  console.log('Question types updated.')

  // 2. Insert tags
  const tags = [
    { name: 'Cambridge 19', slug: 'cambridge-19', color: '#f59e0b' },
    { name: 'Cambridge 18', slug: 'cambridge-18', color: '#10b981' },
    { name: 'Academic', slug: 'academic', color: '#3b82f6' },
    { name: 'General Training', slug: 'general-training', color: '#8b5cf6' },
    { name: 'Environment', slug: 'environment', color: '#059669' },
    { name: 'Technology', slug: 'technology', color: '#0284c7' },
    { name: 'History', slug: 'history', color: '#d97706' },
    { name: 'Education', slug: 'education', color: '#e11d48' }
  ]
  for (const tag of tags) {
    await client.query(`
      INSERT INTO tags (name, slug, color)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO NOTHING;
    `, [tag.name, tag.slug, tag.color])
  }
  console.log('Tags seeded.')

  // Check if tests already exist
  const testCountRes = await client.query('SELECT count(*) FROM tests;')
  if (parseInt(testCountRes.rows[0].count, 10) === 0) {
    console.log('Seeding initial IELTS tests...')

    // Create Reading Passage 1
    const passageRes = await client.query(`
      INSERT INTO reading_passages (title, content, word_count, difficulty, status)
      VALUES (
        'The Roman Amphitheatre of Arles',
        '<div class="reading-passage"><p>Built in 90 AD by the Roman Empire, the amphitheatre at Arles in southern France could hold over 20,000 spectators and was constructed to provide entertainment in the form of chariot races and bloody hand-to-hand battles.</p><p>Today, it draws large crowds for bullfighting during the Feria d''Arles, as well as plays and concerts in the summer. Measuring 136 metres in length and 107 metres in width, it is slightly larger than the nearby arena at Nîmes and ranks among the 20 largest Roman amphitheatres still in existence.</p><p>The towers jutting out at the top are medieval additions, converted into a fortified town with over 200 houses during the 6th to 18th centuries before restoration began in the 1830s under writer Prosper Mérimée.</p></div>',
        380,
        'medium',
        'published'
      )
      RETURNING id;
    `)
    const passageId = passageRes.rows[0].id

    // Create Test 1: Reading Academic
    const test1Res = await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, status, 
        time_limit_minutes, total_questions, ielts_type, access_type, tags
      ) VALUES (
        'Cambridge IELTS 19 — Academic Reading Test 1',
        'cambridge-ielts-19-reading-test-1',
        'Full 40-question academic reading test including architectural history, biodiversity, and cognitive psychology passages.',
        'reading',
        'medium',
        false,
        'published',
        60,
        40,
        'academic',
        'free',
        ARRAY['cambridge-19', 'academic', 'history']
      )
      RETURNING id;
    `)
    const test1Id = test1Res.rows[0].id

    // Section 1
    const sec1Res = await client.query(`
      INSERT INTO test_sections (test_id, title, order_number, instructions, time_limit_minutes, passage_id)
      VALUES ($1, 'Reading Passage 1: The Roman Amphitheatre of Arles', 1, 'You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.', 20, $2)
      RETURNING id;
    `, [test1Id, passageId])
    const sec1Id = sec1Res.rows[0].id

    // Question Group 1: Q1 - Q5 (True/False/Not Given)
    const qg1Res = await client.query(`
      INSERT INTO question_groups (section_id, title, instruction, passage_id, order_number)
      VALUES ($1, 'Questions 1–5', 'Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE or NOT GIVEN.', $2, 1)
      RETURNING id;
    `, [sec1Id, passageId])
    const qg1Id = qg1Res.rows[0].id

    // Get question type IDs
    const qtTfng = (await client.query("SELECT id FROM question_types WHERE slug = 'true_false_not_given'")).rows[0]?.id
    const qtMc = (await client.query("SELECT id FROM question_types WHERE slug = 'multiple_choice'")).rows[0]?.id
    const qtSc = (await client.query("SELECT id FROM question_types WHERE slug = 'sentence_completion'")).rows[0]?.id

    // Q1
    const q1 = await client.query(`
      INSERT INTO questions (
        test_id, section_id, group_id, question_type_id, question_type, 
        question_number, instruction, question_text, points, difficulty,
        correct_answer, accepted_answers, status
      ) VALUES (
        $1, $2, $3, $4, 'true_false_not_given',
        1, 'Choose TRUE, FALSE, or NOT GIVEN',
        'The amphitheatre at Arles was originally constructed during the first century AD.',
        1, 'medium',
        'TRUE', '["TRUE", "T"]'::jsonb, 'published'
      ) RETURNING id;
    `, [test1Id, sec1Id, qg1Id, qtTfng])

    // Q2
    await client.query(`
      INSERT INTO questions (
        test_id, section_id, group_id, question_type_id, question_type, 
        question_number, instruction, question_text, points, difficulty,
        correct_answer, accepted_answers, status
      ) VALUES (
        $1, $2, $3, $4, 'true_false_not_given',
        2, 'Choose TRUE, FALSE, or NOT GIVEN',
        'The amphitheatre at Nîmes can accommodate more people than the Arles amphitheatre.',
        1, 'medium',
        'FALSE', '["FALSE", "F"]'::jsonb, 'published'
      );
    `, [test1Id, sec1Id, qg1Id, qtTfng])

    // Q3 Multiple choice
    const q3 = await client.query(`
      INSERT INTO questions (
        test_id, section_id, group_id, question_type_id, question_type, 
        question_number, instruction, question_text, points, difficulty,
        correct_answer, accepted_answers, status
      ) VALUES (
        $1, $2, $3, $4, 'multiple_choice',
        3, 'Choose the correct letter, A, B, C or D.',
        'During the medieval era, the Arles amphitheatre was primarily used as:',
        1, 'medium',
        'B', '["B"]'::jsonb, 'published'
      ) RETURNING id;
    `, [test1Id, sec1Id, qg1Id, qtMc])

    const q3Id = q3.rows[0].id
    await client.query(`
      INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_number)
      VALUES 
        ($1, 'A', 'A military prison for Roman captives', false, 1),
        ($1, 'B', 'A fortified settlement containing residential houses', true, 2),
        ($1, 'C', 'An administrative hall for local government', false, 3),
        ($1, 'D', 'A granary storage complex for grain and wine', false, 4);
    `, [q3Id])

    // Test 2: Listening Test (Premium)
    await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, status, 
        time_limit_minutes, total_questions, ielts_type, access_type, tags
      ) VALUES (
        'Cambridge IELTS 19 — Listening Test 2 (Audio & Transcript)',
        'cambridge-ielts-19-listening-test-2',
        'Authentic IELTS 4-section listening practice with high-definition audio, student note completion and map labeling.',
        'listening',
        'hard',
        true,
        'published',
        40,
        40,
        'academic',
        'premium',
        ARRAY['cambridge-19', 'listening', 'premium']
      );
    `)

    // Test 3: Writing Task 1 & 2
    await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, status, 
        time_limit_minutes, total_questions, ielts_type, access_type, tags
      ) VALUES (
        'IELTS Writing Master Mock — Academic Tasks 1 & 2',
        'ielts-writing-master-mock-task-1-2',
        'Official style writing exam. Task 1: Renewable energy production bar chart. Task 2: Remote work and urbanization debate.',
        'writing',
        'hard',
        false,
        'published',
        60,
        2,
        'academic',
        'free',
        ARRAY['writing', 'academic', 'technology']
      );
    `)

    // Test 4: Draft Test
    await client.query(`
      INSERT INTO tests (
        title, slug, description, skill, difficulty, is_premium, status, 
        time_limit_minutes, total_questions, ielts_type, access_type, tags
      ) VALUES (
        'IELTS General Training — Section 1 Consumer Services (Draft)',
        'ielts-gt-section-1-consumer-services-draft',
        'Draft version for General Training candidates preparing for work or immigration.',
        'reading',
        'easy',
        false,
        'draft',
        60,
        14,
        'general_training',
        'free',
        ARRAY['general-training', 'draft']
      );
    `)
    console.log('Sample IELTS tests seeded successfully.')
  }

  // 3. Seed sample admin activity logs
  const logCount = await client.query('SELECT count(*) FROM admin_activity_logs;')
  if (parseInt(logCount.rows[0].count, 10) === 0) {
    await client.query(`
      INSERT INTO admin_activity_logs (action, target_type, target_id, details, created_at)
      VALUES 
        ('test_created', 'test', 'cambridge-19-reading-1', '{"title": "Cambridge IELTS 19 — Academic Reading Test 1", "module": "reading"}'::jsonb, NOW() - INTERVAL '2 days'),
        ('test_published', 'test', 'cambridge-19-reading-1', '{"title": "Cambridge IELTS 19 — Academic Reading Test 1"}'::jsonb, NOW() - INTERVAL '36 hours'),
        ('pdf_imported', 'import', 'imp-pdf-01', '{"source": "Cambridge_19_Academic_Official.pdf", "questions_detected": 40, "passages": 3}'::jsonb, NOW() - INTERVAL '18 hours'),
        ('audio_uploaded', 'media', 'audio-sec-1', '{"filename": "IELTS_Listening_Sec1_Track.mp3", "duration_seconds": 380}'::jsonb, NOW() - INTERVAL '12 hours'),
        ('question_edited', 'question', 'q-3', '{"question_number": 3, "field": "options", "changes": "Updated option B distractor"}'::jsonb, NOW() - INTERVAL '4 hours'),
        ('test_published', 'test', 'ielts-writing-master-mock', '{"title": "IELTS Writing Master Mock — Academic Tasks 1 & 2"}'::jsonb, NOW() - INTERVAL '1 hour');
    `)
    console.log('Admin activity logs seeded.')
  }

  await client.end()
  console.log('Seeding complete!')
}

seed().catch(console.error)
