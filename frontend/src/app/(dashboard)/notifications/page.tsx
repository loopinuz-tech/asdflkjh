import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BellIcon,
  CheckCircleIcon,
  CheckReadIcon,
  TrashBinMinimalisticIcon,
  MagnifierIcon,
  AltArrowRightIcon,
  InfoCircleIcon,
  ShieldCheckIcon,
  CupStarIcon
} from '@solar-icons/react/bold-duotone'
import { Send } from 'lucide-react'
import { useNotifications } from '@/context/notification-context'
import { SEOHead } from '@/components/seo/SEOHead'
import { createClient } from '@/lib/supabase/client'
import { isUserAdmin } from '@/components/auth/ProtectedRoute'
import { AdminSendNotificationModal } from '@/components/notifications/admin-send-notification-modal'
import { cn } from '@/lib/utils'

function formatFullTime(dateString: string): string {
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Recently'
  }
}

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications()

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system' | 'vocabulary' | 'test'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(false)

  // Check admin privileges
  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()
          setIsAdminUser(isUserAdmin(user, profile?.role))
        }
      } catch {
        // Fallback
      }
    }
    checkAdmin()
  }, [])

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'unread' && n.is_read) return false
      if (activeTab === 'system' && n.type !== 'system' && n.type !== 'info') return false
      if (activeTab === 'vocabulary' && n.type !== 'vocabulary') return false
      if (activeTab === 'test' && n.type !== 'test') return false

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = n.title.toLowerCase().includes(query)
        const matchMsg = n.message.toLowerCase().includes(query)
        if (!matchTitle && !matchMsg) return false
      }

      return true
    })
  }, [notifications, activeTab, searchQuery])

  const typeDetails = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return {
          icon: <span className="text-base">📚</span>,
          label: 'Vocabulary',
          badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
        }
      case 'test':
        return {
          icon: <span className="text-base">📝</span>,
          label: 'Test',
          badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
        }
      case 'achievement':
        return {
          icon: <CupStarIcon className="w-4 h-4 text-amber-500" />,
          label: 'Achievement',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
        }
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" />,
          label: 'Success',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
        }
      default:
        return {
          icon: <InfoCircleIcon className="w-4 h-4 text-amber-500" />,
          label: 'System',
          badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
        }
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 select-none overflow-x-hidden">
      <SEOHead
        title="Notifications — EduFox"
        description="Stay up to date with exam results, vocabulary reminders, and EduFox announcements"
        canonicalUrl="/notifications"
      />

      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-xs">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Exam results, vocabulary reminders, and EduFox platform announcements
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Admin Broadcast Button */}
          {isAdminUser && (
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-foreground text-background transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Broadcast</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <CheckReadIcon className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all notifications?")) {
                  clearAllNotifications()
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary/80 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-muted-foreground transition-colors border border-border cursor-pointer"
            >
              <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tabs with smooth horizontal touch scrolling */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'test', label: 'Tests' },
            { id: 'vocabulary', label: 'Vocabulary' },
            { id: 'system', label: 'System' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0',
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/80'
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black',
                  activeTab === tab.id ? 'bg-slate-950 text-amber-400' : 'bg-secondary text-foreground'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <MagnifierIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Notifications Cards Container */}
      <div className="space-y-2.5 sm:space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="py-14 sm:py-16 text-center rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xs">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <BellIcon className="w-7 h-7 sm:w-8 sm:h-8 opacity-80" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              No notifications found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery
                ? "No notifications match your current search query."
                : "You are all caught up! Keep practicing to achieve your target band."}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((n) => {
              const details = typeDetails(n.type)
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    'group relative p-3.5 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4',
                    n.is_read
                      ? 'bg-card/70 border-border/80 hover:border-border'
                      : 'bg-card border-amber-400/50 dark:border-amber-400/40 shadow-xs'
                  )}
                >
                  {/* Left: Icon + Text */}
                  <div className="flex items-start gap-3 min-w-0 flex-1 w-full">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center shrink-0 mt-0.5">
                      {details.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', details.badgeColor)}>
                          {details.label}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground break-words">
                          {n.title}
                        </h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed font-normal break-words">
                        {n.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground/80 font-medium">
                          {formatFullTime(n.created_at)}
                        </span>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.id)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            <span>Open section</span>
                            <AltArrowRightIcon className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto justify-end">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        className="px-2.5 py-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer text-xs flex items-center gap-1"
                        title="Mark as read"
                      >
                        <CheckReadIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Read</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteNotification(n.id)}
                      className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <TrashBinMinimalisticIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Admin Notification Modal */}
      <AdminSendNotificationModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </div>
  )
}
