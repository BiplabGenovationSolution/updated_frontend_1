'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'failed'

interface UseWebSocketOptions {
  maxReconnectAttempts?: number
  reconnectInterval?: number
}

export function useWebSocket(
  chatId: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    maxReconnectAttempts = 5,
    reconnectInterval = 3000
  } = options

  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const websocketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)
  const currentChatIdRef = useRef<string | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('mentis_auth_token')
  }, [])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      console.log('🔌 WebSocket message received:', data.event)

      switch (data.event) {
        case 'user_message':
        case 'assistant_message':
          // ✅ FIX: Don't add messages via WebSocket - SSE already handles this
          // This prevents duplicate messages since SSE streaming already updates the cache
          // WebSocket is kept for other real-time events and collaborative features
          console.log('📨 Message received via WebSocket (ignored - using SSE):', {
            event: data.event,
            messageId: data.data?.id,
            sender: data.data?.sender,
            contentPreview: data.data?.content?.substring(0, 50)
          })
          // Don't modify query cache - let SSE handle message delivery
          break

        case 'connected':
          console.log('✅ WebSocket connection confirmed')
          setStatus('connected')
          setReconnectAttempts(0)
          break

        case 'error':
          console.error('❌ WebSocket server error:', data.data)
          break
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error)
    }
  }, [chatId, queryClient])

  const connect = useCallback((targetChatId: string) => {
    if (isConnectingRef.current) {
      console.log('🔌 Connection already in progress, skipping')
      return
    }

    if (currentChatIdRef.current && currentChatIdRef.current !== targetChatId) {
      console.log('🔌 Chat ID changed, resetting connection state')
      setReconnectAttempts(0)
    }

    currentChatIdRef.current = targetChatId
    isConnectingRef.current = true

    // Clean up existing connection
    if (websocketRef.current) {
      console.log('🔌 Closing existing WebSocket connection')
      websocketRef.current.close(1000, 'Reconnecting')
      websocketRef.current = null
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    const authToken = getAuthToken()
    if (!authToken) {
      console.error('❌ No auth token available for WebSocket')
      setStatus('error')
      isConnectingRef.current = false
      return
    }

    try {
      // Get API URL from environment and convert to WebSocket URL
      const apiUrl = import.meta.env.VITE_API_URL
      const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/chat/${targetChatId}?token=${authToken}`
      console.log('🔌 Connecting to WebSocket:', { chatId: targetChatId.slice(-8) })

      setStatus('connecting')
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        setStatus('connected')
        setReconnectAttempts(0)
        isConnectingRef.current = false

        toast({
          title: 'Connected',
          description: 'Real-time chat connected',
          duration: 2000,
        })
      }

      ws.onmessage = handleMessage

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', { code: event.code })
        isConnectingRef.current = false

        if (event.code !== 1000 && currentChatIdRef.current === targetChatId) {
          setReconnectAttempts(currentAttempts => {
            const newAttempts = currentAttempts + 1

            if (newAttempts <= maxReconnectAttempts) {
              console.log(`🔄 Scheduling reconnection attempt ${newAttempts}/${maxReconnectAttempts}`)
              setStatus('reconnecting')

              reconnectTimeoutRef.current = setTimeout(() => {
                if (currentChatIdRef.current === targetChatId && !isConnectingRef.current) {
                  connect(targetChatId)
                }
              }, reconnectInterval)

              return newAttempts
            } else {
              console.log('❌ Max reconnection attempts reached')
              setStatus('failed')
              toast({
                title: 'Connection Failed',
                description: 'Unable to maintain real-time connection',
                variant: 'destructive',
                duration: 2000,
              })
              return newAttempts
            }
          })
        } else {
          setStatus('disconnected')
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setStatus('error')
        isConnectingRef.current = false
      }

      websocketRef.current = ws

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error)
      setStatus('error')
      isConnectingRef.current = false
    }
  }, [getAuthToken, handleMessage, toast, maxReconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket')

    isConnectingRef.current = false
    currentChatIdRef.current = null

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Chat closed')
      websocketRef.current = null
    }

    setStatus('disconnected')
    setReconnectAttempts(0)
  }, [])

  // Auto-connect when chatId changes
  useEffect(() => {
    if (chatId) {
      connect(chatId)
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [chatId])

  return {
    status,
    reconnectAttempts,
    connect,
    disconnect,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || status === 'reconnecting'
  }
}