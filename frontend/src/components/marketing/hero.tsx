import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
    <section className="relative overflow-hidden pt-20 pb-20 sm:pt-28 sm:pb-32 text-center min-h-[85vh] flex items-center justify-center">
      {/* Background Image — Pure & Crisp London skyline & Big Ben (Zero Blur) */}
      <div className="absolute inset-0 -z-10 pointer-events-none select-none overflow-hidden">
        <img
          src="/landingpageimg.png"
          alt="London IELTS Background"
          className="w-full h-full object-cover object-bottom"
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
        {/* 3D 9.0 Banner Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative my-2 sm:my-4 select-none flex items-center justify-center"
        >
          {/* Curving Gold Upward Arrow SVG */}
          <svg
            className="absolute -top-6 -left-12 sm:-top-10 sm:-left-20 w-[140%] h-[140%] pointer-events-none z-0 overflow-visible"
            viewBox="0 0 500 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 40 240 Q 180 200 420 60"
              stroke="url(#arrow-gradient)"
              strokeWidth="16"
              strokeLinecap="round"
              className="opacity-95"
            />
            {/* Arrowhead */}
            <path
              d="M 380 45 L 445 52 L 430 115 Z"
              fill="#F59E0B"
            />
            <defs>
              <linearGradient id="arrow-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.2" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Left Decorative Gold Ring / Circle */}
          <div className="absolute -left-3 sm:-left-4 z-20 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border-2 border-amber-200 shadow-md animate-pulse" />

          {/* 3D 9.0 Graphic Badge (Capsule / Pill Chambar Shape) */}
          <div className="relative z-10 p-[3px] sm:p-[3.5px] rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-[0_18px_45px_rgba(245,158,11,0.35)]">
            <div className="rounded-full bg-gradient-to-b from-zinc-900 via-black to-zinc-950 px-6 xs:px-10 sm:px-16 py-2.5 sm:py-6 border border-amber-400/50 flex items-center justify-center shadow-inner">
              <span className="text-5xl xs:text-6xl sm:text-8xl lg:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 drop-shadow-md">
                9.0
              </span>
            </div>
          </div>

          {/* Right Decorative Gold Ring / Circle */}
          <div className="absolute -right-3 sm:-right-4 z-20 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border-2 border-amber-200 shadow-md animate-pulse" />
        </motion.div>

        {/* Main Heading (Clean Inter font, font-bold) */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 sm:mt-8 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.18] max-w-3xl font-sans"
        >
          Your IELTS goal <br />
          is <span className="text-amber-500 underline decoration-amber-400/60 decoration-wavy underline-offset-4">closer</span> than you think.
        </motion.h1>

        {/* Subtitle (Medium / Normal weight, Inter font) */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-3 sm:mt-4 text-base sm:text-lg text-foreground/80 font-medium max-w-lg font-sans"
        >
          Real practice. AI feedback. Visible progress.
        </motion.p>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-7 sm:mt-9"
        >
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-[#FFC000] hover:bg-[#E6AD00] text-black font-extrabold text-base sm:text-lg px-8 py-3.5 rounded-full shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </Link>
          ) : (
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 bg-[#FFC000] hover:bg-[#E6AD00] text-black font-extrabold text-base sm:text-lg px-8 py-3.5 rounded-full shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              <span>Start Now</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  )
}
