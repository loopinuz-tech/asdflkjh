import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function useTimer(initialSeconds: number, onExpire?: () => void, isPaused: boolean = false) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  
  useEffect(() => {
    if (isPaused) return
    if (secondsLeft <= 0) {
      if (onExpire) onExpire()
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          if (onExpire) onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft, onExpire, isPaused])

  return secondsLeft
}

export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function TimerDisplay({ secondsLeft, className }: { secondsLeft: number, className?: string }) {
  const isWarning = secondsLeft < 300 // Less than 5 minutes
  const isCritical = secondsLeft < 60 // Less than 1 minute

  return (
    <div className={cn(
      "flex items-center gap-2 font-mono text-lg font-medium px-3 py-1.5 rounded-lg border",
      isCritical ? "text-destructive border-destructive/50 bg-destructive/10 animate-pulse" :
      isWarning ? "text-fox-yellow border-fox-yellow/50 bg-fox-yellow/10" :
      "text-foreground border-border bg-card",
      className
    )}>
      <Clock className="w-5 h-5" />
      {formatTime(secondsLeft)}
    </div>
  )
}
