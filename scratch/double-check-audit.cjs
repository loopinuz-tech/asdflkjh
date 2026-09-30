const http = require('http');
const path = require('path');
const pg = require(path.resolve('backend/node_modules/pg'));
require(path.resolve('backend/node_modules/dotenv')).config({ path: path.resolve('backend/.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function httpRequest(options, postData = null) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runAudit() {
  console.log('==============================================');
  console.log('STARTING SYSTEM DOUBLE-CHECK AUDIT');
  console.log('==============================================\n');

  const results = [];

  // 1. Check Database connection & seed data
  console.log('--- 1. DATABASE INTEGRITY ---');
  try {
    const tables = [
      'users', 'profiles', 'tests', 'test_sections', 'questions',
      'question_options', 'reading_passages', 'listening_audio',
      'writing_prompts', 'speaking_prompts', 'vocabulary_words',
      'test_attempts', 'writing_submissions', 'speaking_submissions', 'progress'
    ];

    for (const t of tables) {
      const res = await pool.query(`SELECT count(*) FROM ${t}`);
      const count = parseInt(res.rows[0].count, 10);
      console.log(`Table ${t.padEnd(22)}: ${count} rows`);
      if (['test_attempts', 'writing_submissions', 'speaking_submissions', 'progress'].includes(t)) {
        if (count === 0) {
          results.push({ name: `Table ${t} clean`, passed: true });
        } else {
          results.push({ name: `Table ${t} clean`, passed: false, detail: `Found ${count} rows, expected 0` });
        }
      }
    }
    results.push({ name: 'Database Connectivity', passed: true });
  } catch (err) {
    console.error('Database check error:', err);
    results.push({ name: 'Database Connectivity', passed: false, detail: err.message });
  }

  // 2. Check Backend Core Endpoints
  console.log('\n--- 2. BACKEND API ENDPOINTS ---');
  const getEndpoints = [
    { path: '/api/health', name: 'Health check' },
    { path: '/api/tests', name: 'Tests listing' },
    { path: '/api/data/tests?select=id,title,skill&limit=2', name: 'Data proxy tests' },
    { path: '/api/data/writing_prompts?select=id,title&limit=2', name: 'Data proxy writing prompts' },
    { path: '/api/data/speaking_prompts?select=id,title&limit=2', name: 'Data proxy speaking prompts' },
    { path: '/api/data/writing_prompts?id=eq.undefined', name: 'Data proxy undefined guard' },
    { path: '/api/data/writing_prompts?id=eq.null', name: 'Data proxy null guard' },
  ];

  for (const ep of getEndpoints) {
    const res = await httpRequest({ path: ep.path, method: 'GET' });
    const passed = res.statusCode === 200;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${ep.name.padEnd(30)} => Status ${res.statusCode}`);
    results.push({ name: ep.name, passed, detail: res.error || `Status ${res.statusCode}` });
  }

  // 3. Test Speaking Evaluation Endpoint
  console.log('\n--- 3. AI EVALUATION ENDPOINTS ---');
  const speakingPayload = JSON.stringify({
    durationSeconds: 30,
    partNumber: 1,
    promptTitle: 'Double Check Test',
    promptText: 'Do you prefer morning or evening?',
    followUpQuestions: ['Why is that?']
  });

  const speakingRes = await httpRequest({
    path: '/api/tests/evaluate-speaking',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(speakingPayload)
    }
  }, speakingPayload);

  let spEvaluationPassed = false;
  try {
    const json = JSON.parse(speakingRes.data);
    if (json.success && json.evaluation && json.evaluation.overall_band > 0) {
      spEvaluationPassed = true;
      console.log(`[PASS] Speaking Evaluation AI/Algorithmic => Band ${json.evaluation.overall_band}`);
    } else {
      console.log(`[FAIL] Speaking Evaluation invalid response:`, json);
    }
  } catch (e) {
    console.log(`[FAIL] Speaking Evaluation JSON parse error:`, e.message);
  }
  results.push({ name: 'Speaking Evaluation Endpoint', passed: spEvaluationPassed });

  // 4. Test Writing Evaluation Endpoint
  const writingPayload = JSON.stringify({
    content: 'In contemporary society, technology plays an indispensable role in daily communication. While some argue that modern devices isolate individuals, I strongly believe that digital tools enhance human interaction and educational opportunities globally.',
    taskType: 'task2',
    taskTitle: 'Technology in Society',
    promptText: 'Some people think technology isolates people. Discuss.'
  });

  const writingRes = await httpRequest({
    path: '/api/tests/evaluate-essay',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(writingPayload)
    }
  }, writingPayload);

  let wrEvaluationPassed = false;
  try {
    const json = JSON.parse(writingRes.data);
    if (json.success && json.evaluation && json.evaluation.overall_band > 0) {
      wrEvaluationPassed = true;
      console.log(`[PASS] Writing Evaluation AI/Algorithmic => Band ${json.evaluation.overall_band}`);
    } else {
      console.log(`[FAIL] Writing Evaluation invalid response:`, json);
    }
  } catch (e) {
    console.log(`[FAIL] Writing Evaluation JSON parse error:`, e.message);
  }
  results.push({ name: 'Writing Evaluation Endpoint', passed: wrEvaluationPassed });

  // 5. Test Media Upload endpoint exists and rejects empty uploads safely
  const mediaRes = await httpRequest({
    path: '/api/media/upload',
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryXYZ' }
  }, '------WebKitFormBoundaryXYZ--');
  const mediaHandled = mediaRes.statusCode === 400 || mediaRes.statusCode === 200;
  console.log(`[${mediaHandled ? 'PASS' : 'FAIL'}] Media Upload Endpoint Handled => Status ${mediaRes.statusCode}`);
  results.push({ name: 'Media Upload Endpoint', passed: mediaHandled });

  // Summary
  console.log('\n==============================================');
  console.log('AUDIT SUMMARY');
  console.log('==============================================');
  const failed = results.filter(r => !r.passed);
  if (failed.length === 0) {
    console.log(`ALL ${results.length} CHECKS PASSED PERFECTLY!`);
  } else {
    console.log(`${failed.length} of ${results.length} checks failed:`);
    failed.forEach(f => console.log(` - ${f.name}: ${f.detail || 'Failed'}`));
  }

  await pool.end();
}

runAudit();
