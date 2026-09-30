/**
 * Foxford IELTS Standard Grading & Answer Verification Engine (Frontend)
 * Implements official IELTS reading/listening answer evaluation rules:
 * - Case-insensitive matching
 * - Punctuation and whitespace tolerance
 * - True/False/Not Given and Yes/No/Not Given abbreviation equivalence (T/F/NG, Y/N/NG)
 * - British vs American spelling acceptance (colour/color, centre/center, etc.)
 * - Number words vs digits equivalence (two/2, first/1st, percent/%)
 * - Article tolerance (optional leading "a", "an", "the")
 * - Alternative answers with slashes or 'or' (e.g. "suburbs / countryside")
 * - Multiple response order-independent matching (['A', 'C'] == ['C', 'A'])
 * - Roman numerals normalization for Matching Headings (i, ii, iii, iv...)
 * - Official IELTS 9.0 Band Score calculation
 */

// British vs American spelling equivalence pairs
const SPELLING_VARIANTS: [RegExp, string][] = [
  [/\bcolo(?:u)?r\b/g, 'color'],
  [/\bcent(?:re|er)\b/g, 'center'],
  [/\btheat(?:re|er)\b/g, 'theater'],
  [/\bmet(?:re|er)\b/g, 'meter'],
  [/\blit(?:re|er)\b/g, 'liter'],
  [/\bfib(?:re|er)\b/g, 'fiber'],
  [/\btravell?ing\b/g, 'traveling'],
  [/\btravell?er\b/g, 'traveler'],
  [/\bcancell?ed\b/g, 'canceled'],
  [/\bprogramm?e\b/g, 'program'],
  [/\bfavo(?:u)?r\b/g, 'favor'],
  [/\bflavo(?:u)?r\b/g, 'flavor'],
  [/\bneighbo(?:u)?r\b/g, 'neighbor'],
  [/\blabo(?:u)?r\b/g, 'labor'],
  [/\bbehavio(?:u)?r\b/g, 'behavior'],
  [/\bhumo(?:u)?r\b/g, 'humor'],
  [/\borgani[sz]e\b/g, 'organize'],
  [/\borgani[sz]ation\b/g, 'organization'],
  [/\brecogni[sz]e\b/g, 'recognize'],
  [/\breali[sz]e\b/g, 'realize'],
  [/\banaly[sz]e\b/g, 'analyze'],
  [/\bdefen[sc]e\b/g, 'defense'],
  [/\blicen[sc]e\b/g, 'license'],
  [/\bpracti[sc]e\b/g, 'practice'],
  [/\bcatalog(?:ue)?\b/g, 'catalog'],
  [/\bdialog(?:ue)?\b/g, 'dialog'],
]

// Number words to digits mapping
const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
  thirteen: '13',
  fourteen: '14',
  fifteen: '15',
  sixteen: '16',
  seventeen: '17',
  eighteen: '18',
  nineteen: '19',
  twenty: '20',
  thirty: '30',
  forty: '40',
  fifty: '50',
  sixty: '60',
  seventy: '70',
  eighty: '80',
  ninety: '90',
  hundred: '100',
  thousand: '1000',
  million: '1000000',
  first: '1st',
  second: '2nd',
  third: '3rd',
  fourth: '4th',
  fifth: '5th',
  sixth: '6th',
  seventh: '7th',
  eighth: '8th',
  ninth: '9th',
  tenth: '10th',
}

/**
 * Clean and normalize a string:
 * - trim, lowercase
 * - remove surrounding/trailing punctuation
 * - collapse whitespace
 */
