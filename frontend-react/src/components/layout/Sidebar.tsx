'use client'

import { useState, useCallback, useMemo } from 'react'
import React from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreHorizontal,
  ChevronsLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Archive,
  RotateCcw,
  Copy,
  Share,
  Bot,
  Database,
  Plug,
  Library,
  Zap,
  Code,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'


import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime, truncateText, sanitizeChatData, debugChatData, isValidAgentType, cn, deduplicateAgentName } from '@/lib/utils'
import { AGENT_CONFIGS } from '@/lib/constants'
import type { Chat } from '@/lib/types'

import { TasksIndicatorCompact } from '@/components/tasks/TasksIndicator'

interface SidebarProps {
  isOpen: boolean
  onChatSelect: (chatId: string | null, agentType?: string) => void
  selectedChatId: string | null
  isCollapsed: boolean
  onToggleCollapse: () => void
}

type ViewMode = 'active' | 'deleted' | 'all'

export function Sidebar({ isOpen, onChatSelect, selectedChatId, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode] = useState<ViewMode>('active') // Fixed to 'active' only
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set())
  const [isSelectionMode] = useState(false) // Fixed to false
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [deletedCurrentChatPopup, setDeletedCurrentChatPopup] = useState(false)

  // Explicitly check the router search params, overcoming AppLayout passing null
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const actualSelectedChatId = selectedChatId || searchParams.get('id')

  // FIXED: Enhanced fetch active chats with field mapping validation
  const { data: activeChatsData, refetch: refetchActiveChats, isLoading: activeChatsLoading } = useQuery({
    queryKey: ['chats', 'active'],
    queryFn: async () => {
      console.log('📥 Sidebar: Fetching active chats')
      const result = await apiClient.getChats({ limit: 50, offset: 0, status: 'active' })

      if (result.success && result.data) {
        console.log('✅ Sidebar: Active chats fetched (after API field mapping):', {
          total: result.data.length,
          sophia: result.data.filter(chat => chat.agent_type === 'sophia').length,
          aegis: result.data.filter(chat => chat.agent_type === 'aegis').length,
          invalid: result.data.filter(chat => !isValidAgentType(chat.agent_type)).length
        })

        // Validate agent types (should be mapped by API client)
        result.data.forEach(chat => {
          if (!isValidAgentType(chat.agent_type)) {
            console.error('❌ Sidebar: Invalid agent_type after API mapping:', {
              chatId: chat.id,
              title: chat.title?.substring(0, 30),
              agent_type: chat.agent_type
            })
            debugChatData(chat, 'Sidebar Active Chats - Still Invalid After API Mapping')
          }
        })
      } else {
        console.error('❌ Sidebar: Failed to fetch active chats:', result)
      }

      return result
    },
  })

  // FIXED: Enhanced fetch deleted chats with field mapping validation
  // Mutations
  const renameChatMutation = useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      apiClient.renameChat(chatId, title),
    onSuccess: () => {
      refetchActiveChats()
      setIsRenameDialogOpen(false)
      setRenamingChatId(null)
      setNewChatTitle('')
      toast({
        title: 'Success',
        description: 'Chat renamed successfully',
        duration: 2000,
      })
    },
    onError: (error) => {
      console.error('Failed to rename chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to rename chat',
        variant: 'destructive',
        duration: 2000,
      })
    },
  })

  const deleteChatMutation = useMutation({
    mutationFn: ({ chatId, hardDelete }: { chatId: string; hardDelete: boolean }) =>
      apiClient.deleteChat(chatId, hardDelete),
    onMutate: ({ chatId }) => {
      if (chatId === actualSelectedChatId) {
        console.log('🔄 Deleting current chat - preparing prompt:', chatId)
        queryClient.setQueryData(['messages', chatId], [])
      }
    },
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      refetchActiveChats()

      if (chatId === actualSelectedChatId) {
        setDeletedCurrentChatPopup(true)
        setTimeout(() => {
          setDeletedCurrentChatPopup(false)
          onChatSelect(null)
          navigate('/agents')
        }, 1000)
      } else {
        toast({
          title: 'Success',
          description: 'Chat deleted successfully',
          duration: 2000,
        })
      }
    },
    onError: (error) => {
      console.error('Failed to delete chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
        duration: 2000,
      })

    },
  })

  const restoreChatMutation = useMutation({
    mutationFn: (chatId: string) => apiClient.restoreChat(chatId),
    onSuccess: () => {
      refetchActiveChats()
      toast({
        title: 'Success',
        description: 'Chat restored successfully',
        duration: 2000,
      })
    },
    onError: (error) => {
      console.error('Failed to restore chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore chat',
        variant: 'destructive',
        duration: 2000,
      })
    },
  })


  // FIXED: Enhanced data processing with field mapping expectation
  const activeChats = activeChatsData?.data || []
  const allChats = activeChats // Only show active chats


  // FIXED: Sanitization with expectation that API client handled field mapping
  const sanitizedChats = useMemo(() => {
    console.log('🔄 Sidebar: Starting chat sanitization (API should have mapped fields)...', {
      totalChats: allChats.length,
      viewMode
    })

    const sanitized = allChats.map((chat, index) => {
      const originalAgentType = chat.agent_type
      const sanitizedChat = sanitizeChatData(chat)

      // Should not need to change agent_type if API client did its job
      if (originalAgentType !== sanitizedChat.agent_type) {
        console.warn('⚠️ Sidebar: Agent type changed during sanitization (API mapping may have failed):', {
          chatId: chat.id,
          title: chat.title?.substring(0, 30),
          original: originalAgentType,
          sanitized: sanitizedChat.agent_type,
          index,
          hasAgentType: 'agent_type' in chat,
          hasAgentTypeCamel: 'agentType' in chat
        })
      }

      return sanitizedChat
    })

    const finalStats = {
      total: sanitized.length,
      sophia: sanitized.filter(chat => chat.agent_type === 'sophia').length,
      aegis: sanitized.filter(chat => chat.agent_type === 'aegis').length,
      invalid: sanitized.filter(chat => !isValidAgentType(chat.agent_type)).length
    }

    console.log('✅ Sidebar: Chat sanitization complete:', finalStats)

    // Log any remaining invalid agent types (indicates API mapping failure)
    if (finalStats.invalid > 0) {
      console.error('❌ Sidebar: Some chats still have invalid agent_type after API mapping and sanitization!', {
        invalidCount: finalStats.invalid,
        totalCount: sanitized.length
      })

      sanitized
        .filter(chat => !isValidAgentType(chat.agent_type))
        .forEach(chat => {
          console.error('❌ Invalid chat details:', {
            id: chat.id,
            title: chat.title?.substring(0, 30),
            agent_type: chat.agent_type,
            status: chat.status
          })
        })
    }

    return sanitized
  }, [allChats, viewMode])

  // Filter chats based on search and view mode
  const filteredChats = useMemo(() => {
    let filtered = sanitizedChats

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(chat =>
        chat.title.toLowerCase().includes(query)
      )
    }

    console.log('🔍 Sidebar: Filtered chats:', {
      total: filtered.length,
      searchQuery: searchQuery || 'none',
      viewMode
    })

    return filtered
  }, [sanitizedChats, searchQuery, viewMode])

  // Handlers
  const handleChatSelect = useCallback((chatId: string) => {
    const chat = sanitizedChats.find(c => c.id === chatId)
    console.log('🔄 Sidebar: Chat selection:', {
      chatId,
      title: chat?.title?.substring(0, 30),
      agent_type: chat?.agent_type
    })
    onChatSelect(chatId, chat?.agent_type)
  }, [sanitizedChats, onChatSelect])

  const handleRenameChat = useCallback((chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId)
    setNewChatTitle(currentTitle)
    setIsRenameDialogOpen(true)
  }, [])

  const handleDeleteChat = useCallback((chatId: string, hardDelete: boolean) => {
    deleteChatMutation.mutate({ chatId, hardDelete })
  }, [deleteChatMutation])

  const handleRestoreChat = useCallback((chatId: string) => {
    restoreChatMutation.mutate(chatId)
  }, [restoreChatMutation])

  const confirmRename = useCallback(() => {
    if (renamingChatId && newChatTitle.trim()) {
      renameChatMutation.mutate({
        chatId: renamingChatId,
        title: newChatTitle.trim()
      })
    }
  }, [renamingChatId, newChatTitle, renameChatMutation])


  const navigate = useNavigate()

  const sidebarNavItems = [
    { name: 'Agents', path: '/agents', icon: Bot },
    { name: 'Data Hub', path: '/hub', icon: Database },
    { name: 'Connectors', path: '/connectors', icon: Plug },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Automations', path: '/automations', icon: Zap },
    { name: 'Capabilities', path: '/capabilities', icon: Wrench },
    { name: 'Clavis', path: '/clavis/pods', icon: Code },
  ]

  const isNavActive = (item: typeof sidebarNavItems[number]) => {
    if (item.name === 'Chat') return location.pathname.startsWith('/chat')
    if (item.name === 'Agents') return location.pathname.startsWith('/agents')
    return location.pathname.startsWith(item.path)
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "h-full flex flex-col transition-all duration-300 ease-in-out relative",
        "bg-slate-50 dark:bg-[#0d1117]",
        "border-r border-slate-200 dark:border-[#21262d]",
        isCollapsed ? "w-14" : "w-64"
      )}>

        {/* Right-border close tab — only when expanded */}
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-4 z-10 flex items-center justify-center h-6 w-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#21262d] text-slate-400 hover:text-[#146f84] hover:bg-slate-50 dark:hover:bg-[#161b22] transition-colors rounded-full shadow-sm cursor-pointer"
            title="Close Sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}

        {/* Header: New Chat + Search */}
        {!isCollapsed && (
          <div className="px-4 pt-3 pb-2 space-y-2 border-b border-gray-200 dark:border-[#21262d]">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onChatSelect(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#1d273e] dark:hover:bg-[#2a3654] text-slate-700 dark:text-[#c9d1d9] font-medium rounded-lg h-9 text-sm border border-slate-200 dark:border-[#21262d]"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Chat
              </Button>
            </div>

            {/* Nav list — vertical, icon + label */}
            <div className="flex flex-col pt-1 -mx-3">
              {sidebarNavItems.map((item) => {
                const active = isNavActive(item)
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'flex items-center gap-3 w-full pl-6 pr-3 h-[38px] transition-all duration-150 relative text-[13px]',
                      active
                        ? 'bg-[#146f84]/5 dark:bg-[#146f84]/10 text-[#146f84] font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#146f84]'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22] hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active ? "text-[#146f84]" : "")} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-[#6e7681]" />
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 h-8 text-xs bg-slate-100 dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-[#c9d1d9] placeholder-slate-400 dark:placeholder-[#6e7681] rounded-md focus:border-[#146f84] dark:focus:border-[#146f84] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Collapsed header: expand arrow + new chat */}
        {isCollapsed && (
          <div className="flex flex-col items-center py-3 gap-2 border-b border-gray-200 dark:border-[#21262d]">
            <Button
              onClick={() => onChatSelect(null)}
              size="icon"
              className="h-8 w-8 bg-[#146f84] hover:bg-[#105e6e] text-white rounded-lg"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-7 w-7 rounded-md border border-slate-200 dark:border-[#21262d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161b22] transition-colors mb-2"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            {/* Nav list — collapsed (only icons) */}
            <div className="flex flex-col w-full">
              {sidebarNavItems.map((item) => {
                const active = isNavActive(item)
                const Icon = item.icon
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'flex items-center justify-center w-full h-10 transition-all duration-150 relative',
                          active
                            ? 'bg-[#146f84]/5 dark:bg-[#146f84]/10 text-[#146f84] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#146f84]'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22] hover:text-slate-700 dark:hover:text-slate-200'
                        )}
                      >
                        <Icon className={cn("h-5 w-5", active ? "text-[#146f84]" : "")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={cn("pt-2 pb-2", isCollapsed ? "px-1" : "px-2")}>

              {/* Section label */}
              {!isCollapsed && !searchQuery && filteredChats.length > 0 && (
                <p className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1.5 text-gray-400 dark:text-[#6e7681]">
                  Conversations
                </p>
              )}

              {activeChatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 dark:border-[#30363d] border-t-[#146f84]" />
                </div>
              ) : filteredChats.length === 0 ? (
                !isCollapsed && (
                  <p className="text-center py-8 text-gray-400 dark:text-[#6e7681] text-xs">
                    {searchQuery ? "No chats found" : "No chats yet"}
                  </p>
                )
              ) : (
                filteredChats.map((chat) => (
                  <OptimizedChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={chat.id === actualSelectedChatId}
                    isSelectionMode={isSelectionMode}
                    isChecked={selectedChats.has(chat.id)}
                    onSelect={handleChatSelect}
                    onRename={handleRenameChat}
                    onDelete={handleDeleteChat}
                    onRestore={handleRestoreChat}
                    isCollapsed={isCollapsed}
                    viewMode={viewMode}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Bottom: Tasks + User info */}
        {!isCollapsed && (
          <div>
            <div className="px-3 py-2">
              <TasksIndicatorCompact />
            </div>
          </div>
        )}

        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Chat</DialogTitle>
            </DialogHeader>
            <div>
              <Label htmlFor="chatTitle">Chat Title</Label>
              <Input
                id="chatTitle"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter new chat title"
                className="mt-1"
                onKeyDown={(e) => { if (e.key === "Enter") confirmRename() }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={renameChatMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={confirmRename} disabled={!newChatTitle.trim() || renameChatMutation.isPending}>
                {renameChatMutation.isPending ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deleted Current Chat Modal */}
        <Dialog open={deletedCurrentChatPopup} onOpenChange={setDeletedCurrentChatPopup}>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl overflow-hidden [&>button]:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-12 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-full text-center">
              Chat Deleted
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
              Your current chat is deleted successfully.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

// -----------------------------------------------------------------------
// Chat Item
// -----------------------------------------------------------------------
interface ChatItemProps {
  chat: Chat
  isSelected: boolean
  isSelectionMode: boolean
  isChecked: boolean
  onSelect: (chatId: string) => void
  onRename: (chatId: string, title: string) => void
  onDelete: (chatId: string, hardDelete: boolean) => void
  onRestore: (chatId: string) => void
  isCollapsed: boolean
  viewMode: ViewMode
}

const OptimizedChatItem = React.memo(({
  chat,
  isSelected,
  isSelectionMode,
  isChecked,
  onSelect,
  onRename,
  onDelete,
  onRestore,
  isCollapsed,
}: ChatItemProps) => {
  const sanitizedChat = useMemo(() => sanitizeChatData(chat), [chat])

  const handleSelect = useCallback(() => onSelect(sanitizedChat.id), [onSelect, sanitizedChat.id])

  const handleRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onRename(sanitizedChat.id, sanitizedChat.title)
  }, [onRename, sanitizedChat.id, sanitizedChat.title])

  const handleDelete = useCallback((e: React.MouseEvent, hardDelete = false) => {
    e.stopPropagation()
    onDelete(sanitizedChat.id, hardDelete)
  }, [onDelete, sanitizedChat.id])

  const handleRestore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onRestore(sanitizedChat.id)
  }, [onRestore, sanitizedChat.id])

  const agentConfig = useMemo(() => {
    const isCustomAgent = sanitizedChat.metadata?.custom_agent_id
    const customAgentName = sanitizedChat.metadata?.custom_agent_name
    if (isCustomAgent && customAgentName) return { name: deduplicateAgentName(customAgentName) || customAgentName }
    if (sanitizedChat.agent_type && AGENT_CONFIGS[sanitizedChat.agent_type as keyof typeof AGENT_CONFIGS]) {
      return AGENT_CONFIGS[sanitizedChat.agent_type as keyof typeof AGENT_CONFIGS]
    }
    return { name: "Unknown" }
  }, [sanitizedChat.agent_type, sanitizedChat.metadata])

  const isDeleted = sanitizedChat.status === "deleted"

  // Collapsed
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center h-8 w-8 mx-auto my-0.5 rounded-md cursor-pointer transition-colors",
              isSelected
                ? "bg-[#146f84]/10"
                : "hover:bg-slate-100 dark:hover:bg-[#161b22]"
            )}
            onClick={handleSelect}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isSelected ? "bg-[#146f84]" : "bg-slate-300 dark:bg-[#6e7681]"
            )} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium text-xs">{truncateText(sanitizedChat.title, 30)}</p>
          <p className="text-[10px] opacity-70">{agentConfig.name} · {formatDateTime(sanitizedChat.updated_at)}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (



    <div
      className={cn(
        "group relative flex flex-col px-2.5 py-2 cursor-pointer transition-all duration-200 border-y border-r rounded-sm",
        isSelected
          ? "bg-white dark:bg-[#0d1117] border-slate-300 dark:border-slate-600"
          : "hover:bg-white dark:hover:bg-[#161b22] border-transparent hover:border-slate-200 dark:hover:border-slate-700",
        isDeleted && "opacity-60"
      )}
      onClick={handleSelect}
    >


      {/* Left Active Indicator (animated) */}
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-1 bg-[#146f84] transition-all duration-200",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        )}
      />

      {/* Title */}
      <p
        className={cn(
          "text-[12px] leading-snug truncate pr-4 transition-colors",
          isSelected
            ? "text-slate-900 dark:text-white font-semibold"
            : "text-slate-700 dark:text-[#c9d1d9] group-hover:text-slate-900 dark:group-hover:text-white"
        )}
      >
        {truncateText(sanitizedChat.title, 30)}
      </p>

      {/* Time & Agent Display */}
      <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden min-w-0">
        <span className={cn(
          "inline-flex items-center rounded-sm text-[10px] font-medium transition-colors flex-shrink-0",
          isSelected
            ? "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 px-2 py-0.5"
            : " text-slate-500 dark:text-[#6e7681] "
        )}>
          <span className="truncate">{formatDateTime(sanitizedChat.updated_at)}</span>
        </span>
        <span className={cn(
          "inline-flex items-center ml-1 rounded-sm text-[10px] font-medium transition-colors min-w-0 overflow-hidden",
          isSelected
            ? "bg-[#146f84]/5 dark:bg-[#146f84]/10 text-[#146f84] px-2 py-0.5"
            : " text-slate-500 dark:text-[#6e7681] "
        )}>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mr-1 flex-shrink-0" />
          <span className="truncate">{agentConfig.name}</span>
        </span>


      </div>


      {/* Hover: ... dropdown */}
      <div
        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-400 dark:text-[#6e7681] hover:text-slate-700 dark:hover:text-[#c9d1d9]"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" side="right" sideOffset={8}>
            {isDeleted ? (
              <>
                <DropdownMenuItem onClick={handleRestore} className="text-green-600 dark:text-green-400 cursor-pointer text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Restore Chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => handleDelete(e, true)} className="text-red-600 dark:text-red-400 cursor-pointer text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Permanently
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={handleRename} className="cursor-pointer text-xs">
                  <Edit3 className="h-3.5 w-3.5 mr-2" />
                  Rename Chat
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation() }}
                  className="cursor-pointer text-xs"
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Duplicate Chat
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation() }}
                  className="cursor-pointer text-xs"
                >
                  <Share className="h-3.5 w-3.5 mr-2" />
                  Share Chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation() }}
                  className="cursor-pointer text-xs"
                >
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  Archive Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleDelete(e, false)} className="text-red-600 dark:text-red-400 cursor-pointer text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}, (prev, next) => (
  prev.chat.id === next.chat.id &&
  prev.isSelected === next.isSelected &&
  prev.isCollapsed === next.isCollapsed &&
  prev.chat.title === next.chat.title &&
  prev.chat.updated_at === next.chat.updated_at &&
  prev.chat.status === next.chat.status
))




