import { createClient } from '@/lib/supabase/client'

export interface AccessCheckResult {
  hasAccess: boolean
  reason?: 'free' | 'admin' | 'premium' | 'subscription_required' | 'unauthenticated'
}

/**
 * Client-side authorization check for IELTS test access.
 * Verifies that the user has legitimate access to premium tests.
 */
export async function verifyUserTestAccess(
  userId: string | undefined,
  test: { is_premium?: boolean | null; access_type?: string | null }
): Promise<AccessCheckResult> {
  const isPremium = Boolean(test.is_premium || test.access_type === 'premium')

  // Free test — open to all registered students
  if (!isPremium) {
    return { hasAccess: true, reason: 'free' }
  }

  // Premium test requires an authenticated user
  if (!userId) {
    return { hasAccess: false, reason: 'unauthenticated' }
  }

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

    // 1. Direct subscription status check (fastest & single source of truth)
    if (token) {
      const res = await fetch('/api/subscriptions/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.is_premium) {
          return { hasAccess: true, reason: 'premium' }
        }
      }
    }

    const supabase = createClient()

    // 2. Check if user is an admin or teacher
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
    const profile = profileRaw as { role: string } | null

    if (profile?.role === 'admin' || profile?.role === 'teacher') {
      return { hasAccess: true, reason: 'admin' }
    }

    // 3. Fallback: check subscriptions table
    const now = new Date().toISOString()
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('id, status, expires_at')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(1)
      .maybeSingle()

    if (activeSub) {
      return { hasAccess: true, reason: 'premium' }
    }

    return { hasAccess: false, reason: 'subscription_required' }
  } catch (err) {
    console.error('Test access check failed:', err)
    return { hasAccess: false, reason: 'subscription_required' }
  }
}
