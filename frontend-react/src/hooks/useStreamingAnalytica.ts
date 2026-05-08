/**
 * useStreamingAnalytica Hook
 * Handles SSE streaming for Analytica (Data Analysis Agent)
 */

import { useState, useCallback, useRef } from 'react'
import { analyticaAPI, parseSSEStream } from '@/lib/api'

export interface AnalyticaStreamMessage {
  type: 'start' | 'progress' | 'delta' | 'completion' | 'error'
  content: string
  timestamp: string
  metadata?: any
}

export interface AnalyticaStreamHandlers {
  onStart?: (data: any) => void
  onProgress?: (stage: string, message: string) => void
  onDelta?: (text: string) => void
  onCompletion?: (data: any) => void
  onError?: (error: string) => void
}

export function useStreamingAnalytica() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<AnalyticaStreamMessage[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [insights, setInsights] = useState<any[]>([])
  const [visualizations, setVisualizations] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((message: AnalyticaStreamMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  const startChat = useCallback(async (
    messageContent: string,
    chatId?: string,
    bucketId?: string,
    handlers?: AnalyticaStreamHandlers
  ) => {
    try {
      setIsStreaming(true)
      setError(null)
      setCurrentResponse('')
      setInsights([])
      setVisualizations([])
      setMessages([])

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // Start SSE stream
      const response = await analyticaAPI.chat(
        { message: messageContent },
        chatId,
        bucketId
      )

      // Parse SSE stream with handlers
      await parseSSEStream(response, {
        onStart: (data) => {
          const msg: AnalyticaStreamMessage = {
            type: 'start',
            content: data.message || 'Processing data analysis',
            timestamp: new Date().toISOString(),
            metadata: data
          }
          addMessage(msg)
          handlers?.onStart?.(data)
        },

        onProgress: (data) => {
          const msg: AnalyticaStreamMessage = {
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

        onCompletion: (data) => {
          const msg: AnalyticaStreamMessage = {
            type: 'completion',
            content: data.response || currentResponse,
            timestamp: new Date().toISOString(),
            metadata: {
              success: data.success,
              bucket_id: data.bucket_id,
              chat_id: data.chat_id,
              response_time_ms: data.response_time_ms,
              insights: data.insights,
              visualizations: data.visualizations,
              data_summary: data.data_summary
            }
          }
          addMessage(msg)

          if (data.insights) {
            setInsights(data.insights)
          }

          if (data.visualizations) {
            setVisualizations(data.visualizations)
          }

          handlers?.onCompletion?.(data)
          setIsStreaming(false)
        },

        onError: (data) => {
          const errorMsg = data.error || 'Unknown error occurred'
          setError(errorMsg)

          const msg: AnalyticaStreamMessage = {
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
      const errorMessage = err.message || 'Failed to start Analytica chat'
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
    setInsights([])
    setVisualizations([])
    setError(null)
    setIsStreaming(false)
  }, [])

  return {
    isStreaming,
    messages,
    currentResponse,
    insights,
    visualizations,
    error,
    startChat,
    stopStreaming,
    reset
  }
}
