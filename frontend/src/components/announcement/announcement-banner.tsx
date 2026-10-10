import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  VolumeLoudIcon,
  StarsIcon,
  BellIcon,
  CupStarIcon,
  DangerTriangleIcon,
  CloseCircleIcon,
  AltArrowRightIcon,
} from '@solar-icons/react/bold-duotone'
import { apiUrl } from '@/lib/api-config'
import { cn } from '@/lib/utils'

export interface AnnouncementBannerData {
  id: string
  is_active: boolean
  text: string
  badge_text?: string
  link_url?: string
  link_text?: string
  bg_color: 'pink' | 'purple' | 'amber' | 'blue' | 'emerald' | string
  icon: 'sparkles' | 'volume' | 'bell' | 'cup' | 'danger' | string
  is_closable: boolean
  updated_at?: string
}

export const BANNER_COLOR_STYLES: Record<string, { container: string; badge: string; button: string }> = {
  pink: {
    container: 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 text-white shadow-xs border-b border-pink-400/30',
    badge: 'bg-white/20 text-white border-white/30',
    button: 'bg-white text-pink-700 hover:bg-white/95 shadow-xs',
  },
  purple: {
    container: 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 text-white shadow-xs border-b border-purple-400/30',
    badge: 'bg-white/20 text-white border-white/30',
    button: 'bg-white text-purple-800 hover:bg-white/95 shadow-xs',
  },
  amber: {
    container: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-xs border-b border-amber-300/40',
    badge: 'bg-slate-950/20 text-slate-950 border-slate-950/20',
    button: 'bg-slate-950 text-white hover:bg-slate-900 shadow-xs',
  },
  blue: {
    container: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-xs border-b border-blue-400/30',
    badge: 'bg-white/20 text-white border-white/30',
    button: 'bg-white text-blue-800 hover:bg-white/95 shadow-xs',
  },
  emerald: {
    container: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-xs border-b border-emerald-400/30',
    badge: 'bg-white/20 text-white border-white/30',
    button: 'bg-white text-emerald-800 hover:bg-white/95 shadow-xs',
  },
}

export function getBannerSolarIcon(iconName: string, className = 'w-4 h-4 shrink-0') {
  switch (iconName) {
    case 'volume':
      return <VolumeLoudIcon className={className} />
    case 'bell':
      return <BellIcon className={className} />
    case 'cup':
      return <CupStarIcon className={className} />
    case 'danger':
      return <DangerTriangleIcon className={className} />
    case 'sparkles':
    default:
      return <StarsIcon className={className} />
  }
}

interface AnnouncementBannerProps {
  className?: string
}

export function AnnouncementBanner({ className }: AnnouncementBannerProps) {
  const [banner, setBanner] = useState<AnnouncementBannerData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const fetchBanner = async () => {
    try {
      const res = await fetch(apiUrl('/api/announcement-banner'))
      if (res.ok) {
        const data = await res.json()
        if (data.banner && data.banner.is_active) {
          // Check if previously dismissed in this session for this specific updated_at
          const dismissKey = `edufox_dismiss_banner_${data.banner.id}_${data.banner.updated_at}`
          const isDismissed = sessionStorage.getItem(dismissKey) === 'true'
          if (isDismissed && data.banner.is_closable) {
            setDismissed(true)
          } else {
            setDismissed(false)
          }
          setBanner(data.banner)
        } else {
          setBanner(null)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch announcement banner:', err)
    }
  }

  useEffect(() => {
    fetchBanner()

    // Listen for custom event in case admin updates it in another tab/component
    const handleUpdate = () => fetchBanner()
    window.addEventListener('edufox-banner-updated', handleUpdate)

    return () => window.removeEventListener('edufox-banner-updated', handleUpdate)
  }, [])

  if (!banner || !banner.is_active || dismissed) {
    return null
  }

  const handleDismiss = () => {
    if (banner.is_closable) {
      const dismissKey = `edufox_dismiss_banner_${banner.id}_${banner.updated_at}`
      sessionStorage.setItem(dismissKey, 'true')
      setDismissed(true)
    }
  }

  const themeStyle = BANNER_COLOR_STYLES[banner.bg_color] || BANNER_COLOR_STYLES.pink

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={cn('w-full select-none overflow-hidden rounded-none shrink-0', className)}
      >
        <div
          className={cn(
            'w-full px-4 py-2.5 rounded-none flex items-center justify-between gap-3 text-xs sm:text-sm font-medium transition-all',
            themeStyle.container
          )}
        >
          {/* Left: Icon, Badge, and Message Text */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Solar Icon */}
            <div className="p-1 rounded-xl bg-white/15 backdrop-blur-xs shrink-0 flex items-center justify-center">
              {getBannerSolarIcon(banner.icon, 'w-4 h-4 text-current')}
            </div>

            {/* Badge (if set) */}
            {banner.badge_text && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0',
                  themeStyle.badge
                )}
              >
                {banner.badge_text}
              </span>
            )}

            {/* Main Text */}
            <span className="truncate font-semibold tracking-tight">
              {banner.text}
            </span>
          </div>

          {/* Right: Optional Action Link & Dismiss Button */}
          <div className="flex items-center gap-2 shrink-0">
            {banner.link_url && (
              <Link
                to={banner.link_url}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 hover:scale-[1.02] active:scale-95',
                  themeStyle.button
                )}
              >
                <span>{banner.link_text || 'Batafsil'}</span>
                <AltArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            )}

            {banner.is_closable && (
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-xl text-current opacity-70 hover:opacity-100 hover:bg-black/15 transition-all cursor-pointer"
                title="Yopish"
                aria-label="Dismiss banner"
              >
                <CloseCircleIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
