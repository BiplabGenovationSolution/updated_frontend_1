// src/hooks/useKnowledgeBase.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CreateKnowledgeBaseRequest } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export function useKnowledgeBase() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get all knowledge bases
  const { data: knowledgeBasesData, isLoading } = useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: () => apiClient.getKnowledgeBases(),
  })

  // Create knowledge base mutation
  const createKnowledgeBaseMutation = useMutation({
    mutationFn: (data: CreateKnowledgeBaseRequest) => apiClient.createKnowledgeBase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
      toast({
        title: 'Success',
        description: 'Knowledge base created successfully',
        duration: 2000
      })
    },
    onError: (error) => {
      console.error('Failed to create knowledge base:', error)
      toast({
        title: 'Error',
        description: 'Failed to create knowledge base',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  // Delete knowledge base mutation
  const deleteKnowledgeBaseMutation = useMutation({
    mutationFn: (kbId: string) => apiClient.deleteKnowledgeBase(kbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
      toast({
        title: 'Success',
        description: 'Knowledge base deleted successfully',
        duration: 2000
      })
    },
    onError: (error) => {
      console.error('Failed to delete knowledge base:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete knowledge base',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  return {
    knowledgeBases: knowledgeBasesData?.data || [],
    isLoading,
    createKnowledgeBase: createKnowledgeBaseMutation.mutateAsync,
    deleteKnowledgeBase: deleteKnowledgeBaseMutation.mutateAsync,
    isCreating: createKnowledgeBaseMutation.isPending,
    isDeleting: deleteKnowledgeBaseMutation.isPending,
  }
}