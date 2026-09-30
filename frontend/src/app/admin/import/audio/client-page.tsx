import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Headphones,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Volume2,
  Play,
  FileText,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react'
import { saveFullTestStructure, createImportRecord } from '@/actions/admin'
import { cn } from '@/lib/utils'

export function AudioImportView() {
  const navigate = useNavigate()
  const [audioUrl, setAudioUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [testTitle, setTestTitle] = useState('Cambridge IELTS 19 — Listening Practice Test 1')
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedTest, setGeneratedTest] = useState<any | null>(null)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)

  // Handle Audio File Upload
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
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
          setAudioUrl(data.fileUrl)
        }
      } else {
        alert('Failed to upload audio file.')
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Load sample dialogue transcript
  const handleLoadSampleTranscript = () => {
    const sample = `
PART 1: ACCOMMODATION ENQUIRY
Agent: Good morning. Welcome to City Living Rentals. How can I help you?
Student: Hi, I'm looking for a shared apartment near the central university campus.
Agent: Sure! Could I have your full name please?
Student: Yes, it's Mark Henderson. That's H-E-N-D-E-R-S-O-N.
Agent: And what is your contact phone number, Mark?
Student: It's 0412 889 321.
Agent: Great. What is your preferred move-in date?
Student: Around the 15th of October.
Agent: And your maximum monthly budget for rent?
Student: I'd prefer not to exceed $650 per month, including water and broadband internet.
Agent: Perfect. We have a modern two-bedroom apartment on Park Avenue with private balcony and bike storage.

PART 2: LOCAL BOTANICAL GARDENS TOUR
Speaker: Good afternoon everyone, and welcome to the Westwood Botanical Conservatory. Before we begin our guided walking tour, I'd like to orient you with the map. If you look straight ahead, that's the Visitor Center where we are standing right now. To the left of the main fountain is the Tropical Palm Greenhouse, which houses over 300 rare orchid varieties. Directly across from the rose garden, on your right-hand side, is the Heritage Tea House where refreshments will be served at 3 PM.
    `.trim()
    setTranscript(sample)
  }

  // Generate IELTS Listening test using Gemini AI
  const handleGenerateQuestions = async () => {
    if (!transcript.trim()) {
      alert('Please enter or paste an audio transcript or spoken dialogue.')
      return
    }

    try {
      setIsGenerating(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

      const res = await fetch('/api/admin/parse-audio-transcript-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          transcript,
          audioUrl,
          title: testTitle,
        }),
      })

      if (!res.ok) {
        const errorJson = await res.json()
        throw new Error(errorJson.error || 'Failed to generate listening test')
      }

      const json = await res.json()
      if (json.parsedTest) {
        setGeneratedTest(json.parsedTest)
        setActiveSectionIdx(0)
      }
    } catch (err: any) {
      alert(`Generation error: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Save to Database
  const handleSaveToDatabase = async () => {
    if (!generatedTest) return

    try {
      setIsSaving(true)

      const formattedQuestions: any[] = []
      generatedTest.sections.forEach((sec: any, sIdx: number) => {
        sec.questions.forEach((q: any) => {
          formattedQuestions.push({
            ...q,
            section_index: sIdx,
          })
        })
      })

      const res = await saveFullTestStructure({
        test: {
          title: generatedTest.title || testTitle,
          skill: 'listening',
          ielts_type: 'academic',
          access_type: 'free',
          difficulty: 'medium',
          time_limit_minutes: 30,
          description: generatedTest.description || 'Generated from Listening Audio & Transcript',
          tags: ['Listening Import', 'AI Generated'],
          status: 'draft',
        },
        sections: generatedTest.sections.map((s: any, idx: number) => ({
          title: s.title || `Part ${idx + 1}`,
          order_number: idx + 1,
          instructions: s.instructions || 'Listen to the audio recording and answer questions.',
          time_limit_minutes: 10,
          passage_html: s.passage_html || `<p>${s.title}</p>`,
          audio_url: s.audio_url || audioUrl,
        })),
        questions: formattedQuestions,
      })

      await createImportRecord({
        source_type: 'audio' as any,
        file_url: audioUrl || 'Audio Test',
        raw_text: transcript.substring(0, 5000),
        raw_json: generatedTest,
      })

      if (res.testId) {
        alert('Listening test created and saved successfully!')
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
      {/* Top Header */}
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
              <Headphones className="w-5 h-5 text-indigo-500" />
              <span>IELTS Listening & Audio Ingestion</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Upload listening audio tracks and use AI speech-to-test ingestion to create authentic IELTS listening sections
            </p>
          </div>
        </div>

        {generatedTest && (
          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save & Open in Builder'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Audio & Transcript Input */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 flex flex-col">
          <h2 className="text-sm font-bold text-foreground">1. Audio File & Dialogue Transcript</h2>

          {/* Test Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Test Title</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          {/* Audio Upload Box */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-500" /> Listening Audio File (MP3 / WAV)
              </span>
              {isUploading && <span className="text-xs text-primary animate-pulse font-semibold">Uploading...</span>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="Upload audio or paste URL (e.g. /uploads/test.mp3 or https://...)"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground font-mono"
              />
              <label className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold cursor-pointer shrink-0">
                Browse
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {audioUrl && (
              <audio controls src={audioUrl} className="w-full h-8 mt-2 rounded-md" />
            )}
          </div>

          {/* Dialogue Transcript */}
          <div className="flex-1 space-y-2 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">
                Audio Transcript / Conversation Dialogue:
              </label>
              <button
                type="button"
                onClick={handleLoadSampleTranscript}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Sample Transcript
              </button>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste dialogue transcript here..."
              className="flex-1 w-full p-3 rounded-xl border border-border bg-background font-mono text-xs text-foreground resize-y focus:ring-2 focus:ring-primary focus:outline-hidden min-h-[200px]"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={!transcript.trim() || isGenerating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-primary text-primary-foreground font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={cn('w-4 h-4', isGenerating && 'animate-spin')} />
            <span>
              {isGenerating ? 'AI Generating IELTS Listening Questions...' : '✨ Generate IELTS Listening Test'}
            </span>
          </button>
        </div>

        {/* Right: Generated Questions Preview */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 flex flex-col">
          <h2 className="text-sm font-bold text-foreground">2. Listening Test Structure Preview</h2>

          {isGenerating ? (
            <div className="flex-1 border border-primary/20 bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Generating IELTS Listening Test</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Creating Form Completion, Multiple Choice, and Note Completion questions mapped to audio sections...
              </p>
            </div>
          ) : generatedTest ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Header metrics */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    Listening Exam
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Generated ({generatedTest.total_questions} Qs)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mt-1">{generatedTest.title}</h3>
              </div>

              {/* Section Tabs */}
              <div className="flex gap-1 border-b border-border pb-2 overflow-x-auto">
                {generatedTest.sections?.map((sec: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSectionIdx(idx)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border',
                      activeSectionIdx === idx
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {sec.title} ({sec.questions?.length || 0} Qs)
                  </button>
                ))}
              </div>

              {/* Active Section Questions */}
              {generatedTest.sections?.[activeSectionIdx] && (
                <div className="flex-1 p-4 rounded-xl border border-border bg-background space-y-3 max-h-80 overflow-y-auto">
                  <h4 className="text-xs font-bold text-foreground">
                    {generatedTest.sections[activeSectionIdx].title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {generatedTest.sections[activeSectionIdx].instructions}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-border">
                    {generatedTest.sections[activeSectionIdx].questions?.map((q: any) => (
                      <div key={q.question_number} className="p-2.5 rounded-lg bg-secondary/30 border border-border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            Q{q.question_number}. ({q.question_type?.replace(/_/g, ' ')})
                          </span>
                          {q.correct_answer && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono text-[10px] font-bold">
                              Key: {q.correct_answer}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px]">{q.question_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save & Open in Test Builder →'}</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Headphones className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-xs font-semibold text-foreground">No listening test generated yet</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                Upload audio and enter transcript dialogue on the left, then click Generate to create IELTS listening questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AudioImportView
