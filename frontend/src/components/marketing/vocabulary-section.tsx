import { motion } from 'framer-motion'
import { 
  BookmarkPlusIcon, 
  LayersMinimalisticIcon, 
  RestartIcon, 
  SquareAcademicCapIcon 
} from '@solar-icons/react/bold-duotone'

const vocabFeatures = [
  {
    icon: LayersMinimalisticIcon,
    title: 'Topic-based collections',
    description: 'Vocabulary organized by IELTS topics like environment, education, technology, and more.',
  },
  {
    icon: BookmarkPlusIcon,
    title: 'Save & organize',
    description: 'Build your personal vocabulary collection. Save words you want to learn and track your progress.',
  },
  {
    icon: RestartIcon,
    title: 'Spaced review',
    description: 'Review words at optimal intervals to move them from new to mastered.',
  },
  {
    icon: SquareAcademicCapIcon,
    title: 'Rich word cards',
    description: 'Each word comes with definition, example sentence, pronunciation, difficulty level, and part of speech.',
  },
]

export function VocabularySection() {
  return (
    <section className="py-12 sm:py-20 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-3 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              SMART SRS RETENTION
            </div>
            <h2 className="text-2xl xs:text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white tracking-tight">
              Build your IELTS vocabulary
            </h2>
            <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300">
              A strong vocabulary is the foundation of a high IELTS score. Learn words that actually appear in the exam.
            </p>

            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
              {vocabFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex gap-3 sm:gap-4"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-400/30 dark:border-amber-400/25">
                        <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{feature.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right — Vocabulary Card Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="w-full max-w-sm space-y-4">
              {/* Word Card */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    Environment
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Medium</span>
                </div>
                <h4 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">sustainable</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3">/səˈsteɪnəbl/ — adjective</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                  Able to be maintained at a certain rate or level without depleting natural resources.
                </p>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 p-3.5">
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                    &ldquo;The government has implemented several <span className="text-amber-600 dark:text-amber-400 font-semibold not-italic">sustainable</span> development policies.&rdquo;
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Vocabulary progress</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">42 / 100 words</span>
                </div>
                <div className="flex gap-1">
                  {['mastered', 'review', 'learning', 'new'].map((status) => {
                    const widths: Record<string, string> = {
                      mastered: 'w-[20%] bg-emerald-500',
                      review: 'w-[12%] bg-amber-500',
                      learning: 'w-[10%] bg-blue-500',
                      new: 'w-[58%] bg-slate-200 dark:bg-slate-700',
                    }
                    return (
                      <div
                        key={status}
                        className={`h-2 rounded-full ${widths[status]}`}
                      />
                    )
                  })}
                </div>
                <div className="flex gap-4 mt-2.5">
                  {[
                    { color: 'bg-emerald-500', label: 'Mastered', count: 20 },
                    { color: 'bg-amber-500', label: 'Review', count: 12 },
                    { color: 'bg-blue-500', label: 'Learning', count: 10 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      {item.label}: {item.count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
