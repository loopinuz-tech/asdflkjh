import React, { useState, useEffect } from 'react'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useTheme } from './theme-provider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'button' | 'dropdown'
}

export function ThemeToggle({ className, showLabel = false, variant = 'button' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("w-9 h-9 rounded-xl border border-border bg-secondary/40 animate-pulse", className)} />
    )
  }

  const isDark = resolvedTheme === 'dark'

  if (variant === 'dropdown') {
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "p-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer",
            className
          )}
          title={`Current theme: ${theme}`}
        >
          {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          {showLabel && <span className="capitalize">{theme}</span>}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-36 rounded-xl bg-card border border-border shadow-xl p-1.5 z-50 space-y-1">
              <button
                type="button"
                onClick={() => { setTheme('light'); setMenuOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left",
                  theme === 'light' ? 'bg-primary text-black font-bold' : 'text-foreground hover:bg-secondary'
                )}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => { setTheme('dark'); setMenuOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left",
                  theme === 'dark' ? 'bg-primary text-black font-bold' : 'text-foreground hover:bg-secondary'
                )}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => { setTheme('system'); setMenuOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left",
                  theme === 'system' ? 'bg-primary text-black font-bold' : 'text-foreground hover:bg-secondary'
                )}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer group flex items-center gap-2",
        className
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 group-hover:scale-110" />
        ) : (
          <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-300 rotate-0 group-hover:rotate-45" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-foreground select-none">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}
