import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Brain, 
  Calendar as CalendarIcon, 
  Award,
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react'
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

  const hasTestResults = data.testsCompleted > 0 && data.scoreHistory.length > 0
  const hasActivity = data.studyHoursTotal > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Progress</h1>
            <p className="text-muted-foreground">Track your real performance and band score development.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-card border border-border px-4 py-2 rounded-lg fox-shadow-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Target Band:</span>
          </div>
          <span className="text-lg font-bold text-foreground">
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
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center text-[11px] sm:text-xs text-muted-foreground">
              {data.currentBand !== null ? (
                <span className="text-fox-success font-medium flex items-center truncate">
                  <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
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
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
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
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-fox-yellow/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-fox-yellow" />
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
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Score History</CardTitle>
              <CardDescription>Your score trajectory across completed practice tests</CardDescription>
            </div>
            {hasTestResults && (
              <select 
                className="text-sm border border-border rounded-md px-2 py-1 bg-background"
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
          <CardContent>
            {hasTestResults ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.scoreHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 9]} ticks={[0, 2, 4, 6, 7, 8, 9]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={activeMetric} 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                    {/* Target Line */}
                    <Line 
                      type="step" 
                      dataKey={() => data.targetBand || 7.0} 
                      stroke="hsl(var(--muted-foreground))" 
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
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No test scores recorded yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                  Complete your first IELTS practice test in Reading, Listening, Writing, or Speaking to start tracking your score timeline.
                </p>
                <Link to="/practice"
                  className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Practice Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Chart: Skill Radar */}
        <Card className="border-border fox-shadow-sm">
          <CardHeader>
            <CardTitle>Skill Balance</CardTitle>
            <CardDescription>Areas of strength and improvement</CardDescription>
          </CardHeader>
          <CardContent>
            {hasTestResults ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skillBalance}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                    <Radar 
                      name="Student" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.4} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Skill Radar Inactive</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                  Evaluate each IELTS skill section to visualize your balance across Reading, Listening, Writing, and Speaking.
                </p>
                <span className="text-[11px] text-primary/80 font-medium bg-primary/10 px-2.5 py-1 rounded-full">
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
                  <BarChart data={data.activityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="day" tick={false} axisLine={false} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                      {data.activityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.hours > 1.5 ? 'hsl(var(--primary))' : entry.hours > 0 ? 'hsl(var(--primary)/0.6)' : 'hsl(var(--border))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-xl">
                <Sparkles className="w-6 h-6 text-muted-foreground mb-2" />
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
