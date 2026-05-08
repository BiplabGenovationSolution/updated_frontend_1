'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Code2,
  MoreHorizontal,
  Edit3,
  Trash2,
  RefreshCw,
  GitBranch,
  FolderGit2,
  Activity,
  AlertCircle,
  GitCommit,
  Play,
  Sparkles,
  Shield,
  CheckCircle2,
  FileSearch,
  ScrollText,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { UpdateCodebase } from './UpdateCodebase'

type SessionMode = 'create' | 'quality_assessment' | 'security_assessment' | 'policy_assessment'

const SESSION_MODES = [
  {
    value: 'create' as SessionMode,
    label: 'Interactive Session',
    desc: 'Full development environment with IDE and terminal',
    icon: Play,
    color: 'text-[#146f84]',
    bg: 'bg-[#146f84]/10',
  },
  {
    value: 'quality_assessment' as SessionMode,
    label: 'Quality Assessment',
    desc: 'Step-by-step review of project structure, code patterns, and best practices',
    icon: CheckCircle2,
    color: 'text-[#146f84]',
    bg: 'bg-[#146f84]/10',
  },
  {
    value: 'security_assessment' as SessionMode,
    label: 'Security Assessment',
    desc: 'Find vulnerabilities, dependency issues, and security loopholes',
    icon: Shield,
    color: 'text-[#146f84]',
    bg: 'bg-[#146f84]/10',
  },
  {
    value: 'policy_assessment' as SessionMode,
    label: 'Policy Assessment',
    desc: 'Check compliance against SOC2, HIPAA, or custom policies',
    icon: ScrollText,
    color: 'text-[#146f84]',
    bg: 'bg-[#146f84]/10',
  },
]

