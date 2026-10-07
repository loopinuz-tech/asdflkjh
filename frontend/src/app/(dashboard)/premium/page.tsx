import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { apiUrl } from '@/lib/api-config'
import { PremiumClientPage } from './client-page'

const DEFAULT_PLANS = [
  {
    id: 'e2b64efe-f875-4990-9174-46ce81fc5a62',
    name: 'Free Trial',
    slug: 'free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    is_active: true,
    sort_order: 1,
    features: [
      '3 Full Mock Tests',
      'Basic Reading & Listening Practice',
      'Vocabulary Flashcards',
      'Community Support',
    ],
  },
  {
    id: 'e56936b7-4e05-4e9f-a41c-34d53c918f4d',
    name: 'Monthly Pro',
    slug: 'monthly',
    price: 1900,
    currency: 'USD',
    interval: 'monthly',
    is_active: true,
    sort_order: 2,
    features: [
      'Unlimited Reading & Listening Tests',
      'AI Writing Evaluation with Band Score',
      'AI Speaking Examiner Simulation',
      'Full Answer Explanations',
      'Telegram Bot Notifications',
    ],
  },
  {
    id: '1f68cd71-54d0-49b4-aad6-9a44ff54e79f',
    name: 'Yearly Premium',
    slug: 'yearly',
    price: 14900,
    currency: 'USD',
    interval: 'yearly',
    is_active: true,
    sort_order: 3,
    features: [
      'All Monthly Pro Features',
      'Save 35% compared to monthly',
      'Personalized IELTS Study Plan',
      'Priority AI Grading Queue',
      'Downloadable Cambridge PDFs',
    ],
  },
  {
    id: '41b1a547-f54d-4fcc-8d7c-9bdeb4ed499d',
    name: 'Lifetime Access',
    slug: 'lifetime',
    price: 29900,
    currency: 'USD',
    interval: 'lifetime',
    is_active: true,
    sort_order: 4,
    features: [
      'Permanent Full Access',
      'All Future Updates Included',
      '1-on-1 Mentor Strategy Session',
      'VIP Telegram Channel Access',
    ],
  },
]

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

        // 1. Fetch real active plans from backend API directly
        let fetchedPlans: any[] = []
        try {
          const res = await fetch(apiUrl('/api/subscriptions/plans'))
          const json = await res.json()
          if (res.ok && json.success && Array.isArray(json.plans) && json.plans.length > 0) {
            fetchedPlans = json.plans
          }
        } catch (apiErr) {
          console.warn('Direct plans endpoint error, falling back:', apiErr)
        }

        // 2. Fallback to supabase client query if direct fetch didn't return plans
        if (fetchedPlans.length === 0) {
          const { data: plansData } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (plansData && plansData.length > 0) {
            fetchedPlans = plansData
          }
        }

        setPlans(fetchedPlans.length > 0 ? fetchedPlans : DEFAULT_PLANS)

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