export function cleanText(str: any): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[.,;:!?]+$/, '')
    .replace(/^[.,;:!?]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalize True/False/Not Given and Yes/No/Not Given answers
 */
export function normalizeTfNg(val: string): string {
  const c = cleanText(val)
  if (c === 't' || c === 'true') return 'TRUE'
  if (c === 'f' || c === 'false') return 'FALSE'
  if (c === 'ng' || c === 'not given' || c === 'notgiven' || c === 'not-given') return 'NOT GIVEN'
  if (c === 'y' || c === 'yes') return 'YES'
  if (c === 'n' || c === 'no') return 'NO'
  return c.toUpperCase()
}

/**
 * Apply spelling and number normalizations
 */
export function applyLexicalNormalization(str: string): string {
  let text = cleanText(str)

  // Remove commas in numbers (e.g. "10,000" -> "10000")
  text = text.replace(/(\d),(\d)/g, '$1$2')

  // % vs percent
  text = text.replace(/\bpercent\b/g, '%').replace(/\s*%/g, '%')

  // Apply UK/US spelling variants
  for (const [pattern, replacement] of SPELLING_VARIANTS) {
    text = text.replace(pattern, replacement)
  }

  // Number words to digits
  const words = text.split(' ')
  const convertedWords = words.map((w) => NUMBER_WORDS[w] || w)
  text = convertedWords.join(' ')

  return text
}

/**
 * Extract individual accepted options from a correct_answer string.
 * Example: "suburbs / countryside" -> ["suburbs", "countryside"]
 * Example: "(the) hospital" -> ["hospital", "the hospital"]
 */
export function expandAcceptedAnswers(primaryAnswer: any, acceptedAnswers?: any[]): string[] {
  const result = new Set<string>()

  const addVariant = (raw: string) => {
    if (!raw) return
    const cleaned = cleanText(raw)
    if (cleaned) {
      result.add(cleaned)

      // Also add version without leading articles "a", "an", "the"
      const noArticle = cleaned.replace(/^(?:the|a|an)\s+/i, '')
      if (noArticle !== cleaned) {
        result.add(noArticle)
      }

      // If text has parentheses like "(the) museum", add both versions
      if (/\([^\)]+\)/.test(raw)) {
        const withoutParen = raw.replace(/\([^\)]+\)/g, '').trim()
        const withInnerParen = raw.replace(/[\(\)]/g, '').trim()
        if (withoutParen) result.add(cleanText(withoutParen))
        if (withInnerParen) result.add(cleanText(withInnerParen))
      }
    }
  }

  if (typeof primaryAnswer === 'string' && primaryAnswer.trim()) {
    const parts = primaryAnswer.split(/\s*(?:\/|\||\bor\b)\s*/i)
    for (const p of parts) {
      addVariant(p)
    }
  } else if (primaryAnswer !== undefined && primaryAnswer !== null) {
    addVariant(String(primaryAnswer))
  }

  if (Array.isArray(acceptedAnswers)) {
    for (const acc of acceptedAnswers) {
      if (typeof acc === 'string') {
        const parts = acc.split(/\s*(?:\/|\||\bor\b)\s*/i)
        for (const p of parts) addVariant(p)
      } else if (acc !== undefined && acc !== null) {
        addVariant(String(acc))
      }
    }
  }

  return Array.from(result)
}

/**
 * Universal IELTS Answer Evaluator
 * Compares a user's answer against the question's correct answer and accepted variants.
 */
