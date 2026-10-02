import { useMemo } from 'react'
import {
  BoxIcon,
  TargetIcon,
  CheckCircleIcon,
  BoltIcon,
  StarsIcon,
  VolumeLoudIcon,
  PenNewSquareIcon,
  CupIcon,
  RestartIcon,
  FlameIcon,
} from '@solar-icons/react/bold-duotone'
import { LeitnerWord, LEITNER_BOXES } from '@/lib/services/leitner-srs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type ReviewMode =
  | 'spaced-repetition'
  | 'word-matching'
  | 'true-false'
  | 'speed-quiz'
  | 'fill-blank'
  | 'audio-quiz'
  | 'spelling'
  | 'marathon'

interface ReviewModeSelectorProps {
  words: LeitnerWord[]
  onSelectMode: (mode: ReviewMode) => void
}

export function ReviewModeSelector({ words, onSelectMode }: ReviewModeSelectorProps) {
  // Compute Leitner Box Distribution
  const boxStats = useMemo(() => {
    const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let dueCount = 0
    const now = new Date().toISOString()

    words.forEach((w) => {
      const b = w.mastery_level || 1
      stats[b] = (stats[b] || 0) + 1
      if (!w.next_review_at || w.next_review_at <= now) {
        dueCount++
      }
    })

    return { stats, dueCount }
  }, [words])

  const modes = [
    {
      id: 'spaced-repetition' as ReviewMode,
      title: 'Spaced Repetition',
      description: `${boxStats.dueCount > 0 ? boxStats.dueCount : words.length} words awaiting review`,
      icon: BoxIcon,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'hover:border-rose-500/40',
      badge: 'Leitner System',
    },
    {
      id: 'word-matching' as ReviewMode,
      title: 'Word Matching',
      description: 'Match words with their definitions',
      icon: TargetIcon,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'hover:border-blue-500/40',
      badge: 'Interactive Pairs',
    },
    {
      id: 'true-false' as ReviewMode,
      title: 'True or False',
      description: 'Verify if the definition is correct',
      icon: CheckCircleIcon,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'hover:border-emerald-500/40',
      badge: 'Fast Recall',
    },
    {
      id: 'speed-quiz' as ReviewMode,
      title: 'Speed Quiz',
      description: 'Answer within a 10-second timer',
      icon: BoltIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'hover:border-amber-500/40',
      badge: '10s Challenge',
    },
    {
      id: 'fill-blank' as ReviewMode,
      title: 'Fill in the Blank',
      description: 'Fill the gap with the correct word',
      icon: StarsIcon,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'hover:border-purple-500/40',
      badge: 'Context Mastery',
    },
    {
      id: 'audio-quiz' as ReviewMode,
      title: 'Audio Quiz',
      description: 'Listen to the audio and choose the meaning',
      icon: VolumeLoudIcon,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      border: 'hover:border-indigo-500/40',
      badge: 'Native Audio',
    },
    {
      id: 'spelling' as ReviewMode,
      title: 'Spelling Test',
      description: 'Listen and write the exact word',
      icon: PenNewSquareIcon,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10',
      border: 'hover:border-teal-500/40',
      badge: 'Keyboard Drill',
    },
    {
      id: 'marathon' as ReviewMode,
      title: 'Marathon',
      description: '5-stage progressive review marathon',
      icon: CupIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'hover:border-amber-500/40',
      badge: '5 Stages',
    },
  ]

  return (
    <div className="w-full space-y-6">
      {/* Leitner Box Spaced Repetition Overview Banner */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Leitner Spaced Repetition System (SRS)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Scientifically proven interval reinforcement. Correct answers advance cards to longer review cycles.
            </p>
          </div>

          <Button
            onClick={() => onSelectMode('spaced-repetition')}
            className="rounded-2xl px-5 py-2.5 bg-primary text-black font-bold text-xs sm:text-sm hover:bg-primary/90 shadow-xs cursor-pointer shrink-0"
          >
            <BoxIcon size={18} className="mr-1.5" />
            Review Due Words ({boxStats.dueCount > 0 ? boxStats.dueCount : words.length})
          </Button>
        </div>

        {/* 5 Leitner Boxes Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5">
          {LEITNER_BOXES.map((b) => {
            const count = boxStats.stats[b.box] || 0
            const percentage = words.length > 0 ? Math.round((count / words.length) * 100) : 0
            return (
              <div
                key={b.box}
                className={`p-3.5 sm:p-4 rounded-2xl border ${b.border} ${b.bg} flex flex-col justify-between transition-all hover:scale-[1.02] shadow-xs`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${b.color}`}>{b.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-semibold">
                    {b.intervalDays}d cycle
                  </Badge>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{count}</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1">
                  {b.label}
                </div>
                {/* Progress Mini Bar */}
                <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.box === 5 ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 8 Review Mode Cards Grid (Matching Screenshot 1) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-foreground">
              Review Practice Modes
            </h4>
            <p className="text-xs text-muted-foreground">
              Choose your favorite interactive training mode
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
            8 Game Modes
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <div
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 bg-card hover:bg-muted/40 transition-all duration-200 cursor-pointer shadow-xs ${mode.border} flex flex-col justify-between min-h-[110px]`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${mode.bg} ${mode.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-bold text-sm sm:text-base text-foreground tracking-tight group-hover:text-foreground">
                        {mode.title}
                      </h5>
                      <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
