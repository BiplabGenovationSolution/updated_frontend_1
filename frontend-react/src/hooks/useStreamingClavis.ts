/**
 * useStreamingClavis Hook
 * Handles SSE streaming for Clavis (Code Analysis Agent)
 */

import { useState, useCallback, useRef } from 'react'
import { clavisAPI, parseSSEStream } from '@/lib/api'

export interface ClavisStreamMessage {
  type: 'start' | 'progress' | 'delta' | 'sources' | 'completion' | 'error'
  content: string
  timestamp: string
  metadata?: any
}

export interface CodeSource {
  id: string
  repo_name: string
  file_path: string
  chunk_type: string
  function_name?: string
  class_name?: string
  content: string
  line_start: number
  line_end: number
  commit_hash: string
  distance: number
  similarity_score?: string
}

export interface ClavisStreamHandlers {
  onStart?: (data: any) => void
  onProgress?: (stage: string, message: string) => void
  onDelta?: (text: string) => void
  onSources?: (sources: CodeSource[]) => void
  onCompletion?: (data: any) => void
  onError?: (error: string) => void
}

export type ClavisMode = 'explain' | 'debug' | 'refactor' | 'document' | 'analyze'

export function useStreamingClavis() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<ClavisStreamMessage[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [sources, setSources] = useState<CodeSource[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((message: ClavisStreamMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  const startChat = useCallback(async (
    messageContent: string,
    codebaseId: string,
    chatId?: string,
    mode: ClavisMode = 'explain',
    handlers?: ClavisStreamHandlers
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
      const response = await clavisAPI.chat(
        {
          message: messageContent,
          codebase_id: codebaseId,
          mode,
          context_chunks: 5,
          temperature: 0.7
        },
        chatId
      )

      // Parse SSE stream with handlers
      await parseSSEStream(response, {
        onStart: (data) => {
          const msg: ClavisStreamMessage = {
            type: 'start',
            content: data.message || 'Processing code analysis',
            timestamp: new Date().toISOString(),
            metadata: data
          }
          addMessage(msg)
          handlers?.onStart?.(data)
        },

        onProgress: (data) => {
          const msg: ClavisStreamMessage = {
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
          const retrievedSources: CodeSource[] = data.sources || []
          setSources(retrievedSources)

          const msg: ClavisStreamMessage = {
            type: 'sources',
            content: `Found ${retrievedSources.length} code references`,
            timestamp: new Date().toISOString(),
            metadata: { sources: retrievedSources, count: data.count }
          }
          addMessage(msg)
          handlers?.onSources?.(retrievedSources)
        },

        onCompletion: (data) => {
          const msg: ClavisStreamMessage = {
            type: 'completion',
            content: data.response || currentResponse,
            timestamp: new Date().toISOString(),
            metadata: {
              codebase_id: data.codebase_id,
              repo_name: data.repo_name,
              mode: data.mode,
              sources_used: data.sources_used,
              response_time_ms: data.response_time_ms,
              chat_id: data.chat_id
            }
          }
          addMessage(msg)

          if (data.sources_used) {
            setSources(data.sources_used)
          }

          handlers?.onCompletion?.(data)
          setIsStreaming(false)
        },

        onError: (data) => {
          const errorMsg = data.error || 'Unknown error occurred'
          setError(errorMsg)

          const msg: ClavisStreamMessage = {
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
      const errorMessage = err.message || 'Failed to start Clavis chat'
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
