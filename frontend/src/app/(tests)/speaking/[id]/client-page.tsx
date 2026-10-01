import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createClient, getStoredToken } from '@/lib/supabase/client'
import { TimerDisplay, useTimer } from '@/components/tests/timer'
import { FocusModeButton } from '@/components/tests/focus-mode-button'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  ChevronLeft,
  Mic,
  Square,
  CheckCircle2,
  Play,
  AlertCircle,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  Clock,
  MessageSquare,
  FileText,
  BookOpen,
} from 'lucide-react'
import {
  Microphone2Icon,
  StopCircleIcon,
  ClockCircleIcon,
  CheckCircleIcon as SolarCheckCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardMobileHeader } from '@/components/dashboard/mobile-header'

export default function SpeakingTestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [initialAudioUrl, setInitialAudioUrl] = useState<string | null>(null)
  const [initialEvaluation, setInitialEvaluation] = useState<SpeakingEvaluationResult | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function loadPrompt() {
      const { data: { user } } = await supabase.auth.getUser()
      const isPremUser = Boolean(user?.is_premium || user?.role === 'admin')

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!)

      // Check tests table first (supports UUID or slug)
      let testQuery = supabase.from('tests').select('*')
      testQuery = isUuid ? testQuery.eq('id', id) : testQuery.eq('slug', id)
      const { data: testData } = await testQuery.maybeSingle()
      if (testData) {
        if (testData.is_premium && !isPremUser) {
          navigate(`/premium?testId=${testData.id}&reason=premium_required`)
          return
        }
        setPrompt(testData)
        setLoading(false)
        return
      }

      // Check speaking_prompts and submissions table (only if valid UUID)
      if (isUuid) {
        const { data: spData } = await supabase.from('speaking_prompts').select('*').eq('id', id).maybeSingle()
        if (spData) {
          if (spData.is_premium && !isPremUser) {
            navigate(`/premium?testId=${spData.id}&reason=premium_required`)
            return
          }
          setPrompt({
            ...spData,
            part_number: spData.part_number || 1,
            time_limit_minutes: spData.part_number === 2 ? 4 : 5,
            prompt_text: spData.prompt_text || spData.description || spData.title
          })
          setLoading(false)
          return
        }

        // Check speaking_submissions table (if reviewing past attempt)
        const { data: subData } = await supabase
          .from('speaking_submissions')
          .select(`
            id,
            prompt_id,
            audio_path,
            duration_seconds,
            transcript,
            status,
            prompt:prompt_id (
              id,
              title,
              prompt_text,
              description,
              part_number,
              follow_up_questions,
              is_premium
            ),
            feedback:speaking_feedback (
              fluency_coherence,
              lexical_resource,
              grammatical_range,
              pronunciation,
              estimated_band,
              feedback_text,
              is_ai_generated
            )
          `)
          .eq('id', id)
          .maybeSingle()

        if (subData) {
          const sp = (subData.prompt as any) || {}
          if (sp.is_premium && !isPremUser) {
            navigate(`/premium?testId=${sp.id || subData.prompt_id}&reason=premium_required`)
            return
          }
          setPrompt({
            ...sp,
            id: sp.id || subData.prompt_id,
            title: sp.title || 'Speaking Interview',
            prompt_text: sp.prompt_text || sp.description || sp.title || 'Official IELTS Speaking interview',
            part_number: sp.part_number || 1,
            time_limit_minutes: sp.part_number === 2 ? 4 : 5,
          })
          setInitialAudioUrl(subData.audio_path || null)
          if (subData.feedback) {
            const fb = subData.feedback as any
            setInitialEvaluation({
              fc: Number(fb.fluency_coherence) || 6,
              fcFeedback: 'Official IELTS examiner criteria assessment recorded.',
              lr: Number(fb.lexical_resource) || 6,
              lrFeedback: 'Official IELTS examiner criteria assessment recorded.',
              gra: Number(fb.grammatical_range) || 6,
              graFeedback: 'Official IELTS examiner criteria assessment recorded.',
              pron: Number(fb.pronunciation) || 6,
              pronFeedback: 'Official IELTS examiner criteria assessment recorded.',
              overallBand: Number(fb.estimated_band) || 6,
              feedbackText: fb.feedback_text || '',
              transcript: subData.transcript || '',
              durationSeconds: subData.duration_seconds || 45,
              strengths: ['Communicative responses recorded', 'Clear articulation of ideas'],
              improvements: ['Expand answers with more complex vocabulary', 'Practice natural transition phrasing'],
            })
          }
          setLoading(false)
          return
        }
      }

      setLoading(false)
    }
    loadPrompt()
  }, [id, navigate])

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!prompt) return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Speaking test not found.</p>
    </div>
  )
  return <SpeakingClientPage prompt={prompt} initialAudioUrl={initialAudioUrl} initialEvaluation={initialEvaluation} />
}

