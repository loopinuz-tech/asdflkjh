import { motion } from 'framer-motion'
import { 
  BookBookmarkIcon, 
  HeadphonesRoundIcon, 
  Pen2Icon, 
  Microphone2Icon, 
  TranslationIcon, 
  ChartSquareIcon 
} from '@solar-icons/react/bold-duotone'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: BookBookmarkIcon,
    title: 'Reading',
    description: 'Practice with authentic IELTS-style passages. Master True/False/Not Given, matching, completion, and more.',
    color: 'text-fox-yellow',
    bgColor: 'bg-fox-yellow/10',
  },
  {
    icon: HeadphonesRoundIcon,
    title: 'Listening',
    description: 'Train your ear with diverse audio sections. Practice multiple choice, matching, map labeling, and completion tasks.',
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
  {
    icon: Pen2Icon,
    title: 'Writing',
    description: 'Improve Task 1 and Task 2 essays with structured practice, word count tracking, and band-oriented feedback.',
    color: 'text-fox-red',
    bgColor: 'bg-fox-red/10',
  },
  {
    icon: Microphone2Icon,
    title: 'Speaking',
    description: 'Build confidence across Part 1, 2, and 3. Practice answer structure, timing, and receive targeted feedback.',
    color: 'text-fox-success',
    bgColor: 'bg-fox-success/10',
  },
  {
    icon: TranslationIcon,
    title: 'Vocabulary',
    description: 'Build your IELTS vocabulary with topic-based word collections, spaced review, and example sentences.',
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
  },
  {
    icon: ChartSquareIcon,
    title: 'Progress Tracking',
    description: 'Track your estimated band score across all skills. Visualize improvements and identify areas to focus on.',
    color: 'text-fox-warning',
    bgColor: 'bg-fox-warning/10',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            One platform for all four IELTS skills
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Read. Listen. Write. Speak. Improve. EduFox covers every aspect of your IELTS preparation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="h-full border border-border hover:border-primary/30 transition-all duration-300 hover:fox-shadow-md group cursor-default">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
