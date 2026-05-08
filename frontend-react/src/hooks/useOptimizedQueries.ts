// frontend/src/hooks/useOptimizedQueries.ts
// OPTIMIZED: Custom hooks for parallel data loading and caching

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useEffect } from 'react'

// Optimized chat queries
function useOptimizedChat(chatId: string | null) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null
      const response = await apiClient.getChat(chatId)
      return response.success ? response.data : null
    },
    enabled: Boolean(chatId),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  })
}

// Optimized messages queries with better caching
function useOptimizedMessages(chatId: string | null, limit: number = 50) {
  return useQuery({
    queryKey: ['messages', chatId, limit],
    queryFn: async () => {
      if (!chatId) return []
      const response = await apiClient.getChatMessages(chatId, { 
        limit,
        sortOrder: 'asc',
        includeArtifacts: true 
      })
      return response.success ? response.data : []
    },
    enabled: Boolean(chatId),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: 1,
    retryDelay: 500,
  })
}

// Parallel chat and messages loading
function useOptimizedChatWithMessages(chatId: string | null) {
  const chatQuery = useOptimizedChat(chatId)
  const messagesQuery = useOptimizedMessages(chatId)
  
  return {
    chat: chatQuery.data,
    messages: messagesQuery.data || [],
    isLoading: chatQuery.isLoading || messagesQuery.isLoading,
    isError: chatQuery.isError || messagesQuery.isError,
    error: chatQuery.error || messagesQuery.error,
    refetchChat: chatQuery.refetch,
    refetchMessages: messagesQuery.refetch,
  }
}

// Optimized chats list with intelligent pagination
function useOptimizedChats(options: {
  limit?: number
  agentType?: string
  prefetch?: boolean
} = {}) {
  const { limit = 50, agentType, prefetch = true } = options
  
  return useQuery({
    queryKey: ['chats', { limit, agentType }],
    queryFn: () => apiClient.getChats({ limit, agentType }),
    enabled: prefetch,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    retry: 2,
  })
}

// Background prefetcher for knowledge bases
function useKnowledgeBasesPrefetch() {
  return useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: () => apiClient.getKnowledgeBases(),
    staleTime: 600000, // 10 minutes
    gcTime: 900000, // 15 minutes
    retry: 2,
  })
}

// Optimized mutations with cache updates
function useOptimizedChatMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fixed: Use createChat as fallback for createChatWithMessage
  const createChatWithMessage = useMutation({
    mutationFn: async (data: any) => {
      // Try to create chat with initial message, fallback to regular chat creation
      try {
        // If the API supports createChatWithMessage, use it
        if ('createChatWithMessage' in apiClient) {
          return await (apiClient as any).createChatWithMessage(data)
        }
        
        // Fallback: Create chat first, then send initial message
        const chatData = {
          title: data.title,
          agent_type: data.agent_type,
          knowledge_base_id: data.knowledge_base_id,
          tool: data.tool,
          subtool: data.subtool,
          metadata: data.metadata
        }
        
        const chatResponse = await apiClient.createChat(chatData)
        
        if (chatResponse.success && chatResponse.data && data.first_message) {
          // Send the initial message
          const messageResponse = await apiClient.sendSimpleMessage(
            chatResponse.data.id,
            {
              content: data.first_message,
              sender: 'user' as const
            }
          )
          
          return {
            success: true,
            data: {
              chat: chatResponse.data,
              message: messageResponse.data
            }
          }
        }
        
        return chatResponse
      } catch (error) {
        console.error('Error in createChatWithMessage fallback:', error)
        throw error
      }
    },
    onSuccess: (data: any) => {
      // Update chats cache immediately
      queryClient.setQueryData(['chats'], (old: any) => {
        if (!old) return old
        const newChat = data.data?.chat || data.data
        return {
          ...old,
          data: [newChat, ...(old.data || [])],
        }
      })
      
      // Pre-populate chat cache
      if (data.data?.chat) {
        queryClient.setQueryData(['chat', data.data.chat.id], data.data.chat)
      } else if (data.data?.id) {
        queryClient.setQueryData(['chat', data.data.id], data.data)
      }
      
      toast({
        title: 'Success',
        description: 'Chat created successfully',
        duration: 2000
      })
    },
    onError: (error) => {
      console.error('Create chat with message error:', error)
      toast({
        title: 'Error',
        description: 'Failed to create chat with message',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  // Fixed: Ensure content is always provided
  const sendSimpleMessage = useMutation({
    mutationFn: async ({ chatId, content, ...restData }: { 
      chatId: string; 
      content: string; 
      [key: string]: any 
    }) => {
      if (!content) {
        throw new Error('Message content is required')
      }
      
      const messageData = {
        content,
        sender: restData.sender || 'user' as const,
        ...restData
      }
      
      return await apiClient.sendSimpleMessage(chatId, messageData)
    },
    onSuccess: (data: any, variables: any) => {
      // Update messages cache immediately
      queryClient.setQueryData(['messages', variables.chatId], (old: any) => {
        const currentMessages = old || []
        const newMessages = []
        
        // Add user message if present
        if (data.data?.user_message) {
          newMessages.push(data.data.user_message)
        }
        
        // Add AI message if present
        if (data.data?.ai_message) {
          newMessages.push(data.data.ai_message)
        }
        
        return [...currentMessages, ...newMessages]
      })
      
      // Update chat timestamp in chats cache
      queryClient.setQueryData(['chats'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data?.map((chat: any) => 
            chat.id === variables.chatId 
              ? { ...chat, updated_at: new Date().toISOString() }
              : chat
          ) || [],
        }
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
    onError: (error) => {
      console.error('Send simple message error:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  return {
    createChatWithMessage,
    sendSimpleMessage,
  }
}

// Global prefetcher hook
function useGlobalPrefetch() {
  const queryClient = useQueryClient()
  
  const prefetchUserData = useCallback(async () => {
    console.log('🚀 Starting global data prefetch')
    
    try {
      // Prefetch in parallel with error handling
      const prefetchPromises = [
        queryClient.prefetchQuery({
          queryKey: ['chats'],
          queryFn: () => apiClient.getChats({ limit: 50 }),
          staleTime: 60000,
        }).catch(error => {
          console.warn('Failed to prefetch chats:', error)
          return null
        }),
        queryClient.prefetchQuery({
          queryKey: ['knowledgeBases'],
          queryFn: () => apiClient.getKnowledgeBases(),
          staleTime: 600000,
        }).catch(error => {
          console.warn('Failed to prefetch knowledge bases:', error)
          return null
        }),
      ]
      
      await Promise.allSettled(prefetchPromises)
      console.log('✅ Global data prefetch completed')
    } catch (error) {
      console.error('❌ Global data prefetch failed:', error)
    }
  }, [queryClient])

  // Auto-prefetch on mount with error handling
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchUserData().catch(error => {
        console.warn('Auto-prefetch failed:', error)
      })
    }, 100)
    
    return () => clearTimeout(timer)
  }, [prefetchUserData])

  return { prefetchUserData }
}

// Cache management utilities
function useCacheManager() {
  const queryClient = useQueryClient()

  const invalidateChat = useCallback((chatId: string) => {
    queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
  }, [queryClient])

  const updateMessageCache = useCallback((chatId: string, newMessage: any) => {
    queryClient.setQueryData(['messages', chatId], (old: any) => {
      const currentMessages = old || []
      return [...currentMessages, newMessage]
    })
  }, [queryClient])

  const clearUserData = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['chats'] })
    queryClient.removeQueries({ queryKey: ['messages'] })
    queryClient.removeQueries({ queryKey: ['chat'] })
  }, [queryClient])

  const optimisticUpdateChat = useCallback((chatId: string, updates: Partial<any>) => {
    queryClient.setQueryData(['chat', chatId], (old: any) => {
      if (!old) return old
      return { ...old, ...updates }
    })
  }, [queryClient])

  const optimisticUpdateChats = useCallback((chatId: string, updates: Partial<any>) => {
    queryClient.setQueryData(['chats'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        data: old.data?.map((chat: any) => 
          chat.id === chatId ? { ...chat, ...updates } : chat
        ) || []
      }
    })
  }, [queryClient])

  return {
    invalidateChat,
    updateMessageCache,
    clearUserData,
    optimisticUpdateChat,
    optimisticUpdateChats,
  }
}

