import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ClapperboardPlayIcon,
  Microphone2Icon,
  PlayIcon,
  PauseIcon,
  RestartIcon,
  ClockCircleIcon,
  MagnifierIcon,
  CloseCircleIcon,
  CheckCircleIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  ShieldCheckIcon,
  StarsIcon,
  SoundwaveIcon,
  VolumeLoudIcon,
  VolumeCrossIcon,
  MaximizeSquareIcon,
  MinimizeSquareIcon,
  InfoCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { createClient, getStoredToken } from '@/lib/supabase/client'
import { isUserAdmin } from '@/components/auth/ProtectedRoute'
import { apiUrl } from '@/lib/api-config'
import { useNotifications } from '@/context/notification-context'
import { cn } from '@/lib/utils'

export interface DialogueLine {
  id: number | string
  time: string | number
  seconds?: number
  start_seconds?: number
  end_seconds?: number
  end_time?: string
  duration_seconds?: number
  timing_quality?: 'exact' | 'approximate' | 'manual'
  is_approximate?: boolean
  character?: string
  speaker?: string
  text: string
  phonetic?: string
  translation?: string
  tip?: string
  words?: { word: string; start: number; end: number }[]
}

export interface ShadowingVideo {
  id: string
  title: string
  movie_title: string
  youtube_url: string
  youtube_id: string
  cefr_level: string
  accent: string
  duration: string
  description: string
  dialogue_lines: DialogueLine[]
  is_active: boolean
  created_at: string
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: any
  }
}

function parseLineStartSeconds(line: DialogueLine): number {
  if (!line) return 0
  if (typeof line.start_seconds === 'number' && !isNaN(line.start_seconds) && line.start_seconds >= 0) {
    return line.start_seconds
  }
  if (typeof line.seconds === 'number' && !isNaN(line.seconds) && line.seconds >= 0) {
    return line.seconds
  }
  if (typeof line.time === 'number' && !isNaN(line.time) && line.time >= 0) {
    return line.time
  }
  if (typeof line.time === 'string') {
    const parts = line.time.trim().split(':').map(Number)
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    const val = parseFloat(line.time)
    if (!isNaN(val)) return val
  }
  return 0
}

function parseLineEndSeconds(line: DialogueLine, nextLine?: DialogueLine): number {
  if (!line) return 0
  if (typeof line.end_seconds === 'number' && !isNaN(line.end_seconds) && line.end_seconds > 0) {
    return line.end_seconds
  }
  if (typeof line.duration_seconds === 'number' && !isNaN(line.duration_seconds) && line.duration_seconds > 0) {
    return parseLineStartSeconds(line) + line.duration_seconds
  }
  if (typeof line.end_time === 'string') {
    const parts = line.end_time.trim().split(':').map(Number)
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
  }

  const startSec = parseLineStartSeconds(line)
  const wordCount = (line.text || '').trim().split(/\s+/).filter(Boolean).length
  const naturalDuration = Math.min(12, Math.max(2.0, Math.round((wordCount / 2.6) * 10) / 10))

  if (nextLine) {
    const nextStart = parseLineStartSeconds(nextLine)
    if (nextStart > startSec) {
      return Math.min(nextStart - 0.2, startSec + naturalDuration)
    }
  }

  return startSec + naturalDuration
}

