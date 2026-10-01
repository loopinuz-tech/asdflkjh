import { motion } from 'framer-motion'
import { BookBookmarkIcon, HeadphonesRoundIcon, Pen2Icon, Microphone2Icon } from '@solar-icons/react/bold-duotone'
import { Badge } from '@/components/ui/badge'

const skills = [
  {
    icon: BookBookmarkIcon,
    title: 'Reading',
    color: 'text-fox-yellow',
    bgColor: 'bg-fox-yellow/10',
    borderColor: 'border-fox-yellow/20',
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
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    borderColor: 'border-chart-4/20',
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
    color: 'text-fox-red',
    bgColor: 'bg-fox-red/10',
    borderColor: 'border-fox-red/20',
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
    color: 'text-fox-success',
    bgColor: 'bg-fox-success/10',
    borderColor: 'border-fox-success/20',
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
    <section id="ielts" className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            Complete IELTS-style practice
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            EduFox covers all four IELTS skills with authentic question types used in the real exam.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {skills.map((skill, index) => {
            const Icon = skill.icon
            return (
              <motion.div
                key={skill.title}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`rounded-xl border ${skill.borderColor} bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-xl`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${skill.bgColor}`}>
                    <Icon className={`h-5 w-5 ${skill.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{skill.title}</h3>
                </div>

                <motion.div 
                  className="flex flex-wrap gap-2"
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
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium cursor-default hover:bg-primary/20 transition-colors duration-300"
                      >
                        {qt}
                      </Badge>
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
