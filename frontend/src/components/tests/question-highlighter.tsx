import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Highlighter, RotateCcw } from 'lucide-react'
import { StarsIcon, TrashBinTrashIcon, CloseCircleIcon } from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'

export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-300', hex: '#fef08a', border: 'border-yellow-400' },
  { id: 'green',  label: 'Green',  bg: 'bg-green-300',  hex: '#bbf7d0', border: 'border-green-400' },
  { id: 'blue',   label: 'Blue',   bg: 'bg-blue-300',   hex: '#bae6fd', border: 'border-blue-400' },
  { id: 'pink',   label: 'Pink',   bg: 'bg-pink-300',   hex: '#fbcfe8', border: 'border-pink-400' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-300', hex: '#fed7aa', border: 'border-orange-400' },
] as const

export type HighlightColorId = typeof HIGHLIGHT_COLORS[number]['id']

// ----------------------------------------------------------------------
// Global Undo Stack for Highlights (Passage + Questions)
// ----------------------------------------------------------------------
export type HighlightUndoAction = {
  id: string
  remove: () => void
}

export const globalHighlightUndoStack: HighlightUndoAction[] = []

export function pushHighlightUndo(action: HighlightUndoAction) {
  globalHighlightUndoStack.push(action)
}

export function popHighlightUndo(): boolean {
  const action = globalHighlightUndoStack.pop()
  if (action) {
    action.remove()
    return true
  }
  return false
}

export function clearHighlightUndo() {
  globalHighlightUndoStack.length = 0
}

interface FloatingMenuState {
  x: number
  y: number
  selectedText: string
  hasExistingHighlight: boolean
}

interface UseQuestionHighlighterOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  sectionIndex?: number
  isPremiumUser?: boolean
  onTriggerAILookup?: (text: string) => void
}

