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

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Clean question prompt text: remove incomplete tags, rogue quotes/brackets, leading question numbers, etc.
 */
export function cleanQuestionPrompt(text: string, qNum: number): string {
  let cleaned = text
    .replace(/<select[\s\S]*?<\/select>/gi, ' [____] ')
    .replace(/<input[^>]*>/gi, ' [____] ')
    .replace(/<span[^>]*class=["'][^"']*drop-zone[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, ' [____] ')
    .replace(/<span[^>]*class=["'][^"']*drop-zone[^"']*["'][^>]*>/gi, ' [____] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  cleaned = cleaned.replace(/^["'>\s]+/, '')
  cleaned = cleaned.replace(/<[^>]*$/, '').trim()

  // Remove question number prefixes: "15 Sweet Water" -> "Sweet Water", "15. Sweet Water" -> "Sweet Water", "▪"
  cleaned = cleaned.replace(new RegExp(`^(?:[▪•\\-\\s]*)(?:Question\\s+)?${qNum}[\\.\\:\\)\\-\\s]+`, 'i'), '')
  cleaned = cleaned.replace(/^[▪•\-\s]+/, '')

  // Remove duplicate question numbers right before [____] (e.g. "21 [____]" -> "[____]")
  cleaned = cleaned.replace(new RegExp(`\\b${qNum}\\s*\\[____\\]`, 'gi'), '[____]')

  // Cut next question if swallowed: e.g. "16 Season of the Harvest"
  const nextQ = qNum + 1
  const nextQMatch = cleaned.match(new RegExp(`\\b${nextQ}\\s+[A-Z]`, 'i'))
  if (nextQMatch && nextQMatch.index !== undefined && nextQMatch.index > 5) {
    cleaned = cleaned.substring(0, nextQMatch.index).trim()
  }

  cleaned = cleaned.replace(new RegExp(`\\[${qNum}\\]`, 'g'), '[____]')
  cleaned = cleaned.replace(new RegExp(`\\{${qNum}\\}`, 'g'), '[____]')
  cleaned = cleaned.replace(/\[____\]\s*\[____\]/g, '[____]')
  cleaned = cleaned.replace(/^["'>\s]+/, '').trim()

  return cleaned || `Question ${qNum}`
}

/**
 * Pre-extract answer keys from Javascript scripts or embedded data BEFORE stripping scripts
 */
export function extractAnswerKeysFromRawHtml(rawHtml: string): Record<number, { answer: string; explanation?: string }> {
  const map: Record<number, { answer: string; explanation?: string }> = {}

  // 1. Script variable: ANSWER_KEY = { q14: { answer: 'D', explanation: '...' }, ... }
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
    } catch {
      // ignore
    }
  }

  // 2. Script variable: correctAnswers = { 1: 'weight', '11to12': ['e', 'c'], 15: 'g', ... }
  const correctAnswersMatch = rawHtml.match(/(?:const|let|var)\s+(?:correctAnswers|answers|key)\s*=\s*(\{[\s\S]*?\});/i)
  if (correctAnswersMatch) {
    const objStr = correctAnswersMatch[1]

    // 2a. Multi-question ranges like '11to12': ['e', 'c'] or '13-14': ['b', 'd']
    const rangeRegex = /(?:['"]?(\d{1,2})(?:to|-|_)?(\d{1,2})['"]?\s*:\s*\[([\s\S]*?)\])/gi
    let rm
    while ((rm = rangeRegex.exec(objStr)) !== null) {
      const startQ = parseInt(rm[1], 10)
      const endQ = parseInt(rm[2], 10)
      const listStr = rm[3]
      const items = [...listStr.matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1].trim())

      if (startQ > 0 && endQ <= 40 && items.length > 0) {
        for (let q = startQ; q <= endQ; q++) {
          const itemIdx = q - startQ
          const val = items[itemIdx] || items[0] || ''
          if (val && !map[q]) {
            map[q] = { answer: val.length === 1 ? val.toUpperCase() : val, explanation: '' }
          }
        }
      }
    }

    // 2b. Standard number entries: 1: 'weight', 15: 'g'
    const numEntryRegex = /(?:['"]?(\d{1,2})['"]?\s*:\s*(?:\[\s*['"]([^'"]+)['"]|['"]([^'"]+)['"]))/gi
    let m
    while ((m = numEntryRegex.exec(objStr)) !== null) {
      const qNum = parseInt(m[1], 10)
      let ansVal = (m[2] || m[3] || '').trim()
      if (ansVal.length === 1 && /[a-z]/i.test(ansVal)) {
        ansVal = ansVal.toUpperCase()
      }
      if (qNum > 0 && qNum <= 40 && ansVal && !map[qNum]) {
        map[qNum] = { answer: ansVal, explanation: '' }
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
      map[qNum] = { answer: ans.length === 1 ? ans.toUpperCase() : ans, explanation: '' }
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
 * Pre-extract drag-and-drop pools and options boxes from HTML
 */
export function extractOptionBoxesFromRawHtml(rawHtml: string): Record<string, ParsedQuestionOption[]> {
  const pools: Record<string, ParsedQuestionOption[]> = {}

  // Match option boxes: <div class="options-box" id="options-part2">
  const boxHeaderRegex = /<(?:div|ul)[^>]*class=["'][^"']*(?:options-box|drag-container|draggable-container|options-list)[^"']*["'][^>]*id=["']([^"']+)["'][^>]*>/gi
  let bm
  while ((bm = boxHeaderRegex.exec(rawHtml)) !== null) {
    const boxId = bm[1]
    const startPos = bm.index + bm[0].length
    const chunk = rawHtml.substring(startPos, startPos + 3000)
    const stopMatch = chunk.match(/<(?:div|section)[^>]*class=["'][^"']*(?:question|flow-step|section|sub-section|part-section)[^"']*["']/i)
    const boxContent = stopMatch && stopMatch.index !== undefined ? chunk.substring(0, stopMatch.index) : chunk

    const optRegex = /<(?:div|li)[^>]*class=["'][^"']*(?:option|draggable-item|item)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|li)>/gi
    const opts: ParsedQuestionOption[] = []
    let om
    while ((om = optRegex.exec(boxContent)) !== null) {
      const fullText = stripTags(om[1]).trim()
      const letterMatch = fullText.match(/^([A-I])\b[\.\:\-\s]*(.*)$/i)
      const key = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + opts.length)
      const text = letterMatch ? letterMatch[2].trim() : fullText

      if (!opts.some(o => o.option_key === key)) {
        opts.push({
          option_key: key,
          option_text: text || `Option ${key}`,
          is_correct: false,
        })
      }
    }

    if (opts.length > 0) {
      pools[boxId] = opts
    }
  }

  return pools
}

/**
 * Main High-Precision IELTS HTML Parser
 */
export function parseIeltsHtml(rawHtml: string): ParsedIeltsTest {
  const warnings: string[] = []

  // Step 1: Pre-extract answer keys and drag-and-drop option boxes
  const answerKeyMap = extractAnswerKeysFromRawHtml(rawHtml)
  const optionBoxes = extractOptionBoxesFromRawHtml(rawHtml)

  // Step 2: Global audio link extraction
  let globalAudioUrl = ''
  const audioMatch = rawHtml.match(/<audio[^>]*src=["']([^"']+)["']/i) ||
    rawHtml.match(/<source[^>]*src=["']([^"']+\.(?:mp3|wav|ogg|m4a))["']/i) ||
    rawHtml.match(/href=["']([^"']+\.(?:mp3|wav|ogg|m4a))["']/i)

  if (audioMatch && audioMatch[1]) {
    globalAudioUrl = audioMatch[1]
  }

  // Step 3: Clean HTML (strip script, style, comments)
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
      skill = 'listening'
    }
  }

  // Step 6: Identify Section Boundaries
  interface SectionCandidate {
    title: string
    content: string
    audioUrl?: string
    sectionNumber?: number
  }
  const sectionCandidates: SectionCandidate[] = []

  // Pattern 0: Split by explicit Part / Section markers in headings or divs:
  const partMarkerRegex = /<(?:div|h[1-5]|header|p)\b[^>]*class=["'][^"']*(?:section-title|part-title|part-header|section-header)[^"']*["'][^>]*>\s*(?:<strong>)?\s*(?:PART|SECTION)\s*([1-4])[\s\S]*?<\/(?:div|h[1-5]|header|p)>/gi
  const partMarkers = [...clean.matchAll(partMarkerRegex)]

  if (partMarkers.length >= 2) {
    for (let i = 0; i < partMarkers.length; i++) {
      const start = partMarkers[i].index!
      const end = (i < partMarkers.length - 1) ? partMarkers[i + 1].index! : clean.length
      const chunk = clean.substring(start, end)
      const partNum = parseInt(partMarkers[i][1], 10)
      const secTitle = skill === 'listening' ? `Part ${partNum}` : `Section ${partNum}`
      sectionCandidates.push({ title: secTitle, content: chunk, sectionNumber: partNum })
    }
  }

  // Pattern A: <section ...>
  if (sectionCandidates.length === 0) {
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
        sectionCandidates.push({ title: secTitle, content: body, sectionNumber: idx + 1 })
      })
    }
  }

  // Pattern B: Headings with Passage X or Part X
  if (sectionCandidates.length === 0) {
    const headingMatches = [...clean.matchAll(/<h[1-4]\b[^>]*>\s*(?:Reading\s+Passage|Passage|Section|Part)\s+([1-4])[\s\S]*?<\/h[1-4]>/gi)]
    if (headingMatches.length >= 2) {
      for (let i = 0; i < headingMatches.length; i++) {
        const start = headingMatches[i].index!
        const end = (i < headingMatches.length - 1) ? headingMatches[i + 1].index! : clean.length
        const chunk = clean.substring(start, end)
        const partNum = parseInt(headingMatches[i][1], 10)
        const secTitle = stripTags(headingMatches[i][0]).trim() || `Section ${partNum}`
        sectionCandidates.push({ title: secTitle, content: chunk, sectionNumber: partNum })
      }
    }
  }

  // Fallback
  if (sectionCandidates.length === 0) {
    const fallbackTitle = skill === 'reading' ? 'Reading Passage 1' : 'Part 1'
    sectionCandidates.push({ title: fallbackTitle, content: clean, sectionNumber: 1 })
  }

  const sections: ParsedSection[] = []
  const seenGlobalQNums = new Set<number>()
  const allParsedQuestions: ParsedQuestion[] = []

  sectionCandidates.forEach((cand, sIdx) => {
    const secNum = cand.sectionNumber || sIdx + 1
    const secTitle = cand.title || (skill === 'reading' ? `Reading Passage ${secNum}` : `Part ${secNum}`)
    const chunk = cand.content

    let secAudio = globalAudioUrl
    const secAudioMatch = chunk.match(/<audio[^>]*src=["']([^"']+)["']/i) || chunk.match(/<source[^>]*src=["']([^"']+)["']/i)
    if (secAudioMatch && secAudioMatch[1]) {
      secAudio = secAudioMatch[1]
    }

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
        }
      }
    } else if (skill === 'listening' && !passageHtml) {
      // For listening tests, extract the formatted note-card, flow-chart, or container into passageHtml
      const cardMatch = chunk.match(/<div[^>]*class=["'][^"']*(?:note-card|drag-container|questions-list|process-container|mc-question)[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/i) ||
        chunk.match(/<div[^>]*class=["'][^"']*(?:note-card|drag-container|questions-list)[^"']*["'][^>]*>[\s\S]*?<\/div>/i)
      if (cardMatch) {
        let cleanCard = cardMatch[0]
          .replace(/<input[^>]*id=["']q?(\d{1,2})["'][^>]*>/gi, ' <strong>[$1]</strong> ')
          .replace(/<span[^>]*class=["'][^"']*drop-zone[^"']*["'][^>]*data-question=["']?(\d{1,2})["']?[^>]*><\/span>/gi, ' <strong>[$1]</strong> ')
        passageHtml = cleanCard
      }
    }

    const sectionQuestions: ParsedQuestion[] = []

    // 7A: Handle Multi-select questions (e.g. Questions 11 and 12, name="q11to12", checkboxes)
    const multiSelectHeaderRegex = /<(?:div|section)[^>]*id=["']q(\d{1,2})to(\d{1,2})["'][^>]*>/gi
    let msHeader
    while ((msHeader = multiSelectHeaderRegex.exec(questionsHtml)) !== null) {
      const startQ = parseInt(msHeader[1], 10)
      const endQ = parseInt(msHeader[2], 10)
      const startPos = msHeader.index
      const chunkAfter = questionsHtml.substring(startPos, startPos + 2500)
      const stopMatch = chunkAfter.substring(50).match(/<(?:div|section)[^>]*class=["'][^"']*(?:sub-section-title|section-title|drag-container|question)[^"']*["']/i)
      const containerContent = stopMatch && stopMatch.index !== undefined ? chunkAfter.substring(0, stopMatch.index + 50) : chunkAfter

      const beforeContainer = questionsHtml.substring(Math.max(0, startPos - 400), startPos)
      const instrMatch = beforeContainer.match(/<p[^>]*class=["'][^"']*instructions[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)
      const subTitleMatch = beforeContainer.match(/<div[^>]*class=["'][^"']*sub-section-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
      const promptText = stripTags(containerContent.match(/<p>([\s\S]*?)<\/p>/i)?.[1] || '').trim()

      const fullInstruction = stripTags(instrMatch?.[1] || 'Choose TWO letters, A–E.').trim()
      const questionPrompt = promptText || (subTitleMatch ? stripTags(subTitleMatch[1]).trim() : `Questions ${startQ} and ${endQ}`)

      const optMatches = [...containerContent.matchAll(/<input[^>]*type=["']checkbox["'][^>]*value=["']([a-h0-9])["'][^>]*>([\s\S]*?)<\/label>/gi)]
      const options: ParsedQuestionOption[] = optMatches.map(om => {
        const key = om[1].toUpperCase()
        const text = stripTags(om[2]).replace(/^[A-H][\.\:\-\s]*/i, '').trim()
        return { option_key: key, option_text: text, is_correct: false }
      })

      for (let q = startQ; q <= endQ; q++) {
        if (!seenGlobalQNums.has(q)) {
          seenGlobalQNums.add(q)
          const ans = answerKeyMap[q]?.answer || ''
          const qOptions = options.map(opt => ({
            ...opt,
            is_correct: opt.option_key.toUpperCase() === ans.toUpperCase(),
          }))

          const parsedQ: ParsedQuestion = {
            question_number: q,
            question_type: 'multiple_response',
            instruction: fullInstruction,
            question_text: questionPrompt,
            options: qOptions,
            correct_answer: ans,
            accepted_answers: ans ? [ans] : [],
            points: 1,
            difficulty: 'medium',
            explanation: answerKeyMap[q]?.explanation || '',
          }
          sectionQuestions.push(parsedQ)
          allParsedQuestions.push(parsedQ)
        }
      }
    }

    // 7B: Handle Drag-and-drop / Matching questions (items with drop-zone)
    const dropZoneMatches = [...questionsHtml.matchAll(/<(?:div|p|li)[^>]*class=["'][^"']*(?:question|flow-step|item)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|li)>/gi)]
    dropZoneMatches.forEach(dz => {
      const itemHtml = dz[0]
      const qNumMatch = itemHtml.match(/data-question=["']?(\d{1,2})["']?/i) ||
        itemHtml.match(/id=["']q(\d{1,2})["']?/i) ||
        itemHtml.match(/(?:^|>|\s)(\d{1,2})\s+[A-Za-z]/i)

      if (qNumMatch) {
        const qNum = parseInt(qNumMatch[1], 10)
        if (qNum > 0 && qNum <= 40 && !seenGlobalQNums.has(qNum)) {
          seenGlobalQNums.add(qNum)

          const pos = questionsHtml.indexOf(itemHtml)
          const beforeHtml = pos !== -1 ? questionsHtml.substring(0, pos) : ''
          const lastBoxMatch = [...beforeHtml.matchAll(/id=["'](options-[^"']+|pool-[^"']+)["']/gi)].pop()
          const boxId = lastBoxMatch ? lastBoxMatch[1] : Object.keys(optionBoxes)[0]
          const availableOptions = boxId && optionBoxes[boxId] ? optionBoxes[boxId] : []

          const isFlow = /flow-step|flow-chart|mite/i.test(itemHtml + ' ' + beforeHtml.substring(Math.max(0, beforeHtml.length - 300)))
          let qText = cleanQuestionPrompt(itemHtml, qNum)

          // Check for preceding intermediary flow-chart step without inputs
          if (isFlow) {
            const lastStep = beforeHtml.lastIndexOf('class="flow-step"')
            if (lastStep !== -1) {
              const prevBefore = beforeHtml.substring(0, lastStep)
              const prevStep = prevBefore.lastIndexOf('<div')
              if (prevStep !== -1) {
                const prevChunk = beforeHtml.substring(prevStep, lastStep)
                if (!/data-question|<input/i.test(prevChunk)) {
                  const cleanPrev = stripTags(prevChunk.replace(/^[^>]*>/, '')).replace(/^[▪•\-\s]+/, '').trim()
                  if (cleanPrev && cleanPrev.length > 5 && cleanPrev.length < 120) {
                    qText = `${cleanPrev} • ${qText}`
                  }
                }
              }
            }
          }

          if (!isFlow) {
            // For matching items like "Sweet Water Season", keep just the clean name
            qText = qText.replace(/\s*\[____\]\s*/g, '').trim()
          }

          const instrMatch = beforeHtml.match(/<p[^>]*class=["'][^"']*instructions[^"']*["'][^>]*>([\s\S]*?)<\/p>(?![\s\S]*<p[^>]*class=["'][^"']*instructions)/i)
          const instruction = instrMatch ? stripTags(instrMatch[1]).trim() : 'Choose the correct letter and match with each item.'

          const qType = isFlow ? 'flow_chart_completion' : 'matching'
          const ans = answerKeyMap[qNum]?.answer || ''
          const qOptions = availableOptions.map(opt => ({
            ...opt,
            is_correct: opt.option_key.toUpperCase() === ans.toUpperCase(),
          }))

          const parsedQ: ParsedQuestion = {
            question_number: qNum,
            question_type: qType,
            instruction,
            question_text: qText,
            options: qOptions,
            correct_answer: ans,
            accepted_answers: ans ? [ans] : [],
            points: 1,
            difficulty: 'medium',
            explanation: answerKeyMap[qNum]?.explanation || '',
          }
          sectionQuestions.push(parsedQ)
          allParsedQuestions.push(parsedQ)
        }
      }
    })

    // 7C: Handle Standard Inputs / Note Completion
    const inputMatches = [...questionsHtml.matchAll(/<(?:input|select)[^>]*id=["']q?(\d{1,2})["'][^>]*>/gi)]
    inputMatches.forEach(im => {
      const qNum = parseInt(im[1], 10)
      if (qNum > 0 && qNum <= 40 && !seenGlobalQNums.has(qNum)) {
        seenGlobalQNums.add(qNum)

        const pos = im.index!
        const before = questionsHtml.substring(Math.max(0, pos - 300), pos)
        const lastLi = before.lastIndexOf('<li')
        const lastP = before.lastIndexOf('<p')
        const lastTr = before.lastIndexOf('<tr')
        const lastDiv = before.lastIndexOf('<div')
        const bestStart = Math.max(lastLi, lastP, lastTr, lastDiv)
        const startIdx = bestStart !== -1 ? pos - (before.length - bestStart) : Math.max(0, pos - 100)

        const after = questionsHtml.substring(pos, pos + 300)
        const nextLi = after.indexOf('</li>')
        const nextP = after.indexOf('</p>')
        const nextTr = after.indexOf('</tr>')
        const nextDiv = after.indexOf('</div>')
        const closes = [nextLi !== -1 ? nextLi + 5 : -1, nextP !== -1 ? nextP + 4 : -1, nextTr !== -1 ? nextTr + 5 : -1, nextDiv !== -1 ? nextDiv + 6 : -1].filter(x => x > 0)
        const bestEnd = closes.length > 0 ? Math.min(...closes) : 100
        const endIdx = pos + bestEnd

        // Check for preceding helper bullet or subheading (e.g. "Classes last for 55 minutes", "Yoga", "Soccer")
        let helperText = ''
        if (lastLi !== -1) {
          const prevLiBefore = before.substring(0, lastLi)
          const prevOpenLi = prevLiBefore.lastIndexOf('<li')
          if (prevOpenLi !== -1) {
            const prevLiChunk = before.substring(prevOpenLi, lastLi)
            if (!/<input|<select|data-question/i.test(prevLiChunk)) {
              const cleanPrev = stripTags(prevLiChunk).replace(/^[▪•\-\s]+/, '').trim()
              if (cleanPrev && cleanPrev.length > 2 && cleanPrev.length < 120) {
                helperText = cleanPrev
              }
            }
          }
        }

        const snippet = questionsHtml.substring(startIdx, endIdx)
        let qText = cleanQuestionPrompt(snippet, qNum)
        if (helperText) {
          qText = `${helperText} • ${qText}`
        }

        const instrMatch = before.match(/<p[^>]*class=["'][^"']*instructions[^"']*["'][^>]*>([\s\S]*?)<\/p>(?![\s\S]*<p[^>]*class=["'][^"']*instructions)/i)
        const instruction = instrMatch ? stripTags(instrMatch[1]).trim() : 'Complete the notes below. Write ONE WORD ONLY for each answer.'
        const ans = answerKeyMap[qNum]?.answer || ''

        const parsedQ: ParsedQuestion = {
          question_number: qNum,
          question_type: 'note_completion',
          instruction,
          question_text: qText,
          options: [],
          correct_answer: ans,
          accepted_answers: ans ? [ans] : [],
          points: 1,
          difficulty: 'medium',
          explanation: answerKeyMap[qNum]?.explanation || '',
        }
        sectionQuestions.push(parsedQ)
        allParsedQuestions.push(parsedQ)
      }
    })

    // 7D: Handle Text Paragraph Questions (e.g. Cambridge Reading: <p><strong>1.</strong> Statement</p>)
    const paragraphQuestions = [...questionsHtml.matchAll(/<(?:p|div|li)[^>]*>\s*(?:<(?:strong|b|span)[^>]*>)?\s*(?:Question\s+)?(\d{1,2})[\.\:\)]\s*(?:<\/(?:strong|b|span)>)?\s*([\s\S]*?)<\/(?:p|div|li)>/gi)]
    paragraphQuestions.forEach(pq => {
      const qNum = parseInt(pq[1], 10)
      if (qNum > 0 && qNum <= 40 && !seenGlobalQNums.has(qNum)) {
        seenGlobalQNums.add(qNum)

        const rawText = stripTags(pq[2]).trim()
        const pos = pq.index!
        const beforeHtml = questionsHtml.substring(Math.max(0, pos - 500), pos)
        const chunkAfter = questionsHtml.substring(pos, pos + 1000)

        // Check for MCQ options A, B, C, D following this question
        const options: ParsedQuestionOption[] = []
        const optRegex = /<(?:p|div|li)[^>]*>\s*(?:<(?:strong|b)[^>]*>)?\s*([A-H])[\.\:\)]\s*(?:<\/(?:strong|b)>)?\s*([^<\n]+)<\/(?:p|div|li)>/gi
        let om
        while ((om = optRegex.exec(chunkAfter)) !== null) {
          const key = om[1].toUpperCase()
          const text = om[2].trim()
          if (!options.some(o => o.option_key === key)) {
            options.push({ option_key: key, option_text: text, is_correct: false })
          }
        }

        // Determine question type & instruction
        let qType = 'short_answer'
        const instrMatch = beforeHtml.match(/<(?:p|div|em|i)[^>]*>[\s\S]*?(?:TRUE|FALSE|NOT GIVEN|Choose the correct letter|Complete the summary)[\s\S]*?<\/(?:p|div|em|i)>/i)
        const instruction = instrMatch ? stripTags(instrMatch[0]).trim() : 'Answer the question according to the reading passage.'
        const instrLower = instruction.toLowerCase()

        if (instrLower.includes('true') && instrLower.includes('false')) {
          qType = 'true_false_not_given'
        } else if (instrLower.includes('yes') && instrLower.includes('no')) {
          qType = 'yes_no_not_given'
        } else if (options.length >= 2) {
          qType = 'multiple_choice'
        }

        const ans = answerKeyMap[qNum]?.answer || ''
        if (ans && options.length > 0) {
          options.forEach(opt => {
            if (opt.option_key.toUpperCase() === ans.toUpperCase() || opt.option_text.toLowerCase() === ans.toLowerCase()) {
              opt.is_correct = true
            }
          })
        }

        const parsedQ: ParsedQuestion = {
          question_number: qNum,
          question_type: qType,
          instruction,
          question_text: rawText,
          options,
          correct_answer: ans,
          accepted_answers: ans ? [ans] : [],
          points: 1,
          difficulty: 'medium',
          explanation: answerKeyMap[qNum]?.explanation || '',
        }
        sectionQuestions.push(parsedQ)
        allParsedQuestions.push(parsedQ)
      }
    })

    sections.push({
      title: secTitle,
      order_number: secNum,
      instructions: skill === 'reading' ? 'Read the passage and answer questions below.' : 'Listen to the recording and answer questions.',
      time_limit_minutes: skill === 'listening' ? 10 : 20,
      passage_html: passageHtml,
      audio_url: secAudio,
      questions: sectionQuestions,
    })
  })

  // Global 40-question completion ONLY for listening or full tests with answer keys
  const hasFullListeningAnswers = skill === 'listening' || Object.keys(answerKeyMap).length >= 25
  if (hasFullListeningAnswers) {
    for (let q = 1; q <= 40; q++) {
      if (!seenGlobalQNums.has(q)) {
        seenGlobalQNums.add(q)
        const ans = answerKeyMap[q]?.answer || ''
        const defaultType = (q >= 11 && q <= 14) ? 'multiple_choice' : ((q >= 15 && q <= 30) ? 'matching' : 'note_completion')

        const fallbackQ: ParsedQuestion = {
          question_number: q,
          question_type: defaultType,
          instruction: 'Answer the question according to the recording.',
          question_text: `Question ${q} [____]`,
          options: [],
          correct_answer: ans,
          accepted_answers: ans ? [ans] : [],
          points: 1,
          difficulty: 'medium',
          explanation: answerKeyMap[q]?.explanation || '',
        }
        allParsedQuestions.push(fallbackQ)
      }
    }
  }

  allParsedQuestions.sort((a, b) => a.question_number - b.question_number)

  let finalSections: ParsedSection[] = []

  if (skill === 'listening' || allParsedQuestions.length >= 35) {
    const sectionNames = ['Part 1', 'Part 2', 'Part 3', 'Part 4']
    finalSections = sectionNames.map((name, idx) => {
      const startQ = idx * 10 + 1
      const endQ = (idx + 1) * 10
      const sectionQs = allParsedQuestions.filter(q => q.question_number >= startQ && q.question_number <= endQ)
      const existingSec = sections[idx]

      return {
        title: existingSec?.title || name,
        order_number: idx + 1,
        instructions: existingSec?.instructions || 'Listen to the recording and answer questions.',
        time_limit_minutes: 10,
        passage_html: existingSec?.passage_html || '',
        audio_url: existingSec?.audio_url || globalAudioUrl,
        questions: sectionQs,
      }
    })
  } else {
    finalSections = sections.filter(s => s.questions.length > 0)
    if (finalSections.length === 0) {
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