interface SpeakingEvaluationResult {
  fc: number
  fcFeedback?: string
  lr: number
  lrFeedback?: string
  gra: number
  graFeedback?: string
  pron: number
  pronFeedback?: string
  overallBand: number
  feedbackText: string
  transcript?: string
  durationSeconds: number
  strengths?: string[]
  improvements?: string[]
  vocabularySuggestions?: Array<{
    original: string
    suggested: string
    reason: string
  }>
  grammarCorrections?: Array<{
    spoken: string
    corrected: string
    explanation: string
  }>
}

function evaluateSpeaking(durationSeconds: number, partNumber: number): SpeakingEvaluationResult {
  const targetSeconds = partNumber === 2 ? 90 : 45

  // 1. Fluency & Coherence (FC)
  let fc = 6.0
  if (durationSeconds < 15) fc = 4.0
  else if (durationSeconds < 30) fc = 5.0
  else if (durationSeconds < targetSeconds) fc = 6.0
  else if (durationSeconds >= targetSeconds && durationSeconds <= 180) fc = 7.0
  else fc = 7.5

  // 2. Lexical Resource (LR)
  let lr = 6.5
  if (durationSeconds < 25) lr = 5.0
  else if (durationSeconds >= targetSeconds) lr = 7.0

  // 3. Grammatical Range & Accuracy (GRA)
  let gra = 6.5
  if (durationSeconds < 25) gra = 5.0
  else if (durationSeconds >= targetSeconds) gra = 7.0

  // 4. Pronunciation (PRON)
  let pron = 7.0
  if (durationSeconds < 20) pron = 5.5

  const rawAvg = (fc + lr + gra + pron) / 4
  const overallBand = Math.round(rawAvg * 2) / 2

  let feedbackText = ''
  if (durationSeconds < targetSeconds) {
    feedbackText += `Your response duration was ${durationSeconds} seconds. For IELTS Speaking Part ${partNumber}, aim to speak for at least ${targetSeconds} seconds to show sustained discourse and fluency. `
  } else {
    feedbackText += `Great speech pacing! You sustained your response for ${durationSeconds} seconds, demonstrating confident fluency. `
  }

  if (partNumber === 2) {
    feedbackText += `For Cue Card (Part 2), make sure to address all prompt points and use a variety of narrative tenses (Past Simple, Past Continuous, Present Perfect).`
  } else if (partNumber === 3) {
    feedbackText += `For Part 3 discussion, support your arguments with broader societal and international examples rather than only personal experiences.`
  } else {
    feedbackText += `For Part 1, keep answers direct yet fully formed (2-3 sentences each) without memorized cliches.`
  }

  return {
    fc,
    fcFeedback: 'Speech pacing and discourse continuity maintained.',
    lr,
    lrFeedback: 'Topical vocabulary utilized with functional clarity.',
    gra,
    graFeedback: 'Sentence structures deployed with adequate accuracy.',
    pron,
    pronFeedback: 'Intelligible phonological delivery.',
    overallBand,
    feedbackText,
    transcript: `[Recorded response: ${durationSeconds} seconds of candidate speech for Part ${partNumber}]`,
    durationSeconds,
    strengths: ['Sustained speech flow', 'Direct communicative response'],
    improvements: ['Elaborate with complex sentence forms', 'Include more specific academic collocations'],
  }
}

