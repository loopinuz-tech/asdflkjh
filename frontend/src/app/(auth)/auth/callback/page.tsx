import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

/**
 * OAuth callback page — replaces the Next.js API route.
 * Supabase handles the code exchange automatically via the browser client.
 * We just need to detect the session and redirect appropriately.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const next = searchParams.get('next') ?? '/dashboard'
    const errorParam = searchParams.get('error_description') || searchParams.get('error')

    if (errorParam) {
      navigate(`/login?error=${encodeURIComponent(errorParam)}`, { replace: true })
      return
    }

    // Supabase SSR handles the code exchange via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (profile && !profile.onboarding_completed) {
          navigate('/onboarding', { replace: true })
        } else {
          navigate(next, { replace: true })
        }
        subscription.unsubscribe()
      }
    })

    // Also handle if user is already signed in (page refresh scenario)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile && !profile.onboarding_completed) {
              navigate('/onboarding', { replace: true })
            } else {
              navigate(next, { replace: true })
            }
          })
        subscription.unsubscribe()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
