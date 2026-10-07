import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BookBookmarkIcon, 
  HeadphonesRoundIcon, 
  Pen2Icon, 
  Microphone2Icon,
  TargetIcon,
  GraphUpIcon,
  FireIcon,
  TranslationIcon,
  AltArrowRightIcon,
} from '@solar-icons/react/bold-duotone'
import { Sparkles } from 'lucide-react'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUserProgress, type UserProgressData } from '@/actions/progress'

export default function DashboardPage() {
  const [progress, setProgress] = useState<UserProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserProgress().then((data) => {
      setProgress(data)
      setLoading(false)
    })
  }, [])

  if (loading || !progress) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse w-full">
        <div className="h-9 bg-muted/60 rounded-xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/60 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/60 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // 4 IELTS skills with customized signature color schemes
  const skills = [
    { 
      skill: 'Reading', 
      score: progress.skillAverages.reading, 
      target: progress.targetBand || 7.5,
      href: '/reading',
      icon: BookBookmarkIcon,
      desc: 'Academic Passages & Questions',
      // Emerald Green theme
      theme: {
        accentColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
        iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        iconHoverBg: 'group-hover:bg-emerald-500 group-hover:text-white',
        borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
        titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        arrowHover: 'group-hover:text-emerald-500',
        barGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      }
    },
    { 
      skill: 'Listening', 
      score: progress.skillAverages.listening, 
      target: progress.targetBand || 7.5,
      href: '/listening',
      icon: HeadphonesRoundIcon,
      desc: 'Conversations & Monologues',
      // Royal Blue theme
      theme: {
        accentColor: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25',
        iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        iconHoverBg: 'group-hover:bg-blue-500 group-hover:text-white',
        borderHover: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
        titleHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        arrowHover: 'group-hover:text-blue-500',
        barGradient: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      }
    },
    { 
      skill: 'Writing', 
      score: progress.skillAverages.writing, 
      target: progress.targetBand || 7.5,
      href: '/writing',
      icon: Pen2Icon,
      desc: 'Task 1 & Task 2 AI Feedback',
      // Amber / Orange theme
      theme: {
        accentColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
        iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        iconHoverBg: 'group-hover:bg-amber-500 group-hover:text-primary-foreground',
        borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
        titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
        arrowHover: 'group-hover:text-amber-500',
        barGradient: 'bg-gradient-to-r from-amber-400 to-orange-400',
      }
    },
    { 
      skill: 'Speaking', 
      score: progress.skillAverages.speaking, 
      target: progress.targetBand || 7.5,
      href: '/speaking',
      icon: Microphone2Icon,
      desc: 'Part 1, 2 & 3 AI Simulator',
      // Rose / Coral theme
      theme: {
        accentColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25',
        iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
        iconHoverBg: 'group-hover:bg-rose-500 group-hover:text-white',
        borderHover: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
        titleHover: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
        arrowHover: 'group-hover:text-rose-500',
        barGradient: 'bg-gradient-to-r from-rose-500 to-pink-500',
      }
    },
  ]

  return (
    <>
      <Helmet>
        <title>Dashboard — EduFox</title>
        <meta name="description" content="Your personalized IELTS preparation overview." />
      </Helmet>

      <div className="space-y-6 sm:space-y-8 w-full">
        {/* Top Welcome Hero Banner with EduFox Mascot */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-amber-500/10 p-5 sm:p-6 lg:p-7 shadow-xs">
          {/* Ambient Background Glows */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-400/10" />
          <div className="pointer-events-none absolute -bottom-10 right-36 h-32 w-32 rounded-full bg-orange-500/15 blur-2xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-3 max-w-xl">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Good day, {progress.userName || 'Student'}!
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Welcome back to your IELTS practice hub. Track your skill benchmarks, train SRS vocabulary, and challenge real-time AI examiners.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm shadow-xs transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                  <span>Take Full Mock Test</span>
                </Link>

                <Link
                  to="/speaking/live"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card/80 hover:bg-secondary text-foreground font-medium text-xs sm:text-sm transition-all"
                >
                  <Microphone2Icon className="w-4 h-4 text-rose-500" size={16} />
                  <span>Live Speaking AI</span>
                </Link>
              </div>
            </div>

            {/* Mascot Image - Large, anchored to bottom border, no hover effect */}
            <div className="relative shrink-0 flex items-end justify-center sm:justify-end self-center sm:self-end -mb-5 sm:-mb-6 lg:-mb-7 -mr-1 sm:-mr-3 lg:-mr-5">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-full bg-amber-400/20 blur-2xl dark:bg-amber-400/10" />
                <img
                  src="/dashboard_mascot.png"
                  alt="EduFox Mascot"
                  className="relative z-10 h-32 sm:h-40 md:h-48 lg:h-52 xl:h-56 w-auto max-w-[300px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] object-contain object-bottom drop-shadow-md select-none pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 1. 4 Metric Cards with Dedicated Distinct Color Accents */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5 w-full">
          {/* 1. Target Band — Purple */}
          <div className="p-4 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between hover:border-violet-500/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Target Band</span>
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 flex items-center justify-center shrink-0">
                <TargetIcon className="w-4.5 h-4.5" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {progress.targetBand ? progress.targetBand.toFixed(1) : '7.5'}
              </div>
              <p className="text-[11px] text-violet-600/80 dark:text-violet-400/80 mt-0.5">IELTS Target Goal</p>
            </div>
          </div>

          {/* 2. Estimated Band — Emerald */}
          <div className="p-4 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Estimated Band</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <GraphUpIcon className="w-4.5 h-4.5" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {progress.currentBand !== null && progress.currentBand > 0
                  ? progress.currentBand.toFixed(1)
                  : '5.5'}
              </div>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Current Evaluation</p>
            </div>
          </div>

          {/* 3. Tests Completed — Flame Orange */}
          <div className="p-4 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between hover:border-orange-500/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Tests Completed</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 flex items-center justify-center shrink-0">
                <FireIcon className="w-4.5 h-4.5" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {progress.testsCompleted || 0}
              </div>
              <p className="text-[11px] text-orange-600/80 dark:text-orange-400/80 mt-0.5">Finished Sessions</p>
            </div>
          </div>

          {/* 4. Vocabulary Mastered — Sky Blue */}
          <div className="p-4 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between hover:border-sky-500/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Vocabulary</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 flex items-center justify-center shrink-0">
                <TranslationIcon className="w-4.5 h-4.5" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {progress.vocabCount || 0}
              </div>
              <p className="text-[11px] text-sky-600/80 dark:text-sky-400/80 mt-0.5">Saved Words in SRS</p>
            </div>
          </div>
        </div>

        {/* 2. Skill Modules Section (Each Skill with its Own Iconic Color) */}
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              IELTS Skill Modules
            </h2>
            <Link to="/practice" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <span>View all tests</span>
              <AltArrowRightIcon className="w-3.5 h-3.5" size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            {skills.map((item) => {
              const IconComp = item.icon
              const t = item.theme
              return (
                <Link
                  key={item.skill}
                  to={item.href}
                  className={cn(
                    'p-4 sm:p-4.5 rounded-2xl bg-card border border-border shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4 cursor-pointer',
                    t.borderHover
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 shadow-2xs',
                      t.iconBg,
                      t.iconHoverBg
                    )}>
                      <IconComp className="w-5 h-5" size={20} />
                    </div>
                    <AltArrowRightIcon className={cn('w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-all', t.arrowHover)} size={16} />
                  </div>
                  <div>
                    <h3 className={cn('text-sm font-semibold text-foreground transition-colors', t.titleHover)}>
                      {item.skill}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 3. Skill Progress Breakdown & CTA Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full">
          {/* Skill Progress Breakdown Card with Individual Color Bars */}
          <Card className="border border-border shadow-2xs rounded-2xl w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Skill Progress Breakdown</span>
                <span className="text-xs font-normal text-muted-foreground">Target: 9.0</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4.5 pt-1">
              {skills.map((item) => {
                const hasScore = item.score > 0
                const targetScore = item.target || 9.0
                const percentage = hasScore ? Math.min(100, Math.round((item.score / targetScore) * 100)) : 0
                const t = item.theme
                return (
                  <div key={item.skill} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', t.barGradient)} />
                        <span className="font-medium text-foreground">{item.skill}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasScore ? (
                          <span className={cn('font-medium px-2 py-0.5 rounded-full text-[11px]', t.badgeBg)}>
                            Band {item.score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-normal">Not tested yet</span>
                        )}
                      </div>
                    </div>
                    {/* Unique gradient progress bar per skill */}
                    <div className="w-full bg-secondary/80 dark:bg-muted h-2.5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700 ease-out', t.barGradient)}
                        style={{ width: `${hasScore ? Math.max(6, percentage) : 0}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Continue Learning CTA with EduFox Mascot */}
          <Card className="border border-border bg-gradient-to-br from-card via-card to-amber-500/10 shadow-2xs relative overflow-hidden p-5 sm:p-6 rounded-2xl flex flex-col justify-between w-full">
            <div className="absolute right-[-10px] bottom-[-10px] sm:right-2 sm:bottom-2 opacity-30 sm:opacity-95 pointer-events-none z-0">
              <FoxMascot variant="reading" size="xl" className="w-36 h-36 sm:w-44 sm:h-44" />
            </div>
            <div className="relative z-10 space-y-3.5 max-w-[85%] sm:max-w-[75%]">
              <div>
                <span className="inline-block text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/25 mb-2">
                  FULL CAMBRIDGE MOCK TESTS
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                  Practice Authentic IELTS Tests
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Real timing, authentic questions, instant automated scoring, and detailed AI feedback for Task 1, Task 2 essays and Speaking topics.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs text-xs sm:text-sm transition-all active:scale-95"
                >
                  <span>Explore Practice Catalog</span>
                  <AltArrowRightIcon className="w-4 h-4 text-primary-foreground" size={16} />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
