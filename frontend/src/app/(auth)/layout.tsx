import { Outlet } from 'react-router-dom'
import { FoxLogo } from '@/components/mascot/fox-mascot'
import { Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Subtle background radial gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-background to-background" />

      {/* Decorative ambient background blurs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-orange-500/10 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="mb-6 flex flex-col items-center">
        <Link to="/" className="inline-block transition-transform hover:scale-105" title="EduFox Home">
          <FoxLogo showText={true} />
        </Link>
      </div>

      {/* Centered Auth Card Container */}
      <div className="w-full max-w-md bg-card border border-border/80 shadow-xl dark:shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative z-10 transition-colors">
        <Outlet />
      </div>

      {/* Footer copyright */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        EduFox IELTS Preparation Platform
      </div>
    </div>
  )
}

