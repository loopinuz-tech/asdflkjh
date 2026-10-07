import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardMobileHeader } from '@/components/dashboard/mobile-header'
import { MobileNav } from '@/components/dashboard/mobile-nav'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0c485e] dark:bg-[#072936]">
      {/* Desktop Sidebar - Standard w-64 width */}
      <aside className="hidden md:flex md:flex-col shrink-0 h-full w-64 bg-[#0c485e] dark:bg-[#072936] select-none">
        <Sidebar />
      </aside>

      {/* Main Content Area - fills remaining horizontal space next to sidebar */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden md:p-2.5 md:pl-0">
        {/* Mobile Top Header */}
        <div className="md:hidden">
          <DashboardMobileHeader />
        </div>

        {/* Main Content Canvas with curved rounded corners */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-background md:rounded-[24px] shadow-2xl transition-all duration-300">
          <div className="py-4 px-4 sm:px-6 md:py-6 md:px-8 pb-24 md:pb-8 w-full">
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
