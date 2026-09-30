import { useTestSession } from '@/lib/test-engine/hooks'
import { Test } from '@/lib/test-engine/types'
import { cn } from '@/lib/utils'
import { Bookmark, Check } from 'lucide-react'

export function QuestionNavigator({ 
  test, 
  session 
}: { 
  test: Test, 
  session: ReturnType<typeof useTestSession> 
}) {
  return (
    <div className="bg-card border border-border rounded-xl fox-shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
      <div className="p-4 border-b border-border bg-secondary/30">
        <h3 className="font-semibold text-sm">Question Navigator</h3>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-card border border-border"></div>
            <span>Unanswered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-fox-red fill-fox-red" />
            <span>Review</span>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {test.sections.map((section, sIdx) => {
          // Flatten questions in this section
          const sectionQuestions = section.groups.flatMap(g => g.questions)
          
          if (sectionQuestions.length === 0) return null

          return (
            <div key={section.id} className="mb-6 last:mb-0">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {sectionQuestions.map(q => {
                  const isAnswered = session.answers[q.id] !== undefined && session.answers[q.id] !== ''
                  const isMarked = session.markedQuestions.has(q.id)
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        // Navigate to section
                        if (session.currentSectionIndex !== sIdx) {
                          session.setCurrentSectionIndex(sIdx)
                        }
                        // Scroll to question
                        setTimeout(() => {
                          const el = document.getElementById(`question-${q.id}`)
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }, 100)
                      }}
                      className={cn(
                        "relative flex items-center justify-center h-10 rounded-md text-sm font-medium transition-colors border",
                        isAnswered 
                          ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20" 
                          : "bg-card border-border text-foreground hover:bg-secondary",
                      )}
                    >
                      {q.question_number}
                      {isMarked && (
                        <Bookmark className="absolute -top-1 -right-1 w-3.5 h-3.5 text-fox-red fill-fox-red" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
