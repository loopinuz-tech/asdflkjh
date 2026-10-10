import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AltArrowRightIcon } from '@solar-icons/react/bold-duotone'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FoxMascot } from '@/components/mascot/fox-mascot'

export function FinalCta() {
  return (
    <section className="py-10 sm:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 dark:from-amber-500 dark:via-amber-600 dark:to-amber-700"
        >
          {/* Ambient Lighting Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none" />

          <div className="relative px-4 py-12 sm:px-12 sm:py-20 text-center">
            {/* Mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              animate={{ y: [0, -10, 0] }}
              transition={{ delay: 0.3, duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center mb-5 sm:mb-6"
            >
              <FoxMascot variant="celebration" size="lg" />
            </motion.div>

            <h2 className="text-2xl xs:text-3xl font-extrabold sm:text-4xl lg:text-5xl text-slate-950 tracking-tight">
              Your IELTS goal starts here.
            </h2>
            <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-950/85 font-medium max-w-xl mx-auto px-2">
              Join EduFox and start preparing for your IELTS exam with confidence. 
              Practice smarter, track your progress, and reach your target band.
            </p>

            <div className="mt-8">
              <Link 
                to="/signup"
                className="bg-slate-950 hover:bg-slate-900 text-white font-semibold text-base px-8 h-12 inline-flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
              >
                <span>Get Started Now</span>
                <AltArrowRightIcon className="ml-2 h-4 w-4 text-white font-bold" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
