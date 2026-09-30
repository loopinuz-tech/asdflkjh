import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Widget2Icon,
  BookBookmarkIcon,
  HamburgerMenuIcon,
  CloseCircleIcon,
  ChartSquareIcon,
  SettingsIcon,
  HeadphonesRoundIcon,
  Pen2Icon,
  Microphone2Icon,
  TranslationIcon,
  BookmarkSquareIcon,
  ShieldCheckIcon,
  CrownStarIcon,
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function MobileNav() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  // Auto-close menu drawer when route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Fetch role and premium status
  useEffect(() => {
    async function loadInfo() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (profile?.role === 'admin') {
            setIsAdmin(true)
            setIsPremium(true)
          } else {
            const token = localStorage.getItem('foxford_token')
            if (token) {
              const res = await fetch('/api/subscriptions/me', {
                headers: { Authorization: `Bearer ${token}` }
              })
              if (res.ok) {
                const sData = await res.json()
                setIsPremium(Boolean(sData?.is_premium))
              }
            }
          }
        }
      } catch {
        // fallback
      }
    }
    loadInfo()
  }, [])

  // Lock background scroll when menu sheet is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const menuListItems = [
    { name: 'Dashboard Home', href: '/dashboard', icon: Widget2Icon, exact: true },
    { name: 'Practice Tests', href: '/practice', icon: BookBookmarkIcon },
    { name: 'Reading Practice', href: '/reading', icon: BookBookmarkIcon },
    { name: 'Listening Practice', href: '/listening', icon: HeadphonesRoundIcon },
    { name: 'Writing Practice', href: '/writing', icon: Pen2Icon },
    { name: 'Speaking Practice', href: '/speaking', icon: Microphone2Icon },
    { name: 'Vocabulary Bank', href: '/vocabulary', icon: TranslationIcon },
    { name: 'Results & Progress', href: '/progress', icon: ChartSquareIcon },
    { name: 'Saved Items', href: '/saved', icon: BookmarkSquareIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  const isHomeActive = pathname === '/dashboard'
  const isTestsActive = pathname.startsWith('/practice') || pathname.startsWith('/reading') || pathname.startsWith('/listening') || pathname.startsWith('/writing') || pathname.startsWith('/speaking')
  const isResultsActive = pathname.startsWith('/progress')
  const isProfileActive = pathname.startsWith('/settings')

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-up Menu Drawer (English, Solar Icons, Yellow/Primary Accent) */}
      {menuOpen && (
        <div className="fixed bottom-[58px] left-0 right-0 z-40 bg-card rounded-t-3xl border-t border-border shadow-2xl p-4 pb-6 max-h-[78vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-border/60">
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              MENU
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              EduFox IELTS Platform
            </span>
          </div>

          <div className="space-y-1">
            {menuListItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-98',
                    isActive
                      ? 'bg-primary/15 text-foreground font-black border border-primary/25 shadow-2xs'
                      : 'text-foreground/90 hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" size={18} />
                  </div>
                  <span className="text-sm font-semibold">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              )
            })}

            {/* Admin Panel Link (if admin role) */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between p-3 mt-2 rounded-2xl bg-foreground text-background font-bold text-xs active:scale-98 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-background/20 flex items-center justify-center text-primary">
                    <ShieldCheckIcon className="w-4 h-4" size={16} />
                  </div>
                  <span className="text-xs font-bold">Admin Panel</span>
                </div>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-background/20 font-mono">
                  PRO
                </span>
              </Link>
            )}

            {/* Upgrade to Premium Link (if free user) */}
            {!isPremium && (
              <Link
                to="/premium"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between p-3 mt-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black font-bold text-xs active:scale-98 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center text-black">
                    <CrownStarIcon className="w-4 h-4" size={18} />
                  </div>
                  <span className="text-xs font-bold">Upgrade to Premium</span>
                </div>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-black/10">
                  PRO
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (English, Solar Icons, Yellow/Primary theme, No red) */}
      <div className="relative z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none">
        <div
          className="flex items-center justify-around h-15 px-2"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* 1. Home */}
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-all active:scale-95',
              isHomeActive && !menuOpen
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            <div
              className={cn(
                'w-9 h-7 rounded-xl flex items-center justify-center transition-all',
                isHomeActive && !menuOpen ? 'bg-primary/15 text-primary' : ''
              )}
            >
              <Widget2Icon className="w-5 h-5" size={20} />
            </div>
            <span className="text-[10px] leading-none">Home</span>
          </Link>

          {/* 2. Tests */}
          <Link
            to="/practice"
            onClick={() => setMenuOpen(false)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-all active:scale-95',
              isTestsActive && !menuOpen
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            <div
              className={cn(
                'w-9 h-7 rounded-xl flex items-center justify-center transition-all',
                isTestsActive && !menuOpen ? 'bg-primary/15 text-primary' : ''
              )}
            >
              <BookBookmarkIcon className="w-5 h-5" size={20} />
            </div>
            <span className="text-[10px] leading-none">Tests</span>
          </Link>

          {/* 3. Menu (Raised Center Button in Golden Yellow Primary — No Red) */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 relative group cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <div
              className={cn(
                'w-11 h-11 -mt-4 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border-2 border-background',
                menuOpen
                  ? 'bg-primary text-primary-foreground rotate-90 scale-105 shadow-primary/40'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25'
              )}
            >
              {menuOpen ? (
                <CloseCircleIcon className="w-5 h-5" size={22} />
              ) : (
                <HamburgerMenuIcon className="w-5 h-5" size={22} />
              )}
            </div>
            <span
              className={cn(
                'text-[10px] leading-none font-bold',
                menuOpen ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              Menu
            </span>
          </button>

          {/* 4. Results */}
          <Link
            to="/progress"
            onClick={() => setMenuOpen(false)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-all active:scale-95',
              isResultsActive && !menuOpen
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            <div
              className={cn(
                'w-9 h-7 rounded-xl flex items-center justify-center transition-all',
                isResultsActive && !menuOpen ? 'bg-primary/15 text-primary' : ''
              )}
            >
              <ChartSquareIcon className="w-5 h-5" size={20} />
            </div>
            <span className="text-[10px] leading-none">Results</span>
          </Link>

          {/* 5. Profile */}
          <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-all active:scale-95',
              isProfileActive && !menuOpen
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            <div
              className={cn(
                'w-9 h-7 rounded-xl flex items-center justify-center transition-all',
                isProfileActive && !menuOpen ? 'bg-primary/15 text-primary' : ''
              )}
            >
              <SettingsIcon className="w-5 h-5" size={20} />
            </div>
            <span className="text-[10px] leading-none">Profile</span>
          </Link>
        </div>
      </div>
    </>
  )
}
