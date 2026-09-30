import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  RoundedMagnifierIcon,
  AddCircleIcon,
  HamburgerMenuIcon,
  Logout2Icon,
  AltArrowLeftIcon,
  UserCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { GlobalSearchDialog } from './global-search-dialog'
import { FoxLogo } from '@/components/mascot/fox-mascot'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { createClient } from '@/lib/supabase/client'

interface AdminHeaderProps {
  adminName: string
  adminEmail?: string
  adminRole?: string
  onMobileMenuToggle?: () => void
  desktopCollapsed?: boolean
  onToggleDesktopCollapse?: () => void
}

export function AdminHeader({
  adminName,
  adminEmail,
  adminRole,
  onMobileMenuToggle,
  desktopCollapsed = false,
  onToggleDesktopCollapse,
}: AdminHeaderProps) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileDropdownOpen])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      navigate('/login')
    } catch (e) {
      console.error('Sign out error:', e)
      navigate('/login')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border h-14 flex items-center px-3 sm:px-6 md:px-8 gap-2 sm:gap-3 fox-shadow-sm select-none">

        {/* ── LEFT ── */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden shrink-0 w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-border hover:bg-secondary transition-colors active:scale-95"
            aria-label="Open menu"
          >
            <HamburgerMenuIcon className="w-[18px] h-[18px]" size={18} />
          </button>

          {/* Desktop Sidebar Toggle — button to close/open sidebar */}
          {onToggleDesktopCollapse && (
            <button
              type="button"
              onClick={onToggleDesktopCollapse}
              className="hidden md:flex shrink-0 w-8.5 h-8.5 items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
              title={desktopCollapsed ? 'Open Sidebar' : 'Collapse Sidebar'}
              aria-label={desktopCollapsed ? 'Open Sidebar' : 'Collapse Sidebar'}
            >
              {desktopCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-primary" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Logo */}
          {/* Mobile: logo icon + "EduFox" text only (no subtitle) */}
          <div className="md:hidden flex items-center gap-1.5 shrink min-w-0">
            <FoxLogo showText showSubtext={false} size="sm" />
            <span className="hidden xs:inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
              ADMIN
            </span>
          </div>

          {/* Desktop: Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground text-xs font-medium w-72 lg:w-96 transition-colors cursor-pointer group"
          >
            <RoundedMagnifierIcon className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" size={16} />
            <span className="flex-1 truncate text-left">Search tests, questions, users...</span>
            <kbd className="px-2 py-0.5 text-[10px] font-bold text-muted-foreground bg-card border border-border rounded-md shadow-xs font-mono shrink-0">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden w-8.5 h-8.5 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Search (Ctrl + K)"
            aria-label="Search"
          >
            <RoundedMagnifierIcon className="w-4 h-4" size={16} />
          </button>

          {/* Desktop: Create Test */}
          <Link
            to="/admin/tests/create"
            className="hidden sm:inline-flex items-center gap-1.5 h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold fox-shadow-sm transition-all active:scale-95"
          >
            <AddCircleIcon className="w-4 h-4" size={16} />
            <span className="hidden md:inline">Create Test</span>
            <span className="md:hidden">New</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm flex items-center justify-center cursor-pointer select-none fox-shadow-sm transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40"
              title={`${adminName}${adminEmail ? ' — ' + adminEmail : ''}`}
              aria-label="Admin user menu"
            >
              {adminName.charAt(0).toUpperCase()}
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-card border border-border rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2.5 border-b border-border mb-1.5">
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4 text-primary shrink-0" size={16} />
                    <p className="text-xs font-bold text-foreground truncate">{adminName}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{adminEmail || 'admin@foxford.ielts'}</p>
                  <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md mt-1.5 capitalize">
                    {adminRole === 'admin' ? 'Production Administrator' : adminRole || 'Administrator'}
                  </span>
                </div>

                <div className="space-y-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <AltArrowLeftIcon className="w-4 h-4 text-muted-foreground" size={16} />
                    <span>Student Platform</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                  >
                    <Logout2Icon className="w-4 h-4 text-destructive" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

