import { cn } from '@/lib/utils'

export type FoxMascotVariant =
  | 'default'
  | 'welcome'
  | 'thinking'
  | 'success'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'celebration'
  | 'error'

export type FoxMascotSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface FoxMascotProps {
  variant?: FoxMascotVariant
  size?: FoxMascotSize
  className?: string
  animated?: boolean
}

const sizeMap: Record<FoxMascotSize, { width: number; height: number; className: string }> = {
  sm: { width: 48, height: 48, className: 'w-12 h-12' },
  md: { width: 80, height: 80, className: 'w-20 h-20' },
  lg: { width: 120, height: 120, className: 'w-30 h-30' },
  xl: { width: 200, height: 200, className: 'w-50 h-50' },
  '2xl': { width: 320, height: 320, className: 'w-80 h-80' },
}

export function FoxMascot({
  variant = 'default',
  size = 'md',
  className,
  animated = true,
}: FoxMascotProps) {
  const sizeConfig = sizeMap[size]

  return (
    <div
      className={cn(
        sizeConfig.className,
        'relative flex items-center justify-center select-none',
        animated && 'transition-transform duration-300 hover:scale-105',
        className
      )}
      role="img"
      aria-label={`EduFox mascot — ${variant}`}
    >
      <img 
        src="/edufox_mascot.png" 
        alt="EduFox Mascot" 
        className="object-contain drop-shadow-sm w-full h-full"
      />
    </div>
  )
}

/**
 * EduFox logo mark — used in navigation and branding.
 * showSubtext: show "contributed by FoxFord LC" subtitle (default: true)
 */
export function FoxLogo({ 
  className, 
  showText = true, 
  inverseText = false,
  showSubtext = true,
  size = 'default',
}: { 
  className?: string
  showText?: boolean
  inverseText?: boolean
  showSubtext?: boolean
  size?: 'default' | 'sm'
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative shrink-0', size === 'sm' ? 'w-7 h-7' : 'w-8 h-8')}>
        <img 
          src="/favicon.ico" 
          alt="EduFox Logo" 
          className="object-contain w-full h-full rounded-lg shadow-2xs"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            'font-bold tracking-tight',
            size === 'sm' ? 'text-base' : 'text-lg sm:text-xl',
            inverseText ? 'text-primary-foreground' : 'text-foreground'
          )}>
            Edu<span className={inverseText ? '' : 'text-primary font-black'}>Fox</span>
          </span>
          {showSubtext && (
            <span className={cn(
              'text-[9px] font-semibold tracking-tight mt-0.5 whitespace-nowrap',
              inverseText ? 'text-primary-foreground/75' : 'text-muted-foreground'
            )}>
              contributed by FoxFord LC
            </span>
          )}
        </div>
      )}
    </div>
  )
}
