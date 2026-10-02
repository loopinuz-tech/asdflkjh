import { useState, useEffect } from 'react'
import {
  AltArrowLeftIcon,
  VolumeLoudIcon,
  BoxIcon,
  RestartIcon,
  CheckSquareIcon,
  StarsIcon,
  FlameIcon,
} from '@solar-icons/react/bold-duotone'
import {
  LeitnerWord,
  LEITNER_BOXES,
  updateLeitnerWord,
  calculateNextReviewDate,
  speakWord,
} from '@/lib/services/leitner-srs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SpacedRepetitionLeitnerProps {
  words: LeitnerWord[]
  onBack: () => void
}

export function SpacedRepetitionLeitner({ words, onBack }: SpacedRepetitionLeitnerProps) {
  const [deck, setDeck] = useState<LeitnerWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState({ again: 0, hard: 0, good: 0, easy: 0 })
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    setDeck(words)
    setCurrentIndex(0)
    setIsFlipped(false)
    setResults({ again: 0, hard: 0, good: 0, easy: 0 })
    setIsFinished(false)
  }, [words])

  const currentWord = deck[currentIndex]

  // Play audio on new card
  useEffect(() => {
    if (currentWord?.word) {
      speakWord(currentWord.word)
    }
  }, [currentIndex, currentWord])

  const currentBox = currentWord?.mastery_level || 1
  const boxConfig = LEITNER_BOXES.find((b) => b.box === currentBox) || LEITNER_BOXES[0]

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentWord) return
    setResults((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))

    // Update in Leitner system
    await updateLeitnerWord(currentWord.id, rating !== 'again', rating)

    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
    } else {
      setIsFinished(true)
    }
  }

  if (deck.length === 0) {
    return (
      <div className="text-center p-8 bg-card border border-border rounded-3xl max-w-md mx-auto space-y-4">
        <h3 className="text-xl font-bold text-foreground">No words to review</h3>
        <p className="text-sm text-muted-foreground">Select words from your vocabulary bank first.</p>
        <Button onClick={onBack} className="rounded-2xl bg-primary text-black font-bold">
          Return to Vocabulary
        </Button>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-primary text-black flex items-center justify-center mx-auto shadow-md">
          <CheckSquareIcon size={32} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-foreground">Leitner Review Complete!</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            You reviewed {deck.length} words in this session. Cards have been updated in their Leitner boxes.
          </p>
        </div>

        {/* 4 Outcome Badges */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-2.5">
            <div className="text-lg font-bold text-rose-500">{results.again}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Again</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5">
            <div className="text-lg font-bold text-amber-500">{results.hard}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Hard</div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-2.5">
            <div className="text-lg font-bold text-primary">{results.good}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Good</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-2.5">
            <div className="text-lg font-bold text-emerald-500">{results.easy}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Easy</div>
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 rounded-2xl font-semibold"
          >
            Review Modes
          </Button>
          <Button
            onClick={() => {
              setCurrentIndex(0)
              setIsFlipped(false)
              setIsFinished(false)
              setResults({ again: 0, hard: 0, good: 0, easy: 0 })
            }}
            className="flex-1 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90"
          >
            Review Again
          </Button>
        </div>
      </div>
    )
  }

  const progressPercent = Math.round(((currentIndex + 1) / deck.length) * 100)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon size={20} />
          Leitner Spaced Repetition
        </button>

        <div className="flex items-center gap-3">
          {/* Current Leitner Box Badge */}
          <Badge
            className={`${boxConfig.bg} ${boxConfig.color} border ${boxConfig.border} rounded-xl px-2.5 py-1 text-xs font-bold`}
          >
            <BoxIcon size={14} className="mr-1" />
            {boxConfig.name}: {boxConfig.label}
          </Badge>

          <span className="text-xs font-semibold text-muted-foreground">
            {currentIndex + 1} / {deck.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Interactive Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[340px] sm:min-h-[380px] p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-md flex flex-col justify-between cursor-pointer select-none transition-all hover:border-foreground/30 relative group"
      >
        {/* Card Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentWord.part_of_speech && (
              <Badge variant="secondary" className="rounded-lg text-[11px] font-semibold">
                {currentWord.part_of_speech}
              </Badge>
            )}
            {currentWord.topic && (
              <span className="text-xs text-muted-foreground font-medium">
                {currentWord.topic}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              speakWord(currentWord.word)
            }}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Listen pronunciation"
          >
            <VolumeLoudIcon size={20} />
          </button>
        </div>

        {/* Card Body */}
        {!isFlipped ? (
          /* FRONT OF CARD */
          <div className="text-center py-10 space-y-3">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              {currentWord.word}
            </h2>
            {currentWord.pronunciation && (
              <p className="text-sm sm:text-base font-mono text-muted-foreground">
                /{currentWord.pronunciation}/
              </p>
            )}
            <div className="pt-6">
              <span className="inline-block text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full group-hover:bg-primary/20 group-hover:text-foreground transition-colors">
                Click anywhere to flip card
              </span>
            </div>
          </div>
        ) : (
          /* BACK OF CARD */
          <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Definition
              </span>
              <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed mt-0.5">
                {currentWord.definition}
              </p>
            </div>

            {currentWord.translation && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Meaning
                </span>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {currentWord.translation}
                </p>
              </div>
            )}

            {currentWord.example_sentence && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Example
                </span>
                <p className="text-xs sm:text-sm italic text-foreground/90 mt-0.5">
                  "{currentWord.example_sentence}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Card Footer hint */}
        <div className="text-center text-[11px] text-muted-foreground">
          {isFlipped ? 'Rate how well you recalled this word below' : 'Tap card to reveal answer'}
        </div>
      </div>

      {/* 4 Leitner Rating Buttons (Active when flipped) */}
      {isFlipped ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Again -> Box 1 */}
          <button
            type="button"
            onClick={() => handleRating('again')}
            className="p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 transition-all text-center cursor-pointer font-bold text-xs sm:text-sm active:scale-95 shadow-xs"
          >
            <div>Again</div>
            <div className="text-[10px] font-normal opacity-80 mt-0.5">Reset to Box 1 (1d)</div>
          </button>

          {/* Hard -> Same Box */}
          <button
            type="button"
            onClick={() => handleRating('hard')}
            className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 transition-all text-center cursor-pointer font-bold text-xs sm:text-sm active:scale-95 shadow-xs"
          >
            <div>Hard</div>
            <div className="text-[10px] font-normal opacity-80 mt-0.5">Stay Box {currentBox} (2d)</div>
          </button>

          {/* Good -> Advance 1 Box */}
          <button
            type="button"
            onClick={() => handleRating('good')}
            className="p-3 rounded-2xl border border-primary/40 bg-primary/20 hover:bg-primary text-black transition-all text-center cursor-pointer font-extrabold text-xs sm:text-sm active:scale-95 shadow-xs"
          >
            <div>Good</div>
            <div className="text-[10px] font-medium opacity-90 mt-0.5">
              Advance to Box {Math.min(5, currentBox + 1)}
            </div>
          </button>

          {/* Easy -> Advance 2 Boxes */}
          <button
            type="button"
            onClick={() => handleRating('easy')}
            className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 transition-all text-center cursor-pointer font-bold text-xs sm:text-sm active:scale-95 shadow-xs"
          >
            <div>Easy</div>
            <div className="text-[10px] font-normal opacity-80 mt-0.5">
              Jump to Box {Math.min(5, currentBox + 2)}
            </div>
          </button>
        </div>
      ) : (
        <div className="text-center pt-2">
          <Button
            onClick={() => setIsFlipped(true)}
            className="rounded-2xl px-8 py-3 bg-primary text-black font-bold text-sm hover:bg-primary/90 shadow-md cursor-pointer"
          >
            Show Answer
          </Button>
        </div>
      )}
    </div>
  )
}
