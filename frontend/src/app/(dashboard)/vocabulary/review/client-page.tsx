import React from 'react'
import { VocabularyReviewHub } from '@/components/vocabulary/review/vocabulary-review-hub'
import { LeitnerWord, enhanceWordsWithLeitner } from '@/lib/services/leitner-srs'

interface VocabularyReviewClientProps {
  words: any[]
}

export function VocabularyReviewClient({ words }: VocabularyReviewClientProps) {
  const enhancedWords = enhanceWordsWithLeitner(words)

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-5">
      <VocabularyReviewHub words={enhancedWords} />
    </div>
  )
}
