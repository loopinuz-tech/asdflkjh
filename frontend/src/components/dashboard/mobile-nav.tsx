import { Link, useLocation } from 'react-router-dom'
import {
  Widget2Icon,
  BookBookmarkIcon,
  TranslationIcon,
  ChartSquareIcon,
  SettingsIcon,
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { pathname } = useLocation()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Widget2Icon,
      isActive: pathname === '/dashboard' || pathname === '/',
    },
    {
      name: 'Practice',
      href: '/practice',
      icon: BookBookmarkIcon,
      isActive:
        pathname.startsWith('/practice') ||
        pathname.startsWith('/reading') ||
        pathname.startsWith('/listening') ||
        pathname.startsWith('/writing') ||
        pathname.startsWith('/speaking'),
    },
    {
      name: 'Vocab',
      href: '/vocabulary',
      icon: TranslationIcon,
      isActive: pathname.startsWith('/vocabulary'),
    },
    {
      name: 'Progress',
      href: '/progress',
      icon: ChartSquareIcon,
      isActive: pathname.startsWith('/progress'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
      isActive: pathname.startsWith('/settings'),
    },
  ]

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="bg-[#0c485e]/95 backdrop-blur-md border-t border-white/10 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] select-none"
    >
      <div
        className="flex items-center justify-around h-16 px-1.5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.isActive

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-all duration-150 active:scale-90 group',
                active ? 'text-white' : 'text-[#96c1d2] hover:text-white'
              )}
            >
              <div
                className={cn(
                  'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                  active
                    ? 'bg-white/20 text-white scale-105 shadow-xs'
                    : 'text-[#96c1d2] group-hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-amber-300' : '')} size={20} />
              </div>
              <span
                className={cn(
                  'text-[10px] leading-tight tracking-tight transition-colors',
                  active ? 'font-semibold text-white' : 'font-medium text-[#96c1d2]'
                )}
              >
                {item.name}
              </span>
              {active ? (
                <span className="w-1 h-1 rounded-full bg-amber-400 -mt-0.5" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-transparent -mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
