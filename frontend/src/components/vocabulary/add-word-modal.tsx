import React, { useState, useEffect } from 'react'
import {
  CloseCircleIcon,
  StarsIcon,
  VolumeLoudIcon,
  AddCircleIcon,
  CheckCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { lookupWordAI, AIVocabularyResult } from '@/lib/services/vocabulary-ai'
import { VocabFolder } from '@/lib/services/vocabulary-folders'
import { CreateFolderModal } from './create-folder-modal'

interface AddWordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (wordData: {
    id?: string
    word: string
    translation_uz: string
    definition: string
    part_of_speech: string
    pronunciation: string
    synonyms: string[]
    antonyms: string[]
    example_sentence: string
    example_sentence_2: string
    difficulty: string
    topic: string
    folder_id: string
  }) => Promise<void>
  folders: VocabFolder[]
  userId?: string | null
  onFolderCreated: (folder: VocabFolder) => void
  isAdminMode?: boolean
  initialData?: any | null
}

export function AddWordModal({
  isOpen,
  onClose,
  onSave,
  folders,
  userId,
  onFolderCreated,
  isAdminMode = false,
  initialData = null,
}: AddWordModalProps) {
  const [word, setWord] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [correctedFrom, setCorrectedFrom] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  // Fields
  const [translationUz, setTranslationUz] = useState('')
  const [definition, setDefinition] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('adjective')
  const [pronunciation, setPronunciation] = useState('')
  const [synonymsInput, setSynonymsInput] = useState('')
  const [antonymsInput, setAntonymsInput] = useState('')
  const [exampleSentence1, setExampleSentence1] = useState('')
  const [exampleSentence2, setExampleSentence2] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    folders[0]?.id || ''
  )
  const [error, setError] = useState<string | null>(null)

  // Pre-fill fields if in Edit Mode
  useEffect(() => {
    if (initialData) {
      setWord(initialData.word || '')
      setTranslationUz(initialData.translation_uz || initialData.translation || '')
      setDefinition(initialData.definition || '')
      setPartOfSpeech(initialData.part_of_speech || 'adjective')
      setPronunciation(initialData.pronunciation || '')

      const syns = Array.isArray(initialData.synonyms)
        ? initialData.synonyms.join(', ')
        : initialData.synonyms || ''
      setSynonymsInput(syns)

      const ants = Array.isArray(initialData.antonyms)
        ? initialData.antonyms.join(', ')
        : initialData.antonyms || ''
      setAntonymsInput(ants)

      setExampleSentence1(initialData.example_sentence || '')
      setExampleSentence2(initialData.example_sentence_2 || initialData.context_sentence || '')
      setDifficulty(initialData.difficulty || 'medium')

      const matchingFolder = folders.find(
        (f) => f.id === initialData.folder_id || f.name === initialData.topic
      )
      setSelectedFolderId(matchingFolder?.id || folders[0]?.id || '')
      setCorrectedFrom(null)
      setAiGenerated(false)
    } else {
      setWord('')
      setTranslationUz('')
      setDefinition('')
      setPartOfSpeech('adjective')
      setPronunciation('')
      setSynonymsInput('')
      setAntonymsInput('')
      setExampleSentence1('')
      setExampleSentence2('')
      setDifficulty('medium')
      setSelectedFolderId(folders[0]?.id || '')
      setCorrectedFrom(null)
      setAiGenerated(false)
    }
  }, [initialData, isOpen, folders])

  if (!isOpen) return null

  // Audio pronunciation preview
  const playAudio = () => {
    if (!word.trim()) return
    try {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word.trim())}&type=2`
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(word.trim())
          utterance.lang = 'en-US'
          utterance.rate = 0.9
          window.speechSynthesis.speak(utterance)
        }
      })
    } catch {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(word.trim())
        utterance.lang = 'en-US'
        utterance.rate = 0.9
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // Generate with AI (including typo auto-correction)
  const handleGenerateAI = async () => {
    if (!word.trim()) {
      setError('Please enter an English word first.')
      return
    }

    setIsAiLoading(true)
    setError(null)
    setCorrectedFrom(null)

    try {
      const result: AIVocabularyResult = await lookupWordAI(word.trim())

      // Auto-correction notification
      if (
        result.was_corrected &&
        result.original_word &&
        result.word.toLowerCase() !== result.original_word.toLowerCase()
      ) {
        setWord(result.word)
        setCorrectedFrom(result.original_word)
      } else {
        setWord(result.word)
        setCorrectedFrom(null)
      }

      setTranslationUz(result.translation_uz)
      setDefinition(result.definition)
      setPartOfSpeech(result.part_of_speech || 'adjective')
      setPronunciation(result.pronunciation || '')
      setSynonymsInput(result.synonyms.join(', '))
      setAntonymsInput(result.antonyms.join(', '))
      setExampleSentence1(result.example_sentence_1)
      setExampleSentence2(result.example_sentence_2)
      setDifficulty(result.difficulty || 'medium')
      setAiGenerated(true)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI vocabulary data.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!word.trim()) {
      setError('Word is required.')
      return
    }
    if (!translationUz.trim() && !definition.trim()) {
      setError('Uzbek translation or English definition is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const selectedFolder = folders.find((f) => f.id === selectedFolderId)
      const folderName = selectedFolder?.name || 'General Academic'

      const synonymsArr = synonymsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const antonymsArr = antonymsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await onSave({
        id: initialData?.id,
        word: word.trim(),
        translation_uz: translationUz.trim(),
        definition: definition.trim(),
        part_of_speech: partOfSpeech,
        pronunciation: pronunciation.trim(),
        synonyms: synonymsArr,
        antonyms: antonymsArr,
        example_sentence: exampleSentence1.trim(),
        example_sentence_2: exampleSentence2.trim(),
        difficulty,
        topic: folderName,
        folder_id: selectedFolderId,
      })

      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the word.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = Boolean(initialData)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[94vh] sm:max-h-[90vh]">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 via-card to-card shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary text-black flex items-center justify-center shadow-xs shrink-0">
                <StarsIcon className="w-4.5 h-4.5 text-black" size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                  <span>
                    {isEditing
                      ? isAdminMode
                        ? 'Edit Global Vocabulary Word'
                        : 'Edit Personal Word'
                      : isAdminMode
                      ? 'Add Word to Global Vocabulary'
                      : 'Add Word to Personal Vocabulary'}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-primary/20 text-primary">
                    AI POWERED
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  AI will auto-correct spelling and generate Uzbek meaning, definition, and sentences
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer shrink-0 ml-2"
            >
              <CloseCircleIcon className="w-5 h-5" size={20} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 p-3.5 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold">
                {error}
              </div>
            )}

            {/* 1. Word Input + AI Generate Button */}
            <div className="space-y-2 p-3 sm:p-3.5 rounded-2xl bg-secondary/30 border border-border/80">
              <label className="font-extrabold text-foreground text-xs flex items-center justify-between flex-wrap gap-1">
                <span>English Word *</span>
                {aiGenerated && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircleIcon className="w-3.5 h-3.5" size={14} /> Populated by AI
                  </span>
                )}
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={word}
                    onChange={(e) => {
                      setWord(e.target.value)
                      setError(null)
                    }}
                    placeholder="e.g. resilient, ubiquitous, mitigate..."
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none placeholder:text-muted-foreground/60 placeholder:font-normal"
                  />
                  {word.trim() && (
                    <button
                      type="button"
                      onClick={playAudio}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      title="Listen to pronunciation"
                    >
                      <VolumeLoudIcon className="w-4 h-4 text-primary" size={16} />
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isAiLoading || !word.trim()}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI is analyzing...</span>
                    </>
                  ) : (
                    <>
                      <StarsIcon className="w-4 h-4 text-black" size={16} />
                      <span>Generate with AI</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Auto-correction feedback banner if AI fixed user's typo */}
              {correctedFrom && (
                <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <StarsIcon className="w-4 h-4 text-amber-500 shrink-0" size={16} />
                    <span>
                      AI auto-corrected spelling: <span className="line-through opacity-75">{correctedFrom}</span> &rarr; <strong>{word}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWord(correctedFrom)
                      setCorrectedFrom(null)
                    }}
                    className="text-[11px] underline hover:opacity-80 cursor-pointer font-bold shrink-0"
                  >
                    Keep Original
                  </button>
                </div>
              )}
            </div>

            {/* 2. Folder Selection & New Folder CTA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground">Collection / Folder *</label>
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  <AddCircleIcon className="w-3.5 h-3.5" size={14} />
                  <span>Create New Folder</span>
                </button>
              </div>

              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
              >
                {folders.length === 0 && (
                  <option value="">No custom folders created yet (General Academic)</option>
                )}
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.isSystem ? '(Global)' : '(Personal)'}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Uzbek Translation & English Definition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Uzbek Meaning *</label>
                <textarea
                  rows={2}
                  value={translationUz}
                  onChange={(e) => setTranslationUz(e.target.value)}
                  placeholder="e.g. chidamli, tez tiklanadigan..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">English Definition *</label>
                <textarea
                  rows={2}
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="Able to recover quickly from difficult conditions..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* 4. Part of Speech, Pronunciation, Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Part of Speech</label>
                <select
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  className="w-full px-2.5 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="adjective">Adjective</option>
                  <option value="noun">Noun</option>
                  <option value="verb">Verb</option>
                  <option value="adverb">Adverb</option>
                  <option value="phrase">Phrase / Idiom</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Pronunciation (IPA)</label>
                <input
                  type="text"
                  value={pronunciation}
                  onChange={(e) => setPronunciation(e.target.value)}
                  placeholder="/rɪˈzɪl.jənt/"
                  className="w-full px-2.5 py-2 bg-background border border-border rounded-xl text-foreground text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">IELTS Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-2.5 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="easy">Band 6 (Easy)</option>
                  <option value="medium">Band 7 (Medium)</option>
                  <option value="hard">Band 8-9 (Advanced)</option>
                </select>
              </div>
            </div>

            {/* 5. Synonyms & Antonyms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Synonyms (comma-separated)</label>
                <input
                  type="text"
                  value={synonymsInput}
                  onChange={(e) => setSynonymsInput(e.target.value)}
                  placeholder="hardy, tough, adaptable..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Antonyms (opposites)</label>
                <input
                  type="text"
                  value={antonymsInput}
                  onChange={(e) => setAntonymsInput(e.target.value)}
                  placeholder="fragile, vulnerable, weak..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* 6. Two Example Sentences */}
            <div className="space-y-2 p-3 rounded-2xl bg-secondary/20 border border-border/60">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                2 Authentic IELTS Example Sentences:
              </span>

              <div className="space-y-1">
                <label className="font-semibold text-foreground text-[11px]">Example Sentence 1 *</label>
                <textarea
                  rows={2}
                  value={exampleSentence1}
                  onChange={(e) => setExampleSentence1(e.target.value)}
                  placeholder="e.g. Communities need to be more resilient to natural disasters."
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground text-[11px]">Example Sentence 2 *</label>
                <textarea
                  rows={2}
                  value={exampleSentence2}
                  onChange={(e) => setExampleSentence2(e.target.value)}
                  placeholder="e.g. A resilient economy can withstand global market volatility."
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>
            </div>
          </form>

          {/* Sticky Footer */}
          <div className="p-3 sm:p-4 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-9 px-5 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-black shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <AddCircleIcon className="w-4 h-4 text-black" size={16} />
                  <span>{isEditing ? 'Update Word' : 'Save Word to Vocabulary'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Create Folder */}
      {showCreateFolder && (
        <CreateFolderModal
          isOpen={showCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          isSystem={isAdminMode}
          userId={userId}
          onCreated={(newFolder) => {
            onFolderCreated(newFolder)
            setSelectedFolderId(newFolder.id)
            setShowCreateFolder(false)
          }}
        />
      )}
    </>
  )
}