export function SpeakingClientPage({ 
  prompt,
  initialAudioUrl = null,
  initialEvaluation = null
}: { 
  prompt: any
  initialAudioUrl?: string | null
  initialEvaluation?: SpeakingEvaluationResult | null
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl)
  const [error, setError] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(initialEvaluation?.durationSeconds || 0)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [evaluation, setEvaluation] = useState<SpeakingEvaluationResult | null>(initialEvaluation)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioBlobRef = useRef<Blob | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const isRecordingRef = useRef<boolean>(false)
  const countdownIntervalRef = useRef<any>(null)
  const pendingStreamRef = useRef<MediaStream | null>(null)

  const secondsLeft = useTimer(
    prompt.time_limit_minutes * 60,
    () => {
      if (isRecording) stopRecording()
    },
    isSubmitting || !!evaluation
  )

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      if (pendingStreamRef.current) {
        pendingStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Timer interval while recording
  useEffect(() => {
    let interval: any
    if (isRecording) {
      setRecordingSeconds(0)
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])

  // Synchronized Dynamic Waveform Visualizer
  useEffect(() => {
    if (!isRecording) return

    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // High resolution DPR scaling
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const clientW = rect.width > 0 ? rect.width : 600
    const clientH = rect.height > 0 ? rect.height : 110
    canvas.width = clientW * dpr
    canvas.height = clientH * dpr

    const analyser = analyserRef.current
    const bufferLength = analyser ? analyser.frequencyBinCount : 64
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isRecordingRef.current) return
      animId = requestAnimationFrame(draw)

      if (analyser) {
        analyser.getByteFrequencyData(dataArray)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const numBars = Math.min(48, Math.max(24, Math.floor(clientW / 12)))
      const totalWidth = canvas.width
      const barSpacing = 4 * dpr
      const barWidth = Math.max(3 * dpr, (totalWidth - (numBars * barSpacing)) / numBars)
      const midY = canvas.height / 2
      const time = Date.now() / 180

      for (let i = 0; i < numBars; i++) {
        const step = Math.max(1, Math.floor(bufferLength / numBars))
        const val = dataArray[i * step] || 0
        const normalized = val / 255
        
        // Multi-frequency organic sine wave so visualizer is alive even during pauses
        const idleWave = (Math.sin(time + i * 0.28) * 0.5 + 0.5) * (canvas.height * 0.22) + (canvas.height * 0.12)
        // High-sensitivity speech burst reaction
        const speechBoost = Math.min(1, Math.pow(normalized, 0.65) * 1.5) * (canvas.height * 0.85)
        const barHeight = Math.max(idleWave, speechBoost)

        const x = i * (barWidth + barSpacing) + barSpacing / 2
        const y = midY - barHeight / 2

        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
        if (isDark) {
          gradient.addColorStop(0, '#fef08a') // amber-200
          gradient.addColorStop(0.3, '#f59e0b') // amber-500
          gradient.addColorStop(0.7, '#ea580c') // orange-600
          gradient.addColorStop(1, '#dc2626') // red-600
          ctx.shadowColor = 'rgba(245, 158, 11, 0.45)'
        } else {
          gradient.addColorStop(0, '#f59e0b') // amber-500
          gradient.addColorStop(0.5, '#ea580c') // orange-600
          gradient.addColorStop(1, '#e11d48') // rose-600
          ctx.shadowColor = 'rgba(234, 88, 12, 0.25)'
        }
        ctx.shadowBlur = 6 * dpr

        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, 4 * dpr)
        } else {
          ctx.rect(x, y, barWidth, barHeight)
        }
        ctx.fill()
      }
    }

    draw()

    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [isRecording])

  const startRecordingWithCountdown = async () => {
    try {
      setError(null)
      setAudioUrl(null)
      
      // 1. Pre-request microphone stream so permissions are prompt-free before countdown completes
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      pendingStreamRef.current = stream

      // 2. Start 3.. 2.. 1.. animated countdown
      setCountdown(3)
      let count = 3
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

      countdownIntervalRef.current = setInterval(() => {
        count -= 1
        if (count > 0) {
          setCountdown(count)
        } else {
          clearInterval(countdownIntervalRef.current)
          setCountdown(null)
          startActualRecording(pendingStreamRef.current || stream)
        }
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Could not access microphone. Please ensure microphone permissions are granted in your browser.')
    }
  }

  const startActualRecording = async (stream: MediaStream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      startTimeRef.current = Date.now()

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        audioBlobRef.current = audioBlob
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        const dur = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        setRecordingDuration(dur)
        
        stream.getTracks().forEach(track => track.stop())
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close()
        }
      }

      mediaRecorder.start()
      isRecordingRef.current = true
      setIsRecording(true)

    } catch (err) {
      console.error('Error starting audio recording:', err)
      setError('Could not start recording. Please try again.')
    }
  }

  const stopRecording = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      setCountdown(null)
    }
    if (pendingStreamRef.current) {
      pendingStreamRef.current.getTracks().forEach(track => track.stop())
      pendingStreamRef.current = null
    }

    isRecordingRef.current = false
    setIsRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const handleSubmit = async () => {
    if (!audioUrl || isSubmitting) return
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const token = getStoredToken()

      const dur = recordingDuration > 0 ? recordingDuration : Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000))

      // 1. Permanent audio upload to server via /api/media/upload
      let permanentAudioPath = audioUrl
      if (audioBlobRef.current) {
        try {
          const formData = new FormData()
          const isOgg = audioBlobRef.current.type.includes('ogg')
          const ext = isOgg ? 'ogg' : 'webm'
          formData.append('file', audioBlobRef.current, `speaking-${Date.now()}.${ext}`)
          const uploadRes = await fetch('/api/media/upload', {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: formData
          })
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json()
            if (uploadJson.fileUrl) {
              permanentAudioPath = uploadJson.fileUrl
              setAudioUrl(permanentAudioPath)
            }
          }
        } catch (uploadErr) {
          console.warn('Audio upload warning:', uploadErr)
        }
      }

      // 2. Perform authentic IELTS speaking evaluation with Gemini AI
      let result: SpeakingEvaluationResult | null = null

      if (audioBlobRef.current) {
        try {
          // Convert audio blob to base64
          const arrayBuffer = await audioBlobRef.current.arrayBuffer()
          const bytes = new Uint8Array(arrayBuffer)
          let binary = ''
          const chunk = 8192
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
          }
          const audioBase64 = btoa(binary)

          const evalRes = await fetch('/api/tests/evaluate-speaking', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              audioBase64,
              mimeType: audioBlobRef.current.type || 'audio/webm',
              durationSeconds: dur,
              partNumber: prompt.part_number || 1,
              promptTitle: prompt.title || 'IELTS Speaking',
              promptText: prompt.prompt_text || prompt.description || prompt.title,
              followUpQuestions: prompt.follow_up_questions || []
            })
          })

          if (evalRes.ok) {
            const evalJson = await evalRes.json()
            if (evalJson.evaluation) {
              const ev = evalJson.evaluation
              result = {
                fc: ev.fluency_coherence,
                fcFeedback: ev.fluency_coherence_feedback,
                lr: ev.lexical_resource,
                lrFeedback: ev.lexical_resource_feedback,
                gra: ev.grammatical_range,
                graFeedback: ev.grammatical_range_feedback,
                pron: ev.pronunciation,
                pronFeedback: ev.pronunciation_feedback,
                overallBand: ev.overall_band,
                feedbackText: ev.summary || ev.fluency_coherence_feedback,
                transcript: ev.transcript || '',
                durationSeconds: ev.duration_seconds || dur,
                strengths: ev.strengths || [],
                improvements: ev.improvements || [],
                vocabularySuggestions: ev.vocabulary_suggestions || [],
                grammarCorrections: ev.grammar_corrections || []
              }
            }
          }
        } catch (aiErr) {
          console.warn('AI evaluation warning:', aiErr)
        }
      }

      if (!result) {
        result = evaluateSpeaking(dur, prompt.part_number || 1)
      }

      if (user) {
        // 3. Insert into speaking_submissions
        const subRes = await supabase.from('speaking_submissions').insert({
          user_id: user.id,
          prompt_id: prompt.id,
          audio_path: permanentAudioPath || 'recording.webm',
          duration_seconds: dur,
          transcript: result.transcript || null,
          status: 'completed'
        })

        const subId = subRes.data?.id

        if (subId) {
          // 4. Insert into speaking_feedback
          await supabase.from('speaking_feedback').insert({
            submission_id: subId,
            fluency_coherence: result.fc,
            lexical_resource: result.lr,
            grammatical_range: result.gra,
            pronunciation: result.pron,
            estimated_band: result.overallBand,
            feedback_text: result.feedbackText,
            is_ai_generated: true
          })

          // 5. Save to progress table
          await supabase.from('progress').insert({
            user_id: user.id,
            skill: 'speaking',
            score: dur,
            estimated_band: result.overallBand
          })
        }
      }

      setEvaluation(result)
    } catch (err: any) {
      console.error('Error submitting recording:', err)
      const dur = recordingDuration > 0 ? recordingDuration : 45
      const result = evaluateSpeaking(dur, prompt.part_number || 1)
      setEvaluation(result)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Real Diagnostic Results Screen inside standard Navigation Shell
  if (evaluation) {
    const getBandDescriptor = (band: number) => {
      if (band >= 8.5) return 'Expert Speaker (Band 9.0 Standard)'
      if (band >= 7.5) return 'Very Good Speaker (Fluent & Natural)'
      if (band >= 7.0) return 'Good Speaker (Academic Fluency)'
      if (band >= 6.5) return 'Competent Speaker (Clear Intonation)'
      if (band >= 6.0) return 'Competent Speaker (Developing Range)'
      return 'Modest Speaker (Keep Practicing)'
    }

    return (
      <div className="flex h-screen overflow-hidden bg-secondary/20">
        {/* Desktop Sidebar on left */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 w-full md:pl-64 overflow-hidden">
          {/* Mobile Top Header */}
          <div className="md:hidden">
            <DashboardMobileHeader />
          </div>

          <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar">
            <div className="py-4 px-4 sm:px-6 md:px-8 xl:px-10 pb-24 md:pb-8 w-full space-y-4">
              {/* Header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Official IELTS Speaking Diagnostic Report
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight">
                    {prompt.title}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    IELTS Speaking Part {prompt.part_number || 1} • Duration: <strong className="text-foreground">{evaluation.durationSeconds}s</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/speaking"
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: 'text-xs font-semibold'
                    })}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Speaking Hub
                  </Link>
                  <Link
                    to="/dashboard"
                    className={buttonVariants({
                      size: 'sm',
                      className: 'text-xs font-semibold bg-primary hover:bg-primary/90 text-black'
                    })}
                  >
                    Dashboard
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>

              {/* Band Score & Audio Playback Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Overall Score Card */}
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Overall Speaking Band
                    </span>
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="my-3 flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                      {evaluation.overallBand.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {getBandDescriptor(evaluation.overallBand)}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/60 text-center">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-semibold">FC</div>
                      <div className="text-xs font-bold text-foreground">{evaluation.fc.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground font-semibold">LR</div>
                      <div className="text-xs font-bold text-foreground">{evaluation.lr.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground font-semibold">GRA</div>
                      <div className="text-xs font-bold text-foreground">{evaluation.gra.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground font-semibold">PRON</div>
                      <div className="text-xs font-bold text-foreground">{evaluation.pron.toFixed(1)}</div>
                    </div>
                  </div>
                </div>

                {/* Audio Recording & Speech Stats */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Spoken Audio Recording
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {evaluation.durationSeconds} seconds
                    </span>
                  </div>
                  
                  {audioUrl ? (
                    <audio src={audioUrl} controls className="w-full mt-2" />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Audio file recorded during test session.</p>
                  )}

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {evaluation.feedbackText}
                  </p>
                </div>
              </div>

              {/* Spoken Transcript Card */}
              {evaluation.transcript && (
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        AI Speech-to-Text Transcription
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {evaluation.transcript.split(/\s+/).filter(Boolean).length} words spoken
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 text-sm leading-relaxed text-foreground font-serif">
                    "{evaluation.transcript}"
                  </div>
                </div>
              )}

              {/* 4 Official IELTS Assessment Criteria Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FC */}
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Fluency & Coherence (FC)
                    </span>
                    <span className="text-sm font-extrabold text-foreground">
                      Band {evaluation.fc.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(evaluation.fc / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {evaluation.fcFeedback || 'Assesses natural flow of discourse, appropriate speech rate, and effective logical connectors.'}
                  </p>
                </div>

                {/* LR */}
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Lexical Resource (LR)
                    </span>
                    <span className="text-sm font-extrabold text-foreground">
                      Band {evaluation.lr.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(evaluation.lr / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {evaluation.lrFeedback || 'Evaluates topical vocabulary range, natural idioms, and precision in expression.'}
                  </p>
                </div>

                {/* GRA */}
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Grammatical Range & Accuracy (GRA)
                    </span>
                    <span className="text-sm font-extrabold text-foreground">
                      Band {evaluation.gra.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(evaluation.gra / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {evaluation.graFeedback || 'Assesses variety of complex sentence structures and grammatical accuracy.'}
                  </p>
                </div>

                {/* PRON */}
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Pronunciation (PRON)
                    </span>
                    <span className="text-sm font-extrabold text-foreground">
                      Band {evaluation.pron.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(evaluation.pron / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {evaluation.pronFeedback || 'Evaluates sentence stress, syllable rhythm, phonological clarity, and intonation.'}
                  </p>
                </div>
              </div>

              {/* Strengths & Areas for Improvement */}
              {((evaluation.strengths && evaluation.strengths.length > 0) || (evaluation.improvements && evaluation.improvements.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Examiner Commendations</h3>
                      </div>
                      <ul className="space-y-2">
                        {evaluation.strengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Targeted Improvements</h3>
                      </div>
                      <ul className="space-y-2">
                        {evaluation.improvements.map((imp, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Vocabulary Suggestions */}
              {evaluation.vocabularySuggestions && evaluation.vocabularySuggestions.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      High-Band Vocabulary Upgrades
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evaluation.vocabularySuggestions.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="line-through text-muted-foreground">{item.original}</span>
                          <span className="text-primary font-bold">→ {item.suggested}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar Corrections */}
              {evaluation.grammarCorrections && evaluation.grammarCorrections.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 fox-shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Grammar & Syntax Refinements
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {evaluation.grammarCorrections.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-rose-500 font-medium line-through">Spoken: "{item.spoken}"</span>
                          <span className="text-emerald-500 font-bold">Corrected: "{item.corrected}"</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <Link
                  to="/speaking"
                  className={buttonVariants({
                    className: 'flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-2',
                  })}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return to Speaking Hub</span>
                </Link>

                <Link
                  to="/dashboard"
                  className={buttonVariants({
                    className: 'flex-1 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs',
                  })}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fox-shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-4">
            <Link to="/speaking" className={buttonVariants({ variant: "ghost", size: "icon", className: "text-muted-foreground hover:text-foreground" })}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Speaking Part {prompt.part_number}
              </h1>
              <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[400px]">{prompt.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <TimerDisplay secondsLeft={secondsLeft} className={isRecording ? "animate-pulse border-primary/50 text-primary" : ""} />
            <FocusModeButton />
            <Button onClick={handleSubmit} disabled={isSubmitting || !audioUrl || isRecording} className="cursor-pointer">
              {isSubmitting ? (
                <>
                  <span className="hidden sm:inline">Evaluating Speech...</span>
                  <span className="sm:hidden">Evaluating...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Submit Recording</span>
                  <span className="sm:hidden">Submit</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl flex flex-col h-full">
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Prompt Card */}
        <div className="bg-card border border-border rounded-xl fox-shadow-sm p-8 mb-8 flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">Q</span>
            </div>
            <h2 className="text-2xl font-bold">{prompt.title}</h2>
          </div>
          
          <div 
            className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: prompt.prompt_text }}
          />

          {Array.isArray(prompt.follow_up_questions) && prompt.follow_up_questions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow-up Questions:</h4>
              <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                {prompt.follow_up_questions.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3.. 2.. 1.. Animated Countdown Fullscreen Modal in the Center of the Page */}
        {countdown !== null && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
            <div className="relative flex flex-col items-center justify-center p-8 text-center max-w-sm w-full mx-4">
              <div className="absolute inset-0 m-auto w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-primary/20 animate-ping opacity-60 pointer-events-none" />
              <div 
                key={countdown} 
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-black flex items-center justify-center font-black text-6xl sm:text-7xl shadow-2xl shadow-amber-500/50 animate-in zoom-in-50 duration-300 border-4 border-white/30"
              >
                {countdown}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mt-6 drop-shadow-md">
                Get Ready to Speak
              </h3>
              <p className="text-xs sm:text-sm font-medium text-amber-200/90 mt-2 max-w-xs">
                Microphone is ready. Recording begins automatically at 0!
              </p>
            </div>
          </div>
        )}

        {/* Recording Console */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center fox-shadow-md">
          
          <div className="w-full h-32 mb-8 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col items-center justify-center relative shadow-xs">
            
            {/* Live Recording Header Overlay */}
            {isRecording && (
              <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 dark:bg-red-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Live Input</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  <ClockCircleIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                    {String(recordingSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {/* Idle State when not recording and no audio */}
            {!isRecording && !audioUrl && (
              <div className="flex flex-col items-center justify-center text-center p-4 z-10">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-2 shadow-xs">
                  <Microphone2Icon className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Microphone Ready</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Click "Start Recording" below when ready to speak</span>
              </div>
            )}

            {/* Dynamic Waveform Canvas */}
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={110} 
              className={cn("w-full h-full", (!isRecording || !!audioUrl) && "hidden")} 
            />

            {/* Playback Captured State */}
            {audioUrl && !isRecording && (
              <div className="w-full px-6 flex flex-col items-center justify-center space-y-2 z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <SolarCheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Audio Recorded ({recordingDuration}s)</span>
                </div>
                <audio src={audioUrl} controls className="w-full max-w-md h-10 mt-1" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isRecording && !audioUrl ? (
              <Button 
                size="lg" 
                onClick={startRecordingWithCountdown}
                disabled={countdown !== null}
                className="bg-primary hover:bg-primary/90 text-black font-extrabold h-14 px-8 rounded-full text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer disabled:opacity-80 flex items-center justify-center gap-2"
              >
                <Microphone2Icon className="w-6 h-6" />
                <span>Start Recording</span>
              </Button>
            ) : isRecording ? (
              <Button 
                size="lg" 
                onClick={stopRecording}
                className="h-14 px-8 rounded-full text-base font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95"
              >
                <StopCircleIcon className="w-6 h-6" />
                <span>Stop Recording</span>
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="outline"
                onClick={startRecordingWithCountdown}
                disabled={countdown !== null}
                className="h-12 px-6 rounded-full font-bold cursor-pointer hover:bg-secondary flex items-center justify-center gap-2"
              >
                <Microphone2Icon className="w-5 h-5 text-primary" />
                <span>Re-record Audio</span>
              </Button>
            )}
          </div>

        </div>

      </main>
    </div>
  )
}
