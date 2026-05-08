// frontend/src/context/ChatContext.tsx
'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, chatAPI, parseSSEStream } from '@/lib/api'
import type { AgentType, AegisChatTool, Message } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { deduplicateAgentName } from '@/lib/utils'
import type { ChatContextType } from './chat-context'
import { ChatContext } from './chat-context'

interface ChatProviderProps {
  children: React.ReactNode
  initialAgent?: AgentType
  initialTool?: string
  initialKnowledgeBase?: string | null
  initialCustomAgentName?: string | null
}

export function ChatProvider({
  children,
  initialAgent,
  initialTool = 'chat',
  initialKnowledgeBase = null,
  initialCustomAgentName = null
}: ChatProviderProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Agent & Tool State
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(initialAgent || null)
  const [selectedTool, setSelectedTool] = useState(initialTool)
  const [selectedChatTool, setSelectedChatTool] = useState<AegisChatTool>('professional')
  const [selectedSubtool, setSelectedSubtool] = useState('quick')

  // Custom Agent State
  const [customAgentId, setCustomAgentId] = useState<string | null>(null)
  const [customAgentName, setCustomAgentName] = useState<string | null>(initialCustomAgentName || null)
  const [customAgentMetadata, setCustomAgentMetadata] = useState<any>(null)

  // Knowledge Base State (Sophia)
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string | null>(initialKnowledgeBase)
  const [selectedKnowledgeBaseName, setSelectedKnowledgeBaseName] = useState<string | null>(null)
  const [showKnowledgeBaseSelector, setShowKnowledgeBaseSelector] = useState(false)

  // Codebase State (Clavis)
  const [selectedCodebase, setSelectedCodebase] = useState<string | null>(null)
  const [selectedCodebaseName, setSelectedCodebaseName] = useState<string | null>(null)
  const [showCodebaseSelector, setShowCodebaseSelector] = useState(false)

  // Bucket State (Analytica)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [selectedBucketName, setSelectedBucketName] = useState<string | null>(null)
  const [showBucketSelector, setShowBucketSelector] = useState(false)

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    uploadProgress: 0,
    fileName: ''
  })

  // Interrupted Generation State
  const [wasInterrupted, setWasInterrupted] = useState(false)
  const [interruptedPrompt, setInterruptedPrompt] = useState('')
  const [partialResponse, setPartialResponse] = useState('')
  const lastPromptRef = useRef('')

  // Streaming State
  const [streamMessages, setStreamMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingStage, setStreamingStage] = useState('')
  const [streamingProgress, setStreamingProgress] = useState('')
  const [streamingVisualizations, setStreamingVisualizations] = useState<any[]>([])
  const [rawSSEEvents, setRawSSEEvents] = useState<Array<{ event: string, data: any }>>([])

  // On mount: clear any stale streaming/processing state left from a previous session
  // This handles the case where the user refreshes mid-stream
  useEffect(() => {
    // Reset in-memory streaming flags
    setIsStreaming(false)
    setIsProcessing(false)
    setStreamingContent('')
    setStreamingStage('')
    setStreamingProgress('')
    setStreamMessages([])
    setRawSSEEvents([])

    // Clean up any lingering window globals from a previous stream
    delete (window as any).__streamingMessageId
    delete (window as any).__streamingChatId

    // Strip stale isStreaming:true flags from ALL cached message queries
    // so the chat list doesn't show a stuck "streaming" message placeholder
    const cache = queryClient.getQueryCache()
    cache.findAll({ queryKey: ['messages'] }).forEach(query => {
      const data = query.state.data as any
      if (!data) return
      const messages = Array.isArray(data) ? data : (data?.messages || [])
      const hasStale = messages.some((m: any) => m.isStreaming || m.isOptimistic)
      if (hasStale) {
        const cleaned = messages
          .filter((m: any) => !m.isOptimistic) // remove optimistic placeholders
          .map((m: any) => ({ ...m, isStreaming: false }))
        queryClient.setQueryData(query.queryKey, Array.isArray(data) ? cleaned : { ...data, messages: cleaned })
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selectedAgent with initialAgent when it changes (e.g., when clicking chats from sidebar)
  useEffect(() => {
    if (initialAgent && initialAgent !== selectedAgent) {
      console.log('🔄 ChatProvider: Syncing agent from URL:', { from: selectedAgent, to: initialAgent })
      setSelectedAgent(initialAgent)
    }
  }, [initialAgent])

  useEffect(() => {
    if (initialCustomAgentName && initialCustomAgentName !== customAgentName) {
      console.log('🔄 ChatProvider: Syncing custom agent name from URL:', { from: customAgentName, to: initialCustomAgentName })
      setCustomAgentName(initialCustomAgentName)
    }
  }, [initialCustomAgentName])

  // Resolve Custom Agent ID from Name if needed
  useEffect(() => {
    const resolveAgentId = async () => {
      // Only run if we have a name but no ID (e.g. direct URL navigation)
      if (customAgentName && !customAgentId) {
        console.log('🔍 ChatProvider: Resolving custom agent ID for name:', customAgentName)
        try {
          const response = await apiClient.getCustomAgents({
            status: 'active',
            limit: 100 // Fetch enough to find the agent
          })

          if (response.success && response.data) {
            const agents = response.data.agents || response.data
            const foundAgent = agents.find((a: any) =>
              a.name.toLowerCase() === customAgentName.toLowerCase()
            )

            if (foundAgent) {
              console.log('✅ ChatProvider: Resolved custom agent ID:', foundAgent.id)
              setCustomAgentId(foundAgent.id)
              setCustomAgentMetadata(foundAgent)
            } else {
              console.warn('⚠️ ChatProvider: Could not find custom agent with name:', customAgentName)
              toast({
                title: 'Agent Not Found',
                description: `Could not find active agent: ${customAgentName}`,
                variant: 'destructive',
                duration: 2000
              })
            }
          }
        } catch (error) {
          console.error('❌ ChatProvider: Error resolving custom agent:', error)
        }
      }
    }

    resolveAgentId()
  }, [customAgentName, customAgentId])

  // Clear stream messages
  const clearStreamMessages = useCallback(() => {
    setStreamMessages([])
    setIsStreaming(false)
  }, [])

  // Reset streaming state
  const resetStreaming = useCallback(() => {
    setIsStreaming(false)
    setStreamingContent('')
    setStreamingStage('')
    setStreamingProgress('')
    setStreamingVisualizations([])
    setRawSSEEvents([])
  }, [])

  // Interrupted generation helpers
  const clearInterrupted = useCallback(() => {
    setWasInterrupted(false)
    setInterruptedPrompt('')
    setPartialResponse('')
  }, [])

  const setLastPrompt = useCallback((prompt: string) => {
    lastPromptRef.current = prompt
  }, [])







  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      chatId
    }: {
      content: string
      chatId: string | null
    }) => {
      console.log('🚀 Send message mutation started:', {
        selectedAgent,
        chatId,
        hasKB: !!selectedKnowledgeBase,
        hasBucket: !!selectedBucket,
        hasCodebase: !!selectedCodebase
      })

      // If no chat exists, create one first
      if (!chatId) {
        const metadata: Record<string, any> = {
          agent_type: selectedAgent,
          tool: selectedTool,
          subtool: selectedSubtool
        }

        // Add agent-specific IDs to metadata
        if (selectedAgent === 'sophia' && selectedKnowledgeBase) {
          metadata.knowledge_base_id = selectedKnowledgeBase
        }

        if (selectedAgent === 'clavis' && selectedCodebase) {
          metadata.codebase_id = selectedCodebase
        }

        if (selectedAgent === 'analytica' && selectedBucket) {
          metadata.bucket_id = selectedBucket
        }

        // Add custom agent info to metadata
        if (customAgentId) {
          const safeName = deduplicateAgentName(customAgentName)
          metadata.custom_agent_id = customAgentId
          metadata.custom_agent_name = safeName
        }

        console.log('📝 Creating new chat with metadata:', metadata)

        // Create chat
        const chatResponse = await apiClient.createChat({
          title: content.slice(0, 50),
          agent_type: selectedAgent,
          knowledge_base_id: selectedAgent === 'sophia' ? selectedKnowledgeBase || undefined : undefined,
          codebase_id: selectedAgent === 'clavis' ? selectedCodebase || undefined : undefined,
          bucket_id: selectedAgent === 'analytica' ? selectedBucket || undefined : undefined,
          custom_agent_id: selectedAgent === 'custom' ? customAgentId || undefined : undefined,
          tool: selectedTool,
          subtool: selectedSubtool,
          metadata
        })

        // 🔍 DEBUG: Log the full response structure
        console.log('📦 Full createChat response:', JSON.stringify(chatResponse, null, 2))
        console.log('📦 chatResponse.data:', chatResponse.data)
        console.log('📦 chatResponse.data.id:', (chatResponse.data as any).id)

        if (!chatResponse.success || !chatResponse.data) {
          throw new Error(chatResponse.error || 'Failed to create chat')
        }

        // Extract chat ID from response.data.chat.id (backend returns nested structure)
        const newChatId = (chatResponse.data as any).chat?.id || (chatResponse.data as any).id
        console.log('✅ Chat created with ID:', newChatId)
        console.log('📝 Type of newChatId:', typeof newChatId, 'Value:', newChatId)

        if (!newChatId) {
          throw new Error('Failed to get chat ID from response')
        }

        // Store the initial message and agent info in sessionStorage for the new chat
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingMessage', JSON.stringify({
            chatId: newChatId,
            message: content,
            agent: selectedAgent,
            knowledgeBase: selectedKnowledgeBase,
            knowledgeBaseName: selectedKnowledgeBaseName,  // FIX: Store name for header display
            codebase: selectedCodebase,
            codebaseName: selectedCodebaseName,  // FIX: Store name for header display
            bucket: selectedBucket,
            bucketName: selectedBucketName,  // FIX: Store name for header display
            tool: selectedTool,
            subtool: selectedSubtool,
            customAgentId: customAgentId,  // FIX: Store custom agent info
            customAgentName: deduplicateAgentName(customAgentName),
            customAgentMetadata: customAgentMetadata
          }))
        }

        // FIXED: Do NOT invalidate cache here - it causes page refreshes!
        // Cache will be invalidated AFTER streaming completes in onCompletion handler
        // This prevents the bubble div from flashing and page from refreshing
        console.log('✅ New chat created - cache will be updated after streaming completes')

        // Navigate to new chat using React Router (no page refresh)
        // Include agent type in URL for proper agent routing
        const safeCustomAgentName = deduplicateAgentName(customAgentName)
        const basePath = selectedAgent === 'custom' && safeCustomAgentName
          ? `/agents/custom/${encodeURIComponent(safeCustomAgentName)}`
          : `/agents/${selectedAgent || 'sophia'}`
        const chatUrl = `${basePath}?id=${newChatId}`
        console.log('🔄 Navigating to new chat (client-side):', chatUrl)

        // Use React Router navigate instead of window.location.href
        navigate(chatUrl)

        return newChatId
      } else {
        // Send message to existing chat with SSE streaming
        console.log('📤 Sending message to existing chat:', chatId)
        setIsStreaming(true)
        setStreamingContent('')
        setStreamingStage('Initializing...')
        setStreamingProgress('Starting')
        setStreamMessages([]) // Clear previous stream messages
        setRawSSEEvents([]) // Clear previous SSE events
        setStreamingVisualizations([]) // Clear previous visualizations

        try {
          let response: Response

          // Handle custom agents
          if (customAgentId) {
            console.log('📤 Sending message to custom agent:', customAgentId, 'chat:', chatId)

            // Build conversation history from cache
            const cachedMessages = queryClient.getQueryData(['messages', chatId]) as any
            const existingMessages = cachedMessages?.messages || cachedMessages || []

            // Convert to custom agent message format
            // Exclude: optimistic messages, currently-streaming messages, and empty-content placeholders
            const conversationHistory = existingMessages
              .filter((msg: any) =>
                !msg.isOptimistic &&
                !msg.isStreaming &&
                msg.content?.trim()   // exclude empty streaming placeholders
              )
              .map((msg: any) => ({
                role: msg.sender as 'user' | 'assistant',
                content: msg.content
              }))

            // Add current message
            conversationHistory.push({ role: 'user' as const, content })

            console.log('📝 Conversation history:', conversationHistory.length, 'messages', 'chatId:', chatId)

            response = await apiClient.customAgents.chat(customAgentId, {
              messages: conversationHistory,
              chat_id: chatId,  // Pass chat_id for message persistence
              stream: true
            })
          } else if (selectedAgent === 'sophia' && selectedKnowledgeBase) {
            response = await apiClient.sophia.chat({
              message: content,
              chat_id: chatId,
              knowledge_base_id: selectedKnowledgeBase,
              include_sources: true,
              max_sources: 5,
              temperature: 0.7,
              include_context: true
            })
          } else if (selectedAgent === 'clavis' && selectedCodebase) {
            response = await apiClient.clavis.chat({
              message: content,
              codebase_id: selectedCodebase,
              mode: 'chat',
              context_chunks: 8
            }, chatId)
          } else if (selectedAgent === 'analytica' && selectedBucket) {
            response = await apiClient.analytica.chat({
              message: content
            }, chatId, selectedBucket)
          } else if (selectedAgent === 'aegis') {
            response = await apiClient.aegis.chat({
              message: content,
              chat_id: chatId,
              tool: selectedTool as any,
              subtool: selectedSubtool,
              personality: selectedChatTool as any,
              temperature: 0.7,
              include_context: true,
              stream_response: true
            })
          } else {
            throw new Error(`Agent ${selectedAgent} requires additional configuration`)
          }

          console.log('🔍 DEBUG: Response received:', {
            ok: response.ok,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            bodyUsed: response.bodyUsed
          })

          // Parse SSE stream and update optimistic message in cache
          console.log('🔍 DEBUG: About to call parseSSEStream')
          await parseSSEStream(response, {
            onStart: (data) => {
              console.log('🚀 Stream started (message_start):', data)
              setRawSSEEvents(prev => [...prev, { event: 'start', data }])

              // NEW BACKEND FORMAT: message_start event contains the message metadata
              if (data.id) {
                // Store message ID for delta accumulation
                (window as any).__streamingMessageId = data.id
                  (window as any).__streamingChatId = data.chatId || chatId

                // Add the assistant message to cache immediately
                queryClient.setQueryData(['messages', chatId], (old: any) => {
                  const messages = old?.messages || old || []

                  // Check if message already exists
                  const exists = messages.some((msg: any) => msg.id === data.id)
                  if (exists) {
                    return messages
                  }

                  // Add new streaming message
                  return [...messages, {
                    ...data,
                    content: '',  // Start with empty content
                    isStreaming: true,
                    isOptimistic: false
                  }]
                })

                setStreamingStage('Streaming response...')
              } else {
                // OLD FORMAT: just set stage
                setStreamingStage(data.message || 'Processing started')
              }
            },
            onDelta: (data) => {
              // Capture raw delta event
              setRawSSEEvents(prev => [...prev, { event: 'delta', data }])

              // Update optimistic message in cache for persistence
              const messageId = (window as any).__streamingMessageId
              const streamChatId = (window as any).__streamingChatId

              if (messageId && streamChatId) {
                queryClient.setQueryData(['messages', streamChatId], (old: any) => {
                  const messages = old?.messages || old || []
                  const updatedMessages = messages.map((msg: any) => {
                    if (msg.id === messageId) {
                      const newContent = msg.content + (data.delta || '')
                      return {
                        ...msg,
                        content: newContent,
                        isStreaming: true
                      }
                    }
                    return msg
                  })
                  return updatedMessages
                })
              }

              // ✅ DIRECT STREAMING: No buffer, immediate display
              setStreamingContent(prev => prev + (data.delta || ''))

              // Handle visualizations in delta event (if they come in chunks)
              if (data.visualizations && Array.isArray(data.visualizations) && data.visualizations.length > 0) {
                console.log('✅ Setting streaming visualizations from delta:', data.visualizations.length)
                setStreamingVisualizations(data.visualizations)
              }
            },
            onProgress: (data) => {
              // console.log('⏳ Progress:', data.stage, data.message)
              setRawSSEEvents(prev => [...prev, { event: 'progress', data }])
              setStreamingStage(data.message || '')
              setStreamingProgress(data.stage || '')
            },
            onSources: (data) => {
              // console.log('📚 onSources handler called with data:', data)
              // console.log('📚 Sources data keys:', Object.keys(data))
              // console.log('📚 Sources count:', data.count)
              // console.log('📚 Sources array length:', data.sources?.length)
              setRawSSEEvents(prev => [...prev, { event: 'sources', data }])
              setStreamingStage(`Retrieved ${data.count} sources`)

              // Store sources for display
              if (data.sources && Array.isArray(data.sources)) {
                const messageId = (window as any).__streamingMessageId
                const streamChatId = (window as any).__streamingChatId

                // console.log('📚 Storing sources in message:', { messageId, streamChatId })

                if (messageId && streamChatId) {
                  queryClient.setQueryData(['messages', streamChatId], (old: any) => {
                    const messages = old?.messages || old || []
                    return messages.map((msg: any) => {
                      if (msg.id === messageId) {
                        // console.log('📚 Updating message with sources:', msg.id)
                        return {
                          ...msg,
                          sources: data.sources
                        }
                      }
                      return msg
                    })
                  })
                }
              } else {
                console.warn('⚠️ No sources array in data:', data)
              }
            },
            onCompletion: (data) => {
              // console.log('✅ onCompletion handler called with data:', data)
              setRawSSEEvents(prev => [...prev, { event: 'completion', data }])

              // Guard against multiple completion calls
              const messageId = (window as any).__streamingMessageId
              const completionKey = `completion_${messageId}`
              if ((window as any)[completionKey]) {
                // console.log('⚠️ Completion already processed, skipping')
                return
              }
              (window as any)[completionKey] = true

              console.log('\n========== COMPLETION EVENT ==========');
              console.log('✅ Visualizations count:', data.visualizations?.length || 0);
              if (data.visualizations && data.visualizations.length > 0) {
                console.log('✅ Visualization data received from backend');
              }
              console.log('======================================\n');

              // Mark optimistic message as no longer streaming
              const streamChatId = (window as any).__streamingChatId

              // console.log('✅ Marking message as complete:', { messageId, streamChatId })

              if (messageId && streamChatId) {
                queryClient.setQueryData(['messages', streamChatId], (old: any) => {
                  const messages = old?.messages || old || []
                  const updatedMessages = messages.map((msg: any) => {
                    if (msg.id === messageId) {
                      // console.log('✅ Updated message streaming status:', msg.id)

                      // For custom agents, the response is in data.response
                      // For built-in agents, it may already be in msg.content from delta events
                      const finalContent = data.response || msg.content || ''

                      // Build metadata from completion data
                      const updatedMetadata = {
                        ...(msg.metadata || {}),
                        // Add Analytica-specific data from completion event
                        ...(data.visualizations && { visualizations: data.visualizations }),
                        ...(data.execution_output && { execution_output: data.execution_output }),
                        ...(data.code_generated && { code_generated: data.code_generated }),
                        ...(data.data_summary && { data_summary: data.data_summary }),
                        ...(data.insights && { insights: data.insights }),
                        ...(data.session_data && { session_data: data.session_data }),
                        // ✅ CRITICAL FIX: Persist research session ID if present
                        ...(data.research_session_id && { research_session_id: data.research_session_id }),
                        ...(data.tool && { tool_used: data.tool }),
                      }

                      console.log('\n========== CACHE UPDATE ==========');
                      console.log('✅ Message ID:', msg.id);
                      console.log('✅ Setting isStreaming to:', false);
                      console.log('✅ Research Session ID:', updatedMetadata.research_session_id);
                      console.log('✅ Visualizations in metadata:', updatedMetadata.visualizations?.length || 0);
                      console.log('==================================\n');

                      return {
                        ...msg,
                        content: finalContent,
                        isStreaming: false,
                        metadata: updatedMetadata  // ← Add metadata immediately!
                      }
                    }
                    return msg
                  })

                  // Return new array reference to force React Query to detect changes
                  return [...updatedMessages]
                })

                // ✅ FORCE RE-RENDER: Use setQueryData to trigger subscriber notification
                // Get current cache data and re-set it to force React Query to notify components
                console.log('✅ FORCING RE-RENDER for chat:', streamChatId)
                const cachedData = queryClient.getQueryData(['messages', streamChatId])
                if (cachedData) {
                  // Re-set the same data to force notification
                  queryClient.setQueryData(['messages', streamChatId], cachedData)
                  console.log('✅ Cache re-set complete - components should re-render')
                }
              }

              setStreamingStage('Complete')

              // ✅ CRITICAL: Delay setIsStreaming(false) to allow cache update to propagate
              // This gives React Query time to notify components before StreamingMessage disappears
              setTimeout(() => {
                setIsStreaming(false)
                console.log('✅ setIsStreaming(false) called - StreamingMessage should disappear, ChatMessage should appear')
              }, 100)

              // Don't call full resetStreaming() yet - let buffer finish
              // resetStreaming() will be called when buffer is empty (in useEffect)

              // NOW invalidate chat list cache AFTER streaming completes
              // This ensures new chats appear in sidebar without causing page refreshes
              queryClient.invalidateQueries({ queryKey: ['chats'] })
              // console.log('✅ Streaming complete - chat list cache invalidated')

              // ✅ CRITICAL FIX: Invalidate messages cache to fetch real messages from backend
              // This ensures optimistic messages are replaced with actual database messages
              // Delay slightly to allow completion to finish processing
              // REMOVED: Invalidation causes race conditions where messages disappear if backend is slow.
              // We rely on the local cache update from streaming which contains the real ID and content.
              if (streamChatId) {
                console.log('✅ Streaming complete for chat:', streamChatId)
              }

              // Clean up
              delete (window as any).__streamingMessageId
              delete (window as any).__streamingChatId
              delete (window as any)[`completion_${messageId}`] // Clean up guard
            },
            onError: (data) => {
              console.error('❌ Stream error:', data.error)
              resetStreaming()

              // Clean up
              delete (window as any).__streamingMessageId
              delete (window as any).__streamingChatId

              throw new Error(data.error)
            },
            onEvent: (event, data) => {
              // Handle research-specific events
              // console.log(`📡 SSE Event [${event}]:`, data)
              // console.log(`📡 Event data keys:`, Object.keys(data))
              // console.log(`📡 Event data structure:`, JSON.stringify(data, null, 2))

              const messageId = (window as any).__streamingMessageId
              const streamChatId = (window as any).__streamingChatId

              // CRITICAL FIX: Populate streamMessages for execution panel progress tracking
              // Skip 'delta' events - they are too granular (token-by-token) and flood the logs
              if (event !== 'delta') {
                const streamMessage = {
                  type: event as any,
                  content: data.delta || data.message || data.content || data.final_result || JSON.stringify(data),
                  timestamp: new Date().toISOString(),
                  metadata: data
                }

                setStreamMessages(prev => {
                  console.log('📊 Adding stream message for progress tracking:', streamMessage)
                  return [...prev, streamMessage as any]
                })
              }

              if (event === 'log' && data.message) {
                // Log messages - update progress
                console.log('✅ Processing log event with message:', data.message)
                setStreamingStage(data.message)
              } else if (event === 'message' && data.content) {
                // Message events - update content
                console.log('✅ Processing message event with content:', data.content)
                setStreamingStage(data.content)
              } else if (event === 'activity' && data.content) {
                // Activity events - update progress
                console.log('✅ Processing activity event with content:', data.content)
                setStreamingStage(data.content)
              } else if (event === 'output' && data.final_result) {
                // Final output - update message content
                console.log('✅ Processing output event')
                console.log(`📊 final_result size: ${data.final_result?.length} characters`)
                console.log(`📊 final_result preview (first 500 chars): ${data.final_result?.substring(0, 500)}`)
                console.log(`📊 final_result preview (last 500 chars): ${data.final_result?.substring(data.final_result.length - 500)}`)
                if (messageId && streamChatId) {
                  queryClient.setQueryData(['messages', streamChatId], (old: any) => {
                    // Handle both formats: flat array or wrapped in {messages: [...]}
                    const messages = Array.isArray(old) ? old : (old?.messages || [])

                    return messages.map((msg: any) => {
                      if (msg.id === messageId) {
                        console.log(`📊 Updating message ${msg.id} with content of ${data.final_result.length} chars`)
                        return {
                          ...msg,
                          content: data.final_result,
                          isStreaming: false
                        }
                      }
                      return msg
                    })
                  })

                  // Force re-render just like we do in onCompletion
                  const cachedData = queryClient.getQueryData(['messages', streamChatId])
                  if (cachedData) {
                    queryClient.setQueryData(['messages', streamChatId], cachedData)
                  }
                }

                // Set stream state to complete and hide the indicator
                setStreamingStage('Complete')
                setTimeout(() => {
                  setIsStreaming(false)
                  setIsProcessing(false) // Fix for stuck "Processing..." indicator
                }, 100)
              } else if (event === 'completion') {
                // Completion event - mark as complete
                // console.log('✅ Processing completion event', { messageId, streamChatId })
                setStreamingStage('Research completed successfully')
                setTimeout(() => {
                  setIsStreaming(false)
                  setIsProcessing(false) // Fix for stuck "Processing..." indicator
                }, 100)

                // Content is already updated via 'output' event - no need to refetch
                // Refetching causes unwanted page refreshes
                // console.log('✅ Completion processed - content already loaded via output event')
              } else if (event === 'delta' || event === 'progress' || event === 'sources') {
                // validation: these events are handled by specific handlers (onDelta, onProgress, onSources)
                // we ignore them here to prevent "unhandled event" warnings
              } else {
                console.warn(`⚠️ Unhandled event [${event}] or missing expected fields in data:`, data)
              }
            }
          })

          console.log('✅ Message sent successfully to existing chat')
          return chatId
        } catch (error) {
          resetStreaming()
          throw error
        }
      }
    },
    onMutate: async ({ content, chatId }) => {
      console.log('🔄 Starting message send with optimistic update...')
      setIsProcessing(true)

      // Track the current prompt so stopStream can reference it
      lastPromptRef.current = content
      // Clear any previous interrupted state when a new message starts
      setWasInterrupted(false)
      setInterruptedPrompt('')
      setPartialResponse('')

      if (!chatId) return // Skip optimistic update for new chats (will navigate away)

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] })

      // Snapshot previous messages for rollback
      const previousMessages = queryClient.getQueryData(['messages', chatId])

      // Optimistically add user message and placeholder assistant message
      const now = new Date().toISOString()
      const userMessageId = `temp-user-${Date.now()}`
      const assistantMessageId = `temp-assistant-${Date.now()}`

      console.log('🔄 [onMutate] Adding optimistic messages')

      queryClient.setQueryData(['messages', chatId], (old: any) => {
        // Handle both formats: flat array or wrapped in {messages: [...]}
        const existingMessages = Array.isArray(old) ? old : (old?.messages || [])

        console.log('📊 [onMutate] Existing messages:', {
          count: existingMessages.length,
          ids: existingMessages.map((m: any) => m.id),
          streamingCount: existingMessages.filter((m: any) => m.isStreaming).length
        })

        // ✅ CRITICAL FIX: Ensure all existing messages have isStreaming: false
        // This prevents MessageList from filtering them out when we add new optimistic messages
        const cleanedMessages = existingMessages.map((msg: any) => ({
          ...msg,
          isStreaming: false  // Force all existing messages to not be streaming
        }))

        if (existingMessages.some((m: any) => m.isStreaming)) {
          console.log('⚠️ [onMutate] Fixed streaming messages:',
            existingMessages.filter((m: any) => m.isStreaming).map((m: any) => m.id)
          )
        }

        // Always return flat array (useChatMessages expects this format after initial fetch)
        const newMessages = [
          ...cleanedMessages,
          // User message
          {
            id: userMessageId,
            content,
            sender: 'user',
            created_at: now,
            chat_id: chatId,
            isOptimistic: true
          },
          // Placeholder assistant message (will be updated as we stream)
          {
            id: assistantMessageId,
            content: '',
            sender: 'assistant',
            created_at: now,
            chat_id: chatId,
            isOptimistic: true,
            isStreaming: true,
            metadata: customAgentId ? {
              custom_agent_id: customAgentId,
              custom_agent_name: customAgentName
            } : undefined
          }
        ]

        console.log('✅ [onMutate] New cache state:', {
          count: newMessages.length,
          streamingCount: newMessages.filter((m: any) => m.isStreaming).length
        })

        return newMessages
      })

        // Store assistant message ID for streaming updates
        ; (window as any).__streamingMessageId = assistantMessageId
        ; (window as any).__streamingChatId = chatId

      return { previousMessages, userMessageId, assistantMessageId }
    },
    onSuccess: (chatId) => {
      console.log('✅ Message sent successfully - optimistic messages will persist in cache')

      // DO NOT invalidate cache here - it causes page refreshes during streaming
      // Cache invalidation for new chats happens immediately after chat creation (before navigation)
      // This ensures smooth ChatGPT-like streaming without interruptions

      // Optimistic messages will sync with backend when:
      // 1. User refreshes the page
      // 2. User navigates away and back
      // 3. WebSocket update (future)
    },
    onError: (error: any, variables, context) => {
      console.error('❌ Failed to send message:', error)

      // Rollback optimistic update
      if (context?.previousMessages && variables.chatId) {
        console.log('🔄 Rolling back optimistic update')
        queryClient.setQueryData(['messages', variables.chatId], context.previousMessages)
      }

      toast({
        title: 'Error',
        description: error?.message || 'Failed to send message',
        variant: 'destructive',
        duration: 2000
      })
    },
    onSettled: () => {
      console.log('🏁 Message send completed')
      setIsProcessing(false)
    }
  })

  // Upload File Mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({
      file,
      message,
      chatId
    }: {
      file: File
      message: string
      chatId: string
    }) => {
      console.log('📎 Upload file mutation started:', file.name)

      // Upload via Aegis with FormData (no base64 conversion needed)
      return await apiClient.aegis.uploadFile({
        file,
        message,
        chat_id: chatId,
        tool: 'data_analyzer',
        subtool: 'auto',
        auto_process: true,
        temperature: 0.7
      })
    },
    onMutate: ({ file }) => {
      console.log('📤 Starting file upload:', file.name)
      setUploadState({
        isUploading: true,
        uploadProgress: 0,
        fileName: file.name
      })
    },
    onSuccess: (response, { chatId, file, message }) => {
      console.log('✅ File uploaded successfully', response)

      // Show success message with file info if available
      const fileInfo = response.data?.file_info
      const description = fileInfo
        ? `${fileInfo.filename} (${fileInfo.file_type}) - ${(fileInfo.file_size / 1024).toFixed(1)} KB`
        : 'File uploaded and analyzed successfully'

      toast({
        title: 'Success',
        description,
        duration: 2000  
      })

      // Log file info for debugging
      if (fileInfo) {
        console.log('📊 File Info:', {
          filename: fileInfo.filename,
          type: fileInfo.file_type,
          size: fileInfo.file_size,
          columns: fileInfo.columns,
          shape: fileInfo.shape,
          processing_time: fileInfo.processing_time_ms
        })
      }

      // Add messages to cache so they appear in the UI
      if (response.data && chatId) {
        queryClient.setQueryData(['messages', chatId], (old: any) => {
          // Handle both formats: flat array or wrapped in {messages: [...]}
          const messages = Array.isArray(old) ? old : (old?.messages || [])

          // Add user message (file upload)
          const userMessage = {
            id: response.data.user_message_id,
            chat_id: chatId,
            sender: 'user',
            content: `${message}\n\n📎 Uploaded: ${file.name}`,
            created_at: new Date().toISOString(),
            metadata: {
              file_upload: true,
              filename: file.name,
              file_size: file.size
            }
          }

          // Add assistant message (analysis response)
          const assistantMessage = {
            id: response.data.message_id,
            chat_id: chatId,
            sender: 'assistant',
            content: response.data.response,
            created_at: new Date().toISOString(),
            metadata: {
              file_info: fileInfo,
              tool_used: response.data.tool_used,
              subtool_used: response.data.subtool_used,
              processing_time_ms: response.data.processing_time_ms
            }
          }

          // Always return flat array
          return [...messages, userMessage, assistantMessage]
        })

        // Invalidate to trigger a refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      }
    },
    onError: (error: any) => {
      console.error('❌ Failed to upload file:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload file',
        variant: 'destructive',
        duration: 2000
      })
    },
    onSettled: () => {
      console.log('🏁 File upload completed')
      setUploadState({
        isUploading: false,
        uploadProgress: 0,
        fileName: ''
      })
    }
  })

  // Send Message Handler
  const sendMessage = useCallback(async (content: string, chatId: string | null) => {
    console.log('📨 Send message handler called:', { content: content.slice(0, 50), chatId })
    await sendMessageMutation.mutateAsync({ content, chatId })
  }, [sendMessageMutation])

  // Upload File Handler
  const uploadFile = useCallback(async (file: File, message: string, chatId: string) => {
    console.log('📁 Upload file handler called:', file.name)
    await uploadFileMutation.mutateAsync({ file, message, chatId })
  }, [uploadFileMutation])

  // Stop Stream Handler
  const stopStream = useCallback(async (chatId: string) => {
    console.log('🛑 Stop stream requested for chat:', chatId)

    // Capture current streaming state before resetting
    const currentContent = streamingContent
    const currentPrompt = lastPromptRef.current

    try {
      await chatAPI.stopStream(chatId)
    } catch (error) {
      console.error('Failed to call stop-stream API:', error)
    } finally {
      // Always reset UI state, even if API fails
      resetStreaming()
      setIsProcessing(false)

      // Mark as interrupted if a prompt was in progress
      if (currentPrompt) {
        setWasInterrupted(true)
        setInterruptedPrompt(currentPrompt)
        setPartialResponse(currentContent)
      }
    }
  }, [resetStreaming, streamingContent])

  const value: ChatContextType = {
    // Agent & Tool Selection
    selectedAgent,
    setSelectedAgent,
    selectedTool,
    setSelectedTool,
    selectedChatTool,
    setSelectedChatTool,
    selectedSubtool,
    setSelectedSubtool,

    // Custom Agents
    customAgentId,
    setCustomAgentId,
    customAgentName,
    setCustomAgentName,
    customAgentMetadata,
    setCustomAgentMetadata,

    // Knowledge Base (Sophia)
    selectedKnowledgeBase,
    setSelectedKnowledgeBase,
    selectedKnowledgeBaseName,
    setSelectedKnowledgeBaseName,
    showKnowledgeBaseSelector,
    setShowKnowledgeBaseSelector,

    // Codebase (Clavis)
    selectedCodebase,
    setSelectedCodebase,
    selectedCodebaseName,
    setSelectedCodebaseName,
    showCodebaseSelector,
    setShowCodebaseSelector,

    // Bucket (Analytica)
    selectedBucket,
    setSelectedBucket,
    selectedBucketName,
    setSelectedBucketName,
    showBucketSelector,
    setShowBucketSelector,

    // Message Operations
    sendMessage,
    uploadFile,
    stopStream,
    isProcessing,
    uploadState,

    // Interrupted Generation
    wasInterrupted,
    interruptedPrompt,
    partialResponse,
    clearInterrupted,
    setLastPrompt,

    // Streaming
    streamMessages,
    isStreaming,
    streamingContent,
    streamingStage,
    streamingProgress,
    streamingVisualizations,
    rawSSEEvents,
    clearStreamMessages,
    resetStreaming,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
