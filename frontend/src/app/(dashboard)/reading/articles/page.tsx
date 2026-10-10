import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookBookmarkIcon, 
  DocumentTextIcon, 
  StarsIcon, 
  RoundedMagnifierIcon, 
  AltArrowRightIcon, 
  FileDownloadIcon,
  CrownStarIcon,
  ClockCircleIcon,
  CheckCircleIcon,
  NotesIcon,
} from '@solar-icons/react/bold-duotone'
import { Card, CardContent } from '@/components/ui/card'
import { SEOHead } from '@/components/seo/SEOHead'
import { cn } from '@/lib/utils'

export interface KeyVocabularyItem {
  word: string
  part_of_speech: string
  pronunciation: string
  translation_uz: string
  definition_uz: string
  band: string
}

export interface AcademicArticle {
  id: string
  title: string
  subtitle: string
  category: string
  level: string
  bandTarget: string
  readingTime: string
  wordCount: number
  publishedDate: string
  author: string
  summary: string
  tags: string[]
  pdfUrl?: string
  keyVocabulary: KeyVocabularyItem[]
  content: string[]
}

export default function ArticlesHubPage() {
  const [articles, setArticles] = useState<AcademicArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  useEffect(() => {
    async function loadArticles() {
      try {
        const res = await fetch('/articles/articles.json')
        if (res.ok) {
          const data = await res.json()
          setArticles(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Failed to load articles from public folder:', err)
      } finally {
        setLoading(false)
      }
    }
    loadArticles()
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    articles.forEach((a) => {
      if (a.category) set.add(a.category)
    })
    return ['all', ...Array.from(set)]
  }, [articles])

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = article.title.toLowerCase().includes(q)
        const matchSubtitle = article.subtitle.toLowerCase().includes(q)
        const matchSummary = article.summary.toLowerCase().includes(q)
        const matchTags = article.tags.some((t) => t.toLowerCase().includes(q))
        const matchVocab = article.keyVocabulary.some(
          (v) => v.word.toLowerCase().includes(q) || v.translation_uz.toLowerCase().includes(q)
        )
        if (!matchTitle && !matchSubtitle && !matchSummary && !matchTags && !matchVocab) {
          return false
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false
      }

      // Level filter
      if (selectedLevel !== 'all') {
        if (selectedLevel === '7.0' && !article.bandTarget.includes('7.0')) return false
        if (selectedLevel === '7.5' && !article.bandTarget.includes('7.5')) return false
        if (selectedLevel === '8.5' && !article.bandTarget.includes('8.5')) return false
      }

      return true
    })
  }, [articles, searchQuery, selectedCategory, selectedLevel])

  const totalVocabCount = useMemo(() => {
    return articles.reduce((sum, a) => sum + (a.keyVocabulary?.length || 0), 0)
  }, [articles])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      <SEOHead
        title="Academic Reading Articles & Passages | EduFox"
        description="Read authentic Cambridge IELTS academic articles. Highlight words for instant AI Uzbek translation and add them to your personal vocabulary."
      />

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 border-b border-border/40 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link to="/reading" className="hover:text-foreground transition-colors flex items-center gap-1">
              <BookBookmarkIcon className="w-3.5 h-3.5 text-primary" />
              <span>Reading</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Articles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Academic Articles</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              C1–C2 Level
            </span>
          </h1>
          <p className="text-sm font-normal text-muted-foreground max-w-2xl leading-relaxed">
            Enhance your IELTS academic reading speed and comprehension. Select any unfamiliar word in the text to view its contextual Uzbek translation and add it to your Leitner vocabulary system with 1 click.
          </p>
        </div>

        {/* Action: 100+ Articles PDF Download */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/100+ Articles.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-medium border border-border/80 transition-all hover:shadow-xs active:scale-98"
            title="Download the full 100+ Articles Collection PDF"
          >
            <FileDownloadIcon className="w-4 h-4 text-primary" />
            <span>100+ Articles (PDF)</span>
          </a>
        </div>
      </div>

      {/* 2. Highlights / Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Curated Articles</span>
            <DocumentTextIcon className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{articles.length}</p>
          <p className="text-[11px] text-muted-foreground font-normal">Academic Band 7.0–8.5+</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Indexed Academic Words</span>
            <NotesIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{totalVocabCount}+</p>
          <p className="text-[11px] text-muted-foreground font-normal">Contextual IELTS vocabulary</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>AI Translation Lookup</span>
            <StarsIcon className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">Active</p>
          <p className="text-[11px] text-muted-foreground font-normal">Highlight any word to translate</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>SRS Spaced Repetition</span>
            <CheckCircleIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">1-Click Save</p>
          <p className="text-[11px] text-muted-foreground font-normal">Syncs to Leitner flashcards</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <RoundedMagnifierIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, topic, or vocabulary word..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden focus:border-primary/80 focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">Band:</span>
            {[
              { id: 'all', label: 'All' },
              { id: '7.0', label: '7.0+' },
              { id: '7.5', label: '7.5+' },
              { id: '8.5', label: '8.5+' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  selectedLevel === lvl.id
                    ? 'bg-foreground text-background font-semibold shadow-2xs'
                    : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                selectedCategory === cat
                  ? 'bg-primary text-black font-semibold shadow-2xs'
                  : 'bg-card border border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {cat === 'all' ? 'All Topics' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/60 border border-border/40" />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border/60 space-y-3">
          <DocumentTextIcon className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-foreground">No articles match your criteria</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto font-normal">
            Try adjusting your search query or selecting a different topic filter above.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setSelectedLevel('all')
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="group rounded-2xl border border-border/60 hover:border-border/90 bg-card hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              <CardContent className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  {/* Top Metadata Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
                      {article.category}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                      {article.bandTarget}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      <Link to={`/reading/articles/${article.id}`}>
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground font-normal mt-1.5 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  {/* Key Vocabulary Preview */}
                  {article.keyVocabulary && article.keyVocabulary.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                        Featured Vocabulary:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {article.keyVocabulary.slice(0, 4).map((v) => (
                          <span
                            key={v.word}
                            className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-secondary/70 text-foreground border border-border/40"
                            title={`${v.word} (${v.part_of_speech}) — ${v.translation_uz}`}
                          >
                            {v.word}
                          </span>
                        ))}
                        {article.keyVocabulary.length > 4 && (
                          <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                            +{article.keyVocabulary.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-normal">
                    <ClockCircleIcon className="w-3.5 h-3.5" />
                    <span>{article.readingTime}</span>
                    <span>•</span>
                    <span>{article.wordCount} words</span>
                  </div>

                  <Link
                    to={`/reading/articles/${article.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Read Article</span>
                    <AltArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 5. Helpful Interactive Study Guide Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-amber-500/10 border border-primary/20 space-y-2">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <StarsIcon className="w-4 h-4 text-primary" />
          <span>How to use the Interactive Article Reader:</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl font-normal">
          Click any article above to open the study reader. While reading, simply highlight any unfamiliar academic word or phrase with your mouse or cursor. The AI Contextual Dictionary will immediately look up the exact Uzbek translation, English definition, sentence context, and synonyms. You can then click <strong className="text-foreground font-medium">1-Click Add to Vocabulary</strong> to schedule it for daily spaced repetition practice in your Flashcards section.
        </p>
      </div>
    </div>
  )
}
