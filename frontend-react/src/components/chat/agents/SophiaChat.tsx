// frontend/src/components/chat/agents/SophiaChat.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChatContext } from '@/context/chat-context'
import { useChatMessages } from '@/hooks/useChatMessages'
import { ChatLayout } from '../shared/ChatLayout'
import { SophiaHeader } from '../headers/SophiaHeader'
import { MessageList } from '../shared/MessageList'
import { ChatInput } from '../ChatInput'
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'
import { AegisExecutionPanel } from '../AegisExecutionPanel'
import { apiClient } from '@/lib/api'
import {
  transformSophiaSSEToStreamMessages,
  calculateSophiaProgress,
  type SSEEvent
} from '@/utils/sophiaStreamTransformer'

interface SophiaChatProps {
  chatId: string | null
}

export function SophiaChat({ chatId }: SophiaChatProps) {
  const {
    selectedKnowledgeBase,
    selectedKnowledgeBaseName,
    setSelectedKnowledgeBase,
    setSelectedKnowledgeBaseName,
    showKnowledgeBaseSelector,
    setShowKnowledgeBaseSelector,
    sendMessage,
    isProcessing,
    isStreaming,
    stopStream,
    rawSSEEvents
  } = useChatContext()

  const { messages, isLoading } = useChatMessages(chatId)

  // Execution panel state
  const [showExecutionPanel, setShowExecutionPanel] = useState(false)
  const [panelSources, setPanelSources] = useState<any[]>([])

  // Auto-open panel when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setShowExecutionPanel(true)
    }
  }, [isStreaming])

  // ✅ Panel stays open until user manually closes it (no auto-close)


  // Convert rawSSEEvents to SSEEvent format
  const sseEvents: SSEEvent[] = useMemo(() => {
    return rawSSEEvents.map(evt => ({
      event: evt.event,
      data: typeof evt.data === 'string' ? evt.data : JSON.stringify(evt.data)
    }))
  }, [rawSSEEvents])

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const calculated = calculateSophiaProgress(sseEvents)

    // ✅ FIX: Force to 100% when streaming completes
    // This prevents progress from getting stuck at intermediate values (like 42%)
    if (!isStreaming && sseEvents.length > 0) {
      console.log('⚠️ Streaming complete, forcing progress to 100%', {
        calculated,
        eventsCount: sseEvents.length
      })
      return 100
    }

    return calculated
  }, [sseEvents, isStreaming])

  // Transform SSE events to StreamMessages for execution panel
  const streamMessages = useMemo(() =>
    transformSophiaSSEToStreamMessages(sseEvents),
    [sseEvents]
  )

  // ✅ NEW: Fetch chat data to get knowledge base info
  const { data: chatData } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null
      const response = await apiClient.getChat(chatId)
      return response.success ? response.data : null
    },
    enabled: !!chatId,
    staleTime: 300000, // 5 minutes
  })

  // ✅ NEW: Fetch knowledge bases to get the KB name
  const { data: knowledgeBasesData } = useQuery({
    queryKey: ['knowledge_bases_all_false'],
    queryFn: async () => {
      const response = await apiClient.getKnowledgeBases(false)
      return response.success ? response.data : []
    },
    staleTime: 300000,
  })

  // ✅ NEW: Auto-load knowledge base from chat data when chat loads
  useEffect(() => {
    // The API might wrap the chat object inside a `chat` property
    const actualChat = (chatData as any)?.chat || chatData;
    const chatAny = actualChat as any;

    // Extract ID based on different possible backend formats
    const kbId = chatAny?.knowledge_base_id || actualChat?.knowledgeBaseId || actualChat?.metadata?.knowledge_base_id

    if (actualChat && kbId) {
      // 1. Set the ID if it's missing or different
      if (selectedKnowledgeBase !== kbId) {
        console.log('🔄 Loading knowledge base ID from chat data:', kbId)
        setSelectedKnowledgeBase(kbId)
      }

      // 2. Set the Name if we have the list and the name hasn't been set for this KB yet
      if (knowledgeBasesData && knowledgeBasesData.length > 0) {
        const kb = knowledgeBasesData.find(
          (k: any) => k.id === kbId || k.knowledge_base_id === kbId
        )

        if (kb && selectedKnowledgeBaseName !== kb.name) {
          console.log('✅ Found knowledge base name:', kb.name)
          setSelectedKnowledgeBaseName(kb.name)
        }
      }
    }
  }, [chatData, knowledgeBasesData, selectedKnowledgeBase, selectedKnowledgeBaseName, setSelectedKnowledgeBase, setSelectedKnowledgeBaseName])

  // ✅ Auto-open knowledge base selector for new chats
  useEffect(() => {
    // If it's a new chat (!chatId) and no knowledge base is selected yet,
    // automatically open the selector to prompt the user.
    if (!chatId && !selectedKnowledgeBase) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowKnowledgeBaseSelector(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [chatId, selectedKnowledgeBase, setShowKnowledgeBaseSelector])

  const handleSendMessage = async (content: string) => {
    // Check if knowledge base is selected before sending
    if (!selectedKnowledgeBase) {
      // Open knowledge base selector if not selected
      setShowKnowledgeBaseSelector(true)
      return // Don't send the message
    }

    // If KB is selected, send message normally
    await sendMessage(content, chatId)
  }

  const handleKnowledgeBaseSelect = (kb: any) => {
    setSelectedKnowledgeBase(kb.id)
    setSelectedKnowledgeBaseName(kb.name)
    setShowKnowledgeBaseSelector(false)
  }

  const handleViewResearch = (sources: any[]) => {
    setPanelSources(sources)
    setShowExecutionPanel(true)
  }

  const isEmpty = messages.length === 0 && !isProcessing

  const chatInput = (
    <ChatInput
      onSendMessage={handleSendMessage}
      isLoading={isProcessing || isStreaming}
      onStopStream={chatId ? () => stopStream?.(chatId) : undefined}
      placeholder={
        selectedKnowledgeBaseName
          ? `Ask Sophia about ${selectedKnowledgeBaseName}...`
          : "Ask anything"
      }
    />
  )

  return (
    <>
      <ChatLayout
        header={
          <SophiaHeader
            knowledgeBase={selectedKnowledgeBase}
            knowledgeBaseName={selectedKnowledgeBaseName}
            onShowSelector={() => setShowKnowledgeBaseSelector(true)}
          />
        }
        messages={
          <MessageList
            messages={messages}
            isLoading={isLoading}
            chatId={chatId}
            agentType="sophia"
            agentDisplayName="Sophia"
            onViewResearch={handleViewResearch}
            emptyStateInput={chatInput}
            agentDescription="Knowledge Intelligence - Chat agent with knowledge base integration - focused on conversational AI with real-time messaging"
          />
        }
        input={isEmpty ? null : chatInput}
        panel={
          showExecutionPanel ? (
            <AegisExecutionPanel
              streamMessages={streamMessages}
              isStreaming={isStreaming}
              isVisible={true}
              progressPercentage={progressPercentage}
              sources={panelSources.length > 0 ? panelSources : undefined}
              onClose={() => {
                setShowExecutionPanel(false)
                setPanelSources([])
              }}
            />
          ) : undefined
        }
      />

      <KnowledgeBaseSelector
        open={showKnowledgeBaseSelector}
        onOpenChange={setShowKnowledgeBaseSelector}
        onSelect={handleKnowledgeBaseSelect}
        selectedKnowledgeBaseId={selectedKnowledgeBase}
      />
    </>
  )
}
