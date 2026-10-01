import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2,
} from 'lucide-react'
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
  CloseCircleIcon,
} from '@solar-icons/react/bold-duotone'
import { FoxMascot } from '@/components/mascot/fox-mascot'
import { Link } from 'react-router-dom'
import { buttonVariants, Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface VocabWord {
  id: string
  word: string
  definition: string
  example_sentence?: string
  pronunciation?: string
  part_of_speech?: string
  topic: string
  difficulty?: string
  is_premium?: boolean
  status?: string
}

export default function VocabularyHub() {
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<VocabWord[]>([])
  const [userVocabMap, setUserVocabMap] = useState<Map<string, { status: string; mastery_level: number }>>(new Map())
  const [dueToday, setDueToday] = useState<number>(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Admin Add Word Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [newWordData, setNewWordData] = useState({
    word: '',
    part_of_speech: 'noun',
    pronunciation: '',
    definition: '',
    example_sentence: '',
    topic: 'Academic',
    difficulty: 'medium',
  })

  // Load all authentic data from PostgreSQL
  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
        setIsAdmin(profile?.role === 'admin')

        // Fetch user's vocabulary progress
        const { data: userVocab } = await supabase
          .from('user_vocabulary')
          .select('word_id, status, mastery_level')
          .eq('user_id', user.id)

        const map = new Map<string, { status: string; mastery_level: number }>()
        if (userVocab) {
          userVocab.forEach((uv: any) => {
            map.set(uv.word_id, { status: uv.status, mastery_level: uv.mastery_level || 0 })
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

      // Fetch all published vocabulary words
      const { data: wordsData } = await supabase
        .from('vocabulary_words')
        .select('*')
        .eq('status', 'published')
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

  // Audio pronunciation using Web Speech API
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-GB'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
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

      setUserVocabMap(prev => {
        const next = new Map(prev)
        next.set(wordId, { status: 'learning', mastery_level: 1 })
        return next
      })
      setDueToday(d => d + 1)
    } catch (err) {
      console.error('Failed to add word to deck:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Admin: Create new word
  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWordData.word.trim() || !newWordData.definition.trim()) {
      alert('Word and definition are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: created, error } = await supabase
        .from('vocabulary_words')
        .insert({
          word: newWordData.word.trim(),
          part_of_speech: newWordData.part_of_speech,
          pronunciation: newWordData.pronunciation.trim() || null,
          definition: newWordData.definition.trim(),
          example_sentence: newWordData.example_sentence.trim() || null,
          topic: newWordData.topic.trim() || 'Academic',
          difficulty: newWordData.difficulty,
          status: 'published',
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      if (created) {
        setWords(prev => [...prev, created].sort((a, b) => a.word.localeCompare(b.word)))
      }

      setShowAddModal(false)
      setNewWordData({
        word: '',
        part_of_speech: 'noun',
        pronunciation: '',
        definition: '',
        example_sentence: '',
        topic: 'Academic',
        difficulty: 'medium',
      })
    } catch (err: any) {
      alert(`Error saving word: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Admin: Delete word
  const handleDeleteWord = async (wordId: string, wordText: string) => {
    if (!confirm(`Are you sure you want to delete "${wordText}" from the vocabulary bank?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('vocabulary_words').delete().eq('id', wordId)
      if (error) throw new Error(error.message)

      setWords(prev => prev.filter(w => w.id !== wordId))
      setUserVocabMap(prev => {
        const next = new Map(prev)
        next.delete(wordId)
        return next
      })
    } catch (err: any) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Dynamic real topics derived from database
  const topicsList = useMemo(() => {
    const counts: Record<string, number> = {}
    words.forEach(w => {
      const t = w.topic || 'General'
      counts[t] = (counts[t] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [words])

  // Filtered words list
  const filteredWords = useMemo(() => {
    return words.filter(w => {
      if (selectedTopic !== 'all' && (w.topic || 'General') !== selectedTopic) {
        return false
      }
      if (selectedDifficulty !== 'all' && w.difficulty !== selectedDifficulty) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchWord = w.word.toLowerCase().includes(q)
        const matchDef = w.definition.toLowerCase().includes(q)
        const matchTopic = (w.topic || '').toLowerCase().includes(q)
        if (!matchWord && !matchDef && !matchTopic) return false
      }
      return true
    })
  }, [words, selectedTopic, selectedDifficulty, searchQuery])

  // Real stats
  const totalCount = words.length
  let learningCount = 0
  let masteredCount = 0
  userVocabMap.forEach(v => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-foreground shadow-xs">
            <TranslationIcon className="h-5 w-5" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Vocabulary Bank</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                {totalCount} Words
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Authentic IELTS vocabulary managed dynamically via Spaced Repetition (SRS).</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-3 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-black flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <AddCircleIcon className="w-3.5 h-3.5" size={14} />
              <span>Add Word</span>
            </Button>
          )}

          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-primary">
            <FireIcon className="w-4 h-4 text-primary" size={16} />
            <span>Active Deck: {learningCount + masteredCount} words</span>
          </div>
        </div>
      </div>

      {/* Main Review Session CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-card border border-primary/25 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="z-10 flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
            <StarsIcon className="w-3.5 h-3.5 text-primary" size={14} />
            <span>Spaced Repetition System</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1.5">Ready for your review session?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-xl">
            You have <strong className="text-foreground">{dueToday}</strong> words due for review today, and <strong className="text-foreground">{newWordsReady}</strong> new IELTS academic words ready in the repository.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <Link
              to="/vocabulary/review"
              className={buttonVariants({ size: "default", className: "h-9 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-black shadow-xs transition-all flex items-center gap-2 text-xs" })}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* Search & Topic Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Topic tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedTopic === 'all'
                ? 'bg-primary text-black font-bold shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
          >
            All Topics ({totalCount})
          </button>
          {topicsList.map(t => (
            <button
              key={t.name}
              onClick={() => setSelectedTopic(t.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedTopic === t.name
                  ? 'bg-primary text-black font-bold shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
            >
              {t.name} ({t.count})
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <RoundedMagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, definitions..."
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Real Vocabulary Words Grid */}
      {filteredWords.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
          <BookBookmarkIcon className="w-8 h-8 text-primary/60 mx-auto" size={32} />
          <p className="text-sm font-semibold text-foreground">No vocabulary words found matching your filter</p>
          <p className="text-xs text-muted-foreground">Try clearing your search query or selecting a different topic.</p>
          {isAdmin && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="h-8 text-xs font-semibold rounded-xl bg-primary text-black"
            >
              <AddCircleIcon className="w-3.5 h-3.5 mr-1" size={14} /> Add First Word
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredWords.map(word => {
            const userProgress = userVocabMap.get(word.id)
            const isLearning = userProgress?.status === 'learning' || userProgress?.status === 'review'
            const isMastered = userProgress?.status === 'mastered'

            return (
              <div
                key={word.id}
                className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  {/* Top line: Word, Part of Speech, Audio */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {word.word}
                      </h3>
                      {word.part_of_speech && (
                        <span className="text-[10px] font-semibold italic text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {word.part_of_speech}
                        </span>
                      )}
                      <button
                        onClick={() => speakWord(word.word)}
                        title="Listen to pronunciation"
                        className="p-1 rounded-lg hover:bg-secondary text-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        <VolumeLoudIcon className="w-3.5 h-3.5 text-primary" size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {word.topic && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                          {word.topic}
                        </span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteWord(word.id, word.word)}
                          title="Delete word (Admin)"
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <TrashBinMinimalisticIcon className="w-3.5 h-3.5" size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pronunciation IPA */}
                  {word.pronunciation && (
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {word.pronunciation}
                    </p>
                  )}

                  {/* Definition */}
                  <p className="text-xs text-foreground/90 mt-2 leading-relaxed">
                    {word.definition}
                  </p>

                  {/* Example Sentence */}
                  {word.example_sentence && (
                    <div className="mt-2.5 p-2 rounded-lg bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground italic">
                      "{word.example_sentence}"
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
                        <FireIcon className="w-3.5 h-3.5 text-primary" size={14} /> Stage {userProgress?.mastery_level || 1}
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

      {/* Admin Add Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center justify-center">
                  <AddCircleIcon className="w-4 h-4" size={16} />
                </div>
                <h3 className="font-bold text-sm text-foreground">Add New IELTS Vocabulary Word</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                <CloseCircleIcon className="w-4 h-4" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWord} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Word *</label>
                  <input
                    type="text"
                    required
                    value={newWordData.word}
                    onChange={(e) => setNewWordData({ ...newWordData, word: e.target.value })}
                    placeholder="e.g. Pragmatic"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Part of Speech</label>
                  <select
                    value={newWordData.part_of_speech}
                    onChange={(e) => setNewWordData({ ...newWordData, part_of_speech: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Pronunciation (IPA)</label>
                  <input
                    type="text"
                    value={newWordData.pronunciation}
                    onChange={(e) => setNewWordData({ ...newWordData, pronunciation: e.target.value })}
                    placeholder="e.g. /ˈpræɡ.mæt.ɪk/"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Topic / Theme</label>
                  <input
                    type="text"
                    value={newWordData.topic}
                    onChange={(e) => setNewWordData({ ...newWordData, topic: e.target.value })}
                    placeholder="e.g. Environment, Society"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Definition *</label>
                <textarea
                  required
                  rows={2}
                  value={newWordData.definition}
                  onChange={(e) => setNewWordData({ ...newWordData, definition: e.target.value })}
                  placeholder="Clear and concise definition suitable for IELTS students..."
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Example Sentence</label>
                <textarea
                  rows={2}
                  value={newWordData.example_sentence}
                  onChange={(e) => setNewWordData({ ...newWordData, example_sentence: e.target.value })}
                  placeholder="Authentic academic context sentence..."
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Difficulty</label>
                  <select
                    value={newWordData.difficulty}
                    onChange={(e) => setNewWordData({ ...newWordData, difficulty: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="easy">Easy (Band 6)</option>
                    <option value="medium">Medium (Band 7)</option>
                    <option value="hard">Hard (Band 8-9)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-8 text-xs font-semibold rounded-xl bg-primary text-black"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    'Save Word to Bank'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
