import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookmarkSquareIcon,
  BookBookmarkIcon,
  HeadphonesRoundIcon,
  Pen2Icon,
  Microphone2Icon,
  TranslationIcon,
  RoundedMagnifierIcon,
  StarsIcon,
  ClockCircleIcon,
  TrashBinMinimalisticIcon,
  AltArrowRightIcon,
} from '@solar-icons/react/bold-duotone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { cn } from '@/lib/utils'

type CategoryFilter = 'all' | 'test' | 'question' | 'vocabulary' | 'writing_speaking'

interface SavedItem {
  id: string
  item_type: 'test' | 'question' | 'vocabulary' | 'writing' | 'speaking'
  item_id: string
  created_at: string
  details: any
}

export default function SavedItemsPage() {
  const [items, setItems] = useState<SavedItem[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({
    all: 0,
    test: 0,
    question: 0,
    vocabulary: 0,
    writing: 0,
    speaking: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSavedItems()
  }, [])

  const fetchSavedItems = async () => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch('/api/saved', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load saved items')
      const data = await res.json()
      setItems(data.items || [])
      setCounts(data.counts || { all: 0, test: 0, question: 0, vocabulary: 0, writing: 0, speaking: 0 })
    } catch (err: any) {
      console.error('Error fetching saved items:', err)
      setError(err.message || 'Could not load your saved items')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (item: SavedItem) => {
    setRemovingId(item.id)
    // Optimistic removal
    const previousItems = [...items]
    const updatedItems = items.filter((i) => i.id !== item.id)
    setItems(updatedItems)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch(`/api/saved/${item.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to delete bookmark')
      // Update count
      setCounts((prev) => ({
        ...prev,
        all: Math.max(0, prev.all - 1),
        [item.item_type]: Math.max(0, (prev[item.item_type] || 1) - 1),
      }))
    } catch (err) {
      console.error('Failed to remove saved item:', err)
      setItems(previousItems) // Revert
    } finally {
      setRemovingId(null)
    }
  }

  // Filter items by tab and search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'test' && item.item_type !== 'test') return false
      if (activeTab === 'question' && item.item_type !== 'question') return false
      if (activeTab === 'vocabulary' && item.item_type !== 'vocabulary') return false
      if (activeTab === 'writing_speaking' && !['writing', 'speaking'].includes(item.item_type)) return false

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const d = item.details || {}
        const textToSearch = [
          d.title,
          d.word,
          d.definition,
          d.question_text,
          d.instruction,
          d.prompt_text,
          d.test_title,
          item.item_type,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return textToSearch.includes(q)
      }

      return true
    })
  }, [items, activeTab, searchQuery])

  const writingSpeakingCount = (counts.writing || 0) + (counts.speaking || 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-xs">
            <BookmarkSquareIcon className="h-6 w-6" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Saved Items</h1>
            <p className="text-sm text-muted-foreground">
              Your personalized hub of bookmarked tests, tricky questions, vocabulary, and prompts.
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <RoundedMagnifierIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved items..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { key: 'all', label: 'All Items', count: counts.all },
          { key: 'test', label: 'Full Tests', count: counts.test },
          { key: 'question', label: 'Questions', count: counts.question },
          { key: 'vocabulary', label: 'Vocabulary', count: counts.vocabulary },
          { key: 'writing_speaking', label: 'Writing & Speaking', count: writingSpeakingCount },
        ].map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as CategoryFilter)}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                isActive
                  ? 'bg-foreground text-background border-foreground shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono',
                  isActive
                    ? 'bg-background/20 text-background'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {tab.count || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Loading your saved bookmarks...</p>
        </div>
      ) : error ? (
        <Card className="border-border">
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchSavedItems}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <Card className="border-border fox-shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FoxMascot variant="thinking" size="lg" className="mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">
              {searchQuery ? 'No matching saved items found' : 'No saved items in this category'}
            </h3>
            <p className="text-muted-foreground text-xs max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No bookmarks match "${searchQuery}". Try a different keyword.`
                : 'Bookmark tricky IELTS questions, advanced vocabulary, or full mock tests while practicing to review and re-attempt them anytime from this page.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/reading" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
                <BookBookmarkIcon className="w-4 h-4" size={16} />
                <span>Reading Tests</span>
              </Link>
              <Link to="/listening" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
                <HeadphonesRoundIcon className="w-4 h-4" size={16} />
                <span>Listening Tests</span>
              </Link>
              <Link to="/vocabulary" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
                <TranslationIcon className="w-4 h-4" size={16} />
                <span>Vocabulary Hub</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Saved Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              isRemoving={removingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Individual Saved Item Card Component
 */
function SavedItemCard({
  item,
  onRemove,
  isRemoving,
}: {
  item: SavedItem
  onRemove: () => void
  isRemoving: boolean
}) {
  const { item_type, details } = item
  if (!details) return null

  // Card Content By Item Type
  switch (item_type) {
    case 'test': {
      const skill = details.skill || 'reading'
      const skillIcon =
        skill === 'listening' ? (
          <HeadphonesRoundIcon className="w-4 h-4" size={16} />
        ) : skill === 'writing' ? (
          <Pen2Icon className="w-4 h-4" size={16} />
        ) : skill === 'speaking' ? (
          <Microphone2Icon className="w-4 h-4" size={16} />
        ) : (
          <BookBookmarkIcon className="w-4 h-4" size={16} />
        )

      const targetUrl = `/${skill}/${details.slug || details.id}`

      return (
        <Card className="border-border hover:border-primary/40 transition-all fox-shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
                  {skillIcon}
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Full Test • {details.skill}
                  </span>
                  <CardTitle className="text-sm font-bold text-foreground line-clamp-1">
                    {details.title}
                  </CardTitle>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemove}
                disabled={isRemoving}
                title="Remove bookmark"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <TrashBinMinimalisticIcon className="w-3.5 h-3.5" size={14} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-3">
            {details.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {details.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              {details.time_limit_minutes && (
                <span className="inline-flex items-center gap-1">
                  <ClockCircleIcon className="w-3 h-3 text-primary" size={12} /> {details.time_limit_minutes} mins
                </span>
              )}
              {details.difficulty && (
                <span className="capitalize px-1.5 py-0.5 rounded bg-secondary text-[10px] font-semibold">
                  {details.difficulty}
                </span>
              )}
              {details.is_premium && (
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold text-[10px]">
                  ★ Premium
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Saved {new Date(item.created_at).toLocaleDateString()}
              </span>
              <Link
                to={targetUrl}
                className={cn(buttonVariants({ size: 'sm' }), 'h-8 px-3 text-xs gap-1.5')}
              >
                <span>Take Test</span>
                <AltArrowRightIcon className="w-3.5 h-3.5" size={14} />
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    case 'question': {
      const qSkill = details.test_skill || 'reading'
      const targetUrl = details.test_id ? `/${qSkill}/${details.test_slug || details.test_id}` : '/practice'

      return (
        <Card className="border-border hover:border-primary/40 transition-all fox-shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                    Q#{details.question_number || '?'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    {details.question_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <CardTitle className="text-xs font-semibold text-muted-foreground">
                  From: {details.test_title || 'IELTS Practice Test'}
                </CardTitle>
              </div>
              <button
                type="button"
                onClick={onRemove}
                disabled={isRemoving}
                title="Remove bookmark"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <TrashBinMinimalisticIcon className="w-3.5 h-3.5" size={14} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-2.5">
            {details.instruction && (
              <p className="text-[11px] font-medium text-muted-foreground italic bg-secondary/40 p-2 rounded-lg">
                {details.instruction}
              </p>
            )}

            <p className="text-xs font-medium text-foreground leading-relaxed">
              {details.question_text}
            </p>

            {details.explanation && (
              <details className="text-[11px] text-muted-foreground bg-secondary/20 p-2 rounded-lg">
                <summary className="font-semibold text-primary cursor-pointer hover:underline">
                  View Answer Explanation
                </summary>
                <p className="mt-1.5 pt-1.5 border-t border-border/60 leading-relaxed text-foreground/80">
                  {details.explanation}
                </p>
              </details>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Saved {new Date(item.created_at).toLocaleDateString()}
              </span>
              <Link
                to={targetUrl}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 px-3 text-xs gap-1.5')}
              >
                <span>Open Test</span>
                <AltArrowRightIcon className="w-3.5 h-3.5 text-primary" size={14} />
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    case 'vocabulary': {
      return (
        <Card className="border-border hover:border-primary/40 transition-all fox-shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-foreground">{details.word}</h3>
                  {details.part_of_speech && (
                    <span className="text-[10px] italic px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {details.part_of_speech}
                    </span>
                  )}
                  {details.pronunciation && (
                    <span className="text-xs font-mono text-muted-foreground">
                      /{details.pronunciation}/
                    </span>
                  )}
                </div>
                {details.topic && (
                  <span className="text-[10px] font-semibold text-primary capitalize mt-0.5 block">
                    Topic: {details.topic}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onRemove}
                disabled={isRemoving}
                title="Remove bookmark"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <TrashBinMinimalisticIcon className="w-3.5 h-3.5" size={14} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-2.5">
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Definition:</strong> {details.definition}
            </p>

            {details.example_sentence && (
              <p className="text-[11px] text-muted-foreground italic bg-secondary/30 p-2 rounded-lg">
                &ldquo;{details.example_sentence}&rdquo;
              </p>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Saved {new Date(item.created_at).toLocaleDateString()}
              </span>
              <Link
                to={`/vocabulary?search=${encodeURIComponent(details.word)}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 px-3 text-xs gap-1.5')}
              >
                <TranslationIcon className="w-3.5 h-3.5 text-primary" size={14} />
                <span>Practice Word</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    case 'writing':
    case 'speaking': {
      const isWriting = item_type === 'writing'
      return (
        <Card className="border-border hover:border-primary/40 transition-all fox-shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground shadow-2xs flex items-center justify-center shrink-0">
                  {isWriting ? (
                    <Pen2Icon className="w-3.5 h-3.5" size={14} />
                  ) : (
                    <Microphone2Icon className="w-3.5 h-3.5" size={14} />
                  )}
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {isWriting ? `Writing • ${details.task_type || 'Task'}` : `Speaking • Part ${details.part_number || 2}`}
                  </span>
                  <CardTitle className="text-xs font-bold text-foreground">
                    {details.title || (isWriting ? 'Writing Prompt' : 'Speaking Cue Card')}
                  </CardTitle>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemove}
                disabled={isRemoving}
                title="Remove bookmark"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <TrashBinMinimalisticIcon className="w-3.5 h-3.5" size={14} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-2.5">
            <p className="text-xs text-foreground leading-relaxed line-clamp-3">
              {details.prompt_text}
            </p>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Saved {new Date(item.created_at).toLocaleDateString()}
              </span>
              <Link
                to={isWriting ? '/writing' : '/speaking'}
                className={cn(buttonVariants({ size: 'sm' }), 'h-8 px-3 text-xs gap-1.5')}
              >
                <span>Practice Now</span>
                <AltArrowRightIcon className="w-3.5 h-3.5" size={14} />
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    default:
      return null
  }
}
