import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  PlusCircle,
  Copy,
  Trash2,
  Eye,
  Edit,
  Archive,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
} from 'lucide-react'
import { duplicateTest, deleteTest, updateTestStatus } from '@/actions/admin'
import { cn } from '@/lib/utils'

interface AdminTestsViewProps {
  initialTests: any[]
}

export function AdminTestsView({ initialTests }: AdminTestsViewProps) {
  const navigate = useNavigate()
  const [tests, setTests] = useState<any[]>(initialTests)
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [accessFilter, setAccessFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [sortField, setSortField] = useState<'created_at' | 'title' | 'total_questions'>('created_at')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    if (initialTests) {
      setTests(initialTests)
    }
  }, [initialTests])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Action states
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Filtering
  const filteredTests = tests.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesTitle = t.title?.toLowerCase().includes(q)
      const matchesDesc = t.description?.toLowerCase().includes(q)
      if (!matchesTitle && !matchesDesc) return false
    }
    if (skillFilter !== 'all' && t.skill !== skillFilter) return false
    if (typeFilter !== 'all' && t.ielts_type !== typeFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (accessFilter !== 'all') {
      const isPrem = accessFilter === 'premium'
      if (t.is_premium !== isPrem) return false
    }
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false
    return true
  })

  // Sorting
  const sortedTests = [...filteredTests].sort((a, b) => {
    let valA = a[sortField] || ''
    let valB = b[sortField] || ''
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }
    return sortAsc ? valA - valB : valB - valA
  })

  // Pagination calculation
  const totalPages = Math.ceil(sortedTests.length / pageSize) || 1
  const paginatedTests = sortedTests.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Handle Duplicate Test
  const handleDuplicate = async (testId: string) => {
    try {
      setLoadingId(testId)
      const cloned = await duplicateTest(testId)
      setTests([cloned, ...tests])
      setActionMessage(`Test duplicated successfully as "${cloned.title}"!`)
      setTimeout(() => setActionMessage(null), 4000)
    } catch (err: any) {
      alert(`Error duplicating test: ${err.message}`)
    } finally {
      setLoadingId(null)
    }
  }

  // Handle Delete Test
  const handleDelete = async (testId: string) => {
    try {
      setLoadingId(testId)
      await deleteTest(testId)
      setTests(tests.filter((t) => t.id !== testId))
      setDeleteConfirmId(null)
      setActionMessage('Test removed permanently.')
      setTimeout(() => setActionMessage(null), 4000)
    } catch (err: any) {
      alert(`Error deleting test: ${err.message}`)
    } finally {
      setLoadingId(null)
    }
  }

  // Handle Status Update (Publish / Draft / Archive)
  const handleStatusChange = async (testId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      setLoadingId(testId)
      await updateTestStatus(testId, newStatus)
      setTests(tests.map((t) => (t.id === testId ? { ...t, status: newStatus } : t)))
      setActionMessage(`Test status changed to ${newStatus}.`)
      setTimeout(() => setActionMessage(null), 3000)
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`)
    } finally {
      setLoadingId(null)
    }
  }

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'reading':
        return <BookOpen className="w-3.5 h-3.5 text-amber-600" />
      case 'listening':
        return <Headphones className="w-3.5 h-3.5 text-indigo-600" />
      case 'writing':
        return <PenTool className="w-3.5 h-3.5 text-cyan-600" />
      case 'speaking':
        return <Mic className="w-3.5 h-3.5 text-orange-600" />
        return <Mic className="w-3.5 h-3.5 text-orange-500" />
      default:
        return <Sparkles className="w-3.5 h-3.5 text-primary" />
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Action Toast Alert */}
      {actionMessage && (
        <div className="p-4 bg-primary/10 border border-primary/20 text-foreground rounded-2xl flex items-center justify-between text-xs font-bold fox-shadow-sm animate-in fade-in slide-in-from-top-2">
          <span>✓ {actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-muted-foreground hover:text-foreground font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">IELTS Tests Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
            Create, edit, duplicate, preview, and publish IELTS tests.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/tasks"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold transition-all"
          >
            <PenTool className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>Tasks</span>
          </Link>
          <Link to="/admin/tests/create"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold fox-shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Create Test</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-card border border-border rounded-2xl fox-shadow-sm space-y-3 w-full">
        {/* Search bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by test title or description..."
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-card transition-all"
          />
        </div>

        {/* Filters — 2 col on mobile, 5 col on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          <select
            value={skillFilter}
            onChange={(e) => { setSkillFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary w-full"
          >
            <option value="all">All Modules</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
            <option value="mock">Full Mock</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary w-full"
          >
            <option value="all">All Test Types</option>
            <option value="academic">Academic</option>
            <option value="general_training">General Training</option>
          </select>

          <select
            value={accessFilter}
            onChange={(e) => { setAccessFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary w-full"
          >
            <option value="all">All Access</option>
            <option value="free">Free</option>
            <option value="premium">⭐ Premium</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary w-full"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => { setDifficultyFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary w-full col-span-2 lg:col-span-1"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy (Band 5-6)</option>
            <option value="medium">Medium (Band 6.5-7.5)</option>
            <option value="hard">Hard (Band 8.0+)</option>
          </select>
        </div>
      </div>


      {/* Tests Data Table */}
      <div className="bg-card border border-border rounded-2xl fox-shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th
                  onClick={() => {
                    setSortField('title')
                    setSortAsc(!sortAsc)
                  }}
                  className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Test Title</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Access</th>
                <th className="p-3.5">Difficulty</th>
                <th
                  onClick={() => {
                    setSortField('total_questions')
                    setSortAsc(!sortAsc)
                  }}
                  className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Questions</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Status</th>
                <th
                  onClick={() => {
                    setSortField('created_at')
                    setSortAsc(!sortAsc)
                  }}
                  className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Created Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground mx-auto">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">No IELTS tests found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {search || skillFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || accessFilter !== 'all' || difficultyFilter !== 'all'
                            ? 'No tests match your current filter criteria. Try resetting filters.'
                            : 'No tests have been created in the database yet.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {(search || skillFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || accessFilter !== 'all' || difficultyFilter !== 'all') ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch('')
                              setSkillFilter('all')
                              setTypeFilter('all')
                              setStatusFilter('all')
                              setAccessFilter('all')
                              setDifficultyFilter('all')
                              setCurrentPage(1)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>Reset Filters</span>
                          </button>
                        ) : (
                          <Link
                            to="/admin/tests/create"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-2xs"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Create First Test</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTests.map((t) => {
                  const isBusy = loadingId === t.id
                  return (
                    <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                      {/* Title */}
                      <td className="p-3.5 font-bold text-foreground min-w-[240px]">
                        <Link to={`/admin/tests/${t.id}/edit`} className="hover:text-primary transition-colors">
                          {t.title}
                        </Link>
                        {t.description && (
                          <p className="text-[11px] font-normal text-muted-foreground line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </td>

                      {/* Module */}
                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-1.5 font-semibold text-foreground capitalize">
                          {getSkillIcon(t.skill)}
                          <span>{t.skill}</span>
                        </div>
                      </td>

                      {/* IELTS Type */}
                      <td className="p-3.5 text-muted-foreground capitalize">
                        {t.ielts_type === 'general_training' ? 'General Training' : 'Academic'}
                      </td>

                      {/* Access Badge */}
                      <td className="p-3.5">
                        {t.is_premium ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            ⭐ PREMIUM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            FREE
                          </span>
                        )}
                      </td>

                      {/* Difficulty */}
                      <td className="p-3.5 capitalize">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md font-semibold text-[10px] border',
                            t.difficulty === 'hard'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : t.difficulty === 'easy'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          )}
                        >
                          {t.difficulty || 'Medium'}
                        </span>
                      </td>

                      {/* Questions Count */}
                      <td className="p-3.5 font-semibold text-foreground">
                        {t.total_questions || 0} Qs
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border',
                            t.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : t.status === 'archived'
                              ? 'bg-secondary text-muted-foreground border-border'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          )}
                        >
                          {t.status === 'published' && <CheckCircle className="w-2.5 h-2.5" />}
                          {t.status === 'draft' && <Clock className="w-2.5 h-2.5" />}
                          <span>{t.status}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        {/* Student Preview */}
                        <Link to={`/admin/tests/${t.id}/preview`}
                          title="Preview Student View"
                          className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Edit */}
                        <Link to={`/admin/tests/${t.id}/edit`}
                          title="Edit Test & Questions"
                          className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => handleDuplicate(t.id)}
                          disabled={isBusy}
                          title="Duplicate Test"
                          className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Status Toggle (Publish / Unpublish) */}
                        {t.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(t.id, 'draft')}
                            disabled={isBusy}
                            title="Unpublish (Revert to Draft)"
                            className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(t.id, 'published')}
                            disabled={isBusy}
                            title="Publish Test"
                            className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Archive */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(t.id, 'archived')}
                          disabled={isBusy}
                          title="Archive Test"
                          className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(t.id)}
                          disabled={isBusy}
                          title="Delete Test"
                          className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing {sortedTests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedTests.length)} of {sortedTests.length} tests
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (Section 32) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95 text-foreground">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Confirm Test Deletion</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Are you sure you want to permanently delete this test? All questions, options, and student attempt records will be removed. We recommend <strong>Archiving</strong> instead of deleting published tests.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="h-8.5 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="h-8.5 px-3.5 rounded-xl text-xs font-bold text-destructive-foreground bg-destructive hover:bg-destructive/90 cursor-pointer shadow-2xs transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTests = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('tests')
        .select('*, questions(count)')
        .order('created_at', { ascending: false })

      if (err) throw err
      setTests(data || [])
    } catch (e: any) {
      console.error('Failed to load tests:', e)
      setError(e.message || 'Failed to fetch IELTS tests list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTests()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-card rounded-lg" />
            <div className="h-3 w-80 bg-card rounded" />
          </div>
          <div className="h-9 w-32 bg-card rounded-xl" />
        </div>

        {/* Filter bar Skeleton */}
        <div className="h-24 bg-card border border-border rounded-2xl p-4" />

        {/* Table Skeleton */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary/40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4 fox-shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Could Not Load Tests</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadTests}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return <AdminTestsView initialTests={tests} />
}