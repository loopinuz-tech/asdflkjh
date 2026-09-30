import { createClient } from '@/lib/supabase/client'

export async function getUserSettings() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', user.id)
    .single()

  return {
    email: user.email || '',
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    avatarUrl: profile?.avatar_url || '',
    targetBand: profile?.target_band ? Number(profile.target_band) : 7.0,
    telegramId: profile?.telegram_id || null,
    telegramUsername: profile?.telegram_username || null,
    planName: subscription?.plans?.name || 'Free',
    planStatus: subscription?.status || 'active',
  }
}

export async function updateUserSettings(data: {
  firstName?: string
  lastName?: string
  targetBand?: number
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (data.firstName !== undefined) updates.first_name = data.firstName
  if (data.lastName !== undefined) updates.last_name = data.lastName
  if (data.targetBand !== undefined) updates.target_band = data.targetBand

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to update settings:', error)
    throw new Error('Failed to update settings')
  }

  return { success: true }
}
