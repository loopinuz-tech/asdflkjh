import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { BookBookmarkIcon, CupStarIcon, UsersGroupRoundedIcon, StarsIcon } from '@solar-icons/react/bold-duotone'
import { SEOHead } from '@/components/seo/SEOHead'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About Us — FoxFord IELTS"
        description="EduFox — Professional online IELTS preparation, mock testing, and AI scoring platform."
        canonicalUrl="/about"
      />
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-8">
            <FoxMascot variant="welcome" size="xl" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            About <span className="text-primary">EduFox</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            EduFox is a modern IELTS preparation platform built to help students achieve their target band scores through
            intelligent practice, real-format tests, and personalized learning paths.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-secondary/20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookBookmarkIcon, title: 'Real IELTS Tests', desc: 'Academic Reading, Listening, Writing & Speaking in authentic exam format.' },
              { icon: CupStarIcon, title: 'Band Estimation', desc: 'Instant band score estimates after every test based on real IELTS scoring.' },
              { icon: StarsIcon, title: 'Smart Vocabulary', desc: 'Spaced repetition system (SRS) to build academic vocabulary efficiently.' },
              { icon: UsersGroupRoundedIcon, title: 'Progress Tracking', desc: 'Detailed analytics to understand your strengths and areas for improvement.' },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3">
                <item.icon className="w-8 h-8 text-primary" />
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your IELTS Journey</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Join thousands of students preparing for IELTS with EduFox.
        </p>
        <Link to="/signup" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
          Get Started Free
        </Link>
      </section>
    </div>
  )
}
