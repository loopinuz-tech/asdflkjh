import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Widget2Icon,
  DocumentTextIcon,
  PenNewSquareIcon,
  CloudUploadIcon,
  UsersGroupTwoRoundedIcon,
  ChartSquareIcon,
  ShieldCheckIcon,
  AltArrowLeftIcon,
  Logout2Icon,
  TagPriceIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  CloseCircleIcon,
  TranslationIcon,
} from '@solar-icons/react/bold-duotone'
import { FoxLogo } from '@/components/mascot/fox-mascot'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: Widget2Icon, exact: true },
    ],
  },
  {
    label: 'IELTS Content',
    items: [
      { href: '/admin/tests', label: 'Tests Management', icon: DocumentTextIcon },
      { href: '/admin/tasks', label: 'Writing & Speaking Tasks', icon: PenNewSquareIcon },
      { href: '/admin/vocabulary', label: 'Vocabulary & Folders', icon: TranslationIcon },
      { href: '/admin/import', label: 'Import Center (AI & Ingestion)', icon: CloudUploadIcon },
    ],
  },
  {
    label: 'Platform & Business',
    items: [
      { href: '/admin/pricing', label: 'Pricing & Coupons', icon: TagPriceIcon },
      { href: '/admin/attempts', label: 'Student Results & Attempts', icon: ChartSquareIcon },
      { href: '/admin/users', label: 'Student & User Accounts', icon: UsersGroupTwoRoundedIcon },
    ],
  },
]

interface AdminSidebarProps {
  adminName: string
  adminEmail?: string
  adminRole?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
  desktopCollapsed?: boolean
  onToggleDesktopCollapse?: () => void
}