export function useQuestionHighlighter({
  containerRef,
  sectionIndex,
  isPremiumUser,
  onTriggerAILookup,
}: UseQuestionHighlighterOptions) {
  const [floatingMenu, setFloatingMenu] = useState<FloatingMenuState | null>(null)
  const highlightCountRef = useRef(0)
  const highlightsRef = useRef<{ id: string; color: HighlightColorId }[]>([])
  const lastRangeRef = useRef<Range | null>(null)

  // Remove a highlight by ID across all its marks
  const removeHighlight = useCallback((highlightId: string) => {
    const root = containerRef.current
    if (!root) return
    const marks = root.querySelectorAll(`mark[data-highlight-id="${highlightId}"]`)
    marks.forEach(mark => {
      const parent = mark.parentNode
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark)
        }
        parent.removeChild(mark)
      }
    })
    root.normalize()
    highlightsRef.current = highlightsRef.current.filter(h => h.id !== highlightId)
    highlightCountRef.current = Math.max(0, highlightCountRef.current - 1)
  }, [containerRef])

  // Apply highlight across text nodes
  const applyHighlight = useCallback((colorId: HighlightColorId) => {
    const root = containerRef.current
    if (!root) return

    const selection = window.getSelection()
    let range: Range | null = null

    // 1. Prefer current selection if valid and inside the questions container
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const selRange = selection.getRangeAt(0)
      if (root.contains(selRange.startContainer) || root.contains(selRange.commonAncestorContainer)) {
        range = selRange
      }
    }

    // 2. Fallback to saved cloned range from handleMouseUp if selection collapsed or was shifted
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
    const highlightId = `hl-q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const createMark = (textNode: Text, start: number, end: number) => {
      // Don't highlight inside input/textarea/select
      let p: Node | null = textNode.parentNode
      while (p && p !== root) {
        if (p.nodeName === 'INPUT' || p.nodeName === 'TEXTAREA' || p.nodeName === 'SELECT') {
          return
        }
        p = p.parentNode
      }

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
      mark.style.color = '#0f172a'
      mark.style.borderRadius = '0'
      mark.style.padding = '1px 0'
      mark.style.margin = '0'
      mark.style.cursor = 'pointer'
      mark.dataset.highlightId = highlightId
      mark.title = "Click to remove highlight (or Ctrl+Z)"
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
        const searchRoot = (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE && root.contains(range.commonAncestorContainer))
          ? (range.commonAncestorContainer as Element)
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
            } catch {
              try {
                const compStart = range.comparePoint(curr, 0)
                const compEnd = range.comparePoint(curr, curr.nodeValue.length)
                if (compStart <= 0 && compEnd >= 0) {
                  textNodes.push(curr as Text)
                }
              } catch {}
            }
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
      highlightCountRef.current++

      // Register with global undo stack
      pushHighlightUndo({
        id: highlightId,
        remove: () => removeHighlight(highlightId),
      })
    } catch (err) {
      console.error('Highlight questions failed:', err)
    }

    lastRangeRef.current = null
    try {
      window.getSelection()?.removeAllRanges()
    } catch {}
    setFloatingMenu(null)
  }, [containerRef, removeHighlight])

  // Clear highlights that intersect the current selection
  const clearSelectionHighlights = useCallback(() => {
    const selection = window.getSelection()
    let range: Range | null = null
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      range = selection.getRangeAt(0)
    } else if (lastRangeRef.current) {
      range = lastRangeRef.current
    }

    const root = containerRef.current
    if (!range || !root) return

    const marks = root.querySelectorAll('mark.passage-highlight')
    const removedIds = new Set<string>()

    marks.forEach(mark => {
      try {
        if (range!.intersectsNode(mark)) {
          const id = mark.getAttribute('data-highlight-id')
          if (id) removedIds.add(id)
        }
      } catch {}
    })

    removedIds.forEach(id => removeHighlight(id))
    lastRangeRef.current = null
    selection?.removeAllRanges()
    setFloatingMenu(null)
  }, [containerRef, removeHighlight])

  // Clear all highlights
  const clearAllHighlights = useCallback(() => {
    const root = containerRef.current
    if (!root) return
    root.querySelectorAll('mark.passage-highlight').forEach(mark => {
      const parent = mark.parentNode
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
        parent.removeChild(mark)
      }
    })
    root.normalize()
    highlightsRef.current = []
    highlightCountRef.current = 0
  }, [containerRef])

  // Mouse up handler: shows floating toolbar directly on text selection
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
    const root = containerRef.current
    if (!root) return

    if (!root.contains(range.startContainer) && !root.contains(range.commonAncestorContainer)) {
      setFloatingMenu(null)
      return
    }

    // Save cloned range
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
      } catch {}
    }

    // Position floating toolbar directly above selection (Image 5 style)
    const rect = range.getBoundingClientRect()
    setFloatingMenu({
      x: Math.round(rect.left + rect.width / 2),
      y: Math.max(10, Math.round(rect.top - 8)),
      selectedText,
      hasExistingHighlight: hasExisting,
    })
  }, [containerRef])

  // Right-click support to show highlight popup
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return

    const selectedText = selection.toString().trim()
    if (!selectedText) return

    const range = selection.getRangeAt(0)
    const root = containerRef.current
    if (!root || (!root.contains(range.startContainer) && !root.contains(range.commonAncestorContainer))) return

    e.preventDefault()
    lastRangeRef.current = range.cloneRange()
    setFloatingMenu({
      x: e.clientX,
      y: Math.max(10, e.clientY - 8),
      selectedText,
      hasExistingHighlight: false,
    })
  }, [containerRef])

  // Reset when section changes
  useEffect(() => {
    clearAllHighlights()
    setFloatingMenu(null)
    lastRangeRef.current = null
  }, [sectionIndex, clearAllHighlights])

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

  return {
    highlightCount: highlightCountRef.current,
    floatingMenu,
    setFloatingMenu,
    applyHighlight,
    removeHighlight,
    clearSelectionHighlights,
    clearAllHighlights,
    handleMouseUp,
    handleContextMenu,
  }
}

// ----------------------------------------------------------------------
// Floating Toolbar on Text Selection (Image 5)
// ----------------------------------------------------------------------
interface QuestionFloatingMenuProps {
  floatingMenu: FloatingMenuState
  isPremiumUser?: boolean
  onApplyHighlight: (colorId: HighlightColorId) => void
  onClearHighlights: () => void
  onTriggerAILookup?: (text: string) => void
  onClose: () => void
}

export function QuestionFloatingMenu({
  floatingMenu,
  isPremiumUser,
  onApplyHighlight,
  onClearHighlights,
  onTriggerAILookup,
  onClose,
}: QuestionFloatingMenuProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: `${floatingMenu.y}px`,
        left: `${floatingMenu.x}px`,
        transform: 'translate(-50%, -100%)',
      }}
      onMouseDown={e => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className="z-50 flex items-center gap-1.5 p-1.5 bg-card/95 text-foreground backdrop-blur-md border border-border shadow-2xl rounded-full text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Quick highlight color buttons (Image 5: 🟡 🟢 🔵 🌸 🟠) */}
      {HIGHLIGHT_COLORS.map(c => (
        <button
          key={c.id}
          type="button"
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onApplyHighlight(c.id)
          }}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-115 active:scale-95 shadow-xs border border-black/10 dark:border-white/20 cursor-pointer",
            c.bg
          )}
          title={`${c.label} highlight`}
        >
          <Highlighter className="w-3 h-3 text-slate-800 pointer-events-none" />
        </button>
      ))}

      {/* AI Contextual Dictionary & Translation button (Image 5) */}
      {onTriggerAILookup && (
        <>
          <div className="w-[1px] h-4 bg-border mx-0.5" />
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => onTriggerAILookup(floatingMenu.selectedText)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200/90 dark:border-zinc-700 font-bold text-[11px] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title="AI Contextual Translation & Analysis"
          >
            <StarsIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>AI Translation</span>
            {!isPremiumUser && (
              <span className="bg-amber-400 text-black text-[9px] px-1.5 py-0.2 rounded font-extrabold ml-0.5 shadow-2xs">
                PRO
              </span>
            )}
          </button>
        </>
      )}

      {/* Undo Button (Ctrl+Z) */}
      <div className="w-[1px] h-4 bg-border mx-0.5" />
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => {
          popHighlightUndo()
          onClose()
        }}
        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-secondary text-foreground font-semibold text-[11px] transition-colors cursor-pointer"
        title="Undo last highlight (Ctrl+Z)"
      >
        <RotateCcw className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        <span className="text-[10px] hidden sm:inline">Ctrl+Z</span>
      </button>

      {/* If selected area has existing highlight, offer 1-click removal */}
      {floatingMenu.hasExistingHighlight && (
        <>
          <div className="w-[1px] h-4 bg-border mx-0.5" />
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={onClearHighlights}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-destructive/10 text-destructive font-semibold text-[11px] transition-colors cursor-pointer"
            title="Delete highlight"
          >
            <TrashBinTrashIcon className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </>
      )}

      {/* Close button */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onClose}
        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        title="Close"
      >
        <CloseCircleIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
