import { Hero } from '@/components/marketing/hero'
import { TrustStrip } from '@/components/marketing/trust-strip'
import { FerrisWheelSkills } from '@/components/marketing/ferris-wheel-skills'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { IeltsSection } from '@/components/marketing/ielts-section'
import { VocabularySection } from '@/components/marketing/vocabulary-section'
import { ProgressSection } from '@/components/marketing/progress-section'
import { Pricing } from '@/components/marketing/pricing'
import { FinalCta } from '@/components/marketing/final-cta'
import { SEOHead } from '@/components/seo/SEOHead'

export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="EduFox - Master IELTS with Real Cambridge Tests & AI Evaluation"
        description="Practice authentic IELTS Reading, Listening, Writing, and Speaking mock tests. Instant AI grading, detailed answer explanations, and smart SRS vocabulary training."
        canonicalUrl="/"
      />
      <Hero />
      <TrustStrip />
      <FerrisWheelSkills />
      <HowItWorks />
      <IeltsSection />
      <VocabularySection />
      <ProgressSection />
      <Pricing />
      <FinalCta />
    </>
  )
}
