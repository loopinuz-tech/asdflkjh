import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const skills = [
    { skill: 'Reading', score: progress.skillAverages.reading, target: progress.targetBand, color: 'bg-primary' },
    { skill: 'Listening', score: progress.skillAverages.listening, target: progress.targetBand, color: 'bg-primary' },
    { skill: 'Writing', score: progress.skillAverages.writing, target: progress.targetBand, color: 'bg-primary' },
    { skill: 'Speaking', score: progress.skillAverages.speaking, target: progress.targetBand, color: 'bg-primary' },
  ]

  return (
    <>
      <Helmet>
        <title>Dashboard — EduFox</title>
        <meta name="description" content="Your personalized IELTS preparation overview." />
      </Helmet>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Good day, {progress.userName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Here is an overview of your IELTS preparation progress.
            </p>
          </div>
        </div>

        {/* 4 Metric Cards Grid (Target Band, Estimated Band side-by-side on mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* 1. Target Band */}
          <div className="p-3.5 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-foreground">Target Band</span>
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <TargetIcon className="w-4 h-4" size={16} />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-3xl font-extrabold text-foreground">
                {progress.targetBand ? progress.targetBand.toFixed(1) : '9.0'}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">Academic IELTS</p>
            </div>
          </div>

          {/* 2. Estimated Band */}
          <div className="p-3.5 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-foreground">Estimated Band</span>
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <GraphUpIcon className="w-4 h-4" size={16} />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-3xl font-extrabold text-foreground">
                {progress.currentBand !== null && progress.currentBand > 0
                  ? progress.currentBand.toFixed(1)
                  : '1.5'}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">Based on results</p>
            </div>
          </div>

          {/* 3. Tests Completed */}
          <div className="p-3.5 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-foreground">Tests Completed</span>
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <FireIcon className="w-4 h-4" size={16} />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-3xl font-extrabold text-foreground">
                {progress.testsCompleted || 2}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">Sessions scored</p>
            </div>
          </div>

          {/* 4. Vocabulary */}
          <div className="p-3.5 sm:p-5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-foreground">Vocabulary</span>
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <TranslationIcon className="w-4 h-4" size={16} />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-3xl font-extrabold text-foreground">
                {progress.vocabCount || 0}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">Words mastered</p>
            </div>
          </div>
        </div>

        {/* Skill Module Navigation Cards (Reading, Listening, Writing, Speaking) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              IELTS Skill Modules
            </h2>
            <span className="text-xs text-primary font-semibold">Select module to practice</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Reading */}
            <Link
              to="/reading"
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <BookBookmarkIcon className="w-5 h-5" size={20} />
                </div>
                <AltArrowRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Reading
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Passages & Questions</p>
              </div>
            </Link>

            {/* Listening */}
            <Link
              to="/listening"
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <HeadphonesRoundIcon className="w-5 h-5" size={20} />
                </div>
                <AltArrowRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Listening
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Audio & Recordings</p>
              </div>
            </Link>

            {/* Writing */}
            <Link
              to="/writing"
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <Pen2Icon className="w-5 h-5" size={20} />
                </div>
                <AltArrowRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Writing
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Task 1 & Task 2 Essays</p>
              </div>
            </Link>

            {/* Speaking */}
            <Link
              to="/speaking"
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <Microphone2Icon className="w-5 h-5" size={20} />
                </div>
                <AltArrowRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Speaking
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Part 1, 2 & 3 Practice</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Skill Progress Overview & CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1 border border-border fox-shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Skill Progress Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {skills.map((item) => {
                const hasScore = item.score > 0
                const percentage = hasScore ? Math.min(100, Math.round((item.score / item.target) * 100)) : 0
                return (
                  <div key={item.skill} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground">{item.skill}</span>
                      <span className="text-muted-foreground">
                        {hasScore
                          ? `${item.score.toFixed(1)} / ${item.target.toFixed(1)}`
                          : `Not tested (Target: ${item.target.toFixed(1)})`}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-secondary [&>div]:bg-primary" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Continue Learning CTA */}
          <Card className="col-span-1 border border-border bg-gradient-to-br from-card via-card to-primary/10 fox-shadow-sm relative overflow-hidden p-5 sm:p-6 rounded-2xl flex flex-col justify-between">
            <div className="absolute right-[-10px] bottom-[-10px] sm:right-0 sm:bottom-0 opacity-25 sm:opacity-90 pointer-events-none z-0">
              <FoxMascot variant="reading" size="xl" className="w-36 h-36 sm:w-48 sm:h-48" />
            </div>
            <div className="relative z-10 space-y-3 max-w-[80%] sm:max-w-[72%]">
              <div>
                <span className="inline-block text-[10px] font-extrabold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 mb-1.5">
                  ALL MODULES
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                  Start IELTS Mock Test
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Academic Reading, Listening, Writing &amp; Speaking. Practice full authentic Cambridge tests to raise your band score.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/practice" className={cn(buttonVariants(), 'gap-2 font-bold cursor-pointer shadow-xs text-xs sm:text-sm')}>
                  <span>Explore All Practice Tests</span>
                  <AltArrowRightIcon className="w-4 h-4" size={16} />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
