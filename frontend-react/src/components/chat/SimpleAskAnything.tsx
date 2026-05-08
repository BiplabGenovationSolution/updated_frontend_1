// frontend/src/components/chat/SimpleAskAnything.tsx
// AGENT OS INTERFACE - Refined Apple-like minimalist design
'use client'

import { useState, useEffect } from 'react'
import {

  Search,
  Database,

  BarChart3,

  Code,

  Brain,

  Bot,

  Terminal,

  Activity,

  X,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import {

  TooltipProvider,

} from "@/components/ui/tooltip"
import type { AgentType } from '@/lib/types'
import { AGENT_CONFIGS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { isValidAgentType } from '@/lib/utils'
import Avatar from 'boring-avatars'
import { useChatContext } from '@/context/chat-context'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'
import { CodebaseSelector } from '@/components/clavis/CodebaseSelector'
import { BucketSelector } from '@/components/hub/BucketSelector'
import { useToast } from '@/hooks/use-toast'

// Agent tile configuration - Minimalist approach
const AGENT_TILES = [
  {
    id: 'aegis',
    name: 'Aegis',
    subtitle: 'Research Intelligence',
    description: 'Research and analysis agent with persistent memory, multiple personalities, and real-time messaging',
    icon: Search,
    color: 'gray',
    gradient: 'from-gray-50 to-gray-100',
    selectedGradient: 'from-gray-900 to-gray-800',
    iconColor: 'text-gray-600',
    selectedIconColor: 'text-white',
    borderColor: 'border-gray-900',
    capabilities: ['Web Research', 'Analysis', 'Reports']
  },
  {
    id: 'sophia',
    name: 'Sophia',
    subtitle: 'Knowledge Intelligence',
    description: 'Chat agent with knowledge base integration - focused on conversational AI with real-time messaging',
    icon: Brain,
    color: 'purple',
    gradient: 'from-purple-50 to-purple-100',
    selectedGradient: 'from-purple-600 to-violet-700',
    iconColor: 'text-purple-600',
    selectedIconColor: 'text-white',
    borderColor: 'border-purple-600',
    capabilities: ['Document Search', 'Knowledge Analysis', 'Q&A'],
    requiresSetup: true,
    setupType: 'knowledge_base'
  },
  {
    id: 'clavis',
    name: 'Clavis',
    subtitle: 'Vision Intelligence',
    description: 'Advanced coding assistant with repository management, code search, and analysis',
    icon: Terminal,
    color: 'blue',
    gradient: 'from-blue-50 to-blue-100',
    selectedGradient: 'from-blue-600 to-indigo-700',
    iconColor: 'text-blue-600',
    selectedIconColor: 'text-white',
    borderColor: 'border-blue-600',
    capabilities: ['Code Search', 'Architecture Analysis', 'Debug Help'],
    requiresSetup: true,
    setupType: 'codebase'
  },
  {
    id: 'analytica',
    name: 'Analytica',
    subtitle: 'Data Intelligence',
    description: 'Data analysis and visualization specialist with AI-powered insights',
    icon: Activity,
    color: 'cyan',
    gradient: 'from-cyan-50 to-cyan-100',
    selectedGradient: 'from-cyan-600 to-blue-700',
    iconColor: 'text-cyan-600',
    selectedIconColor: 'text-white',
    borderColor: 'border-cyan-600',
    capabilities: ['Data Analysis', 'Visualizations', 'Statistics'],
    requiresSetup: true,
    setupType: 'data_bucket'
  }
]

export function SimpleAskAnything() {
  const { toast } = useToast()

  // Use context
  const context = useChatContext()

  if (!context) {
    throw new Error('SimpleAskAnything must be used within ChatProvider')
  }

  const {
    selectedAgent,
    setSelectedAgent,

    selectedKnowledgeBase,
    selectedKnowledgeBaseName,
    setSelectedKnowledgeBase,
    setSelectedKnowledgeBaseName,
    showKnowledgeBaseSelector,
    setShowKnowledgeBaseSelector,
    selectedCodebase,
    selectedCodebaseName,
    setSelectedCodebase,
    setSelectedCodebaseName,
    showCodebaseSelector,
    setShowCodebaseSelector,
    selectedBucket,
    selectedBucketName,
    setSelectedBucket,
    setSelectedBucketName,
    showBucketSelector,
    setShowBucketSelector,

    setCustomAgentId,
    customAgentName,
    setCustomAgentName,
    setCustomAgentMetadata,

  } = context

  const [currentCustomAgentId, setCurrentCustomAgentId] = useState<string | undefined>(undefined)
  const [customAgents, setCustomAgents] = useState<any[]>([])
  const [isLoadingCustomAgents, setIsLoadingCustomAgents] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showStartChatModal, setShowStartChatModal] = useState(false)
  const navigate = useNavigate()

  // Load custom agents on mount
  useEffect(() => {
    loadCustomAgents()
  }, [])

  const loadCustomAgents = async () => {
    try {
      setIsLoadingCustomAgents(true)
      const { apiClient } = await import('@/lib/api')
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
      setIsLoadingCustomAgents(false)
    }
  }

  // Enhanced agent change with custom agent support
  const handleAgentChange = async (agent: AgentType, customAgentIdParam?: string, customAgentData?: any) => {
    console.log('🔄 Agent OS: Launching agent:', { agent, customAgentIdParam })

    if (!isValidAgentType(agent)) {
      console.error('❌ Invalid agent type:', agent)
      return
    }

    setSelectedAgent(agent)
    setCurrentCustomAgentId(customAgentIdParam)

    // Update custom agent in ChatContext
    if (customAgentIdParam) {
      setCustomAgentId(customAgentIdParam)

      if (customAgentData) {
        setCustomAgentName(customAgentData.name)
        setCustomAgentMetadata(customAgentData)
      } else {
        try {
          const { apiClient } = await import('@/lib/api')
          const response = await apiClient.getCustomAgent(customAgentIdParam)
          if (response.success && response.data) {
            setCustomAgentName(response.data.name)
            setCustomAgentMetadata(response.data)
          }
        } catch (error) {
          console.error('❌ Failed to fetch custom agent data:', error)
        }
      }
    } else {
      setCustomAgentId(null)
      setCustomAgentName(null)
      setCustomAgentMetadata(null)
    }

    // Navigate to agent-specific route immediately
    if (!customAgentIdParam) {
      // Built-in agents - navigate to agent-specific routes
      navigate(`/agents/${agent}`)
    }

    // DISABLED: Modal blocks navigation - commenting out to fix the issue
    // setShowStartChatModal(true)

    // Agent-specific setup handling - open source selectors if needed
    if (agent === 'sophia' && !selectedKnowledgeBase) {
      setTimeout(() => setShowKnowledgeBaseSelector(true), 300)
    }

    if (agent === 'clavis' && !selectedCodebase) {
      setTimeout(() => setShowCodebaseSelector(true), 300)
    }

    if (agent === 'analytica' && !selectedBucket) {
      setTimeout(() => setShowBucketSelector(true), 300)
    }
  }

  const handleKnowledgeBaseChange = () => {
    setShowKnowledgeBaseSelector(true)
  }

  const handleCodebaseChange = () => {
    setShowCodebaseSelector(true)
  }

  const handleBucketChange = () => {
    setShowBucketSelector(true)
  }

  const handleStartChat = async () => {
    try {
      console.log('🚀 Starting chat with agent:', selectedAgent)

      // Close modal
      setShowStartChatModal(false)

      // The agent and sources are already set in the context from handleAgentChange
      // ChatInterface will now show the appropriate agent chat component
      // When user sends first message, it will create the chat via sendMessage in ChatContext

      // No need to navigate - we're already on /chat, and the state is already set
      // The ChatInterface component will automatically switch from SimpleAskAnything
      // to the agent chat component because selectedAgent is now set
    } catch (error) {
      console.error('❌ Failed to start chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to start chat. Please try again.',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleKnowledgeBaseSelect = (kb: any) => {
    console.log('📚 Knowledge base selected:', kb.name)
    setSelectedKnowledgeBase(kb.id)
    setSelectedKnowledgeBaseName(kb.name)
    setShowKnowledgeBaseSelector(false)
  }

  const handleCodebaseSelect = (codebase: any) => {
    console.log('💻 Codebase selected:', codebase.repo_name)
    setSelectedCodebase(codebase.codebase_id)
    setSelectedCodebaseName(codebase.repo_name)
    setShowCodebaseSelector(false)
  }

  const handleBucketSelect = (bucket: any) => {
    const bucketId = bucket.bucket_id || bucket.id
    const bucketName = bucket.name

    if (!bucketId || !bucketName) {
      toast({
        title: 'Error',
        description: 'Invalid bucket data received',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    setSelectedBucket(bucketId)
    setSelectedBucketName(bucketName)
    setShowBucketSelector(false)

    toast({
      title: 'Data Bucket Selected',
      description: `Now analyzing ${bucketName}`,
      duration: 2000
    })
  }

  const isBucketSelected = selectedBucket !== null && selectedBucket !== '' && selectedBucket !== undefined && selectedBucketName

  // Check if agent requires setup and is set up
  const isAgentReady = (agentId: string) => {
    if (agentId === 'sophia') return !!selectedKnowledgeBase
    if (agentId === 'clavis') return !!selectedCodebase
    if (agentId === 'analytica') return isBucketSelected
    return true
  }

  // Filter agents based on search
  const filteredBuiltInAgents = AGENT_TILES.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCustomAgents = customAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--app-bg,#EEF2F7)] dark:bg-[#1a1f2e]">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--app-bg,#EEF2F7)] to-[var(--app-bg,#EEF2F7)] dark:from-[#1a1f2e] dark:to-[#1a1f2e]" />

        {/* Main Content */}
        <div className="relative flex-1 overflow-auto">
          <div className="flex flex-col min-h-full max-w-7xl mx-auto w-full pb-8">

            {/* iOS-Style Header with Search */}
            <div className="sticky top-0 z-10 bg-[var(--app-bg,#EEF2F7)] dark:bg-[#1a1f2e]/90 backdrop-blur-xl border-b border-gray-100 dark:border-[#2d3545] px-8 py-6">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Branding */}
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/mentis-logomark.svg"
                      alt="Mentis"
                      className="w-10 h-10"
                    />
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Mentis
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300">AI Agent Platform</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                    Beta v0.9
                  </Badge>
                </div>

                {/* iOS-Style Search Bar */}
                <div className="relative dark:bg-[#1a1f2e]">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
                  <Input
                    placeholder="Search agents and models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base bg-gray-50 border border-cyan-500 dark:border-cyan-600 rounded-xl focus:bg-white dark:bg-[#1a1f2e] outline-none focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400  hover:text-gray-600 dark:text-gray-400 "
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - iOS App Style */}
            <div className="flex-1 px-8 py-10">
              <div className="max-w-6xl mx-auto space-y-12">

                {/* Built-in Agents Section */}
                {filteredBuiltInAgents.length > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Built-in Agents</h2>
                      <Badge variant="secondary" className="text-xs dark:text-gray-300">{filteredBuiltInAgents.length} available</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredBuiltInAgents.map((agent) => {
                        const isSelected = selectedAgent === agent.id && !currentCustomAgentId
                        const isReady = isAgentReady(agent.id)

                        return (
                          <button
                            key={agent.id}
                            onClick={() => handleAgentChange(agent.id as AgentType)}
                            className={cn(
                              "group relative overflow-hidden rounded-2xl transition-all duration-200",
                              "bg-white dark:bg-[#2d3545] dark:hover:bg-[#3d4555] border p-5 text-left",
                              "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                              isSelected
                                ? "border-indigo-500 dark:border-[#58a6ff] shadow-lg shadow-indigo-100 dark:shadow-none ring-2 ring-indigo-500 dark:ring-[#58a6ff]"
                                : "border-gray-200 dark:border-[#3d4555] shadow-sm"
                            )}
                          >
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}

                            {/* Beautiful Gradient Avatar */}
                            <div className="w-12 h-12 mb-4 shadow-md overflow-hidden" style={{ borderRadius: '6px' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '6px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '6px'
                                }}>
                                  <Avatar
                                    size={48}
                                    name={agent.name}
                                    variant={AGENT_CONFIGS[agent.id as keyof typeof AGENT_CONFIGS]?.variant || 'marble'}
                                    colors={[...(AGENT_CONFIGS[agent.id as keyof typeof AGENT_CONFIGS]?.colors || ['#667eea', '#764ba2'])]}
                                    square={true}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Name & Subtitle */}
                            <div className="space-y-1">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{agent.name}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400  line-clamp-1">{agent.subtitle}</p>
                            </div>

                            {/* Status indicator */}
                            <div className="mt-3 flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isReady ? "bg-green-500" : "bg-amber-500"
                              )} />
                              <span className="text-[10px] text-gray-400 dark:text-gray-300">
                                {isReady ? "Ready" : "Setup required"}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Agents Section */}
                {(filteredCustomAgents.length > 0 || isLoadingCustomAgents) && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Custom Agents</h2>
                      <Badge variant="secondary" className="text-xs">
                        {isLoadingCustomAgents ? 'Loading...' : `${filteredCustomAgents.length} agents`}
                      </Badge>
                    </div>

                    {isLoadingCustomAgents ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="bg-white dark:bg-[#2d3545] border border-gray-200 dark:border-[#3d4555] rounded-2xl p-5 animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-2/3" />
                              <div className="h-3 bg-gray-100 rounded w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredCustomAgents.map((agent) => {
                          const isSelected = currentCustomAgentId === agent.id

                          // Generate consistent colors per agent based on name (rich teal, blue, purple)
                          const getAgentColors = (agentName: string) => {
                            const colorPalettes = [
                              ['#2d4a3e', '#215a6d', '#3ca2a2', '#92c7a3', '#c8dfd0'],  // Deep forest to sage
                              ['#1e4d5b', '#2c7a7b', '#319795', '#4fd1c5', '#9ae6e1'],  // Deep teal to aqua
                              ['#4a5568', '#667eea', '#5a67d8', '#7c3aed', '#a78bfa'],  // Slate to purple
                              ['#1e3a5f', '#2563eb', '#3b82f6', '#06b6d4', '#67e8f9'],  // Navy to cyan
                              ['#2d3748', '#4c51bf', '#5a67d8', '#667eea', '#9f7aea'],  // Charcoal to indigo
                              ['#234e52', '#0d9488', '#14b8a6', '#5eead4', '#99f6e4'],  // Deep teal to mint
                              ['#374151', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],  // Gray to lavender
                              ['#1f2937', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],  // Dark to emerald
                            ]
                            // Create consistent hash from agent name
                            const hash = agentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                            return colorPalettes[hash % colorPalettes.length]
                          }

                          const agentColors = getAgentColors(agent.name)

                          return (
                            <button
                              key={agent.id}
                              onClick={() => handleAgentChange('custom', agent.id, agent)}
                              className={cn(
                                "group relative overflow-hidden rounded-2xl transition-all duration-200",
                                "bg-white dark:bg-[#2d3545] dark:hover:bg-[#3d4555] border p-5 text-left flex flex-col h-full",
                                "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                                isSelected
                                  ? "border-purple-500 shadow-lg shadow-purple-100 ring-2 ring-purple-500"
                                  : "border-gray-200 dark:border-[#3d4555] shadow-sm"
                              )}
                            >
                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="absolute top-3 right-3">
                                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              )}

                              {/* Beautiful Gradient Avatar */}
                              <div className="w-12 h-12 mb-4 shadow-md overflow-hidden" style={{ borderRadius: '6px' }}>
                                <div style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '6px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '6px'
                                  }}>
                                    <Avatar
                                      size={48}
                                      name={agent.name}
                                      variant="marble"
                                      colors={agentColors}
                                      square={true}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Name & Description */}
                              <div className="space-y-1 mb-4">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{agent.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{agent.description || 'Custom agent'}</p>
                              </div>

                              {/* Bottom Section - Pushed to bottom */}
                              <div className="mt-auto space-y-3">
                                {/* Tags */}
                                {agent.tags && agent.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {agent.tags.slice(0, 2).map((tag: string) => (
                                      <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  <span className="text-[10px] text-gray-400 dark:text-gray-400">Ready</span>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingCustomAgents && filteredBuiltInAgents.length === 0 && filteredCustomAgents.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No agents found</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search term</p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* Start Chat Modal */}
        <Dialog open={showStartChatModal} onOpenChange={setShowStartChatModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Start Chat</DialogTitle>
              <DialogDescription>
                {selectedAgent === 'sophia' && !selectedKnowledgeBase
                  ? "Select a knowledge base to begin chatting with Sophia"
                  : selectedAgent === 'clavis' && !selectedCodebase
                    ? "Select a codebase to begin chatting with Clavis"
                    : selectedAgent === 'analytica' && !isBucketSelected
                      ? "Select a data bucket to begin chatting with Analytica"
                      : currentCustomAgentId && customAgentName
                        ? `Ready to chat with ${customAgentName}`
                        : `Ready to chat with ${selectedAgent ? AGENT_TILES.find(a => a.id === selectedAgent)?.name || selectedAgent : 'agent'}`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Agent Info */}
              {selectedAgent && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  {currentCustomAgentId && customAgentName ? (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{customAgentName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 ">Custom Agent</p>
                      </div>
                    </>
                  ) : (
                    (() => {
                      const agent = AGENT_TILES.find(a => a.id === selectedAgent)
                      if (!agent) return null
                      return (
                        <>
                          <div className="w-12 h-12 shadow-md overflow-hidden" style={{ borderRadius: '6px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '6px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '6px'
                              }}>
                                <Avatar
                                  size={48}
                                  name={agent.name}
                                  variant={AGENT_CONFIGS[agent.id as keyof typeof AGENT_CONFIGS]?.variant || 'marble'}
                                  colors={[...(AGENT_CONFIGS[agent.id as keyof typeof AGENT_CONFIGS]?.colors || ['#667eea', '#764ba2'])]}
                                  square={true}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 ">{agent.subtitle}</p>
                          </div>
                        </>
                      )
                    })()
                  )}
                </div>
              )}

              {/* Source Selection Info */}
              {selectedAgent === 'sophia' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Knowledge Base</label>
                  {selectedKnowledgeBase && selectedKnowledgeBaseName ? (
                    <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedKnowledgeBaseName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleKnowledgeBaseChange}
                        className="text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleKnowledgeBaseChange}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Select Knowledge Base
                    </Button>
                  )}
                </div>
              )}

              {selectedAgent === 'clavis' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Codebase</label>
                  {selectedCodebase && selectedCodebaseName ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedCodebaseName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCodebaseChange}
                        className="text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCodebaseChange}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Select Codebase
                    </Button>
                  )}
                </div>
              )}

              {selectedAgent === 'analytica' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Data Bucket</label>
                  {isBucketSelected ? (
                    <div className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedBucketName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBucketChange}
                        className="text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleBucketChange}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      Select Data Bucket
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Start Chat Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowStartChatModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartChat}
                disabled={
                  (selectedAgent === 'sophia' && !selectedKnowledgeBase) ||
                  (selectedAgent === 'clavis' && !selectedCodebase) ||
                  (selectedAgent === 'analytica' && !isBucketSelected)
                }
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Start Chat
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Knowledge Base Selector Modal for Sophia */}
        <KnowledgeBaseSelector
          open={showKnowledgeBaseSelector}
          onOpenChange={setShowKnowledgeBaseSelector}
          onSelect={handleKnowledgeBaseSelect}
          selectedKnowledgeBaseId={selectedKnowledgeBase}
        />

        {/* Codebase Selector Modal for Clavis */}
        <CodebaseSelector
          open={showCodebaseSelector}
          onOpenChange={setShowCodebaseSelector}
          onSelect={handleCodebaseSelect}
          selectedCodebaseId={selectedCodebase}
        />

        {/* Bucket Selector Modal for Analytica */}
        <BucketSelector
          open={showBucketSelector}
          onOpenChange={setShowBucketSelector}
          onSelect={handleBucketSelect}
          selectedBucketId={selectedBucket}
        />

        {/* Beta Badge - Bottom Right Corner */}
        <div className="fixed bottom-6 right-6 z-50">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
            Beta v0.9
          </Badge>
        </div>
      </div >
    </TooltipProvider >
  )
}
