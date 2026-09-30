import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  RotateCw,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Calendar,
  User,
  Filter,
  ArrowRight,
  X,
  Sparkles,
  HelpCircle,
  FileText,
  Bookmark,
  ChevronRight,
  TrendingUp,
  Percent,
  Edit3,
} from 'lucide-react'
import { getAdminAttempts, getAdminAttemptDetails } from '@/actions/admin'
import { cn } from '@/lib/utils'

interface AttemptItem {
  id: string
  user_id: string
  test_id: string
  status: 'submitted' | 'in_progress'
  started_at: string
  submitted_at: string | null
  time_used_seconds: number
  raw_score: number
  total_points: number
  estimated_band: number | null
  created_at: string
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
    telegram_username: string | null
    target_band: number | null
  }
  test: {
    id: string
    title: string
    skill: string
    ielts_type: string
    time_limit_minutes: number
    difficulty: string
  }
  correct_count: number
  incorrect_count: number
}

interface AttemptStats {
  totalAttempts: number
  submittedCount: number
  inProgressCount: number
  avgBand: number
  highBandCount: number
}

interface QuestionDiagnostic {
  questionId: string
  questionNumber: number
  questionType: string
  questionText: string
  instruction: string | null
  correctAnswer: string | null
  acceptedAnswers: string[]
  points: number
  explanation: string | null
  passageReference: string | null
  options: any[]
  userAnswer: any
  isCorrect: boolean | null
  status: 'correct' | 'incorrect' | 'unanswered'
  pointsEarned: number
  markedForReview: boolean
  answeredAt: string | null
}

interface AttemptDetail {
  attempt: {
    id: string
    status: string
    started_at: string
    submitted_at: string | null
    time_used_seconds: number
    raw_score: number
    total_points: number
    estimated_band: number | null
    created_at: string
  }
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
    telegram_username: string | null
    target_band: number | null
  }
  test?: {
    id: string
    title: string
    skill: string
    ielts_type: string
    time_limit_minutes: number
    difficulty: string
    description: string | null
  }
  writingDetail?: {
    task_achievement: number | null
    coherence_cohesion: number | null
    lexical_resource: number | null
    grammatical_range: number | null
    feedback_text: string
    content: string
    word_count: number
    image_url?: string | null
    task_type?: string
  }
  speakingDetail?: {
    fluency_coherence: number | null
    lexical_resource: number | null
    grammatical_range: number | null
    pronunciation: number | null
    feedback_text: string
    audio_path?: string
    duration_seconds: number
    transcript?: string | null
    part_number: number
  }
  summary: {
    totalQuestions: number
    correctCount: number
    incorrectCount: number
    unansweredCount: number
    accuracyPercentage: number
  }
  questions: QuestionDiagnostic[]
}

