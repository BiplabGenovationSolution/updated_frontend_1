/**
 * useStreamingSophia Hook
 * Handles SSE streaming for Sophia (Knowledge Base RAG Agent)
 */

import { useState, useCallback, useRef } from 'react'
import { sophiaAPI, parseSSEStream } from '@/lib/api'

export interface SophiaStreamMessage {
  type: 'start' | 'progress' | 'delta' | 'sources' | 'completion' | 'error'
  content: string
  timestamp: string
  metadata?: any
}

export interface SophiaSource {
  document_id: string
  document_name: string
  chunk_index: number
  score: number
  content_preview: string
  metadata?: Record<string, any>
}

export interface SophiaStreamHandlers {
  onStart?: (data: any) => void
  onProgress?: (stage: string, message: string) => void
  onDelta?: (text: string) => void
  onSources?: (sources: SophiaSource[]) => void
  onCompletion?: (data: any) => void
  onError?: (error: string) => void
}

export function useStreamingSophia() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<SophiaStreamMessage[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [sources, setSources] = useState<SophiaSource[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((message: SophiaStreamMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  const startChat = useCallback(async (
    messageContent: string,
    chatId: string,
    knowledgeBaseId?: string,
    handlers?: SophiaStreamHandlers
  ) => {
    try {
      setIsStreaming(true)
      setError(null)
      setCurrentResponse('')
      setSources([])
      setMessages([])

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // Start SSE stream
      const response = await sophiaAPI.chat({
        message: messageContent,
        chat_id: chatId,
        knowledge_base_id: knowledgeBaseId,
        include_sources: true,
        max_sources: 5,
        include_context: true
      })

      // Parse SSE stream with handlers
      await parseSSEStream(response, {
        onStart: (data) => {
          const msg: SophiaStreamMessage = {
            type: 'start',
            content: data.message || 'Processing started',
            timestamp: new Date().toISOString(),
            metadata: data
          }
          addMessage(msg)
          handlers?.onStart?.(data)
        },

        onProgress: (data) => {
          const msg: SophiaStreamMessage = {
            type: 'progress',
            content: data.message || '',
            timestamp: new Date().toISOString(),
            metadata: { stage: data.stage }
          }
          addMessage(msg)
          handlers?.onProgress?.(data.stage, data.message)
        },

        onDelta: (data) => {
          const delta = data.delta || ''
          setCurrentResponse(prev => prev + delta)
          handlers?.onDelta?.(delta)
        },

        onSources: (data) => {
          const retrievedSources: SophiaSource[] = data.sources || []
          setSources(retrievedSources)

          const msg: SophiaStreamMessage = {
            type: 'sources',
            content: `Retrieved ${retrievedSources.length} sources`,
            timestamp: new Date().toISOString(),
            metadata: { sources: retrievedSources, count: data.count }
          }
          addMessage(msg)
          handlers?.onSources?.(retrievedSources)
        },

        onCompletion: (data) => {
          const msg: SophiaStreamMessage = {
            type: 'completion',
            content: data.full_response || currentResponse,
            timestamp: new Date().toISOString(),
            metadata: {
              message_id: data.message_id,
              user_message_id: data.user_message_id,
              response_time_ms: data.response_time_ms,
              sources: data.sources
            }
          }
          addMessage(msg)

          if (data.sources) {
            setSources(data.sources)
          }

          handlers?.onCompletion?.(data)
          setIsStreaming(false)
        },

        onError: (data) => {
          const errorMsg = data.error || 'Unknown error occurred'
          setError(errorMsg)

          const msg: SophiaStreamMessage = {
            type: 'error',
            content: errorMsg,
            timestamp: new Date().toISOString(),
            metadata: data
          }
          addMessage(msg)
          handlers?.onError?.(errorMsg)
          setIsStreaming(false)
        }
      })

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start Sophia chat'
      setError(errorMessage)
      handlers?.onError?.(errorMessage)
      setIsStreaming(false)
    }
  }, [addMessage, currentResponse])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setCurrentResponse('')
    setSources([])
    setError(null)
    setIsStreaming(false)
  }, [])

  return {
    isStreaming,
    messages,
    currentResponse,
    sources,
    error,
    startChat,
    stopStreaming,
    reset
  }
}
