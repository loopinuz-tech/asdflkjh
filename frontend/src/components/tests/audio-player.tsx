import { ListeningAudio } from '@/lib/test-engine/types'
import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { formatTime } from './timer'
import { cn } from '@/lib/utils'
import { apiUrl } from '@/lib/api-config'

export function AudioPlayer({ 
  audio, 
  className,
  compact = false 
}: { 
  audio: ListeningAudio; 
  className?: string;
  compact?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [audioSrc, setAudioSrc] = useState(audio.file_path)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setAudioSrc(audio.file_path)
  }, [audio.file_path])

  const handleAudioError = () => {
    if (audioSrc && !audioSrc.startsWith('http')) {
      const remoteUrl = apiUrl(audio.file_path)
      if (remoteUrl !== audioSrc) {
        console.info('Audio fallback to remote URL:', remoteUrl)
        setAudioSrc(remoteUrl)
      }
    }
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    
    const handleTimeUpdate = () => setCurrentTime(el.currentTime)
    const handleLoadedMetadata = () => setDuration(el.duration)
    const handleEnded = () => setIsPlaying(false)
    
    el.addEventListener('timeupdate', handleTimeUpdate)
    el.addEventListener('loadedmetadata', handleLoadedMetadata)
    el.addEventListener('ended', handleEnded)
    
    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate)
      el.removeEventListener('loadedmetadata', handleLoadedMetadata)
      el.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (value: number | readonly number[]) => {
    const val = Array.isArray(value) ? value[0] : (typeof value === 'number' ? value : 0);
    const newTime = val
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number | readonly number[]) => {
    const val = Array.isArray(value) ? value[0] : (typeof value === 'number' ? value : 0);
    const newVol = val
    setVolume(newVol)
    if (audioRef.current) {
      audioRef.current.volume = newVol
    }
    if (newVol > 0 && isMuted) setIsMuted(false)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted
      audioRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  if (compact) {
    return (
      <div className={cn("bg-card border border-border rounded-xl px-3 py-2 flex items-center gap-3 w-full shadow-2xs", className)}>
        <audio ref={audioRef} src={audioSrc} onError={handleAudioError} preload="metadata" />
        
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-black hover:bg-primary/90 transition-colors shrink-0 shadow-xs cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Restart */}
        <button
          onClick={restart}
          className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          title="Restart audio"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Current Time */}
        <span className="text-[11px] font-mono font-medium text-foreground w-9 text-right shrink-0">
          {formatTime(Math.floor(currentTime))}
        </span>

        {/* Scrub Slider */}
        <div className="flex-1 min-w-28 max-w-md">
          <Slider 
            value={[currentTime]} 
            max={duration || 100} 
            step={1} 
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Duration */}
        <span className="text-[11px] font-mono text-muted-foreground w-9 shrink-0">
          {formatTime(Math.floor(duration))}
        </span>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-1.5 w-24 shrink-0 pl-1 border-l border-border/60">
          <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground cursor-pointer">
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <Slider 
            value={[isMuted ? 0 : volume]} 
            max={1} 
            step={0.01} 
            onValueChange={handleVolumeChange}
            className="w-14 cursor-pointer"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-card border border-border rounded-xl fox-shadow-sm p-4 w-full", className)}>
      <audio ref={audioRef} src={audioSrc} onError={handleAudioError} preload="metadata" />
      
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div className="font-medium text-sm text-foreground truncate">
          {audio.title}
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground w-10 text-right">
            {formatTime(Math.floor(currentTime))}
          </span>
          <Slider 
            value={[currentTime]} 
            max={duration || 100} 
            step={1} 
            onValueChange={handleSeek}
            className="flex-1 cursor-pointer"
          />
          <span className="text-xs font-mono text-muted-foreground w-10">
            {formatTime(Math.floor(duration))}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button
              onClick={restart}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-32">
            <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Slider 
              value={[isMuted ? 0 : volume]} 
              max={1} 
              step={0.01} 
              onValueChange={handleVolumeChange}
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