export function AdminAttemptsClientPage() {
  const [attempts, setAttempts] = useState<AttemptItem[]>([])
  const [stats, setStats] = useState<AttemptStats>({
    totalAttempts: 0,
    submittedCount: 0,
    inProgressCount: 0,
    avgBand: 0,
    highBandCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')

  // Diagnostic Modal State
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [questionTab, setQuestionTab] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all')

  const fetchAttempts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getAdminAttempts({
        search: search.trim() || undefined,
        skill: skillFilter !== 'all' ? skillFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy,
        limit: 50,
      })
      if (res?.success) {
        setAttempts(res.attempts || [])
        setStats(res.stats || {
          totalAttempts: 0,
          submittedCount: 0,
          inProgressCount: 0,
          avgBand: 0,
          highBandCount: 0,
        })
      } else {
        setError(res?.error || 'Failed to fetch student attempts')
      }
    } catch (err: any) {
      console.error('Failed to load admin attempts:', err)
      setError(err.message || 'Network error fetching attempts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, skillFilter, statusFilter, sortBy])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttempts()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchAttempts])

  // Open modal and load question-by-question breakdown
  const handleOpenDiagnostic = async (attemptId: string) => {
    setSelectedAttemptId(attemptId)
    setQuestionTab('all')
    try {
      setDetailLoading(true)
      const res = await getAdminAttemptDetails(attemptId)
      if (res?.success) {
        setAttemptDetail(res)
      }
    } catch (err) {
      console.error('Failed to load attempt details:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedAttemptId(null)
    setAttemptDetail(null)
  }

  const getSkillIcon = (skill: string) => {
    switch (skill?.toLowerCase()) {
      case 'reading':
        return <BookOpen className="w-4 h-4 text-amber-500" />
      case 'listening':
        return <Headphones className="w-4 h-4 text-blue-500" />
      case 'writing':
        return <PenTool className="w-4 h-4 text-purple-500" />
      case 'speaking':
        return <Mic className="w-4 h-4 text-emerald-500" />
      default:
        return <FileText className="w-4 h-4 text-zinc-500" />
    }
  }

  const filteredQuestions = (attemptDetail?.questions || []).filter((q) => {
    if (questionTab === 'correct') return q.status === 'correct'
    if (questionTab === 'incorrect') return q.status === 'incorrect'
    if (questionTab === 'unanswered') return q.status === 'unanswered'
    return true
  })

  const completionRate = stats.totalAttempts > 0
    ? Math.round((stats.submittedCount / stats.totalAttempts) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary shrink-0" />
            <span>Student Test Results & Diagnostic Reports</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time tracking of student mock test completions, band scores, and question-by-question error diagnosis.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true)
            fetchAttempts()
          }}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RotateCw className={cn('w-3.5 h-3.5', (loading || refreshing) && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Attempts */}
        <div className="p-4 bg-card border border-border rounded-2xl fox-shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Attempts</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{stats.totalAttempts}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-muted-foreground">
              <span className="text-emerald-600 font-bold">{stats.submittedCount} submitted</span>
              <span>•</span>
              <span className="text-amber-600 font-bold">{stats.inProgressCount} active</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Average Band Score */}
        <div className="p-4 bg-card border border-border rounded-2xl fox-shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Band</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              {stats.avgBand > 0 ? stats.avgBand.toFixed(1) : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Across all submitted tests</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: High Performers (Band 7.0+) */}
        <div className="p-4 bg-card border border-border rounded-2xl fox-shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">High Performers (7.0+)</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{stats.highBandCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {stats.submittedCount > 0 ? `${Math.round((stats.highBandCount / stats.submittedCount) * 100)}% of submitted` : '0%'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Completion Rate */}
        <div className="p-4 bg-card border border-border rounded-2xl fox-shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{completionRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">Started vs finished tests</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl fox-shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, email, or test..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Skill Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="all">All Skills</option>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted Only</option>
            <option value="in_progress">In Progress</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="created_at">Newest Attempt</option>
            <option value="submitted_at">Submission Date</option>
            <option value="estimated_band">Highest Band</option>
            <option value="raw_score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-card border border-border rounded-2xl fox-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Test Title & Skill</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Band & Score</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading student test attempts...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <p className="text-xs font-semibold text-destructive mb-2">{error}</p>
                    <button
                      type="button"
                      onClick={fetchAttempts}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </td>
                </tr>
              ) : attempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="text-xs font-semibold text-foreground">No student attempts found</p>
                      <p className="text-[11px] text-muted-foreground">
                        {search || skillFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try changing or clearing your search filters.'
                          : 'Student submissions will appear here once IELTS tests are taken.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                attempts.map((att) => {
                  const studentName = `${att.student.first_name || ''} ${att.student.last_name || ''}`.trim() || 'Anonymous Student'
                  const initials = studentName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  const isSubmitted = att.status === 'submitted'

                  return (
                    <tr key={att.id} className="hover:bg-secondary/30 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/30">
                            {initials || <User className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate max-w-[180px]">{studentName}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{att.student.email}</p>
                            {att.student.telegram_username && (
                              <p className="text-[10px] text-blue-500 font-mono">@{att.student.telegram_username}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Test Title & Skill */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground truncate max-w-[240px]">{att.test.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-secondary text-foreground border border-border">
                              {getSkillIcon(att.test.skill)}
                              <span>{att.test.skill}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {att.test.ielts_type || 'Academic'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>

                      {/* Band & Score */}
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-lg text-xs font-extrabold bg-primary text-black border border-primary shadow-2xs">
                              Band {att.estimated_band ? att.estimated_band.toFixed(1) : '—'}
                            </span>
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              {att.raw_score} / {att.total_points || 40} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Pending submission</span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {new Date(att.submitted_at || att.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {new Date(att.submitted_at || att.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDiagnostic(att.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Inspect Diagnostic</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIAGNOSTIC INSPECTION MODAL */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-[calc(100vw-1.5rem)] max-w-4xl max-h-[92vh] bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Student Attempt Diagnostic Report
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {attemptDetail ? (
                      <>
                        <span className="font-semibold text-foreground">
                          {attemptDetail.student?.first_name || (attemptDetail.attempt as any)?.student?.first_name || 'Student'} {attemptDetail.student?.last_name || (attemptDetail.attempt as any)?.student?.last_name || ''}
                        </span>{' '}
                        • {attemptDetail.test?.title || (attemptDetail.attempt as any)?.test?.title || 'IELTS Attempt'}
                      </>
                    ) : (
                      'Loading details...'
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              {detailLoading || !attemptDetail ? (
                <div className="py-24 text-center text-muted-foreground">
                  <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-xs font-semibold">Generating attempt diagnostic report...</p>
                </div>
              ) : attemptDetail.writingDetail ? (
                /* 1. WRITING DIAGNOSTIC REPORT */
                <div className="space-y-6">
                  {/* Score & Diagnostic KPI Banner */}
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Overall Band */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Band</p>
                      <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary text-primary-foreground font-extrabold text-lg shadow-xs">
                        <span>Band {attemptDetail.attempt.estimated_band ? attemptDetail.attempt.estimated_band.toFixed(1) : '—'}</span>
                      </div>
                    </div>

                    {/* Word Count */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Word Count</p>
                      <p className="text-lg font-extrabold text-foreground mt-1">
                        {attemptDetail.writingDetail.word_count} words
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Min: {attemptDetail.writingDetail.task_type === 'task_1' ? '150' : '250'} words
                      </p>
                    </div>

                    {/* Task Type */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Task Type</p>
                      <p className="text-lg font-extrabold text-foreground mt-1 capitalize">
                        {attemptDetail.writingDetail.task_type === 'task_1' ? 'Academic Task 1' : 'Task 2 Essay'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Official IELTS Writing</p>
                    </div>

                    {/* Status */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                      <div className="mt-1">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                          {attemptDetail.attempt.status || 'Evaluated'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Examiner Assessment</p>
                    </div>
                  </div>

                  {/* 4 Criteria Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Official IELTS Writing Assessment Criteria
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {attemptDetail.writingDetail.task_type === 'task_1' ? 'Task Achievement' : 'Task Response'}
                        </span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.writingDetail.task_achievement ? attemptDetail.writingDetail.task_achievement.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Coherence & Cohesion</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.writingDetail.coherence_cohesion ? attemptDetail.writingDetail.coherence_cohesion.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Lexical Resource</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.writingDetail.lexical_resource ? attemptDetail.writingDetail.lexical_resource.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Grammatical Range</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.writingDetail.grammatical_range ? attemptDetail.writingDetail.grammatical_range.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Examiner Diagnostic Feedback */}
                  {attemptDetail.writingDetail.feedback_text && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                        <Sparkles className="w-4 h-4" />
                        <span>Examiner Diagnostic & Detailed Feedback</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {attemptDetail.writingDetail.feedback_text}
                      </p>
                    </div>
                  )}

                  {/* Prompt Details */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">Task Prompt & Instructions</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground uppercase font-mono">
                        {attemptDetail.test?.title || (attemptDetail.attempt as any)?.test?.title || 'Writing Task'}
                      </span>
                    </div>
                    {attemptDetail.writingDetail.image_url && (
                      <div className="my-2 max-w-sm rounded-xl overflow-hidden border border-border">
                        <img src={attemptDetail.writingDetail.image_url} alt="Task Visual" className="w-full object-contain max-h-48" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {attemptDetail.test?.description || (attemptDetail.attempt as any)?.test?.description || 'No prompt instructions provided.'}
                    </p>
                  </div>

                  {/* Student Submitted Essay */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Student Submitted Essay</span>
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {attemptDetail.writingDetail.word_count} words
                      </span>
                    </div>
                    <div className="p-5 rounded-2xl bg-card border border-border font-serif text-sm leading-relaxed text-foreground whitespace-pre-wrap shadow-inner max-h-80 overflow-y-auto custom-scrollbar">
                      {attemptDetail.writingDetail.content || '(Essay content is empty)'}
                    </div>
                  </div>
                </div>
              ) : attemptDetail.speakingDetail ? (
                /* 2. SPEAKING DIAGNOSTIC REPORT */
                <div className="space-y-6">
                  {/* Score & Diagnostic KPI Banner */}
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Overall Band */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Band</p>
                      <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary text-black font-extrabold text-lg shadow-xs">
                        <span>Band {attemptDetail.attempt.estimated_band ? attemptDetail.attempt.estimated_band.toFixed(1) : '—'}</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Speaking Duration</p>
                      <p className="text-lg font-extrabold text-foreground mt-1">
                        {attemptDetail.speakingDetail.duration_seconds}s
                      </p>
                      <p className="text-[10px] text-muted-foreground">Audio recording</p>
                    </div>

                    {/* Part Number */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Interview Part</p>
                      <p className="text-lg font-extrabold text-foreground mt-1">
                        Part {attemptDetail.speakingDetail.part_number || 1}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Official IELTS Speaking</p>
                    </div>

                    {/* Status */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                      <div className="mt-1">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                          {attemptDetail.attempt.status || 'Evaluated'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Examiner Assessment</p>
                    </div>
                  </div>

                  {/* 4 Criteria Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Official IELTS Speaking Assessment Criteria
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Fluency & Coherence</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.speakingDetail.fluency_coherence ? attemptDetail.speakingDetail.fluency_coherence.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Lexical Resource</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.speakingDetail.lexical_resource ? attemptDetail.speakingDetail.lexical_resource.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Grammatical Range</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.speakingDetail.grammatical_range ? attemptDetail.speakingDetail.grammatical_range.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Pronunciation</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">
                            {attemptDetail.speakingDetail.pronunciation ? attemptDetail.speakingDetail.pronunciation.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">/ 9.0</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Examiner Diagnostic Feedback */}
                  {attemptDetail.speakingDetail.feedback_text && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                        <Sparkles className="w-4 h-4" />
                        <span>Examiner Diagnostic Feedback</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {attemptDetail.speakingDetail.feedback_text}
                      </p>
                    </div>
                  )}

                  {/* Recorded Audio Player */}
                  {attemptDetail.speakingDetail.audio_path && (
                    <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Mic className="w-4 h-4 text-emerald-500" />
                        <span>Recorded Student Audio</span>
                      </h4>
                      <audio controls className="w-full mt-2" src={attemptDetail.speakingDetail.audio_path}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Student Audio Transcript */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Audio Transcript</span>
                    </h4>
                    <div className="p-5 rounded-2xl bg-card border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap shadow-inner max-h-80 overflow-y-auto custom-scrollbar">
                      {attemptDetail.speakingDetail.transcript || 'No transcript generated for this audio recording.'}
                    </div>
                  </div>
                </div>
              ) : (
                /* 3. READING & LISTENING QUESTION-BY-QUESTION DIAGNOSTIC */
                <>
                  {/* Score & Diagnostic KPI Banner */}
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Overall Band */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Band</p>
                      <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary text-black font-extrabold text-lg shadow-xs">
                        <span>Band {attemptDetail.attempt.estimated_band ? attemptDetail.attempt.estimated_band.toFixed(1) : '—'}</span>
                      </div>
                    </div>

                    {/* Raw Score */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Raw Score</p>
                      <p className="text-lg font-extrabold text-foreground mt-1">
                        {attemptDetail.attempt.raw_score} / {attemptDetail.attempt.total_points || 40}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Points earned</p>
                    </div>

                    {/* Accuracy */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Accuracy</p>
                      <p className="text-lg font-extrabold text-foreground mt-1">
                        {attemptDetail.summary.accuracyPercentage}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {attemptDetail.summary.correctCount} of {attemptDetail.summary.totalQuestions} questions
                      </p>
                    </div>

                    {/* Breakdown */}
                    <div className="text-center sm:text-left space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Diagnosis</p>
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          ✓ {attemptDetail.summary.correctCount} Correct
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                          ✕ {attemptDetail.summary.incorrectCount} Wrong
                        </span>
                        {attemptDetail.summary.unansweredCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                            — {attemptDetail.summary.unansweredCount} Blank
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Filter Tabs */}
                  <div className="flex items-center gap-2 border-b border-border pb-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setQuestionTab('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                        questionTab === 'all'
                          ? 'bg-primary text-black border-primary'
                          : 'bg-card text-muted-foreground border-border hover:bg-secondary'
                      )}
                    >
                      All Questions ({attemptDetail.summary.totalQuestions})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTab('incorrect')}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                        questionTab === 'incorrect'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-card text-rose-600 border-border hover:bg-rose-50 dark:hover:bg-rose-950/20'
                      )}
                    >
                      Mistakes Only ({attemptDetail.summary.incorrectCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTab('correct')}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                        questionTab === 'correct'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-card text-emerald-600 border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                      )}
                    >
                      Correct Answers ({attemptDetail.summary.correctCount})
                    </button>
                    {attemptDetail.summary.unansweredCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuestionTab('unanswered')}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                          questionTab === 'unanswered'
                            ? 'bg-zinc-700 text-white border-zinc-700'
                            : 'bg-card text-muted-foreground border-border hover:bg-secondary'
                        )}
                      >
                        Unanswered ({attemptDetail.summary.unansweredCount})
                      </button>
                    )}
                  </div>

                  {/* Question Diagnostic List */}
                  <div className="space-y-3.5">
                    {filteredQuestions.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-xs">
                        No questions in this filter category.
                      </div>
                    ) : (
                      filteredQuestions.map((q) => {
                        const isCorrect = q.status === 'correct'
                        const isIncorrect = q.status === 'incorrect'
                        const isUnanswered = q.status === 'unanswered'

                        return (
                          <div
                            key={q.questionId}
                            className={cn(
                              'p-4 rounded-2xl border transition-all text-xs space-y-3',
                              isCorrect && 'bg-emerald-500/5 border-emerald-500/20',
                              isIncorrect && 'bg-rose-500/5 border-rose-500/20',
                              isUnanswered && 'bg-secondary/40 border-border'
                            )}
                          >
                            {/* Question Header */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'w-7 h-7 rounded-xl font-extrabold flex items-center justify-center shrink-0 text-xs text-white',
                                    isCorrect && 'bg-emerald-600',
                                    isIncorrect && 'bg-rose-600',
                                    isUnanswered && 'bg-zinc-500'
                                  )}
                                >
                                  {q.questionNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono text-[10px] uppercase">
                                  {q.questionType.replace(/_/g, ' ')}
                                </span>
                                {q.markedForReview && (
                                  <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-[10px]">
                                    <Bookmark className="w-3 h-3 fill-amber-500" />
                                    <span>Marked for review</span>
                                  </span>
                                )}
                              </div>

                              <span className="font-semibold text-muted-foreground text-[11px]">
                                {q.pointsEarned} / {q.points} pt
                              </span>
                            </div>

                            {/* Instruction & Question Text */}
                            <div className="space-y-1">
                              {q.instruction && (
                                <p className="text-[11px] font-semibold text-muted-foreground italic">
                                  {q.instruction}
                                </p>
                              )}
                              <p className="font-medium text-foreground leading-relaxed text-sm">
                                {q.questionText}
                              </p>
                            </div>

                            {/* Answers Comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                              {/* Student Answer */}
                              <div className="p-2.5 rounded-xl bg-card border border-border space-y-1">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                  Student&apos;s Answer:
                                </span>
                                <div className="flex items-center gap-1.5 font-bold">
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-emerald-700 dark:text-emerald-400 break-words">
                                        {String(q.userAnswer)}
                                      </span>
                                    </>
                                  ) : isIncorrect ? (
                                    <>
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                      <span className="text-rose-700 dark:text-rose-400 line-through break-words">
                                        {String(q.userAnswer)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground italic text-[11px]">
                                      (Left blank / Unanswered)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Correct Answer */}
                              <div className="p-2.5 rounded-xl bg-card border border-border space-y-1">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                  Correct Answer:
                                </span>
                                <div className="flex items-center gap-1.5 font-bold text-foreground">
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 break-words">
                                    {q.correctAnswer || (q.acceptedAnswers.length > 0 ? q.acceptedAnswers.join(', ') : 'N/A')}
                                  </span>
                                  {q.acceptedAnswers.length > 1 && (
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                      (Variants: {q.acceptedAnswers.join(', ')})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Explanation (if present) */}
                            {q.explanation && (
                              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-foreground">Explanation: </strong>
                                  <span>{q.explanation}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground">
                Attempt ID: <code className="font-mono text-[10px]">{selectedAttemptId}</code>
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminAttemptsClientPage
