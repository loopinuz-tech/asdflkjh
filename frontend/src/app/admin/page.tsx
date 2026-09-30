import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { getAdminStats } from '@/actions/admin'
import { AdminDashboardView } from './dashboard-view'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminStats()
      setStats(data)
    } catch (err: any) {
      console.error('Failed to load admin stats:', err)
      setError(err.message || 'Failed to load dashboard metrics. Please check your connection or permissions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-32 bg-card border border-border rounded-2xl p-6" />

        {/* 12 Cards Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 bg-secondary rounded-xl" />
              <div className="h-5 w-16 bg-secondary rounded" />
              <div className="h-3 w-20 bg-secondary rounded" />
            </div>
          ))}
        </div>

        {/* System Capacity Skeleton */}
        <div className="h-44 bg-card border border-border rounded-2xl" />

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-card border border-border rounded-2xl" />
          <div className="h-72 bg-card border border-border rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4 fox-shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Dashboard Unavailable</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {error || 'Unable to connect to dashboard statistics service.'}
            </p>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    )
  }

  return <AdminDashboardView stats={stats} />
}

