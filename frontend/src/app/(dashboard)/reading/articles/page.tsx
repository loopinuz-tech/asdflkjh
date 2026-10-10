import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookBookmarkIcon, 
  DocumentTextIcon, 
  StarsIcon, 
  RoundedMagnifierIcon, 
  AltArrowRightIcon, 
  AltArrowLeftIcon,
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
  pageNumber: number
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
  coverImage: string
  tags: string[]
  pdfUrl?: string
  keyVocabulary: KeyVocabularyItem[]
  content: string[]
}

const ITEMS_PER_PAGE = 12

export default function ArticlesHubPage() {
  const [articles, setArticles] = useState<AcademicArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

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
        const matchAuthor = article.author?.toLowerCase().includes(q)
        const matchSummary = article.summary.toLowerCase().includes(q)
        const matchPage = `article ${article.pageNumber}`.includes(q) || `${article.pageNumber}` === q
        const matchVocab = article.keyVocabulary?.some(
          (v) => v.word.toLowerCase().includes(q) || v.translation_uz.toLowerCase().includes(q)
        )
        if (!matchTitle && !matchAuthor && !matchSummary && !matchPage && !matchVocab) {
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
        if (selectedLevel === '8.0' && !article.bandTarget.includes('8.0')) return false
        if (selectedLevel === '8.5' && !article.bandTarget.includes('8.5')) return false
      }

      return true
    })
  }, [articles, searchQuery, selectedCategory, selectedLevel])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedLevel])

  // Pagination calculation
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredArticles, currentPage])

  const totalVocabCount = useMemo(() => {
    return articles.reduce((sum, a) => sum + (a.keyVocabulary?.length || 0), 0)
  }, [articles])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pb-20">
      <SEOHead
        title="100+ Academic Reading Articles & Passages | EduFox"
        description="Authentic Cambridge IELTS 100+ academic articles with real magazine illustrations, AI contextual Uzbek dictionary, and 1-click SRS vocabulary sync."
      />

      {/* 1. Header Section — Full Width */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 border-b border-border/40 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link to="/reading" className="hover:text-foreground transition-colors flex items-center gap-1">
              <BookBookmarkIcon className="w-3.5 h-3.5 text-primary" />
              <span>Reading</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Articles Collection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <span>100+ Academic Articles</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
              101 Articles
            </span>
          </h1>
          <p className="text-sm font-normal text-muted-foreground max-w-3xl leading-relaxed">
            Full authentic Cambridge IELTS academic articles collection with original scientific illustrations. Select any unfamiliar word or sentence in the text for instant AI contextual Uzbek translation and 1-click addition to your Leitner vocabulary system.
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
            <span>Download 100+ Articles (PDF)</span>
          </a>
        </div>
      </div>

      {/* 2. Highlights / Stats Strip — Full Width */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Articles in PDF</span>
            <DocumentTextIcon className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{articles.length} Articles</p>
          <p className="text-[11px] text-muted-foreground font-normal">All 101 illustrated plates extracted</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Indexed Academic Terms</span>
            <NotesIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{totalVocabCount}+ Words</p>
          <p className="text-[11px] text-muted-foreground font-normal">C1–C2 level contextual vocabulary</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>AI Contextual Dictionary</span>
            <StarsIcon className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">Active</p>
          <p className="text-[11px] text-muted-foreground font-normal">Select any word to translate</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>SRS Leitner Flashcards</span>
            <CheckCircleIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">1-Click Save</p>
          <p className="text-[11px] text-muted-foreground font-normal">Queued for active review</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <RoundedMagnifierIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 101 articles by title, author, keyword, or page number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden focus:border-primary/80 focus:ring-1 focus:ring-primary/40 transition-all font-normal"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">Band:</span>
            {[
              { id: 'all', label: 'All' },
              { id: '7.0', label: '7.0+' },
              { id: '7.5', label: '7.5+' },
              { id: '8.0', label: '8.0+' },
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
              {cat === 'all' ? 'All 101 Articles' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Showing count indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)}</strong> of <strong className="text-foreground font-semibold">{filteredArticles.length}</strong> articles
        </span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>

      {/* 4. Articles Grid — Full Width Responsive (4 columns on wide screens) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-muted/60 border border-border/40" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {paginatedArticles.map((article) => (
            <Card
              key={article.id}
              className="group rounded-2xl border border-border/60 hover:border-border/90 bg-card hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Real Illustrated Article Cover from PDF */}
                <Link to={`/reading/articles/${article.id}`} className="block relative aspect-16/10 w-full overflow-hidden bg-muted/40 border-b border-border/50">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white border border-white/20 font-mono">
                      #{article.pageNumber}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md text-white/90">
                      {article.category}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono shadow-xs">
                      {article.bandTarget}
                    </span>
                  </div>
                </Link>

                <CardContent className="p-4 space-y-3">
                  {/* Title & Author */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      <Link to={`/reading/articles/${article.id}`}>
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-normal mt-1 truncate">
                      By {article.author}
                    </p>
                    <p className="text-xs text-muted-foreground font-normal mt-1.5 line-clamp-2 leading-relaxed">
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
                        {article.keyVocabulary.slice(0, 3).map((v) => (
                          <span
                            key={v.word}
                            className="text-[10px] font-normal px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground border border-border/40"
                            title={`${v.word} (${v.part_of_speech}) — ${v.translation_uz}`}
                          >
                            {v.word}
                          </span>
                        ))}
                        {article.keyVocabulary.length > 3 && (
                          <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                            +{article.keyVocabulary.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Card Footer */}
              <div className="p-4 pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-normal">
                  <ClockCircleIcon className="w-3 h-3" />
                  <span>{article.readingTime}</span>
                </div>

                <Link
                  to={`/reading/articles/${article.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-all"
                >
                  <span>Study</span>
                  <AltArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-secondary text-foreground text-xs font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
          >
            <AltArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {Array.from({ length: Math.min(7, totalPages) }, (_, idx) => {
            let pageNum = idx + 1
            if (totalPages > 7) {
              if (currentPage > 4 && currentPage < totalPages - 2) {
                pageNum = currentPage - 3 + idx
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 6 + idx
              }
            }
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => {
                  setCurrentPage(pageNum)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={cn(
                  'w-8 h-8 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  currentPage === pageNum
                    ? 'bg-primary text-black font-semibold shadow-2xs'
                    : 'bg-card border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-secondary text-foreground text-xs font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Next</span>
            <AltArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6. Helpful Interactive Study Guide Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-amber-500/10 border border-primary/20 space-y-2">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <StarsIcon className="w-4 h-4 text-primary" />
          <span>Interactive Reading & Vocabulary Guide:</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl font-normal">
          Click on any of the 101 Cambridge academic articles above to enter the study reader. While reading, highlight any unfamiliar academic term or phrase to instantly view its contextual Uzbek translation and pronunciation audio. Click <strong className="text-foreground font-medium">1-Click Add to Personal Vocabulary</strong> to automatically sync it with your Leitner Spaced Repetition (SRS) review queue.
        </p>
      </div>
    </div>
  )
}
