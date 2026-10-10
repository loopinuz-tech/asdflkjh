import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HamburgerMenuIcon,
  CloseCircleIcon,
  AltArrowRightIcon,
  AltArrowDownIcon,
  Widget2Icon,
  SettingsIcon,
  Logout2Icon,
  BellIcon,
} from '@solar-icons/react/bold-duotone'
import { buttonVariants } from '@/components/ui/button'
import { FoxLogo } from '@/components/mascot/fox-mascot'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { NotificationBell } from '@/components/notifications/notification-bell'

const navLinks = [
  { href: '#skills', label: 'Skills' },
  { href: '#shadowing', label: 'Movie Shadowing' },
  { href: '#ielts', label: 'IELTS' },
  { href: '#how-it-works', label: 'How it works' },
]

interface UserSessionInfo {
  name: string
  email: string
  avatarUrl: string | null
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const [currentUser, setCurrentUser] = useState<UserSessionInfo | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCurrentUser(null)
    navigate('/')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      const navOffset = 70
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - navOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    const targetId = href.replace(/^#/, '')

    if (location.pathname === '/') {
      scrollToSection(targetId)
      window.history.pushState(null, '', href)
    } else {
      navigate(`/${href}`)
    }
  }

  useEffect(() => {
    if (location.pathname === '/' && window.location.hash) {
      const targetId = window.location.hash.replace(/^#/, '')
      const timer = setTimeout(() => {
        scrollToSection(targetId)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle()

        const fullName = profile?.first_name || profile?.last_name
          ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
          : user.email?.split('@')[0] || 'Student'

        setCurrentUser({
          name: fullName,
          email: user.email || '',
          avatarUrl: profile?.avatar_url || null,
        })
      } else {
        setCurrentUser(null)
      }
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex-shrink-0"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          >
            {/* Mobile: no subtitle */}
            <span className="md:hidden">
              <FoxLogo showSubtext={false} size="sm" inverseText={false} />
            </span>
            {/* Desktop: full logo with subtitle */}
            <span className="hidden md:block">
              <FoxLogo showSubtext={true} inverseText={false} />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <ThemeToggle className="w-9 h-9 rounded-full justify-center p-0 shrink-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800" />
            {currentUser ? (
              <div className="flex items-center gap-2">
                <NotificationBell buttonClassName="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-full w-9 h-9 p-0" />
                {/* Profile Pill with Dropdown (Go to Dashboard button removed as requested) */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="h-9 px-3 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 select-none"
                    aria-expanded={isProfileOpen}
                    aria-label="User profile menu"
                  >
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-[22px] h-[22px] rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-[22px] h-[22px] rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[130px] truncate">
                      {currentUser.name}
                    </span>
                    <AltArrowDownIcon className={cn("w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 p-1.5 bg-card border border-border rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="px-3 py-2 border-b border-border/70 mb-1">
                        <p className="text-xs font-semibold text-foreground truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{currentUser.email}</p>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Widget2Icon className="w-4 h-4 text-primary" />
                          <span>Student Dashboard</span>
                        </Link>
                        <Link
                          to="/notifications"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <BellIcon className="w-4 h-4 text-amber-500" />
                          <span>Bildirishnomalar</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                          <span>Settings</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false)
                            handleSignOut()
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                        >
                          <Logout2Icon className="w-4 h-4 text-destructive" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors px-3 py-2 cursor-pointer">
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  className="h-9 px-5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs hover:shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer border border-amber-400/40"
                >
                  <span>Get Started</span>
                  <AltArrowRightIcon className="w-4 h-4 text-slate-950 font-bold" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <CloseCircleIcon className="h-6 w-6" /> : <HamburgerMenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl text-slate-900 dark:text-white max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full h-10 justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Widget2Icon className="w-4 h-4 text-amber-500" />
                      <span>Student Dashboard</span>
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full h-10 justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <BellIcon className="w-4 h-4 text-amber-500" />
                      <span>Bildirishnomalar</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleSignOut()
                      }}
                      className="w-full h-9 justify-center rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Logout2Icon className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <Link to="/login" className={buttonVariants({ variant: "ghost", className: "w-full justify-center text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900" })}>
                      Log in
                    </Link>
                    <Link 
                      to="/signup" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full h-10 justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Get Started</span>
                      <AltArrowRightIcon className="w-4 h-4 text-slate-950 font-bold" />
                    </Link>
                  </>
                )}
                <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
                  <ThemeToggle showLabel />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
