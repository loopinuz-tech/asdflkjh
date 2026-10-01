import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseIeltsHtml } from '../frontend/src/lib/parsers/html-test-parser.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = 'https://edufox-backend.onrender.com'

async function postApi(endpoint: string, payload: any) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`POST ${endpoint} failed (${res.status}): ${JSON.stringify(json)}`)
  }
  return json.data
}

async function getApi(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`GET ${endpoint} failed (${res.status}): ${JSON.stringify(json)}`)
  }
  return json.data
}

async function deleteApi(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' })
  const json = await res.json()
  return json
}

async function run() {
  console.log('🚀 Starting IELTS Listening Practice Test 25 direct import...')

  // 1. Read Test 25.html
  const htmlPath = path.resolve(__dirname, '../Test 25.html')
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Test 25.html not found at: ${htmlPath}`)
  }
  const rawHtml = fs.readFileSync(htmlPath, 'utf-8')
  console.log(`📄 Read Test 25.html (${rawHtml.length} bytes)`)

  // 2. Parse HTML using our advanced parser
  const parsed = parseIeltsHtml(rawHtml)
  console.log(`✅ Parsed test successfully:`)
  console.log(`   - Detected title: ${parsed.title}`)
  console.log(`   - Skill: ${parsed.skill}`)
  console.log(`   - Total sections: ${parsed.sections.length}`)
  console.log(`   - Total questions: ${parsed.total_questions}`)

  if (parsed.sections.length !== 4 || parsed.total_questions !== 40) {
    console.warn(`⚠️ Warning: Expected 4 sections and 40 questions, got ${parsed.sections.length} sections and ${parsed.total_questions} questions.`)
  }

  // 3. Fetch Question Types to map UUIDs
  const qTypes = await getApi('/api/data/question_types')
  const qTypeMap: Record<string, string> = {}
  for (const qt of qTypes) {
    qTypeMap[qt.slug] = qt.id
  }
  console.log(`📋 Found ${qTypes.length} question types in backend database`)

  // 4. Check if test already exists (by slug or title)
  const existingTests = await getApi('/api/data/tests')
  const slug = 'ielts-listening-practice-test-25'
  const title = 'IELTS Listening Practice Test 25'

  for (const ex of existingTests) {
    if (ex.slug === slug || ex.title === title) {
      console.log(`♻️ Found existing test "${ex.title}" (${ex.id}). Cleaning up old record...`)
      await deleteApi(`/api/data/tests/${ex.id}`)
      console.log(`   Deleted old test ${ex.id}`)
    }
  }

  // 5. Create Test Record
  const testPayload = {
    title,
    slug,
    description: 'Comprehensive IELTS Listening Mock Test 25 featuring 4 complete sections: Part 1 Watertown Community Centre Programmes, Part 2 Royal Nature Park, Part 3 Honeybees and Varroa Mites, and Part 4 After Action Review Process.',
    skill: 'listening',
    ielts_type: 'academic',
    access_type: 'free',
    difficulty: 'medium',
    time_limit_minutes: 40,
    total_questions: parsed.total_questions,
    is_premium: false,
    status: 'published',
  }

  const createdTest = await postApi('/api/data/tests', testPayload)
  const testId = createdTest.id
  console.log(`🎉 Created Test in DB: ID = ${testId}, Status = ${createdTest.status}`)

  let totalQuestionsInserted = 0
  let totalOptionsInserted = 0

  // 6. Iterate through all 4 sections
  for (let sIdx = 0; sIdx < parsed.sections.length; sIdx++) {
    const sec = parsed.sections[sIdx]
    const partNum = sIdx + 1
    console.log(`\n📦 Processing Section ${partNum}: "${sec.title}" (${sec.questions.length} questions)...`)

    // Create passage if passage_html exists
    let passageId: string | null = null
    if (sec.passage_html && sec.passage_html.trim()) {
      const passageData = await postApi('/api/data/reading_passages', {
        title: `Listening Test 25 — ${sec.title} Notes`,
        content: sec.passage_html,
        status: 'published',
      })
      passageId = passageData.id
      console.log(`   📝 Saved Section Notes/Card in reading_passages (${passageId})`)
    }

    // Create test_sections record
    const sectionData = await postApi('/api/data/test_sections', {
      test_id: testId,
      title: sec.title || `Part ${partNum}`,
      order_number: partNum,
      instructions: sec.instructions || `Part ${partNum} Questions`,
      time_limit_minutes: 10,
      passage_id: passageId,
      audio_id: null,
    })
    const sectionId = sectionData.id
    console.log(`   📌 Created test_section (${sectionId})`)

    // Create question_groups record
    const groupData = await postApi('/api/data/question_groups', {
      section_id: sectionId,
      title: sec.title || `Part ${partNum}`,
      instruction: sec.instructions,
      passage_id: passageId,
      media_id: null,
      order_number: 1,
    })
    const groupId = groupData.id

    // Insert questions
    for (const q of sec.questions) {
      let mappedType = q.question_type
      if (mappedType === 'multiple_response') mappedType = 'multiple_select'
      if (mappedType === 'matching') mappedType = 'matching_features'

      const qTypeId = qTypeMap[mappedType] || qTypeMap[q.question_type] || Object.values(qTypeMap)[0]

      const qPayload = {
        test_id: testId,
        section_id: sectionId,
        group_id: groupId,
        question_type_id: qTypeId,
        question_type: mappedType,
        question_number: q.question_number,
        instruction: q.instruction || null,
        question_text: q.question_text,
        question_html: null,
        points: q.points || 1,
        difficulty: q.difficulty || 'medium',
        metadata: {
          original_type: q.question_type,
          instruction: q.instruction,
        },
        correct_answer: q.correct_answer || null,
        accepted_answers: q.accepted_answers || (q.correct_answer ? [q.correct_answer] : []),
        status: 'published',
      }

      const qData = await postApi('/api/data/questions', qPayload)
      totalQuestionsInserted++

      // Insert options if present
      if (q.options && q.options.length > 0) {
        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          const opt = q.options[oIdx]
          await postApi('/api/data/question_options', {
            question_id: qData.id,
            option_key: opt.option_key || String.fromCharCode(65 + oIdx),
            option_text: opt.option_text || '',
            is_correct: !!opt.is_correct,
            order_number: oIdx + 1,
          })
          totalOptionsInserted++
        }
      }
    }
    console.log(`   ✔️ Inserted ${sec.questions.length} questions for Part ${partNum}`)
  }

  console.log(`\n======================================================`)
  console.log(`🏆 IMPORT COMPLETE!`)
  console.log(`   Test ID:              ${testId}`)
  console.log(`   Title:                ${title}`)
  console.log(`   Slug:                 ${slug}`)
  console.log(`   Status:               published`)
  console.log(`   Sections Saved:       ${parsed.sections.length} parts`)
  console.log(`   Questions Inserted:   ${totalQuestionsInserted} / 40`)
  console.log(`   Options Inserted:     ${totalOptionsInserted}`)
  console.log(`======================================================\n`)

  // 7. Final Verification
  const verifySections = await getApi(`/api/data/test_sections?test_id=eq.${testId}`)
  const verifyQuestions = await getApi(`/api/data/questions?test_id=eq.${testId}&limit=100`)

  console.log(`🔍 Verification Results:`)
  console.log(`   - DB Sections count:  ${verifySections.length}`)
  console.log(`   - DB Questions count: ${verifyQuestions.length}`)
  if (verifyQuestions.length === 40) {
    console.log(`✨ All 40 questions verified in PostgreSQL database!`)
  } else {
    console.warn(`⚠️ Mismatch: expected 40 questions, found ${verifyQuestions.length}`)
  }
}

run().catch(err => {
  console.error('❌ Import failed with error:', err)
  process.exit(1)
})
