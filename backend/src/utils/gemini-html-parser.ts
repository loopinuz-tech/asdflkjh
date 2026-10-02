/**
 * Gemini AI IELTS Test Parser
 * Automatically parses raw HTML, PDF files, raw text, and audio transcripts
 * into structured Cambridge IELTS tests using Google Gemini AI, with algorithmic fallback.
 */

export interface ParsedQuestionOption {
  option_key: string
  option_text: string
  is_correct: boolean
}

export interface ParsedQuestion {
  question_number: number
  question_type: string
  instruction: string
  question_text: string
  options: ParsedQuestionOption[]
  correct_answer: string
  accepted_answers: string[]
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  image_url?: string
}

export interface ParsedSection {
  title: string
  order_number: number
  instructions: string
  time_limit_minutes: number
  passage_html: string
  audio_url: string
  questions: ParsedQuestion[]
}

export interface ParsedIeltsTest {
  title: string
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'mock'
  ielts_type: 'academic' | 'general_training'
  difficulty: 'easy' | 'medium' | 'hard'
  time_limit_minutes: number
  description: string
  sections: ParsedSection[]
  total_questions: number
  warnings: string[]
  parsed_by?: 'gemini' | 'algorithmic'
  model_used?: string
}

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest']

/**
 * Pre-process and sanitize HTML to fit comfortably within LLM context
 */
function sanitizeHtmlForAi(rawHtml: string): string {
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/data:image\/[a-zA-Z]+;base64,[^"'\s)]+/g, '[IMAGE_PLACEHOLDER]')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
}

const COMMON_IELTS_SYSTEM_PROMPT = `You are a world-class Cambridge IELTS assessment developer and automated test parser.
Your task is to analyze test material and extract its complete structure into a clean, strictly formatted JSON object.

ACCURATELY DETECT AND EXTRACT:
1. "title": Test title (e.g. "Cambridge IELTS 19 — Academic Reading Test 1").
2. "skill": "reading" | "listening" | "writing" | "speaking".
3. "ielts_type": "academic" | "general_training".
4. "difficulty": "easy" | "medium" | "hard" (default "medium").
5. "time_limit_minutes": (60 for full reading/writing, 30 for listening, 20 for single passage).
6. "description": Short overview of the test or topic.
7. "sections": Array of sections/passages.
   - For Reading: Each reading passage (Passage 1, 2, 3).
   - For Listening: Each section/part (Part 1, 2, 3, 4).
   Each section contains:
   - "title": (e.g. "Reading Passage 1: The Roman Amphitheatre of Arles" or "Part 1: Accommodation Inquiry")
   - "order_number": 1, 2, 3...
   - "instructions": (e.g. "You should spend about 20 minutes on Questions 1–13...")
   - "time_limit_minutes": 20 (or 10 for listening parts)
   - "passage_html": Clean HTML or paragraphs of the reading passage or context (DO NOT include the questions or answer key inside passage_html).
   - "audio_url": Audio link if found or empty string "".
   - "questions": Array of questions belonging to this section:
     - "question_number": Integer (1 to 40)
     - "question_type": One of:
       "multiple_choice", "true_false_not_given", "yes_no_not_given",
       "matching_headings", "matching_information", "matching_features",
       "sentence_completion", "summary_completion", "table_completion",
       "short_answer", "diagram_labeling"
     - "instruction": Specific instruction for this question group (e.g. "Write TRUE, FALSE or NOT GIVEN.")
     - "question_text": The question statement, prompt, or sentence with blank.
     - "options": For multiple choice / matching: array of { "option_key": "A", "option_text": "...", "is_correct": boolean }
     - "correct_answer": Correct answer if found in the answer key or text (e.g. "TRUE", "B", "limestone").
     - "accepted_answers": Array of accepted spellings or uppercase/lowercase variants.
     - "points": 1
     - "difficulty": "medium"
     - "explanation": Brief explanation if available, otherwise "".

8. "total_questions": Total number of questions detected across all sections.
9. "warnings": Array of strings if anything was ambiguous or missing.

CRITICAL INSTRUCTIONS:
- Extract all questions and their corresponding answers accurately if an Answer Key or solution block exists.
- Separate the passage text from the questions cleanly.
- Output ONLY valid JSON matching this schema.`

/**
 * Helper to call Gemini with automatic model fallback
 */
async function callGeminiAi(contentsParts: any[]): Promise<{ parsed: ParsedIeltsTest; model: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY || DEFAULT_API_KEY

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      })

      if (!res.ok) {
        console.warn(`[Gemini Parser] Model ${model} returned HTTP ${res.status}. Trying next...`)
        continue
      }

      const data: any = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) continue

      const parsed: ParsedIeltsTest = JSON.parse(text)

      // Basic structure validation
      if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        continue
      }

      let totalQ = 0
      parsed.sections.forEach((sec, idx) => {
        sec.order_number = idx + 1
        if (!Array.isArray(sec.questions)) sec.questions = []
        totalQ += sec.questions.length
      })

      parsed.total_questions = totalQ
      if (parsed.sections.length === 1 && (!parsed.time_limit_minutes || parsed.time_limit_minutes === 60)) {
        parsed.time_limit_minutes = parsed.skill === 'listening' ? 10 : 20
      }
      parsed.parsed_by = 'gemini'
      parsed.model_used = model
      if (!parsed.warnings) parsed.warnings = []

      return { parsed, model }
    } catch (err: any) {
      console.warn(`[Gemini Parser] Error with model ${model}:`, err.message)
    }
  }

  return null
}

