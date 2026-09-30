import { motion } from 'framer-motion'

const progressData = [
  { skill: 'Reading', score: 6.5, target: 7.0, color: 'bg-fox-yellow' },
  { skill: 'Listening', score: 6.0, target: 7.0, color: 'bg-chart-4' },
  { skill: 'Writing', score: 5.5, target: 7.0, color: 'bg-fox-red' },
  { skill: 'Speaking', score: 6.0, target: 7.0, color: 'bg-fox-success' },
]

export function ProgressSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card p-6 fox-shadow-lg">
              {/* Overall Band */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">Overall Estimated Band</p>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary">
                  <span className="text-2xl font-bold">6.0</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Target: 7.0</p>
              </div>

              {/* Skill Scores */}
              <div className="space-y-4">
                {progressData.map((item) => {
                  const percentage = (item.score / 9) * 100
                  const targetPercentage = (item.target / 9) * 100

                  return (
                    <div key={item.skill} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.skill}</span>
                        <span className="text-muted-foreground">
                          {item.score} / {item.target}
                        </span>
                      </div>
                      <div className="relative h-3 rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-foreground/30"
                          style={{ left: `${targetPercentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stats Row */}
              <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">12</div>
                  <div className="text-xs text-muted-foreground">Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">🔥 5</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">142</div>
                  <div className="text-xs text-muted-foreground">Words</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">
              Track every step of your progress
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See your estimated band score improve over time. Know exactly where you stand and what to focus on next.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Per-skill estimated band scores',
                'Historical progress charts',
                'Practice streak tracking',
                'Vocabulary growth metrics',
                'Completed test history',
                'Strength and weakness analysis',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
