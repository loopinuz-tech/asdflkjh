import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BookBookmarkIcon, 
  HeadphonesRoundIcon, 
  Pen2Icon, 
  Microphone2Icon, 
  ClockCircleIcon, 
  AltArrowRightIcon, 
  PlayCircleIcon, 
  RestartSquareIcon, 
  EyeIcon, 
  CheckSquareIcon,
} from '@solar-icons/react/bold-duotone'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PracticeHistory() {
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const [attemptsRes, writingRes, speakingRes] = await Promise.all([
          supabase
            .from('test_attempts')
            .select(`
              id,
              test_id,
              raw_score,
              estimated_band,
              status,
              created_at,
              tests (
                id,
                title,
                skill
              )
            `)
            .eq('user_id', user.id)
            .in('status', ['submitted', 'scored', 'completed'])
            .order('created_at', { ascending: false })
            .limit(15),
          supabase
            .from('writing_submissions')
            .select(`
              id,
              prompt_id,
              word_count,
              status,
              created_at,
              prompt:prompt_id (
                id,
                title,
                task_type
              ),
              feedback:writing_feedback (
                estimated_band
              )
            `)
            .eq('user_id', user.id)
            .in('status', ['submitted', 'completed', 'graded', 'reviewed'])
            .order('created_at', { ascending: false })
            .limit(15),
          supabase
            .from('speaking_submissions')
            .select(`
              id,
              prompt_id,
              duration_seconds,
              status,
              created_at,
              prompt:prompt_id (
                id,
                title,
                part_number
              ),
              feedback:speaking_feedback (
                estimated_band
              )
            `)
            .eq('user_id', user.id)
            .in('status', ['submitted', 'completed', 'graded', 'reviewed'])
            .order('created_at', { ascending: false })
            .limit(15),
        ])

        const formattedReadingListening = (attemptsRes.data || []).map((a: any) => {
          const testInfo = Array.isArray(a.tests) ? a.tests[0] : a.tests
          const skill = (testInfo?.skill || 'reading').toLowerCase()
          return {
            id: a.id,
            skill,
            title: testInfo?.title || 'Practice Test',
            estimated_band: a.estimated_band ? Number(a.estimated_band) : null,
            raw_score: a.raw_score,
            status: a.status || 'completed',
            created_at: a.created_at,
            href: `/${skill}/${a.test_id}?attemptId=${a.id}&review=true`,
          }
        })

        const formattedWriting = (writingRes.data || []).map((w: any) => {
          const promptInfo = Array.isArray(w.prompt) ? w.prompt[0] : w.prompt
          const feedbackInfo = Array.isArray(w.feedback) ? w.feedback[0] : w.feedback
          return {
            id: w.id,
            skill: 'writing',
            title: promptInfo?.title || 'Writing Task',
            estimated_band: feedbackInfo?.estimated_band ? Number(feedbackInfo.estimated_band) : null,
            status: w.status || 'submitted',
            created_at: w.created_at,
            href: `/writing/${w.id}`,
          }
        })

        const formattedSpeaking = (speakingRes.data || []).map((s: any) => {
          const promptInfo = Array.isArray(s.prompt) ? s.prompt[0] : s.prompt
          const feedbackInfo = Array.isArray(s.feedback) ? s.feedback[0] : s.feedback
          return {
            id: s.id,
            skill: 'speaking',
            title: promptInfo?.title ? `Part ${promptInfo.part_number || 1}: ${promptInfo.title}` : 'Speaking Interview',
            estimated_band: feedbackInfo?.estimated_band ? Number(feedbackInfo.estimated_band) : null,
            status: s.status || 'submitted',
            created_at: s.created_at,
            href: `/speaking/${s.id}`,
          }
        })

        const merged = [...formattedReadingListening, ...formattedWriting, ...formattedSpeaking]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 15)

        setRecentAttempts(merged)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const getSkillConfig = (skill: string) => {
    switch (skill) {
      case 'reading':
        return { icon: BookBookmarkIcon, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15 shadow-2xs', label: 'Reading' }
      case 'listening':
        return { icon: HeadphonesRoundIcon, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/15 shadow-2xs', label: 'Listening' }
      case 'writing':
        return { icon: Pen2Icon, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15 shadow-2xs', label: 'Writing' }
      case 'speaking':
        return { icon: Microphone2Icon, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15 shadow-2xs', label: 'Speaking' }
      default:
        return { icon: CheckSquareIcon, color: 'text-foreground', bg: 'bg-secondary shadow-2xs', label: 'Practice' }
    }
  }

  const modules = [
    {
      id: 'reading',
      title: 'Reading',
      desc: 'Authentic Cambridge reading passages with 15 question types.',
      icon: BookBookmarkIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/15 shadow-xs',
      href: '/reading',
      count: 'Full Tests',
    },
    {
      id: 'listening',
      title: 'Listening',
      desc: 'Realistic audio recordings across 4 sections with timed playback.',
      icon: HeadphonesRoundIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/15 shadow-xs',
      href: '/listening',
      count: 'Audio Tests',
    },
    {
      id: 'writing',
      title: 'Writing',
      desc: 'Task 1 and Task 2 prompts evaluated with detailed criteria.',
      icon: Pen2Icon,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/15 shadow-xs',
      href: '/writing',
      count: 'Tasks 1 & 2',
    },
    {
      id: 'speaking',
      title: 'Speaking',
      desc: 'Part 1, 2, and 3 interview questions with simulated examiners.',
      icon: Microphone2Icon,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/15 shadow-xs',
      href: '/speaking',
      count: 'Parts 1-3',
    },
  ]

  return (
    <div className="w-full max-w-full space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
            <ClockCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">Practice Center</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Select a skill module to practice or review your past attempts.</p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {modules.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.id} className="border-border fox-shadow-sm hover:border-primary/50 transition-all group flex flex-col justify-between">
              <CardContent className="p-4 sm:p-5 flex flex-col h-full justify-between gap-4">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center', m.bgColor)}>
                      <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', m.color)} size={22} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{m.count}</span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold group-hover:text-primary transition-colors">{m.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.desc}</p>
                  </div>
                </div>

                <Link to={m.href}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors text-xs font-semibold')}
                >
                  <span>Start Module</span>
                  <AltArrowRightIcon className="w-4 h-4" size={16} />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent History Table */}
      <Card className="border-border fox-shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <RestartSquareIcon className="w-5 h-5 text-primary shrink-0" size={20} />
              <span>Recent Test Attempts</span>
            </CardTitle>
            <CardDescription className="text-xs">Your scored practice sessions and progress logs across all 4 IELTS skills</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentAttempts.length > 0 ? (
            <div className="divide-y divide-border">
              {recentAttempts.map((attempt: any) => {
                const config = getSkillConfig(attempt.skill)
                const Icon = config.icon
                return (
                  <div key={attempt.id} className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2 sm:px-3 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', config.bg)}>
                        <Icon className={cn('w-4 h-4', config.color)} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {attempt.title}
                        </h4>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                          <span className="font-semibold text-foreground/80">{config.label}</span>
                          <span>·</span>
                          <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-border/40 sm:border-0 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {attempt.estimated_band ? `Band ${Number(attempt.estimated_band).toFixed(1)}` : 'Completed'}
                        </div>
                        <div className="text-[11px] text-muted-foreground capitalize">
                          {attempt.raw_score !== undefined && attempt.raw_score !== null ? `${attempt.raw_score}/40 · ` : ''}
                          {attempt.status}
                        </div>
                      </div>
                      {attempt.href && (
                        <Link
                          to={attempt.href}
                          className="h-8 px-3 rounded-xl bg-primary/10 hover:bg-primary text-foreground hover:text-primary-foreground font-semibold text-xs border border-primary/30 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ml-auto sm:ml-0"
                        >
                          <EyeIcon className="w-3.5 h-3.5 text-primary" size={14} />
                          <span className="hidden sm:inline">Review Full Test</span>
                          <span className="sm:hidden">Review</span>
                          <AltArrowRightIcon className="w-3.5 h-3.5" size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FoxMascot variant="default" size="lg" className="mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-1">No practice history yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                You haven&apos;t completed any tests yet. Choose a module above to start your practice journey!
              </p>
              <Link to="/reading" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
                <PlayCircleIcon className="w-4 h-4" size={16} />
                <span>Try Reading Practice</span>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
