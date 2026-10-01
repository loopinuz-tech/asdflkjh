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
      className="bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none"
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
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                  active
                    ? 'bg-primary/15 text-primary scale-105'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" size={20} />
              </div>
              <span
                className={cn(
                  'text-[10px] leading-tight tracking-tight transition-colors',
                  active ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
                )}
              >
                {item.name}
              </span>
              {active ? (
                <span className="w-1 h-1 rounded-full bg-primary -mt-0.5" />
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
