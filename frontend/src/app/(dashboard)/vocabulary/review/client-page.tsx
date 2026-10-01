import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  VolumeLoudIcon,
  CheckSquareIcon,
  AltArrowLeftIcon,
  StarsIcon,
} from '@solar-icons/react/bold-duotone'
import { Link } from 'react-router-dom'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { recordWordReview } from '@/actions/vocabulary'
import { Badge } from '@/components/ui/badge'

export function VocabularyReviewClient({ words }: { words: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [results, setResults] = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  if (words.length === 0) {
    return (
      <div className="text-center p-6 sm:p-8 bg-card border border-border rounded-2xl fox-shadow-sm max-w-md w-full mx-auto my-8">
        <FoxMascot variant="celebration" size="lg" className="mb-6 mx-auto" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">You're all caught up!</h2>
        <p className="text-muted-foreground mb-6 text-xs sm:text-sm">
          No words are due for review right now. Take a break or add new words to your deck.
        </p>
        <Link
          to="/vocabulary"
          className={buttonVariants({
            className: 'w-full rounded-xl font-bold bg-primary text-black cursor-pointer',
          })}
        >
          Return to Vocabulary Bank
        </Link>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="text-center p-6 sm:p-8 bg-card border border-border rounded-2xl fox-shadow-sm max-w-md w-full mx-auto my-8">
        <div className="w-16 h-16 bg-primary text-black shadow-md rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckSquareIcon className="w-8 h-8 text-black" size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">Review Session Complete!</h2>
        <p className="text-muted-foreground mb-6 text-xs sm:text-sm">
          You reviewed {words.length} IELTS words today. Great progress!
        </p>

        <div className="grid grid-cols-4 gap-2 mb-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 sm:p-3">
            <div className="text-lg sm:text-xl font-bold text-destructive">{results.again}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Again</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5 sm:p-3">
            <div className="text-lg sm:text-xl font-bold text-orange-500">{results.hard}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Hard</div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 sm:p-3">
            <div className="text-lg sm:text-xl font-bold text-primary">{results.good}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Good</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 sm:p-3">
            <div className="text-lg sm:text-xl font-bold text-emerald-500">{results.easy}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Easy</div>
          </div>
        </div>

        <Link
          to="/vocabulary"
          className={buttonVariants({
            className: 'w-full rounded-xl font-bold bg-primary text-black cursor-pointer',
          })}
        >
          Return to Vocabulary Bank
        </Link>
      </div>
    )
  }

  const currentWord = words[currentIndex]

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setResults((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))

    // Asynchronously record progress in database
    if (currentWord?.id) {
      recordWordReview(currentWord.id, rating).catch((err) => {
        console.error('Failed to record review:', err)
      })
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    } else {
      setIsFinished(true)
    }
  }

  const playPronunciation = () => {
    if (currentWord.audio_url) {
      const audio = new Audio(currentWord.audio_url)
      audio.play().catch(() => speakFallback(currentWord.word))
    } else {
      speakFallback(currentWord.word)
    }
  }

  const speakFallback = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(word)
      u.lang = 'en-US'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  const ipa = currentWord.pronunciation || currentWord.phonetic
  const uzbekMeaning = currentWord.translation_uz || currentWord.translation

  return (
    <div className="w-full max-w-xl mx-auto px-1 sm:px-4 space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/vocabulary"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-secondary transition-all shadow-xs cursor-pointer"
        >
          <AltArrowLeftIcon className="h-4 w-4" size={16} />
          <span>Exit Review</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-bold px-3 py-1 border-primary/40 bg-primary/10 text-primary"
          >
            Word {currentIndex + 1} of {words.length}
          </Badge>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="relative w-full min-h-[380px] sm:min-h-[420px] cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div
          className="w-full h-full min-h-[380px] sm:min-h-[420px] relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT OF CARD */}
          <div
            className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7 bg-card border-2 border-border hover:border-primary/50 rounded-2xl shadow-sm transition-colors"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg) translateZ(1px)',
            }}
          >
            <div className="w-full flex items-center justify-between text-xs gap-2">
              <span className="font-extrabold uppercase tracking-wider text-muted-foreground text-[10px]">
                {currentWord.is_new ? 'New Word' : 'Review Card'}
              </span>
              <div className="flex items-center gap-1.5">
                {currentWord.user_id && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-[10px] font-extrabold uppercase">
                    My Word
                  </span>
                )}
                {currentWord.topic && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-semibold truncate max-w-[140px]">
                    {currentWord.topic}
                  </span>
                )}
              </div>
            </div>

            <div className="text-center my-auto space-y-3 py-6">
              <div className="inline-flex items-center justify-center gap-2.5">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground capitalize">
                  {currentWord.word}
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    playPronunciation()
                  }}
                  title="Listen"
                  className="p-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary transition-colors cursor-pointer"
                >
                  <VolumeLoudIcon className="w-5 h-5 text-primary" size={20} />
                </button>
              </div>

              {currentWord.part_of_speech && (
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-xs font-bold uppercase tracking-wider">
                    {currentWord.part_of_speech}
                  </span>
                </div>
              )}

              {ipa && (
                <p className="text-sm sm:text-base text-muted-foreground font-mono">
                  {ipa}
                </p>
              )}
            </div>

            <div className="text-center pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-semibold inline-flex items-center gap-1.5">
                <StarsIcon className="w-3.5 h-3.5 text-primary" size={14} />
                <span>Tap card or click Show Answer to reveal definition</span>
              </span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div
            className="absolute inset-0 flex flex-col p-5 sm:p-7 bg-card border-2 border-primary/40 rounded-2xl shadow-sm overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1px)',
            }}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-foreground capitalize">
                    {currentWord.word}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      playPronunciation()
                    }}
                    title="Pronounce word"
                    className="p-1 rounded-lg hover:bg-secondary text-primary transition-colors cursor-pointer"
                  >
                    <VolumeLoudIcon className="w-4 h-4 text-primary" size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {currentWord.part_of_speech && (
                    <span className="px-2 py-0.2 rounded-md bg-secondary text-foreground text-[10px] font-bold uppercase">
                      {currentWord.part_of_speech}
                    </span>
                  )}
                  {ipa && (
                    <span className="text-xs text-muted-foreground font-mono">{ipa}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {currentWord.user_id && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-[10px] font-extrabold uppercase">
                    My Word
                  </span>
                )}
                {currentWord.topic && (
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-semibold truncate max-w-[120px]">
                    {currentWord.topic}
                  </span>
                )}
              </div>
            </div>

            {/* Content body */}
            <div className="space-y-3 py-3 flex-1 overflow-y-auto custom-scrollbar pr-1 text-xs">
              {/* Uzbek Meaning Highlight Banner */}
              {uzbekMeaning && (
                <div className="p-3 rounded-xl bg-primary/15 border border-primary/30 space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-primary block">
                    Uzbek Meaning:
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    {uzbekMeaning}
                  </p>
                </div>
              )}

              {/* English Definition */}
              {currentWord.definition && (
                <div>
                  <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-0.5">
                    English Definition:
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {currentWord.definition}
                  </p>
                </div>
              )}

              {/* IELTS Example Sentences */}
              {(currentWord.example_sentence ||
                currentWord.example_sentence_2 ||
                currentWord.context_sentence) && (
                <div className="space-y-1.5 pt-1 border-t border-border/50">
                  <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    Authentic IELTS Example Sentences:
                  </h4>
                  {currentWord.example_sentence && (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-secondary/40 border border-border text-[11px] text-foreground/90 italic leading-relaxed">
                      1. &ldquo;{currentWord.example_sentence}&rdquo;
                    </div>
                  )}
                  {(currentWord.example_sentence_2 || currentWord.context_sentence) && (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-secondary/40 border border-border text-[11px] text-foreground/90 italic leading-relaxed">
                      2. &ldquo;{currentWord.example_sentence_2 || currentWord.context_sentence}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center min-h-[4rem] w-full">
        {!isFlipped ? (
          <Button
            size="lg"
            onClick={() => setIsFlipped(true)}
            className="w-full h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-extrabold bg-primary hover:bg-primary/90 text-black shadow-sm cursor-pointer"
          >
            Show Answer
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 w-full animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => handleRating('again')}
              className="h-13 sm:h-14 flex flex-col items-center justify-center rounded-xl border border-rose-500/40 bg-card hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="text-xs sm:text-sm font-black">Again</span>
              <span className="text-[10px] font-mono opacity-80">&lt; 1m</span>
            </button>
            <button
              type="button"
              onClick={() => handleRating('hard')}
              className="h-13 sm:h-14 flex flex-col items-center justify-center rounded-xl border border-amber-500/40 bg-card hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="text-xs sm:text-sm font-black">Hard</span>
              <span className="text-[10px] font-mono opacity-80">2d</span>
            </button>
            <button
              type="button"
              onClick={() => handleRating('good')}
              className="h-13 sm:h-14 flex flex-col items-center justify-center rounded-xl border border-primary/50 bg-card hover:bg-primary/10 text-primary transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="text-xs sm:text-sm font-black">Good</span>
              <span className="text-[10px] font-mono opacity-80">4d</span>
            </button>
            <button
              type="button"
              onClick={() => handleRating('easy')}
              className="h-13 sm:h-14 flex flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-card hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="text-xs sm:text-sm font-black">Easy</span>
              <span className="text-[10px] font-mono opacity-80">7d</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
