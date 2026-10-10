import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Sparkles,
  PhoneOff,
  PhoneCall,
  ChevronLeft,
  Crown,
  ArrowRight,
  RotateCcw,
  Award,
  Send,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LiveExaminerAvatar, AvatarExpression } from '@/components/speaking/live-avatar'
import { useLiveSpeech } from '@/hooks/use-live-speech'
import { createClient } from '@/lib/supabase/client'
import { apiUrl } from '@/lib/api-config'

export default function SpeakingLivePage() {
  const navigate = useNavigate()

  // Auth & Premium state
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  // Configuration
  const [mode, setMode] = useState<'roast' | 'strict' | 'coach'>('roast')
  const [selectedTopic, setSelectedTopic] = useState('Hometown & City Life')
  const [availableTopics, setAvailableTopics] = useState<any[]>([])

  // Session State
  const [sessionActive, setSessionActive] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [currentExpression, setCurrentExpression] = useState<AvatarExpression>('roast')
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [currentPromptText, setCurrentPromptText] = useState('')
  const [latestRoast, setLatestRoast] = useState('')
  const [handsFree, setHandsFree] = useState(true)
  const [history, setHistory] = useState<Array<{ role: 'user' | 'model'; content: string }>>([])
  const [textInput, setTextInput] = useState('')
  const [showKeyboardInput, setShowKeyboardInput] = useState(false)

  // End Session modal
  const [showEndModal, setShowEndModal] = useState(false)
  const [sessionReport, setSessionReport] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const timerRef = useRef<any>(null)

  // Real-time Speech Hook
  const {
    isListening,
    isSpeaking,
    interimTranscript,
    audioLevel,
    isMuted,
    setIsMuted,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  } = useLiveSpeech({
    onSpeechResult: (spokenText) => {
      handleUserSpoke(spokenText)
    },
    silenceTimeoutMs: 1200,
  })

  // 1. Verify user & premium access
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser && !import.meta.env.DEV) {
        navigate('/login?redirect=/speaking/live')
        return
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      try {
        const res = await fetch(apiUrl('/api/speaking-live/status'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (data.success && data.is_premium) {
          setIsPremium(true)
        } else {
          setIsPremium(Boolean(currentUser?.is_premium || currentUser?.role === 'admin' || import.meta.env.DEV))
        }
      } catch {
        setIsPremium(Boolean(currentUser?.is_premium || currentUser?.role === 'admin' || import.meta.env.DEV))
      }

      // Load topics
      try {
        const tRes = await fetch(apiUrl('/api/speaking-live/topics'))
        const tData = await tRes.json()
        if (tData.topics?.length > 0) {
          setAvailableTopics(tData.topics)
          setSelectedTopic(tData.topics[0].title)
        }
      } catch (err) {
        console.warn('Failed to load live topics:', err)
      }

      setLoadingAuth(false)
    }

    checkAuth()
  }, [navigate])

  // Timer
  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => {
        setSessionSeconds((s) => s + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionActive])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 2. Start Call
  const handleStartCall = () => {
    setSessionActive(true)
    setSessionSeconds(0)
    setHistory([])
    setLatestRoast('')

    const firstGreeting =
      mode === 'roast'
        ? `Alright, topic is '${selectedTopic}'. Let's see if you can speak without stuttering every two seconds. Introduce yourself and your thoughts now!`
        : mode === 'strict'
        ? `Good day. This is the IELTS Speaking examination on '${selectedTopic}'. Please begin your response.`
        : `Hello! Let's practice speaking on '${selectedTopic}'. Share your thoughts whenever you are ready!`

    setCurrentPromptText(firstGreeting)
    setHistory([{ role: 'model', content: firstGreeting }])
    setCurrentExpression('roast')

    // Read aloud and listen right after
    speakText(firstGreeting, () => {
      if (handsFree) {
        startListening()
      }
    })
  }

  // 3. User spoke -> Send directly to Gemini API
  const handleUserSpoke = async (spokenMessage: string) => {
    if (!spokenMessage || !spokenMessage.trim() || isThinking) return

    stopListening()
    stopSpeaking()

    const newHistory = [...history, { role: 'user' as const, content: spokenMessage.trim() }]
    setHistory(newHistory)
    setIsThinking(true)
    setCurrentExpression('thinking')

    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

    try {
      const res = await fetch(apiUrl('/api/speaking-live/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: spokenMessage.trim(),
          history: newHistory,
          mode,
          topic: selectedTopic,
          turnCount: newHistory.length,
        }),
      })

      if (res.status === 403) {
        setIsPremium(false)
        setIsThinking(false)
        return
      }

      const resData = await res.json()
      if (resData.success && resData.turn) {
        const { reply, roast, expression } = resData.turn

        setCurrentPromptText(reply)
        if (roast) setLatestRoast(roast)
        setCurrentExpression(expression || (mode === 'roast' ? 'roast' : 'neutral'))
        setHistory((prev) => [...prev, { role: 'model', content: reply }])
        setIsThinking(false)

        // Read aloud with audio voice
        speakText(reply, () => {
          if (handsFree && sessionActive) {
            startListening()
          }
        })
      } else {
        throw new Error(resData.error || 'Failed response')
      }
    } catch (err) {
      console.error('Chat error:', err)
      setIsThinking(false)
      const fallback = 'I see. Can you elaborate further on that specific point?'
      setCurrentPromptText(fallback)
      speakText(fallback, () => {
        if (handsFree && sessionActive) startListening()
      })
    }
  }

  // 4. End Call
  const handleEndCall = async () => {
    stopListening()
    stopSpeaking()
    setSessionActive(false)
    setIsGeneratingReport(true)
    setShowEndModal(true)

    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

    try {
      const res = await fetch(apiUrl('/api/speaking-live/end-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: selectedTopic,
          mode,
          turns: history,
          durationSeconds: sessionSeconds,
        }),
      })

      const data = await res.json()
      if (data.success && data.report) {
        setSessionReport(data.report)
      } else {
        setSessionReport({
          overall_band: 6.5,
          fluency_coherence: 6.5,
          lexical_resource: 6.5,
          grammatical_range: 6.0,
          pronunciation: 7.0,
          roast_verdict: 'You made it through the hot seat! Keep practicing to push for Band 8.',
        })
      }
    } catch {
      setSessionReport({
        overall_band: 6.5,
        fluency_coherence: 6.5,
        lexical_resource: 6.5,
        grammatical_range: 6.0,
        pronunciation: 7.0,
        roast_verdict: 'Good effort! Work on eliminating pauses.',
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (loadingAuth) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Connecting to Live Examiner...</p>
      </div>
    )
  }

  // Premium Paywall Screen
  if (!isPremium) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg flex flex-col items-center space-y-6">
          <LiveExaminerAvatar
            expression="roast"
            size="lg"
            statusText="Savage Examiner: 'Think you have what it takes for Band 8?'"
          />

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase">
              <Crown className="w-3.5 h-3.5" />
              Foxford Premium Exclusive
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Real-Time AI Speaking Partner
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Real-time conversational English with Gemini AI. Face our infamous Savage Roast Examiner
              to conquer hesitation and hesitation anxiety.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => setIsPremium(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 hover:opacity-95 text-black font-extrabold rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              Try Free Practice Session
            </Button>
            <Button
              onClick={() => navigate('/premium?reason=speaking_live')}
              variant="outline"
              className="rounded-xl text-xs font-semibold"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Upgrade to Premium
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/speaking')}
              className="rounded-xl text-xs text-muted-foreground"
            >
              Back to Topics
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // FULL-WIDTH REAL-TIME VOICE CALL ROOM
  // ==========================================
  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col justify-between items-center py-2 sm:py-4 px-2 sm:px-8 relative select-none overflow-x-hidden">
      {/* 1. TOP BAR: Minimalist Navigation, Topic & Mode */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/speaking"
            className="p-1.5 sm:p-2 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground transition-all shrink-0"
            title="Back to Topics"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-base font-bold text-foreground truncate">Live AI Speaking Partner</h2>
              {sessionActive && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">Topic: {selectedTopic}</p>
          </div>
        </div>

        {/* Mode Selector & Session Timer */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {!sessionActive && (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 sm:flex-none max-w-[150px] sm:max-w-xs px-2.5 py-1.5 bg-secondary border border-border rounded-xl text-xs font-semibold text-foreground cursor-pointer focus:outline-hidden truncate"
            >
              {availableTopics.map((t, idx) => (
                <option key={t.id || idx} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center bg-secondary/80 p-0.5 sm:p-1 rounded-xl border border-border shrink-0">
            <button
              onClick={() => setMode('roast')}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mode === 'roast' ? 'bg-rose-500 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Savage</span>
            </button>
            <button
              onClick={() => setMode('strict')}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mode === 'strict' ? 'bg-blue-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Cambridge</span>
            </button>
          </div>

          {sessionActive && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-secondary rounded-xl border border-border shrink-0">
              {formatTimer(sessionSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* 2. CENTERPIECE: Clean Avatar & Real-time Dialogue */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-4 sm:my-6 space-y-4 sm:space-y-6 max-w-3xl">
        {/* The Clean Pill Avatar */}
        <LiveExaminerAvatar
          expression={currentExpression}
          isListening={isListening}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          mode={mode}
          size="lg"
          className="scale-75 xs:scale-85 sm:scale-100 transition-transform"
          statusText={
            !sessionActive
              ? 'Ready to connect'
              : isThinking
              ? 'Examiner is thinking...'
              : isSpeaking
              ? 'Examiner is speaking...'
              : isListening
              ? 'Listening to you now...'
              : 'Tap mic to talk'
          }
        />

        {/* Savage Roast Punchline Toast */}
        <AnimatePresence>
          {sessionActive && latestRoast && (
            <motion.div
              key={latestRoast}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm text-center"
            >
              <Flame className="w-4 h-4 shrink-0 fill-current" />
              <span>"{latestRoast}"</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Spoken Prompt / Live Candidate Speech */}
        {sessionActive && (
          <div className="w-full max-w-xl space-y-3">
            {/* Examiner Spoken Subtitle (Clean & elegant without duplicate status or icons) */}
            <div className="text-center px-6 py-4 rounded-2xl bg-card border border-border/80 shadow-xs">
              <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                "{currentPromptText}"
              </p>
            </div>

            {/* Candidate Voice Recognition Activity */}
            {isListening && (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-pulse">
                <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {interimTranscript ? `"${interimTranscript}"` : 'Listening to your voice... Speak clearly'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM CALL CONTROLS (Full-width clean dock) */}
      <div className="w-full flex flex-col items-center justify-center py-4 border-t border-border/40">
        {/* Optional Collapsible Keyboard Fallback (Keeps main interface clutter-free) */}
        {sessionActive && showKeyboardInput && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (textInput.trim() && !isThinking) {
                handleUserSpoke(textInput.trim())
                setTextInput('')
              }
            }}
            className="w-full max-w-md flex items-center gap-2 mb-3 px-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response..."
              disabled={isThinking}
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              disabled={!textInput.trim() || isThinking}
              className="cursor-pointer font-bold"
            >
              Send
            </Button>
          </form>
        )}

        {!sessionActive ? (
          <Button
            onClick={handleStartCall}
            size="lg"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 hover:opacity-95 text-black font-extrabold rounded-2xl shadow-xl shadow-amber-500/25 text-sm flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <PhoneCall className="w-5 h-5 fill-current" />
            Start Voice Conversation
          </Button>
        ) : (
          <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between sm:justify-center gap-1.5 sm:gap-4 bg-card/90 backdrop-blur-md px-2.5 sm:px-6 py-2 sm:py-3 rounded-2xl border border-border shadow-lg">
            {/* Mic Button */}
            <button
              onClick={() => {
                if (isListening) stopListening()
                else startListening()
              }}
              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/30'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
              title={isListening ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isListening ? <Mic className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* Hands-Free Toggle */}
            <button
              onClick={() => setHandsFree(!handsFree)}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                handsFree
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-secondary/60 border-border text-muted-foreground'
              }`}
              title="Automatically listen after examiner stops speaking"
            >
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${handsFree ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="hidden xs:inline">Hands-free</span>
              <span className="xs:hidden">Auto</span>
            </button>

            {/* Speaker Sound Mute/Unmute */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 sm:p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
              }`}
              title={isMuted ? 'Unmute Speaker' : 'Mute Speaker'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Optional Keyboard Fallback Toggle */}
            <button
              onClick={() => setShowKeyboardInput(!showKeyboardInput)}
              className={`p-2 sm:p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                showKeyboardInput
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
              title={showKeyboardInput ? 'Hide keyboard input' : 'Type response'}
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Red End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all cursor-pointer shrink-0"
              title="End Voice Call"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            </button>
          </div>
        )}
      </div>

      {/* 4. CALL COMPLETE REPORT MODAL */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              {isGeneratingReport ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                    Compiling Senior Examiner Diagnostic Verdict...
                  </p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h3 className="text-base sm:text-lg font-bold text-foreground">Speaking Evaluation Report</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedTopic} • Duration: {formatTimer(sessionSeconds)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Band</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-500">
                        {sessionReport?.overall_band || 6.5}
                      </span>
                    </div>
                  </div>

                  {/* Roast / Examiner Verdict */}
                  {sessionReport?.roast_verdict && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-foreground flex items-start gap-2.5">
                      <Flame className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 fill-current" />
                      <div>
                        <span className="font-bold text-rose-500 dark:text-rose-400 block mb-0.5">Examiner Verdict:</span>
                        <p className="italic">"{sessionReport.roast_verdict}"</p>
                      </div>
                    </div>
                  )}

                  {/* 4 Criteria Scores */}
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Official IELTS Criteria Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-secondary/60 border border-border text-center">
                        <span className="text-[10px] font-semibold text-muted-foreground block truncate">Fluency & Coherence</span>
                        <span className="text-sm font-black text-foreground">
                          Band {sessionReport?.fluency_coherence || 6.0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-secondary/60 border border-border text-center">
                        <span className="text-[10px] font-semibold text-muted-foreground block truncate">Lexical Resource</span>
                        <span className="text-sm font-black text-foreground">
                          Band {sessionReport?.lexical_resource || 6.5}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-secondary/60 border border-border text-center">
                        <span className="text-[10px] font-semibold text-muted-foreground block truncate">Grammatical Range</span>
                        <span className="text-sm font-black text-foreground">
                          Band {sessionReport?.grammatical_range || 6.0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-secondary/60 border border-border text-center">
                        <span className="text-[10px] font-semibold text-muted-foreground block truncate">Pronunciation</span>
                        <span className="text-sm font-black text-foreground">
                          Band {sessionReport?.pronunciation || 7.0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  {(sessionReport?.strengths?.length > 0 || sessionReport?.improvements?.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {sessionReport?.strengths?.length > 0 && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px]">
                            Key Strengths:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                            {sessionReport.strengths.slice(0, 3).map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {sessionReport?.improvements?.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                          <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">
                            Areas to Improve:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                            {sessionReport.improvements.slice(0, 3).map((imp: string, idx: number) => (
                              <li key={idx}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vocabulary Upgrades */}
                  {sessionReport?.vocabulary_upgrades?.length > 0 && (
                    <div className="p-3 rounded-xl bg-secondary/70 border border-border text-xs space-y-1.5">
                      <span className="font-bold text-foreground text-[11px] block">
                        Band 8+ Vocabulary Upgrades:
                      </span>
                      <div className="space-y-1">
                        {sessionReport.vocabulary_upgrades.slice(0, 2).map((v: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-card p-1.5 rounded-lg border border-border">
                            <span className="text-muted-foreground line-through">{v.original}</span>
                            <span className="text-primary font-bold">➔ {v.advanced}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEndModal(false)
                        navigate('/speaking')
                      }}
                      className="rounded-xl text-xs cursor-pointer"
                    >
                      Back to Topics
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEndModal(false)
                        handleStartCall()
                      }}
                      className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Practice Again
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
