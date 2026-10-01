import React, { useState, useEffect, useMemo } from 'react'
import {
  TranslationIcon,
  AddCircleIcon,
  TrashBinMinimalisticIcon,
  RoundedMagnifierIcon,
  VolumeLoudIcon,
  BookBookmarkIcon,
  StarsIcon,
  CheckCircleIcon,
  PenNewSquareIcon,
} from '@solar-icons/react/bold-duotone'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  getVocabFolders,
  deleteVocabFolder,
  VocabFolder,
  FOLDER_COLORS,
} from '@/lib/services/vocabulary-folders'
import { FolderIconRenderer } from '@/components/vocabulary/folder-icon-renderer'
import { CreateFolderModal } from '@/components/vocabulary/create-folder-modal'
import { AddWordModal } from '@/components/vocabulary/add-word-modal'
import { cn } from '@/lib/utils'

interface AdminVocabWord {
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
  status?: string
  created_at?: string
}

export function AdminVocabularyClientView() {
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<AdminVocabWord[]>([])
  const [folders, setFolders] = useState<VocabFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [editingWord, setEditingWord] = useState<AdminVocabWord | null>(null)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<VocabFolder | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // 1. Load published words from database
      const { data: wordsData } = await supabase
        .from('vocabulary_words')
        .select('*')
        .order('word', { ascending: true })

      setWords(wordsData || [])

      // 2. Load system & global folders
      const allFolders = getVocabFolders(null)
      setFolders(allFolders)
    } catch (err) {
      console.error('Error loading admin vocabulary data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Audio pronunciation helper
  const playWordAudio = (wordText: string) => {
    if (!wordText) return
    try {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordText)}&type=2`
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(wordText)
          utterance.lang = 'en-US'
          window.speechSynthesis.speak(utterance)
        }
      })
    } catch {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(wordText)
        utterance.lang = 'en-US'
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // Handle Save Word from Admin Modal (Create or Update)
  const handleSaveWord = async (wordData: any) => {
    const supabase = createClient()
    const payload = {
      word: wordData.word,
      translation: wordData.translation_uz,
      translation_uz: wordData.translation_uz,
      definition: wordData.definition,
      part_of_speech: wordData.part_of_speech,
      pronunciation: wordData.pronunciation,
      example_sentence: wordData.example_sentence,
      context_sentence: wordData.example_sentence_2,
      example_sentence_2: wordData.example_sentence_2,
      synonyms: wordData.synonyms,
      antonyms: wordData.antonyms,
      topic: wordData.topic,
      folder_id: wordData.folder_id,
      difficulty: wordData.difficulty,
      status: 'published',
    }

    if (wordData.id) {
      // Update existing word
      const { data: updated, error } = await supabase
        .from('vocabulary_words')
        .update(payload)
        .eq('id', wordData.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setWords((prev) =>
        prev.map((w) => (w.id === wordData.id ? { ...w, ...(updated || payload) } : w))
      )
      setEditingWord(null)
      setFeedbackMessage(`"${wordData.word}" updated successfully!`)
      setTimeout(() => setFeedbackMessage(null), 4000)
      return
    }

    // Insert new word
    const { data: created, error } = await supabase
      .from('vocabulary_words')
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (created) {
      setWords((prev) => [...prev, created].sort((a, b) => a.word.localeCompare(b.word)))
    }

    setFeedbackMessage(`"${wordData.word}" was successfully added to the global vocabulary repository!`)
    setTimeout(() => setFeedbackMessage(null), 4000)
  }

  // Handle Edit Word
  const handleEditWord = (word: AdminVocabWord) => {
    setEditingWord(word)
    setShowAddWordModal(true)
  }

  // Handle Delete Word
  const handleDeleteWord = async (id: string, wordText: string) => {
    if (!confirm(`Are you sure you want to delete "${wordText}" from the global vocabulary bank?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('vocabulary_words').delete().eq('id', id)
      if (error) throw new Error(error.message)

      setWords((prev) => prev.filter((w) => w.id !== id))
      setFeedbackMessage(`"${wordText}" was deleted.`)
      setTimeout(() => setFeedbackMessage(null), 3000)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // Handle Edit Folder
  const handleEditFolder = (folder: VocabFolder, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingFolder(folder)
    setShowCreateFolderModal(true)
  }

  // Handle Delete Folder
  const handleDeleteFolder = (folderId: string, folderName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm(`Are you sure you want to delete the folder "${folderName}"?`)) return
    deleteVocabFolder(folderId, null)
    setFolders(getVocabFolders(null))
    if (selectedFolderId === folderId) setSelectedFolderId('all')
    setFeedbackMessage(`Folder "${folderName}" was deleted.`)
    setTimeout(() => setFeedbackMessage(null), 3000)
  }

  // Filtered words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // Folder filter
      if (selectedFolderId !== 'all') {
        const folder = folders.find((f) => f.id === selectedFolderId)
        if (folder && w.topic !== folder.name && (w as any).folder_id !== selectedFolderId) {
          return false
        }
      }

      // Search
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
  }, [words, selectedFolderId, searchQuery, folders])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center shadow-xs shrink-0">
            <TranslationIcon className="w-6 h-6 text-black" size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Vocabulary Bank & Folders Control
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage the platform-wide vocabulary repository, IELTS topics, and global category folders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => {
              setEditingFolder(null)
              setShowCreateFolderModal(true)
            }}
            variant="outline"
            className="h-9 px-3.5 text-xs font-bold rounded-xl border-border hover:bg-secondary cursor-pointer flex items-center gap-1.5"
          >
            <AddCircleIcon className="w-4 h-4 text-primary" size={16} />
            <span>+ New Global Folder</span>
          </Button>

          <Button
            onClick={() => {
              setEditingWord(null)
              setShowAddWordModal(true)
            }}
            className="h-9 px-4 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-black shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <StarsIcon className="w-4 h-4 text-black" size={16} />
            <span>+ Add Word (AI)</span>
          </Button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircleIcon className="w-4 h-4 shrink-0" size={16} />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Global Words</p>
            <p className="text-2xl font-black text-foreground mt-1">{words.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Active Folders</p>
            <p className="text-2xl font-black text-primary mt-1">{folders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Band 7-9 Words</p>
            <p className="text-2xl font-black text-amber-500 mt-1">
              {words.filter((w) => w.difficulty === 'hard' || w.difficulty === 'medium').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">With Uzbek Meaning</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {words.filter((w) => Boolean(w.translation || w.translation_uz)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Folders Management Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            GLOBAL CATEGORY FOLDERS:
          </span>
          <span className="text-[11px] text-muted-foreground">
            Students can filter and practice vocabulary across these curated collections
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          <button
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
                  'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0',
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : cn('bg-card hover:bg-secondary/60 text-foreground border-border')
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
                </button>
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
                    onClick={(e) => handleDeleteFolder(folder.id, folder.name, e)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Delete folder"
                  >
                    <TrashBinMinimalisticIcon className="w-3 h-3" size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <RoundedMagnifierIcon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          size={16}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search words, definition, or Uzbek translation..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Words Table */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Global Vocabulary Repository</CardTitle>
              <CardDescription className="text-xs">
                Showing: {filteredWords.length} words
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading vocabulary words...</p>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <BookBookmarkIcon className="w-8 h-8 text-muted-foreground/60 mx-auto" size={32} />
              <p className="text-sm font-bold text-foreground">No vocabulary words found</p>
              <p className="text-xs text-muted-foreground">
                Clear your search query or click "+ Add Word (AI)" above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 border-y border-border text-[11px] font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-4">Word / Pronunciation</th>
                    <th className="py-2.5 px-4">Uzbek Meaning</th>
                    <th className="py-2.5 px-4">Definition</th>
                    <th className="py-2.5 px-4">Folder / Topic</th>
                    <th className="py-2.5 px-4">Difficulty</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredWords.map((word) => (
                    <tr key={word.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => playWordAudio(word.word)}
                            className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Listen"
                          >
                            <VolumeLoudIcon className="w-3.5 h-3.5 text-primary" size={14} />
                          </button>
                          <div>
                            <span className="font-bold text-foreground text-sm block">
                              {word.word}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {word.pronunciation || word.part_of_speech}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-semibold text-foreground">
                          {word.translation || word.translation_uz || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                          {word.definition}
                        </p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary border border-border text-foreground">
                          {word.topic || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                            word.difficulty === 'hard'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : word.difficulty === 'easy'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {word.difficulty || 'medium'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditWord(word)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Edit Word"
                          >
                            <PenNewSquareIcon className="w-4 h-4" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWord(word.id, word.word)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <TrashBinMinimalisticIcon className="w-4 h-4" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Word Modal in Admin Mode */}
      {showAddWordModal && (
        <AddWordModal
          isOpen={showAddWordModal}
          onClose={() => {
            setShowAddWordModal(false)
            setEditingWord(null)
          }}
          initialData={
            editingWord
              ? {
                  id: editingWord.id,
                  word: editingWord.word,
                  translation_uz: editingWord.translation_uz || editingWord.translation || '',
                  definition: editingWord.definition || '',
                  part_of_speech: editingWord.part_of_speech,
                  pronunciation: editingWord.pronunciation,
                  example_sentence: editingWord.example_sentence,
                  example_sentence_2:
                    editingWord.example_sentence_2 || editingWord.context_sentence,
                  synonyms: Array.isArray(editingWord.synonyms)
                    ? editingWord.synonyms.join(', ')
                    : editingWord.synonyms || '',
                  antonyms: Array.isArray(editingWord.antonyms)
                    ? editingWord.antonyms.join(', ')
                    : editingWord.antonyms || '',
                  topic: editingWord.topic,
                  folder_id: editingWord.folder_id,
                  difficulty: editingWord.difficulty,
                }
              : null
          }
          onSave={handleSaveWord}
          folders={folders}
          isAdminMode={true}
          onFolderCreated={(newFolder) => {
            setFolders(getVocabFolders(null))
          }}
        />
      )}

      {/* Create / Edit Folder Modal in System Mode */}
      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => {
            setShowCreateFolderModal(false)
            setEditingFolder(null)
          }}
          isSystem={true}
          initialData={editingFolder}
          onCreated={(newFolder) => {
            setFolders(getVocabFolders(null))
            setSelectedFolderId(newFolder.id)
            setFeedbackMessage(`"${newFolder.name}" global folder created!`)
            setTimeout(() => setFeedbackMessage(null), 3000)
          }}
          onUpdated={(updatedFolder) => {
            setFolders(getVocabFolders(null))
            setFeedbackMessage(`"${updatedFolder.name}" global folder updated!`)
            setTimeout(() => setFeedbackMessage(null), 3000)
            setEditingFolder(null)
          }}
        />
      )}
    </div>
  )
}
