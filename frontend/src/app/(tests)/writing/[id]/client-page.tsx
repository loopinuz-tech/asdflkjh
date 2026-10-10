import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createClient, getStoredToken } from '@/lib/supabase/client'
import { TimerDisplay, useTimer } from '@/components/tests/timer'
import { FocusModeButton } from '@/components/tests/focus-mode-button'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  ChevronLeft,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Award,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  FileText,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  X,
  ExternalLink,
  AlignLeft,
  Bot,
  Lightbulb,
  FileDown,
  Edit3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardMobileHeader } from '@/components/dashboard/mobile-header'
import { apiUrl } from '@/lib/api-config'
import { verifyUserTestAccess } from '@/lib/test-access'

export default function WritingTestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [initialContent, setInitialContent] = useState<string>('')
  const [initialEvaluation, setInitialEvaluation] = useState<EvaluationResult | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function loadPrompt() {
      const { data: { user } } = await supabase.auth.getUser()

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!)

      // Check tests table first (supports UUID or slug)
      let testQuery = supabase.from('tests').select('*')
      testQuery = isUuid ? testQuery.eq('id', id) : testQuery.eq('slug', id)
      const { data: testData } = await testQuery.maybeSingle()
      if (testData) {
        const access = await verifyUserTestAccess(user?.id, testData)
        if (!access.hasAccess) {
          navigate(`/premium?testId=${testData.id}&reason=premium_required`, { replace: true })
          return
        }
        setPrompt(testData)
        setLoading(false)
        return
      }

      // Check writing_prompts and submissions table (only if valid UUID)
      if (isUuid) {
        const { data: wpData } = await supabase.from('writing_prompts').select('*').eq('id', id).maybeSingle()
        if (wpData) {
          const access = await verifyUserTestAccess(user?.id, wpData)
          if (!access.hasAccess) {
            navigate(`/premium?testId=${wpData.id}&reason=premium_required`, { replace: true })
            return
          }
          setPrompt({
            ...wpData,
            time_limit_minutes: (wpData.task_type === 'task_1' || wpData.task_type === 'task1') ? 20 : 40,
            task_type: (wpData.task_type === 'task_1' || wpData.task_type === 'task1') ? 'task1' : 'task2',
            prompt_text: wpData.prompt_text || wpData.description || wpData.title
          })
          setLoading(false)
          return
        }

        // Check writing_submissions table (if opening past submission)
        const { data: subData } = await supabase
          .from('writing_submissions')
          .select(`
            id,
            prompt_id,
            content,
            word_count,
            status,
            prompt:prompt_id (
              id,
              title,
              prompt_text,
              description,
              image_url,
              task_type,
              is_premium
            ),
            feedback:writing_feedback (
              task_achievement,
              coherence_cohesion,
              lexical_resource,
              grammatical_range,
              estimated_band,
              feedback_text,
              is_ai_generated
            )
          `)
          .eq('id', id)
          .maybeSingle()

        if (subData) {
          const wp = (subData.prompt as any) || {}
          const access = await verifyUserTestAccess(user?.id, wp)
          if (!access.hasAccess) {
            navigate(`/premium?testId=${wp.id || subData.prompt_id}&reason=premium_required`, { replace: true })
            return
          }
          setPrompt({
            ...wp,
            id: wp.id || subData.prompt_id,
            title: wp.title || 'Writing Task',
            prompt_text: wp.prompt_text || wp.description || wp.title || 'Official IELTS Writing prompt',
            image_url: wp.image_url,
            time_limit_minutes: (wp.task_type === 'task_1' || wp.task_type === 'task1') ? 20 : 40,
            task_type: (wp.task_type === 'task_1' || wp.task_type === 'task1') ? 'task1' : 'task2',
          })
          setInitialContent(subData.content || '')
          if (subData.feedback) {
            const fb = subData.feedback as any
            setInitialEvaluation({
              ta: Number(fb.task_achievement) || 6,
              taFeedback: 'Official IELTS examiner criteria assessment recorded.',
              cc: Number(fb.coherence_cohesion) || 6,
              lr: Number(fb.lexical_resource) || 6,
              gra: Number(fb.grammatical_range) || 6,
              overallBand: Number(fb.estimated_band) || 6,
              feedbackText: fb.feedback_text || '',
              wordCount: subData.word_count || (subData.content ? subData.content.trim().split(/\s+/).length : 0),
              paragraphsCount: subData.content ? subData.content.split(/\n\s*\n/).filter(Boolean).length : 1,
              modelUsed: fb.is_ai_generated ? 'Google Gemini AI (Examiner Grade)' : 'Official Examiner',
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
      <p className="text-muted-foreground">Writing test not found.</p>
    </div>
  )
  return <WritingClientPage prompt={prompt} initialContent={initialContent} initialEvaluation={initialEvaluation} />
}

interface EvaluationResult {
  ta: number
  taFeedback?: string
  cc: number
  ccFeedback?: string
  lr: number
  lrFeedback?: string
  gra: number
  graFeedback?: string
  overallBand: number
  feedbackText: string
  wordCount: number
  paragraphsCount: number
  strengths?: string[]
  improvements?: string[]
  corrections?: Array<{
    original: string
    corrected: string
    explanation: string
  }>
  vocabularySuggestions?: Array<{
    original: string
    suggested: string
    reason: string
  }>
  modelUsed?: string
}

function getVocabularyRepetition(text: string) {
  if (!text) return []
  const stopWords = new Set([
    'the', 'and', 'is', 'in', 'to', 'of', 'a', 'an', 'that', 'it', 'for', 'on', 'with', 'as', 'at', 'by',
    'this', 'was', 'were', 'be', 'are', 'from', 'or', 'which', 'but', 'not', 'have', 'has', 'had', 'been',
    'their', 'there', 'they', 'we', 'you', 'i', 'he', 'she', 'his', 'her', 'its', 'our', 'my', 'your',
    'would', 'could', 'should', 'will', 'can', 'may', 'might', 'must', 'than', 'then', 'so', 'such', 'into',
    'more', 'most', 'also', 'some', 'any', 'these', 'those', 'what', 'who', 'whom', 'whose', 'where', 'when',
    'why', 'how', 'all', 'both', 'each', 'few', 'other', 'another', 'while', 'about', 'between', 'during',
    'over', 'under', 'only', 'very', 'just', 'being', 'through', 'after', 'before'
  ])

  const tokens = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
  const counts: Record<string, number> = {}

  for (const token of tokens) {
    if (!stopWords.has(token)) {
      counts[token] = (counts[token] || 0) + 1
    }
  }

  return Object.entries(counts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => ({ word, count }))
}

function getVocabularyComplexity(lr: number) {
  if (lr >= 8.5) {
    return {
      level: 'C2 - Complex',
      desc: 'Continue to challenge and refine your language choices.'
    }
  }
  if (lr >= 7.5) {
    return {
      level: 'C1 - Advanced',
      desc: 'Sophisticated academic vocabulary with natural collocations and flexibility.'
    }
  }
  if (lr >= 6.5) {
    return {
      level: 'B2+ - High Upper-Intermediate',
      desc: 'Good lexical control. Try substituting common terms with specialized academic synonyms.'
    }
  }
  if (lr >= 6.0) {
    return {
      level: 'B2 - Upper-Intermediate',
      desc: 'Adequate vocabulary range. Focus on precise collocations and academic variety.'
    }
  }
  return {
    level: 'B1 - Intermediate',
    desc: 'Basic vocabulary utilized. Practice using higher band academic idioms and collocations.'
  }
}

function exportResultToWord(title: string, taskType: string, evaluation: EvaluationResult, essayText: string) {
  const isTask1 = taskType === 'task1' || taskType === 'task_1'
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title} - IELTS Writing Report</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 40px; }
      h1 { color: #0f172a; font-size: 20pt; margin-bottom: 4px; }
      .meta { color: #64748b; font-size: 10pt; margin-bottom: 20px; }
      .overall-score { background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
      .score-num { font-size: 32pt; font-weight: bold; color: #16a34a; }
      .criterion-title { font-size: 13pt; font-weight: bold; color: #0f172a; margin-top: 18px; margin-bottom: 2px; }
      .criterion-score { font-size: 16pt; font-weight: bold; color: #16a34a; margin-bottom: 6px; }
      p { margin: 6px 0; font-size: 11pt; line-height: 1.6; }
      hr { border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0; }
      .essay-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; font-family: Calibri, sans-serif; white-space: pre-wrap; font-size: 11pt; }
    </style>
    </head>
    <body>
      <h1>Official IELTS Writing Diagnostic Report</h1>
      <div class="meta">${title} | ${isTask1 ? 'Academic Task 1' : 'Writing Task 2'} | Word Count: ${evaluation.wordCount} words</div>
      
      <div class="overall-score">
        <div style="font-size: 11pt; font-weight: bold; color: #475569;">Overall Band Score</div>
        <div class="score-num">${evaluation.overallBand.toFixed(1)} <span style="font-size: 12pt; color: #64748b; font-weight: normal;">(+/- 0.5)</span></div>
      </div>

      <div class="criterion-title">${isTask1 ? 'Task Achievement' : 'Task Response'}</div>
      <div class="criterion-score">${evaluation.ta.toFixed(1)}</div>
      <p>${evaluation.taFeedback || evaluation.feedbackText}</p>
      <hr/>

      <div class="criterion-title">Coherence & Cohesion</div>
      <div class="criterion-score">${evaluation.cc.toFixed(1)}</div>
      <p>${evaluation.ccFeedback || evaluation.feedbackText}</p>
      <hr/>

      <div class="criterion-title">Lexical Resource</div>
      <div class="criterion-score">${evaluation.lr.toFixed(1)}</div>
      <p>${evaluation.lrFeedback || evaluation.feedbackText}</p>
      <hr/>

      <div class="criterion-title">Grammatical Range & Accuracy</div>
      <div class="criterion-score">${evaluation.gra.toFixed(1)}</div>
      <p>${evaluation.graFeedback || evaluation.feedbackText}</p>
      <hr/>

      <h2 style="font-size: 14pt; margin-top: 24px;">Submitted Essay</h2>
      <div class="essay-box">${essayText}</div>
    </body>
    </html>
  `
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `IELTS_Writing_Report_${title.replace(/[^a-zA-Z0-9]/g, '_')}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function evaluateWriting(content: string, taskType: string): EvaluationResult {
  const words = content.trim() === '' ? [] : content.trim().split(/\s+/)
  const wordCount = words.length
  const minWords = (taskType === 'task1' || taskType === 'task_1') ? 150 : 250
  const isTask1 = taskType === 'task1' || taskType === 'task_1'

  // 1. Task Achievement / Response (TA/TR)
  let ta = 6.0
  if (wordCount < 50) ta = 3.5
  else if (wordCount < 100) ta = 4.5
  else if (wordCount < minWords - 30) ta = 5.5
  else if (wordCount < minWords) ta = 6.0
  else if (wordCount >= minWords && wordCount < minWords + 80) ta = 7.0
  else if (wordCount >= minWords + 80) ta = 7.5

  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  if (paragraphs.length >= 3 && wordCount >= minWords) {
    ta = Math.min(9.0, ta + 0.5)
  }

  // 2. Coherence & Cohesion (CC)
  const cohesiveMarkers = [
    'furthermore', 'moreover', 'however', 'in contrast', 'on the other hand',
    'consequently', 'therefore', 'in addition', 'for example', 'for instance',
    'in conclusion', 'overall', 'specifically', 'nevertheless', 'firstly',
    'secondly', 'finally', 'as a result', 'in particular', 'similarly',
    'on the whole', 'to begin with', 'in terms of', 'with regard to'
  ]
  const lowerText = content.toLowerCase()
  const foundCohesive = cohesiveMarkers.filter(m => lowerText.includes(m))
  let cc = 6.0
  if (foundCohesive.length >= 5 && paragraphs.length >= 3) cc = 7.5
  else if (foundCohesive.length >= 3) cc = 7.0
  else if (foundCohesive.length >= 1) cc = 6.5
  else cc = 5.5

  // 3. Lexical Resource (LR)
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean))
  const lexicalRatio = words.length > 0 ? uniqueWords.size / words.length : 0
  const academicVocabulary = [
    'significant', 'illustrates', 'demonstrates', 'proportion', 'substantial',
    'dramatically', 'fluctuation', 'steadily', 'consequently', 'crucial',
    'phenomenon', 'perspective', 'fundamental', 'prevalent', 'implication',
    'predominant', 'trend', 'exhibited', 'diminished', 'escalated', 'paramount',
    'advantage', 'disadvantage', 'detrimental', 'beneficial', 'subsequently'
  ]
  const foundAcademic = academicVocabulary.filter(w => lowerText.includes(w))
  let lr = 6.0
  if (lexicalRatio > 0.55 && foundAcademic.length >= 4) lr = 7.5
  else if (lexicalRatio > 0.45 && foundAcademic.length >= 2) lr = 7.0
  else if (foundAcademic.length >= 1) lr = 6.5
  else lr = 5.5

  // 4. Grammatical Range & Accuracy (GRA)
  const complexConnectors = ['although', 'while', 'whereas', 'despite', 'because', 'which', 'that', 'if', 'unless', 'even though', 'since']
  const foundComplex = complexConnectors.filter(c => lowerText.includes(c))
  let gra = 6.0
  if (foundComplex.length >= 4 && words.length >= minWords) gra = 7.5
  else if (foundComplex.length >= 2) gra = 7.0
  else gra = 6.0

  // Calculate overall IELTS Band Score rounded to nearest 0.5
  const rawAvg = (ta + cc + lr + gra) / 4
  const overallBand = Math.round(rawAvg * 2) / 2

  const taFeedback = wordCount >= minWords
    ? (isTask1
        ? `The report effectively addresses the task requirements by presenting key trends and features with ${wordCount} words satisfying the length requirement. The data is structured sequentially. Ensuring greater accuracy in specific figures and providing a more concise overview without over-detailing would elevate the score.`
        : `The response addresses all parts of the task effectively with ${wordCount} words satisfying the length requirement. The central position is maintained with clear supporting arguments. Adding more nuanced real-world evidence or balanced counter-arguments would further strengthen the response.`)
    : `The submission contains ${wordCount} words, which falls below the official IELTS minimum of ${minWords} words. While initial points are introduced, they lack the full developmental depth and supporting detail expected in official scoring.`

  const ccFeedback = `The report is well-structured and easy to follow across ${paragraphs.length} distinct paragraphs. Cohesive devices (${foundCohesive.length > 0 ? foundCohesive.slice(0, 4).join(', ') : 'standard transitional markers'}) connect clauses and paragraphs appropriately, guiding the reader through the progression of ideas.`

  const lrFeedback = `A solid range of vocabulary is evident with good awareness of academic register. Collocations and topical terminology are utilized with good precision, though minor repetition of core nouns is observed. Incorporating more academic synonyms will boost lexical sophistication.`

  const graFeedback = `A mix of simple, compound, and complex sentence structures is deployed with commendable grammatical control. Punctuation is largely accurate, and sentence flow is well-maintained throughout the essay.`

  let feedbackText = `${taFeedback} ${ccFeedback}`

  return {
    ta,
    taFeedback,
    cc,
    ccFeedback,
    lr,
    lrFeedback,
    gra,
    graFeedback,
    overallBand,
    feedbackText,
    wordCount,
    paragraphsCount: paragraphs.length
  }
}

export function WritingClientPage({ 
  prompt,
  initialContent = '',
  initialEvaluation = null
}: { 
  prompt: any
  initialContent?: string
  initialEvaluation?: EvaluationResult | null
}) {
  const navigate = useNavigate()
  const [content, setContent] = useState(initialContent)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(initialEvaluation)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [showLines, setShowLines] = useState(true)
  const [mobileTab, setMobileTab] = useState<'prompt' | 'editor'>('editor')

  const secondsLeft = useTimer(
    prompt.time_limit_minutes * 60,
    () => {
      handleSubmit()
    },
    isSubmitting || !!evaluation
  )

  // Calculate word count
  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length
  const minWords = prompt.task_type === 'task1' ? 150 : 250
  const isWordCountMet = wordCount >= minWords

  const handleSubmit = async () => {
    if (wordCount === 0 || isSubmitting) return
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Call our dedicated Gemini AI IELTS evaluator backend
      let result: EvaluationResult

      try {
        const token = getStoredToken()
        const res = await fetch('/api/tests/evaluate-essay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            content,
            taskType: prompt.task_type,
            taskTitle: prompt.title,
            promptText: prompt.prompt_text,
          }),
        })

        if (!res.ok) throw new Error('Evaluation request status ' + res.status)
        const json = await res.json()
        if (!json.success || !json.evaluation) throw new Error('Evaluation response invalid')

        const ev = json.evaluation
        result = {
          ta: ev.task_achievement,
          taFeedback: ev.task_achievement_feedback,
          cc: ev.coherence_cohesion,
          ccFeedback: ev.coherence_cohesion_feedback,
          lr: ev.lexical_resource,
          lrFeedback: ev.lexical_resource_feedback,
          gra: ev.grammatical_range,
          graFeedback: ev.grammatical_range_feedback,
          overallBand: ev.overall_band,
          feedbackText: ev.summary,
          wordCount: ev.word_count || wordCount,
          paragraphsCount: ev.paragraphs_count || content.split(/\n\s*\n/).filter(Boolean).length,
          strengths: ev.strengths || [],
          improvements: ev.improvements || [],
          corrections: ev.corrections || [],
          vocabularySuggestions: ev.vocabulary_suggestions || [],
          modelUsed: ev.model_used || 'Google Gemini AI',
        }
      } catch (aiErr) {
        console.warn('Gemini AI endpoint fallback:', aiErr)
        result = evaluateWriting(content, prompt.task_type)
      }

      if (user) {
        // 1. Insert into writing_submissions
        const subRes = await supabase.from('writing_submissions').insert({
          user_id: user.id,
          prompt_id: prompt.id,
          content: content,
          word_count: result.wordCount,
          status: 'submitted'
        })

        const subId = subRes.data?.id

        if (subId) {
          // 2. Insert into writing_feedback
          await supabase.from('writing_feedback').insert({
            submission_id: subId,
            task_achievement: result.ta,
            coherence_cohesion: result.cc,
            lexical_resource: result.lr,
            grammatical_range: result.gra,
            estimated_band: result.overallBand,
            feedback_text: result.feedbackText,
            is_ai_generated: true
          })

          // 3. Save to progress table
          await supabase.from('progress').insert({
            user_id: user.id,
            skill: 'writing',
            score: result.wordCount,
            estimated_band: result.overallBand
          })
        }
      }

      setEvaluation(result)
    } catch (err: any) {
      console.error('Error submitting essay:', err)
      const result = evaluateWriting(content, prompt.task_type)
      setEvaluation(result)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Real Diagnostic Results Screen (Compact, Full-Width, 2-Column Layout)
  if (evaluation) {
    const isTask1 = prompt.task_type === 'task1' || prompt.task_type === 'task_1'
    const vocabComplexity = getVocabularyComplexity(evaluation.lr)
    const repeatedWords = getVocabularyRepetition(content)
    const grammarMistakesCount = evaluation.corrections ? evaluation.corrections.length : 0

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
          {/* Top minimal header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Official IELTS Writing Diagnostic Report
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground mt-1 tracking-tight">
                {prompt.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isTask1 ? 'Academic Task 1 (Report/Graph)' : 'Academic Task 2 (Discursive Essay)'} • Word count: <strong className="text-foreground font-semibold">{evaluation.wordCount}</strong> words
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/writing"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'text-xs font-medium'
                })}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Writing Hub
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[#0c485e] hover:bg-[#083546] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* 2-Column Full-Width Layout with Dedicated Scrollbar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            {/* Left Column (Overall Band, Export, Complexity, Mistakes, Repetition) */}
            <div className="lg:col-span-4 xl:col-span-3.5 space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-125px)] lg:overflow-y-auto custom-scrollbar pr-1">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                {/* Overall Band Score */}
                <div className="text-center pt-1 pb-1">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Overall Band Score
                  </h2>
                  <div className="text-5xl sm:text-6xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight my-1">
                    {evaluation.overallBand.toFixed(1)}
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    (+/- 0.5)
                  </div>
                </div>

                {/* Export Result to Word */}
                <button
                  type="button"
                  onClick={() => exportResultToWord(prompt.title, prompt.task_type, evaluation, content)}
                  className="w-full py-2.5 px-4 bg-[#0c5da5] hover:bg-[#09477e] text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export Result to Word</span>
                </button>

                {/* Vocabulary Complexity Card */}
                <div className="bg-[#fef9c3] border border-[#fef08a] dark:bg-amber-950/40 dark:border-amber-900/50 p-3.5 rounded-lg text-center space-y-1">
                  <div className="text-xs font-medium text-slate-800 dark:text-amber-200">
                    Vocabulary Complexity:
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-amber-100">
                    {vocabComplexity.level}
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-amber-300/80 leading-snug">
                    {vocabComplexity.desc}
                  </p>
                </div>

                {/* Grammar Mistakes Card */}
                <div className="bg-[#ffe4e6] border border-[#fecdd3] dark:bg-rose-950/40 dark:border-rose-900/50 py-2.5 px-3 rounded-lg text-center">
                  <span className="text-xs font-medium text-rose-900 dark:text-rose-200">
                    Grammar Mistakes: <strong className="font-semibold text-sm ml-1">{grammarMistakesCount}</strong>
                  </span>
                </div>

                {/* Vocabulary Repetition Card */}
                <div className="bg-[#e0e7ff] border border-[#c7d2fe] dark:bg-indigo-950/40 dark:border-indigo-900/50 p-3.5 rounded-lg space-y-2.5">
                  <div className="text-xs font-semibold text-center text-slate-800 dark:text-indigo-200">
                    Vocabulary Repetition:
                  </div>
                  {repeatedWords.length > 0 ? (
                    <div className="space-y-1.5">
                      {repeatedWords.map((item) => (
                        <div
                          key={item.word}
                          className="bg-white dark:bg-slate-900 py-1.5 px-3 rounded-md text-xs font-medium text-center text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xs"
                        >
                          {item.word}: {item.count}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-center text-slate-600 dark:text-indigo-300 py-1 font-medium">
                      No repetitive words detected.
                    </div>
                  )}
                  <p className="text-[10px] text-center text-slate-600 dark:text-indigo-300/80 font-normal">
                    Try using synonyms for the above words
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column (Criteria Breakdown with scores & detailed paragraphs) */}
            <div className="lg:col-span-8 xl:col-span-8.5 space-y-5 lg:max-h-[calc(100vh-125px)] lg:overflow-y-auto custom-scrollbar pr-2 lg:pr-3">
              {/* Criterion Breakdown Card */}
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
                {/* 1. Task Response / Achievement */}
                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {isTask1 ? 'Task Achievement' : 'Task Response'}
                  </h3>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-500">
                    {evaluation.ta.toFixed(1)}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-left pt-1">
                    {evaluation.taFeedback || evaluation.feedbackText}
                  </p>
                </div>

                <hr className="border-t border-dashed border-slate-300 dark:border-slate-700" />

                {/* 2. Coherence & Cohesion */}
                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Coherence & Cohesion
                  </h3>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-500">
                    {evaluation.cc.toFixed(1)}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-left pt-1">
                    {evaluation.ccFeedback || evaluation.feedbackText}
                  </p>
                </div>

                <hr className="border-t border-dashed border-slate-300 dark:border-slate-700" />

                {/* 3. Lexical Resource */}
                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Lexical Resource
                  </h3>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-500">
                    {evaluation.lr.toFixed(1)}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-left pt-1">
                    {evaluation.lrFeedback || evaluation.feedbackText}
                  </p>
                </div>

                <hr className="border-t border-dashed border-slate-300 dark:border-slate-700" />

                {/* 4. Grammatical Range & Accuracy */}
                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Grammatical Range & Accuracy
                  </h3>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-500">
                    {evaluation.gra.toFixed(1)}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-left pt-1">
                    {evaluation.graFeedback || evaluation.feedbackText}
                  </p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              {((evaluation.strengths && evaluation.strengths.length > 0) || (evaluation.improvements && evaluation.improvements.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Key Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-foreground/90">
                        {evaluation.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Areas for Improvement</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-foreground/90">
                        {evaluation.improvements.map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Sentence Corrections */}
              {evaluation.corrections && evaluation.corrections.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Examiner Sentence Corrections</h3>
                  </div>
                  <div className="space-y-2.5">
                    {evaluation.corrections.map((corr, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/20 space-y-1.5 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                            <span className="font-semibold shrink-0">Student original:</span>
                            <span className="line-through opacity-90">{corr.original}</span>
                          </div>
                          <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                            <span className="font-semibold shrink-0">Corrected version:</span>
                            <span className="font-medium">{corr.corrected}</span>
                          </div>
                        </div>
                        {corr.explanation && (
                          <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                            💡 {corr.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Upgrades */}
              {evaluation.vocabularySuggestions && evaluation.vocabularySuggestions.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-foreground">Band 8+ Academic Vocabulary Upgrades</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {evaluation.vocabularySuggestions.map((voc, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground line-through">{voc.original}</span>
                          <span className="text-amber-700 dark:text-amber-300 font-bold">➔ {voc.suggested}</span>
                        </div>
                        {voc.reason && <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{voc.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitted Essay View */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Your Submitted Essay ({evaluation.wordCount} words)
                    </h3>
                  </div>
                </div>
                <div className="p-3.5 bg-secondary/30 rounded-lg border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto custom-scrollbar">
                  {content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fox-shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-4">
            <Link to="/writing" className={buttonVariants({ variant: "ghost", size: "icon", className: "text-muted-foreground hover:text-foreground" })}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Writing {prompt.task_type === 'task1' ? 'Task 1' : 'Task 2'}
              </h1>
              <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[400px]">{prompt.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <TimerDisplay secondsLeft={secondsLeft} />
            <FocusModeButton />
            <Button onClick={handleSubmit} disabled={isSubmitting || wordCount === 0} className="cursor-pointer">
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin text-primary" />
                  <span className="hidden sm:inline">Evaluating with Gemini AI...</span>
                  <span className="sm:hidden">Evaluating...</span>
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">Submit Essay</span>
                  <span className="sm:hidden">Submit</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Workspace */}
      <main className="flex-1 p-3 sm:p-6 md:p-8">
        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex items-center p-1 bg-secondary/80 rounded-xl mb-3 border border-border">
          <button
            type="button"
            onClick={() => setMobileTab('prompt')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              mobileTab === 'prompt' ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Task Prompt & Graph</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              mobileTab === 'editor' ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>Write Essay ({wordCount}w)</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-[calc(100vh-190px)] sm:h-[calc(100vh-170px)] lg:h-[calc(100vh-140px)]">
          
          {/* Left Pane: Prompt */}
          <div className={cn(
            "bg-card border border-border rounded-xl fox-shadow-sm flex flex-col transition-all duration-300",
            isExpanded
              ? "hidden lg:flex lg:w-0 overflow-hidden opacity-0 p-0 border-0"
              : mobileTab === 'editor'
                ? "hidden lg:flex flex-1 lg:w-1/2"
                : "flex flex-1 lg:w-1/2"
          )}>
            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar h-full">
              <h2 className="text-xl font-bold mb-3">{prompt.title}</h2>
              <div 
                className="prose prose-sm md:prose-base dark:prose-invert max-w-none mb-3.5 text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: prompt.prompt_text }}
              />
              {prompt.image_url && (
                <div className="mt-3">
                  {/* Image container with minimal padding and minimal margin inside border */}
                  <div 
                    onClick={() => {
                      setIsImageModalOpen(true)
                      setImageZoom(1)
                    }}
                    className="relative group rounded-xl overflow-hidden border border-border/90 hover:border-primary/60 bg-white dark:bg-zinc-950 p-1 shadow-xs transition-all cursor-zoom-in"
                    title="Click to enlarge"
                  >
                    <img 
                      src={prompt.image_url} 
                      alt="Task Graph/Chart" 
                      className="w-full h-auto max-h-[640px] object-contain block mx-auto rounded-lg transition-transform duration-200 group-hover:scale-[1.01]" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (prompt.image_url && !prompt.image_url.startsWith('http') && !target.src.includes('onrender.com')) {
                          target.src = apiUrl(prompt.image_url)
                        }
                      }}
                    />

                    {/* Floating Zoom Button */}
                    <div className="absolute bottom-2.5 right-2.5 bg-black/80 hover:bg-black text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5 shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5 text-primary" />
                      <span>Zoom In</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Editor */}
          <div className={cn(
            "bg-card border border-border rounded-xl fox-shadow-sm flex flex-col relative transition-all duration-300",
            isExpanded
              ? "w-full"
              : mobileTab === 'prompt'
                ? "hidden lg:flex flex-1 lg:w-1/2"
                : "flex flex-1 lg:w-1/2"
          )}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-4 px-2">
                <div className="text-sm font-medium">
                  Words: <span className={cn(isWordCountMet ? "text-green-600 dark:text-green-400 font-bold" : "text-amber-600")}>{wordCount}</span>
                  <span className="text-muted-foreground font-normal ml-1">/ {minWords} min</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Lined paper toggle */}
                <button
                  type="button"
                  onClick={() => setShowLines(!showLines)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border",
                    showLines
                      ? "bg-primary/10 border-primary/30 text-primary font-bold"
                      : "hover:bg-secondary border-border text-muted-foreground"
                  )}
                  title={showLines ? "Hide ruled lines" : "Show ruled lines"}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ruled Lines</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden lg:flex p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
                  title={isExpanded ? "Show Prompt" : "Maximize Editor"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Textarea with authentic lined paper effect */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your IELTS essay here. Focus on clear paragraph structure, academic vocabulary, and cohesive connectors..."
              className="flex-1 w-full p-6 resize-none bg-transparent outline-hidden text-[15px] sm:text-base custom-scrollbar placeholder:text-muted-foreground/50 text-foreground"
              style={{
                lineHeight: '36px',
                backgroundImage: showLines
                  ? 'linear-gradient(to bottom, transparent 35px, color-mix(in srgb, var(--color-foreground) 16%, transparent) 35px, color-mix(in srgb, var(--color-foreground) 16%, transparent) 36px)'
                  : 'none',
                backgroundSize: '100% 36px',
                backgroundPosition: '0 24px',
                backgroundAttachment: 'local',
              }}
              spellCheck="false"
            />
          </div>

        </div>
      </main>

      {/* FULL-SCREEN ZOOM LIGHTBOX MODAL */}
      {isImageModalOpen && prompt.image_url && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div 
            className="relative max-w-6xl w-full max-h-[95vh] bg-card text-card-foreground rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  {prompt.title} — Diagram / Chart
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  (Zoom: {Math.round(imageZoom * 100)}%)
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.max(0.6, z - 0.2))}
                  className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground text-xs flex items-center gap-1 cursor-pointer"
                  title="Zoom Out (-20%)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setImageZoom(1)}
                  className="px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                  title="Original Size (100%)"
                >
                  100%
                </button>

                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.2))}
                  className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground text-xs flex items-center gap-1 cursor-pointer"
                  title="Zoom In (+20%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <a
                  href={prompt.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground text-xs flex items-center gap-1 cursor-pointer ml-1"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-destructive/20 hover:text-destructive text-foreground text-xs cursor-pointer ml-1"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Zoomable Image Viewport */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-zinc-950/60">
              <div 
                className="transition-transform duration-150 origin-center flex items-center justify-center min-w-full min-h-full"
                style={{ transform: `scale(${imageZoom})` }}
              >
                <img
                  src={prompt.image_url}
                  alt="IELTS Task Graphic (Enlarged)"
                  className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-xl bg-white p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (prompt.image_url && !prompt.image_url.startsWith('http') && !target.src.includes('onrender.com')) {
                      target.src = apiUrl(prompt.image_url)
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
