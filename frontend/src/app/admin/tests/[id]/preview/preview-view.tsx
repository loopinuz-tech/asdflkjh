import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Smartphone,
  Tablet,
  Monitor,
  Clock,
  Bookmark,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Eye,
  Award,
} from 'lucide-react'
import { QuestionRenderer } from '@/components/tests/question-renderer'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { cn } from '@/lib/utils'

interface PreviewViewProps {
  test: any
  sections: any[]
  questions: any[]
}

export function TestPreviewView({ test, sections, questions }: PreviewViewProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
  const [markedQuestions, setMarkedQuestions] = useState<Record<string, boolean>>({})
  const [showScores, setShowScores] = useState(false)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    questions[0]?.id || null
  )

  const activeSection = sections[activeSectionIndex] || sections[0]
  const sectionQuestions = questions.filter(
    (q) => !q.section_id || q.section_id === activeSection?.id || sections.length <= 1
  )

  const handleAnswerChange = (qId: string, val: any) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: val }))
  }

  const toggleMarkQuestion = (qId: string) => {
    setMarkedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }))
  }

  // Calculate score
  let correctCount = 0
  questions.forEach((q) => {
    const userAns = String(userAnswers[q.id] || '').trim().toLowerCase()
    const correct = String(q.correct_answer || '').trim().toLowerCase()
    if (userAns && correct && userAns === correct) {
      correctCount++
    }
  })

  return (
    <div className="space-y-4 pb-16">
      {/* Top Preview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <Link to={`/admin/tests/${test.id}/edit`}
            className="p-1.5 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-foreground">{test.title}</h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                Student Preview Mode
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Module: <strong className="capitalize">{test.skill}</strong> • {test.time_limit_minutes} minutes • {questions.length} questions
            </p>
          </div>
        </div>

        {/* Device Switcher & Score check */}
        <div className="flex items-center gap-2">
          {/* Device toggle */}
          <div className="flex items-center p-1 bg-secondary/60 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              title="Desktop View (Split Screen)"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all',
                deviceMode === 'desktop' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('tablet')}
              title="Tablet View"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all',
                deviceMode === 'tablet' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              title="Mobile View"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all',
                deviceMode === 'mobile' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Check Score Toggle */}
          <button
            type="button"
            onClick={() => setShowScores(!showScores)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer',
              showScores
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-card border border-border text-foreground hover:bg-secondary'
            )}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>{showScores ? 'Hide Answers' : 'Check Answers & Score'}</span>
          </button>
        </div>
      </div>

      {/* Score Banner if revealed */}
      {showScores && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              Preview Score: <strong>{correctCount}</strong> / {questions.length} correct answers (
              {Math.round((correctCount / Math.max(1, questions.length)) * 100)}%)
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Estimated Band: 7.5</span>
        </div>
      )}

      {/* Outer Container formatted by Device Mode */}
      <div
        className={cn(
          'mx-auto transition-all bg-card border border-border rounded-3xl shadow-lg overflow-hidden flex flex-col',
          deviceMode === 'desktop' && 'w-full min-h-[650px]',
          deviceMode === 'tablet' && 'max-w-2xl min-h-[650px]',
          deviceMode === 'mobile' && 'max-w-md min-h-[600px]'
        )}
      >
        {/* Student Exam Header */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-400 text-sm tracking-wider">FOX FORD</span>
            <span className="text-xs text-slate-400">| IELTS Official Simulation</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>59:42 remaining</span>
          </div>
        </div>

        {/* Section Tabs */}
        {sections.length > 1 && (
          <div className="flex items-center gap-1 px-4 py-2 bg-secondary/40 border-b border-border overflow-x-auto">
            {sections.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionIndex(idx)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  activeSectionIndex === idx
                    ? 'bg-card text-foreground border border-border shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {sec.title || `Part ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Exam Body (Split Screen for Reading & Listening on Desktop) */}
        <div className={cn('flex-1 grid', deviceMode === 'desktop' ? 'grid-cols-2 divide-x divide-border' : 'grid-cols-1')}>
          {/* Left Pane: Passage or Listening Audio */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[600px] space-y-4 bg-secondary/15">
            {activeSection?.audio_url && (
              <div className="p-4 bg-card border border-border rounded-2xl shadow-xs space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  🎧 Listening Track — {activeSection.title}
                </span>
                <audio controls src={activeSection.audio_url} className="w-full h-10" />
              </div>
            )}

            {activeSection?.passage?.content || activeSection?.passage_html ? (
              <div className="prose prose-slate dark:prose-invert max-w-none text-foreground text-sm leading-relaxed">
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(activeSection?.passage?.content || activeSection?.passage_html),
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <p className="font-semibold text-foreground">No reading passage attached to this section.</p>
                <p className="mt-1">Students will read instructions and answer questions on the right.</p>
              </div>
            )}
          </div>

          {/* Right Pane: Questions List */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[600px] space-y-4 bg-card">
            {sectionQuestions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No questions assigned to this section.
              </div>
            ) : (
              sectionQuestions.map((q) => {
                const userAns = userAnswers[q.id]
                const isCorrect = String(userAns || '').trim().toLowerCase() === String(q.correct_answer || '').trim().toLowerCase()

                return (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    answer={userAns}
                    onChange={(val) => handleAnswerChange(q.id, val)}
                    isMarked={!!markedQuestions[q.id]}
                    onToggleMark={() => toggleMarkQuestion(q.id)}
                    showExplanation={showScores}
                    scoreResult={
                      showScores
                        ? {
                            isCorrect,
                            score: isCorrect ? q.points || 1 : 0,
                          }
                        : undefined
                    }
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Student Bottom Navigation Palette */}
        <div className="px-4 sm:px-6 py-3 bg-secondary/30 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {questions.map((q) => {
              const isAnswered = !!userAnswers[q.id]
              const isMarked = !!markedQuestions[q.id]
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`question-${q.id}`)
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-bold transition-all border shrink-0 cursor-pointer',
                    isAnswered
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-background text-foreground border-border hover:bg-secondary',
                    isMarked && 'ring-2 ring-rose-500'
                  )}
                  title={`Question #${q.question_number} ${isAnswered ? '(Answered)' : '(Unanswered)'}`}
                >
                  {q.question_number}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-background border border-border" /> Unanswered
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
