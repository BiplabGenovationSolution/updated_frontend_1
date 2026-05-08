// frontend/src/components/chat/ChatInterface.tsx
'use client'

import { useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useTasks } from '@/hooks/useTasks'
import { useToast } from '@/hooks/use-toast'
import { ChatProvider } from '@/context/ChatContext'
import { useChatContext } from '@/context/chat-context'
import { SophiaChat } from './agents/SophiaChat'
import { AegisChat } from './agents/AegisChat'
import { ClavisChat } from './agents/ClavisChat'
import { AnalyticaChat } from './agents/AnalyticaChat'
import { CustomAgentChat } from './agents/CustomAgentChat'
import { SimpleAskAnything } from './SimpleAskAnything'
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'
import { CodebaseSelector } from '@/components/clavis/CodebaseSelector'
import type { AgentType } from '@/lib/types'
import { DIRECT_BACKEND_URL } from '@/lib/constants'

interface ChatInterfaceProps {
  chatId: string | null
  onChatCreated: (chatId: string) => void
  initialMessage?: string
  initialAgent?: AgentType
  initialTool?: string
  initialKnowledgeBase?: string | null
  initialCustomAgentName?: string | null
}

function ChatInterfaceContent({ chatId, initialMessage }: { chatId: string | null; initialMessage?: string }) {
  const {
    selectedAgent,
    setSelectedAgent,
    sendMessage,
    showKnowledgeBaseSelector,
    setShowKnowledgeBaseSelector,
    showCodebaseSelector,
    setShowCodebaseSelector,
    setSelectedKnowledgeBase,
    setSelectedKnowledgeBaseName,
    setSelectedCodebase,
    setSelectedCodebaseName,
    setSelectedBucket,
    setSelectedBucketName,
    setSelectedTool,
    setSelectedSubtool,
    selectedKnowledgeBase,
    selectedCodebase,
    customAgentId,
    setCustomAgentId,
    customAgentName,
    setCustomAgentName,
    setCustomAgentMetadata
  } = useChatContext()

  const { createTask } = useTasks({ autoFetch: false })
  const { toast } = useToast()

  // Load chat data and restore agent state when chatId changes
  useEffect(() => {
    if (chatId && typeof window !== 'undefined') {
      const loadChatData = async () => {
        try {
          console.log('🔄 Loading chat data to restore agent state for:', chatId)
          const response = await fetch(`${DIRECT_BACKEND_URL}/chats/${chatId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('mentis_auth_token')}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            // Backend returns { success: true, chat: {...} } for single chat
            let chatData = data.chat || data.data || data

            console.log('🔍 DEBUG: Before metadata extraction:', {
              has_metadata: !!chatData.metadata,
              metadata_custom_agent_id: chatData.metadata?.custom_agent_id,
              customAgentId: chatData.customAgentId
            })

            // CRITICAL FIX: Extract custom_agent_id from metadata if not at top level
            if (chatData.metadata?.custom_agent_id && !chatData.customAgentId) {
              console.log('🔧 Extracting custom_agent_id from metadata!')
              chatData = {
                ...chatData,
                customAgentId: chatData.metadata.custom_agent_id,
                customAgentName: chatData.metadata.custom_agent_name
              }
            }

            console.log('✅ Chat data loaded:', {
              agentType: chatData.agentType,
              customAgentId: chatData.customAgentId,
              metadata_custom_agent_id: chatData.metadata?.custom_agent_id,
              metadata: chatData.metadata
            })

            // Restore agent type from chat data
            if (chatData.agentType) {
              console.log('🤖 Restoring agent to:', chatData.agentType)
              setSelectedAgent(chatData.agentType)

              // Restore custom agent ID from top-level field (primary) or metadata (fallback)
              if (chatData.agentType === 'custom') {
                const customAgentIdValue = chatData.customAgentId || chatData.metadata?.custom_agent_id
                if (customAgentIdValue) {
                  console.log('🤖 Restoring custom agent ID:', customAgentIdValue)
                  setCustomAgentId(customAgentIdValue)

                  const customAgentNameValue = chatData.customAgentName || chatData.metadata?.custom_agent_name
                  if (customAgentNameValue) {
                    setCustomAgentName(customAgentNameValue)
                  }

                  // ✅ NEW: Fetch full agent metadata to ensure fresh info (even if deleted)
                  // This prevents stale metadata from previous chats
                  apiClient.getCustomAgent(customAgentIdValue)
                    .then(response => {
                      if (response.success && response.data) {
                        const agent = response.data.agent || response.data
                        console.log('🤖 Fetched fresh agent metadata:', agent.name)
                        setCustomAgentMetadata(agent)
                      }
                    })
                    .catch(err => console.error('❌ Failed to fetch agent metadata:', err))
                } else {
                  console.warn('⚠️ Custom agent chat but no customAgentId found in chat data')
                }
              }

              // Restore knowledge base for Sophia
              if (chatData.agentType === 'sophia' && chatData.metadata?.knowledge_base_id) {
                console.log('📚 Restoring knowledge base:', chatData.metadata.knowledge_base_id)
                setSelectedKnowledgeBase(chatData.metadata.knowledge_base_id)
                if (chatData.metadata.knowledge_base_name) {
                  setSelectedKnowledgeBaseName(chatData.metadata.knowledge_base_name)
                }
              }

              // Restore codebase for Clavis
              if (chatData.agentType === 'clavis' && chatData.metadata?.codebase_id) {
                console.log('💻 Restoring codebase:', chatData.metadata.codebase_id)
                setSelectedCodebase(chatData.metadata.codebase_id)
                if (chatData.metadata.codebase_name) {
                  setSelectedCodebaseName(chatData.metadata.codebase_name)
                }
              }

              // Restore bucket for Analytica
              if (chatData.agentType === 'analytica' && chatData.metadata?.bucket_id) {
                console.log('🗄️ Restoring bucket:', chatData.metadata.bucket_id)
                setSelectedBucket(chatData.metadata.bucket_id)
                if (chatData.metadata.bucket_name) {
                  setSelectedBucketName(chatData.metadata.bucket_name)
                }
              }

              // Restore tool/subtool for Aegis
              if (chatData.agentType === 'aegis') {
                if (chatData.metadata?.selected_tool) {
                  console.log('🔧 Restoring tool:', chatData.metadata.selected_tool)
                  setSelectedTool(chatData.metadata.selected_tool)
                }
                if (chatData.metadata?.selected_subtool) {
                  console.log('🔧 Restoring subtool:', chatData.metadata.selected_subtool)
                  setSelectedSubtool(chatData.metadata.selected_subtool)
                }
              }

              // Restore data sources from metadata
              if (chatData.metadata) {
                if (chatData.metadata.knowledge_base_id) {
                  setSelectedKnowledgeBase(chatData.metadata.knowledge_base_id)
                  if (chatData.metadata.knowledge_base_name) {
                    setSelectedKnowledgeBaseName(chatData.metadata.knowledge_base_name)
                  }
                }
                if (chatData.metadata.codebase_id) {
                  setSelectedCodebase(chatData.metadata.codebase_id)
                  if (chatData.metadata.codebase_name) {
                    setSelectedCodebaseName(chatData.metadata.codebase_name)
                  }
                }
                if (chatData.metadata.bucket_id) {
                  setSelectedBucket(chatData.metadata.bucket_id)
                  if (chatData.metadata.bucket_name) {
                    setSelectedBucketName(chatData.metadata.bucket_name)
                  }
                }
                if (chatData.metadata.tool) {
                  setSelectedTool(chatData.metadata.tool)
                }
                if (chatData.metadata.subtool) {
                  setSelectedSubtool(chatData.metadata.subtool)
                }
              }
            }
          } else {
            console.error('❌ Failed to load chat data:', response.status)
          }
        } catch (error) {
          console.error('❌ Error loading chat data:', error)
        }
      }

      loadChatData()
    }
  }, [chatId, setSelectedAgent, setCustomAgentId, setCustomAgentName, setSelectedKnowledgeBase, setSelectedKnowledgeBaseName, setSelectedCodebase, setSelectedCodebaseName, setSelectedBucket, setSelectedBucketName, setSelectedTool, setSelectedSubtool, setCustomAgentMetadata])

  // Check for pending message from sessionStorage and send it automatically
  useEffect(() => {
    if (chatId && typeof window !== 'undefined') {
      const pendingData = sessionStorage.getItem('pendingMessage')
      if (pendingData) {
        try {
          const parsed = JSON.parse(pendingData)
          const {
            chatId: pendingChatId,
            message,
            agent,
            knowledgeBase,
            knowledgeBaseName,
            codebase,
            codebaseName,
            bucket,
            bucketName,
            tool,
            subtool,
            customAgentId,
            customAgentName,
            customAgentMetadata
          } = parsed

          // Only send if it matches current chat
          if (pendingChatId === chatId) {
            console.log('📨 Found pending message, restoring state and sending:', {
              agent,
              knowledgeBase,
              knowledgeBaseName,
              codebase,
              codebaseName,
              bucket,
              bucketName,
              message: message.substring(0, 50)
            })

            // CRITICAL: Restore ALL state before sending message (including names for header display)
            if (agent) setSelectedAgent(agent)
            if (knowledgeBase) {
              setSelectedKnowledgeBase(knowledgeBase)
              if (knowledgeBaseName) setSelectedKnowledgeBaseName(knowledgeBaseName)
            }
            if (codebase) {
              setSelectedCodebase(codebase)
              if (codebaseName) setSelectedCodebaseName(codebaseName)
            }
            if (bucket) {
              setSelectedBucket(bucket)
              if (bucketName) setSelectedBucketName(bucketName)
            }
            if (tool) setSelectedTool(tool)
            if (subtool) setSelectedSubtool(subtool)
            if (customAgentId) {
              setCustomAgentId(customAgentId)
              if (customAgentName) setCustomAgentName(customAgentName)
              if (customAgentMetadata) setCustomAgentMetadata(customAgentMetadata)
            }

            // Clear the pending message
            sessionStorage.removeItem('pendingMessage')

            // Check if we should create a background task (for first deep research message)
            const backgroundTaskData = sessionStorage.getItem('createBackgroundTask')
            if (backgroundTaskData) {
              try {
                const { researchType, knowledgeBaseId } = JSON.parse(backgroundTaskData)
                sessionStorage.removeItem('createBackgroundTask')

                // Send the message and then create background task
                setTimeout(async () => {
                  console.log('📤 Sending pending message with restored state')
                  await sendMessage(message, chatId)

                  // Create background task after message is sent
                  console.log('🎯 Creating background task for first deep research message')
                  try {
                    const task = await createTask({
                      type: 'research',
                      config: {
                        query: message,
                        research_type: researchType,
                        knowledge_base_id: knowledgeBaseId
                      },
                      chat_id: chatId,
                      priority: 'normal',
                      metadata: {
                        source: 'aegis_research'
                      }
                    })

                    if (task) {
                      const estimatedTime = researchType === 'deep' ? '8-12 minutes' : '15-20 minutes'
                      toast({
                        title: 'Research Started in Background',
                        description: `${researchType.charAt(0).toUpperCase() + researchType.slice(1)} research is running (~${estimatedTime}). Check the tasks indicator in the sidebar for progress.`,
                        duration: 2000
                      })
                    }
                  } catch (error) {
                    console.error('Failed to start background research:', error)
                    toast({
                      title: 'Failed to Start Research',
                      description: 'Could not create background task. Please try again.',
                      variant: 'destructive',
                      duration: 2000
                    })
                  }
                }, 1000)
              } catch (error) {
                console.error('Failed to parse createBackgroundTask data:', error)
                sessionStorage.removeItem('createBackgroundTask')

                // Still send the message even if background task creation fails
                setTimeout(() => {
                  console.log('📤 Sending pending message with restored state')
                  sendMessage(message, chatId)
                }, 1000)
              }
            } else {
              // No background task needed, just send the message
              setTimeout(() => {
                console.log('📤 Sending pending message with restored state')
                sendMessage(message, chatId)
              }, 1000)
            }
          }
        } catch (error) {
          console.error('Failed to parse pending message:', error)
          sessionStorage.removeItem('pendingMessage')
        }
      }
    }
  }, [chatId, sendMessage, setSelectedAgent, setSelectedKnowledgeBase, setSelectedKnowledgeBaseName,
    setSelectedCodebase, setSelectedCodebaseName, setSelectedBucket, setSelectedBucketName,
    setSelectedTool, setSelectedSubtool, setCustomAgentId, setCustomAgentName, setCustomAgentMetadata])

  // Debug log for modal state changes
  useEffect(() => {
    console.log('🔍 ChatInterface modal state:', {
      showKnowledgeBaseSelector,
      showCodebaseSelector,
      selectedAgent,
      chatId
    })
  }, [showKnowledgeBaseSelector, showCodebaseSelector, selectedAgent, chatId])

  // Process initial message
  useEffect(() => {
    if (initialMessage && !chatId) {
      sendMessage(initialMessage, null)
    }
  }, [initialMessage, chatId])

  // Handler for knowledge base selection
  const handleKnowledgeBaseSelect = (kb: any) => {
    console.log('📚 Knowledge base selected in ChatInterface:', kb.name)
    setSelectedKnowledgeBase(kb.id)
    setSelectedKnowledgeBaseName(kb.name)
    setShowKnowledgeBaseSelector(false)
  }

  // Handler for codebase selection
  const handleCodebaseSelect = (codebase: any) => {
    console.log('💻 Codebase selected in ChatInterface:', codebase.repo_name)
    setSelectedCodebase(codebase.codebase_id)
    setSelectedCodebaseName(codebase.repo_name)
    setShowCodebaseSelector(false)
  }

  // Show SimpleAskAnything if no chat AND no selected agent
  // If there's a selected agent (from Start Chat flow), show the agent interface
  if (!chatId && !selectedAgent) {
    return (
      <>
        <SimpleAskAnything />

        {/* Global Selectors - always rendered at top level */}
        <KnowledgeBaseSelector
          open={showKnowledgeBaseSelector}
          onOpenChange={setShowKnowledgeBaseSelector}
          onSelect={handleKnowledgeBaseSelect}
          selectedKnowledgeBaseId={selectedKnowledgeBase}
        />

        <CodebaseSelector
          open={showCodebaseSelector}
          onOpenChange={setShowCodebaseSelector}
          onSelect={handleCodebaseSelect}
          selectedCodebaseId={selectedCodebase}
        />
      </>
    )
  }

  // Route to appropriate agent chat (works with or without chatId)
  // Check for custom agent first (takes precedence over built-in agents)
  if (customAgentId) {
    console.log('🤖 Routing to custom agent:', customAgentName || customAgentId)
    return <CustomAgentChat chatId={chatId} />
  }

  // Route to built-in agents
  switch (selectedAgent) {
    case 'sophia':
      return <SophiaChat chatId={chatId} />
    case 'aegis':
      return <AegisChat chatId={chatId} />
    case 'clavis':
      return <ClavisChat chatId={chatId} />
    case 'analytica':
      return <AnalyticaChat chatId={chatId} />
    case 'custom':
      // Custom agent selected but ID not loaded yet - show loading or wait for customAgentId
      // This happens when navigating to a custom agent chat from sidebar
      console.log('⏳ Custom agent selected, waiting for customAgentId to load from chat data')
      return <CustomAgentChat chatId={chatId} />
    default:
      return <SimpleAskAnything />
  }
}

export function ChatInterface({
  chatId,
  initialMessage,
  initialAgent,
  initialTool = 'chat',
  initialKnowledgeBase = null,
  initialCustomAgentName = null
}: ChatInterfaceProps) {
  const actualChatId = chatId === 'null' || chatId === '' ? null : chatId

  return (
    <ChatProvider
      // Force remount when chatId changes to ensure fresh state (clears stream logs, resets agent)
      key={actualChatId || 'new-chat-session'}
      initialAgent={initialAgent}
      initialTool={initialTool}
      initialKnowledgeBase={initialKnowledgeBase}
      initialCustomAgentName={initialCustomAgentName}
    >
      <ChatInterfaceContent
        chatId={actualChatId}
        initialMessage={initialMessage}
      />
    </ChatProvider>
  )
}
