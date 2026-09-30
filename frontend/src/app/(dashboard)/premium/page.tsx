import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { PremiumClientPage } from './client-page'

export default function PremiumPage() {
  const [searchParams] = useSearchParams()
  const testId = searchParams.get('testId') || undefined
  const reason = searchParams.get('reason') || undefined

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [activeSubscription, setActiveSubscription] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser({ id: authUser.id, email: authUser.email })
        }

        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true })

        setPlans(plansData || [])

        if (authUser) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('status', 'active')
            .maybeSingle()
          setActiveSubscription(subData || null)
        }
      } catch (err) {
        console.error('Failed to load premium data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <PremiumClientPage
      user={user || { id: '' }}
      plans={plans}
      activeSubscription={activeSubscription}
      testId={testId}
      reason={reason}
    />
  )
}
