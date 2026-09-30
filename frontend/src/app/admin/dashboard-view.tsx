import React from 'react'
import { Link } from 'react-router-dom'
import {
  DocumentTextIcon,
  QuestionCircleIcon,
  UsersGroupTwoRoundedIcon,
  CrownStarIcon,
  ChartSquareIcon,
  AddCircleIcon,
  CloudUploadIcon,
  BookBookmarkIcon,
  HeadphonesRoundIcon,
  Pen2Icon,
  Microphone2Icon,
  ClockCircleIcon,
  CheckCircleIcon,
  DangerCircleIcon,
  AltArrowRightIcon,
} from '@solar-icons/react/bold-duotone'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { FoxLogo } from '@/components/mascot/fox-mascot'
import { cn } from '@/lib/utils'

interface DashboardViewProps {
  stats: {
    metrics: {
      totalTests: number
      publishedTests: number
      draftTests: number
      freeTests: number
      premiumTests: number
      totalQuestions: number
      readingQuestions: number
      listeningQuestions: number
      writingTasks: number
      speakingTasks: number
      totalUsers: number
      premiumUsers: number
      totalAttempts: number
    }
    storage?: {
      totalGb: number
      usedGb: number
      freeGb: number
      usedPercent: number
      uploadsSizeMb: number
      uploadsCount: number
      dbSizePretty: string
      dbSizeBytes: number
    }
    creationTrendData?: any[]
    attemptsTrendData?: any[]
    weeklyGrowthText?: string
    recentLogs: any[]
    popularTests: any[]
  }
}

