import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellIcon,
  VolumeLoudIcon,
  Pen2Icon,
  BookBookmarkIcon,
  CupStarIcon,
  DangerTriangleIcon,
  SendSquareIcon,
  UsersGroupTwoRoundedIcon,
  RestartIcon,
  MagnifierIcon,
  TrashBinMinimalisticIcon,
  AltArrowRightIcon,
  HistoryIcon,
  StarsIcon,
  CloseCircleIcon,
  CheckCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api-config'
import { getStoredToken } from '@/lib/supabase/client'
import { useNotifications } from '@/context/notification-context'
import { SEOHead } from '@/components/seo/SEOHead'
import { BANNER_COLOR_STYLES, getBannerSolarIcon } from '@/components/announcement/announcement-banner'
import { cn } from '@/lib/utils'

export const NOTIFICATION_CATEGORIES = [
  {
    id: 'system',
    label: 'System',
    sub: 'Announcements',
    icon: VolumeLoudIcon,
    activeColor: 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-bold',
    iconColor: 'text-amber-500',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'test',
    label: 'Mock Tests',
    sub: 'Exams & Scores',
    icon: Pen2Icon,
    activeColor: 'bg-blue-500 text-white border-blue-500 shadow-sm font-bold',
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    sub: 'Cards & SRS',
    icon: BookBookmarkIcon,
    activeColor: 'bg-emerald-500 text-white border-emerald-500 shadow-sm font-bold',
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'achievement',
    label: 'Achievement',
    sub: 'Ranks & Badges',
    icon: CupStarIcon,
    activeColor: 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-sm font-bold',
    iconColor: 'text-yellow-500',
    badgeColor: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  },
  {
    id: 'warning',
    label: 'Warning',
    sub: 'Important Alert',
    icon: DangerTriangleIcon,
    activeColor: 'bg-rose-500 text-white border-rose-500 shadow-sm font-bold',
    iconColor: 'text-rose-500',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
] as const

const BANNER_COLOR_OPTIONS = [
  {
    id: 'pink',
    label: 'Pink',
    desc: 'Vibrant Rose Gradient',
    preview: 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 text-white',
    ringColor: 'ring-pink-500',
  },
  {
    id: 'purple',
    label: 'Purple',
    desc: 'Rich Violet Gradient',
    preview: 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 text-white',
    ringColor: 'ring-purple-500',
  },
  {
    id: 'amber',
    label: 'Amber',
    desc: 'Warm Sunset Gradient',
    preview: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950',
    ringColor: 'ring-amber-500',
  },
  {
    id: 'blue',
    label: 'Blue',
    desc: 'Professional Indigo Gradient',
    preview: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white',
    ringColor: 'ring-blue-500',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    desc: 'Fresh Mint Gradient',
    preview: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white',
    ringColor: 'ring-emerald-500',
  },
] as const

const BANNER_ICON_OPTIONS = [
  { id: 'sparkles', label: 'Sparkles', icon: StarsIcon },
  { id: 'volume', label: 'Announcement', icon: VolumeLoudIcon },
  { id: 'bell', label: 'Alert Bell', icon: BellIcon },
  { id: 'cup', label: 'Trophy / Cup', icon: CupStarIcon },
  { id: 'danger', label: 'Warning', icon: DangerTriangleIcon },
] as const

type NotificationType = (typeof NOTIFICATION_CATEGORIES)[number]['id']

export default function AdminNotificationsPage() {
  const { showToast } = useNotifications()

  // Tab State
  const [adminTab, setAdminTab] = useState<'broadcast' | 'banner'>('banner')

  // --- 1. Broadcast Notification Form State ---
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<NotificationType>('system')
  const [link, setLink] = useState('')
  const [broadcast, setBroadcast] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Notification logs state
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [searchHistory, setSearchHistory] = useState('')

  // --- 2. Top Announcement Banner State ---
  const [bannerActive, setBannerActive] = useState<boolean>(true)
  const [bannerText, setBannerText] = useState<string>('New Cambridge 19 IELTS Mock Tests live! Test your skills now 🎯')
  const [bannerBadge, setBannerBadge] = useState<string>('NEW')
  const [bannerLinkUrl, setBannerLinkUrl] = useState<string>('/practice')
  const [bannerLinkText, setBannerLinkText] = useState<string>('Start Practice')
  const [bannerBgColor, setBannerBgColor] = useState<string>('pink')
  const [bannerIcon, setBannerIcon] = useState<string>('sparkles')
  const [bannerClosable, setBannerClosable] = useState<boolean>(true)
  const [savingBanner, setSavingBanner] = useState<boolean>(false)
  const [loadingBanner, setLoadingBanner] = useState<boolean>(false)

  const activeCategory = NOTIFICATION_CATEGORIES.find((c) => c.id === type) || NOTIFICATION_CATEGORIES[0]
  const ActiveIcon = activeCategory.icon

  // Fetch recent push notifications history
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const token = getStoredToken()
      if (!token) return

      const res = await fetch(apiUrl('/api/notifications?limit=30'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRecentNotifications(data.notifications || [])
      }
    } catch (err) {
      console.warn('Failed to load history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Fetch top announcement banner configuration
  const fetchBannerSettings = async () => {
    try {
      setLoadingBanner(true)
      const res = await fetch(apiUrl('/api/announcement-banner'))
      if (res.ok) {
        const data = await res.json()
        if (data.banner) {
          setBannerActive(Boolean(data.banner.is_active))
          setBannerText(data.banner.text || '')
          setBannerBadge(data.banner.badge_text || '')
          setBannerLinkUrl(data.banner.link_url || '')
          setBannerLinkText(data.banner.link_text || '')
          setBannerBgColor(data.banner.bg_color || 'pink')
          setBannerIcon(data.banner.icon || 'sparkles')
          setBannerClosable(data.banner.is_closable ?? true)
        }
      }
    } catch (err) {
      console.warn('Failed to load banner settings:', err)
    } finally {
      setLoadingBanner(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    fetchBannerSettings()
  }, [])

  // Send push notification handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      showToast({
        title: 'Validation Error',
        message: 'Please provide both title and message.',
        type: 'warning',
      })
      return
    }

    setSubmitting(true)
    try {
      const token = getStoredToken()
      const res = await fetch(apiUrl('/api/notifications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          link: link.trim() || null,
          broadcast,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch notification.')
      }

      showToast({
        title: broadcast ? 'Broadcast Dispatched! 🚀' : 'Notification Sent! ✅',
        message: broadcast
          ? 'Notification has been pushed to all platform users.'
          : 'Notification sent successfully.',
        type: 'success',
      })

      setTitle('')
      setMessage('')
      setLink('')
      setType('system')
      fetchHistory()
    } catch (err: any) {
      showToast({
        title: 'Dispatch Failed',
        message: err.message || 'Something went wrong.',
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Save announcement banner handler
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bannerText.trim()) {
      showToast({
        title: 'Validation Error',
        message: 'Please provide the announcement message text.',
        type: 'warning',
      })
      return
    }

    setSavingBanner(true)
    try {
      const token = getStoredToken()
      const res = await fetch(apiUrl('/api/announcement-banner'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: bannerActive,
          text: bannerText.trim(),
          badge_text: bannerBadge.trim(),
          link_url: bannerLinkUrl.trim(),
          link_text: bannerLinkText.trim(),
          bg_color: bannerBgColor,
          icon: bannerIcon,
          is_closable: bannerClosable,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save announcement banner.')
      }

      showToast({
        title: bannerActive ? 'Banner Published! 🚀' : 'Banner Saved! ✅',
        message: bannerActive
          ? 'Top announcement banner is now live and visible to all students.'
          : 'Banner settings saved successfully (currently inactive).',
        type: 'success',
      })

      // Dispatch global window event so local components refresh without reload
      window.dispatchEvent(new Event('edufox-banner-updated'))
    } catch (err: any) {
      showToast({
        title: 'Error',
        message: err.message || 'Failed to save banner settings.',
        type: 'error',
      })
    } finally {
      setSavingBanner(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notification record?')) return
    try {
      const token = getStoredToken()
      const res = await fetch(apiUrl(`/api/notifications/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setRecentNotifications((prev) => prev.filter((n) => n.id !== id))
        showToast({
          title: 'Deleted',
          message: 'Notification record removed.',
          type: 'info',
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredHistory = recentNotifications.filter((n) => {
    if (!searchHistory.trim()) return true
    const q = searchHistory.toLowerCase()
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q)
  })

  const previewStyle = BANNER_COLOR_STYLES[bannerBgColor] || BANNER_COLOR_STYLES.pink

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      <SEOHead title="Notifications & Banners — Admin" />

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
              <VolumeLoudIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Platform Notifications & Banners
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage top announcement banners and broadcast alerts to students
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 bg-secondary/60 rounded-2xl border border-border w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAdminTab('banner')}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer truncate',
              adminTab === 'banner'
                ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/25'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <StarsIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Top Announcement Banner</span>
            {bannerActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('broadcast')}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer truncate',
              adminTab === 'broadcast'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BellIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Broadcast Alerts</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TOP ANNOUNCEMENT BANNER                                            */}
      {/* ========================================================================= */}
      {adminTab === 'banner' && (
        <div className="space-y-6">
          {/* Top Banner Live Student Preview Bar */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-secondary/30 border border-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <StarsIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>Student Live Preview (Top Announcement Banner)</span>
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full self-start sm:self-auto',
                  bannerActive
                    ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'border-slate-500/40 text-muted-foreground'
                )}
              >
                {bannerActive ? '🟢 Live on Platform' : '⚪ Currently Inactive'}
              </Badge>
            </div>

            {/* Rendered Live Banner */}
            <div className="w-full overflow-hidden">
              <div
                className={cn(
                  'w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-none flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium transition-all shadow-md',
                  previewStyle.container
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-xs shrink-0 flex items-center justify-center">
                    {getBannerSolarIcon(bannerIcon, 'w-4 h-4 text-current')}
                  </div>

                  {bannerBadge && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0',
                        previewStyle.badge
                      )}
                    >
                      {bannerBadge}
                    </span>
                  )}

                  <span className="truncate font-semibold tracking-tight">
                    {bannerText || 'Your announcement message will appear here...'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                  {bannerLinkUrl && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0',
                        previewStyle.button
                      )}
                    >
                      <span>{bannerLinkText || 'Learn More'}</span>
                      <AltArrowRightIcon className="w-3 h-3" />
                    </span>
                  )}

                  {bannerClosable && (
                    <div className="p-1 rounded-xl text-current opacity-70 hover:opacity-100">
                      <CloseCircleIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Banner Settings Form Card */}
          <Card className="rounded-2xl sm:rounded-3xl border-border bg-card shadow-sm">
            <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <StarsIcon className="w-5 h-5 text-pink-500 shrink-0" />
                    <span>Top Announcement Banner Settings</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Customize the prominent announcement bar shown at the very top of all student pages
                  </CardDescription>
                </div>

                {/* Banner Active Toggle */}
                <div className="flex items-center justify-between sm:justify-start gap-3 p-2 px-3 rounded-2xl bg-secondary/50 border border-border self-start sm:self-auto shrink-0">
                  <span className="text-xs font-bold text-foreground">
                    {bannerActive ? 'Banner Enabled' : 'Banner Disabled'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={bannerActive}
                      onChange={(e) => setBannerActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
                  </label>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-5">
              <form onSubmit={handleSaveBanner} className="space-y-5">
                {/* 1. Background Color Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Background Theme <span className="text-pink-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {BANNER_COLOR_OPTIONS.map((col) => {
                      const isSelected = bannerBgColor === col.id
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setBannerBgColor(col.id)}
                          className={cn(
                            'p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2 min-w-0',
                            isSelected
                              ? 'border-foreground shadow-md ring-2 ring-foreground/20 bg-secondary/60'
                              : 'border-border bg-secondary/20 hover:bg-secondary/40'
                          )}
                        >
                          <div className={cn('w-full h-7 rounded-xl shadow-xs', col.preview)} />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground block truncate">{col.label}</span>
                            <span className="text-[10px] text-muted-foreground block truncate">{col.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Solar Icon Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Banner Icon <span className="text-pink-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {BANNER_ICON_OPTIONS.map((ico) => {
                      const IconComp = ico.icon
                      const isSelected = bannerIcon === ico.id
                      return (
                        <button
                          key={ico.id}
                          type="button"
                          onClick={() => setBannerIcon(ico.id)}
                          className={cn(
                            'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-w-0 overflow-hidden',
                            isSelected
                              ? 'bg-pink-500/15 border-pink-500 text-pink-600 dark:text-pink-400 font-bold'
                              : 'bg-secondary/30 border-border text-foreground hover:bg-secondary/60'
                          )}
                        >
                          <IconComp className="w-4 h-4 text-pink-500 shrink-0" />
                          <span className="truncate">{ico.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Badge Text & Message Body */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-bold text-foreground">
                      Tag / Badge (e.g. NEW)
                    </label>
                    <input
                      type="text"
                      value={bannerBadge}
                      onChange={(e) => setBannerBadge(e.target.value)}
                      placeholder="e.g. NEW, UPDATE, PROMO"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-pink-500 transition-colors uppercase font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-3">
                    <label className="text-xs font-bold text-foreground">
                      Announcement Message <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="e.g. New Cambridge 19 IELTS Mock Tests live! Test your skills now 🎯"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                {/* 4. Action Link & Button Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Action Link URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={bannerLinkUrl}
                      onChange={(e) => setBannerLinkUrl(e.target.value)}
                      placeholder="e.g. /practice or /reading"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-pink-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={bannerLinkText}
                      onChange={(e) => setBannerLinkText(e.target.value)}
                      placeholder="e.g. Start Practice, Learn More"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-pink-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                {/* 5. Closable Toggle */}
                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground block">
                      Allow students to dismiss (Close X button)?
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {bannerClosable
                        ? 'Yes, students can close the banner for their active browser session.'
                        : 'No, the announcement bar remains permanently displayed.'}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={bannerClosable}
                      onChange={(e) => setBannerClosable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
                  </label>
                </div>

                {/* Save Button */}
                <Button
                  type="submit"
                  disabled={savingBanner}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/25 text-xs sm:text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <StarsIcon className="w-4 h-4" />
                  <span>
                    {savingBanner
                      ? 'Saving...'
                      : bannerActive
                      ? 'Save & Publish Banner Live 🚀'
                      : 'Save Banner Settings'}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BROADCAST NOTIFICATIONS (BELL & IN-APP TOASTS)                    */}
      {/* ========================================================================= */}
      {adminTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Dispatch Form & Preview */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <SendSquareIcon className="w-4 h-4 text-amber-500" />
                  <span>Compose Notification</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Select category with Solar icons, enter details, and push in-app notification & alert toast
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSend} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Notification Title <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. New Cambridge 19 Practice Tests Live! 🎯"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Message Body <span className="text-amber-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write detailed information or instructions for the students..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Solar Icons Category Selection Grid */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Category / Solar Icon <span className="text-amber-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {NOTIFICATION_CATEGORIES.map((cat) => {
                        const Icon = cat.icon
                        const isSelected = type === cat.id
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setType(cat.id)}
                            className={cn(
                              'flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer select-none',
                              isSelected
                                ? cat.activeColor
                                : 'bg-secondary/40 hover:bg-secondary/80 border-border text-foreground hover:scale-[1.02]'
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors',
                                isSelected ? 'bg-white/20' : 'bg-background/80 shadow-xs'
                              )}
                            >
                              <Icon className={cn('w-4.5 h-4.5', isSelected ? 'text-current' : cat.iconColor)} />
                            </div>
                            <span className="text-[11px] font-bold leading-tight line-clamp-1">{cat.label}</span>
                            <span
                              className={cn(
                                'text-[9px] mt-0.5 leading-tight',
                                isSelected ? 'opacity-90' : 'text-muted-foreground'
                              )}
                            >
                              {cat.sub}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Target URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Target URL (Optional)</label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="e.g. /practice or /reading"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Broadcast Toggle */}
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <UsersGroupTwoRoundedIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          Broadcast to All Users
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {broadcast
                            ? 'Will be sent to every registered student on EduFox.'
                            : 'Sends only to your current admin account as a preview.'}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcast}
                        onChange={(e) => setBroadcast(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                    </label>
                  </div>

                  {/* Live Student View Preview Box */}
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/80 space-y-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Student View Preview
                    </span>
                    <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex items-start gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border',
                          activeCategory.badgeColor
                        )}
                      >
                        <ActiveIcon className={cn('w-5 h-5', activeCategory.iconColor)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={cn('text-[9px] uppercase px-1.5 py-0.2 rounded font-bold border', activeCategory.badgeColor)}>
                            {activeCategory.label}
                          </span>
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {title || 'Notification Title Preview'}
                          </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {message || 'Your announcement message will be displayed here in the bell popup and notification center.'}
                        </p>
                        {link && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 mt-1.5">
                            <span>Open link ({link})</span>
                            <AltArrowRightIcon className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 text-xs sm:text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <SendSquareIcon className="w-4 h-4" />
                    <span>{submitting ? 'Dispatching...' : broadcast ? 'Dispatch Broadcast to All' : 'Send Test Notification'}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Recent Notification Activity Log */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="rounded-2xl border-border bg-card shadow-sm h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/80">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-amber-500" />
                    <span>Recent Records</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchHistory}
                      disabled={loadingHistory}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RestartIcon className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </Button>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {filteredHistory.length} total
                    </Badge>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="relative">
                    <MagnifierIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchHistory}
                      onChange={(e) => setSearchHistory(e.target.value)}
                      placeholder="Search history..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-3 overflow-y-auto max-h-[560px] space-y-2.5 custom-scrollbar">
                {filteredHistory.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <BellIcon className="w-8 h-8 opacity-40 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No notification records found</p>
                  </div>
                ) : (
                  filteredHistory.map((item) => {
                    const itemCategory =
                      NOTIFICATION_CATEGORIES.find((c) => c.id === item.type) || NOTIFICATION_CATEGORIES[0]
                    const ItemIcon = itemCategory.icon

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-secondary/30 border border-border/70 hover:border-border transition-all flex items-start justify-between gap-2.5 group"
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5',
                            itemCategory.badgeColor
                          )}
                        >
                          <ItemIcon className={cn('w-4 h-4', itemCategory.iconColor)} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] uppercase px-1 py-0 font-bold', itemCategory.badgeColor)}
                            >
                              {itemCategory.label}
                            </Badge>
                            <h5 className="text-xs font-bold text-foreground truncate">{item.title}</h5>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                            {item.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            <span>
                              {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {item.link && (
                              <span className="font-semibold text-amber-500 truncate max-w-[120px]">
                                {item.link}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                          title="Delete record"
                        >
                          <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
