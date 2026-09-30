export type PracticeScope = 'part_1' | 'part_2' | 'part_3' | 'part_4' | 'full'

export interface TestScopeInfo {
  scope: PracticeScope
  label: string
  shortLabel: string
  timeLimitMinutes: number
  totalQuestions: number
  timeDisplay: string
  questionsDisplay: string
  matchesFilter: (filter: string) => boolean
}

export interface MinimalTestInfo {
  id?: string
  title?: string
  description?: string | null
  skill?: string
  tags?: string[] | null
  total_questions?: number | null
  time_limit_minutes?: number | null
}

/**
 * Accurately deduce the IELTS test part/scope (e.g. Passage 2 Only vs 3 Full Passages)
 * from its tags, title, question count, and configured metadata.
 */
export function getTestScope(test: MinimalTestInfo): TestScopeInfo {
  const skill = (test.skill || 'reading').toLowerCase()
  const tags = Array.isArray(test.tags) ? test.tags : []
  const title = (test.title || '').trim()
  const desc = (test.description || '').trim()
  const rawQCount = typeof test.total_questions === 'number' ? test.total_questions : 0
  const rawTime = typeof test.time_limit_minutes === 'number' ? test.time_limit_minutes : 0

  let detectedScope: PracticeScope = 'full'

  // 1. Explicit tags take top priority
  if (tags.some(t => /part\s*1|passage\s*1|section\s*1/i.test(t))) {
    detectedScope = 'part_1'
  } else if (tags.some(t => /part\s*2|passage\s*2|section\s*2/i.test(t))) {
    detectedScope = 'part_2'
  } else if (tags.some(t => /part\s*3|passage\s*3|section\s*3/i.test(t))) {
    detectedScope = 'part_3'
  } else if (tags.some(t => /part\s*4|passage\s*4|section\s*4/i.test(t))) {
    detectedScope = 'part_4'
  } else if (tags.some(t => /full\s*(test|mock|exam|passages?|sections?)/i.test(t))) {
    detectedScope = 'full'
  } else {
    // 2. Check title
    if (/\b(passage\s*1|part\s*1|section\s*1)\b/i.test(title)) {
      detectedScope = 'part_1'
    } else if (/\b(passage\s*2|part\s*2|section\s*2)\b/i.test(title)) {
      detectedScope = 'part_2'
    } else if (/\b(passage\s*3|part\s*3|section\s*3)\b/i.test(title)) {
      detectedScope = 'part_3'
    } else if (/\b(passage\s*4|part\s*4|section\s*4)\b/i.test(title)) {
      detectedScope = 'part_4'
    } else if (/\b(passage\s*1|part\s*1|section\s*1)\b/i.test(desc)) {
      // 3. Check description
      detectedScope = 'part_1'
    } else if (/\b(passage\s*2|part\s*2|section\s*2)\b/i.test(desc)) {
      detectedScope = 'part_2'
    } else if (/\b(passage\s*3|part\s*3|section\s*3)\b/i.test(desc)) {
      detectedScope = 'part_3'
    } else if (/\b(passage\s*4|part\s*4|section\s*4)\b/i.test(desc)) {
      detectedScope = 'part_4'
    } else if (skill === 'reading') {
      // Question count heuristics for single passage
      if (rawQCount > 0 && rawQCount <= 16) {
        if (/14[\s\-_–—]+26/i.test(title) || /14[\s\-_–—]+26/i.test(desc)) {
          detectedScope = 'part_2'
        } else if (/27[\s\-_–—]+40/i.test(title) || /27[\s\-_–—]+40/i.test(desc)) {
          detectedScope = 'part_3'
        } else {
          detectedScope = 'part_1'
        }
      } else {
        detectedScope = 'full'
      }
    } else if (skill === 'listening') {
      if (rawQCount > 0 && rawQCount <= 12) {
        if (/11[\s\-_–—]+20/i.test(title) || /11[\s\-_–—]+20/i.test(desc)) {
          detectedScope = 'part_2'
        } else if (/21[\s\-_–—]+30/i.test(title) || /21[\s\-_–—]+30/i.test(desc)) {
          detectedScope = 'part_3'
        } else if (/31[\s\-_–—]+40/i.test(title) || /31[\s\-_–—]+40/i.test(desc)) {
          detectedScope = 'part_4'
        } else {
          detectedScope = 'part_1'
        }
      } else {
        detectedScope = 'full'
      }
    } else {
      detectedScope = 'full'
    }
  }

  // Label construction
  let label = '3 Full Passages (Passage 1, 2, 3)'
  let shortLabel = 'Full Test'

  if (skill === 'reading') {
    switch (detectedScope) {
      case 'part_1':
        label = 'Passage 1 Only (Questions 1–13)'
        shortLabel = 'Passage 1'
        break
      case 'part_2':
        label = 'Passage 2 Only (Questions 14–26)'
        shortLabel = 'Passage 2'
        break
      case 'part_3':
        label = 'Passage 3 Only (Questions 27–40)'
        shortLabel = 'Passage 3'
        break
      default:
        label = '3 Full Passages (Passage 1, 2, 3)'
        shortLabel = 'Full Test'
        break
    }
  } else if (skill === 'listening') {
    switch (detectedScope) {
      case 'part_1':
        label = 'Section 1 Only (Questions 1–10)'
        shortLabel = 'Part 1'
        break
      case 'part_2':
        label = 'Section 2 Only (Questions 11–20)'
        shortLabel = 'Part 2'
        break
      case 'part_3':
        label = 'Section 3 Only (Questions 21–30)'
        shortLabel = 'Part 3'
        break
      case 'part_4':
        label = 'Section 4 Only (Questions 31–40)'
        shortLabel = 'Part 4'
        break
      default:
        label = '4 Full Sections (Parts 1, 2, 3, 4)'
        shortLabel = 'Full Test'
        break
    }
  }

  // Questions count
  let totalQuestions = rawQCount
  if (totalQuestions <= 0) {
    if (detectedScope === 'part_1' || detectedScope === 'part_2') totalQuestions = skill === 'listening' ? 10 : 13
    else if (detectedScope === 'part_3') totalQuestions = skill === 'listening' ? 10 : 14
    else if (detectedScope === 'part_4') totalQuestions = 10
    else totalQuestions = 40
  }

  // Duration
  let timeLimitMinutes = rawTime
  if (detectedScope !== 'full' && (timeLimitMinutes <= 0 || timeLimitMinutes === 60)) {
    // If it's a single part but has the default 60 min, override to appropriate single-part time
    timeLimitMinutes = skill === 'reading' ? 20 : 10
  } else if (timeLimitMinutes <= 0) {
    timeLimitMinutes = skill === 'reading' ? 60 : 30
  }

  const timeDisplay = `${timeLimitMinutes} min`
  const questionsDisplay = `${totalQuestions} Questions`

  // Filter matching: exact match for dedicated practice tabs, full only for full, all for all
  const matchesFilter = (filter: string): boolean => {
    if (!filter || filter === 'all') return true

    if (skill === 'reading') {
      if (filter === 'passage_1') return detectedScope === 'part_1'
      if (filter === 'passage_2') return detectedScope === 'part_2'
      if (filter === 'passage_3') return detectedScope === 'part_3'
      if (filter === 'full') return detectedScope === 'full'
    } else if (skill === 'listening') {
      if (filter === 'part_1') return detectedScope === 'part_1'
      if (filter === 'part_2') return detectedScope === 'part_2'
      if (filter === 'part_3') return detectedScope === 'part_3'
      if (filter === 'part_4') return detectedScope === 'part_4'
      if (filter === 'full') return detectedScope === 'full'
    }

    return true
  }

  return {
    scope: detectedScope,
    label,
    shortLabel,
    timeLimitMinutes,
    totalQuestions,
    timeDisplay,
    questionsDisplay,
    matchesFilter,
  }
}