export function AdminSidebar({
  adminName,
  adminEmail,
  adminRole,
  mobileOpen = false,
  onMobileClose,
  desktopCollapsed = false,
  onToggleDesktopCollapse,
}: AdminSidebarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      if (onMobileClose) onMobileClose()
      const supabase = createClient()
      await supabase.auth.signOut()
      navigate('/login')
    } catch (e) {
      console.error('Logout error:', e)
      navigate('/login')
    }
  }

  const renderSidebarContent = (isCollapsed: boolean) => (
    <aside className="w-full border-r border-white/10 bg-[#0c485e] dark:bg-[#072936] text-white flex flex-col justify-between h-full overflow-y-auto overflow-x-hidden select-none">
      <div>
        {/* Fox Ford Logo & Desktop Toggle / Mobile Close */}
        <div
          className={cn(
            'border-b border-white/10 flex items-center transition-all',
            isCollapsed
              ? 'p-3 flex-col gap-2.5 justify-center'
              : 'p-4 sm:p-5 justify-between'
          )}
        >
          <Link
            to="/admin"
            className="flex items-center gap-2.5 group"
            onClick={onMobileClose}
            title="EduFox Control Center"
          >
            <FoxLogo showText={!isCollapsed} size={isCollapsed ? 'sm' : 'default'} inverseText={true} />
          </Link>

          {/* Desktop Collapse / Expand Toggle Button on Sidebar Header */}
          {onToggleDesktopCollapse && (
            <button
              type="button"
              onClick={onToggleDesktopCollapse}
              className={cn(
                'hidden md:flex items-center justify-center rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer',
                isCollapsed ? 'w-8 h-8' : 'w-7 h-7'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpenIcon className="w-4 h-4 text-amber-300" size={16} />
              ) : (
                <PanelLeftCloseIcon className="w-3.5 h-3.5 text-white/70 hover:text-white" size={14} />
              )}
            </button>
          )}

          {/* Mobile close button */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <CloseCircleIcon className="w-4 h-4" size={16} />
            </button>
          )}
        </div>

        {/* Production Admin Badge */}
        <div className={cn('pt-3 transition-all', isCollapsed ? 'px-2 flex justify-center' : 'px-4 sm:px-5')}>
          {isCollapsed ? (
            <div
              className="w-8 h-8 rounded-xl bg-[#083546] border border-amber-400/30 flex items-center justify-center text-amber-300"
              title="Production Admin"
            >
              <ShieldCheckIcon className="w-4 h-4 text-amber-300" size={16} />
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#083546] border border-amber-400/30 text-[11px] font-bold text-amber-300 font-mono">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-300" size={14} />
              <span>Production Admin</span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className={cn('space-y-4 transition-all', isCollapsed ? 'p-2 space-y-3' : 'p-3')}>
          {navSections.map((sec) => (
            <div key={sec.label} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#7faebd]">
                  {sec.label}
                </div>
              ) : (
                <div className="my-1.5 border-t border-white/10 mx-1" />
              )}

              {sec.items.map((item) => {
                const Icon = item.icon
                const isActive = (item as any).exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onMobileClose}
                    title={item.label}
                    className={cn(
                      'rounded-xl text-xs font-medium transition-all group',
                      isCollapsed
                        ? 'relative flex items-center justify-center w-11 h-10 mx-auto'
                        : 'flex items-center justify-between px-3 py-2.5',
                      isActive
                        ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                        : 'text-[#a5cee0] hover:text-white hover:bg-white/10'
                    )}
                  >
                    <div className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : 'gap-3')}>
                      <Icon
                        className={cn(
                          'w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105',
                          isActive
                            ? 'text-amber-300 opacity-100'
                            : 'text-[#9ec3d5] group-hover:text-white opacity-90'
                        )}
                        size={19}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {isActive && !isCollapsed && (
                      <span className="ml-auto w-1.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
                    )}
                    {isActive && isCollapsed && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-full bg-amber-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Area: Back to Student App, Sign Out & Admin Card */}
      <div className={cn('border-t border-white/10 bg-[#0c485e] dark:bg-[#072936] transition-all', isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2')}>
        {!isCollapsed ? (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                to="/dashboard"
                onClick={onMobileClose}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#a5cee0] hover:text-white hover:bg-white/15 border border-white/10 bg-[#083546] transition-colors truncate"
                title="Return to Student Platform"
              >
                <AltArrowLeftIcon className="w-3.5 h-3.5 shrink-0 text-amber-300" size={14} />
                <span className="truncate">Student App</span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/20 border border-red-500/30 bg-red-500/10 transition-colors truncate cursor-pointer"
                title="Sign Out of Admin"
              >
                <Logout2Icon className="w-3.5 h-3.5 shrink-0 text-red-300" size={14} />
                <span className="truncate">Sign Out</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#083546] border border-white/10 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shrink-0">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-white truncate">{adminName}</p>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono shrink-0">
                    {adminRole === 'admin' ? 'Admin' : adminRole || 'Admin'}
                  </span>
                </div>
                <p className="text-[10px] text-[#7faebd] truncate">{adminEmail || 'admin@foxford.ielts'}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/dashboard"
              onClick={onMobileClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#083546] hover:bg-white/15 border border-white/10 text-amber-300 transition-colors"
              title="Return to Student Platform"
            >
              <AltArrowLeftIcon className="w-4 h-4 shrink-0 text-amber-300" size={16} />
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 transition-colors cursor-pointer"
              title="Sign Out of Admin"
            >
              <Logout2Icon className="w-4 h-4 shrink-0" size={16} />
            </button>

            <div
              className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shrink-0"
              title={`${adminName} (${adminEmail || 'admin@foxford.ielts'})`}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar — smoothly toggles between w-64 and w-[72px] */}
      <div
        className={cn(
          'hidden md:flex md:flex-col md:fixed md:inset-y-0 z-50 transition-[width] duration-300 ease-in-out',
          desktopCollapsed ? 'md:w-[72px]' : 'md:w-64'
        )}
      >
        {renderSidebarContent(desktopCollapsed)}
      </div>

      {/* Mobile Sidebar Overlay — always renders full drawer on mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] shadow-2xl animate-slide-in-left">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  )
}

