import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Eye,
  Sparkles,
  Code,
  Upload,
  Download,
  Copy,
} from 'lucide-react'
import { QuestionRenderer } from '@/components/tests/question-renderer'
import { saveFullTestStructure, createImportRecord } from '@/actions/admin'
import { cn } from '@/lib/utils'

const sampleJsonTemplate = {
  title: 'Cambridge IELTS 19 — Academic Reading Test 1',
  skill: 'reading',
  ielts_type: 'academic',
  access_type: 'free',
  difficulty: 'medium',
  time_limit_minutes: 60,
  description: 'Complete Academic Reading mock test with passages and 40 questions.',
  sections: [
    {
      title: 'Reading Passage 1: The Roman Amphitheatre of Arles',
      order_number: 1,
      time_limit_minutes: 20,
      instructions: 'You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.',
      passage_html: '<p>Built in 90 AD by the Roman Empire, the amphitheatre at Arles in southern France could hold over 20,000 spectators...</p>',
    },
    {
      title: 'Reading Passage 2: Biomimicry in Architecture',
      order_number: 2,
      time_limit_minutes: 20,
      instructions: 'You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.',
      passage_html: '<p>Biomimicry is the practice of looking to nature for solutions to modern engineering challenges...</p>',
    }
  ],
  questions: [
    {
      section_index: 0,
      question_number: 1,
      question_type: 'true_false_not_given',
      instruction: 'Write TRUE, FALSE, or NOT GIVEN.',
      question_text: 'The amphitheatre at Arles was originally constructed during the first century AD.',
      correct_answer: 'TRUE',
      explanation: 'Paragraph 1 explicitly mentions it was built in 90 AD (first century).',
    },
    {
      section_index: 0,
      question_number: 2,
      question_type: 'multiple_choice',
      instruction: 'Choose the correct letter, A, B, C or D.',
      question_text: 'What was the primary motive behind early amphitheatre construction?',
      options: [
        { option_key: 'A', option_text: 'Commercial trading markets', is_correct: false },
        { option_key: 'B', option_text: 'Public entertainment and gladiatorial battles', is_correct: true },
        { option_key: 'C', option_text: 'Religious worship ceremonies', is_correct: false },
        { option_key: 'D', option_text: 'Military garrisons', is_correct: false },
      ],
      correct_answer: 'B',
      explanation: 'Paragraph 1 specifies entertainment in the form of chariot races and battles.',
    },
  ],
}

