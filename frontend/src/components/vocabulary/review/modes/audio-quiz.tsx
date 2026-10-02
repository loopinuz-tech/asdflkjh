import { useState, useEffect } from 'react'
import {
  AltArrowLeftIcon,
  VolumeLoudIcon,
  CheckCircleIcon,
  StarsIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord, updateLeitnerWord, speakWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'

interface AudioQuizProps {
  words: LeitnerWord[]
  onBack: () => void
}

interface AudioQuestion {
  word: LeitnerWord
  options: string[]
  correctIndex: number
}

export function AudioQuiz({ words, onBack }: AudioQuizProps) {
  const [questions, setQuestions] = useState<AudioQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (words.length === 0) return
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 15)

    const list: AudioQuestion[] = shuffled.map((w) => {
      const others = words.filter((ow) => ow.id !== w.id)
      const distractors = [...others]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((ow) => ow.definition)

      while (distractors.length < 3) {
        distractors.push('Alternative definition not applicable.')
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
    setIsCompleted(false)
  }, [words])

  const currentQ = questions[currentIndex]

  // Play audio on new question
  useEffect(() => {
    if (currentQ?.word) {
      speakWord(currentQ.word.word)
    }
  }, [currentIndex, currentQ])

  const handleSelect = (idx: number) => {
    if (selectedOption !== null || !currentQ) return
    setSelectedOption(idx)

    const isCorrect = idx === currentQ.correctIndex
    if (isCorrect) {
      setScore((s) => s + 10)
      updateLeitnerWord(currentQ.word.id, true)
    } else {
      updateLeitnerWord(currentQ.word.id, false)
    }

    setTimeout(() => {
      setSelectedOption(null)
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsCompleted(true)
      }
    }, 700)
  }

  if (questions.length === 0) return null

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon size={20} />
          Audio Quiz
        </button>
        <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
          {currentIndex + 1}/{questions.length} | Score:{' '}
          <span className="font-bold text-foreground">{score}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isCompleted ? (
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto">
            <VolumeLoudIcon size={32} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Audio Quiz Finished!</h3>
          <p className="text-sm text-muted-foreground">Total Score: {score} points.</p>
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
        <div className="space-y-6">
          {/* Animated Audio Prompt Box */}
          <div className="text-center p-8 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => speakWord(currentQ.word.word)}
              className="w-20 h-20 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-500/25 active:scale-95"
              title="Click to replay audio"
            >
              <VolumeLoudIcon size={38} className="animate-pulse" />
            </button>
            <div className="text-sm font-bold text-foreground">Click to replay pronunciation</div>
            <div className="text-xs text-muted-foreground">
              Select the definition that matches the spoken word
            </div>
          </div>

          {/* 4 Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt, idx) => {
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
                  onClick={() => handleSelect(idx)}
                  disabled={selectedOption !== null}
                  className={`min-h-[80px] p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.99] flex items-center ${stateClass}`}
                >
                  <p className="line-clamp-3 leading-relaxed">{opt}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