export function verifyIeltsAnswer(
  userAnswer: any,
  correctAnswer: any,
  acceptedAnswers: any[] = [],
  questionType: string = 'multiple_choice',
  options?: any[]
): boolean {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false
  }

  const qType = (
    typeof questionType === 'string'
      ? questionType
      : Array.isArray(questionType)
        ? (questionType[0] || '')
        : String(questionType || '')
  ).toLowerCase()

  // 1. True/False/Not Given & Yes/No/Not Given
  if (qType === 'true_false_not_given' || qType === 'yes_no_not_given') {
    const userNorm = normalizeTfNg(userAnswer)
    const correctNorm = normalizeTfNg(correctAnswer)
    if (userNorm === correctNorm) return true

    if (Array.isArray(acceptedAnswers)) {
      for (const acc of acceptedAnswers) {
        if (userNorm === normalizeTfNg(acc)) return true
      }
    }
    return false
  }

  // 2. Multiple Choice (Single)
  if (qType === 'multiple_choice') {
    const userClean = cleanText(userAnswer).toUpperCase()
    let correctKey = cleanText(correctAnswer).toUpperCase()

    // If correctAnswer is like "B. Demographics", extract letter
    const keyMatch = correctKey.match(/^([A-H])(?:[\.\:\-\s]|$)/)
    if (keyMatch) correctKey = keyMatch[1]

    if (userClean === correctKey) return true

    // If user provided option text or option object, check against options list
    if (Array.isArray(options) && options.length > 0) {
      const matchedOpt = options.find(
        (o) =>
          cleanText(o.option_key).toUpperCase() === correctKey ||
          cleanText(o.option_text) === cleanText(correctAnswer) ||
          !!o.is_correct
      )
      if (matchedOpt) {
        const optKey = cleanText(matchedOpt.option_key).toUpperCase()
        const optText = cleanText(matchedOpt.option_text)
        if (userClean === optKey || cleanText(userAnswer) === optText) {
          return true
        }
      }
    }

    return false
  }

  // 3. Multiple Response (Checkboxes / Choose Two or Three)
  if (qType === 'multiple_response' || qType === 'multiple_select') {
    let userTokens: string[] = []
    if (Array.isArray(userAnswer)) {
      userTokens = userAnswer.map((v) => cleanText(v).toUpperCase()).filter(Boolean)
    } else {
      userTokens = String(userAnswer)
        .split(/[\s,;&]+/)
        .map((v) => cleanText(v).toUpperCase())
        .filter(Boolean)
    }

    let correctTokens: string[] = []
    if (Array.isArray(correctAnswer)) {
      correctTokens = correctAnswer.map((v) => cleanText(v).toUpperCase()).filter(Boolean)
    } else if (Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0) {
      correctTokens = acceptedAnswers.map((v) => cleanText(v).toUpperCase()).filter(Boolean)
    } else {
      correctTokens = String(correctAnswer || '')
        .split(/[\s,;&]+/)
        .map((v) => cleanText(v).toUpperCase())
        .filter(Boolean)
    }

    const userSorted = Array.from(new Set(userTokens)).sort().join(',')
    const correctSorted = Array.from(new Set(correctTokens)).sort().join(',')

    return userSorted === correctSorted && correctSorted.length > 0
  }

  // 4. Matching Headings (Multi-paragraph or single Roman numeral)
  if (qType === 'matching_headings') {
    let parsedCorrect: any = correctAnswer
    if (typeof parsedCorrect === 'string' && parsedCorrect.trim().startsWith('{')) {
      try { parsedCorrect = JSON.parse(parsedCorrect) } catch {}
    }

    let parsedUser: any = userAnswer
    if (typeof parsedUser === 'string' && parsedUser.trim().startsWith('{')) {
      try { parsedUser = JSON.parse(parsedUser) } catch {}
    }

    if (
      typeof parsedCorrect === 'object' &&
      parsedCorrect !== null &&
      typeof parsedUser === 'object' &&
      parsedUser !== null
    ) {
      const keys = Object.keys(parsedCorrect)
      if (keys.length === 0) return false
      const matched = keys.filter((k) => {
        const uVal = cleanText(parsedUser[k]).replace(/[.,]/g, '')
        const cVal = cleanText(parsedCorrect[k]).replace(/[.,]/g, '')
        return uVal === cVal && uVal.length > 0
      }).length
      return matched === keys.length
    }

    const uClean = cleanText(userAnswer).replace(/[.,]/g, '')
    const cClean = cleanText(correctAnswer).replace(/[.,]/g, '')
    return uClean === cClean && uClean.length > 0
  }

  // 5. Matching Information / Features / Sentence Endings
  if (
    qType === 'matching_information' ||
    qType === 'matching_features' ||
    qType === 'matching_sentence_endings'
  ) {
    let u = cleanText(userAnswer).toUpperCase()
    u = u.replace(/^(?:PARAGRAPH|PARA|SECTION|PART)\s+/i, '').replace(/[.,]/g, '').trim()

    let c = cleanText(correctAnswer).toUpperCase()
    c = c.replace(/^(?:PARAGRAPH|PARA|SECTION|PART)\s+/i, '').replace(/[.,]/g, '').trim()

    if (u === c && u.length > 0) return true

    if (Array.isArray(acceptedAnswers)) {
      for (const acc of acceptedAnswers) {
        const accClean = cleanText(acc)
          .toUpperCase()
          .replace(/^(?:PARAGRAPH|PARA|SECTION|PART)\s+/i, '')
          .replace(/[.,]/g, '')
          .trim()
        if (u === accClean && u.length > 0) return true
      }
    }
    return false
  }

  // 6. Completion, Short Answer, Diagram Label (Text matching)
  const userClean = cleanText(userAnswer)
  const userLexical = applyLexicalNormalization(userClean)
  const userNoArticle = userClean.replace(/^(?:the|a|an)\s+/i, '')

  const candidateAnswers = expandAcceptedAnswers(correctAnswer, acceptedAnswers)

  for (const candidate of candidateAnswers) {
    const candClean = cleanText(candidate)
    const candLexical = applyLexicalNormalization(candClean)
    const candNoArticle = candClean.replace(/^(?:the|a|an)\s+/i, '')

    // Direct equality
    if (userClean === candClean) return true

    // Lexical / spelling variant equality (colour == color, 2 == two)
    if (userLexical === candLexical && userLexical.length > 0) return true

    // Article tolerance ("internet" == "the internet")
    if (userNoArticle === candNoArticle && userNoArticle.length > 0) return true
    if (userClean === candNoArticle || userNoArticle === candClean) return true
  }

  return false
}

