import { useState, useMemo } from 'react'
import {
  BoxIcon,
  CalendarDateIcon,
  CheckSquareIcon,
  StarsIcon,
  BookBookmarkIcon,
} from '@solar-icons/react/bold-duotone'

export interface SRSReviewModalProps {
  isOpen: boolean
  onClose: () => void
  modeTitle: string
  allWords: any[]
  userVocabMap: Map<string, { status: string; mastery_level: number; next_review_at?: string; created_at?: string }>
  onStartPractice: (words: any[], setTitle: string) => void
  selectedTableWordsCount?: number
  onChooseFromTable?: () => void
}

export function SRSReviewModal({
  isOpen,
  onClose,
  modeTitle,
  allWords,
  userVocabMap,
  onStartPractice,
  selectedTableWordsCount = 0,
  onChooseFromTable,
}: SRSReviewModalProps) {
  // Default to today's date formatted as YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    if (allWords.length > 0 && allWords[0].created_at) {
      return allWords[0].created_at.substring(0, 10)
    }
    return new Date().toISOString().substring(0, 10)
  })

  // Partition words
  const { allSet, masteredSet, learningSet, dateSet } = useMemo(() => {
    const mastered: any[] = []
    const learning: any[] = []
    const byDate: any[] = []

    allWords.forEach((word) => {
      const uv = userVocabMap.get(word.id)
      const lvl = uv?.mastery_level || 0

      if (lvl >= 5) {
        mastered.push(word)
      } else {
        learning.push(word)
      }

      const wordDate = word.created_at
        ? word.created_at.substring(0, 10)
        : uv?.created_at
        ? uv.created_at.substring(0, 10)
        : null

      if (wordDate && wordDate === selectedDate) {
        byDate.push(word)
      }
    })

    return {
      allSet: allWords,
      masteredSet: mastered,
      learningSet: learning.length > 0 ? learning : allWords,
      dateSet: byDate.length > 0 ? byDate : allWords,
    }
  }, [allWords, userVocabMap, selectedDate])

  if (!isOpen) return null

  const handleSelectSet = (words: any[], label: string) => {
    if (words.length === 0) {
      onStartPractice(allWords, `${label} (Fallback All)`)
    } else {
      onStartPractice(words, label)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl space-y-4 sm:space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
            Which words to review?
          </h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
            Choose your practice set for {modeTitle}
          </p>
        </div>

        {/* Option Cards */}
        <div className="space-y-2.5 sm:space-y-3">
          {/* 1. All Words */}
          <div
            onClick={() => handleSelectSet(allSet, 'All Words')}
            className="rounded-xl sm:rounded-2xl border border-border/80 hover:border-primary/50 bg-secondary/30 hover:bg-secondary/60 p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98] group shadow-xs"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 group-hover:text-foreground">
                <BookBookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  All Words
                </h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                  Full active vocabulary bank
                </p>
              </div>
            </div>
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-secondary text-[11px] sm:text-xs font-semibold text-muted-foreground shrink-0 ml-2">
              {allSet.length} words
            </span>
          </div>

          {/* 2. Mastered Words */}
          <div
            onClick={() => handleSelectSet(masteredSet, 'Mastered Words')}
            className="rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98] group shadow-xs"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <StarsIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
                  Mastered Words
                </h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                  Box 5 completed vocabulary
                </p>
              </div>
            </div>
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-semibold shrink-0 ml-2">
              {masteredSet.length} words
            </span>
          </div>

          {/* 3. Learning Words */}
          <div
            onClick={() => handleSelectSet(learningSet, 'Learning Words')}
            className="rounded-xl sm:rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98] group shadow-xs"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <BoxIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 truncate">
                  Learning Words
                </h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                  In active Leitner boxes (1 to 4)
                </p>
              </div>
            </div>
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] sm:text-xs font-semibold shrink-0 ml-2">
              {learningSet.length} words
            </span>
          </div>

          {/* 4. Filter by Date */}
          <div className="rounded-xl sm:rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3 sm:p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <CalendarDateIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
                    Filter by Date
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                    Words from chosen study date
                  </p>
                </div>
              </div>
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] sm:text-xs font-semibold shrink-0">
                {dateSet.length} words
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 min-w-0 bg-background border border-rose-200 dark:border-rose-900/50 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
              />
              <button
                onClick={() => handleSelectSet(dateSet, `Date (${selectedDate})`)}
                className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
              >
                Start
              </button>
            </div>
          </div>

          {/* 5. Select from Table */}
          <div
            onClick={() => {
              if (onChooseFromTable) {
                onChooseFromTable()
                onClose()
              } else {
                handleSelectSet(allSet, 'Custom Table Words')
              }
            }}
            className="rounded-xl sm:rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98] group shadow-xs"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CheckSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 truncate">
                  Select from Table
                </h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                  Pick custom words manually
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 ml-2">
              {selectedTableWordsCount > 0
                ? `${selectedTableWordsCount} picked →`
                : 'Choose →'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
