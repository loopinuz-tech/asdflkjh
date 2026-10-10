import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { Notification } from '@/types'
import { apiUrl } from '@/lib/api-config'
import { getStoredToken } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BellIcon,
  CheckCircleIcon,
  InfoCircleIcon,
  DangerCircleIcon,
  CloseCircleIcon,
  AltArrowRightIcon
} from '@solar-icons/react/bold-duotone'
import { Link } from 'react-router-dom'

export interface ToastItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'vocabulary' | 'test'
  link?: string | null
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  sendNotification: (payload: { title: string; message: string; type?: string; link?: string }) => Promise<void>
  showToast: (item: Omit<ToastItem, 'id'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const initialFetchDone = useRef<boolean>(false)

  const unreadCountRef = useRef<number>(0)

  const showToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const newToast: ToastItem = { ...item, id }
    setToasts((prev) => [...prev, newToast])

    const duration = item.duration || 5000
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const fetchNotifications = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      unreadCountRef.current = 0
      return
    }

    try {
      setLoading(true)
      const res = await fetch(apiUrl('/api/notifications'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        const newNotifs: Notification[] = data.notifications || []
        const newUnread: number = data.unread_count || 0

        // If this is not the initial load and unread count increased, notify user with a toast
        if (initialFetchDone.current && newUnread > unreadCountRef.current && newNotifs.length > 0) {
          const newest = newNotifs[0]
          if (!newest.is_read) {
            showToast({
              title: newest.title,
              message: newest.message,
              type: (newest.type as any) || 'info',
              link: newest.link,
            })
          }
        }

        setNotifications(newNotifs)
        setUnreadCount(newUnread)
        unreadCountRef.current = newUnread
        initialFetchDone.current = true
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1)
      unreadCountRef.current = next
      return next
    })

    const token = getStoredToken()
    if (!token) return

    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (err) {
      console.warn('Error marking notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    unreadCountRef.current = 0

    const token = getStoredToken()
    if (!token) return

    try {
      await fetch(apiUrl('/api/notifications/mark-all-read'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (err) {
      console.warn('Error marking all notifications as read:', err)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id)
      if (target && !target.is_read) {
        setUnreadCount((c) => {
          const next = Math.max(0, c - 1)
          unreadCountRef.current = next
          return next
        })
      }
      return prev.filter((n) => n.id !== id)
    })

    const token = getStoredToken()
    if (!token) return

    try {
      await fetch(apiUrl(`/api/notifications/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (err) {
      console.warn('Error deleting notification:', err)
    }
  }, [])

  const clearAllNotifications = useCallback(async () => {
    setNotifications([])
    setUnreadCount(0)
    unreadCountRef.current = 0

    const token = getStoredToken()
    if (!token) return

    try {
      await fetch(apiUrl('/api/notifications/clear-all'), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (err) {
      console.warn('Error clearing notifications:', err)
    }
  }, [])

  const sendNotification = useCallback(
    async (payload: { title: string; message: string; type?: string; link?: string }) => {
      const token = getStoredToken()
      if (!token) return

      try {
        const res = await fetch(apiUrl('/api/notifications'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.notification) {
            setNotifications((prev) => [data.notification, ...prev])
            setUnreadCount((prev) => prev + 1)
            showToast({
              title: data.notification.title,
              message: data.notification.message,
              type: data.notification.type || 'info',
              link: data.notification.link,
            })
          }
        }
      } catch (err) {
        console.warn('Error sending notification:', err)
      }
    },
    [showToast]
  )

  // Initial load & Polling every 25 seconds
  useEffect(() => {
    fetchNotifications()

    pollingRef.current = setInterval(() => {
      fetchNotifications()
    }, 25000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchNotifications])

  // Get type-specific icon for toasts
  const renderToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
      case 'warning':
        return <DangerCircleIcon className="w-5 h-5 text-amber-500 shrink-0" />
      case 'error':
        return <CloseCircleIcon className="w-5 h-5 text-rose-500 shrink-0" />
      case 'vocabulary':
        return <span className="text-base shrink-0">📚</span>
      case 'test':
        return <span className="text-base shrink-0">📝</span>
      default:
        return <InfoCircleIcon className="w-5 h-5 text-blue-500 shrink-0" />
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        sendNotification,
        showToast,
      }}
    >
      {children}

      {/* Floating Interactive Toast Notifications Stack */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 flex items-start gap-3 select-none"
            >
              <div className="mt-0.5">{renderToastIcon(toast.type)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {toast.title}
                  </h5>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md transition-colors cursor-pointer"
                    aria-label="Dismiss toast"
                  >
                    <CloseCircleIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-2">
                  {toast.message}
                </p>
                {toast.link && (
                  <Link
                    to={toast.link}
                    onClick={() => dismissToast(toast.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline mt-1.5 cursor-pointer"
                  >
                    <span>View</span>
                    <AltArrowRightIcon className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