/**
 * Helper to pre-extract answer keys from Javascript scripts or embedded data
 */
function extractAnswerKeysFromRawHtml(rawHtml: string): Record<number, { answer: string; explanation?: string }> {
  const map: Record<number, { answer: string; explanation?: string }> = {}

  // 1. Script variable: correctAnswers = { 1: 'skellarn', 2: 'park', ... }
  const correctAnswersMatch = rawHtml.match(/(?:const|let|var)\s+(?:correctAnswers|answers|key)\s*=\s*(\{[\s\S]*?\});/i)
  if (correctAnswersMatch) {
    const objStr = correctAnswersMatch[1]
    const numEntryRegex = /(?:['"]?(\d+)['"]?\s*:\s*(?:\[\s*['"]([^'"]+)['"]|['"]([^'"]+)['"]))/gi
    let m
    while ((m = numEntryRegex.exec(objStr)) !== null) {
      const qNum = parseInt(m[1], 10)
      const ansVal = (m[2] || m[3] || '').trim()
      if (qNum > 0 && qNum <= 40 && ansVal) {
        if (!map[qNum]) {
          map[qNum] = { answer: ansVal, explanation: '' }
        }
      }
    }
  }

  // 2. Data attributes
  const dataAnsRegex = /(?:data-answer|data-correct)=["']([^"']+)["'][^>]*data-question=["']?(\d+)["']?/gi
  let dMatch
  while ((dMatch = dataAnsRegex.exec(rawHtml)) !== null) {
    const qNum = parseInt(dMatch[2], 10)
    const ans = dMatch[1].trim()
    if (qNum > 0 && qNum <= 40 && ans && !map[qNum]) {
      map[qNum] = { answer: ans, explanation: '' }
    }
  }

  // 3. Script variable: ANSWER_KEY = { q14: { answer: 'D', explanation: '...' }, ... }
  const answerKeyVarMatch = rawHtml.match(/(?:const|let|var)\s+ANSWER_KEY\s*=\s*(\{[\s\S]*?\});/i)
  if (answerKeyVarMatch) {
    try {
      const objStr = answerKeyVarMatch[1]
      const entryRegex = /(?:['"]?q?(\d+)['"]?\s*:\s*\{[\s\S]*?answer\s*:\s*['"]([^'"]+)['"](?:[\s\S]*?explanation\s*:\s*['"]([^'"]*)['"])?)/gi
      let m
      while ((m = entryRegex.exec(objStr)) !== null) {
        const qNum = parseInt(m[1], 10)
        if (qNum > 0 && qNum <= 40) {
          map[qNum] = {
            answer: m[2].trim(),
            explanation: m[3] ? m[3].trim() : '',
          }
        }
      }
    } catch (e) {}
  }

  return map
}

/**
 * Pre-extract drag-and-drop pools and options from HTML
 */
function extractPoolsFromRawHtml(rawHtml: string): Record<string, ParsedQuestionOption[]> {
  const pools: Record<string, ParsedQuestionOption[]> = {}
  const poolMatches = [...rawHtml.matchAll(/id=["'](pool-[^"']+)["']/gi)]
  const allPoolIds = [...new Set(['pool-17-20', 'pool-21-25', ...poolMatches.map(m => m[1])])]

  for (const poolId of allPoolIds) {
    const pIdx = rawHtml.indexOf(`id="${poolId}"`)
    if (pIdx !== -1) {
      const chunk = rawHtml.substring(pIdx, pIdx + 3500)
      const items: ParsedQuestionOption[] = []
      const itemRegex = /<div[^>]*class=["'][^"']*draggable-item[^"']*["'][^>]*data-value=["']([^"']+)["'][^>]*data-label=["']([^"']*)["'][^>]*>/gi
      let m
      while ((m = itemRegex.exec(chunk)) !== null) {
        const key = m[1].toUpperCase()
        if (!items.some(it => it.option_key === key)) {
          items.push({
            option_key: key,
            option_text: m[2].trim(),
            is_correct: false,
          })
        }
      }
      if (items.length > 0) {
        pools[poolId] = items
      }
    }
  }
  return pools
}

/**
 * Extract an individual question by number from HTML
 */
function extractIndividualQuestion(
  qNum: number,
  html: string,
  answerKeyMap: Record<number, { answer: string; explanation?: string }>,
  pools: Record<string, ParsedQuestionOption[]>
): ParsedQuestion | null {
  // 1. Drop-zone matching question
  const dropZoneRegex = new RegExp(`<div[^>]*class=["'][^"']*drop-zone[^"']*["'][^>]*data-question=["']${qNum}["'][^>]*data-pool=["']([^"']+)["'][^>]*>`, 'i')
  const dzMatch = html.match(dropZoneRegex)
  if (dzMatch) {
    const poolId = dzMatch[1]
    const poolOptions = pools[poolId] || []
    const spanMatch = html.match(new RegExp(`<span[^>]*>\\s*${qNum}\\s*<\\/span>\\s*([^<\\n]+)`, 'i'))
    const qText = spanMatch ? spanMatch[1].trim() : `Question ${qNum}`
    const ans = answerKeyMap[qNum]?.answer || ''

    return {
      question_number: qNum,
      question_type: 'matching',
      instruction: 'Choose the correct letter from the box and match with each item.',
      question_text: qText,
      options: poolOptions.map(opt => ({
        ...opt,
        is_correct: opt.option_key.toUpperCase() === ans.toUpperCase(),
      })),
      correct_answer: ans,
      accepted_answers: ans ? [ans] : [],
      points: 1,
      difficulty: 'medium',
      explanation: answerKeyMap[qNum]?.explanation || '',
    }
  }

  // 2. Radio Multiple Choice
  const radioRegex = new RegExp(`<input[^>]*type=["']radio["'][^>]*name=["']q?${qNum}["']`, 'i')
  if (radioRegex.test(html)) {
    const rPos = html.search(radioRegex)
    const beforeRadio = html.substring(Math.max(0, rPos - 500), rPos)
    const promptMatch = beforeRadio.match(new RegExp(`(?:<p|<div|<li)[^>]*>\\s*(?:<strong>)?\\s*(?:Question\\s+)?${qNum}[\\.\\:\\)]?\\s*([\\s\\S]*?)<\\/(?:p|div|li)>`, 'i'))
    let prompt = promptMatch ? promptMatch[1].replace(/<[^>]*>/g, '').trim() : `Question ${qNum}`
    prompt = prompt.replace(new RegExp(`^\\s*(?:Question\\s+)?${qNum}[\\.\\:\\)]?\\s*`, 'i'), '').trim()

    const chunk = html.substring(rPos - 100, rPos + 1200)
    const optRegex = new RegExp(`<(?:label|div)[^>]*class=["'][^"']*mcq-option[^"']*["'][^>]*>[\\s\\S]*?<input[^>]*name=["']q?${qNum}["'][^>]*value=["']([A-H])["'][^>]*>[\\s\\S]*?(?:<strong>[A-H]<\\/strong>)?\\s*([^<]+)<\\/(?:label|div)>`, 'gi')
    const options: ParsedQuestionOption[] = []
    let om
    const ans = answerKeyMap[qNum]?.answer || ''
    while ((om = optRegex.exec(chunk)) !== null) {
      const key = om[1].toUpperCase()
      if (!options.some(o => o.option_key === key)) {
        options.push({
          option_key: key,
          option_text: om[2].trim(),
          is_correct: key === ans.toUpperCase(),
        })
      }
    }

    if (options.length >= 2) {
      return {
        question_number: qNum,
        question_type: 'multiple_choice',
        instruction: 'Choose the correct letter, A, B or C.',
        question_text: prompt || `Question ${qNum}`,
        options,
        correct_answer: ans,
        accepted_answers: ans ? [ans] : [],
        points: 1,
        difficulty: 'medium',
        explanation: answerKeyMap[qNum]?.explanation || '',
      }
    }
  }

  // 3. Text Input (Note completion / fill-in-the-blank)
  const targetAttr = `data-question="${qNum}"`
  const pos = html.indexOf(targetAttr)
  if (pos !== -1) {
    const before = html.substring(Math.max(0, pos - 250), pos)
    const lastOpenLi = before.lastIndexOf('<li')
    const lastOpenP = before.lastIndexOf('<p')
    const lastOpen = Math.max(lastOpenLi, lastOpenP)
    const startIdx = lastOpen !== -1 ? Math.max(0, pos - (before.length - lastOpen)) : Math.max(0, pos - 80)
    const after = html.substring(pos, pos + 250)
    const firstCloseLi = after.indexOf('</li>')
    const firstCloseP = after.indexOf('</p>')
    const firstClose = firstCloseLi !== -1 ? firstCloseLi + 5 : (firstCloseP !== -1 ? firstCloseP + 4 : 100)
    const endIdx = pos + firstClose

    let snippet = html.substring(startIdx, endIdx)
    let line = snippet
      .replace(new RegExp(`<input[^>]*data-question=["']${qNum}["'][^>]*>`, 'gi'), ` [${qNum}] `)
      .replace(/<input[^>]*>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    line = line.replace(new RegExp(`\\b${qNum}\\b\\s*(\\[${qNum}\\])`, 'gi'), '$1')
    line = line.replace(new RegExp(`^\\s*(?:Question\\s+)?${qNum}[\\.\\:\\)]?\\s*`, 'i'), '').trim()
    if (!line.includes(`[${qNum}]`)) {
      line = `${line} [${qNum}]`
    }
    const ans = answerKeyMap[qNum]?.answer || ''

    return {
      question_number: qNum,
      question_type: 'note_completion',
      instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.',
      question_text: line,
      options: [],
      correct_answer: ans,
      accepted_answers: ans ? [ans] : [],
      points: 1,
      difficulty: 'medium',
      explanation: answerKeyMap[qNum]?.explanation || '',
    }
  }

  return null
}

/**
 * Algorithmic Fallback Parser in case Gemini is offline or rate-limited
 */
export function parseIeltsHtmlAlgorithmic(rawHtml: string, defaultTitle?: string): ParsedIeltsTest {
  const answerKeyMap = extractAnswerKeysFromRawHtml(rawHtml)
  const dragPools = extractPoolsFromRawHtml(rawHtml)
  const html = sanitizeHtmlForAi(rawHtml)
  const warnings: string[] = []

  let title = defaultTitle || 'Imported IELTS Test'
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1Match && h1Match[1]) {
    title = h1Match[1].replace(/<[^>]*>/g, '').trim()
  } else if (titleTagMatch && titleTagMatch[1]) {
    title = titleTagMatch[1].replace(/<[^>]*>/g, '').trim()
  }

  const lower = (title + ' ' + html.substring(0, 2000)).toLowerCase()
  let skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'mock' = 'reading'
  if (lower.includes('listening')) skill = 'listening'
  else if (lower.includes('writing')) skill = 'writing'
  else if (lower.includes('speaking')) skill = 'speaking'
  else skill = 'reading'

  // Extract all questions 1 to 40
  const allQuestions: ParsedQuestion[] = []
  for (let qNum = 1; qNum <= 40; qNum++) {
    const q = extractIndividualQuestion(qNum, rawHtml, answerKeyMap, dragPools)
    if (q) {
      allQuestions.push(q)
    }
  }

  // Create standard sections
  const sections: ParsedSection[] = []

  if (skill === 'listening' || allQuestions.length > 26) {
    sections.push(
      {
        title: 'Section 1',
        order_number: 1,
        instructions: 'Listen and answer questions 1–10. Complete the notes below.',
        time_limit_minutes: 10,
        passage_html: '',
        audio_url: '',
        questions: allQuestions.filter(q => q.question_number <= 10),
      },
      {
        title: 'Section 2',
        order_number: 2,
        instructions: 'Listen and answer questions 11–20.',
        time_limit_minutes: 10,
        passage_html: '',
        audio_url: '',
        questions: allQuestions.filter(q => q.question_number > 10 && q.question_number <= 20),
      },
      {
        title: 'Section 3',
        order_number: 3,
        instructions: 'Listen and answer questions 21–30.',
        time_limit_minutes: 10,
        passage_html: '',
        audio_url: '',
        questions: allQuestions.filter(q => q.question_number > 20 && q.question_number <= 30),
      },
      {
        title: 'Section 4',
        order_number: 4,
        instructions: 'Listen and answer questions 31–40.',
        time_limit_minutes: 10,
        passage_html: '',
        audio_url: '',
        questions: allQuestions.filter(q => q.question_number > 30 && q.question_number <= 40),
      }
    )
  } else {
    sections.push(
      {
        title: 'Reading Passage 1',
        order_number: 1,
        instructions: 'Read the passage and answer questions 1–13.',
        time_limit_minutes: 20,
        passage_html: '',
        audio_url: '',
        questions: allQuestions.filter(q => q.question_number <= 13),
      },
      {
        title: 'Reading Passage 2',
        order_number: 2,
        instructions: 'Read the passage and answer questions 14–26.',
        time_limit_minutes: 20,
        passage_html: '',
        audio_url: '',
        questions: allQuestions.filter(q => q.question_number > 13 && q.question_number <= 26),
      },
      {
        title: 'Reading Passage 3',
        order_number: 3,
        instructions: 'Read the passage and answer questions 27–40.',
        time_limit_minutes: 20,
        passage_html: '',
        audio_url: '',
        questions: allQuestions.filter(q => q.question_number > 26),
      }
    )
  }

  return {
    title,
    skill,
    ielts_type: 'academic',
    difficulty: 'medium',
    time_limit_minutes: skill === 'listening' ? 30 : 60,
    description: `Automatically extracted from HTML test source (${skill.toUpperCase()}).`,
    sections,
    total_questions: sections.reduce((acc, s) => acc + s.questions.length, 0),
    warnings,
    parsed_by: 'algorithmic',
  }
}

/**
 * 1. AI-Powered HTML Parser
 */
export async function parseIeltsHtmlWithGemini(
  rawHtml: string,
  fileName?: string
): Promise<ParsedIeltsTest> {
  const sanitizedHtml = sanitizeHtmlForAi(rawHtml)
  const parts = [
    { text: COMMON_IELTS_SYSTEM_PROMPT },
    { text: `HTML TEST DOCUMENT (${fileName || 'Untitled'}):\n\n${sanitizedHtml}` },
  ]

  const result = await callGeminiAi(parts)
  if (result) return result.parsed

  console.info('[Gemini Parser] Falling back to algorithmic HTML parser.')
  return parseIeltsHtmlAlgorithmic(rawHtml, fileName)
}

/**
 * 2. AI-Powered Native PDF Parser
 */
export async function parseIeltsPdfWithGemini(
  pdfBase64: string,
  fileName?: string
): Promise<ParsedIeltsTest> {
  // Strip data URL header if present
  const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
  const parts = [
    { text: COMMON_IELTS_SYSTEM_PROMPT },
    { inlineData: { mimeType: 'application/pdf', data: cleanBase64 } },
    { text: `Parse this authentic IELTS PDF document (${fileName || 'Cambridge Exam'}). Extract all passages, questions, options, and answer keys.` },
  ]

  const result = await callGeminiAi(parts)
  if (result) return result.parsed

  throw new Error('Gemini AI was unable to parse the PDF document. Please check the document format or try pasting the raw text.')
}

/**
 * 3. AI-Powered Raw Text / OCR Parser
 */
export async function parseIeltsTextWithGemini(
  rawText: string,
  fileName?: string
): Promise<ParsedIeltsTest> {
  const parts = [
    { text: COMMON_IELTS_SYSTEM_PROMPT },
    { text: `RAW IELTS TEST CONTENT (${fileName || 'Pasted Exam Text'}):\n\n${rawText}` },
  ]

  const result = await callGeminiAi(parts)
  if (result) return result.parsed

  throw new Error('Gemini AI was unable to parse the test text. Please ensure it contains IELTS passages and questions.')
}

/**
 * 4. AI-Powered Listening Test Generator from Audio Transcript
 */
export async function generateListeningTestWithGemini(
  transcript: string,
  audioUrl?: string,
  title?: string
): Promise<ParsedIeltsTest> {
  const listeningPrompt = `You are a Cambridge IELTS Listening test developer.
Analyze the following spoken conversation / audio transcript and create an authentic Cambridge IELTS Listening test section.

Format the questions into authentic IELTS listening question types:
- Part 1: Form / Note completion (e.g. names, dates, phone numbers, addresses).
- Part 2: Multiple choice or Map / Plan labeling.
- Part 3: Multiple choice or Matching features (academic discussion between 2-3 people).
- Part 4: Lecture summary / sentence completion (academic monologue).

Audio URL for this test: "${audioUrl || ''}"

Return the test strictly in the JSON format matching:
${COMMON_IELTS_SYSTEM_PROMPT}`

  const parts = [
    { text: listeningPrompt },
    { text: `AUDIO TRANSCRIPT / SPOKEN DIALOGUE:\n\n${transcript}` },
  ]

  const result = await callGeminiAi(parts)
  if (result) {
    if (audioUrl) {
      result.parsed.sections.forEach((s) => {
        if (!s.audio_url) s.audio_url = audioUrl
      })
    }
    result.parsed.skill = 'listening'
    return result.parsed
  }

  throw new Error('Failed to generate IELTS Listening test from audio transcript.')
}
