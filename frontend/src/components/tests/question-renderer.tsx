import React, { useState } from 'react'
import { Bookmark, CheckCircle2, XCircle, Volume2, Mic, Play, Pause, RotateCcw, AlertCircle, Sparkles, Layers, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { apiUrl } from '@/lib/api-config'

export interface QuestionOptionItem {
  id?: string
  option_key: string
  option_text: string
  is_correct?: boolean
}

export interface QuestionData {
  id: string
  question_number: number
  question_type: string
  instruction?: string | null
  question_text: string
  question_html?: string | null
  options?: QuestionOptionItem[]
  points?: number
  difficulty?: string
  metadata?: Record<string, any> | null
  correct_answer?: string | null
  accepted_answers?: string[] | any
  explanation?: string | null
  image_url?: string | null
  audio_url?: string | null
  passage_reference?: string | null
}

interface QuestionRendererProps {
  question: QuestionData
  answer: any
  onChange: (value: any) => void
  isMarked?: boolean
  onToggleMark?: () => void
  showExplanation?: boolean
  disabled?: boolean
  scoreResult?: {
    isCorrect: boolean
    score: number
  }
}

// ----------------------------------------------------------------------
// Memoized HTML Content to protect user highlights from re-renders
// ----------------------------------------------------------------------
export const QuestionHtmlContent = React.memo(function QuestionHtmlContent({
  html,
  className,
  as: Component = 'div',
}: {
  html: string
  className?: string
  as?: 'div' | 'p' | 'span' | 'h4'
}) {
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

// Strips redundant leading key prefix from option_text to avoid "A. A - courtesy" duplication.
// Handles formats: "A - text", "A. text", "A: text", "A text"
function stripOptionKeyPrefix(key: string, text: string): string {
  if (!text || !key) return text
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`^${escaped}\\s*[-–.:]\\s*`, 'i'), '').trim()
}

// ----------------------------------------------------------------------
// 1. Multiple Choice (Single selection: A, B, C, D)
// ----------------------------------------------------------------------
function MultipleChoice({ question, answer, onChange, disabled }: { question: QuestionData; answer: any; onChange: (v: string) => void; disabled?: boolean }) {
  // Guard: `question.options` is always truthy (even []), so check .length > 0
  const options = (question.options && question.options.length > 0)
    ? question.options
    : (question.metadata?.options && question.metadata.options.length > 0)
    ? (question.metadata.options as any[]).map((opt: any, idx: number) => ({
        option_key: opt.label || opt.option_key || String.fromCharCode(65 + idx),
        option_text: opt.text || opt.option_text || '',
      }))
    : [
        { option_key: 'A', option_text: 'Option A' },
        { option_key: 'B', option_text: 'Option B' },
        { option_key: 'C', option_text: 'Option C' },
        { option_key: 'D', option_text: 'Option D' },
      ]

  return (
    <div className="space-y-2 mt-3">
      {options.map((opt) => {
        const isSelected = answer === opt.option_key
        return (
          <button
            key={opt.option_key}
            type="button"
            disabled={disabled}
            onClick={() => {
              const sel = window.getSelection()
              if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return
              onChange(opt.option_key)
            }}
            className={cn(
              'relative w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all text-left select-text',
              isSelected
                ? 'bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/30 font-semibold'
                : 'bg-card border-border text-foreground hover:bg-secondary/60 hover:border-primary/40',
              disabled && 'cursor-default pointer-events-none'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors shrink-0 select-none',
                isSelected
                  ? 'bg-primary border-primary text-black'
                  : 'bg-secondary border-border text-muted-foreground'
              )}
            >
              {opt.option_key}
            </div>
            <QuestionHtmlContent
              as="span"
              className="flex-1 select-text cursor-text"
              html={opt.option_text}
            />
          </button>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. Multiple Response / Multiple Select (Checkboxes, e.g. choose TWO)
// ----------------------------------------------------------------------
function MultipleResponse({ question, answer, onChange, disabled }: { question: QuestionData; answer: any; onChange: (v: string[]) => void; disabled?: boolean }) {
  const currentAnswers: string[] = Array.isArray(answer) ? answer : []
  const options = (question.options && question.options.length > 0)
    ? question.options
    : (question.metadata?.options && question.metadata.options.length > 0)
    ? (question.metadata.options as any[]).map((opt: any, idx: number) => ({
        option_key: opt.label || opt.option_key || String.fromCharCode(65 + idx),
        option_text: opt.text || opt.option_text || '',
      }))
    : [
        { option_key: 'A', option_text: 'Statement A' },
        { option_key: 'B', option_text: 'Statement B' },
        { option_key: 'C', option_text: 'Statement C' },
        { option_key: 'D', option_text: 'Statement D' },
        { option_key: 'E', option_text: 'Statement E' },
      ]

  const toggleOption = (key: string) => {
    if (disabled) return
    if (currentAnswers.includes(key)) {
      onChange(currentAnswers.filter((item) => item !== key))
    } else {
      onChange([...currentAnswers, key])
    }
  }

  return (
    <div className="space-y-2 mt-3">
      {options.map((opt) => {
        const isSelected = currentAnswers.includes(opt.option_key)
        return (
          <button
            key={opt.option_key}
            type="button"
            disabled={disabled}
            onClick={() => {
              const sel = window.getSelection()
              if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return
              toggleOption(opt.option_key)
            }}
            className={cn(
              'relative w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all text-left select-text',
              isSelected
                ? 'bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/30 font-semibold'
                : 'bg-card border-border text-foreground hover:bg-secondary/60 hover:border-primary/40',
              disabled && 'cursor-default pointer-events-none'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border transition-colors shrink-0 select-none',
                isSelected
                  ? 'bg-primary border-primary text-black'
                  : 'bg-secondary border-border text-muted-foreground'
              )}
            >
              {opt.option_key}
            </div>
            <QuestionHtmlContent
              as="span"
              className="flex-1 select-text cursor-text"
              html={opt.option_text}
            />
          </button>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------
// 3 & 4. True/False/Not Given & Yes/No/Not Given
// ----------------------------------------------------------------------
function TrueFalseNotGiven({
  question,
  answer,
  onChange,
  disabled,
  isYesNo = false,
}: {
  question: QuestionData
  answer: any
  onChange: (v: string) => void
  disabled?: boolean
  isYesNo?: boolean
}) {
  const choices = isYesNo
    ? [
        { label: 'YES', value: 'YES' },
        { label: 'NO', value: 'NO' },
        { label: 'NOT GIVEN', value: 'NOT GIVEN' },
      ]
    : [
        { label: 'TRUE', value: 'TRUE' },
        { label: 'FALSE', value: 'FALSE' },
        { label: 'NOT GIVEN', value: 'NOT GIVEN' },
      ]

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {choices.map((c) => {
        const isSelected = String(answer || '').trim().toUpperCase() === c.value
        return (
          <button
            key={c.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border uppercase cursor-pointer',
              isSelected
                ? 'bg-primary text-black border-primary shadow-xs ring-1 ring-primary/30 font-bold'
                : 'bg-card text-foreground hover:bg-secondary border-border hover:border-primary/40',
              disabled && 'opacity-70 cursor-default pointer-events-none'
            )}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------
// 5. Matching Headings
// ----------------------------------------------------------------------
function MatchingHeadings({ question, answer, onChange, disabled }: { question: QuestionData; answer: any; onChange: (v: any) => void; disabled?: boolean }) {
  const headings = question.metadata?.headings || [
    { key: 'i',   text: 'The historical discovery and origin' },
    { key: 'ii',  text: 'Structural degradation over centuries' },
    { key: 'iii', text: 'Modern architectural restoration efforts' },
    { key: 'iv',  text: 'Economic impact on regional tourism' },
    { key: 'v',   text: 'Architectural comparison with neighboring arenas' },
  ]

  const paragraphs: { key: string; label: string }[] = question.metadata?.paragraphs || []

  // Multi-paragraph mode: answer is an object { A: 'i', B: 'iv', ... }
  if (paragraphs.length > 0) {
    const currentAnswers: Record<string, string> = (
      typeof answer === 'object' && answer !== null && !Array.isArray(answer)
        ? answer
        : {}
    )

    const handleParaChange = (paraKey: string, headingKey: string) => {
      onChange({ ...currentAnswers, [paraKey]: headingKey })
    }

    return (
      <div className="mt-3 space-y-4">
        {/* Shared headings list header */}
        <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1.5">
          <p className="text-xs font-semibold text-foreground mb-1.5">List of Headings</p>
          <div className="space-y-1">
            {headings.map((h: any) => (
              <div key={h.key} className="flex items-start gap-2 text-xs text-foreground/90 select-text">
                <span className="font-mono font-bold text-primary w-7 shrink-0 select-none">{h.key}</span>
                <QuestionHtmlContent as="span" className="select-text cursor-text" html={h.text} />
              </div>
            ))}
          </div>
        </div>

        {/* Paragraph sub-questions */}
        <div className="space-y-3">
          {paragraphs.map((para) => {
            const paraAnswer = currentAnswers[para.key] || ''
            return (
              <div key={para.key} className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-foreground">
                  {para.label || `Paragraph ${para.key}`}
                </label>
                <select
                  value={paraAnswer}
                  disabled={disabled}
                  onChange={(e) => handleParaChange(para.key, e.target.value)}
                  className="w-full max-w-lg p-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select heading --</option>
                  {headings.map((h: any) => (
                    <option key={h.key} value={h.key}>
                      {h.key}. {h.text}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Single-paragraph fallback: answer is a string
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-xs font-semibold text-muted-foreground">Select Heading for Paragraph:</label>
      <select
        value={typeof answer === 'string' ? answer : ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-lg p-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none cursor-pointer"
      >
        <option value="">-- Choose matching heading --</option>
        {headings.map((h: any) => (
          <option key={h.key} value={h.key}>
            {h.key}. {h.text}
          </option>
        ))}
      </select>
    </div>
  )
}

// ----------------------------------------------------------------------
// 6, 7, 8. Matching (Information / Features / Sentence Endings)
// Compact pill-style — completely distinct from MultipleChoice big buttons
// ----------------------------------------------------------------------
function MatchingSelector({
  question,
  answer,
  onChange,
  disabled,
  label = 'Select Match:',
}: {
  question: QuestionData
  answer: any
  onChange: (v: string) => void
  disabled?: boolean
  label?: string
}) {
  const [showRef, setShowRef] = useState(false)

  const items = (question.options && question.options.length > 0)
    ? question.options
    : (question.metadata?.options && question.metadata.options.length > 0)
    ? (question.metadata.options as any[]).map((opt: any, idx: number) => ({
        option_key: opt.label || opt.option_key || String.fromCharCode(65 + idx),
        option_text: opt.text || opt.option_text || '',
      }))
    : question.metadata?.items || []

  const selectedItem = items.find((o: any) => String(o.option_key).trim() === String(answer || '').trim())

  return (
    <div className="mt-3 space-y-2.5">

      {/* Collapsible Reference Table */}
      {items.length > 0 && (
        <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRef(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Options Reference <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">{items.length} options</span>
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showRef && 'rotate-180')} />
          </button>

          {showRef && (
            <div className="px-3 pb-3 border-t border-border/50 space-y-1.5 pt-2">
              {items.map((opt: any) => (
                <div key={opt.option_key} className="flex items-start gap-2.5 text-xs">
                  <span className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    {opt.option_key}
                  </span>
                  <span className="text-foreground/80 leading-relaxed pt-0.5 select-text">{opt.option_text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compact letter pill selector */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((opt: any) => {
            const key = String(opt.option_key).trim()
            const isSelected = String(answer || '').trim() === key
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const sel = window.getSelection()
                  if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return
                  onChange(isSelected ? '' : key)
                }}
                className={cn(
                  'w-9 h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-primary text-black border-primary shadow-sm ring-2 ring-primary/25 scale-105'
                    : 'bg-card text-foreground hover:bg-secondary border-border hover:border-primary/50 hover:scale-105',
                  disabled && 'opacity-60 cursor-default pointer-events-none'
                )}
                title={opt.option_text}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected answer confirmation */}
      {selectedItem && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs">
          <span className="w-6 h-6 rounded-lg bg-primary text-black font-bold flex items-center justify-center shrink-0 text-[11px]">
            {selectedItem.option_key}
          </span>
          <span className="text-foreground/80 flex-1 leading-relaxed">{selectedItem.option_text}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-muted-foreground hover:text-destructive transition-colors px-1 cursor-pointer shrink-0"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {!selectedItem && (
        <p className="text-[11px] text-muted-foreground italic px-1">No answer selected — click a letter above</p>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// 8.5. Summary Completion with Word Bank (Options Box)
// ----------------------------------------------------------------------
function SummaryCompletionSelector({
  question,
  answer,
  onChange,
  disabled,
}: {
  question: QuestionData
  answer: any
  onChange: (v: string) => void
  disabled?: boolean
}) {
  // Extract options either from question.options or parse from instruction / metadata
  let items: QuestionOptionItem[] = (question.options && question.options.length > 0)
    ? question.options
    : (question.metadata?.options && (question.metadata.options as any[]).length > 0)
    ? (question.metadata.options as any[]).map((opt: any, idx: number) => ({
        option_key: opt.label || opt.option_key || String.fromCharCode(65 + idx),
        option_text: opt.text || opt.option_text || '',
      }))
    : []

  if (items.length === 0 && question.instruction) {
    const source = question.instruction
    const boxMatch = source.match(/\[(.*?)\]/) || source.match(/box[:\s]+([\s\S]+)/i)
    const strToScan = boxMatch ? boxMatch[1] : source
    const regex = /\b([A-Z])\s*[:\-\.]\s*([a-zA-Z\s\-]+?)(?=[,\;\]\)\n]|\s+[A-Z]\s*[:\-\.]|$)/gi
    let m
    const parsed: QuestionOptionItem[] = []
    while ((m = regex.exec(strToScan)) !== null) {
      parsed.push({ option_key: m[1].toUpperCase(), option_text: m[2].trim() })
    }
    if (parsed.length >= 2) {
      items = parsed
    }
  }

  // If no box options found, standard text input
  if (items.length === 0) {
    return (
      <TextCompletion
        question={question}
        answer={answer}
        onChange={onChange}
        disabled={disabled}
        placeholder="Fill summary blank..."
      />
    )
  }

  // Render clean dropdown selector (as requested, without redundant Word Bank card grid)
  const currentStr = String(answer || '').trim()
  const matchedItem = items.find(
    (opt) =>
      String(opt?.option_key || '').toUpperCase() === currentStr.toUpperCase() ||
      (currentStr.length > 0 && String(opt?.option_text || '').toLowerCase() === currentStr.toLowerCase())
  )

  return (
    <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <select
        value={matchedItem?.option_key || currentStr || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-md p-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none cursor-pointer"
      >
        <option value="">-- Choose matching letter or word --</option>
        {items.map((opt) => (
          <option key={opt.option_key} value={opt.option_key}>
            {opt.option_key}. {stripOptionKeyPrefix(opt.option_key, opt.option_text)}
          </option>
        ))}
      </select>

      {currentStr && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('')}
          className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 transition-colors cursor-pointer self-start sm:self-auto"
        >
          Clear selection
        </button>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// 9, 10, 11, 12, 13, 14, 15. Completion & Short Answer (Text input)
// ----------------------------------------------------------------------
function TextCompletion({
  question,
  answer,
  onChange,
  disabled,
  placeholder = 'Type your answer here...',
}: {
  question: QuestionData
  answer: any
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={answer || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-md px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all font-medium"
      />
    </div>
  )
}

// ----------------------------------------------------------------------
// 16 & 17. Writing Tasks 1 & 2
// ----------------------------------------------------------------------
function WritingTaskRenderer({
  question,
  answer,
  onChange,
  disabled,
  isTask2 = false,
}: {
  question: QuestionData
  answer: any
  onChange: (v: string) => void
  disabled?: boolean
  isTask2?: boolean
}) {
  const content = answer || ''
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const minWords = isTask2 ? 250 : 150

  return (
    <div className="mt-4 space-y-3">
      {question.image_url && (
        <div className="p-3 bg-secondary/30 border border-border rounded-xl flex justify-center">
          <img src={question.image_url} alt="Writing Visual Task" className="max-h-72 object-contain rounded-lg" />
        </div>
      )}

      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Word count: <strong className={cn(words >= minWords ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')}>{words}</strong> / {minWords} words minimum
        </span>
        <span>{words >= minWords ? '✓ Target reached' : `Need ${minWords - words} more words`}</span>
      </div>

      <textarea
        value={content}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        placeholder={`Write your ${isTask2 ? 'Task 2 essay (min 250 words)' : 'Task 1 response (min 150 words)'} here...`}
        className="w-full p-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none resize-y leading-relaxed font-sans"
      />
    </div>
  )
}

// ----------------------------------------------------------------------
// 18, 19, 20. Speaking Parts 1, 2, 3
// ----------------------------------------------------------------------
function SpeakingTaskRenderer({
  question,
  answer,
  onChange,
  disabled,
  partNumber = 1,
}: {
  question: QuestionData
  answer: any
  onChange: (v: any) => void
  disabled?: boolean
  partNumber?: 1 | 2 | 3
}) {
  const [isRecording, setIsRecording] = useState(false)

  const toggleRecord = () => {
    if (disabled) return
    setIsRecording(!isRecording)
    if (!isRecording) {
      onChange({ recorded: true, duration: 120 })
    }
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
      {partNumber === 2 ? (
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            IELTS Candidate Cue Card
          </div>
          <div className="text-sm font-semibold text-foreground mb-2">You should say:</div>
          <div
            className="text-sm text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question_text) }}
          />
          <div className="mt-3 text-xs text-muted-foreground italic">
            You will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say.
          </div>
        </div>
      ) : (
        <div
          className="text-sm text-foreground font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question_text) }}
        />
      )}

      {/* Audio Recorder Simulator */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={toggleRecord}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer',
            isRecording
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-primary hover:bg-primary/90 text-black font-semibold'
          )}
        >
          <Mic className="w-4 h-4" />
          {isRecording ? 'Stop Recording' : 'Start Speaking Answer'}
        </button>

        {isRecording && (
          <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            Recording...
          </span>
        )}

        {answer?.recorded && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-100/70 dark:text-emerald-400 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
            ✓ Audio answer captured
          </span>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// MAIN UNIVERSAL QUESTION RENDERER
// ----------------------------------------------------------------------
export function QuestionRenderer({
  question,
  answer,
  onChange,
  isMarked = false,
  onToggleMark,
  showExplanation = false,
  disabled = false,
  scoreResult,
}: QuestionRendererProps) {
  const qType = (question.question_type || 'multiple_choice').toLowerCase()

  const renderInputByType = () => {
    switch (qType) {
      // 1. Multiple choice
      case 'multiple_choice':
        return <MultipleChoice question={question} answer={answer} onChange={onChange} disabled={disabled} />

      // 2. Multiple response
      case 'multiple_response':
      case 'multiple_select':
        return <MultipleResponse question={question} answer={answer} onChange={onChange} disabled={disabled} />

      // 3. True / False / Not Given
      case 'true_false_not_given':
        return <TrueFalseNotGiven question={question} answer={answer} onChange={onChange} disabled={disabled} isYesNo={false} />

      // 4. Yes / No / Not Given
      case 'yes_no_not_given':
        return <TrueFalseNotGiven question={question} answer={answer} onChange={onChange} disabled={disabled} isYesNo={true} />

      // 5. Matching Headings
      case 'matching_headings':
        return <MatchingHeadings question={question} answer={answer} onChange={onChange} disabled={disabled} />

      // 6. Matching Information
      case 'matching_information':
        return <MatchingSelector question={question} answer={answer} onChange={onChange} disabled={disabled} label="Select Matching Paragraph (A–G):" />

      // 7. Matching Features
      case 'matching_features':
        return <MatchingSelector question={question} answer={answer} onChange={onChange} disabled={disabled} label="Select Matching Feature / Person:" />

      // 8. Matching Sentence Endings
      case 'matching_sentence_endings':
        if (question.options && question.options.length > 0) {
          return <SummaryCompletionSelector question={question} answer={answer} onChange={onChange} disabled={disabled} />
        }
        return <MatchingSelector question={question} answer={answer} onChange={onChange} disabled={disabled} label="Select Matching Sentence Ending:" />

      // 9. Sentence Completion
      case 'sentence_completion':
        if (question.options && question.options.length > 0) {
          return <SummaryCompletionSelector question={question} answer={answer} onChange={onChange} disabled={disabled} />
        }
        return <TextCompletion question={question} answer={answer} onChange={onChange} disabled={disabled} placeholder="Complete sentence..." />

      // 10. Summary Completion
      case 'summary_completion':
        return <SummaryCompletionSelector question={question} answer={answer} onChange={onChange} disabled={disabled} />

      // 11. Note Completion
      case 'note_completion':
        return <TextCompletion question={question} answer={answer} onChange={onChange} disabled={disabled} placeholder="Complete note..." />

      // 12. Table Completion
      case 'table_completion':
        return <TextCompletion question={question} answer={answer} onChange={onChange} disabled={disabled} placeholder="Fill table cell..." />

      // 13. Flow-chart Completion
      case 'flow_chart_completion':
        return <TextCompletion question={question} answer={answer} onChange={onChange} disabled={disabled} placeholder="Flow chart step..." />

      // 14. Diagram Label Completion
      case 'diagram_label_completion':
      case 'plan_map_diagram':
        return <TextCompletion question={question} answer={answer} onChange={onChange} disabled={disabled} placeholder="Label diagram..." />

      // 15. Short Answer
      case 'short_answer':
      case 'form_completion':
      default:
        if (qType.startsWith('writing_task_1')) {
          return <WritingTaskRenderer question={question} answer={answer} onChange={onChange} disabled={disabled} isTask2={false} />
        }
        if (qType.startsWith('writing_task_2')) {
          return <WritingTaskRenderer question={question} answer={answer} onChange={onChange} disabled={disabled} isTask2={true} />
        }
        if (qType.startsWith('speaking_part_1')) {
          return <SpeakingTaskRenderer question={question} answer={answer} onChange={onChange} disabled={disabled} partNumber={1} />
        }
        if (qType.startsWith('speaking_part_2')) {
          return <SpeakingTaskRenderer question={question} answer={answer} onChange={onChange} disabled={disabled} partNumber={2} />
        }
        if (qType.startsWith('speaking_part_3')) {
          return <SpeakingTaskRenderer question={question} answer={answer} onChange={onChange} disabled={disabled} partNumber={3} />
        }
        return <TextCompletion question={question} answer={answer} onChange={onChange} disabled={disabled} placeholder="Enter answer..." />
    }
  }

  return (
    <div
      id={`question-${question.id || question.question_number}`}
      className={cn(
        'p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all scroll-mt-24',
        scoreResult
          ? scoreResult.isCorrect
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : 'bg-rose-500/5 border-rose-500/30'
          : 'bg-card border-border shadow-xs'
      )}
    >
      <div className="flex items-start gap-2.5 sm:gap-3.5">
        {/* Number Badge */}
        <div
          className={cn(
            'shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-xs font-bold transition-colors',
            scoreResult
              ? scoreResult.isCorrect
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
              : 'bg-primary/10 text-primary border border-primary/20'
          )}
        >
          {question.question_number}
        </div>

        <div className="flex-1 min-w-0">
          {/* Instruction */}
          {question.instruction && (
            <QuestionHtmlContent
              as="p"
              className="text-xs font-semibold text-muted-foreground italic mb-1.5 tracking-wide select-text"
              html={sanitizeHtml(question.instruction.replace(/\s*\[[A-Z]\s*[:\-\.][\s\S]*?\]/gi, '').trim())}
            />
          )}

          {/* Question Text / HTML */}
          <QuestionHtmlContent
            as="div"
            className="text-sm font-medium text-foreground leading-relaxed select-text"
            html={sanitizeHtml(question.question_html || question.question_text)}
          />

          {/* Optional Question Image */}
          {question.image_url && !qType.startsWith('writing') && (
            <div className="mt-3 p-2 bg-secondary/40 border border-border rounded-xl inline-block max-w-full">
              <img 
                src={question.image_url} 
                alt="Question visual" 
                className="max-h-60 rounded-lg object-contain" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (question.image_url && !question.image_url.startsWith('http') && !target.src.includes('onrender.com')) {
                    target.src = apiUrl(question.image_url)
                  }
                }}
              />
            </div>
          )}

          {/* Dynamic Input Control */}
          {renderInputByType()}

          {/* Review / Score Banner */}
          {scoreResult && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
              {scoreResult.isCorrect ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{question.points || 1} pt)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
                  <XCircle className="w-3.5 h-3.5" /> Incorrect (0 pt)
                </span>
              )}
            </div>
          )}

          {/* Detailed Explanation / Answer Key (Admin / Review mode) */}
          {showExplanation && (
            <div className="mt-4 p-3.5 bg-secondary/40 rounded-xl border border-border space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Correct Answer & Explanation:</span>
              </div>
              <div className="text-foreground flex flex-wrap items-center gap-2">
                <strong className="text-muted-foreground">Correct Answer:</strong>{' '}
                <span className="font-mono bg-card px-2 py-0.5 rounded border border-border text-primary font-bold">
                  {question.correct_answer || (Array.isArray(question.accepted_answers) ? question.accepted_answers.join(', ') : 'N/A')}
                </span>
                {Array.isArray(question.accepted_answers) && question.accepted_answers.length > 0 && (
                  <span className="text-muted-foreground text-[11px]">
                    (Also accepted: {question.accepted_answers.join(', ')})
                  </span>
                )}
              </div>
              {question.explanation && (
                <p className="text-muted-foreground leading-relaxed pt-1 border-t border-border/60">
                  {question.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bookmark / Flag for review button */}
        {onToggleMark && (
          <button
            type="button"
            onClick={onToggleMark}
            title={isMarked ? 'Remove review mark' : 'Mark for review'}
            className={cn(
              'shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer',
              isMarked
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Bookmark className={cn('w-4 h-4', isMarked && 'fill-primary text-primary')} />
          </button>
        )}
      </div>
    </div>
  )
}
