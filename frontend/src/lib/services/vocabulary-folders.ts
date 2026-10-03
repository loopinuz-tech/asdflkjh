export interface VocabFolder {
  id: string
  name: string
  iconName: string
  color: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'cyan' | 'orange' | 'indigo'
  description?: string
  isSystem?: boolean
  userId?: string | null
  createdAt?: string
}

export const FOLDER_ICONS = [
  { id: 'book', label: 'Academic / Reading' },
  { id: 'translation', label: 'Vocabulary' },
  { id: 'star', label: 'Band 8-9 Advanced' },
  { id: 'fire', label: 'Most Frequent' },
  { id: 'medal', label: 'Mastered' },
  { id: 'clock', label: 'Daily Practice' },
  { id: 'pen', label: 'Writing Tasks' },
  { id: 'microphone', label: 'Speaking Interview' },
  { id: 'target', label: 'Target / Tricky' },
  { id: 'shield', label: 'Collocations & Grammar' },
  { id: 'crown', label: 'VIP Essentials' },
  { id: 'folder', label: 'General Folder' },
] as const

export const FOLDER_COLORS = [
  { id: 'amber', name: 'Amber / Gold', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  { id: 'emerald', name: 'Emerald / Green', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'blue', name: 'Blue / Sky', bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  { id: 'purple', name: 'Purple / Violet', bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  { id: 'rose', name: 'Rose / Red', bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
  { id: 'cyan', name: 'Cyan / Teal', bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  { id: 'orange', name: 'Orange / Sunset', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  { id: 'indigo', name: 'Indigo / Navy', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
] as const

export const DEFAULT_GLOBAL_FOLDERS: VocabFolder[] = [
  {
    id: 'folder-c1-academic',
    name: 'C1 Academic Vocabulary',
    iconName: 'star',
    color: 'amber',
    description: '100 ta C1 darajadagi eng muhim akademik IELTS so‘zlari (Band 7.5 - 9.0)',
    isSystem: true,
    userId: null,
    createdAt: '2026-10-03T10:00:00.000Z',
  },
]

const DEMO_FOLDER_IDS = new Set([
  'folder-academic-core',
  'folder-environment',
  'folder-technology',
  'folder-writing-task2',
  'folder-speaking-part3',
])

const GLOBAL_STORAGE_KEY = 'edufox_admin_global_folders_v2'
const USER_STORAGE_PREFIX = 'edufox_user_vocab_folders_'

export function getVocabFolders(userId?: string | null): VocabFolder[] {
  if (typeof window === 'undefined') return DEFAULT_GLOBAL_FOLDERS

  // 1. Get system / global folders created by admin
  let globalFolders: VocabFolder[] = []
  try {
    const raw = localStorage.getItem(GLOBAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalFolders = parsed.filter((f: any) => !DEMO_FOLDER_IDS.has(f.id))
      }
    } else {
      // Also clean up v1 key if it had demo folders
      const legacyRaw = localStorage.getItem('edufox_admin_global_folders_v1')
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw)
        if (Array.isArray(legacyParsed)) {
          globalFolders = legacyParsed.filter((f: any) => !DEMO_FOLDER_IDS.has(f.id))
          localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(globalFolders))
        }
      }
    }
  } catch (e) {
    console.warn('Error reading global folders:', e)
  }

  // Ensure default global folders (e.g. C1 Academic Vocabulary) are always present
  DEFAULT_GLOBAL_FOLDERS.forEach((df) => {
    if (!globalFolders.some((f) => f.id === df.id)) {
      globalFolders.unshift(df)
      try {
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(globalFolders))
      } catch {}
    }
  })

  // 2. Get user personal folders if userId provided
  let userFolders: VocabFolder[] = []
  if (userId) {
    try {
      const rawUser = localStorage.getItem(`${USER_STORAGE_PREFIX}${userId}`)
      if (rawUser) {
        const parsed = JSON.parse(rawUser)
        if (Array.isArray(parsed)) {
          userFolders = parsed.filter((f: any) => !DEMO_FOLDER_IDS.has(f.id))
        }
      }
    } catch (e) {
      console.warn('Error reading user folders:', e)
    }
  }

  return [...globalFolders, ...userFolders]
}

export function createVocabFolder(
  data: {
    name: string
    iconName: string
    color: VocabFolder['color']
    description?: string
    isSystem?: boolean
  },
  userId?: string | null
): VocabFolder {
  const newFolder: VocabFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    iconName: data.iconName || 'folder',
    color: data.color || 'amber',
    description: data.description?.trim() || '',
    isSystem: Boolean(data.isSystem),
    userId: data.isSystem ? null : userId || null,
    createdAt: new Date().toISOString(),
  }

  if (typeof window === 'undefined') return newFolder

  try {
    if (data.isSystem) {
      const raw = localStorage.getItem(GLOBAL_STORAGE_KEY)
      const list = raw ? JSON.parse(raw) : []
      list.push(newFolder)
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(list))
    } else if (userId) {
      const key = `${USER_STORAGE_PREFIX}${userId}`
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      list.push(newFolder)
      localStorage.setItem(key, JSON.stringify(list))
    }
  } catch (e) {
    console.error('Failed to save folder to storage:', e)
  }

  return newFolder
}

export function deleteVocabFolder(folderId: string, userId?: string | null): boolean {
  if (typeof window === 'undefined') return false

  try {
    // Check if system folder
    const rawGlobal = localStorage.getItem(GLOBAL_STORAGE_KEY)
    if (rawGlobal) {
      const list = JSON.parse(rawGlobal)
      const filtered = list.filter((f: any) => f.id !== folderId)
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(filtered))
    }

    // Check user folders
    if (userId) {
      const key = `${USER_STORAGE_PREFIX}${userId}`
      const rawUser = localStorage.getItem(key)
      if (rawUser) {
        const list = JSON.parse(rawUser)
        const filtered = list.filter((f: any) => f.id !== folderId)
        localStorage.setItem(key, JSON.stringify(filtered))
      }
    }
    return true
  } catch (e) {
    console.error('Failed to delete folder:', e)
    return false
  }
}

export function updateVocabFolder(
  folderId: string,
  updates: Partial<Pick<VocabFolder, 'name' | 'iconName' | 'color' | 'description'>>,
  userId?: string | null
): VocabFolder | null {
  if (typeof window === 'undefined') return null

  try {
    // 1. Check system folders
    const rawGlobal = localStorage.getItem(GLOBAL_STORAGE_KEY)
    if (rawGlobal) {
      const list = JSON.parse(rawGlobal)
      const index = list.findIndex((f: any) => f.id === folderId)
      if (index !== -1) {
        list[index] = { ...list[index], ...updates }
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(list))
        return list[index]
      }
    }

    // 2. Check user folders
    if (userId) {
      const key = `${USER_STORAGE_PREFIX}${userId}`
      const rawUser = localStorage.getItem(key)
      if (rawUser) {
        const list = JSON.parse(rawUser)
        const index = list.findIndex((f: any) => f.id === folderId)
        if (index !== -1) {
          list[index] = { ...list[index], ...updates }
          localStorage.setItem(key, JSON.stringify(list))
          return list[index]
        }
      }
    }
  } catch (e) {
    console.error('Failed to update folder:', e)
  }

  return null
}

