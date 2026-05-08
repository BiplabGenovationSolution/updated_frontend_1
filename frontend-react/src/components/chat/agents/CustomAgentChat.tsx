// frontend/src/components/chat/agents/CustomAgentChat.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useChatContext } from '@/context/chat-context'
import { useChatMessages } from '@/hooks/useChatMessages'
import { ChatLayout } from '../shared/ChatLayout'
import { MessageList } from '../shared/MessageList'
import { ChatInput } from '../ChatInput'
import { CustomAgentExecutionPanel } from '../CustomAgentExecutionPanel'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, ChevronsRight, ChevronsLeft } from 'lucide-react'
import { cn, deduplicateAgentName } from '@/lib/utils'

interface CustomAgentChatProps {
  chatId: string | null
}

interface ExecutionEvent {
  type: 'capability' | 'info' | 'error' | 'success'
  timestamp: string
  capability?: string
  message: string
  executionTime?: number
  success?: boolean
  metadata?: any
}

export function CustomAgentChat({ chatId }: CustomAgentChatProps) {
  const {
    customAgentName,
    customAgentMetadata,
    customAgentId,
    sendMessage,
    isProcessing
  } = useChatContext()

  const { messages, isLoading } = useChatMessages(chatId)
  const [showExecutionPanel, setShowExecutionPanel] = useState(false)
  const [isExecutionPanelCollapsed, setIsExecutionPanelCollapsed] = useState(false)
  const [isAgentDeleted, setIsAgentDeleted] = useState(false)
  const [isCheckingAgent, setIsCheckingAgent] = useState(true)

  // Check if custom agent is still active
  useEffect(() => {
    const checkAgentIsActive = async () => {
      console.log('🔍 Checking if custom agent is active')

      if (!customAgentId) {
        console.log('⚠️ No customAgentId provided')
        setIsCheckingAgent(false)

        // If messages have loaded but still no customAgentId, treat as deleted
        if (!isLoading && messages.length > 0) {
          console.warn('⚠️ Messages loaded but no customAgentId - treating as deleted agent')
          setIsAgentDeleted(true)
        }
        return
      }

      try {
        const { apiClient } = await import('@/lib/api')
        console.log('📡 Fetching custom agent status for:', customAgentId)

        // Fetch specific custom agent detail (includes deleted ones)
        const response = await apiClient.getCustomAgent(customAgentId)

        console.log('📥 Agent detail response:', response)

        if (response.success && response.data) {
          const agent = response.data.agent || response.data

          // Check if agent is active or deleted
          // status can be 'active', 'deleted', 'archived', etc.
          if (agent.status === 'active') {
            console.log('✅ Custom agent is active')
            setIsAgentDeleted(false)
          } else if (agent.status === 'deleted') {
            console.warn('⚠️ Custom agent is deleted')
            setIsAgentDeleted(true)
          } else {
            console.log(`ℹ️ Custom agent status: ${agent.status}`)
            setIsAgentDeleted(false) // archived or draft still allow viewing history
          }
        } else {
          console.error('❌ Failed to fetch agent details')
          setIsAgentDeleted(true)
        }
      } catch (error) {
        console.error('❌ Error checking custom agent:', error)
        setIsAgentDeleted(true)
      } finally {
        setIsCheckingAgent(false)
      }
    }

    checkAgentIsActive()
  }, [customAgentId]) // Removed redundant dependencies isLoading and messages.length

  const handleSendMessage = async (content: string) => {
    if (isAgentDeleted) {
      console.warn('⚠️ Cannot send message - agent is deleted')
      // Show toast notification
      const { toast } = await import('@/hooks/use-toast')
      toast({
        title: 'Agent Deleted',
        description: 'This custom agent has been deleted. You cannot send new messages.',
        variant: 'destructive',
        duration: 2000
      })
      return
    }
    await sendMessage(content, chatId)
  }

  // Inject initial message for new chats (chat mode only)
  const messagesWithInitial = useMemo(() => {
    // Only show initial message if:
    // 1. Agent has an initial_message
    // 2. There are no assistant messages yet (new chat)
    // 3. Interface type is 'chat' (not form/JSON modes)
    const isChatMode = !customAgentMetadata?.interface_type ||
      customAgentMetadata.interface_type === 'chat'

    if (
      customAgentMetadata?.initial_message &&
      !messages.some(msg => msg.sender === 'assistant') &&
      isChatMode
    ) {
      const initialMessage = {
        id: 'initial-greeting',
        content: customAgentMetadata.initial_message,
        sender: 'assistant' as const,
        created_at: new Date().toISOString(),
        chat_id: chatId || '',
        isInitialMessage: true,
        metadata: {
          custom_agent_id: customAgentMetadata.id || customAgentMetadata.agent_id,
          custom_agent_name: customAgentName
        }
      }
      return [initialMessage, ...messages]
    }
    return messages
  }, [messages, customAgentMetadata, customAgentName, chatId])

  // Parse execution events from messages (use original messages, not messagesWithInitial)
  const executionEvents = useMemo<ExecutionEvent[]>(() => {
    const events: ExecutionEvent[] = []

    messages.forEach((message) => {
      // Use 'sender' not 'role' - Message type uses sender field
      if (message.sender === 'assistant' && message.metadata) {
        const metadata = message.metadata

        // Check for capability execution
        if (metadata.capability_execution) {
          events.push({
            type: 'capability',
            timestamp: message.created_at || message.timestamp || new Date().toISOString(),
            capability: metadata.capability_name,
            message: metadata.execution_success
              ? `Successfully executed capability: ${metadata.capability_name}`
              : `Failed to execute capability: ${metadata.capability_name}`,
            executionTime: metadata.execution_time_ms,
            success: metadata.execution_success,
            metadata: {
              agent_id: metadata.custom_agent_id,
              agent_name: metadata.custom_agent_name,
              flow_id: metadata.flow_id,
              parameters: metadata.parameters,
              result: metadata.result,
              print_output: metadata.print_output,
              error: metadata.error
            }
          })
        }

        // Add general execution info
        if (metadata.execution_time_ms && !metadata.capability_execution) {
          events.push({
            type: 'info',
            timestamp: message.created_at || message.timestamp || new Date().toISOString(),
            message: `Response generated in ${metadata.execution_time_ms}ms`,
            executionTime: metadata.execution_time_ms,
            metadata: metadata
          })
        }

        // Add success events with content
        if (message.content && message.content.length > 100) {
          events.push({
            type: 'success',
            timestamp: message.created_at || message.timestamp || new Date().toISOString(),
            message: message.content,
            metadata: metadata
          })
        }
      }

      // Track errors
      if (message.sender === 'assistant' && message.content?.toLowerCase().includes('error')) {
        events.push({
          type: 'error',
          timestamp: message.created_at || message.timestamp || new Date().toISOString(),
          message: message.content,
          metadata: message.metadata
        })
      }
    })

    return events
  }, [messages])

  // Don't auto-show execution panel - let user click "View Execution" button
  // useEffect(() => {
  //   const hasCapabilityExecutions = executionEvents.some(e => e.type === 'capability')
  //   if (hasCapabilityExecutions && !showExecutionPanel) {
  //     setShowExecutionPanel(true)
  //   }
  // }, [executionEvents])

  // Handle view execution button click
  const handleViewExecution = () => {
    setShowExecutionPanel(true)
  }

  // Custom agent header component
  const CustomAgentHeader = () => {
    const agentDisplayName = deduplicateAgentName(customAgentName) || 'Custom Agent'

    return (
      <div className="flex items-center gap-3 w-full">
        <div className="w-[28px] h-[28px] rounded-[8px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0">
          <div className="w-[8px] h-[8px] bg-indigo-500 rounded-full" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">
            {agentDisplayName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/50 shadow-md dark:shadow-black/30 border border-gray-200/50 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 hover:shadow-lg dark:hover:shadow-black/40 transition-shadow duration-200">
            Custom Agent
          </span>
          {executionEvents.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExecutionPanel(!showExecutionPanel)}
              className="h-8 px-3"
            >
              {showExecutionPanel ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  View Execution
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (isCheckingAgent) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0d1117]">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-800 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Checking agent status...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state only while messages are initially loading
  // Don't block on customAgentId since it might be missing for deleted agents
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  const isEmpty = messages.length === 0 && !isProcessing

  const customChatInput = (
    <ChatInput
      onSendMessage={handleSendMessage}
      isLoading={isProcessing}
      placeholder="Ask anything"
    />
  )

  return (
    <div className="flex h-full overflow-hidden min-h-0">
      <div className={showExecutionPanel ? 'flex-1 min-h-0 overflow-hidden' : 'w-full'}>
        <ChatLayout
          header={<CustomAgentHeader />}
          messages={
            <MessageList
              messages={isEmpty ? messages : messagesWithInitial}
              isLoading={isLoading}
              chatId={chatId}
              agentType="custom" // Use custom agent type
              isReadOnly={isAgentDeleted}
              agentDisplayName={customAgentName || undefined}
              onViewSources={() => { }} // Custom agents don't have sources yet
              onViewExecution={handleViewExecution}
              emptyStateInput={customChatInput}
              agentDescription={customAgentMetadata?.description ? `Custom Agent - ${customAgentMetadata.description}` : undefined}
            />
          }
          input={
            isEmpty ? null : (
              isAgentDeleted ? (
                <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-sm">This custom agent has been deleted</p>
                      <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">
                        You can view the chat history, but you cannot send new messages.
                      </p>
                    </div>
                  </div>
                </div>
              ) : customChatInput
            )
          }
        />
      </div>
      {showExecutionPanel && (
        <div className={cn(
          "h-full transition-all duration-300 ease-in-out relative border-l border-slate-200 dark:border-slate-800",
          isExecutionPanelCollapsed ? "w-[100px]" : "w-96"
        )}>
          {/* Collapse/Expand Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsExecutionPanelCollapsed(!isExecutionPanelCollapsed)}
            className="absolute -left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white dark:bg-slate-900 shadow-md z-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
            title={isExecutionPanelCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isExecutionPanelCollapsed ? <ChevronsLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" /> : <ChevronsRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
          </Button>

          <CustomAgentExecutionPanel
            events={executionEvents}
            isExecuting={isProcessing}
            currentCapability={null}
            isVisible={showExecutionPanel}
            isCollapsed={isExecutionPanelCollapsed}
            onClose={() => setShowExecutionPanel(false)}
          />
        </div>
      )}
    </div>
  )
}
