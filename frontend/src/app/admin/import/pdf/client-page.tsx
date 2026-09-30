import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Edit,
  Save,
  Clock,
  Layers,
  HelpCircle,
  FileCheck,
  Plus,
  Trash2,
  FileCode,
  BookOpen,
} from 'lucide-react'
import { QuestionRenderer } from '@/components/tests/question-renderer'
import { saveFullTestStructure, createImportRecord } from '@/actions/admin'
import { cn } from '@/lib/utils'

export function PdfImportView() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [importMode, setImportMode] = useState<'pdf' | 'text'>('pdf')
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'upload' | 'extracting' | 'review'>('upload')
  const [extractedData, setExtractedData] = useState<any | null>(null)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const [isEditingPassage, setIsEditingPassage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Handle Drag & Drop / File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  // Load sample Cambridge IELTS text
  const handleLoadSampleText = () => {
    setImportMode('text')
    const sample = `
CAMBRIDGE IELTS 19 — ACADEMIC READING TEST 1
Reading Passage 1: The Roman Amphitheatre of Arles

Built in 90 AD by the Roman Empire, the amphitheatre at Arles in southern France could hold over 20,000 spectators and was constructed to provide entertainment in the form of chariot races and gladiatorial battles.

Today, it draws large crowds for bullfighting during the Feria d'Arles, as well as plays and concerts in the summer. Measuring 136 metres in length and 107 metres in width, it is slightly larger than the nearby arena at Nimes and ranks among the 20 largest Roman amphitheatres still in existence.

The towers jutting out at the top are medieval additions, converted into a fortified town with over 200 houses during the 6th to 18th centuries before restoration began in the 1830s under writer Prosper Merimee.

Questions 1–4
Do the following statements agree with the information given in Reading Passage 1?
Write TRUE, FALSE or NOT GIVEN.

1. The amphitheatre at Arles was originally constructed during the first century AD.
2. The amphitheatre at Nimes can accommodate more people than the Arles amphitheatre.
3. Local architects in Arles opposed Merimee's restoration project in the 1830s.
4. The structure was converted into residential quarters during the medieval period.

Questions 5–7
Choose the correct letter, A, B, C or D.

5. During the 6th century, the Arles amphitheatre was primarily utilized as:
A. A military garrison for barbarian invaders
B. A fortified town containing over 200 residential buildings
C. An administrative center for local magistrates
D. A granary storage complex

6. What modern event is hosted in the amphitheatre today?
A. Roman chariot races
B. Bullfighting during the Feria d'Arles
C. Olympic sports tournaments
D. International film festival

7. The restoration initiated under Prosper Merimee primarily focused on:
A. Demolishing modern houses built inside the arena
B. Re-establishing gladiatorial tournaments
C. Expanding spectator capacity to 30,000
D. Constructing new towers atop the perimeter

Answer Key:
1. TRUE
2. FALSE
3. NOT GIVEN
4. TRUE
5. B
6. B
7. A
    `.trim()
    setTextInput(sample)
  }

  // Run the Real AI Parser
  const handleStartExtraction = async () => {
    if (importMode === 'pdf' && !file) {
      alert('Please select an IELTS PDF file first.')
      return
    }
    if (importMode === 'text' && !textInput.trim()) {
      alert('Please enter or paste IELTS test text first.')
      return
    }

    setIsProcessing(true)
    setStep('extracting')
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

    try {
      let endpoint = '/api/admin/parse-pdf-ai'
      let payload: any = {}

      if (importMode === 'pdf' && file) {
        // Convert file to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (error) => reject(error)
        })

        payload = {
          pdfBase64: base64,
          fileName: file.name,
        }
      } else {
        endpoint = '/api/admin/parse-text-ai'
        payload = {
          text: textInput,
          fileName: 'Pasted IELTS Test',
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorJson = await res.json()
        throw new Error(errorJson.error || 'AI parsing failed')
      }

      const json = await res.json()
      if (!json.parsedTest) {
        throw new Error('No valid test structure returned by AI parser')
      }

      setExtractedData(json.parsedTest)
      setSelectedQuestionIndex(0)
      setActiveSectionIdx(0)

      // Save import audit record
      await createImportRecord({
        source_type: 'pdf',
        file_url: file?.name || 'Text / OCR Content',
        raw_text: importMode === 'text' ? textInput : `PDF File: ${file?.name}`,
        raw_json: json.parsedTest,
      })

      setStep('review')
    } catch (err: any) {
      alert(`Parsing failed: ${err.message}`)
      setStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  // Save parsed test to database
  const handleSaveDraft = async () => {
    if (!extractedData) return

    try {
      setIsSaving(true)

      // Flatten questions with their section_index
      const formattedQuestions: any[] = []
      extractedData.sections.forEach((sec: any, sIdx: number) => {
        sec.questions.forEach((q: any) => {
          formattedQuestions.push({
            ...q,
            section_index: sIdx,
          })
        })
      })

      const timeLimit = extractedData.time_limit_minutes || (extractedData.sections.length === 1 ? 20 : 60)

      const res = await saveFullTestStructure({
        test: {
          title: extractedData.title || 'Imported IELTS Exam',
          description: extractedData.description || `Imported from PDF: ${file?.name || 'Document'} using Gemini AI.`,
          skill: extractedData.skill || 'reading',
          ielts_type: extractedData.ielts_type || 'academic',
          access_type: 'free',
          difficulty: extractedData.difficulty || 'medium',
          time_limit_minutes: timeLimit,
          tags: ['PDF Import', 'Official Practice'],
          status: 'draft',
        },
        sections: extractedData.sections.map((s: any, idx: number) => ({
          title: s.title || `Section ${idx + 1}`,
          order_number: idx + 1,
          instructions: s.instructions || 'Answer the questions according to the passage.',
          time_limit_minutes: s.time_limit_minutes || 20,
          passage_html: s.passage_html || `<p>Passage for Section ${idx + 1}</p>`,
          audio_url: s.audio_url || '',
        })),
        questions: formattedQuestions,
      })

      if (res.testId) {
        alert(`Test draft and ${formattedQuestions.length} questions saved successfully!`)
        navigate(`/admin/tests/${res.testId}/edit`)
      }
    } catch (err: any) {
      alert(`Error saving test: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 w-full min-w-0">
      {/* Header */}
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
              <FileText className="w-5 h-5 text-red-500" />
              <span>IELTS PDF & Document Ingestion</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Google Gemini AI Multimodal Parser • Extracts authentic Cambridge PDF passages, questions, and keys
            </p>
          </div>
        </div>

        {step === 'review' && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase flex items-center gap-1.5 border border-primary/30">
              <Sparkles className="w-3.5 h-3.5" />
              AI Extracted • Ready for Review
            </span>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Open in Builder'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Step 1: Upload or Paste */}
      {step === 'upload' && (
        <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-card border border-border rounded-3xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Import IELTS Exam Document</h2>
                <p className="text-xs text-muted-foreground">
                  Upload an authentic Cambridge PDF exam or paste OCR text content directly
                </p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex p-1 bg-secondary rounded-xl border border-border self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setImportMode('pdf')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  importMode === 'pdf' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => setImportMode('text')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  importMode === 'text' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Paste Text / OCR
              </button>
            </div>
          </div>

          {importMode === 'pdf' ? (
            <div className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-5 sm:p-8 transition-colors bg-secondary/20 cursor-pointer relative text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-bold text-foreground">
                {file ? file.name : 'Click to select or drag & drop IELTS PDF'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Supports authentic Cambridge IELTS 1–19, IDP, and British Council PDF documents (up to 30MB)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  Paste Exam Passage, Questions, and Answer Keys:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleText}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Load Sample Exam Text
                </button>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Reading Passage 1: ... Questions 1–13: ... Answer Key: 1. TRUE ..."
                rows={12}
                className="w-full p-4 rounded-xl font-mono text-xs bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden resize-y leading-relaxed"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-[11px] text-muted-foreground">
              Powered by Google Gemini 3.1 & 3.8 Flash • High Accuracy Passage & Question Parsing
            </span>
            <button
              type="button"
              onClick={handleStartExtraction}
              disabled={importMode === 'pdf' ? !file : !textInput.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run Gemini AI Exam Parser</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Processing animation */}
      {step === 'extracting' && (
        <div className="max-w-lg mx-auto p-12 bg-card border border-border rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Gemini AI is Parsing IELTS Document...</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            1. Extracting reading passages and section headers.<br />
            2. Identifying multiple choice, TFNG, matching headings, and completion questions.<br />
            3. Linking answer keys and accepted variants.
          </p>
        </div>
      )}

      {/* Step 3: Interactive Review */}
      {step === 'review' && extractedData && (
        <div className="space-y-6">
          {/* Top Test Settings Card */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Test Title</label>
                <input
                  type="text"
                  value={extractedData.title || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Skill</label>
                <select
                  value={extractedData.skill || 'reading'}
                  onChange={(e) => setExtractedData({ ...extractedData, skill: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                  <option value="writing">Writing</option>
                  <option value="speaking">Speaking</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">IELTS Type</label>
                <select
                  value={extractedData.ielts_type || 'academic'}
                  onChange={(e) => setExtractedData({ ...extractedData, ielts_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="academic">Academic</option>
                  <option value="general_training">General Training</option>
                </select>
              </div>
            </div>

            {/* Metrics overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Passages / Sections</span>
                <p className="text-lg font-bold text-foreground mt-0.5">{extractedData.sections.length}</p>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total Questions</span>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {extractedData.sections.reduce((acc: number, s: any) => acc + (s.questions?.length || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Parser Engine</span>
                <p className="text-xs font-bold text-primary mt-1">
                  Gemini AI ({extractedData.model_used || 'Flash'})
                </p>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Status</span>
                <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Builder
                </p>
              </div>
            </div>
          </div>

          {/* Section Selection Tabs */}
          <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
            {extractedData.sections.map((sec: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveSectionIdx(idx)
                  setSelectedQuestionIndex(0)
                }}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border',
                  activeSectionIdx === idx
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:bg-secondary'
                )}
              >
                {sec.title || `Section ${idx + 1}`} ({sec.questions?.length || 0} Qs)
              </button>
            ))}
          </div>

          {/* Active Section Content & Questions */}
          {extractedData.sections[activeSectionIdx] && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Passage Content (5 cols) */}
              <div className="lg:col-span-5 p-5 bg-card border border-border rounded-2xl shadow-xs space-y-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {extractedData.sections[activeSectionIdx].title} Passage
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingPassage(!isEditingPassage)}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {isEditingPassage ? 'Preview' : 'Edit Passage'}
                  </button>
                </div>

                {isEditingPassage ? (
                  <textarea
                    value={extractedData.sections[activeSectionIdx].passage_html || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setExtractedData((prev: any) => {
                        const nextSecs = [...prev.sections]
                        nextSecs[activeSectionIdx] = { ...nextSecs[activeSectionIdx], passage_html: val }
                        return { ...prev, sections: nextSecs }
                      })
                    }}
                    rows={16}
                    className="w-full flex-1 p-3 rounded-xl font-mono text-xs bg-background border border-border text-foreground focus:outline-hidden resize-y"
                  />
                ) : (
                  <div
                    className="flex-1 p-4 rounded-xl bg-background border border-border text-xs leading-relaxed max-h-[500px] overflow-y-auto prose dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: extractedData.sections[activeSectionIdx].passage_html || '<p>No passage content</p>',
                    }}
                  />
                )}
              </div>

              {/* Middle Column: Questions List (3 cols) */}
              <div className="lg:col-span-3 p-4 bg-card border border-border rounded-2xl shadow-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Questions ({extractedData.sections[activeSectionIdx].questions?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentQs = extractedData.sections[activeSectionIdx].questions || []
                      const newQNum = currentQs.length > 0 ? Math.max(...currentQs.map((q: any) => q.question_number)) + 1 : 1
                      const newQ = {
                        question_number: newQNum,
                        question_type: 'multiple_choice',
                        instruction: 'Choose the correct letter, A, B, C or D.',
                        question_text: 'New question statement',
                        options: [
                          { option_key: 'A', option_text: 'Option A', is_correct: true },
                          { option_key: 'B', option_text: 'Option B', is_correct: false },
                        ],
                        correct_answer: 'A',
                        points: 1,
                      }
                      setExtractedData((prev: any) => {
                        const nextSecs = [...prev.sections]
                        nextSecs[activeSectionIdx] = {
                          ...nextSecs[activeSectionIdx],
                          questions: [...currentQs, newQ],
                        }
                        return { ...prev, sections: nextSecs }
                      })
                      setSelectedQuestionIndex(currentQs.length)
                    }}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Q
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {extractedData.sections[activeSectionIdx].questions?.map((q: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={cn(
                        'w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer',
                        selectedQuestionIndex === idx
                          ? 'bg-primary/10 border-primary text-foreground shadow-xs font-bold'
                          : 'bg-background border-border hover:bg-secondary text-muted-foreground'
                      )}
                    >
                      <div className="truncate pr-2">
                        <span className="text-primary mr-1.5">Q{q.question_number}.</span>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          ({q.question_type?.replace(/_/g, ' ')})
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{q.question_text}</p>
                      </div>
                      {q.correct_answer && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-mono shrink-0">
                          {q.correct_answer}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Active Question Editor & Live Preview (4 cols) */}
              <div className="lg:col-span-4 p-5 bg-card border border-border rounded-2xl shadow-xs space-y-4">
                {extractedData.sections[activeSectionIdx].questions?.[selectedQuestionIndex] ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-xs font-bold text-foreground">
                        Edit Question #{extractedData.sections[activeSectionIdx].questions[selectedQuestionIndex].question_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setExtractedData((prev: any) => {
                            const nextSecs = [...prev.sections]
                            const currentQs = [...nextSecs[activeSectionIdx].questions]
                            currentQs.splice(selectedQuestionIndex, 1)
                            nextSecs[activeSectionIdx] = { ...nextSecs[activeSectionIdx], questions: currentQs }
                            return { ...prev, sections: nextSecs }
                          })
                          setSelectedQuestionIndex(0)
                        }}
                        className="text-xs text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    {/* Question Type & Correct Answer */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Type</label>
                        <select
                          value={extractedData.sections[activeSectionIdx].questions[selectedQuestionIndex].question_type}
                          onChange={(e) => {
                            const val = e.target.value
                            setExtractedData((prev: any) => {
                              const nextSecs = [...prev.sections]
                              nextSecs[activeSectionIdx].questions[selectedQuestionIndex].question_type = val
                              return { ...prev, sections: nextSecs }
                            })
                          }}
                          className="w-full p-2 text-xs rounded-lg border border-border bg-background text-foreground"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false_not_given">True / False / Not Given</option>
                          <option value="yes_no_not_given">Yes / No / Not Given</option>
                          <option value="sentence_completion">Sentence Completion</option>
                          <option value="summary_completion">Summary Completion</option>
                          <option value="matching_headings">Matching Headings</option>
                          <option value="matching_information">Matching Information</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Answer Key</label>
                        <input
                          type="text"
                          value={extractedData.sections[activeSectionIdx].questions[selectedQuestionIndex].correct_answer || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setExtractedData((prev: any) => {
                              const nextSecs = [...prev.sections]
                              nextSecs[activeSectionIdx].questions[selectedQuestionIndex].correct_answer = val
                              return { ...prev, sections: nextSecs }
                            })
                          }}
                          className="w-full p-2 text-xs font-mono font-bold rounded-lg border border-border bg-background text-foreground"
                        />
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Question Statement</label>
                      <textarea
                        value={extractedData.sections[activeSectionIdx].questions[selectedQuestionIndex].question_text || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setExtractedData((prev: any) => {
                            const nextSecs = [...prev.sections]
                            nextSecs[activeSectionIdx].questions[selectedQuestionIndex].question_text = val
                            return { ...prev, sections: nextSecs }
                          })
                        }}
                        rows={3}
                        className="w-full p-2.5 text-xs rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>

                    {/* Options if Multiple Choice */}
                    {extractedData.sections[activeSectionIdx].questions[selectedQuestionIndex].options && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block">
                          Multiple Choice Options
                        </label>
                        {extractedData.sections[activeSectionIdx].questions[selectedQuestionIndex].options.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <span className="w-5 text-xs font-bold text-muted-foreground">{opt.option_key}.</span>
                            <input
                              type="text"
                              value={opt.option_text || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setExtractedData((prev: any) => {
                                  const nextSecs = [...prev.sections]
                                  nextSecs[activeSectionIdx].questions[selectedQuestionIndex].options[oIdx].option_text = val
                                  return { ...prev, sections: nextSecs }
                                })
                              }}
                              className="flex-1 p-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    Select a question on the left to edit
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-secondary cursor-pointer"
            >
              Cancel / Re-upload
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Test...' : 'Approve & Save to Database →'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PdfImportView
