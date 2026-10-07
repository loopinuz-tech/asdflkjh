import { motion } from 'framer-motion'

const progressData = [
  { skill: 'Reading', score: 6.5, target: 7.0, color: 'bg-fox-yellow' },
  { skill: 'Listening', score: 6.0, target: 7.0, color: 'bg-chart-4' },
  { skill: 'Writing', score: 5.5, target: 7.0, color: 'bg-fox-red' },
  { skill: 'Speaking', score: 6.0, target: 7.0, color: 'bg-fox-success' },
]

export function ProgressSection() {
  return (
    <section className="py-10 sm:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card p-4 sm:p-6 fox-shadow-lg">
              {/* Overall Band */}
              <div className="text-center mb-5 sm:mb-6">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Overall Estimated Band</p>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary">
                  <span className="text-xl sm:text-2xl font-bold">6.0</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">Target: 7.0</p>
              </div>

              {/* Skill Scores */}
              <div className="space-y-3.5 sm:space-y-4">
                {progressData.map((item) => {
                  const percentage = (item.score / 9) * 100
                  const targetPercentage = (item.target / 9) * 100

                  return (
                    <div key={item.skill} className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">{item.skill}</span>
                        <span className="text-muted-foreground">
                          {item.score} / {item.target}
                        </span>
                      </div>
                      <div className="relative h-2.5 sm:h-3 rounded-full bg-secondary">
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
              <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-border grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold">12</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold">🔥 5</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold">142</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">Words</div>
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
            <h2 className="text-2xl xs:text-3xl font-bold sm:text-4xl">
              Track every step of your progress
            </h2>
            <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-muted-foreground">
              See your estimated band score improve over time. Know exactly where you stand and what to focus on next.
            </p>

            <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
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
