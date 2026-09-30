import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  StarsIcon,
  VolumeLoudIcon,
  BookBookmarkIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  AltArrowRightIcon,
} from '@solar-icons/react/bold-duotone'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

interface AIDictionaryModalProps {
  isOpen: boolean
  onClose: () => void
  loading: boolean
  error: string | null
  data: any | null
  onRetry?: () => void
  isPremiumUser: boolean
  showPremiumModal: boolean
  setShowPremiumModal: (v: boolean) => void
}

export function AIDictionaryModal({
  isOpen,
  onClose,
  loading,
  error,
  data,
  onRetry,
  isPremiumUser,
  showPremiumModal,
  setShowPremiumModal,
}: AIDictionaryModalProps) {
  const [isSavingVocab, setIsSavingVocab] = useState(false)
  const [vocabSaved, setVocabSaved] = useState(false)
  const [vocabSuccessMessage, setVocabSuccessMessage] = useState<string | null>(null)

  // Sync saved state when new data is loaded
  useEffect(() => {
    if (data?.is_saved) {
      setVocabSaved(true)
      setVocabSuccessMessage("This word is saved in your personal vocabulary")
    } else {
      setVocabSaved(false)
      setVocabSuccessMessage(null)
    }
  }, [data])

  // Audio pronunciation helper with native CDN & Web Speech API fallback
  const playWordAudio = (wordToSpeak: string) => {
    if (!wordToSpeak) return
    try {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordToSpeak)}&type=2`
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(wordToSpeak)
          utterance.lang = 'en-US'
          utterance.rate = 0.85
          window.speechSynthesis.speak(utterance)
        }
      })
    } catch {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(wordToSpeak)
        utterance.lang = 'en-US'
        utterance.rate = 0.85
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // 1-Click Save to Vocabulary
  const handleSaveToVocab = async () => {
    if (!data) return
    setIsSavingVocab(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
      const res = await fetch('/api/vocabulary/save-from-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          word: data.word || data.base_form,
          definition: data.translation_uz + (data.definition_uz ? ` — ${data.definition_uz}` : ''),
          example_sentence: data.example_sentence,
          pronunciation: data.pronunciation,
          part_of_speech: data.part_of_speech,
          topic: data.topic || 'Reading Academic',
          difficulty: data.difficulty || 'medium',
        })
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setVocabSaved(true)
        setVocabSuccessMessage(json.message || "Word added to your personal vocabulary!")
      } else {
        alert(json.error || 'Failed to save word')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setIsSavingVocab(false)
    }
  }

  return (
    <>
      {/* AI Contextual Dictionary Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-violet-600/10 via-background to-indigo-600/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs">
                  <StarsIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <span>AI Contextual Dictionary</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">
                      Premium
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Contextual meaning & question/passage analysis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Close"
              >
                <CloseCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                    <StarsIcon className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">AI is analyzing context...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Preparing contextual translation and vocabulary details</p>
                  </div>
                </div>
              )}

              {error && !loading && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-2">
                  <p className="text-xs font-semibold text-destructive">{error}</p>
                  {onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onRetry}
                      className="text-xs h-8 cursor-pointer"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              )}

              {data && !loading && (
                <div className="space-y-4">
                  {/* Top Word Card */}
                  <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-secondary/40 border border-border">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-2xl font-black text-foreground tracking-tight capitalize">
                          {data.word || data.base_form}
                        </h2>
                        {data.pronunciation && (
                          <span className="text-sm font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                            {data.pronunciation}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => playWordAudio(data.word || data.base_form)}
                          className="p-1.5 rounded-lg bg-background hover:bg-secondary text-primary transition-colors border border-border cursor-pointer shadow-2xs"
                          title="Listen to pronunciation"
                        >
                          <VolumeLoudIcon className="w-5 h-5 text-amber-500 dark:text-primary" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {data.part_of_speech && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                            {data.part_of_speech}
                          </span>
                        )}
                        {data.difficulty && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                            data.difficulty === 'hard'
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : data.difficulty === 'medium'
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}>
                            IELTS {data.difficulty}
                          </span>
                        )}
                        {data.topic && (
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            • {data.topic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contextual Uzbek Translation Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 via-background to-indigo-500/10 border border-violet-500/30 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Meaning in context (Uzbek):
                    </span>
                    <p className="text-xl font-bold text-foreground capitalize">
                      {data.translation_uz}
                    </p>
                    {data.context_meaning_uz && (
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                        {data.context_meaning_uz}
                      </p>
                    )}
                    {data.definition_uz && !data.context_meaning_uz && (
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                        {data.definition_uz}
                      </p>
                    )}
                  </div>

                  {/* Sentence Context Card */}
                  {data.example_sentence && (
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Sentence in context:
                      </span>
                      <p className="text-xs text-foreground italic leading-relaxed">
                        &ldquo;{data.example_sentence}&rdquo;
                      </p>
                      {data.example_translation_uz && (
                        <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          {data.example_translation_uz}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Synonyms & Collocations */}
                  {(Array.isArray(data.synonyms) && data.synonyms.length > 0) || (Array.isArray(data.collocations) && data.collocations.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Array.isArray(data.synonyms) && data.synonyms.length > 0 && (
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Synonyms (Band 7-8):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.synonyms.map((syn: string, i: number) => (
                              <span key={i} className="text-[11px] font-medium bg-background px-2 py-0.5 rounded border border-border text-foreground">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(data.collocations) && data.collocations.length > 0 && (
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Collocations:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.collocations.map((col: string, i: number) => (
                              <span key={i} className="text-[11px] font-medium bg-background px-2 py-0.5 rounded border border-border text-foreground">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* 1-Click Save to Vocabulary Action */}
                  <div className="pt-2">
                    {vocabSaved ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              {vocabSuccessMessage || "Saved to your personal vocabulary!"}
                            </p>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                              Queued for active review via Spaced Repetition (SRS)
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/vocabulary"
                          target="_blank"
                          className="shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-800 flex items-center gap-1"
                        >
                          Vocabulary <AltArrowRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Button
                          onClick={handleSaveToVocab}
                          disabled={isSavingVocab}
                          className="w-full bg-primary text-black hover:bg-primary/90 font-bold h-11 text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <BookBookmarkIcon className="w-5 h-5" />
                          <span>{isSavingVocab ? "Adding to vocabulary..." : "1-Click Add to Personal Vocabulary"}</span>
                        </Button>
                        <p className="text-[11px] text-center text-muted-foreground">
                          Saved words are scheduled in the Vocabulary section using the SRS Spaced Repetition algorithm.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPremiumModal(false) }}
        >
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
              <StarsIcon className="w-7 h-7 text-amber-500" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                FOXFORD PREMIUM
              </span>
              <h3 className="text-lg font-bold text-foreground mt-2">
                AI Contextual Dictionary & Translation
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Instantly look up unfamiliar words within the exact context of the IELTS test using AI, and add them to your personal vocabulary with 1 click (Spaced Repetition System) — exclusively available for Premium members.
              </p>
            </div>

            <div className="bg-secondary/40 rounded-xl p-3.5 text-left space-y-2 text-xs border border-border/60">
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>100% accurate contextual translation in Uzbek</span>
              </div>
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>IPA pronunciation & native audio playback</span>
              </div>
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>1-Click Spaced Repetition (SRS) vocabulary tracking</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs h-10 cursor-pointer"
                onClick={() => setShowPremiumModal(false)}
              >
                Close
              </Button>
              <Link
                to="/premium"
                target="_blank"
                onClick={() => setShowPremiumModal(false)}
                className={cn(buttonVariants({ variant: 'default' }), "flex-1 text-xs h-10 bg-primary text-black hover:bg-primary/90 font-bold")}
              >
                View Plans
                <AltArrowRightIcon className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
