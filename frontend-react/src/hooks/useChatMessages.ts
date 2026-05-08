// frontend/src/hooks/useChatMessages.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useMemo } from 'react'

export function useChatMessages(chatId: string | null) {
  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return []
      try {
        console.log('🔄 Fetching messages for chat:', chatId)
        const response = await apiClient.getChatMessages(chatId, {
          limit: 50,
          offset: 0,
          sortOrder: 'asc',
          include_artifacts: true
        })
        // Extract messages array from response.data.messages
        const messages = response.success && response.data ? response.data.messages : []
        console.log('✅ Messages fetched:', messages.length)
        return messages
      } catch (error) {
        console.error('❌ Failed to get messages:', error)
        return []
      }
    },
    enabled: Boolean(chatId),
    staleTime: 5000, // Reduced stale time for more responsive updates
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Allow refetch on focus to ensure data is fresh
    refetchOnReconnect: true,
  })

  // Deduplicate messages by ID only
  const messages = useMemo(() => {
    if (!messagesData) return []

    const seenIds = new Set<string>()

    return (messagesData as any[]).filter((message: any) => {
      // Only deduplicate by message ID
      if (message.id) {
        if (seenIds.has(message.id)) {
          console.log('🔍 Duplicate message ID detected:', message.id)
          return false
        }
        seenIds.add(message.id)
      }

      // Allow messages with same content - users should be able to send "Hello" multiple times
      return true
    })
  }, [messagesData])

  return {
    messages,
    isLoading,
    refetch
  }
}