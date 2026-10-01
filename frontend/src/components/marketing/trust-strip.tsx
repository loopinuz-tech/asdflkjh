import { motion } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ChartSquareIcon, 
  TargetIcon, 
  BookBookmarkIcon, 
  UsersGroupTwoRoundedIcon 
} from '@solar-icons/react/bold-duotone'

const benefits = [
  {
    icon: CheckCircleIcon,
    label: 'Real IELTS-style practice',
  },
  {
    icon: TargetIcon,
    label: 'Personalized learning',
  },
  {
    icon: ChartSquareIcon,
    label: 'Track your progress',
  },
  {
    icon: BookBookmarkIcon,
    label: 'Vocabulary building',
  },
  {
    icon: UsersGroupTwoRoundedIcon,
    label: 'All four skills',
  },
]

export function TrustStrip() {
  return (
    <section className="py-12 border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                {benefit.label}
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
