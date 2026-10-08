import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Headphones,
  Layers,
  ArrowRight,
  Eye,
  Trash2,
  Volume2,
  Edit,
  Plus,
  Save,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  ExternalLink,
  ShieldAlert,
  ListChecks,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { parseIeltsHtml, ParsedIeltsTest, ParsedQuestion, ParsedSection } from '@/lib/parsers/html-test-parser'
import { saveFullTestStructure, createImportRecord } from '@/actions/admin'
import { cn } from '@/lib/utils'

// ======================================================================
// 1. CANONICAL QUESTION TYPES & LABELS
// ======================================================================

export const CANONICAL_QUESTION_TYPES: { value: string; label: string; badgeColor: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice', badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'true_false_not_given', label: 'True / False / Not Given', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'yes_no_not_given', label: 'Yes / No / Not Given', badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { value: 'matching_headings', label: 'Matching Headings', badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { value: 'matching_information', label: 'Matching Information', badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  { value: 'matching_features', label: 'Matching Features', badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { value: 'matching', label: 'Matching', badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { value: 'sentence_completion', label: 'Sentence Completion', badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { value: 'summary_completion', label: 'Summary Completion', badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { value: 'note_completion', label: 'Note Completion', badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  { value: 'table_completion', label: 'Table Completion', badgeColor: 'bg-lime-500/10 text-lime-600 border-lime-500/20' },
  { value: 'flow_chart_completion', label: 'Flow Chart Completion', badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { value: 'diagram_labelling', label: 'Diagram Labelling', badgeColor: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  { value: 'diagram_labeling', label: 'Diagram Labeling', badgeColor: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  { value: 'map_labelling', label: 'Map Labelling', badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20' },
  { value: 'short_answer', label: 'Short Answer', badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
]

const QT_MAP = CANONICAL_QUESTION_TYPES.reduce((acc, t) => {
  acc[t.value] = t
  return acc
}, {} as Record<string, { value: string; label: string; badgeColor: string }>)

// ======================================================================
// 2. VALIDATION INTERFACE & LOGIC
// ======================================================================

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalQuestions: number
    expectedQuestions: number
    byType: Record<string, number>
    missingAnswers: number
    missingPrompts: number
    needsReviewCount: number
    hasAudio: boolean
    hasPassage: boolean
    passageLength: number
  }
}

export function validateParsedTest(test: ParsedIeltsTest | null): ValidationResult {
  if (!test) {
    return {
      isValid: false,
      errors: ['No test structure loaded.'],
      warnings: [],
      stats: {
        totalQuestions: 0,
        expectedQuestions: 40,
        byType: {},
        missingAnswers: 0,
        missingPrompts: 0,
        needsReviewCount: 0,
        hasAudio: false,
        hasPassage: false,
        passageLength: 0,
      },
    }
  }

  const errors: string[] = []
  const warnings: string[] = []
  const byType: Record<string, number> = {}
  let missingAnswers = 0
  let missingPrompts = 0
  let needsReviewCount = 0

  if (!test.title || test.title.trim().length === 0) {
    errors.push('Test title is required.')
  }

  if (!test.skill || !['reading', 'listening', 'writing', 'speaking', 'mock'].includes(test.skill)) {
    errors.push('Invalid test skill. Must be Reading or Listening.')
  }

  if (!test.sections || test.sections.length === 0) {
    errors.push('Test must contain at least one section.')
  }

  const allQuestions: ParsedQuestion[] = []
  const seenNumbers = new Set<number>()
  const duplicateNumbers = new Set<number>()

  let hasAudio = false
  let hasPassage = false
  let passageLength = 0

  test.sections?.forEach((sec, sIdx) => {
    if (sec.audio_url && sec.audio_url.trim()) hasAudio = true
    if (sec.passage_html && sec.passage_html.trim().length > 30) {
      hasPassage = true
      passageLength += sec.passage_html.trim().length
    }

    if (test.skill === 'reading' && (!sec.passage_html || sec.passage_html.trim().length < 30)) {
      warnings.push(`Section ${sIdx + 1} (${sec.title || 'Untitled'}): Passage text is empty.`)
    }

    if (test.skill === 'listening' && (!sec.audio_url || !sec.audio_url.trim())) {
      warnings.push(`Section ${sIdx + 1} (${sec.title || 'Untitled'}): Audio URL is missing. You can add one below.`)
    }

    sec.questions?.forEach((q) => {
      allQuestions.push(q)
      const qNum = q.question_number
      if (qNum) {
        if (seenNumbers.has(qNum)) {
          duplicateNumbers.add(qNum)
        }
        seenNumbers.add(qNum)
      }

      const type = q.question_type || 'unclassified'
      byType[type] = (byType[type] || 0) + 1

      if (!q.correct_answer || q.correct_answer.trim() === '') {
        missingAnswers++
      }

      if (!q.question_text || q.question_text.trim() === '') {
        missingPrompts++
        warnings.push(`Question #${qNum || '?'}: Empty prompt text.`)
        needsReviewCount++
      }

      if (q.question_type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        warnings.push(`Question #${qNum || '?'}: Multiple choice has fewer than 2 options.`)
        needsReviewCount++
      }
    })
  })

  if (duplicateNumbers.size > 0) {
    warnings.push(`Duplicate question numbers detected: ${Array.from(duplicateNumbers).join(', ')}. They will be automatically sequentialized when saving, or click "Auto-Fix Question Numbers".`)
  }

  const totalQuestions = allQuestions.length
  const expectedQuestions = test.sections.length === 1 ? (totalQuestions <= 14 ? totalQuestions : 13) : 40

  if (totalQuestions === 0) {
    errors.push('No questions detected in this test.')
  } else if (totalQuestions < expectedQuestions) {
    warnings.push(`Detected ${totalQuestions} questions (expected: ${expectedQuestions}).`)
    needsReviewCount += expectedQuestions - totalQuestions
  }

  if (missingAnswers > 0) {
    warnings.push(`${missingAnswers} question(s) have no answer key in HTML. Admin review recommended.`)
    needsReviewCount += missingAnswers
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalQuestions,
      expectedQuestions,
      byType,
      missingAnswers,
      missingPrompts,
      needsReviewCount,
      hasAudio,
      hasPassage,
      passageLength,
    },
  }
}

// ======================================================================
// 3. INTELLIGENT RESOLUTION & MERGE ENGINE (RULES 4, 5, 6, 7)
// ======================================================================

export interface ResolutionResult {
  finalTest: ParsedIeltsTest
  engine: 'gemini' | 'algorithmic' | 'gemini_merged'
  modelUsed: string
  mergeNotes: string[]
  needsReview: boolean
}

export function resolveExtraction(
  geminiResult: ParsedIeltsTest | null,
  algoResult: ParsedIeltsTest | null,
  modelName: string = 'Gemini-1.5-Pro'
): ResolutionResult {
  // If Gemini completely failed or returned 0 questions
  if (!geminiResult || !geminiResult.total_questions || geminiResult.total_questions === 0) {
    if (algoResult && algoResult.total_questions > 0) {
      return {
        finalTest: algoResult,
        engine: 'algorithmic',
        modelUsed: 'Algorithmic-Fallback',
        mergeNotes: ['Gemini AI returned 0 questions. Algorithmic fallback applied.'],
        needsReview: true,
      }
    }
    return {
      finalTest: (geminiResult || algoResult)!,
      engine: 'gemini',
      modelUsed: modelName,
      mergeNotes: ['No questions could be extracted.'],
      needsReview: true,
    }
  }

  const gCount = geminiResult.total_questions
  const isSinglePassage = geminiResult.sections.length === 1

  // RULE 4 & 5: Complete Gemini Extraction (>= 38 questions or >= 10 for single passage)
  if (gCount >= 38 || (isSinglePassage && gCount >= 10)) {
    const enrichedSections = JSON.parse(JSON.stringify(geminiResult.sections)) as ParsedSection[]
    const mergeNotes: string[] = [
      `Semantic extraction by Gemini AI (${gCount} questions).`,
    ]

    // Supplement passage HTML or audio URL if missed by Gemini
    if (algoResult) {
      enrichedSections.forEach((s, idx) => {
        const algoSec = algoResult.sections[idx]
        if (algoSec) {
          if ((!s.passage_html || s.passage_html.trim().length < 30) && algoSec.passage_html && algoSec.passage_html.length > 30) {
            s.passage_html = algoSec.passage_html
            mergeNotes.push(`Section ${idx + 1} passage HTML supplemented from source structure.`)
          }
          if ((!s.audio_url || !s.audio_url.trim()) && algoSec.audio_url) {
            s.audio_url = algoSec.audio_url
            mergeNotes.push(`Section ${idx + 1} audio URL supplemented from source structure.`)
          }
        }
      })
    }

    const finalTest: ParsedIeltsTest = {
      ...geminiResult,
      sections: enrichedSections,
      warnings: [...(geminiResult.warnings || []), ...mergeNotes],
    }

    return {
      finalTest,
      engine: 'gemini',
      modelUsed: modelName,
      mergeNotes,
      needsReview: gCount < 40 && !isSinglePassage,
    }
  }

  // RULE 6: Incomplete Gemini Extraction -> Safely merge missing question numbers from Algorithmic
  if (algoResult && algoResult.total_questions > gCount) {
    const mergedSections = JSON.parse(JSON.stringify(geminiResult.sections)) as ParsedSection[]
    const geminiNumbers = new Set<number>()
    geminiResult.sections.forEach((s) =>
      s.questions.forEach((q) => {
        if (q.question_number) geminiNumbers.add(q.question_number)
      })
    )

    const missingFromAlgo: ParsedQuestion[] = []
    algoResult.sections.forEach((s) => {
      s.questions.forEach((q) => {
        if (q.question_number && !geminiNumbers.has(q.question_number)) {
          missingFromAlgo.push(q)
        }
      })
    })

    if (missingFromAlgo.length > 0) {
      const mergeNotes: string[] = [
        `Gemini AI semantic extraction preserved (${gCount} questions).`,
        `Supplemented ${missingFromAlgo.length} missing questions (numbers: ${missingFromAlgo
          .map((q) => q.question_number)
          .join(', ')}) from algorithmic parser.`,
      ]

      missingFromAlgo.forEach((q) => {
        const qNum = q.question_number
        let targetSecIdx = 0
        if (mergedSections.length === 3) {
          targetSecIdx = qNum <= 13 ? 0 : qNum <= 26 ? 1 : 2
        } else if (mergedSections.length === 4) {
          targetSecIdx = qNum <= 10 ? 0 : qNum <= 20 ? 1 : qNum <= 30 ? 2 : 3
        } else {
          targetSecIdx = Math.min(mergedSections.length - 1, Math.floor((qNum - 1) / 13))
        }

        if (mergedSections[targetSecIdx]) {
          mergedSections[targetSecIdx].questions.push(q)
        }
      })

      let newTotalCount = 0
      mergedSections.forEach((s) => {
        s.questions.sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
        newTotalCount += s.questions.length
      })

      mergedSections.forEach((s, idx) => {
        const algoSec = algoResult.sections[idx]
        if (algoSec) {
          if ((!s.passage_html || s.passage_html.trim().length < 30) && algoSec.passage_html && algoSec.passage_html.length > 30) {
            s.passage_html = algoSec.passage_html
          }
          if ((!s.audio_url || !s.audio_url.trim()) && algoSec.audio_url) {
            s.audio_url = algoSec.audio_url
          }
        }
      })

      const mergedTest: ParsedIeltsTest = {
        ...geminiResult,
        sections: mergedSections,
        total_questions: newTotalCount,
        warnings: [...(geminiResult.warnings || []), ...mergeNotes],
      }

      return {
        finalTest: mergedTest,
        engine: 'gemini_merged',
        modelUsed: `${modelName} + Supplement`,
        mergeNotes,
        needsReview: true,
      }
    }
  }

  // RULE 7: Incomplete and cannot merge cleanly -> Keep Gemini and flag Needs Review
  return {
    finalTest: geminiResult,
    engine: 'gemini',
    modelUsed: modelName,
    mergeNotes: [`Extracted ${gCount} questions with Gemini AI. Incomplete content flagged for Admin Review.`],
    needsReview: true,
  }
}

// Built-in authentic test samples
export const REAL_SAMPLE_TESTS = [
  { name: 'Full Reading Test.html', url: '/Full-Reading-Test.html', title: 'IELTS Academic Reading (40 Qs)' },
  { name: 'day 12 Listening.html', url: '/day-12-Listening.html', title: 'IELTS Listening Day 12 (40 Qs)' },
  { name: 'Day 1 test 1 K005.html', url: '/Day-1-test-1-K005.html', title: 'IELTS Listening K005 (40 Qs)' },
  { name: 'Bondi_Beach.html', url: '/Bondi-Beach.html', title: 'IELTS Reading: Bondi Beach (13 Qs)' },
  { name: 'Lis Test 24.html', url: '/Lis-Test-24.html', title: 'IELTS Listening Practice Test 24 (40 Qs)' },
  { name: 'Test 25.html', url: '/sample-test.html', title: 'IELTS Listening Practice Test 25 (40 Qs)' },
]

// ======================================================================
// 4. MAIN COMPONENT (TWO-COLUMN STREAMLINED VIEW)
// ======================================================================

export function HtmlImportClientView() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Core Input State
  const [htmlInput, setHtmlInput] = useState('')
  const [fileName, setFileName] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parsingEngine, setParsingEngine] = useState<'gemini' | 'algorithmic' | 'gemini_merged'>('gemini')
  const [modelUsed, setModelUsed] = useState<string | null>(null)
  const [mergeNotes, setMergeNotes] = useState<string[]>([])
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false)

  // Parsed Result State
  const [parsedTest, setParsedTest] = useState<ParsedIeltsTest | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [isEditingPassage, setIsEditingPassage] = useState(false)
  const [savedTestId, setSavedTestId] = useState<string | null>(null)
  const [filterNeedsKeyOnly, setFilterNeedsKeyOnly] = useState(false)

  // File Upload (.html, .htm)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setSavedTestId(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || ''
      setHtmlInput(text)
      triggerParse(text, file.name, 'gemini')
    }
    reader.readAsText(file)
  }

  // Load Real Test Sample
  const handleLoadSample = async (sample: typeof REAL_SAMPLE_TESTS[0]) => {
    setSampleMenuOpen(false)
    try {
      const res = await fetch(sample.url)
      if (!res.ok) throw new Error('Sample file not found')
      const text = await res.text()
      setFileName(sample.name)
      setHtmlInput(text)
      setSavedTestId(null)
      triggerParse(text, sample.name, 'gemini')
    } catch (e: any) {
      alert('Failed to load sample: ' + e.message)
    }
  }

  // Parse HTML
  const triggerParse = async (content: string, customFileName?: string, mode: 'gemini' | 'algorithmic' = 'gemini') => {
    if (!content.trim()) return
    setIsParsing(true)
    setSavedTestId(null)
    const currentName = customFileName || fileName || 'IELTS Test.html'
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

    // 1. Direct Algorithmic Parse
    if (mode === 'algorithmic') {
      try {
        const algoResult = parseIeltsHtml(content)
        const v = validateParsedTest(algoResult)
        setParsedTest(algoResult)
        setValidation(v)
        setParsingEngine('algorithmic')
        setModelUsed('Rule-Engine')
        setMergeNotes(['Direct algorithmic extraction.'])
        setActiveSectionIdx(0)
      } catch (err: any) {
        alert('Algorithmic parse error: ' + err.message)
      } finally {
        setIsParsing(false)
      }
      return
    }

    // 2. Primary: Gemini Semantic AI Parser
    try {
      const res = await fetch('/api/admin/parse-html-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          html: content,
          fileName: currentName,
          mode: 'semantic_full',
        }),
      })

      let geminiResult: ParsedIeltsTest | null = null
      let modelUsedStr = 'Gemini-1.5-Pro'

      if (res.ok) {
        const json = await res.json()
        if (json.parsedTest) {
          geminiResult = json.parsedTest
          modelUsedStr = json.model_used || 'Gemini-1.5-Pro'
        }
      }

      // Also parse algorithmically as secondary reference for safe supplementation
      let algoResult: ParsedIeltsTest | null = null
      try {
        algoResult = parseIeltsHtml(content)
      } catch (algoErr) {
        console.warn('Algorithmic parse note:', algoErr)
      }

      const resolution = resolveExtraction(geminiResult, algoResult, modelUsedStr)
      const v = validateParsedTest(resolution.finalTest)

      setParsedTest(resolution.finalTest)
      setValidation(v)
      setParsingEngine(resolution.engine)
      setModelUsed(resolution.modelUsed)
      setMergeNotes(resolution.mergeNotes)
      setActiveSectionIdx(0)
    } catch (networkErr: any) {
      console.warn('AI call failed, using algorithmic fallback:', networkErr)
      try {
        const algoResult = parseIeltsHtml(content)
        const v = validateParsedTest(algoResult)
        setParsedTest(algoResult)
        setValidation(v)
        setParsingEngine('algorithmic')
        setModelUsed('Algorithmic-Fallback')
        setMergeNotes(['Gemini AI network error. Fallback parser applied.'])
        setActiveSectionIdx(0)
      } catch (err: any) {
        alert('Extraction failed: ' + err.message)
      }
    } finally {
      setIsParsing(false)
    }
  }

  // Auto-Fix Question Numbers (renumber sequentially 1..N across all sections)
  const handleAutoFixQuestionNumbers = () => {
    if (!parsedTest) return
    let currentNumber = 1
    const updatedSections = parsedTest.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        const fixedQ = { ...q, question_number: currentNumber }
        currentNumber++
        return fixedQ
      }),
    }))
    const updatedTest = { ...parsedTest, sections: updatedSections, total_questions: currentNumber - 1 }
    setParsedTest(updatedTest)
    setValidation(validateParsedTest(updatedTest))
  }

  // Save to Database
  const handleSaveToDatabase = async () => {
    if (!parsedTest) return
    setIsSaving(true)

    try {
      // Check for duplicate question numbers and auto-resolve
      const seenNums = new Set<number>()
      let hasDupes = false
      parsedTest.sections.forEach((s) =>
        s.questions.forEach((q) => {
          if (seenNums.has(q.question_number)) hasDupes = true
          seenNums.add(q.question_number)
        })
      )

      let runningNum = 1
      const allQuestions: any[] = []
      parsedTest.sections.forEach((sec, sIdx) => {
        sec.questions.forEach((q, qIdx) => {
          const finalNum = hasDupes ? runningNum++ : (q.question_number || runningNum++)
          allQuestions.push({
            section_index: sIdx,
            question_number: finalNum,
            question_type: q.question_type || 'sentence_completion',
            instruction: q.instruction || sec.instructions || '',
            question_text: q.question_text || `Question ${finalNum}`,
            options: q.options || [],
            correct_answer: q.correct_answer || '',
            accepted_answers: q.accepted_answers || (q.correct_answer ? [q.correct_answer] : []),
            points: q.points || 1,
            difficulty: q.difficulty || 'medium',
            explanation: q.explanation || '',
            image_url: q.image_url || undefined,
          })
        })
      })

      const payload = {
        test: {
          title: parsedTest.title.trim() || fileName.replace(/\.[^/.]+$/, '') || 'Imported IELTS Test',
          skill: parsedTest.skill,
          ielts_type: parsedTest.ielts_type || 'academic',
          access_type: 'free' as const,
          difficulty: parsedTest.difficulty || 'medium',
          time_limit_minutes: parsedTest.time_limit_minutes || (parsedTest.skill === 'listening' ? 40 : 60),
          description: parsedTest.description || `${parsedTest.title} (Imported via Semantic HTML Importer)`,
          status: 'draft' as const,
        },
        sections: parsedTest.sections.map((sec, sIdx) => ({
          title: sec.title || (parsedTest.skill === 'listening' ? `Section ${sIdx + 1}` : `Reading Passage ${sIdx + 1}`),
          order_number: sec.order_number || sIdx + 1,
          instructions: sec.instructions || '',
          passage_html: sec.passage_html || '',
          audio_url: sec.audio_url || '',
          time_limit_minutes: sec.time_limit_minutes || (parsedTest.skill === 'listening' ? 10 : 20),
        })),
        questions: allQuestions,
      }

      const res = await saveFullTestStructure(payload)

      try {
        await createImportRecord({
          source_type: 'manual',
          raw_text: htmlInput.slice(0, 50000),
          raw_json: {
            fileName: fileName || 'test.html',
            skill: parsedTest.skill,
            totalQuestions: allQuestions.length,
            engine: parsingEngine,
            modelUsed,
            savedTestId: res?.testId,
          },
        })
      } catch (auditErr) {
        console.warn('Import record creation note:', auditErr)
      }

      setSavedTestId(res?.testId || null)
    } catch (err: any) {
      alert('Save failed: ' + (err.message || 'Unknown database error'))
    } finally {
      setIsSaving(false)
    }
  }

  // Active section questions
  const currentSection = parsedTest?.sections[activeSectionIdx]
  const displayedQuestions = useMemo(() => {
    if (!currentSection) return []
    if (filterNeedsKeyOnly) {
      return currentSection.questions.filter((q) => !q.correct_answer || q.correct_answer.trim() === '')
    }
    return currentSection.questions
  }, [currentSection, filterNeedsKeyOnly])

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ---------------- Top Navbar ---------------- */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/import"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Import Center"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground tracking-tight">HTML Test Importer</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI Semantic Parser
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Converts authentic IELTS HTML into structured test data with verification and preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Real Test Samples Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileCode className="w-3.5 h-3.5 text-primary" />
                <span>Load Real Test...</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {sampleMenuOpen && (
                <div className="absolute right-0 mt-1 w-80 bg-card border border-border rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-1">
                  <div className="px-2 py-1 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                    Authentic IELTS HTML Tests
                  </div>
                  {REAL_SAMPLE_TESTS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => handleLoadSample(sample)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-start gap-2 cursor-pointer"
                    >
                      <FileCode className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-foreground text-xs">{sample.name}</div>
                        <div className="text-[10px] text-muted-foreground">{sample.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload HTML</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* ---------------- Main Two-Column Layout ---------------- */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: HTML Input & Parse Actions ================= */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-border rounded-2xl bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Source HTML
                </h3>
                {htmlInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setHtmlInput('')
                      setFileName('')
                      setParsedTest(null)
                      setValidation(null)
                      setSavedTestId(null)
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {fileName && (
                <div className="px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs flex items-center justify-between">
                  <span className="font-mono text-[11px] text-foreground truncate max-w-[260px]">
                    {fileName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {(htmlInput.length / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste raw IELTS HTML here, or upload a .html file above..."
                rows={16}
                className="w-full p-3 font-mono text-[11px] leading-relaxed rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-hidden resize-y"
              />

              {/* ================= PARSE BUTTONS (CLEAN, MINIMALIST, NO REDUNDANT ICONS) ================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Secondary Button: Algorithmic Parser */}
                <button
                  type="button"
                  onClick={() => triggerParse(htmlInput, undefined, 'algorithmic')}
                  disabled={!htmlInput.trim() || isParsing}
                  className="py-2.5 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Fast rule-based extraction fallback"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Algorithmic Parse</span>
                </button>

                {/* Primary Button: Gemini AI Semantic Parser */}
                <button
                  type="button"
                  onClick={() => triggerParse(htmlInput, undefined, 'gemini')}
                  disabled={!htmlInput.trim() || isParsing}
                  className="py-2.5 px-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  title="Semantic AI extraction of test structure, passages, questions and keys"
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Detect with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Parsed Review & Test Editor ================= */}
          <div className="lg:col-span-7">
            {isParsing ? (
              <div className="border border-border rounded-2xl bg-card p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-xs min-h-[460px]">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Gemini AI is Semantically Analyzing HTML</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Detecting skill, passages, question numbers, instructions, options, and answer keys...
                  </p>
                </div>
              </div>
            ) : parsedTest ? (
              <div className="space-y-4">
                {/* Header Information Box */}
                <div className="border border-border rounded-2xl bg-card p-5 space-y-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                        {parsedTest.skill}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border">
                        {parsedTest.ielts_type}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-muted text-foreground">
                        {parsedTest.total_questions} Questions
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1',
                          parsingEngine === 'gemini'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : parsingEngine === 'gemini_merged'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {parsingEngine === 'gemini'
                            ? 'Gemini Verified'
                            : parsingEngine === 'gemini_merged'
                            ? 'Gemini + Supplement'
                            : 'Algorithmic'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Test Title Editable */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Test Title
                    </label>
                    <input
                      type="text"
                      value={parsedTest.title}
                      onChange={(e) => {
                        const val = e.target.value
                        setParsedTest((prev) => (prev ? { ...prev, title: val } : null))
                      }}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background text-foreground outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Question Types Distribution */}
                  <div className="pt-2 border-t border-border flex flex-wrap gap-1.5">
                    {Object.entries(validation?.stats.byType || {}).map(([t, count]) => {
                      const meta = QT_MAP[t] || { label: t, badgeColor: 'bg-muted text-muted-foreground' }
                      return (
                        <span
                          key={t}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1',
                            meta.badgeColor
                          )}
                        >
                          <span>{meta.label}:</span>
                          <span className="font-bold">{count}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Audit & Merge Notes Notice */}
                {mergeNotes.length > 0 && (
                  <div className="border border-primary/20 rounded-xl bg-primary/5 p-3 space-y-1 text-xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span>Extraction Notes:</span>
                    </div>
                    <ul className="list-disc list-inside text-muted-foreground text-[11px] pl-1 space-y-0.5">
                      {mergeNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quality Warnings Banner if any */}
                {validation && validation.warnings.length > 0 && (
                  <div className="border border-amber-500/30 rounded-xl bg-amber-500/10 p-3 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Quality Warnings ({validation.warnings.length}):</span>
                      </div>
                      <span className="text-[10px] font-semibold">
                        Needs Review: {validation.stats.needsReviewCount}
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1 max-h-24 overflow-y-auto">
                      {validation.warnings.map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                    {validation.warnings.some((w) => /duplicate/i.test(w)) && (
                      <div className="pt-1.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleAutoFixQuestionNumbers}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Auto-Fix & Renumber Questions (1..{parsedTest?.total_questions || 40})</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Section Tabs Switcher */}
                <div className="border border-border rounded-2xl bg-card p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border flex-1 overflow-x-auto">
                      {parsedTest.sections.map((sec, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSectionIdx(idx)}
                          className={cn(
                            'py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer shrink-0',
                            activeSectionIdx === idx
                              ? 'bg-card text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>{parsedTest?.skill === 'listening' ? `Part ${idx + 1}` : `Passage ${idx + 1}`}</span>
                          <span className="text-[10px] ml-1 font-normal opacity-70">
                            ({sec.questions.length})
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFilterNeedsKeyOnly(!filterNeedsKeyOnly)}
                      className={cn(
                        'px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shrink-0',
                        filterNeedsKeyOnly
                          ? 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      Needs Key Only
                    </button>
                  </div>

                  {/* Active Section Content */}
                  {currentSection && (
                    <div className="space-y-4">
                      {/* Section Title & Instructions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Section Title
                          </label>
                          <input
                            type="text"
                            value={currentSection.title || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setParsedTest((prev) => {
                                if (!prev) return null
                                const nextSecs = [...prev.sections]
                                nextSecs[activeSectionIdx].title = val
                                return { ...prev, sections: nextSecs }
                              })
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Instructions
                          </label>
                          <input
                            type="text"
                            value={currentSection.instructions || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setParsedTest((prev) => {
                                if (!prev) return null
                                const nextSecs = [...prev.sections]
                                nextSecs[activeSectionIdx].instructions = val
                                return { ...prev, sections: nextSecs }
                              })
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Reading: Passage HTML Preview / Editor */}
                      {parsedTest.skill === 'reading' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Passage Text ({currentSection.passage_html?.length || 0} chars)
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsEditingPassage(!isEditingPassage)}
                              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                              <span>{isEditingPassage ? 'Preview Passage' : 'Edit Raw HTML'}</span>
                            </button>
                          </div>

                          {isEditingPassage ? (
                            <textarea
                              rows={8}
                              value={currentSection.passage_html || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setParsedTest((prev) => {
                                  if (!prev) return null
                                  const nextSecs = [...prev.sections]
                                  nextSecs[activeSectionIdx].passage_html = val
                                  return { ...prev, sections: nextSecs }
                                })
                              }}
                              className="w-full p-3 font-mono text-[11px] rounded-xl border border-border bg-background text-foreground outline-hidden resize-y"
                            />
                          ) : (
                            <div className="max-h-52 overflow-y-auto p-3.5 rounded-xl border border-border bg-muted/20 text-xs leading-relaxed prose dark:prose-invert max-w-none text-foreground">
                              {currentSection.passage_html ? (
                                <div dangerouslySetInnerHTML={{ __html: currentSection.passage_html }} />
                              ) : (
                                <div className="text-muted-foreground italic text-center py-4">
                                  No passage content in this section.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Listening: Audio URL & Built-in Player */}
                      {parsedTest.skill === 'listening' && (
                        <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/20">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Audio Track URL (MP3 / WAV)
                          </label>
                          <input
                            type="text"
                            value={currentSection.audio_url || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setParsedTest((prev) => {
                                if (!prev) return null
                                const nextSecs = [...prev.sections]
                                nextSecs[activeSectionIdx].audio_url = val
                                return { ...prev, sections: nextSecs }
                              })
                            }}
                            placeholder="e.g. /uploads/audio-part1.mp3 or https://..."
                            className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-border bg-background text-foreground outline-hidden"
                          />
                          {currentSection.audio_url && (
                            <audio controls src={currentSection.audio_url} className="w-full h-8 mt-2" />
                          )}
                        </div>
                      )}

                      {/* Questions List & Inline Key Editor */}
                      <div className="space-y-2.5 pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">
                            Questions ({displayedQuestions.length})
                          </span>
                          <span className="text-[11px]">Edit prompt text and correct answer key inline</span>
                        </div>

                        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                          {displayedQuestions.map((q, qLocalIdx) => {
                            const originalIdx = currentSection.questions.findIndex(
                              (orig) => orig.question_number === q.question_number
                            )
                            const targetIdx = originalIdx >= 0 ? originalIdx : qLocalIdx
                            const isMissingKey = !q.correct_answer || q.correct_answer.trim() === ''
                            const qtMeta = QT_MAP[q.question_type] || {
                              label: q.question_type,
                              badgeColor: 'bg-muted text-muted-foreground',
                            }

                            return (
                              <div
                                key={q.question_number || qLocalIdx}
                                className={cn(
                                  'border rounded-xl p-3 space-y-2 bg-background transition-all',
                                  isMissingKey
                                    ? 'border-amber-500/30 ring-1 ring-amber-500/10'
                                    : 'border-border'
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                                      {q.question_number}
                                    </span>
                                    <select
                                      value={q.question_type}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setParsedTest((prev) => {
                                          if (!prev) return null
                                          const nextSecs = [...prev.sections]
                                          nextSecs[activeSectionIdx].questions[targetIdx].question_type = val
                                          return { ...prev, sections: nextSecs }
                                        })
                                      }}
                                      className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-card text-foreground cursor-pointer outline-hidden"
                                    >
                                      {CANONICAL_QUESTION_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                          {t.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                                      Key:
                                    </label>
                                    <input
                                      type="text"
                                      value={q.correct_answer || ''}
                                      placeholder="answer"
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setParsedTest((prev) => {
                                          if (!prev) return null
                                          const nextSecs = [...prev.sections]
                                          nextSecs[activeSectionIdx].questions[targetIdx].correct_answer = val
                                          return { ...prev, sections: nextSecs }
                                        })
                                      }}
                                      className={cn(
                                        'w-28 px-2 py-1 text-xs font-mono font-bold rounded-lg border text-center outline-hidden',
                                        isMissingKey
                                          ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                                          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                                      )}
                                    />
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  value={q.question_text || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setParsedTest((prev) => {
                                      if (!prev) return null
                                      const nextSecs = [...prev.sections]
                                      nextSecs[activeSectionIdx].questions[targetIdx].question_text = val
                                      return { ...prev, sections: nextSecs }
                                    })
                                  }}
                                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-card text-foreground outline-hidden focus:border-primary"
                                />

                                {/* Multiple choice options */}
                                {q.question_type === 'multiple_choice' && q.options && q.options.length > 0 && (
                                  <div className="pl-2 pt-1 border-l-2 border-primary/20 space-y-1">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2 text-xs">
                                        <span
                                          className={cn(
                                            'w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0',
                                            q.correct_answer?.trim().toUpperCase() === opt.option_key.toUpperCase()
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-muted text-muted-foreground'
                                          )}
                                        >
                                          {opt.option_key}
                                        </span>
                                        <input
                                          type="text"
                                          value={opt.option_text}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setParsedTest((prev) => {
                                              if (!prev) return null
                                              const nextSecs = [...prev.sections]
                                              nextSecs[activeSectionIdx].questions[targetIdx].options[oIdx].option_text = val
                                              return { ...prev, sections: nextSecs }
                                            })
                                          }}
                                          className="w-full px-2 py-0.5 text-xs rounded border border-border bg-card text-foreground outline-hidden"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save to Database Button */}
                  <div className="pt-2">
                    {savedTestId ? (
                      <div className="space-y-2.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-in fade-in-50">
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Test & Questions Successfully Saved to Database!</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          All passages, sections, audio settings, and questions are now accessible in Test Management.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <Link
                            to={`/admin/tests/${savedTestId}/edit`}
                            className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs"
                          >
                            <span>Open in Test Builder →</span>
                          </Link>
                          <Link
                            to="/admin/tests"
                            className="py-2.5 px-4 rounded-xl bg-card border border-border text-foreground font-bold text-xs hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-2xs"
                          >
                            <span>View in Tests Management</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveToDatabase}
                        disabled={isSaving || (validation && !validation.isValid)}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Creating & Saving Test...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Save to Database</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[460px] bg-card/40">
                <FileCode className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-xs font-bold text-foreground">No HTML Parsed Yet</p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                  Upload an IELTS HTML file or select a real sample test from the top bar to preview and verify.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HtmlImportClientView
