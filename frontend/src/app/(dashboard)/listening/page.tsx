import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Headphones, Clock, PlayCircle, BarChart, Crown, Lock, CheckCircle2, X, Sparkles, Search } from 'lucide-react'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { Link, useNavigate } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { LockKeyholeIcon, HeadphonesRoundIcon, ChartSquareIcon, RoundedMagnifierIcon, CloseCircleIcon } from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'
import { getTestScope } from '@/lib/test-scope'
import { SEOHead } from '@/components/seo/SEOHead'

export default function ListeningHub() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<any[]>([])
  const [userAttempts, setUserAttempts] = useState<any[]>([])
  const [avgScore, setAvgScore] = useState('--')
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [lockedModalTest, setLockedModalTest] = useState<any | null>(null)

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [partFilter, setPartFilter] = useState<'all' | 'part_1' | 'part_2' | 'part_3' | 'part_4' | 'full'>('all')
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsPremiumUser(Boolean(user.is_premium || user.role === 'admin'))
      }

      // Re-verify with subscriptions endpoint if token is present
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      if (token) {
        fetch('/api/subscriptions/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(d => {
            if (d?.is_premium) setIsPremiumUser(true)
          })
          .catch(() => {})
      }

      const [testsRes, attemptsRes] = await Promise.all([
        supabase
          .from('tests')
          .select('id, title, description, time_limit_minutes, total_questions, is_premium, tags, created_at')
          .eq('skill', 'listening')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        user
          ? supabase
              .from('test_attempts')
              .select('id, raw_score, estimated_band, submitted_at, created_at, test:tests(title, skill)')
              .eq('user_id', user.id)
              .in('status', ['submitted', 'scored'])
              .order('created_at', { ascending: false })
              .limit(10)
          : Promise.resolve({ data: [] })
      ])

      const loadedTests = testsRes.data || []
      const allAttempts = (attemptsRes.data || []) as any[]
      const attempts = allAttempts.filter((a: any) => a.test?.skill === 'listening')

      setTests(loadedTests)
      setUserAttempts(attempts)

      if (attempts.length > 0) {
        const bands = attempts.map((a: any) => Number(a.estimated_band) || 0).filter((b: number) => b > 0)
        if (bands.length > 0) {
          setAvgScore((bands.reduce((sum: number, b: number) => sum + b, 0) / bands.length).toFixed(1))
        }
      }

      setLoading(false)
    }
    loadData()
  }, [])

  // Filter tests based on Search, Part/Section, and Access Filter
  const filteredTests = tests.filter((test) => {
    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchTitle = (test.title || '').toLowerCase().includes(q)
      const matchDesc = (test.description || '').toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) return false
    }

    // 2. Access filter
    if (accessFilter === 'free' && test.is_premium) return false
    if (accessFilter === 'premium' && !test.is_premium) return false

    // 3. Part filter: strictly match only the selected part, or only full mock
    if (partFilter !== 'all') {
      const scope = getTestScope({ ...test, skill: 'listening' })
      if (!scope.matchesFilter(partFilter)) return false
    }

    return true
  })

  // Sort tests: Free tests first, Premium tests last, then newest first
  const displayTests = useMemo(() => {
    return [...filteredTests].sort((a, b) => {
      const aPrem = a.is_premium ? 1 : 0
      const bPrem = b.is_premium ? 1 : 0
      if (aPrem !== bPrem) return aPrem - bPrem // 0 (free) before 1 (premium)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [filteredTests])

  // Count tests per section/scope
  const partCounts = useMemo(() => {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0, full = 0
    tests.forEach((t) => {
      const s = getTestScope({ ...t, skill: 'listening' })
      if (s.scope === 'part_1') p1++
      else if (s.scope === 'part_2') p2++
      else if (s.scope === 'part_3') p3++
      else if (s.scope === 'part_4') p4++
      else if (s.scope === 'full') full++
    })
    return { all: tests.length, p1, p2, p3, p4, full }
  }, [tests])

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 bg-muted rounded w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <SEOHead
        title="IELTS Listening Mock Tests — Full Sections & Authentic Audio Tracks"
        description="Online IELTS Listening mock tests. 4 complete sections, audio tracks, map labeling and completion questions with real-time scoring."
        canonicalUrl="/listening"
      />
      {/* Header — Compact & No verbose intro on mobile */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/15 text-primary shrink-0">
            <HeadphonesRoundIcon className="h-5 w-5" size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">Listening Practice</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border shrink-0">
                {tests.length} tests
              </span>
            </div>
            {/* Introduction description strictly hidden on mobile as requested */}
            <p className="hidden md:block text-xs text-muted-foreground mt-0.5">
              Improve listening comprehension with authentic IELTS-style audio tracks and questions.
            </p>
          </div>
        </div>

        {/* Avg Score badge — inline on mobile */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl shadow-2xs shrink-0">
          <ChartSquareIcon className="w-3.5 h-3.5 text-primary" size={15} />
          <span className="text-xs text-muted-foreground hidden xs:inline font-medium">Avg:</span>
          <span className="text-xs sm:text-sm font-bold text-foreground">{avgScore}</span>
        </div>
      </div>

      {/* Search & Section Filter Bar — Ultra-compact on mobile */}
      <div className="sticky top-1 sm:top-2 z-30 bg-card/95 backdrop-blur-md border border-border rounded-2xl p-2.5 sm:p-4 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <RoundedMagnifierIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listening tests by title or topic..."
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-card transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <CloseCircleIcon className="w-4 h-4" size={16} />
              </button>
            )}
          </div>

          {/* Access Filter (Free vs Premium) */}
          <div className="w-full sm:w-auto shrink-0">
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-1.5 sm:py-2 bg-secondary/50 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Tests</option>
              <option value="free">Free Tests</option>
              <option value="premium">⭐ Premium Tests</option>
            </select>
          </div>
        </div>

        {/* Section / Part Filter Tabs — Horizontal scrollable chip row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-border/40 text-xs whitespace-nowrap">
          <button
            type="button"
            onClick={() => setPartFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === 'all'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            All ({partCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('part_1')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === 'part_1'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Part 1 ({partCounts.p1})
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('part_2')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === 'part_2'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Part 2 ({partCounts.p2})
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('part_3')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === 'part_3'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Part 3 ({partCounts.p3})
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('part_4')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === 'part_4'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Part 4 ({partCounts.p4})
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('full')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === 'full'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Full Mock ({partCounts.full})
          </button>
        </div>
      </div>

      {/* Practice Tests Section (Compact Grid without right sidebar) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Available Tests {displayTests.length > 0 && <span className="text-xs text-muted-foreground font-normal">({displayTests.length} tests)</span>}
          </h2>
          {(searchQuery || partFilter !== 'all' || accessFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setPartFilter('all')
                setAccessFilter('all')
              }}
              className="text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
        
        {displayTests.length === 0 ? (
          <Card className="border-border fox-shadow-sm bg-secondary/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FoxMascot variant="listening" size="lg" className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests match your filter</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-xs">
                Try adjusting your search query or selecting "All Tests" to view all available listening tests.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setPartFilter('all')
                  setAccessFilter('all')
                }}
                className="mt-4 px-4 py-2 bg-primary text-black font-bold rounded-xl text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayTests.map(test => {
              const isLocked = test.is_premium && !isPremiumUser
              const scope = getTestScope({ ...test, skill: 'listening' })
              const targetSectionText = scope.label

              const cardContent = (
                <div
                  className={cn(
                    "h-full p-3.5 rounded-xl border transition-all flex flex-col justify-between min-h-[74px] cursor-pointer group bg-card",
                    isLocked
                      ? "border-border/70 hover:border-amber-400 hover:shadow-xs"
                      : "border-border/80 hover:border-primary/60 hover:shadow-xs"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {test.title}
                    </h3>
                    {test.is_premium ? (
                      isPremiumUser ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                          Unlocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shrink-0">
                          Premium
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                        Free
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 font-normal">
                    {targetSectionText}
                  </p>
                </div>
              )

              if (isLocked) {
                return (
                  <div key={test.id} onClick={() => setLockedModalTest(test)} className="h-full">
                    {cardContent}
                  </div>
                )
              }

              return (
                <Link key={test.id} to={`/listening/${test.id}`} className="block h-full">
                  {cardContent}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      {lockedModalTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Crown className="w-4 h-4 fill-current" />
                </div>
                <h3 className="text-base font-bold">Premium Test Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setLockedModalTest(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-foreground">{lockedModalTest.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                This Cambridge IELTS Listening test is exclusively available to <strong className="text-foreground">Premium members</strong>. Upgrade to Premium for unlimited access to all authentic Cambridge audio tests and comprehensive answer explanations!
              </p>
            </div>

            <div className="p-3 bg-secondary/50 rounded-2xl border border-border/60 text-xs space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Premium Features:</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground pl-6 list-disc text-[11px]">
                <li>Complete Cambridge 16-19 audio tracks and transcripts</li>
                <li>Comprehensive explanations for all 40 questions</li>
                <li>Band 0-9.0 diagnostic performance analytics</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLockedModalTest(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => navigate(`/premium?testId=${lockedModalTest.id}&reason=premium_required`)}
                className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white text-xs font-bold transition-opacity flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>Upgrade to Premium</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