export function JsonImportView() {
  const navigate = useNavigate()
  const [jsonText, setJsonText] = useState(JSON.stringify(sampleJsonTemplate, null, 2))
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    data?: any
    errors?: string[]
  } | null>(null)
  const [activePreviewQ, setActivePreviewQ] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Handle .json file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setJsonText(text)
      validateJsonString(text)
    }
    reader.readAsText(file)
  }

  const validateJsonString = (str: string) => {
    try {
      const parsed = JSON.parse(str)
      const errors: string[] = []

      if (!parsed.title) errors.push('Missing "title" field.')
      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        errors.push('Missing or empty "questions" array.')
      } else {
        parsed.questions.forEach((q: any, i: number) => {
          if (!q.question_number) errors.push(`Question at index ${i} missing "question_number".`)
          if (!q.question_type) errors.push(`Question #${q.question_number || i} missing "question_type".`)
          if (!q.question_text) errors.push(`Question #${q.question_number || i} missing "question_text".`)
        })
      }

      if (parsed.skill === 'reading' && (!parsed.sections || parsed.sections.length === 0)) {
        errors.push('Reading tests require at least one section with "passage_html".')
      }

      if (errors.length > 0) {
        setValidationResult({ valid: false, errors })
      } else {
        setValidationResult({ valid: true, data: parsed })
        setActivePreviewQ(0)
      }
    } catch (err: any) {
      setValidationResult({ valid: false, errors: [`JSON Syntax Error: ${err.message}`] })
    }
  }

  const handleValidate = () => {
    validateJsonString(jsonText)
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(sampleJsonTemplate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ielts-test-schema-template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleJsonTemplate, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveToDatabase = async () => {
    if (!validationResult?.valid || !validationResult.data) return

    try {
      setIsSaving(true)
      const { data } = validationResult

      const sections = data.sections && data.sections.length > 0
        ? data.sections
        : [
            {
              title: 'Section 1',
              order_number: 1,
              time_limit_minutes: data.time_limit_minutes || 60,
              instructions: data.instructions || 'Answer the questions below.',
              passage_html: data.passage_html || '<p>Reading passage</p>',
            },
          ]

      const formattedQuestions = data.questions.map((q: any, idx: number) => ({
        ...q,
        section_index: typeof q.section_index === 'number' ? q.section_index : 0,
        question_number: q.question_number || idx + 1,
      }))

      const res = await saveFullTestStructure({
        test: {
          title: data.title,
          skill: data.skill || 'reading',
          ielts_type: data.ielts_type || 'academic',
          access_type: data.access_type || 'free',
          difficulty: data.difficulty || 'medium',
          time_limit_minutes: data.time_limit_minutes || 60,
          description: data.description || 'Imported via Structured JSON',
          tags: ['JSON Import', 'Official Practice'],
          status: 'draft',
        },
        sections,
        questions: formattedQuestions,
      })

      // Audit log
      await createImportRecord({
        source_type: 'json',
        file_url: `${data.title}.json`,
        raw_text: jsonText.substring(0, 5000),
        raw_json: data,
      })

      if (res.testId) {
        alert(`Test and ${formattedQuestions.length} questions created successfully!`)
        navigate(`/admin/tests/${res.testId}/edit`)
      }
    } catch (err: any) {
      alert(`Error saving JSON test: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/import"
            className="p-1.5 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-500" />
              <span>Structured JSON Importer</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Validate and bulk import IELTS Cambridge tests, passages, and questions with instant schema check
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            onClick={handleValidate}
            className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-primary" />
            <span>Validate Schema</span>
          </button>

          {validationResult?.valid && (
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Importing...' : 'Save to Database'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: JSON Editor & Upload */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">JSON Input Payload</span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" /> Upload .JSON File
                <input type="file" accept=".json" onChange={handleFileUpload} className="sr-only" />
              </label>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy Template'}
              </button>
            </div>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={22}
            className="w-full flex-1 p-4 rounded-xl font-mono text-xs bg-slate-950 text-amber-300 dark:text-primary focus:outline-hidden resize-y leading-relaxed border border-border"
            spellCheck={false}
          />
        </div>

        {/* Right: Validation & Live Preview */}
        <div className="space-y-4">
          {validationResult && (
            <div
              className={cn(
                'p-4 rounded-2xl border text-xs space-y-1.5',
                validationResult.valid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              )}
            >
              <div className="flex items-center gap-2 font-bold">
                {validationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Schema Validation Passed! ({validationResult.data?.questions?.length} Questions, {validationResult.data?.sections?.length || 1} Sections)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Validation Failed:</span>
                  </>
                )}
              </div>

              {validationResult.errors && (
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1 text-rose-500">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {validationResult?.valid && validationResult.data?.questions && (
            <div className="p-5 bg-card border border-border rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
                <span className="text-xs font-bold text-foreground">
                  Preview Question #{activePreviewQ + 1}
                </span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                  {validationResult.data.questions.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePreviewQ(idx)}
                      className={cn(
                        'w-6 h-6 rounded-md text-[10px] font-bold border transition-colors cursor-pointer shrink-0',
                        activePreviewQ === idx
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {validationResult.data.questions[activePreviewQ] && (
                <div className="pt-2">
                  <QuestionRenderer
                    question={validationResult.data.questions[activePreviewQ]}
                    answer={validationResult.data.questions[activePreviewQ].correct_answer}
                    onChange={() => {}}
                    showExplanation={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JsonImportView
