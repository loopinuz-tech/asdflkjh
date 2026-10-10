import { motion } from 'framer-motion'

const progressData = [
  { skill: 'Reading', score: 6.5, target: 7.0, color: 'bg-amber-500' },
  { skill: 'Listening', score: 6.0, target: 7.0, color: 'bg-blue-500' },
  { skill: 'Writing', score: 5.5, target: 7.0, color: 'bg-rose-500' },
  { skill: 'Speaking', score: 6.0, target: 7.0, color: 'bg-emerald-500' },
]

export function ProgressSection() {
  return (
    <section className="py-12 sm:py-20 bg-background">
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
            <div className="w-full max-w-md mx-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xl shadow-slate-900/5">
              {/* Overall Band */}
              <div className="text-center mb-5 sm:mb-6">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Overall Estimated Band</p>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-500 bg-amber-500/10 shadow-xs">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">6.0</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Target: 7.0</p>
              </div>

              {/* Skill Scores */}
              <div className="space-y-3.5 sm:space-y-4">
                {progressData.map((item) => {
                  const percentage = (item.score / 9) * 100
                  const targetPercentage = (item.target / 9) * 100

                  return (
                    <div key={item.skill} className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.skill}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {item.score} / {item.target}
                        </span>
                      </div>
                      <div className="relative h-2.5 sm:h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
                          style={{ left: `${targetPercentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stats Row */}
              <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">12</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">🔥 5</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">142</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Words</div>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-3 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              VISIBLE RESULTS
            </div>
            <h2 className="text-2xl xs:text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white tracking-tight">
              Track every step of your progress
            </h2>
            <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300">
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
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
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
