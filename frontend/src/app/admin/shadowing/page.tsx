import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClapperboardPlayIcon,
  StarsIcon,
  TrashBinMinimalisticIcon,
  Pen2Icon,
  CheckCircleIcon,
  CloseCircleIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  MagnifierIcon,
  ShieldCheckIcon,
  RestartIcon,
  VolumeLoudIcon,
  DocumentTextIcon,
  PlayStreamIcon,
  PlayCircleIcon,
  AddCircleIcon,
  ClockCircleIcon,
  GlobalIcon,
  LayersIcon,
  SquareAltArrowRightIcon,
  KeyMinimalisticIcon,
} from '@solar-icons/react/bold-duotone'
import { apiUrl } from '@/lib/api-config'
import { getStoredToken } from '@/lib/supabase/client'
import { useNotifications } from '@/context/notification-context'
import { SEOHead } from '@/components/seo/SEOHead'
import { cn } from '@/lib/utils'

export interface DialogueLine {
  id: string | number
  time: number | string
  seconds?: number
  start_seconds?: number
  end_seconds?: number
  end_time?: string
  duration_seconds?: number
  timing_quality?: 'exact' | 'approximate' | 'manual'
  is_approximate?: boolean
  speaker?: string
  character?: string
  text: string
  phonetic?: string
  translation?: string
  tip?: string
}

export interface ShadowingVideo {
  id: string
  title: string
  movie_title: string
  youtube_url: string
  youtube_id: string
  cefr_level: string
  accent: string
  duration: string
  description?: string
  dialogue_lines: DialogueLine[]
  is_active: boolean
  created_at: string
}

function parseLineSeconds(line: DialogueLine): number {
  if (typeof line.seconds === 'number' && !isNaN(line.seconds)) return line.seconds
  if (typeof line.start_seconds === 'number' && !isNaN(line.start_seconds)) return line.start_seconds
  if (typeof line.time === 'number' && !isNaN(line.time)) return line.time
  if (typeof line.time === 'string' && line.time.trim().length > 0) {
    const trimmed = line.time.trim()
    const parts = trimmed.split(':').map(Number)
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    const val = parseFloat(trimmed)
    if (!isNaN(val)) return val
  }
  return 0
}

function extractYoutubeId(urlOrId: string): string {
  if (!urlOrId) return ''
  const trimmed = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  )
  return match ? match[1] : trimmed
}

