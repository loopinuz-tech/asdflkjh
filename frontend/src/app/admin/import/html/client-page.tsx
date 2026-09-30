import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Layers,
  ArrowRight,
  Eye,
  Trash2,
  Volume2,
  Edit,
  Plus,
  Save,
} from 'lucide-react'
import { parseIeltsHtml, ParsedIeltsTest } from '@/lib/parsers/html-test-parser'
import { saveFullTestStructure, createImportRecord } from '@/actions/admin'
import { cn } from '@/lib/utils'

export function HtmlImportClientView() {
  const navigate = useNavigate()
  const [htmlInput, setHtmlInput] = useState('')
  const [parsedTest, setParsedTest] = useState<ParsedIeltsTest | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0)
  const [parsingEngine, setParsingEngine] = useState<'gemini' | 'algorithmic'>('gemini')
  const [modelUsed, setModelUsed] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [isEditingPassage, setIsEditingPassage] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)

  // Handle File Upload (.html, .htm)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setHtmlInput(text)
      triggerParse(text, file.name)
    }
    reader.readAsText(file)
  }

  // Parse HTML with Gemini AI Auto-Detection & Fallback
  const triggerParse = async (content: string, customFileName?: string) => {
    if (!content.trim()) return
    setIsParsing(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

    try {
      // 1. Try Gemini AI Auto-Detection endpoint
      const res = await fetch('/api/admin/parse-html-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          html: content,
          fileName: customFileName || fileName || 'IELTS Test',
        }),
      })

      if (res.ok) {
        const json = await res.json()
        if (json.parsedTest) {
          setParsedTest(json.parsedTest)
          setParsingEngine('gemini')
          setModelUsed(json.parsedTest.model_used || 'gemini-3.1-flash-lite')
          setActiveSectionIdx(0)
          setSelectedQuestionIdx(0)
          return
        }
      }

      // 2. Fallback to algorithmic parser
      const result = parseIeltsHtml(content)
      setParsedTest(result)
      setParsingEngine('algorithmic')
      setModelUsed(null)
      setActiveSectionIdx(0)
      setSelectedQuestionIdx(0)
    } catch (err: any) {
      console.warn('Gemini HTML parsing failed, using algorithmic fallback:', err)
      const result = parseIeltsHtml(content)
      setParsedTest(result)
      setParsingEngine('algorithmic')
      setModelUsed(null)
      setActiveSectionIdx(0)
      setSelectedQuestionIdx(0)
    } finally {
      setIsParsing(false)
    }
  }

  // Load Sample IELTS Reading HTML
  const loadSampleHtml = () => {
    const sample = `
<!DOCTYPE html>
<html>
<head>
  <title>Cambridge IELTS 18 — Academic Reading Test 1</title>
</head>
<body>
  <h1>Cambridge IELTS 18 — Academic Reading Test 1</h1>

  <section>
    <h2>Reading Passage 1: The Roman Amphitheatre of Arles</h2>
    <p>Built in 90 AD by the Roman Empire, the amphitheatre at Arles in southern France could hold over 20,000 spectators and was constructed to provide entertainment in the form of chariot races and bloody hand-to-hand battles.</p>
    <p>Today, it draws large crowds for bullfighting during the Feria d'Arles, as well as plays and concerts in the summer. Measuring 136 metres in length and 107 metres in width, it is slightly larger than the nearby arena at Nimes and ranks among the 20 largest Roman amphitheatres still in existence.</p>
    <p>The towers jutting out at the top are medieval additions, converted into a fortified town with over 200 houses during the 6th to 18th centuries before restoration began in the 1830s under writer Prosper Merimee.</p>

    <h3>Questions 1–3</h3>
    <p><em>Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE or NOT GIVEN.</em></p>
    <p><strong>1.</strong> The amphitheatre at Arles was originally constructed during the first century AD.</p>
    <p><strong>2.</strong> The amphitheatre at Nimes can accommodate more people than the Arles amphitheatre.</p>
    <p><strong>3.</strong> During the medieval era, the amphitheatre was primarily used for gladiatorial combat.</p>
  </section>

  <section>
    <h2>Reading Passage 2: Biomimicry in Architecture</h2>
    <p>Biomimicry is the practice of looking to nature for solutions to modern engineering challenges. The Eastgate Centre in Harare, Zimbabwe, is perhaps the most famous example, utilizing passive cooling modeled on the ventilation mounds of indigenous termites.</p>
    <p>Architect Mick Pearce studied how termites maintain a constant 30 degrees Celsius inside their mounds despite outside fluctuations from 2 to 42 degrees.</p>

    <h3>Questions 4–5</h3>
    <p><em>Choose the correct letter, A, B, C or D.</em></p>
    <p><strong>4.</strong> What inspired the cooling mechanism of the Eastgate Centre?</p>
    <p>A. Desert ant burrows</p>
    <p>B. Indigenous termite mounds</p>
    <p>C. Subterranean honeybee hives</p>
    <p>D. African bird nests</p>

    <p><strong>5.</strong> The Eastgate Centre's architect was:</p>
    <p>A. Prosper Merimee</p>
    <p>B. Mick Pearce</p>
    <p>C. Norman Foster</p>
    <p>D. Frank Gehry</p>
  </section>

  <h3>Answer Key</h3>
  <p>1. TRUE</p>
  <p>2. FALSE</p>
  <p>3. FALSE</p>
  <p>4. B</p>
  <p>5. B</p>
</body>
</html>
    `.trim()

    setHtmlInput(sample)
    triggerParse(sample)
  }

  // Handle Audio File Upload to Cloudinary / Server for listening sections
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, secIdx: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingAudio(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.fileUrl) {
          setParsedTest((prev) => {
            if (!prev) return null
            const nextSecs = [...prev.sections]
            nextSecs[secIdx] = { ...nextSecs[secIdx], audio_url: data.fileUrl }
            return { ...prev, sections: nextSecs }
          })
          alert('Audio uploaded successfully!')
        }
      } else {
        alert('Failed to upload audio file.')
      }
    } catch (err: any) {
      alert(`Audio upload error: ${err.message}`)
    } finally {
      setIsUploadingAudio(false)
    }
  }

  // Save parsed test to database
  const handleSaveToDatabase = async () => {
    if (!parsedTest) return

    try {
      setIsSaving(true)

      // Flatten questions with their section_index
      const formattedQuestions: any[] = []
      parsedTest.sections.forEach((sec, sIdx) => {
        sec.questions.forEach((q) => {
          formattedQuestions.push({
            ...q,
            section_index: sIdx,
          })
        })
      })

      // Deduce part/scope and duration for imported test
      const tags = ['HTML Import', 'Official Practice']
      let timeLimit = parsedTest.time_limit_minutes || 60

      if (parsedTest.sections.length === 1) {
        timeLimit = parsedTest.skill === 'listening' ? 10 : 20
        tags.push('Single Passage')
      } else {
        tags.push('Full Test')
      }

      const res = await saveFullTestStructure({
        test: {
          title: parsedTest.title,
          skill: parsedTest.skill,
          ielts_type: parsedTest.ielts_type,
          difficulty: parsedTest.difficulty,
          time_limit_minutes: timeLimit,
          description: parsedTest.description,
          tags,
          status: 'draft',
        },
        sections: parsedTest.sections.map((s, idx) => ({
          title: s.title,
          order_number: idx + 1,
          instructions: s.instructions,
          time_limit_minutes: s.time_limit_minutes,
          passage_html: s.passage_html,
          audio_url: s.audio_url,
        })),
        questions: formattedQuestions,
      })

      // Audit record
      await createImportRecord({
        source_type: 'html' as any,
        file_url: fileName || `${parsedTest.title}.html`,
        raw_text: htmlInput.substring(0, 5000),
        raw_json: parsedTest,
      })

      if (res.testId) {
        alert('Test successfully created and saved to database!')
        navigate(`/admin/tests/${res.testId}/edit`)
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 w-full min-w-0">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/import"
            className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FileCode className="w-5 h-5 text-primary" />
              <span>HTML Test Importer</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload or paste HTML test content. Automatically parses passages, sections, questions, and answer keys.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSampleHtml}
            className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Load Sample IELTS HTML</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: File Upload & Raw Code Box */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">1. Provide HTML Source</h2>
            {htmlInput && (
              <button
                type="button"
                onClick={() => {
                  setHtmlInput('')
                  setParsedTest(null)
                }}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-secondary/20">
            <Upload className="w-7 h-7 text-muted-foreground mb-2" />
            <span className="text-xs font-bold text-foreground">Choose an HTML file</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Supports .html and .htm files</span>
            <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="sr-only" />
          </label>

          {/* Direct Code Paste Textarea */}
          <div className="flex-1 flex flex-col space-y-1.5 min-h-[220px]">
            <label className="text-xs font-semibold text-muted-foreground">Or Paste HTML Code Directly:</label>
            <textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="<html><body><h1>Test Title</h1>...</body></html>"
              className="flex-1 w-full p-3 rounded-xl border border-border bg-background font-mono text-xs text-foreground resize-y focus:ring-2 focus:ring-primary focus:outline-hidden min-h-[200px]"
            />
          </div>

          <button
            type="button"
            onClick={() => triggerParse(htmlInput)}
            disabled={!htmlInput.trim() || isParsing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-primary text-primary-foreground font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={cn('w-4 h-4', isParsing && 'animate-spin')} />
            <span>
              {isParsing ? 'Gemini AI Auto-Detecting Test Structure...' : '✨ Auto-Detect with Gemini AI'}
            </span>
          </button>
        </div>

        {/* Right: Parsed Summary & Action Box */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">2. Extraction Summary & Review</h2>
            {isParsing && (
              <span className="text-xs text-amber-500 font-semibold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> AI Processing...
              </span>
            )}
          </div>

          {isParsing ? (
            <div className="flex-1 border border-primary/20 bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Gemini AI is Analyzing HTML Test</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Automatically extracting passages, parsing IELTS question formats, matching multiple choice options, and linking answer keys...
              </p>
            </div>
          ) : parsedTest ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Test Info Header */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-lg">
                    {(['reading', 'listening', 'writing', 'speaking'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setParsedTest((prev) => (prev ? { ...prev, skill: s } : null))}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer',
                          parsedTest.skill === s
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{parsingEngine === 'gemini' ? `AI (${modelUsed || 'Flash'})` : 'Algorithmic'}</span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Import
                    </span>
                  </div>
                </div>

                <input
                  type="text"
                  value={parsedTest.title}
                  onChange={(e) => setParsedTest({ ...parsedTest, title: e.target.value })}
                  className="w-full text-base font-bold bg-background border border-border rounded-lg px-2.5 py-1 text-foreground"
                />

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span><strong>{parsedTest.sections.length}</strong> Sections</span>
                  <span><strong>{parsedTest.total_questions}</strong> Questions</span>
                  <span><strong>{parsedTest.time_limit_minutes}m</strong> Time Limit</span>
                </div>
              </div>

              {/* Sections Tabs */}
              <div className="flex gap-1 border-b border-border pb-2 overflow-x-auto">
                {parsedTest.sections.map((sec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveSectionIdx(idx)
                      setSelectedQuestionIdx(0)
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border',
                      activeSectionIdx === idx
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {sec.title} ({sec.questions.length} Qs)
                  </button>
                ))}
              </div>

              {/* Active Section Content */}
              {parsedTest.sections[activeSectionIdx] && (
                <div className="p-4 rounded-xl border border-border bg-background space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {parsedTest.sections[activeSectionIdx].title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {parsedTest.sections[activeSectionIdx].instructions}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingPassage(!isEditingPassage)}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      {isEditingPassage ? 'Close Editor' : 'Edit Passage'}
                    </button>
                  </div>

                  {isEditingPassage && (
                    <textarea
                      value={parsedTest.sections[activeSectionIdx].passage_html || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setParsedTest((prev) => {
                          if (!prev) return null
                          const nextSecs = [...prev.sections]
                          nextSecs[activeSectionIdx] = { ...nextSecs[activeSectionIdx], passage_html: val }
                          return { ...prev, sections: nextSecs }
                        })
                      }}
                      rows={6}
                      className="w-full p-2.5 text-xs font-mono rounded-lg border border-border bg-secondary/30 text-foreground"
                    />
                  )}

                  {/* Audio Upload for Listening Tests */}
                  {parsedTest.skill === 'listening' && (
                    <div className="p-2.5 rounded-lg bg-secondary/40 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-primary" /> Audio URL for {parsedTest.sections[activeSectionIdx].title}:
                        </label>
                        <label className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                          {isUploadingAudio ? 'Uploading...' : '+ Upload Audio MP3'}
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleAudioUpload(e, activeSectionIdx)}
                            className="sr-only"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={parsedTest.sections[activeSectionIdx].audio_url || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setParsedTest((prev) => {
                            if (!prev) return null
                            const nextSecs = [...prev.sections]
                            nextSecs[activeSectionIdx] = { ...nextSecs[activeSectionIdx], audio_url: val }
                            return { ...prev, sections: nextSecs }
                          })
                        }}
                        placeholder="e.g. /uploads/listening-1.mp3 or https://..."
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>
                  )}

                  {/* Questions List & Inline Editor */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Extracted Questions ({parsedTest.sections[activeSectionIdx].questions.length})
                    </span>

                    {parsedTest.sections[activeSectionIdx].questions.map((q, qIdx) => (
                      <div key={q.question_number} className="p-2.5 rounded-lg bg-secondary/30 border border-border text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground">
                            Q{q.question_number}. ({q.question_type})
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">Key:</span>
                            <input
                              type="text"
                              value={q.correct_answer || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setParsedTest((prev) => {
                                  if (!prev) return null
                                  const nextSecs = [...prev.sections]
                                  nextSecs[activeSectionIdx].questions[qIdx].correct_answer = val
                                  return { ...prev, sections: nextSecs }
                                })
                              }}
                              className="w-24 px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-border bg-background text-foreground"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          value={q.question_text || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setParsedTest((prev) => {
                              if (!prev) return null
                              const nextSecs = [...prev.sections]
                              nextSecs[activeSectionIdx].questions[qIdx].question_text = val
                              return { ...prev, sections: nextSecs }
                            })
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-border bg-background text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Creating & Saving Test...' : 'Save & Open in Test Builder →'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
              <FileCode className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-xs font-semibold text-foreground">No HTML parsed yet</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                Upload an IELTS HTML file on the left or click "Load Sample IELTS HTML" to test the parser.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HtmlImportClientView
