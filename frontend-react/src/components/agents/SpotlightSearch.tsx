'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, Command, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Avatar from 'boring-avatars'

interface Agent {
  id: string
  name: string
  description?: string
  emoji?: string
  agent_type: 'chat' | 'flow'
  tags?: string[]
  is_global?: boolean
  category?: string
}

interface SpotlightSearchProps {
  agents: Agent[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectAgent: (agent: Agent) => void
}

export function SpotlightSearch({
  agents,
  open,
  onOpenChange,
  onSelectAgent
}: SpotlightSearchProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Fuzzy search function
  const fuzzyMatch = (str: string, pattern: string): number => {
    if (!pattern) return 1

    const strLower = str.toLowerCase()
    const patternLower = pattern.toLowerCase()

    // Exact match gets highest score
    if (strLower === patternLower) return 1000
    if (strLower.includes(patternLower)) return 500

    // Fuzzy matching
    let score = 0
    let patternIdx = 0
    let prevMatchIdx = -1

    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        score += prevMatchIdx === i - 1 ? 10 : 5 // Consecutive matches score higher
        prevMatchIdx = i
        patternIdx++
      }
    }

    return patternIdx === patternLower.length ? score : 0
  }

  // Filter and sort agents based on search
  const filteredAgents = useMemo(() => {
    if (!search.trim()) return agents

    const results = agents.map(agent => {
      const nameScore = fuzzyMatch(agent.name, search)
      const descScore = agent.description ? fuzzyMatch(agent.description, search) * 0.5 : 0
      const tagsScore = agent.tags?.some(tag => fuzzyMatch(tag, search) > 0) ? 50 : 0
      const categoryScore = agent.category ? fuzzyMatch(agent.category, search) * 0.3 : 0

      const totalScore = nameScore + descScore + tagsScore + categoryScore

      return { agent, score: totalScore }
    })

    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.agent)
  }, [agents, search])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredAgents])

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredAgents.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % filteredAgents.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + filteredAgents.length) % filteredAgents.length)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredAgents[selectedIndex]) {
          onSelectAgent(filteredAgents[selectedIndex])
          onOpenChange(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        onOpenChange(false)
        break
    }
  }, [filteredAgents, selectedIndex, onSelectAgent, onOpenChange])

  const getCategoryColor = (agent: Agent) => {
    if (agent.is_global) return 'bg-purple-100 text-purple-700 border-purple-200'
    if (agent.agent_type === 'flow') return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0" onKeyDown={handleKeyDown}>
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-200 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, description, or tags..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base"
            autoFocus
          />
          <div className="flex items-center gap-1 ml-3">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded">
              <Command className="h-3 w-3 inline" />K
            </kbd>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-96">
          <div className="p-2">
            {filteredAgents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No agents found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try different keywords
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAgents.map((agent, index) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent)
                      onOpenChange(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    )}
                  >
                    {/* Agent Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
                        <Avatar
                          size={40}
                          name={agent.name}
                          variant="marble"
                          colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#fa709a', '#fee140']}
                        />
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {agent.name}
                        </h4>
                        {agent.is_global && (
                          <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      {agent.description && (
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {agent.description}
                        </p>
                      )}
                      {agent.tags && agent.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {agent.tags.slice(0, 3).map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs px-1.5 py-0 h-5"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {agent.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{agent.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Type Badge & Arrow */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={cn("text-xs font-medium", getCategoryColor(agent))}>
                        {agent.is_global ? 'Official' : agent.agent_type === 'flow' ? 'Flow' : 'Chat'}
                      </Badge>
                      {index === selectedIndex && (
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
          <div className="text-gray-400">
            {filteredAgents.length} {filteredAgents.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
