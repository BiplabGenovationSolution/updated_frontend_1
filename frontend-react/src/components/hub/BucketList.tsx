'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  MoreHorizontal,
  Edit3,
  Trash2,
  Download,
  RefreshCw,
  Activity,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api'
import { formatDate, formatFileSize, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { UpdateBucket } from './UpdateBucket'

export function BucketList() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [bucketToEdit, setBucketToEdit] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [bucketToDelete, setBucketToDelete] = useState<any>(null)

  // Pagination states
  const [page, setPage] = useState(0)
  const limit = 10
  const skip = page * limit

  const { data: bucketsData, isLoading, error } = useQuery({
    queryKey: ['buckets', skip, limit],
    queryFn: () => apiClient.getBuckets(limit, skip),
  })

  const deleteBucketMutation = useMutation({
    mutationFn: (bucketId: string) => apiClient.deleteBucket(bucketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buckets'] })
      setIsDeleteDialogOpen(false)
      setBucketToDelete(null)
      toast({
        title: 'Success',
        description: 'Bucket deleted successfully',
        duration: 2000
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete bucket',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading buckets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load buckets. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const buckets = bucketsData?.data || []

  if (buckets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Buckets</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
          Create your first data bucket to start analyzing CSV and Excel files with Analytica
        </p>
      </div>
    )
  }

  const handleEdit = (bucket: any) => {
    setBucketToEdit(bucket)
    setIsUpdateDialogOpen(true)
  }

  const handleDeleteClick = (bucket: any) => {
    setBucketToDelete(bucket)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (bucketToDelete) {
      deleteBucketMutation.mutate(bucketToDelete.bucket_id)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {buckets.map((bucket: any) => {
          const quality = bucket.data_info?.data_quality?.data_completeness ?? null

          return (
            <div
              key={bucket.bucket_id}
              className={cn(
                "group relative bg-white dark:bg-[#161b22] rounded-lg border-2 cursor-pointer",
                "border-slate-300 dark:border-[#30363d] shadow-sm hover:shadow-md overflow-hidden transition-all duration-250",
                selectedBucket === bucket.bucket_id && "ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50/50 dark:bg-[#1e2433]"
              )}
              onClick={() => {
                setSelectedBucket(bucket.bucket_id)
                navigate(`/hub/bucket/${bucket.bucket_id}`)
              }}
            >
              <div className="px-6 py-4 flex items-center justify-between gap-6">

                {/* Left: Headers */}
                <div className="flex flex-col w-[350px] min-w-[350px] shrink-0 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]/50 rounded-md p-3.5">
                  <h3 className="text-[14px] font-semibold text-slate-900 dark:text-slate-300 truncate leading-tight">
                    {bucket.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate mt-1">
                    {bucket.filename}
                  </p>
                </div>

                {/* Middle: Stats */}
                <div className="flex items-center gap-10 flex-1 border-l border-slate-100 dark:border-slate-800 pl-8">
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Rows</span>
                    <span className="text-slate-900 dark:text-slate-300 font-bold tabular-nums text-sm">
                      {bucket.row_count?.toLocaleString() ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Columns</span>
                    <span className="text-slate-900 dark:text-slate-300 font-bold tabular-nums text-sm">
                      {bucket.column_count ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Size</span>
                    <span className="text-slate-900 dark:text-slate-300 font-bold tabular-nums text-sm">
                      {formatFileSize(bucket.file_size || 0)}
                    </span>
                  </div>
                  {quality !== null && (
                    <div className="flex flex-col">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Data Quality</span>
                      <span className="text-slate-900 dark:text-slate-300 font-bold tabular-nums text-sm">
                        {quality.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions & Footer */}
                <div className="flex items-center gap-4 justify-end">
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      <span>{bucket.access_count || 0} accesses</span>
                    </div>
                    <span>{formatDate(bucket.created_at)}</span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(bucket) }}>
                        <Edit3 className="h-4 w-4 mr-2" />Edit Bucket
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: 'Info', description: 'Download feature coming soon', duration: 2000 }) }}>
                        <Download className="h-4 w-4 mr-2" />Download Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: 'Info', description: 'Reprocess feature coming soon', duration: 2000 }) }}>
                        <RefreshCw className="h-4 w-4 mr-2" />Reprocess
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteClick(bucket) }}>
                        <Trash2 className="h-4 w-4 mr-2" />Delete Bucket
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {buckets.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
          >
            Previous
          </Button>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Page {page + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={buckets.length < limit}
            className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
          >
            Next
          </Button>
        </div>
      )}


      {/* Update Bucket Dialog */}
      {
        bucketToEdit && (
          <UpdateBucket
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            bucket={bucketToEdit}
            onSuccess={() => {
              setIsUpdateDialogOpen(false)
              setBucketToEdit(null)
            }}
          />
        )
      }

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Bucket
            </DialogTitle>
            <DialogDescription className="pt-3">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{bucketToDelete?.name}"</span>?
              This action cannot be undone and will permanently remove all associated data and analyses.
            </DialogDescription>
          </DialogHeader>

          {bucketToDelete && (
            <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">File:</span>
                  <span className="font-medium text-gray-900">{bucketToDelete.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rows:</span>
                  <span className="font-medium text-gray-900">{bucketToDelete.row_count?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium text-gray-900">{formatFileSize(bucketToDelete.file_size)}</span>
                </div>
              </div>
            </div>
          )}

          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              This will permanently delete the bucket and all its data. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setBucketToDelete(null)
              }}
              disabled={deleteBucketMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteBucketMutation.isPending}
            >
              {deleteBucketMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Bucket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}