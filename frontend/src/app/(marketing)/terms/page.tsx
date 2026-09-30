import { SEOHead } from '@/components/seo/SEOHead'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <SEOHead
        title="Terms of Service — FoxFord IELTS"
        description="Official terms of service and usage regulations for the EduFox IELTS platform."
        canonicalUrl="/terms"
      />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p>
            Welcome to EduFox ("Company", "we", "our", "us"). By accessing our platform you agree to these Terms of Service.
            Please read them carefully.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. License to Use</h2>
          <p>
            Permission is granted to temporarily access EduFox for personal, non-commercial use only. You must not:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the materials for any commercial purpose or public display;</li>
            <li>Attempt to decompile or reverse engineer any software contained on EduFox's website;</li>
            <li>Remove any copyright or other proprietary notations from the materials; or</li>
            <li>Transfer the materials to another person or "mirror" them on any other server.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">3. Subscriptions and Payments</h2>
          <p>
            Some features of the Service are billed on a subscription basis ("Premium Plan"). You will be billed in advance on
            a recurring and periodic basis depending on the type of subscription plan you select.
          </p>
          <p>
            At the end of each period, your Subscription will automatically renew under the exact same conditions unless you
            cancel it or EduFox cancels it.
          </p>

          <h2 className="text-xl font-semibold text-foreground">4. Accuracy of Materials</h2>
          <p>
            The materials appearing on EduFox's website could include technical, typographical, or photographic errors.
            EduFox does not warrant that any of the materials on its website are accurate, complete or current.
          </p>

          <h2 className="text-xl font-semibold text-foreground">5. Account Responsibilities</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all
            times. You are responsible for safeguarding your password and for any activities under your account.
          </p>

          <h2 className="text-xl font-semibold text-foreground">6. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which
            EduFox operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </div>
      </div>
    </div>
  )
}
