'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface UpdateBucketProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bucket: any
  onSuccess: () => void
}

export function UpdateBucket({ open, onOpenChange, bucket, onSuccess }: UpdateBucketProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Initialize form with bucket data
  useEffect(() => {
    if (bucket) {
      setName(bucket.name || '')
      setDescription(bucket.description || '')
    }
  }, [bucket])

  const updateBucketMutation = useMutation({
    mutationFn: (data: { file?: File; name: string; description: string }) => {
      if (data.file) {
        return apiClient.updateBucket(bucket.bucket_id, data.file, data.name, data.description)
      } else {
        // If no file, just update metadata
        return apiClient.updateBucketMetadata(bucket.bucket_id, data.name, data.description)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buckets'] })
      toast({
        title: 'Success',
        description: 'Bucket updated successfully',
        duration: 2000,
      })
      resetForm()
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bucket',
        variant: 'destructive',
        duration: 2000,
      })
    },
  })

  const resetForm = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

  const handleFileSelect = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setSelectedFile(file)
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV or Excel file',
        variant: 'destructive',
        duration: 2000,
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name) {
      updateBucketMutation.mutate({ file: selectedFile || undefined, name, description })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] shadow-2xl rounded-xl p-0 overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-[#30363d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Update Data Bucket</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update bucket details or replace the data file</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">

            {/* Current File Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-[#30363d]">
              <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-4 w-4 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current File</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{bucket?.filename}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatFileSize(bucket?.file_size || 0)}</p>
              </div>
            </div>

            {/* Replace File (Optional) */}
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Replace File <span className="normal-case font-normal text-slate-400">(optional)</span>
              </label>
              {!selectedFile ? (
                <div
                  className={cn(
                    "mt-2 border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
                    isDragOver
                      ? "border-blue-400 bg-blue-500/5"
                      : "border-slate-300 dark:border-[#30363d] hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
                  onClick={() => document.getElementById('update-bucket-file-input')?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                      <Upload className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Leave empty to keep current file</p>
                  </div>
                  <input
                    id="update-bucket-file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file) }}
                    accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  />
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5">
                  <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {!updateBucketMutation.isPending && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-7 w-7 p-0 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/10 text-slate-500">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Bucket Name */}
            <div>
              <label htmlFor="upd-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Bucket Name *
              </label>
              <Input
                id="upd-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sales Data Q4"
                disabled={updateBucketMutation.isPending}
                className="h-9 text-sm bg-white dark:bg-[#0d1117] border-slate-200 dark:border-[#30363d] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="upd-desc" className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Description <span className="normal-case font-normal text-slate-400">(optional)</span>
              </label>
              <Textarea
                id="upd-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this data contains..."
                rows={3}
                disabled={updateBucketMutation.isPending}
                className="text-sm bg-white dark:bg-[#0d1117] border-slate-200 dark:border-[#30363d] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg resize-none focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
              />
            </div>

            {/* Upload Progress */}
            {updateBucketMutation.isPending && selectedFile && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <div className="w-3.5 h-3.5 border-2 border-blue-400/40 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                    <span className="font-medium">Updating...</span>
                  </div>
                  <span className="text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}

            {/* Warning if replacing file */}
            {selectedFile && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Replacing the file will reprocess all data and may affect existing analyses.</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 dark:border-[#30363d] bg-slate-50/50 dark:bg-white/[0.02]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateBucketMutation.isPending}
              className="h-8 text-xs border-slate-200 dark:border-[#30363d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] bg-white dark:bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name || updateBucketMutation.isPending}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateBucketMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Update Bucket
                </>
              )}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  )
}