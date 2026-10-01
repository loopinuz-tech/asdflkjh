import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { VolumeLoudIcon, CheckSquareIcon, AltArrowLeftIcon } from '@solar-icons/react/bold-duotone'
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
      <div className="text-center p-8 bg-card border border-border rounded-2xl fox-shadow-sm max-w-md w-full mx-auto my-12">
        <FoxMascot variant="celebration" size="lg" className="mb-6 mx-auto" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">You're all caught up!</h2>
        <p className="text-muted-foreground mb-6 text-sm">No words are due for review right now. Take a break or add new words to your deck.</p>
        <Link to="/vocabulary" className={buttonVariants({ className: "w-full rounded-xl font-bold bg-primary text-black" })}>
          Return to Vocabulary Bank
        </Link>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="text-center p-8 bg-card border border-border rounded-2xl fox-shadow-sm max-w-md w-full mx-auto my-12">
        <div className="w-16 h-16 bg-primary text-primary-foreground shadow-md rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckSquareIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">Review Session Complete!</h2>
        <p className="text-muted-foreground mb-8 text-sm">You reviewed {words.length} IELTS words today.</p>
        
        <div className="grid grid-cols-4 gap-2 mb-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <div className="text-xl font-bold text-destructive">{results.again}</div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">Again</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
            <div className="text-xl font-bold text-orange-500">{results.hard}</div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">Hard</div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <div className="text-xl font-bold text-primary">{results.good}</div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">Good</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <div className="text-xl font-bold text-emerald-500">{results.easy}</div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">Easy</div>
          </div>
        </div>

        <Link to="/vocabulary" className={buttonVariants({ className: "w-full rounded-xl font-bold bg-primary text-black" })}>
          Return to Vocabulary Bank
        </Link>
      </div>
    )
  }

  const currentWord = words[currentIndex]

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setResults(prev => ({ ...prev, [rating]: prev[rating] + 1 }))
    
    // Asynchronously record progress in database
    if (currentWord?.id) {
      recordWordReview(currentWord.id, rating).catch(err => {
        console.error('Failed to record review:', err)
      })
    }
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1)
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
      u.lang = 'en-GB'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  const ipa = currentWord.pronunciation || currentWord.phonetic

  return (
    <div className="w-full max-w-2xl px-4 mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/vocabulary" 
          className={buttonVariants({ variant: "ghost", size: "icon", className: "text-muted-foreground hover:text-foreground rounded-xl" })}
        >
          <AltArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-border">
            Word {currentIndex + 1} of {words.length}
          </Badge>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div 
        className="relative w-full aspect-[4/3] md:aspect-[16/10] cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div 
          className="w-full h-full relative transition-transform duration-500"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          
          {/* FRONT OF CARD */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-between p-6 sm:p-8 bg-card border-2 border-border hover:border-primary/40 rounded-2xl shadow-sm transition-colors"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg) translateZ(1px)'
            }}
          >
            <div className="w-full flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                {currentWord.is_new ? 'New Word' : 'Review Card'}
              </span>
              {currentWord.topic && (
                <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[11px] font-semibold">
                  {currentWord.topic}
                </span>
              )}
            </div>

            <div className="text-center my-auto space-y-2">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
                {currentWord.word}
              </h2>
              {ipa && (
                <p className="text-base sm:text-lg text-muted-foreground font-mono">
                  {ipa}
                </p>
              )}
            </div>

            <div className="text-center">
              <span className="text-xs text-muted-foreground/80 font-medium">
                Tap or click to reveal definition
              </span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div 
            className="absolute inset-0 flex flex-col p-6 sm:p-8 bg-card border-2 border-primary/40 rounded-2xl shadow-sm overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1px)'
            }}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-foreground">{currentWord.word}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); playPronunciation(); }}
                    title="Pronounce word"
                    className="p-1 rounded-lg hover:bg-secondary text-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <VolumeLoudIcon className="w-4 h-4 text-primary" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {currentWord.part_of_speech && (
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-xs font-semibold uppercase">
                      {currentWord.part_of_speech}
                    </span>
                  )}
                  {ipa && (
                    <span className="text-xs text-muted-foreground font-mono">{ipa}</span>
                  )}
                </div>
              </div>

              {currentWord.topic && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-xs font-semibold shrink-0">
                  {currentWord.topic}
                </span>
              )}
            </div>

            {/* Content row */}
            <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-1">
              <div>
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Definition</h4>
                <p className="text-sm sm:text-base text-foreground leading-relaxed font-medium">
                  {currentWord.definition}
                </p>
              </div>

              {currentWord.example_sentence && (
                <div>
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Example in IELTS Context</h4>
                  <div className="p-2.5 rounded-xl bg-secondary/30 border-l-2 border-primary text-xs sm:text-sm text-foreground/90 italic">
                    "{currentWord.example_sentence}"
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center min-h-[4rem]">
        {!isFlipped ? (
          <Button 
            size="lg" 
            onClick={() => setIsFlipped(true)} 
            className="w-full max-w-sm h-11 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-black shadow-sm cursor-pointer"
          >
            Show Answer
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full animate-in fade-in duration-200">
            <button 
              onClick={() => handleRating('again')} 
              className="h-14 flex flex-col items-center justify-center rounded-xl border border-destructive/40 bg-card hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Again</span>
              <span className="text-[10px] opacity-70">&lt; 1m</span>
            </button>
            <button 
              onClick={() => handleRating('hard')} 
              className="h-14 flex flex-col items-center justify-center rounded-xl border border-orange-500/40 bg-card hover:bg-orange-500/10 text-orange-500 transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Hard</span>
              <span className="text-[10px] opacity-70">2d</span>
            </button>
            <button 
              onClick={() => handleRating('good')} 
              className="h-14 flex flex-col items-center justify-center rounded-xl border border-primary/50 bg-card hover:bg-primary/10 text-primary transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Good</span>
              <span className="text-[10px] opacity-70">4d</span>
            </button>
            <button 
              onClick={() => handleRating('easy')} 
              className="h-14 flex flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-card hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Easy</span>
              <span className="text-[10px] opacity-70">7d</span>
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
