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
    <section id="how-it-works" className="relative pt-12 sm:pt-16 pb-14 sm:pb-22 bg-slate-50/60 dark:bg-slate-950/40 border-y border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-3 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            EASY 4-STEP METHOD
          </div>
          <h2 className="text-2xl xs:text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white tracking-tight">
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
                className="relative text-center p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-amber-400/60 transition-all duration-300"
              >
                {/* Step number & Icon bubble */}
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-400/30 dark:border-amber-400/25 shadow-xs mb-3.5 sm:mb-4 relative z-10 transition-transform duration-300 hover:scale-105">
                  <div className="text-center">
                    <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 block">{step.number}</span>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400 mx-auto mt-0.5" />
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 text-slate-900 dark:text-white">{step.title}</h3>
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
