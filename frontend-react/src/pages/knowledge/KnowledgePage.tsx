// frontend/src/app/knowledge/page.tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Database,
  Upload,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Import Header


// Import all Sophia knowledge base components
import { CreateKnowledgeBase } from '@/components/knowledge/CreateKnowledgeBase'
import { DocumentList } from '@/components/knowledge/DocumentList'
import { DocumentUpload } from '@/components/knowledge/DocumentUpload'
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

export default function KnowledgePage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL param is the single source of truth.
  // Fall back to localStorage only when the URL has no 'kb' param.
  const urlKbId = searchParams.get('kb')
  const selectedKnowledgeBaseId: string | null =
    urlKbId || localStorage.getItem('mentis_sophia_last_kb') || null

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isSelectorDialogOpen, setIsSelectorDialogOpen] = useState(false)

  // Handle KB selection — update the URL param (and sync localStorage as backup)
  const handleKnowledgeBaseSelect = (id: string | null) => {
    if (id) {
      setSearchParams({ kb: id })
      localStorage.setItem('mentis_sophia_last_kb', id)
    } else {
      setSearchParams({})
      localStorage.removeItem('mentis_sophia_last_kb')
    }
  }

  // Handle create success
  const handleCreateSuccess = (knowledgeBaseId: string) => {
    handleKnowledgeBaseSelect(knowledgeBaseId)
    queryClient.invalidateQueries({
      queryKey: ['knowledgeBases'],
      exact: false
    })
  }

  // Handle upload success
  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', selectedKnowledgeBaseId] })
    queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
  }

  return (
    <div className="flex flex-col bg-[var(--app-bg,#EEF2F7)] dark:bg-[#1e2433] min-h-full">      {/* Main Layout */}
      <div className="w-full px-6 pt-4">
        <Breadcrumbs />
      </div>
      <div className="flex-1 flex overflow-hidden">

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden dark:bg-[#1e2433]">
          {!selectedKnowledgeBaseId ? (
            // Empty State
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-auto">
              <div className="text-center max-w-2xl w-full">

                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Database className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-600" />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Welcome to Sophia Knowledge
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-lg mx-auto">
                  Create or select a knowledge base to get started with Sophia's enhanced AI-powered
                  document search and analysis capabilities.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                  <Card className="p-4 sm:p-6 text-left bg-white dark:bg-[#353d4f] border dark:border-[#3d4555]">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Smart Storage</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Organize documents efficiently</p>
                  </Card>
                  <Card className="p-4 sm:p-6 text-left bg-white dark:bg-[#353d4f] border dark:border-[#3d4555]">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">AI Search</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Find information instantly</p>
                  </Card>
                  <Card className="p-4 sm:p-6 text-left bg-white dark:bg-[#353d4f] border dark:border-[#3d4555]">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                      <Upload className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Easy Upload</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Drag and drop documents</p>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="w-full sm:w-auto gap-2 bg-[#146f84] hover:bg-[#105e6e] text-white font-medium text-xs rounded-sm h-9 px-4 shadow-md [text-shadow:0_1px_1px_rgba(0,0,0,0.2)]"
                  >
                    <Plus className="h-4 w-4" />
                    Create Knowledge Base
                  </Button>
                  <Button
                    onClick={() => setIsSelectorDialogOpen(true)}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Database className="h-4 w-4" />
                    Browse Existing
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Document View
            <div className="flex-1 overflow-hidden">
              <DocumentList knowledgeBaseId={selectedKnowledgeBaseId} />
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <CreateKnowledgeBase
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedKnowledgeBaseId && (
        <DocumentUpload
          knowledgeBaseId={selectedKnowledgeBaseId}
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onSuccess={handleUploadSuccess}
        />
      )}

      <KnowledgeBaseSelector
        open={isSelectorDialogOpen}
        onOpenChange={setIsSelectorDialogOpen}
        onSelect={(kb) => {
          handleKnowledgeBaseSelect(kb.id)
          setIsSelectorDialogOpen(false)
        }}
        selectedKnowledgeBaseId={selectedKnowledgeBaseId}
        showCreateOption={true}
      />
    </div>
  )
}
