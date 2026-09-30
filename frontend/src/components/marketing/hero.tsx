import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Play, Star, BookOpen, Headphones, Edit3, Mic } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function Hero() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  return (
    <section className="relative overflow-hidden pt-20 pb-12 sm:pt-32 sm:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-fox-yellow/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-fox-red/3 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              IELTS Preparation Platform
            </motion.div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              Prepare smarter.{' '}
              <span className="fox-gradient-text">
                Reach your IELTS goal.
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Master all four IELTS skills — Reading, Listening, Writing, and Speaking — with real IELTS-style practice, 
              vocabulary building, and personalized progress tracking.
            </p>

            <div className="mt-8 flex flex-col xs:flex-row gap-3 justify-center lg:justify-start">
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className={buttonVariants({ size: "lg", className: "bg-primary hover:bg-fox-yellow-dark text-primary-foreground font-semibold text-base px-6 h-12 shadow-sm w-full xs:w-auto" })}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className={buttonVariants({ size: "lg", className: "bg-primary hover:bg-fox-yellow-dark text-primary-foreground font-semibold text-base px-6 h-12 shadow-sm w-full xs:w-auto" })}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
              <a 
                href="#ielts"
                className={buttonVariants({ size: "lg", variant: "outline", className: "text-base h-12 w-full xs:w-auto" })}
              >
                Explore IELTS
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-8 flex items-center gap-6 sm:gap-8 justify-center lg:justify-start flex-wrap">
              {[
                { value: '4', label: 'IELTS Skills' },
                { value: '13+', label: 'Question Types' },
                { value: 'Free', label: 'To Start' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Fox Mascot + Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            {/* Dashboard Preview Card */}
            <div className="relative w-full max-w-md">
              {/* Glow behind card */}
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />

              {/* Dashboard Card */}
              <div className="relative rounded-2xl border border-border bg-card fox-shadow-lg p-6">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Good morning,</p>
                    <p className="text-lg font-semibold">Student</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium">Band 7.0</span>
                  </div>
                </div>

                {/* Skill Bars */}
                <div className="space-y-3">
                  {[
                    { skill: 'Reading', score: 72, color: 'bg-fox-yellow' },
                    { skill: 'Listening', score: 65, color: 'bg-chart-4' },
                    { skill: 'Writing', score: 58, color: 'bg-fox-red' },
                    { skill: 'Speaking', score: 70, color: 'bg-fox-success' },
                  ].map((item) => (
                    <div key={item.skill} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.skill}</span>
                        <span className="text-muted-foreground">{item.score}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <motion.div
                          className={`h-full rounded-full ${item.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Streak */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🔥</span>
                    <span className="font-medium">5 day streak</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Keep going!</span>
                </div>
              </div>

              <motion.div
                className="absolute -top-14 -right-4 sm:-top-16 sm:-right-6 lg:-right-12 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 z-20"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6, type: 'spring' }}
              >
                <div className="relative w-full h-full drop-shadow-xl pointer-events-none">
                  <img 
                    src="/signin_mascot.png" 
                    alt="EduFox Mascot" 
                    className="object-contain drop-shadow-xl w-full h-full"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
