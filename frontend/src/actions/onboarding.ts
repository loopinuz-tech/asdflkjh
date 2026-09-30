import { createClient } from '@/lib/supabase/client'

export async function saveOnboardingData(data: any) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Update profile with onboarding data
  const { error } = await supabase
    .from('profiles')
    .update({
      target_band: data.targetBand !== 'Not sure' ? parseFloat(data.targetBand) : null,
      challenges: data.challenges,
      plan_timeline: data.planTimeline,
      has_taken_ielts: data.hasTakenIelts,
      previous_score: data.previousScore ? parseFloat(data.previousScore) : null,
      estimated_level: data.estimatedLevel,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', session.user.id)

  if (error) {
    console.error('Error saving onboarding data:', error)
    throw new Error('Failed to save onboarding data')
  }

  return { success: true }
}
