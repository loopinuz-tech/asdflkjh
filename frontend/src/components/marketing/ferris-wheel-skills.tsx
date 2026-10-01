import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookBookmarkIcon, 
  HeadphonesRoundIcon, 
  Pen2Icon, 
  Microphone2Icon,
  CheckCircleIcon,
  AltArrowRightIcon,
  EyeIcon,
  CloseCircleIcon
} from '@solar-icons/react/bold-duotone'

// IELTS Skills metadata
export interface SkillCabinData {
  id: string
  name: string
  subtitle: string
  desc: string
  badge: string
  icon: React.ComponentType<{ className?: string }>
  accentHex: string
  accentBg: string
  accentBorder: string
  accentText: string
  accentDot: string
  glowColor: string
}

export const IELTS_SKILLS: SkillCabinData[] = [
  {
    id: 'reading',
    name: 'Reading',
    subtitle: 'Read smarter',
    desc: 'Authentic Cambridge passages & question types',
    badge: '40 Questions',
    icon: BookBookmarkIcon,
    accentHex: '#F59E0B',
    accentBg: 'bg-amber-500/10 dark:bg-amber-400/15',
    accentBorder: 'border-amber-400/30 dark:border-amber-400/25',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentDot: 'bg-amber-500',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'listening',
    name: 'Listening',
    subtitle: 'Train your ear',
    desc: 'Native audio with real accents & instant replay',
    badge: '4 Sections',
    icon: HeadphonesRoundIcon,
    accentHex: '#3B82F6',
    accentBg: 'bg-blue-500/10 dark:bg-blue-400/15',
    accentBorder: 'border-blue-400/30 dark:border-blue-400/25',
    accentText: 'text-blue-600 dark:text-blue-400',
    accentDot: 'bg-blue-500',
    glowColor: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'writing',
    name: 'Writing',
    subtitle: 'Write with confidence',
    desc: 'Instant Task 1 & 2 band score evaluation',
    badge: 'AI Graded',
    icon: Pen2Icon,
    accentHex: '#F43F5E',
    accentBg: 'bg-rose-500/10 dark:bg-rose-400/15',
    accentBorder: 'border-rose-400/30 dark:border-rose-400/25',
    accentText: 'text-rose-600 dark:text-rose-400',
    accentDot: 'bg-rose-500',
    glowColor: 'rgba(244, 63, 94, 0.25)',
  },
  {
    id: 'speaking',
    name: 'Speaking',
    subtitle: 'Speak with confidence',
    desc: 'Interactive voice AI examiner with instant score',
    badge: 'Voice AI',
    icon: Microphone2Icon,
    accentHex: '#10B981',
    accentBg: 'bg-emerald-500/10 dark:bg-emerald-400/15',
    accentBorder: 'border-emerald-400/30 dark:border-emerald-400/25',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentDot: 'bg-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
]

// Real Authentic IELTS Certificates Metadata from /certi/
export interface CertificateItem {
  id: number
  src: string
  name: string
  score: string
  tag: string
  highlight: string
}

export const CERTIFICATES: CertificateItem[] = [
  { id: 1, src: '/certi/1.jpg', name: 'Alibek Davletov', score: '6.5', tag: 'Academic', highlight: 'Listening 7.0' },
  { id: 2, src: '/certi/2.jpg', name: 'Farhodbek Jonibekov', score: '7.0', tag: 'One Skill Retake', highlight: 'Listening 8.5' },
  { id: 3, src: '/certi/3.jpg', name: 'Matkarim Madaminov', score: '7.0', tag: 'Academic', highlight: 'Listening 7.5' },
  { id: 4, src: '/certi/4.jpg', name: "O'tkirbek Rustamboyev", score: '6.5', tag: 'Academic', highlight: 'Listening 7.0' },
  { id: 5, src: '/certi/5.jpg', name: 'Xumoyun Ozodov', score: '6.0', tag: 'Academic', highlight: 'Listening 6.0' },
  { id: 6, src: '/certi/6.jpg', name: 'Xayrullo Shomurodov', score: '6.5', tag: 'Academic', highlight: 'Speaking 7.0' },
  { id: 7, src: '/certi/7.jpg', name: 'Shirinasaloy Madirimova', score: '7.0', tag: 'Academic', highlight: 'Reading 7.5' },
  { id: 8, src: '/certi/8.jpg', name: 'Xurshidabonu Utarova', score: '7.0', tag: 'Academic', highlight: 'Listening 8.0' },
  { id: 9, src: '/certi/9.jpg', name: 'Sevinchoy Raxmatova', score: '6.5', tag: 'Academic', highlight: 'Speaking 7.5' },
  { id: 10, src: '/certi/10.jpg', name: 'Jaloladdin Ismailov', score: '6.5', tag: 'Academic', highlight: 'Listening 7.0' },
  { id: 11, src: '/certi/11.jpg', name: 'Behruzbek Yusupov', score: '6.0', tag: 'Academic', highlight: 'Speaking 6.5' },
  { id: 12, src: '/certi/12.jpg', name: "Shohruza O'rinboyeva", score: '5.5', tag: 'Academic', highlight: 'Speaking 6.0' },
]

/**
 * High-precision SVG Observation Wheel Truss Structure
 */
function FerrisWheelSvg({ id }: { id: string }) {
  // Generate 16 radial tension cables from hub (r=62) to inner rim (r=338)
  const spokes = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i * 360) / 16
    const rad = (angle * Math.PI) / 180
    const x1 = 400 + 62 * Math.sin(rad)
    const y1 = 400 - 62 * Math.cos(rad)
    const x2 = 400 + 338 * Math.sin(rad)
    const y2 = 400 - 338 * Math.cos(rad)
    return { x1, y1, x2, y2, angle }
  })

  // Generate 32 truss braces between outer rim (r=362) and inner rim (r=338)
  const trussSteps = 32
  let trussPath = ''
  for (let i = 0; i <= trussSteps; i++) {
    const angleOuter = (i * 360) / trussSteps
    const radOuter = (angleOuter * Math.PI) / 180
    const xOuter = 400 + 362 * Math.sin(radOuter)
    const yOuter = 400 - 362 * Math.cos(radOuter)

    const angleInner = ((i + 0.5) * 360) / trussSteps
    const radInner = (angleInner * Math.PI) / 180
    const xInner = 400 + 338 * Math.sin(radInner)
    const yInner = 400 - 338 * Math.cos(radInner)

    if (i === 0) {
      trussPath += `M ${xOuter.toFixed(2)} ${yOuter.toFixed(2)} `
    } else {
      trussPath += `L ${xOuter.toFixed(2)} ${yOuter.toFixed(2)} `
    }
    if (i < trussSteps) {
      trussPath += `L ${xInner.toFixed(2)} ${yInner.toFixed(2)} `
    }
  }

  // 8 Mount brackets (4 for IELTS skills + 4 for Certificate pods)
  const mounts = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180
    const xBase = 400 + 362 * Math.sin(rad)
    const yBase = 400 - 362 * Math.cos(rad)
    const xTip = 400 + 378 * Math.sin(rad)
    const yTip = 400 - 378 * Math.cos(rad)
    return { xBase, yBase, xTip, yTip }
  })

  return (
    <svg
      viewBox="0 0 800 800"
      className="w-full h-full select-none pointer-events-none drop-shadow-sm"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sleek warm-gold metallic gradient */}
        <linearGradient id={`goldGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FCD34D" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0.9" />
        </linearGradient>

        {/* Structural steel rim gradient */}
        <linearGradient id={`rimGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.35" />
        </linearGradient>

        {/* Cable spoke gradient */}
        <linearGradient id={`spokeGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#CBD5E1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
        </linearGradient>

        {/* Center hub radial glow */}
        <radialGradient id={`hubGrad-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B45309" stopOpacity="0.95" />
        </radialGradient>
      </defs>

      {/* Outer ambient glow halo */}
      <circle
        cx="400"
        cy="400"
        r="362"
        stroke={`url(#goldGrad-${id})`}
        strokeWidth="1"
        strokeOpacity="0.15"
        className="dark:stroke-opacity-25"
      />

      {/* Primary Outer Track Rim */}
      <circle
        cx="400"
        cy="400"
        r="362"
        stroke={`url(#goldGrad-${id})`}
        strokeWidth="2.5"
      />

      {/* Secondary Inner Track Rim */}
      <circle
        cx="400"
        cy="400"
        r="338"
        stroke={`url(#rimGrad-${id})`}
        strokeWidth="1.5"
      />

      {/* Structural Truss Cross-bracing */}
      <path
        d={trussPath}
        stroke={`url(#goldGrad-${id})`}
        strokeWidth="1"
        strokeOpacity="0.35"
        fill="none"
      />

      {/* Intermediate Stabilization Rings */}
      <circle
        cx="400"
        cy="400"
        r="220"
        stroke="#94A3B8"
        strokeWidth="1"
        strokeDasharray="4 6"
        strokeOpacity="0.25"
      />
      <circle
        cx="400"
        cy="400"
        r="140"
        stroke={`url(#goldGrad-${id})`}
        strokeWidth="1"
        strokeDasharray="3 5"
        strokeOpacity="0.35"
      />

      {/* 16 Radial Tension Spokes */}
      {spokes.map((spoke, idx) => (
        <line
          key={idx}
          x1={spoke.x1}
          y1={spoke.y1}
          x2={spoke.x2}
          y2={spoke.y2}
          stroke={`url(#spokeGrad-${id})`}
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      ))}

      {/* Cabin Mount Extension Brackets (8 mounts) */}
      {mounts.map((m, idx) => (
        <g key={idx}>
          <line
            x1={m.xBase}
            y1={m.yBase}
            x2={m.xTip}
            y2={m.yTip}
            stroke={`url(#goldGrad-${id})`}
            strokeWidth={idx % 2 === 0 ? "3" : "2"}
            strokeLinecap="round"
          />
          <circle
            cx={m.xTip}
            cy={m.yTip}
            r={idx % 2 === 0 ? "4.5" : "3.5"}
            fill="#F59E0B"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* Center Structural Hub */}
      <g>
        <circle
          cx="400"
          cy="400"
          r="62"
          fill="none"
          stroke={`url(#goldGrad-${id})`}
          strokeWidth="2"
        />
        <circle
          cx="400"
          cy="400"
          r="54"
          className="fill-white/80 dark:fill-slate-900/80"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        <circle
          cx="400"
          cy="400"
          r="36"
          fill="none"
          stroke={`url(#goldGrad-${id})`}
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
        <circle
          cx="400"
          cy="400"
          r="22"
          fill={`url(#hubGrad-${id})`}
        />
        <circle
          cx="400"
          cy="400"
          r="7"
          fill="#1E293B"
          className="dark:fill-slate-950"
        />
        <circle
          cx="400"
          cy="400"
          r="2.5"
          fill="#FDE68A"
        />
      </g>
    </svg>
  )
}

/**
 * Individual IELTS Skill Observation Cabin
 */
interface CabinCardProps {
  skill: SkillCabinData
  counterAnimName?: string
  duration?: number
  isHovered?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function CabinCard({
  skill,
  counterAnimName = 'ferrisCounterCw',
  duration = 32,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: CabinCardProps) {
  const Icon = skill.icon

  return (
    <div
      className="relative will-change-transform"
      style={{
        animation: `${counterAnimName} ${duration}s linear infinite`,
      }}
    >
      {/* Tiny top suspension hanger arm */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
        <div className="w-[1.5px] h-2 bg-gradient-to-b from-amber-500 to-slate-400 dark:to-slate-600" />
      </div>

      {/* Glass Cabin Body */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`group relative w-[164px] sm:w-[178px] p-3 sm:p-3.5 rounded-2xl bg-white/94 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-amber-400/60 dark:hover:border-amber-500/50 cursor-pointer select-none ${
          isHovered ? 'scale-105 shadow-xl border-amber-400/60' : ''
        }`}
        style={{
          boxShadow: isHovered
            ? `0 14px 30px -6px ${skill.glowColor}, 0 4px 10px -2px rgba(0,0,0,0.06)`
            : undefined,
        }}
      >
        {/* Subtle top accent line */}
        <div className="flex justify-center -mt-1 mb-2">
          <div
            className="h-1 w-6 rounded-full transition-all duration-300 group-hover:w-10"
            style={{ backgroundColor: skill.accentHex }}
          />
        </div>

        {/* Interior layout: skill name dominant, small minimal line icon, small description */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${skill.accentBorder} ${skill.accentBg} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className={`w-[18px] h-[18px] ${skill.accentText}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                {skill.name}
              </h4>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${skill.accentDot}`} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight truncate mt-0.5">
              {skill.subtitle}
            </p>
          </div>
        </div>

        {/* Subtle glass reflection highlight along top edge */}
        <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/20 pointer-events-none rounded-t-2xl" />
      </div>
    </div>
  )
}

/**
 * Satellite IELTS Certificate Pod mounted directly on the Ferris Wheel
 * Revolves smoothly alongside the 4 IELTS skills, remaining upright at all times
 */
interface CertificatePodProps {
  certificate: CertificateItem
  counterAnimName?: string
  duration?: number
  onSelect: (cert: CertificateItem) => void
}

function CertificatePod({
  certificate,
  counterAnimName = 'ferrisCounterCw',
  duration = 32,
  onSelect,
}: CertificatePodProps) {
  return (
    <div
      className="relative will-change-transform"
      style={{
        animation: `${counterAnimName} ${duration}s linear infinite`,
      }}
    >
      {/* Tiny hanger connection */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
        <div className="w-[1.5px] h-2 bg-gradient-to-b from-amber-500 to-slate-400 dark:to-slate-600" />
      </div>

      {/* Glass Certificate Card */}
      <button
        type="button"
        onClick={() => onSelect(certificate)}
        className="group relative w-[152px] sm:w-[166px] p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-300/50 dark:border-amber-500/40 shadow-[0_8px_22px_-3px_rgba(245,158,11,0.18),0_2px_6px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-amber-400 cursor-pointer text-left focus:outline-none"
      >
        {/* Card Header: Prominent Band Score Badge + Student Details */}
        <div className="flex items-center gap-2 mb-2">
          {/* Bigger, Bolder Band Badge */}
          <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-sm shrink-0 border border-amber-300/60">
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
              Band
            </span>
            <span className="text-sm sm:text-base font-black leading-tight mt-0.5">
              {certificate.score}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
              {certificate.name}
            </div>
            <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 truncate mt-0.5">
              {certificate.highlight || 'Academic'}
            </div>
          </div>
        </div>

        {/* Certificate thumbnail - Increased height (balandligi) */}
        <div className="relative w-full h-[64px] sm:h-[70px] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
          <img
            src={certificate.src}
            alt={certificate.name}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-1.5">
            <span className="text-[9.5px] font-bold text-white truncate max-w-full drop-shadow-xs">
              {certificate.name}
            </span>
          </div>
          {/* Quick view indicator on hover */}
          <div className="absolute inset-0 bg-amber-500/25 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <EyeIcon className="w-5 h-5 text-slate-950 bg-white/95 rounded-full p-0.5 shadow-md" />
          </div>
        </div>
      </button>
    </div>
  )
}

/**
 * Structural A-Frame Support Legs (Oyoqlari) for the Ferris Wheel
 * Realistic civil engineering pylons anchoring the center axle to ground level
 */
function WheelSupportLegs({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 800 800"
      className="absolute inset-0 w-full h-full select-none pointer-events-none z-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Steel pylon leg gradient with warm gold sheen */}
        <linearGradient id={`pylonGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#94A3B8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0.95" />
        </linearGradient>

        {/* Foundation footing block gradient */}
        <linearGradient id={`footGrad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748B" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#475569" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
        </linearGradient>

        {/* Diagonal hydraulic stabilizer strut gradient */}
        <linearGradient id={`strutGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Ground shadows under foundation blocks */}
      <ellipse cx="225" cy="796" rx="48" ry="7" className="fill-slate-900/25 dark:fill-black/50 blur-[2px]" />
      <ellipse cx="575" cy="796" rx="48" ry="7" className="fill-slate-900/25 dark:fill-black/50 blur-[2px]" />

      {/* Rear Diagonal Stabilizer Struts */}
      <line x1="392" y1="410" x2="200" y2="786" stroke="#94A3B8" strokeWidth="4" strokeOpacity="0.4" strokeDasharray="6 4" />
      <line x1="408" y1="410" x2="600" y2="786" stroke="#94A3B8" strokeWidth="4" strokeOpacity="0.4" strokeDasharray="6 4" />

      {/* Main A-Frame Pylon Legs (Double heavy structural steel columns) */}
      {/* LEFT PYLON LEG */}
      <polygon
        points="374,406 394,406 248,790 216,790"
        fill={`url(#pylonGrad-${id})`}
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
      {/* Left pylon metallic reflection highlight */}
      <line x1="384" y1="408" x2="230" y2="788" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />

      {/* RIGHT PYLON LEG */}
      <polygon
        points="406,406 426,406 584,790 552,790"
        fill={`url(#pylonGrad-${id})`}
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
      {/* Right pylon metallic reflection highlight */}
      <line x1="416" y1="408" x2="570" y2="788" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />

      {/* Structural Cross Beams between the legs */}
      {/* High Cross-Beam (y ≈ 530) */}
      <rect
        x="332"
        y="526"
        width="136"
        height="14"
        rx="3"
        fill={`url(#strutGrad-${id})`}
        stroke="#D97706"
        strokeWidth="1"
        strokeOpacity="0.8"
      />
      {/* Low Cross-Beam (y ≈ 660) */}
      <rect
        x="274"
        y="654"
        width="252"
        height="16"
        rx="4"
        fill={`url(#strutGrad-${id})`}
        stroke="#D97706"
        strokeWidth="1"
        strokeOpacity="0.8"
      />

      {/* Heavy X-Truss Diagonal Bracing between high & low cross beams */}
      <line x1="338" y1="540" x2="518" y2="654" stroke={`url(#strutGrad-${id})`} strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.75" />
      <line x1="462" y1="540" x2="282" y2="654" stroke={`url(#strutGrad-${id})`} strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.75" />

      {/* Center Gusset Plate at X intersection */}
      <circle cx="400" cy="597" r="8" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="400" cy="597" r="3" fill="#FFFFFF" />

      {/* Hydraulic damper pistons below axle hub */}
      <line x1="392" y1="416" x2="350" y2="526" stroke="#94A3B8" strokeWidth="2.5" strokeOpacity="0.6" />
      <line x1="408" y1="416" x2="450" y2="526" stroke="#94A3B8" strokeWidth="2.5" strokeOpacity="0.6" />

      {/* Heavy-Duty Ground Foundation Concrete Footings */}
      {/* Left Base Footing */}
      <g>
        <rect
          x="198"
          y="782"
          width="60"
          height="16"
          rx="4"
          fill={`url(#footGrad-${id})`}
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        <circle cx="210" cy="790" r="2.5" fill="#F59E0B" />
        <circle cx="246" cy="790" r="2.5" fill="#F59E0B" />
      </g>

      {/* Right Base Footing */}
      <g>
        <rect
          x="542"
          y="782"
          width="60"
          height="16"
          rx="4"
          fill={`url(#footGrad-${id})`}
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        <circle cx="554" cy="790" r="2.5" fill="#F59E0B" />
        <circle cx="590" cy="790" r="2.5" fill="#F59E0B" />
      </g>
    </svg>
  )
}

/**
 * Ferris Wheel Component with 4 Upright Skill Cabins + 4 Upright Certificate Pods
 */
interface ObservationWheelProps {
  id: string
  direction?: 'cw' | 'ccw'
  duration?: number
  className?: string
  activeSkillId?: string | null
  onHoverSkill?: (id: string | null) => void
  wheelCertificates: CertificateItem[]
  onSelectCertificate: (cert: CertificateItem) => void
}

function ObservationWheel({
  id,
  direction = 'cw',
  duration = 32,
  className = '',
  activeSkillId,
  onHoverSkill,
  wheelCertificates,
  onSelectCertificate,
}: ObservationWheelProps) {
  const wheelAnimName = direction === 'cw' ? 'ferrisRotateCw' : 'ferrisRotateCcw'
  const counterAnimName = direction === 'cw' ? 'ferrisCounterCw' : 'ferrisCounterCcw'

  // Cardinal positions for 4 IELTS skills (0°, 90°, 180°, 270°) at radius 45%
  const skillPositions = [
    { top: '4.8%', left: '50%' }, // Top (Reading)
    { top: '50%', left: '95.2%' }, // Right (Listening)
    { top: '95.2%', left: '50%' }, // Bottom (Writing)
    { top: '50%', left: '4.8%' }, // Left (Speaking)
  ]

  // Diagonal positions for 4 rotating Certificate Pods (45°, 135°, 225°, 315°) at radius 45%
  // 50% +/- (45.2% * 0.7071) ≈ 50% +/- 32%
  const certPositions = [
    { top: '18%', left: '82%' }, // 45°
    { top: '82%', left: '82%' }, // 135°
    { top: '82%', left: '18%' }, // 225°
    { top: '18%', left: '18%' }, // 315°
  ]

  return (
    <div
      className={`relative w-[740px] h-[740px] lg:w-[860px] lg:h-[860px] xl:w-[940px] xl:h-[940px] shrink-0 pointer-events-none ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────────
          WHEEL SUPPORT LEGS (OYOQLARI)
          Stationary A-frame steel pylons anchoring wheel to ground
         ───────────────────────────────────────────────────────────── */}
      <WheelSupportLegs id={id} />

      {/* ─────────────────────────────────────────────────────────────
          ROTATING WHEEL (Outer Rim, Trusses, Spokes, Cabins, Pods)
         ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-10 will-change-transform"
        style={{
          animation: `${wheelAnimName} ${duration}s linear infinite`,
        }}
      >
        {/* SVG Wheel Structure */}
        <FerrisWheelSvg id={id} />

        {/* 4 Main IELTS Skill Cabins */}
        {IELTS_SKILLS.map((skill, index) => {
          const pos = skillPositions[index]
          return (
            <div
              key={skill.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ top: pos.top, left: pos.left }}
            >
              <CabinCard
                skill={skill}
                counterAnimName={counterAnimName}
                duration={duration}
                isHovered={activeSkillId === skill.id}
                onMouseEnter={() => onHoverSkill?.(skill.id)}
                onMouseLeave={() => onHoverSkill?.(null)}
              />
            </div>
          )
        })}

        {/* 4 Rotating Certificate Pods on the Wheel */}
        {wheelCertificates.slice(0, 4).map((cert, index) => {
          const pos = certPositions[index]
          return (
            <div
              key={cert.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-15"
              style={{ top: pos.top, left: pos.left }}
            >
              <CertificatePod
                certificate={cert}
                counterAnimName={counterAnimName}
                duration={duration}
                onSelect={onSelectCertificate}
              />
            </div>
          )
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CENTER HUB: STATIONARY UPRIGHT FOXFORD LOGO EMBLEM
          Circular bezel displaying /foxford.png at center of hub
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <div className="relative group w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.55)] transition-transform duration-300 hover:scale-105">
          <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-amber-300 dark:border-amber-400 flex items-center justify-center relative shadow-inner">
            <img
              src="/foxford.png"
              alt="Foxford Education Centre"
              className="w-full h-full object-cover object-center select-none"
            />
            {/* Subtle inner golden ring & shine reflection */}
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-amber-400/50 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20 pointer-events-none rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Continuous Rotating Certificate Marquee Showcase (All 12 certificates)
 * Smooth infinite glide looping across the section
 */
function CertificatesMarquee({
  onSelectCertificate,
}: {
  onSelectCertificate: (cert: CertificateItem) => void
}) {
  // Duplicate for seamless infinite loop
  const duplicatedList = [...CERTIFICATES, ...CERTIFICATES]

  return (
    <div className="w-full relative py-4 select-none">
      {/* Section Sub-header */}
      <div className="flex items-center justify-center gap-2 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>AUTHENTIC IELTS RESULTS FROM OUR STUDENTS</span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
        <span className="hidden sm:inline text-amber-600 dark:text-amber-400 font-bold">
          12 Real Certificates
        </span>
      </div>

      {/* Infinite Scrolling Ribbon */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex gap-4 w-max animate-certi-marquee hover:[animation-play-state:paused]">
          {duplicatedList.map((cert, index) => (
            <div
              key={`${cert.id}-${index}`}
              onClick={() => onSelectCertificate(cert)}
              className="group relative w-[170px] sm:w-[190px] p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-amber-400/70 cursor-pointer shrink-0 text-left"
            >
              {/* Card Header: Score Badge + Student Name */}
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-black shadow-xs whitespace-nowrap">
                  Band {cert.score}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[105px]">
                  {cert.name}
                </span>
              </div>

              {/* Certificate Image Frame */}
              <div className="relative w-full h-[105px] sm:h-[115px] rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <img
                  src={cert.src}
                  alt={cert.name}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-full bg-white/95 text-slate-950 text-[10px] font-bold shadow-md flex items-center gap-1">
                    <EyeIcon className="w-3.5 h-3.5 text-slate-950" /> Preview
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Lightbox Modal for Full Certificate Inspection
 */
function CertificateModal({
  certificate,
  onClose,
}: {
  certificate: CertificateItem | null
  onClose: () => void
}) {
  if (!certificate) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {certificate.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold">
                Overall Band {certificate.score}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official IELTS Certificate
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CloseCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Image Body with Zoom Scroll */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <img
            src={certificate.src}
            alt={certificate.name}
            className="max-h-[70vh] w-auto rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 object-contain"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Test Report Form
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Landing Page 2 Section: "Master All 4 IELTS Skills" with Dual Ferris Wheels
 * + 12 Rotating Official Student Certificates circulating alongside
 */
export function FerrisWheelSkills() {
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null)
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)

  // Split certificates between wheels:
  // Left wheel holds odd-indexed certs: 1, 3, 5, 7
  const leftWheelCerts = [CERTIFICATES[0], CERTIFICATES[2], CERTIFICATES[4], CERTIFICATES[6]]
  // Right wheel holds even-indexed certs: 2, 4, 6, 8
  const rightWheelCerts = [CERTIFICATES[1], CERTIFICATES[3], CERTIFICATES[5], CERTIFICATES[7]]

  return (
    <section
      id="skills"
      className="relative w-full overflow-hidden bg-background pt-10 sm:pt-14 pb-4 sm:pb-6 px-2.5 sm:px-6 md:px-8 lg:px-[50px] selection:bg-amber-500/20"
      aria-label="EduFox IELTS Skills & Results"
    >
      {/* ─────────────────────────────────────────────────────────────
          INLINE CSS FOR CONTINUOUS WHEEL & MARQUEE ROTATION
         ───────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes ferrisRotateCw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ferrisCounterCw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ferrisRotateCcw {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes ferrisCounterCcw {
          0% { transform: rotate(-360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes certiMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-certi-marquee {
          animation: certiMarquee 38s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="ferrisRotateCw"],
          [style*="ferrisRotateCcw"],
          [style*="ferrisCounterCw"],
          [style*="ferrisCounterCcw"],
          .animate-certi-marquee {
            animation: none !important;
          }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1 & 2: SUBTLE BACKGROUND GLOWS & RADIAL LIGHTING
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left gold glow */}
        <div className="absolute -left-[10%] top-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-amber-400/8 dark:bg-amber-500/10 blur-[130px]" />
        {/* Right gold glow */}
        <div className="absolute -right-[10%] top-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-amber-400/8 dark:bg-amber-500/10 blur-[130px]" />
        {/* Center crisp spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(255,255,255,0.85),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(15,23,42,0.45),transparent)]" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 3 & 4: OBSERVATION WHEEL (RIGHT ON DESKTOP)
          Wheel has 4 Skill cabins + 4 Certificate pods
         ───────────────────────────────────────────────────────────── */}

      {/* RIGHT FERRIS WHEEL (Desktop & Tablet) — pinned next to 4 skills */}
      <div className="hidden md:block absolute top-[280px] lg:top-[290px] -translate-y-1/2 -right-[180px] lg:-right-[200px] xl:-right-[160px] 2xl:-right-[100px] z-10 pointer-events-none">
        <ObservationWheel
          id="right-wheel"
          direction="ccw"
          duration={32}
          activeSkillId={activeSkillId}
          onHoverSkill={setActiveSkillId}
          wheelCertificates={rightWheelCerts}
          onSelectCertificate={setSelectedCert}
        />
      </div>

      {/* MOBILE OBSERVATION WHEEL (Single subtle background wheel) */}
      <div className="md:hidden absolute top-[220px] -translate-y-1/2 left-1/2 -translate-x-1/2 z-0 opacity-25 dark:opacity-20 pointer-events-none scale-75">
        <ObservationWheel
          id="mobile-wheel"
          direction="cw"
          duration={36}
          activeSkillId={activeSkillId}
          onHoverSkill={setActiveSkillId}
          wheelCertificates={leftWheelCerts}
          onSelectCertificate={setSelectedCert}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 5 & 6: 2-COLUMN MAIN CONTENT & FULL-WIDTH MARQUEE
          Left Column: Headline, Subtitle, 4 Interactive Skill Cards, CTAs
          Right Column: Framed by the Observation Wheel
          Bottom: 12 Real Certificates Showcase Ribbon
         ───────────────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full flex flex-col">
        {/* Top 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT CONTENT COLUMN: Fills the left space with rich, compelling content */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl xl:max-w-3xl">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-4 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              ALL FOUR IELTS SKILLS
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] mb-4">
              Master All 4{' '}
              <span className="relative whitespace-nowrap">
                <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                  IELTS Skills
                </span>
                {/* Elegant golden wavy underline accent */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-2 text-amber-500"
                  viewBox="0 0 100 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,4 Q25,8 50,4 T100,4"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed mb-6 font-normal">
              Practice authentic exam questions with real Cambridge style. Get instant AI band score evaluation and build unbreakable confidence across every module.
            </p>

            {/* 4 Interactive Skill Cards (2x2 Grid) — Fills the space and links to wheel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl mb-6">
              {IELTS_SKILLS.map((skill) => {
                const Icon = skill.icon
                const isHovered = activeSkillId === skill.id
                return (
                  <div
                    key={skill.id}
                    onMouseEnter={() => setActiveSkillId(skill.id)}
                    onMouseLeave={() => setActiveSkillId(null)}
                    className={`group relative p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border transition-all duration-300 cursor-pointer select-none text-left ${
                      isHovered
                        ? 'border-amber-400 dark:border-amber-400 shadow-lg shadow-amber-500/10 scale-[1.02] bg-white dark:bg-slate-900'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400/60 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${skill.accentBorder} ${skill.accentBg} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className={`w-5 h-5 ${skill.accentText}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                            {skill.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                            {skill.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug mt-0.5 truncate">
                          {skill.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Primary CTA & Secondary link */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 mb-6 w-full sm:w-auto">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-base font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <span>Start Practicing</span>
                <AltArrowRightIcon className="w-4 h-4 text-slate-950 font-bold" />
              </Link>

              <a
                href="#ielts-test-format"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200"
              >
                <span>Explore all skills</span>
              </a>
            </div>

            {/* Trust & Confidence Feature Pills */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                Authentic Cambridge Style
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                Instant AI Scoring
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                Band 9.0 Evaluation
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN SPACER FOR WHEEL (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 h-[420px] pointer-events-none" />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE 12 CERTIFICATES ROTATING SHOWCASE (Full width marquee across bottom)
           ───────────────────────────────────────────────────────────── */}
        <div className="w-full mt-24 sm:mt-32 lg:mt-40 xl:mt-48 pt-10 sm:pt-12 border-t border-slate-200/80 dark:border-slate-800/80 relative z-20">
          <CertificatesMarquee onSelectCertificate={setSelectedCert} />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL LIGHTBOX: Click on any certificate to view in high-res
         ───────────────────────────────────────────────────────────── */}
      <CertificateModal
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </section>
  )
}
