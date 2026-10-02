import { useState, useEffect } from 'react'
import {
  AltArrowLeftIcon,
  CloseCircleIcon,
  CheckCircleIcon,
  StarsIcon,
  VolumeLoudIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord, updateLeitnerWord, speakWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'

interface TrueFalseQuizProps {
  words: LeitnerWord[]
  onBack: () => void
}

interface QuestionItem {
  word: LeitnerWord
  displayedDefinition: string
  isActuallyCorrect: boolean
}

export function TrueFalseQuiz({ words, onBack }: TrueFalseQuizProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (words.length === 0) return
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 15)

    const list: QuestionItem[] = shuffled.map((w, i) => {
      // 50% chance of true definition, 50% chance of mismatched definition
      const isCorrect = Math.random() > 0.45
      if (isCorrect || words.length === 1) {
        return {
          word: w,
          displayedDefinition: w.definition,
          isActuallyCorrect: true,
        }
      } else {
        // pick another random word's definition
        const otherWords = words.filter((ow) => ow.id !== w.id)
        const fake = otherWords[Math.floor(Math.random() * otherWords.length)]
        return {
          word: w,
          displayedDefinition: fake?.definition || w.definition,
          isActuallyCorrect: false,
        }
      }
    })

    setQuestions(list)
    setCurrentIndex(0)
    setScore(0)
    setIsCompleted(false)
  }, [words])

  const currentQ = questions[currentIndex]

  const handleAnswer = (userSaidTrue: boolean) => {
    if (!currentQ || feedback !== null) return

    const correct = userSaidTrue === currentQ.isActuallyCorrect
    setFeedback(correct ? 'correct' : 'wrong')

    if (correct) {
      setScore((s) => s + 1)
      updateLeitnerWord(currentQ.word.id, true)
    } else {
      updateLeitnerWord(currentQ.word.id, false)
    }

    setTimeout(() => {
      setFeedback(null)
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsCompleted(true)
      }
    }, 600)
  }

  if (questions.length === 0) return null

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar matching Screenshot 4 */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-muted-foreground pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon size={18} />
          Back
        </button>
        <div>
          {currentIndex + 1}/{questions.length} | Score:{' '}
          <span className="font-bold text-foreground">{score}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isCompleted ? (
        /* Results Card */
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircleIcon size={32} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Quiz Finished!</h3>
          <p className="text-sm text-muted-foreground">
            You scored {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
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
              }}
              className="flex-1 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90"
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        /* Question Card matching Screenshot 4 */
        <div
          className={`p-6 sm:p-10 rounded-3xl bg-card border transition-all duration-200 shadow-md ${
            feedback === 'correct'
              ? 'border-emerald-500 ring-4 ring-emerald-500/20'
              : feedback === 'wrong'
              ? 'border-rose-500 ring-4 ring-rose-500/20 animate-shake'
              : 'border-border/80'
          }`}
        >
          {/* Word Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {currentQ.word.word}
              </h2>
              <button
                type="button"
                onClick={() => speakWord(currentQ.word.word)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Listen pronunciation"
              >
                <VolumeLoudIcon size={20} />
              </button>
            </div>
            <div className="w-12 h-1 bg-primary/40 rounded-full mx-auto mt-2" />
          </div>

          <div className="w-full border-t border-border/50 my-6" />

          {/* Definition statement */}
          <div className="text-center my-8 min-h-[70px] flex items-center justify-center">
            <p className="text-base sm:text-lg font-medium text-foreground/90 max-w-lg leading-relaxed">
              {currentQ.displayedDefinition}
            </p>
          </div>

          {/* Two Large Action Buttons matching Screenshot 4 */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* False / Incorrect Button */}
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              className="p-5 sm:p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloseCircleIcon size={24} />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-foreground">
                FALSE
              </span>
            </button>

            {/* True / Correct Button */}
            <button
              type="button"
              onClick={() => handleAnswer(true)}
              className="p-5 sm:p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircleIcon size={24} />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-foreground">
                TRUE
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
