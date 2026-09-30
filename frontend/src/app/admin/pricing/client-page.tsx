import { useState, useEffect } from 'react'
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Sparkles,
  CreditCard,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  slug: string
  price: number // in cents
  currency: string
  interval: string
  features: string[]
  is_active: boolean
  sort_order: number
}

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_usd' | 'fixed_uzs'
  discount_value: number
  min_order_amount: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  status?: 'active' | 'inactive' | 'expired' | 'exhausted'
  created_at: string
}

export function AdminPricingClientView() {
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons'>('plans')

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState<Partial<Plan>>({})
  const [savingPlan, setSavingPlan] = useState(false)

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(true)
  const [couponsError, setCouponsError] = useState<string | null>(null)
  const [couponSearch, setCouponSearch] = useState('')
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false)
  const [creatingCoupon, setCreatingCoupon] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Create coupon form
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_usd' | 'fixed_uzs',
    discount_value: 20,
    min_order_amount: 0,
    max_uses: '' as string | number,
    expires_at: '',
    is_active: true,
  })

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    }
  }

  // Load Plans
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)
      setPlansError(null)
      const res = await fetch('/api/admin/plans', { headers: getAuthHeader() })
      const data = await res.json()
      if (res.ok && data.plans) {
        setPlans(data.plans)
      } else {
        setPlansError(data.error || 'Failed to fetch membership plans')
      }
    } catch (err: any) {
      console.error('Failed to fetch plans:', err)
      setPlansError(err.message || 'Error loading plans')
    } finally {
      setLoadingPlans(false)
    }
  }

  // Load Coupons
  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true)
      setCouponsError(null)
      const res = await fetch('/api/admin/coupons', { headers: getAuthHeader() })
      const data = await res.json()
      if (res.ok && data.coupons) {
        setCoupons(data.coupons)
      } else {
        setCouponsError(data.error || 'Failed to fetch discount coupons')
      }
    } catch (err: any) {
      console.error('Failed to fetch coupons:', err)
      setCouponsError(err.message || 'Error loading coupons')
    } finally {
      setLoadingCoupons(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    fetchCoupons()
  }, [])

  // Start editing a plan
  const handleEditPlan = (plan: Plan) => {
    setEditingPlanId(plan.id)
    setPlanForm({
      name: plan.name,
      price: plan.price / 100, // display in USD dollars
      interval: plan.interval,
      features: [...plan.features],
      is_active: plan.is_active,
    })
  }

  // Save edited plan
  const handleSavePlan = async (planId: string) => {
    try {
      setSavingPlan(true)
      const payload = {
        name: planForm.name,
        price: Math.round((Number(planForm.price) || 0) * 100), // store in cents
        interval: planForm.interval,
        features: planForm.features,
        is_active: planForm.is_active,
      }

      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        showFeedback('success', `Plan "${data.plan.name}" updated successfully!`)
        setEditingPlanId(null)
        fetchPlans()
      } else {
        showFeedback('error', data.error || 'Failed to update plan')
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving plan')
    } finally {
      setSavingPlan(false)
    }
  }

  // Create new coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCoupon.code.trim()) {
      showFeedback('error', 'Coupon code is required')
      return
    }

    try {
      setCreatingCoupon(true)
      let parsedExpiry: string | null = null
      if (newCoupon.expires_at) {
        const d = new Date(newCoupon.expires_at)
        if (!isNaN(d.getTime())) {
          parsedExpiry = d.toISOString()
        }
      }

      const payload = {
        code: newCoupon.code.trim().toUpperCase(),
        discount_type: newCoupon.discount_type,
        discount_value: Number(newCoupon.discount_value) || 0,
        min_order_amount: Number(newCoupon.min_order_amount) || 0,
        max_uses: newCoupon.max_uses && !isNaN(Number(newCoupon.max_uses)) ? Number(newCoupon.max_uses) : null,
        expires_at: parsedExpiry,
        is_active: newCoupon.is_active,
      }

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        showFeedback('success', `Coupon "${data.coupon.code}" created successfully!`)
        setShowCreateCouponModal(false)
        setNewCoupon({
          code: '',
          discount_type: 'percentage',
          discount_value: 20,
          min_order_amount: 0,
          max_uses: '',
          expires_at: '',
          is_active: true,
        })
        fetchCoupons()
      } else {
        showFeedback('error', data.error || 'Failed to create coupon')
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error creating coupon')
    } finally {
      setCreatingCoupon(false)
    }
  }

  // Toggle coupon active status
  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      if (res.ok) {
        fetchCoupons()
      }
    } catch (err) {
      console.error('Failed to toggle coupon:', err)
    }
  }

  // Delete coupon
  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      })
      if (res.ok) {
        showFeedback('success', `Coupon "${code}" deleted.`)
        fetchCoupons()
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete coupon')
    }
  }

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Filtered coupons
  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(couponSearch.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-20 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary shrink-0" />
            <span>Pricing, Plans & Coupons</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage membership subscription pricing, features, and student discount promo codes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={cn(
              'px-3 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'plans'
                ? 'bg-card text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CreditCard className="w-3.5 h-3.5 text-primary" />
            <span>Plans ({plans.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={cn(
              'px-3 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'coupons'
                ? 'bg-card text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>Coupons ({coupons.length})</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            'p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all shadow-xs animate-in fade-in-50',
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-destructive/10 border border-destructive/30 text-destructive'
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: MEMBERSHIP PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingPlans ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border" />
              ))
            ) : (
              plans.map((plan) => {
                const isEditing = editingPlanId === plan.id
                const usdPrice = plan.price / 100
                const approxUzs = (usdPrice * 12800).toLocaleString('en-US')

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      'relative flex flex-col justify-between transition-all duration-200 border bg-card overflow-hidden',
                      plan.slug === 'yearly' && 'border-primary ring-1 ring-primary/40 shadow-sm'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base font-bold text-foreground">
                          {isEditing ? (
                            <input
                              type="text"
                              value={planForm.name || ''}
                              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                              className="w-full px-2 py-1 text-sm font-bold rounded-lg border border-border bg-background"
                            />
                          ) : (
                            plan.name
                          )}
                        </CardTitle>
                        <Badge
                          variant={plan.is_active ? 'default' : 'secondary'}
                          className={cn(
                            'text-[10px] font-semibold uppercase shrink-0',
                            plan.is_active ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : ''
                          )}
                        >
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Slug: <span className="font-mono">{plan.slug}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                      {/* Price section */}
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">
                              Price (USD):
                            </label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold">$</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={planForm.price ?? ''}
                                onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                                className="w-full px-2.5 py-1 text-sm font-bold rounded-lg border border-border bg-background"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              ≈ {((Number(planForm.price) || 0) * 12800).toLocaleString('en-US')} UZS
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-extrabold text-foreground">
                                ${usdPrice.toFixed(0)}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                /{plan.interval}
                              </span>
                            </div>
                            {plan.price > 0 && (
                              <p className="text-[11px] text-muted-foreground font-medium">
                                ≈ {approxUzs} UZS
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Features list */}
                      <div className="space-y-1.5 flex-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Features:
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {plan.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-border flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              disabled={savingPlan}
                              onClick={() => handleSavePlan(plan.id)}
                              className="flex-1 bg-primary text-black font-bold text-xs"
                            >
                              {savingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPlanId(null)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPlan(plan)}
                            className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Price & Details</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COUPONS & PROMO CODES */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                placeholder="Search coupons (e.g. FOXFORD20)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              onClick={() => setShowCreateCouponModal(true)}
              className="bg-primary text-black font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promo Coupon</span>
            </Button>
          </div>

          {/* Coupons Table */}
          <Card className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Usage</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loadingCoupons ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading coupons...
                      </td>
                    </tr>
                  ) : filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground">
                        <Tag className="w-8 h-8 opacity-30 mx-auto mb-2" />
                        No coupons found. Click "Create Promo Coupon" above to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
                      const isExhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses

                      return (
                        <tr key={coupon.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground text-sm tracking-wide bg-secondary/80 px-2.5 py-1 rounded-lg border border-border">
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.code)}
                                title="Copy code"
                                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              >
                                {copiedCode === coupon.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}% OFF`
                              : coupon.discount_type === 'fixed_usd'
                              ? `$${coupon.discount_value} OFF`
                              : `${Number(coupon.discount_value).toLocaleString()} UZS OFF`}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
                                <span className="font-bold text-foreground">{coupon.used_count}</span>
                                <span>/</span>
                                <span>{coupon.max_uses !== null ? `${coupon.max_uses} max` : 'Unlimited'}</span>
                              </div>
                              {coupon.max_uses && (
                                <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{
                                      width: `${Math.min(100, (coupon.used_count / coupon.max_uses) * 100)}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-medium">
                            {coupon.expires_at ? (
                              <span className={cn(isExpired && 'text-destructive font-bold')}>
                                {new Date(coupon.expires_at).toLocaleDateString()}
                              </span>
                            ) : (
                              'No Expiration'
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-bold uppercase',
                                isExpired
                                  ? 'border-destructive/40 text-destructive bg-destructive/10'
                                  : isExhausted
                                  ? 'border-amber-500/40 text-amber-500 bg-amber-500/10'
                                  : coupon.is_active
                                  ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                                  : 'border-muted text-muted-foreground'
                              )}
                            >
                              {isExpired ? 'Expired' : isExhausted ? 'Exhausted' : coupon.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCoupon(coupon)}
                                title={coupon.is_active ? 'Disable coupon' : 'Enable coupon'}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                              >
                                {coupon.is_active ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                title="Delete coupon"
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50">
          <div className="w-[calc(100vw-1.5rem)] max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Create Promo Coupon</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCouponModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RAMAZON50 or FOXFORD30"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-sm uppercase font-bold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Discount Type</label>
                  <select
                    value={newCoupon.discount_type}
                    onChange={(e: any) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_usd">Fixed USD ($)</option>
                    <option value="fixed_uzs">Fixed UZS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Discount Value {newCoupon.discount_type === 'percentage' ? '(%)' : '($)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Max Uses (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={newCoupon.max_uses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newCoupon.expires_at}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coupon_active"
                  checked={newCoupon.is_active}
                  onChange={(e) => setNewCoupon({ ...newCoupon, is_active: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="coupon_active" className="text-xs font-medium text-foreground cursor-pointer">
                  Activate coupon immediately
                </label>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingCoupon}
                  className="bg-primary text-black font-bold text-xs"
                >
                  {creatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Create Coupon
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPricingClientView
