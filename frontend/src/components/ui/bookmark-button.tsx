import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  itemType: 'test' | 'question' | 'vocabulary' | 'writing' | 'speaking'
  itemId: string
  initialSaved?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onToggle?: (isSaved: boolean) => void
}

export function BookmarkButton({
  itemType,
  itemId,
  initialSaved = false,
  className,
  size = 'md',
  showLabel = false,
  onToggle,
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  // Sync initial state if provided
  useEffect(() => {
    setIsSaved(initialSaved)
  }, [initialSaved])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading || !itemId) return
    setLoading(true)

    // Optimistic UI update
    const nextSaved = !isSaved
    setIsSaved(nextSaved)
    if (onToggle) onToggle(nextSaved)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch('/api/saved/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ item_type: itemType, item_id: itemId }),
      })

      if (!res.ok) {
        // Revert on error
        setIsSaved(!nextSaved)
        if (onToggle) onToggle(!nextSaved)
      } else {
        const data = await res.json()
        if (typeof data.saved === 'boolean') {
          setIsSaved(data.saved)
          if (onToggle) onToggle(data.saved)
        }
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err)
      setIsSaved(!nextSaved)
      if (onToggle) onToggle(!nextSaved)
    } finally {
      setLoading(false)
    }
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={isSaved ? 'Remove from Saved Items' : 'Save for later review'}
      className={cn(
        'inline-flex items-center gap-1.5 transition-all cursor-pointer rounded-lg font-medium text-xs',
        isSaved
          ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
        size === 'sm' && 'p-1 text-[11px]',
        size === 'md' && 'p-1.5 text-xs',
        size === 'lg' && 'p-2 text-sm',
        loading && 'opacity-60 cursor-wait',
        className
      )}
    >
      <Bookmark
        className={cn(
          iconSizes[size],
          isSaved && 'fill-current text-amber-500',
          'transition-transform active:scale-90'
        )}
      />
      {showLabel && (
        <span>{isSaved ? 'Saved' : 'Save'}</span>
      )}
    </button>
  )
}
