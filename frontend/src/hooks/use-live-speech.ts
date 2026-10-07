import { useState, useEffect, useRef, useCallback } from 'react'

interface UseLiveSpeechOptions {
  onSpeechResult?: (transcript: string) => void
  silenceTimeoutMs?: number
  lang?: string
}

export function useLiveSpeech({
  onSpeechResult,
  silenceTimeoutMs = 1400,
  lang = 'en-US',
}: UseLiveSpeechOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSupported, setIsSupported] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const onSpeechResultRef = useRef(onSpeechResult)
  useEffect(() => {
    onSpeechResultRef.current = onSpeechResult
  }, [onSpeechResult])

  const pendingSpeechRef = useRef('')

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRec()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      // Aggregate across all speech results in this session
      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i]
        if (item.isFinal) {
          finalTranscript += item[0].transcript + ' '
        } else {
          interimTranscript += item[0].transcript
        }
      }

      const totalSpoken = (finalTranscript + ' ' + interimTranscript).trim()
      pendingSpeechRef.current = totalSpoken
      setInterimTranscript(totalSpoken)

      // Reset silence timer on new speech activity
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

      // Any spoken speech (even 1-2 words like "hi", "yes", "no") triggers send after pause
      if (totalSpoken.length > 0) {
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = pendingSpeechRef.current.trim()
          if (textToSend.length > 0) {
            onSpeechResultRef.current?.(textToSend)
            pendingSpeechRef.current = ''
            setInterimTranscript('')
            stopListening()
          }
        }, silenceTimeoutMs)
      }
    }

    recognition.onerror = (event: any) => {
      console.warn('[SpeechRec] Event error:', event.error)
      if (event.error === 'no-speech') {
        return
      }
      if (event.error === 'not-allowed') {
        setIsListening(false)
        stopAudioMeter()
      }
    }

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      const textToSend = pendingSpeechRef.current.trim()
      if (textToSend.length > 0) {
        onSpeechResultRef.current?.(textToSend)
        pendingSpeechRef.current = ''
        setInterimTranscript('')
      }
      setIsListening(false)
      stopAudioMeter()
    }

    recognitionRef.current = recognition

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      try {
        recognition.stop()
      } catch {}
    }
  }, [lang, silenceTimeoutMs])

  // Setup Web Audio Analyser for mic volume waveform
  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioCtx()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      audioContextRef.current = audioCtx
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateMeter = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length / 255
        setAudioLevel(Math.min(1, avg * 2.2))
        animFrameRef.current = requestAnimationFrame(updateMeter)
      }

      updateMeter()
    } catch (e) {
      console.warn('Audio metering unavailable:', e)
    }
  }, [])

  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    setAudioLevel(0)
  }, [])

  // Start listening to microphone
  const startListening = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking()
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        startAudioMeter()
      } catch (err) {
        console.warn('Recognition start error:', err)
      }
    }
  }, [isSpeaking, startAudioMeter])

  // Stop listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setIsListening(false)
    stopAudioMeter()
  }, [stopAudioMeter])

  // Speak aloud via Web Speech Synthesis
  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      if (isMuted) {
        onEnd?.()
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-GB'
      utterance.rate = 1.05
      utterance.pitch = 0.98

      // Try finding natural British English or English voices
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice =
        voices.find(
          (v) =>
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Arthur')) &&
            (v.lang.startsWith('en-GB') || v.lang.startsWith('en-US'))
        ) ||
        voices.find((v) => v.lang.startsWith('en-GB')) ||
        voices.find((v) => v.lang.startsWith('en'))

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      let ended = false
      let safetyTimer: any = null

      const finishSpeaking = () => {
        if (safetyTimer) clearTimeout(safetyTimer)
        if (!ended) {
          ended = true
          setIsSpeaking(false)
          onEnd?.()
        }
      }

      utterance.onend = finishSpeaking
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e)
        finishSpeaking()
      }

      // Safety fallback: estimate reading time (approx 130 words/min) + buffer
      const wordsCount = text.split(/\s+/).length
      const maxDurationMs = Math.max(3500, (wordsCount / 2.0) * 1000 + 3000)
      safetyTimer = setTimeout(finishSpeaking, maxDurationMs)

      currentUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isMuted]
  )

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    interimTranscript,
    audioLevel,
    isSupported,
    isMuted,
    setIsMuted,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  }
}
