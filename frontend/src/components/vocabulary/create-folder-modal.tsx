import React, { useState, useEffect } from 'react'
import {
  CloseCircleIcon,
  AddCircleIcon,
  CheckCircleIcon,
  PenNewSquareIcon,
} from '@solar-icons/react/bold-duotone'
import { Button } from '@/components/ui/button'
import {
  FOLDER_ICONS,
  FOLDER_COLORS,
  createVocabFolder,
  updateVocabFolder,
  VocabFolder,
} from '@/lib/services/vocabulary-folders'
import { FolderIconRenderer } from './folder-icon-renderer'
import { cn } from '@/lib/utils'

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (folder: VocabFolder) => void
  onUpdated?: (folder: VocabFolder) => void
  initialData?: VocabFolder | null
  isSystem?: boolean
  userId?: string | null
}

export function CreateFolderModal({
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  initialData = null,
  isSystem = false,
  userId = null,
}: CreateFolderModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string>('book')
  const [selectedColor, setSelectedColor] = useState<VocabFolder['color']>('amber')
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(initialData)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setSelectedIcon(initialData.iconName || 'book')
      setSelectedColor(initialData.color || 'amber')
      setError(null)
    } else {
      setName('')
      setDescription('')
      setSelectedIcon('book')
      setSelectedColor('amber')
      setError(null)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const currentColorConfig =
    FOLDER_COLORS.find((c) => c.id === selectedColor) || FOLDER_COLORS[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a folder name.')
      return
    }

    try {
      if (isEditing && initialData) {
        const updated = updateVocabFolder(
          initialData.id,
          {
            name: name.trim(),
            description: description.trim(),
            iconName: selectedIcon,
            color: selectedColor,
          },
          userId
        )
        if (updated && onUpdated) {
          onUpdated(updated)
        }
        onClose()
        return
      }

      const folder = createVocabFolder(
        {
          name: name.trim(),
          description: description.trim(),
          iconName: selectedIcon,
          color: selectedColor,
          isSystem,
        },
        userId
      )
      onCreated(folder)
      setName('')
      setDescription('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the folder.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border flex items-center justify-between bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-black shadow-xs flex items-center justify-center shrink-0">
              {isEditing ? (
                <PenNewSquareIcon className="w-4.5 h-4.5 text-black" size={18} />
              ) : (
                <AddCircleIcon className="w-4.5 h-4.5 text-black" size={18} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {isEditing
                  ? isSystem
                    ? 'Edit Global Folder'
                    : 'Edit Collection Folder'
                  : isSystem
                  ? 'Create Global Folder'
                  : 'Create New Collection Folder'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isEditing
                  ? 'Update folder name, icon, and color theme'
                  : isSystem
                  ? 'System-wide category accessible to all students'
                  : 'Organize your personal vocabulary into custom collections'}
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
        <form onSubmit={handleSubmit} className="flex-1 p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto custom-scrollbar text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Folder Name */}
          <div className="space-y-1">
            <label className="font-bold text-foreground">Folder Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Writing Task 2 Band 8, Speaking Idioms..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or purpose..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <label className="font-bold text-foreground block">Choose an Icon:</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {FOLDER_ICONS.map((item) => {
                const isSelected = selectedIcon === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    title={item.label}
                    className={cn(
                      'p-2 rounded-xl flex items-center justify-center border transition-all cursor-pointer aspect-square',
                      isSelected
                        ? 'border-primary bg-primary/15 text-primary scale-105 shadow-xs'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <FolderIconRenderer iconName={item.id} size={20} className="w-5 h-5" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <label className="font-bold text-foreground block">Choose Color Style:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FOLDER_COLORS.map((col) => {
                const isSelected = selectedColor === col.id
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColor(col.id as any)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer',
                      col.bg,
                      col.text,
                      isSelected ? 'ring-2 ring-primary border-primary scale-102' : col.border
                    )}
                  >
                    <span>{col.name.split('/')[0]}</span>
                    {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 ml-1 shrink-0" size={14} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-2 border-t border-border/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Folder Preview:
            </span>
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs',
                currentColorConfig.bg,
                currentColorConfig.text,
                currentColorConfig.border
              )}
            >
              <FolderIconRenderer iconName={selectedIcon} size={16} className="w-4 h-4" />
              <span>{name.trim() || 'Folder Name'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-mono">
                0 words
              </span>
            </div>
          </div>
        </form>

        {/* Actions Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="h-8 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-black shadow-xs cursor-pointer"
          >
            {isEditing ? 'Save Changes' : isSystem ? 'Create Global Folder' : 'Create Folder'}
          </Button>
        </div>
      </div>
    </div>
  )
}
