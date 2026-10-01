import { useState, useRef, useEffect } from 'react'
import { Test } from '@/lib/test-engine/types'
import { useTestSession } from '@/lib/test-engine/hooks'
import { useTestLoader } from '@/lib/test-engine/use-test-loader'
import { TestHeader } from '@/components/tests/test-header'
import { AudioPlayer } from '@/components/tests/audio-player'
import { QuestionRenderer } from '@/components/tests/question-renderer'
import { CDIELTSListeningDocument } from '@/components/tests/cd-ielts-listening-document'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  LayoutGrid, 
  HelpCircle, 
  Highlighter, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useQuestionHighlighter,
  QuestionFloatingMenu,
  popHighlightUndo,
} from '@/components/tests/question-highlighter'
import { AIDictionaryModal } from '@/components/tests/ai-dictionary-modal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SEOHead } from '@/components/seo/SEOHead'

export default function ListeningTestPage() {
  const { test, attemptId, initialAnswers, initialMarked, loading, error } = useTestLoader('listening')
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading listening test...</p>
      </div>
    </div>
  )
  if (error || !test || !attemptId) return (
    <div className="h-screen flex items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">Test not found</h1>
      <p className="text-muted-foreground">{error || 'Could not load test.'}</p>
    </div>
  )
  return (
    <>
      <SEOHead
        title={test.title || 'IELTS Listening Practice Test'}
        description={test.description || "Authentic IELTS Listening mock test: 4 sections, official audio tracks, maps, and interactive questions."}
        canonicalUrl={`/listening/${test.slug || test.id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          "name": test.title,
          "description": test.description,
          "educationalLevel": "advanced",
          "learningResourceType": "Practice Test"
        }}
      />
      <ListeningClientPage 
        test={test} 
        attemptId={attemptId} 
        initialAnswers={initialAnswers}
        initialMarked={initialMarked}
      />
    </>
  )
}

export function ListeningClientPage({ 
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
  const [isOverviewOpen, setIsOverviewOpen] = useState(false)
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  // AI Dictionary modal state
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLookupData, setAiLookupData] = useState<any | null>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const questionsContainerRef = useRef<HTMLDivElement>(null)

  // Load user subscription status
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
    if (!token) return
    fetch('/api/subscriptions/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d?.is_premium) setIsPremiumUser(true)
      })
      .catch(() => {})
  }, [])

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
        throw new Error(errJson.error || "Failed to analyze vocabulary with AI")
      }

      const json = await res.json()
      setAiLookupData(json.data)
    } catch (err: any) {
      setAiError(err.message || 'Failed to load translation')
    } finally {
      setAiLoading(false)
    }
  }

  // Question highlighter hook
  const questionHighlighter = useQuestionHighlighter({
    containerRef: questionsContainerRef,
    sectionIndex: session.currentSectionIndex,
    isPremiumUser,
    onTriggerAILookup: handleTriggerAILookup,
  })

  const handleUndoHighlight = () => {
    popHighlightUndo()
  }

  if (!session.currentSection) return null

  // Flatten questions for current section
  const currentSectionQuestions = session.currentSection.groups.flatMap(g => g.questions)
  const currentSectionAnsweredCount = currentSectionQuestions.filter(
    q => session.answers[q.id] !== undefined && session.answers[q.id] !== ''
  ).length

  // Find audio for current section (or shared test audio)
  const currentAudio = session.currentSection.groups.find(g => g.media)?.media || 
                       (session.currentSection as any).media || 
                       (session.currentSection as any).audio ||
                       test.sections.flatMap(s => s.groups).find(g => g.media)?.media

  // Smooth scroll helper for bottom navigator
  const scrollToQuestion = (questionId: string) => {
    const el = document.getElementById(`question-${questionId}`)
    const container = questionsContainerRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 40
      container.scrollTo({ top: scrollOffset, behavior: 'smooth' })
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 1500)
      const input = (el.tagName === 'INPUT' ? el : el.querySelector('input')) as HTMLInputElement | null
      input?.focus()
    }
  }

  return (
    <div className="fixed inset-0 h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-slate-100/70 dark:bg-zinc-950">
      {/* 1. Top Header */}
      <TestHeader test={test} session={session} />

      {/* 2. Sleek Sticky Audio & Controls Bar */}
      <div className="bg-card border-b border-border px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20 shadow-2xs flex-shrink-0">
        
        {/* Part Badge & Info */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black rounded-lg shadow-2xs">
            Part {session.currentSectionIndex + 1}
          </span>
          <span className="hidden md:inline text-xs font-semibold text-foreground truncate max-w-xs">
            {session.currentSection.title || `Part ${session.currentSectionIndex + 1}`}
          </span>
        </div>

        {/* Audio Player (Compact horizontal slider) */}
        <div className="flex-1 min-w-[260px] max-w-xl mx-auto order-last sm:order-none w-full sm:w-auto">
          {currentAudio ? (
            <AudioPlayer key={currentAudio.file_path || currentAudio.id} audio={currentAudio} compact />
          ) : (
            <div className="text-xs text-muted-foreground italic text-center py-1 bg-secondary/50 rounded-lg">
              No audio recording available
            </div>
          )}
        </div>

        {/* Right Action Tools: Instructions Dialog + Highlighter Info + Progress */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsInstructionsOpen(true)}
            className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Instructions</span>
          </Button>

          <Dialog open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Info className="w-5 h-5 text-primary" />
                  <span>Part {session.currentSectionIndex + 1} Instructions</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm text-foreground">
                <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Section Task</p>
                  <p className="leading-relaxed">
                    {session.currentSection.instructions || 'Listen to the audio recording carefully and answer questions 1–10. In the test you will hear the recording once only.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> CD-IELTS Listening Tips:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800 dark:text-amber-300">
                    <li>Select any text to highlight key keywords with 5 colors.</li>
                    <li>You can jump between questions anytime using the bottom navigator dock.</li>
                    <li>Flag questions for review using the bookmark button.</li>
                    <li>Check spelling and word counts strictly according to instructions.</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Undo Highlight Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndoHighlight}
            title="Undo last text highlight"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span className="hidden lg:inline">Undo</span>
          </Button>

          {/* Progress Counter */}
          <div className="flex items-center text-xs font-semibold px-2.5 py-1 bg-secondary rounded-lg border border-border">
            <span>{currentSectionAnsweredCount} / {currentSectionQuestions.length}</span>
          </div>

        </div>
      </div>

      {/* 3. Main Full-Width Questions Workspace (Spacious, Scrollable, and Selectable) */}
      <main className="flex-1 min-h-0 overflow-hidden relative flex flex-col bg-slate-100/70 dark:bg-zinc-950">
        <div
          ref={questionsContainerRef}
          onMouseUp={questionHighlighter.handleMouseUp}
          onContextMenu={questionHighlighter.handleContextMenu}
          className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 md:px-10 py-6 select-text custom-scrollbar"
        >
          <CDIELTSListeningDocument
            test={test}
            section={session.currentSection}
            sectionIndex={session.currentSectionIndex}
            session={session}
          />
        </div>
      </main>

      {/* 4. Bottom CD-IELTS Dock */}
      <footer className="h-16 bg-card border-t border-border px-3 md:px-6 flex items-center justify-between z-30 flex-shrink-0 gap-3">
        
        {/* Left: Section Selector Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar max-w-[45%] xs:max-w-[50%] sm:max-w-none flex-shrink-0">
          {test.sections.map((section, idx) => {
            const isCurrent = session.currentSectionIndex === idx
            const secQuestions = section.groups.flatMap(g => g.questions)
            const firstNum = secQuestions[0]?.question_number
            const lastNum = secQuestions[secQuestions.length - 1]?.question_number

            return (
              <button
                key={section.id}
                onClick={() => session.setCurrentSectionIndex(idx)}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 border cursor-pointer shrink-0",
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

        {/* Center: CD-IELTS Question Palette */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center justify-center gap-1 overflow-x-auto py-1 px-2 custom-scrollbar">
          {currentSectionQuestions.map(q => {
            const qResult = session.submissionResult?.questionResults?.[q.id]
            const isAnswered = session.answers[q.id] !== undefined && session.answers[q.id] !== ''
            const isCorrect = qResult 
              ? qResult.isCorrect 
              : (isAnswered && q.correct_answer && String(session.answers[q.id]).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase())
            const isMarked = session.markedQuestions.has(q.id)

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => scrollToQuestion(q.id)}
                title={`Question ${q.question_number} ${session.isSubmitted ? (isCorrect ? '(Correct)' : isAnswered ? '(Incorrect)' : '(Unanswered)') : (isAnswered ? '(Answered)' : '(Unanswered)')}${isMarked ? ' - Marked for review' : ''}`}
                className={cn(
                  "relative flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center border cursor-pointer",
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
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsOverviewOpen(true)}
            className="flex text-xs items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2 sm:px-3 cursor-pointer shrink-0"
            title="All Questions"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">All Questions</span>
            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-bold">
              {session.answeredCount}/{session.totalQuestions}
            </span>
          </Button>

          <Dialog open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between pr-4">
                  <span>Listening Question Overview</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {session.answeredCount} of {session.totalQuestions} answered
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {test.sections.map((sec, sIdx) => {
                  const secQs = sec.groups.flatMap(g => g.questions)
                  return (
                    <div key={sec.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Part {sIdx + 1}: {sec.title || 'Listening'}</span>
                        <span>{secQs.filter(q => session.answers[q.id] !== undefined && session.answers[q.id] !== '').length} / {secQs.length}</span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {secQs.map(q => {
                          const isAnswered = session.answers[q.id] !== undefined && session.answers[q.id] !== ''
                          const isMarked = session.markedQuestions.has(q.id)

                          return (
                            <button
                              key={q.id}
                              onClick={() => {
                                setIsOverviewOpen(false)
                                if (session.currentSectionIndex !== sIdx) {
                                  session.setCurrentSectionIndex(sIdx)
                                }
                                setTimeout(() => scrollToQuestion(q.id), 120)
                              }}
                              className={cn(
                                "h-9 rounded-lg text-xs font-bold flex items-center justify-center border transition-all relative cursor-pointer",
                                isAnswered
                                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                                  : "bg-background text-foreground border-border hover:bg-secondary",
                                isMarked && "ring-2 ring-fox-red"
                              )}
                            >
                              {q.question_number}
                              {isMarked && (
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
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={session.prevSection} 
            disabled={session.isFirstSection}
            className="h-9 px-3 text-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <Button 
            size="sm"
            onClick={session.nextSection} 
            disabled={session.isLastSection}
            className={cn(
              "h-9 px-3 text-xs bg-primary text-black hover:bg-primary/90 font-bold cursor-pointer",
              session.isLastSection ? "opacity-50 pointer-events-none" : ""
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

      </footer>

      {/* 5. Floating Action Toolbar on Question Selection */}
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

      {/* 6. AI Contextual Dictionary Modal */}
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
