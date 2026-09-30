import { useState, useEffect } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FocusModeButtonProps {
  className?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function FocusModeButton({
  className,
  size = 'md',
  showLabel = true,
}: FocusModeButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFocusMode = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (err) {
      console.warn('Could not toggle fullscreen mode:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFocusMode}
      title={isFullscreen ? 'Exit Focus Mode (Fullscreen)' : 'Enter Focus Mode (Fullscreen)'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border font-semibold transition-all cursor-pointer shadow-2xs',
        isFullscreen
          ? 'bg-primary/15 border-primary text-primary shadow-xs'
          : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs',
        className
      )}
    >
      {isFullscreen ? (
        <Minimize2 className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <Maximize2 className="w-3.5 h-3.5 shrink-0" />
      )}
      {showLabel && (
        <span className="hidden sm:inline">
          {isFullscreen ? 'Exit Focus' : 'Focus Mode'}
        </span>
      )}
    </button>
  )
}
