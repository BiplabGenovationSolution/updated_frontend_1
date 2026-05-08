// frontend/src/components/chat/agents/AegisChat.tsx
'use client'

import { useState, useEffect } from 'react'
import { useChatContext } from '@/context/chat-context'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useTasks } from '@/hooks/useTasks'
import { useToast } from '@/hooks/use-toast'
import { ChatLayout } from '../shared/ChatLayout'
import { AegisHeader } from '../headers/AegisHeader'
import { MessageList } from '../shared/MessageList'
import { ChatInput } from '../ChatInput'
import { AegisExecutionPanel } from '../AegisExecutionPanel'

interface AegisChatProps {
  chatId: string | null
}

export function AegisChat({ chatId }: AegisChatProps) {
  const {
    selectedTool,
    selectedSubtool,
    sendMessage,
    isProcessing,
    streamMessages,
    isStreaming,
    uploadFile,
    selectedKnowledgeBase,
    stopStream
  } = useChatContext()

  const { messages, isLoading } = useChatMessages(chatId)
  const { tasks, createTask } = useTasks({
    poll: true,
    pollInterval: 5000,
    autoFetch: true
  })
  const { toast } = useToast()

  // State for execution panel visibility and static sources
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false)
  const [staticSources, setStaticSources] = useState<{ content: string; sessionId: string; messageId: string; sources?: any[]; logs?: any[] } | null>(null)

  // Check for active research task for this chat
  const activeTask = tasks.find(t =>
    t.chat_id === chatId &&
    (t.status === 'queued' || t.status === 'running')
  )

  // Auto-open panel when streaming starts
  useEffect(() => {
    if (isStreaming && selectedTool === 'research') {
      setIsExecutionPanelOpen(true)
    }
  }, [isStreaming, selectedTool])

  // ✅ Panel stays open until user manually closes it (no auto-close)


  const handleSendMessage = async (content: string) => {
    // Clear previous static sources so the execution panel shows only the current research
    setStaticSources(null)

    // For deep or comprehensive research, automatically run in background
    if (
      selectedTool === 'research' &&
      (selectedSubtool === 'deep' || selectedSubtool === 'comprehensive')
    ) {
      if (!chatId) {
        // For first message, store flag to create background task after chat creation
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('createBackgroundTask', JSON.stringify({
            researchType: selectedSubtool,
            knowledgeBaseId: selectedKnowledgeBase
          }))
        }
        // Create the chat (will navigate to new chat page)
        await sendMessage(content, chatId)
        return
      }


      try {
        // Call sendMessage to get stream messages for execution panel
        // The backend should check if this is a deep research query and handle accordingly
        await sendMessage(content, chatId)

        // Create background task
        const task = await createTask({
          type: 'research',
          config: {
            query: content,
            research_type: selectedSubtool,
            knowledge_base_id: selectedKnowledgeBase
          },
          chat_id: chatId,
          priority: 'normal',
          metadata: {
            source: 'aegis_research'
          }
        })

        if (task) {
          const estimatedTime = selectedSubtool === 'deep' ? '8-12 minutes' : '15-20 minutes'

          toast({
            title: 'Research Started in Background',
            description: `${selectedSubtool.charAt(0).toUpperCase() + selectedSubtool.slice(1)} research is running (~${estimatedTime}). Check the tasks indicator in the sidebar for progress.`,
            duration: 2000
          })

          // Open execution panel to show progress
          setIsExecutionPanelOpen(true)
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
      return
    }

    // For quick research or other tools, send immediately
    await sendMessage(content, chatId)
  }

  const handleFileUpload = async (file: File, message: string) => {
    console.log('📎 File upload requested:', { file: file.name, chatId, message })

    if (!chatId) {
      // For new chats, we need to create the chat first
      console.log('⚠️ No chatId - need to create chat first')
      toast({
        title: 'Creating chat...',
        description: 'Creating a new chat session for file upload',
        duration: 2000
      })

      // Send a message to create the chat, then the file will be uploaded
      // The backend should handle this by creating the chat and processing the file
      try {
        await sendMessage(message || 'Analyze this file', null)
        // Note: After chat creation, we'd need the new chatId to upload
        // This is a limitation - for now, ask user to upload after chat is created
        toast({
          title: 'Chat Created',
          description: 'Please upload your file again now that the chat is ready',
          variant: 'default',
          duration: 2000
        })
      } catch (error) {
        console.error('Failed to create chat:', error)
        toast({
          title: 'Error',
          description: 'Failed to create chat for file upload',
          variant: 'destructive',
          duration: 2000
        })
      }
      return
    }

    // Upload file to existing chat
    await uploadFile(file, message, chatId)
  }

  // Handler for "View Sources" button click
  const handleViewSources = (messageContent: string, messageId: string, sources?: any[], logs?: any[]) => {
    console.log('🔍 View Sources clicked:', { messageId, contentLength: messageContent.length, sourcesCount: sources?.length, logsCount: logs?.length })

    // Parse the research sources from message content
    // Extract session ID if present
    const sessionMatch = messageContent.match(/\*\*Session ID\*\*:\s*`?([a-f0-9-]+)`?/i)
    const sessionId = sessionMatch ? sessionMatch[1] : ''

    // Try to parse as JSON first
    try {
      const jsonData = JSON.parse(messageContent)
      if (jsonData.sources && Array.isArray(jsonData.sources)) {
        console.log('📊 Found JSON sources:', jsonData.sources.length)
        // Set static sources data with JSON content
        setStaticSources({
          content: messageContent, // Keep the JSON string
          sessionId: jsonData.sessionId || sessionId,
          messageId,
          sources: sources || jsonData.sources,
          logs
        })
        setIsExecutionPanelOpen(true)
        return
      }
    } catch (e) {
      // Not JSON, continue with markdown parsing
      console.log('🔍 Not JSON, using markdown format')
    }

    // Set static sources data (markdown format) with structured sources and logs if available
    setStaticSources({
      content: messageContent,
      sessionId,
      messageId,
      sources,
      logs
    })

    // Open execution panel
    setIsExecutionPanelOpen(true)
  }



  // Show panel during active research, when there's an active background task, 
  // OR when explicitly opened via "View Sources"
  // Show panel when explicitly opened, or when there's an active background task
  // We don't force it open for streaming/messages anymore to allow user to close it
  const showExecutionPanel = isExecutionPanelOpen || !!activeTask

  const isEmpty = messages.length === 0 && !isProcessing

  const chatInput = (
    <ChatInput
      onSendMessage={handleSendMessage}
      onUploadFile={handleFileUpload}
      isLoading={isProcessing || isStreaming}
      onStopStream={chatId ? () => stopStream?.(chatId) : undefined}
      placeholder={
        selectedTool === 'research'
          ? "Enter your research question..."
          : "Ask anything"
      }
    />
  )

  return (
    <>
      <ChatLayout
        header={
          <AegisHeader
            tool={selectedTool}
          />
        }
        messages={
          <MessageList
            messages={messages}
            isLoading={isLoading}
            chatId={chatId}
            agentType="aegis"
            agentDisplayName="Aegis"
            onViewSources={handleViewSources}
            emptyStateInput={chatInput}
            agentDescription="Research Intelligence - Research and analysis agent with persistent memory, multiple personalities, and real-time messaging"
          />
        }
        input={isEmpty ? null : chatInput}
        panel={
          showExecutionPanel ? (
            <AegisExecutionPanel
              streamMessages={streamMessages as any}
              isStreaming={isStreaming}
              isVisible={true}
              staticSources={staticSources}
              activeTask={activeTask}
              onClose={() => {
                setIsExecutionPanelOpen(false)
                setStaticSources(null)
              }}
            />
          ) : undefined
        }
      />
    </>
  )
}
