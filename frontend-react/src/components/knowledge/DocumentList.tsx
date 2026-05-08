// frontend/src/components/knowledge/DocumentList.tsx
// UPDATED TO USE NEW SOPHIA BACKEND ENDPOINTS
'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Download,
  Trash2,
  Edit3,
  MoreHorizontal,
  Search,
  Upload,
  CheckSquare,
  Square,
  Copy,
  AlertCircle,
  RefreshCw,
  SortAsc,
  FileIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { apiClient } from '@/lib/api'
import type { Document } from '@/lib/types'
import { formatDate, formatFileSize, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface DocumentListProps {
  knowledgeBaseId: string
}

interface UploadingFile {
  name: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function DocumentList({ knowledgeBaseId }: DocumentListProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, UploadingFile>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const [liveProgress, setLiveProgress] = useState<Record<string, { stage: string, progress: number, status: string, error?: string }>>({})
  const [retryingDocs, setRetryingDocs] = useState<Set<string>>(new Set())
  const activeStreams = useRef<Record<string, AbortController>>({})

  // Dialog states
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null)
  const [newDescription, setNewDescription] = useState('')

  // FIXED: Fetch documents using consistent cache key
  const { data: documentsData, isLoading, refetch } = useQuery({
    queryKey: ['documents', knowledgeBaseId],
    queryFn: () => apiClient.getKnowledgeBaseDocuments(knowledgeBaseId, true, 50, 0),
    enabled: !!knowledgeBaseId,
  })

  // Fetch knowledge base details
  const { data: kbData } = useQuery({
    queryKey: ['knowledgeBase', knowledgeBaseId],
    queryFn: () => apiClient.getKnowledgeBase(knowledgeBaseId),
    enabled: !!knowledgeBaseId,
  })

  // Get knowledge base name
  // @ts-ignore
  const knowledgeBaseName = kbData?.data?.name || 'Sophia Documents'

  const documents = documentsData?.data || []

  // FIXED: Effect to update knowledge base list when documents change
  useEffect(() => {
    if (documents.length > 0 || documentsData?.success) {
      console.log(`📊 Sophia documents loaded for KB ${knowledgeBaseId}: ${documents.length} documents`)

      // Force refresh knowledge base list to show updated document count
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
        queryClient.invalidateQueries({ queryKey: ['knowledgeBase', knowledgeBaseId] })
      }, 100)
    }
  }, [documents.length, documentsData?.success, knowledgeBaseId, queryClient])

  // Effect to manage SSE streams for active processing documents
  useEffect(() => {
    const docs = documentsData?.data || []
    const pendingDocs = docs.filter((d: any) => ['queued', 'processing', 'pending'].includes(d.status))

    // Connect new streams
    pendingDocs.forEach((doc: any) => {
      if (!activeStreams.current[doc.document_id]) {
        console.log(`🔌 Opening SSE stream for document ${doc.document_id}`)

        setLiveProgress(prev => ({
          ...prev,
          [doc.document_id]: {
            stage: doc.stage || (doc.status === 'pending' ? 'PENDING' : 'QUEUED'),
            progress: doc.progress || 0,
            status: doc.status || 'queued',
            error: doc.error
          }
        }))

        const controller = apiClient.streamDocumentStatus(knowledgeBaseId, doc.document_id, {
          onProgress: (data) => {
            setLiveProgress(prev => ({
              ...prev,
              [doc.document_id]: {
                stage: data.stage,
                progress: data.progress,
                status: data.status,
                error: data.error
              }
            }))

            if (data.status === 'completed' || data.status === 'failed') {
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['documents', knowledgeBaseId] })
                queryClient.invalidateQueries({ queryKey: ['knowledgeBase', knowledgeBaseId] })
              }, 1000)
            }
          },
          onCompletion: () => {
            delete activeStreams.current[doc.document_id]
            queryClient.invalidateQueries({ queryKey: ['documents', knowledgeBaseId] })
            queryClient.invalidateQueries({ queryKey: ['knowledgeBase', knowledgeBaseId] })
          },
          onError: (err) => {
            console.error(`Stream error for document ${doc.document_id}:`, err)
            delete activeStreams.current[doc.document_id]
          }
        })

        activeStreams.current[doc.document_id] = controller
      }
    })

    // Cleanup active streams for documents no longer pending
    const pendingIds = new Set(pendingDocs.map((d: any) => d.document_id))
    Object.keys(activeStreams.current).forEach(id => {
      if (!pendingIds.has(id)) {
        activeStreams.current[id].abort()
        delete activeStreams.current[id]
      }
    })
  }, [documentsData?.data, knowledgeBaseId, queryClient])

  // Cleanup all streams on unmount
  useEffect(() => {
    return () => {
      Object.keys(activeStreams.current).forEach(id => {
        activeStreams.current[id].abort()
      })
      activeStreams.current = {}
    }
  }, [])

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const searchLower = searchQuery.toLowerCase()
      return (
        doc.filename?.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.metadata?.description?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = (a.filename || '').localeCompare(b.filename || '')
          break
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'size':
          comparison = (a.size_bytes || 0) - (b.size_bytes || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  // FIXED: Delete document mutation using Sophia endpoint
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) =>
      apiClient.deleteDocument(knowledgeBaseId, documentId, true),
    onSuccess: () => {
      // FIXED: Consistent cache keys
      queryClient.invalidateQueries({ queryKey: ['documents', knowledgeBaseId] })
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', knowledgeBaseId] })
      setIsDeleteDialogOpen(false)
      setDocumentToEdit(null)
      toast({
        title: 'Success',
        description: 'Document deleted from Sophia successfully',
        duration: 2000,
      })
    },
    onError: (error) => {
      console.error('Failed to delete document from Sophia:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete document from Sophia',
        variant: 'destructive',
        duration: 2000,
      })
    },
  })

  // Handle file upload using Sophia endpoint — single file, allowed types only
  const ALLOWED_EXTENSIONS = ['pdf', 'json', 'txt', 'docx', 'doc', 'md', 'odt', 'oxt']
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/json',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/markdown',
    'application/vnd.oasis.opendocument.text',
  ]

  const handleFileUpload = async (files: File[]) => {
    const pdfFile = files[0]
    if (!pdfFile) return

    const ext = pdfFile.name.split('.').pop()?.toLowerCase() || ''
    const isAllowed = ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME_TYPES.includes(pdfFile.type)
    if (!isAllowed) {
      toast({
        title: 'Invalid file type',
        description: 'Allowed types: PDF, JSON, TXT, DOCX, MD, ODT, OXT.',
        variant: 'destructive',
        duration: 2000,
      })
      return
    }

    const fileId = `${pdfFile.name}-${Date.now()}`

    setUploadingFiles(prev => ({
      ...prev,
      [fileId]: { name: pdfFile.name, progress: 0, status: 'pending' }
    }))

    try {
      setUploadingFiles(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], status: 'uploading', progress: 10 }
      }))

      const response = await apiClient.uploadDocumentToSophiaWithProgress(
        knowledgeBaseId,
        pdfFile,
        undefined,
        true,
        (progress) => {
          setUploadingFiles(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress }
          }))
        }
      )

      if (response.success) {
        setUploadingFiles(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], status: 'success', progress: 100 }
        }))

        toast({
          title: 'Success',
          description: `${pdfFile.name} uploaded to Sophia successfully`,
          duration: 2000,
        })
      } else {
        throw new Error(response.error || 'Upload to Sophia failed')
      }

      // Remove from uploading files after 3 seconds
      setTimeout(() => {
        setUploadingFiles(prev => {
          const newState = { ...prev }
          delete newState[fileId]
          return newState
        })
      }, 3000)

    } catch (error) {
      console.error('Sophia upload failed:', error)
      setUploadingFiles(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          status: 'error',
          progress: 100,
          error: error instanceof Error ? error.message : 'Upload to Sophia failed'
        }
      }))

      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${pdfFile.name} to Sophia`,
        variant: 'destructive',
        duration: 2000,
      })
    }

    // Invalidate Sophia-specific cache and force refresh
    queryClient.invalidateQueries({ queryKey: ['documents', knowledgeBaseId] })
    queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
    queryClient.invalidateQueries({ queryKey: ['knowledgeBase', knowledgeBaseId] })
    refetch()
  }

  // Handle drag and drop — PDF only, single file
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload([files[0]])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  // Document actions
  const handleDownloadDocument = async (document: any) => {
    try {
      console.log(`Starting download for document ${document.document_id} from KB ${knowledgeBaseId}`)
      toast({
        title: 'Downloading...',
        description: `Preparing ${document.filename} for download.`,
        duration: 2000,
      })
      const rawResult = await apiClient.downloadDocument(knowledgeBaseId, document.document_id)

      let downloadUrl = ''

      // The API client now parses JSON and might return an object like { success: true, data: "url" } or just the string URL
      if (typeof rawResult === 'string') {
        downloadUrl = rawResult
      } else if (rawResult && typeof rawResult === 'object' && !(rawResult instanceof Blob)) {
        const obj = rawResult as any
        downloadUrl = obj.data || obj.url || obj.download_url || ''
      }

      if (downloadUrl) {
        console.log('Received presigned URL:', downloadUrl)
        const a = window.document.createElement('a')
        a.href = downloadUrl
        a.download = document.filename || 'document'
        a.target = '_blank'
        window.document.body.appendChild(a)
        a.click()
        a.remove()
      } else if (rawResult instanceof Blob) {
        console.log('Received blob of size:', rawResult.size, 'type:', rawResult.type)
        const url = window.URL.createObjectURL(rawResult)
        const a = window.document.createElement('a')
        a.href = url
        a.download = document.filename || 'document'
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      } else {
        throw new Error('Received invalid download response format')
      }

      toast({
        title: 'Download Complete',
        description: `${document.filename} has been downloaded.`,
        duration: 2000,
      })
    } catch (error: any) {
      console.error('Download failed for document:', document.document_id, error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to download document',
        variant: 'destructive',
        duration: 2000,
      })
    }
  }

  const handleDownloadKnowledgeBase = async () => {
    try {
      toast({
        title: 'Preparing Library...',
        description: 'Generating a ZIP of all processed documents.',
        duration: 2000,
      })
      const blob = await apiClient.downloadKnowledgeBase(knowledgeBaseId)
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `knowledge-base-${knowledgeBaseId}.zip`
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      toast({
        title: 'Download Complete',
        description: 'Your knowledge base library has been downloaded.',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download knowledge base library',
        variant: 'destructive',
        duration: 2000,
      })
    }
  }

  const handleRetryDocument = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setRetryingDocs(prev => new Set(prev).add(documentId))
      await apiClient.retryDocumentProcessing(knowledgeBaseId, documentId)
      toast({
        title: 'Retry Started',
        description: 'Document has been re-queued for processing.',
        duration: 2000,
      })
      queryClient.invalidateQueries({ queryKey: ['documents', knowledgeBaseId] })
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', knowledgeBaseId] })
    } catch (error) {
      toast({
        title: 'Retry Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
        duration: 2000,
      })
    } finally {
      setRetryingDocs(prev => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    }
  }

  const handleEditDocument = (document: any) => {
    setDocumentToEdit(document)
    setNewDescription(document.description || document.metadata?.description || '')
    setIsRenameDialogOpen(true)
  }

  const handleDeleteDocument = (document: any) => {
    setDocumentToEdit(document)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateDocument = () => {
    if (!documentToEdit) return

    toast({
      title: 'Info',
      description: 'Document update feature coming soon with Sophia backend',
      duration: 2000,
    })
  }

  const handleConfirmDelete = () => {
    if (!documentToEdit || !documentToEdit.document_id) return
    deleteDocumentMutation.mutate(documentToEdit.document_id)
  }

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredAndSortedDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(filteredAndSortedDocuments.map(doc => doc.document_id))
    }
  }

  // Get file icon based on type
  const getFileIcon = (document: any) => {
    if (!document.filename) return <FileIcon className="h-5 w-5 text-gray-600" />

    const extension = document.filename.split('.').pop()?.toLowerCase()
    const iconClass = "h-5 w-5 text-gray-600"

    switch (extension) {
      case 'pdf':
        return <FileText className={cn(iconClass, "text-red-600")} />
      case 'doc':
      case 'docx':
        return <FileText className={cn(iconClass, "text-blue-600")} />
      case 'txt':
      case 'md':
        return <FileText className={cn(iconClass, "text-gray-600")} />
      case 'json':
        return <FileIcon className={cn(iconClass, "text-yellow-600")} />
      case 'xlsx':
      case 'xls':
        return <FileIcon className={cn(iconClass, "text-green-600")} />
      default:
        return <FileIcon className={iconClass} />
    }
  }

  return (
    <div
      className="flex flex-col h-full bg-transparent dark:bg-transparent"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        <div className="sticky top-0 z-20 px-6 pt-5 pb-4 border-b border-slate-200 dark:border-[#21262d] bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{knowledgeBaseName}</h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search Sophia documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-400 rounded-lg"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#21262d] hover:text-slate-900 dark:hover:text-white">
                  <SortAsc className="h-3.5 w-3.5" />
                  Sort: {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  Date Added
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('size')}>
                  File Size
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#21262d] hover:text-slate-900 dark:hover:text-white",
                isSelectionMode && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30"
              )}
            >
              {isSelectionMode ? (
                <><Square className="h-3.5 w-3.5" />Cancel</>
              ) : (
                <><CheckSquare className="h-3.5 w-3.5" />Select</>
              )}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              className="h-8 text-xs gap-1.5 bg-[#146f84] hover:bg-[#105e6e] text-white font-medium"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload to Sophia
            </Button>

            <Button
              onClick={() => handleDownloadKnowledgeBase()}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#21262d] hover:text-slate-900 dark:hover:text-white"
              disabled={documents.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Download Library
            </Button>

            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#21262d]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isSelectionMode && (
            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedDocuments.length === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-blue-400">
                  {selectedDocuments.length} of {filteredAndSortedDocuments.length} selected
                </span>
              </div>
              {selectedDocuments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 bg-[#161b22] border-[#30363d] text-slate-300">
                    <Download className="h-3.5 w-3.5" />
                    Download ({selectedDocuments.length})
                  </Button>
                  <Button variant="destructive" size="sm" className="h-7 text-xs gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete ({selectedDocuments.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadingFiles).length > 0 && (
          <div className="p-4 border-b border-gray-200 bg-slate-50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">
                  Uploading to Sophia {Object.keys(uploadingFiles).length} file(s)
                </span>
                <Badge className="bg-[#146f84]/10 text-[#146f84] border-0">
                  In Progress
                </Badge>
              </div>

              {Object.entries(uploadingFiles).map(([fileId, file]) => (
                <div key={fileId} className="flex items-center gap-3 p-3 bg-white dark:bg-[#353d4f] rounded-lg border dark:border-[#3d4555]">
                  <FileIcon className="h-4 w-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={file.progress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500">{file.progress}%</span>
                    </div>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      file.status === 'success' ? 'default' :
                        file.status === 'error' ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {file.status === 'success' ? 'Complete' :
                      file.status === 'error' ? 'Failed' :
                        file.status === 'uploading' ? 'Uploading' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-[#146f84]/30 border-t-[#146f84] rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Loading Sophia documents...</p>
              </div>
            ) : filteredAndSortedDocuments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-[#146f84]/10 rounded-xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#146f84]/20">
                  <FileText className="h-7 w-7 text-[#146f84]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {searchQuery ? 'No matching documents' : 'No documents yet'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-5">
                  {searchQuery
                    ? 'Try adjusting your search or upload a new document'
                    : 'Upload your first document to get started with Sophia\'s AI search'
                  }
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    className="gap-2 bg-[#146f84] hover:bg-[#105e6e] text-white"
                  >
                    <Upload className="h-4 w-4" />
                    Upload to Sophia
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredAndSortedDocuments.map((document) => {
                  const liveData = liveProgress[document.document_id]
                  const currentStatus = liveData ? liveData.status : document.status
                  const currentStage = liveData ? liveData.stage : document.stage
                  const currentProgress = liveData ? liveData.progress : (document.progress || 0)
                  const currentError = (liveData && currentStatus === 'failed') ? liveData.error : document.error

                  const getStatusMessage = (status: string, stage: string) => {
                    if (status === 'failed' || status === 'FAILED') return 'Processing failed'
                    if (status === 'completed' || status === 'COMPLETED' || status === 'active' || status === 'success') return 'Ready'
                    if (['queued', 'pending', 'QUEUED', 'PENDING'].includes(status)) {
                      if (!stage || stage === 'QUEUED' || stage === 'PENDING') return 'Waiting in queue'
                    }

                    const normalizedStage = stage?.toUpperCase()
                    switch (normalizedStage) {
                      case 'PREPARING_DOCUMENT': return 'Preparing document'
                      case 'TEXT_EXTRACTION':
                      case 'EXTRACTING_TEXT':
                      case 'EXTRACTING_NATIVE_TEXT': return 'Reading native text'
                      case 'OCR_PROCESSING':
                      case 'OCR_IMAGE_ANALYSIS': return 'Scanning pure images'
                      case 'VISION_ANALYSIS':
                      case 'VLM_ANALYSIS': return 'AI image analysis'
                      case 'CHUNKING':
                      case 'CHUNKING_TEXT': return 'Optimizing for search'
                      case 'EMBEDDING':
                      case 'GENERATING_EMBEDDINGS': return 'Indexing knowledge'
                      case 'VECTOR_INSERT':
                      case 'STORING_VECTORS': return 'Saving knowledge bits'
                      case 'COMPLETED': return 'Sophia Ready'
                      default: return stage || 'Processing'
                    }
                  }

                  const isProcessing = ['queued', 'processing', 'pending', 'QUEUED', 'PROCESSING', 'PENDING'].includes(currentStatus)
                  const isCompleted = ['completed', 'COMPLETED', 'active', 'success'].includes(currentStatus)

                  return (
                    <div
                      key={document.document_id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors",
                        "bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#21262d] hover:border-slate-300 dark:hover:border-[#30363d] hover:bg-slate-50 dark:hover:bg-[#1c2128]",
                        isSelectionMode && selectedDocuments.includes(document.document_id) && "bg-[#146f84]/5 dark:bg-[#146f84]/10 border-slate-200 dark:border-[#146f84]/30"
                      )}
                      onClick={() => { if (isSelectionMode) toggleDocumentSelection(document.document_id) }}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <Checkbox
                          checked={selectedDocuments.includes(document.document_id)}
                          onCheckedChange={() => toggleDocumentSelection(document.document_id)}
                          className="h-4 w-4 flex-shrink-0"
                        />
                      )}

                      {/* File icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-100 dark:bg-[#21262d] flex items-center justify-center">
                        {getFileIcon(document)}
                      </div>

                      {/* Info - takes all remaining space */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {document.filename}
                          </h4>
                          {!isProcessing && (
                            <Badge
                              variant="default"
                              className={cn("text-[10px] border-0 px-1.5 py-0",
                                isCompleted ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" :
                                  currentStatus === 'failed' || currentStatus === 'FAILED' ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400" :
                                    "bg-[#146f84]/10 dark:bg-[#146f84]/10 text-[#146f84]")}
                            >
                              {isCompleted ? 'Sophia Ready' : currentStatus === 'failed' || currentStatus === 'FAILED' ? 'Failed' : `${document.chunk_count || 0} chunks`}
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="default" className="text-[10px] border-0 px-1.5 py-0 bg-[#146f84]/10 text-[#146f84]">
                              {document.chunk_count || 0} chunks
                            </Badge>
                          )}
                        </div>

                        {isProcessing ? (
                          <div className="mt-2 mb-2 w-full">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-[#146f84] font-medium">{getStatusMessage(currentStatus, currentStage)}</span>
                              <span className="text-gray-500">{currentProgress}%</span>
                            </div>
                            <Progress value={currentProgress} className="h-1.5 bg-slate-100 w-full" />
                          </div>
                        ) : (
                          (document.description || document.metadata?.description) && (
                            <p className="text-sm text-gray-600 dark:text-white line-clamp-1 mb-1">
                              {document.description || document.metadata?.description}
                            </p>
                          )
                        )}

                        {currentStatus === 'failed' && currentError && (
                          <div className="mt-2 text-xs text-red-600 flex items-start gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{currentError}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>{formatFileSize(document.size_bytes)}</span>
                          <span>{formatDate(document.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions - pinned to the right */}
                      {!isSelectionMode && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                          {isCompleted && (
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleDownloadDocument(document) }}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#21262d]"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                onClick={(e) => e.stopPropagation()}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#21262d]"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {isCompleted && (
                                <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              {currentStatus === 'failed' && (
                                <DropdownMenuItem disabled={retryingDocs.has(document.document_id)} onClick={(e) => handleRetryDocument(document.document_id, e as any)}>
                                  <RefreshCw className={cn("h-4 w-4 mr-2", retryingDocs.has(document.document_id) && "animate-spin")} />
                                  Retry Processing
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEditDocument(document)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Description
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteDocument(document)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete from Sophia
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Hidden file input — PDF only, single file */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.json,.txt,.docx,.doc,.md,.odt,.oxt"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload([file])
            e.target.value = ''
          }}
        />

        {/* Drag and Drop Overlay */}
        {
          isDragOver && (
            <div className="absolute inset-0 bg-[#146f84]/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#353d4f] p-8 rounded-2xl shadow-xl border-2 border-dashed border-[#146f84]/40 dark:border-[#146f84]/50 text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 text-[#146f84]" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Drop files to upload to Sophia
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Release to add documents to Sophia's knowledge base
                </p>
              </div>
            </div>
          )
        }

        {/* Edit Document Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] shadow-2xl p-0 overflow-hidden gap-0">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-[#21262d]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">Edit Sophia Document</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Update the metadata and description for this document within the knowledge base.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="filename" className="text-sm font-medium text-slate-700 dark:text-slate-200">Filename</Label>
                <Input
                  id="filename"
                  value={documentToEdit?.filename || ''}
                  disabled
                  className="bg-slate-100 dark:bg-[#0d1117]/50 border-slate-200 dark:border-[#30363d] text-slate-500 dark:text-slate-400 opacity-80 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add a description to help Sophia understand this document..."
                  rows={4}
                  className="resize-none bg-white dark:bg-[#0d1117] border-slate-200 dark:border-[#30363d] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-500/30 focus-visible:border-blue-500/50 dark:focus-visible:border-blue-500/50 transition-all"
                />
              </div>

              <Alert className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 rounded-lg py-3">
                <AlertCircle className="h-4 w-4 text-[#146f84]" />
                <AlertDescription className="text-slate-600 dark:text-slate-300 text-xs ml-2 leading-relaxed">
                  Document editing will be available soon with the new Sophia backend.
                </AlertDescription>
              </Alert>
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 dark:border-[#21262d] flex justify-end gap-3 bg-slate-50/50 dark:bg-[#11151c]/50">
              <Button
                variant="outline"
                onClick={() => setIsRenameDialogOpen(false)}
                className="bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#21262d] hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDocument}
                disabled={true}
                className="bg-[#146f84] text-white hover:bg-[#105e6e] border-0 transition-colors opacity-90"
              >
                Coming Soon
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Document Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent hideCloseButton={true} className="sm:max-w-[450px] bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] shadow-2xl p-0 overflow-hidden gap-0">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-[#21262d]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  Delete Sophia Document
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Permanently remove this document and all its processed embeddings from the Sophia knowledge base.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6">
              <Alert className="border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 rounded-lg py-3">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-300 text-sm ml-2 leading-relaxed font-medium">
                  Are you sure you want to delete <span className="font-bold underline decoration-red-300/50 underline-offset-2">"{documentToEdit?.filename}"</span> from Sophia? This action cannot be undone and will remove all associated embeddings.
                </AlertDescription>
              </Alert>
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 dark:border-[#21262d] flex justify-end gap-3 bg-slate-50/50 dark:bg-[#11151c]/50">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteDocumentMutation.isPending}
                className="bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#21262d] hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteDocumentMutation.isPending}
                className="bg-red-600 dark:bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 border-0 transition-colors"
              >
                {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete from Sophia'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </div >
  )
}