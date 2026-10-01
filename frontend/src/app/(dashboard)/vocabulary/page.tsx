import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import {
  TranslationIcon,
  FireIcon,
  StarsIcon,
  AltArrowRightIcon,
  BookBookmarkIcon,
  MedalRibbonIcon,
  RoundedMagnifierIcon,
  CheckSquareIcon,
  VolumeLoudIcon,
  AddCircleIcon,
  TrashBinMinimalisticIcon,
  PenNewSquareIcon,
  ShieldCheckIcon,
  CrownStarIcon,
} from '@solar-icons/react/bold-duotone'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { Link } from 'react-router-dom'
import { buttonVariants, Button } from '@/components/ui/button'
import {
  getVocabFolders,
  deleteVocabFolder,
  VocabFolder,
  FOLDER_COLORS,
} from '@/lib/services/vocabulary-folders'
import { FolderIconRenderer } from '@/components/vocabulary/folder-icon-renderer'
import { AddWordModal } from '@/components/vocabulary/add-word-modal'
import { CreateFolderModal } from '@/components/vocabulary/create-folder-modal'
import { PremiumUpgradeModal } from '@/components/vocabulary/premium-upgrade-modal'
import { cn } from '@/lib/utils'

interface VocabWord {
  id: string
  word: string
  definition: string
  translation?: string
  translation_uz?: string
  example_sentence?: string
  example_sentence_2?: string
  context_sentence?: string
  synonyms?: string[] | string
  antonyms?: string[] | string
  pronunciation?: string
  part_of_speech?: string
  topic: string
  folder_id?: string
  difficulty?: string
  is_premium?: boolean
  status?: string
}

