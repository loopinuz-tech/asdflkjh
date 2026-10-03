import React from 'react'
import {
  BoxIcon,
  TargetIcon,
  CheckSquareIcon,
  BoltIcon,
  StarsIcon,
  VolumeLoudIcon,
  PenNewSquareIcon,
  CupStarIcon,
} from '@solar-icons/react/bold-duotone'

export interface SRSBoxCounts {
  1: number
  2: number
  3: number
  4: number
  5: number
}

export interface PracticeModeConfig {
  id: string
  title: string
  category: string
  subtitle: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  color: {
    bg: string
    text: string
    border?: string
  }
}

export const PRACTICE_MODES: PracticeModeConfig[] = [
  {
    id: 'spaced_repetition',
    title: 'Spaced Repetition',
    category: 'Leitner System',
    subtitle: 'words awaiting review',
    icon: BoxIcon,
    color: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-500',
      border: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
  },
  {
    id: 'word_matching',
    title: 'Word Matching',
    category: 'Interactive Pairs',
    subtitle: 'Match words with their definitions',
    icon: TargetIcon,
    color: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-500',
      border: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
  },
  {
    id: 'true_or_false',
    title: 'True or False',
    category: 'Fast Recall',
    subtitle: 'Verify if the definition is correct',
    icon: CheckSquareIcon,
    color: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-500',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
  },
  {
    id: 'speed_quiz',
    title: 'Speed Quiz',
    category: '10s Challenge',
    subtitle: 'Answer within a 10-second timer',
    icon: BoltIcon,
    color: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-500',
      border: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
  },
  {
    id: 'fill_in_the_blank',
    title: 'Fill in the Blank',
    category: 'Context Mastery',
    subtitle: 'Fill the gap with the correct word',
    icon: StarsIcon,
    color: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-500',
      border: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
  },
  {
    id: 'audio_quiz',
    title: 'Audio Quiz',
    category: 'Native Audio',
    subtitle: 'Listen to the audio and choose the meaning',
    icon: VolumeLoudIcon,
    color: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-500',
      border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    },
  },
  {
    id: 'spelling_test',
    title: 'Spelling Test',
    category: 'Keyboard Drill',
    subtitle: 'Listen and write the exact word',
    icon: PenNewSquareIcon,
    color: {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-500',
      border: 'hover:border-teal-300 dark:hover:border-teal-700',
    },
  },
  {
    id: 'marathon',
    title: 'Marathon',
    category: '5 Stages',
    subtitle: '5-stage progressive review marathon',
    icon: CupStarIcon,
    color: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/40',
      text: 'text-yellow-600',
      border: 'hover:border-yellow-300 dark:hover:border-yellow-700',
    },
  },
]

interface SRSLeitnerBannerProps {
  boxCounts: SRSBoxCounts
  dueCount: number
  onOpenMode: (modeId: string) => void
  onReviewDue: () => void
}

export function SRSLeitnerBanner({
  boxCounts,
  dueCount,
  onOpenMode,
  onReviewDue,
}: SRSLeitnerBannerProps) {
  const totalDeckWords =
    boxCounts[1] + boxCounts[2] + boxCounts[3] + boxCounts[4] + boxCounts[5]

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Leitner Spaced Repetition System (SRS) Card */}
      <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs shadow-amber-400/50" />
              <h2 className="text-sm sm:text-lg font-bold tracking-tight text-foreground">
                Leitner Spaced Repetition System (SRS)
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-normal leading-relaxed">
              Scientifically proven interval reinforcement. Correct answers advance cards to longer review cycles.
            </p>
          </div>

          <button
            onClick={onReviewDue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <BoxIcon className="w-4 h-4 text-black shrink-0" size={16} />
            <span>Review Due Words ({dueCount})</span>
          </button>
        </div>

        {/* 5 Leitner Boxes Row (Responsive 2-col on mobile, 5-col on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mt-4 sm:mt-5">
          {/* Box 1 */}
          <div
            onClick={() => onOpenMode('spaced_repetition')}
            className="bg-[#fef2f2] dark:bg-rose-950/20 border border-[#fecdd3] dark:border-rose-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#e11d48] text-xs">Box 1</span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">1d cycle</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground my-2 sm:my-2.5">
              {boxCounts[1]}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                Daily Review
              </div>
              <div className="w-full h-1 bg-[#fecdd3]/60 dark:bg-rose-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: totalDeckWords > 0 ? `${(boxCounts[1] / totalDeckWords) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Box 2 */}
          <div
            onClick={() => onOpenMode('spaced_repetition')}
            className="bg-[#fffbeb] dark:bg-amber-950/20 border border-[#fde68a] dark:border-amber-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#d97706] text-xs">Box 2</span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">3d cycle</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground my-2 sm:my-2.5">
              {boxCounts[2]}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                Every 3 Days
              </div>
              <div className="w-full h-1 bg-[#fde68a]/60 dark:bg-amber-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: totalDeckWords > 0 ? `${(boxCounts[2] / totalDeckWords) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Box 3 */}
          <div
            onClick={() => onOpenMode('spaced_repetition')}
            className="bg-[#eff6ff] dark:bg-blue-950/20 border border-[#bfdbfe] dark:border-blue-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2563eb] text-xs">Box 3</span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">7d cycle</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground my-2 sm:my-2.5">
              {boxCounts[3]}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                Every 7 Days
              </div>
              <div className="w-full h-1 bg-[#bfdbfe]/60 dark:bg-blue-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: totalDeckWords > 0 ? `${(boxCounts[3] / totalDeckWords) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Box 4 */}
          <div
            onClick={() => onOpenMode('spaced_repetition')}
            className="bg-[#f5f3ff] dark:bg-purple-950/20 border border-[#ddd6fe] dark:border-purple-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#7c3aed] text-xs">Box 4</span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">14d cycle</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground my-2.5">
              {boxCounts[4]}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                Every 14 Days
              </div>
              <div className="w-full h-1 bg-[#ddd6fe]/60 dark:bg-purple-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: boxCounts[4] > 0 ? '100%' : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Box 5 (Spans 2 columns on mobile so it looks balanced) */}
          <div
            onClick={() => onOpenMode('spaced_repetition')}
            className="bg-[#f0fdf4] dark:bg-emerald-950/20 border border-[#bbf7d0] dark:border-emerald-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all active:scale-[0.98] col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#059669] text-xs">Box 5</span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">30d cycle</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground my-2 sm:my-2.5">
              {boxCounts[5]}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                Mastered (30 Days)
              </div>
              <div className="w-full h-1 bg-[#bbf7d0]/60 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: totalDeckWords > 0 ? `${(boxCounts[5] / totalDeckWords) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Practice Modes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-foreground">
              Review Practice Modes
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Choose your favorite interactive training mode
            </p>
          </div>
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground text-[10px] sm:text-xs font-semibold shrink-0">
            8 Game Modes
          </span>
        </div>

        {/* 8 Game Modes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {PRACTICE_MODES.map((mode) => {
            const Icon = mode.icon
            const isSpacedRepetition = mode.id === 'spaced_repetition'

            return (
              <div
                key={mode.id}
                onClick={() => onOpenMode(mode.id)}
                className={`bg-card border border-border/80 hover:border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-200 cursor-pointer flex items-center gap-3 sm:gap-3.5 group shadow-xs hover:shadow-sm active:scale-[0.99] ${
                  mode.color.border || ''
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${mode.color.bg} ${mode.color.text} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {mode.title}
                    </h4>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold shrink-0">
                      {mode.category}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5">
                    {isSpacedRepetition
                      ? `${dueCount} ${mode.subtitle}`
                      : mode.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
