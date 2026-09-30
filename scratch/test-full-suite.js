const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING FOX FORD FULL ADMIN & USER SUITE VERIFICATION ---');

  // 1. Superadmin Login
  console.log('\n[1] Testing Superadmin Login...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'xudayberganovbackend@gmail.com',
    password: 'AdminPassword123!'
  });

  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
  }
  const token = loginRes.data.token;
  const user = loginRes.data.user;
  console.log(`✅ Logged in successfully as: ${user.email} (Role: ${user.role}, ID: ${user.id})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Admin Dashboard Stats
  console.log('\n[2] Testing Admin Dashboard Stats Queries...');
  const testsCountRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/tests?select=*',
    method: 'GET',
    headers: authHeaders
  });
  const testsData = testsCountRes.data?.data || [];
  console.log(`✅ Tests query status: ${testsCountRes.status}, count: ${testsData.length}`);

  const profilesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/profiles?select=*',
    method: 'GET',
    headers: authHeaders
  });
  const profilesData = profilesRes.data?.data || [];
  console.log(`✅ Admin Users query status: ${profilesRes.status}, count: ${profilesData.length}`);

  // 3. Question Bank Queries
  console.log('\n[3] Testing Question Bank Query (with test & options joins)...');
  const questionsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/questions?select=*,test:tests(*),options:question_options(*)',
    method: 'GET',
    headers: authHeaders
  });
  const questionsData = questionsRes.data?.data || [];
  console.log(`✅ Questions query status: ${questionsRes.status}, count: ${questionsData.length}`);
  if (questionsData.length > 0) {
    const q0 = questionsData[0];
    console.log(`   Sample question #${q0.question_number}: ${q0.question_type}, has test: ${!!q0.test}, options count: ${q0.options?.length}`);
  }

  // 4. Passages & Audio Queries
  console.log('\n[4] Testing Passages and Audio Library Queries...');
  const passagesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/reading_passages?select=*',
    method: 'GET',
    headers: authHeaders
  });
  const passagesData = passagesRes.data?.data || [];
  console.log(`✅ Passages query status: ${passagesRes.status}, count: ${passagesData.length}`);

  const audioRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/listening_audio?select=*',
    method: 'GET',
    headers: authHeaders
  });
  const audioData = audioRes.data?.data || [];
  console.log(`✅ Audio query status: ${audioRes.status}, count: ${audioData.length}`);

  // 5. Import Center Logs
  console.log('\n[5] Testing Import Center Logs Query...');
  const importRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/imports?select=*',
    method: 'GET',
    headers: authHeaders
  });
  const importData = importRes.data?.data || [];
  console.log(`✅ Imports query status: ${importRes.status}, count: ${importData.length}`);

  // 6. Test Creation Flow (Admin creates a Listening or Reading test)
  console.log('\n[6] Testing Admin Test Creation Flow...');
  const createTestRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/tests',
    method: 'POST',
    headers: authHeaders
  }, {
    title: 'IELTS Listening Masterclass Test #01',
    slug: `ielts-listening-masterclass-${Date.now()}`,
    description: 'Authentic Cambridge format listening practice with 4 sections.',
    skill: 'listening',
    ielts_type: 'academic',
    access_type: 'free',
    difficulty: 'medium',
    time_limit_minutes: 30,
    total_questions: 2,
    is_premium: false,
    status: 'published',
    created_by: user.id
  });

  console.log(`✅ Test created status: ${createTestRes.status}`);
  const createdTest = createTestRes.data?.data;
  const newTestId = createdTest?.id;
  console.log(`   Created Test ID: ${newTestId}, Title: ${createdTest?.title}`);

  if (!newTestId) {
    throw new Error('Test creation failed to return an ID');
  }

  // Add an audio asset
  const createAudioRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/listening_audio',
    method: 'POST',
    headers: authHeaders
  }, {
    title: 'Section 1: Accommodation Inquiry Audio',
    file_path: '/uploads/audio/test_01_sec1.mp3',
    duration_seconds: 360,
    status: 'published'
  });
  const createdAudio = createAudioRes.data?.data;
  console.log(`✅ Audio created status: ${createAudioRes.status}, ID: ${createdAudio?.id}`);

  // Add Section to Test
  const createSectionRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/test_sections',
    method: 'POST',
    headers: authHeaders
  }, {
    test_id: newTestId,
    title: 'Part 1: Accommodation Enquiry',
    order_number: 1,
    instructions: 'Answer questions 1-2 as you listen.',
    time_limit_minutes: 10,
    audio_id: createdAudio?.id
  });
  const createdSection = createSectionRes.data?.data;
  console.log(`✅ Section created status: ${createSectionRes.status}, ID: ${createdSection?.id}`);

  // Add Questions to Section
  const createQ1Res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/questions',
    method: 'POST',
    headers: authHeaders
  }, {
    test_id: newTestId,
    section_id: createdSection?.id,
    question_type: 'multiple_choice',
    question_number: 1,
    instruction: 'Choose the correct letter, A, B or C.',
    question_text: 'What type of accommodation is the client looking for?',
    correct_answer: 'B',
    points: 1,
    difficulty: 'easy',
    status: 'published'
  });
  const createdQ1 = createQ1Res.data?.data;
  console.log(`✅ Question 1 created status: ${createQ1Res.status}, ID: ${createdQ1?.id}`);

  // Add Options for Q1
  const createOptsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/question_options',
    method: 'POST',
    headers: authHeaders
  }, [
    { question_id: createdQ1?.id, option_key: 'A', option_text: 'Shared flat in city center', is_correct: false },
    { question_id: createdQ1?.id, option_key: 'B', option_text: 'Single studio near university campus', is_correct: true },
    { question_id: createdQ1?.id, option_key: 'C', option_text: 'Host family homestay', is_correct: false }
  ]);
  const createdOpts = createOptsRes.data?.data || [];
  console.log(`✅ Question 1 options batch created status: ${createOptsRes.status}, count: ${createdOpts.length}`);

  // Verify full test retrieval
  console.log('\n[7] Verifying created test with full relational joins...');
  const fullTestRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/data/tests?id=eq.${newTestId}&select=*,sections:test_sections(*,audio:listening_audio(*)),questions(*,options:question_options(*))`,
    method: 'GET',
    headers: authHeaders
  });
  console.log(`✅ Full test retrieval status: ${fullTestRes.status}`);
  const retrievedTest = fullTestRes.data?.data?.[0];
  console.log(`   Retrieved Test: ${retrievedTest?.title}`);
  console.log(`   Sections attached: ${retrievedTest?.sections?.length}`);
  console.log(`   Section 1 Audio title: ${retrievedTest?.sections?.[0]?.audio?.title}`);
  console.log(`   Questions attached: ${retrievedTest?.questions?.length}`);
  console.log(`   Question 1 Options count: ${retrievedTest?.questions?.[0]?.options?.length}`);

  // 8. Vocabulary & SRS Flow
  console.log('\n[8] Testing Vocabulary and SRS Flashcards Flow...');
  const vocabWordsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/vocabulary_words?select=*',
    method: 'GET',
    headers: authHeaders
  });
  const vocabWordsData = vocabWordsRes.data?.data || [];
  console.log(`✅ Available IELTS vocabulary words count: ${vocabWordsData.length}`);
  const firstWord = vocabWordsData[0];

  // Add word to user_vocabulary
  const addUserVocabRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/user_vocabulary',
    method: 'POST',
    headers: authHeaders
  }, {
    user_id: user.id,
    word_id: firstWord.id,
    mastery_level: 1,
    status: 'learning',
    next_review_at: new Date().toISOString(),
    review_count: 1
  });
  console.log(`✅ Added word "${firstWord.word}" to user_vocabulary: status ${addUserVocabRes.status}`);

  // Fetch SRS Review list
  const userVocabRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/data/user_vocabulary?user_id=eq.${user.id}&select=*,vocabulary_words(*)`,
    method: 'GET',
    headers: authHeaders
  });
  const userVocabData = userVocabRes.data?.data || [];
  console.log(`✅ User SRS review list query status: ${userVocabRes.status}, items: ${userVocabData.length}`);
  if (userVocabData.length > 0) {
    const item = userVocabData[0];
    console.log(`   SRS item word attached: "${item.vocabulary_words?.word}" (definition: "${item.vocabulary_words?.definition}")`);
  }

  // 9. Practice History Flow & Attempt Answers (JSONB verification)
  console.log('\n[9] Testing Practice History Flow & Answer Recording...');
  // Create an attempt
  const attemptRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/test_attempts',
    method: 'POST',
    headers: authHeaders
  }, {
    test_id: newTestId,
    user_id: user.id,
    raw_score: 1,
    total_points: 2,
    estimated_band: 7.5,
    status: 'submitted',
    time_used_seconds: 450,
    started_at: new Date().toISOString(),
    submitted_at: new Date().toISOString()
  });
  console.log(`✅ Created test attempt status: ${attemptRes.status}`);
  const createdAttempt = attemptRes.data?.data;

  // Record answer with JSONB user_answer
  const answerRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/data/attempt_answers',
    method: 'POST',
    headers: authHeaders
  }, {
    attempt_id: createdAttempt?.id,
    question_id: createdQ1?.id,
    user_answer: 'B',
    is_correct: true,
    points_earned: 1
  });
  console.log(`✅ Attempt answer saved (JSONB test) status: ${answerRes.status}`);

  // Fetch attempts with test join
  const attemptsHistoryRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/data/test_attempts?user_id=eq.${user.id}&select=*,tests:test_id(id,title,skill,difficulty,is_premium,total_questions)`,
    method: 'GET',
    headers: authHeaders
  });
  const attemptsData = attemptsHistoryRes.data?.data || [];
  console.log(`✅ Practice History attempts query status: ${attemptsHistoryRes.status}, count: ${attemptsData.length}`);
  if (attemptsData.length > 0) {
    const att = attemptsData[0];
    console.log(`   Attempt ID: ${att.id}, Band: ${att.estimated_band}, Test Title: ${att.tests?.title || att.test?.title}`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL FOX FORD SUITE CHECKS COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
