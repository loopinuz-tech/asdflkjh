import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VocabularyReviewClient } from '@/app/(dashboard)/vocabulary/review/client-page'
import { useNavigate } from 'react-router-dom'

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

      if (!user) {
        navigate('/login')
        return
      }

      // Fetch words due for review
      const { data: userVocab } = await supabase
        .from('user_vocabulary')
        .select(`
          id, status, next_review_at, mastery_level,
          vocabulary_words:word_id (
            id, word, part_of_speech, definition, example_sentence, pronunciation,
            translation, translation_uz, example_sentence_2, context_sentence,
            synonyms, antonyms, topic, difficulty, user_id
          )
        `)
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString())
        .limit(20)

      let words: any[] =
        (userVocab as any[])
          ?.filter((item: any) => item.vocabulary_words)
          ?.map((item: any) => ({
            ...item.vocabulary_words,
            user_vocab_id: item.id,
            is_new: false,
            box_number: item.mastery_level || 0,
          })) || []

      // If no words are due, fetch global or user's words from vocabulary_words
      if (words.length === 0) {
        const { data: allVocab } = await supabase
          .from('vocabulary_words')
          .select('id, word, part_of_speech, definition, example_sentence, pronunciation, translation, translation_uz, example_sentence_2, context_sentence, synonyms, antonyms, topic, difficulty, user_id')
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .limit(15)

        if (allVocab && allVocab.length > 0) {
          words = (allVocab as any[]).map((v) => ({
            ...v,
            user_vocab_id: null,
            is_new: true,
            box_number: 0,
          }))
        }
      }

      setWordsToReview(words)
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
    <div className="w-full flex-1 flex flex-col justify-between">
      <VocabularyReviewClient words={wordsToReview} />
    </div>
  )
}
