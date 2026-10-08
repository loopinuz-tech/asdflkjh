import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { cn } from '@/lib/utils'

import { isUserAdmin } from '@/components/auth/ProtectedRoute'

export default function AdminLayout() {
  const location = useLocation()
  const [adminInfo, setAdminInfo] = useState({
    adminName: 'Admin',
    adminEmail: 'admin@foxford.ielts',
    adminRole: 'admin',
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('foxford_admin_sidebar_collapsed') === 'true'
    }
    return false
  })

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('foxford_admin_sidebar_collapsed', String(next))
      }
      return next
    })
  }

  const navigate = useNavigate()

  useEffect(() => {
    async function loadAdminInfo() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      let profileRole: string | null = null
      let profileName = ''

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile) {
          profileRole = profile.role
          profileName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        }
      } catch {
        // Fallback to user metadata
      }

      const isAuthorizedAdmin = isUserAdmin(user, profileRole)
      if (!isAuthorizedAdmin) {
        navigate('/dashboard', { replace: true })
        return
      }

      setAdminInfo({
        adminName: profileName || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Admin',
        adminEmail: user.email || 'admin@foxford.ielts',
        adminRole: 'admin',
      })
    }
    loadAdminInfo()
  }, [navigate])

  // Auto-close sidebar when route changes on mobile
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

  return (
    <div className="min-h-screen flex bg-secondary/20 text-foreground font-sans antialiased overflow-x-hidden">
      {/* Sidebar — handles both desktop (collapsible) and mobile (drawer) */}
      <AdminSidebar
        adminName={adminInfo.adminName}
        adminEmail={adminInfo.adminEmail}
        adminRole={adminInfo.adminRole}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        desktopCollapsed={desktopSidebarCollapsed}
        onToggleDesktopCollapse={toggleDesktopSidebar}
      />

      {/* Main Container - full width with dynamic offset for desktop sidebar */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 w-full overflow-x-hidden transition-[padding] duration-300 ease-in-out',
          desktopSidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-64'
        )}
      >
        <AdminHeader
          adminName={adminInfo.adminName}
          adminEmail={adminInfo.adminEmail}
          adminRole={adminInfo.adminRole}
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
          desktopCollapsed={desktopSidebarCollapsed}
          onToggleDesktopCollapse={toggleDesktopSidebar}
        />
        {/* Full-width main container without restrictive max-w-7xl */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
