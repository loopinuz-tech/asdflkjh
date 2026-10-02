import { useState, useEffect, useMemo } from 'react'
import {
  AltArrowLeftIcon,
  CupIcon,
  FlameIcon,
  CheckCircleIcon,
  CloseCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord, updateLeitnerWord, speakWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MarathonQuizProps {
  words: LeitnerWord[]
  onBack: () => void
}

export function MarathonQuiz({ words, onBack }: MarathonQuizProps) {
  const [deck, setDeck] = useState<LeitnerWord[]>([])
  const [currentStage, setCurrentStage] = useState(1) // 1 to 5
  const [stageQuestionIndex, setStageQuestionIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isWon, setIsWon] = useState(false)

  // Stage configs: 3 questions per stage = 15 questions total
  const QUESTIONS_PER_STAGE = 3

  useEffect(() => {
    if (words.length === 0) return
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setCurrentStage(1)
    setStageQuestionIndex(0)
    setLives(3)
    setScore(0)
    setStreak(0)
    setIsGameOver(false)
    setIsWon(false)
  }, [words])

  const totalQuestionIndex = (currentStage - 1) * QUESTIONS_PER_STAGE + stageQuestionIndex
  const currentWord = deck[totalQuestionIndex % deck.length]

  // Prepare 4 choices
  const options = useMemo(() => {
    if (!currentWord || deck.length === 0) return { list: [] as string[], correctIndex: -1 }
    const others = deck.filter((w) => w.id !== currentWord.id)
    const distractors = [...others]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => (currentStage % 2 === 1 ? w.definition : w.word))

    while (distractors.length < 3) {
      distractors.push('Alternative option')
    }

    const correct = currentStage % 2 === 1 ? currentWord.definition : currentWord.word
    const combined = [correct, ...distractors].sort(() => Math.random() - 0.5)
    return { list: combined, correctIndex: combined.indexOf(correct) }
  }, [currentWord, currentStage, deck])

  const handleAnswer = (idx: number) => {
    if (selectedOption !== null || !currentWord) return
    setSelectedOption(idx)

    const isCorrect = idx === options.correctIndex
    if (isCorrect) {
      const bonus = streak * 5
      setScore((s) => s + 20 + bonus)
      setStreak((st) => st + 1)
      updateLeitnerWord(currentWord.id, true)
    } else {
      setStreak(0)
      updateLeitnerWord(currentWord.id, false)
      setLives((l) => {
        const next = l - 1
        if (next <= 0) {
          setTimeout(() => setIsGameOver(true), 800)
        }
        return next
      })
    }

    setTimeout(() => {
      setSelectedOption(null)
      if (lives <= 1 && !isCorrect) return

      if (stageQuestionIndex + 1 < QUESTIONS_PER_STAGE) {
        setStageQuestionIndex((q) => q + 1)
      } else {
        if (currentStage < 5) {
          setCurrentStage((s) => s + 1)
          setStageQuestionIndex(0)
        } else {
          setIsWon(true)
        }
      }
    }, 700)
  }

  if (deck.length === 0 || !currentWord) return null

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon size={20} />
          Marathon Challenge
        </button>

        {/* Lives and Score */}
        <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-1 text-rose-500 font-bold">
            {'❤️'.repeat(Math.max(0, lives))}
          </div>
          <div className="text-muted-foreground">
            Streak:{' '}
            <span className="font-bold text-amber-500 flex items-center inline-flex gap-0.5">
              <FlameIcon size={14} />
              {streak}
            </span>
          </div>
          <div>
            Score: <span className="font-bold text-foreground">{score}</span>
          </div>
        </div>
      </div>

      {/* Stage Tracker Pills */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5].map((st) => (
          <div
            key={st}
            className={`flex-1 text-center py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
              st === currentStage
                ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400 scale-[1.02]'
                : st < currentStage
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted/40 border-border/60 text-muted-foreground'
            }`}
          >
            Stage {st}
          </div>
        ))}
      </div>

      {isGameOver ? (
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <CloseCircleIcon size={32} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Out of Lives!</h3>
          <p className="text-sm text-muted-foreground">
            You reached Stage {currentStage} with a score of {score}. Try again to complete the full 5-stage marathon!
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl font-semibold">
              Review Modes
            </Button>
            <Button
              onClick={() => {
                setLives(3)
                setCurrentStage(1)
                setStageQuestionIndex(0)
                setScore(0)
                setStreak(0)
                setIsGameOver(false)
              }}
              className="flex-1 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90"
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : isWon ? (
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <CupIcon size={38} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Marathon Champion!</h3>
          <p className="text-sm text-muted-foreground">
            You conquered all 5 stages! Total Score:{' '}
            <span className="font-bold text-foreground">{score}</span> points.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl font-semibold">
              Review Modes
            </Button>
            <Button
              onClick={() => {
                setLives(3)
                setCurrentStage(1)
                setStageQuestionIndex(0)
                setScore(0)
                setStreak(0)
                setIsWon(false)
              }}
              className="flex-1 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90"
            >
              Play Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-md space-y-6">
          <div className="text-center">
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 mb-3">
              Stage {currentStage} • Question {stageQuestionIndex + 1}/{QUESTIONS_PER_STAGE}
            </Badge>

            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {currentStage % 2 === 1 ? currentWord.word : currentWord.definition}
            </h3>
            {currentStage % 2 === 1 && currentWord.pronunciation && (
              <p className="text-xs font-mono text-muted-foreground mt-1">
                /{currentWord.pronunciation}/
              </p>
            )}
          </div>

          {/* Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {options.list.map((opt, idx) => {
              const isSelected = selectedOption === idx
              const isCorrect = idx === options.correctIndex
              const isWrong = isSelected && !isCorrect

              let stateClass =
                'border-border/80 hover:border-foreground/30 bg-card hover:bg-muted/40 text-foreground'

              if (selectedOption !== null) {
                if (isCorrect) {
                  stateClass =
                    'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/30'
                } else if (isWrong) {
                  stateClass =
                    'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold ring-2 ring-rose-500/30'
                } else {
                  stateClass = 'opacity-40 border-border/40'
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-2xl border text-center text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.99] flex items-center justify-center min-h-[64px] ${stateClass}`}
                >
                  <p className="line-clamp-2 leading-relaxed">{opt}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
