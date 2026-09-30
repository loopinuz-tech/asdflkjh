import { motion } from 'framer-motion'
import { Target, Search, Route, TrendingUp } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Target,
    title: 'Set your goal',
    description: 'Tell us your target IELTS band score and when you plan to take the test.',
  },
  {
    number: '02',
    icon: Search,
    title: 'Discover your weaknesses',
    description: 'Identify which skills need the most improvement through diagnostic practice.',
  },
  {
    number: '03',
    icon: Route,
    title: 'Follow your plan',
    description: 'Get a personalized study plan focused on the skills that matter most to you.',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Improve your score',
    description: 'Track your progress, practice consistently, and watch your estimated band rise.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Know your weaknesses. Build your plan. Improve your score.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.4 }}
                className="relative text-center"
              >
                {/* Connection line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
                )}

                {/* Step number */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border fox-shadow-sm mb-5 relative z-10">
                  <div className="text-center">
                    <span className="text-xs font-bold text-primary block">{step.number}</span>
                    <Icon className="h-6 w-6 text-foreground mx-auto mt-0.5" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
