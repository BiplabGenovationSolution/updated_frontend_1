// frontend/src/components/chat/SophiaSourcePanel.tsx
'use client'

import {
  FileText,
  X,
  Download,
  Database,
  Copy,
  Star,
  Quote,
  ExternalLink,
  FileType,
  Calendar,
  HardDrive,
  Lightbulb,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface SophiaSource {
  filename: string
  relevance: number
  excerpt?: string
  document_id?: string
  document_name?: string
  score?: number
  content_preview?: string
  full_content?: string
  chunk_index?: number
  metadata?: {
    size_bytes?: number
    content_type?: string
    created_at?: string
    chunk_index?: number
  }
}

interface SophiaSourcePanelProps {
  source: SophiaSource | null
  isVisible: boolean
  onClose: () => void
  knowledgeBaseName?: string
  knowledgeBaseId?: string
}

export function SophiaSourcePanel({
  source,
  isVisible,
  onClose,
  knowledgeBaseName,
  knowledgeBaseId
}: SophiaSourcePanelProps) {
  const { toast } = useToast()

  if (!isVisible || !source) return null

  // Debug logging to see what data we have
  console.log('🔍 === SOPHIA SOURCE PANEL DEBUG ===')
  console.log('Source object:', JSON.stringify(source, null, 2))
  console.log('full_content:', source.full_content)
  console.log('content_preview:', source.content_preview)
  console.log('excerpt:', source.excerpt)

  const filename = source.document_name || source.filename || 'Unknown Document'
  const relevance = source.score || source.relevance || 0
  const fullContent = source.full_content || source.content_preview || source.excerpt || ''
  const chunkIndex = source.chunk_index ?? source.metadata?.chunk_index
  const metadata = source.metadata || {}

  console.log('Computed fullContent length:', fullContent.length)
  console.log('Computed fullContent:', fullContent)

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(fullContent)
      toast({
        title: 'Content Copied',
        description: 'Full chunk content copied to clipboard',
        duration: 2000
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy content',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleDownload = () => {
    try {
      if (!fullContent) {
        toast({
          title: 'No Content',
          description: 'No content available to download',
          variant: 'destructive',
          duration: 2000
        })
        return
      }

      // Create a blob with the chunk content
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Generate filename with document name and chunk index
      const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const chunkSuffix = chunkIndex !== undefined ? `_chunk_${chunkIndex}` : ''
      link.download = `${sanitizedFilename}${chunkSuffix}.txt`

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Download Started',
        description: `Downloading chunk content from ${filename}`,
        duration: 2000
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to download chunk content',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.9) return 'text-emerald-700 bg-emerald-100'
    if (relevance >= 0.7) return 'text-blue-700 bg-blue-100'
    if (relevance >= 0.5) return 'text-amber-700 bg-amber-100'
    return 'text-gray-700 bg-gray-100'
  }

  const getRelevanceStars = (relevance: number) => {
    const stars = Math.round(relevance * 5)
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < stars ? "text-yellow-400 fill-current" : "text-gray-300"
        )}
      />
    ))
  }

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full w-[500px] bg-white border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-300",
      isVisible ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-gradient-to-r from-purple-50 to-violet-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Source Details</h3>
            <p className="text-xs text-purple-700">
              {knowledgeBaseName || 'Knowledge Base'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-purple-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-6 space-y-6">
          {/* Document Info Card */}
          <Card className="border-purple-200 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileType className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <h4 className="font-semibold text-gray-900 break-words">
                      {filename}
                    </h4>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Relevance Score */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Relevance Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {getRelevanceStars(relevance)}
                  </div>
                  <Badge className={cn(
                    "text-xs px-2 py-1 font-medium border-0",
                    getRelevanceColor(relevance)
                  )}>
                    {(relevance * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2">
                {metadata.size_bytes !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <HardDrive className="h-4 w-4" />
                      <span>File Size</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatFileSize(metadata.size_bytes)}
                    </span>
                  </div>
                )}

                {metadata.content_type && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileType className="h-4 w-4" />
                      <span>Type</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {metadata.content_type}
                    </span>
                  </div>
                )}

                {metadata.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Uploaded</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatDate(metadata.created_at)}
                    </span>
                  </div>
                )}

                {chunkIndex !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Database className="h-4 w-4" />
                      <span>Chunk Index</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      #{chunkIndex}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Full Chunk Content */}
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Quote className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Full Chunk Content</h4>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    From Similarity Search
                  </Badge>
                </div>
                {fullContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyContent}
                    className="h-7 px-2 text-xs text-purple-700 hover:bg-purple-100"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fullContent ? (
                <>
                  <div className="max-h-96 overflow-y-auto bg-purple-50 border-l-4 border-purple-300 rounded-r-lg p-4">
                    <p className="text-sm text-purple-900 leading-relaxed whitespace-pre-wrap">
                      {fullContent}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {fullContent.length} characters • {fullContent.split(/\s+/).length} words
                  </div>
                </>
              ) : (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-300 rounded-r-lg">
                  <p className="text-sm text-amber-900 leading-relaxed">
                    ⚠️ No chunk content available. This may indicate the document needs to be reprocessed.
                    Check the browser console for debug information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <h4 className="font-semibold text-gray-900">Actions</h4>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Document
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (knowledgeBaseId) {
                    window.open(`/knowledge?kb=${knowledgeBaseId}`, '_blank')
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Knowledge Base
              </Button>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">AI Insights</h4>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-purple-800">
              <p className="leading-relaxed">
                This source was selected by Sophia's enhanced AI based on semantic similarity
                and relevance to your question. The full chunk content shown above represents
                the exact text segment from the document that was retrieved from the vector
                database and used to generate the response.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
