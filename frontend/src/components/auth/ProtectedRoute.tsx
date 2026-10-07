import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { createClient, type User } from '@/lib/supabase/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setUser(null)
        setLoading(false)
        return
      }

      setUser(user)

      if (adminOnly) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()
          const profile = profileData as { role: string } | null
          const resolvedRole = profile?.role || user.role
          if (mounted) {
            setIsAdmin(resolvedRole === 'admin')
          }
        } catch {
          if (mounted) {
            setIsAdmin(user.role === 'admin')
          }
        }
      }

      if (mounted) setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (!session?.user) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