export function CodebaseList() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedCodebase, setSelectedCodebase] = useState<string | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [codebaseToEdit, setCodebaseToEdit] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [codebaseToDelete, setCodebaseToDelete] = useState<any>(null)

  // Session mode selection
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false)
  const [codebaseForSession, setCodebaseForSession] = useState<any>(null)
  const [sessionMode, setSessionMode] = useState<SessionMode>('create')
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('')

  // Fetch policies for policy assessment mode
  const { data: policiesData } = useQuery({
    queryKey: ['policies'],
    queryFn: () => apiClient.getPolicies(),
    enabled: isModeDialogOpen,
  })

  const { data: codebasesData, isLoading, error } = useQuery({
    queryKey: ['codebases'],
    queryFn: () => apiClient.getCodebases(),
  })

  const deleteCodebaseMutation = useMutation({
    mutationFn: (codebaseId: string) => apiClient.deleteCodebase(codebaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codebases'] })
      setIsDeleteDialogOpen(false)
      setCodebaseToDelete(null)
      toast({
        title: 'Success',
        description: 'Codebase deleted successfully',
        duration: 2000
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete codebase',
        variant: 'destructive',
        duration: 2000
      })
    },
  })


  const startInteractiveSessionMutation = useMutation({
    mutationFn: async ({ codebase, mode, policyId }: { codebase: any; mode: SessionMode; policyId?: string }) => {
      const payload: any = {
        mode,
        timeout_hours: 1,
        codebase_id: codebase.codebase_id,
        start_from_scratch: false,
      }

      // Map mode to assessment_mode
      if (mode === 'quality_assessment') payload.assessment_mode = 'quality'
      if (mode === 'security_assessment') payload.assessment_mode = 'security'
      if (mode === 'policy_assessment') {
        payload.assessment_mode = 'policy'
        if (policyId) payload.policy_id = policyId
      }

      const response = await apiClient.createClavisPodSession(payload)

      if (!response.success || !response.data?.session?.session_id) {
        throw new Error('Failed to create Clavis pod session')
      }

      return {
        sessionId: response.data.session.session_id,
        codebaseId: codebase.codebase_id,
        mode,
      }
    },
    onSuccess: ({ sessionId, mode }) => {
      const modeLabel = SESSION_MODES.find(m => m.value === mode)?.label || 'Session'
      toast({
        title: `${modeLabel} started`,
        description: mode === 'create'
          ? 'Launching Theia IDE with full development environment...'
          : `Running ${modeLabel.toLowerCase()} on your codebase...`,
      })
      navigate(`/clavis/ide/${sessionId}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start session',
        variant: 'destructive',
      })
    },
  })

  const reindexCodebaseMutation = useMutation({
    mutationFn: (codebaseId: string) => apiClient.reindexCodebase(codebaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codebases'] })
      toast({
        title: 'Success',
        description: 'Codebase reindexed successfully',
        duration: 2000
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reindex codebase',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-[#105e6e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading codebases...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load codebases. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const codebases = codebasesData?.data || []

  if (codebases.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-[#146f84]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Code2 className="h-7 w-7 text-[#146f84]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Codebases</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
          Add your first codebase to start analyzing and searching code with Clavis
        </p>
      </div>
    )
  }

  const handleEdit = (codebase: any) => {
    setCodebaseToEdit(codebase)
    setTimeout(() => setIsUpdateDialogOpen(true), 100)
  }

  const handleDeleteClick = (codebase: any) => {
    setCodebaseToDelete(codebase)
    setTimeout(() => setIsDeleteDialogOpen(true), 100)
  }

  const handleDeleteConfirm = () => {
    if (codebaseToDelete) {
      deleteCodebaseMutation.mutate(codebaseToDelete.codebase_id)
    }
  }

  const handleReindex = (codebase: any) => {
    reindexCodebaseMutation.mutate(codebase.codebase_id)
  }

  const handleStartInteractiveSession = (codebase: any) => {
    setCodebaseForSession(codebase)
    setSessionMode('create')
    setSelectedPolicyId('')
    // Delay dialog open to let DropdownMenu fully close first
    // prevents Radix focus-trap conflict between DropdownMenu and Dialog
    setTimeout(() => setIsModeDialogOpen(true), 100)
  }

  const handleConfirmSessionStart = () => {
    if (!codebaseForSession) return
    if (sessionMode === 'policy_assessment' && !selectedPolicyId) {
      return
    }
    // Don't close the dialog immediately, wait for mutation results
    startInteractiveSessionMutation.mutate({
      codebase: codebaseForSession,
      mode: sessionMode,
      policyId: selectedPolicyId || undefined,
    })
  }

  return (
    <>
      {/* Codebases Grid - Updated to match Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {codebases.map((codebase: any) => (
          <Card
            key={codebase.codebase_id}
            className={cn(
              "relative transition-all duration-200 cursor-pointer group bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 hover:border-blue-400/40 dark:hover:border-blue-500/30 flex flex-col h-full rounded-md",
              selectedCodebase === codebase.codebase_id && "border-[#146f84]/40 dark:border-[#146f84]/40"
            )}
            onClick={() => setSelectedCodebase(codebase.codebase_id)}
          >
            <div className="flex items-start justify-between p-4 mb-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">{codebase.repo_name}</h3>
                  <Badge className="text-[10px] mt-1 bg-[#146f84]/10 text-[#146f84] border-0 font-medium">
                    {codebase.source_type === 'scratch'
                      ? 'From Scratch'
                      : codebase.repo_type === 'cloned' || codebase.source_type === 'git'
                        ? 'Git Repository'
                        : 'Local Folder'}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(codebase)
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Codebase
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReindex(codebase)
                    }}
                    disabled={reindexCodebaseMutation.isPending}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4 mr-2",
                      reindexCodebaseMutation.isPending && "animate-spin"
                    )} />
                    Reindex
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartInteractiveSession(codebase)
                    }}
                    disabled={startInteractiveSessionMutation.isPending}
                  >
                    <Play className={cn(
                      "h-4 w-4 mr-2",
                      startInteractiveSessionMutation.isPending && "animate-pulse"
                    )} />
                    Start Interactive Session
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(codebase)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Codebase
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 flex flex-col px-4 pb-4 space-y-3">
              {/* Source URL */}
              {codebase.source_url && (
                <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <GitCommit className="h-3 w-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{codebase.source_url}</p>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Files</span>
                  <span className="text-[11px] font-semibold text-slate-900 dark:text-white">
                    {codebase.total_files?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Code Chunks</span>
                  <span className="text-[11px] font-semibold text-slate-900 dark:text-white">
                    {codebase.total_chunks?.toLocaleString() || 0}
                  </span>
                </div>
                {codebase.commit_hash && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Commit</span>
                    <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                      {codebase.commit_hash.substring(0, 7)}
                    </code>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <Activity className="h-3 w-3" />
                  <span>Indexed {formatDate(codebase.last_indexed)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Update Codebase Dialog */}
      {
        codebaseToEdit && (
          <UpdateCodebase
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            codebase={codebaseToEdit}
            onSuccess={() => {
              setIsUpdateDialogOpen(false)
              setCodebaseToEdit(null)
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
              Delete Codebase
            </DialogTitle>
            <DialogDescription className="pt-3">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{codebaseToDelete?.repo_name}"</span>?
              This action cannot be undone and will permanently remove the codebase and all indexed code chunks.
            </DialogDescription>
          </DialogHeader>

          {codebaseToDelete && (
            <div className="my-4 p-4 bg-slate-50 dark:bg-[#0d1117] rounded-md border border-slate-200 dark:border-slate-800">
              <div className="space-y-2 text-sm">
                {codebaseToDelete.source_url && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0">URL:</span>
                    <span className="font-medium text-gray-900 text-right truncate">
                      {codebaseToDelete.source_url}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Files:</span>
                  <span className="font-medium text-gray-900">{codebaseToDelete.total_files?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chunks:</span>
                  <span className="font-medium text-gray-900">{codebaseToDelete.total_chunks?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{codebaseToDelete.repo_type}</span>
                </div>
              </div>
            </div>
          )}

          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              This will permanently delete the codebase and all indexed code chunks. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setCodebaseToDelete(null)
              }}
              disabled={deleteCodebaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCodebaseMutation.isPending}
            >
              {deleteCodebaseMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Codebase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Mode Selection Dialog */}
      <Dialog open={isModeDialogOpen} onOpenChange={setIsModeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Start Session
            </DialogTitle>
            <DialogDescription className="pt-2">
              Choose how you want to work with{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {codebaseForSession?.repo_name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            {SESSION_MODES.map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.value}
                  onClick={() => setSessionMode(mode.value)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-md border transition-all text-left",
                    sessionMode === mode.value
                      ? "border-[#146f84] bg-[#146f84]/5 dark:bg-[#146f84]/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-[#146f84]/40"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", mode.bg)}>
                    <Icon className={cn("h-4 w-4", mode.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{mode.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{mode.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Policy selector — only shown for policy_assessment mode */}
          {sessionMode === 'policy_assessment' && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3 bg-slate-50 dark:bg-[#0d1117]">
              <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                Select Policy
              </label>
              {(policiesData?.data?.policies?.length || 0) === 0 ? (
                <p className="text-xs text-gray-500">
                  No policies yet. Create one in the Policies tab of Data Hub.
                </p>
              ) : (
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="">Choose a policy...</option>
                  {(policiesData?.data?.policies || []).map((policy: any) => (
                    <option key={policy.policy_id} value={policy.policy_id}>
                      {policy.name} ({policy.framework})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModeDialogOpen(false)}
              disabled={startInteractiveSessionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSessionStart}
              disabled={startInteractiveSessionMutation.isPending}
              className="bg-[#146f84] hover:bg-[#105e6e] text-white"
            >
              {startInteractiveSessionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start {SESSION_MODES.find(m => m.value === sessionMode)?.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}