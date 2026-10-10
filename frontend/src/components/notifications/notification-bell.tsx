import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BellIcon,
  CheckCircleIcon,
  TrashBinMinimalisticIcon,
  AltArrowRightIcon,
  CheckReadIcon,
} from '@solar-icons/react/bold-duotone'
import { useNotifications } from '@/context/notification-context'
import { cn } from '@/lib/utils'

function formatTimeAgo(dateString: string): string {
  try {
    const now = new Date().getTime()
    const past = new Date(dateString).getTime()
    const diffSec = Math.floor((now - past) / 1000)

    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    const diffDays = Math.floor(diffHour / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'vocabulary':
      return <span className="text-sm">📚</span>
    case 'test':
      return <span className="text-sm">📝</span>
    case 'achievement':
      return <span className="text-sm">🏆</span>
    case 'success':
      return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
    case 'warning':
      return <span className="text-sm">⚠️</span>
    default:
      return <BellIcon className="w-4 h-4 text-amber-500" />
  }
}

interface NotificationBellProps {
  className?: string
  buttonClassName?: string
  align?: 'left' | 'right'
  dropdownClassName?: string
}

export function NotificationBell({ 
  className, 
  buttonClassName,
  align = 'right',
  dropdownClassName,
}: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const filteredList = filter === 'unread' 
    ? notifications.filter((n) => !n.is_read)
    : notifications

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      markAsRead(n.id)
    }
    if (n.link) {
      setIsOpen(false)
      navigate(n.link)
    }
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'relative p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer flex items-center justify-center select-none active:scale-95',
          buttonClassName
        )}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <BellIcon className="w-5 h-5 text-current transition-transform group-hover:scale-105" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              "fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-full mt-2 w-auto sm:w-[380px] max-w-[calc(100vw-1.5rem)] sm:max-w-none rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 z-50 overflow-hidden flex flex-col text-slate-900 dark:text-white",
              align === 'left' ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto',
              dropdownClassName
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckReadIcon className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex px-3 pt-2 gap-1 border-b border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                  filter === 'all'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                  filter === 'unread'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification List Body */}
            <div className="flex-1 max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
              {filteredList.length === 0 ? (
                <div className="py-10 px-4 text-center select-none">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2.5">
                    <BellIcon className="w-6 h-6 opacity-80" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    New tests, results, and platform announcements will appear here.
                  </p>
                </div>
              ) : (
                filteredList.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      'group relative px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer text-left',
                      n.is_read
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80 hover:opacity-100'
                        : 'bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-400/5 dark:hover:bg-amber-400/10'
                    )}
                  >
                    {/* Icon container */}
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h6 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {n.title}
                        </h6>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-2 font-normal">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatTimeAgo(n.created_at)}
                        </span>
                        {n.link && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            Open <AltArrowRightIcon className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(n.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-all cursor-pointer shrink-0 self-center"
                      title="Delete"
                    >
                      <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 text-center">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View all notifications</span>
                <AltArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
