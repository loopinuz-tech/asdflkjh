import { useNavigate, useSearchParams } from 'react-router-dom'
import { SRSPracticeSession } from '@/components/vocabulary/srs-practice-session'

export function VocabularyReviewClient({ words }: { words: any[] }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'spaced_repetition'

  // Map to store in-memory vocabulary progress for the session
  const userVocabMap = new Map<string, { status: string; mastery_level: number }>()
  words.forEach((w) => {
    userVocabMap.set(w.id, {
      status: w.is_new ? 'new' : 'learning',
      mastery_level: w.box_number || 4,
    })
  })

  return (
    <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between">
      <SRSPracticeSession
        mode={mode}
        words={words}
        userVocabMap={userVocabMap}
        onExit={() => navigate('/vocabulary')}
      />
    </div>
  )
}
