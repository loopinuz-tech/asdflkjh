import { createClient } from '@/lib/supabase/client'

export interface LeitnerWord {
  id: string
  word: string
  definition: string
  translation?: string
  translation_uz?: string
  example_sentence?: string
  example_sentence_2?: string
  context_sentence?: string
  synonyms?: string[] | string
  antonyms?: string[] | string
  pronunciation?: string
  part_of_speech?: string
  topic?: string
  difficulty?: string
  mastery_level?: number // 1 to 5 (Box number)
  status?: 'new' | 'learning' | 'review' | 'mastered'
  next_review_at?: string
  review_count?: number
  created_at?: string
}

export const LEITNER_BOXES = [
  { box: 1, name: 'Box 1', intervalDays: 1, label: 'Daily Review', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  { box: 2, name: 'Box 2', intervalDays: 3, label: 'Every 3 Days', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { box: 3, name: 'Box 3', intervalDays: 7, label: 'Every 7 Days', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { box: 4, name: 'Box 4', intervalDays: 14, label: 'Every 14 Days', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  { box: 5, name: 'Box 5', intervalDays: 30, label: 'Mastered (30 Days)', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
] as const

const LOCAL_STORAGE_KEY = 'edufox_leitner_srs_data'

interface LocalSRSData {
  [wordId: string]: {
    box: number
    nextReviewAt: string
    reviewCount: number
    lastReviewedAt: string
  }
}

function getLocalSRS(): LocalSRSData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setLocalSRS(data: LocalSRSData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Calculates next review date based on target Leitner Box.
 */
export function calculateNextReviewDate(box: number): Date {
  const boxConfig = LEITNER_BOXES.find((b) => b.box === box) || LEITNER_BOXES[0]
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + boxConfig.intervalDays)
  return nextDate
}

/**
 * Updates a word's Leitner Box status locally and on Supabase.
 */
export async function updateLeitnerWord(
  wordId: string,
  isCorrect: boolean,
  actionOverride?: 'again' | 'hard' | 'good' | 'easy'
): Promise<{ nextBox: number; nextReviewAt: string }> {
  const localData = getLocalSRS()
  const existing = localData[wordId]
  const currentBox = existing?.box || 1

  let nextBox = currentBox

  if (actionOverride) {
    if (actionOverride === 'again') {
      nextBox = 1
    } else if (actionOverride === 'hard') {
      nextBox = Math.max(1, currentBox)
    } else if (actionOverride === 'good') {
      nextBox = Math.min(5, currentBox + 1)
    } else if (actionOverride === 'easy') {
      nextBox = Math.min(5, currentBox + 2)
    }
  } else {
    if (isCorrect) {
      nextBox = Math.min(5, currentBox + 1)
    } else {
      // Leitner rule: demote back to Box 1 for reinforcement
      nextBox = 1
    }
  }

  const nextDate = calculateNextReviewDate(nextBox)
  const nextReviewAt = nextDate.toISOString()

  // Save to local storage
  localData[wordId] = {
    box: nextBox,
    nextReviewAt,
    reviewCount: (existing?.reviewCount || 0) + 1,
    lastReviewedAt: new Date().toISOString(),
  }
  setLocalSRS(localData)

  // Asynchronously sync to Supabase user_vocabulary
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const status = nextBox >= 5 ? 'mastered' : nextBox > 1 ? 'review' : 'learning'
      await (supabase as any)
        .from('user_vocabulary')
        .upsert(
          {
            user_id: user.id,
            word_id: wordId,
            mastery_level: nextBox,
            status,
            next_review_at: nextReviewAt,
            review_count: (existing?.reviewCount || 0) + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,word_id' }
        )
    }
  } catch (err) {
    console.error('Leitner sync to Supabase failed:', err)
  }

  return { nextBox, nextReviewAt }
}

/**
 * Enhances a list of vocabulary words with Leitner Box data from local storage or server.
 */
export function enhanceWordsWithLeitner(
  words: any[],
  serverVocabMap?: Map<string, { status: string; mastery_level: number; next_review_at?: string }>
): LeitnerWord[] {
  const localData = getLocalSRS()
  const now = new Date().getTime()

  return words.map((w) => {
    const serverItem = serverVocabMap?.get(w.id)
    const localItem = localData[w.id]

    let box = 1
    if (localItem?.box) {
      box = localItem.box
    } else if (serverItem?.mastery_level) {
      box = Math.max(1, Math.min(5, serverItem.mastery_level))
    }

    const nextReviewAt =
      localItem?.nextReviewAt ||
      serverItem?.next_review_at ||
      new Date().toISOString()

    const status =
      box >= 5 ? 'mastered' : box > 1 ? 'review' : 'learning'

    return {
      ...w,
      mastery_level: box,
      status,
      next_review_at: nextReviewAt,
      review_count: localItem?.reviewCount || 0,
    }
  })
}

/**
 * Text-to-speech helper for authentic pronunciation.
 */
export function speakWord(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel() // Stop any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9 // Slightly slower for clear IELTS diction

  // Try to pick a natural English voice if available
  const voices = window.speechSynthesis.getVoices()
  const englishVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
  ) || voices.find((v) => v.lang.startsWith('en'))

  if (englishVoice) {
    utterance.voice = englishVoice
  }

  window.speechSynthesis.speak(utterance)
}
