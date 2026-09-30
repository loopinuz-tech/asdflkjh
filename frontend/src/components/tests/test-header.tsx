import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { TimerDisplay, useTimer } from './timer'
import { FocusModeButton } from './focus-mode-button'
import { useTestSession } from '@/lib/test-engine/hooks'
import { Test } from '@/lib/test-engine/types'
import { LogOut, Trophy, CheckCircle2, XCircle, HelpCircle, AlertCircle, ArrowRight, ArrowUpRight, Home, BarChart3, Loader2, Sparkles, Eye, X, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function TestHeader({ 
  test, 
  session,
  onNavigateToQuestion
}: { 
  test: Test, 
  session: ReturnType<typeof useTestSession>,
  onNavigateToQuestion?: (questionNumber: number) => void
}) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [showResultModal, setShowResultModal] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all')
  const [inspectedQNum, setInspectedQNum] = useState<number | null>(null)

  const secondsLeft = useTimer(
    test.time_limit_minutes * 60,
    async () => {
      if (!session.isSubmitted) {
        await session.submit()
      }
    },
    session.isSubmitted || session.isSubmitting
  )

  const unansweredCount = Math.max(0, session.totalQuestions - session.answeredCount)
  const flaggedCount = session.markedQuestions?.size || 0

  const handleFinalSubmit = async () => {
    const res = await session.submit()
    setIsSubmitOpen(false)
    if (res) {
      setShowResultModal(true)
    }
  }

  // Question results computation for the modal breakdown
  const questionItems = useMemo(() => {
    const results = session.submissionResult?.questionResults || {}
    const allQs = test.sections.flatMap(s => s.groups.flatMap(g => g.questions))

    return allQs.map(q => {
      const res = results[q.id]
      const userAns = res ? res.userAnswer : session.answers[q.id]
      const hasAnswer = userAns !== undefined && userAns !== null && userAns !== ''
      const isCorrect = res 
        ? res.isCorrect 
        : (hasAnswer && q.correct_answer && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase())
      
      const correctAns = res?.correctAnswer || q.correct_answer || (Array.isArray(q.accepted_answers) ? q.accepted_answers.join(', ') : 'N/A')

      return {
        id: q.id,
        number: q.question_number,
        isCorrect: !!isCorrect,
        hasAnswer,
        userAnswer: userAns,
        correctAnswer: correctAns,
        acceptedAnswers: res?.acceptedAnswers || (Array.isArray(q.accepted_answers) ? q.accepted_answers : []),
        instruction: q.instruction,
        questionText: q.question_text
      }
    })
  }, [test, session.submissionResult, session.answers])

  const stats = useMemo(() => {
    let correct = 0
    let incorrect = 0
    let unanswered = 0
    questionItems.forEach(q => {
      if (q.isCorrect) correct++
      else if (q.hasAnswer) incorrect++
      else unanswered++
    })
    return {
      correct,
      incorrect,
      unanswered,
      total: questionItems.length
    }
  }, [questionItems])

  const filteredQuestions = useMemo(() => {
    if (activeFilter === 'correct') return questionItems.filter(q => q.isCorrect)
    if (activeFilter === 'incorrect') return questionItems.filter(q => !q.isCorrect && q.hasAnswer)
    if (activeFilter === 'unanswered') return questionItems.filter(q => !q.hasAnswer)
    return questionItems
  }, [questionItems, activeFilter])

  const inspectedQuestion = useMemo(() => {
    if (!inspectedQNum) return null
    return questionItems.find(q => q.number === inspectedQNum) || null
  }, [inspectedQNum, questionItems])

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fox-shadow-sm flex-shrink-0">
        <div className="flex h-14 sm:h-16 items-center justify-between px-2.5 sm:px-6 md:px-8 gap-2">
          
          {/* Left: Exit & Test Title */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
            <AlertDialog>
              <AlertDialogTrigger className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0" title="Leave practice test">
                <LogOut className="h-4 h-4 sm:h-5 sm:w-5" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave practice test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your progress is auto-saved. You can resume this test later from your dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => window.location.href = '/dashboard'}>
                    Save & Leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="hidden sm:block text-xs sm:text-sm font-bold text-foreground truncate max-w-[140px] sm:max-w-[240px] md:max-w-none">
                {test.title}
              </h1>
              {session.isSubmitted && (
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                  Review
                </span>
              )}
            </div>
          </div>

          {/* Right: Timer & Focus Mode & Submit / Scorecard Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!session.isSubmitted && (
              <div className="shrink-0 scale-95 sm:scale-100">
                <TimerDisplay secondsLeft={secondsLeft} />
              </div>
            )}
            
            <div className="shrink-0">
              <FocusModeButton />
            </div>
            
            {session.isSubmitted ? (
              <Button 
                onClick={() => setShowResultModal(true)}
                className="bg-primary text-black hover:bg-primary/90 font-bold text-xs flex items-center gap-1 px-2.5 sm:px-3 cursor-pointer shadow-xs shrink-0"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Scorecard</span>
              </Button>
            ) : (
              <Button 
                onClick={() => setIsSubmitOpen(true)}
                disabled={session.isSubmitting}
                className="bg-primary text-black hover:bg-primary/90 font-bold text-xs px-2.5 sm:px-4 cursor-pointer shrink-0"
              >
                {session.isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    <span className="sm:hidden">...</span>
                    <span className="hidden sm:inline">Submitting...</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Submit</span>
                    <span className="hidden sm:inline">Submit Test</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 1. Confirmation Modal: Submit Final Answers */}
      <AlertDialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <AlertDialogContent className="max-w-md w-[92vw] sm:w-full p-4 sm:p-6 rounded-2xl">
          <AlertDialogHeader>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1 sm:mb-2 mx-auto">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-base sm:text-lg font-bold">
              Submit Practice Test?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-muted-foreground">
              Please verify your answers before submitting. Once submitted, your test will be evaluated and locked.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Answered Summary Cards */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 py-2 sm:py-3">
            <div className="p-2 sm:p-3 rounded-xl bg-secondary/50 border border-border text-center">
              <div className="text-base sm:text-lg font-black text-foreground">{session.answeredCount}</div>
              <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase">Answered</div>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-secondary/50 border border-border text-center">
              <div className={`text-base sm:text-lg font-black ${unansweredCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                {unansweredCount}
              </div>
              <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase">Unanswered</div>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-secondary/50 border border-border text-center">
              <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">{flaggedCount}</div>
              <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase">Flagged</div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
              You still have <strong>{unansweredCount}</strong> unanswered questions.
            </div>
          )}

          <AlertDialogFooter className="pt-2 flex-col-reverse sm:flex-row gap-2">
            {!session.isSubmitting && (
              <AlertDialogCancel className="w-full sm:w-auto text-xs">Back to Test</AlertDialogCancel>
            )}
            <Button
              onClick={handleFinalSubmit}
              disabled={session.isSubmitting}
              className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-bold text-xs"
            >
              {session.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scoring...
                </>
              ) : (
                'Submit Final Answers'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2. Results Modal: Automatic Evaluation & Score Card with Question Breakdown */}
      {session.isSubmitted && session.submissionResult && showResultModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-xl md:max-w-2xl w-full p-4 sm:p-6 fox-shadow-lg space-y-3.5 sm:space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 text-left">
            
            {/* Header Icon & Title */}
            <div className="text-center space-y-1.5">
              <div className="relative mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
                <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  Evaluation Complete
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">Test Results</h2>
                <p className="text-xs text-muted-foreground">
                  Your answers have been graded and recorded to your progress history.
                </p>
              </div>
            </div>

            {/* IELTS Score Badge */}
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-secondary/40 border border-border grid grid-cols-3 gap-1 sm:gap-2 text-center divide-x divide-border/60">
              <div className="px-1">
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase truncate">Estimated Band</div>
                <div className="text-xl sm:text-3xl font-black text-primary mt-0.5">
                  Band {session.submissionResult.estimated_band?.toFixed(1) || '0.0'}
                </div>
              </div>
              <div className="px-1">
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase truncate">Raw Score</div>
                <div className="text-lg sm:text-2xl font-bold text-foreground mt-0.5">
                  {session.submissionResult.raw_score} / {session.submissionResult.total_points || stats.total}
                </div>
              </div>
              <div className="px-1">
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase truncate">Accuracy</div>
                <div className="text-lg sm:text-2xl font-bold text-foreground mt-0.5">
                  {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>

            {/* Summary Stat Pills / Filters */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'correct' ? 'all' : 'correct')}
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left",
                  activeFilter === 'correct'
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20"
                    : "bg-background border-border hover:bg-secondary/40"
                )}
              >
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-semibold text-foreground truncate">Correct</span>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 ml-1">{stats.correct}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'incorrect' ? 'all' : 'incorrect')}
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left",
                  activeFilter === 'incorrect'
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20"
                    : "bg-background border-border hover:bg-secondary/40"
                )}
              >
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-semibold text-foreground truncate">Incorrect</span>
                </div>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 ml-1">{stats.incorrect}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'unanswered' ? 'all' : 'unanswered')}
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left",
                  activeFilter === 'unanswered'
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-500 ring-2 ring-zinc-500/20"
                    : "bg-background border-border hover:bg-secondary/40"
                )}
              >
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[10px] sm:text-xs font-semibold text-foreground truncate">Skipped</span>
                </div>
                <span className="text-xs font-black text-muted-foreground ml-1">{stats.unanswered}</span>
              </button>
            </div>

            {/* Questions Grid Section */}
            <div className="space-y-2 border border-border rounded-xl p-3.5 bg-secondary/15">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  Question Breakdown
                  <span className="text-muted-foreground font-normal text-[11px] hidden sm:inline">
                    (Click question to view correct answer)
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Showing {filteredQuestions.length} of {questionItems.length}
                </span>
              </div>

              {/* Grid of Questions */}
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar p-1">
                {filteredQuestions.map(q => {
                  const isSelected = inspectedQNum === q.number
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setInspectedQNum(isSelected ? null : q.number)}
                      title={`Q${q.number}: ${q.isCorrect ? 'Correct' : q.hasAnswer ? 'Incorrect' : 'Unanswered'}`}
                      className={cn(
                        "h-8 sm:h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center border cursor-pointer relative",
                        isSelected && "ring-2 ring-primary ring-offset-2 scale-105 shadow-md",
                        q.isCorrect
                          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                          : q.hasAnswer
                            ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                            : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground"
                      )}
                    >
                      {q.number}
                      {q.isCorrect ? (
                        <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5 stroke-[3]" />
                      ) : q.hasAnswer ? (
                        <X className="w-2.5 h-2.5 absolute top-0.5 right-0.5 stroke-[3]" />
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {/* Inspected Question Quick Card */}
              {inspectedQuestion && (
                <div className="mt-3 p-3 rounded-xl bg-card border border-border text-xs space-y-2 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground">Question {inspectedQuestion.number}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1",
                      inspectedQuestion.isCorrect
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : inspectedQuestion.hasAnswer
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          : "bg-secondary text-muted-foreground"
                    )}>
                      {inspectedQuestion.isCorrect ? <CheckCircle2 className="w-3 h-3" /> : inspectedQuestion.hasAnswer ? <XCircle className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                      {inspectedQuestion.isCorrect ? 'Correct (+1 pt)' : inspectedQuestion.hasAnswer ? 'Incorrect (0 pt)' : 'Unanswered (0 pt)'}
                    </span>
                  </div>

                  {inspectedQuestion.questionText && (
                    <p className="text-muted-foreground text-[11px] line-clamp-2 italic">
                      "{inspectedQuestion.questionText.replace(/<[^>]*>?/gm, '')}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-secondary/40 border border-border">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">Your Answer</div>
                      <div className={cn(
                        "font-bold text-sm mt-0.5 truncate",
                        inspectedQuestion.isCorrect ? "text-emerald-600 dark:text-emerald-400" : inspectedQuestion.hasAnswer ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                      )}>
                        {inspectedQuestion.userAnswer ? String(inspectedQuestion.userAnswer) : '(No answer)'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-secondary/40 border border-border">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">Correct Answer</div>
                      <div className="font-bold text-sm mt-0.5 text-emerald-600 dark:text-emerald-400 truncate">
                        {String(inspectedQuestion.correctAnswer)}
                      </div>
                    </div>
                  </div>

                  {onNavigateToQuestion && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowResultModal(false)
                        onNavigateToQuestion(inspectedQuestion.number)
                      }}
                      className="w-full text-xs font-bold h-8 mt-1 border-primary/40 hover:bg-primary/10 cursor-pointer"
                    >
                      <span>Jump to Question {inspectedQuestion.number} in Test</span>
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1 text-center">
              <Button
                onClick={() => setShowResultModal(false)}
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-2" />
                Review Full Test with Explanations
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/progress'}
                  className="w-full text-xs font-semibold cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Analytics
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full text-xs font-semibold cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 mr-1.5" />
                  Dashboard
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
