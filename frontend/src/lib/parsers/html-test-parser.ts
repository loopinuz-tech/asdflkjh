/**
 * Robust High-Accuracy IELTS HTML Test Parser
 * Automatically parses raw IELTS HTML files (Cambridge IELTS, British Council, IDP, online mock tests)
 * Extracts: Test Title, Skill, Sections, Audio links, Transcripts, Questions, Options, Answer Keys, and Explanations.
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
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Pre-extract answer keys from Javascript scripts or embedded data BEFORE stripping scripts
 */
function extractAnswerKeysFromRawHtml(rawHtml: string): Record<number, { answer: string; explanation?: string }> {
  const map: Record<number, { answer: string; explanation?: string }> = {}

  // 1. Script variable: ANSWER_KEY = { q14: { answer: 'D', explanation: '...' }, ... }
  const answerKeyVarMatch = rawHtml.match(/(?:const|let|var)\s+ANSWER_KEY\s*=\s*(\{[\s\S]*?\});/i)
  if (answerKeyVarMatch) {
    try {
      const objStr = answerKeyVarMatch[1]
      // Match individual properties like q14: { ... answer: 'D' ... }
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
    } catch (e) {
      // ignore JSON parse errors
    }
  }

  // 2. Script variable: correctAnswers = { 1: 'skellarn', 2: 'park', ... }
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

  // 3. Mark highlights in script templates: <mark class="script-highlight" title="Q1">station road</mark>
  const markRegex = /<mark[^>]*title=["']Q?(\d+)["'][^>]*>([\s\S]*?)<\/mark>/gi
  let markMatch
  while ((markMatch = markRegex.exec(rawHtml)) !== null) {
    const qNum = parseInt(markMatch[1], 10)
    const ansText = stripTags(markMatch[2]).trim()
    if (qNum > 0 && qNum <= 40 && ansText && !map[qNum]) {
      map[qNum] = { answer: ansText, explanation: '' }
    }
  }

  // 4. Data attributes: data-answer="...", data-correct="..."
  const dataAnsRegex = /(?:data-answer|data-correct)=["']([^"']+)["'][^>]*data-question=["']?(\d+)["']?/gi
  let dMatch
  while ((dMatch = dataAnsRegex.exec(rawHtml)) !== null) {
    const qNum = parseInt(dMatch[2], 10)
    const ans = dMatch[1].trim()
    if (qNum > 0 && qNum <= 40 && ans && !map[qNum]) {
      map[qNum] = { answer: ans, explanation: '' }
    }
  }

  // 5. Standard Answer Key text block at bottom: "Answer Key\n 1. TRUE 2. FALSE..."
  const answerKeyPattern = /(?:<h[1-6][^>]*>|<div[^>]*class="[^"]*answers?[^"]*"[^>]*>|<p[^>]*>\s*<strong>)\s*(?:answer\s*keys?|answers|solutions?)\s*(?:<\/strong>)?\s*(?:[:\s]<\/(?:h[1-6]|p)>|[:\s\n<])[\s\S]*$/i
  const answerKeyBlockMatch = rawHtml.match(answerKeyPattern)
  if (answerKeyBlockMatch) {
    const rawAnswerText = stripTags(answerKeyBlockMatch[0])
    const answerRegex = /(?:^|\s|\b)(\d{1,2})[\.\:\)\s]+([A-Za-z0-9\s\/\-_%]+?)(?=(?:\s+\d{1,2}[\.\:\)]|$))/g
    let match
    while ((match = answerRegex.exec(rawAnswerText)) !== null) {
      const qNum = parseInt(match[1], 10)
      const ansVal = match[2].trim()
      if (qNum > 0 && qNum <= 40 && ansVal.length <= 40 && !map[qNum]) {
        map[qNum] = { answer: ansVal, explanation: '' }
      }
    }
  }

  return map
}

/**
 * Pre-extract drag-and-drop pools and options from HTML before sanitizing
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
 * Extract an individual question by number from clean HTML
 */