export default function AdminShadowingPage() {
  const { showToast } = useNotifications()

  const [videos, setVideos] = useState<ShadowingVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [accentFilter, setAccentFilter] = useState('all')

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<ShadowingVideo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formMovieTitle, setFormMovieTitle] = useState('')
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('')
  const [formCefrLevel, setFormCefrLevel] = useState('B2')
  const [formAccent, setFormAccent] = useState('American')
  const [formDuration, setFormDuration] = useState('2:00')
  const [formDescription, setFormDescription] = useState('')
  const [formLines, setFormLines] = useState<DialogueLine[]>([
    {
      id: '1',
      time: 5,
      speaker: 'Speaker',
      text: "Don't ever let somebody tell you you can't do something.",
      translation: "Hech qachon birov senga nimadir qila olmaysan deyishiga yo'l qo'yma.",
    },
  ])

  // Bulk paste state
  const [bulkInput, setBulkInput] = useState('')
  const [showBulkPaste, setShowBulkPaste] = useState(false)

  // AI Auto-Generator state
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiStatusMessage, setAiStatusMessage] = useState('')
  const [aiSuccessBadge, setAiSuccessBadge] = useState<string | null>(null)
  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('foxford_gemini_key') || ''
    }
    return ''
  })
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key)
    if (typeof window !== 'undefined') {
      localStorage.setItem('foxford_gemini_key', key.trim())
    }
  }

  const autoGenerateWithAi = async (urlOverride?: string) => {
    const rawUrl = (urlOverride || formYoutubeUrl).trim()
    if (!rawUrl) {
      showToast({
        title: 'YouTube havolasi kiritilmadi',
        message: 'Iltimos, avval YouTube video havolasini kiriting.',
        type: 'warning',
      })
      return
    }

    const yId = extractYoutubeId(rawUrl)
    if (!yId || yId.length !== 11) {
      showToast({
        title: "Noto'g'ri YouTube havola",
        message: "Haqiqiy YouTube video havolasini yoki 11 ta belgili ID sini kiriting.",
        type: 'warning',
      })
      return
    }

    setAiGenerating(true)
    setAiStatusMessage("Sun'iy intellekt videoning to'liq vaqti va dialoglarini tahlil qilmoqda...")
    setAiSuccessBadge(null)

    try {
      const token = getStoredToken()
      const res = await fetch(apiUrl('/api/shadowing/ai-generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          youtube_url: rawUrl,
          gemini_api_key: customApiKey.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "AI orqali ma'lumotlarni yaratib bo'lmadi")
      }

      const ai = json.data
      if (ai) {
        if (ai.movie_title) setFormMovieTitle(ai.movie_title)
        if (ai.title) setFormTitle(ai.title)
        if (ai.cefr_level) setFormCefrLevel(ai.cefr_level)
        if (ai.accent) setFormAccent(ai.accent)
        if (ai.duration) setFormDuration(ai.duration)
        if (ai.description) setFormDescription(ai.description)
        if (Array.isArray(ai.dialogue_lines) && ai.dialogue_lines.length > 0) {
          setFormLines(
            ai.dialogue_lines.map((l: any, i: number) => ({
              ...l,
              id: l.id || `line-${i + 1}`,
              time: parseLineSeconds(l),
              seconds: parseLineSeconds(l),
              start_seconds: parseLineSeconds(l),
            }))
          )
        }

        const count = ai.dialogue_lines?.length || 0
        setAiSuccessBadge(`✓ Haqiqiy audiodan ${count} ta sinxron dialog ajratildi! (${ai.duration})`)
        showToast({
          title: 'Nutq Muvaffaqiyatli Sinxronlandi! ✨',
          message: `"${ai.movie_title || 'Video'}" (${ai.duration}) uchun ${count} ta gap audiodan to'liq olindi.`,
          type: 'info',
        })
      }
    } catch (err: any) {
      console.error('AI generation error:', err)
      showToast({
        title: 'AI Bildirishnomasi',
        message: err.message || "AI bilan ma'lumotlarni to'ldirib bo'lmadi.",
        type: 'warning',
      })
    } finally {
      setAiGenerating(false)
      setAiStatusMessage('')
    }
  }

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/shadowing'))
      if (!res.ok) throw new Error('Failed to fetch videos')
      const data = await res.json()
      setVideos(data.videos || [])
    } catch (err: any) {
      console.error(err)
      showToast({
        title: 'Error loading clips',
        message: err.message || 'Could not fetch movie shadowing videos.',
        type: 'warning',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const openAddModal = () => {
    setEditingVideo(null)
    setFormTitle('')
    setFormMovieTitle('')
    setFormYoutubeUrl('')
    setFormCefrLevel('B2')
    setFormAccent('American')
    setFormDuration('2:00')
    setFormDescription('')
    setAiGenerating(false)
    setAiStatusMessage('')
    setAiSuccessBadge(null)
    setFormLines([
      {
        id: 'line-1',
        time: 5,
        speaker: 'Speaker',
        text: 'Dialogue will be automatically generated by AI when you paste link.',
        translation: "Havolani yuklaganingizda AI avtomatik tarzda dialoglarni to'ldiradi.",
      },
    ])
    setBulkInput('')
    setShowBulkPaste(false)
    setModalOpen(true)
  }

  const openEditModal = (video: ShadowingVideo) => {
    setEditingVideo(video)
    setFormTitle(video.title)
    setFormMovieTitle(video.movie_title)
    setFormYoutubeUrl(video.youtube_url)
    setFormCefrLevel(video.cefr_level || 'B2')
    setFormAccent(video.accent || 'American')
    setFormDuration(video.duration || '2:00')
    setFormDescription(video.description || '')
    setFormLines(
      Array.isArray(video.dialogue_lines) && video.dialogue_lines.length > 0
        ? video.dialogue_lines.map((l, i) => ({
            ...l,
            id: l.id || `line-${i + 1}`,
            time: parseLineSeconds(l),
            speaker: l.speaker || l.character || 'Speaker',
          }))
        : [
            {
              id: 'line-1',
              time: 5,
              speaker: 'Character',
              text: 'Dialogue line here',
            },
          ]
    )
    setBulkInput('')
    setShowBulkPaste(false)
    setModalOpen(true)
  }

  const handleAddLine = () => {
    const lastSec = formLines.length > 0 ? parseLineSeconds(formLines[formLines.length - 1]) : 0
    const nextTime = lastSec + 6
    setFormLines([
      ...formLines,
      {
        id: `line-${Date.now()}`,
        time: nextTime,
        speaker: formLines.length > 0 ? (formLines[formLines.length - 1].speaker || 'Speaker') : 'Speaker',
        text: '',
        translation: '',
      },
    ])
  }

  const handleRemoveLine = (idx: number) => {
    if (formLines.length <= 1) {
      showToast({
        title: 'At least one line',
        message: 'A shadowing clip must have at least one dialogue line.',
        type: 'warning',
      })
      return
    }
    setFormLines(formLines.filter((_, i) => i !== idx))
  }

  const handleLineChange = (idx: number, field: keyof DialogueLine, value: any) => {
    setFormLines((prev) => {
      const updated = [...prev]
      if (!updated[idx]) return prev
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const handleLineTimeChange = (idx: number, rawVal: string) => {
    setFormLines((prev) => {
      const updated = [...prev]
      if (!updated[idx]) return prev
      if (rawVal === '') {
        updated[idx] = {
          ...updated[idx],
          time: '',
          seconds: 0,
          start_seconds: 0,
        }
      } else {
        const num = parseFloat(rawVal)
        const validNum = isNaN(num) ? 0 : Math.max(0, Math.round(num * 10) / 10)
        updated[idx] = {
          ...updated[idx],
          time: validNum,
          seconds: validNum,
          start_seconds: validNum,
        }
      }
      return updated
    })
  }

  const handleApplyBulkScript = () => {
    if (!bulkInput.trim()) return
    const rawLines = bulkInput.split('\n').filter((l) => l.trim().length > 0)
    let currentTime = 5
    const parsed: DialogueLine[] = rawLines.map((raw, idx) => {
      let speaker = 'Speaker'
      let text = raw.trim()

      if (raw.includes(':')) {
        const parts = raw.split(':')
        speaker = parts[0].trim()
        text = parts.slice(1).join(':').trim()
      } else if (raw.includes('|')) {
        const parts = raw.split('|')
        speaker = parts[1]?.trim() || 'Speaker'
        text = parts.slice(2).join('|').trim() || parts[0].trim()
      }

      const item: DialogueLine = {
        id: `bulk-${idx + 1}-${Date.now()}`,
        time: currentTime,
        seconds: currentTime,
        start_seconds: currentTime,
        speaker,
        text,
      }
      currentTime += 6
      return item
    })

    if (parsed.length > 0) {
      setFormLines(parsed)
      setShowBulkPaste(false)
      showToast({
        title: 'Script Parsed',
        message: `${parsed.length} lines imported cleanly into the editor.`,
        type: 'info',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formMovieTitle.trim() || !formYoutubeUrl.trim()) {
      showToast({
        title: 'Validation Error',
        message: 'Please fill in Scene Title, Movie Title, and a YouTube Link.',
        type: 'warning',
      })
      return
    }

    const yId = extractYoutubeId(formYoutubeUrl)
    if (!yId || yId.length < 5) {
      showToast({
        title: 'Invalid YouTube link',
        message: 'Could not extract a valid YouTube video ID.',
        type: 'warning',
      })
      return
    }

    const validLines = formLines.filter((l) => l.text.trim().length > 0)
    if (validLines.length === 0) {
      showToast({
        title: 'Script required',
        message: 'Please add at least one dialogue line.',
        type: 'warning',
      })
      return
    }

    setSubmitting(true)
    const token = getStoredToken()

    try {
      const payload = {
        title: formTitle.trim(),
        movie_title: formMovieTitle.trim(),
        youtube_url: formYoutubeUrl.trim(),
        cefr_level: formCefrLevel,
        accent: formAccent,
        duration: formDuration.trim() || '2:00',
        description: formDescription.trim(),
        dialogue_lines: validLines.map((l, i) => {
          const sec = parseLineSeconds(l)
          const m = Math.floor(sec / 60)
          const s = (sec % 60).toFixed(1)
          const formattedTime = `${m}:${(sec % 60) < 10 ? '0' : ''}${s}`

          return {
            id: i + 1,
            time: formattedTime,
            seconds: sec,
            start_seconds: sec,
            end_seconds: typeof l.end_seconds === 'number' ? l.end_seconds : undefined,
            end_time: l.end_time || undefined,
            timing_quality: l.timing_quality || 'exact',
            is_approximate: l.is_approximate ?? false,
            speaker: l.speaker || 'Speaker',
            character: l.speaker || 'Speaker',
            text: l.text.trim(),
            translation: l.translation?.trim() || '',
            tip: l.tip?.trim() || '',
          }
        }),
      }

      let res
      if (editingVideo) {
        res = await fetch(apiUrl(`/api/shadowing/${editingVideo.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(apiUrl('/api/shadowing'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')

      showToast({
        title: editingVideo ? 'Updated 🎬' : 'Published 🎬',
        message: `"${formTitle}" is updated successfully.`,
        type: 'info',
      })

      setModalOpen(false)
      fetchVideos()
    } catch (err: any) {
      showToast({
        title: 'Operation Failed',
        message: err.message || 'Could not save movie clip.',
        type: 'warning',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const token = getStoredToken()
    try {
      const res = await fetch(apiUrl(`/api/shadowing/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')

      showToast({
        title: 'Deleted',
        message: 'Movie clip removed successfully.',
        type: 'info',
      })
      setDeleteConfirmId(null)
      setVideos(videos.filter((v) => v.id !== id))
    } catch (err: any) {
      showToast({
        title: 'Error',
        message: err.message || 'Failed to delete clip.',
        type: 'warning',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Filtered list
  const filteredVideos = videos.filter((v) => {
    const q = search.trim().toLowerCase()
    const matchesSearch =
      q === '' ||
      v.title.toLowerCase().includes(q) ||
      v.movie_title.toLowerCase().includes(q)

    const matchesLevel =
      levelFilter === 'all' || v.cefr_level.toUpperCase() === levelFilter.toUpperCase()

    const matchesAccent =
      accentFilter === 'all' || v.accent.toLowerCase() === accentFilter.toLowerCase()

    return matchesSearch && matchesLevel && matchesAccent
  })

  const previewYoutubeId = extractYoutubeId(formYoutubeUrl)

  return (
    <>
      <SEOHead
        title="Admin Movie Shadowing - EduFox"
        description="Curate and manage YouTube movie clips with synchronized scripts for student speaking practice."
      />

      <div className="w-full pb-16 px-4 sm:px-6 lg:px-8 pt-2 select-none space-y-4">
        {/* 1. MINIMALIST TOP HEADER (No heavy bulky banners or giant gradients) */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-normal text-slate-400">
              <Link to="/admin" className="hover:text-slate-700 dark:hover:text-white transition-colors">
                Admin
              </Link>
              <span>/</span>
              <span>IELTS Content</span>
              <span>/</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">Movie Shadowing</span>
            </div>

            <div className="flex items-center gap-2.5">
              <ClapperboardPlayIcon className="w-5 h-5 text-amber-500 shrink-0" size={20} />
              <h1 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white truncate">
                Movie Shadowing Management
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[11px] font-normal bg-slate-100 dark:bg-slate-800 text-slate-500">
                {videos.length} clips live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/speaking/shadowing"
              target="_blank"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-normal text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <PlayStreamIcon className="w-4 h-4 text-emerald-500" size={16} />
              <span>Student Studio</span>
              <SquareAltArrowRightIcon className="w-3.5 h-3.5 text-slate-400" size={14} />
            </Link>

            <button
              type="button"
              onClick={openAddModal}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <AddCircleIcon className="w-4 h-4" size={16} />
              <span>Add Movie Clip</span>
            </button>
          </div>
        </header>

        {/* 2. MINIMALIST SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <MagnifierIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search movie title or scene name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-normal text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="A2">A2 Elementary</option>
              <option value="B1">B1 Intermediate</option>
              <option value="B2">B2 Upper Int</option>
              <option value="C1">C1 Advanced</option>
            </select>

            {/* Accent Filter */}
            <select
              value={accentFilter}
              onChange={(e) => setAccentFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-normal text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Accents</option>
              <option value="american">American</option>
              <option value="british">British</option>
              <option value="australian">Australian</option>
              <option value="canadian">Canadian</option>
              <option value="global">Global</option>
            </select>

            <button
              type="button"
              onClick={fetchVideos}
              title="Refresh clips"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
            >
              <RestartIcon className={cn('w-4 h-4', loading && 'animate-spin')} size={16} />
            </button>
          </div>
        </div>

        {/* 3. CLEAN VIDEO CLIPS GRID (Lightweight & Minimalist) */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RestartIcon className="w-6 h-6 animate-spin text-amber-500" size={24} />
            <p className="text-xs font-normal">Loading clips...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <ClapperboardPlayIcon className="w-8 h-8 text-slate-300 mx-auto" size={32} />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                No movie clips found
              </p>
              <p className="text-xs font-normal text-slate-400">
                {search || levelFilter !== 'all' || accentFilter !== 'all'
                  ? 'Try clearing your search query or filters.'
                  : 'Start by adding your first YouTube movie clip with dialogue scripts.'}
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-medium"
            >
              <AddCircleIcon className="w-3.5 h-3.5" size={14} />
              <span>Add Clip Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => {
              const yId = video.youtube_id || extractYoutubeId(video.youtube_url)
              const thumbUrl = `https://img.youtube.com/vi/${yId}/hqdefault.jpg`
              const lineCount = video.dialogue_lines?.length || 0

              return (
                <div
                  key={video.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
                >
                  {/* Top Thumbnail */}
                  <div>
                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                      <img
                        src={thumbUrl}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        onError={(e) => {
                          ;(e.target as any).src =
                            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500 text-slate-950">
                          {video.cefr_level || 'B2'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-black/60 text-white backdrop-blur-xs">
                          {video.accent}
                        </span>
                      </div>

                      {/* Duration Tag */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-black/70 text-slate-200">
                        <ClockCircleIcon className="w-3 h-3 text-amber-400" size={12} />
                        <span>{video.duration || '2:00'}</span>
                      </div>

                      <div className="absolute bottom-2 left-2 right-16 truncate">
                        <p className="text-[11px] font-medium text-amber-300 truncate">
                          {video.movie_title}
                        </p>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3.5 space-y-2">
                      <div>
                        <h3 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-xs font-normal text-slate-400 line-clamp-1 mt-0.5">
                            {video.description}
                          </p>
                        )}
                      </div>

                      {/* Scripted Lines Preview */}
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-normal">
                          <LayersIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
                          <span>{lineCount} scripted lines</span>
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          ID: {video.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-1">
                    <Link
                      to={`/speaking/shadowing?video=${video.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                      title="Test speech recording in Studio"
                    >
                      <PlayCircleIcon className="w-3.5 h-3.5" size={14} />
                      <span>Test in Studio</span>
                    </Link>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(video)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                        title="Edit clip & script"
                      >
                        <Pen2Icon className="w-4 h-4" size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(video.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete clip"
                      >
                        <TrashBinMinimalisticIcon className="w-4 h-4" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 4. DELETE CONFIRMATION DIALOG */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <TrashBinMinimalisticIcon className="w-5 h-5" size={20} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  Delete Movie Scene?
                </h3>
                <p className="text-xs font-normal text-slate-400">
                  This will remove the clip and its synchronized lines from the curriculum.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. ADD / EDIT VIDEO MODAL (Clean, Lightweight & Minimalist) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2.5">
                  <ClapperboardPlayIcon className="w-5 h-5 text-amber-500" size={20} />
                  <div>
                    <h2 className="text-sm font-medium text-slate-900 dark:text-white">
                      {editingVideo ? 'Edit Movie Clip & Script' : 'Add YouTube Movie Clip'}
                    </h2>
                    <p className="text-[11px] font-normal text-slate-400">
                      Curate YouTube link and dialogue script lines for students.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <CloseCircleIcon className="w-5 h-5" size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Video Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* YouTube URL & AI Auto-Generate Hub */}
                  <div className="md:col-span-2 space-y-2 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                        <ClapperboardPlayIcon className="w-4 h-4 text-amber-500" size={16} />
                        <span>YouTube Video Link *</span>
                      </label>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                        ✨ Faqat linkni yuklang — AI o'zi hamma narsani to'ldirib beradi
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Paste YouTube link here (masalan: https://www.youtube.com/watch?v=...)"
                          value={formYoutubeUrl}
                          onChange={(e) => {
                            setFormYoutubeUrl(e.target.value)
                            if (aiSuccessBadge) setAiSuccessBadge(null)
                          }}
                          onPaste={(e) => {
                            const pasted = e.clipboardData.getData('text')
                            if (pasted && extractYoutubeId(pasted).length === 11) {
                              setTimeout(() => {
                                autoGenerateWithAi(pasted)
                              }, 150)
                            }
                          }}
                          className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-normal"
                        />
                        {formYoutubeUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormYoutubeUrl('')
                              setAiSuccessBadge(null)
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <CloseCircleIcon className="w-3.5 h-3.5" size={14} />
                          </button>
                        )}
                      </div>

                      {/* AI Auto-Generate Trigger Button */}
                      <button
                        type="button"
                        disabled={aiGenerating || !formYoutubeUrl.trim()}
                        onClick={() => autoGenerateWithAi()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-medium transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                        title="AI orqali klip ma'lumotlari va sinxron dialoglarni avtomatik yaratish"
                      >
                        <StarsIcon className={cn('w-4 h-4', aiGenerating && 'animate-spin')} size={16} />
                        <span>{aiGenerating ? "AI tahlil qilmoqda..." : "AI Auto-Generate"}</span>
                      </button>
                    </div>

                    {/* Optional Gemini API Key Settings */}
                    <div className="pt-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <KeyMinimalisticIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
                          <span>
                            {showApiKeyInput ? "API kalit sozlamasini yashirish" : "Gemini API kaliti (ixtiyoriy)"}
                          </span>
                        </button>
                        {customApiKey && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            ✓ Shaxsiy kalit kiritilgan
                          </span>
                        )}
                      </div>

                      {showApiKeyInput && (
                        <div className="mt-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <label className="text-[10px] text-slate-400 block">
                            Shaxsiy Google Gemini API kalitingiz (brauzeringizda saqlanadi):
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="password"
                              placeholder="AIzaSy..."
                              value={customApiKey}
                              onChange={(e) => handleSaveApiKey(e.target.value)}
                              className="flex-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                            />
                            {customApiKey && (
                              <button
                                type="button"
                                onClick={() => handleSaveApiKey('')}
                                className="px-2 py-1 text-[11px] text-rose-500 hover:underline"
                              >
                                Tozalash
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Loading State */}
                    {aiGenerating && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 font-normal">
                        <RestartIcon className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" size={14} />
                        <span>{aiStatusMessage || "Sun'iy intellekt videoni tahlil qilib, dialoglarni yaratmoqda..."}</span>
                      </div>
                    )}

                    {/* AI Success Confirmation Badge */}
                    {aiSuccessBadge && !aiGenerating && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-normal">
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" size={14} />
                          <span>{aiSuccessBadge}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiSuccessBadge(null)}
                          className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200"
                        >
                          <CloseCircleIcon className="w-3 h-3" size={12} />
                        </button>
                      </div>
                    )}

                    {/* YouTube Embed preview if valid */}
                    {previewYoutubeId && previewYoutubeId.length === 11 && (
                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-28 aspect-video rounded-md overflow-hidden bg-black shrink-0 relative">
                          <iframe
                            src={`https://www.youtube.com/embed/${previewYoutubeId}?controls=1`}
                            title="Preview"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; encrypted-media"
                          />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5" size={14} />
                            <span>YouTube Video Ulandi</span>
                          </span>
                          <p className="text-slate-400 text-[11px]">Video ID: {previewYoutubeId}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                            Ushbu klip talabalar uchun 1:1 real-time sinxronizatsiyada ishlaydi.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Movie Title */}
                  <div className="space-y-1">
                    <label className="font-normal text-slate-700 dark:text-slate-300">
                      Movie Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dead Poets Society"
                      value={formMovieTitle}
                      onChange={(e) => setFormMovieTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Scene Title */}
                  <div className="space-y-1">
                    <label className="font-normal text-slate-700 dark:text-slate-300">
                      Scene Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Carpe Diem Speech"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* CEFR Level */}
                  <div className="space-y-1">
                    <label className="font-normal text-slate-700 dark:text-slate-300">
                      CEFR Level
                    </label>
                    <select
                      value={formCefrLevel}
                      onChange={(e) => setFormCefrLevel(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="A2">A2 Elementary</option>
                      <option value="B1">B1 Intermediate</option>
                      <option value="B2">B2 Upper Int</option>
                      <option value="C1">C1 Advanced</option>
                    </select>
                  </div>

                  {/* Accent */}
                  <div className="space-y-1">
                    <label className="font-normal text-slate-700 dark:text-slate-300">
                      Accent
                    </label>
                    <select
                      value={formAccent}
                      onChange={(e) => setFormAccent(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="American">American English</option>
                      <option value="British">British English</option>
                      <option value="Australian">Australian English</option>
                      <option value="Canadian">Canadian English</option>
                      <option value="Global">Global / Neutral</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <label className="font-normal text-slate-700 dark:text-slate-300">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2:20"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="font-normal text-slate-700 dark:text-slate-300">
                      Context / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Brief scene background..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Script Builder Section */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                      <LayersIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
                      <span>Dialogue Script ({formLines.length} lines)</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkPaste(!showBulkPaste)}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      >
                        {showBulkPaste ? 'Hide Bulk Paste' : 'Bulk Paste'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                      >
                        <AddCircleIcon className="w-3.5 h-3.5" size={14} />
                        <span>Add Line</span>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Paste Textarea */}
                  {showBulkPaste && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
                      <p className="text-[11px] text-slate-400">
                        Paste script lines (e.g. <code>Speaker: Spoken text</code>):
                      </p>
                      <textarea
                        rows={3}
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder={`John Keating: They're not that different from you, are they?\nJohn Keating: Invincible, just like you feel.`}
                        className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowBulkPaste(false)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyBulkScript}
                          className="px-3 py-1 rounded bg-amber-500 text-slate-950 text-xs font-medium"
                        >
                          Parse Lines
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lines list */}
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {formLines.map((line, idx) => (
                      <div
                        key={line.id || idx}
                        className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-slate-400 text-[11px]">#{idx + 1}</span>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <span>Sec:</span>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                value={
                                  line.time === ''
                                    ? ''
                                    : typeof line.time === 'number'
                                    ? line.time
                                    : parseLineSeconds(line)
                                }
                                onChange={(e) => handleLineTimeChange(idx, e.target.value)}
                                className="w-16 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-center"
                              />
                            </div>

                            <input
                              type="text"
                              placeholder="Speaker"
                              value={line.speaker || line.character || ''}
                              onChange={(e) => handleLineChange(idx, 'speaker', e.target.value)}
                              className="w-28 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-normal"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Remove line"
                            >
                              <TrashBinMinimalisticIcon className="w-3.5 h-3.5" size={14} />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          required
                          placeholder="Spoken English sentence..."
                          value={line.text}
                          onChange={(e) => handleLineChange(idx, 'text', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />

                        <input
                          type="text"
                          placeholder="Translation (optional)..."
                          value={line.translation || ''}
                          onChange={(e) => handleLineChange(idx, 'translation', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-normal text-slate-500 dark:text-slate-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-normal text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingVideo ? 'Update Clip' : 'Publish Clip'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
