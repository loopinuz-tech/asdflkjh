import { useState, useEffect, useRef } from 'react'
import {
  AltArrowLeftIcon,
  CloseCircleIcon,
  VolumeLoudIcon,
  BoltIcon,
  StarsIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord, updateLeitnerWord, speakWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'

interface SpeedQuizProps {
  words: LeitnerWord[]
  onBack: () => void
}

interface SpeedQuestion {
  word: LeitnerWord
  options: string[]
  correctIndex: number
}

const QUESTION_TIME_SECONDS = 10

export function SpeedQuiz({ words, onBack }: SpeedQuizProps) {
  const [questions, setQuestions] = useState<SpeedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Build questions
  useEffect(() => {
    if (words.length === 0) return
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    const list: SpeedQuestion[] = shuffled.slice(0, 15).map((w) => {
      // 1 correct definition + 3 distractors
      const otherWords = words.filter((ow) => ow.id !== w.id)
      const distractors = [...otherWords]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((ow) => ow.definition)

      // Ensure 4 options
      while (distractors.length < 3) {
        distractors.push('Alternative definition not applicable to this term.')
      }

      const allOptions = [w.definition, ...distractors].sort(() => Math.random() - 0.5)
      const correctIndex = allOptions.indexOf(w.definition)

      return {
        word: w,
        options: allOptions,
        correctIndex,
      }
    })

    setQuestions(list)
    setCurrentIndex(0)
    setScore(0)
    setTimeLeft(QUESTION_TIME_SECONDS)
    setIsCompleted(false)
  }, [words])

  const currentQ = questions[currentIndex]

  // Play audio on new question
  useEffect(() => {
    if (currentQ?.word) {
      speakWord(currentQ.word.word)
    }
  }, [currentIndex, currentQ])

  // Timer countdown
  useEffect(() => {
    if (isCompleted || !currentQ || selectedOption !== null) return

    setTimeLeft(QUESTION_TIME_SECONDS)
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, isCompleted, selectedOption])

  const handleTimeout = () => {
    if (!currentQ) return
    setSelectedOption(-1) // Indicates timeout
    updateLeitnerWord(currentQ.word.id, false)

    setTimeout(() => {
      advance()
    }, 800)
  }

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || !currentQ) return
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedOption(idx)
    const isCorrect = idx === currentQ.correctIndex

    if (isCorrect) {
      setScore((s) => s + 10 + timeLeft * 2) // Bonus points for speed
      updateLeitnerWord(currentQ.word.id, true)
    } else {
      updateLeitnerWord(currentQ.word.id, false)
    }

    setTimeout(() => {
      advance()
    }, 700)
  }

  const advance = () => {
    setSelectedOption(null)
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
      setTimeLeft(QUESTION_TIME_SECONDS)
    } else {
      setIsCompleted(true)
    }
  }

  if (questions.length === 0) return null

  // Timer percentage for the red progress bar matching Screenshot 5
  const timerPercent = (timeLeft / QUESTION_TIME_SECONDS) * 100

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar matching Screenshot 5 */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon size={20} />
          Speed Quiz
        </button>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold text-muted-foreground">
          <div>
            Question: <span className="font-bold text-foreground">{currentIndex + 1}/{questions.length}</span>
          </div>
          <div>
            Score: <span className="font-bold text-foreground">{score}</span>
          </div>
        </div>
      </div>

      {/* Countdown Timer Bar matching Screenshot 5 */}
      <div className="w-full bg-border/40 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${
            timeLeft <= 3 ? 'bg-rose-500 animate-pulse' : 'bg-rose-500'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {isCompleted ? (
        /* Results Card */
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <BoltIcon size={36} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Speed Quiz Finished!</h3>
          <p className="text-sm text-muted-foreground">
            Total Score: <span className="text-foreground font-bold">{score}</span> points.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 rounded-2xl font-semibold"
            >
              Back to Modes
            </Button>
            <Button
              onClick={() => {
                setIsCompleted(false)
                setCurrentIndex(0)
                setScore(0)
                setTimeLeft(QUESTION_TIME_SECONDS)
              }}
              className="flex-1 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90"
            >
              Play Again
            </Button>
          </div>
        </div>
      ) : (
        /* Question View matching Screenshot 5 */
        <div className="space-y-6">
          {/* Centered seconds left matching Screenshot 5 */}
          <div className="text-center">
            <span
              className={`text-lg font-black tracking-tight ${
                timeLeft <= 3 ? 'text-rose-500 animate-bounce' : 'text-foreground'
              }`}
            >
              {timeLeft}s
            </span>

            {/* Word Heading */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-3 mb-2">
              {currentQ.word.word}
            </h2>

            {/* Listen button matching Screenshot 5 */}
            <button
              type="button"
              onClick={() => speakWord(currentQ.word.word)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-rose-500/10"
            >
              <VolumeLoudIcon size={16} />
              Listen
            </button>
          </div>

          {/* 2x2 Options Grid matching Screenshot 5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx
              const isCorrect = idx === currentQ.correctIndex
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
                  onClick={() => handleSelectOption(idx)}
                  disabled={selectedOption !== null}
                  className={`min-h-[80px] p-4 rounded-2xl border text-left transition-all duration-150 flex items-center justify-start cursor-pointer active:scale-[0.99] ${stateClass}`}
                >
                  <p className="text-xs sm:text-sm font-medium line-clamp-3 leading-relaxed">
                    {option}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
