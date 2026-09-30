import { SEOHead } from '@/components/seo/SEOHead'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <SEOHead
        title="Privacy Policy — FoxFord IELTS"
        description="Privacy policy and personal data protection regulations for the EduFox IELTS platform."
        canonicalUrl="/privacy"
      />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-muted-foreground">
          <p className="text-base leading-relaxed">
            At EduFox, we are committed to protecting your personal information and your right to privacy.
            This Privacy Policy describes how we collect, use, and share information about you when you use our services.
          </p>

          <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, including:
            your name, email address, profile picture, and IELTS target band score.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, maintain, and improve our services</li>
            <li>To track your learning progress and generate personalized recommendations</li>
            <li>To communicate with you about updates and important notices</li>
            <li>To detect and prevent fraudulent activity</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">3. Data Security</h2>
          <p>
            We use industry-standard security measures to protect your personal information. All data is encrypted
            in transit using TLS and at rest using AES-256 encryption.
          </p>

          <h2 className="text-xl font-semibold text-foreground">4. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information at any time through your
            account settings. To exercise these rights, contact us at privacy@foxford.uz.
          </p>

          <h2 className="text-xl font-semibold text-foreground">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@foxford.uz" className="text-primary underline">privacy@foxford.uz</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