export default function VocabularyHub() {
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<VocabWord[]>([])
  const [userVocabMap, setUserVocabMap] = useState<
    Map<string, { status: string; mastery_level: number }>
  >(new Map())
  const [dueToday, setDueToday] = useState<number>(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Folders & Filters
  const [folders, setFolders] = useState<VocabFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Modals
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<VocabFolder | null>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumModalTitle, setPremiumModalTitle] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  // Load all authentic data from PostgreSQL and local storage
  const loadData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let userIsAdmin = false
      let userIsPrem = false

      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        userIsAdmin = profile?.role === 'admin'
        setIsAdmin(userIsAdmin)

        if (userIsAdmin) {
          userIsPrem = true
          setIsPremium(true)
        } else {
          // Check subscription status
          try {
            const token = localStorage.getItem('foxford_token')
            if (token) {
              const res = await fetch('/api/subscriptions/me', {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (res.ok) {
                const sData = await res.json()
                userIsPrem = Boolean(sData?.is_premium)
                setIsPremium(userIsPrem)
              }
            }
          } catch {
            // fallback
          }
        }

        // Fetch user's vocabulary progress
        const { data: userVocab } = await supabase
          .from('user_vocabulary')
          .select('word_id, status, mastery_level')
          .eq('user_id', user.id)

        const map = new Map<string, { status: string; mastery_level: number }>()
        if (userVocab) {
          userVocab.forEach((uv: any) => {
            map.set(uv.word_id, {
              status: uv.status,
              mastery_level: uv.mastery_level || 0,
            })
          })
        }
        setUserVocabMap(map)

        // Count words due today
        const { count: due } = await supabase
          .from('user_vocabulary')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('next_review_at', new Date().toISOString())

        setDueToday(due || 0)
      }

      // Load folders (system + user personal)
      const userFolders = getVocabFolders(user?.id || null)
      setFolders(userFolders)

      // Fetch all published vocabulary words
      const { data: wordsData } = await supabase
        .from('vocabulary_words')
        .select('*')
        .order('word', { ascending: true })

      setWords(wordsData || [])
    } catch (err) {
      console.error('Error loading vocabulary data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Audio pronunciation
  const speakWord = (wordText: string) => {
    if (!wordText) return
    try {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordText)}&type=2`
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(wordText)
          utterance.lang = 'en-GB'
          utterance.rate = 0.9
          window.speechSynthesis.speak(utterance)
        }
      })
    } catch {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(wordText)
        utterance.lang = 'en-GB'
        utterance.rate = 0.9
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // Add word to user's SRS review deck
  const handleAddToDeck = async (wordId: string) => {
    if (!currentUserId) return
    setActionLoadingId(wordId)
    try {
      const supabase = createClient()
      await supabase.from('user_vocabulary').insert({
        user_id: currentUserId,
        word_id: wordId,
        status: 'learning',
        mastery_level: 1,
        next_review_at: new Date().toISOString(),
        review_count: 1,
      })

      setUserVocabMap((prev) => {
        const next = new Map(prev)
        next.set(wordId, { status: 'learning', mastery_level: 1 })
        return next
      })
      setDueToday((d) => d + 1)
      setFeedbackMessage('Word added to your active Spaced Repetition (SRS) review deck!')
      setTimeout(() => setFeedbackMessage(null), 3000)
    } catch (err) {
      console.error('Failed to add word to deck:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Premium user: Add or Edit word (with AI result & chosen folder)
  const handleSaveWord = async (wordData: {
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
  }) => {
    const supabase = createClient()

    if (wordData.id) {
      // Update existing word
      const { data: updated, error } = await supabase
        .from('vocabulary_words')
        .update({
          word: wordData.word,
          translation: wordData.translation_uz,
          translation_uz: wordData.translation_uz,
          definition: wordData.definition,
          part_of_speech: wordData.part_of_speech,
          pronunciation: wordData.pronunciation || null,
          example_sentence: wordData.example_sentence || null,
          context_sentence: wordData.example_sentence_2 || null,
          example_sentence_2: wordData.example_sentence_2 || null,
          synonyms: wordData.synonyms,
          antonyms: wordData.antonyms,
          topic: wordData.topic || 'General Academic',
          folder_id: wordData.folder_id,
          difficulty: wordData.difficulty || 'medium',
        })
        .eq('id', wordData.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setWords((prev) =>
        prev.map((w) =>
          w.id === wordData.id
            ? {
                ...w,
                ...wordData,
                translation: wordData.translation_uz,
                context_sentence: wordData.example_sentence_2,
              }
            : w
        )
      )

      setFeedbackMessage(`"${wordData.word}" updated successfully!`)
      setTimeout(() => setFeedbackMessage(null), 3000)
      setEditingWord(null)
      return
    }

    const { data: created, error } = await supabase
      .from('vocabulary_words')
      .insert({
        word: wordData.word,
        translation: wordData.translation_uz,
        translation_uz: wordData.translation_uz,
        definition: wordData.definition,
        part_of_speech: wordData.part_of_speech,
        pronunciation: wordData.pronunciation || null,
        example_sentence: wordData.example_sentence || null,
        context_sentence: wordData.example_sentence_2 || null,
        example_sentence_2: wordData.example_sentence_2 || null,
        synonyms: wordData.synonyms,
        antonyms: wordData.antonyms,
        topic: wordData.topic || 'General Academic',
        folder_id: wordData.folder_id,
        difficulty: wordData.difficulty || 'medium',
        status: 'published',
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (created) {
      setWords((prev) => [...prev, created].sort((a, b) => a.word.localeCompare(b.word)))

      // Automatically add to user active SRS deck
      if (currentUserId) {
        try {
          await supabase.from('user_vocabulary').insert({
            user_id: currentUserId,
            word_id: created.id,
            status: 'learning',
            mastery_level: 1,
            next_review_at: new Date().toISOString(),
            review_count: 1,
          })
          setUserVocabMap((prev) => {
            const next = new Map(prev)
            next.set(created.id, { status: 'learning', mastery_level: 1 })
            return next
          })
          setDueToday((d) => d + 1)
        } catch {
          // ignore
        }
      }
    }

    setFeedbackMessage(`"${wordData.word}" added to your personal vocabulary and active review deck!`)
    setTimeout(() => setFeedbackMessage(null), 4000)
    setEditingWord(null)
  }

  // Handle Edit Word Click
  const handleEditWord = (word: VocabWord) => {
    if (!isPremium && !isAdmin) {
      setPremiumModalTitle('Edit Vocabulary Word')
      setShowPremiumModal(true)
      return
    }
    setEditingWord(word)
    setShowAddWordModal(true)
  }

  // Handle Delete Word Click
  const handleDeleteWord = async (word: VocabWord) => {
    if (!isPremium && !isAdmin) {
      setPremiumModalTitle('Delete Vocabulary Word')
      setShowPremiumModal(true)
      return
    }
    if (!confirm(`Are you sure you want to delete "${word.word}" from your vocabulary?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('vocabulary_words').delete().eq('id', word.id)
      if (error) throw new Error(error.message)

      if (currentUserId) {
        await supabase
          .from('user_vocabulary')
          .delete()
          .eq('word_id', word.id)
          .eq('user_id', currentUserId)
      }

      setWords((prev) => prev.filter((w) => w.id !== word.id))
      setFeedbackMessage(`"${word.word}" was deleted.`)
      setTimeout(() => setFeedbackMessage(null), 3000)
    } catch (err: any) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Handle "+ Add Word" button click (Free vs Premium logic)
  const handleAddWordClick = () => {
    if (!isPremium && !isAdmin) {
      setPremiumModalTitle('Custom Words & AI Generator')
      setShowPremiumModal(true)
      return
    }
    setEditingWord(null)
    setShowAddWordModal(true)
  }

  // Handle "+ New Folder" click (Free vs Premium logic)
  const handleCreateFolderClick = () => {
    if (!isPremium && !isAdmin) {
      setPremiumModalTitle('Custom Folder Collections')
      setShowPremiumModal(true)
      return
    }
    setEditingFolder(null)
    setShowCreateFolderModal(true)
  }

  // Handle Edit Folder (Free vs Premium logic)
  const handleEditFolder = (folder: VocabFolder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPremium && !isAdmin) {
      setPremiumModalTitle('Edit Collection Folder')
      setShowPremiumModal(true)
      return
    }
    setEditingFolder(folder)
    setShowCreateFolderModal(true)
  }

  // Handle Delete Folder (Free vs Premium logic)
  const handleDeleteFolder = (folder: VocabFolder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPremium && !isAdmin) {
      setPremiumModalTitle('Delete Collection Folder')
      setShowPremiumModal(true)
      return
    }
    if (!confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      return
    }
    deleteVocabFolder(folder.id, currentUserId)
    const updated = getVocabFolders(currentUserId)
    setFolders(updated)
    if (selectedFolderId === folder.id) {
      setSelectedFolderId('all')
    }
    setFeedbackMessage(`Folder "${folder.name}" was deleted.`)
    setTimeout(() => setFeedbackMessage(null), 3000)
  }

  // Filtered words list
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // Folder filter
      if (selectedFolderId !== 'all') {
        const folder = folders.find((f) => f.id === selectedFolderId)
        if (folder && w.topic !== folder.name && (w as any).folder_id !== selectedFolderId) {
          return false
        }
      }

      // Difficulty
      if (selectedDifficulty !== 'all' && w.difficulty !== selectedDifficulty) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchWord = w.word.toLowerCase().includes(q)
        const matchDef = (w.definition || '').toLowerCase().includes(q)
        const matchUz = (w.translation || w.translation_uz || '').toLowerCase().includes(q)
        const matchTopic = (w.topic || '').toLowerCase().includes(q)
        if (!matchWord && !matchDef && !matchUz && !matchTopic) return false
      }

      return true
    })
  }, [words, selectedFolderId, selectedDifficulty, searchQuery, folders])

  // Real stats
  const totalCount = words.length
  let learningCount = 0
  let masteredCount = 0
  userVocabMap.forEach((v) => {
    if (v.status === 'mastered') masteredCount++
    else if (v.status === 'learning' || v.status === 'review') learningCount++
  })
  const newWordsReady = Math.max(0, totalCount - learningCount - masteredCount)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
            <TranslationIcon className="h-5 w-5" size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Vocabulary Bank
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                {totalCount} Words
              </span>
              {isPremium && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  <CrownStarIcon className="w-3 h-3 text-primary" size={12} /> PRO Vocab
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Authentic IELTS vocabulary managed dynamically via Spaced Repetition (SRS).
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Admin shortcut button to Admin Panel vocabulary per requirement */}
          {isAdmin && (
            <Link
              to="/admin/vocabulary"
              className="h-8 sm:h-9 px-3 text-xs font-bold rounded-xl bg-foreground text-background flex items-center gap-1.5 shadow-xs transition-all hover:opacity-90"
              title="Manage vocabulary and global folders in Admin Panel"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 text-primary" size={14} />
              <span>Admin: Global Vocabulary</span>
            </Link>
          )}

          {/* Add Word Button (Available for Premium, prompts upgrade for Free students) */}
          <Button
            onClick={handleAddWordClick}
            className="h-8 sm:h-9 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <StarsIcon className="w-4 h-4 text-black" size={16} />
            <span>Add Word (AI)</span>
            {!isPremium && !isAdmin && (
              <span className="ml-1 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-black/15 text-black">
                PRO
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-primary">
            <FireIcon className="w-4 h-4 text-primary" size={16} />
            <span>Deck: {learningCount + masteredCount} words</span>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckSquareIcon className="w-4 h-4 shrink-0" size={16} />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Main Review Session CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-card border border-primary/25 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
        <div className="z-10 flex-1 text-center sm:text-left w-full">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
            <StarsIcon className="w-3.5 h-3.5 text-primary" size={14} />
            <span>Spaced Repetition System</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1.5">
            Ready for your review session?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-xl">
            You have <strong className="text-foreground">{dueToday}</strong> words due for review today, and{' '}
            <strong className="text-foreground">{newWordsReady}</strong> new IELTS academic words ready in the repository.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <Link
              to="/vocabulary/review"
              className={buttonVariants({
                size: 'default',
                className:
                  'w-full sm:w-auto h-9 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-black shadow-xs transition-all flex items-center justify-center gap-2 text-xs',
              })}
            >
              <span>Start Flashcard Review</span>
              <AltArrowRightIcon className="w-3.5 h-3.5" size={14} />
            </Link>
          </div>
        </div>

        <div className="z-10 shrink-0 hidden sm:block">
          <FoxMascot variant="thinking" size="md" className="drop-shadow-sm" />
        </div>
      </div>

      {/* Stats Quick Cards with Solar Icons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Words</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{totalCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
            <TranslationIcon className="w-4 h-4" size={18} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Due for Review</p>
            <p className="text-xl font-bold text-primary mt-0.5">{dueToday}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
            <FireIcon className="w-4 h-4" size={18} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Currently Learning</p>
            <p className="text-xl font-bold text-primary mt-0.5">{learningCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
            <BookBookmarkIcon className="w-4 h-4" size={18} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Mastered</p>
            <p className="text-xl font-bold text-primary mt-0.5">{masteredCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center justify-center shrink-0">
            <MedalRibbonIcon className="w-4 h-4" size={18} />
          </div>
        </div>
      </div>

      {/* Folders & Collections Bar (User requirement: mos folder va mos icon tanlash) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Collections & Folders:
            </span>
          </div>

          <button
            type="button"
            onClick={handleCreateFolderClick}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <AddCircleIcon className="w-3.5 h-3.5" size={15} />
            <span>+ New Folder</span>
            {!isPremium && !isAdmin && (
              <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-primary/20 text-primary">
                PRO
              </span>
            )}
          </button>
        </div>

        {/* Horizontal scrollable folder pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSelectedFolderId('all')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5',
              selectedFolderId === 'all'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
            )}
          >
            <span>All Words ({words.length})</span>
          </button>

          {folders.map((folder) => {
            const count = words.filter(
              (w) => w.topic === folder.name || (w as any).folder_id === folder.id
            ).length
            const isSelected = selectedFolderId === folder.id
            const colorCfg =
              FOLDER_COLORS.find((c) => c.id === folder.color) || FOLDER_COLORS[0]

            return (
              <div
                key={folder.id}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0',
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'bg-card hover:bg-secondary/60 text-foreground border-border'
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderIconRenderer iconName={folder.iconName} size={15} className="w-4 h-4" />
                  <span>{folder.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-secondary border border-border">
                    {count}
                  </span>
                  {!folder.isSystem && (
                    <span className="text-[9px] font-bold text-primary uppercase">My</span>
                  )}
                </button>

                {(!folder.isSystem || isAdmin) && (
                  <div className="flex items-center gap-0.5 ml-0.5 border-l border-border/60 pl-1">
                    <button
                      type="button"
                      onClick={(e) => handleEditFolder(folder, e)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      title="Edit folder"
                    >
                      <PenNewSquareIcon className="w-3 h-3" size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFolder(folder, e)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete folder"
                    >
                      <TrashBinMinimalisticIcon className="w-3 h-3" size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative w-full sm:w-80 shrink-0">
          <RoundedMagnifierIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
            size={15}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search word, Uzbek meaning, definition..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {['all', 'easy', 'medium', 'hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap',
                selectedDifficulty === diff
                  ? 'bg-primary text-black font-bold shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {diff === 'all'
                ? 'All Levels'
                : diff === 'easy'
                ? 'Band 6'
                : diff === 'medium'
                ? 'Band 7'
                : 'Band 8-9'}
            </button>
          ))}
        </div>
      </div>

      {/* Real Vocabulary Words Grid */}
      {filteredWords.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
          <BookBookmarkIcon className="w-8 h-8 text-primary/60 mx-auto" size={32} />
          <p className="text-sm font-semibold text-foreground">
            No vocabulary words found matching your filter
          </p>
          <p className="text-xs text-muted-foreground">
            Try selecting a different folder or clearing your search query.
          </p>
          <Button
            onClick={handleAddWordClick}
            className="h-8 text-xs font-bold rounded-xl bg-primary text-black cursor-pointer"
          >
            <StarsIcon className="w-3.5 h-3.5 mr-1" size={14} /> Add Word with AI
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredWords.map((word) => {
            const userProgress = userVocabMap.get(word.id)
            const isLearning =
              userProgress?.status === 'learning' || userProgress?.status === 'review'
            const isMastered = userProgress?.status === 'mastered'

            // Parse synonyms and antonyms if stored as array or string
            const synonymsList = Array.isArray(word.synonyms)
              ? word.synonyms
              : typeof word.synonyms === 'string'
              ? (word.synonyms as string).split(',').filter(Boolean)
              : []

            const antonymsList = Array.isArray(word.antonyms)
              ? word.antonyms
              : typeof word.antonyms === 'string'
              ? (word.antonyms as string).split(',').filter(Boolean)
              : []

            return (
              <div
                key={word.id}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  {/* Top Line: Word, Part of Speech, Audio, Folder/Topic */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors capitalize">
                        {word.word}
                      </h3>
                      {word.part_of_speech && (
                        <span className="text-[10px] font-bold italic text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {word.part_of_speech}
                        </span>
                      )}
                      <button
                        onClick={() => speakWord(word.word)}
                        title="Listen to pronunciation"
                        className="p-1 rounded-lg hover:bg-secondary text-primary transition-colors cursor-pointer"
                      >
                        <VolumeLoudIcon className="w-3.5 h-3.5 text-primary" size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {word.topic && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border truncate max-w-[120px]">
                          {word.topic}
                        </span>
                      )}
                      {/* Action buttons: Edit and Delete */}
                      <button
                        type="button"
                        onClick={() => handleEditWord(word)}
                        title="Edit word"
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <PenNewSquareIcon className="w-3.5 h-3.5" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWord(word)}
                        title="Delete word"
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <TrashBinMinimalisticIcon className="w-3.5 h-3.5" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Pronunciation IPA */}
                  {word.pronunciation && (
                    <p className="text-[11px] font-mono text-muted-foreground -mt-1">
                      {word.pronunciation}
                    </p>
                  )}

                  {/* Uzbek Meaning Highlight (User requirement: o'zbekcha ma'nosi) */}
                  {(word.translation || word.translation_uz) && (
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-primary block">
                        Uzbek Meaning:
                      </span>
                      <p className="text-xs font-bold text-foreground">
                        {word.translation || word.translation_uz}
                      </p>
                    </div>
                  )}

                  {/* English Definition */}
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {word.definition}
                  </p>

                  {/* Synonyms & Antonyms (User requirement) */}
                  {(synonymsList.length > 0 || antonymsList.length > 0) && (
                    <div className="space-y-1 pt-1 border-t border-border/50 text-[10px]">
                      {synonymsList.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">
                            Synonyms:
                          </span>
                          {synonymsList.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-secondary text-foreground font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {antonymsList.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">
                            Antonyms:
                          </span>
                          {antonymsList.slice(0, 3).map((a, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Example Sentences (User requirement: 2 ta gap) */}
                  {(word.example_sentence || word.example_sentence_2 || word.context_sentence) && (
                    <div className="space-y-1.5 pt-1">
                      {word.example_sentence && (
                        <div className="p-2 rounded-xl bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground italic leading-relaxed">
                          1. &ldquo;{word.example_sentence}&rdquo;
                        </div>
                      )}
                      {(word.example_sentence_2 || word.context_sentence) && (
                        <div className="p-2 rounded-xl bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground italic leading-relaxed">
                          2. &ldquo;{word.example_sentence_2 || word.context_sentence}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Status & Add to Deck */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <div>
                    {isMastered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                        <CheckSquareIcon className="w-3.5 h-3.5 text-primary" size={14} /> Mastered
                      </span>
                    ) : isLearning ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                        <FireIcon className="w-3.5 h-3.5 text-primary" size={14} /> Stage{' '}
                        {userProgress?.mastery_level || 1}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Not in deck yet</span>
                    )}
                  </div>

                  <div>
                    {!userProgress && currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddToDeck(word.id)}
                        disabled={actionLoadingId === word.id}
                        className="h-7 px-2.5 text-xs font-semibold rounded-lg text-primary hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                      >
                        {actionLoadingId === word.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <AddCircleIcon className="w-3.5 h-3.5 mr-1 text-primary" size={14} />
                            <span>Add to Deck</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Word Modal with AI Generator (Accessible for Premium and Admin) */}
      {showAddWordModal && (
        <AddWordModal
          isOpen={showAddWordModal}
          onClose={() => {
            setShowAddWordModal(false)
            setEditingWord(null)
          }}
          onSave={handleSaveWord}
          folders={folders}
          userId={currentUserId}
          isAdminMode={false}
          initialData={editingWord}
          onFolderCreated={(newFolder) => {
            setFolders(getVocabFolders(currentUserId))
          }}
        />
      )}

      {/* Create / Edit Folder Modal */}
      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => {
            setShowCreateFolderModal(false)
            setEditingFolder(null)
          }}
          isSystem={editingFolder ? Boolean(editingFolder.isSystem) : false}
          userId={currentUserId}
          initialData={editingFolder}
          onCreated={(newFolder) => {
            const updated = getVocabFolders(currentUserId)
            setFolders(updated)
            setSelectedFolderId(newFolder.id)
            setFeedbackMessage(`"${newFolder.name}" folder created successfully!`)
            setTimeout(() => setFeedbackMessage(null), 3000)
          }}
          onUpdated={(updatedFolder) => {
            const updated = getVocabFolders(currentUserId)
            setFolders(updated)
            setFeedbackMessage(`"${updatedFolder.name}" folder updated successfully!`)
            setTimeout(() => setFeedbackMessage(null), 3000)
            setEditingFolder(null)
          }}
        />
      )}

      {/* Premium Upgrade Modal for Free Students */}
      {showPremiumModal && (
        <PremiumUpgradeModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          featureTitle={premiumModalTitle}
        />
      )}
    </div>
  )
}
