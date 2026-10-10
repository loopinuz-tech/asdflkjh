import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AltArrowRightIcon } from '@solar-icons/react/bold-duotone'
import { createClient } from '@/lib/supabase/client'

export function Hero() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  return (
    <section className="pt-16 sm:pt-24 pb-4 sm:pb-12 px-2.5 sm:px-6 md:px-8 lg:px-[50px] w-full">
      {/* Hero Banner Card Container with rounded corners & clipping */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[36px] min-h-[440px] xs:min-h-[480px] sm:min-h-[72vh] lg:min-h-[82vh] flex flex-col items-center justify-start text-center border border-border/40 shadow-sm transition-colors">
        {/* Background Image — Pure & Crisp London skyline & Big Ben with Dark Mode Contrast */}
        <div className="absolute inset-0 -z-10 pointer-events-none select-none overflow-hidden bg-slate-950">
          <img
            src="/landingpageimg.png"
            alt="EduFox IELTS"
            className="w-full h-full object-cover object-[center_bottom] sm:object-bottom transition-all duration-500 dark:brightness-[0.38] dark:contrast-[1.15]"
          />
          {/* Dark Mode Scrim Overlay for high-contrast legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/45 to-slate-950/90 opacity-0 dark:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>

        <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 pt-8 xs:pt-12 sm:pt-28 md:pt-36 lg:pt-44 pb-20 xs:pb-24 sm:pb-24 lg:pb-32 flex flex-col items-center relative z-10">
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4.75rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.18] sm:leading-[1.12] max-w-4xl font-sans px-2 dark:drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
          >
            Your IELTS goal <br />
            is <span className="text-amber-500 dark:text-amber-400 underline decoration-amber-400/80 dark:decoration-amber-400 decoration-wavy underline-offset-4 sm:underline-offset-6">closer</span> than you think.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-2.5 sm:mt-5 text-xs xs:text-sm sm:text-xl lg:text-2xl text-slate-800 dark:text-white/95 font-medium max-w-2xl font-sans px-3 dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
          >
            Real practice. AI feedback. Visible progress.
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-4 sm:mt-9"
          >
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 sm:gap-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm sm:text-lg px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:scale-105 transition-all cursor-pointer border border-amber-400/50"
              >
                <span>Go to Dashboard</span>
                <AltArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              </Link>
            ) : (
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 sm:gap-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm sm:text-lg px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:scale-105 transition-all cursor-pointer border border-amber-400/50"
              >
                <span>Start Now</span>
                <AltArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
