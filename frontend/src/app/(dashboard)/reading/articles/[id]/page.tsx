import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  BookBookmarkIcon, 
  StarsIcon, 
  AltArrowLeftIcon, 
  AltArrowRightIcon,
  CrownStarIcon,
  VolumeLoudIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  ClockCircleIcon,
  FileDownloadIcon,
  NotesIcon,
} from '@solar-icons/react/bold-duotone'
import { Loader2, Highlighter, ExternalLink, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SEOHead } from '@/components/seo/SEOHead'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { AcademicArticle, KeyVocabularyItem } from '../page'

const FONT_SIZES = [
  { label: 'Normal', prose: 'text-base sm:text-lg leading-relaxed' },
  { label: 'Large', prose: 'text-lg sm:text-xl leading-relaxed' },
  { label: 'X-Large', prose: 'text-xl sm:text-2xl leading-loose' },
]

export default function ArticleReaderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const contentRef = useRef<HTMLDivElement>(null)
  const lastRangeRef = useRef<Range | null>(null)

  const [article, setArticle] = useState<AcademicArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [fontSizeIdx, setFontSizeIdx] = useState(0)
  const [showPlateModal, setShowPlateModal] = useState(false)

  // Floating selection menu
  const [floatingMenu, setFloatingMenu] = useState<{
    x: number
    y: number
    selectedText: string
  } | null>(null)

  // AI Contextual Dictionary Modal
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLookupData, setAiLookupData] = useState<any>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  // 1-Click Save to Vocab state
  const [isSavingVocab, setIsSavingVocab] = useState(false)
  const [vocabSaved, setVocabSaved] = useState(false)
  const [vocabSuccessMessage, setVocabSuccessMessage] = useState<string | null>(null)

  // Load user premium status
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.role === 'admin' || (user as any).is_premium) {
          setIsPremiumUser(true)
        }
      }
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
    }
    checkAuth()
  }, [])

  // Load article data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/articles/articles.json')
        if (res.ok) {
          const list: AcademicArticle[] = await res.json()
          const found = list.find((a) => {
            if (a.id === id || String(a.pageNumber) === id) return true
            if (id?.startsWith('article-')) {
              const parts = id.split('-')
              const pNum = Number(parts[1])
              if (!isNaN(pNum) && a.pageNumber === pNum) return true
            }
            return false
          })
          if (found) {
            setArticle(found)
          }
        }
      } catch (err) {
        console.error('Error loading article:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Extract surrounding context sentence around range
  const getSurroundingSentence = useCallback((range: Range | null, selectedText: string): string => {
    if (!range) return selectedText
    try {
      const containerText = range.startContainer.textContent || ''
      const start = Math.max(0, range.startOffset - 120)
      const end = Math.min(containerText.length, range.endOffset + 120)
      const snippet = containerText.slice(start, end).trim()
      return snippet || selectedText
    } catch {
      return selectedText
    }
  }, [])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setFloatingMenu(null)
      return
    }

    const text = sel.toString().trim()
    if (!text || text.length > 200) {
      setFloatingMenu(null)
      return
    }

    const range = sel.getRangeAt(0)
    const root = contentRef.current
    if (!root || (!root.contains(range.startContainer) && !root.contains(range.commonAncestorContainer))) {
      setFloatingMenu(null)
      return
    }

    lastRangeRef.current = range.cloneRange()
    const rect = range.getBoundingClientRect()

    const menuEstimatedWidth = 260
    const clampedX = Math.max(
      menuEstimatedWidth / 2 + 16,
      Math.min(window.innerWidth - menuEstimatedWidth / 2 - 16, rect.left + rect.width / 2)
    )
    const clampedY = Math.max(64, rect.top - 12)

    setFloatingMenu({
      x: clampedX,
      y: clampedY,
      selectedText: text,
    })
  }, [])

  // Trigger AI Contextual Translation
  const handleTriggerAILookup = useCallback(async (wordToLookup: string, preContext?: string) => {
    const cleanText = wordToLookup.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»“”]/g, '').trim()
    if (!cleanText) return

    const surrounding = preContext || getSurroundingSentence(lastRangeRef.current, cleanText)
    setFloatingMenu(null)
    setAiModalOpen(true)
    setAiLoading(true)
    setAiError(null)
    setVocabSaved(false)
    setVocabSuccessMessage(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch('/api/vocabulary/ai-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          word: cleanText,
          context: surrounding,
          passageTitle: article?.title || 'Academic Article'
        })
      })

      if (!res.ok) {
        if (res.status === 403) {
          setIsPremiumUser(false)
          setAiModalOpen(false)
          setShowPremiumModal(true)
          return
        }
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to retrieve AI contextual definition')
      }

      const json = await res.json()
      setAiLookupData(json.data)
      if (json.data?.is_saved) {
        setVocabSaved(true)
      }
    } catch (err: any) {
      setAiError(err.message || 'Error loading definition')
    } finally {
      setAiLoading(false)
    }
  }, [article, getSurroundingSentence])

  // 1-Click Save to Vocabulary
  const handleSaveToVocab = async () => {
    if (!aiLookupData) return
    setIsSavingVocab(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch('/api/vocabulary/save-from-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          word: aiLookupData.word || aiLookupData.base_form,
          definition: aiLookupData.translation_uz + (aiLookupData.definition_uz ? ` — ${aiLookupData.definition_uz}` : ''),
          example_sentence: aiLookupData.example_sentence,
          pronunciation: aiLookupData.pronunciation,
          part_of_speech: aiLookupData.part_of_speech,
          topic: article?.category || 'Reading Academic',
          difficulty: aiLookupData.difficulty || 'medium',
        })
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setVocabSaved(true)
        setVocabSuccessMessage(json.message || 'Word added to personal vocabulary!')
      } else {
        alert(json.error || 'Failed to save word')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while saving word')
    } finally {
      setIsSavingVocab(false)
    }
  }

  // Audio pronunciation synthesis
  const playWordAudio = (word: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-GB'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    } catch {}
  }

  // Apply highlight with ZERO horizontal padding to prevent letter separation
  const applyHighlight = (color: string) => {
    const sel = window.getSelection()
    const range = sel && !sel.isCollapsed && sel.rangeCount > 0 
      ? sel.getRangeAt(0) 
      : lastRangeRef.current

    if (!range) {
      setFloatingMenu(null)
      return
    }

    try {
      const mark = document.createElement('mark')
      mark.className = 'article-highlight'
      mark.style.backgroundColor = color
      mark.style.color = '#0f172a'
      mark.style.borderRadius = '0'
      mark.style.padding = '1px 0'
      mark.style.margin = '0'
      mark.style.display = 'inline'
      mark.style.cursor = 'pointer'
      mark.style.boxDecorationBreak = 'clone'
      ;(mark.style as any).webkitBoxDecorationBreak = 'clone'
      mark.title = 'Click to remove highlight'
      mark.onclick = (e) => {
        e.stopPropagation()
        const currentSel = window.getSelection()
        if (currentSel && !currentSel.isCollapsed) return
        const parent = mark.parentNode
        if (parent) {
          while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark)
          }
          parent.removeChild(mark)
          parent.normalize()
        }
      }

      mark.appendChild(range.extractContents())
      range.insertNode(mark)
      sel?.removeAllRanges()
    } catch (err) {
      console.error('Highlight error:', err)
    }
    setFloatingMenu(null)
  }

  // Remove highlight from current selection
  const removeHighlight = () => {
    const root = contentRef.current
    if (!root) {
      setFloatingMenu(null)
      return
    }

    const sel = window.getSelection()
    const range = sel && !sel.isCollapsed && sel.rangeCount > 0
      ? sel.getRangeAt(0)
      : lastRangeRef.current

    if (range) {
      const marks = root.querySelectorAll('mark')
      marks.forEach((mark) => {
        try {
          if (range.intersectsNode(mark)) {
            const parent = mark.parentNode
            if (parent) {
              while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark)
              }
              parent.removeChild(mark)
              parent.normalize()
            }
          }
        } catch {}
      })
      sel?.removeAllRanges()
    }
    setFloatingMenu(null)
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 bg-muted/60 rounded-lg" />
        <div className="h-10 w-3/4 bg-muted/60 rounded-xl" />
        <div className="h-5 w-1/2 bg-muted/60 rounded-lg" />
        <div className="space-y-4 pt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/60 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 text-center py-16 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Article Not Found</h2>
        <p className="text-xs text-muted-foreground font-normal">
          The requested article could not be located in the catalog.
        </p>
        <Button onClick={() => navigate('/reading/articles')} variant="outline" className="text-xs cursor-pointer">
          <AltArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Back to Articles
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-24">
      <SEOHead
        title={`${article.title} | Cambridge Academic Reading`}
        description={article.summary}
      />

      {/* 1. Top Navigation Bar — Full Width */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-border/40 pb-4">
        <Link
          to="/reading/articles"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <AltArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>All 101 Academic Articles</span>
        </Link>

        {/* Reader controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end flex-wrap w-full sm:w-auto">
          {/* View Original Illustrated Plate Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowPlateModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-medium border border-border/60 transition-all cursor-pointer"
            title="View original illustrated PDF plate"
          >
            <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden xs:inline">View Original</span> Plate
          </button>

          {/* Font Size controls */}
          <div className="flex items-center rounded-xl bg-secondary/80 border border-border/60 p-0.5 text-xs">
            <span className="hidden xs:inline px-1.5 sm:px-2 text-[11px] font-medium text-muted-foreground">Size:</span>
            {FONT_SIZES.map((f, idx) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFontSizeIdx(idx)}
                className={cn(
                  'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer',
                  fontSizeIdx === idx
                    ? 'bg-foreground text-background font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Download PDF button */}
          <a
            href="/100+ Articles.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-medium border border-border/60 transition-all cursor-pointer"
            title="Download original 100+ Articles PDF"
          >
            <FileDownloadIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">PDF</span>
          </a>
        </div>
      </div>

      {/* 2. Article Header with Metadata */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
          <span className="font-semibold px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[11px]">
            Article #{article.pageNumber}
          </span>
          <span className="font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px]">
            {article.category}
          </span>
          <span className="font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono text-[11px]">
            {article.bandTarget}
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <ClockCircleIcon className="w-3.5 h-3.5" />
            <span>{article.readingTime}</span>
          </span>
          <span className="text-muted-foreground text-[11px]">•</span>
          <span className="text-muted-foreground text-[11px]">{article.wordCount} words</span>
          {article.author && (
            <>
              <span className="text-muted-foreground text-[11px]">•</span>
              <span className="text-muted-foreground text-[11px] truncate max-w-[180px]">By {article.author}</span>
            </>
          )}

          {article.keyVocabulary && article.keyVocabulary.length > 0 && (
            <a
              href="#vocab-section"
              className="lg:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px] font-medium border border-border/60 hover:bg-secondary/80 transition-colors ml-auto xs:ml-0"
            >
              <NotesIcon className="w-3 h-3 text-primary" />
              <span>{article.keyVocabulary.length} Vocab Terms</span>
            </a>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>

        <p className="text-sm sm:text-base font-normal text-muted-foreground leading-relaxed">
          {article.subtitle}
        </p>

        {/* Study Helper Tip */}
        <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <StarsIcon className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong className="text-foreground font-medium">Interactive Reading Mode:</strong> Select any word in the text below for instant AI Uzbek translation and 1-click addition to your vocabulary.
            </span>
          </div>
          {!isPremiumUser && (
            <button
              onClick={() => setShowPremiumModal(true)}
              className="shrink-0 font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <CrownStarIcon className="w-3.5 h-3.5" />
              <span>Unlock AI</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Reading Content Container — Full Width 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Main Article Reading Panel (9 Cols on large displays) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Authentic Illustrated Cover Plate Banner */}
          <div className="rounded-2xl overflow-hidden border border-border/60 bg-muted/30 relative group shadow-2xs">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full max-h-80 sm:max-h-96 object-cover object-top cursor-pointer group-hover:opacity-95 transition-opacity"
              onClick={() => setShowPlateModal(true)}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPlateModal(true)}
                className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-medium border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Zoom Plate</span>
              </button>
            </div>
          </div>

          {/* Formatted Reading Paragraphs */}
          <div
            ref={contentRef}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="bg-card border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-xs space-y-5 sm:space-y-6 select-text"
          >
            {article.content.map((paragraph, idx) => (
              <p
                key={idx}
                className={cn(
                  FONT_SIZES[fontSizeIdx].prose,
                  'text-slate-800 dark:text-slate-200 font-normal tracking-normal text-left sm:text-justify'
                )}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Key Vocabulary Sidebar (3 Cols on large displays) */}
        <div id="vocab-section" className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <NotesIcon className="w-4 h-4 text-primary" />
                <span>Academic Vocabulary</span>
              </h3>
              <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-mono">
                {article.keyVocabulary?.length || 0} terms
              </span>
            </div>

            <p className="text-xs text-muted-foreground font-normal leading-relaxed">
              Click any term to look up its definition, listen to its audio pronunciation, and sync it to your Leitner review flashcards.
            </p>

            <div className="space-y-2 pt-1 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
              {article.keyVocabulary?.map((item) => (
                <div
                  key={item.word}
                  onClick={() => handleTriggerAILookup(item.word)}
                  className="p-3 rounded-xl bg-secondary/40 hover:bg-secondary border border-border/40 hover:border-border transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors capitalize">
                      {item.word}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono">
                      {item.band}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-normal">
                    <span className="italic">{item.part_of_speech}</span>
                    <span>•</span>
                    <span className="truncate text-foreground/80">{item.translation_uz}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Full-Size Illustrated Plate Lightbox Modal */}
      {showPlateModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowPlateModal(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center bg-card rounded-2xl overflow-hidden border border-border/80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full px-5 py-3 border-b border-border bg-secondary/50">
              <span className="text-xs font-semibold text-foreground">
                Original Magazine Plate: Article #{article.pageNumber} — {article.title}
              </span>
              <button
                type="button"
                onClick={() => setShowPlateModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <CloseCircleIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto w-full p-2 flex justify-center max-h-[82vh] custom-scrollbar bg-black/20">
              <img
                src={article.coverImage}
                alt={article.title}
                className="max-w-full h-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Floating Action Menu upon Text Selection */}
      {floatingMenu && (
        <div
          style={{
            position: 'fixed',
            top: `${floatingMenu.y}px`,
            left: `${floatingMenu.x}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.stopPropagation()}
          className="z-[90] flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-card/95 text-foreground backdrop-blur-md border border-border shadow-2xl rounded-full text-xs animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-24px)]"
        >
          {/* Quick Highlight Buttons */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#fef08a')}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-yellow-300 border border-black/10 cursor-pointer"
            title="Yellow Highlight"
          >
            <Highlighter className="w-3 h-3 text-slate-900" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#bbf7d0')}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-green-300 border border-black/10 cursor-pointer"
            title="Green Highlight"
          >
            <Highlighter className="w-3 h-3 text-slate-900" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#fbcfe8')}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-pink-300 border border-black/10 cursor-pointer"
            title="Pink Highlight"
          >
            <Highlighter className="w-3 h-3 text-slate-900" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={removeHighlight}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-muted hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground cursor-pointer"
            title="Remove Highlight"
          >
            <Eraser className="w-3 h-3" />
          </button>

          <div className="w-[1px] h-4 bg-border mx-0.5" />

          {/* AI Translation button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleTriggerAILookup(floatingMenu.selectedText)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200/90 dark:border-zinc-700 font-semibold text-[11px] shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="AI contextual translation & analysis"
          >
            <StarsIcon className="w-4 h-4 text-primary" />
            <span>AI Translation</span>
            {!isPremiumUser && (
              <span className="bg-amber-400 text-black text-[9px] px-1.5 py-0.2 rounded font-bold ml-0.5">
                PRO
              </span>
            )}
          </button>

          {/* Close button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              window.getSelection()?.removeAllRanges()
              lastRangeRef.current = null
              setFloatingMenu(null)
            }}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Close"
          >
            <CloseCircleIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. AI Contextual Dictionary Modal */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setAiModalOpen(false) }}
        >
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-primary/10 via-background to-amber-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center shadow-xs">
                  <StarsIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <span>AI Contextual Dictionary</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">
                      Premium
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-normal">Contextual analysis for IELTS Academic</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Close"
              >
                <CloseCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
              {aiLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-9 h-9 text-primary animate-spin" />
                    <StarsIcon className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Analyzing context with AI...</p>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Translating and preparing grammatical breakdown</p>
                  </div>
                </div>
              )}

              {aiError && !aiLoading && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-2">
                  <p className="text-xs font-semibold text-destructive">{aiError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (aiLookupData?.word) handleTriggerAILookup(aiLookupData.word)
                      else setAiModalOpen(false)
                    }}
                    className="text-xs h-8 cursor-pointer"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {aiLookupData && !aiLoading && (
                <div className="space-y-4">
                  {/* Top Word Card */}
                  <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-secondary/40 border border-border">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight capitalize">
                          {aiLookupData.word || aiLookupData.base_form}
                        </h2>
                        {aiLookupData.pronunciation && (
                          <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                            {aiLookupData.pronunciation}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => playWordAudio(aiLookupData.word || aiLookupData.base_form)}
                          className="p-1.5 rounded-lg bg-background hover:bg-secondary text-primary transition-colors border border-border cursor-pointer shadow-2xs"
                          title="Listen to pronunciation"
                        >
                          <VolumeLoudIcon className="w-4 h-4 text-primary" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        {aiLookupData.part_of_speech && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {aiLookupData.part_of_speech}
                          </span>
                        )}
                        {aiLookupData.difficulty && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            IELTS {aiLookupData.difficulty}
                          </span>
                        )}
                        {aiLookupData.topic && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            • {aiLookupData.topic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contextual Translation Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-background to-amber-500/10 border border-primary/20 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Contextual Uzbek Meaning:
                    </span>
                    <p className="text-xl font-bold text-foreground capitalize">
                      {aiLookupData.translation_uz}
                    </p>
                    {aiLookupData.context_meaning_uz && (
                      <p className="text-xs text-muted-foreground font-normal leading-relaxed pt-1 border-t border-border/40">
                        {aiLookupData.context_meaning_uz}
                      </p>
                    )}
                    {aiLookupData.definition_uz && !aiLookupData.context_meaning_uz && (
                      <p className="text-xs text-muted-foreground font-normal leading-relaxed pt-1 border-t border-border/40">
                        {aiLookupData.definition_uz}
                      </p>
                    )}
                  </div>

                  {/* Sentence in Article Context */}
                  {aiLookupData.example_sentence && (
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sentence in context:
                      </span>
                      <p className="text-xs text-foreground italic leading-relaxed font-normal">
                        &ldquo;{aiLookupData.example_sentence}&rdquo;
                      </p>
                      {aiLookupData.example_translation_uz && (
                        <p className="text-[11px] text-muted-foreground font-normal pt-1 border-t border-border/40">
                          {aiLookupData.example_translation_uz}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Synonyms & Collocations */}
                  {Array.isArray(aiLookupData.synonyms) && aiLookupData.synonyms.length > 0 && (
                    <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Band 7-8 Synonyms:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {aiLookupData.synonyms.map((syn: string, i: number) => (
                          <span key={i} className="text-[11px] font-normal bg-background px-2 py-0.5 rounded border border-border text-foreground">
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1-Click Save to Vocabulary */}
                  <div className="pt-2">
                    {vocabSaved ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              {vocabSuccessMessage || 'Saved to your personal vocabulary!'}
                            </p>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 truncate font-normal">
                              Scheduled in SRS Spaced Repetition flashcards
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/vocabulary"
                          target="_blank"
                          className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-800 flex items-center gap-1"
                        >
                          View <AltArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Button
                          onClick={handleSaveToVocab}
                          disabled={isSavingVocab}
                          className="w-full bg-primary text-black hover:bg-primary/90 font-semibold h-11 text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <BookBookmarkIcon className="w-4 h-4" />
                          <span>{isSavingVocab ? 'Adding to vocabulary...' : '1-Click Add to Personal Vocabulary'}</span>
                        </Button>
                        <p className="text-[11px] text-center text-muted-foreground font-normal">
                          Saved words automatically appear in your Leitner review queue.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Premium Upgrade Modal */}
      {showPremiumModal && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPremiumModal(false) }}
        >
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
              <StarsIcon className="w-7 h-7 text-amber-500" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                EDUKFOX PREMIUM
              </span>
              <h3 className="text-lg font-semibold text-foreground mt-2">
                AI Contextual Dictionary & Vocabulary Sync
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-normal">
                Instantly look up any unfamiliar word in authentic Cambridge IELTS articles, see its exact contextual Uzbek meaning, and add it to your Spaced Repetition flashcards with 1 click.
              </p>
            </div>

            <div className="bg-secondary/40 rounded-xl p-3.5 text-left space-y-2 text-xs border border-border/60">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Contextual Uzbek translation for reading passages</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>1-Click synchronization to Leitner SRS Flashcards</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Band 7–8 academic synonyms and audio pronunciation</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/premium"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black font-semibold text-xs shadow-sm hover:opacity-95 transition-all"
              >
                <CrownStarIcon className="w-4 h-4" />
                <span>Upgrade to Premium</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground py-1 transition-colors cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
