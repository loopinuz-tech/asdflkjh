import { Hero } from '@/components/marketing/hero'
import { TrustStrip } from '@/components/marketing/trust-strip'
import { FerrisWheelSkills } from '@/components/marketing/ferris-wheel-skills'
import { ShadowingSection } from '@/components/marketing/shadowing-section'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { IeltsSection } from '@/components/marketing/ielts-section'
import { VocabularySection } from '@/components/marketing/vocabulary-section'
import { ProgressSection } from '@/components/marketing/progress-section'
import { FinalCta } from '@/components/marketing/final-cta'
import { SEOHead } from '@/components/seo/SEOHead'

export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="EduFox - Master IELTS with Real Cambridge Tests & Movie Shadowing"
        description="Practice authentic IELTS Reading, Listening, Writing, and Speaking mock tests. Interactive Movie Shadowing with real-time speech feedback, and smart SRS vocabulary training."
        canonicalUrl="/"
      />
      <Hero />
      <TrustStrip />
      <FerrisWheelSkills />
      <ShadowingSection />
      <HowItWorks />
      <IeltsSection />
      <VocabularySection />
      <ProgressSection />
      <FinalCta />
    </>
  )
}