export function AdminDashboardView({ stats }: DashboardViewProps) {
  const { metrics, recentLogs, popularTests } = stats

  // Real database-driven chart datasets
  const creationTrendData = stats.creationTrendData && stats.creationTrendData.length > 0
    ? stats.creationTrendData
    : [
        { name: 'Tests', tests: metrics.totalTests || 0, questions: metrics.totalQuestions || 0 },
      ]

  const attemptsTrendData = stats.attemptsTrendData && stats.attemptsTrendData.length > 0
    ? stats.attemptsTrendData
    : [
        { day: 'Mon', attempts: 0, avgBand: 0 },
        { day: 'Tue', attempts: 0, avgBand: 0 },
        { day: 'Wed', attempts: 0, avgBand: 0 },
        { day: 'Thu', attempts: 0, avgBand: 0 },
        { day: 'Fri', attempts: 0, avgBand: 0 },
        { day: 'Sat', attempts: 0, avgBand: 0 },
        { day: 'Sun', attempts: 0, avgBand: 0 },
      ]

  const freeVsPremiumData = [
    { name: 'Free Tests', value: metrics.freeTests || (metrics.premiumTests ? 0 : 1), color: '#f59e0b' },
    { name: 'Premium Tests', value: metrics.premiumTests || 0, color: '#e11d48' },
  ]

  const cards = [
    { label: 'Total Tests', value: metrics.totalTests, icon: DocumentTextIcon, color: 'text-primary bg-primary/10 border border-primary/20', link: '/admin/tests' },
    { label: 'Published Tests', value: metrics.publishedTests, icon: CheckCircleIcon, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20', link: '/admin/tests?status=published' },
    { label: 'Draft Tests', value: metrics.draftTests, icon: ClockCircleIcon, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20', link: '/admin/tests?status=draft' },
    { label: 'Free Tests', value: metrics.freeTests, icon: CrownStarIcon, color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20', link: '/admin/tests?is_premium=free' },
    { label: 'Premium Tests', value: metrics.premiumTests, icon: CrownStarIcon, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20', link: '/admin/tests?is_premium=premium' },
    { label: 'Total Questions', value: metrics.totalQuestions, icon: QuestionCircleIcon, color: 'text-primary bg-primary/10 border border-primary/20', link: '/admin/tests' },
    { label: 'Reading Tests', value: metrics.readingQuestions, icon: BookBookmarkIcon, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20', link: '/admin/tests?skill=reading' },
    { label: 'Listening Tests', value: metrics.listeningQuestions, icon: HeadphonesRoundIcon, color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20', link: '/admin/tests?skill=listening' },
    { label: 'Writing Tasks', value: metrics.writingTasks, icon: Pen2Icon, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20', link: '/admin/tasks' },
    { label: 'Speaking Tasks', value: metrics.speakingTasks, icon: Microphone2Icon, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20', link: '/admin/tasks' },
    { label: 'Student Attempts', value: metrics.totalAttempts, icon: ChartSquareIcon, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20', link: '/admin/attempts' },
    { label: 'Total Users', value: metrics.totalUsers, icon: UsersGroupTwoRoundedIcon, color: 'text-primary bg-primary/10 border border-primary/20', link: '/admin/users' },
    { label: 'Premium Users', value: metrics.premiumUsers, icon: CrownStarIcon, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20', link: '/admin/users' },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 bg-card border border-border rounded-2xl fox-shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full truncate">
              FOX FORD IELTS CONTROL CENTER
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Real-time control center for IELTS test creation, student performance diagnostics, question bank management, and platform analytics.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link to="/admin/attempts"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold fox-shadow-sm transition-all active:scale-95"
          >
            <ChartSquareIcon className="w-3.5 h-3.5 shrink-0" size={14} />
            <span>Results</span>
          </Link>
          <Link to="/admin/tests/create"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all active:scale-95"
          >
            <AddCircleIcon className="w-3.5 h-3.5 shrink-0" size={14} />
            <span>New Test</span>
          </Link>
          <Link to="/admin/import"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all active:scale-95"
          >
            <CloudUploadIcon className="w-3.5 h-3.5 shrink-0" size={14} />
            <span>Import</span>
          </Link>
        </div>
      </div>

      {/* 12 Metric Cards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Platform Overview (13 Metrics)
          </h2>
          <span className="text-xs text-muted-foreground">Live Platform Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.label}
                to={c.link}
                className="p-3 sm:p-4 bg-card border border-border rounded-2xl fox-shadow-sm hover:border-primary/50 transition-all group flex flex-col justify-between min-w-0"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', c.color)}>
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" size={18} />
                  </div>
                  <AltArrowRightIcon className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-foreground tracking-tight truncate">
                    {c.value}
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">
                    {c.label}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Storage & System Capacity Health Section */}
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 fox-shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CloudUploadIcon className="w-4 h-4 text-primary" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Server Storage & System Capacity</h2>
              <p className="text-xs text-muted-foreground">Real-time disk space usage, PostgreSQL database, and uploaded media volume.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary border border-border">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Healthy</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. VPS / Server Disk Space */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Server Disk Space</span>
              <span className="text-xs font-bold font-mono text-foreground">
                {stats.storage?.usedPercent || 0}% Used
              </span>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-foreground tracking-tight">
                  {stats.storage?.usedGb || 0} <span className="text-sm font-semibold text-muted-foreground">GB</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  of <strong className="text-foreground">{stats.storage?.totalGb || 0} GB</strong> total
                </span>
              </div>
              <div className="w-full h-2.5 bg-secondary rounded-full mt-2 overflow-hidden border border-border/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    (stats.storage?.usedPercent || 0) > 85 ? "bg-rose-500" : (stats.storage?.usedPercent || 0) > 70 ? "bg-amber-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, Math.max(2, stats.storage?.usedPercent || 0))}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Free space: <strong className="text-foreground">{stats.storage?.freeGb || 0} GB</strong> remaining
            </p>
          </div>

          {/* 2. Media Uploads Folder */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Media Uploads</span>
              <span className="text-xs font-bold text-foreground">
                {stats.storage?.uploadsCount || 0} Files
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {stats.storage?.uploadsSizeMb || 0} <span className="text-sm font-semibold text-muted-foreground">MB</span>
              </span>
              <p className="text-xs text-muted-foreground mt-1">Audio tracks (.mp3), test maps, diagrams & assets</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Stored in: <code className="text-[10px] bg-card px-1.5 py-0.5 rounded border border-border">/uploads/</code>
            </p>
          </div>

          {/* 3. PostgreSQL Database Size */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Database Size</span>
              <span className="text-xs font-bold text-foreground">PostgreSQL 16</span>
            </div>
            <div>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {stats.storage?.dbSizePretty || 'N/A'}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Tests, attempts, users, SRS vocabulary & logs</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Status: <span className="text-emerald-600 font-semibold">Active connection pool</span>
            </p>
          </div>
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Tests & Questions Growth */}
        <div className="lg:col-span-2 p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Content Growth Over Time</h3>
              <p className="text-xs text-muted-foreground">Tests created vs Questions in database</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Tests
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Questions
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={creationTrendData}>
                <defs>
                  <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                />
                <Area type="monotone" dataKey="tests" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Free vs Premium Tests Breakdown */}
        <div className="p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Access Distribution</h3>
            <p className="text-xs text-muted-foreground">Free vs Premium IELTS mock tests</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={freeVsPremiumData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {freeVsPremiumData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around pt-3 border-t border-border text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-primary" />
              <span className="text-foreground">Free: {metrics.freeTests}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-600" />
              <span className="text-foreground">⭐ Premium: {metrics.premiumTests}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Row: Attempts Trend & Most Popular Tests */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test attempts */}
        <div className="lg:col-span-2 p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Weekly Test Attempts</h3>
              <p className="text-xs text-muted-foreground">Total student completions this week</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-semibold">
              {stats.weeklyGrowthText || '+0% vs last week'}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attemptsTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="attempts" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Popular Tests */}
        <div className="p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Featured Tests</h3>
            <Link to="/admin/tests" className="text-xs font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {popularTests.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No tests created yet.</p>
            ) : (
              popularTests.map((t) => (
                <Link
                  key={t.id}
                  to={`/admin/tests/${t.id}/edit`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary border border-transparent hover:border-border transition-all text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary truncate">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground uppercase font-semibold">
                      <span>{t.skill}</span>
                      <span>•</span>
                      <span>{t.total_questions} Qs</span>
                      {t.is_premium && <span className="text-rose-600 font-semibold">★ Premium</span>}
                    </div>
                  </div>
                  <AltArrowRightIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 shrink-0" size={14} />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recent Activity Log Feed */}
      <section className="p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Recent Admin Activity</h3>
            <p className="text-xs text-muted-foreground">Live audit trail of platform modifications</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            Live Stream
          </span>
        </div>

        <div className="divide-y divide-border">
          {recentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No activity recorded yet.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-foreground capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {log.details?.title ? `“${log.details.title}”` : log.target_type}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0">
                  {new Date(log.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
