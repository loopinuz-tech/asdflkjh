import { useState, useEffect, useRef } from 'react'
import { createClient, getStoredToken } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import {
  PenTool,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Search,
  Clock,
  Crown,
  Lock,
  FileText,
  Sparkles,
  Mic,
  MessageSquare,
  AlertCircle,
  Image as ImageIcon,
  Check,
  RefreshCw,
  SlidersHorizontal,
  UploadCloud,
  Loader2,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface TaskItem {
  id: string
  title: string
  prompt_text: string
  skill: 'writing' | 'speaking'
  category: 'task_1' | 'task_2' | 'part_1' | 'part_2' | 'part_3'
  task_type?: 'task_1' | 'task_2'
  part_number?: number
  difficulty: 'easy' | 'medium' | 'hard'
  is_premium: boolean
  status: 'published' | 'draft'
  image_url?: string
  follow_up_questions?: string[]
  created_at: string
}

export function AdminTasksClient() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [visibleCount, setVisibleCount] = useState<number>(20)

  useEffect(() => {
    setVisibleCount(20)
  }, [search, categoryFilter, accessFilter, statusFilter])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Lightbox for image preview
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null)

  // Form states
  const [formType, setFormType] = useState<'task_1' | 'task_2' | 'part_1' | 'part_2' | 'part_3'>('task_1')
  const [formTitle, setFormTitle] = useState('')
  const [formPromptText, setFormPromptText] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formFollowUps, setFormFollowUps] = useState('')
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published')

  // Image Upload states
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageDragOver, setImageDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAllTasks = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const [wpRes, spRes] = await Promise.all([
        supabase
          .from('writing_prompts')
          .select('id, title, prompt_text, task_type, difficulty, is_premium, status, image_url, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('speaking_prompts')
          .select('id, title, prompt_text, part_number, difficulty, is_premium, status, follow_up_questions, created_at')
          .order('created_at', { ascending: false })
      ])

      const writingItems: TaskItem[] = (wpRes.data || []).map((w: any) => ({
        id: w.id,
        title: w.title,
        prompt_text: w.prompt_text || '',
        skill: 'writing',
        category: (w.task_type === 'task_2' || w.task_type === 'task2') ? 'task_2' : 'task_1',
        task_type: (w.task_type === 'task_2' || w.task_type === 'task2') ? 'task_2' : 'task_1',
        difficulty: w.difficulty || 'medium',
        is_premium: Boolean(w.is_premium),
        status: w.status || 'published',
        image_url: w.image_url || '',
        created_at: w.created_at,
      }))

      const speakingItems: TaskItem[] = (spRes.data || []).map((s: any) => {
        const pNum = Number(s.part_number) || 1
        const cat = pNum === 2 ? 'part_2' : pNum === 3 ? 'part_3' : 'part_1'
        return {
          id: s.id,
          title: s.title,
          prompt_text: s.prompt_text || '',
          skill: 'speaking',
          category: cat,
          part_number: pNum,
          difficulty: s.difficulty || 'medium',
          is_premium: Boolean(s.is_premium),
          status: s.status || 'published',
          follow_up_questions: Array.isArray(s.follow_up_questions) ? s.follow_up_questions : [],
          created_at: s.created_at,
        }
      })

      const combined = [...writingItems, ...speakingItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setTasks(combined)
    } catch (err: any) {
      console.error('Error loading tasks:', err)
      setActionNotice('Error loading tasks: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllTasks()
  }, [])

  const openCreateModal = () => {
    setEditingTask(null)
    setFormType('task_1')
    setFormTitle('')
    setFormPromptText('')
    setFormImageUrl('')
    setFormFollowUps('')
    setFormDifficulty('medium')
    setFormIsPremium(false)
    setFormStatus('published')
    setImageUploadMode('file')
    setUploadingImage(false)
    setUploadError(null)
    setImageDragOver(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsModalOpen(true)
  }

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task)
    setFormType(task.category)
    setFormTitle(task.title)
    setFormPromptText(task.prompt_text)
    setFormImageUrl(task.image_url || '')
    setFormFollowUps(task.follow_up_questions ? task.follow_up_questions.join('\n') : '')
    setFormDifficulty(task.difficulty)
    setFormIsPremium(task.is_premium)
    setFormStatus(task.status)
    setImageUploadMode('file')
    setUploadingImage(false)
    setUploadError(null)
    setImageDragOver(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsModalOpen(true)
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image formats are supported (PNG, JPG, JPEG, WEBP, SVG, GIF).')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size must not exceed 25MB.')
      return
    }

    setUploadError(null)
    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = getStoredToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `Server error: ${res.status}`)
      }

      const data = await res.json()
      if (data.fileUrl) {
        setFormImageUrl(data.fileUrl)
        setUploadError(null)
      } else {
        throw new Error('Image URL was not returned by server')
      }
    } catch (err: any) {
      console.error('Image upload failed:', err)
      setUploadError('Image upload error: ' + (err.message || 'Unknown error'))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setImageDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      alert('Please enter a task title.')
      return
    }

    if (uploadingImage) {
      alert('Please wait for the image upload to complete.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const isWriting = formType === 'task_1' || formType === 'task_2'

      if (isWriting) {
        const payload = {
          title: formTitle.trim(),
          prompt_text: formPromptText.trim(),
          task_type: formType,
          difficulty: formDifficulty,
          is_premium: formIsPremium,
          status: formStatus,
          image_url: formImageUrl.trim() || null,
        }

        if (editingTask && editingTask.skill === 'writing') {
          // Update
          await supabase.from('writing_prompts').update(payload).eq('id', editingTask.id)
          setActionNotice(`Writing task "${formTitle}" updated successfully!`)
        } else {
          // Insert
          await supabase.from('writing_prompts').insert(payload)
          setActionNotice(`New Writing task "${formTitle}" created successfully!`)
        }
      } else {
        // Speaking
        const partNum = formType === 'part_2' ? 2 : formType === 'part_3' ? 3 : 1
        const questionsArray = formFollowUps
          .split('\n')
          .map((q) => q.trim())
          .filter(Boolean)

        const payload = {
          title: formTitle.trim(),
          prompt_text: formPromptText.trim(),
          part_number: partNum,
          difficulty: formDifficulty,
          is_premium: formIsPremium,
          status: formStatus,
          follow_up_questions: questionsArray,
        }

        if (editingTask && editingTask.skill === 'speaking') {
          // Update
          await supabase.from('speaking_prompts').update(payload).eq('id', editingTask.id)
          setActionNotice(`Speaking topic "${formTitle}" updated successfully!`)
        } else {
          // Insert
          await supabase.from('speaking_prompts').insert(payload)
          setActionNotice(`New Speaking topic "${formTitle}" created successfully!`)
        }
      }

      setIsModalOpen(false)
      await loadAllTasks()
    } catch (err: any) {
      console.error('Error saving task:', err)
      alert('Error: ' + (err.message || 'Failed to save task'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (task: TaskItem) => {
    if (!task?.id) return
    const newStatus = task.status === 'published' ? 'draft' : 'published'
    const supabase = createClient()
    const table = task.skill === 'writing' ? 'writing_prompts' : 'speaking_prompts'

    try {
      await supabase.from(table).update({ status: newStatus }).eq('id', task.id)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      )
      setActionNotice(`Status updated to "${newStatus}"!`)
    } catch (err: any) {
      alert('Error updating status: ' + err.message)
    }
  }

  const handleDeleteTask = async (task: TaskItem) => {
    if (!task?.id) return
    const supabase = createClient()
    const table = task.skill === 'writing' ? 'writing_prompts' : 'speaking_prompts'

    try {
      await supabase.from(table).delete().eq('id', task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      setDeleteConfirmId(null)
      setActionNotice(`Task "${task.title}" deleted successfully!`)
    } catch (err: any) {
      alert('Error deleting task: ' + err.message)
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const matchTitle = t.title.toLowerCase().includes(q)
      const matchText = t.prompt_text.toLowerCase().includes(q)
      if (!matchTitle && !matchText) return false
    }

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'writing_all' && t.skill !== 'writing') return false
      if (categoryFilter === 'speaking_all' && t.skill !== 'speaking') return false
      if (
        categoryFilter !== 'writing_all' &&
        categoryFilter !== 'speaking_all' &&
        t.category !== categoryFilter
      ) {
        return false
      }
    }

    if (accessFilter === 'free' && t.is_premium) return false
    if (accessFilter === 'premium' && !t.is_premium) return false

    if (statusFilter !== 'all' && t.status !== statusFilter) return false

    return true
  })

  const visibleTasks = filteredTasks.slice(0, visibleCount)

  // Stats calculation
  const totalCount = tasks.length
  const writingCount = tasks.filter((t) => t.skill === 'writing').length
  const speakingCount = tasks.filter((t) => t.skill === 'speaking').length
  const publishedCount = tasks.filter((t) => t.status === 'published').length
  const premiumCount = tasks.filter((t) => t.is_premium).length

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Writing & Speaking Tasks</h1>
            <p className="text-xs text-muted-foreground">
              Manage IELTS Writing (Task 1 & 2) and Speaking (Part 1, 2 & 3) tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadAllTasks}
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-secondary/80 hover:bg-secondary border border-border rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className={buttonVariants({
              className:
                'h-8 px-3 bg-primary hover:bg-primary/90 text-black font-bold shadow-xs inline-flex items-center gap-1.5 text-xs cursor-pointer rounded-lg',
            })}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>


      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Total Tasks</p>
            <p className="text-lg font-bold">{totalCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Writing Tasks</p>
            <p className="text-lg font-bold">{writingCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Speaking Topics</p>
            <p className="text-lg font-bold">{speakingCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Live (Published)</p>
            <p className="text-lg font-bold text-emerald-600">{publishedCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Premium</p>
            <p className="text-lg font-bold text-orange-600">{premiumCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by task title or prompt text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Access Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as any)}
              className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Access</option>
              <option value="free">Free Only</option>
              <option value="premium">⭐ Premium Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Draft Only</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'writing_all', label: 'All Writing' },
            { id: 'task_1', label: 'Writing Task 1' },
            { id: 'task_2', label: 'Writing Task 2' },
            { id: 'speaking_all', label: 'All Speaking' },
            { id: 'part_1', label: 'Speaking Part 1' },
            { id: 'part_2', label: 'Speaking Part 2' },
            { id: 'part_3', label: 'Speaking Part 3' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer",
                categoryFilter === cat.id
                  ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                  : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs font-semibold">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">No tasks found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Adjust search keywords or filters, or create a new task.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className={buttonVariants({
              className: 'bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 cursor-pointer',
            })}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong className="text-foreground">{visibleTasks.length}</strong> of{' '}
              <strong className="text-foreground">{filteredTasks.length}</strong> tasks
            </span>
            {filteredTasks.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount(filteredTasks.length)}
                className="text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                Show all ({filteredTasks.length})
              </button>
            )}
          </div>

          {visibleTasks.map((task) => {
            const isWriting = task.skill === 'writing'
            const isTask1 = task.category === 'task_1'
            const isTask2 = task.category === 'task_2'
            const isPart1 = task.category === 'part_1'
            const isPart2 = task.category === 'part_2'
            const isPart3 = task.category === 'part_3'

            let typeBadgeStyle = 'bg-primary/10 text-primary border border-primary/20'
            let typeLabel = 'Task 1'

            if (isTask1) {
              typeBadgeStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              typeLabel = 'Writing Task 1'
            } else if (isTask2) {
              typeBadgeStyle = 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20'
              typeLabel = 'Writing Task 2'
            } else if (isPart1) {
              typeBadgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
              typeLabel = 'Speaking Part 1'
            } else if (isPart2) {
              typeBadgeStyle = 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
              typeLabel = 'Speaking Part 2'
            } else if (isPart3) {
              typeBadgeStyle = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
              typeLabel = 'Speaking Part 3'
            }

            const cleanSnippet = task.prompt_text.replace(/<[^>]+>/g, '').trim()
            const practiceUrl = isWriting ? `/writing/${task.id}` : `/speaking/${task.id}`

            return (
              <Card
                key={task.id}
                className="border-border fox-shadow-sm hover:border-primary/40 transition-colors group p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Optional Thumbnail for Image */}
                    {task.image_url ? (
                      <div
                        onClick={() => setPreviewLightboxUrl(task.image_url || null)}
                        className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-border shrink-0 cursor-pointer group/thumb hover:border-primary transition-all"
                        title="View full-size image"
                      >
                        <img
                          src={task.image_url}
                          alt={task.title}
                          className="w-full h-full object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                        {isWriting ? <FileText className="w-5 h-5 text-amber-500" /> : <Mic className="w-5 h-5 text-blue-500" />}
                      </div>
                    )}

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${typeBadgeStyle}`}>
                          {typeLabel}
                        </span>

                        {task.is_premium ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                            <Crown className="w-3 h-3 fill-current" /> Premium
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold uppercase">
                            Free
                          </span>
                        )}

                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider',
                            task.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          )}
                        >
                          {task.status}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground text-[10px] font-medium border border-border/50 uppercase">
                          {task.difficulty}
                        </span>

                        {task.image_url && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-md">
                            <ImageIcon className="w-3 h-3 text-primary" /> Has Image
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                        {task.title}
                      </h3>

                      {cleanSnippet && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {cleanSnippet}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {isTask1
                              ? '20 min · 150+ words'
                              : isTask2
                              ? '40 min · 250+ words'
                              : isPart2
                              ? '3-4 min (1 min prep)'
                              : '4-5 min'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    {/* Toggle Status */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      className="px-2.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      title={task.status === 'published' ? 'Switch to Draft' : 'Publish Task'}
                    >
                      {task.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(task)}
                      className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5 text-primary" />
                      <span>Edit</span>
                    </button>

                    {/* View in practice */}
                    <Link
                      to={practiceUrl}
                      target="_blank"
                      className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                      title="Preview as student"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Delete */}
                    {deleteConfirmId === task.id ? (
                      <div className="flex items-center gap-1 bg-destructive/10 p-1 rounded-xl border border-destructive/30">
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="px-2 py-1 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(task.id)}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredTasks.length > visibleCount && (
            <div className="pt-4 pb-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 20)}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <span>Load More</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-foreground/20 text-[11px] font-extrabold">
                  +{Math.min(20, filteredTasks.length - visibleCount)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(filteredTasks.length)}
                className="px-4 py-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer transition-colors"
              >
                Show All ({filteredTasks.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card text-card-foreground rounded-2xl sm:rounded-3xl w-[calc(100vw-1.5rem)] max-w-2xl p-4 sm:p-6 shadow-2xl border border-border flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <PenTool className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold">
                  {editingTask ? 'Edit Task / Prompt' : 'Create New IELTS Task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveTask} className="space-y-4 overflow-y-auto pr-1 py-3 flex-1">
              {/* Task Category Selection */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Task Category & Type <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('task_1')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      formType === 'task_1'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    Writing Task 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('task_2')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      formType === 'task_2'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    Writing Task 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('part_1')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      formType === 'part_1'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    Speaking Part 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('part_2')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      formType === 'part_2'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    Speaking Part 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('part_3')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      formType === 'part_3'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    Speaking Part 3
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Task Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    formType.startsWith('task')
                      ? 'e.g. Hydroelectric Power Generation Process or AI in the Workplace'
                      : 'e.g. Hometown and Living Environment or An Unplanned Journey'
                  }
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Prompt Text */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Task Prompt / Question Text <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formPromptText}
                  onChange={(e) => setFormPromptText(e.target.value)}
                  placeholder="Enter complete task instructions, prompt text, and questions..."
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              {/* IMAGE UPLOAD & ATTACHMENT SECTION (For Writing Task 1 & optional for others) */}
              {(formType === 'task_1' || formType === 'task_2') && (
                <div className="space-y-2 rounded-2xl border border-border/80 bg-secondary/20 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>{formType === 'task_1' ? 'Chart / Graph Image' : 'Task Image (Optional)'}</span>
                      {formType === 'task_1' && (
                        <span className="text-amber-500 text-[11px] font-semibold">(Essential for Task 1)</span>
                      )}
                    </label>

                    {/* Mode switcher: Upload File VS URL */}
                    <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/50 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setImageUploadMode('file')
                          setUploadError(null)
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                          imageUploadMode === 'file'
                            ? "bg-card text-foreground shadow-2xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUploadMode('url')
                          setUploadError(null)
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                          imageUploadMode === 'url'
                            ? "bg-card text-foreground shadow-2xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  {/* If image is already attached, show preview with remove button */}
                  {formImageUrl ? (
                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={formImageUrl}
                            alt="Attached preview"
                            className="w-16 h-16 rounded-lg object-contain bg-black/5 dark:bg-white/5 border border-border shrink-0"
                            onError={(e) => {
                              // Image error fallback
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                            }}
                          />
                          <div className="space-y-1 min-w-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <Check className="w-3 h-3" /> Image attached
                            </span>
                            <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-md" title={formImageUrl}>
                              {formImageUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewLightboxUrl(formImageUrl)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormImageUrl('')
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {imageUploadMode === 'file' ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            setImageDragOver(true)
                          }}
                          onDragLeave={() => setImageDragOver(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2",
                            imageDragOver
                              ? "border-primary bg-primary/10"
                              : "border-border/80 hover:border-primary/50 bg-card/60 hover:bg-secondary/40",
                            uploadingImage && "pointer-events-none opacity-60"
                          )}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />

                          {uploadingImage ? (
                            <div className="flex flex-col items-center gap-2 py-2">
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                              <p className="text-xs font-semibold text-foreground">Uploading image...</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <UploadCloud className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">
                                  Click to choose image or drag and drop here
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  PNG, JPG, WEBP, SVG, GIF (max 25MB)
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <input
                            type="url"
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            placeholder="https://example.com/charts/ielts-task1-graph.png"
                            className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Enter direct URL link to an online image.
                          </p>
                        </div>
                      )}

                      {uploadError && (
                        <p className="text-[11px] text-destructive font-semibold mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{uploadError}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Optional Speaking Follow-up Questions */}
              {formType.startsWith('part') && (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Follow-up Questions / Cue Card Bullet Points (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formFollowUps}
                    onChange={(e) => setFormFollowUps(e.target.value)}
                    placeholder={"Where is your hometown located?\nWhat do you like most about living there?\nWould you recommend tourists visit your town?"}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary resize-y"
                  />
                </div>
              )}

              {/* Settings: Difficulty, Access, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="easy">Easy (Band 5-6)</option>
                    <option value="medium">Medium (Band 6.5-7.5)</option>
                    <option value="hard">Hard (Band 8-9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Access Level</label>
                  <select
                    value={formIsPremium ? 'premium' : 'free'}
                    onChange={(e) => setFormIsPremium(e.target.value === 'premium')}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="free">Free Access</option>
                    <option value="premium">⭐ Premium Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons (Sticky/Bottom) */}
              <div className="flex gap-2 pt-3 border-t border-border shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-opacity flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading image...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL RESOLUTION IMAGE LIGHTBOX */}
      {previewLightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewLightboxUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-card rounded-2xl overflow-hidden border border-border p-2 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 px-2 border-b border-border/60">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary" /> Image Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewLightboxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewLightboxUrl(null)}
                  className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center">
              <img
                src={previewLightboxUrl}
                alt="Full Graphic"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
