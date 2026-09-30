import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FoxMascot } from '@/components/mascot/fox-mascot'

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Background */}
          <div className="absolute inset-0 fox-gradient opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

          <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
            {/* Mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              animate={{ y: [0, -10, 0] }}
              transition={{ delay: 0.3, duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center mb-6"
            >
              <FoxMascot variant="celebration" size="lg" />
            </motion.div>

            <h2 className="text-3xl font-bold sm:text-4xl text-primary-foreground">
              Your IELTS goal starts here.
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Join EduFox and start preparing for your IELTS exam with confidence. 
              Practice smarter, track your progress, and reach your target band.
            </p>

            <div className="mt-8">
              <Link to="/signup"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-background text-foreground hover:bg-background/90 font-semibold text-base px-8 h-12 inline-flex items-center justify-center rounded-lg shadow-lg'
                )}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
