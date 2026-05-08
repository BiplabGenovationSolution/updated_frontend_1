import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, LayoutDashboard, Database, Plug,
  MessageSquare, Briefcase, FileText, Loader2, Bot, Workflow, HardDrive, Shield, Wrench, Library
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { DIRECT_BACKEND_URL } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResultItem {
  id: string
  name?: string
  title?: string
  description?: string
  resource_type: string
  metadata?: Record<string, any>
}

interface SearchResults {
  knowledge_base: SearchResultItem[]
  capability: SearchResultItem[]
  custom_agent: SearchResultItem[]
  agent_flow: SearchResultItem[]
  data_bucket: SearchResultItem[]
  chat: SearchResultItem[]
  automation: SearchResultItem[]
}

type CategoryKey = keyof SearchResults

// ─── Static navigation commands (always shown when query is empty) ─────────────

const STATIC_COMMANDS = [
  { id: 'nav-agents', title: 'Agents', icon: LayoutDashboard, path: '/agents', category: 'Navigation' },
  { id: 'nav-library', title: 'Library', icon: Library, path: '/library', category: 'Navigation' },
  { id: 'nav-hub', title: 'Hub', icon: Briefcase, path: '/hub', category: 'Navigation' },
  { id: 'nav-connectors', title: 'Connectors', icon: Plug, path: '/connectors', category: 'Navigation' },
  { id: 'nav-capabilities', title: 'Capabilities', icon: Wrench, path: '/capabilities', category: 'Navigation' },
  { id: 'nav-governance', title: 'Governance', icon: Shield, path: '/settings', category: 'Navigation' },
]

// ─── Resource type metadata ───────────────────────────────────────────────────

const RESOURCE_META: Record<CategoryKey, { label: string; icon: React.ElementType; path: (item: SearchResultItem) => string }> = {
  knowledge_base: { label: 'Knowledge Bases', icon: Database, path: (item) => `/knowledge?kb=${item.id}` },
  capability: { label: 'Capabilities', icon: Wrench, path: (item) => `/capabilities/${item.id}` },
  // Navigate to the agent page using the agent NAME (URL-encoded), mirroring /agents/custom/:name
  custom_agent: { label: 'Custom Agents', icon: Bot, path: (item) => `/agents/custom/${encodeURIComponent(item.name || item.id)}` },
  agent_flow: { label: 'Agent Flows', icon: Workflow, path: () => `/hub` },
  data_bucket: { label: 'Data Buckets', icon: HardDrive, path: (item) => `/hub/bucket/${item.id}` },
  // Navigate to chat with id + agent_type so the workspace-aware route can restore context
  chat: { label: 'Chats', icon: MessageSquare, path: (item) => `/agents/${item.metadata?.agent_type || 'sophia'}?id=${item.id}` },
  automation: { label: 'Automations', icon: FileText, path: () => `/hub` },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getAuthHeaders = () => {
    const token = localStorage.getItem('mentis_auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  const callSearchAPI = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null)
      return
    }
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ query: q, limit: '10' })
      const res = await fetch(`${DIRECT_BACKEND_URL}/search?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      if (data.success) setSearchResults(data.results)
    } catch {
      // fail silently – fall back to static commands
      setSearchResults(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Build flat items list for keyboard nav ────────────────────────────────────

  const flatItems: Array<{ title: string; icon: React.ElementType; path: string; category: string }> = []

  if (query && searchResults) {
    const keys = Object.keys(RESOURCE_META) as CategoryKey[]
    keys.forEach((key) => {
      const items = searchResults[key] || []
      const meta = RESOURCE_META[key]
      items.forEach((item) => {
        flatItems.push({
          title: item.name || item.title || item.id,
          icon: meta.icon,
          path: meta.path(item),   // pass full item so path fn can use metadata
          category: meta.label,
        })
      })
    })
    // If no API results, fall through to filtered static commands below
    if (flatItems.length === 0) {
      STATIC_COMMANDS
        .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
        .forEach((c) => flatItems.push(c))
    }
  } else if (!query) {
    STATIC_COMMANDS.forEach((c) => flatItems.push(c))
  } else {
    // Still loading or query typed – filter static commands so UI isn't empty
    STATIC_COMMANDS
      .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
      .forEach((c) => flatItems.push(c))
  }

  // ── Effects ───────────────────────────────────────────────────────────────────

  // Debounce API call
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => callSearchAPI(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, callSearchAPI])

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setSearchResults(null)
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Reset selection when list changes
  useEffect(() => setSelectedIndex(0), [query])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // ── Keyboard handling ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((p) => Math.min(p + 1, flatItems.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((p) => Math.max(p - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatItems[selectedIndex]
      if (item) { navigate(item.path); onClose() }
    }
  }

  if (!isOpen) return null

  // ── Group for display ─────────────────────────────────────────────────────────
  let globalIndex = 0
  const groups: Record<string, typeof flatItems> = {}
  flatItems.forEach((item) => {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  })

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] sm:pt-[16vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#131727] rounded-xl shadow-2xl border border-slate-200 dark:border-[#2d3545] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        {/* Input Row */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-[#20273a] gap-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-autocomplete="list"
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white text-[15px] placeholder:text-slate-400"
            placeholder="Search agents, chats, knowledge bases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#2d3545]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
          role="listbox"
        >
          {flatItems.length === 0 && !isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No results found for "{query}"
            </div>
          ) : (
            Object.entries(groups).map(([category, items]) => (
              <div key={category}>
                <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {category}
                </p>
                {items.map((item) => {
                  const idx = globalIndex++
                  const isSelected = idx === selectedIndex
                  return (
                    <div
                      key={`${item.category}-${item.title}-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors select-none',
                        isSelected
                          ? 'bg-slate-100 dark:bg-indigo-600/10 text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a2035]'
                      )}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => { navigate(item.path); onClose() }}
                    >
                      <item.icon className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                      )} />
                      <span className="text-[13px] font-medium flex-1 truncate">{item.title}</span>
                      {isSelected && (
                        <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] font-medium text-slate-400 bg-white dark:bg-[#131727] px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-[#2d3545]">
                          ⏎
                        </kbd>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-[#20273a] text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">⏎</kbd> open</span>
            <span><kbd className="font-mono">ESC</kbd> close</span>
          </div>
          {query && !isLoading && (
            <span className="text-indigo-500 dark:text-indigo-400 font-medium">
              {flatItems.length} result{flatItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
