import { motion } from 'framer-motion'
import { BookBookmarkIcon, HeadphonesRoundIcon, Pen2Icon, Microphone2Icon } from '@solar-icons/react/bold-duotone'
import { Badge } from '@/components/ui/badge'

const skills = [
  {
    icon: BookBookmarkIcon,
    title: 'Reading',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-400/15',
    borderColor: 'border-amber-400/30 dark:border-amber-400/25',
    hoverBorder: 'hover:border-amber-400/60',
    questionTypes: [
      'Multiple choice',
      'True/False/Not Given',
      'Yes/No/Not Given',
      'Matching headings',
      'Matching information',
      'Matching features',
      'Sentence completion',
      'Summary completion',
      'Note completion',
      'Table completion',
      'Flow-chart completion',
      'Diagram label completion',
      'Short answer',
    ],
  },
  {
    icon: HeadphonesRoundIcon,
    title: 'Listening',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/15',
    borderColor: 'border-blue-400/30 dark:border-blue-400/25',
    hoverBorder: 'hover:border-blue-400/60',
    questionTypes: [
      'Multiple choice',
      'Matching',
      'Plan/map/diagram labeling',
      'Form completion',
      'Note completion',
      'Table completion',
      'Flow-chart completion',
      'Summary completion',
      'Sentence completion',
      'Short answer',
    ],
  },
  {
    icon: Pen2Icon,
    title: 'Writing',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10 dark:bg-rose-400/15',
    borderColor: 'border-rose-400/30 dark:border-rose-400/25',
    hoverBorder: 'hover:border-rose-400/60',
    questionTypes: [
      'Task 1 — Data analysis',
      'Task 2 — Essay writing',
      'Structured writing practice',
      'Essay organization',
      'Band-oriented feedback',
    ],
  },
  {
    icon: Microphone2Icon,
    title: 'Speaking',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-400/15',
    borderColor: 'border-emerald-400/30 dark:border-emerald-400/25',
    hoverBorder: 'hover:border-emerald-400/60',
    questionTypes: [
      'Part 1 — Introduction',
      'Part 2 — Long turn',
      'Part 3 — Discussion',
      'Speaking practice',
      'Answer structure',
      'Feedback & evaluation',
    ],
  },
]

export function IeltsSection() {
  return (
    <section id="ielts" className="py-12 sm:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-3 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            COMPREHENSIVE EXAM COVERAGE
          </div>
          <h2 className="text-2xl xs:text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Complete IELTS-style practice
          </h2>
          <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-2">
            EduFox covers all four IELTS skills with authentic question types used in the real exam.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {skills.map((skill, index) => {
            const Icon = skill.icon
            return (
              <motion.div
                key={skill.title}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className={`rounded-2xl border ${skill.borderColor} bg-white dark:bg-slate-900/90 p-4 sm:p-6 transition-all duration-300 ${skill.hoverBorder} hover:shadow-xl`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${skill.bgColor} border ${skill.borderColor}`}>
                    <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${skill.color}`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">{skill.title}</h3>
                </div>

                <motion.div 
                  className="flex flex-wrap gap-1.5 sm:gap-2"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05, delayChildren: index * 0.1 + 0.2 }
                    }
                  }}
                >
                  {skill.questionTypes.map((qt) => (
                    <motion.div
                      key={qt}
                      variants={{
                        hidden: { opacity: 0, scale: 0.8 },
                        show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200 } }
                      }}
                    >
                      <span
                        className="inline-block text-[11px] sm:text-xs font-medium cursor-default bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 transition-colors px-2 py-0.5 rounded-md"
                      >
                        {qt}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          EduFox provides IELTS-style practice. It is not affiliated with or endorsed by IELTS, British Council, IDP, or Cambridge.
        </p>
      </div>
    </section>
  )
}
