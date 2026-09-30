import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, HelpCircle, BookOpen, Users, Upload, CreditCard, ArrowRight, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SearchItem {
  id: string
  title: string
  subtitle: string
  category: 'tests' | 'questions' | 'passages' | 'users' | 'imports' | 'payments'
  href: string
}

export function GlobalSearchDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)

  // Quick navigation items for default state
  const quickLinks: SearchItem[] = [
    { id: '1', title: 'All IELTS Tests', subtitle: 'Manage Reading, Listening, Writing & Speaking tests', category: 'tests', href: '/admin/tests' },
    { id: '2', title: 'Create New Test', subtitle: 'Open multi-step test builder', category: 'tests', href: '/admin/tests/create' },
    { id: '3', title: 'Writing & Speaking Tasks', subtitle: 'Manage Writing Task 1/2 prompts and Speaking topics', category: 'tests', href: '/admin/tasks' },
    { id: '4', title: 'Student Attempts & Results', subtitle: 'Track test submissions and estimated bands', category: 'users', href: '/admin/attempts' },
    { id: '5', title: 'Import Center', subtitle: 'PDF, Audio, and JSON imports with AI parser', category: 'imports', href: '/admin/import' },
    { id: '6', title: 'User Management', subtitle: 'Profiles, student roles, and account status', category: 'users', href: '/admin/users' },
  ]

  const handleSelect = (href: string) => {
    onClose()
    navigate(href)
  }

  const filteredLinks = query.trim()
    ? quickLinks.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : quickLinks

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 w-[calc(100vw-1.5rem)] max-w-xl mx-auto bg-card rounded-2xl shadow-2xl border border-border overflow-hidden top-[15%] sm:top-[20%] translate-y-0">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-secondary/30">
          <Search className="w-4.5 h-4.5 text-primary shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tests, questions, users, tasks... (Ctrl + K)"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-secondary border border-border rounded ml-2 font-mono">
            ESC
          </kbd>
        </div>

        {/* Search Results / Quick Links */}
        <div className="max-h-80 sm:max-h-96 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {query.trim() ? 'Matching Results' : 'Quick Navigation'}
          </div>

          {filteredLinks.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-secondary/70 group transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {item.category === 'tests' && <FileText className="w-4 h-4" />}
                    {item.category === 'questions' && <HelpCircle className="w-4 h-4" />}
                    {item.category === 'passages' && <BookOpen className="w-4 h-4" />}
                    {item.category === 'users' && <Users className="w-4 h-4" />}
                    {item.category === 'imports' && <Upload className="w-4 h-4" />}
                    {item.category === 'payments' && <CreditCard className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-secondary/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>FOX FORD Control Center</span>
          <span className="flex items-center gap-2">
            <span>Press <kbd className="font-mono bg-card border border-border px-1.5 py-0.5 rounded text-[10px]">↵</kbd> to select</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
