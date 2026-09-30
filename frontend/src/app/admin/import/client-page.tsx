import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Headphones,
  FileCode,
  PenTool,
  Upload,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
  RefreshCw,
  Cpu,
  Layers,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportHubProps {
  imports: any[]
  loading?: boolean
  error?: string | null
  onDeleteJob?: (id: string) => void
  onRefresh?: () => void
}

export function ImportCenterView({ imports, loading, error, onDeleteJob, onRefresh }: ImportHubProps) {
  const importOptions = [
    {
      title: 'Import HTML',
      badge: 'Gemini AI Auto-Detect',
      description: 'Upload .html files or paste HTML from Cambridge / IELTS resources. Automatically extracts reading passages, sections, questions, and answer keys.',
      icon: FileCode,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      href: '/admin/import/html',
      pipeline: 'HTML → Section Splitter → Question & Key Extraction → TestBuilder',
    },
    {
      title: 'Import PDF & Documents',
      badge: 'Multimodal AI Parser',
      description: 'Upload authentic IELTS Cambridge or official PDF exams or paste OCR text. Gemini extracts layout, passages, questions, options, and tables.',
      icon: FileText,
      color: 'bg-red-500/10 text-red-600 border-red-500/20',
      href: '/admin/import/pdf',
      pipeline: 'PDF/OCR → Multimodal Gemini AI → Pre-Save Review → Publish',
    },
    {
      title: 'Import Audio & Listening',
      badge: 'Speech-to-Test AI',
      description: 'Upload listening audio tracks (MP3/WAV) and paste spoken dialogue transcripts. Auto-generates authentic IELTS listening questions 1–40.',
      icon: Headphones,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      href: '/admin/import/audio',
      pipeline: 'Audio/Transcript → Gemini Listening AI → Part 1-4 Sections → Builder',
    },
    {
      title: 'Import Structured JSON',
      badge: 'Strict Schema Validator',
      description: 'Upload or paste complete test datasets with passages and questions. Instant syntax check and download full IELTS JSON template.',
      icon: FileCode,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      href: '/admin/import/json',
      pipeline: 'JSON → Schema Validator → Live Preview → Database',
    },
    {
      title: 'Create Manually',
      badge: 'Full Control Visual Builder',
      description: 'Build Reading, Listening, Writing, or Speaking tests from scratch with our visual multi-step builder and rich HTML passage editor.',
      icon: PenTool,
      color: 'bg-primary/15 text-primary border-primary/30',
      href: '/admin/tests/create',
      pipeline: 'Manual → Sections → Questions → Instant Preview',
    },
  ]

  const getReviewLink = (job: any) => {
    switch (job.source_type) {
      case 'html':
        return '/admin/import/html'
      case 'pdf':
        return '/admin/import/pdf'
      case 'audio':
        return '/admin/import/audio'
      case 'json':
        return '/admin/import/json'
      default:
        return '/admin/import/pdf'
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 w-full min-w-0">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Content Import Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Unified ingestion hub for FOX FORD IELTS platform. Automatically convert PDFs, audio files, HTML, and JSON schemas into structured, data-driven tests.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-card border border-border hover:bg-secondary text-foreground text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh History</span>
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground font-semibold shrink-0 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 bg-card border border-border rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ingestion Channels</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg sm:text-xl font-black text-foreground">4 Pipelines</p>
          <p className="text-[11px] text-muted-foreground truncate">HTML, PDF, Audio, JSON</p>
        </div>

        <div className="p-3.5 sm:p-4 bg-card border border-border rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Parsing Engine</span>
            <Cpu className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-foreground">Gemini 3.1 & 3.8</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Online & Active
          </p>
        </div>

        <div className="p-3.5 sm:p-4 bg-card border border-border rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Ingested Jobs</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-foreground">{imports.length}</p>
          <p className="text-[11px] text-muted-foreground truncate">Saved to audit ledger</p>
        </div>

        <div className="p-3.5 sm:p-4 bg-card border border-border rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Passage Word Counter</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-foreground">Integrated</p>
          <p className="text-[11px] text-muted-foreground truncate">Rich HTML Editor active</p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {importOptions.map((opt) => {
          const Icon = opt.icon
          return (
            <Link
              key={opt.title}
              to={opt.href}
              className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between group text-left"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={cn('w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border', opt.color)}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                    {opt.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {opt.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  {opt.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-[10px] truncate max-w-[180px] sm:max-w-[200px]">
                  {opt.pipeline}
                </span>
                <span className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Imports History */}
      <div className="p-4 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Recent Ingestion Jobs</h2>
          <span className="text-xs text-muted-foreground">Real-time DB Import Audit</span>
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {imports.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent import jobs recorded. Select an import channel above to begin.
              </div>
            ) : (
              imports.map((job) => (
                <div key={job.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md font-bold uppercase text-[10px] shrink-0',
                        job.source_type === 'pdf'
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                          : job.source_type === 'audio'
                          ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                          : job.source_type === 'html'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      )}
                    >
                      {job.source_type}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {job.file_url || 'IELTS Content Document'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ID: {job.id.substring(0, 8)} • {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        job.status === 'review'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : job.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-secondary text-muted-foreground border border-border'
                      )}
                    >
                      {job.status === 'review' ? 'Needs Review' : job.status}
                    </span>

                    <Link
                      to={getReviewLink(job)}
                      className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-xs font-semibold transition-colors"
                    >
                      Open Channel
                    </Link>

                    {onDeleteJob && (
                      <button
                        type="button"
                        onClick={() => onDeleteJob(job.id)}
                        title="Delete record"
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminImportPage() {
  const [imports, setImports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchImports = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (err) {
        setError(err.message || 'Failed to load import records')
      } else {
        setImports(data || [])
      }
    } catch (e: any) {
      setError(e.message || 'Network error while loading imports')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this import history record?')) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      await fetch(`/api/admin/imports/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      })
      setImports((prev) => prev.filter((j) => j.id !== id))
    } catch (e) {
      console.error('Delete import record failed:', e)
    }
  }

  useEffect(() => {
    fetchImports()
  }, [])

  return (
    <ImportCenterView
      imports={imports}
      loading={loading}
      error={error}
      onDeleteJob={handleDeleteJob}
      onRefresh={fetchImports}
    />
  )
}