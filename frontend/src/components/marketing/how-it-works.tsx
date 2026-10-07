import { motion } from 'framer-motion'
import { TargetIcon, MagnifierIcon, RoutingIcon, GraphUpIcon } from '@solar-icons/react/bold-duotone'

const steps = [
  {
    number: '01',
    icon: TargetIcon,
    title: 'Set your goal',
    description: 'Tell us your target IELTS band score and when you plan to take the test.',
  },
  {
    number: '02',
    icon: MagnifierIcon,
    title: 'Discover your weaknesses',
    description: 'Identify which skills need the most improvement through diagnostic practice.',
  },
  {
    number: '03',
    icon: RoutingIcon,
    title: 'Follow your plan',
    description: 'Get a personalized study plan focused on the skills that matter most to you.',
  },
  {
    number: '04',
    icon: GraphUpIcon,
    title: 'Improve your score',
    description: 'Track your progress, practice consistently, and watch your estimated band rise.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative pt-6 sm:pt-10 pb-12 sm:pb-20 bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl xs:text-3xl font-extrabold sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            How it works
          </h2>
          <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal px-2">
            Know your weaknesses. Build your plan. Improve your score.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.4 }}
                className="relative text-center p-3.5 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-amber-400/50 hover:bg-white/90 dark:hover:bg-slate-900/90 transition-all duration-300"
              >
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm mb-3 sm:mb-4 relative z-10 transition-transform duration-300 hover:scale-105">
                  <div className="text-center">
                    <span className="text-[11px] sm:text-xs font-bold text-amber-500 block">{step.number}</span>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 dark:text-white mx-auto mt-0.5" />
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto font-normal">
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
