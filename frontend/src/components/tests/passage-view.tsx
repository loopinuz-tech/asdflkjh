import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ReadingPassage } from '@/lib/test-engine/types'
import { 
  Maximize2, 
  Minimize2, 
  Highlighter, 
  X, 
  StickyNote, 
  Trash2, 
  ChevronDown,
  Sparkles,
  Volume2,
  BookPlus,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  BookOpen,
  RotateCcw
} from 'lucide-react'
import { pushHighlightUndo, popHighlightUndo } from './question-highlighter'
import {
  StarsIcon,
  VolumeLoudIcon,
  BookBookmarkIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  TrashBinTrashIcon,
  AltArrowRightIcon,
  NotesIcon,
  TranslationIcon,
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

// Helper to extract the surrounding sentence for contextual AI translation
function getSurroundingSentence(range: Range | null, text: string): string {
  if (!range) return text
  try {
    let container: Node | null = range.commonAncestorContainer
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement
    }
    const fullText = (container as HTMLElement)?.innerText || ''
    if (!fullText) return text
    const sentences = fullText.split(/(?<=[.?!])\s+/)
    const match = sentences.find(s => s.toLowerCase().includes(text.toLowerCase()))
    return match ? match.trim() : text
  } catch {
    return text
  }
}

// Font size steps
const FONT_SIZES = [
  { key: 'small',  prose: 'prose-xs md:prose-sm',  px: 13 },
  { key: 'normal', prose: 'prose-sm md:prose-base', px: 15 },
  { key: 'large',  prose: 'prose-base md:prose-lg', px: 17 },
] as const
type FontSizeKey = typeof FONT_SIZES[number]['key']

// Highlight colors
const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-300', hex: '#fef08a', markClass: 'bg-yellow-200/90 dark:bg-yellow-500/40', border: 'border-yellow-400' },
  { id: 'green',  label: 'Green',  bg: 'bg-green-300',  hex: '#bbf7d0', markClass: 'bg-green-200/90 dark:bg-green-500/40',  border: 'border-green-400' },
  { id: 'blue',   label: 'Blue',   bg: 'bg-blue-300',   hex: '#bae6fd', markClass: 'bg-blue-200/90 dark:bg-blue-500/40',    border: 'border-blue-400' },
  { id: 'pink',   label: 'Pink',   bg: 'bg-pink-300',   hex: '#fbcfe8', markClass: 'bg-pink-200/90 dark:bg-pink-500/40',    border: 'border-pink-400' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-300', hex: '#fed7aa', markClass: 'bg-orange-200/90 dark:bg-orange-500/40',  border: 'border-orange-400' },
] as const
type HighlightColorId = typeof HIGHLIGHT_COLORS[number]['id']

interface Note {
  id: string
  selectedText: string
  noteText: string
  color: HighlightColorId
  createdAt: string
}

interface PassageContentProps {
  html: string
  fontSize: number
  fontClass: string
  highlightMode: boolean
  onMouseUp: () => void
  contentRef: React.RefObject<HTMLDivElement | null>
}

