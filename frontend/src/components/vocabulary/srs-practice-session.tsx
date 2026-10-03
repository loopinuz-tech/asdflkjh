import { useState, useEffect, useMemo, useRef } from 'react'
import {
  VolumeLoudIcon,
  AltArrowLeftIcon,
  CloseCircleIcon,
  BoxIcon,
  CupStarIcon,
  BoltIcon,
  StarsIcon,
  EyeIcon,
  GamepadIcon,
} from '@solar-icons/react/bold-duotone'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { recordWordReview } from '@/actions/vocabulary'

export interface SRSPracticeSessionProps {
  mode: string
  words: any[]
  userVocabMap: Map<string, { status: string; mastery_level: number }>
  onExit: () => void
  onWordUpdated?: (wordId: string, newLevel: number) => void
}

const CYCLE_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
}

const KEYBOARD_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z'],
]

export function SRSPracticeSession({
  mode,
  words,
  userVocabMap,
  onExit,
  onWordUpdated,
}: SRSPracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isWordRevealed, setIsWordRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  // Spaced Repetition Ratings
  const [ratings, setRatings] = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  // Word Matching state
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null)
  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'success' | 'wrong'>('idle')
  const [matchedIds, setMatchedIds] = useState<string[]>([])

  // True or False state
  const [tfFeedback, setTfFeedback] = useState<'correct' | 'wrong' | null>(null)

  // Speed Quiz / Multiple choice state
  const [quizTimer, setQuizTimer] = useState(10)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null)

  // Spelling test state
  const [spellingInput, setSpellingInput] = useState('')
  const [spellingFeedback, setSpellingFeedback] = useState<'correct' | 'wrong' | null>(null)

  // Marathon state (5 stages)
  const [marathonStage, setMarathonStage] = useState(1)

  // Hangman (Odam osish) state
  const [hangmanGuessed, setHangmanGuessed] = useState<Set<string>>(new Set())
  const [hangmanMistakes, setHangmanMistakes] = useState(0)
  const [hangmanStatus, setHangmanStatus] = useState<'playing' | 'won' | 'lost'>('playing')

  const currentWord = words[currentIndex] || words[0]

  // Determine current box number
  const currentBox = useMemo(() => {
    if (!currentWord) return 1
    const uv = userVocabMap.get(currentWord.id)
    return Math.min(5, Math.max(1, uv?.mastery_level || currentWord.box_number || 4))
  }, [currentWord, userVocabMap])

  const cycleDays = CYCLE_DAYS[currentBox] || 14

  // Audio player
  const playWordAudio = (wordText?: string, audioUrl?: string) => {
    const targetWord = wordText || currentWord?.word
    if (!targetWord) return

    setIsPlayingAudio(true)
    setTimeout(() => setIsPlayingAudio(false), 1200)

    try {
      if (audioUrl) {
        const a = new Audio(audioUrl)
        a.play().catch(() => speakWord(targetWord))
      } else {
        const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(targetWord)}&type=2`
        const a = new Audio(youdaoUrl)
        a.play().catch(() => speakWord(targetWord))
      }
    } catch {
      speakWord(targetWord)
    }
  }

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  // Handle Spaced Repetition (Leitner) rating
  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setRatings((r) => ({ ...r, [rating]: r[rating] + 1 }))

    let newLevel = currentBox
    if (rating === 'again') newLevel = 1
    else if (rating === 'hard') newLevel = currentBox
    else if (rating === 'good') newLevel = Math.min(5, currentBox + 1)
    else if (rating === 'easy') newLevel = 5

    if (currentWord?.id) {
      recordWordReview(currentWord.id, rating).catch((err) =>
        console.warn('SRS record sync:', err)
      )
      if (onWordUpdated) onWordUpdated(currentWord.id, newLevel)
    }

    setIsWordRevealed(false)

    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setIsFinished(true)
    }
  }

  // Word Matching Pairs
  const matchingPairs = useMemo(() => {
    if (mode !== 'word_matching' && (mode !== 'marathon' || marathonStage !== 2)) return []
    const pool = words.filter((w) => !matchedIds.includes(w.id)).slice(0, 4)
    return pool
  }, [mode, words, matchedIds, marathonStage])

  // Shuffled definitions for matching
  const shuffledDefs = useMemo(() => {
    return [...matchingPairs].sort(() => 0.5 - Math.random())
  }, [matchingPairs])

  const handlePairCheck = (wordId: string, defId: string) => {
    if (wordId === defId) {
      setMatchingStatus('success')
      setScore((s) => s + 10)
      setTimeout(() => {
        setMatchedIds((prev) => {
          const next = [...prev, wordId]
          if (next.length >= words.length) {
            if (mode === 'marathon' && marathonStage < 5) {
              setMarathonStage((s) => s + 1)
              setMatchedIds([])
            } else {
              setIsFinished(true)
            }
          }
          return next
        })
        setSelectedWordId(null)
        setSelectedDefId(null)
        setMatchingStatus('idle')
      }, 500)
    } else {
      setMatchingStatus('wrong')
      setTimeout(() => {
        setSelectedWordId(null)
        setSelectedDefId(null)
        setMatchingStatus('idle')
      }, 700)
    }
  }

  // True or False logic
  const tfQuestion = useMemo(() => {
    if (!currentWord) return { isCorrect: true, displayDef: '' }
    const shouldBeCorrect = currentIndex % 2 === 0
    if (shouldBeCorrect || words.length <= 1) {
      return {
        isCorrect: true,
        displayDef: currentWord.definition || currentWord.translation_uz || '',
      }
    } else {
      const otherWord = words[(currentIndex + 1) % words.length]
      return {
        isCorrect: false,
        displayDef: otherWord.definition || otherWord.translation_uz || '',
      }
    }
  }, [currentWord, currentIndex, words])

  const handleTfAnswer = (userSaidTrue: boolean) => {
    const isRight = userSaidTrue === tfQuestion.isCorrect
    setTfFeedback(isRight ? 'correct' : 'wrong')
    if (isRight) setScore((s) => s + 10)

    setTimeout(() => {
      setTfFeedback(null)
      if (currentIndex < words.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        if (mode === 'marathon' && marathonStage < 5) {
          setMarathonStage((s) => s + 1)
          setCurrentIndex(0)
        } else {
          setIsFinished(true)
        }
      }
    }, 700)
  }

  // Speed Quiz options
  const quizOptions = useMemo(() => {
    if (!currentWord) return []
    const correctDef = currentWord.definition || currentWord.translation_uz || currentWord.word
    const distractors = words
      .filter((w) => w.id !== currentWord.id)
      .map((w) => w.definition || w.translation_uz || w.word)
      .slice(0, 3)

    return [correctDef, ...distractors].sort(() => 0.5 - Math.random())
  }, [currentWord, words])

  // Timer for Speed Quiz
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (mode === 'speed_quiz' || (mode === 'marathon' && marathonStage === 4)) {
      setQuizTimer(10)
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setQuizTimer((t) => {
          if (t <= 1) {
            handleQuizAnswer('')
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, mode, marathonStage])

  const handleQuizAnswer = (chosen: string) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSelectedOption(chosen)
    const correctDef = currentWord.definition || currentWord.translation_uz || currentWord.word
    const isRight = chosen === correctDef

    setQuizFeedback(isRight ? 'correct' : 'wrong')
    if (isRight) setScore((s) => s + 15)

    setTimeout(() => {
      setSelectedOption(null)
      setQuizFeedback(null)
      if (currentIndex < words.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        if (mode === 'marathon' && marathonStage < 5) {
          setMarathonStage((s) => s + 1)
          setCurrentIndex(0)
        } else {
          setIsFinished(true)
        }
      }
    }, 800)
  }

  // Spelling submit
  const handleSpellingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWord) return
    const isRight =
      spellingInput.trim().toLowerCase() === currentWord.word.trim().toLowerCase()
    setSpellingFeedback(isRight ? 'correct' : 'wrong')
    if (isRight) setScore((s) => s + 20)

    setTimeout(() => {
      setSpellingInput('')
      setSpellingFeedback(null)
      if (currentIndex < words.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        if (mode === 'marathon' && marathonStage < 5) {
          setMarathonStage((s) => s + 1)
          setCurrentIndex(0)
        } else {
          setIsFinished(true)
        }
      }
    }, 1000)
  }

  // Hangman word letters
  const targetLetters = useMemo(() => {
    if (!currentWord?.word) return []
    return currentWord.word.toUpperCase().split('')
  }, [currentWord])

  // Reset hangman when index changes
  useEffect(() => {
    setHangmanGuessed(new Set())
    setHangmanMistakes(0)
    setHangmanStatus('playing')
  }, [currentIndex])

  // Handle letter guess
  const handleHangmanGuess = (letter: string) => {
    if (hangmanStatus !== 'playing' || hangmanGuessed.has(letter)) return

    const newGuessed = new Set(hangmanGuessed)
    newGuessed.add(letter)
    setHangmanGuessed(newGuessed)

    const isMatch = targetLetters.includes(letter)
    if (!isMatch) {
      const nextMistakes = hangmanMistakes + 1
      setHangmanMistakes(nextMistakes)
      if (nextMistakes >= 6) {
        setHangmanStatus('lost')
        playWordAudio(currentWord.word, currentWord.audio_url)
        if (currentWord?.id) {
          recordWordReview(currentWord.id, 'again').catch(() => {})
        }
      }
    } else {
      const won = targetLetters.every((ch) => {
        if (!/[A-Z]/.test(ch)) return true
        return newGuessed.has(ch)
      })
      if (won) {
        setHangmanStatus('won')
        setScore((s) => s + 20)
        playWordAudio(currentWord.word, currentWord.audio_url)
        if (currentWord?.id) {
          recordWordReview(currentWord.id, 'good').catch(() => {})
          if (onWordUpdated) onWordUpdated(currentWord.id, Math.min(5, currentBox + 1))
        }
      }
    }
  }

  // Physical keyboard listener for Hangman
  useEffect(() => {
    if (mode !== 'hangman') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey || e.altKey || e.metaKey) return

      const key = e.key.toUpperCase()
      if (/^[A-Z]$/.test(key)) {
        handleHangmanGuess(key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, hangmanStatus, hangmanGuessed, hangmanMistakes, targetLetters])

  const handleHangmanNext = () => {
    setHangmanGuessed(new Set())
    setHangmanMistakes(0)
    setHangmanStatus('playing')
    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setIsFinished(true)
    }
  }

  if (words.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 bg-card border border-border rounded-2xl sm:rounded-3xl text-center space-y-4 shadow-sm flex-1 flex flex-col justify-center">
        <FoxMascot variant="thinking" size="md" className="mx-auto" />
        <h3 className="text-lg sm:text-xl font-bold text-foreground">No words in this set</h3>
        <p className="text-xs text-muted-foreground">
          There are no words available for this review set. Please pick another set.
        </p>
        <button
          onClick={onExit}
          className="w-full py-2.5 rounded-xl bg-primary text-black font-bold text-xs cursor-pointer"
        >
          Return to Vocabulary Bank
        </button>
      </div>
    )
  }

  // Finished Screen
  if (isFinished) {
    return (
      <div className="w-full max-w-lg mx-auto my-auto p-5 sm:p-8 bg-card border border-border rounded-2xl sm:rounded-3xl text-center shadow-lg space-y-5 sm:space-y-6 flex-1 flex flex-col justify-center">
        <FoxMascot variant="celebration" size="lg" className="mx-auto" />
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">Review Complete!</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            You successfully reviewed {words.length} academic IELTS words today.
          </p>
        </div>

        {mode === 'spaced_repetition' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
              <div className="text-lg sm:text-xl font-extrabold text-rose-600">{ratings.again}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">
                Again
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
              <div className="text-lg sm:text-xl font-extrabold text-amber-600">{ratings.hard}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">
                Hard
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
              <div className="text-lg sm:text-xl font-extrabold text-yellow-600 dark:text-yellow-400">
                {ratings.good}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">
                Good
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
              <div className="text-lg sm:text-xl font-extrabold text-emerald-600">{ratings.easy}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">
                Easy
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center justify-around">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">{score}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">
                Score Points
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-primary">{words.length}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">
                Mastered
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0)
              setIsFinished(false)
              setIsWordRevealed(false)
              setRatings({ again: 0, hard: 0, good: 0, easy: 0 })
              setScore(0)
              setMatchedIds([])
              setHangmanGuessed(new Set())
              setHangmanMistakes(0)
              setHangmanStatus('playing')
            }}
            className="w-full sm:w-1/2 py-2.5 rounded-xl border border-border bg-secondary font-bold text-xs hover:bg-secondary/80 cursor-pointer active:scale-98"
          >
            Review Again
          </button>
          <button
            onClick={onExit}
            className="w-full sm:w-1/2 py-2.5 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary/90 cursor-pointer shadow-xs active:scale-98"
          >
            Return to Vocabulary
          </button>
        </div>
      </div>
    )
  }

  // MODE 1: Leitner Spaced Repetition (Screenshot 4)
  if (mode === 'spaced_repetition' || (mode === 'marathon' && marathonStage === 1)) {
    const uzbekMeaning =
      currentWord.translation_uz || currentWord.translation || currentWord.definition

    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        {/* Top Header & Progress */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
            >
              <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
              <span className="truncate max-w-[140px] sm:max-w-none">Leitner Spaced Repetition</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-[#f5f3ff] dark:bg-purple-950/60 text-[#7c3aed] dark:text-purple-300 border border-[#ddd6fe] dark:border-purple-800/40 text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-2xs">
                <BoxIcon className="w-3.5 h-3.5" size={14} />
                <span>Box {currentBox}: {cycleDays}d</span>
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg border border-border">
                {currentIndex + 1}/{words.length}
              </span>
            </div>
          </div>

          {/* Progress Bar (Yellow) */}
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Middle Flashcard (Expands and centers on mobile) */}
        <div className="my-auto py-2 sm:py-6 flex-1 flex flex-col justify-center">
          <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-4 relative w-full">
            {/* Top badges and audio speaker */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                {currentWord.part_of_speech && (
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] sm:text-xs font-semibold">
                    {currentWord.part_of_speech}
                  </span>
                )}
                {currentWord.topic && (
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground truncate max-w-[140px] sm:max-w-none">
                    {currentWord.topic}
                  </span>
                )}
              </div>

              <button
                onClick={() => playWordAudio(currentWord.word, currentWord.audio_url)}
                className={`p-2 rounded-xl border border-border/80 text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0 ${
                  isPlayingAudio ? 'ring-2 ring-primary scale-105' : ''
                }`}
                title="Pronounce word"
              >
                <VolumeLoudIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </button>
            </div>

            {/* DEFINITION (Screenshot 4) */}
            <div className="space-y-1">
              <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-500 dark:text-amber-400">
                DEFINITION
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                {uzbekMeaning}
              </p>
            </div>

            {/* EXAMPLE (Screenshot 4) */}
            {currentWord.example_sentence && (
              <div className="space-y-1">
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  EXAMPLE
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-[#fffbeb] dark:bg-amber-950/20 border border-[#fde68a] dark:border-amber-900/40 p-3 sm:p-4 text-xs sm:text-sm text-foreground/90 italic font-normal">
                  "{currentWord.example_sentence}"
                </div>
              </div>
            )}

            {/* Target Word Reveal Toggle */}
            <div className="pt-1">
              {isWordRevealed ? (
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/30 text-center animate-in zoom-in-95">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Target Word
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-foreground capitalize mt-0.5">
                    {currentWord.word}
                  </h3>
                  {currentWord.pronunciation && (
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {currentWord.pronunciation}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsWordRevealed(true)}
                  className="w-full py-2 sm:py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <EyeIcon className="w-4 h-4 text-primary" size={16} />
                  <span>Tap to reveal word ({currentWord.word.length} letters)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Rating Controls (Pinned comfortably above bottom nav) */}
        <div className="space-y-2 pt-1 pb-1">
          <p className="text-center text-[11px] sm:text-xs text-muted-foreground font-medium">
            Rate how well you recalled this word below
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* Again */}
            <button
              onClick={() => handleRating('again')}
              className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#fef2f2] dark:bg-rose-950/30 border border-[#fecdd3] dark:border-rose-900/50 hover:bg-[#fee2e2] text-center transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <div className="font-black text-xs sm:text-sm text-[#e11d48]">Again</div>
              <div className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                Reset to Box 1 (1d)
              </div>
            </button>

            {/* Hard */}
            <button
              onClick={() => handleRating('hard')}
              className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#fffbeb] dark:bg-amber-950/30 border border-[#fde68a] dark:border-amber-900/50 hover:bg-[#fef3c7] text-center transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <div className="font-black text-xs sm:text-sm text-[#d97706]">Hard</div>
              <div className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                Stay Box {currentBox} (2d)
              </div>
            </button>

            {/* Good */}
            <button
              onClick={() => handleRating('good')}
              className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#fefce8] dark:bg-yellow-950/30 border border-[#fef08a] dark:border-yellow-900/50 hover:bg-[#fef9c3] text-center transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <div className="font-black text-xs sm:text-sm text-[#ca8a04]">Good</div>
              <div className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                Advance to Box {Math.min(5, currentBox + 1)}
              </div>
            </button>

            {/* Easy */}
            <button
              onClick={() => handleRating('easy')}
              className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#bbf7d0] dark:border-emerald-900/50 hover:bg-[#dcfce7] text-center transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <div className="font-black text-xs sm:text-sm text-[#059669]">Easy</div>
              <div className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                Jump to Box 5
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // MODE 2: Word Matching (Screenshot 5)
  if (mode === 'word_matching' || (mode === 'marathon' && marathonStage === 2)) {
    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
              <span>Word Matching</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-bold text-foreground">
                Score: {score}
              </span>
              <button
                onClick={onExit}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <CloseCircleIcon className="w-5 h-5" size={20} />
              </button>
            </div>
          </div>

          <div className="text-center space-y-0.5">
            <h2 className="text-base sm:text-xl font-black text-foreground">
              Match words and definitions
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Select a definition on the left and pair it with the corresponding word on the right
            </p>
          </div>
        </div>

        {/* Matching Cards (2 columns side-by-side on mobile) */}
        <div className="my-auto py-2 sm:py-6 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
            {/* Definitions column */}
            <div className="space-y-2 sm:space-y-2.5">
              {shuffledDefs.map((pair) => {
                const isSelected = selectedDefId === pair.id
                const isMatched = matchedIds.includes(pair.id)
                if (isMatched) return null

                return (
                  <div
                    key={`def-${pair.id}`}
                    onClick={() => {
                      setSelectedDefId(pair.id)
                      if (selectedWordId) {
                        handlePairCheck(selectedWordId, pair.id)
                      }
                    }}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-left space-y-1 min-h-[85px] sm:min-h-[105px] flex flex-col justify-center active:scale-[0.98] ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-400'
                        : 'border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/15 hover:border-blue-400'
                    } ${
                      matchingStatus === 'wrong' && isSelected ? 'animate-shake border-rose-500' : ''
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      DEFINITION
                    </span>
                    <p className="text-xs sm:text-sm text-foreground font-medium leading-snug line-clamp-4">
                      {pair.translation_uz || pair.translation || pair.definition}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Words column */}
            <div className="space-y-2 sm:space-y-2.5">
              {matchingPairs.map((pair) => {
                const isSelected = selectedWordId === pair.id
                const isMatched = matchedIds.includes(pair.id)
                if (isMatched) return null

                return (
                  <div
                    key={`word-${pair.id}`}
                    onClick={() => {
                      setSelectedWordId(pair.id)
                      if (selectedDefId) {
                        handlePairCheck(pair.id, selectedDefId)
                      }
                    }}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-center space-y-1 flex flex-col items-center justify-center min-h-[85px] sm:min-h-[105px] active:scale-[0.98] ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 shadow-xs ring-2 ring-rose-400'
                        : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/15 hover:border-rose-400'
                    } ${
                      matchingStatus === 'wrong' && isSelected ? 'animate-shake border-rose-500' : ''
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      WORD
                    </span>
                    <h4 className="text-xs sm:text-base font-bold text-foreground capitalize">
                      {pair.word}
                    </h4>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom helper */}
        <div className="text-center text-[10px] text-muted-foreground pb-1">
          {matchingPairs.length} pairs remaining in this set
        </div>
      </div>
    )
  }

  // MODE 3: True or False
  if (mode === 'true_or_false' || (mode === 'marathon' && marathonStage === 3)) {
    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
              <span>True or False</span>
            </button>
            <span className="text-xs font-bold text-foreground">Score: {score}</span>
          </div>

          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all rounded-full"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="my-auto py-2 sm:py-6 flex-1 flex flex-col justify-center">
          <div
            className={`bg-card border rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center space-y-3 sm:space-y-4 transition-all shadow-xs ${
              tfFeedback === 'correct'
                ? 'border-emerald-500 bg-emerald-50/20'
                : tfFeedback === 'wrong'
                ? 'border-rose-500 bg-rose-50/20'
                : 'border-border'
            }`}
          >
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
              Question {currentIndex + 1} of {words.length}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-foreground capitalize">
              {currentWord.word}
            </h3>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-secondary/50 border border-border text-xs sm:text-sm text-foreground/90 font-medium">
              "{tfQuestion.displayDef}"
            </div>
            <p className="text-[11px] text-muted-foreground">
              Does the definition accurately describe this IELTS word?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pb-1">
          <button
            onClick={() => handleTfAnswer(false)}
            className="py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-600 font-extrabold text-xs sm:text-sm hover:bg-rose-100 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            False ✕
          </button>
          <button
            onClick={() => handleTfAnswer(true)}
            className="py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-extrabold text-xs sm:text-sm hover:bg-emerald-100 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            True ✓
          </button>
        </div>
      </div>
    )
  }

  // MODE 4: Speed Quiz (10s Challenge)
  if (mode === 'speed_quiz' || (mode === 'marathon' && marathonStage === 4)) {
    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
              <span>Speed Quiz</span>
            </button>
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
              <BoltIcon className="w-4 h-4" size={16} /> {quizTimer}s left
            </span>
          </div>

          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(quizTimer / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="my-auto py-2 sm:py-6 flex-1 flex flex-col justify-center space-y-3">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-amber-500">IELTS TARGET WORD</span>
            <h3 className="text-xl sm:text-2xl font-black text-foreground capitalize">
              {currentWord.word}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Select the correct definition before time expires</p>
          </div>

          <div className="space-y-2">
            {quizOptions.map((opt, i) => {
              const isChosen = selectedOption === opt
              const isCorrect =
                opt === (currentWord.definition || currentWord.translation_uz || currentWord.word)

              let btnStyle = 'border-border bg-card hover:border-primary/50'
              if (quizFeedback && isChosen) {
                btnStyle = isCorrect
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                  : 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm transition-all cursor-pointer active:scale-[0.99] shadow-2xs ${btnStyle}`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pb-1">
          Streak Score: {score}
        </div>
      </div>
    )
  }

  // MODE 5: Fill in the Blank
  if (mode === 'fill_in_the_blank') {
    const maskedSentence = currentWord.example_sentence
      ? currentWord.example_sentence.replace(
          new RegExp(`\\b${currentWord.word}\\b`, 'gi'),
          '____________'
        )
      : `The academic concept ____________ is crucial in IELTS.`

    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
            <span>Fill in the Blank</span>
          </button>
          <span className="text-xs font-bold text-foreground">Score: {score}</span>
        </div>

        <div className="my-auto py-2 sm:py-6 flex-1 flex flex-col justify-center space-y-3">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-2.5 shadow-xs">
            <span className="text-[10px] font-black uppercase text-purple-500 flex items-center gap-1">
              <StarsIcon className="w-3.5 h-3.5" size={14} /> CONTEXT MASTERY
            </span>
            <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
              "{maskedSentence}"
            </p>
            <div className="pt-1 text-[11px] text-muted-foreground">
              Definition: {currentWord.translation_uz || currentWord.definition}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {[
              currentWord.word,
              ...words.filter((w) => w.id !== currentWord.id).map((w) => w.word).slice(0, 3),
            ]
              .sort(() => 0.5 - Math.random())
              .map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const isRight = opt === currentWord.word
                    if (isRight) setScore((s) => s + 10)
                    if (currentIndex < words.length - 1) {
                      setCurrentIndex((idx) => idx + 1)
                    } else {
                      setIsFinished(true)
                    }
                  }}
                  className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-border hover:border-purple-400 bg-card hover:bg-purple-50/20 text-center font-bold text-xs sm:text-sm text-foreground transition-all cursor-pointer shadow-xs active:scale-95 capitalize"
                >
                  {opt}
                </button>
              ))}
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pb-1">
          Word {currentIndex + 1} of {words.length}
        </div>
      </div>
    )
  }

  // MODE 6: Audio Quiz
  if (mode === 'audio_quiz') {
    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
            <span>Audio Quiz</span>
          </button>
          <span className="text-xs font-bold text-foreground">Score: {score}</span>
        </div>

        <div className="my-auto py-2 sm:py-6 flex-1 flex flex-col justify-center space-y-3">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center space-y-3 shadow-xs">
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audio_url)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <VolumeLoudIcon className="w-8 h-8 sm:w-10 sm:h-10" size={36} />
            </button>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
              Tap to replay pronunciation and choose the matching definition
            </p>
          </div>

          <div className="space-y-2">
            {quizOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  const isRight =
                    opt === (currentWord.definition || currentWord.translation_uz || currentWord.word)
                  if (isRight) setScore((s) => s + 10)
                  if (currentIndex < words.length - 1) {
                    setCurrentIndex((idx) => idx + 1)
                  } else {
                    setIsFinished(true)
                  }
                }}
                className="w-full text-left p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-border hover:border-indigo-400 bg-card hover:bg-indigo-50/20 text-xs sm:text-sm transition-all cursor-pointer active:scale-98 shadow-xs"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pb-1">
          Word {currentIndex + 1} of {words.length}
        </div>
      </div>
    )
  }

  // MODE 7: Spelling Test
  if (mode === 'spelling_test' || (mode === 'marathon' && marathonStage === 5)) {
    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
            <span>Spelling Test</span>
          </button>
          <span className="text-xs font-bold text-foreground">Score: {score}</span>
        </div>

        <div className="my-auto py-2 sm:py-6 flex-1 flex flex-col justify-center">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center space-y-3 shadow-xs">
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audio_url)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 font-bold text-xs hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <VolumeLoudIcon className="w-4 h-4" size={16} /> Listen Pronunciation
            </button>

            <div className="text-xs sm:text-sm text-foreground/90 font-medium">
              "{currentWord.translation_uz || currentWord.definition}"
            </div>

            <form onSubmit={handleSpellingSubmit} className="space-y-2.5 pt-1">
              <input
                type="text"
                autoFocus
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                placeholder="Type the exact English spelling..."
                className={`w-full px-3.5 py-2.5 rounded-xl sm:rounded-2xl border bg-background text-foreground text-center font-bold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all ${
                  spellingFeedback === 'correct'
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : spellingFeedback === 'wrong'
                    ? 'border-rose-500 bg-rose-50/20'
                    : 'border-border'
                }`}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98"
              >
                Submit Answer (Enter)
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pb-1">
          Word {currentIndex + 1} of {words.length}
        </div>
      </div>
    )
  }

  // MODE: Hangman (Odam osish — matching user screenshot)
  if (mode === 'hangman') {
    return (
      <div className="w-full flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
            <span>Hangman</span>
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-xs sm:text-sm font-extrabold text-foreground">
              Score: {score}
            </span>
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg border border-border">
              {currentIndex + 1}/{words.length}
            </span>
            <button
              onClick={onExit}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <CloseCircleIcon className="w-5 h-5" size={20} />
            </button>
          </div>
        </div>

        {/* Center Game Arena */}
        <div className="my-auto py-1 sm:py-3 flex-1 flex flex-col justify-center space-y-2.5 sm:space-y-3.5 max-w-lg mx-auto w-full">
          {/* Gallows SVG Graphic */}
          <div className="flex justify-center">
            <svg
              className="w-40 h-32 sm:w-52 sm:h-40 text-slate-600 dark:text-slate-300"
              viewBox="0 0 200 160"
              fill="none"
              stroke="currentColor"
            >
              {/* Stand & Structure */}
              <line x1="30" y1="145" x2="170" y2="145" strokeWidth="4" strokeLinecap="round" />
              <line x1="65" y1="145" x2="65" y2="18" strokeWidth="4" strokeLinecap="round" />
              <line x1="65" y1="18" x2="145" y2="18" strokeWidth="4" strokeLinecap="round" />
              <line x1="65" y1="42" x2="90" y2="18" strokeWidth="3" strokeLinecap="round" />
              {/* Rope */}
              <line
                x1="145"
                y1="18"
                x2="145"
                y2="38"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={hangmanStatus === 'won' ? 'opacity-20' : ''}
              />

              {/* Stick Figure Person based on mistakes */}
              <g
                className={`transition-colors duration-200 ${
                  hangmanStatus === 'lost'
                    ? 'text-rose-500 stroke-rose-500'
                    : hangmanStatus === 'won'
                    ? 'text-emerald-500 stroke-emerald-500'
                    : 'text-slate-800 dark:text-slate-100 stroke-slate-800 dark:stroke-slate-100'
                }`}
              >
                {/* 1. Head */}
                {hangmanMistakes >= 1 && (
                  <circle cx="145" cy="50" r="12" strokeWidth="3" fill="none" />
                )}

                {/* 2. Torso */}
                {hangmanMistakes >= 2 && (
                  <line x1="145" y1="62" x2="145" y2="102" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* 3. Left Arm */}
                {hangmanMistakes >= 3 && (
                  <line x1="145" y1="72" x2="126" y2="88" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* 4. Right Arm */}
                {hangmanMistakes >= 4 && (
                  <line x1="145" y1="72" x2="164" y2="88" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* 5. Left Leg */}
                {hangmanMistakes >= 5 && (
                  <line x1="145" y1="102" x2="128" y2="132" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* 6. Right Leg */}
                {hangmanMistakes >= 6 && (
                  <line x1="145" y1="102" x2="162" y2="132" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* Face details when lost (X eyes and frown) */}
                {hangmanStatus === 'lost' && (
                  <>
                    <line x1="140" y1="47" x2="143" y2="50" strokeWidth="2" strokeLinecap="round" />
                    <line x1="143" y1="47" x2="140" y2="50" strokeWidth="2" strokeLinecap="round" />
                    <line x1="147" y1="47" x2="150" y2="50" strokeWidth="2" strokeLinecap="round" />
                    <line x1="150" y1="47" x2="147" y2="50" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 141 57 Q 145 53 149 57" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </>
                )}

                {/* Face details when won (smile) */}
                {hangmanStatus === 'won' && (
                  <>
                    <circle cx="141" cy="48" r="1.5" fill="currentColor" />
                    <circle cx="149" cy="48" r="1.5" fill="currentColor" />
                    <path d="M 141 53 Q 145 57 149 53" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </>
                )}
              </g>
            </svg>
          </div>

          {/* Hint (English only) */}
          <div className="text-center px-3 max-w-lg mx-auto">
            <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
              <span className="font-bold text-primary">Hint:</span> '{currentWord.definition || currentWord.translation || currentWord.translation_uz}'
            </p>
          </div>

          {/* Letter Slots with Pink Underlines (Matching Screenshot) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap my-1 min-h-[46px]">
            {targetLetters.map((char, idx) => {
              const isLetter = /[A-Z]/.test(char)
              const isRevealed = !isLetter || hangmanGuessed.has(char) || hangmanStatus === 'lost'
              const isLostLetter = hangmanStatus === 'lost' && !hangmanGuessed.has(char)

              if (char === ' ') {
                return <div key={idx} className="w-2.5 sm:w-4" />
              }

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-between w-6 sm:w-8 h-8 sm:h-10 select-none"
                >
                  <span
                    className={`text-sm sm:text-xl font-black uppercase transition-all duration-150 ${
                      isLostLetter
                        ? 'text-rose-500 animate-pulse'
                        : isRevealed
                        ? 'text-foreground'
                        : 'text-transparent'
                    }`}
                  >
                    {isRevealed ? char : '_'}
                  </span>
                  <div
                    className={`w-full h-1 sm:h-1.5 rounded-full transition-colors ${
                      isLostLetter
                        ? 'bg-rose-400'
                        : isRevealed
                        ? 'bg-emerald-500'
                        : 'bg-rose-300 dark:bg-rose-500/70'
                    }`}
                  />
                </div>
              )
            })}
          </div>

          {/* On-Screen Circular Keyboard (3 Rows, Matching Screenshot) */}
          <div className="space-y-1.5 sm:space-y-2 max-w-sm sm:max-w-md mx-auto w-full px-1">
            {KEYBOARD_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center justify-center gap-1 sm:gap-1.5">
                {row.map((letter) => {
                  const isGuessed = hangmanGuessed.has(letter)
                  const isCorrect = isGuessed && targetLetters.includes(letter)
                  const isWrong = isGuessed && !targetLetters.includes(letter)

                  let btnStyle =
                    'bg-card border-border hover:border-primary/60 text-foreground hover:bg-secondary cursor-pointer shadow-2xs active:scale-95'
                  if (isCorrect) {
                    btnStyle =
                      'bg-emerald-500 text-white border-emerald-500 font-black cursor-default shadow-xs'
                  } else if (isWrong) {
                    btnStyle =
                      'bg-secondary/60 text-muted-foreground/30 border-transparent line-through cursor-not-allowed opacity-40'
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={isGuessed || hangmanStatus !== 'playing'}
                      onClick={() => handleHangmanGuess(letter)}
                      className={`w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center transition-all duration-150 ${btnStyle}`}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Status & Next Controls */}
        <div className="text-center pb-1 space-y-2">
          {hangmanStatus === 'playing' ? (
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {6 - hangmanMistakes} {6 - hangmanMistakes === 1 ? 'mistake' : 'mistakes'} remaining
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2 animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => playWordAudio(currentWord.word, currentWord.audio_url)}
                  className="p-2 sm:p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer"
                  title="Pronounce word"
                >
                  <VolumeLoudIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" size={20} />
                </button>

                <button
                  type="button"
                  onClick={handleHangmanNext}
                  className="px-5 py-2 sm:py-2.5 rounded-xl bg-primary text-black font-extrabold text-xs sm:text-sm hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  {currentIndex < words.length - 1 ? 'Next Word →' : 'View Results →'}
                </button>
              </div>

              {hangmanStatus === 'won' && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  🎉 Congratulations! You guessed the word! (+20 pts)
                </p>
              )}

              {hangmanStatus === 'lost' && (
                <p className="text-xs font-bold text-rose-500">
                  Out of attempts! The correct word was:{' '}
                  <span className="underline uppercase font-black">{currentWord.word}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // MODE 8: Marathon
  return (
    <div className="w-full flex-1 flex flex-col justify-between py-1 text-center animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon className="w-4 h-4 text-primary" size={16} />
          <span>Marathon</span>
        </button>
        <span className="text-xs font-bold text-amber-500">Stage {marathonStage}/5</span>
      </div>

      <div className="my-auto py-4 sm:py-8 flex-1 flex flex-col justify-center space-y-4">
        <CupStarIcon className="w-14 h-14 text-yellow-500 mx-auto" size={56} />
        <h3 className="text-xl sm:text-2xl font-black text-foreground">
          Marathon Stage {marathonStage} of 5
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Stage 1: Flashcards • Stage 2: Pairs • Stage 3: True/False • Stage 4: Speed • Stage 5: Spelling
        </p>
      </div>

      <button
        onClick={() => setMarathonStage((s) => Math.min(5, s + 1))}
        className="w-full py-2.5 rounded-xl bg-primary text-black font-bold text-xs cursor-pointer active:scale-95 shadow-xs"
      >
        Proceed to Next Stage
      </button>
    </div>
  )
}
