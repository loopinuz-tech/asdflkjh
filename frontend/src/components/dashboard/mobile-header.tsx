import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  ShieldCheckIcon,
  CrownStarIcon,
  Logout2Icon,
  SettingsIcon,
  CalendarIcon,
  BookmarkSquareIcon,
  Widget2Icon,
  AltArrowLeftIcon,
  CloseCircleIcon,
  HamburgerMenuIcon,
  BookBookmarkIcon,
  HeadphonesRoundIcon,
  Pen2Icon,
  Microphone2Icon,
  TranslationIcon,
  ChartSquareIcon,
  BellIcon,
  StarsIcon,
  ClapperboardPlayIcon,
  DocumentTextIcon,
  NotesIcon,
  UserSpeakRoundedIcon,
} from '@solar-icons/react/bold-duotone'
import { ChevronDown } from 'lucide-react'
import { FoxLogo } from '@/components/mascot/fox-mascot'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { isUserAdmin } from '@/components/auth/ProtectedRoute'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useNotifications } from '@/context/notification-context'

interface UserProfile {
  name: string
  email: string
  avatarUrl?: string | null
  role: string
  isPremium?: boolean
}

export function DashboardMobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const [rawUser, setRawUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [readingOpen, setReadingOpen] = useState(() => location.pathname.startsWith('/reading'))
  const [listeningOpen, setListeningOpen] = useState(() => location.pathname.startsWith('/listening'))
  const [writingOpen, setWritingOpen] = useState(() => location.pathname.startsWith('/writing'))
  const [speakingOpen, setSpeakingOpen] = useState(() => location.pathname.startsWith('/speaking'))
  const supabase = createClient()

  useEffect(() => {
    if (location.pathname.startsWith('/reading')) setReadingOpen(true)
    if (location.pathname.startsWith('/listening')) setListeningOpen(true)
    if (location.pathname.startsWith('/writing')) setWritingOpen(true)
    if (location.pathname.startsWith('/speaking')) setSpeakingOpen(true)
  }, [location.pathname])

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setRawUser(user)
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, role')
          .eq('user_id', user.id)
          .single()

        const d = (data as any) || {}
        const adminStatus = isUserAdmin(user, d.role)

        let isPrem = false
        if (adminStatus) {
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

        const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim() || user.email?.split('@')[0] || 'User'
        setProfile({
          name: fullName,
          email: user.email || '',
          avatarUrl: d.avatar_url,
          role: adminStatus ? 'admin' : (d.role || 'student'),
          isPremium: isPrem,
        })
      }
    }
    loadUser()
  }, [])

  // Auto-close drawer on location changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isAdmin = isUserAdmin(rawUser, profile?.role)

  return (
    <>
      {/* Sticky Mobile Header */}
      <header className="sticky top-0 z-40 bg-[#0c485e] dark:bg-[#072936] text-white border-b border-white/10 h-14 flex items-center justify-between px-3.5 sm:px-4 shadow-sm select-none">
        {/* Left Side: Hamburger Menu Button + Brand Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all shrink-0 border border-white/10"
            aria-label="Toggle Navigation Menu"
          >
            <HamburgerMenuIcon className="w-5 h-5 text-amber-300" size={20} />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-white border border-white/40 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img src="/favicon.ico" alt="EduFox" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white flex items-center">
              Edu<span className="text-amber-400 font-bold">Fox</span>
            </span>
          </Link>

          {/* Role badge */}
          {isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 text-amber-300 border border-amber-400/30 hover:bg-white/30 transition-colors shrink-0"
              title="Switch to Admin Panel"
            >
              <ShieldCheckIcon className="w-3 h-3 text-amber-300" size={12} />
              <span>Admin</span>
            </Link>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/15 text-white/80 border border-white/10 shrink-0">
              Student
            </span>
          )}
        </div>

        {/* Right Side Actions: ThemeToggle + Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Admin Shortcut if admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden xs:inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-foreground text-background text-[11px] font-semibold shadow-2xs active:scale-95 transition-all"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 text-primary" size={14} />
              <span>Admin</span>
            </Link>
          )}

          <NotificationBell />

          <ThemeToggle />

          {/* User Profile Avatar */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-8.5 h-8.5 rounded-full border border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center cursor-pointer transition-all active:scale-95"
            aria-label="Open User Menu"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-8.5 h-8.5 rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/15 text-foreground font-semibold text-xs flex items-center justify-center">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Slide-over Mobile Navigation & Profile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-start">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content (Left side slide-in) */}
          <div className="relative w-full max-w-[290px] xs:max-w-xs bg-card border-r border-border h-[100dvh] shadow-2xl flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-1 pb-4">
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <FoxLogo size="sm" showText showSubtext={false} />
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                  aria-label="Close Menu"
                >
                  <CloseCircleIcon className="w-5 h-5" size={20} />
                </button>
              </div>

              {/* User Identity Card */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-2">
                <div className="flex items-center gap-3">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-foreground font-semibold text-sm flex items-center justify-center shrink-0 border border-primary/30">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate">{profile?.name || 'Student'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
                      isAdmin
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-secondary text-muted-foreground border border-border'
                    )}
                  >
                    {isAdmin && <ShieldCheckIcon className="w-3 h-3" size={12} />}
                    <span>{profile?.role === 'admin' ? 'Administrator' : 'Student'}</span>
                  </span>

                  {profile?.isPremium ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <CrownStarIcon className="w-3 h-3" size={12} />
                      <span>PRO</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                      Free Tier
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Panel Direct Link (If Admin Role) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-foreground text-background shadow-xs font-semibold text-xs active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-primary" size={16} />
                    <span>Open Admin Panel</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-background/20 font-mono">
                    PRO
                  </span>
                </Link>
              )}

              {/* Go Premium CTA (If Free User) */}
              {!profile?.isPremium && (
                <Link
                  to="/premium"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black shadow-xs font-semibold text-xs active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <CrownStarIcon className="w-4 h-4" size={16} />
                    <span>Upgrade to Premium</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-black/10">
                    PRO
                  </span>
                </Link>
              )}

              {/* LEARN & PRACTICE Section */}
              <div className="space-y-1 pt-1">
                <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  LEARN & PRACTICE
                </p>

                {/* 1. Dashboard */}
                <Link
                  to="/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group',
                    location.pathname === '/dashboard'
                      ? 'bg-secondary text-foreground font-semibold border border-border/80 shadow-2xs'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Widget2Icon className="w-4 h-4 text-primary shrink-0" size={16} />
                    <span>Dashboard</span>
                  </div>
                  {location.pathname === '/dashboard' && (
                    <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
                  )}
                </Link>

                {/* 2. Reading Accordion */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setReadingOpen((p) => !p)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer group',
                      location.pathname.startsWith('/reading')
                        ? 'bg-secondary/70 text-foreground font-semibold border border-border/60'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <BookBookmarkIcon className="w-4 h-4 text-primary shrink-0" size={16} />
                      <span>Reading</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                        readingOpen ? 'rotate-180 text-primary' : ''
                      )}
                    />
                  </button>

                  {readingOpen && (
                    <div className="pl-3 border-l-2 border-border/70 ml-5 my-1 space-y-1 animate-in slide-in-from-top-1 duration-150">
                      <Link
                        to="/reading"
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                          location.pathname === '/reading'
                            ? 'bg-secondary text-foreground font-semibold border border-border/80'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <BookBookmarkIcon className="w-3.5 h-3.5 text-primary shrink-0" size={14} />
                          <span className="truncate">IELTS Reading</span>
                        </div>
                        {location.pathname === '/reading' && (
                          <span className="w-1 h-3.5 bg-primary rounded-full shrink-0" />
                        )}
                      </Link>

                      <Link
                        to="/reading/articles"
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                          location.pathname.startsWith('/reading/articles')
                            ? 'bg-secondary text-foreground font-semibold border border-border/80'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <DocumentTextIcon className="w-3.5 h-3.5 text-primary shrink-0" size={14} />
                          <span className="truncate">Articles</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono shrink-0">
                          NEW
                        </span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3. Listening Accordion */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setListeningOpen((p) => !p)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer group',
                      location.pathname.startsWith('/listening')
                        ? 'bg-secondary/70 text-foreground font-semibold border border-border/60'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <HeadphonesRoundIcon className="w-4 h-4 text-primary shrink-0" size={16} />
                      <span>Listening</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                        listeningOpen ? 'rotate-180 text-primary' : ''
                      )}
                    />
                  </button>

                  {listeningOpen && (
                    <div className="pl-3 border-l-2 border-border/70 ml-5 my-1 space-y-1 animate-in slide-in-from-top-1 duration-150">
                      <Link
                        to="/listening"
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                          location.pathname === '/listening'
                            ? 'bg-secondary text-foreground font-semibold border border-border/80'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <HeadphonesRoundIcon className="w-3.5 h-3.5 text-primary shrink-0" size={14} />
                          <span className="truncate">IELTS Listening</span>
                        </div>
                        {location.pathname === '/listening' && (
                          <span className="w-1 h-3.5 bg-primary rounded-full shrink-0" />
                        )}
                      </Link>

                      <div
                        title="Feature Coming Soon"
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground/60 select-none cursor-not-allowed opacity-75"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <NotesIcon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" size={14} />
                          <span className="truncate">Script Writing</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-secondary text-amber-500 border border-amber-500/30 font-mono shrink-0">
                          SOON
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Writing Accordion */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setWritingOpen((p) => !p)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer group',
                      location.pathname.startsWith('/writing')
                        ? 'bg-secondary/70 text-foreground font-semibold border border-border/60'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Pen2Icon className="w-4 h-4 text-primary shrink-0" size={16} />
                      <span>Writing</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                        writingOpen ? 'rotate-180 text-primary' : ''
                      )}
                    />
                  </button>

                  {writingOpen && (
                    <div className="pl-3 border-l-2 border-border/70 ml-5 my-1 space-y-1 animate-in slide-in-from-top-1 duration-150">
                      <Link
                        to="/writing"
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                          location.pathname === '/writing'
                            ? 'bg-secondary text-foreground font-semibold border border-border/80'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Pen2Icon className="w-3.5 h-3.5 text-primary shrink-0" size={14} />
                          <span className="truncate">IELTS Writing</span>
                        </div>
                        {location.pathname === '/writing' && (
                          <span className="w-1 h-3.5 bg-primary rounded-full shrink-0" />
                        )}
                      </Link>

                      <div
                        title="Feature Coming Soon"
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground/60 select-none cursor-not-allowed opacity-75"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <NotesIcon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" size={14} />
                          <span className="truncate">Essay Ideas & Templates</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-secondary text-amber-500 border border-amber-500/30 font-mono shrink-0">
                          SOON
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Speaking Accordion */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSpeakingOpen((p) => !p)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer group',
                      location.pathname.startsWith('/speaking')
                        ? 'bg-secondary/70 text-foreground font-semibold border border-border/60'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Microphone2Icon className="w-4 h-4 text-primary shrink-0" size={16} />
                      <span>Speaking</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                        speakingOpen ? 'rotate-180 text-primary' : ''
                      )}
                    />
                  </button>

                  {speakingOpen && (
                    <div className="pl-3 border-l-2 border-border/70 ml-5 my-1 space-y-1 animate-in slide-in-from-top-1 duration-150">
                      <Link
                        to="/speaking"
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                          location.pathname === '/speaking'
                            ? 'bg-secondary text-foreground font-semibold border border-border/80'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <UserSpeakRoundedIcon className="w-3.5 h-3.5 text-primary shrink-0" size={14} />
                          <span className="truncate">IELTS Speaking</span>
                        </div>
                        {location.pathname === '/speaking' && (
                          <span className="w-1 h-3.5 bg-primary rounded-full shrink-0" />
                        )}
                      </Link>

                      <Link
                        to="/speaking/shadowing"
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                          location.pathname.startsWith('/speaking/shadowing')
                            ? 'bg-secondary text-foreground font-semibold border border-border/80'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <ClapperboardPlayIcon className="w-3.5 h-3.5 text-primary shrink-0" size={14} />
                          <span className="truncate">Movie Shadowing</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono shrink-0">
                          NEW
                        </span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 6. Vocabulary */}
                <Link
                  to="/vocabulary"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group',
                    location.pathname.startsWith('/vocabulary')
                      ? 'bg-secondary text-foreground font-semibold border border-border/80 shadow-2xs'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <TranslationIcon className="w-4 h-4 text-primary shrink-0" size={16} />
                    <span>Vocabulary</span>
                  </div>
                  {location.pathname.startsWith('/vocabulary') && (
                    <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
                  )}
                </Link>
              </div>

              {/* YOUR PROGRESS Section */}
              <div className="space-y-1 pt-3">
                <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  YOUR PROGRESS
                </p>

                {[
                  { name: 'Progress', href: '/progress', icon: ChartSquareIcon },
                  { name: 'Practice History', href: '/practice', icon: CalendarIcon },
                  { name: 'Saved Items', href: '/saved', icon: BookmarkSquareIcon },
                  { name: 'Settings', href: '/settings', icon: SettingsIcon },
                ].map((item) => {
                  const isActive = location.pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group',
                        isActive
                          ? 'bg-secondary text-foreground font-semibold border border-border/80 shadow-2xs'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-primary shrink-0" size={16} />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-border space-y-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Logout2Icon className="w-4 h-4" size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
