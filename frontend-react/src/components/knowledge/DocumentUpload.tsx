// frontend/src/components/knowledge/DocumentUpload.tsx
// UPDATED TO USE NEW SOPHIA BACKEND ENDPOINTS
'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileText, AlertCircle, CheckCircle, Sparkles, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface DocumentUploadProps {
  knowledgeBaseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface FileUploadState {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function DocumentUpload({ knowledgeBaseId, open, onOpenChange, onSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<FileUploadState | null>(null)
  const [description, setDescription] = useState('')
  const [processImmediately, setProcessImmediately] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const resetForm = () => {
    setSelectedFile(null)
    setDescription('')
    setProcessImmediately(true)
    setIsUploading(false)
  }

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

  const isAllowedType = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    return ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME_TYPES.includes(file.type)
  }

  const setFile = (file: File) => {
    if (!isAllowedType(file)) {
      toast({
        title: 'Invalid file type',
        description: 'Allowed types: PDF, JSON, TXT, DOCX, MD, ODT, OXT.',
        variant: 'destructive',
        duration: 2000,
      })
      return
    }
    setSelectedFile({ file, progress: 0, status: 'pending' })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) setFile(files[0])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || isUploading) return

    setIsUploading(true)
    setSelectedFile(prev => prev ? { ...prev, status: 'uploading', progress: 0 } : null)

    try {
      console.log('📤 Uploading to Sophia:', {
        filename: selectedFile.file.name,
        size: selectedFile.file.size,
        processImmediately,
        knowledgeBaseId
      })

      const response = await apiClient.uploadDocumentToSophiaWithProgress(
        knowledgeBaseId,
        selectedFile.file,
        description.trim() || undefined,
        processImmediately,
        (progress) => {
          setSelectedFile(prev => prev ? { ...prev, progress } : null)
        }
      )

      if (response.success) {
        setSelectedFile(prev => prev ? { ...prev, status: 'success', progress: 100 } : null)
        console.log('✅ Sophia upload successful:', selectedFile.file.name)
        toast({
          title: 'Success',
          description: 'Document uploaded to Sophia successfully',
          duration: 2000,
        })
        onSuccess()
        resetForm()
      } else {
        throw new Error(response.error || 'Upload to Sophia failed')
      }
    } catch (error) {
      console.error('❌ Sophia upload failed:', selectedFile.file.name, error)
      setSelectedFile(prev =>
        prev
          ? { ...prev, status: 'error', progress: 0, error: error instanceof Error ? error.message : 'Upload failed' }
          : null
      )
      toast({
        title: 'Upload Failed',
        description: `Failed to upload "${selectedFile.file.name}"`,
        variant: 'destructive',
        duration: 2000,
      })
    }

    setIsUploading(false)
  }

  const handleClose = () => {
    if (!isUploading) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#146f84]/10 rounded-lg flex items-center justify-center">
              <Upload className="h-4 w-4 text-[#146f84]" />
            </div>
            Upload to Sophia
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Add a PDF document to Sophia's enhanced knowledge base
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Upload Area */}
          <div>
            <Label className="text-sm font-medium text-gray-900">PDF Document</Label>

            {!selectedFile ? (
              /* Drop Zone — shown when no file is selected */
              <div
                className={cn(
                  "mt-2 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200",
                  isDragOver
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('sophia-file-input')?.click()}
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-[#146f84]/10 rounded-xl flex items-center justify-center mb-2">
                    <Upload className="h-5 w-5 text-[#146f84]" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Drop a PDF here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">PDF, JSON, TXT, DOCX, MD, ODT, OXT — one file at a time</p>
                </div>
                <input
                  id="sophia-file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.json,.txt,.docx,.doc,.md,.odt,.oxt"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setFile(file)
                    e.target.value = ''
                  }}
                />
              </div>
            ) : (
              /* Selected File Preview */
              <div
                className={cn(
                  "mt-2 flex items-center gap-3 p-3 border rounded-lg transition-colors",
                  selectedFile.status === 'success' && "bg-green-50 border-green-200",
                  selectedFile.status === 'error' && "bg-red-50 border-red-200",
                  selectedFile.status === 'uploading' && "bg-[#146f84]/5 border-slate-200",
                  selectedFile.status === 'pending' && "bg-gray-50 border-gray-200"
                )}
              >
                {/* Icon */}
                <div className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center flex-shrink-0">
                  {selectedFile.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 text-[#146f84] animate-spin" />
                  )}
                  {selectedFile.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {selectedFile.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {selectedFile.status === 'pending' && (
                    <FileText className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(selectedFile.file.size)}</p>

                  {selectedFile.status === 'uploading' && (
                    <div className="mt-1.5">
                      <Progress value={selectedFile.progress} className="h-1.5" />
                    </div>
                  )}

                  {selectedFile.status === 'error' && selectedFile.error && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">{selectedFile.error}</p>
                  )}
                </div>

                {/* Status / Remove */}
                <div className="flex-shrink-0">
                  {selectedFile.status === 'success' && (
                    <span className="text-xs text-green-700 font-medium">Uploaded</span>
                  )}
                  {selectedFile.status === 'uploading' && (
                    <span className="text-xs text-[#146f84] font-medium">{selectedFile.progress}%</span>
                  )}
                  {(selectedFile.status === 'pending' || selectedFile.status === 'error') && !isUploading && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-900">
              Description{' '}
              <span className="text-gray-500 font-normal ml-1">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this document contains to help Sophia understand it better..."
              rows={2}
              disabled={isUploading}
              className="mt-2 border-gray-200 focus:border-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Processing Options */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Process Immediately</p>
                <p className="text-xs text-gray-600">Start processing as soon as upload completes</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={processImmediately}
              onChange={(e) => setProcessImmediately(e.target.checked)}
              disabled={isUploading}
              className="rounded border-gray-300 text-[#146f84] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <p>Supported: <span className="font-medium">PDF, JSON, TXT, DOCX, MD, ODT, OXT</span> — one file at a time.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || selectedFile.status === 'success' || isUploading}
              className="bg-[#146f84] hover:bg-[#105e6e]"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload to Sophia
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}