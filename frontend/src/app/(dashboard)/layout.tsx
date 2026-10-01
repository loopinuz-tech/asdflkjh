import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardMobileHeader } from '@/components/dashboard/mobile-header'
import { MobileNav } from '@/components/dashboard/mobile-nav'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-secondary/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full md:pl-64 overflow-hidden">
        {/* Mobile Top Header (with dynamic user role, theme toggle, brand logo & hamburger menu) */}
        <div className="md:hidden">
          <DashboardMobileHeader />
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-4 px-3 sm:px-6 md:py-8 md:px-8 pb-24 md:pb-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileNav />
        </div>
      </div>
    </div>
  )
}
