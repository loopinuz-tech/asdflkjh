import { createClient } from '@/lib/supabase/client'

export async function recordWordReview(
  wordId: string,
  rating: 'again' | 'hard' | 'good' | 'easy'
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const table = (supabase as any).from('user_vocabulary')

  // Fetch existing record
  const { data: existing } = await table
    .select('id, mastery_level, review_count')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .maybeSingle()

  let newLevel = existing?.mastery_level || 0
  let newStatus: 'new' | 'learning' | 'review' | 'mastered' = 'learning'
  let daysToAdd = 1

  if (rating === 'again') {
    newLevel = Math.max(0, newLevel - 1)
    newStatus = 'learning'
    daysToAdd = 1
  } else if (rating === 'hard') {
    newLevel = Math.max(1, newLevel)
    newStatus = 'review'
    daysToAdd = 2
  } else if (rating === 'good') {
    newLevel = newLevel + 1
    newStatus = newLevel >= 4 ? 'mastered' : 'review'
    daysToAdd = Math.max(3, newLevel * 3)
  } else if (rating === 'easy') {
    newLevel = newLevel + 2
    newStatus = newLevel >= 4 ? 'mastered' : 'review'
    daysToAdd = Math.max(5, newLevel * 5)
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + daysToAdd)

  if (existing) {
    await table
      .update({
        mastery_level: newLevel,
        status: newStatus,
        next_review_at: nextReview.toISOString(),
        review_count: (existing.review_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await table.insert({
      user_id: user.id,
      word_id: wordId,
      mastery_level: newLevel,
      status: newStatus,
      next_review_at: nextReview.toISOString(),
      review_count: 1,
    })
  }

  return { success: true }
}
