import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Mic, Zap } from 'lucide-react'

export type AvatarExpression = 'roast' | 'angry' | 'smirk' | 'impressed' | 'thinking' | 'neutral' | 'listening'

interface LiveAvatarProps {
  expression?: AvatarExpression
  isListening?: boolean
  isThinking?: boolean
  isSpeaking?: boolean
  audioLevel?: number // 0 to 1
  mode?: 'roast' | 'strict' | 'coach'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  statusText?: string
  onClick?: () => void
}

export function LiveExaminerAvatar({
  expression = 'roast',
  isListening = false,
  isThinking = false,
  isSpeaking = false,
  mode = 'roast',
  size = 'xl',
  className = '',
  statusText,
  onClick,
}: LiveAvatarProps) {
  const [blink, setBlink] = useState(false)
  const [glance, setGlance] = useState({ x: 0, y: 0 })

  // Natural periodic blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 160)
    }, 3200 + Math.random() * 2400)
    return () => clearInterval(interval)
  }, [])

  // Natural subtle glance shift
  useEffect(() => {
    if (!isThinking && !isSpeaking) {
      const glanceInterval = setInterval(() => {
        const randX = (Math.random() - 0.5) * 4
        const randY = (Math.random() - 0.5) * 2.5
        setGlance({ x: randX, y: randY })
        setTimeout(() => setGlance({ x: 0, y: 0 }), 1200)
      }, 4200)
      return () => clearInterval(glanceInterval)
    }
  }, [isThinking, isSpeaking])

  // Size dimensions proportional to the capsule pill
  const dims = {
    sm: { width: 180, height: 80 },
    md: { width: 260, height: 115 },
    lg: { width: 340, height: 150 },
    xl: { width: 440, height: 190 },
  }[size]

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Main Pill Capsule Avatar (NO mouse hover scale effect as requested) */}
      <motion.div
        onClick={onClick}
        animate={{
          y: isSpeaking ? [0, -3, 0] : isListening ? [0, 2, 0] : 0,
        }}
        transition={{
          y: {
            duration: isSpeaking ? 0.6 : 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        className={`relative ${onClick ? 'cursor-pointer' : 'cursor-default'} max-w-[calc(100vw-2rem)] pt-5 sm:pt-7`}
        style={{
          width: dims.width,
          maxWidth: '100%',
        }}
      >
        {/* Cute Fox Ears on Top */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-[17%] pointer-events-none z-0">
          {/* Left Fox Ear */}
          <motion.svg
            viewBox="0 0 50 60"
            style={{ width: dims.width * 0.19, height: dims.height * 0.46 }}
            animate={{
              rotate: isListening ? [-14, -8, -14] : isSpeaking ? [-12, -17, -12] : -10,
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="origin-bottom-left drop-shadow-xs"
          >
            {/* Outer Ear — Vibrant Fox Yellow/Amber */}
            <path
              d="M 6 56 C 4 38 14 14 32 2 C 46 22 48 42 42 56 Z"
              fill="#f59e0b"
            />
            {/* Ear Tip — Dark Charcoal/Slate accent */}
            <path
              d="M 24 14 C 28 8 30 5 32 2 C 38 10 41 18 40 22 Z"
              fill="#0f172a"
            />
            {/* Inner Ear — Warm soft cream */}
            <path
              d="M 14 52 C 16 38 22 22 32 12 C 38 24 40 38 36 52 Z"
              fill="#fffbeb"
              className="dark:fill-amber-950/60"
            />
          </motion.svg>

          {/* Right Fox Ear */}
          <motion.svg
            viewBox="0 0 50 60"
            style={{ width: dims.width * 0.19, height: dims.height * 0.46 }}
            animate={{
              rotate: isListening ? [14, 8, 14] : isSpeaking ? [12, 17, 12] : 10,
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="origin-bottom-right drop-shadow-xs"
          >
            {/* Outer Ear — Vibrant Fox Yellow/Amber */}
            <path
              d="M 44 56 C 46 38 36 14 18 2 C 4 22 2 42 8 56 Z"
              fill="#f59e0b"
            />
            {/* Ear Tip — Dark Charcoal/Slate accent */}
            <path
              d="M 26 14 C 22 8 20 5 18 2 C 12 10 9 18 10 22 Z"
              fill="#0f172a"
            />
            {/* Inner Ear — Warm soft cream */}
            <path
              d="M 36 52 C 34 38 28 22 18 12 C 12 24 10 38 14 52 Z"
              fill="#fffbeb"
              className="dark:fill-amber-950/60"
            />
          </motion.svg>
        </div>

        {/* Pill Capsule Body with Fox Gold/Amber Border */}
        <div
          className="relative rounded-full p-[3.5px] bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 shadow-xl shadow-amber-500/20 transition-all duration-300 w-full z-10"
          style={{
            aspectRatio: `${dims.width} / ${dims.height}`,
          }}
        >
          {/* Inner Capsule Body */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 flex items-center justify-center relative overflow-hidden">
            {/* Subtle glow pulse when thinking */}
            {isThinking && (
              <motion.div
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 bg-amber-400/20 rounded-full"
              />
            )}

            {/* SVG Character Face: Pure Vector Artwork — Not Squished */}
            <svg
              viewBox="0 0 280 130"
              className="w-full h-full relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fox Whiskers (Clean, sleek masculine fox whiskers) */}
              <g opacity="0.35" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
                <line x1="38" y1="67" x2="58" y2="70" />
                <line x1="36" y1="74" x2="56" y2="75" />
                <line x1="242" y1="67" x2="222" y2="70" />
                <line x1="244" y1="74" x2="224" y2="75" />
              </g>

              {/* Eyebrows based on emotion - Smart, confident examiner brows */}
              <g className="transition-all duration-300">
                {expression === 'roast' || expression === 'smirk' || mode === 'strict' ? (
                  <>
                    {/* Sly cocked left eyebrow */}
                    <path
                      d="M 77 38 Q 93 32 108 38"
                      stroke="#f59e0b"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Scrutinizing right eyebrow */}
                    <path
                      d="M 172 40 Q 187 34 203 38"
                      stroke="#f59e0b"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </>
                ) : expression === 'angry' ? (
                  <>
                    <path
                      d="M 77 36 Q 92 41 107 46"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                      className="text-slate-900 dark:text-slate-100"
                    />
                    <path
                      d="M 173 46 Q 188 41 203 36"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                      className="text-slate-900 dark:text-slate-100"
                    />
                  </>
                ) : expression === 'thinking' ? (
                  <>
                    {/* Inquisitive raised left brow */}
                    <path
                      d="M 77 36 Q 92 33 107 38"
                      stroke="#f59e0b"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 173 40 Q 188 38 203 40"
                      stroke="#f59e0b"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </>
                ) : (
                  <>
                    {/* Confident, intelligent examiner brows */}
                    <path
                      d="M 77 40 Q 92 36 107 40"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.9"
                    />
                    <path
                      d="M 173 40 Q 188 36 203 40"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.9"
                    />
                  </>
                )}
              </g>

              {/* LEFT EYE - Confident, sharp fox examiner eye (No eyelashes/wings) */}
              <g
                transform={`translate(${glance.x}, ${glance.y})`}
                className="transition-transform duration-200"
              >
                {blink ? (
                  <path
                    d="M 78 58 Q 92 64 106 58"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    className="text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <>
                    {/* Eye Outer Contour (Balanced, sharp shape) */}
                    <ellipse
                      cx="92"
                      cy="57"
                      rx="14"
                      ry="13"
                      className="fill-slate-900 dark:fill-slate-100"
                    />
                    {/* Amber Fox Iris Rim */}
                    <ellipse
                      cx="92"
                      cy="57"
                      rx="11.5"
                      ry="11"
                      fill="#f59e0b"
                      opacity="0.45"
                    />
                    {/* Inner Deep Pupil */}
                    <ellipse
                      cx="92"
                      cy="57"
                      rx="8"
                      ry="8.5"
                      className="fill-slate-950 dark:fill-slate-900"
                    />

                    {/* Impressed Star or Crisp Professional Catchlight */}
                    {expression === 'impressed' ? (
                      <polygon
                        points="92,49 94,54 99,57 94,60 92,65 90,60 85,57 90,54"
                        fill="#fbbf24"
                      />
                    ) : (
                      <circle cx="89" cy="53" r="2.8" fill="#ffffff" />
                    )}

                    {/* Upper Fox Eye Contour (Sleek, firm, NO winged eyeliner/lashes) */}
                    <path
                      d="M 78 57 Q 92 48 106 57"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      fill="none"
                      className="text-slate-900 dark:text-slate-100"
                    />
                  </>
                )}
              </g>

              {/* RIGHT EYE - Confident, sharp fox examiner eye (No eyelashes/wings) */}
              <g
                transform={`translate(${glance.x}, ${glance.y})`}
                className="transition-transform duration-200"
              >
                {blink ? (
                  <path
                    d="M 174 58 Q 188 64 202 58"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    className="text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <>
                    {/* Eye Outer Contour (Balanced, sharp shape) */}
                    <ellipse
                      cx="188"
                      cy="57"
                      rx="14"
                      ry="13"
                      className="fill-slate-900 dark:fill-slate-100"
                    />
                    {/* Amber Fox Iris Rim */}
                    <ellipse
                      cx="188"
                      cy="57"
                      rx="11.5"
                      ry="11"
                      fill="#f59e0b"
                      opacity="0.45"
                    />
                    {/* Inner Deep Pupil */}
                    <ellipse
                      cx="188"
                      cy="57"
                      rx="8"
                      ry="8.5"
                      className="fill-slate-950 dark:fill-slate-900"
                    />

                    {/* Impressed Star or Crisp Professional Catchlight */}
                    {expression === 'impressed' ? (
                      <polygon
                        points="188,49 190,54 195,57 190,60 188,65 186,60 181,57 186,54"
                        fill="#fbbf24"
                      />
                    ) : (
                      <circle cx="185" cy="53" r="2.8" fill="#ffffff" />
                    )}

                    {/* Upper Fox Eye Contour (Sleek, firm, NO winged eyeliner/lashes) */}
                    <path
                      d="M 174 57 Q 188 48 202 57"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      fill="none"
                      className="text-slate-900 dark:text-slate-100"
                    />
                  </>
                )}
              </g>

              {/* FOX NOSE — Cute rounded inverted triangle with gloss reflection */}
              <path
                d="M 132 68 C 132 66 148 66 148 68 C 148 74 144 77 140 77 C 136 77 132 74 132 68 Z"
                className="fill-slate-900 dark:fill-slate-100"
              />
              <ellipse cx="138" cy="69" rx="2.5" ry="1.2" fill="#ffffff" opacity="0.75" />

              {/* FOX MOUTH & MUZZLE */}
              {isSpeaking ? (
                // Lively Animated Speaking Mouth with Voice Soundwave Equalizer
                <g transform="translate(140, 88)">
                  {/* Dynamic voice equalizer bars */}
                  {[-18, -12, -6, 0, 6, 12, 18].map((offset, i) => (
                    <motion.line
                      key={i}
                      x1={offset}
                      y1={-5}
                      x2={offset}
                      y2={5}
                      stroke="currentColor"
                      className="text-amber-500 dark:text-amber-400"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      animate={{
                        y1: [-3 - (i % 2) * 5, -8 - (i % 3) * 3, -3],
                        y2: [3 + (i % 2) * 5, 8 + (i % 3) * 3, 3],
                      }}
                      transition={{
                        duration: 0.22 + (i % 3) * 0.07,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                    />
                  ))}
                </g>
              ) : (
                // Clean, confident fox examiner smile
                <g>
                  {/* Philtrum line down from nose */}
                  <line
                    x1="140"
                    y1="77"
                    x2="140"
                    y2="81"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="text-slate-900 dark:text-slate-100"
                  />
                  {expression === 'roast' ? (
                    // Sly smirk
                    <path
                      d="M 126 83 Q 140 86 156 80"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      fill="none"
                      className="text-slate-900 dark:text-slate-100"
                    />
                  ) : (
                    // Confident, intelligent examiner smile
                    <path
                      d="M 125 82 Q 140 87 155 82"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      fill="none"
                      className="text-slate-900 dark:text-slate-100"
                    />
                  )}
                </g>
              )}
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Clean Status Text */}
      {statusText && (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          {isListening && <Mic className="w-4 h-4 text-emerald-500 animate-pulse" />}
          {isSpeaking && <Volume2 className="w-4 h-4 text-amber-500 animate-pulse" />}
          {isThinking && <Zap className="w-4 h-4 text-amber-500 animate-spin" />}
          <span>{statusText}</span>
        </div>
      )}
    </div>
  )
}
