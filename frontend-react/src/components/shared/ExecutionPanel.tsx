'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Terminal,
  FileOutput,
  Search,
  FolderOpen,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  RefreshCw,
  Clock,
  Activity,
  Database,
  Copy,
  X,
  ExternalLink,
  Globe,
  Filter,
  Archive,
  Eye,
  Code,
  ChevronRight,
  Zap,
  Star,
  Quote,
  Lightbulb,
  HardDrive,
  Calendar,
  FileType,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { MarkdownContent } from '@/components/markdown/MarkdownContent'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Generic message/event type that supports all agent execution patterns
 */
export interface ExecutionMessage {
  type: 'log' | 'output' | 'source' | 'files' | 'status' | 'activity' | 'completion' | 'capability' | 'info' | 'error' | 'success'
  content: string
  timestamp: string
  metadata?: any
  capability?: string
  executionTime?: number
  success?: boolean
}

/**
 * Parsed source with metadata
 */
export interface ParsedSource {
  title: string
  url: string
  sourceType?: string
  relevanceScore?: number
  relevance?: number
  content?: string
  excerpt?: string
  citationFormat?: string
  filename?: string
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

/**
 * Configuration for which tabs to display
 */
export interface TabConfig {
  logs?: boolean
  output?: boolean
  sources?: boolean
  files?: boolean
}

/**
 * Progress tracking information
 */
export interface ProgressInfo {
  percentage: number
  currentStage: string
  isActive: boolean
  isCompleted?: boolean
}

/**
 * Main ExecutionPanel props
 */
export interface ExecutionPanelProps {
  // Display control
  isVisible?: boolean
  onClose?: () => void

  // Data
  messages: ExecutionMessage[]
  parsedSources?: ParsedSource[]
  staticSourceContent?: string

  // State
  isExecuting?: boolean
  isStreaming?: boolean
  currentCapability?: string | null
  sessionId?: string | null

  // Configuration
  tabs?: TabConfig
  title?: string
  subtitle?: string
  agentType?: 'aegis' | 'custom' | 'sophia' | 'generic'

  // Progress
  progress?: ProgressInfo

  // Theming
  isDarkTheme?: boolean

  // Callbacks
  onResearchComplete?: (outputContent: string, sourceContent: string, sessionId: string) => void
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deduplicate messages to reduce noise
 */
const deduplicateMessages = (messages: ExecutionMessage[]): ExecutionMessage[] => {
  const seen = new Map<string, ExecutionMessage>()

  return messages.filter(message => {
    // Special handling for repetitive progress messages
    if (message.content.includes('in progress') || message.content.includes('Research in progress')) {
      const progressCount = messages.filter((m, index) =>
        m.content === message.content &&
        messages.indexOf(m) <= messages.indexOf(message)
      ).length

      // Only keep every 3rd repetitive message
      if (progressCount % 3 !== 1) {
        return false
      }
    }

    const contentKey = `${message.type}-${message.content.trim()}`
    const existing = seen.get(contentKey)

    if (existing) {
      const timeDiff = Math.abs(
        new Date(message.timestamp).getTime() - new Date(existing.timestamp).getTime()
      )

      if (timeDiff < 1000) {
        return false
      }
    }

    seen.set(contentKey, message)
    return true
  })
}

/**
 * Parse messages by type for different tabs
 */
const parseMessagesByType = (messages: ExecutionMessage[]) => {
  const deduplicated = deduplicateMessages(messages)

  const parsed = {
    log: [] as ExecutionMessage[],
    output: [] as ExecutionMessage[],
    source: [] as ExecutionMessage[],
    files: [] as ExecutionMessage[],
    status: [] as ExecutionMessage[],
    activity: [] as ExecutionMessage[],
  }

  deduplicated.forEach(message => {
    switch (message.type) {
      case 'log':
      case 'info':
        parsed.log.push(message)
        break
      case 'output':
      case 'success':
        parsed.output.push(message)
        break
      case 'source':
        parsed.source.push(message)
        break
      case 'files':
        parsed.files.push(message)
        break
      case 'status':
        parsed.status.push(message)
        break
      case 'activity':
      case 'capability':
        parsed.activity.push(message)
        if (!message.content.includes('in progress')) {
          parsed.log.push({ ...message, type: 'log' })
        }
        break
      case 'completion':
        parsed.log.push(message)
        parsed.activity.push(message)
        break
      case 'error':
        parsed.log.push(message)
        break
      default:
        parsed.log.push(message)
    }
  })

  return parsed
}

/**
 * Generate filename with timestamp
 */
const generateFilename = (type: string, extension: string, prefix: string = 'execution'): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
  return `${prefix}-${type}-${timestamp}.${extension}`
}

/**
 * Format file size
 */
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Normalize streamed content that arrives with hard wraps so it reads as natural paragraphs.
 */
const normalizeStreamedText = (content: string): string => {
  if (!content) return content

  return content
    .replace(/\r\n/g, '\n')
    .replace(/([A-Za-z])\n(?=[A-Za-z])/g, '$1')
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Format date
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Unknown date'
  }
}

