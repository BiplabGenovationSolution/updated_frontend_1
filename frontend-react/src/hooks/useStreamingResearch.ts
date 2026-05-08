'use client'

import { useState, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { parseSSEStream } from '@/lib/api'

export interface StreamMessage {
  type: 'log' | 'output' | 'source' | 'sources' | 'files' | 'status' | 'activity' | 'message' | 'completion'
  content: string
  timestamp: string
  metadata?: any
}

const DIRECT_BACKEND_URL = import.meta.env.VITE_API_URL

export function useStreamingResearch() {
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [lastMessageHash, setLastMessageHash] = useState<string>('')

  const currentEventSourceRef = useRef<EventSource | null>(null)
  const { toast } = useToast()

  const generateMessageHash = (message: StreamMessage): string => {
    return `${message.type}-${message.content.substring(0, 50)}-${Math.floor(new Date(message.timestamp).getTime() / 1000)}`
  }

  const deduplicateMessages = (messages: StreamMessage[]): StreamMessage[] => {
    const seen = new Map<string, StreamMessage>()

    return messages.filter(message => {
      if (message.content === "Research in progress...") {
        const progressCount = messages.filter(m =>
          m.content === "Research in progress..." &&
          messages.indexOf(m) <= messages.indexOf(message)
        ).length

        if (progressCount % 5 !== 1) return false
      }

      const contentKey = `${message.type}-${message.content.trim().substring(0, 100)}`
      const existing = seen.get(contentKey)

      if (existing) {
        const timeDiff = Math.abs(
          new Date(message.timestamp).getTime() - new Date(existing.timestamp).getTime()
        )

        if (timeDiff < 2000) return false
      }

      seen.set(contentKey, message)
      return true
    })
  }

  const startResearch = useCallback(async (
    messageContent: string,
    chatId: string,
    subtool: string = 'quick'
  ) => {
    try {
      setIsStreaming(true)
      setStreamMessages([])
      setLastMessageHash('')

      const token = localStorage.getItem('mentis_auth_token')
      if (!token) {
        throw new Error("Authentication required for research mode")
      }

      // Clean up existing EventSource
      if (currentEventSourceRef.current) {
        currentEventSourceRef.current.close()
        currentEventSourceRef.current = null
      }

      const researchPayload = {
        message: messageContent,
        chat_id: chatId,
        tool: "research",
        subtool: subtool,
        knowledge_base_id: "",
        custom_agent_id: "",
        personality: "quirky",
        temperature: 0.7,
        include_context: true,
        execute_code: false,
        max_tokens: 4000,
        stream_response: true
      }

      console.log('🔬 Starting research:', researchPayload)

      const response = await fetch(`${DIRECT_BACKEND_URL}/aegis/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(researchPayload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Use parseSSEStream to handle all event types
      await parseSSEStream(response, {
        onEvent: (event: string, data: any) => {
          console.log(`📡 SSE Event received: ${event}`, data)

          // Handle each event type
          if (event === 'log' && data.message) {
            const streamMessage: StreamMessage = {
              type: 'log',
              content: data.message,
              timestamp: new Date().toISOString(),
              metadata: data
            }

            const messageHash = generateMessageHash(streamMessage)
            if (messageHash !== lastMessageHash) {
              setLastMessageHash(messageHash)
              setStreamMessages(prev => deduplicateMessages([...prev, streamMessage]))
            }
          }
          else if (event === 'message' && data.content) {
            const streamMessage: StreamMessage = {
              type: 'message',
              content: data.content,
              timestamp: new Date().toISOString(),
              metadata: data
            }

            const messageHash = generateMessageHash(streamMessage)
            if (messageHash !== lastMessageHash) {
              setLastMessageHash(messageHash)
              setStreamMessages(prev => deduplicateMessages([...prev, streamMessage]))
            }
          }
          else if (event === 'activity' && (data.message || data.content)) {
            const streamMessage: StreamMessage = {
              type: 'activity',
              content: data.message || data.content,
              timestamp: new Date().toISOString(),
              metadata: data
            }

            const messageHash = generateMessageHash(streamMessage)
            if (messageHash !== lastMessageHash) {
              setLastMessageHash(messageHash)
              setStreamMessages(prev => deduplicateMessages([...prev, streamMessage]))
            }
          }
          else if (event === 'output' && data.final_result) {
            const streamMessage: StreamMessage = {
              type: 'output',
              content: data.final_result,
              timestamp: new Date().toISOString(),
              metadata: data
            }

            setStreamMessages(prev => deduplicateMessages([...prev, streamMessage]))

            if (data.session_id) {
              setCurrentSession(data.session_id)
            }

            if (data.raw_dump) {
              const sourceMessage: StreamMessage = {
                type: 'source',
                content: data.raw_dump,
                timestamp: new Date().toISOString(),
                metadata: data
              }
              setStreamMessages(prev => deduplicateMessages([...prev, sourceMessage]))
            }
          }
          else if (event === 'sources' && (data.sources || data.citations)) {
            const streamMessage: StreamMessage = {
              type: 'sources',
              content: JSON.stringify(data.sources || data.citations, null, 2),
              timestamp: new Date().toISOString(),
              metadata: data
            }

            setStreamMessages(prev => deduplicateMessages([...prev, streamMessage]))
          }
          else if (event === 'completion') {
            console.log('🎉 Research completion event received')

            if (data.session_id) {
              setCurrentSession(data.session_id)
            }

            const completionMessage: StreamMessage = {
              type: 'completion',
              content: data.message || data.content || 'Research completed successfully!',
              timestamp: new Date().toISOString(),
              metadata: {
                sessionId: data.session_id,
                userMessageId: data.user_message_id,
                assistantMessageId: data.message_id
              }
            }

            setStreamMessages(prev => deduplicateMessages([...prev, completionMessage]))
            setIsStreaming(false)
          }
          else if (event === 'error') {
            console.error('❌ Error event received:', data)
            const errorMessage: StreamMessage = {
              type: 'log',
              content: `Error: ${data.error || data.message || 'Unknown error'}`,
              timestamp: new Date().toISOString(),
              metadata: data
            }
            setStreamMessages(prev => deduplicateMessages([...prev, errorMessage]))
          }
        }
      })

      console.log('✅ Research stream completed')
      setIsStreaming(false)

    } catch (error) {
      console.error('❌ Error in research streaming:', error)
      setIsStreaming(false)

      const errorMessage: StreamMessage = {
        type: 'log',
        content: `❌ Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }

      setStreamMessages(prev => deduplicateMessages([...prev, errorMessage]))

      toast({
        title: 'Research Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }, [toast, lastMessageHash])

  const clearResearch = useCallback(() => {
    setStreamMessages([])
    setCurrentSession(null)
    setLastMessageHash('')

    if (currentEventSourceRef.current) {
      currentEventSourceRef.current.close()
      currentEventSourceRef.current = null
    }
  }, [])

  return {
    streamMessages,
    isStreaming,
    currentSession,
    startResearch,
    clearResearch
  }
}