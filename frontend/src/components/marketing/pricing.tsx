import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Crown } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Free Trial',
    slug: 'free',
    price: '$0',
    description: 'Start practicing for IELTS at no cost.',
    cta: 'Get Started Free',
    ctaVariant: 'outline' as const,
    ctaHref: '/signup',
    highlighted: false,
    features: [
      { text: 'Selected IELTS-style practice tests', included: true },
      { text: 'Basic question types', included: true },
      { text: 'Vocabulary access (basic)', included: true },
      { text: 'Basic progress tracking', included: true },
      { text: 'Onboarding & learning plan', included: true },
      { text: 'Full question library', included: false },
      { text: 'Unlimited practice', included: false },
      { text: 'Advanced progress analytics', included: false },
      { text: 'Detailed AI Writing & Speaking feedback', included: false },
      { text: 'Premium vocabulary collections', included: false },
    ],
  },
  {
    name: 'Premium VIP',
    slug: 'premium',
    price: '$9',
    priceNote: '/ month • or $49/year (Save 55%)',
    description: 'Complete all-in-one preparation to reach your target 7.5+ Band.',
    cta: 'Upgrade to Premium →',
    ctaVariant: 'default' as const,
    ctaHref: '/premium',
    highlighted: true,
    features: [
      { text: 'Full IELTS Cambridge question library (1–19)', included: true },
      { text: 'All 15+ official IELTS question types', included: true },
      { text: 'Unlimited practice tests with timers', included: true },
      { text: 'Advanced AI progress analytics & band prediction', included: true },
      { text: 'Complete Academic & General vocabulary collections', included: true },
      { text: 'Instant AI Evaluation on Writing Task 1 & 2', included: true },
      { text: 'Audio recording & AI Speaking scoring', included: true },
      { text: 'In-depth answer explanations & transcripts', included: true },
      { text: 'Priority customer support & Telegram VIP group', included: true },
      { text: 'All upcoming mock tests & updates included', included: true },
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            Practice with purpose
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you&apos;re ready. No tricks, no hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
            >
              <Card
                className={cn(
                  'h-full relative overflow-hidden transition-all duration-300',
                  plan.highlighted
                    ? 'border-primary fox-shadow-md'
                    : 'border-border'
                )}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-1 fox-gradient" />
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.highlighted && <Crown className="h-5 w-5 text-primary" />}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.highlighted && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                  </div>
                  {plan.priceNote && (
                    <p className="text-xs text-muted-foreground mt-1">{plan.priceNote}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent>
                  <Link to={plan.ctaHref || '/signup'}
                    className={cn(
                      buttonVariants({ variant: plan.ctaVariant }),
                      'w-full mb-6',
                      plan.highlighted && 'bg-primary hover:bg-fox-yellow-dark text-primary-foreground font-semibold shadow-xs'
                    )}
                  >
                    {plan.cta}
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.text}
                        className={cn(
                          'flex items-start gap-3 text-sm',
                          !feature.included && 'text-muted-foreground/60'
                        )}
                      >
                        {feature.included ? (
                          <Check className="h-4 w-4 text-fox-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                        )}
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
