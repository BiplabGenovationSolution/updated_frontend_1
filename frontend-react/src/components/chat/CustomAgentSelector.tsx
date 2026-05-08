'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Bot, Target, TrendingUp, Check, Loader2, AlertCircle, X } from 'lucide-react'
import { apiClient } from '@/lib/api'
import type { CustomAgent, AgentType } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import Avatar from 'boring-avatars'
import { AGENT_CONFIGS } from '@/lib/constants'

interface CustomAgentSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectAgent: (agentType: AgentType, customAgentId?: string, customAgentData?: any) => void
  currentAgent: AgentType
  currentCustomAgentId?: string
}

export function CustomAgentSelector({
  isOpen,
  onClose,
  onSelectAgent,
  currentAgent,
  currentCustomAgentId
}: CustomAgentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAgentType, setSelectedAgentType] = useState<'base' | 'custom'>('base')

  useEffect(() => {
    if (isOpen) {
      loadCustomAgents()
    }
  }, [isOpen])

  const loadCustomAgents = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getCustomAgents({
        limit: 50,
        status: 'active',
        sort_by: 'usage_count',
        sort_order: 'desc'
      })

      if (response.success && response.data) {
        setCustomAgents(response.data.agents || [])
      }
    } catch (error) {
      console.error('Failed to load custom agents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBaseAgent = (agentType: AgentType) => {
    onSelectAgent(agentType)
    onClose()
  }

  const handleSelectCustomAgent = (agent: CustomAgent) => {
    // Custom agents use aegis as base agent type
    // Pass the full agent data so we can set name and metadata in context
    onSelectAgent('aegis', agent.id, agent)
    onClose()
  }

  const filteredCustomAgents = customAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select AI Agent</DialogTitle>
          <DialogDescription>
            Choose from base agents or your custom configured agents
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={selectedAgentType === 'base' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setSelectedAgentType('base')}
          >
            <Bot className="h-4 w-4 mr-2" />
            Base Agents
          </Button>
          <Button
            variant={selectedAgentType === 'custom' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setSelectedAgentType('custom')}
          >
            <Target className="h-4 w-4 mr-2" />
            Custom Agents ({customAgents.length})
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedAgentType === 'base' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
              {/* Aegis */}
              <Card
                className={cn(
                  "p-6 cursor-pointer hover:shadow-lg transition-all border-2",
                  currentAgent === 'aegis' && !currentCustomAgentId
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-blue-200"
                )}
                onClick={() => handleSelectBaseAgent('aegis')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-lg overflow-hidden" style={{ borderRadius: '6px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <Avatar
                          size={32}
                          name="Aegis"
                          variant={AGENT_CONFIGS.aegis.variant}
                          colors={[...AGENT_CONFIGS.aegis.colors]}
                          square={true}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Aegis</h3>
                      <Badge className="bg-blue-100 text-blue-700 text-xs border-0">
                        General AI
                      </Badge>
                    </div>
                  </div>
                  {currentAgent === 'aegis' && !currentCustomAgentId && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Versatile AI for research, data analysis, coding, and general assistance
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Research</Badge>
                  <Badge variant="secondary" className="text-xs">Coding</Badge>
                  <Badge variant="secondary" className="text-xs">Analysis</Badge>
                </div>
              </Card>

              {/* Sophia */}
              <Card
                className={cn(
                  "p-6 cursor-pointer hover:shadow-lg transition-all border-2",
                  currentAgent === 'sophia' && !currentCustomAgentId
                    ? "border-purple-500 bg-purple-50"
                    : "border-transparent hover:border-purple-200"
                )}
                onClick={() => handleSelectBaseAgent('sophia')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-lg overflow-hidden" style={{ borderRadius: '6px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <Avatar
                          size={32}
                          name="Sophia"
                          variant={AGENT_CONFIGS.sophia.variant}
                          colors={[...AGENT_CONFIGS.sophia.colors]}
                          square={true}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Sophia</h3>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-purple-100 text-purple-700 text-xs border-0">
                          Knowledge AI
                        </Badge>
                        <Target className="h-3 w-3 text-purple-400" />
                      </div>
                    </div>
                  </div>
                  {currentAgent === 'sophia' && !currentCustomAgentId && (
                    <Check className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Enhanced AI with knowledge base integration for intelligent document search and contextual responses
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Document Search</Badge>
                  <Badge variant="secondary" className="text-xs">Knowledge Base</Badge>
                  <Badge variant="secondary" className="text-xs">RAG</Badge>
                </div>
              </Card>
            </div>
          ) : (
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredCustomAgents.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {searchQuery 
                      ? 'No custom agents match your search'
                      : 'No custom agents created yet. Create one to get started!'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCustomAgents.map(agent => {
                    // Generate unique gradient colors based on agent name (grey/neutral tones)
                    const getAgentGradient = (agent: any) => {
                      const gradients = [
                        { from: '#d1d5db', to: '#9ca3af', shadow: 'shadow-gray-200' },
                        { from: '#e5e7eb', to: '#d1d5db', shadow: 'shadow-gray-200' },
                        { from: '#9ca3af', to: '#6b7280', shadow: 'shadow-gray-300' },
                        { from: '#f3f4f6', to: '#d1d5db', shadow: 'shadow-gray-200' },
                        { from: '#d1d5db', to: '#6b7280', shadow: 'shadow-gray-300' },
                        { from: '#e5e7eb', to: '#9ca3af', shadow: 'shadow-gray-200' },
                        { from: '#f9fafb', to: '#e5e7eb', shadow: 'shadow-gray-100' },
                        { from: '#9ca3af', to: '#d1d5db', shadow: 'shadow-gray-200' },
                      ]
                      const hash = agent.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
                      return gradients[hash % gradients.length]
                    }

                    const gradient = getAgentGradient(agent)

                    return (
                    <Card
                      key={agent.id}
                      className={cn(
                        "p-6 cursor-pointer hover:shadow-lg transition-all border-2 overflow-hidden",
                        currentCustomAgentId === agent.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-transparent hover:border-purple-200"
                      )}
                      onClick={() => handleSelectCustomAgent(agent)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Professional gradient icon */}
                          <div
                            className={cn("w-12 h-12 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden", gradient.shadow)}
                            style={{
                              background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                              borderRadius: '6px'
                            }}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              overflow: 'hidden'
                            }}>
                              <Avatar
                                size={40}
                                name={agent.name}
                                variant="marble"
                                colors={[gradient.from, gradient.to, '#ffffff']}
                                square={true}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate">{agent.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">Custom</Badge>
                              {agent.capabilities.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {agent.capabilities.length} capabilities
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {currentCustomAgentId === agent.id && (
                          <Check className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-words">
                        {agent.description}
                      </p>

                      {agent.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs truncate max-w-[100px]">
                              {tag}
                            </Badge>
                          ))}
                          {agent.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {agent.usage_count} uses
                        </div>
                        <span>{formatRelativeTime(agent.created_at)}</span>
                      </div>
                    </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-500">
            {selectedAgentType === 'base' 
              ? '2 base agents available'
              : `${filteredCustomAgents.length} custom agent${filteredCustomAgents.length !== 1 ? 's' : ''} available`}
          </p>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}