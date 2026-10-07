import { useState, useMemo } from 'react'
import {
  BookBookmarkIcon,
  StarIcon,
  BookmarkOpenedIcon,
  CalendarDateIcon,
  ChecklistMinimalisticIcon,
  AltArrowLeftIcon,
  CheckSquareIcon,
  CloseCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface WordSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectWords: (selectedWords: LeitnerWord[]) => void
  allWords: LeitnerWord[]
  modeTitle?: string
}

export function WordSelectionModal({
  isOpen,
  onClose,
  onSelectWords,
  allWords,
  modeTitle = 'Review Session',
}: WordSelectionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [customSelectedIds, setCustomSelectedIds] = useState<Set<string>>(new Set())
  const [tableSearch, setTableSearch] = useState('')

  // Word counts by category
  const masteredWords = useMemo(
    () => allWords.filter((w) => (w.mastery_level || 1) >= 5 || w.status === 'mastered'),
    [allWords]
  )

  const learningWords = useMemo(
    () => allWords.filter((w) => (w.mastery_level || 1) < 5 && w.status !== 'mastered'),
    [allWords]
  )

  const dateWords = useMemo(() => {
    if (!selectedDate) return []
    return allWords.filter((w) => {
      if (!w.created_at) return true
      return w.created_at.startsWith(selectedDate)
    })
  }, [allWords, selectedDate])

  // Custom table filtered words
  const tableFilteredWords = useMemo(() => {
    if (!tableSearch.trim()) return allWords
    const q = tableSearch.toLowerCase()
    return allWords.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q) ||
        (w.translation && w.translation.toLowerCase().includes(q))
    )
  }, [allWords, tableSearch])

  if (!isOpen) return null

  const handleStartReview = (words: LeitnerWord[]) => {
    if (words.length === 0) {
      alert('Please select at least 1 word to start review.')
      return
    }
    onSelectWords(words)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden text-foreground">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Which words to review?
          </h2>
          {modeTitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
              Choose your practice set for <span className="text-foreground font-semibold">{modeTitle}</span>
            </p>
          )}
        </div>

        {/* If in Table Selection Mode */}
        {selectedOption === 'table' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <AltArrowLeftIcon size={16} />
                Back to options
              </button>
              <span className="text-xs font-semibold text-foreground">
                Selected: {customSelectedIds.size} / {allWords.length}
              </span>
            </div>

            <Input
              placeholder="Search words..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="rounded-xl text-xs h-9"
            />

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {tableFilteredWords.map((word) => {
                const isChecked = customSelectedIds.has(word.id)
                return (
                  <div
                    key={word.id}
                    onClick={() => {
                      const next = new Set(customSelectedIds)
                      if (isChecked) next.delete(word.id)
                      else next.add(word.id)
                      setCustomSelectedIds(next)
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-primary/10 border-primary text-foreground font-medium'
                        : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                        }`}
                      >
                        {isChecked && <CheckSquareIcon size={12} />}
                      </div>
                      <span className="font-semibold text-foreground">{word.word}</span>
                    </div>
                    <span className="text-[11px] truncate max-w-[140px] text-muted-foreground">
                      {word.definition}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (customSelectedIds.size === allWords.length) {
                    setCustomSelectedIds(new Set())
                  } else {
                    setCustomSelectedIds(new Set(allWords.map((w) => w.id)))
                  }
                }}
                className="flex-1 rounded-xl text-xs font-medium"
              >
                {customSelectedIds.size === allWords.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const picked = allWords.filter((w) => customSelectedIds.has(w.id))
                  handleStartReview(picked)
                }}
                disabled={customSelectedIds.size === 0}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
              >
                Start ({customSelectedIds.size})
              </Button>
            </div>
          </div>
        ) : (
          /* Main 5 Options (Matching Screenshot 2) */
          <div className="space-y-3">
            {/* Option 1: All Words */}
            <button
              type="button"
              onClick={() => handleStartReview(allWords)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-border/80 hover:border-foreground/30 bg-card hover:bg-muted/40 transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-muted/80 text-foreground flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookBookmarkIcon size={22} className="text-foreground/80" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-foreground">
                    All Words
                  </div>
                  <div className="text-xs text-muted-foreground">Full active vocabulary bank</div>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-lg text-xs font-medium px-2.5 py-1">
                {allWords.length} words
              </Badge>
            </button>

            {/* Option 2: Mastered Words */}
            <button
              type="button"
              onClick={() => handleStartReview(masteredWords.length > 0 ? masteredWords : allWords)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <StarIcon size={22} />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
                    Mastered Words
                  </div>
                  <div className="text-xs text-muted-foreground">Box 5 completed vocabulary</div>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium px-2.5 py-1">
                {masteredWords.length} words
              </Badge>
            </button>

            {/* Option 3: Learning Words */}
            <button
              type="button"
              onClick={() => handleStartReview(learningWords.length > 0 ? learningWords : allWords)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookmarkOpenedIcon size={22} />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-amber-700 dark:text-amber-400">
                    Learning Words
                  </div>
                  <div className="text-xs text-muted-foreground">In active Leitner boxes (1 to 4)</div>
                </div>
              </div>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium px-2.5 py-1">
                {learningWords.length} words
              </Badge>
            </button>

            {/* Option 4: By Date */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-rose-500/25 bg-rose-500/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                    <CalendarDateIcon size={22} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-rose-700 dark:text-rose-400">
                      Filter by Date
                    </div>
                    <div className="text-xs text-muted-foreground">Words from chosen study date</div>
                  </div>
                </div>
                <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium px-2.5 py-1">
                  {dateWords.length} words
                </Badge>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl text-xs h-9 bg-card border-border/80 flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => handleStartReview(dateWords.length > 0 ? dateWords : allWords)}
                  className="rounded-xl h-9 text-xs px-3 font-semibold bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                >
                  Start
                </Button>
              </div>
            </div>

            {/* Option 5: Select from Table */}
            <button
              type="button"
              onClick={() => setSelectedOption('table')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ChecklistMinimalisticIcon size={22} />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-blue-700 dark:text-blue-400">
                    Select from Table
                  </div>
                  <div className="text-xs text-muted-foreground">Pick custom words manually</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Choose &rarr;
              </span>
            </button>
          </div>
        )}

        {/* Footer: Cancel button */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-4 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
