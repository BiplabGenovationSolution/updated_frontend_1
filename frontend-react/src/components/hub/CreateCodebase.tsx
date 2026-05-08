"use client";

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code2, GitBranch, FolderGit2, CheckCircle, Sparkles } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CreateCodebaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCodebase({ open, onOpenChange, onSuccess }: CreateCodebaseProps) {
  const [repoType, setRepoType] = useState<'git' | 'local' | 'scratch'>('git')
  const [repoUrl, setRepoUrl] = useState('')
  const [repoName, setRepoName] = useState('')
  const [maxFiles, setMaxFiles] = useState('100')
  const [authType, setAuthType] = useState<'none' | 'token'>('none')
  const [authToken, setAuthToken] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createCodebaseMutation = useMutation({
    mutationFn: (data: any) => apiClient.createCodebase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codebases"] });
      toast({
        title: "Success",
        description: "Codebase created and indexed successfully",
        duration: 2000,
      });
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create codebase",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const createScratchMutation = useMutation({
    mutationFn: (displayName: string) => apiClient.createScratchCodebase(displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codebases'] })
      toast({
        title: 'Success',
        description: 'Empty codebase created. You can now start building with Clavis.',
      })
      resetForm()
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create codebase',
        variant: 'destructive',
      })
    },
  })

  const isPending = createCodebaseMutation.isPending || createScratchMutation.isPending

  const resetForm = () => {
    setRepoType('git')
    setRepoUrl('')
    setRepoName('')
    setMaxFiles('100')
    setAuthType('none')
    setAuthToken('')
    setSelectedFile(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (repoType === 'scratch') {
      createScratchMutation.mutate(repoName)
    } else if (repoType === 'local') {
      // Handle local folder upload
      if (!selectedFile) {
        toast({
          title: 'Error',
          description: 'Please select a ZIP file to upload',
          variant: 'destructive',
        })
        return
      }

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('display_name', repoName)
      formData.append('max_files', maxFiles)

      createCodebaseMutation.mutate({ type: 'folder', data: formData })
    } else {
      // Handle Git repository - legacy endpoint schema
      const data: any = {
        repo_url: repoUrl,
        repo_name: repoName,
        max_files: parseInt(maxFiles),
        auth_type: authType, // 'none' | 'token'
      }

      if (authType === 'token' && authToken) {
        data.auth_token = authToken
      }

      createCodebaseMutation.mutate({ type: 'git', data })
    }
  }

  const isValid = repoType === 'scratch'
    ? !!repoName
    : repoType === 'local'
      ? selectedFile && repoName && parseInt(maxFiles) > 0
      : repoUrl && repoName && parseInt(maxFiles) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Code2 className="h-4 w-4 text-green-600" />
            </div>
            Add Codebase
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Connect a Git repository, upload local code, or start a blank project
          </p>
        </DialogHeader>

        <form id="create-codebase-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Source Type */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Source Type
            </Label>
            <RadioGroup value={repoType} onValueChange={(value: any) => setRepoType(value)}>
              <div className="grid grid-cols-3 gap-3">
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",
                  repoType === 'scratch' ? "border-purple-300 bg-purple-50" : "border-gray-200"
                )}>
                  <RadioGroupItem value="scratch" id="scratch" />
                  <Label htmlFor="scratch" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">From Scratch</span>
                  </Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",
                  repoType === 'git' ? "border-green-300 bg-green-50" : "border-gray-200"
                )}>
                  <RadioGroupItem value="git" id="git" />
                  <Label htmlFor="git" className="flex items-center gap-2 cursor-pointer flex-1">
                    <GitBranch className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Git Repo</span>
                  </Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",
                  repoType === 'local' ? "border-blue-300 bg-blue-50" : "border-gray-200"
                )}>
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FolderGit2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Local Folder</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          {/* File Upload (for local folders) */}
          {repoType === 'local' && (
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium text-gray-900">
                Upload ZIP File *
              </Label>
              <div className="mt-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                      // Auto-fill display name from file name if empty
                      if (!repoName) {
                        setRepoName(file.name.replace('.zip', ''))
                      }
                    }
                  }}
                  disabled={isPending}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Upload a ZIP file containing your project source code
                </p>
              </div>
            </div>
          )}

          {/* Repository URL (for git) */}
          {repoType === 'git' && (
            <div>
              <Label htmlFor="repo-url" className="text-sm font-medium text-gray-900">
                Repository URL *
              </Label>
              <Input
                id="repo-url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository.git"
                disabled={isPending}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be a public Git repository or provide access token
              </p>
            </div>
          )}

          {/* Display Name */}
          <div>
            <Label htmlFor="repo-name" className="text-sm font-medium text-gray-900">
              {repoType === 'scratch' ? 'Project Name *' : 'Display Name *'}
            </Label>
            <Input
              id="repo-name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder={repoType === 'scratch' ? 'e.g., my-new-app' : 'e.g., my-awesome-project'}
              disabled={isPending}
              className="mt-2"
            />
          </div>

          {/* Max Files (only for git and local) */}
          {repoType !== 'scratch' && (
            <div>
              <Label htmlFor="max-files" className="text-sm font-medium text-gray-900">
                Maximum Files to Index
              </Label>
              <Input
                id="max-files"
                type="number"
                value={maxFiles}
                onChange={(e) => setMaxFiles(e.target.value)}
                min="1"
                max="1000"
                disabled={isPending}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit: 1-1000 files (larger codebases may take longer to process)
              </p>
            </div>
          )}

          {/* Authentication (only for git) */}
          {repoType === 'git' && (
            <div>
              <Label className="text-sm font-medium text-gray-900 mb-3 block">
                Authentication
              </Label>
              <RadioGroup value={authType} onValueChange={(value: any) => setAuthType(value)}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="cursor-pointer flex-1">
                      Public Repository (No Auth)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="token" id="token" />
                    <Label htmlFor="token" className="cursor-pointer flex-1">
                      Private Repository (Access Token)
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {authType === 'token' && (
                <div className="mt-3">
                  <Input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    disabled={isPending}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    GitHub Personal Access Token with repo access
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Alert */}
          <Alert className={cn(
            repoType === 'scratch' ? "border-purple-200 bg-purple-50" : "border-green-200 bg-green-50"
          )}>
            <Code2 className={cn(
              "h-4 w-4",
              repoType === 'scratch' ? "text-purple-600" : "text-green-600"
            )} />
            <AlertDescription className={cn(
              "text-sm",
              repoType === 'scratch' ? "text-purple-800" : "text-green-800"
            )}>
              <div className="space-y-1">
                {repoType === 'scratch' ? (
                  <>
                    <p className="font-medium">Start with a blank canvas:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      <li>Create an empty project workspace</li>
                      <li>Build your application from the ground up</li>
                      <li>Let Clavis AI help you write code from scratch</li>
                      <li>Launch a dev pod to start coding immediately</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Clavis will automatically:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      {repoType === 'git' ? (
                        <>
                          <li>Clone and analyze your codebase</li>
                          <li>Index all supported file types</li>
                          <li>Create searchable code chunks</li>
                          <li>Enable semantic code search</li>
                        </>
                      ) : (
                        <>
                          <li>Extract and analyze your ZIP file</li>
                          <li>Index all supported file types</li>
                          <li>Create searchable code chunks</li>
                          <li>Enable semantic code search</li>
                        </>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </form>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-100 dark:border-[#30363d] shrink-0 bg-slate-50/50 dark:bg-[#161b22]/50 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              form="create-codebase-form"
              type="submit"
              disabled={!isValid || isPending}
              className={cn(
                repoType === 'scratch'
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {repoType === 'scratch' ? 'Creating Project...' : 'Creating & Indexing...'}
                </>
              ) : (
                <>
                  {repoType === 'scratch' ? (
                    <Sparkles className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {repoType === 'scratch' ? 'Create Project' : 'Create Codebase'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
