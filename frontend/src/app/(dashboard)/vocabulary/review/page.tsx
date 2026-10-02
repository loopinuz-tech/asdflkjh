import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VocabularyReviewClient } from '@/app/(dashboard)/vocabulary/review/client-page'
import { useNavigate } from 'react-router-dom'
import { enhanceWordsWithLeitner } from '@/lib/services/leitner-srs'

export default function VocabularyReviewPage() {
  const [loading, setLoading] = useState(true)
  const [wordsToReview, setWordsToReview] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Fetch user's vocabulary progress map
      let userVocabMap = new Map<string, { status: string; mastery_level: number; next_review_at?: string }>()

      if (user) {
        const { data: userVocab } = await (supabase as any)
          .from('user_vocabulary')
          .select('word_id, status, mastery_level, next_review_at')
          .eq('user_id', user.id)

        if (userVocab) {
          userVocab.forEach((uv: any) => {
            userVocabMap.set(uv.word_id, {
              status: uv.status,
              mastery_level: uv.mastery_level,
              next_review_at: uv.next_review_at,
            })
          })
        }
      }

      // Fetch all vocabulary words (up to 300)
      const { data: allVocab } = await (supabase as any)
        .from('vocabulary_words')
        .select('id, word, part_of_speech, definition, example_sentence, pronunciation, translation, translation_uz, example_sentence_2, context_sentence, synonyms, antonyms, topic, difficulty, created_at, user_id')
        .order('word', { ascending: true })
        .limit(300)

      let words: any[] = allVocab || []

      // If user had specific words in vocabulary_words
      if (user && words.length > 0) {
        words = words.filter(
          (w) => !w.user_id || w.user_id === user.id
        )
      }

      const enhanced = enhanceWordsWithLeitner(words, userVocabMap)
      setWordsToReview(enhanced)
      setLoading(false)
    }

    load()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 sm:py-6">
      <VocabularyReviewClient words={wordsToReview} />
    </div>
  )
}