const PassageContent = React.memo(function PassageContent({
  html,
  fontSize,
  fontClass,
  highlightMode,
  onMouseUp,
  contentRef,
}: PassageContentProps) {
  return (
    <div
      ref={contentRef}
      onMouseUp={onMouseUp}
      className={cn(
        "passage-prose prose dark:prose-invert max-w-none text-foreground leading-relaxed select-text w-full max-w-full break-words [overflow-wrap:anywhere]",
        "prose-headings:text-foreground prose-headings:font-bold prose-headings:break-words",
        "prose-p:text-slate-800 dark:prose-p:text-slate-200 prose-p:leading-relaxed prose-p:mb-5 prose-p:break-words",
        fontClass,
        highlightMode && "cursor-text"
      )}
      style={{ fontSize }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

export function PassageView({ passage, isPremium }: { passage: ReadingPassage; isPremium?: boolean }) {
  const [isExpanded, setIsExpanded]       = useState(false)
  const [fontSizeKey, setFontSizeKey]     = useState<FontSizeKey>('normal')
  const [highlightMode, setHighlightMode] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [activeColor, setActiveColor]     = useState<HighlightColorId>('yellow')
  const [highlightCount, setHighlightCount] = useState(0)
  const highlightsRef                     = useRef<{ id: string; color: HighlightColorId }[]>([])
  const [notes, setNotes]                 = useState<Note[]>([])
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  // Note input for selected text
  const [pendingNote, setPendingNote]     = useState<{ selectedText: string; noteText: string } | null>(null)
  const [floatingMenu, setFloatingMenu] = useState<{
    x: number
    y: number
    selectedText: string
    hasExistingHighlight: boolean
  } | null>(null)
  const lastRangeRef = useRef<Range | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // AI Dictionary & Premium state
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(isPremium ?? false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLookupData, setAiLookupData] = useState<any | null>(null)
  const [isSavingVocab, setIsSavingVocab] = useState(false)
  const [vocabSaved, setVocabSaved] = useState(false)
  const [vocabSuccessMessage, setVocabSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isPremium !== undefined) {
      setIsPremiumUser(isPremium)
    } else {
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
  }, [isPremium])

  // Play word pronunciation audio with native CDN & Web Speech API fallback
  const playWordAudio = (wordToSpeak: string) => {
    if (!wordToSpeak) return
    try {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordToSpeak)}&type=2`
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(wordToSpeak)
          utterance.lang = 'en-US'
          utterance.rate = 0.85
          window.speechSynthesis.speak(utterance)
        }
      })
    } catch {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(wordToSpeak)
        utterance.lang = 'en-US'
        utterance.rate = 0.85
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // Trigger AI Contextual Lookup
  const handleTriggerAILookup = async (selectedText: string) => {
    const cleanText = selectedText.trim()
    if (!cleanText) return

    // If not premium, display premium upgrade modal
    if (!isPremiumUser) {
      setFloatingMenu(null)
      setShowPremiumModal(true)
      return
    }

    const surrounding = getSurroundingSentence(lastRangeRef.current, cleanText)
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
          passageTitle: passage.title
        })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        if (res.status === 403) {
          setIsPremiumUser(false)
          setAiModalOpen(false)
          setShowPremiumModal(true)
          return
        }
        throw new Error(errJson.error || 'Error analyzing vocabulary term with AI')
      }

      const json = await res.json()
      setAiLookupData(json.data)
      if (json.data?.is_saved) {
        setVocabSaved(true)
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to load translation')
    } finally {
      setAiLoading(false)
    }
  }

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
          topic: aiLookupData.topic || 'Reading Academic',
          difficulty: aiLookupData.difficulty || 'medium',
        })
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setVocabSaved(true)
        setVocabSuccessMessage(json.message || 'Word successfully added to vocabulary!')
      } else {
        alert(json.error || 'Failed to save word')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setIsSavingVocab(false)
    }
  }

  const currentFontIdx = FONT_SIZES.findIndex(f => f.key === fontSizeKey)
  const currentFont    = FONT_SIZES[currentFontIdx]
  const activeColorDef = HIGHLIGHT_COLORS.find(c => c.id === activeColor)!

  const decreaseFont = () => { if (currentFontIdx > 0) setFontSizeKey(FONT_SIZES[currentFontIdx - 1].key) }
  const increaseFont = () => { if (currentFontIdx < FONT_SIZES.length - 1) setFontSizeKey(FONT_SIZES[currentFontIdx + 1].key) }

  // Clean and format content: normalize &nbsp; and format raw text into proper paragraphs to avoid horizontal overflow
  const formattedContent = useMemo(() => {
    if (!passage?.content) return ''
    let html = passage.content.trim()

    // Replace non-breaking spaces with standard spaces so long sentences wrap naturally
    html = html.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ')

    // If content has no HTML tags (like <p>, <div>, <h1-6>), convert into paragraphs
    const hasHtmlTags = /<\/?(?:p|div|h[1-6]|section|article|table|ul|ol|li|blockquote|pre)\b/i.test(html)
    if (!hasHtmlTags) {
      html = html
        .split(/\n{2,}/)
        .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
        .join('')
    }

    return html
  }, [passage?.content])

  // Remove a highlight by ID across all its constituent marks
  const removeHighlight = useCallback((highlightId: string) => {
    if (!contentRef.current) return
    const marks = contentRef.current.querySelectorAll(`mark[data-highlight-id="${highlightId}"]`)
    marks.forEach(mark => {
      const parent = mark.parentNode
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark)
        }
        parent.removeChild(mark)
      }
    })
    contentRef.current.normalize()
    highlightsRef.current = highlightsRef.current.filter(h => h.id !== highlightId)
    setHighlightCount(c => Math.max(0, c - 1))
  }, [])

  // Robust multi-node highlight implementation
  const applyHighlight = useCallback((colorId: HighlightColorId) => {
    const root = contentRef.current
    if (!root) return

    const selection = window.getSelection()
    let range: Range | null = null

    // 1. Prefer active selection if within passage container
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const selRange = selection.getRangeAt(0)
      if (root.contains(selRange.startContainer) || root.contains(selRange.commonAncestorContainer)) {
        range = selRange
      }
    }

    // 2. Fallback to saved cloned range if selection collapsed or shifted to toolbar
    if (!range && lastRangeRef.current) {
      if (root.contains(lastRangeRef.current.startContainer) || root.contains(lastRangeRef.current.commonAncestorContainer)) {
        range = lastRangeRef.current
      }
    }

    if (!range) {
      setFloatingMenu(null)
      return
    }

    const selectedText = (range.toString() || selection?.toString() || '').trim()
    if (!selectedText) {
      lastRangeRef.current = null
      setFloatingMenu(null)
      return
    }

    const colorDef = HIGHLIGHT_COLORS.find(c => c.id === colorId) || HIGHLIGHT_COLORS[0]
    const highlightId = `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const createMark = (textNode: Text, start: number, end: number) => {
      let target: Text = textNode
      if (start > 0) {
        target = textNode.splitText(start)
      }
      const len = end - start
      if (len < (target.nodeValue?.length || 0)) {
        target.splitText(len)
      }

      const mark = document.createElement('mark')
      mark.className = `passage-highlight passage-highlight-${colorDef.id}`
      mark.style.backgroundColor = colorDef.hex
      mark.style.color = 'inherit'
      mark.style.borderRadius = '0'
      mark.style.padding = '1px 0'
      mark.style.margin = '0'
      mark.style.cursor = 'pointer'
      mark.dataset.highlightId = highlightId
      mark.title = 'Click to remove highlight (or Ctrl+Z)'
      mark.onclick = (e) => {
        e.stopPropagation()
        const sel = window.getSelection()
        if (sel && !sel.isCollapsed) return
        removeHighlight(highlightId)
      }

      target.parentNode?.replaceChild(mark, target)
      mark.appendChild(target)
    }

    try {
      if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
        const node = range.startContainer as Text
        if (range.endOffset > range.startOffset && node.nodeValue?.slice(range.startOffset, range.endOffset).trim()) {
          createMark(node, range.startOffset, range.endOffset)
        }
      } else {
        const searchRoot = root.contains(range.commonAncestorContainer)
          ? range.commonAncestorContainer
          : root

        const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT)
        const textNodes: Text[] = []
        let curr = walker.nextNode()
        while (curr) {
          if (curr.nodeValue && curr.nodeValue.trim().length > 0) {
            try {
              if (range.intersectsNode(curr)) {
                textNodes.push(curr as Text)
              }
            } catch {}
          }
          curr = walker.nextNode()
        }

        const targets: { node: Text; start: number; end: number }[] = []
        for (let i = 0; i < textNodes.length; i++) {
          const node = textNodes[i]
          const isStart = node === range.startContainer
          const isEnd = node === range.endContainer
          const start = isStart ? range.startOffset : 0
          const end = isEnd ? range.endOffset : (node.nodeValue?.length || 0)

          if (end > start && node.nodeValue?.slice(start, end).trim()) {
            targets.push({ node, start, end })
          }
        }

        // Process backwards to avoid offset shift
        for (let i = targets.length - 1; i >= 0; i--) {
          const { node, start, end } = targets[i]
          createMark(node, start, end)
        }
      }

      highlightsRef.current.push({ id: highlightId, color: colorId })
      setHighlightCount(c => c + 1)
      pushHighlightUndo({
        id: highlightId,
        remove: () => removeHighlight(highlightId)
      })
    } catch (err) {
      console.error('Highlight failed:', err)
    }

    lastRangeRef.current = null
    selection?.removeAllRanges()
    setFloatingMenu(null)
  }, [removeHighlight])

  // Clear any existing highlights that intersect the current selection
  const clearSelectionHighlights = useCallback(() => {
    const selection = window.getSelection()
    let range: Range | null = null
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      range = selection.getRangeAt(0)
    } else if (lastRangeRef.current) {
      range = lastRangeRef.current
    }

    const root = contentRef.current
    if (!range || !root) return

    const marks = root.querySelectorAll('mark.passage-highlight')
    const removedIds = new Set<string>()

    marks.forEach(mark => {
      try {
        if (range!.intersectsNode(mark)) {
          const id = mark.getAttribute('data-highlight-id')
          if (id) removedIds.add(id)
        }
      } catch {
        // ignore
      }
    })

    removedIds.forEach(id => removeHighlight(id))
    lastRangeRef.current = null
    selection?.removeAllRanges()
    setFloatingMenu(null)
  }, [removeHighlight])

  // Handle mouse up: highlight immediately if highlightMode is ON, or show floating menu
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setFloatingMenu(null)
      return
    }

    const selectedText = selection.toString().trim()
    if (!selectedText || selectedText.length < 1) {
      setFloatingMenu(null)
      return
    }

    const range = selection.getRangeAt(0)
    const root = contentRef.current
    if (!root) return

    if (!root.contains(range.startContainer) && !root.contains(range.commonAncestorContainer)) {
      setFloatingMenu(null)
      return
    }

    // Save cloned range for reliability
    lastRangeRef.current = range.cloneRange()

    // Check if selection intersects existing marks
    let hasExisting = false
    const existingMarks = root.querySelectorAll('mark.passage-highlight')
    for (const m of existingMarks) {
      try {
        if (range.intersectsNode(m)) {
          hasExisting = true
          break
        }
      } catch {
        // ignore
      }
    }

    // Position floating toolbar above selection
    const rect = range.getBoundingClientRect()
    setFloatingMenu({
      x: Math.round(rect.left + rect.width / 2),
      y: Math.max(10, Math.round(rect.top - 8)),
      selectedText,
      hasExistingHighlight: hasExisting,
    })
  }, [highlightMode, activeColor, applyHighlight])

  // Reset when passage changes
  useEffect(() => {
    highlightsRef.current = []
    setHighlightCount(0)
    setNotes([])
    setPendingNote(null)
    setFloatingMenu(null)
    lastRangeRef.current = null
  }, [passage.id])

  // Global Ctrl+Z / Cmd+Z Undo Listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const active = document.activeElement as HTMLElement | null
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
          return
        }
        e.preventDefault()
        popHighlightUndo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Deselect listener
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setTimeout(() => {
          const currentSel = window.getSelection()
          if (!currentSel || currentSel.isCollapsed) {
            setFloatingMenu(null)
          }
        }, 150)
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  // Note mode: select text then add note
  const handleAddNoteFromSelection = () => {
    const selection = window.getSelection()
    let range = (selection && !selection.isCollapsed && selection.rangeCount > 0)
      ? selection.getRangeAt(0)
      : lastRangeRef.current

    if (!range || !contentRef.current) return
    const selectedText = (range.toString() || '').trim()
    if (!selectedText) return

    applyHighlight(activeColor)
    setPendingNote({ selectedText, noteText: '' })
    setFloatingMenu(null)
    selection?.removeAllRanges()
  }

  const confirmNote = () => {
    if (!pendingNote || !pendingNote.noteText.trim()) {
      setPendingNote(null)
      return
    }
    const newNote: Note = {
      id: `note-${Date.now()}`,
      selectedText: pendingNote.selectedText,
      noteText: pendingNote.noteText.trim(),
      color: activeColor,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setNotes(prev => [...prev, newNote])
    setPendingNote(null)
    setShowNotesPanel(true)
  }

  // Clear all highlights
  const clearAllHighlights = () => {
    if (!contentRef.current) return
    contentRef.current.querySelectorAll('mark.passage-highlight').forEach(mark => {
      const parent = mark.parentNode
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
        parent.removeChild(mark)
      }
    })
    contentRef.current.normalize()
    highlightsRef.current = []
    setHighlightCount(0)
  }

  return (
    <div className={cn(
      "bg-card border border-border rounded-2xl fox-shadow-sm flex flex-col transition-all duration-200",
      isExpanded
        ? "fixed inset-4 z-50 shadow-2xl bg-card border-2 border-primary/20"
        : "h-full min-h-0 w-full max-w-full overflow-hidden relative"
    )}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30 flex-shrink-0 gap-2 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-amber-700 dark:text-primary rounded flex-shrink-0">
            Passage
          </span>
          <h2 className="font-bold text-foreground text-sm truncate">{passage.title}</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">

          {/* A- / level / A+ */}
          <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden text-xs divide-x divide-border">
            <button
              type="button"
              onClick={decreaseFont}
              disabled={currentFontIdx === 0}
              className="px-2.5 py-1.5 font-bold text-[11px] transition-colors disabled:text-muted-foreground/30 disabled:cursor-not-allowed text-muted-foreground hover:enabled:bg-secondary hover:enabled:text-foreground"
              title="Kichikroq shrift"
            >
              A−
            </button>
            <span className="px-2 py-1.5 text-[10px] font-mono text-muted-foreground select-none">
              {currentFontIdx + 1}/{FONT_SIZES.length}
            </span>
            <button
              type="button"
              onClick={increaseFont}
              disabled={currentFontIdx === FONT_SIZES.length - 1}
              className="px-2.5 py-1.5 font-bold text-sm transition-colors disabled:text-muted-foreground/30 disabled:cursor-not-allowed text-muted-foreground hover:enabled:bg-secondary hover:enabled:text-foreground"
              title="Kattaroq shrift"
            >
              A+
            </button>
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={isExpanded ? "Kichiklashtirish" : "To'liq ekran"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>



      {/* Add note prompt */}
      {pendingNote && (
        <div className="px-4 py-3 border-b border-border bg-blue-50 dark:bg-blue-950/30 flex-shrink-0 space-y-2">
          <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
            Note: <em className="font-normal opacity-80">&ldquo;{pendingNote.selectedText.slice(0, 60)}{pendingNote.selectedText.length > 60 ? '...' : ''}&rdquo;</em>
          </p>
          <div className="flex items-center gap-2">
            <textarea
              autoFocus
              rows={2}
              value={pendingNote.noteText}
              onChange={e => setPendingNote(prev => prev ? { ...prev, noteText: e.target.value } : null)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmNote() } }}
              placeholder="Type your note... (Press Enter to save)"
              className="flex-1 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-card text-xs text-foreground resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={confirmNote}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setPendingNote(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes panel */}
      {showNotesPanel && notes.length > 0 && (
        <div className="border-b border-border bg-card flex-shrink-0 max-h-44 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 flex items-center justify-between border-b border-border/50">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Notes ({notes.length})
            </span>
            <button
              type="button"
              onClick={() => setShowNotesPanel(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border/50">
            {notes.map(note => {
              const colorDef = HIGHLIGHT_COLORS.find(c => c.id === note.color)!
              return (
                <div key={note.id} className="px-4 py-2.5 flex items-start gap-2.5 group">
                  <span className={cn("w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0", colorDef.bg)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground italic truncate">
                      &ldquo;{note.selectedText.slice(0, 50)}{note.selectedText.length > 50 ? '...' : ''}&rdquo;
                    </p>
                    <p className="text-xs font-medium text-foreground mt-0.5">{note.noteText}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{note.createdAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty notes hint */}
      {showNotesPanel && notes.length === 0 && (
        <div className="px-4 py-3 border-b border-border bg-secondary/20 flex items-center gap-2 flex-shrink-0">
          <StickyNote className="w-4 h-4 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">No notes yet. Enable highlight mode and select text, then click "Note".</p>
          <button type="button" onClick={() => setShowNotesPanel(false)} className="ml-auto text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Scrollable passage — independent scroll (strictly overflow-x-hidden, no horizontal scrollbar) */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full px-5 md:px-8 py-6 custom-scrollbar bg-card"
        onMouseUp={handleMouseUp}
        onScroll={() => { if (floatingMenu) setFloatingMenu(null) }}
        onClick={() => { if (showColorPicker) setShowColorPicker(false) }}
      >
        <PassageContent
          html={formattedContent}
          fontSize={currentFont.px}
          fontClass={currentFont.prose}
          highlightMode={highlightMode}
          onMouseUp={handleMouseUp}
          contentRef={contentRef}
        />
      </div>

      {/* Floating Action Toolbar on Text Selection */}
      {floatingMenu && (
        <div
          style={{
            position: 'fixed',
            top: `${floatingMenu.y}px`,
            left: `${floatingMenu.x}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseDown={e => e.preventDefault()}
          className="z-50 flex items-center gap-1.5 p-1.5 bg-card/95 text-foreground backdrop-blur-md border border-border shadow-2xl rounded-full text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Quick highlight color buttons */}
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                applyHighlight(c.id)
                setFloatingMenu(null)
              }}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-115 active:scale-95 shadow-sm border border-black/10 dark:border-white/20",
                c.bg
              )}
              title={`${c.label} highlight`}
            >
              <Highlighter className="w-3 h-3 text-slate-800" />
            </button>
          ))}

          <div className="w-[1px] h-4 bg-border mx-0.5" />

          {/* AI Contextual Dictionary & Translation button — White Background + Solar Icon */}
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleTriggerAILookup(floatingMenu.selectedText)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200/90 dark:border-zinc-700 font-bold text-[11px] shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="AI contextual translation & analysis"
          >
            <StarsIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>AI Translation</span>
            {!isPremiumUser && (
              <span className="bg-amber-400 text-black text-[9px] px-1.5 py-0.2 rounded font-extrabold ml-0.5 shadow-2xs">
                PRO
              </span>
            )}
          </button>

          <div className="w-[1px] h-4 bg-border mx-0.5" />

          {/* Undo Button (Ctrl+Z) */}
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              popHighlightUndo()
              setFloatingMenu(null)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-secondary text-foreground font-semibold text-[11px] transition-colors cursor-pointer"
            title="Undo last highlight (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            <span className="text-[10px] hidden sm:inline">Ctrl+Z</span>
          </button>

          <div className="w-[1px] h-4 bg-border mx-0.5" />

          {/* Add note button — Solar Icon */}
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              applyHighlight(activeColor)
              setPendingNote({ selectedText: floatingMenu.selectedText, noteText: '' })
              setFloatingMenu(null)
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-secondary text-foreground font-semibold text-[11px] transition-colors"
            title="Add Note"
          >
            <NotesIcon className="w-4 h-4 text-blue-500" />
            <span>Note</span>
          </button>

          {/* If selected area has existing highlight, offer 1-click removal — Solar Icon */}
          {floatingMenu.hasExistingHighlight && (
            <>
              <div className="w-[1px] h-4 bg-border mx-0.5" />
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={clearSelectionHighlights}
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-destructive/10 text-destructive font-semibold text-[11px] transition-colors"
                title="Delete Highlight"
              >
                <TrashBinTrashIcon className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </>
          )}

          {/* Close button — Solar Icon */}
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              window.getSelection()?.removeAllRanges()
              lastRangeRef.current = null
              setFloatingMenu(null)
            }}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Close"
          >
            <CloseCircleIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* AI Contextual Dictionary Modal (Premium Feature) */}
      {/* ==================================================== */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setAiModalOpen(false) }}
        >
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-violet-600/10 via-background to-indigo-600/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs">
                  <StarsIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <span>AI Contextual Dictionary</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">
                      Premium
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Contextual meaning & passage analysis</p>
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
                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                    <StarsIcon className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">AI is analyzing context...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Preparing contextual translation and vocabulary details</p>
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
                        <h2 className="text-2xl font-black text-foreground tracking-tight capitalize">
                          {aiLookupData.word || aiLookupData.base_form}
                        </h2>
                        {aiLookupData.pronunciation && (
                          <span className="text-sm font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                            {aiLookupData.pronunciation}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => playWordAudio(aiLookupData.word || aiLookupData.base_form)}
                          className="p-1.5 rounded-lg bg-background hover:bg-secondary text-primary transition-colors border border-border cursor-pointer shadow-2xs"
                          title="Listen to pronunciation"
                        >
                          <VolumeLoudIcon className="w-5 h-5 text-amber-500 dark:text-primary" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {aiLookupData.part_of_speech && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                            {aiLookupData.part_of_speech}
                          </span>
                        )}
                        {aiLookupData.difficulty && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                            aiLookupData.difficulty === 'hard'
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : aiLookupData.difficulty === 'medium'
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}>
                            IELTS {aiLookupData.difficulty}
                          </span>
                        )}
                        {aiLookupData.topic && (
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            • {aiLookupData.topic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contextual Translation Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 via-background to-indigo-500/10 border border-violet-500/30 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Meaning in this passage:
                    </span>
                    <p className="text-xl font-bold text-foreground capitalize">
                      {aiLookupData.translation_uz}
                    </p>
                    {aiLookupData.context_meaning_uz && (
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                        {aiLookupData.context_meaning_uz}
                      </p>
                    )}
                    {aiLookupData.definition_uz && !aiLookupData.context_meaning_uz && (
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                        {aiLookupData.definition_uz}
                      </p>
                    )}
                  </div>

                  {/* Sentence Context Card */}
                  {aiLookupData.example_sentence && (
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Sentence in passage:
                      </span>
                      <p className="text-xs text-foreground italic leading-relaxed">
                        &ldquo;{aiLookupData.example_sentence}&rdquo;
                      </p>
                      {aiLookupData.example_translation_uz && (
                        <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          {aiLookupData.example_translation_uz}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Synonyms & Collocations */}
                  {(Array.isArray(aiLookupData.synonyms) && aiLookupData.synonyms.length > 0) || (Array.isArray(aiLookupData.collocations) && aiLookupData.collocations.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Array.isArray(aiLookupData.synonyms) && aiLookupData.synonyms.length > 0 && (
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Synonyms (Band 7-8):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aiLookupData.synonyms.map((syn: string, i: number) => (
                              <span key={i} className="text-[11px] font-medium bg-background px-2 py-0.5 rounded border border-border text-foreground">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(aiLookupData.collocations) && aiLookupData.collocations.length > 0 && (
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Collocations:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aiLookupData.collocations.map((col: string, i: number) => (
                              <span key={i} className="text-[11px] font-medium bg-background px-2 py-0.5 rounded border border-border text-foreground">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* 1-Click Save to Vocabulary Action — Solar Icon */}
                  <div className="pt-2">
                    {vocabSaved ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              {vocabSuccessMessage || 'Saved to your personal vocabulary!'}
                            </p>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                              Queued for active review via Spaced Repetition (SRS)
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/vocabulary"
                          target="_blank"
                          className="shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-800 flex items-center gap-1"
                        >
                          Vocabulary <AltArrowRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Button
                          onClick={handleSaveToVocab}
                          disabled={isSavingVocab}
                          className="w-full bg-primary text-black hover:bg-primary/90 font-bold h-11 text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <BookBookmarkIcon className="w-5 h-5" />
                          <span>{isSavingVocab ? 'Adding to vocabulary...' : '1-Click Add to Personal Vocabulary'}</span>
                        </Button>
                        <p className="text-[11px] text-center text-muted-foreground">
                          Saved words are scheduled in the Vocabulary section using the SRS Spaced Repetition algorithm.
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

      {/* ==================================================== */}
      {/* Premium Upgrade Modal (If Non-Premium User clicks) */}
      {/* ==================================================== */}
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
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                FOXFORD PREMIUM
              </span>
              <h3 className="text-lg font-bold text-foreground mt-2">
                AI Contextual Dictionary & Translation
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Instantly look up unfamiliar words within the exact context of the IELTS reading passage using AI, and add them to your personal vocabulary with 1 click (Spaced Repetition System) — exclusively available for Premium members.
              </p>
            </div>

            <div className="bg-secondary/40 rounded-xl p-3.5 text-left space-y-2 text-xs border border-border/60">
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>100% accurate contextual translation in Uzbek</span>
              </div>
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>IPA pronunciation & native audio playback</span>
              </div>
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>1-Click Spaced Repetition (SRS) vocabulary tracking</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs h-10 cursor-pointer"
                onClick={() => setShowPremiumModal(false)}
              >
                Close
              </Button>
              <Link
                to="/premium"
                target="_blank"
                onClick={() => setShowPremiumModal(false)}
                className={cn(buttonVariants({ variant: 'default' }), "flex-1 text-xs h-10 bg-primary text-black hover:bg-primary/90 font-bold")}
              >
                View Plans
                <AltArrowRightIcon className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
