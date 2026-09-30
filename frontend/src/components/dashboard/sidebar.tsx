import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Widget2Icon, 
  BookBookmarkIcon, 
  HeadphonesRoundIcon, 
  Pen2Icon, 
  Microphone2Icon, 
  TranslationIcon, 
  ChartSquareIcon, 
  CalendarIcon, 
  BookmarkSquareIcon, 
  SettingsIcon,
  CrownStarIcon,
  Logout2Icon,
  ShieldCheckIcon,
} from '@solar-icons/react/bold-duotone'
import { FoxLogo } from '@/components/mascot/fox-mascot'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { cn } from '@/lib/utils'

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Widget2Icon },
  { name: 'Reading', href: '/reading', icon: BookBookmarkIcon },
  { name: 'Listening', href: '/listening', icon: HeadphonesRoundIcon },
  { name: 'Writing', href: '/writing', icon: Pen2Icon },
  { name: 'Speaking', href: '/speaking', icon: Microphone2Icon },
  { name: 'Vocabulary', href: '/vocabulary', icon: TranslationIcon },
]

const secondaryNavItems = [
  { name: 'Progress', href: '/progress', icon: ChartSquareIcon },
  { name: 'Practice History', href: '/practice', icon: CalendarIcon },
  { name: 'Saved Items', href: '/saved', icon: BookmarkSquareIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

export function Sidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  const supabase = createClient()
  const [profile, setProfile] = useState<{
    name: string
    avatarUrl?: string | null
    role: string
    isPremium?: boolean
  } | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, role')
          .eq('user_id', user.id)
          .single()

        let isPrem = false
        if (data?.role === 'admin') {
          isPrem = true
        } else {
          try {
            const token = localStorage.getItem('foxford_token')
            const res = await fetch('/api/subscriptions/me', {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (res.ok) {
              const sData = await res.json()
              isPrem = Boolean(sData.is_premium)
            }
          } catch {
            // fallback
          }
        }

        if (data) {
          const d = data as any
          const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim() || user.email?.split('@')[0] || 'User'
          setProfile({
            name: fullName,
            avatarUrl: d.avatar_url,
            role: d.role || 'student',
            isPremium: isPrem,
          })
        }
      }
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-card border-r border-border">
      <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <Link to="/dashboard">
            <FoxLogo />
          </Link>
        </div>
        
        <nav className="mt-2 flex-1 px-3 space-y-1">
          {/* Admin link if user is administrator */}
          {isAdmin && (
            <div className="mb-3">
              <Link
                to="/admin"
                className={cn(
                  pathname.startsWith('/admin')
                    ? 'bg-foreground text-background shadow-xs font-semibold'
                    : 'bg-secondary/60 hover:bg-secondary text-foreground border border-border/70',
                  'group flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all font-medium'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheckIcon className="w-4 h-4 text-foreground dark:text-primary" size={16} />
                  <span>Admin Panel</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground font-mono">
                  PRO
                </span>
              </Link>
            </div>
          )}

          <p className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
            Learn & Practice
          </p>
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all',
                  isActive
                    ? 'bg-secondary text-foreground font-bold border border-border/80 shadow-2xs'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0 transition-transform group-hover:scale-105',
                    isActive
                      ? 'text-zinc-950 dark:text-primary opacity-100'
                      : 'text-zinc-600 dark:text-white/85 group-hover:text-zinc-900 dark:group-hover:text-primary opacity-90'
                  )}
                  size={20}
                />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-3.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            )
          })}

          <p className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-6">
            Your Progress
          </p>
          {secondaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all',
                  isActive
                    ? 'bg-secondary text-foreground font-bold border border-border/80 shadow-2xs'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0 transition-transform group-hover:scale-105',
                    isActive
                      ? 'text-zinc-950 dark:text-primary opacity-100'
                      : 'text-zinc-600 dark:text-white/85 group-hover:text-zinc-900 dark:group-hover:text-primary opacity-90'
                  )}
                  size={20}
                />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-3.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-shrink-0 p-3 border-t border-border">
        {/* Eye-catching Go Premium CTA with rotating light beam around border for Free Users */}
        {!profile?.isPremium && (
          <div className="mb-4 premium-rotating-border-container">
            <div className="premium-rotating-beam" />
            <Link
              to="/premium"
              className="relative z-10 flex items-center justify-between p-3.5 sm:p-4 rounded-[14px] bg-card dark:bg-zinc-950 text-foreground"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-500 flex items-center justify-center text-black font-black shadow-xs shrink-0">
                  <CrownStarIcon className="w-5 h-5 text-black" size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black tracking-wide text-foreground">Go Premium</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-black shadow-xs">
                      PRO
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1 mt-0.5">
                    Unlock all IELTS tests & AI
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                <span className="text-xs font-black">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* User Profile / Logout */}
        <div className="flex items-center w-full px-1">
          <div className="flex items-center w-full">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="ml-3 truncate flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile?.name || 'Student'}
                </p>
                {profile?.isPremium && (
                  <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-[10px]" title="Premium Member">
                    ★
                  </span>
                )}
              </div>
              <button 
                onClick={handleSignOut}
                className="text-xs font-medium text-muted-foreground hover:text-destructive flex items-center mt-0.5 transition-colors cursor-pointer"
              >
                <Logout2Icon className="h-3.5 w-3.5 mr-1" size={14} />
                Sign out
              </button>
            </div>
            <ThemeToggle className="ml-2 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
