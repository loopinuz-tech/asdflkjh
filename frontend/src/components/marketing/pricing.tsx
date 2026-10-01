import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon, 
  CloseCircleIcon, 
  CrownStarIcon, 
  ShieldCheckIcon,
  TagPriceIcon 
} from '@solar-icons/react/bold-duotone'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Perfectly balanced 10-feature comparison (1-to-1 matching)
const FREE_FEATURES = [
  { text: 'Selected IELTS-style practice tests', included: true },
  { text: 'Basic question types', included: true },
  { text: 'Vocabulary access (basic)', included: true },
  { text: 'Basic progress tracking', included: true },
  { text: 'Onboarding & learning plan', included: true },
  { text: 'Full question library (Cambridge 1–19)', included: false },
  { text: 'Unlimited practice tests with timers', included: false },
  { text: 'Advanced AI progress analytics & band prediction', included: false },
  { text: 'Detailed AI Writing & Speaking feedback', included: false },
  { text: 'Premium vocabulary collections', included: false },
]

const PREMIUM_FEATURES = [
  { text: 'Full IELTS Cambridge question library (1–19)', included: true },
  { text: 'All 15+ official IELTS question types', included: true },
  { text: 'Unlimited practice tests with timers', included: true },
  { text: 'Advanced AI progress analytics & band prediction', included: true },
  { text: 'Complete Academic & General vocabulary collections', included: true },
  { text: 'Instant AI Evaluation on Writing Task 1 & 2', included: true },
  { text: 'Audio recording & AI Speaking scoring', included: true },
  { text: 'In-depth answer explanations & transcripts', included: true },
  { text: 'Priority customer support & Telegram VIP group', included: true },
  { text: 'All upcoming mock tests & updates included', included: true },
]

export function Pricing() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = useState<any[]>([])
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [activeSub, setActiveSub] = useState<any | null>(null)

  // Fetch real plans & user status
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const supabase = createClient()

        // Auth state
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (isMounted && authUser) {
          setUser({ id: authUser.id, email: authUser.email })

          const { data: subData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('status', 'active')
            .maybeSingle()

          if (isMounted) setActiveSub(subData || null)
        }

        // Real active plans
        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (isMounted && plansData && plansData.length > 0) {
          setPlans(plansData)
        }
      } catch (err) {
        console.warn('Pricing plans load error:', err)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Find real IDs for routing to checkout
  const freePlan = plans.find((p) => p.price === 0 || p.slug === 'free')
  const monthlyPlan = plans.find((p) => p.interval === 'monthly' && p.price > 0) || plans.find((p) => p.slug === 'monthly')
  const yearlyPlan = plans.find((p) => p.interval === 'yearly') || plans.find((p) => p.slug === 'yearly')

  const isUserPremium = activeSub && activeSub.status === 'active'

  // Dynamic pricing values
  const isYearly = billingCycle === 'yearly'
  const premiumPrice = isYearly ? '$49' : '$9'
  const premiumIntervalNote = isYearly
    ? '/ year • or $49/year (Save 55%)'
    : '/ month • or $49/year (Save 55%)'
  const premiumUzs = isYearly ? '~625,000 UZS / yil' : '~115,000 UZS / oy'
  const targetPlanId = isYearly ? (yearlyPlan?.id || 'yearly') : (monthlyPlan?.id || 'monthly')

  const handleAction = (isPremium: boolean) => {
    if (!isPremium) {
      if (user) {
        navigate('/dashboard')
      } else {
        navigate('/signup')
      }
      return
    }

    if (isUserPremium) {
      navigate('/premium')
      return
    }

    if (user) {
      navigate(`/premium?planId=${targetPlanId}&interval=${billingCycle}`)
    } else {
      navigate(`/signup?redirect=/premium&planId=${targetPlanId}&interval=${billingCycle}`)
    }
  }

  return (
    <section id="pricing" className="py-14 sm:py-20 bg-secondary/30 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <TagPriceIcon className="w-3.5 h-3.5" size={14} />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground tracking-tight">
            Practice with purpose
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start free, upgrade when you&apos;re ready. No tricks, no hidden fees.
          </p>
        </motion.div>

        {/* Real Interactive Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex items-center p-1 rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700/80 shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer',
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm font-extrabold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer',
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm font-extrabold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Yearly VIP</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                Save 55%
              </span>
            </button>
          </div>
        </div>

        {/* 2-Card Comparison Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Free Trial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card className="h-full relative overflow-hidden transition-all duration-300 border-border bg-card shadow-sm hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-foreground">Free Trial</h3>
                  {user && !isUserPremium && (
                    <Badge variant="outline" className="text-[11px] font-bold border-muted-foreground/30">
                      Current Plan
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground">$0</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Start practicing for IELTS at no cost.
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAction(false)}
                  className="w-full mb-6 font-bold cursor-pointer hover:bg-secondary transition-colors"
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                </Button>

                <ul className="space-y-3">
                  {FREE_FEATURES.map((feature, i) => (
                    <li
                      key={`free-${i}`}
                      className={cn(
                        'flex items-start gap-3 text-sm',
                        !feature.included && 'text-muted-foreground/50'
                      )}
                    >
                      {feature.included ? (
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <CloseCircleIcon className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Premium VIP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="h-full relative overflow-hidden transition-all duration-300 border-2 border-primary bg-card shadow-xl shadow-primary/10 hover:shadow-2xl hover:border-amber-400">
              {/* Premium top gradient glow */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CrownStarIcon className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="text-xl font-bold text-foreground">Premium VIP</h3>
                  </div>
                  <Badge className="bg-primary/15 text-primary border border-primary/30 font-extrabold text-[11px] shadow-xs">
                    Recommended
                  </Badge>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground tracking-tight">
                    {premiumPrice}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {premiumIntervalNote}
                  </p>
                  <span className="text-xs font-bold text-primary shrink-0">
                    {premiumUzs}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Complete all-in-one preparation to reach your target 7.5+ Band.
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  type="button"
                  onClick={() => handleAction(true)}
                  className="w-full mb-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-md hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                >
                  {isUserPremium
                    ? 'Active VIP Member • View Details →'
                    : isYearly
                    ? 'Upgrade to Annual VIP (Save 55%) →'
                    : 'Upgrade to Premium →'}
                </Button>

                <ul className="space-y-3">
                  {PREMIUM_FEATURES.map((feature, i) => (
                    <li
                      key={`prem-${i}`}
                      className="flex items-start gap-3 text-sm text-foreground font-medium"
                    >
                      <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Real Payment Guarantee & Accepted Methods Trust Strip */}
        <div className="mt-12 pt-8 border-t border-border/60 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-foreground">
              Official inPAY & Banking Integration:
            </span>
            <span>Payme, Click, Uzum, Visa / Mastercard</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Instant Access
            </span>
            <span>•</span>
            <span>1-Click Cancellation</span>
            <span>•</span>
            <span>256-bit Encrypted</span>
          </div>
        </div>
      </div>
    </section>
  )
}
