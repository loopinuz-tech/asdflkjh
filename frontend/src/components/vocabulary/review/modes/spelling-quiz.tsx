import { useState, useEffect, useRef } from 'react'
import {
  AltArrowLeftIcon,
  VolumeLoudIcon,
  PenNewSquareIcon,
  CheckCircleIcon,
  CloseCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord, updateLeitnerWord, speakWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SpellingQuizProps {
  words: LeitnerWord[]
  onBack: () => void
}

export function SpellingQuiz({ words, onBack }: SpellingQuizProps) {
  const [deck, setDeck] = useState<LeitnerWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (words.length === 0) return
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 15)
    setDeck(shuffled)
    setCurrentIndex(0)
    setUserInput('')
    setScore(0)
    setFeedback(null)
    setIsCompleted(false)
  }, [words])

  const currentWord = deck[currentIndex]

  // Play audio when entering a new card and focus input
  useEffect(() => {
    if (currentWord?.word) {
      speakWord(currentWord.word)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [currentIndex, currentWord])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!currentWord || feedback !== null || !userInput.trim()) return

    const isCorrect =
      userInput.trim().toLowerCase() === currentWord.word.trim().toLowerCase()

    setFeedback(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      setScore((s) => s + 10)
      updateLeitnerWord(currentWord.id, true)
    } else {
      updateLeitnerWord(currentWord.id, false)
    }

    setTimeout(() => {
      setFeedback(null)
      setUserInput('')
      if (currentIndex + 1 < deck.length) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsCompleted(true)
      }
    }, 1100)
  }

  if (deck.length === 0) return null

  const progressPercent = Math.round(((currentIndex + 1) / deck.length) * 100)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon size={20} />
          Spelling Test
        </button>
        <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
          {currentIndex + 1}/{deck.length} | Score:{' '}
          <span className="font-bold text-foreground">{score}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
        <div
          className="bg-teal-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isCompleted ? (
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-500 flex items-center justify-center mx-auto">
            <PenNewSquareIcon size={32} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Spelling Test Complete!</h3>
          <p className="text-sm text-muted-foreground">You scored {score} points.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl font-semibold">
              Review Modes
            </Button>
            <Button
              onClick={() => {
                setIsCompleted(false)
                setCurrentIndex(0)
                setScore(0)
              }}
              className="flex-1 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90"
            >
              Play Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border/80 shadow-md space-y-6">
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => speakWord(currentWord.word)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
            >
              <VolumeLoudIcon size={20} />
              Click to Listen
            </button>

            <div className="text-sm text-muted-foreground max-w-md mx-auto pt-2">
              <span className="font-semibold text-foreground">Meaning:</span>{' '}
              {currentWord.definition}
            </div>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto pt-2">
            <div className="relative">
              <Input
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the word here..."
                autoComplete="off"
                disabled={feedback !== null}
                className={`text-center text-lg sm:text-xl font-bold tracking-wider rounded-2xl h-14 ${
                  feedback === 'correct'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                    : feedback === 'wrong'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 animate-shake'
                    : 'border-border/80'
                }`}
              />

              {feedback === 'correct' && (
                <div className="absolute right-4 top-4 text-emerald-500 animate-in zoom-in-50">
                  <CheckCircleIcon size={24} />
                </div>
              )}
              {feedback === 'wrong' && (
                <div className="absolute right-4 top-4 text-rose-500 animate-in zoom-in-50">
                  <CloseCircleIcon size={24} />
                </div>
              )}
            </div>

            {feedback === 'wrong' && (
              <div className="text-center text-xs sm:text-sm font-semibold text-rose-500 animate-in fade-in">
                Correct spelling:{' '}
                <span className="text-foreground font-black text-base">{currentWord.word}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={!userInput.trim() || feedback !== null}
              className="w-full rounded-2xl h-12 bg-primary text-black font-bold text-sm hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              Submit Answer
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
