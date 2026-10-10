import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CloseCircleIcon,
  CheckCircleIcon,
  DangerCircleIcon,
  ShieldCheckIcon,
  VolumeLoudIcon,
  Pen2Icon,
  BookBookmarkIcon,
  CupStarIcon,
  DangerTriangleIcon,
  SendSquareIcon,
  UsersGroupTwoRoundedIcon,
} from '@solar-icons/react/bold-duotone'
import { apiUrl } from '@/lib/api-config'
import { getStoredToken } from '@/lib/supabase/client'
import { useNotifications } from '@/context/notification-context'
import { cn } from '@/lib/utils'

export const MODAL_NOTIFICATION_CATEGORIES = [
  {
    id: 'system',
    label: 'System',
    icon: VolumeLoudIcon,
    activeColor: 'bg-amber-500 text-slate-950 border-amber-500 font-bold',
    iconColor: 'text-amber-500',
  },
  {
    id: 'test',
    label: 'Mock Test',
    icon: Pen2Icon,
    activeColor: 'bg-blue-500 text-white border-blue-500 font-bold',
    iconColor: 'text-blue-500',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: BookBookmarkIcon,
    activeColor: 'bg-emerald-500 text-white border-emerald-500 font-bold',
    iconColor: 'text-emerald-500',
  },
  {
    id: 'achievement',
    label: 'Achievement',
    icon: CupStarIcon,
    activeColor: 'bg-yellow-500 text-slate-950 border-yellow-500 font-bold',
    iconColor: 'text-yellow-500',
  },
  {
    id: 'warning',
    label: 'Warning',
    icon: DangerTriangleIcon,
    activeColor: 'bg-rose-500 text-white border-rose-500 font-bold',
    iconColor: 'text-rose-500',
  },
] as const

type ModalNotificationType = (typeof MODAL_NOTIFICATION_CATEGORIES)[number]['id']

interface AdminSendNotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSendNotificationModal({ isOpen, onClose }: AdminSendNotificationModalProps) {
  const { fetchNotifications, showToast } = useNotifications()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ModalNotificationType>('system')
  const [link, setLink] = useState('')
  const [broadcast, setBroadcast] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Please enter both a title and message.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const token = getStoredToken()
      if (!token) {
        throw new Error('Authentication required. Please sign in as an admin.')
      }

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
          ? `Successfully broadcasted to all students.` 
          : `Notification sent successfully.`,
        type: 'success',
      })

      // Reset form & close
      setTitle('')
      setMessage('')
      setLink('')
      setType('system')
      await fetchNotifications()
      onClose()
    } catch (err: any) {
      console.error('Failed to send notification:', err)
      setErrorMsg(err.message || 'Error occurred while sending.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto relative text-foreground select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold tracking-tight">Send Platform Notification</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send updates directly to all students or target specific modules
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <CloseCircleIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <DangerCircleIcon className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Title <span className="text-amber-500">*</span>
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

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Message Body <span className="text-amber-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement or reminder here..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {/* Category selection with Solar Icons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Category & Solar Icon <span className="text-amber-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {MODAL_NOTIFICATION_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = type === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setType(cat.id)}
                      className={cn(
                        'flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer select-none',
                        isSelected
                          ? cat.activeColor
                          : 'bg-secondary/40 hover:bg-secondary/80 border-border text-foreground hover:scale-[1.02]'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 mb-1', isSelected ? 'text-current' : cat.iconColor)} />
                      <span className="text-[10px] font-semibold leading-tight truncate w-full">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Action Link (Optional)</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g. /practice or /reading"
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Broadcast Checkbox */}
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UsersGroupTwoRoundedIcon className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-foreground block">Broadcast to All Users</span>
                  <span className="text-[11px] text-muted-foreground">
                    {broadcast ? 'Every registered student on EduFox will receive this alert.' : 'Only sent to your account for preview.'}
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
                <div className="w-10 h-6 bg-secondary peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {submitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <SendSquareIcon className="w-4 h-4" />
                    <span>{broadcast ? 'Broadcast to All' : 'Send Test Notification'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
