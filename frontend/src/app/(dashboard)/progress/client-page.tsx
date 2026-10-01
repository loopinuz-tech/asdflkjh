import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { useTheme } from '@/components/theme/theme-provider'
import { cn } from '@/lib/utils'
import { 
  ChartSquareIcon, 
  GraphUpIcon, 
  TargetIcon, 
  MedalRibbonIcon, 
  CheckSquareIcon,
  CalendarIcon, 
  BookBookmarkIcon, 
  AltArrowRightIcon, 
  MagicWand2Icon, 
  StarsIcon, 
} from '@solar-icons/react/bold-duotone'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell
} from 'recharts'
import { UserProgressData } from '@/actions/progress'

interface ProgressClientViewProps {
  data: UserProgressData
}

export function ProgressClientView({ data }: ProgressClientViewProps) {
  const [activeMetric, setActiveMetric] = useState<'overall' | 'reading' | 'listening' | 'writing' | 'speaking'>('overall')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const chartColors = {
    primary: isDark ? '#F5A623' : '#D97706',
    target: isDark ? '#71717a' : '#94a3b8',
    grid: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    axisText: isDark ? '#a1a1aa' : '#64748b',
    tooltipBg: isDark ? '#18181b' : '#ffffff',
    tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0',
    tooltipText: isDark ? '#f4f4f5' : '#0f172a',
    radarGrid: isDark ? 'rgba(255, 255, 255, 0.14)' : '#cbd5e1',
    radarLabel: isDark ? '#f4f4f5' : '#1e293b',
    radarFill: isDark ? '#F5A623' : '#D97706',
    barActive: isDark ? '#F5A623' : '#F59E0B',
    barMedium: isDark ? 'rgba(245, 166, 35, 0.65)' : 'rgba(245, 158, 11, 0.65)',
    barEmpty: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    dotBg: isDark ? '#18181b' : '#ffffff',
    cursorBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
  }

  const hasTestResults = data.testsCompleted > 0 && data.scoreHistory.length > 0
  const hasActivity = data.studyHoursTotal > 0

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
            <ChartSquareIcon className="h-5 w-5 sm:h-6 sm:w-6" size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">Your Progress</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Track your real performance and band score development.</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-start gap-4 bg-card border border-border px-3.5 py-2 rounded-xl fox-shadow-sm w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <TargetIcon className="w-4 h-4 text-primary" size={16} />
            <span className="text-xs sm:text-sm font-medium">Target Band:</span>
          </div>
          <span className="text-base sm:text-lg font-bold text-foreground">
            {data.targetBand ? data.targetBand.toFixed(1) : '7.0'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Current Band */}
        <Card className="border-border fox-shadow-sm">
          <CardContent className="p-3.5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Current Band</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {data.currentBand !== null ? data.currentBand.toFixed(1) : '—'}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
                <MedalRibbonIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center text-[11px] sm:text-xs text-muted-foreground">
              {data.currentBand !== null ? (
                <span className="text-fox-success font-medium flex items-center truncate">
                  <GraphUpIcon className="w-3.5 h-3.5 mr-1 shrink-0 text-fox-success" size={14} />
                  Average band
                </span>
              ) : (
                <span className="truncate">Take tests to reveal</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tests Completed */}
        <Card className="border-border fox-shadow-sm">
          <CardContent className="p-3.5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold">{data.testsCompleted}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
                <CheckSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center text-[11px] sm:text-xs text-muted-foreground">
              {data.testsCompleted > 0 ? (
                <span className="truncate">Across test modules</span>
              ) : (
                <span className="truncate">No tests taken yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Strongest Skill */}
        <Card className="border-border fox-shadow-sm">
          <CardContent className="p-3.5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1 sm:space-y-2 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Best Skill</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">
                  {data.strongestSkill ? data.strongestSkill.skill : '—'}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
                <GraphUpIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center text-[11px] sm:text-xs text-muted-foreground">
              {data.strongestSkill ? (
                <span className="truncate">
                  Band: <strong className="text-foreground ml-1">{data.strongestSkill.score.toFixed(1)}</strong>
                </span>
              ) : (
                <span className="truncate">1+ module needed</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Time */}
        <Card className="border-border fox-shadow-sm">
          <CardContent className="p-3.5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Study Time</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {data.studyHoursTotal > 0 ? `${data.studyHoursTotal}h` : '0h'}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" size={20} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center text-[11px] sm:text-xs text-muted-foreground">
              {data.studyHoursThisWeek > 0 ? (
                <span className="text-fox-success font-medium truncate">
                  {data.studyHoursThisWeek}h this week
                </span>
              ) : (
                <span className="truncate">Start practicing</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Score Over Time */}
        <Card className="lg:col-span-2 border-border fox-shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 pb-2 sm:pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Score History</CardTitle>
              <CardDescription className="text-xs">Your score trajectory across completed practice tests</CardDescription>
            </div>
            {hasTestResults && (
              <select 
                className="text-xs sm:text-sm border border-border rounded-xl px-3 py-1.5 bg-background text-foreground w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                value={activeMetric}
                onChange={(e) => setActiveMetric(e.target.value as any)}
              >
                <option value="overall">Overall Band</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
                <option value="writing">Writing</option>
                <option value="speaking">Speaking</option>
              </select>
            )}
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {hasTestResults ? (
              <div className="h-[240px] sm:h-[300px] w-full mt-2 sm:mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.scoreHistory} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis dataKey="date" stroke={chartColors.axisText} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 9]} ticks={[0, 2, 4, 6, 7, 8, 9]} stroke={chartColors.axisText} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        borderRadius: '10px', 
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        color: chartColors.tooltipText,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                      }}
                      itemStyle={{ color: chartColors.primary, fontWeight: 700 }}
                      labelStyle={{ color: chartColors.tooltipText, fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={activeMetric} 
                      stroke={chartColors.primary} 
                      strokeWidth={3}
                      dot={{ r: 5, strokeWidth: 2.5, stroke: chartColors.primary, fill: chartColors.dotBg }}
                      activeDot={{ r: 7, stroke: chartColors.dotBg, strokeWidth: 2, fill: chartColors.primary }}
                      name={`${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Band`}
                    />
                    {/* Target Line */}
                    <Line 
                      type="step" 
                      dataKey={() => data.targetBand || 7.0} 
                      stroke={chartColors.target} 
                      strokeDasharray="5 5" 
                      strokeWidth={2} 
                      dot={false}
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center mb-4">
                  <GraphUpIcon className="w-7 h-7" size={28} />
                </div>
                <h3 className="text-base font-semibold text-foreground">No test scores recorded yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                  Complete your first IELTS practice test in Reading, Listening, Writing, or Speaking to start tracking your score timeline.
                </p>
                <Link to="/practice"
                  className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                >
                  <BookBookmarkIcon className="w-4 h-4" size={16} />
                  <span>Start Practice Test</span>
                  <AltArrowRightIcon className="w-3.5 h-3.5" size={14} />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Chart: Skill Radar */}
        <Card className="border-border fox-shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg font-bold">Skill Balance</CardTitle>
            <CardDescription className="text-xs">Areas of strength and improvement</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {hasTestResults ? (
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skillBalance}>
                    <PolarGrid stroke={chartColors.radarGrid} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: chartColors.radarLabel, fontSize: 12, fontWeight: 600 }} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                    <Radar 
                      name="Student" 
                      dataKey="score" 
                      stroke={chartColors.primary} 
                      strokeWidth={2.5}
                      fill={chartColors.radarFill} 
                      fillOpacity={isDark ? 0.35 : 0.25} 
                      dot={{ r: 4, strokeWidth: 2, stroke: chartColors.primary, fill: chartColors.dotBg }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        borderRadius: '10px', 
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        color: chartColors.tooltipText,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                      }}
                      itemStyle={{ color: chartColors.primary, fontWeight: 700 }}
                      labelStyle={{ color: chartColors.tooltipText, fontWeight: 600 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xs flex items-center justify-center mb-4">
                  <MagicWand2Icon className="w-7 h-7" size={28} />
                </div>
                <h3 className="text-base font-semibold text-foreground">Skill Radar Inactive</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                  Evaluate each IELTS skill section to visualize your balance across Reading, Listening, Writing, and Speaking.
                </p>
                <span className="text-[11px] text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  0 of 4 skills evaluated
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Bar Chart */}
        <Card className="lg:col-span-3 border-border fox-shadow-sm">
          <CardHeader>
            <CardTitle>Activity (Last 30 Days)</CardTitle>
            <CardDescription>
              {hasActivity 
                ? `${data.studyHoursTotal} total hours spent practicing on EduFox` 
                : 'No practice sessions logged in the past 30 days'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasActivity ? (
              <div className="h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis dataKey="day" tick={false} axisLine={false} tickLine={false} />
                    <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{ fill: chartColors.cursorBg }}
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        borderRadius: '10px', 
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        color: chartColors.tooltipText,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                      }}
                      labelStyle={{ color: chartColors.tooltipText, fontWeight: 600 }}
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                      {data.activityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.hours > 1.5 
                              ? chartColors.barActive 
                              : entry.hours > 0 
                              ? chartColors.barMedium 
                              : chartColors.barEmpty
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-xl">
                <StarsIcon className="w-6 h-6 text-primary mb-2 mx-auto" size={24} />
                <p className="text-sm font-medium text-foreground">Your practice timeline starts today</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Daily practice builds your streak and helps you achieve your target band faster.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
