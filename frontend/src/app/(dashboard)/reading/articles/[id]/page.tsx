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
import { Loader2, Highlighter, RotateCcw } from 'lucide-react'
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

  // Active highlights
  const [highlights, setHighlights] = useState<string[]>([])

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
          const found = list.find((a) => a.id === id)
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

    setFloatingMenu({
      x: rect.left + rect.width / 2,
      y: Math.max(10, rect.top - 12),
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

  // Apply yellow highlight
  const applyHighlight = (color: string) => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    try {
      const range = sel.getRangeAt(0)
      const mark = document.createElement('mark')
      mark.style.backgroundColor = color
      mark.style.borderRadius = '3px'
      mark.style.padding = '1px 3px'
      mark.style.color = 'inherit'
      mark.appendChild(range.extractContents())
      range.insertNode(mark)
      sel.removeAllRanges()
    } catch {}
    setFloatingMenu(null)
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 bg-muted/60 rounded-lg" />
        <div className="h-10 w-3/4 bg-muted/60 rounded-xl" />
        <div className="h-5 w-1/2 bg-muted/60 rounded-lg" />
        <div className="space-y-4 pt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/60 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="w-full max-w-xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Article Not Found</h2>
        <p className="text-xs text-muted-foreground font-normal">
          The requested academic article could not be located in the catalog.
        </p>
        <Button onClick={() => navigate('/reading/articles')} variant="outline" className="text-xs cursor-pointer">
          <AltArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Back to Articles
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24">
      <SEOHead
        title={`${article.title} | Academic Reading`}
        description={article.summary}
      />

      {/* 1. Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-border/40 pb-4">
        <Link
          to="/reading/articles"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <AltArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>All Academic Articles</span>
        </Link>

        {/* Reader controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Font Size controls */}
          <div className="flex items-center rounded-xl bg-secondary/80 border border-border/60 p-0.5 text-xs">
            <span className="px-2 text-[11px] font-medium text-muted-foreground">Text Size:</span>
            {FONT_SIZES.map((f, idx) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFontSizeIdx(idx)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-medium border border-border/60 transition-all cursor-pointer"
            title="Download original 100+ Articles PDF"
          >
            <FileDownloadIcon className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">PDF</span>
          </a>
        </div>
      </div>

      {/* 2. Article Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {article.category}
          </span>
          <span className="font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
            {article.bandTarget}
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <ClockCircleIcon className="w-3.5 h-3.5" />
            <span>{article.readingTime}</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{article.wordCount} words</span>
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

      {/* 3. Main Reading Content Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        {/* Main Article Text */}
        <div
          ref={contentRef}
          onMouseUp={handleMouseUp}
          className="lg:col-span-8 bg-card border border-border/60 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 select-text"
        >
          {article.content.map((paragraph, idx) => (
            <p
              key={idx}
              className={cn(
                FONT_SIZES[fontSizeIdx].prose,
                'text-slate-800 dark:text-slate-200 font-normal tracking-normal text-justify'
              )}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Key Vocabulary Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <NotesIcon className="w-4 h-4 text-primary" />
                <span>Featured Academic Terms</span>
              </h3>
              <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {article.keyVocabulary?.length || 0} words
              </span>
            </div>

            <p className="text-xs text-muted-foreground font-normal leading-relaxed">
              Click any term to view its phonetic pronunciation, translation, and add it directly to your SRS flashcards.
            </p>

            <div className="space-y-2 pt-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
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

      {/* 4. Floating Action Menu upon Text Selection */}
      {floatingMenu && (
        <div
          style={{
            position: 'fixed',
            top: `${floatingMenu.y}px`,
            left: `${floatingMenu.x}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="z-50 flex items-center gap-1.5 p-1.5 bg-card/95 text-foreground backdrop-blur-md border border-border shadow-2xl rounded-full text-xs animate-in fade-in zoom-in-95 duration-150"
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

      {/* 5. AI Contextual Dictionary Modal */}
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

      {/* 6. Premium Upgrade Modal */}
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