function formatSeconds(sec: number): string {
  if (typeof sec !== 'number' || isNaN(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function extractYoutubeId(urlOrId: string): string {
  if (!urlOrId) return ''
  const trimmed = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  )
  return match ? match[1] : trimmed
}

function cleanToken(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '')
}

export type ShadowPhase = 'idle' | 'listening' | 'speaking' | 'feedback'

export default function MovieShadowingPage() {
  const [searchParams] = useSearchParams()
  const queryVideoId = searchParams.get('video')
  const { showToast } = useNotifications()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<ShadowingVideo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<ShadowingVideo | null>(null)

  // Player State
  const playerRef = useRef<any>(null)
  const videoFrameRef = useRef<HTMLDivElement>(null)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [showControls, setShowControls] = useState<boolean>(false)

  // Automatic Shadowing Flow State
  const [autoShadowEnabled, setAutoShadowEnabled] = useState<boolean>(true)
  const [shadowPhase, setShadowPhase] = useState<ShadowPhase>('idle')
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0)
  const [liveTranscript, setLiveTranscript] = useState<string>('')
  const [micError, setMicError] = useState<string | null>(null)
  const [completedScores, setCompletedScores] = useState<Record<number, { score: number; text: string }>>({})
  const [lastFeedbackScore, setLastFeedbackScore] = useState<number | null>(null)

  // Filters & Search
  const [levelFilter, setLevelFilter] = useState<'all' | 'B1' | 'B2' | 'C1'>('all')
  const [scriptSearch, setScriptSearch] = useState('')
  const [mobileTab, setMobileTab] = useState<'player' | 'script'>('player')

  // Admin Add Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [submittingModal, setSubmittingModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMovieTitle, setModalMovieTitle] = useState('')
  const [modalYoutubeUrl, setModalYoutubeUrl] = useState('')
  const [modalLevel, setModalLevel] = useState('B2')
  const [modalAccent, setModalAccent] = useState('American')
  const [modalDuration, setModalDuration] = useState('2:00')
  const [modalDescription, setModalDescription] = useState('')
  const [modalDialogueText, setModalDialogueText] = useState('')
  const [aiGeneratingModal, setAiGeneratingModal] = useState(false)
  const [aiModalBadge, setAiModalBadge] = useState<string | null>(null)

  // Refs for Timers, Mic, and Flow Control
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<any>(null)
  const maxRecordingTimeoutRef = useRef<any>(null)
  const autoAdvanceTimeoutRef = useRef<any>(null)
  const stopTimerRef = useRef<any>(null)
  const scriptContainerRef = useRef<HTMLDivElement>(null)
  const isTransitioningRef = useRef<boolean>(false)

  // Normalized dialogue lines sorted by start seconds
  const lines = useMemo(() => {
    if (!selectedVideo?.dialogue_lines || !Array.isArray(selectedVideo.dialogue_lines)) {
      return []
    }
    return [...selectedVideo.dialogue_lines].sort(
      (a, b) => parseLineStartSeconds(a) - parseLineStartSeconds(b)
    )
  }, [selectedVideo])

  const currentSentence = lines[activeSentenceIndex] || lines[0]
  const nextSentence = lines[activeSentenceIndex + 1]

  // Cleanup helper
  const clearAllTimersAndSessions = useCallback(() => {
    if (stopTimerRef.current) {
      clearInterval(stopTimerRef.current)
      stopTimerRef.current = null
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current)
      maxRecordingTimeoutRef.current = null
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current)
      autoAdvanceTimeoutRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch (e) {}
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearAllTimersAndSessions()
    }
  }, [clearAllTimersAndSessions])

  // Check Admin Rights
  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        let profileRole: string | null = null
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()
          if (profile) profileRole = profile.role
        } catch {}
        setIsAdmin(isUserAdmin(user, profileRole))
      }
    }
    checkAdmin()
  }, [])

  // Load Videos
  const fetchVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/shadowing'))
      if (!res.ok) throw new Error('Failed to load videos')
      const data = await res.json()
      const fetched: ShadowingVideo[] = data.videos || []
      setVideos(fetched)

      if (fetched.length > 0) {
        let initial = fetched[0]
        if (queryVideoId) {
          const found = fetched.find((v) => v.id === queryVideoId)
          if (found) initial = found
        }
        setSelectedVideo(initial)
      }
    } catch (err: any) {
      console.error(err)
      showToast({
        title: 'Error',
        message: 'Could not load shadowing videos.',
        type: 'warning',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  // Load YouTube IFrame API once
  useEffect(() => {
    let isMounted = true

    if (window.YT && window.YT.Player) {
      setIsApiLoaded(true)
      return
    }

    if (!document.getElementById('yt-iframe-api-script')) {
      const script = document.createElement('script')
      script.id = 'yt-iframe-api-script'
      script.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(script)
    }

    const prevReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady()
      if (isMounted) setIsApiLoaded(true)
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Mount YouTube Player
  useEffect(() => {
    if (!isApiLoaded || !selectedVideo) return

    const yId = selectedVideo.youtube_id || extractYoutubeId(selectedVideo.youtube_url)
    if (!yId) return

    const containerId = `yt-player-box-${selectedVideo.id}`
    setIsPlayerReady(false)
    setIsPlaying(false)
    setCurrentPlaybackTime(0)
    setActiveSentenceIndex(0)
    setShadowPhase('idle')
    clearAllTimersAndSessions()

    if (playerRef.current?.destroy) {
      try {
        playerRef.current.destroy()
      } catch (e) {}
    }

    try {
      playerRef.current = new window.YT.Player(containerId, {
        videoId: yId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          disablekb: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true)
            try {
              event.target.setPlaybackRate(playbackSpeed)
              const dur = event.target.getDuration()
              if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                setVideoDuration(dur)
              }
              setIsMuted(Boolean(event.target.isMuted()))
            } catch (e) {}
          },
          onStateChange: (event: any) => {
            const playing = event.data === 1
            setIsPlaying(playing)
            if (playing && shadowPhase === 'idle') {
              setShadowPhase('listening')
            }
            try {
              const dur = event.target.getDuration()
              if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                setVideoDuration(dur)
              }
            } catch (e) {}
          },
        },
      })
    } catch (err) {
      console.error('Error mounting YouTube Player:', err)
    }

    return () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy()
        } catch (e) {}
      }
    }
  }, [isApiLoaded, selectedVideo?.id])

  // Fullscreen event listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Evaluate speech against target sentence
  const evaluateLearnerSpeech = useCallback((targetText: string, spokenText: string) => {
    const targetWords = (targetText || '').trim().split(/\s+/).filter(Boolean)
    const userTokens = (spokenText || '').toLowerCase().replace(/[^a-z0-9' ]/g, '').split(/\s+/).filter(Boolean)

    if (targetWords.length === 0) return { score: 100, matchedCount: 0 }
    if (userTokens.length === 0) return { score: 0, matchedCount: 0 }

    let matchedCount = 0
    let lastFoundIdx = -1

    for (let i = 0; i < targetWords.length; i++) {
      const cleanTarget = cleanToken(targetWords[i])
      if (!cleanTarget) continue

      let found = false
      for (let j = 0; j < userTokens.length; j++) {
        const u = userTokens[j]
        if (u === cleanTarget || (cleanTarget.length > 3 && (u.includes(cleanTarget) || cleanTarget.includes(u)))) {
          found = true
          lastFoundIdx = j
          break
        }
      }
      if (found) matchedCount++
    }

    const raw = (matchedCount / targetWords.length) * 100
    // Grounded score calculation
    const score = Math.min(100, Math.max(userTokens.length > 0 ? 50 : 25, Math.round(raw)))
    return { score, matchedCount }
  }, [])

  // Step 7: Finish speaking turn, show feedback, and auto-resume to next sentence
  const finishSpeakingTurn = useCallback(() => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current)
      maxRecordingTimeoutRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }

    const currentText = currentSentence?.text || ''
    const { score } = evaluateLearnerSpeech(currentText, liveTranscript)
    setLastFeedbackScore(score)
    setCompletedScores((prev) => ({
      ...prev,
      [activeSentenceIndex]: { score, text: liveTranscript },
    }))

    setShadowPhase('feedback')

    // Step 9: Automatically resume video and continue to the next sentence
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current)
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false
      if (activeSentenceIndex < lines.length - 1) {
        const nextIdx = activeSentenceIndex + 1
        setActiveSentenceIndex(nextIdx)
        const nextLine = lines[nextIdx]
        const nextStart = parseLineStartSeconds(nextLine)

        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(nextStart, true)
          if (typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo()
          }
          setCurrentPlaybackTime(nextStart)
          setIsPlaying(true)
        }
        setLiveTranscript('')
        setShadowPhase('listening')
      } else {
        // Reached end of lesson
        setShadowPhase('idle')
        showToast({
          title: 'Lesson Completed! 🎉',
          message: 'Great work! You finished all dialogue lines in this scene.',
          type: 'info',
        })
      }
    }, 1600)
  }, [activeSentenceIndex, currentSentence?.text, lines, liveTranscript, evaluateLearnerSpeech, showToast])

  // Step 4 & 5: Trigger learner's speaking turn with live Speech Recognition & Silence Detection
  const triggerLearnerSpeakingTurn = useCallback(() => {
    if (isTransitioningRef.current) return
    clearAllTimersAndSessions()

    setShadowPhase('speaking')
    setLiveTranscript('')
    setMicError(null)

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      // Allow learner to continue after 4 seconds fallback
      maxRecordingTimeoutRef.current = setTimeout(() => {
        finishSpeakingTurn()
      }, 4000)
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = selectedVideo?.accent?.toLowerCase().includes('brit') ? 'en-GB' : 'en-US'
      rec.continuous = true
      rec.interimResults = true

      let hasSpoken = false

      rec.onresult = (event: any) => {
        let interim = ''
        let final = ''
        for (let i = 0; i < event.results.length; i++) {
          const trans = event.results[i][0]?.transcript || ''
          if (event.results[i].isFinal) {
            final += trans + ' '
          } else {
            interim += trans + ' '
          }
        }
        const fullTranscript = (final + interim).trim()
        setLiveTranscript(fullTranscript)

        if (fullTranscript.length > 0) {
          hasSpoken = true
          // Step 6: Silence detection after learner speaks (1.3 seconds debounce)
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = setTimeout(() => {
            finishSpeakingTurn()
          }, 1300)
        }
      }

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setMicError('Microphone permission was denied. Please allow microphone access to practice speaking.')
        }
      }

      rec.onend = () => {
        if (shadowPhase === 'speaking' && !isTransitioningRef.current) {
          // If recognition ended early but user has spoken, wrap up
          if (hasSpoken) {
            finishSpeakingTurn()
          }
        }
      }

      rec.start()
      recognitionRef.current = rec

      // Step 5 timeout: Maximum recording duration safety buffer
      const lineDuration =
        parseLineEndSeconds(currentSentence, nextSentence) - parseLineStartSeconds(currentSentence)
      const maxMs = Math.min(10000, Math.max(5000, Math.round((lineDuration * 1.6 + 2.5) * 1000)))

      maxRecordingTimeoutRef.current = setTimeout(() => {
        finishSpeakingTurn()
      }, maxMs)
    } catch (err: any) {
      console.warn('Could not start recognition:', err)
      setMicError('Could not start microphone. Click Continue to proceed.')
    }
  }, [clearAllTimersAndSessions, selectedVideo?.accent, currentSentence, nextSentence, shadowPhase, finishSpeakingTurn])

  // Persistent 100ms Polling Loop: Detects sentence end and drives Auto-Shadowing
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return

    const interval = setInterval(() => {
      try {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const t = playerRef.current.getCurrentTime()
          if (typeof t === 'number' && !isNaN(t)) {
            setCurrentPlaybackTime(t)

            // Step 2 & 3: In Automatic Shadowing mode, detect sentence boundary
            if (autoShadowEnabled && isPlaying && shadowPhase === 'listening' && lines.length > 0) {
              const activeLine = lines[activeSentenceIndex]
              if (activeLine) {
                const nextLine = lines[activeSentenceIndex + 1]
                const endSec = parseLineEndSeconds(activeLine, nextLine)
                // Buffer (+0.18s) to ensure the closing consonant/word is fully audible
                if (t >= endSec + 0.18) {
                  // Pause video immediately
                  if (typeof playerRef.current.pauseVideo === 'function') {
                    playerRef.current.pauseVideo()
                  }
                  setIsPlaying(false)
                  // Step 4: Display "Your turn" state & start microphone recording
                  triggerLearnerSpeakingTurn()
                }
              }
            }
          }
        }

        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
          const s = playerRef.current.getPlayerState()
          setIsPlaying(s === 1)
        }
        if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
          const d = playerRef.current.getDuration()
          if (typeof d === 'number' && !isNaN(d) && d > 0 && videoDuration === 0) {
            setVideoDuration(d)
          }
        }
      } catch (e) {}
    }, 100)

    return () => clearInterval(interval)
  }, [isPlayerReady, autoShadowEnabled, isPlaying, shadowPhase, lines, activeSentenceIndex, videoDuration, triggerLearnerSpeakingTurn])

  // Auto-scroll active line into view smoothly
  useEffect(() => {
    if (activeSentenceIndex >= 0) {
      const el = document.getElementById(`dialogue-line-${activeSentenceIndex}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [activeSentenceIndex])

  // Essential Control 1: Play / Pause Practice Session
  const togglePlaySession = useCallback(() => {
    if (!playerRef.current) return
    clearAllTimersAndSessions()
    isTransitioningRef.current = false

    if (isPlaying) {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo()
      }
      setIsPlaying(false)
      setShadowPhase('idle')
    } else {
      // If we were paused at speaking turn or feedback, restart listening on current line
      const currentStart = parseLineStartSeconds(currentSentence)
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(currentStart, true)
      }
      if (typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo()
      }
      setIsPlaying(true)
      setCurrentPlaybackTime(currentStart)
      setShadowPhase('listening')
      setLiveTranscript('')
    }
  }, [isPlaying, clearAllTimersAndSessions, currentSentence])

  // Essential Control 2: Replay current sentence
  const replayCurrentSentence = useCallback(() => {
    if (!playerRef.current || !currentSentence) return
    clearAllTimersAndSessions()
    isTransitioningRef.current = false

    const startSec = parseLineStartSeconds(currentSentence)
    if (typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(startSec, true)
    }
    if (typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo()
    }
    setIsPlaying(true)
    setCurrentPlaybackTime(startSec)
    setShadowPhase('listening')
    setLiveTranscript('')
  }, [currentSentence, clearAllTimersAndSessions])

  // Essential Control 3: Playback speed (0.8x, 1.0x, 1.25x)
  const handleSetSpeed = (rate: number) => {
    setPlaybackSpeed(rate)
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate)
    }
  }

  // Seek video and switch active line
  const handleSelectSentence = useCallback(
    (index: number) => {
      if (!lines[index] || !playerRef.current) return
      clearAllTimersAndSessions()
      isTransitioningRef.current = false

      const targetLine = lines[index]
      const startSec = parseLineStartSeconds(targetLine)
      setActiveSentenceIndex(index)
      setLiveTranscript('')

      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(startSec, true)
      }
      if (typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo()
      }
      setIsPlaying(true)
      setCurrentPlaybackTime(startSec)
      setShadowPhase('listening')

      // On mobile screens, return to player view so learner sees video
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileTab('player')
      }
    },
    [lines, clearAllTimersAndSessions]
  )

  // Skip to next sentence manually
  const handleSkipSentence = useCallback(() => {
    if (activeSentenceIndex < lines.length - 1) {
      handleSelectSentence(activeSentenceIndex + 1)
    }
  }, [activeSentenceIndex, lines.length, handleSelectSentence])

  // Cinema Controls
  const toggleMute = useCallback(() => {
    if (!playerRef.current) return
    try {
      if (isMuted) {
        playerRef.current.unMute()
        setIsMuted(false)
      } else {
        playerRef.current.mute()
        setIsMuted(true)
      }
    } catch (e) {}
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    if (!videoFrameRef.current) return
    if (!document.fullscreenElement) {
      videoFrameRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const handleSeekTimeline = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!playerRef.current) return
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const pct = Math.max(0, Math.min(1, clickX / rect.width))
      const totalSec =
        videoDuration > 0
          ? videoDuration
          : lines.length > 0
          ? parseLineEndSeconds(lines[lines.length - 1])
          : 180
      const targetSec = pct * totalSec

      clearAllTimersAndSessions()
      isTransitioningRef.current = false

      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(targetSec, true)
      }
      setCurrentPlaybackTime(targetSec)

      // Find closest sentence index for targetSec
      let foundIdx = 0
      for (let i = lines.length - 1; i >= 0; i--) {
        if (targetSec >= parseLineStartSeconds(lines[i])) {
          foundIdx = i
          break
        }
      }
      setActiveSentenceIndex(foundIdx)
      setShadowPhase('listening')
    },
    [videoDuration, lines, clearAllTimersAndSessions]
  )

  // Target sentence words for word-by-word subtitle display
  const targetTokens = useMemo(() => {
    if (!currentSentence?.text) return []
    return currentSentence.text.trim().split(/\s+/).filter(Boolean)
  }, [currentSentence?.text])

  // Live matched word indices during learner's speaking turn
  const matchedTargetIndices = useMemo(() => {
    if (!targetTokens.length || !liveTranscript.trim()) return new Set<number>()
    const spokenTokens = liveTranscript.toLowerCase().replace(/[^a-z0-9' ]/g, '').split(/\s+/).filter(Boolean)
    const matched = new Set<number>()

    let spokenScanIdx = 0
    for (let i = 0; i < targetTokens.length; i++) {
      const cleanTarget = cleanToken(targetTokens[i])
      if (!cleanTarget) continue

      for (let j = spokenScanIdx; j < spokenTokens.length; j++) {
        const sw = spokenTokens[j]
        if (sw === cleanTarget || (cleanTarget.length > 3 && (sw.includes(cleanTarget) || cleanTarget.includes(sw)))) {
          matched.add(i)
          spokenScanIdx = j + 1
          break
        }
      }
    }
    return matched
  }, [targetTokens, liveTranscript])

  // Filtered lines for dialogue search
  const displayLines = useMemo(() => {
    if (!scriptSearch.trim()) return lines
    const q = scriptSearch.toLowerCase()
    return lines.filter(
      (l) =>
        l.text.toLowerCase().includes(q) ||
        (l.speaker && l.speaker.toLowerCase().includes(q)) ||
        (l.character && l.character.toLowerCase().includes(q))
    )
  }, [lines, scriptSearch])

  // Handle Admin Add Clip
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalTitle.trim() || !modalMovieTitle.trim() || !modalYoutubeUrl.trim()) {
      showToast({
        title: 'Missing info',
        message: 'Please fill in Movie Title, Scene Title, and YouTube URL.',
        type: 'warning',
      })
      return
    }

    setSubmittingModal(true)
    try {
      const token = getStoredToken()
      const parsedLines = modalDialogueText
        .split('\n')
        .filter((l) => l.trim())
        .map((l, idx) => {
          const parts = l.split('|').map((s) => s.trim())
          const time = parts[0] || `0:${idx * 6}`
          const speaker = parts[1] || 'Speaker'
          const text = parts.slice(2).join('|').trim() || parts[0]
          return {
            id: idx + 1,
            time,
            speaker,
            character: speaker,
            text,
            seconds: parseLineStartSeconds({ id: idx, time, text }),
          }
        })

      const res = await fetch(apiUrl('/api/shadowing'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: modalTitle.trim(),
          movie_title: modalMovieTitle.trim(),
          youtube_url: modalYoutubeUrl.trim(),
          cefr_level: modalLevel,
          accent: modalAccent,
          duration: modalDuration.trim() || '2:00',
          description: modalDescription.trim(),
          dialogue_lines: parsedLines,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save clip')

      showToast({
        title: 'Published! 🎬',
        message: 'New movie clip added successfully.',
        type: 'info',
      })

      setShowAddModal(false)
      fetchVideos()
    } catch (err: any) {
      showToast({
        title: 'Error',
        message: err.message || 'Could not add clip.',
        type: 'warning',
      })
    } finally {
      setSubmittingModal(false)
    }
  }

  // Admin AI Auto-Fill Helper
  const handleAiAutoFillModal = async () => {
    const rawUrl = modalYoutubeUrl.trim()
    const yId = extractYoutubeId(rawUrl)
    if (!yId || yId.length !== 11) {
      showToast({
        title: "Noto'g'ri YouTube havola",
        message: 'Haqiqiy YouTube video havolasini kiriting.',
        type: 'warning',
      })
      return
    }

    setAiGeneratingModal(true)
    setAiModalBadge(null)

    try {
      const token = getStoredToken()
      const res = await fetch(apiUrl('/api/shadowing/ai-generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          youtube_url: rawUrl,
          gemini_api_key: typeof window !== 'undefined' ? localStorage.getItem('foxford_gemini_key') || undefined : undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Video audiosini tahlil qilib bo'lmadi")

      const ai = json.data
      if (ai) {
        if (ai.movie_title) setModalMovieTitle(ai.movie_title)
        if (ai.title) setModalTitle(ai.title)
        if (ai.cefr_level) setModalLevel(ai.cefr_level)
        if (ai.accent) setModalAccent(ai.accent)
        if (ai.duration) setModalDuration(ai.duration)
        if (ai.description) setModalDescription(ai.description)
        if (Array.isArray(ai.dialogue_lines) && ai.dialogue_lines.length > 0) {
          const linesText = ai.dialogue_lines
            .map((l: any) => `${l.time || '0:05'} | ${l.speaker || 'Speaker'} | ${l.text}`)
            .join('\n')
          setModalDialogueText(linesText)
        }
        const count = ai.dialogue_lines?.length || 0
        setAiModalBadge(`✓ Haqiqiy audiodan ${count} ta sinxron dialog olindi! (${ai.duration})`)
      }
    } catch (err: any) {
      showToast({
        title: 'Xatolik',
        message: err.message || "Video audio/subtitrlari olinmadi.",
        type: 'warning',
      })
    } finally {
      setAiGeneratingModal(false)
    }
  }

  return (
    <div className="w-full min-h-screen pb-16 px-2.5 xs:px-3 sm:px-6 lg:px-8 pt-2 select-none space-y-3.5 sm:space-y-4">
      {/* 1. CLEAN MINIMALIST HEADER BAR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            to="/speaking"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0"
            title="Back to Speaking Hub"
          >
            <AltArrowLeftIcon className="w-5 h-5" size={20} />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
              <span className="text-[11px] xs:text-xs font-normal text-slate-400">Movie Shadowing</span>
              {selectedVideo && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[11px] xs:text-xs font-medium text-amber-600 dark:text-amber-400 max-w-[130px] xs:max-w-[200px] truncate">
                    {selectedVideo.movie_title}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {selectedVideo.cefr_level}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                    {selectedVideo.accent}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-sm xs:text-base sm:text-lg font-medium text-slate-900 dark:text-white truncate">
              {selectedVideo?.title || 'Loading scene...'}
            </h1>
          </div>
        </div>

        {/* Clean Header Controls: Automatic Mode Switch & Admin Link */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Automatic Shadowing Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !autoShadowEnabled
              setAutoShadowEnabled(next)
              if (!next) {
                clearAllTimersAndSessions()
                setShadowPhase('idle')
              }
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 cursor-pointer shadow-xs',
              autoShadowEnabled
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white'
            )}
            title="Auto-Shadowing automatically pauses after each sentence and starts your microphone"
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                autoShadowEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              )}
            />
            <span>{autoShadowEnabled ? 'Auto-Shadow: ON' : 'Manual Mode'}</span>
          </button>

          {/* Single Clean Admin Link (only for Admins) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Add new video clip"
              >
                <span>+ Clip</span>
              </button>
              <Link
                to="/admin/shadowing"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                title="Admin Hub"
              >
                <ShieldCheckIcon className="w-4 h-4" size={16} />
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Tab Switcher (Studio Player vs Full Script) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMobileTab('player')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'player'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <ClapperboardPlayIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
          <span>Player & Stage</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('script')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'script'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <SoundwaveIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
          <span>Script ({lines.length})</span>
        </button>
      </div>

      {/* 2. MAIN WORKSPACE (2-COLUMN GRID) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start w-full">
        {/* LEFT COLUMN: Cinema Player + Unified Shadowing Stage (7 Cols) */}
        <section className={cn('lg:col-span-7 space-y-3.5', mobileTab === 'script' ? 'hidden lg:block' : 'block')}>
          {/* Cinema Player (Clean: Masked YouTube branding and watermark) */}
          <div
            ref={videoFrameRef}
            key={selectedVideo?.id}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onClick={() => {
              setShowControls(true)
            }}
            onTouchStart={() => {
              setShowControls(true)
            }}
            className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl border border-slate-200/60 dark:border-slate-800 group select-none"
          >
            {/* Masked YouTube Frame */}
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
              <div
                id={`yt-player-box-${selectedVideo?.id}`}
                className="w-full h-full scale-[1.18] sm:scale-[1.20] pointer-events-none"
              />
            </div>

            {/* Click to Toggle Play/Pause */}
            <div
              onClick={() => {
                togglePlaySession()
                setShowControls(true)
              }}
              className="absolute inset-0 cursor-pointer z-10"
              title={isPlaying ? 'Click to pause' : 'Click to play'}
            />

            {/* Top Scene & CEFR Badge */}
            <div className="absolute top-2.5 xs:top-3 left-2.5 xs:left-3 z-20 pointer-events-none flex items-center gap-1.5 xs:gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 xs:px-3 py-1 rounded-full text-[11px] xs:text-xs font-semibold bg-black/75 backdrop-blur-md text-white border border-white/15 shadow-sm">
                <ClapperboardPlayIcon className="w-3.5 h-3.5 text-amber-400" size={14} />
                <span className="truncate max-w-[130px] xs:max-w-[190px] sm:max-w-xs">{selectedVideo?.movie_title || 'Movie Scene'}</span>
              </span>
              {selectedVideo?.cefr_level && (
                <span className="px-2 py-0.5 rounded-full text-[10px] xs:text-[11px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/35 backdrop-blur-md">
                  {selectedVideo.cefr_level}
                </span>
              )}
            </div>

            {/* Big Center Play Button When Paused */}
            {!isPlaying && (
              <div
                onClick={() => {
                  togglePlaySession()
                  setShowControls(true)
                }}
                className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer pointer-events-auto bg-black/30 backdrop-blur-[2px] transition-all"
              >
                <button
                  type="button"
                  aria-label="Play Video"
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:scale-105 active:scale-95 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/40 transition-all cursor-pointer group/btn"
                >
                  <PlayIcon className="w-7 h-7 sm:w-10 sm:h-10 text-slate-950 translate-x-0.5 transition-transform group-hover/btn:scale-110" size={32} />
                </button>
              </div>
            )}

            {/* Bottom Cinema Controls Bar */}
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 z-20 px-2.5 xs:px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-1.5 transition-opacity duration-300',
                showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              )}
            >
              {/* Progress Scrubber */}
              <div
                onClick={handleSeekTimeline}
                className="w-full h-2 rounded-full bg-white/20 hover:h-2.5 transition-all cursor-pointer relative flex items-center group/scrub"
                title="Seek video position"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 relative"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((currentPlaybackTime || 0) /
                          (videoDuration > 0
                            ? videoDuration
                            : lines.length > 0
                            ? parseLineEndSeconds(lines[lines.length - 1])
                            : 180)) *
                          100
                      )
                    )}%`,
                  }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md scale-0 group-hover/scrub:scale-100 transition-transform" />
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between gap-1.5 xs:gap-2 text-white text-[11px] sm:text-xs">
                {/* Left Controls: Play/Pause, Replay Line, Time */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={togglePlaySession}
                    className="p-1 sm:p-1.5 rounded-md text-white hover:text-amber-400 transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" size={18} />
                    ) : (
                      <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" size={18} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={replayCurrentSentence}
                    className="p-1 sm:p-1.5 rounded-md text-white/80 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Replay Current Sentence"
                  >
                    <RestartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
                  </button>

                  <span className="font-mono text-[10px] xs:text-[11px] sm:text-xs text-white/80 shrink-0">
                    {formatSeconds(currentPlaybackTime)} /{' '}
                    {formatSeconds(
                      videoDuration > 0
                        ? videoDuration
                        : lines.length > 0
                        ? parseLineEndSeconds(lines[lines.length - 1])
                        : 180
                    )}
                  </span>
                </div>

                {/* Right Controls: Volume & Fullscreen */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 sm:p-1.5 rounded-md text-white/80 hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeCrossIcon className="w-4 h-4 text-rose-400" size={16} />
                    ) : (
                      <VolumeLoudIcon className="w-4 h-4 text-white" size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1 sm:p-1.5 rounded-md text-white/80 hover:text-white transition-colors cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <MinimizeSquareIcon className="w-4 h-4 text-white" size={16} />
                    ) : (
                      <MaximizeSquareIcon className="w-4 h-4 text-white" size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* UNIFIED INTERACTIVE SHADOWING STAGE */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 sm:space-y-4">
            {/* Status Indicator Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                {shadowPhase === 'speaking' ? (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-xs animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <Microphone2Icon className="w-4 h-4 shrink-0" size={16} />
                    <span className="truncate">Your turn — Repeat out loud!</span>
                  </div>
                ) : shadowPhase === 'feedback' ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" size={16} />
                    <span className="truncate">
                      {lastFeedbackScore && lastFeedbackScore >= 75
                        ? `Great work! Match: ${lastFeedbackScore}%`
                        : `Good effort! Match: ${lastFeedbackScore || 65}%`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-xs">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        isPlaying ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                      )}
                    />
                    <span className="truncate">
                      {isPlaying ? 'Listening to Actor...' : 'Paused — Click Start to practice'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 xs:gap-2 text-xs shrink-0">
                <span className="text-slate-400 font-normal text-[11px] xs:text-xs">
                  {activeSentenceIndex + 1} / {lines.length}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                  <ClockCircleIcon className="w-3.5 h-3.5" size={13} />
                  <span>{currentSentence?.time || '0:00'}</span>
                </span>
              </div>
            </div>

            {/* Mic Permission / Error Alert */}
            {micError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <InfoCircleIcon className="w-4 h-4 shrink-0 text-amber-500" size={16} />
                  <span className="truncate">{micError}</span>
                </div>
                <button
                  type="button"
                  onClick={finishSpeakingTurn}
                  className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs shrink-0 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}

            {/* TARGET SENTENCE DISPLAY WITH LIVE WORD-BY-WORD HIGHLIGHTING */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {currentSentence?.speaker || currentSentence?.character || 'Actor'}
                </span>
                {currentSentence?.tip && (
                  <span className="text-[11px] text-slate-400 italic truncate max-w-xs">
                    {currentSentence.tip}
                  </span>
                )}
              </div>

              {/* Subtitle Words Box */}
              <div className="min-h-[3.4rem] p-2.5 xs:p-3 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center">
                {shadowPhase === 'speaking' || shadowPhase === 'feedback' ? (
                  /* Word-by-word real-time matching as learner speaks */
                  <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-sm xs:text-base sm:text-lg leading-relaxed">
                    {targetTokens.map((word, wIdx) => {
                      const isMatched = matchedTargetIndices.has(wIdx)
                      return (
                        <span
                          key={wIdx}
                          className={cn(
                            'transition-all duration-150 px-1 py-0.5 rounded',
                            isMatched
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 font-bold scale-[1.03] shadow-xs'
                              : 'text-slate-800 dark:text-slate-200'
                          )}
                        >
                          {word}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  /* Video playback subtitle: Grounded timestamp sync without fake estimation */
                  <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-sm xs:text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-100">
                    {currentSentence?.words && currentSentence.words.length > 0 ? (
                      currentSentence.words.map((w, wIdx) => {
                        const isSpoken = currentPlaybackTime >= w.start && currentPlaybackTime <= w.end
                        const isPast = currentPlaybackTime > w.end
                        return (
                          <span
                            key={wIdx}
                            className={cn(
                              'transition-all px-1 py-0.5 rounded',
                              isSpoken
                                ? 'text-amber-500 dark:text-amber-400 bg-amber-500/15 font-bold scale-105'
                                : isPast
                                ? 'text-slate-900 dark:text-slate-100'
                                : 'text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {w.word}
                          </span>
                        )
                      })
                    ) : (
                      <p className="font-normal">
                        "{currentSentence?.text || 'Play video to start...'}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Live Speech Recognition Transcript Subtitle */}
              {shadowPhase === 'speaking' && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
                  <SoundwaveIcon className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" size={14} />
                  <span className="font-mono italic truncate">
                    {liveTranscript ? `"${liveTranscript}"` : 'Listening... Speak English now'}
                  </span>
                </div>
              )}

              {/* Uzbek Translation */}
              {currentSentence?.translation && (
                <p className="text-xs font-normal text-slate-400 flex items-center gap-1.5 px-1 pt-0.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                    UZ
                  </span>
                  <span>{currentSentence.translation}</span>
                </p>
              )}
            </div>

            {/* ESSENTIAL CONTROLS ROW */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5">
              {/* Left: Play/Pause, Replay Line, Speed */}
              <div className="flex items-center gap-2 flex-wrap justify-between xs:justify-start">
                <button
                  type="button"
                  onClick={togglePlaySession}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer',
                    isPlaying
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold'
                  )}
                >
                  {isPlaying ? (
                    <>
                      <PauseIcon className="w-4 h-4" size={16} />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4" size={16} />
                      <span>{shadowPhase === 'idle' ? 'Start' : 'Resume'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={replayCurrentSentence}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-normal text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Replay Current Sentence"
                >
                  <RestartIcon className="w-3.5 h-3.5" size={14} />
                  <span>Replay</span>
                </button>

                {/* Playback Speed (Essential for Shadowing) */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  {[0.8, 1.0, 1.25].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSetSpeed(s)}
                      className={cn(
                        'px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer',
                        playbackSpeed === s
                          ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Speaking manual override / Skip button */}
              <div className="flex items-center gap-2 justify-end">
                {shadowPhase === 'speaking' && (
                  <button
                    type="button"
                    onClick={finishSpeakingTurn}
                    className="flex-1 xs:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Done speaking, check match"
                  >
                    <CheckCircleIcon className="w-4 h-4" size={16} />
                    <span>Done Speaking</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={activeSentenceIndex >= lines.length - 1}
                  onClick={handleSkipSentence}
                  className="flex-1 xs:flex-initial px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Skip to Next Sentence"
                >
                  <span>Skip</span>
                  <AltArrowRightIcon className="w-3.5 h-3.5" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Scene Context & Overview */}
          {selectedVideo && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate mr-2">
                  {selectedVideo.movie_title} — {selectedVideo.title}
                </span>
                <span className="font-mono text-[11px] shrink-0 flex items-center gap-1">
                  <ClockCircleIcon className="w-3.5 h-3.5" size={14} />
                  <span>{selectedVideo.duration}</span>
                </span>
              </div>
              {selectedVideo.description && (
                <p className="text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                  {selectedVideo.description}
                </p>
              )}
            </div>
          )}

          {/* Mobile Shortcut to Dialogue Script */}
          <button
            type="button"
            onClick={() => setMobileTab('script')}
            className="lg:hidden w-full py-2.5 px-3 rounded-xl border border-dashed border-amber-500/40 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <SoundwaveIcon className="w-4 h-4 text-amber-500" size={16} />
            <span>Open Synchronized Script ({lines.length} lines)</span>
            <AltArrowRightIcon className="w-3.5 h-3.5 text-amber-500" size={14} />
          </button>
        </section>

        {/* RIGHT COLUMN: Synchronized Dialogue Script (5 Cols) */}
        <section
          className={cn(
            'lg:col-span-5 flex flex-col h-[520px] sm:h-[580px] lg:h-[650px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden',
            mobileTab === 'player' ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* Mobile Back Banner */}
          <div className="lg:hidden p-2 bg-amber-500/10 border-b border-amber-500/20 text-center text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between px-3">
            <span>Tap any line to play that sentence</span>
            <button
              type="button"
              onClick={() => setMobileTab('player')}
              className="font-semibold underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer"
            >
              Back to Player
            </button>
          </div>

          {/* Script Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  Synchronized Dialogue Script
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {lines.length} lines
                </span>
              </div>

              <span className="text-[11px] font-normal text-slate-400">
                Click any line to seek
              </span>
            </div>

            {/* Quick search */}
            <div className="relative">
              <MagnifierIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search dialogue words..."
                value={scriptSearch}
                onChange={(e) => setScriptSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* SCRIPT LINES SCROLL CONTAINER */}
          <div
            ref={scriptContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar"
          >
            {displayLines.length === 0 ? (
              <div className="py-16 text-center text-xs font-normal text-slate-400">
                No matching dialogue lines.
              </div>
            ) : (
              displayLines.map((line, idx) => {
                const isActive = activeSentenceIndex === idx
                const startSec = parseLineStartSeconds(line)
                const formattedTime = formatSeconds(startSec)
                const speakerName = line.speaker || line.character || 'Actor'
                const lineScore = completedScores[idx]

                return (
                  <div
                    key={line.id || idx}
                    id={`dialogue-line-${idx}`}
                    onClick={() => handleSelectSentence(idx)}
                    className={cn(
                      'p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 group',
                      isActive
                        ? 'border-amber-500/80 bg-amber-500/5 dark:bg-amber-400/5 shadow-xs ring-1 ring-amber-500/20'
                        : 'border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    )}
                  >
                    {/* Line Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-mono text-[11px] px-1.5 py-0.5 rounded transition-colors',
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-semibold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          )}
                        >
                          {formattedTime}
                        </span>
                        <span
                          className={cn(
                            'font-medium text-xs',
                            isActive
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {speakerName}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5">
                        {lineScore ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                            <CheckCircleIcon className="w-3 h-3 text-emerald-500" size={12} />
                            <span>{lineScore.score}%</span>
                          </span>
                        ) : isActive ? (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span>Active</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Dialogue Line Text */}
                    <p
                      className={cn(
                        'text-xs sm:text-sm font-normal leading-relaxed',
                        isActive
                          ? 'text-slate-900 dark:text-white font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      "{line.text}"
                    </p>

                    {/* Translation */}
                    {line.translation && (
                      <p className="text-[11px] font-normal text-slate-400 truncate">
                        {line.translation}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      {/* 3. EXPLORE MORE MOVIE SCENES (Horizontal Strip) */}
      <section className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClapperboardPlayIcon className="w-4 h-4 text-amber-500" size={16} />
            <h2 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">
              Explore More Movie Scenes ({videos.length})
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'B1', 'B2', 'C1'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-normal transition-colors cursor-pointer',
                  levelFilter === lvl
                    ? 'bg-amber-500 text-slate-950 font-medium'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {lvl === 'all' ? 'All' : lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {videos
            .filter((v) => levelFilter === 'all' || v.cefr_level.toUpperCase() === levelFilter)
            .map((video) => {
              const isSelected = selectedVideo?.id === video.id
              const yId = video.youtube_id || extractYoutubeId(video.youtube_url)
              const thumbUrl = `https://img.youtube.com/vi/${yId}/mqdefault.jpg`

              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => {
                    setSelectedVideo(video)
                    setActiveSentenceIndex(0)
                    setCompletedScores({})
                    setShadowPhase('idle')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={cn(
                    'p-2 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 group',
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/40'
                  )}
                >
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/40">
                    <img
                      src={thumbUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        ;(e.target as any).src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop'
                      }}
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                      {video.duration}
                    </span>
                    <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-semibold px-1 py-0.2 rounded">
                      {video.cefr_level}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-normal text-slate-900 dark:text-white truncate">
                      {video.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{video.movie_title}</p>
                  </div>
                </button>
              )
            })}
        </div>
      </section>

      {/* 4. ADMIN ADD CLIP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-medium text-slate-900 dark:text-white">
                Add Movie Clip for Shadowing
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseCircleIcon className="w-5 h-5" size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-3.5 text-xs">
              <div className="space-y-1.5 p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-800 dark:text-slate-200 block">
                    YouTube URL *
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal flex items-center gap-1">
                    <StarsIcon className="w-3 h-3 text-amber-500" size={12} />
                    <span>Paste link — AI auto-fills details</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={modalYoutubeUrl}
                    onChange={(e) => {
                      setModalYoutubeUrl(e.target.value)
                      if (aiModalBadge) setAiModalBadge(null)
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-normal"
                  />
                  <button
                    type="button"
                    disabled={aiGeneratingModal || !modalYoutubeUrl.trim()}
                    onClick={handleAiAutoFillModal}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <StarsIcon className={cn('w-3.5 h-3.5', aiGeneratingModal && 'animate-spin')} size={14} />
                    <span>{aiGeneratingModal ? 'Tahlil...' : 'AI Auto-Fill'}</span>
                  </button>
                </div>
                {aiModalBadge && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" size={12} />
                    <span>{aiModalBadge}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Movie Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dead Poets Society"
                    value={modalMovieTitle}
                    onChange={(e) => setModalMovieTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Scene Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Carpe Diem Speech"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    CEFR Level
                  </label>
                  <select
                    value={modalLevel}
                    onChange={(e) => setModalLevel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Accent
                  </label>
                  <select
                    value={modalAccent}
                    onChange={(e) => setModalAccent(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="American">American</option>
                    <option value="British">British</option>
                    <option value="Australian">Australian</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={modalDuration}
                    onChange={(e) => setModalDuration(e.target.value)}
                    placeholder="2:00"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Dialogue Lines (Format: <code>time | speaker | dialogue text</code>)
                </label>
                <textarea
                  rows={4}
                  value={modalDialogueText}
                  onChange={(e) => setModalDialogueText(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium"
                >
                  {submittingModal ? 'Saving...' : 'Add Clip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
