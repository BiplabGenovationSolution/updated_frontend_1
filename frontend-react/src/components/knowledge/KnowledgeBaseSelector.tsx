// frontend/src/components/knowledge/KnowledgeBaseSelector.tsx
// UPDATED TO USE NEW SOPHIA BACKEND ENDPOINTS
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Database, ChevronRight, CheckCircle, Plus, AlertCircle, Target, Brain, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { apiClient } from '@/lib/api'
import type { KnowledgeBase } from '@/lib/types'
import { formatDate, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface KnowledgeBaseSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (knowledgeBase: KnowledgeBase) => void
  selectedKnowledgeBaseId?: string | null
  showCreateOption?: boolean
}

export function KnowledgeBaseSelector({
  open,
  onOpenChange,
  onSelect,
  selectedKnowledgeBaseId,
  showCreateOption = true
}: KnowledgeBaseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // FIXED: Fetch knowledge bases using consistent cache key
  const { data: knowledgeBasesData, isLoading, error } = useQuery({
    queryKey: ['knowledgeBases', true],
    queryFn: () => apiClient.getKnowledgeBases(true),
    enabled: open, // Only fetch when dialog is open
    staleTime: 300000, // 5 minutes
  })

  const knowledgeBases = knowledgeBasesData?.data || []

  // Filter knowledge bases based on search
  const filteredKnowledgeBases = knowledgeBases.filter((kb: any) => {
    const name = kb.name || ''
    const description = kb.description || ''

    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Helper function to get document count
  const getDocumentCount = (kb: KnowledgeBase): number => {
    return kb.document_count ||
      (kb as any).documents_count ||
      (kb as any).documentCount ||
      (kb as any).doc_count ||
      (kb as any).num_documents ||
      (kb as any).total_documents ||
      0
  }

  // Helper function to get health status
  const getHealthStatus = (kb: KnowledgeBase): string => {
    return kb.health_status || 'healthy'
  }

  // Handle knowledge base selection
  const handleSelect = (kb: KnowledgeBase) => {
    console.log('📚 Sophia knowledge base selected:', kb.name, kb.id)
    onSelect(kb)

    toast({
      title: 'Sophia Knowledge Base Selected',
      description: `${kb.name} is now active for enhanced AI responses`,
      duration: 2000
    })
  }

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>

          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#008fb3]/10 dark:bg-[#008fb3]/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-[#008fb3]/20 dark:border-[#008fb3]/30">
              <Database className="h-4 w-4 text-[#008fb3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-slate-100 font-semibold">Select Sophia Knowledge Base</span>
                <Badge className="bg-[#008fb3]/10 dark:bg-[#008fb3]/20 text-[#008fb3] text-xs border border-[#008fb3]/20 dark:border-[#008fb3]/30 backdrop-blur-sm">
                  Enhanced Backend
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 font-normal mt-1">
                Choose a knowledge base for AI-powered document search and analysis
              </p>
            </div>
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-4 flex flex-col min-h-0 overflow-hidden">
          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search Sophia knowledge bases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 dark:border-[#30363d] focus:border-[#008fb3] focus:ring-[#008fb3]"
            />
          </div>

          {/* Knowledge Bases List */}
          <div className="overflow-y-auto max-h-[45vh] pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-[#008fb3] rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-600">Loading Sophia knowledge bases...</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-[#008fb3]">
                  <Target className="h-3 w-3" />
                  <span>Enhanced AI processing</span>
                </div>
              </div>
            ) : error ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Failed to load Sophia knowledge bases. Please try again.
                </AlertDescription>
              </Alert>
            ) : filteredKnowledgeBases.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-[#008fb3]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Database className="h-8 w-8 text-[#008fb3]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No matching knowledge bases' : 'No Sophia knowledge bases found'}
                </h3>

                {/* Enhanced Features Preview */}
                <div className="bg-[#008fb3]/5 dark:bg-[#008fb3]/10 border border-[#008fb3]/20 dark:border-[#008fb3]/30 rounded-lg p-4 max-w-sm mx-auto mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-[#008fb3]" />
                    <span className="text-sm font-medium text-[#008fb3]">Sophia Features</span>
                  </div>
                  <div className="space-y-2 text-xs text-[#008fb3]/80 dark:text-[#008fb3]/80">
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3" />
                      <span>Advanced document understanding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      <span>Intelligent source ranking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3" />
                      <span>Enhanced search accuracy</span>
                    </div>
                  </div>
                </div>

                {showCreateOption && (
                  <Button
                    className="gap-2 bg-[#008fb3] hover:bg-[#007ba1] text-white"
                    onClick={() => {
                      onOpenChange(false)
                      // Navigate to knowledge base creation or trigger creation modal
                      window.location.href = '/knowledge'
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Create Sophia Knowledge Base
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredKnowledgeBases.map((kb: any) => {
                  const documentCount = getDocumentCount(kb)
                  const healthStatus = getHealthStatus(kb)
                  const isSelected = selectedKnowledgeBaseId === kb.id

                  return (
                    <Card
                      key={kb.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all duration-200 group border hover:shadow-sm relative overflow-hidden",
                        isSelected
                          ? "bg-gradient-to-r from-[#008fb3]/10 to-[#008fb3]/5 dark:from-[#008fb3]/20 dark:to-[#008fb3]/10 border-[#008fb3] dark:border-[#008fb3] shadow-sm ring-1 ring-[#008fb3]/20 dark:ring-[#008fb3]/30"
                          : "bg-white dark:bg-slate-800 hover:bg-[#008fb3]/5 dark:hover:bg-[#008fb3]/10 hover:border-[#008fb3]/50 dark:hover:border-[#008fb3]/50 border-gray-200 dark:border-slate-700"
                      )}
                      onClick={() => handleSelect(kb)}
                    >
                      {/* Sophia accent border */}
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                        isSelected
                          ? "from-purple-500 to-violet-500"
                          : "from-[#008fb3] to-[#008fb3] opacity-0 group-hover:opacity-100 transition-opacity"
                      )} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                            isSelected
                              ? "bg-[#008fb3]/20 dark:bg-[#008fb3]/30"
                              : "bg-gray-100 dark:bg-slate-700 group-hover:bg-[#008fb3]/15 dark:group-hover:bg-[#008fb3]/20"
                          )}>
                            <Database className={cn(
                              "h-6 w-6",
                              isSelected
                                ? "text-[#008fb3]"
                                : "text-gray-600 dark:text-gray-400 group-hover:text-[#008fb3] dark:group-hover:text-[#008fb3]"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                "font-semibold truncate",
                                isSelected
                                  ? "text-[#008fb3] dark:text-[#008fb3]"
                                  : "text-gray-900 dark:text-white"
                              )}>
                                {kb.name}
                              </h4>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              )}

                              {/* Health Status Badge */}
                              <Badge
                                className={cn(
                                  "text-xs px-2 py-0.5 border-0",
                                  healthStatus === 'healthy' && "bg-green-100 text-green-800",
                                  healthStatus === 'degraded' && "bg-yellow-100 text-yellow-800",
                                  healthStatus === 'unhealthy' && "bg-red-100 text-red-800"
                                )}
                              >
                                {healthStatus}
                              </Badge>
                            </div>

                            {kb.description && (
                              <p className={cn(
                                "text-sm mb-2 line-clamp-2",
                                isSelected
                                  ? "text-slate-600 dark:text-slate-400"
                                  : "text-gray-600 dark:text-gray-300"
                              )}>
                                {kb.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-xs">
                              {/* Document Count */}
                              <div className="flex items-center gap-1">
                                <Database className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                <Badge
                                  className={cn(
                                    "text-xs px-2 py-0.5 border-0",
                                    isSelected
                                      ? "bg-[#008fb3]/20 dark:bg-[#008fb3]/30 text-[#008fb3]"
                                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                                  )}
                                >
                                  {documentCount} {documentCount === 1 ? 'document' : 'documents'}
                                </Badge>
                              </div>

                              {/* Vector Count */}
                              {kb.vector_count && (
                                <div className="flex items-center gap-1">
                                  <Brain className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                  <span className={cn(
                                    isSelected
                                      ? "text-slate-500 dark:text-slate-500"
                                      : "text-gray-600 dark:text-gray-400"
                                  )}>
                                    {kb.vector_count.toLocaleString()} vectors
                                  </span>
                                </div>
                              )}

                              {/* Embedding Model */}
                              {kb.embedding_model && (
                                <Badge className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-0">
                                  {kb.embedding_model.includes('small') ? 'Small' :
                                    kb.embedding_model.includes('large') ? 'Large' : 'Standard'}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-xs">
                                <span className={cn(
                                  isSelected
                                    ? "text-slate-500 dark:text-slate-500"
                                    : "text-gray-500 dark:text-gray-400"
                                )}>
                                  Created {formatDate(kb.created_at)}
                                </span>

                                {kb.last_accessed && (
                                  <span className={cn(
                                    isSelected
                                      ? "text-slate-500 dark:text-slate-500"
                                      : "text-gray-500 dark:text-gray-400"
                                  )}>
                                    Last used {formatDate(kb.last_accessed)}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Sophia Enhancement Indicator */}
                          <div className="flex items-center gap-1 text-xs text-[#008fb3]">
                            <Target className="h-3 w-3" />
                            <span className="font-medium hidden sm:inline">Sophia</span>
                          </div>

                          {isSelected ? (
                            <Badge className="bg-green-100 text-green-800 border-0 font-medium">
                              Selected
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-8 px-3 text-xs transition-all duration-200",
                                "bg-[#008fb3]/10 dark:bg-[#008fb3]/20 hover:bg-[#008fb3] dark:hover:bg-[#008fb3] text-[#008fb3] dark:text-[#008fb3] hover:text-white dark:hover:text-white border border-[#008fb3]/20 dark:border-[#008fb3]/30 hover:border-[#008fb3] dark:hover:border-[#008fb3]"
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelect(kb)
                              }}
                            >
                              Select
                            </Button>
                          )}
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform group-hover:translate-x-1",
                            isSelected ? "text-[#008fb3]" : "text-gray-400"
                          )} />
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}

          {showCreateOption && knowledgeBases.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-800/50 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Need a different knowledge base?
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[#008fb3]">
                    <Target className="h-3 w-3" />
                    <span>Enhanced with Sophia</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-[#008fb3]/30 dark:border-[#008fb3]/40 text-[#008fb3] dark:text-[#008fb3] hover:bg-[#008fb3]/5 dark:hover:bg-[#008fb3]/10 transition-all"
                  onClick={() => {
                    onOpenChange(false)
                    window.location.href = '/knowledge'
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Create New
                </Button>
              </div>
            </div>
          )}


          {/* Sophia Features Summary */}
          {/* <Alert className="border-slate-200 bg-slate-50">
            <Sparkles className="h-4 w-4 text-[#146f84]" />
            <AlertDescription className="text-slate-800 text-sm">
              <div className="flex items-center justify-between">
                <span>Powered by Sophia's enhanced AI backend for superior document understanding</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-medium text-xs">Active</span>
                </div>
              </div>
            </AlertDescription>
          </Alert> */}
          <Alert className="border-[#008fb3]/30 bg-slate-950/50 border backdrop-blur-sm">
            <Target className="h-4 w-4 text-[#008fb3]" />
            <AlertDescription className="text-slate-200 text-sm">
              <div className="flex items-center justify-between">
                <span>Powered by Sophia's enhanced AI backend for superior document understanding</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <span className="font-medium text-xs text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                    Active
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

        </div>
      </DialogContent>
    </Dialog>
  )
}