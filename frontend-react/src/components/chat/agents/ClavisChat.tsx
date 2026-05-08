// frontend/src/components/chat/agents/ClavisChat.tsx
'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChatContext } from '@/context/chat-context'
import { useChatMessages } from '@/hooks/useChatMessages'
import { ChatLayout } from '../shared/ChatLayout'
import { ClavisHeader } from '../headers/ClavisHeader'
import { MessageList } from '../shared/MessageList'
import { ChatInput } from '../ChatInput'
import { CodebaseSelector } from '@/components/clavis/CodebaseSelector'
import { apiClient } from '@/lib/api'

interface ClavisChatProps {
  chatId: string | null
  sidePanel?: ReactNode
  forcedCodebaseId?: string
  forcedCodebaseName?: string | null
  hideCodebaseSelector?: boolean
}

export function ClavisChat({ chatId, sidePanel, forcedCodebaseId, forcedCodebaseName, hideCodebaseSelector = false }: ClavisChatProps) {
  const {
    selectedCodebase,
    selectedCodebaseName,
    setSelectedCodebase,
    setSelectedCodebaseName,
    showCodebaseSelector,
    setShowCodebaseSelector,
    sendMessage,
    isProcessing,
    isStreaming,
    stopStream
  } = useChatContext()

  const { messages, isLoading } = useChatMessages(chatId)

  // ✅ NEW: Fetch chat data to get codebase info
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

  // ✅ NEW: Fetch codebases to get the codebase name
  const { data: codebasesData } = useQuery({
    queryKey: ['clavis-codebases'],
    queryFn: async () => {
      const response = await apiClient.getCodebases()
      return response.success ? response.data : []
    },
    staleTime: 300000,
  })

  // Force codebase for interactive workspace mode
  useEffect(() => {
    if (!forcedCodebaseId) return
    if (selectedCodebase !== forcedCodebaseId) {
      setSelectedCodebase(forcedCodebaseId)
    }
    if (forcedCodebaseName) {
      setSelectedCodebaseName(forcedCodebaseName)
    }
  }, [forcedCodebaseId, forcedCodebaseName, selectedCodebase, setSelectedCodebase, setSelectedCodebaseName])

  // ✅ NEW: Auto-load codebase from chat data when chat loads
  useEffect(() => {
    if (chatData && chatData.codebaseId && codebasesData) {
      console.log('🔄 Loading codebase from chat data:', {
        codebase_id: chatData.codebaseId,
        current_selected: selectedCodebase
      })

      // Only update if not already set or different
      if (selectedCodebase !== chatData.codebaseId) {
        setSelectedCodebase(chatData.codebaseId)

        // Find the codebase name from the codebases list
        const codebase = codebasesData.find(
          (cb: any) => cb.codebase_id === chatData.codebaseId
        )

        if (codebase) {
          console.log('✅ Found codebase:', codebase.repo_name)
          setSelectedCodebaseName(codebase.repo_name)
        }
      }
    }
  }, [chatData, codebasesData, selectedCodebase, setSelectedCodebase, setSelectedCodebaseName])

  // ✅ Auto-open codebase selector for new chats
  useEffect(() => {
    // If it's a new chat (!chatId) and no codebase is selected yet,
    // automatically open the selector to prompt the user.
    if (!hideCodebaseSelector && !chatId && !selectedCodebase) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowCodebaseSelector(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [chatId, selectedCodebase, setShowCodebaseSelector, hideCodebaseSelector])

  const handleSendMessage = async (content: string) => {
    // If no codebase is selected for the first message in a new chat,
    // open the selector to prompt user
    if (!hideCodebaseSelector && !chatId && selectedCodebase === null && messages.length === 0) {
      setShowCodebaseSelector(true)
      return
    }

    // Allow sending message (with or without codebase)
    await sendMessage(content, chatId)
  }

  const handleCodebaseSelect = (codebase: any) => {
    setSelectedCodebase(codebase.codebase_id)
    setSelectedCodebaseName(codebase.repo_name)
    setShowCodebaseSelector(false)
  }

  const isEmpty = messages.length === 0 && !isProcessing

  const chatInput = (
    <ChatInput
      onSendMessage={handleSendMessage}
      isLoading={isProcessing || isStreaming}
      onStopStream={chatId ? () => stopStream?.(chatId) : undefined}
      placeholder={
        selectedCodebaseName
          ? `Ask Clavis about ${selectedCodebaseName}...`
          : "Ask anything"
      }
    />
  )

  return (
    <>
      <ChatLayout
        header={
          <ClavisHeader
            codebase={selectedCodebase}
            codebaseName={selectedCodebaseName}
            onShowSelector={() => setShowCodebaseSelector(true)}
          />
        }
        messages={
          <MessageList
            messages={messages}
            isLoading={isLoading}
            chatId={chatId}
            agentType="clavis"
            agentDisplayName="Clavis"
            emptyStateInput={chatInput}
            agentDescription="Vision Intelligence - Advanced coding assistant with repository management, code search, and analysis"
          />
        }
        input={isEmpty ? null : chatInput}
        panel={sidePanel}
      />

      {!hideCodebaseSelector && (
        <CodebaseSelector
          open={showCodebaseSelector}
          onOpenChange={setShowCodebaseSelector}
          onSelect={handleCodebaseSelect}
          selectedCodebaseId={selectedCodebase}
        />
      )}
    </>
  )
}
