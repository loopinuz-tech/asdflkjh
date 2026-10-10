import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardMobileHeader } from '@/components/dashboard/mobile-header'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { AnnouncementBanner } from '@/components/announcement/announcement-banner'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar - Standard w-64 width */}
      <aside className="hidden md:flex md:flex-col shrink-0 h-full w-64 bg-[#0c485e] dark:bg-[#072936] select-none relative z-30">
        <Sidebar />
      </aside>

      {/* Main Content Area - fills remaining horizontal space next to sidebar */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Mobile Top Header */}
        <div className="md:hidden">
          <DashboardMobileHeader />
        </div>

        {/* Top Announcement Banner (Pink / Custom by Admin) */}
        <AnnouncementBanner />

        {/* Main Content Canvas - border-radius 0, seamless edge-to-edge */}
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden focus:outline-none bg-background custom-scrollbar">
          <div className="py-3 px-3 sm:py-4 sm:px-6 md:py-6 md:px-8 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          <MobileNav />
        </div>
      </div>
    </div>
  )
}
