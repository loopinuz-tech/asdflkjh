import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Test } from '@/lib/test-engine/types'
import { useTestSession } from '@/lib/test-engine/hooks'
import { useTestLoader } from '@/lib/test-engine/use-test-loader'
import { TestHeader } from '@/components/tests/test-header'
import { PassageView } from '@/components/tests/passage-view'
import { QuestionRenderer, QuestionHtmlContent } from '@/components/tests/question-renderer'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Bookmark, CheckCircle2, LayoutGrid, FileText, HelpCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useQuestionHighlighter,
  QuestionFloatingMenu,
} from '@/components/tests/question-highlighter'
import { AIDictionaryModal } from '@/components/tests/ai-dictionary-modal'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { SEOHead } from '@/components/seo/SEOHead'

// Default export — self-contained page that loads its own data
export default function ReadingTestPage() {
  const { test, attemptId, initialAnswers, initialMarked, loading, error } = useTestLoader('reading')
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading test...</p>
      </div>
    </div>
  )
  if (error || !test || !attemptId) return (
    <div className="h-screen flex items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">Test not found</h1>
      <p className="text-muted-foreground">{error || 'The requested practice test could not be loaded.'}</p>
    </div>
  )
  return (
    <>
      <SEOHead
        title={test.title || 'IELTS Reading Mock Test'}
        description={test.description || "Authentic IELTS Reading mock test: all passages, interactive questions, and instant score evaluation."}
        canonicalUrl={`/reading/${test.slug || test.id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          "name": test.title,
          "description": test.description,
          "educationalLevel": "advanced",
          "learningResourceType": "Practice Test"
        }}
      />
      <ReadingClientPage 
        test={test} 
        attemptId={attemptId} 
        initialAnswers={initialAnswers}
        initialMarked={initialMarked}
      />
    </>
  )
}

export function ReadingClientPage({ 
  test, 
  attemptId,
  initialAnswers = {},
  initialMarked = []
}: { 
  test: Test; 
  attemptId: string;
  initialAnswers?: Record<string, any>;
  initialMarked?: string[];
}) {
  const session = useTestSession(test, attemptId, initialAnswers, initialMarked)
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileTab, setMobileTab] = useState<'passage' | 'questions'>('questions')
  const [isOverviewOpen, setIsOverviewOpen] = useState(false)
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const questionsContainerRef = useRef<HTMLDivElement>(null)
  const initialSyncDoneRef = useRef(false)
  const lastNavigatedQNumRef = useRef<number | null>(null)

  // AI Dictionary modal state for Questions
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLookupData, setAiLookupData] = useState<any | null>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const handleTriggerAILookup = async (selectedText: string) => {
    const cleanText = selectedText.trim()
    if (!cleanText) return
    if (!isPremiumUser) {
      setShowPremiumModal(true)
      return
    }

    setAiModalOpen(true)
    setAiLoading(true)
    setAiError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch('/api/vocabulary/ai-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          word: cleanText,
          context: cleanText,
          passageTitle: session.currentSection?.title || test.title
        })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        if (res.status === 403) {
          setIsPremiumUser(false)
          setAiModalOpen(false)
          setShowPremiumModal(true)
          return
        }
        throw new Error(errJson.error || 'Error analyzing vocabulary term with AI')
      }

      const json = await res.json()
      setAiLookupData(json.data)
    } catch (err: any) {
      setAiError(err.message || 'Failed to load translation')
    } finally {
      setAiLoading(false)
    }
  }

  const questionHighlighter = useQuestionHighlighter({
    containerRef: questionsContainerRef,
    sectionIndex: session.currentSectionIndex,
    isPremiumUser,
    onTriggerAILookup: handleTriggerAILookup,
  })

  // Load user subscription status
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
    if (!token) return
    fetch('/api/subscriptions/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d?.is_premium) {
          setIsPremiumUser(true)
        }
      })
      .catch(() => {})
  }, [])

  // Map of question_number -> { question, sectionIndex }
  const questionNumberMap = useMemo(() => {
    const map = new Map<number, { question: any; sectionIndex: number }>()
    test.sections.forEach((sec, sIdx) => {
      sec.groups.forEach(g => {
        g.questions.forEach(q => {
          map.set(Number(q.question_number), { question: q, sectionIndex: sIdx })
        })
      })
    })
    return map
  }, [test])

  // Smooth scroll helper for questions pane ONLY — never window
  const scrollToQuestion = useCallback((questionId: string) => {
    const el = document.getElementById(`question-${questionId}`)
    const container = questionsContainerRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 24
      container.scrollTo({ top: scrollOffset, behavior: 'smooth' })
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 1500)
    }
  }, [])

  // Sync with URL search params ?q=X
  const qParam = searchParams.get('q')
  const currentActiveQNum = qParam ? parseInt(qParam, 10) : 1

  useEffect(() => {
    if (qParam) {
      const qNum = parseInt(qParam, 10)
      if (!isNaN(qNum)) {
        if (lastNavigatedQNumRef.current === qNum) {
          // Already on this question, do NOT re-scroll or jump
          return
        }
        lastNavigatedQNumRef.current = qNum
        const item = questionNumberMap.get(qNum)
        if (item) {
          if (session.currentSectionIndex !== item.sectionIndex) {
            session.setCurrentSectionIndex(item.sectionIndex)
          }
          const timer = setTimeout(() => scrollToQuestion(item.question.id), 120)
          return () => clearTimeout(timer)
        }
      }
    } else if (!initialSyncDoneRef.current) {
      initialSyncDoneRef.current = true
      const firstQ = test.sections[0]?.groups[0]?.questions[0]?.question_number || 1
      lastNavigatedQNumRef.current = Number(firstQ)
      setSearchParams({ q: String(firstQ) }, { replace: true })
    }
  }, [qParam, questionNumberMap, session.currentSectionIndex, session.setCurrentSectionIndex, scrollToQuestion, setSearchParams])

  // Helper to switch section and sync URL
  const handleSelectSection = (targetIdx: number) => {
    session.setCurrentSectionIndex(targetIdx)
    const targetSec = test.sections[targetIdx]
    const firstQ = targetSec?.groups[0]?.questions[0]?.question_number
    if (firstQ) {
      const qNum = Number(firstQ)
      lastNavigatedQNumRef.current = qNum
      setSearchParams({ q: String(qNum) }, { replace: true })
      setTimeout(() => {
        const item = questionNumberMap.get(qNum)
        if (item) scrollToQuestion(item.question.id)
      }, 100)
    }
  }

  // Helper when clicking a question from the palette or overview modal
  const handleSelectQuestion = (q: any, targetSectionIdx?: number) => {
    if (targetSectionIdx !== undefined && targetSectionIdx !== session.currentSectionIndex) {
      session.setCurrentSectionIndex(targetSectionIdx)
    }
    const qNum = Number(q.question_number)
    lastNavigatedQNumRef.current = qNum
    setSearchParams({ q: String(qNum) }, { replace: true })
    setTimeout(() => scrollToQuestion(q.id), 80)
  }

  // Helper when user interacts with or answers a question inline
  const handleAnswerQuestion = (q: any, val: any) => {
    const qNum = Number(q.question_number)
    lastNavigatedQNumRef.current = qNum
    if (currentActiveQNum !== qNum) {
      setSearchParams({ q: String(qNum) }, { replace: true })
    }
    session.handleAnswerChange(q.id, val)
  }

  const handleQuestionCardClick = (q: any) => {
    const qNum = Number(q.question_number)
    if (currentActiveQNum !== qNum) {
      lastNavigatedQNumRef.current = qNum
      setSearchParams({ q: String(qNum) }, { replace: true })
    }
  }

  // Ensure currentSection exists
  if (!session.currentSection) return null

  // Flatten questions for current section
  const currentSectionQuestions = session.currentSection.groups.flatMap(g => g.questions)
  const currentSectionAnsweredCount = currentSectionQuestions.filter(
    q => session.answers[q.id] !== undefined && session.answers[q.id] !== ''
  ).length

  // Get current passage
  const currentPassage = session.currentSection.groups.find(g => g.passage)?.passage

  return (
    <div className="fixed inset-0 h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-slate-100/60 dark:bg-zinc-950">
      {/* Top Test Header */}
      <TestHeader 
        test={test} 
        session={session} 
        onNavigateToQuestion={(qNum) => {
          const item = questionNumberMap.get(qNum)
          if (item) {
            handleSelectQuestion(item.question, item.sectionIndex)
          }
        }}
      />

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="lg:hidden flex border-b border-border bg-card px-4 py-2 gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant={mobileTab === 'passage' ? 'default' : 'outline'}
          className="flex-1 text-xs"
          onClick={() => setMobileTab('passage')}
        >
          <FileText className="w-3.5 h-3.5 mr-1.5" /> Passage
        </Button>
        <Button
          size="sm"
          variant={mobileTab === 'questions' ? 'default' : 'outline'}
          className="flex-1 text-xs"
          onClick={() => setMobileTab('questions')}
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Questions ({currentSectionAnsweredCount}/{currentSectionQuestions.length})
        </Button>
      </div>

      {/* Main 50/50 Workspace */}
      <main className="flex-1 min-h-0 px-1 sm:px-4 py-1 sm:py-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 h-full min-h-0 overflow-hidden">
          
          {/* Left Pane: Reading Passage */}
          <div className={cn(
            "h-full min-h-0 w-full min-w-0 max-w-full overflow-hidden flex flex-col",
            mobileTab === 'passage' ? "flex" : "hidden lg:flex"
          )}>
            {currentPassage ? (
              <PassageView passage={currentPassage} isPremium={isPremiumUser} />
            ) : (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                <FileText className="w-10 h-10 mb-3 text-muted-foreground/40" />
                <p className="font-medium text-foreground">No passage provided for this section.</p>
                <p className="text-xs text-muted-foreground mt-1">Check the questions panel on the right.</p>
              </div>
            )}
          </div>

          {/* Right Pane: Questions List */}
          <div className={cn(
            "h-full min-h-0 w-full min-w-0 max-w-full flex flex-col bg-card border border-border rounded-2xl fox-shadow-sm overflow-hidden",
            mobileTab === 'questions' ? "flex" : "hidden lg:flex"
          )}>
            {/* Header of Questions Area */}
            <div className="px-3 py-2.5 sm:px-5 sm:py-3.5 border-b border-border bg-secondary/30 flex items-center justify-between flex-shrink-0 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <span className="px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black rounded shrink-0">
                  Part {session.currentSectionIndex + 1}
                </span>
                <h3 className="font-bold text-foreground text-xs sm:text-sm md:text-base truncate">
                  {session.currentSection.title || `Questions 1–${currentSectionQuestions.length}`}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground flex-shrink-0">
                <span className="hidden sm:inline">Progress:</span>
                <span className="font-bold text-foreground bg-background px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-border text-[11px] sm:text-xs">
                  {currentSectionAnsweredCount} / {currentSectionQuestions.length} answered
                </span>
              </div>
            </div>

            {/* Scrollable Questions Area */}
            <div
              ref={questionsContainerRef}
              onMouseUp={questionHighlighter.handleMouseUp}
              onContextMenu={questionHighlighter.handleContextMenu}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 sm:px-6 md:px-7 py-3 sm:py-6 space-y-4 sm:space-y-8 custom-scrollbar select-text"
            >
              {session.currentSection.groups.map(group => (
                <div key={group.id} className="space-y-3 sm:space-y-4">
                  {/* Group Instruction Banner */}
                  {(group.title || group.instruction) && (
                    <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/70 select-text">
                      {group.title && (
                        <QuestionHtmlContent
                          as="h4"
                          className="font-bold text-sm md:text-base text-foreground mb-1 select-text"
                          html={sanitizeHtml(group.title)}
                        />
                      )}
                      {group.instruction && (
                        <QuestionHtmlContent
                          as="p"
                          className="text-xs md:text-sm text-muted-foreground leading-relaxed italic select-text"
                          html={sanitizeHtml(group.instruction)}
                        />
                      )}
                    </div>
                  )}

                  {/* Questions */}
                  <div className="space-y-4">
                    {group.questions.map(question => {
                      const qResult = session.submissionResult?.questionResults?.[question.id]
                      const hasUserAns = session.answers[question.id] !== undefined && session.answers[question.id] !== ''
                      const isCorrect = qResult 
                        ? qResult.isCorrect 
                        : (hasUserAns && question.correct_answer && String(session.answers[question.id]).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase())

                      return (
                        <div
                          key={question.id}
                          onClickCapture={() => handleQuestionCardClick(question)}
                          onFocusCapture={() => handleQuestionCardClick(question)}
                        >
                          <QuestionRenderer
                            question={question}
                            answer={session.answers[question.id]}
                            isMarked={session.markedQuestions.has(question.id)}
                            disabled={session.isSubmitted}
                            scoreResult={session.isSubmitted ? {
                              isCorrect: !!isCorrect,
                              score: isCorrect ? (question.points || 1) : 0
                            } : undefined}
                            showExplanation={session.isSubmitted}
                            onChange={(val) => handleAnswerQuestion(question, val)}
                            onToggleMark={() => session.handleToggleMark(question.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Full-Width Dock: CD-IELTS Question Palette & Navigation */}
      <footer className="h-16 bg-card border-t border-border px-3 md:px-6 flex items-center justify-between z-30 flex-shrink-0 gap-3">
        
        {/* Left: Section / Passage Selector Tabs */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {test.sections.map((section, idx) => {
            const isCurrent = session.currentSectionIndex === idx
            const secQuestions = section.groups.flatMap(g => g.questions)
            const firstNum = secQuestions[0]?.question_number
            const lastNum = secQuestions[secQuestions.length - 1]?.question_number

            return (
              <button
                key={section.id}
                onClick={() => handleSelectSection(idx)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer",
                  isCurrent
                    ? "bg-primary text-black border-primary shadow-xs"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                )}
              >
                <span>Part {idx + 1}</span>
                {firstNum && lastNum && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded font-mono hidden sm:inline",
                    isCurrent ? "bg-black/10 text-black" : "bg-secondary text-muted-foreground"
                  )}>
                    Q{firstNum}–{lastNum}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Center: CD-IELTS Interactive Question Palette */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center justify-center gap-1 overflow-x-auto py-1 px-2 custom-scrollbar">
          {currentSectionQuestions.map(q => {
            const qResult = session.submissionResult?.questionResults?.[q.id]
            const isAnswered = session.answers[q.id] !== undefined && session.answers[q.id] !== ''
            const isCorrect = qResult 
              ? qResult.isCorrect 
              : (isAnswered && q.correct_answer && String(session.answers[q.id]).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase())
            const isMarked = session.markedQuestions.has(q.id)
            const isCurrentActive = q.question_number === currentActiveQNum

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelectQuestion(q, session.currentSectionIndex)}
                title={`Question ${q.question_number} ${session.isSubmitted ? (isCorrect ? '(Correct)' : isAnswered ? '(Incorrect)' : '(Unanswered)') : (isAnswered ? '(Answered)' : '(Unanswered)')}${isMarked ? ' - Marked for review' : ''}`}
                className={cn(
                  "relative flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center border cursor-pointer",
                  isCurrentActive && "ring-2 ring-primary ring-offset-2 scale-105 shadow-md",
                  session.isSubmitted
                    ? isCorrect
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs hover:bg-emerald-700"
                      : isAnswered
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs hover:bg-rose-700"
                        : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground"
                    : isAnswered
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs"
                      : "bg-background text-foreground border-border hover:border-black dark:hover:border-white hover:bg-secondary",
                  !session.isSubmitted && isMarked && "ring-2 ring-fox-red ring-offset-1"
                )}
              >
                {q.question_number}
                {session.isSubmitted ? (
                  isCorrect ? (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-black" />
                  ) : isAnswered ? (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-black" />
                  ) : null
                ) : (
                  isMarked && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-fox-red rounded-full border border-white dark:border-black" />
                  )
                )}
              </button>
            )
          })}
        </div>

        {/* Right: Section Navigation & Full Overview Dialog */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Full Test Overview Modal — custom fixed overlay */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOverviewOpen(true)}
            className="hidden sm:flex text-xs items-center gap-1.5 h-9"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Questions</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-secondary text-[10px] font-bold">
              {session.answeredCount}/{session.totalQuestions}
            </span>
          </Button>

          {/* ===== QUESTION NAVIGATOR MODAL ===== */}
          {isOverviewOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setIsOverviewOpen(false) }}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOverviewOpen(false)} />

              {/* Modal panel */}
              <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-[94vw] sm:w-full max-w-lg sm:max-w-xl md:max-w-2xl animate-in zoom-in-95 fade-in duration-200">

                {/* Modal Header */}
                <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-border">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-foreground">Question Navigator Overview</h2>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      {session.answeredCount} of {session.totalQuestions} answered
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:block w-28 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${session.totalQuestions > 0 ? (session.answeredCount / session.totalQuestions) * 100 : 0}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOverviewOpen(false)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sections & Questions */}
                <div className="px-3.5 sm:px-5 py-3 sm:py-4 space-y-4 sm:space-y-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
                  {test.sections.map((sec, sIdx) => {
                    const secQs = sec.groups.flatMap(g => g.questions)
                    const secAnswered = secQs.filter(q => session.answers[q.id] !== undefined && session.answers[q.id] !== '').length
                    return (
                      <div key={sec.id} className="space-y-2 sm:space-y-2.5">
                        {/* Section label */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Part {sIdx + 1}: {sec.title || 'Reading'}
                          </span>
                          <span className={cn(
                            "text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full",
                            secAnswered === secQs.length
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-secondary text-muted-foreground"
                          )}>
                            {secAnswered} / {secQs.length}
                          </span>
                        </div>

                        {/* Question grid */}
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                          {secQs.map(q => {
                            const qResult = session.submissionResult?.questionResults?.[q.id]
                            const isAnswered = session.answers[q.id] !== undefined && session.answers[q.id] !== ''
                            const isCorrect = qResult 
                              ? qResult.isCorrect 
                              : (isAnswered && q.correct_answer && String(session.answers[q.id]).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase())
                            const isMarked = session.markedQuestions.has(q.id)
                            const isCurrentActive = q.question_number === currentActiveQNum

                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => {
                                  setIsOverviewOpen(false)
                                  handleSelectQuestion(q, sIdx)
                                }}
                                className={cn(
                                  "relative h-8 sm:h-9 w-full rounded-lg text-xs font-bold flex items-center justify-center border transition-all hover:scale-105 cursor-pointer",
                                  isCurrentActive && "ring-2 ring-primary ring-offset-2 scale-105 shadow-md",
                                  session.isSubmitted
                                    ? isCorrect
                                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                      : isAnswered
                                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                        : "bg-secondary text-muted-foreground border-border"
                                    : isAnswered
                                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm"
                                      : "bg-background text-foreground border-border hover:bg-secondary",
                                  !session.isSubmitted && isMarked && "ring-2 ring-fox-red ring-offset-1"
                                )}
                              >
                                {q.question_number}
                                {!session.isSubmitted && isMarked && (
                                  <Bookmark className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-fox-red fill-fox-red" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legend footer */}
                <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-border bg-secondary/20 rounded-b-2xl flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-muted-foreground">
                  {session.isSubmitted ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Correct</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">✕</div>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">Incorrect</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md border border-border bg-secondary text-muted-foreground flex items-center justify-center text-[10px]">-</div>
                        <span>Unanswered</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md bg-black dark:bg-white" />
                        <span>Answered</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md border-2 border-border bg-background" />
                        <span>Unanswered</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-4 h-4">
                          <div className="w-4 h-4 rounded-md border-2 border-border bg-background" />
                          <Bookmark className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-fox-red fill-fox-red" />
                        </div>
                        <span>Marked</span>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOverviewOpen(false)}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Previous Section Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSelectSection(session.currentSectionIndex - 1)} 
            disabled={session.isFirstSection}
            className="h-9 px-3 text-xs"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {/* Next Section Button */}
          <Button 
            size="sm"
            onClick={() => handleSelectSection(session.currentSectionIndex + 1)} 
            disabled={session.isLastSection}
            className={cn(
              "h-9 px-3 text-xs bg-primary text-black hover:bg-primary/90 font-bold",
              session.isLastSection ? "opacity-50 pointer-events-none" : ""
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

      </footer>

      {/* Floating Action Toolbar on Question Selection */}
      {questionHighlighter.floatingMenu && (
        <QuestionFloatingMenu
          floatingMenu={questionHighlighter.floatingMenu}
          isPremiumUser={isPremiumUser}
          onApplyHighlight={questionHighlighter.applyHighlight}
          onClearHighlights={questionHighlighter.clearSelectionHighlights}
          onTriggerAILookup={handleTriggerAILookup}
          onClose={() => {
            window.getSelection()?.removeAllRanges()
            questionHighlighter.setFloatingMenu(null)
          }}
        />
      )}

      {/* AI Contextual Dictionary Modal for Questions */}
      <AIDictionaryModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        loading={aiLoading}
        error={aiError}
        data={aiLookupData}
        onRetry={() => {
          if (aiLookupData?.word) handleTriggerAILookup(aiLookupData.word)
          else setAiModalOpen(false)
        }}
        isPremiumUser={isPremiumUser}
        showPremiumModal={showPremiumModal}
        setShowPremiumModal={setShowPremiumModal}
      />
    </div>
  )
}
