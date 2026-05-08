'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code2, GitBranch, CheckCircle, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface UpdateCodebaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codebase: any
  onSuccess: () => void
}

export function UpdateCodebase({ open, onOpenChange, codebase, onSuccess }: UpdateCodebaseProps) {
  const [repoName, setRepoName] = useState('')
  const [maxFiles, setMaxFiles] = useState('100')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (codebase) {
      setRepoName(codebase.repo_name || '')
      setMaxFiles('100')
    }
  }, [codebase])

  const updateCodebaseMutation = useMutation({
    mutationFn: (data: { repo_name: string; max_files: number }) =>
      apiClient.updateCodebase(codebase.codebase_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codebases'] })
      toast({
        title: 'Success',
        description: 'Codebase updated successfully',
        duration: 2000,
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update codebase',
        variant: 'destructive',
        duration: 2000,
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (repoName) {
      updateCodebaseMutation.mutate({
        repo_name: repoName,
        max_files: parseInt(maxFiles)
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Codebase</DialogTitle>
          <p className="text-sm text-slate-500">Update codebase settings and reindex</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Info */}
          <div className="p-4 bg-slate-50 dark:bg-[#0d1117] rounded-md border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Repository</span>
            {codebase?.source_url && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{codebase.source_url}</p>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Files</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{codebase?.total_files || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Chunks</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{codebase?.total_chunks || 0}</p>
              </div>
            </div>
          </div>

          {/* Repository Name */}
          <div>
            <Label htmlFor="repo-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Display Name *
            </Label>
            <Input
              id="repo-name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g., my-awesome-project"
              disabled={updateCodebaseMutation.isPending}
              className="mt-2"
            />
          </div>

          {/* Max Files */}
          <div>
            <Label htmlFor="max-files" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Maximum Files to Index
            </Label>
            <Input
              id="max-files"
              type="number"
              value={maxFiles}
              onChange={(e) => setMaxFiles(e.target.value)}
              min="1"
              max="1000"
              disabled={updateCodebaseMutation.isPending}
              className="mt-2"
            />
            <p className="text-xs text-slate-400 mt-1">Updating this will trigger a reindex</p>
          </div>

          {/* Info Alert */}
          <Alert className="border-[#146f84]/20 bg-[#146f84]/5">
            <AlertCircle className="h-4 w-4 text-[#146f84]" />
            <AlertDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Updating will automatically reindex the codebase with new settings. This may take a few moments.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCodebaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!repoName || updateCodebaseMutation.isPending}
              className="bg-[#146f84] hover:bg-[#105e6e] text-white"
            >
              {updateCodebaseMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update & Reindex
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}