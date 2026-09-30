import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Eye,
  Eraser,
  Maximize2,
  Minimize2,
  Hash,
} from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { cn } from '@/lib/utils'

interface HtmlEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function HtmlEditor({
  value,
  onChange,
  placeholder = 'Write IELTS reading passage or question explanation here...',
  className,
  minHeight = '320px',
}: HtmlEditorProps) {
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [internalValue, setInternalValue] = useState(value || '')
  const visualRef = useRef<HTMLDivElement>(null)
  const isUserTypingRef = useRef(false)

  // Initialize visual editor on mount
  useEffect(() => {
    if (visualRef.current && !isSourceMode) {
      visualRef.current.innerHTML = sanitizeHtml(value || '')
    }
  }, [])

  // Sync internal state when external value changes (only if user is not actively typing)
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || '')
      if (
        visualRef.current &&
        !isSourceMode &&
        document.activeElement !== visualRef.current
      ) {
        visualRef.current.innerHTML = sanitizeHtml(value || '')
      }
    }
  }, [value, isSourceMode])

  // When switching between source mode and visual mode, sync visual innerHTML
  useEffect(() => {
    if (!isSourceMode && visualRef.current) {
      visualRef.current.innerHTML = sanitizeHtml(internalValue)
    }
  }, [isSourceMode])

  // Word count & character count
  const stats = useMemo(() => {
    const textOnly = internalValue.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const words = textOnly ? textOnly.split(/\s+/).length : 0
    const chars = textOnly.length
    return { words, chars }
  }, [internalValue])

  // Execute standard document execCommands with focus preservation
  const executeCommand = (command: string, arg?: string) => {
    if (isSourceMode) return
    if (visualRef.current) {
      visualRef.current.focus()
    }
    try {
      document.execCommand(command, false, arg)
    } catch (err) {
      console.warn('execCommand error:', err)
    }
    if (visualRef.current) {
      const updated = visualRef.current.innerHTML
      setInternalValue(updated)
      onChange(updated)
    }
  }

  // Format block for Headings and Paragraphs with fallback
  const formatHeading = (tag: 'h2' | 'h3' | 'p') => {
    if (isSourceMode) return
    if (visualRef.current) {
      visualRef.current.focus()
    }
    try {
      const success = document.execCommand('formatBlock', false, `<${tag}>`)
      if (!success) {
        document.execCommand('formatBlock', false, tag)
      }
    } catch {
      document.execCommand('formatBlock', false, tag)
    }
    if (visualRef.current) {
      const updated = visualRef.current.innerHTML
      setInternalValue(updated)
      onChange(updated)
    }
  }

  // Highlighter toggle
  const toggleHighlight = () => {
    if (isSourceMode) return
    if (visualRef.current) {
      visualRef.current.focus()
    }
    const highlightColor = '#fef08a'
    const success = document.execCommand('hiliteColor', false, highlightColor)
    if (!success) {
      document.execCommand('backColor', false, highlightColor)
    }
    if (visualRef.current) {
      const updated = visualRef.current.innerHTML
      setInternalValue(updated)
      onChange(updated)
    }
  }

  // Visual content input handler (doesn't overwrite innerHTML during typing, preventing cursor jumping)
  const handleVisualInput = () => {
    if (visualRef.current) {
      isUserTypingRef.current = true
      const html = visualRef.current.innerHTML
      setInternalValue(html)
      onChange(html)
      setTimeout(() => {
        isUserTypingRef.current = false
      }, 100)
    }
  }

  // Source textarea change handler
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    setInternalValue(raw)
    onChange(raw)
  }

  // Toggle Source / Visual mode
  const toggleSourceMode = () => {
    setIsSourceMode((prev) => !prev)
  }

  // Insert standard IELTS Table
  const insertTable = () => {
    if (isSourceMode) return
    if (visualRef.current) {
      visualRef.current.focus()
    }
    const tableHtml = `
      <table class="border-collapse border border-border w-full my-3 text-xs">
        <thead>
          <tr class="bg-secondary/60">
            <th class="border border-border p-2 text-left font-bold text-foreground">Category</th>
            <th class="border border-border p-2 text-left font-bold text-foreground">Description</th>
            <th class="border border-border p-2 text-left font-bold text-foreground">Location / Key</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-border p-2 text-foreground">Item 1</td>
            <td class="border border-border p-2 text-foreground">Details and observations</td>
            <td class="border border-border p-2 text-foreground">Section A</td>
          </tr>
          <tr>
            <td class="border border-border p-2 text-foreground">Item 2</td>
            <td class="border border-border p-2 text-foreground">Further specifications</td>
            <td class="border border-border p-2 text-foreground">Section B</td>
          </tr>
        </tbody>
      </table><p><br></p>
    `
    const success = document.execCommand('insertHTML', false, tableHtml)
    if (!success && visualRef.current) {
      visualRef.current.innerHTML += tableHtml
    }
    if (visualRef.current) {
      const updated = visualRef.current.innerHTML
      setInternalValue(updated)
      onChange(updated)
    }
  }

  // Insert IELTS Question Blank Placeholder: [ 1 ]
  const insertQuestionBlank = () => {
    if (isSourceMode) return
    if (visualRef.current) visualRef.current.focus()
    // Auto-detect next blank number
    const existingBlanks = (internalValue.match(/\[\s*(\d+)\s*\]/g) || []).length
    const nextBlankNum = existingBlanks + 1
    const blankHtml = `<strong>[ ${nextBlankNum} ]</strong>&nbsp;`
    document.execCommand('insertHTML', false, blankHtml)
    if (visualRef.current) {
      const updated = visualRef.current.innerHTML
      setInternalValue(updated)
      onChange(updated)
    }
  }

  // Insert Link
  const insertLink = () => {
    if (isSourceMode) return
    const selection = window.getSelection()
    const selectedText = selection ? selection.toString() : ''
    const url = prompt('Enter URL (e.g. https://example.com):')
    if (url) {
      if (visualRef.current) visualRef.current.focus()
      if (!selectedText) {
        document.execCommand(
          'insertHTML',
          false,
          `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium">${url}</a> `
        )
      } else {
        document.execCommand('createLink', false, url)
      }
      if (visualRef.current) {
        const updated = visualRef.current.innerHTML
        setInternalValue(updated)
        onChange(updated)
      }
    }
  }

  // Insert Image
  const insertImage = () => {
    if (isSourceMode) return
    const url = prompt('Enter image URL:')
    if (url) {
      if (visualRef.current) visualRef.current.focus()
      const imgHtml = `<img src="${url}" alt="Passage Illustration" class="max-w-full my-3 rounded-lg border border-border" /><p><br></p>`
      const success = document.execCommand('insertHTML', false, imgHtml)
      if (!success && visualRef.current) {
        visualRef.current.innerHTML += imgHtml
      }
      if (visualRef.current) {
        const updated = visualRef.current.innerHTML
        setInternalValue(updated)
        onChange(updated)
      }
    }
  }

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden bg-card text-foreground shadow-xs transition-all flex flex-col',
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-background border-primary/50' : '',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-secondary/50 border-b border-border">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Text Styling: Bold */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('bold')}
            disabled={isSourceMode}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Text Styling: Italic */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('italic')}
            disabled={isSourceMode}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Text Styling: Underline */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('underline')}
            disabled={isSourceMode}
            title="Underline (Ctrl+U)"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Underline className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Headings: H2 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('h2')}
            disabled={isSourceMode}
            title="Heading 2 (Passage Title)"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          {/* Headings: H3 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('h3')}
            disabled={isSourceMode}
            title="Heading 3 (Sub-heading)"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          {/* Paragraph: P */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('p')}
            disabled={isSourceMode}
            title="Normal Paragraph"
            className="px-2 py-1 text-xs font-bold rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            P
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Bulleted List */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('insertUnorderedList')}
            disabled={isSourceMode}
            title="Bulleted List"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('insertOrderedList')}
            disabled={isSourceMode}
            title="Numbered List"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Table */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertTable}
            disabled={isSourceMode}
            title="Insert IELTS Table"
            className="p-1.5 rounded-md hover:bg-primary/15 text-foreground/80 hover:text-primary disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {/* IELTS Blank Insertion */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertQuestionBlank}
            disabled={isSourceMode}
            title="Insert IELTS Question Blank [ 1 ]"
            className="px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-bold disabled:opacity-30 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Blank [ ]</span>
          </button>

          {/* Link */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertLink}
            disabled={isSourceMode}
            title="Insert Link"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Image */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertImage}
            disabled={isSourceMode}
            title="Insert Image"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Highlighter */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleHighlight}
            disabled={isSourceMode}
            title="Highlight Text (IELTS keyword)"
            className="p-1.5 rounded-md hover:bg-amber-500/15 text-amber-500 disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {/* Superscript */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('superscript')}
            disabled={isSourceMode}
            title="Superscript"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Superscript className="w-4 h-4" />
          </button>

          {/* Subscript */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('subscript')}
            disabled={isSourceMode}
            title="Subscript"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Subscript className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Alignments */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyLeft')}
            disabled={isSourceMode}
            title="Align Left"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyCenter')}
            disabled={isSourceMode}
            title="Align Center"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyRight')}
            disabled={isSourceMode}
            title="Align Right"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Eraser */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('removeFormat')}
            disabled={isSourceMode}
            title="Clear Formatting"
            className="p-1.5 rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Right side: Word count & Mode switcher */}
        <div className="flex items-center gap-2 pl-2">
          {/* Word Counter */}
          <span className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
            <strong>{stats.words}</strong> words • {stats.chars} chars
          </span>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* View Switcher: Visual vs HTML Source */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleSourceMode}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer',
              isSourceMode
                ? 'bg-primary text-black border-primary shadow-xs font-bold'
                : 'bg-secondary text-foreground hover:bg-secondary/80 border-border'
            )}
          >
            {isSourceMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Editor</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5" />
                <span>HTML Source</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {isSourceMode ? (
        <textarea
          value={internalValue}
          onChange={handleSourceChange}
          placeholder="<p>Enter raw HTML content here...</p>"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}
          className="flex-1 w-full p-4 font-mono text-xs bg-secondary/30 text-foreground focus:outline-hidden resize-y leading-relaxed border-0"
          spellCheck={false}
        />
      ) : (
        <div
          ref={visualRef}
          contentEditable
          dir="ltr"
          onInput={handleVisualInput}
          style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight, direction: 'ltr', unicodeBidi: 'plaintext' }}
          data-placeholder={placeholder}
          className={cn(
            'flex-1 p-5 focus:outline-hidden prose dark:prose-invert max-w-none text-foreground text-sm leading-relaxed overflow-y-auto bg-card',
            'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
            '[&_h2]:text-xl [&_h2]:font-black [&_h2]:text-foreground [&_h2]:mt-4 [&_h2]:mb-2.5',
            '[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-3 [&_h3]:mb-2',
            '[&_p]:mb-3.5 [&_p]:leading-relaxed',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3.5',
            '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3.5',
            '[&_table]:border-collapse [&_table]:border [&_table]:border-border [&_table]:w-full [&_table]:my-3.5',
            '[&_th]:border [&_th]:border-border [&_th]:p-2.5 [&_th]:bg-secondary/40 [&_th]:font-bold',
            '[&_td]:border [&_td]:border-border [&_td]:p-2.5',
            '[&_mark]:bg-amber-300 dark:[&_mark]:bg-amber-500/40 dark:[&_mark]:text-amber-200 [&_mark]:px-1 [&_mark]:rounded-xs'
          )}
        />
      )}
    </div>
  )
}

export default HtmlEditor
