import { Outlet } from 'react-router-dom'
import { FoxLogo, FoxMascot } from '@/components/mascot/fox-mascot'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle, Sparkles, Trophy } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile: Compact top banner */}
      <div className="md:hidden relative overflow-hidden bg-primary fox-gradient px-4 pt-safe py-5 flex items-center gap-3">
        {/* Background dots */}
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
            backgroundSize: `24px 24px`,
          }}
        />
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-3xl z-0" />
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <FoxLogo showText={true} inverseText={true} />
          </Link>
        </div>
        <div className="relative z-10 ml-auto">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">
            IELTS Platform
          </span>
        </div>
      </div>

      {/* Desktop: Full left sidebar */}
      <div className="hidden md:flex w-5/12 lg:w-1/2 p-8 md:p-12 flex-col justify-between relative overflow-hidden bg-primary fox-gradient">
        {/* Background Decorative Grid */}
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
            backgroundSize: `24px 24px`,
          }}
        />
        
        {/* Glowing orb for depth */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/20 rounded-full blur-3xl z-0" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-fox-red/10 rounded-full blur-3xl z-0" />

        {/* Floating Mascot in background */}
        <div className="absolute -bottom-16 -right-16 opacity-30 z-0 rotate-[-10deg] pointer-events-none scale-150">
          <FoxMascot variant="welcome" size="2xl" animated={false} />
        </div>

        {/* Top Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <FoxLogo showText={true} inverseText={true} />
          </Link>
          <div className="mt-16 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-primary-foreground text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4" />
              IELTS Preparation Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-primary-foreground leading-tight">
              Master IELTS with EduFox.
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/90 font-medium leading-relaxed">
              Your personalized learning path to reach your target band score. Practice Reading, Listening, Writing, and Speaking in one place.
            </p>
          </div>
        </div>

        {/* Bottom Feature Highlights */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-3 text-primary-foreground">
              <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-sm font-medium">Real IELTS-format Reading &amp; Listening practice tests</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground">
              <BookOpen className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-sm font-medium">Smart Vocabulary Spaced Repetition System (SRS)</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground">
              <Trophy className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-sm font-medium">Real-time progress tracking and band score estimation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right content area — auth forms */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:p-12 relative min-h-0">
        <div className="w-full max-w-sm relative z-10">
          <Outlet />
        </div>
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      </div>
    </div>
  )
}