function extractIndividualQuestion(
  qNum: number,
  html: string,
  answerKeyMap: Record<number, { answer: string; explanation?: string }>,
  pools: Record<string, ParsedQuestionOption[]>
): ParsedQuestion | null {
  // 1. Drop-zone matching question: <div class="drop-zone answer-input" data-question="17" data-pool="pool-17-20">
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

  // 2. Radio Multiple Choice: <input type="radio" name="q26" ...
  const radioRegex = new RegExp(`<input[^>]*type=["']radio["'][^>]*name=["']q?${qNum}["']`, 'i')
  if (radioRegex.test(html)) {
    const rPos = html.search(radioRegex)
    const beforeRadio = html.substring(Math.max(0, rPos - 500), rPos)
    const promptMatch = beforeRadio.match(new RegExp(`(?:<p|<div|<li)[^>]*>\\s*(?:<strong>)?\\s*(?:Question\\s+)?${qNum}[\\.\\:\\)]?\\s*([\\s\\S]*?)<\\/(?:p|div|li)>`, 'i'))
    let prompt = promptMatch ? stripTags(promptMatch[1]).trim() : `Question ${qNum}`
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

  // 3. Text Input (Note completion / fill-in-the-blank): <input type="text" ... data-question="X"
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

export function parseIeltsHtml(rawHtml: string): ParsedIeltsTest {
  const warnings: string[] = []

  // Step 1: Pre-extract answer keys and drag-pools from raw scripts or attributes
  const answerKeyMap = extractAnswerKeysFromRawHtml(rawHtml)
  const dragPools = extractPoolsFromRawHtml(rawHtml)

  // Step 2: Global audio link extraction
  let globalAudioUrl = ''
  const audioMatch = rawHtml.match(/<audio[^>]*src=["']([^"']+)["']/i) ||
    rawHtml.match(/<source[^>]*src=["']([^"']+\.(?:mp3|wav|ogg|m4a))["']/i) ||
    rawHtml.match(/href=["']([^"']+\.(?:mp3|wav|ogg|m4a))["']/i)

  if (audioMatch && audioMatch[1]) {
    globalAudioUrl = audioMatch[1]
  }

  // Step 3: Clean HTML (remove scripts, styles, comments)
  let clean = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()

  // Remove Answer Key block from body so it doesn't pollute passages
  const answerKeyBlockMatch = clean.match(/(?:<h[1-6][^>]*>|<div[^>]*class="[^"]*answers?[^"]*"[^>]*>|<p[^>]*>\s*<strong>)\s*(?:answer\s*keys?|answers|solutions?)\s*(?:<\/strong>)?\s*(?:[:\s]<\/(?:h[1-6]|p)>|[:\s\n<])[\s\S]*$/i)
  if (answerKeyBlockMatch && answerKeyBlockMatch.index !== undefined) {
    clean = clean.substring(0, answerKeyBlockMatch.index).trim()
  }

  // Step 4: Extract Test Title
  let title = 'Imported IELTS Test'
  const titleTagMatch = clean.match(/<title[^>]*>([^<]+)<\/title>/i)
  const h1Match = clean.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)

  if (h1Match && h1Match[1]) {
    title = stripTags(h1Match[1]).trim()
  } else if (titleTagMatch && titleTagMatch[1]) {
    title = titleTagMatch[1].trim()
  }

  // Clean title suffixes like "| IELTS Online Tests"
  title = title.replace(/\s*\|\s*.*$/i, '').trim()

  // Step 5: Detect Skill
  let skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'mock' = 'reading'
  const titleLower = title.toLowerCase()
  const textLower = stripTags(clean).toLowerCase()

  if (titleLower.includes('listening')) {
    skill = 'listening'
  } else if (titleLower.includes('reading')) {
    skill = 'reading'
  } else if (titleLower.includes('writing')) {
    skill = 'writing'
  } else if (titleLower.includes('speaking')) {
    skill = 'speaking'
  } else {
    const hasAudio = /<audio\b|class="[^"]*audio[^"]*"|\.mp3\b|\.wav\b|audio\s*player/i.test(rawHtml)
    const hasListeningHeaders = /\b(?:listening\s+(?:test|section|part|practice)|recording\s+[1-4]|audio\s+track)\b/i.test(textLower)
    const hasReadingHeaders = /\b(?:reading\s+(?:passage|test|section)|passage\s+[1-3])\b/i.test(textLower)

    if (hasAudio || hasListeningHeaders) {
      skill = 'listening'
    } else if (hasReadingHeaders) {
      skill = 'reading'
    } else {
      skill = 'reading'
    }
  }

  // Step 6: Identify Section Boundaries
  interface SectionCandidate {
    title: string
    content: string
    audioUrl?: string
  }
  const sectionCandidates: SectionCandidate[] = []

  // Pattern A: <section class="part-section" ...> or <section ...>
  const sectionTagMatches = [...clean.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)]
  if (sectionTagMatches.length >= 2) {
    sectionTagMatches.forEach((m, idx) => {
      const attrs = m[1]
      const body = m[2]
      let secTitle = `Section ${idx + 1}`
      const partAttr = attrs.match(/data-part=["']?(\d+)["']?/i) || attrs.match(/id=["']part(\d+)["']?/i)
      if (partAttr) {
        secTitle = skill === 'listening' ? `Part ${partAttr[1]}` : `Reading Passage ${partAttr[1]}`
      } else {
        const hMatch = body.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)
        if (hMatch) secTitle = stripTags(hMatch[1]).trim()
      }
      sectionCandidates.push({ title: secTitle, content: body })
    })
  }

  // Pattern B: Part Headers like <div class="part-header"><div class="part-title">Section 1</div>
  if (sectionCandidates.length === 0) {
    const partHeaderPattern = /<(?:div|header)[^>]*class=["'][^"']*(?:part-header|part-title|passage-header)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|header)>/gi
    const partHeaderMatches = [...clean.matchAll(partHeaderPattern)]
    if (partHeaderMatches.length >= 2) {
      for (let i = 0; i < partHeaderMatches.length; i++) {
        const start = partHeaderMatches[i].index!
        const end = (i < partHeaderMatches.length - 1) ? partHeaderMatches[i + 1].index! : clean.length
        const chunk = clean.substring(start, end)
        const secTitle = stripTags(partHeaderMatches[i][1]).trim() || `Section ${i + 1}`
        sectionCandidates.push({ title: secTitle, content: chunk })
      }
    }
  }

  // Pattern C: Headings with Passage X or Part X
  if (sectionCandidates.length === 0) {
    const headingMatches = [...clean.matchAll(/<h[1-4]\b[^>]*>\s*(?:Reading\s+Passage|Passage|Section|Part)\s+[1-4][\s\S]*?<\/h[1-4]>/gi)]
    if (headingMatches.length >= 2) {
      for (let i = 0; i < headingMatches.length; i++) {
        const start = headingMatches[i].index!
        const end = (i < headingMatches.length - 1) ? headingMatches[i + 1].index! : clean.length
        const chunk = clean.substring(start, end)
        const secTitle = stripTags(headingMatches[i][0]).trim() || `Section ${i + 1}`
        sectionCandidates.push({ title: secTitle, content: chunk })
      }
    }
  }

  // Fallback: entire cleaned content as 1 section
  if (sectionCandidates.length === 0) {
    const fallbackTitle = skill === 'reading' ? 'Reading Passage 1' : 'Part 1'
    sectionCandidates.push({ title: fallbackTitle, content: clean })
  }

  // Step 7: Parse questions inside each section candidate
  const sections: ParsedSection[] = []
  const seenGlobalQNums = new Set<number>()

  sectionCandidates.forEach((cand, sIdx) => {
    const secNum = sIdx + 1
    const secTitle = cand.title || (skill === 'reading' ? `Reading Passage ${secNum}` : `Part ${secNum}`)
    const chunk = cand.content

    // Audio for section
    let secAudio = globalAudioUrl
    const secAudioMatch = chunk.match(/<audio[^>]*src=["']([^"']+)["']/i) || chunk.match(/<source[^>]*src=["']([^"']+)["']/i)
    if (secAudioMatch && secAudioMatch[1]) {
      secAudio = secAudioMatch[1]
    }

    // Split passage from questions if reading
    let passageHtml = ''
    let questionsHtml = chunk

    if (skill === 'reading') {
      const qStartMatch = chunk.match(/<(?:h[2-5]|div)[^>]*>(?:(?!<h[2-5]).)*?Questions?\s+\d+[\s\S]*?<\/(?:h[2-5]|div)>/i)
      if (qStartMatch && qStartMatch.index !== undefined && qStartMatch.index > 50) {
        passageHtml = chunk.substring(0, qStartMatch.index).trim()
        questionsHtml = chunk.substring(qStartMatch.index).trim()
      } else {
        const readingPassageBoxMatch = chunk.match(/<div[^>]*class=["'][^"']*(?:reading-passage|passage-box|text-box|reading-text)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
        if (readingPassageBoxMatch && readingPassageBoxMatch[1]) {
          passageHtml = readingPassageBoxMatch[1].trim()
          questionsHtml = chunk.replace(readingPassageBoxMatch[0], '').trim()
        } else {
          passageHtml = chunk
        }
      }
    }

    // Parse questions in questionsHtml
    const parsedQuestions: ParsedQuestion[] = []

    // Helper: Instruction banner
    let currentInstruction = skill === 'reading' ? 'Answer the questions according to the reading passage.' : 'Listen and answer the questions.'

    // Question Splitting Logic: Supports all formats
    // Scan for all question numbers from 1 to 40 that appear inside this section
    const detectedQNums: number[] = []

    // 1. Check data-question="X" or placeholder="X" on inputs
    const inputMatches = [...questionsHtml.matchAll(/<(?:input|select)[^>]*(?:data-question|placeholder|name)=["'](?:q)?(\d{1,2})["'][^>]*>/gi)]
    inputMatches.forEach(m => {
      const n = parseInt(m[1], 10)
      if (n > 0 && n <= 40 && !detectedQNums.includes(n) && !seenGlobalQNums.has(n)) {
        detectedQNums.push(n)
      }
    })

    // 2. Check <span class="q-num">X</span>
    const qNumSpanMatches = [...questionsHtml.matchAll(/<span[^>]*class=["'][^"']*q-num[^"']*["'][^>]*>(\d{1,2})<\/span>/gi)]
    qNumSpanMatches.forEach(m => {
      const n = parseInt(m[1], 10)
      if (n > 0 && n <= 40 && !detectedQNums.includes(n) && !seenGlobalQNums.has(n)) {
        detectedQNums.push(n)
      }
    })

    // 3. Check <strong>1.</strong> or <strong>1</strong>
    const strongNumMatches = [...questionsHtml.matchAll(/(?:<(?:strong|b|span)[^>]*>)?\s*(?:Question\s+)?(\d{1,2})[\.\:\)]\s*(?:<\/(?:strong|b|span)>)?/gi)]
    strongNumMatches.forEach(m => {
      const n = parseInt(m[1], 10)
      if (n > 0 && n <= 40 && !detectedQNums.includes(n) && !seenGlobalQNums.has(n)) {
        detectedQNums.push(n)
      }
    })

    detectedQNums.sort((a, b) => a - b)

    if (detectedQNums.length > 0) {
      detectedQNums.forEach((qNum) => {
        if (seenGlobalQNums.has(qNum)) return
        seenGlobalQNums.add(qNum)
        // Find text surrounding this question number in questionsHtml
        let qText = ''
        let options: ParsedQuestionOption[] = []

        // Search for container element containing this question number
        // 1. Look for question-block or question-card
        const blockRegex = new RegExp(`<(?:div|li|p)[^>]*class=["'][^"']*(?:question|item|row|card)[^"']*["'][^>]*>[\\s\\S]*?(?:data-question=["']?${qNum}["']?|q-num["'][^>]*>\\s*${qNum}\\b|["']q${qNum}["']|>${qNum}[\\.\\:\\)])[\\s\\S]*?<\\/(?:div|li|p)>`, 'i')
        const blockMatch = questionsHtml.match(blockRegex)

        let contextHtml = blockMatch ? blockMatch[0] : ''

        if (!contextHtml) {
          // Fallback: Slice from this question marker to next question marker
          const startMarkerRegex = new RegExp(`(?:q-num["'][^>]*>\\s*${qNum}\\b|data-question=["']?${qNum}["']?|\\b(?:Question\\s+)?${qNum}[\\.\\:\\)])`, 'i')
          const sMatch = questionsHtml.match(startMarkerRegex)
          if (sMatch && sMatch.index !== undefined) {
            const startIdx = Math.max(0, sMatch.index - 50)
            const nextQ = qNum + 1
            const nextMarkerRegex = new RegExp(`(?:q-num["'][^>]*>\\s*${nextQ}\\b|data-question=["']?${nextQ}["']?|\\b(?:Question\\s+)?${nextQ}[\\.\\:\\)])`, 'i')
            const nextMatch = questionsHtml.substring(sMatch.index + 5).match(nextMarkerRegex)
            const endIdx = nextMatch && nextMatch.index !== undefined ? sMatch.index + 5 + nextMatch.index : startIdx + 300
            contextHtml = questionsHtml.substring(startIdx, Math.min(questionsHtml.length, endIdx))
          }
        }

        // Extract options (A, B, C, D) if present in context
        // 1. Radio inputs: <label class="mcq-option"><input ... value="A"> <strong>A</strong> text</label>
        const mcqOptionPattern = /<(?:label|div|p)[^>]*>[\s\S]*?<input[^>]*value=["']([A-H])["'][^>]*>[\s\S]*?(?:<strong>[A-H]<\/strong>)?\s*([^<\n]+)/gi
        let mcqMatch
        while ((mcqMatch = mcqOptionPattern.exec(contextHtml)) !== null) {
          const key = mcqMatch[1].toUpperCase()
          const text = mcqMatch[2].replace(/^[A-H][\.\:\-\s]+/, '').trim()
          if (!options.some(o => o.option_key === key)) {
            options.push({ option_key: key, option_text: text, is_correct: false })
          }
        }

        // 2. Select dropdown options: <select name="q..."><option value="A">A</option>...
        if (options.length === 0) {
          const selectPattern = /<select[^>]*>([\s\S]*?)<\/select>/i
          const selMatch = contextHtml.match(selectPattern)
          if (selMatch && selMatch[1]) {
            const optMatches = [...selMatch[1].matchAll(/<option[^>]*value=["']([A-H])["'][^>]*>([^<]*)<\/option>/gi)]
            optMatches.forEach(om => {
              const key = om[1].toUpperCase()
              const text = om[2].trim() || `Option ${key}`
              if (!options.some(o => o.option_key === key)) {
                options.push({ option_key: key, option_text: text, is_correct: false })
              }
            })
          }
        }

        // 3. Text options: A. text, B. text, C. text
        if (options.length === 0) {
          const textOptPattern = /(?:<p[^>]*>|<div[^>]*>|<li[^>]*>|\n)\s*(?:<(?:strong|b)[^>]*>)?\s*([A-H])[\.\:\)]\s*(?:<\/(?:strong|b)>)?\s*([^<\n]+)/gi
          let tMatch
          while ((tMatch = textOptPattern.exec(contextHtml)) !== null) {
            const key = tMatch[1].toUpperCase()
            const text = tMatch[2].trim()
            if (!options.some(o => o.option_key === key) && !/\b[B-I][\.\:\)]\s+/i.test(text)) {
              options.push({ option_key: key, option_text: text, is_correct: false })
            }
          }
        }

        // Clean prompt text
        qText = contextHtml
          .replace(/<select[\s\S]*?<\/select>/gi, ' [____] ')
          .replace(/<input[^>]*>/gi, ' [____] ')
          .replace(/<(?:label|div)[^>]*class=["'][^"']*mcq-option[\s\S]*?<\/(?:label|div)>/gi, '')
        qText = stripTags(qText)
        qText = qText.replace(new RegExp(`^\\s*(?:Question\\s+)?${qNum}[\\.\\:\\)]?\\s*`, 'i'), '').trim()
        qText = qText.replace(/\s+/g, ' ')

        if (!qText || qText.length < 3) {
          qText = `Question ${qNum}`
        }

        // Detect Question Type
        let qType = 'short_answer'
        const contextLower = (currentInstruction + ' ' + contextHtml).toLowerCase()

        if (contextLower.includes('true') && contextLower.includes('false')) {
          qType = 'true_false_not_given'
        } else if (contextLower.includes('yes') && contextLower.includes('no')) {
          qType = 'yes_no_not_given'
        } else if (contextLower.includes('heading') || contextLower.includes('list of headings')) {
          qType = 'matching_headings'
        } else if (contextLower.includes('which paragraph') || contextLower.includes('paragraphs a')) {
          qType = 'matching_information'
        } else if (contextLower.includes('match') && (contextLower.includes('feature') || contextLower.includes('people') || contextLower.includes('researcher') || contextLower.includes('name'))) {
          qType = 'matching_features'
        } else if (contextLower.includes('match') && contextLower.includes('sentence')) {
          qType = 'matching_sentence_endings'
        } else if (options.length >= 2) {
          if (contextLower.includes('choose two') || contextLower.includes('choose three') || contextLower.includes('which two')) {
            qType = 'multiple_response'
          } else {
            qType = 'multiple_choice'
          }
        } else if (contextLower.includes('note') || contextLower.includes('notes')) {
          qType = 'note_completion'
        } else if (contextLower.includes('table')) {
          qType = 'table_completion'
        } else if (contextLower.includes('flow chart') || contextLower.includes('flow-chart')) {
          qType = 'flow_chart_completion'
        } else if (contextLower.includes('summary')) {
          qType = 'summary_completion'
        } else if (contextLower.includes('diagram') || contextLower.includes('label the diagram')) {
          qType = skill === 'listening' ? 'plan_map_diagram' : 'diagram_label_completion'
        } else if (contextLower.includes('map') || contextLower.includes('plan')) {
          qType = 'plan_map_diagram'
        } else if (contextLower.includes('form') || contextLower.includes('application form')) {
          qType = 'form_completion'
        } else if (contextLower.includes('sentence') || qText.includes('____') || qText.includes('[____]')) {
          qType = 'sentence_completion'
        }

        // Correct answer & explanation from answerKeyMap
        const keyData = answerKeyMap[qNum]
        let correctAns = keyData?.answer || ''
        let explanation = keyData?.explanation || ''

        // Link correct flag to options if applicable
        if (correctAns && options.length > 0) {
          options.forEach(opt => {
            if (opt.option_key.toUpperCase() === correctAns.toUpperCase() || opt.option_text.toLowerCase() === correctAns.toLowerCase()) {
              opt.is_correct = true
            }
          })
        }

        parsedQuestions.push({
          question_number: qNum,
          question_type: qType,
          instruction: currentInstruction,
          question_text: qText,
          options,
          correct_answer: correctAns,
          accepted_answers: correctAns ? [correctAns] : [],
          points: 1,
          difficulty: 'medium',
          explanation,
        })
      })
    }

    sections.push({
      title: secTitle,
      order_number: secNum,
      instructions: skill === 'reading' ? 'Read the passage and answer questions below.' : 'Listen to the recording and answer questions.',
      time_limit_minutes: skill === 'listening' ? 10 : 20,
      passage_html: passageHtml,
      audio_url: secAudio,
      questions: parsedQuestions,
    })
  })

  // Step 8: Collect all parsed questions across all sections and recover any missing questions (1 to 40)
  const allDetectedQs: ParsedQuestion[] = []
  const seenQNums = new Set<number>()

  sections.forEach((s) => {
    s.questions.forEach((q) => {
      if (!seenQNums.has(q.question_number)) {
        seenQNums.add(q.question_number)
        allDetectedQs.push(q)
      }
    })
  })

  // Recover any missing questions 1 to 40 directly from the clean HTML
  for (let qNum = 1; qNum <= 40; qNum++) {
    if (!seenQNums.has(qNum)) {
      const recovered = extractIndividualQuestion(qNum, clean, answerKeyMap, dragPools)
      if (recovered) {
        seenQNums.add(qNum)
        allDetectedQs.push(recovered)
      }
    }
  }

  allDetectedQs.sort((a, b) => a.question_number - b.question_number)

  // Critical Safeguard: Distribute questions into standard sections so no section is ever empty
  let finalSections = sections

  if (skill === 'listening' || sections.length === 4 || allDetectedQs.length >= 25) {
    while (sections.length < 4) {
      sections.push({
        title: `Section ${sections.length + 1}`,
        order_number: sections.length + 1,
        instructions: 'Listen to the recording and answer the questions.',
        time_limit_minutes: 10,
        passage_html: '',
        audio_url: globalAudioUrl,
        questions: [],
      })
    }

    // Assign questions strictly by standard ranges so Section 1-4 ALWAYS get their exact 10 questions!
    sections[0].questions = allDetectedQs.filter((q) => q.question_number <= 10)
    sections[1].questions = allDetectedQs.filter((q) => q.question_number > 10 && q.question_number <= 20)
    sections[2].questions = allDetectedQs.filter((q) => q.question_number > 20 && q.question_number <= 30)
    sections[3].questions = allDetectedQs.filter((q) => q.question_number > 30 && q.question_number <= 40)
    finalSections = sections
  } else if (skill === 'reading' && (sections.length === 1 || sections.length === 3) && allDetectedQs.length >= 14) {
    if (sections.length === 1) {
      finalSections = [
        {
          title: 'Reading Passage 1',
          order_number: 1,
          instructions: 'Read the passage and answer questions 1 to 13.',
          time_limit_minutes: 20,
          passage_html: sections[0].passage_html,
          audio_url: '',
          questions: allDetectedQs.filter((q) => q.question_number <= 13),
        },
        {
          title: 'Reading Passage 2',
          order_number: 2,
          instructions: 'Read the passage and answer questions 14 to 26.',
          time_limit_minutes: 20,
          passage_html: '',
          audio_url: '',
          questions: allDetectedQs.filter((q) => q.question_number > 13 && q.question_number <= 26),
        },
        {
          title: 'Reading Passage 3',
          order_number: 3,
          instructions: 'Read the passage and answer questions 27 to 40.',
          time_limit_minutes: 20,
          passage_html: '',
          audio_url: '',
          questions: allDetectedQs.filter((q) => q.question_number > 26),
        },
      ].filter((s) => s.questions.length > 0)
    } else if (sections.length === 3) {
      sections[0].questions = allDetectedQs.filter((q) => q.question_number <= 13)
      sections[1].questions = allDetectedQs.filter((q) => q.question_number > 13 && q.question_number <= 26)
      sections[2].questions = allDetectedQs.filter((q) => q.question_number > 26)
      finalSections = sections
    }
  }

  const totalQuestions = finalSections.reduce((acc, s) => acc + s.questions.length, 0)

  return {
    title,
    skill,
    ielts_type: 'academic',
    difficulty: 'medium',
    time_limit_minutes: finalSections.length === 1 ? (skill === 'listening' ? 10 : 20) : (skill === 'listening' ? 30 : 60),
    description: `Authentic IELTS ${skill.toUpperCase()} test imported from HTML source.`,
    sections: finalSections,
    total_questions: totalQuestions,
    warnings,
  }
}