/**
 * Format execution time
 */
const formatExecutionTime = (ms?: number): string => {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Get relevance color for badges
 */
const getRelevanceColor = (relevance: number): string => {
  if (relevance >= 0.9) return 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900'
  if (relevance >= 0.7) return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900'
  if (relevance >= 0.5) return 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900'
  return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800'
}

// ============================================================================
// PROGRESS INDICATOR COMPONENT
// ============================================================================

interface ProgressIndicatorProps {
  progress: number
  currentStage: string
  isActive: boolean
  isCompleted?: boolean
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  currentStage,
  isActive,
  isCompleted,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (progress === 0 && !isCompleted) {
      setAnimatedProgress(0)
      return
    }

    // If it's done, just snap to 100
    if (isCompleted || (!isActive && progress >= 100)) {
      setAnimatedProgress(100)
      return
    }

    let animationFrameId: number
    const animate = () => {
      setAnimatedProgress((prev) => {
        if (prev >= progress) return progress
        return Math.min(prev + 1, progress)
      })
      animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [progress, isCompleted, isActive])

  if (!isActive && progress === 0 && !isCompleted) return null

  const displayProgress = isCompleted ? 100 : animatedProgress

  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-3 h-3 rounded-full shadow-lg transition-all duration-500',
              isCompleted || (!isActive && displayProgress >= 100)
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-200'
                : isActive
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse shadow-blue-200'
                  : progress > 0
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse shadow-cyan-200'
                    : 'bg-gradient-to-r from-slate-300 to-slate-400'
            )}
          />
          <span
            className={cn(
              'text-sm font-semibold transition-colors duration-300',
              isCompleted || (!isActive && displayProgress >= 100)
                ? 'text-emerald-700 dark:text-emerald-300'
                : isActive
                  ? 'text-blue-800 dark:text-blue-200'
                  : progress > 0
                    ? 'text-cyan-700 dark:text-cyan-300'
                    : 'text-slate-600 dark:text-slate-400'
            )}
          >
            {isCompleted || (!isActive && displayProgress >= 100)
              ? 'Complete ✨'
              : isActive && displayProgress >= 100
                ? 'Finalizing...'
                : isActive
                  ? 'In Progress'
                  : progress > 0
                    ? 'Processing'
                    : 'Ready'}
          </span>
        </div>
        {displayProgress > 0 && (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'text-sm font-bold px-2 py-1 rounded-full text-white shadow-sm transition-all duration-300',
                isCompleted || (!isActive && displayProgress >= 100)
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  : isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600'
              )}
            >
              {Math.min(displayProgress, 100)}%
            </span>
            {isActive && !isCompleted && displayProgress < 100 && (
              <div className="flex space-x-1">
                <div
                  className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-bounce shadow-sm"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce shadow-sm"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-1.5 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full animate-bounce shadow-sm"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 rounded-full h-3 mb-3 overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-sm',
            isCompleted || (!isActive && displayProgress >= 100)
              ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400'
              : isActive
                ? 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600'
                : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'
          )}
          style={{
            width: `${Math.min(Math.max(displayProgress, 0), 100)}%`,
            minWidth: displayProgress > 0 ? '12px' : '0px',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30" />
          {(isActive || displayProgress > 0) && (
            <div className={cn('absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse', isActive && 'animate-pulse')} />
          )}
        </div>
      </div>

      {/* Current Stage */}
      {currentStage && (
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'w-1 h-1 rounded-full mt-2 flex-shrink-0',
              isCompleted || (!isActive && displayProgress >= 100) ? 'bg-emerald-500' : isActive ? 'bg-blue-500 animate-pulse' : 'bg-cyan-500'
            )}
          />
          <p
            className={cn(
              'text-xs font-medium leading-relaxed',
              isCompleted || (!isActive && displayProgress >= 100)
                ? 'text-emerald-600 dark:text-emerald-400'
                : isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-cyan-600 dark:text-cyan-400'
            )}
          >
            {currentStage}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExecutionPanel({
  isVisible = true,
  onClose,
  messages,
  parsedSources = [],
  staticSourceContent,
  isExecuting = false,
  isStreaming = false,
  currentCapability,
  sessionId,
  tabs = { logs: true, output: true, sources: true, files: true },
  title = 'Execution Panel',
  subtitle,
  agentType = 'generic',
  progress,
  isDarkTheme = false,
  onResearchComplete,
}: ExecutionPanelProps) {
  const { toast } = useToast()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<string>('logs')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  // Parse messages by type
  const parsedMessages = useMemo(() => parseMessagesByType(messages), [messages])

  // Combine output content
  const outputContent = useMemo(() => {
    const contentMessages = parsedMessages.output.filter(
      msg => msg.content && msg.content.length > 50 && !msg.content.includes('Downloading files')
    )
    return contentMessages.map(msg => normalizeStreamedText(msg.content)).join('\n\n')
  }, [parsedMessages.output])

  // Combine source content
  const sourceContent = useMemo(() => {
    const contentMessages = parsedMessages.source.filter(
      msg => msg.content && msg.content.length > 50 && !msg.content.includes('Downloading files')
    )
    return contentMessages.map(msg => normalizeStreamedText(msg.content)).join('\n\n')
  }, [parsedMessages.source])

  // Filter sources
  const filteredSources = useMemo(() => {
    if (sourceFilter === 'all') return parsedSources
    return parsedSources.filter(source => source.sourceType?.includes(sourceFilter))
  }, [parsedSources, sourceFilter])

  // Get unique source types
  const sourceTypes = useMemo(() => {
    const types = new Set(['all'])
    parsedSources.forEach(source => {
      if (source.sourceType) {
        types.add(source.sourceType)
      }
    })
    return Array.from(types)
  }, [parsedSources])

  // Auto-scroll for logs
  useEffect(() => {
    if (scrollAreaRef.current && activeTab === 'logs') {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [parsedMessages.log, activeTab])

  // Copy to clipboard
  const copyToClipboard = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: 'Copied to Clipboard',
        description: `${label} copied successfully`,
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
        duration: 2000,
      })
    }
  }

  // Download as file
  const downloadAsFile = (content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Download Complete',
      description: `${filename} saved successfully`,
      duration: 2000,
    })
  }

  // Get event icon
  const getEventIcon = (event: ExecutionMessage) => {
    switch (event.type) {
      case 'capability':
        return event.success === false ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Zap className="h-4 w-4 text-purple-500" />
        )
      case 'success':
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'activity':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />
    }
  }

  // Get event badge color
  const getEventBadgeColor = (event: ExecutionMessage) => {
    switch (event.type) {
      case 'capability':
        return event.success === false
          ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'
          : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800'
      case 'success':
      case 'completion':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800'
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'
      case 'activity':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
  }

  if (!isVisible) return null

  // Determine which tabs to show
  const enabledTabs = Object.entries(tabs)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key)

  // Set initial active tab to first enabled tab
  useEffect(() => {
    if (enabledTabs.length > 0 && !enabledTabs.includes(activeTab)) {
      setActiveTab(enabledTabs[0])
    }
  }, [enabledTabs, activeTab])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
            {sessionId && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Session: {sessionId.slice(-8)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isStreaming || isExecuting ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Live</span>
              </div>
            ) : messages.length > 0 ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Complete</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ready</span>
              </div>
            )}
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {progress && (
        <ProgressIndicator
          progress={progress.percentage}
          currentStage={progress.currentStage}
          isActive={progress.isActive}
          isCompleted={progress.isCompleted}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <TabsList className={cn('grid w-full h-10 bg-white dark:bg-slate-700 shadow-sm', `grid-cols-${enabledTabs.length}`)}>
            {tabs.logs && (
              <TabsTrigger value="logs" className="text-xs flex items-center gap-2 font-medium">
                <Terminal className="h-3 w-3" />
                Logs
                {parsedMessages.log.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium border-0">
                    {parsedMessages.log.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {tabs.output && (
              <TabsTrigger value="output" className="text-xs flex items-center gap-2 font-medium">
                <FileOutput className="h-3 w-3" />
                Output
                {outputContent.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-medium border-0">
                    Ready
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {tabs.sources && (
              <TabsTrigger value="sources" className="text-xs flex items-center gap-2 font-medium">
                <Search className="h-3 w-3" />
                Sources
                {(sourceContent.length > 0 || parsedSources.length > 0) && (
                  <Badge className="h-4 px-1.5 text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium border-0">
                    {parsedSources.length > 0 ? parsedSources.length : 'Ready'}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {tabs.files && (
              <TabsTrigger value="files" className="text-xs flex items-center gap-2 font-medium">
                <FolderOpen className="h-3 w-3" />
                Files
                {parsedMessages.files.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[9px] bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-medium border-0">
                    {parsedMessages.files.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Logs Tab */}
          {tabs.logs && (
            <TabsContent value="logs" className="h-full m-0 data-[state=active]:flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full shadow-sm',
                      isStreaming || isExecuting
                        ? 'bg-emerald-500 animate-pulse'
                        : parsedMessages.log.length > 0
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                    )}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isStreaming || isExecuting ? 'Live Stream' : parsedMessages.log.length > 0 ? 'Completed' : 'Ready'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {parsedMessages.log.length > 0 && (
                    <Button
                      onClick={() => {
                        const logContent = parsedMessages.log
                          .map(msg => `[${new Date(msg.timestamp).toLocaleTimeString()}] ${normalizeStreamedText(msg.content)}`)
                          .join('\n')
                        downloadAsFile(logContent, generateFilename('logs', 'txt', agentType))
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{parsedMessages.log.length} messages</span>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-3">
                  {parsedMessages.log.length === 0 && !isStreaming && !isExecuting ? (
                    <div className="flex items-center justify-center h-40 text-slate-500 dark:text-slate-400">
                      <div className="text-center">
                        <Terminal className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                        <p className="text-sm font-medium">Execution logs will appear here</p>
                        <p className="text-xs text-slate-400 mt-1">Start a task to see live updates</p>
                      </div>
                    </div>
                  ) : (
                    parsedMessages.log.map((message, index) => (
                      <Card key={index} className="border border-slate-200 dark:border-slate-700">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">{getEventIcon(message)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={cn('text-xs', getEventBadgeColor(message))}>
                                  {message.type.toUpperCase()}
                                </Badge>
                                {message.capability && (
                                  <>
                                    <ChevronRight className="h-3 w-3 text-slate-400" />
                                    <Badge variant="outline" className="text-xs">
                                      {message.capability}
                                    </Badge>
                                  </>
                                )}
                                {message.executionTime && (
                                  <>
                                    <Clock className="h-3 w-3 text-slate-400 ml-auto" />
                                    <span className="text-xs text-slate-500">{formatExecutionTime(message.executionTime)}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                                {normalizeStreamedText(message.content)}
                              </p>
                              <span className="text-xs text-slate-500 mt-2 block">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}

                  {(isStreaming || isExecuting) && currentCapability && (
                    <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800 mb-1">
                              EXECUTING
                            </Badge>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Running: <code className="font-mono">{currentCapability}</code>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {/* Output Tab */}
          {tabs.output && (
            <TabsContent value="output" className="h-full m-0 data-[state=active]:flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Output</span>
                {outputContent && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyToClipboard(outputContent, 'Output')}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      onClick={() => downloadAsFile(outputContent, generateFilename('output', 'md', agentType), 'text/markdown')}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Badge className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-medium border-0">
                      {Math.round(outputContent.length / 1024)} KB
                    </Badge>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 p-6">
                {outputContent ? (
                  <div className="animate-fade-in">
                    <MarkdownContent content={outputContent} isDarkTheme={isDarkTheme} className="max-w-none" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <div className="text-center">
                      <FileOutput className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg font-semibold mb-2">
                        {isStreaming || isExecuting ? 'Generating output...' : 'Output will appear here'}
                      </p>
                      <p className="text-sm text-slate-400">Start a task to generate output</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}

          {/* Sources Tab */}
          {tabs.sources && (
            <TabsContent value="sources" className="h-full m-0 data-[state=active]:flex flex-col">
              {/* Sources Header */}
              {(sourceContent || parsedSources.length > 0) && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {parsedSources.length > 0 ? `Sources (${filteredSources.length})` : 'Source Documents'}
                    </h4>

                    <div className="flex items-center gap-2">
                      {parsedSources.length > 0 && (
                        <Button
                          onClick={() => downloadAsFile(JSON.stringify(parsedSources, null, 2), generateFilename('sources', 'json', agentType), 'application/json')}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          JSON
                        </Button>
                      )}
                      {sourceContent && (
                        <>
                          <Button
                            onClick={() => copyToClipboard(sourceContent, 'Sources')}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            onClick={() => downloadAsFile(sourceContent, generateFilename('sources', 'txt', agentType))}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Source Type Filter */}
                  {sourceTypes.length > 2 && (
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-500" />
                      <div className="flex gap-1 flex-wrap">
                        {sourceTypes.map(type => (
                          <Button
                            key={type}
                            onClick={() => setSourceFilter(type)}
                            variant={sourceFilter === type ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              'h-6 px-2 text-xs capitalize',
                              sourceFilter === type
                                ? 'bg-slate-900 text-white dark:bg-slate-700'
                                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            {type.replace('_', ' ')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sources Content */}
              <ScrollArea className="flex-1">
                {filteredSources.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {filteredSources.map((source, index) => {
                      const relevance = source.relevanceScore || source.relevance || 0
                      const title = source.title || source.document_name || source.filename || 'Unknown Source'
                      const content = source.content || source.excerpt || source.content_preview || source.full_content || ''

                      return (
                        <Card
                          key={index}
                          className="p-4 hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="space-y-3">
                            {/* Source Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-slate-900 dark:text-white text-sm leading-tight mb-1">{title}</h5>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {source.sourceType && (
                                    <Badge
                                      className={cn(
                                        'text-xs px-2 py-0.5 border-0',
                                        source.sourceType.includes('news')
                                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                          : source.sourceType.includes('web')
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                      )}
                                    >
                                      {source.sourceType.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  {relevance > 0 && (
                                    <Badge className={cn('text-xs px-2 py-0.5 border-0', getRelevanceColor(relevance))}>
                                      {(relevance * 100).toFixed(0)}% relevant
                                    </Badge>
                                  )}
                                  {source.chunk_index !== undefined && (
                                    <Badge className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0">
                                      Chunk #{source.chunk_index}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {source.url && (
                                <Button
                                  onClick={() => window.open(source.url, '_blank')}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            {/* Source Content */}
                            {content && (
                              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {content.length > 300 ? `${content.slice(0, 300)}...` : content}
                                </p>
                              </div>
                            )}

                            {/* Source URL */}
                            {source.url && (
                              <div className="flex items-center gap-2 text-xs">
                                <Globe className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline truncate flex-1 min-w-0"
                                >
                                  {source.url}
                                </a>
                              </div>
                            )}

                            {/* Metadata */}
                            {source.metadata && (
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                {source.metadata.size_bytes && (
                                  <span className="flex items-center gap-1">
                                    <HardDrive className="h-3 w-3" />
                                    {formatFileSize(source.metadata.size_bytes)}
                                  </span>
                                )}
                                {source.metadata.content_type && (
                                  <span className="flex items-center gap-1">
                                    <FileType className="h-3 w-3" />
                                    {source.metadata.content_type}
                                  </span>
                                )}
                                {source.metadata.created_at && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(source.metadata.created_at)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ) : sourceContent ? (
                  <div className="p-6 animate-fade-in">
                    <Card className="bg-slate-900 text-slate-100 dark:bg-slate-950 border-slate-700 shadow-lg">
                      <CardContent className="p-6">
                        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-slate-200">{sourceContent}</pre>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <div className="text-center">
                      <Database className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg font-semibold mb-2">Sources will appear here</p>
                      <p className="text-sm text-slate-400">Research sources and citations will be displayed here</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}

          {/* Files Tab */}
          {tabs.files && (
            <TabsContent value="files" className="h-full m-0 data-[state=active]:flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Files</span>
                {parsedMessages.files.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1 p-6">
                {parsedMessages.files.length > 0 || outputContent || sourceContent ? (
                  <div className="space-y-4 animate-fade-in">
                    {outputContent && (
                      <Card className="hover:shadow-sm transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                                <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Output</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {Math.round(outputContent.length / 1024)} KB • Markdown format
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => downloadAsFile(outputContent, generateFilename('output', 'md', agentType), 'text/markdown')}
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {(sourceContent || parsedSources.length > 0) && (
                      <Card className="hover:shadow-sm transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sources</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {parsedSources.length > 0
                                    ? `${parsedSources.length} sources • Structured data`
                                    : `${Math.round(sourceContent.length / 1024)} KB • Text format`}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() =>
                                parsedSources.length > 0
                                  ? downloadAsFile(JSON.stringify(parsedSources, null, 2), generateFilename('sources', 'json', agentType), 'application/json')
                                  : downloadAsFile(sourceContent, generateFilename('sources', 'txt', agentType))
                              }
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {parsedMessages.files.map((fileMessage, index) => (
                      <Card key={index} className="hover:shadow-sm transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{fileMessage.content}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Generated at {new Date(fileMessage.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <div className="text-center">
                      <FolderOpen className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg font-semibold mb-2">Files will appear here</p>
                      <p className="text-sm text-slate-400 mb-2">
                        {isStreaming || isExecuting ? 'Execution in progress...' : 'Start a task to see files'}
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  )
}
