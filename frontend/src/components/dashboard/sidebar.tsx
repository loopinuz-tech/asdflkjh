import { useEffect, useState, useMemo } from 'react'
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
  BellIcon,
  ClapperboardPlayIcon,
  UserSpeakRoundedIcon,
  DocumentTextIcon,
} from '@solar-icons/react/bold-duotone'
import { Search, X, ChevronRight, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { cn } from '@/lib/utils'
import { isUserAdmin } from '@/components/auth/ProtectedRoute'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useNotifications } from '@/context/notification-context'


interface QuickSearchItem {
  id: string
  title: string
  category: string
  href: string
}

export function Sidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  const supabase = createClient()
  const isExpanded = true
  
  const [rawUser, setRawUser] = useState<any>(null)
  const [profile, setProfile] = useState<{
    name: string
    avatarUrl?: string | null
    role: string
    isPremium?: boolean
  } | null>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [readingOpen, setReadingOpen] = useState(() => pathname.startsWith('/reading'))
  const [speakingOpen, setSpeakingOpen] = useState(() => pathname.startsWith('/speaking'))

  useEffect(() => {
    if (pathname.startsWith('/reading')) {
      setReadingOpen(true)
    }
    if (pathname.startsWith('/speaking')) {
      setSpeakingOpen(true)
    }
  }, [pathname])

  const { unreadCount } = useNotifications()

  // Load user data
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

        const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Student'
        setProfile({
          name: fullName,
          avatarUrl: d.avatar_url,
          role: adminStatus ? 'admin' : (d.role || 'student'),
          isPremium: isPrem,
        })
      }
    }
    loadUser()
  }, [])

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isAdmin = isUserAdmin(rawUser, profile?.role)

  // Only real, active platform pages in search catalog
  const searchCatalog: QuickSearchItem[] = [
    { id: '1', title: 'Dashboard & Overview', category: 'General', href: '/dashboard' },
    { id: '2', title: 'IELTS Reading Tests', category: 'Practice', href: '/reading' },
    { id: '3', title: 'IELTS Listening Audio Tests', category: 'Practice', href: '/listening' },
    { id: '4', title: 'IELTS Writing AI Evaluator', category: 'Practice', href: '/writing' },
    { id: '5', title: 'IELTS Speaking Simulator', category: 'Practice', href: '/speaking' },
    { id: '6', title: 'Vocabulary & Leitner Flashcards', category: 'Vocab', href: '/vocabulary' },
    { id: '7', title: 'Score Progress & Analytics', category: 'Stats', href: '/progress' },
    { id: '8', title: 'Practice History & Results', category: 'History', href: '/practice' },
    { id: '9', title: 'Saved Items & Mistake Bank', category: 'Review', href: '/saved' },
    { id: '10', title: 'Account Settings', category: 'Settings', href: '/settings' },
    { id: '11', title: 'Notifications', category: 'General', href: '/notifications' },
    { id: '12', title: 'Movie Shadowing Studio', category: 'Speaking', href: '/speaking/shadowing' },
    { id: '13', title: 'Academic Reading Articles', category: 'Reading', href: '/reading/articles' },
  ]

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return searchCatalog.slice(0, 7)
    const q = searchQuery.toLowerCase()
    return searchCatalog.filter(
      (item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Real core modules only (No fake / demo pages)
  const learnNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Widget2Icon, exact: true },
    {
      name: 'Reading',
      href: '/reading',
      icon: BookBookmarkIcon,
      subItems: [
        {
          name: 'IELTS Reading',
          href: '/reading',
          icon: BookBookmarkIcon,
          exact: true,
        },
        {
          name: 'Articles',
          href: '/reading/articles',
          icon: DocumentTextIcon,
          badge: 'NEW',
        },
      ],
    },
    { name: 'Listening', href: '/listening', icon: HeadphonesRoundIcon },
    { name: 'Writing', href: '/writing', icon: Pen2Icon },
    {
      name: 'Speaking',
      href: '/speaking',
      icon: Microphone2Icon,
      subItems: [
        {
          name: 'IELTS Speaking',
          href: '/speaking',
          icon: UserSpeakRoundedIcon,
          exact: true,
        },
        {
          name: 'Movie Shadowing',
          href: '/speaking/shadowing',
          icon: ClapperboardPlayIcon,
          badge: 'NEW',
        },
      ],
    },
    { name: 'Vocabulary', href: '/vocabulary', icon: TranslationIcon },
  ]

  const progressNavItems = [
    { name: 'Progress', href: '/progress', icon: ChartSquareIcon },
    { name: 'Practice History', href: '/practice', icon: CalendarIcon },
    { name: 'Saved Items', href: '/saved', icon: BookmarkSquareIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-[#0c485e] dark:bg-[#072936] text-white border-r border-white/10 h-full w-full select-none relative">
        {/* 1. TOP BRAND HEADER & ACTIONS (Logo + Search Q + Collapse toggle) */}
        <div
          className={cn(
            'flex items-center flex-shrink-0 transition-all duration-200 border-b border-white/10',
            isExpanded
              ? 'px-4 h-16 justify-between'
              : 'px-2 h-16 flex-col justify-center gap-1'
          )}
        >
          {/* Logo Brand */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 overflow-hidden group"
            title="EduFox Dashboard"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-white/40 flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition-all shrink-0">
              <img 
                src="/favicon.ico" 
                alt="EduFox Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            {isExpanded && (
              <span className="font-bold text-xl tracking-tight text-white flex items-center">
                Edu<span className="text-amber-400 font-black">Fox</span>
              </span>
            )}
          </Link>

          {/* Action buttons: Notification Bell & Search (Ctrl+K) */}
          <div className="flex items-center gap-1">
            <NotificationBell align="left" />
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer flex items-center justify-center"
              title="Search (Ctrl+K)"
              aria-label="Search platform"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 3. NAVIGATION LIST */}
        <div className="flex flex-col flex-1 pt-1 pb-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <nav className={cn('flex-1 space-y-1', isExpanded ? 'px-3' : 'px-2')}>
            {/* Admin link if user is administrator */}
            {isAdmin && (
              <div className="mb-2">
                <Link
                  to="/admin"
                  title="Admin Panel"
                  className={cn(
                    pathname.startsWith('/admin')
                      ? 'bg-white/25 text-white shadow-xs font-semibold border border-white/20'
                      : 'bg-[#083546]/80 hover:bg-white/15 text-white/90 border border-white/10',
                    isExpanded
                      ? 'group flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all font-medium'
                      : 'group flex items-center justify-center w-11 h-10 mx-auto rounded-xl transition-all'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheckIcon
                      className="w-4 h-4 text-amber-300 shrink-0"
                      size={18}
                    />
                    {isExpanded && <span className="truncate">Admin Panel</span>}
                  </div>
                  {isExpanded && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/20 border border-amber-400/30 text-amber-300 font-mono shrink-0">
                      PRO
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* Learn & Practice Header */}
            {isExpanded ? (
              <p className="px-3 text-[10px] font-bold text-[#7faebd] uppercase tracking-wider mb-1 mt-2">
                Learn & Practice
              </p>
            ) : (
              <div className="my-2 border-t border-white/10 mx-2" />
            )}

            {/* Learn Nav Items */}
            {learnNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              const IconComp = item.icon
              const hasSub = Boolean((item as any).subItems)

              if (hasSub) {
                const isItemOpen = item.name === 'Reading' ? readingOpen : speakingOpen
                const toggleItem = () => {
                  if (item.name === 'Reading') setReadingOpen((prev) => !prev)
                  else setSpeakingOpen((prev) => !prev)
                }

                const subItems = (item as any).subItems as Array<{
                  name: string
                  href: string
                  exact?: boolean
                  badge?: string
                  icon?: any
                }>
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={toggleItem}
                      title={!isExpanded ? item.name : undefined}
                      className={cn(
                        'group rounded-xl transition-all w-full cursor-pointer text-left',
                        isExpanded
                          ? 'flex items-center gap-3 px-3 py-2 text-sm font-medium'
                          : 'relative flex items-center justify-center w-11 h-10 mx-auto',
                        isActive
                          ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                          : 'text-[#a5cee0] hover:text-white hover:bg-white/10'
                      )}
                    >
                      <IconComp
                        className={cn(
                          'w-5 h-5 shrink-0 transition-transform group-hover:scale-105',
                          isActive ? 'text-amber-300' : 'text-[#9ec3d5] group-hover:text-white'
                        )}
                        size={20}
                      />

                      {isExpanded && (
                        <>
                          <span className="truncate flex-1 font-medium">{item.name}</span>
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 text-white/70 transition-transform duration-200 shrink-0 ml-auto',
                              isItemOpen ? 'rotate-180 text-amber-300' : ''
                            )}
                          />
                        </>
                      )}

                      {!isExpanded && isActive && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-full bg-amber-400" />
                      )}
                    </button>

                    {/* Submenu items */}
                    {isExpanded && isItemOpen && (
                      <div className="pl-2 pr-1 space-y-1 border-l-2 border-white/20 ml-5 my-1 animate-in slide-in-from-top-1 duration-150">
                        {subItems.map((sub) => {
                          const isSubActive = sub.exact
                            ? pathname === sub.href
                            : pathname.startsWith(sub.href)
                          const SubIcon = sub.icon
                          return (
                            <Link
                              key={sub.name}
                              to={sub.href}
                              className={cn(
                                'group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all font-medium',
                                isSubActive
                                  ? 'bg-white/20 text-white font-semibold shadow-2xs'
                                  : 'text-[#a5cee0] hover:text-white hover:bg-white/10'
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {SubIcon ? (
                                  <SubIcon
                                    className={cn(
                                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                                      isSubActive ? 'text-amber-300' : 'text-[#9ec3d5] group-hover:text-white'
                                    )}
                                    size={16}
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      'w-1.5 h-1.5 rounded-full shrink-0',
                                      isSubActive ? 'bg-amber-400' : 'bg-white/40'
                                    )}
                                  />
                                )}
                                <span className="truncate">{sub.name}</span>
                              </div>
                              {sub.badge && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono shrink-0">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={!isExpanded ? item.name : undefined}
                  className={cn(
                    'group rounded-xl transition-all',
                    isExpanded
                      ? 'flex items-center gap-3 px-3 py-2 text-sm font-medium'
                      : 'relative flex items-center justify-center w-11 h-10 mx-auto',
                    isActive
                      ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                      : 'text-[#a5cee0] hover:text-white hover:bg-white/10'
                  )}
                >
                  <IconComp
                    className={cn(
                      'w-5 h-5 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-amber-300' : 'text-[#9ec3d5] group-hover:text-white'
                    )}
                    size={20}
                  />

                  {isExpanded && (
                    <>
                      <span className="truncate">{item.name}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </>
                  )}

                  {!isExpanded && isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              )
            })}

            {/* Section Divider: Your Progress */}
            {isExpanded ? (
              <p className="px-3 text-[10px] font-bold text-[#7faebd] uppercase tracking-wider mb-1 mt-4">
                Your Progress
              </p>
            ) : (
              <div className="my-2 border-t border-white/10 mx-2" />
            )}

            {progressNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const IconComp = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={!isExpanded ? item.name : undefined}
                  className={cn(
                    'group rounded-xl transition-all',
                    isExpanded
                      ? 'flex items-center gap-3 px-3 py-2 text-sm font-medium'
                      : 'relative flex items-center justify-center w-11 h-10 mx-auto',
                    isActive
                      ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                      : 'text-[#a5cee0] hover:text-white hover:bg-white/10'
                  )}
                >
                  <IconComp
                    className={cn(
                      'w-5 h-5 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-amber-300' : 'text-[#9ec3d5] group-hover:text-white'
                    )}
                    size={20}
                  />

                  {isExpanded && (
                    <>
                      <span className="truncate">{item.name}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </>
                  )}

                  {!isExpanded && isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 4. BOTTOM CTA & PROFILE FOOTER */}
        <div className="flex-shrink-0 p-2.5 border-t border-white/10 bg-[#0c485e] dark:bg-[#072936]">
          {/* Go Premium CTA (Free users) with vibrant yellow styling */}
          {!profile?.isPremium && (
            <div className="mb-2">
              {isExpanded ? (
                <Link
                  to="/premium"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#083546] hover:bg-[#062c3b] border border-amber-400/30 hover:border-amber-400/60 text-white transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-500 flex items-center justify-center text-slate-900 font-black shadow-xs shrink-0">
                      <CrownStarIcon className="w-4.5 h-4.5 text-slate-900" size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Go Premium</span>
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900">
                          PRO
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9dc5d6] line-clamp-1">
                        Unlock IELTS tests & AI
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ) : (
                <Link
                  to="/premium"
                  title="Go Premium — Unlock IELTS tests & AI"
                  className="flex items-center justify-center w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-500 text-slate-900 shadow-md hover:scale-105 transition-transform shrink-0"
                >
                  <CrownStarIcon className="w-5 h-5 text-slate-900" size={20} />
                </Link>
              )}
            </div>
          )}

          {/* User Profile / Logout / Theme */}
          {isExpanded ? (
            <div className="flex items-center w-full px-1 py-1">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-8.5 w-8.5 rounded-full object-cover border border-white/20 shrink-0"
                />
              ) : (
                <div className="h-8.5 w-8.5 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-xs shrink-0 border border-white/20">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="ml-2.5 truncate flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white truncate">
                    {profile?.name || 'Student'}
                  </p>
                  {profile?.isPremium && (
                    <span
                      className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 text-[10px]"
                      title="Premium Member"
                    >
                      ★
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-[10px] font-medium text-[#9dc5d6] hover:text-rose-300 flex items-center mt-0.5 transition-colors cursor-pointer"
                >
                  <Logout2Icon className="h-3 w-3 mr-1" size={12} />
                  Sign out
                </button>
              </div>
              <ThemeToggle className="ml-1.5 flex-shrink-0 text-white hover:bg-white/15" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div title={profile?.name || 'Student'}>
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-8.5 w-8.5 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="h-8.5 w-8.5 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-xs shrink-0 border border-white/20">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <ThemeToggle className="w-8 h-8 shrink-0 text-white hover:bg-white/15" />
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 text-[#9dc5d6] hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
              >
                <Logout2Icon className="w-4 h-4" size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. QUICK SEARCH MODAL (Triggered by Search Q Icon or Ctrl+K) */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#0c485e] dark:bg-[#072936] text-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/15">
              <Search className="w-5 h-5 text-amber-300 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tests, speaking, vocabulary..."
                className="w-full bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-white/60 hover:text-white text-xs p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSearchOpen(false)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/15 text-white/80 hover:text-white cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
              {filteredSearch.length === 0 ? (
                <div className="p-6 text-center text-white/60 text-sm">
                  Hech narsa topilmadi: "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSearch.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSearchOpen(false)
                        navigate(item.href)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-white/15 transition-all text-white group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-amber-200 font-mono shrink-0">
                          {item.category}
                        </span>
                        <span className="text-sm font-medium truncate group-hover:text-amber-200 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-xs text-white/50 group-hover:text-white transition-colors">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 border-t border-white/10 bg-[#083546] flex items-center justify-between text-[11px] text-white/60 font-mono">
              <span>Quick Navigation</span>
              <span>EduFox IELTS</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
