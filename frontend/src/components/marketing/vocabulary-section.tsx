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
    <section className="py-14 sm:py-20 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">
              Build your IELTS vocabulary
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A strong vocabulary is the foundation of a high IELTS score. Learn words that actually appear in the exam.
            </p>

            <div className="mt-8 space-y-6">
              {vocabFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
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
              <div className="rounded-xl border border-border bg-card p-5 fox-shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    Environment
                  </span>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <h4 className="text-xl font-bold mb-1">sustainable</h4>
                <p className="text-xs text-muted-foreground italic mb-3">/səˈsteɪnəbl/ — adjective</p>
                <p className="text-sm text-foreground mb-3">
                  Able to be maintained at a certain rate or level without depleting natural resources.
                </p>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm text-muted-foreground italic">
                    &ldquo;The government has implemented several <span className="text-foreground font-medium">sustainable</span> development policies.&rdquo;
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="rounded-xl border border-border bg-card p-4 fox-shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Vocabulary progress</span>
                  <span className="text-xs text-muted-foreground">42 / 100 words</span>
                </div>
                <div className="flex gap-1">
                  {['mastered', 'review', 'learning', 'new'].map((status) => {
                    const widths: Record<string, string> = {
                      mastered: 'w-[20%] bg-fox-success',
                      review: 'w-[12%] bg-fox-yellow',
                      learning: 'w-[10%] bg-chart-4',
                      new: 'w-[58%] bg-secondary',
                    }
                    return (
                      <div
                        key={status}
                        className={`h-2 rounded-full ${widths[status]}`}
                      />
                    )
                  })}
                </div>
                <div className="flex gap-4 mt-2">
                  {[
                    { color: 'bg-fox-success', label: 'Mastered', count: 20 },
                    { color: 'bg-fox-yellow', label: 'Review', count: 12 },
                    { color: 'bg-chart-4', label: 'Learning', count: 10 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
