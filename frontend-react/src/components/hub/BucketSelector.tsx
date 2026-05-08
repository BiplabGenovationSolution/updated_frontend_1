// frontend/src/components/hub/BucketSelector.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  BarChart3,
  Search,
  Database,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatFileSize } from '@/lib/utils'

interface Bucket {
  bucket_id: string
  name: string
  description?: string
  filename: string
  file_type: string
  file_size: number
  row_count: number
  column_count: number
  access_count: number
  created_at: string
}

interface BucketSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (bucket: Bucket) => void
  selectedBucketId?: string | null
}

export function BucketSelector({
  open,
  onOpenChange,
  onSelect,
  selectedBucketId
}: BucketSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const { data: bucketsData, isLoading, error } = useQuery({
    queryKey: ['buckets'],
    queryFn: () => apiClient.getBuckets(),
    enabled: open,
  })

  const buckets = bucketsData?.data || []

  const filteredBuckets = buckets.filter((bucket: Bucket) =>
    bucket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bucket.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (bucket: Bucket) => {
    onSelect(bucket)
    onOpenChange(false)
    toast({
      title: 'Data Bucket Selected',
      description: `Now analyzing ${bucket.name}`,
      duration: 2000
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            Select Data Bucket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search data buckets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600 dark:text-cyan-400" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load data buckets</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please try again later</p>
            </div>
          )}

          {/* Bucket List */}
          {!isLoading && !error && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredBuckets.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery ? 'No buckets match your search' : 'No data buckets available'}
                    </p>
                  </div>
                ) : (
                  filteredBuckets.map((bucket: Bucket) => (
                    <button
                      key={bucket.bucket_id}
                      onClick={() => handleSelect(bucket)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                        "hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:shadow-sm",
                        selectedBucketId === bucket.bucket_id
                          ? "border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <FileSpreadsheet className="h-5 w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {bucket.name}
                            </h3>
                            {selectedBucketId === bucket.bucket_id && (
                              <CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                            )}
                          </div>

                          {/* Description */}
                          {bucket.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {bucket.description}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge variant="secondary" className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-0 text-xs">
                              <Database className="h-3 w-3 mr-1" />
                              {bucket.row_count.toLocaleString()} rows
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-0 text-xs">
                              {bucket.column_count} columns
                            </Badge>
                            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-0 text-xs">
                              {formatFileSize(bucket.file_size)}
                            </Badge>
                          </div>

                          {/* Details */}
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span className="truncate">{bucket.filename}</span>
                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                              <Activity className="h-3 w-3" />
                              <span>{bucket.access_count} accesses</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Footer Stats */}
          {!isLoading && !error && buckets.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {filteredBuckets.length} of {buckets.length} buckets
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}