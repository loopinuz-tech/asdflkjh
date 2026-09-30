import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { saveOnboardingData } from '@/actions/onboarding'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
type OnboardingData = {
  targetBand: string;
  challenges: string[];
  planTimeline: string;
  hasTakenIelts: boolean | null;
  previousScore: string;
  estimatedLevel: string;
}

// --- Steps ---
const STEPS = 6;

export function OnboardingFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    targetBand: '',
    challenges: [],
    planTimeline: '',
    hasTakenIelts: null,
    previousScore: '',
    estimatedLevel: '',
  })

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      await saveOnboardingData(data)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      setIsSubmitting(false)
    }
  }

  // Common animation variants
  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step} of {STEPS}</span>
          <span>{Math.round((step / STEPS) * 100)}% Completed</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / STEPS) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {step === 1 && (
              <WelcomeStep nextStep={nextStep} />
            )}
            {step === 2 && (
              <GoalStep data={data} setData={setData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {step === 3 && (
              <ChallengesStep data={data} setData={setData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {step === 4 && (
              <ExperienceStep data={data} setData={setData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {step === 5 && (
              <PlanStep data={data} setData={setData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {step === 6 && (
              <SummaryStep data={data} onComplete={handleComplete} isSubmitting={isSubmitting} prevStep={prevStep} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// --- Individual Step Components ---

function WelcomeStep({ nextStep }: { nextStep: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <FoxMascot variant="welcome" size="2xl" />
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Welcome to EduFox!
      </h1>
      <p className="text-muted-foreground max-w-md">
        Let's personalize your IELTS preparation journey. We just need to ask a few quick questions to build your optimal learning plan.
      </p>
      <Button size="lg" onClick={nextStep} className="w-full max-w-xs mt-4">
        Let's get started
      </Button>
    </div>
  )
}

function GoalStep({ data, setData, nextStep, prevStep }: any) {
  const bands = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5+']
  
  return (
    <div className="flex flex-col space-y-6 py-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">What is your target band?</h2>
        <p className="text-muted-foreground mt-2">Select the score you need to achieve.</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {bands.map(band => (
          <button
            key={band}
            onClick={() => setData({ ...data, targetBand: band })}
            className={cn(
              "p-4 rounded-xl border-2 text-center transition-all",
              data.targetBand === band 
                ? "border-primary bg-primary/5 text-primary font-bold shadow-sm" 
                : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
            )}
          >
            {band}
          </button>
        ))}
        <button
          onClick={() => setData({ ...data, targetBand: 'Not sure' })}
          className={cn(
            "col-span-2 sm:col-span-4 p-4 rounded-xl border-2 text-center transition-all",
            data.targetBand === 'Not sure' 
              ? "border-primary bg-primary/5 text-primary font-bold shadow-sm" 
              : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
          )}
        >
          I'm not sure yet
        </button>
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <Button onClick={nextStep} disabled={!data.targetBand}>Continue</Button>
      </div>
    </div>
  )
}

function ChallengesStep({ data, setData, nextStep, prevStep }: any) {
  const challengesList = [
    { id: 'reading', label: 'Reading Comprehension' },
    { id: 'listening', label: 'Listening to Accents' },
    { id: 'writing_task1', label: 'Writing Task 1 (Graphs)' },
    { id: 'writing_task2', label: 'Writing Task 2 (Essays)' },
    { id: 'speaking', label: 'Speaking Fluency' },
    { id: 'vocabulary', label: 'Academic Vocabulary' },
    { id: 'grammar', label: 'Grammar & Accuracy' },
    { id: 'time', label: 'Time Management' }
  ]

  const toggleChallenge = (id: string) => {
    const current = data.challenges || []
    if (current.includes(id)) {
      setData({ ...data, challenges: current.filter((c: string) => c !== id) })
    } else {
      setData({ ...data, challenges: [...current, id] })
    }
  }
  
  return (
    <div className="flex flex-col space-y-6 py-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">What are your biggest challenges?</h2>
        <p className="text-muted-foreground mt-2">Select all that apply so we can focus your practice.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {challengesList.map(challenge => {
          const isSelected = data.challenges?.includes(challenge.id)
          return (
            <button
              key={challenge.id}
              onClick={() => toggleChallenge(challenge.id)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
              )}
            >
              <span className={cn(isSelected ? "text-primary font-medium" : "text-foreground")}>
                {challenge.label}
              </span>
              <div className={cn(
                "w-5 h-5 rounded border flex items-center justify-center",
                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
              )}>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <Button onClick={nextStep} disabled={!data.challenges || data.challenges.length === 0}>Continue</Button>
      </div>
    </div>
  )
}

function ExperienceStep({ data, setData, nextStep, prevStep }: any) {
  return (
    <div className="flex flex-col space-y-6 py-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Your IELTS Experience</h2>
        <p className="text-muted-foreground mt-2">Tell us about your background.</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Have you taken the IELTS test before?</label>
          <div className="flex gap-3">
            <button
              onClick={() => setData({ ...data, hasTakenIelts: true })}
              className={cn(
                "flex-1 p-3 rounded-lg border-2 text-center transition-all",
                data.hasTakenIelts === true ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-secondary"
              )}
            >
              Yes
            </button>
            <button
              onClick={() => setData({ ...data, hasTakenIelts: false, previousScore: '' })}
              className={cn(
                "flex-1 p-3 rounded-lg border-2 text-center transition-all",
                data.hasTakenIelts === false ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-secondary"
              )}
            >
              No
            </button>
          </div>
        </div>

        {data.hasTakenIelts && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium">What was your previous overall score?</label>
            <select
              value={data.previousScore || ''}
              onChange={(e) => setData({ ...data, previousScore: e.target.value })}
              className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary outline-none"
            >
              <option value="" disabled>Select previous score</option>
              {['4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>
        )}

        {!data.hasTakenIelts && data.hasTakenIelts !== null && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium">What is your estimated current English level?</label>
            <select
              value={data.estimatedLevel || ''}
              onChange={(e) => setData({ ...data, estimatedLevel: e.target.value })}
              className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary outline-none"
            >
              <option value="" disabled>Select estimated level</option>
              <option value="A2">Beginner (A2)</option>
              <option value="B1">Intermediate (B1)</option>
              <option value="B2">Upper Intermediate (B2)</option>
              <option value="C1">Advanced (C1)</option>
              <option value="C2">Proficient (C2)</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <Button onClick={nextStep} disabled={data.hasTakenIelts === null || (data.hasTakenIelts && !data.previousScore) || (data.hasTakenIelts === false && !data.estimatedLevel)}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function PlanStep({ data, setData, nextStep, prevStep }: any) {
  const timelines = [
    { id: '1mo', label: 'Less than 1 month', desc: 'Intensive preparation' },
    { id: '3mo', label: '1 - 3 months', desc: 'Focused study plan' },
    { id: '6mo', label: '3 - 6 months', desc: 'Steady improvement' },
    { id: '12mo', label: '6+ months', desc: 'Long-term mastery' }
  ]
  
  return (
    <div className="flex flex-col space-y-6 py-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">When is your test?</h2>
        <p className="text-muted-foreground mt-2">This helps us calculate your daily study goals.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {timelines.map(time => (
          <button
            key={time.id}
            onClick={() => setData({ ...data, planTimeline: time.id })}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all",
              data.planTimeline === time.id 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-semibold", data.planTimeline === time.id ? "text-primary" : "text-foreground")}>
                  {time.label}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{time.desc}</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                data.planTimeline === time.id ? "border-primary" : "border-muted-foreground/30"
              )}>
                {data.planTimeline === time.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <Button onClick={nextStep} disabled={!data.planTimeline}>Review Plan</Button>
      </div>
    </div>
  )
}

function SummaryStep({ data, onComplete, isSubmitting, prevStep }: any) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <FoxMascot variant="success" size="xl" />
      <h2 className="text-2xl font-bold tracking-tight">Your personalized plan is ready!</h2>
      <p className="text-muted-foreground">
        We've analyzed your goals and created a custom preparation strategy.
      </p>
      
      <div className="w-full bg-secondary/50 rounded-xl p-5 mt-4 text-left border border-border">
        <h3 className="font-semibold text-foreground border-b border-border pb-2 mb-3">Plan Summary</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span className="text-muted-foreground">Target Band:</span>
            <span className="font-medium text-foreground">{data.targetBand}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Timeline:</span>
            <span className="font-medium text-foreground">
              {data.planTimeline === '1mo' ? '< 1 Month' : data.planTimeline === '3mo' ? '1-3 Months' : data.planTimeline === '6mo' ? '3-6 Months' : '6+ Months'}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Focus Areas:</span>
            <span className="font-medium text-foreground">{data.challenges?.length || 0} skills</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-between w-full mt-8 pt-4 border-t border-border">
        <Button variant="ghost" onClick={prevStep} disabled={isSubmitting}>Back</Button>
        <Button onClick={onComplete} disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go to Dashboard'}
        </Button>
      </div>
    </div>
  )
}