/**
 * Official IELTS 9-Band Calculator for 40-question Reading & Listening tests
 */
export function calculateIeltsBand(
  rawScore: number,
  totalQuestions: number = 40,
  skill: string = 'reading',
  ieltsType: string = 'academic'
): number {
  if (totalQuestions <= 0 || rawScore <= 0) return 0.0

  if (totalQuestions === 40) {
    if (skill.toLowerCase() === 'listening') {
      if (rawScore >= 39) return 9.0
      if (rawScore >= 37) return 8.5
      if (rawScore >= 35) return 8.0
      if (rawScore >= 32) return 7.5
      if (rawScore >= 30) return 7.0
      if (rawScore >= 26) return 6.5
      if (rawScore >= 23) return 6.0
      if (rawScore >= 18) return 5.5
      if (rawScore >= 16) return 5.0
      if (rawScore >= 13) return 4.5
      if (rawScore >= 10) return 4.0
      if (rawScore >= 6) return 3.5
      if (rawScore >= 4) return 3.0
      return 2.5
    }

    if (ieltsType.toLowerCase() === 'general_training') {
      if (rawScore >= 40) return 9.0
      if (rawScore >= 39) return 8.5
      if (rawScore >= 37) return 8.0
      if (rawScore >= 36) return 7.5
      if (rawScore >= 34) return 7.0
      if (rawScore >= 32) return 6.5
      if (rawScore >= 30) return 6.0
      if (rawScore >= 27) return 5.5
      if (rawScore >= 23) return 5.0
      if (rawScore >= 19) return 4.5
      if (rawScore >= 15) return 4.0
      if (rawScore >= 12) return 3.5
      if (rawScore >= 8) return 3.0
      return 2.5
    }

    if (rawScore >= 39) return 9.0
    if (rawScore >= 37) return 8.5
    if (rawScore >= 35) return 8.0
    if (rawScore >= 33) return 7.5
    if (rawScore >= 30) return 7.0
    if (rawScore >= 27) return 6.5
    if (rawScore >= 23) return 6.0
    if (rawScore >= 19) return 5.5
    if (rawScore >= 15) return 5.0
    if (rawScore >= 13) return 4.5
    if (rawScore >= 10) return 4.0
    if (rawScore >= 8) return 3.5
    if (rawScore >= 6) return 3.0
    return 2.5
  }

  const ratio = rawScore / totalQuestions
  if (ratio >= 0.975) return 9.0
  if (ratio >= 0.925) return 8.5
  if (ratio >= 0.875) return 8.0
  if (ratio >= 0.80) return 7.5
  if (ratio >= 0.725) return 7.0
  if (ratio >= 0.65) return 6.5
  if (ratio >= 0.575) return 6.0
  if (ratio >= 0.50) return 5.5
  if (ratio >= 0.40) return 5.0
  if (ratio >= 0.30) return 4.5
  if (ratio >= 0.20) return 4.0
  if (ratio >= 0.15) return 3.5
  return 3.0
}
