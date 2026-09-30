import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { FoxLogo } from '@/components/mascot/fox-mascot'

export default function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full py-6 px-8 border-b border-border flex justify-between items-center">
        <Link to="/">
          <FoxLogo showText={true} />
        </Link>
        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
          Setup Your Profile
        </span>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
