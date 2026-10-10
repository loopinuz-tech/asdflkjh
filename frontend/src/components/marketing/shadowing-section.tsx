import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClapperboardPlayIcon,
  Microphone2Icon,
  StarsIcon,
  SoundwaveIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  RestartIcon,
  AltArrowRightIcon,
  ShieldCheckIcon,
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'

const sampleWords = [
  'I',
  'want',
  'to',
  'make',
  'a',
  'real',
  'difference',
  'with',
  'my',
  'words',
]

const highlights = [
  {
    icon: Microphone2Icon,
    title: 'Hands-Free Automatic Loop',
    desc: 'The video pauses after each sentence, starts your microphone, and resumes automatically when you finish.',
    accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  {
    icon: StarsIcon,
    title: 'Live Word-by-Word Highlighting',
    desc: 'Spoken words light up in vibrant emerald green in real time, giving immediate visual feedback on rhythm and clarity.',
    accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    icon: SoundwaveIcon,
    title: 'Authentic Cinema Dialogue',
    desc: 'Learn from iconic actors in Dead Poets Society, Kung Fu Panda, and daily conversations with verified audio timestamps.',
    accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
]

export function ShadowingSection() {
  const [isPlayingDemo, setIsPlayingDemo] = useState(true)
  const [spokenWordCount, setSpokenWordCount] = useState(6)

  // Smooth word-by-word streaming simulation
  useEffect(() => {
    if (!isPlayingDemo) return
    const timer = setInterval(() => {
      setSpokenWordCount((prev) => {
        if (prev >= sampleWords.length) {
          return 1
        }
        return prev + 1
      })
    }, 850)

    return () => clearInterval(timer)
  }, [isPlayingDemo])

  return (
    <section
      id="shadowing"
      className="py-14 sm:py-24 bg-slate-50/70 dark:bg-slate-950 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Header — Clean English & Solar Badge */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-3.5 shadow-xs"
          >
            <ClapperboardPlayIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
            <span>MOVIE SHADOWING STUDIO</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight"
          >
            Speak Natural English with{' '}
            <span className="text-amber-500 dark:text-amber-400 underline decoration-amber-400/80 decoration-wavy underline-offset-4 sm:underline-offset-6">
              Movie Shadowing
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal"
          >
            Train your accent, intonation, and rhythm with real movie scenes. Video auto-pauses, your microphone starts hands-free, and words highlight as you speak.
          </motion.p>
        </div>

        {/* 2-Column Grid: Visual Highlights + Adaptive Cinema Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Visual Highlights & Action (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-4 sm:space-y-5"
          >
            <div className="space-y-3 sm:space-y-3.5">
              {highlights.map((item, idx) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all flex items-start gap-3.5"
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5', item.accentBg)}>
                      <Icon className="w-5 h-5" size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Visual Pills & CTA */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  ⚡ 100% Hands-Free
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  🎯 Real-Time Word Match
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  🎬 B1 – C1 Levels
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <Link
                  to="/speaking/shadowing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <ClapperboardPlayIcon className="w-4 h-4 text-slate-950" size={18} />
                  <span>Try Movie Shadowing Free</span>
                  <AltArrowRightIcon className="w-4 h-4 text-slate-950" size={16} />
                </Link>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0" size={16} />
                  <span>Runs in your browser</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Studio Cinema Player Simulator (Adaptive: Light in Light Mode, Dark in Dark Mode) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-7"
          >
            {/* Outer Card: Clean White in Light Mode, Sleek Slate in Dark Mode */}
            <div className="relative rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 sm:p-6 shadow-xl dark:shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden space-y-4 transition-colors">
              {/* Subtle ambient blur */}
              <div className="absolute -top-20 -right-20 w-52 h-52 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Console Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                    Dead Poets Society — Carpe Diem Speech
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 shrink-0">
                    B2 Upper-Intermediate
                  </span>
                </div>

                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0 hidden sm:inline">
                  American Accent
                </span>
              </div>

              {/* Cinema Viewport (Authentic Movie Scene with Robin Williams) */}
              <div
                onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-center group shadow-lg cursor-pointer select-none"
                title={isPlayingDemo ? 'Click to pause demo' : 'Click to play demo'}
              >
                {/* Real Dead Poets Society Movie Scene */}
                <img
                  src="https://img.youtube.com/vi/vi0Lbjs5ECI/maxresdefault.jpg"
                  alt="Robin Williams Dead Poets Society scene"
                  onError={(e) => {
                    ;(e.target as any).src = 'https://img.youtube.com/vi/vi0Lbjs5ECI/hqdefault.jpg'
                  }}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                />

                {/* Subtle top gradient for top badges */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

                {/* Subtle bottom gradient for timeline */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

                {/* Actor & Time Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white border border-white/20 shadow-md">
                  <ClapperboardPlayIcon className="w-3.5 h-3.5 text-amber-400" size={14} />
                  <span>Robin Williams • 0:14 / 2:00</span>
                </div>

                {/* Top Right Live Sync Tag */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-emerald-400 border border-emerald-500/30 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Speech AI Active</span>
                </div>

                {/* Interactive Shadowing Center Pill (Glassmorphism & Equalizer) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-rose-500/70 text-white text-xs sm:text-sm font-semibold mb-2.5 shadow-2xl shadow-black/80 ring-2 ring-rose-500/20">
                    <Microphone2Icon className="w-4 h-4 text-rose-400 animate-pulse shrink-0" size={16} />
                    <span className="text-white tracking-wide">Your turn — Repeat out loud!</span>
                  </div>

                  {/* Audio Equalizer Waveform animation */}
                  <div className="flex items-center gap-1.5 h-8 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 shadow-xl">
                    {[14, 26, 16, 30, 22, 12, 28, 18, 24, 15].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-gradient-to-t from-emerald-400 to-amber-400 rounded-full animate-pulse"
                        style={{
                          height: isPlayingDemo ? `${h}px` : '6px',
                          animationDelay: `${i * 90}ms`,
                        }}
                      />
                    ))}
                  </div>

                  <span className="mt-2 text-[11px] font-medium text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] italic bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    "Carpe diem. Seize the day, boys."
                  </span>
                </div>

                {/* Bottom Timeline Scrubber */}
                <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-1.5 pointer-events-none">
                  <div className="w-full h-1.5 rounded-full bg-white/30 overflow-hidden shadow-inner">
                    <div className="w-2/5 h-full bg-gradient-to-r from-amber-500 to-amber-400" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/90 font-mono font-medium">
                    <span>0:14</span>
                    <span className="text-amber-400">● 12 dialogue lines</span>
                    <span>2:00</span>
                  </div>
                </div>
              </div>

              {/* Subtitle Word Highlighting Box (Light in Light Mode, Dark in Dark Mode) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                    Robin Williams:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" size={14} />
                    <span>95% Match</span>
                  </span>
                </div>

                {/* Target words streaming in emerald green */}
                <div className="flex flex-wrap items-center gap-1.5 text-sm sm:text-base leading-relaxed py-0.5">
                  {sampleWords.map((word, wIdx) => {
                    const isMatched = wIdx < spokenWordCount
                    return (
                      <span
                        key={wIdx}
                        className={cn(
                          'transition-all duration-150 px-1.5 py-0.5 rounded text-sm sm:text-base',
                          isMatched
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 font-bold scale-105 shadow-xs'
                            : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {word}
                      </span>
                    )
                  })}
                </div>

                {/* Uzbek translation preview */}
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                    UZ
                  </span>
                  <span className="italic truncate">
                    "Men o'z so'zlarim bilan hayotda haqiqiy o'zgarish yaratishni xohlayman."
                  </span>
                </p>
              </div>

              {/* Console Action Bar */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-xs"
                  >
                    {isPlayingDemo ? (
                      <>
                        <PauseIcon className="w-3.5 h-3.5" size={14} />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-3.5 h-3.5" size={14} />
                        <span>Play Demo</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpokenWordCount(1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Replay from start"
                  >
                    <RestartIcon className="w-3.5 h-3.5" size={14} />
                  </button>

                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                    1.0x Speed
                  </span>
                </div>

                <Link
                  to="/speaking/shadowing"
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-500 text-xs font-semibold flex items-center gap-1 transition-colors group cursor-pointer"
                >
                  <span>Open Full Studio</span>
                  <AltArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
