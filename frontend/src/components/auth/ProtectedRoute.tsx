import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { createClient, type User } from '@/lib/supabase/client'

const KNOWN_ADMIN_EMAILS = [
  'xudayberganovbackend@gmail.com',
  'ilyoskhudayberganov@gmail.com',
  'ilyosbackend@gmail.com',
  'khilyos1219@gmail.com',
  'adilbekovfozilbek@gmail.com',
]

export function isUserAdmin(user: User | null | undefined, profileRole?: string | null): boolean {
  if (!user) return false
  const email = (user.email || '').toLowerCase().trim()
  if (KNOWN_ADMIN_EMAILS.includes(email)) return true
  if (email.startsWith('admin@') || email.includes('admin.foxford') || email.includes('@foxford.uz')) return true
  if (user.role?.toLowerCase() === 'admin') return true
  if (profileRole?.toLowerCase() === 'admin') return true
  if (user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin') return true
  return false
}

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
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setUser(user)

      if (adminOnly) {
        // Fast-path: Check direct user object / known admin emails
        if (isUserAdmin(user)) {
          if (mounted) setIsAdmin(true)
        } else {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle()
            const profile = profileData as { role: string } | null
            if (mounted) {
              setIsAdmin(isUserAdmin(user, profile?.role))
            }
          } catch {
            if (mounted) {
              setIsAdmin(isUserAdmin(user))
            }
          }
        }
      }

      if (mounted) setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const newUser = session?.user ?? null
      setUser(newUser)
      if (adminOnly) {
        setIsAdmin(isUserAdmin(newUser))
      }
      if (!newUser) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [adminOnly, location.pathname])

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
