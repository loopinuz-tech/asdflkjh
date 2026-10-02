import { useState, useEffect } from 'react'
import {
  AltArrowLeftIcon,
  CheckCircleIcon,
  StarsIcon,
  VolumeLoudIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord, updateLeitnerWord, speakWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'

interface FillBlankQuizProps {
  words: LeitnerWord[]
  onBack: () => void
}

interface BlankQuestion {
  word: LeitnerWord
  sentenceWithBlank: string
  options: string[]
  correctIndex: number
}

export function FillBlankQuiz({ words, onBack }: FillBlankQuizProps) {
  const [questions, setQuestions] = useState<BlankQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (words.length === 0) return
    const eligibleWords = words.filter((w) => w.example_sentence || w.context_sentence)
    const pool = eligibleWords.length >= 4 ? eligibleWords : words

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 15)

    const list: BlankQuestion[] = shuffled.map((w) => {
      const sentence = w.example_sentence || w.context_sentence || `The speaker used the term "${w.word}" in formal discourse.`
      // Replace target word (case-insensitive) with blank _______
      const regex = new RegExp(`\\b${w.word}\\b`, 'gi')
      let blanked = sentence.replace(regex, '_______')
      if (!blanked.includes('_______')) {
        blanked = `${sentence} (Target word: _______)`
      }

      // Distractors
      const others = words.filter((ow) => ow.id !== w.id)
      const distractors = [...others]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((ow) => ow.word)

      const allOptions = [w.word, ...distractors].sort(() => Math.random() - 0.5)
      const correctIndex = allOptions.indexOf(w.word)

      return {
        word: w,
        sentenceWithBlank: blanked,
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

  const handleSelect = (idx: number) => {
    if (selectedOption !== null || !currentQ) return
    setSelectedOption(idx)

    const isCorrect = idx === currentQ.correctIndex
    if (isCorrect) {
      setScore((s) => s + 10)
      speakWord(currentQ.word.word)
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
          Fill in the Blank
        </button>
        <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
          {currentIndex + 1}/{questions.length} | Score:{' '}
          <span className="font-bold text-foreground">{score}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
        <div
          className="bg-purple-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isCompleted ? (
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center mx-auto">
            <StarsIcon size={32} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Quiz Complete!</h3>
          <p className="text-sm text-muted-foreground">
            You scored {score} points on fill-in-the-blank questions.
          </p>
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
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-md space-y-6">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">
              Context Sentence
            </span>
            <p className="text-lg sm:text-xl font-medium text-foreground mt-4 leading-relaxed">
              "{currentQ.sentenceWithBlank}"
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Hint: {currentQ.word.definition}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
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
                  className={`p-4 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all duration-150 cursor-pointer active:scale-[0.99] ${stateClass}`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
