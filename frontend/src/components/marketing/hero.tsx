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
    <section className="pt-16 sm:pt-24 pb-6 sm:pb-12 px-2.5 sm:px-6 md:px-8 lg:px-[50px] w-full">
      {/* Hero Banner Card Container with rounded corners & clipping */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[36px] min-h-[500px] xs:min-h-[540px] sm:min-h-[75vh] lg:min-h-[82vh] flex flex-col items-center justify-start text-center border border-border/40 shadow-sm">
        {/* Background Image — Pure & Crisp London skyline & Big Ben (Zero Blur) */}
        <div className="absolute inset-0 -z-10 pointer-events-none select-none overflow-hidden">
          <img
            src="/landingpageimg.png"
            alt="EduFox IELTS"
            className="w-full h-full object-cover object-[center_bottom] sm:object-bottom"
          />
        </div>

        <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 pt-16 xs:pt-20 sm:pt-28 md:pt-36 lg:pt-44 pb-32 xs:pb-36 sm:pb-24 lg:pb-32 flex flex-col items-center relative z-10">
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[1.95rem] xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4.75rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.16] sm:leading-[1.12] max-w-4xl font-sans"
          >
            Your IELTS goal <br />
            is <span className="text-amber-500 dark:text-amber-400 underline decoration-amber-400/80 dark:decoration-amber-400 decoration-wavy underline-offset-4 sm:underline-offset-6">closer</span> than you think.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-3 sm:mt-5 text-sm xs:text-base sm:text-xl lg:text-2xl text-slate-800 dark:text-white/90 font-medium max-w-2xl font-sans px-2"
          >
            Real practice. AI feedback. Visible progress.
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-5 sm:mt-9"
          >
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 sm:gap-2.5 bg-[#FFC000] hover:bg-[#E6AD00] text-black font-extrabold text-base sm:text-xl px-7 py-3 sm:px-9 sm:py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer border border-amber-300/40"
              >
                <span>Go to Dashboard</span>
                <AltArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            ) : (
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 sm:gap-2.5 bg-[#FFC000] hover:bg-[#E6AD00] text-black font-extrabold text-base sm:text-xl px-7 py-3 sm:px-9 sm:py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer border border-amber-300/40"
              >
                <span>Start Now</span>
                <AltArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
