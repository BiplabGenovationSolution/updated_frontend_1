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
  Code2,
  Search,
  GitBranch,
  Terminal,
  CheckCircle,
  Loader2,
  FolderGit2,
  FileCode2,
  Clock,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Codebase } from '@/lib/types'

interface CodebaseSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (codebase: Codebase) => void
  selectedCodebaseId?: string | null
}

export function CodebaseSelector({
  open,
  onOpenChange,
  onSelect,
  selectedCodebaseId
}: CodebaseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const { data: codebasesData, isLoading, error } = useQuery({
    queryKey: ['clavis-codebases'],
    queryFn: async () => {
      const response = await apiClient.getCodebases()
      if (response.success) {
        return response.data || []
      }
      throw new Error(response.error || 'Failed to fetch codebases')
    },
    enabled: open,
    staleTime: 300000,
  })

  const codebases = codebasesData || []

  // Filter codebases
  const filteredCodebases = codebases.filter((repo: Codebase) =>
    repo.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.source_url && repo.source_url.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSelect = (repo: Codebase) => {
    onSelect(repo)
    onOpenChange(false)
    toast({
      title: 'Codebase Selected',
      description: `Clavis is now focused on ${repo.repo_name}`,
      duration: 2000
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Code2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Select Codebase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load codebases</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please try again later</p>
            </div>
          )}

          {/* Repo List */}
          {!isLoading && !error && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {/* Option: Start from Scratch (No Codebase) */}
                <div
                  onClick={() => {
                    onSelect(null as any)
                    onOpenChange(false)
                    toast({
                      title: 'No Codebase Selected',
                      description: 'Clavis will work in general mode without code context',
                    })
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative group",
                    "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm",
                    !selectedCodebaseId
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  )}
                >
                  {/* Blue accent border */}
                  <div className={cn(
                    "absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b rounded-l-xl transition-opacity",
                    !selectedCodebaseId
                      ? "from-blue-500 to-cyan-500 opacity-100"
                      : "from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100"
                  )} />

                  <div className="flex items-start justify-between gap-4 pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          !selectedCodebaseId
                            ? "bg-blue-100 dark:bg-blue-900/60"
                            : "bg-gray-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40"
                        )}>
                          <Terminal className={cn(
                            "h-5 w-5",
                            !selectedCodebaseId
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          )} />
                        </div>
                        <h3 className={cn(
                          "font-semibold",
                          !selectedCodebaseId
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-gray-900 dark:text-slate-200"
                        )}>
                          Start from Scratch (No Codebase)
                        </h3>
                        {!selectedCodebaseId && (
                          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-auto" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Chat with Clavis without a specific codebase. General coding assistant mode.
                      </p>
                    </div>
                  </div>
                </div>

                {filteredCodebases.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderGit2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery ? 'No repositories match your search' : 'No codebases added yet'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Add a codebase from Settings → Clavis Codebases
                    </p>
                  </div>
                ) : (
                  filteredCodebases.map((repo: Codebase) => (
                    <div
                      key={repo.codebase_id}
                      onClick={() => handleSelect(repo)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative group",
                        "hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-sm",
                        selectedCodebaseId === repo.codebase_id
                          ? "border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-950/40 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:bg-orange-50/50 dark:hover:bg-orange-900/20"
                      )}
                    >
                      {/* Orange accent border */}
                      <div className={cn(
                        "absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b rounded-l-xl transition-opacity",
                        selectedCodebaseId === repo.codebase_id
                          ? "from-orange-500 to-red-500 opacity-100"
                          : "from-orange-400 to-red-400 opacity-0 group-hover:opacity-100"
                      )} />

                      <div className="flex items-start justify-between gap-4 pl-2">
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              "p-2 rounded-lg",
                              selectedCodebaseId === repo.codebase_id
                                ? repo.source_type === 'scratch' ? "bg-purple-100 dark:bg-purple-900/60" : "bg-orange-100 dark:bg-orange-900/60"
                                : "bg-gray-100 dark:bg-slate-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40"
                            )}>
                              {repo.source_type === 'scratch' ? (
                                <Sparkles className={cn(
                                  "h-5 w-5",
                                  selectedCodebaseId === repo.codebase_id
                                    ? "text-purple-700 dark:text-purple-400"
                                    : "text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400"
                                )} />
                              ) : (
                                <GitBranch className={cn(
                                  "h-5 w-5",
                                  selectedCodebaseId === repo.codebase_id
                                    ? "text-orange-700 dark:text-orange-400"
                                    : "text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400"
                                )} />
                              )}
                            </div>
                            <h3 className={cn(
                              "font-semibold truncate",
                              selectedCodebaseId === repo.codebase_id
                                ? "text-orange-900 dark:text-orange-100"
                                : "text-gray-900 dark:text-slate-200"
                            )}>
                              {repo.repo_name}
                            </h3>
                            {selectedCodebaseId === repo.codebase_id && (
                              <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 ml-auto" />
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-xs font-normal">
                              <FileCode2 className="h-3 w-3 mr-1" />
                              {repo.total_files} files
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-xs font-normal">
                              {repo.total_chunks.toLocaleString()} chunks
                            </Badge>
                            <Badge variant="secondary" className={cn(
                              "text-xs font-normal border",
                              repo.source_type === 'scratch'
                                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-600"
                                : "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                            )}>
                              {repo.source_type === 'scratch' ? 'From Scratch' : repo.repo_type}
                            </Badge>
                          </div>

                          {/* Details */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-500 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                            <span className="truncate font-mono text-orange-600 dark:text-orange-500/80">
                              {repo.source_type === 'scratch'
                                ? 'Started from scratch'
                                : repo.source_url || repo.repo_path || 'No source URL'}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>Indexed {formatDate(repo.last_indexed)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          {!isLoading && !error && codebases.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {filteredCodebases.length} of {codebases.length} repositories
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
