// src/hooks/useChat.ts
'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Chat, Message } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

// Compatible interfaces to resolve type conflicts
interface CompatibleCreateChatRequest {
  title: string
  agent_type: 'sophia' | 'aegis'
  knowledge_base_id?: string
  tool?: string
  subtool?: string
  metadata?: Record<string, any>
  initial_message?: string
}

interface CompatibleCreateMessageRequest {
  content: string
  sender?: 'user' | 'assistant' | 'system'
  tool?: string
  subtool?: string
  tool_config?: Record<string, any>
  attachments?: any[] // Using any[] to avoid type conflicts
  metadata?: Record<string, any>
  knowledge_base_id?: string
  custom_agent_id?: string
  stream_response?: boolean
  execute_immediately?: boolean
  priority?: number
}

export function useChat(chatId?: string | null) {
  const [isTyping, setIsTyping] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get chat details
  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null
      try {
        const response = await apiClient.getChat(chatId)
        return response.success ? response.data : null
      } catch (error) {
        console.error('Failed to fetch chat:', error)
        return null
      }
    },
    enabled: !!chatId,
  })

  // Get messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return []
      try {
        const response = await apiClient.getChatMessages(chatId, { 
          limit: 100, 
          sortOrder: 'asc' 
        })
        return response.success ? response.data || [] : []
      } catch (error) {
        console.error('Failed to fetch messages:', error)
        return []
      }
    },
    enabled: !!chatId,
  })

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (data: CompatibleCreateChatRequest) => {
      try {
        const response = await apiClient.createChat(data)
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Failed to create chat')
        }
      } catch (error) {
        console.error('Create chat mutation error:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
    onError: (error: any) => {
      console.error('Failed to create chat:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create chat',
        variant: 'destructive',
        duration: 2000  
      })
    },
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId: currentChatId, data }: { 
      chatId: string; 
      data: CompatibleCreateMessageRequest 
    }) => {
      try {
        const response = await apiClient.createMessage(currentChatId, data as any)
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Failed to send message')
        }
      } catch (error) {
        console.error('Send message mutation error:', error)
        throw error
      }
    },
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
        queryClient.invalidateQueries({ queryKey: ['chats'] })
      }
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send message',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  // Simple message mutation for quick sends
  const sendSimpleMessageMutation = useMutation({
    mutationFn: async ({ chatId: currentChatId, data }: {
      chatId: string;
      data: {
        content: string;
        sender?: 'user' | 'assistant' | 'system';
        tool?: string;
        subtool?: string;
        knowledge_base_id?: string;
        metadata?: Record<string, any>;
      }
    }) => {
      try {
        const response = await apiClient.sendSimpleMessage(currentChatId, data)
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Failed to send simple message')
        }
      } catch (error) {
        console.error('Send simple message mutation error:', error)
        throw error
      }
    },
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
        queryClient.invalidateQueries({ queryKey: ['chats'] })
      }
    },
    onError: (error: any) => {
      console.error('Failed to send simple message:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send message',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  // Helper functions with proper error handling
  const createChat = useCallback(async (data: CompatibleCreateChatRequest) => {
    try {
      return await createChatMutation.mutateAsync(data)
    } catch (error) {
      console.error('Create chat error:', error)
      throw error
    }
  }, [createChatMutation])

  const sendMessage = useCallback(async (
    currentChatId: string, 
    data: CompatibleCreateMessageRequest
  ) => {
    try {
      return await sendMessageMutation.mutateAsync({ 
        chatId: currentChatId, 
        data 
      })
    } catch (error) {
      console.error('Send message error:', error)
      throw error
    }
  }, [sendMessageMutation])

  const sendSimpleMessage = useCallback(async (
    currentChatId: string,
    data: {
      content: string;
      sender?: 'user' | 'assistant' | 'system';
      tool?: string;
      subtool?: string;
      knowledge_base_id?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    try {
      return await sendSimpleMessageMutation.mutateAsync({
        chatId: currentChatId,
        data
      })
    } catch (error) {
      console.error('Send simple message error:', error)
      throw error
    }
  }, [sendSimpleMessageMutation])

  // Create chat with initial message helper
  const createChatWithMessage = useCallback(async (data: {
    title: string;
    agent_type: 'sophia' | 'aegis';
    knowledge_base_id?: string;
    first_message: string;
    tool?: string;
    subtool?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      // First create the chat
      const newChat = await createChat({
        title: data.title,
        agent_type: data.agent_type,
        knowledge_base_id: data.knowledge_base_id,
        tool: data.tool,
        subtool: data.subtool,
        metadata: data.metadata
      })

      if (newChat && newChat.id) {
        // Then send the first message
        await sendMessage(newChat.id, {
          content: data.first_message,
          sender: 'user',
          tool: data.tool,
          subtool: data.subtool,
          knowledge_base_id: data.knowledge_base_id
        })

        return newChat
      } else {
        throw new Error('Failed to create chat')
      }
    } catch (error) {
      console.error('Create chat with message error:', error)
      throw error
    }
  }, [createChat, sendMessage])

  return {
    // Data
    chat: chat || null,
    messages: messagesData || [],
    
    // Loading states
    isLoading: chatLoading || messagesLoading,
    isCreatingChat: createChatMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending || sendSimpleMessageMutation.isPending,
    
    // Actions
    createChat,
    sendMessage,
    sendSimpleMessage,
    createChatWithMessage,
    
    // UI states
    isTyping,
    setIsTyping,
    
    // Mutation objects for advanced usage
    createChatMutation,
    sendMessageMutation,
    sendSimpleMessageMutation,
  }
}