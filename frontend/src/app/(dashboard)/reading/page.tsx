import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { createClient } from '@/lib/supabase/client'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LockKeyholeIcon, 
  BookBookmarkIcon, 
  ChartSquareIcon, 
  RoundedMagnifierIcon, 
  CloseCircleIcon,
  CrownStarIcon,
  StarsIcon,
  DocumentTextIcon,
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'
import { getTestScope } from '@/lib/test-scope'
import { SEOHead } from '@/components/seo/SEOHead'

export default function ReadingHub() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<any[]>([])
  const [userAttempts, setUserAttempts] = useState<any[]>([])
  const [avgScore, setAvgScore] = useState('--')
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [lockedModalTest, setLockedModalTest] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [passageFilter, setPassageFilter] = useState<'all' | 'passage_1' | 'passage_2' | 'passage_3' | 'full'>('all')
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all')

  useEffect(() => {
    async function load() {
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
          .select('id, title, description, time_limit_minutes, total_questions, is_premium, difficulty, tags, created_at')
          .eq('skill', 'reading')
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

      const allAttempts = (attemptsRes.data || []) as any[]
      const readingAttempts = allAttempts.filter((a: any) => a.test?.skill === 'reading')

      if (readingAttempts.length > 0) {
        const bands = readingAttempts.map((a: any) => Number(a.estimated_band) || 0).filter((b: number) => b > 0)
        if (bands.length > 0) {
          setAvgScore((bands.reduce((sum: number, b: number) => sum + b, 0) / bands.length).toFixed(1))
        }
      }

      setTests(testsRes.data || [])
      setUserAttempts(readingAttempts)
      setLoading(false)
    }
    load()
  }, [])

  // Filtered tests based on Search, Passage Filter, and Access Filter
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

    // 3. Passage filter: strictly match only the selected passage, or only full mock
    if (passageFilter !== 'all') {
      const scope = getTestScope(test)
      if (!scope.matchesFilter(passageFilter)) return false
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
  const passageCounts = useMemo(() => {
    let p1 = 0, p2 = 0, p3 = 0, full = 0
    tests.forEach((t) => {
      const s = getTestScope(t)
      if (s.scope === 'part_1') p1++
      else if (s.scope === 'part_2') p2++
      else if (s.scope === 'part_3') p3++
      else if (s.scope === 'full') full++
    })
    return { all: tests.length, p1, p2, p3, full }
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
        title="IELTS Reading Mock Tests — Full Passages & Official Questions"
        description="Take authentic Academic and General IELTS Reading mock tests online. Real Cambridge-format questions, instant grading, and AI insights."
        canonicalUrl="/reading"
      />
      {/* Hero Mascot Banner — Matching Reference Screenshot */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-background dark:from-sky-950/30 dark:via-background/50 dark:to-background border border-sky-200/60 dark:border-sky-900/40 p-5 sm:p-7 md:p-8 text-center flex flex-col items-center justify-center shadow-xs">
        <div className="absolute top-0 inset-x-0 h-32 bg-radial from-sky-200/40 dark:from-sky-500/10 to-transparent pointer-events-none" />

        {/* Centered Mascot */}
        <div className="relative z-10 max-w-[260px] sm:max-w-[340px] md:max-w-[420px] w-full transition-transform duration-300 hover:scale-[1.02]">
          <img
            src="/reading_mascot.png"
            alt="Reading Mascot"
            className="w-full h-auto object-contain drop-shadow-md select-none pointer-events-none"
          />
        </div>

        {/* Title & Description right below mascot */}
        <div className="relative z-10 mt-3 sm:mt-4 space-y-1.5 max-w-xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Master IELTS Reading comprehension
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Practice authentic Cambridge passages across all 3 sections with real-time scoring, full answer explanations, and instant band diagnostics.
          </p>

          {/* Quick Stats Pills */}
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-background/80 backdrop-blur-xs border border-border shadow-2xs text-foreground">
              <BookBookmarkIcon className="w-3.5 h-3.5 text-blue-500" size={14} />
              <span>{tests.length} Tests</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-background/80 backdrop-blur-xs border border-border shadow-2xs text-foreground">
              <ChartSquareIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
              <span>Avg Score: {avgScore}</span>
            </span>
            <Link
              to="/reading/articles"
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary text-black shadow-2xs hover:opacity-90 transition-all cursor-pointer"
            >
              <DocumentTextIcon className="w-3.5 h-3.5" size={14} />
              <span>Academic Articles (NEW)</span>
            </Link>
          </div>
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
              placeholder="Search tests by title or topic..."
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-card transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
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

        {/* Section / Passage Filter Tabs — Horizontal scrollable chip row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-border/40 text-xs whitespace-nowrap">
          <button
            type="button"
            onClick={() => setPassageFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              passageFilter === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            All ({passageCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setPassageFilter('passage_1')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              passageFilter === 'passage_1'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Passage 1 ({passageCounts.p1})
          </button>
          <button
            type="button"
            onClick={() => setPassageFilter('passage_2')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              passageFilter === 'passage_2'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Passage 2 ({passageCounts.p2})
          </button>
          <button
            type="button"
            onClick={() => setPassageFilter('passage_3')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              passageFilter === 'passage_3'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Passage 3 ({passageCounts.p3})
          </button>
          <button
            type="button"
            onClick={() => setPassageFilter('full')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              passageFilter === 'full'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Full Mock ({passageCounts.full})
          </button>
        </div>
      </div>

      {/* Practice Tests Section (Compact Grid without right sidebar) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Available Tests {displayTests.length > 0 && <span className="text-xs text-muted-foreground font-normal">({displayTests.length} tests)</span>}
          </h2>
          {(searchQuery || passageFilter !== 'all' || accessFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setPassageFilter('all')
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
              <FoxMascot variant="reading" size="lg" className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests match your filter</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-xs">
                Try adjusting your search query or selecting "All Tests" to view all available reading tests.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setPassageFilter('all')
                  setAccessFilter('all')
                }}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayTests.map(test => {
              const isLocked = test.is_premium && !isPremiumUser
              const scope = getTestScope(test)
              const targetSectionText = scope.label

              const cardContent = (
                <div
                  className={cn(
                    "h-full p-3.5 rounded-xl border transition-all flex flex-col justify-between min-h-[74px] cursor-pointer group bg-card",
                    isLocked
                      ? "border-border/70 hover:border-muted-foreground/40 hover:shadow-xs"
                      : "border-border/80 hover:border-primary/60 hover:shadow-xs"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {test.title}
                    </h3>
                    {test.is_premium ? (
                      isPremiumUser ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                          Unlocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                          Premium
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
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
                <Link key={test.id} to={`/tests/reading/${test.id}`} className="block h-full">
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
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-2xs flex items-center justify-center font-semibold">
                  <CrownStarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold">Premium Test Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setLockedModalTest(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <CloseCircleIcon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="space-y-3 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-md flex items-center justify-center mx-auto">
                <LockKeyholeIcon className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-foreground">{lockedModalTest.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                This Cambridge IELTS mock test is exclusively available to <strong className="text-foreground">Premium members</strong>. Upgrade to Premium for unlimited access to all authentic Cambridge tests, detailed answer explanations, and AI diagnostic reports!
              </p>
            </div>

            <div className="p-3 bg-secondary/50 rounded-2xl border border-border/60 text-xs space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <StarsIcon className="w-4 h-4 text-primary" />
                <span>Premium Features:</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground pl-6 list-disc text-[11px]">
                <li>Complete Cambridge 16-19 full authentic mock tests</li>
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
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-opacity flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CrownStarIcon className="w-4 h-4" />
                <span>Upgrade to Premium</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
