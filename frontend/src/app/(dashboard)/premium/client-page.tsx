import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  StarsIcon,
  ShieldCheckIcon,
  TagPriceIcon,
  CheckCircleIcon,
  DangerCircleIcon,
  CloseCircleIcon,
  CardIcon,
  AltArrowRightIcon,
  PlaneIcon,
} from '@solar-icons/react/bold-duotone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  interval: string
  features: string[]
  is_active: boolean
}

interface Props {
  user: {
    id: string
    email?: string
  }
  plans: Plan[]
  activeSubscription: {
    id: string
    plan_id: string
    status: string
    expires_at?: string | null
  } | null
  reason?: string
  testId?: string
}

export function PremiumClientPage({ user, plans, activeSubscription, reason, testId }: Props) {
  const botUsername = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'edu_foxbot'
  const [searchParams] = useSearchParams()
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentSub, setCurrentSub] = useState(activeSubscription)

  // Promo Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_type: string
    discount_value: number
  } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Validate Promo Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCodeInput.trim()) return

    try {
      setValidatingCoupon(true)
      setCouponFeedback(null)
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

      // Use first paid plan for validation calculation
      const paidPlan = plans.find(p => p.price > 0) || plans[0]

      const res = await fetch('/api/subscriptions/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          code: couponCodeInput.trim().toUpperCase(),
          planId: paidPlan?.id,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.coupon) {
        setAppliedCoupon(data.coupon)
        const discountLabel = data.coupon.discount_type === 'percentage'
          ? `${data.coupon.discount_value}%`
          : `$${data.coupon.discount_value}`
        setCouponFeedback({
          type: 'success',
          message: `✓ Coupon "${data.coupon.code}" applied successfully! (${discountLabel} discount)`,
        })
      } else {
        setCouponFeedback({
          type: 'error',
          message: data.error || 'Invalid or expired coupon code.',
        })
      }
    } catch (err: any) {
      setCouponFeedback({
        type: 'error',
        message: err.message || 'Error verifying coupon code.',
      })
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCodeInput('')
    setCouponFeedback(null)
  }

  // Verify order on return from inPAY payment gateway
  useEffect(() => {
    const isSuccess = searchParams.get('success') === 'true'
    const orderId = searchParams.get('order')

    if (isSuccess && orderId) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      fetch(`/api/subscriptions/verify-order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.is_premium) {
            setCheckoutSuccess({
              orderNumber: orderId.substring(0, 8).toUpperCase(),
              planName: 'Premium Plan',
            })
            setCurrentSub((prev: any) => ({
              ...prev,
              status: 'active',
            }))
          }
        })
        .catch((err) => console.error('Verification error:', err))
    }
  }, [searchParams])

  const handleDirectCheckout = async (plan: Plan) => {
    if (plan.price === 0 || submittingPlanId) return
    setSubmittingPlanId(plan.id)
    setErrorMsg(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          couponCode: appliedCoupon?.code || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.checkoutUrl) {
        // Redirect directly to inPAY official checkout page without opening any intermediate modal
        window.location.href = data.checkoutUrl
      } else {
        const errorDetail = typeof data.error === 'object'
          ? (data.error?.message || JSON.stringify(data.error))
          : (typeof data.error === 'string' ? data.error : "Failed to connect to the payment gateway. Please try again later.")
        setErrorMsg(errorDetail)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred. Please check your internet connection.')
    } finally {
      setSubmittingPlanId(null)
    }
  }

  const formatPrice = (plan: Plan) => {
    if (plan.price === 0) return { usd: '$0', uzs: '0 UZS', isDiscounted: false }

    const originalUsd = plan.price / 100
    let discountedUsd = originalUsd

    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discountedUsd = originalUsd * (1 - appliedCoupon.discount_value / 100)
      } else if (appliedCoupon.discount_type === 'fixed_usd') {
        discountedUsd = Math.max(0, originalUsd - appliedCoupon.discount_value)
      }
    }

    const isDiscounted = discountedUsd < originalUsd
    const usdStr = isDiscounted ? `$${discountedUsd.toFixed(1)}` : `$${originalUsd.toFixed(0)}`
    const origUsdStr = `$${originalUsd.toFixed(0)}`
    const approxUzs = (Number(discountedUsd) * 12800).toLocaleString('en-US')

    return {
      usd: usdStr,
      originalUsd: origUsdStr,
      uzs: `${approxUzs} UZS`,
      isDiscounted,
    }
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-[11px] font-bold uppercase tracking-wider">
              <StarsIcon className="w-3.5 h-3.5 text-primary" size={14} />
              FOX FORD IELTS PRO
            </span>
            {reason === 'premium_required' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold">
                <DangerCircleIcon className="w-3.5 h-3.5" size={14} />
                Premium Membership Required
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Achieve IELTS Band 7.5+ Faster with <span className="text-primary font-bold">Premium</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl mt-0.5">
            Authentic Cambridge 16-19 IELTS mock tests, comprehensive answer explanations, AI grading, and unlimited access to all sections.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground shadow-2xs">
            <ShieldCheckIcon className="w-4 h-4 text-primary" size={16} />
            <span>Secure Checkout • Payme, Click & Cards</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-start justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-start gap-2.5">
            <DangerCircleIcon className="w-4 h-4 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <p className="font-bold text-sm">Payment system notification:</p>
              <p className="text-xs leading-relaxed opacity-95">{String(errorMsg)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 rounded-lg text-destructive hover:bg-destructive/15 cursor-pointer shrink-0"
          >
            <CloseCircleIcon className="w-4 h-4" size={16} />
          </button>
        </div>
      )}

      {/* Promo Coupon Code Banner */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
            <TagPriceIcon className="w-5 h-5" size={20} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">
              Have a Promo Code or Discount Coupon?
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Enter your coupon code to receive an instant discount on your subscription.
            </p>
          </div>
        </div>

        {appliedCoupon ? (
          <div className="flex items-center gap-2 bg-primary/15 border border-primary/30 px-3 py-1.5 rounded-xl text-xs font-bold text-primary">
            <CheckCircleIcon className="w-4 h-4 text-primary shrink-0" size={16} />
            <span className="font-mono">{appliedCoupon.code}</span>
            <span className="text-[11px] font-medium opacity-90">
              ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value}`} discount applied)
            </span>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="ml-1 p-1 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Remove coupon"
            >
              <CloseCircleIcon className="w-3.5 h-3.5" size={14} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              id="coupon-code-input"
              name="couponCode"
              type="text"
              autoComplete="off"
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. FOXFORD20"
              className="px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary w-full sm:w-44"
            />
            <Button
              type="submit"
              disabled={validatingCoupon || !couponCodeInput.trim()}
              size="sm"
              className="bg-primary text-black font-bold text-xs shrink-0 shadow-xs cursor-pointer"
            >
              {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
            </Button>
          </form>
        )}
      </div>

      {couponFeedback && (
        <div
          className={cn(
            'p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in-50',
            couponFeedback.type === 'success'
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          )}
        >
          {couponFeedback.type === 'success' ? (
            <CheckCircleIcon className="w-4 h-4 shrink-0 text-primary" size={16} />
          ) : (
            <DangerCircleIcon className="w-4 h-4 shrink-0 text-destructive" size={16} />
          )}
          <span>{couponFeedback.message}</span>
        </div>
      )}

      {/* 4-Column Pricing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch pt-2">
        {plans.map((plan) => {
          const isSelected = searchParams.get('planId') === plan.id || searchParams.get('plan') === plan.slug
          const isCurrent = currentSub?.plan_id === plan.id && currentSub?.status === 'active'
          const isFree = plan.price === 0
          const prices = formatPrice(plan)
          const isYearly = plan.slug === 'yearly'
          const isMonthly = plan.slug === 'monthly'
          const isLifetime = plan.slug === 'lifetime'

          let badgeText = ''
          if (isSelected) badgeText = 'Selected Plan'
          else if (isYearly) badgeText = 'Best Value • Most Popular'
          else if (isMonthly) badgeText = 'Monthly Pass'
          else if (isLifetime) badgeText = 'Lifetime VIP Access'

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl transition-all duration-200 border bg-card text-card-foreground shadow-xs overflow-visible ${
                isSelected
                  ? 'border-primary ring-2 ring-primary shadow-xl shadow-primary/25 scale-[1.02] bg-gradient-to-b from-primary/10 via-card to-card z-10'
                  : isYearly
                  ? 'border-primary ring-2 ring-primary/40 shadow-md shadow-primary/10 bg-gradient-to-b from-primary/5 via-card to-card'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {badgeText && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <Badge
                    className={`text-[10px] font-semibold px-3 py-0.5 shadow-xs uppercase tracking-wider whitespace-nowrap rounded-full border ${
                      isYearly
                        ? 'bg-primary text-black border-amber-400/80 shadow-amber-500/20'
                        : 'bg-secondary text-foreground border-border/80'
                    }`}
                  >
                    {isYearly && <StarsIcon className="w-3 h-3 text-black inline-block mr-1" size={12} />}
                    {badgeText}
                  </Badge>
                </div>
              )}

              <div className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{plan.name}</h3>
                  {isCurrent && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] font-semibold shrink-0">
                      Your Current Plan
                    </Badge>
                  )}
                </div>

                <div className="my-3 pb-3 border-b border-border/60">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {prices.isDiscounted && !isFree && (
                      <span className="text-sm font-semibold text-muted-foreground line-through">
                        {prices.originalUsd}
                      </span>
                    )}
                    <span className={cn(
                      "text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground",
                      prices.isDiscounted && "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {typeof prices === 'string' ? prices : prices.usd}
                    </span>
                    {!isFree && (
                      <span className="text-xs text-muted-foreground font-medium">
                        /{plan.interval === 'yearly' ? 'year' : plan.interval === 'lifetime' ? 'lifetime' : 'month'}
                      </span>
                    )}
                    {prices.isDiscounted && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ml-auto">
                        Discount!
                      </span>
                    )}
                  </div>
                  {!isFree && typeof prices === 'object' && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                      ≈ {prices.uzs}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Included Features:</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {(plan.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="mt-0.5 w-3.5 h-3.5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                          <CheckCircleIcon className="w-3 h-3 text-primary" size={12} />
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-5 pt-0">
                {isFree ? (
                  <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-medium border-border bg-secondary/50 text-muted-foreground" disabled>
                    Standard Plan
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 cursor-default" disabled>
                    <span>Active Plan</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleDirectCheckout(plan)}
                    disabled={!!submittingPlanId}
                    className={`w-full h-10 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 ${
                      isYearly
                        ? 'bg-primary hover:bg-fox-yellow-dark text-primary-foreground shadow-primary/25 hover:shadow-md'
                        : 'bg-foreground hover:bg-foreground/90 text-background'
                    }`}
                  >
                    {submittingPlanId === plan.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Redirecting to payment...</span>
                      </>
                    ) : (
                      <>
                        <CardIcon className="w-4 h-4" size={16} />
                        <span>Get {plan.name}</span>
                        <AltArrowRightIcon className="w-4 h-4 ml-0.5" size={16} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Security & Official Payment Providers */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-4 h-4" size={16} />
            </div>
            <div>
              <p className="font-bold text-foreground">Official Payment Gateways</p>
              <p className="text-[11px]">Payme, Click, Uzcard, Humo, and Bank Cards</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircleIcon className="w-3.5 h-3.5 text-primary" size={14} />
            <span>Guaranteed Security (inPAY)</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircleIcon className="w-3.5 h-3.5 text-primary" size={14} />
            <span>24/7 Priority Support</span>
          </div>
        </div>

        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
        >
          <PlaneIcon className="w-3.5 h-3.5 text-primary" size={14} />
          <span>Questions? Ask via Telegram: @{botUsername}</span>
        </a>
      </div>

      {/* Success Celebration State */}
      {checkoutSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center mx-auto">
              <StarsIcon className="w-8 h-8" size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-foreground">Congratulations! Subscription Activated!</h4>
              <p className="text-xs text-muted-foreground">
                Order: <span className="font-mono font-bold text-foreground">#{checkoutSuccess.orderNumber}</span> ({checkoutSuccess.planName})
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                All Cambridge IELTS mock tests and AI evaluation systems are now fully unlocked for you.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => {
                  setCheckoutSuccess(null)
                  window.location.href = '/practice'
                }}
                className="w-full h-11 rounded-xl bg-primary hover:bg-fox-yellow-dark text-primary-foreground font-bold text-xs cursor-pointer shadow-md"
              >
                Start Practice Tests
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
