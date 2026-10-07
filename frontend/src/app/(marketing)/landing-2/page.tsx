import { Hero } from '@/components/marketing/hero'
import { TrustStrip } from '@/components/marketing/trust-strip'
import { FerrisWheelSkills } from '@/components/marketing/ferris-wheel-skills'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { IeltsSection } from '@/components/marketing/ielts-section'
import { VocabularySection } from '@/components/marketing/vocabulary-section'
import { ProgressSection } from '@/components/marketing/progress-section'
import { FinalCta } from '@/components/marketing/final-cta'
import { SEOHead } from '@/components/seo/SEOHead'

export default function LandingPage2() {
  return (
    <>
      <SEOHead
        title="EduFox Landing Page 2 - Master All 4 IELTS Skills with Real Practice"
        description="EduFox Observation Wheel Concept — Master Reading, Listening, Writing, and Speaking with authentic IELTS mock tests and AI evaluations."
        canonicalUrl="/landing-2"
      />
      <Hero />
      <TrustStrip />
      <FerrisWheelSkills />
      <HowItWorks />
      <IeltsSection />
      <VocabularySection />
      <ProgressSection />
      <FinalCta />
    </>
  )
}