// Enhanced prefetch with retry logic
function useEnhancedPrefetch() {
  const queryClient = useQueryClient()
  
  const prefetchWithRetry = useCallback(async (
    queryKey: string[], 
    queryFn: () => Promise<any>,
    maxRetries: number = 3
  ) => {
    let attempt = 0
    let lastError: Error | null = null
    
    while (attempt < maxRetries) {
      try {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 300000,
        })
        return true
      } catch (error) {
        lastError = error as Error
        attempt++
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    console.error(`Failed to prefetch after ${maxRetries} attempts:`, lastError)
    return false
  }, [queryClient])
  
  const prefetchCriticalData = useCallback(async () => {
    const results = await Promise.allSettled([
      prefetchWithRetry(['chats'], () => apiClient.getChats({ limit: 50 })),
      prefetchWithRetry(['knowledgeBases'], () => apiClient.getKnowledgeBases()),
      prefetchWithRetry(['currentUser'], () => apiClient.getCurrentUser()),
    ])
    
    const successful = results.filter(result => result.status === 'fulfilled').length
    console.log(`Prefetch completed: ${successful}/${results.length} successful`)
    
    return successful === results.length
  }, [prefetchWithRetry])
  
  return {
    prefetchWithRetry,
    prefetchCriticalData,
  }
}

// Batch operations utility
function useBatchOperations() {
  const queryClient = useQueryClient()
  
  const batchInvalidate = useCallback((patterns: string[]) => {
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey.includes(pattern)
        }
      })
    })
  }, [queryClient])
  
  const batchUpdate = useCallback((updates: Array<{
    queryKey: string[]
    updater: (old: any) => any
  }>) => {
    updates.forEach(({ queryKey, updater }) => {
      queryClient.setQueryData(queryKey, updater)
    })
  }, [queryClient])
  
  return {
    batchInvalidate,
    batchUpdate,
  }
}

// Performance monitoring hook
function useQueryPerformance() {
  const queryClient = useQueryClient()
  
  const measureQueryTime = useCallback(async (
    queryKey: string[],
    queryFn: () => Promise<any>
  ) => {
    const startTime = performance.now()
    
    try {
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn,
        staleTime: 0, // Force fresh fetch for accurate timing
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`Query performance [${queryKey.join(', ')}]: ${duration.toFixed(2)}ms`)
      
      return { result, duration }
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.error(`Query failed [${queryKey.join(', ')}] after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }, [queryClient])
  
  return { measureQueryTime }
}

// Single export statement at the end
export {
  useOptimizedChat,
  useOptimizedMessages,
  useOptimizedChatWithMessages,
  useOptimizedChats,
  useKnowledgeBasesPrefetch,
  useOptimizedChatMutations,
  useGlobalPrefetch,
  useCacheManager,
  useEnhancedPrefetch,
  useBatchOperations,
  useQueryPerformance,
}