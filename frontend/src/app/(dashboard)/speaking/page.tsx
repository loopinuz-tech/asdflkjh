import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { Link, useNavigate } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { 
  Microphone2Icon, 
  ChartSquareIcon, 
  RoundedMagnifierIcon, 
  CloseCircleIcon, 
  CrownStarIcon, 
  LockKeyholeIcon, 
  StarsIcon 
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'

export default function SpeakingHub() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [prompts, setPrompts] = useState<any[]>([])
  const [userSubmissions, setUserSubmissions] = useState<any[]>([])
  const [avgBand, setAvgBand] = useState('--')
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [lockedModalPrompt, setLockedModalPrompt] = useState<any | null>(null)

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [partFilter, setPartFilter] = useState<'all' | '1' | '2' | '3'>('all')
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [visibleCount, setVisibleCount] = useState<number>(24)

  useEffect(() => {
    setVisibleCount(24)
  }, [searchQuery, partFilter, accessFilter])

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

      const [promptsRes, submissionsRes] = await Promise.all([
        supabase
          .from('speaking_prompts')
          .select('id, title, prompt_text, part_number, difficulty, is_premium, follow_up_questions, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(300),
        user
          ? supabase
              .from('speaking_submissions')
              .select('id, created_at, prompt:speaking_prompts(title, part_number), feedback:speaking_feedback(estimated_band)')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] })
      ])

      const loadedPrompts = promptsRes.data || []
      const submissions = (submissionsRes.data || []) as any[]

      setPrompts(loadedPrompts)
      setUserSubmissions(submissions)

      if (submissions.length > 0) {
        const bands = submissions
          .map((s: any) => {
            const fb = Array.isArray(s.feedback) ? s.feedback[0] : s.feedback
            return fb?.estimated_band ? Number(fb.estimated_band) : null
          })
          .filter((b: number | null): b is number => b !== null && b > 0)

        if (bands.length > 0) {
          setAvgBand((bands.reduce((sum: number, b: number) => sum + b, 0) / bands.length).toFixed(1))
        }
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Filtered prompts based on Search, Part Filter (1, 2, 3), and Access Filter
  const filteredPrompts = prompts.filter((prompt) => {
    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchTitle = (prompt.title || '').toLowerCase().includes(q)
      const matchText = (prompt.prompt_text || '').toLowerCase().includes(q)
      if (!matchTitle && !matchText) return false
    }

    // 2. Part filter
    if (partFilter !== 'all' && String(prompt.part_number) !== partFilter) return false

    // 3. Access filter
    if (accessFilter === 'free' && prompt.is_premium) return false
    if (accessFilter === 'premium' && !prompt.is_premium) return false

    return true
  })

  // Sort prompts: All Free topics (Part 1 -> Part 2 -> Part 3), then All Pro/Premium topics (Part 1 -> Part 2 -> Part 3)
  const displayPrompts = useMemo(() => {
    return [...filteredPrompts].sort((a, b) => {
      // 1. All Free topics (0) first, then all Premium topics (1)
      const aPrem = a.is_premium ? 1 : 0
      const bPrem = b.is_premium ? 1 : 0
      if (aPrem !== bPrem) return aPrem - bPrem

      // 2. Part 1 -> Part 2 -> Part 3
      const aPart = Number(a.part_number) || 1
      const bPart = Number(b.part_number) || 1
      if (aPart !== bPart) return aPart - bPart

      // 3. Newest first
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [filteredPrompts])

  const visiblePrompts = displayPrompts.slice(0, visibleCount)

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
      {/* Header — Compact & No verbose intro on mobile */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/15 text-primary shrink-0">
            <Microphone2Icon className="h-5 w-5" size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">Speaking Practice</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border shrink-0">
                {prompts.length} topics
              </span>
            </div>
            {/* Introduction description strictly hidden on mobile as requested */}
            <p className="hidden md:block text-xs text-muted-foreground mt-0.5">
              Practice real exam topics with AI speech evaluation and Pronunciation diagnostics.
            </p>
          </div>
        </div>

        {/* Avg Band badge — inline on mobile */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl shadow-2xs shrink-0">
          <ChartSquareIcon className="w-3.5 h-3.5 text-primary" size={15} />
          <span className="text-xs text-muted-foreground hidden xs:inline font-medium">Avg:</span>
          <span className="text-xs sm:text-sm font-bold text-foreground">{avgBand}</span>
        </div>
      </div>

      {/* Search & Part Filter Bar — Ultra-compact on mobile */}
      <div className="sticky top-1 sm:top-2 z-30 bg-card/95 backdrop-blur-md border border-border rounded-2xl p-2.5 sm:p-4 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <RoundedMagnifierIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search speaking topics by keyword..."
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-card transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <CloseCircleIcon className="w-3.5 h-3.5" size={14} />
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
              <option value="all">All Topics</option>
              <option value="free">Free Topics</option>
              <option value="premium">⭐ Premium Topics</option>
            </select>
          </div>
        </div>

        {/* Part / Section Filter Tabs — Horizontal scrollable chip row */}
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
            All Topics
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('1')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === '1'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Part 1 (Interview)
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('2')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === '2'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Part 2 (Cue Card)
          </button>
          <button
            type="button"
            onClick={() => setPartFilter('3')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              partFilter === '3'
                ? 'bg-primary text-black font-bold shadow-2xs'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Part 3 (Discussion)
          </button>
        </div>
      </div>

      {/* Practice Topics Section (Compact Grid without right sidebar) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Practice Topics {displayPrompts.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                (Showing {visiblePrompts.length} of {displayPrompts.length} topics)
              </span>
            )}
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
        
        {displayPrompts.length === 0 ? (
          <Card className="border-border fox-shadow-sm bg-secondary/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FoxMascot variant="speaking" size="lg" className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">No topics match your filter</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-xs">
                Try adjusting your search query or selecting "All Topics" to view all available speaking topics.
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
            {visiblePrompts.map(prompt => {
              const isLocked = prompt.is_premium && !isPremiumUser
              const partNum = Number(prompt.part_number) || 1

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
                      {prompt.title}
                    </h3>
                    {prompt.is_premium ? (
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
                    Part {partNum}
                  </p>
                </div>
              )

              if (isLocked) {
                return (
                  <div key={prompt.id} onClick={() => setLockedModalPrompt(prompt)} className="h-full">
                    {cardContent}
                  </div>
                )
              }

              return (
                <Link key={prompt.id} to={`/speaking/${prompt.id}`} className="block h-full">
                  {cardContent}
                </Link>
              )
            })}
          </div>
        )}

        {displayPrompts.length > visibleCount && (
          <div className="pt-4 pb-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 24)}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <span>Load More Topics</span>
              <span className="px-2 py-0.5 rounded-full bg-black/15 text-[11px] font-extrabold">
                +{Math.min(24, displayPrompts.length - visibleCount)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(displayPrompts.length)}
              className="px-4 py-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer transition-colors"
            >
              Show All ({displayPrompts.length})
            </button>
          </div>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      {lockedModalPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <CrownStarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold">Premium Speaking Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setLockedModalPrompt(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <CloseCircleIcon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="space-y-3 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto text-primary">
                <LockKeyholeIcon className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-bold text-foreground">{lockedModalPrompt.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                This official IELTS Speaking topic is exclusively available to <strong className="text-foreground">Premium members</strong>. Upgrade to Premium to unlock all Part 1, 2, and 3 topics, voice recording, and AI examiner evaluations across Fluency, Pronunciation, Lexical Resource, and Grammar!
              </p>
            </div>

            <div className="p-3 bg-secondary/50 rounded-2xl border border-border/60 text-xs space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <StarsIcon className="w-4 h-4 text-primary" />
                <span>Premium Features:</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground pl-6 list-disc text-[11px]">
                <li>IELTS Band score evaluation across all 4 criteria (FC/LR/GRA/PRON)</li>
                <li>Authentic exam questions with in-depth audio feedback</li>
                <li>Band 9.0 model answers and pronunciation demonstrations</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLockedModalPrompt(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => navigate(`/premium?promptId=${lockedModalPrompt.id}&reason=premium_required`)}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-opacity flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
