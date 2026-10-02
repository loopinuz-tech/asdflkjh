import { useState, useEffect } from 'react'
import { AltArrowLeftIcon, CloseCircleIcon, RefreshCircleIcon, StarsIcon } from '@solar-icons/react/bold-duotone'
import { LeitnerWord, updateLeitnerWord, speakWord } from '@/lib/services/leitner-srs'
import { Button } from '@/components/ui/button'

interface WordMatchingProps {
  words: LeitnerWord[]
  onBack: () => void
}

interface TileItem {
  id: string
  wordId: string
  type: 'word' | 'definition'
  text: string
  isMatched: boolean
}

export function WordMatching({ words, onBack }: WordMatchingProps) {
  const [currentRoundWords, setCurrentRoundWords] = useState<LeitnerWord[]>([])
  const [tiles, setTiles] = useState<TileItem[]>([])
  const [selectedTile, setSelectedTile] = useState<TileItem | null>(null)
  const [mismatchedIds, setMismatchedIds] = useState<string[]>([])
  const [matchesCount, setMatchesCount] = useState(0)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [isCompleted, setIsCompleted] = useState(false)

  // Start round with 6 words
  useEffect(() => {
    if (words.length === 0) return
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    const roundWords = shuffled.slice(0, Math.min(6, words.length))
    setCurrentRoundWords(roundWords)

    const wordTiles: TileItem[] = roundWords.map((w) => ({
      id: `w-${w.id}`,
      wordId: w.id,
      type: 'word',
      text: w.word,
      isMatched: false,
    }))

    const defTiles: TileItem[] = roundWords.map((w) => ({
      id: `d-${w.id}`,
      wordId: w.id,
      type: 'definition',
      text: w.definition,
      isMatched: false,
    }))

    // Shuffle word and definition tiles independently or combined
    const combined = [...wordTiles, ...defTiles].sort(() => Math.random() - 0.5)
    setTiles(combined)
    setSelectedTile(null)
    setMismatchedIds([])
    setMatchesCount(0)
  }, [words, round])

  const handleTileClick = (tile: TileItem) => {
    if (tile.isMatched) return

    // If clicking a word tile, speak pronunciation
    if (tile.type === 'word') {
      speakWord(tile.text)
    }

    if (!selectedTile) {
      setSelectedTile(tile)
      setMismatchedIds([])
      return
    }

    // If clicking same tile, unselect
    if (selectedTile.id === tile.id) {
      setSelectedTile(null)
      return
    }

    // If clicking two tiles of the same type, switch selection
    if (selectedTile.type === tile.type) {
      setSelectedTile(tile)
      return
    }

    // Check if matching pair
    if (selectedTile.wordId === tile.wordId) {
      // Match found!
      setTiles((prev) =>
        prev.map((t) =>
          t.wordId === tile.wordId ? { ...t, isMatched: true } : t
        )
      )
      setScore((s) => s + 10)
      setMatchesCount((c) => {
        const next = c + 1
        if (next >= currentRoundWords.length) {
          setTimeout(() => setIsCompleted(true), 600)
        }
        return next
      })
      setSelectedTile(null)
      setMismatchedIds([])

      // Update Leitner progress
      updateLeitnerWord(tile.wordId, true)
    } else {
      // Mismatch
      setMismatchedIds([selectedTile.id, tile.id])
      updateLeitnerWord(tile.wordId, false)
      setTimeout(() => {
        setMismatchedIds([])
        setSelectedTile(null)
      }, 700)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar matching Screenshot 3 */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon size={20} />
          Word Matching
        </button>

        <div className="flex items-center gap-4">
          <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
            Score: <span className="font-bold text-foreground">{score}</span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CloseCircleIcon size={22} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Match words and definitions
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Select a word and pair it with its corresponding meaning
        </p>
      </div>

      {/* Completion Modal / Banner */}
      {isCompleted ? (
        <div className="p-8 text-center bg-card border border-border rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 text-black flex items-center justify-center mx-auto">
            <StarsIcon size={32} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Round Complete!</h3>
          <p className="text-sm text-muted-foreground">
            You successfully matched all {currentRoundWords.length} words. Total Score: {score}
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
                setRound((r) => r + 1)
              }}
              className="flex-1 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90"
            >
              Next Round
            </Button>
          </div>
        </div>
      ) : (
        /* Matching Grid matching Screenshot 3 */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {tiles.map((tile) => {
            const isSelected = selectedTile?.id === tile.id
            const isWrong = mismatchedIds.includes(tile.id)
            const isWord = tile.type === 'word'

            if (tile.isMatched) {
              return (
                <div
                  key={tile.id}
                  className="min-h-[90px] sm:min-h-[105px] p-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center opacity-40 select-none"
                >
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Matched
                  </span>
                </div>
              )
            }

            return (
              <div
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`min-h-[90px] sm:min-h-[105px] p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-center items-center text-center cursor-pointer select-none relative shadow-xs ${
                  isWrong
                    ? 'border-rose-500 bg-rose-500/20 animate-shake text-rose-600'
                    : isSelected
                    ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-md scale-[1.02]'
                    : isWord
                    ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/15 hover:border-rose-400 dark:hover:border-rose-800'
                    : 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/15 hover:border-blue-400 dark:hover:border-blue-800'
                }`}
              >
                {/* Tiny Badge matching Screenshot 3 */}
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${
                    isWord ? 'text-rose-500' : 'text-blue-500'
                  }`}
                >
                  {isWord ? 'word' : 'definition'}
                </span>

                <div
                  className={`text-xs sm:text-sm font-semibold tracking-tight ${
                    isWord ? 'text-foreground font-bold text-sm sm:text-base' : 'text-foreground/80 line-clamp-3'
                  }`}
                >
                  {tile.text}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
