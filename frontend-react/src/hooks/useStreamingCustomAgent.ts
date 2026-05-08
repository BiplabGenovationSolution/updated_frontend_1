/**
 * useStreamingCustomAgent Hook
 * Handles SSE streaming for Custom Agents
 */

import { useState, useCallback, useRef } from 'react'
import { customAgentsAPI, parseSSEStream } from '@/lib/api'

export interface CustomAgentStreamMessage {
  type: 'start' | 'progress' | 'delta' | 'tool_use' | 'completion' | 'error'
  content: string
  timestamp: string
  metadata?: any
}

export interface CustomAgentStreamHandlers {
  onStart?: (data: any) => void
  onProgress?: (stage: string, message: string) => void
  onDelta?: (text: string) => void
  onToolUse?: (tool: string, status: string) => void
  onCompletion?: (data: any) => void
  onError?: (error: string) => void
}

export function useStreamingCustomAgent() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<CustomAgentStreamMessage[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((message: CustomAgentStreamMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  const startChat = useCallback(async (
    agentId: string,
    messagesList: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    handlers?: CustomAgentStreamHandlers
  ) => {
    try {
      setIsStreaming(true)
      setError(null)
      setCurrentResponse('')
      setCurrentTool(null)
      setMessages([])

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // Start SSE stream
      const response = await customAgentsAPI.chat(agentId, {
        messages: messagesList,
        stream: true
      })

      // Parse SSE stream with handlers
      await parseSSEStream(response, {
        onStart: (data) => {
          const msg: CustomAgentStreamMessage = {
            type: 'start',
            content: data.message || 'Processing with custom agent',
            timestamp: new Date().toISOString(),
            metadata: data
          }
          addMessage(msg)
          handlers?.onStart?.(data)
        },

        onProgress: (data) => {
          const msg: CustomAgentStreamMessage = {
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
          const msg: CustomAgentStreamMessage = {
            type: 'completion',
            content: data.response || currentResponse,
            timestamp: new Date().toISOString(),
            metadata: {
              agent_id: data.agent_id,
              agent_name: data.agent_name,
              execution_time_ms: data.execution_time_ms,
              usage: data.usage
            }
          }
          addMessage(msg)
          handlers?.onCompletion?.(data)
          setIsStreaming(false)
        },

        onError: (data) => {
          const errorMsg = data.error || 'Unknown error occurred'
          setError(errorMsg)

          const msg: CustomAgentStreamMessage = {
            type: 'error',
            content: errorMsg,
            timestamp: new Date().toISOString(),
            metadata: data
          }
          addMessage(msg)
          handlers?.onError?.(errorMsg)
          setIsStreaming(false)
        },

        onEvent: (event, data) => {
          // Handle tool_use event
          if (event === 'tool_use') {
            const tool = data.tool || 'unknown'
            const status = data.status || 'executing'
            setCurrentTool(tool)

            const msg: CustomAgentStreamMessage = {
              type: 'tool_use',
              content: `Executing ${tool}...`,
              timestamp: new Date().toISOString(),
              metadata: data
            }
            addMessage(msg)
            handlers?.onToolUse?.(tool, status)
          }

          // Handle message event (word streaming)
          if (event === 'message' && typeof data === 'string') {
            setCurrentResponse(prev => prev + data + ' ')
            handlers?.onDelta?.(data + ' ')
          }

          // Handle done event
          if (event === 'done') {
            setIsStreaming(false)
            setCurrentTool(null)
          }
        }
      })

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start custom agent chat'
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
    setCurrentTool(null)
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setCurrentResponse('')
    setCurrentTool(null)
    setError(null)
    setIsStreaming(false)
  }, [])

  return {
    isStreaming,
    messages,
    currentResponse,
    currentTool,
    error,
    startChat,
    stopStreaming,
    reset
  }
}
