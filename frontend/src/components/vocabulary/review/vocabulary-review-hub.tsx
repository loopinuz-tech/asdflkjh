import { useState } from 'react'
import { LeitnerWord } from '@/lib/services/leitner-srs'
import { ReviewModeSelector, ReviewMode } from './review-mode-selector'
import { WordSelectionModal } from './word-selection-modal'
import { WordMatching } from './modes/word-matching'
import { TrueFalseQuiz } from './modes/true-false-quiz'
import { SpeedQuiz } from './modes/speed-quiz'
import { SpacedRepetitionLeitner } from './modes/spaced-repetition-leitner'
import { FillBlankQuiz } from './modes/fill-blank-quiz'
import { AudioQuiz } from './modes/audio-quiz'
import { SpellingQuiz } from './modes/spelling-quiz'
import { MarathonQuiz } from './modes/marathon-quiz'

interface VocabularyReviewHubProps {
  words: LeitnerWord[]
  initialMode?: ReviewMode | null
  onReturnToBank?: () => void
}

const MODE_TITLES: Record<ReviewMode, string> = {
  'spaced-repetition': 'Spaced Repetition (Leitner)',
  'word-matching': 'Word Matching',
  'true-false': 'True or False',
  'speed-quiz': 'Speed Quiz',
  'fill-blank': 'Fill in the Blank',
  'audio-quiz': 'Audio Quiz',
  'spelling': 'Spelling Test',
  'marathon': 'Marathon Challenge',
}

export function VocabularyReviewHub({
  words,
  initialMode = null,
  onReturnToBank,
}: VocabularyReviewHubProps) {
  const [activeMode, setActiveMode] = useState<ReviewMode | null>(initialMode)
  const [pendingMode, setPendingMode] = useState<ReviewMode | null>(null)
  const [showWordModal, setShowWordModal] = useState(false)
  const [sessionWords, setSessionWords] = useState<LeitnerWord[]>(words)

  const handleSelectMode = (mode: ReviewMode) => {
    setPendingMode(mode)
    setShowWordModal(true)
  }

  const handleWordsConfirmed = (selected: LeitnerWord[]) => {
    setSessionWords(selected)
    if (pendingMode) {
      setActiveMode(pendingMode)
      setPendingMode(null)
    }
  }

  const handleBackToModes = () => {
    setActiveMode(null)
  }

  return (
    <div className="w-full">
      {/* Word Selection Modal (Screenshot 2) */}
      <WordSelectionModal
        isOpen={showWordModal}
        onClose={() => {
          setShowWordModal(false)
          setPendingMode(null)
        }}
        onSelectWords={handleWordsConfirmed}
        allWords={words}
        modeTitle={pendingMode ? MODE_TITLES[pendingMode] : undefined}
      />

      {/* Main Content: Mode Selector or Active Game Mode */}
      {!activeMode && (
        <ReviewModeSelector words={words} onSelectMode={handleSelectMode} />
      )}

      {activeMode === 'spaced-repetition' && (
        <SpacedRepetitionLeitner words={sessionWords} onBack={handleBackToModes} />
      )}

      {activeMode === 'word-matching' && (
        <WordMatching words={sessionWords} onBack={handleBackToModes} />
      )}

      {activeMode === 'true-false' && (
        <TrueFalseQuiz words={sessionWords} onBack={handleBackToModes} />
      )}

      {activeMode === 'speed-quiz' && (
        <SpeedQuiz words={sessionWords} onBack={handleBackToModes} />
      )}

      {activeMode === 'fill-blank' && (
        <FillBlankQuiz words={sessionWords} onBack={handleBackToModes} />
      )}

      {activeMode === 'audio-quiz' && (
        <AudioQuiz words={sessionWords} onBack={handleBackToModes} />
      )}

      {activeMode === 'spelling' && (
        <SpellingQuiz words={sessionWords} onBack={handleBackToModes} />
      )}

      {activeMode === 'marathon' && (
        <MarathonQuiz words={sessionWords} onBack={handleBackToModes} />
      )}
    </div>
  )
}
