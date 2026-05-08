// frontend/src/components/chat/AegisExecutionPanel.tsx
'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Terminal,
  Search,
  FolderOpen,
  Loader2,
  CheckCircle,
  RefreshCw,
  Activity,
  Database,
  ExternalLink,
  Globe,
  X,
  Download,
  FileText
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { Task } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'

// Enhanced streaming message interface to match backend
interface StreamMessage {
  type: 'log' | 'output' | 'source' | 'sources' | 'files' | 'status' | 'activity' | 'completion'
  content: string
  timestamp: string
  metadata?: any
}

// NEW: Interface for parsed static sources
interface ParsedSource {
  title: string
  url: string
  sourceType: string
  relevanceScore: number
  content: string
  citationFormat?: string
  timestamp?: string
  metadata?: any
  // Sophia document fields
  documentId?: string
  documentName?: string
  fullContent?: string
  chunkIndex?: number
  totalChunks?: number
  isSophiaDocument?: boolean
}

// NEW: Interface for static sources data
interface StaticSourcesData {
  content: string
  sessionId: string
  messageId: string
  // Structured data from stored message (available after page refresh)
  sources?: any[]  // message.sources array
  logs?: Array<{ type: string; content: string; timestamp: string }>  // message.metadata.logs array
}



interface AegisExecutionPanelProps {
  streamMessages: StreamMessage[]
  isStreaming: boolean
  isVisible?: boolean
  onClose?: () => void
  staticSources?: StaticSourcesData | null
  activeTask?: Task | null
  progressPercentage?: number  // NEW: Progress percentage for Sophia
  sources?: any[]  // NEW: Direct sources array for Sophia
}

// Enhanced deduplication for stream messages
const deduplicateStreamMessages = (messages: StreamMessage[]): StreamMessage[] => {
  const seen = new Map<string, StreamMessage>()

  return messages.filter(message => {
    // Special handling for repetitive "Research in progress..." messages
    if (message.content === "Research in progress...") {
      const progressCount = messages.filter((m) =>
        m.content === "Research in progress..." &&
        messages.indexOf(m) <= messages.indexOf(message)
      ).length

      // Only keep every 3rd "Research in progress" message to reduce spam
      if (progressCount % 3 !== 1) { // Keep 1st, 4th, 7th, etc.
        return false
      }
    }

    // Create a unique key based on content and type
    const contentKey = `${message.type}-${message.content.trim()}`

    // Check if we've seen this exact content from this type recently
    const existing = seen.get(contentKey)
    if (existing) {
      // If messages are within 1 second of each other with same content, consider duplicate
      const timeDiff = Math.abs(
        new Date(message.timestamp).getTime() - new Date(existing.timestamp).getTime()
      )

      if (timeDiff < 1000) { // 1 second for execution panel
        console.warn('🔍 Duplicate execution panel message filtered:', {
          type: message.type,
          content: message.content.substring(0, 30),
          timeDiff
        })
        return false
      }
    }

    seen.set(contentKey, message)
    return true
  })
}

// Parse messages by type for different tabs with deduplication
const parseMessagesByType = (messages: StreamMessage[]) => {
  // First deduplicate all messages
  const deduplicatedMessages = deduplicateStreamMessages(messages)

  const parsed = {
    log: [] as StreamMessage[],
    output: [] as StreamMessage[],
    source: [] as StreamMessage[],
    files: [] as StreamMessage[],
    status: [] as StreamMessage[],
    activity: [] as StreamMessage[]
  }

  // Keep existing logic but use deduplicated messages
  deduplicatedMessages.forEach(message => {
    switch (message.type) {
      case 'log':
        parsed.log.push(message)
        break
      case 'output':
        parsed.output.push(message)
        break
      case 'source':
      case 'sources':  // Handle both singular and plural
        parsed.source.push(message)
        break
      case 'files':
        parsed.files.push(message)
        break
      case 'status':
        parsed.status.push(message)
        break
      case 'activity':
        parsed.activity.push(message)
        // Only add to log if it's not just "Research in progress..."
        if (!message.content.includes('Research in progress')) {
          parsed.log.push({
            ...message,
            type: 'log' as const
          })
        }
        break
      case 'completion':
        // Add completion to multiple tabs
        parsed.log.push(message)
        parsed.activity.push(message)
        break
      default:
        // Default to log
        parsed.log.push(message)
    }
  })

  return parsed
}

// FIXED: Enhanced progress extraction that works with LOG messages
const extractProgress = (messages: StreamMessage[]): number => {
  // Use deduplicated messages for more accurate progress calculation
  const deduplicatedMessages = deduplicateStreamMessages(messages)

  // FIXED: Include 'log' type messages since that's what we're actually getting
  const relevantMessages = deduplicatedMessages.filter(m =>
    m.type === 'status' || m.type === 'activity' || m.type === 'log' || m.type === 'completion'
  )

  // FIRST: Check for explicit completion indicators
  const hasCompletionMessage = relevantMessages.some(message => {
    const content = message.content.toLowerCase()
    return (
      message.type === 'completion' ||
      content.includes('research completed successfully') ||
      content.includes('completed successfully') ||
      content.includes('research session completed') ||
      content.includes('final result generated') ||
      content.includes('research complete')
    )
  })

  if (hasCompletionMessage) {
    console.log('✅ Found completion indicator - returning 100%')
    return 100
  }

  // Go through messages in reverse order (most recent first) to get current progress
  for (let i = relevantMessages.length - 1; i >= 0; i--) {
    const message = relevantMessages[i]
    const content = message.content.toLowerCase()

    console.log('🔍 Progress check:', {
      content: message.content.substring(0, 60),
      type: message.type
    })

    // ENHANCED: Better progress detection patterns based on actual messages
    if (content.includes('found') && content.includes('results') && content.includes('web search')) {
      return 85 // Found search results - near completion
    }
    if (content.includes('searching web databases') || content.includes('searching') && content.includes('with:')) {
      return 70
    }
    if (content.includes('query enhanced with') || content.includes('context:')) {
      return 60
    }
    if (content.includes('quick search enhanced') || content.includes('performing fast targeted')) {
      return 50
    }
    if (content.includes('planning comprehensive searches') || content.includes('planning') && content.includes('sources')) {
      return 40
    }
    if (content.includes('starting search mode') || content.includes('query enhancement')) {
      return 30
    }
    if (content.includes('research session started')) {
      return 20
    }

    // Look for percentage patterns in any message
    const percentMatch = message.content.match(/(\d+)%/)
    if (percentMatch) {
      const percent = parseInt(percentMatch[1], 10)
      console.log('📊 Found percentage:', percent)
      return percent
    }

    // Look for fractional patterns like "3/10"
    const fractionMatch = message.content.match(/(\d+)\/(\d+)/)
    if (fractionMatch) {
      const current = parseInt(fractionMatch[1], 10)
      const total = parseInt(fractionMatch[2], 10)
      const percent = Math.round((current / total) * 100)
      console.log('📊 Found fraction:', `${current}/${total} = ${percent}%`)
      return percent
    }
  }

  // IMPROVED: Better base progress calculation
  if (relevantMessages.length > 0) {
    // More aggressive progress based on message count and patterns
    let baseProgress = Math.min(10 + (relevantMessages.length * 8), 90)

    // Boost progress if we have search results
    const hasSearchResults = relevantMessages.some(m =>
      m.content.toLowerCase().includes('found') && m.content.toLowerCase().includes('results')
    )
    if (hasSearchResults) {
      baseProgress = Math.max(baseProgress, 80)
    }

    console.log('📊 Base progress from message count:', baseProgress, 'messages:', relevantMessages.length)
    return baseProgress
  }

  return 0
}

// FIXED: Enhanced current stage extraction that works with LOG messages
const extractCurrentStage = (messages: StreamMessage[]): string => {
  // Use deduplicated messages to get cleaner stage information
  const deduplicatedMessages = deduplicateStreamMessages(messages)

  // FIXED: Include 'log' type messages since that's what we're actually getting
  const relevantMessages = deduplicatedMessages.filter(m =>
    m.type === 'status' || m.type === 'activity' || m.type === 'log' || m.type === 'completion'
  )

  if (relevantMessages.length === 0) return 'Initializing...'

  // FIRST: Check for completion indicators
  const completionMessage = relevantMessages.find(message => {
    const content = message.content.toLowerCase()
    return (
      message.type === 'completion' ||
      content.includes('research completed successfully') ||
      content.includes('completed successfully') ||
      content.includes('research session completed') ||
      content.includes('final result generated') ||
      content.includes('research complete')
    )
  })

  if (completionMessage) {
    return 'Research completed successfully! ✅'
  }

  const latest = relevantMessages[relevantMessages.length - 1]
  const content = latest.content

  console.log('🎯 Current stage from:', {
    content: content.substring(0, 60),
    type: latest.type
  })

  // ENHANCED: Better stage descriptions based on actual messages
  if (content.includes('Found') && content.includes('results from web search')) {
    return 'Processing search results and generating report...'
  }
  if (content.includes('Searching web databases with:')) {
    return 'Searching comprehensive web databases...'
  }
  if (content.includes('Query enhanced with') && content.includes('context:')) {
    return 'Contextualizing search with current data...'
  }
  if (content.includes('Quick Search Enhanced')) {
    return 'Performing intelligent search optimization...'
  }
  if (content.includes('Planning comprehensive searches')) {
    return 'Planning comprehensive search strategy...'
  }
  if (content.includes('Starting search mode')) {
    return 'Initializing enhanced search mode...'
  }
  if (content.includes('Research session started')) {
    return 'Research session initialized successfully'
  }

  // FIXED: Return a more user-friendly version of the actual message
  if (content.length > 60) {
    return content.substring(0, 60) + '...'
  }

  return content || 'Processing...'
}

const ProgressIndicator = ({ progress, currentStage, isActive, isCompleted }: {
  progress: number
  currentStage: string
  isActive: boolean
  isCompleted?: boolean
}) => {
  const [animatedProgress, setAnimatedProgress] = React.useState(0)

  React.useEffect(() => {
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

  // Force 100% if marked as completed
  const displayProgress = isCompleted ? 100 : animatedProgress

  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full shadow-lg transition-all duration-500",
            isCompleted || (!isActive && displayProgress >= 100)
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-200' :
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse shadow-blue-200' :
                progress > 0
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse shadow-cyan-200'
                  : 'bg-gradient-to-r from-slate-300 to-slate-400'
          )} />
          <span className={cn(
            "text-sm font-semibold transition-colors duration-300",
            isCompleted || (!isActive && displayProgress >= 100)
              ? 'text-emerald-700 dark:text-emerald-300' :
              isActive
                ? 'text-blue-800 dark:text-blue-200' :
                progress > 0
                  ? 'text-cyan-700 dark:text-cyan-300'
                  : 'text-slate-600 dark:text-slate-400'
          )}>
            {isCompleted || (!isActive && displayProgress >= 100) ? 'Research Complete ✨' :
              isActive && displayProgress >= 100 ? 'Finalizing Research...' :
                isActive ? 'Research in Progress' :
                  progress > 0 ? 'Processing' : 'Ready'}
          </span>
        </div>
        {displayProgress > 0 && (
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-sm font-bold px-2 py-1 rounded-full text-white shadow-sm transition-all duration-300",
              isCompleted || (!isActive && displayProgress >= 100)
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                  'bg-gradient-to-r from-cyan-500 to-blue-600'
            )}>
              {Math.min(displayProgress, 100)}%
            </span>
            {isActive && !isCompleted && displayProgress < 100 && (
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Beautiful Progress Bar */}
      <div className="relative w-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 rounded-full h-3 mb-3 overflow-hidden shadow-inner">
        {/* Background shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>

        {/* Main progress bar */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-sm",
            isCompleted || (!isActive && displayProgress >= 100)
              ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400' :
              isActive
                ? 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600' :
                'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'
          )}
          style={{
            width: `${Math.min(Math.max(displayProgress, 0), 100)}%`,
            minWidth: displayProgress > 0 ? '12px' : '0px'
          }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30"></div>

          {/* Animated shine effect for active state */}
          {(isActive || displayProgress > 0) && (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse",
              isActive && "animate-pulse"
            )}></div>
          )}
        </div>
      </div>

      {/* Current Stage */}
      {currentStage && (
        <div className="flex items-start gap-2">
          <div className={cn(
            "w-1 h-1 rounded-full mt-2 flex-shrink-0",
            isCompleted || (!isActive && displayProgress >= 100)
              ? 'bg-emerald-500' :
              isActive
                ? 'bg-blue-500 animate-pulse' :
                'bg-cyan-500'
          )} />
          <p className={cn(
            "text-xs font-medium leading-relaxed",
            isCompleted || (!isActive && displayProgress >= 100)
              ? 'text-emerald-600 dark:text-emerald-400' :
              isActive
                ? 'text-blue-600 dark:text-blue-400' :
                'text-cyan-600 dark:text-cyan-400'
          )}>
            {currentStage}
          </p>
        </div>
      )}

      {/* Research Tips - only show if not completed */}
      {isActive && displayProgress < 90 && !isCompleted && (
        <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-xs">💡</span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Comprehensive research takes time for thorough analysis
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Combine output messages into a single report with deduplication
const combineOutputContent = (outputMessages: StreamMessage[]): string => {
  // First deduplicate the output messages
  const deduplicatedMessages = deduplicateStreamMessages(outputMessages)

  // Filter for actual research content, not just download messages
  const contentMessages = deduplicatedMessages.filter(msg =>
    msg.content &&
    msg.content.length > 100 && // Only substantial content
    !msg.content.includes('Downloading files') &&
    !msg.content.includes('completed successfully')
  )

  return contentMessages.map(msg => normalizeStreamedText(msg.content)).join('\n\n')
}

// Combine source messages with deduplication
const combineSourceContent = (sourceMessages: StreamMessage[]): string => {
  // First deduplicate the source messages
  const deduplicatedMessages = deduplicateStreamMessages(sourceMessages)

  const contentMessages = deduplicatedMessages.filter(msg =>
    msg.content &&
    msg.content.length > 50 && // Only substantial content
    !msg.content.includes('Downloading files') &&
    !msg.content.includes('completed successfully')
  )

  return contentMessages.map(msg => normalizeStreamedText(msg.content)).join('\n\n')
}

// Generate filename with timestamp
const generateFilename = (type: string, extension: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
  return `aegis-${type}-${timestamp}.${extension}`
}

// Normalize streamed content into readable paragraphs
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

function SourceCard({ source, index }: {
  source: ParsedSource
  index: number
}) {
  const isWebSource = !!source.url

  // ── Web source card (Aegis research results) ──
  if (isWebSource) {
    const sourceName = source.sourceType?.replace('news_', '') || source.sourceType || 'web_unknown'
    const formattedDate = source.timestamp
      ? new Date(source.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null
    const matchPct = source.relevanceScore > 0 ? Math.round(source.relevanceScore * 100) : null

    return (
      <div className="rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-200 w-full group">
        <div className="flex items-start gap-2.5">
          {/* Circular globe icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mt-0.5">
            <Globe className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {/* Title */}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-slate-900 dark:text-white leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
            >
              {source.title || `Source ${index + 1}`}
            </a>

            {/* Source name • Date */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-300">{sourceName}</span>
              {formattedDate && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{formattedDate}</span>
                </>
              )}
            </div>

            {/* Snippet */}
            {source.content && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                {source.content}
              </p>
            )}

            {/* Footer: Match badge + Open link */}
            <div className="flex items-center justify-between mt-1">
              {matchPct !== null ? (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 tracking-wide">
                  {matchPct}% MATCH
                </span>
              ) : (
                <span />
              )}

              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Document source card — same design as web card ──
  const docSourceName = source.documentName || source.title || `Document ${index + 1}`
  const docMatchPct = source.relevanceScore > 0 ? Math.round(source.relevanceScore * 100) : null
  // URL comes from document_id (if it's a URL) or metadata.url
  const docUrl = source.url || source.metadata?.url || ''

  return (
    <div className="rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-200 w-full group">
      <div className="flex items-start gap-2.5">
        {/* Circular globe icon — same as web card */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mt-0.5">
          <Globe className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Title — clickable if URL exists */}
          {docUrl ? (
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-slate-900 dark:text-white leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 break-words"
            >
              {docSourceName}
            </a>
          ) : (
            <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 break-words">
              {docSourceName}
            </p>
          )}

          {/* Date only (no sourceType label) */}
          {source.timestamp && (
            <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400">
              <span>{new Date(source.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}

          {/* chunk_text snippet */}
          {(source.content || source.fullContent) && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
              {source.content || source.fullContent}
            </p>
          )}

          {/* Footer: Match badge + Open link */}
          <div className="flex items-center justify-between mt-1">
            {docMatchPct !== null ? (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 tracking-wide">
                {docMatchPct}% MATCH
              </span>
            ) : (
              <span />
            )}

            {docUrl ? (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AegisExecutionPanel({
  streamMessages,
  isStreaming,
  isVisible = false,
  onClose,
  staticSources,
  activeTask,
  progressPercentage,
  sources
}: AegisExecutionPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [fetchedOutputContent] = useState<string | null>(null)
  const [fetchedSourceContent] = useState<string | null>(null)
  const [researchSession] = useState<string | null>(null)

  // NEW: Add state for sources view
  const [activeTab, setActiveTab] = useState('execution')


  // NEW: Parse static sources from message content OR use direct sources prop
  const parsedStaticSources = useMemo(() => {
    // Helper to map a raw Sophia document source to ParsedSource
    const mapSophiaSource = (rawSource: any): ParsedSource => ({
      title: rawSource.document_name || rawSource.metadata?.original_title || rawSource.filename || 'Unknown Document',
      url: rawSource.document_id?.startsWith('http') ? rawSource.document_id : (rawSource.metadata?.url || rawSource.url || ''),
      content: rawSource.chunk_text || rawSource.content_preview || (rawSource.full_content ? rawSource.full_content.slice(0, 400) : '') || '',
      sourceType: rawSource.metadata?.source_type || 'document',
      relevanceScore: rawSource.score || 0,
      timestamp: rawSource.metadata?.created_at || rawSource.timestamp,
      metadata: rawSource.metadata,
      documentId: rawSource.document_id,
      documentName: rawSource.document_name || rawSource.metadata?.original_title || rawSource.filename,
      fullContent: rawSource.chunk_text || rawSource.full_content || rawSource.content_preview || '',
      chunkIndex: rawSource.chunk_index ?? rawSource.metadata?.chunk_index,
      totalChunks: rawSource.metadata?.total_chunks,
      isSophiaDocument: true
    })

    // Deduplicate RAW sources before mapping (handles nested chunk_index in metadata)
    const deduplicateRaw = (arr: any[]): any[] => {
      const seen = new Set<string>()
      return arr.filter((s) => {
        const docId = s.document_id ?? s.documentId ?? ''
        const chunkIdx = s.chunk_index ?? s.metadata?.chunk_index ?? s.chunkIndex ?? ''
        const docName = s.document_name || s.filename || s.title || ''
        const score = String(s.score ?? '')
        // Primary key: docId + chunkIdx (most reliable)
        // Fallback: docName + chunkIdx + score (when docId is missing)
        const key = docId
          ? `id:${docId}__chunk:${chunkIdx}`
          : `name:${docName}__chunk:${chunkIdx}__score:${score}`
        if (seen.has(key)) {
          console.log('🔁 Dedup: removing duplicate source:', key)
          return false
        }
        seen.add(key)
        return true
      })
    }

    // Deduplicate mapped ParsedSource array (second pass safety net)
    const deduplicateSources = (arr: ParsedSource[]): ParsedSource[] => {
      const seen = new Set<string>()
      return arr.filter((s) => {
        const key = s.documentId
          ? `id:${s.documentId}__chunk:${s.chunkIndex ?? ''}`
          : `name:${s.documentName || s.title}__chunk:${s.chunkIndex ?? ''}__score:${s.relevanceScore}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    // PRIORITY ZERO: Use structured sources directly from staticSources.sources
    // (populated from message.sources after page refresh)
    if (staticSources?.sources && staticSources.sources.length > 0) {
      console.log('📊 Using staticSources.sources directly:', staticSources.sources.length)
      const rawSources = staticSources.sources

      // Detect Sophia document format: has document_name/document_id but no url
      const isSophiaFormat = rawSources[0]?.document_name || rawSources[0]?.document_id

      if (isSophiaFormat) {
        const deduped = deduplicateRaw(rawSources)
        return deduplicateSources(deduped.map(mapSophiaSource))
      }

      // Web sources format (Aegis research) — map to ParsedSource
      return rawSources.map((rawSource: any): ParsedSource => ({
        title: rawSource.document_name || rawSource.title || 'Untitled',
        url: rawSource.document_id?.startsWith('http') ? rawSource.document_id : (rawSource.url || rawSource.metadata?.url || ''),
        content: rawSource.chunk_text || rawSource.snippet || rawSource.content || '',
        sourceType: rawSource.metadata?.source_type || rawSource.source || rawSource.sourceType || 'unknown',
        relevanceScore: rawSource.score || rawSource.relevanceScore || 0,
        timestamp: rawSource.timestamp,
        metadata: rawSource.metadata,
        citationFormat: rawSource.citationFormat
      }))
    }

    // FIRST: Check for 'source' type messages from Sophia stream transformer
    // (transformer outputs type:'source' with metadata.sources array)
    // Collect from ALL source messages (stream may fire multiple times)
    const sourceMsgs = streamMessages.filter(msg => msg.type === 'source' && msg.metadata?.sources)
    if (sourceMsgs.length > 0) {
      const allRaw = sourceMsgs.flatMap(msg =>
        Array.isArray(msg.metadata.sources) ? msg.metadata.sources : []
      )
      if (allRaw.length > 0 && (allRaw[0]?.document_name || allRaw[0]?.document_id)) {
        console.log('📊 Raw sources before dedup:', allRaw.length, allRaw.map((s: any) => ({
          id: s.document_id, name: s.document_name, chunk: s.chunk_index ?? s.metadata?.chunk_index, score: s.score
        })))
        const deduped = deduplicateRaw(allRaw)
        console.log('📊 Sources after dedup:', deduped.length)
        return deduplicateSources(deduped.map(mapSophiaSource))
      }
    }

    // SECOND: Check completion message metadata for sources
    const completionMsg = streamMessages.find(msg => msg.type === 'completion' && msg.metadata?.sources)
    if (completionMsg?.metadata?.sources && Array.isArray(completionMsg.metadata.sources)) {
      const arr = completionMsg.metadata.sources
      if (arr.length > 0 && (arr[0]?.document_name || arr[0]?.document_id)) {
        const deduped = deduplicateRaw(arr)
        console.log('📊 Found sources in completion metadata:', arr.length, '→ after dedup:', deduped.length)
        return deduplicateSources(deduped.map(mapSophiaSource))
      }
    }



    // THIRD: Check for sources in streamMessages content (from 'sources' type event)
    const sourcesMessage = streamMessages.find(msg => msg.type === 'sources')
    if (sourcesMessage && sourcesMessage.content) {
      try {
        const sourcesData = JSON.parse(sourcesMessage.content)
        const sourcesArray = sourcesData.sources || (Array.isArray(sourcesData) ? sourcesData : null)
        if (sourcesArray && Array.isArray(sourcesArray)) {
          console.log('📊 Parsed sources from stream content:', sourcesArray.length)
          if (sourcesArray.length > 0 && (sourcesArray[0]?.document_name || sourcesArray[0]?.document_id)) {
            return sourcesArray.map(mapSophiaSource)
          }
          return sourcesArray.map((rawSource: any): ParsedSource => ({
            title: rawSource.title || 'Untitled',
            url: rawSource.url || '',
            content: rawSource.snippet || rawSource.content || '',
            sourceType: rawSource.source || rawSource.sourceType || 'unknown',
            relevanceScore: rawSource.score || rawSource.relevanceScore || 0,
            timestamp: rawSource.timestamp,
            metadata: rawSource.metadata,
            citationFormat: rawSource.citationFormat
          }))
        }
      } catch (error) {
        console.error('❌ Error parsing sources from stream:', error)
      }
    }

    // SECOND: If direct sources array is provided, use it and map to expected format
    if (sources && sources.length > 0) {
      console.log('📊 Using direct sources array:', sources.length)

      // Detect Sophia document format: has document_name/document_id but no url
      const isSophiaFormat = sources[0]?.document_name || sources[0]?.document_id

      if (isSophiaFormat) {
        // Deduplicate first, then map Sophia document chunks to ParsedSource
        const deduped = deduplicateRaw(sources)
        console.log('📊 Direct sources after dedup:', sources.length, '→', deduped.length)
        return deduplicateSources(deduped.map(mapSophiaSource))
      }

      // Map the raw source format to ParsedSource format (web sources)
      return sources.map((rawSource: any): ParsedSource => ({
        title: rawSource.title || 'Untitled',
        url: rawSource.url || '',
        content: rawSource.snippet || rawSource.content || '',
        sourceType: rawSource.source || rawSource.sourceType || 'unknown',
        relevanceScore: rawSource.score || rawSource.relevanceScore || 0,
        timestamp: rawSource.timestamp,
        metadata: rawSource.metadata,
        citationFormat: rawSource.citationFormat
      }))
    }

    // THIRD: Otherwise, parse from staticSources content (Aegis markdown format)
    if (!staticSources?.content) return []

    try {
      console.log('🔍 Parsing static sources from markdown:', staticSources.content.substring(0, 200))

      // First, try to parse as JSON
      try {
        const jsonData = JSON.parse(staticSources.content)
        if (jsonData.sources && Array.isArray(jsonData.sources)) {
          console.log('📊 Parsed JSON sources:', jsonData.sources.length)
          return jsonData.sources.map((rawSource: any): ParsedSource => ({
            title: rawSource.title || 'Untitled',
            url: rawSource.url || '',
            content: rawSource.snippet || rawSource.content || '',
            sourceType: rawSource.source || rawSource.sourceType || 'unknown',
            relevanceScore: rawSource.score || rawSource.relevanceScore || 0,
            timestamp: rawSource.timestamp,
            metadata: rawSource.metadata,
            citationFormat: rawSource.citationFormat
          }))
        }
      } catch (jsonError) {
        // Not JSON, continue with markdown parsing
        console.log('🔍 Not JSON format, parsing as markdown')
      }

      // Parse markdown format
      const sources: ParsedSource[] = []
      const lines = staticSources.content.split('\n')
      let currentSource: Partial<ParsedSource> = {}

      for (const line of lines) {
        if (line.startsWith('### Result ')) {
          // Save previous source if exists
          if (currentSource.title && currentSource.url) {
            sources.push(currentSource as ParsedSource)
          }
          // Start new source
          currentSource = {}

          // FIXED: Handle title on same line as "### Result N: Title"
          const titleMatch = line.match(/^###\s+Result\s+\d+:\s+(.+)$/)
          if (titleMatch) {
            currentSource.title = titleMatch[1].trim()
          }
        } else if (line.startsWith('**Title**: ')) {
          currentSource.title = line.replace('**Title**: ', '')
        } else if (line.startsWith('**Full URL**: ') || line.startsWith('**URL**: ')) {
          currentSource.url = line.replace('**Full URL**: ', '').replace('**URL**: ', '')
        } else if (line.startsWith('**Source Type**: ') || line.startsWith('**Source**: ')) {
          currentSource.sourceType = line.replace('**Source Type**: ', '').replace('**Source**: ', '')
        } else if (line.startsWith('**Relevance Score**: ') || line.startsWith('**Relevance**: ') || line.startsWith('**Score**: ')) {
          const scoreText = line.replace('**Relevance Score**: ', '').replace('**Relevance**: ', '').replace('**Score**: ', '')
          currentSource.relevanceScore = parseFloat(scoreText)
        } else if (line.startsWith('**Content**: ') || line.startsWith('**Snippet**: ')) {
          currentSource.content = line.replace('**Content**: ', '').replace('**Snippet**: ', '')
        } else if (line.startsWith('**Citation Format**: ')) {
          currentSource.citationFormat = line.replace('**Citation Format**: ', '')
        }
      }

      // Don't forget the last source
      if (currentSource.title && currentSource.url) {
        sources.push(currentSource as ParsedSource)
      }

      console.log('📊 Parsed markdown sources:', sources.length)
      return sources
    } catch (error) {
      console.error('❌ Error parsing static sources:', error)
      return []
    }
  }, [streamMessages, sources, staticSources?.content])

  // Deduplicate and sort sources
  const filteredSources = useMemo(() => {
    let result = parsedStaticSources

    // Deduplicate by document name — keep only the highest-relevance chunk per document
    const byName = new Map<string, ParsedSource>()
    for (const s of result) {
      const name = (s.documentName || s.title || '').trim().toLowerCase()
      const existing = byName.get(name)
      if (!existing || (s.relevanceScore || 0) > (existing.relevanceScore || 0)) {
        byName.set(name, s)
      }
    }
    result = Array.from(byName.values())

    // Always sort by relevance
    result = result.sort((a: ParsedSource, b: ParsedSource) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

    return result
  }, [parsedStaticSources])

  // Source types calculation removed - not used after filter removal

  // FIXED: Memoize parsed messages with stable reference
  const parsedMessages = useMemo(() => {
    return parseMessagesByType(streamMessages)
  }, [streamMessages])

  // Convert staticSources.logs (from message.metadata.logs) to StreamMessage[] format
  // so they can be shown in the Logs tab after page refresh
  const staticLogs = useMemo((): StreamMessage[] => {
    if (!staticSources?.logs || staticSources.logs.length === 0) return []
    if (streamMessages.length > 0) return [] // Don't use static logs when streaming is active

    return staticSources.logs
      .filter(log => log.type === 'log' || log.type === 'activity' || log.type === 'progress' || log.type === 'message')
      .map(log => ({
        type: (log.type === 'progress' || log.type === 'message' ? 'activity' : log.type) as StreamMessage['type'],
        content: log.content,
        timestamp: log.timestamp || new Date().toISOString()
      }))
  }, [staticSources?.logs, streamMessages.length])

  // FIXED: Calculate progress and stage with improved logic
  const progress = useMemo(() => {
    if (progressPercentage !== undefined) {
      return progressPercentage
    }

    if (streamMessages.length > 0) {
      const calculated = extractProgress(streamMessages)
      console.log('📊 Calculated progress from stream:', calculated)
      return calculated
    }

    // Fallback to active task progress if not streaming
    if (activeTask) {
      console.log('📊 Using progress from background task:', activeTask.progress.percentage)
      return activeTask.progress.percentage
    }

    return 0
  }, [streamMessages, activeTask, progressPercentage])

  const currentStage = useMemo(() => {
    if (streamMessages.length > 0) {
      const stage = extractCurrentStage(streamMessages)
      console.log('🎯 Current stage from stream:', stage)
      return stage
    }

    // Fallback to active task stage if not streaming
    if (activeTask) {
      console.log('🎯 Using stage from background task:', activeTask.progress.current_stage)
      return activeTask.progress.current_stage || 'Processing background task...'
    }

    return 'Initializing...'
  }, [streamMessages, activeTask])

  // Combined content for tabs with deduplication
  const outputContent = useMemo(() => {
    const combined = combineOutputContent(parsedMessages.output)
    return fetchedOutputContent || combined
  }, [parsedMessages.output, fetchedOutputContent])

  const sourceContent = useMemo(() => {
    const combined = combineSourceContent(parsedMessages.source)
    return fetchedSourceContent || combined
  }, [parsedMessages.source, fetchedSourceContent])

  // Check various completion states - ENHANCED
  const isCompleted = streamMessages.some(msg =>
    msg.type === 'completion' ||
    msg.content.toLowerCase().includes('research completed successfully') ||
    msg.content.toLowerCase().includes('research session completed') ||
    msg.content.toLowerCase().includes('final result generated') ||
    (msg.type === 'status' && msg.content.toLowerCase().includes('research complete'))
  ) || activeTask?.status === 'completed'

  // const isDownloading = isDownloadingFiles(streamMessages)
  const hasDownloadedContent = outputContent.length > 0 || sourceContent.length > 0

  // FIXED: Show progress indicator if we have any activity, task or completion
  const showProgressIndicator = isStreaming ||
    streamMessages.length > 0 ||
    progress > 0 ||
    isCompleted ||
    (!!activeTask && activeTask.status === 'running')

  // NEW: Auto-switch to sources tab when sources are loaded (direct or static)
  useEffect(() => {
    if (parsedStaticSources.length > 0) {
      console.log('📋 Auto-switching to sources tab, sources count:', parsedStaticSources.length)
      setActiveTab('source')
    }
  }, [parsedStaticSources.length])

  // Auto-scroll for execution logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'auto' })
    }
  }, [parsedMessages.log])

  // NEW: Download functions for static sources
  const handleDownloadSources = () => {
    if (parsedStaticSources.length === 0) return

    const sourcesJson = JSON.stringify(parsedStaticSources, null, 2)
    const blob = new Blob([sourcesJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generateFilename('research-sources', 'json')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Sources Downloaded",
      description: `${parsedStaticSources.length} research sources saved as JSON`,
      duration: 2000
    })
  }

  // Enhanced download functions using backend endpoints
  const downloadOutputAsMarkdown = async () => {
    if (!researchSession) {
      // Fallback to in-memory content if no session
      if (!outputContent) return

      const blob = new Blob([outputContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generateFilename('output', 'md')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download Complete",
        description: "Output saved as Markdown file",
        duration: 2000
      })
      return
    }

    // Use backend download endpoint
    try {
      const token = localStorage.getItem('mentis_auth_token')
      if (!token) throw new Error('No auth token')

      const apiUrl = import.meta.env.VITE_API_URL
      const response = await fetch(`${apiUrl}/agents/aegis/research/download/report?session_id=${researchSession}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const content = await response.text()
        const blob = new Blob([content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = generateFilename('research-report', 'md')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Download Complete",
          description: "Research report downloaded successfully",
          duration: 2000
        })
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download research report",
        variant: "destructive",
        duration: 2000
      })
    }
  }

  const downloadSourceAsText = async () => {
    if (!researchSession) {
      // Fallback to in-memory content if no session
      if (!sourceContent) return

      const blob = new Blob([sourceContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generateFilename('source', 'txt')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download Complete",
        description: "Source data saved as text file",
        duration: 2000
      })
      return
    }

    // Use backend download endpoint
    try {
      const token = localStorage.getItem('mentis_auth_token')
      if (!token) throw new Error('No auth token')

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005'
      const response = await fetch(`${apiUrl}/agents/aegis/research/download/raw-dump?session_id=${researchSession}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const content = await response.text()
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = generateFilename('raw-search-dump', 'txt')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Download Complete",
          description: "Raw search data downloaded successfully",
          duration: 2000
        })
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download raw search data",
        variant: "destructive",
        duration: 2000
      })
    }
  }

  const downloadLogsAsText = () => {
    if (parsedMessages.log.length === 0) return

    const logContent = parsedMessages.log
      .map(msg => `[${new Date(msg.timestamp).toLocaleTimeString()}] ${normalizeStreamedText(msg.content)}`)
      .join('\n')

    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generateFilename('logs', 'txt')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Complete",
      description: "Execution logs saved as text file",
      duration: 2000
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between pl-8 pr-4 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Execution Panel</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {staticSources ? 'Viewing research sources' :
                activeTask ? `Background Task: ${activeTask.id.slice(0, 8)}` :
                  researchSession ? `Session: ${researchSession.slice(-8)}` : 'Research Execution'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* NEW: Status indicator */}
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-xs text-orange-600 font-medium">Live</span>
              </div>
            ) : (activeTask && (activeTask.status === 'running' || activeTask.status === 'queued')) ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-blue-600 font-medium capitalize">{activeTask.status}</span>
              </div>
            ) : staticSources || activeTask?.status === 'completed' ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-600 font-medium">Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-xs text-gray-500 font-medium">Idle</span>
              </div>
            )}
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* FIXED: Progress Indicator - Always show when there's activity */}
      {showProgressIndicator && (
        <ProgressIndicator
          progress={progress}
          currentStage={currentStage}
          isActive={isStreaming || !!activeTask}
          isCompleted={isCompleted}
        />
      )}

      {/* Enhanced Completion Notification */}
      {isCompleted && hasDownloadedContent && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 block">
                Research Complete
              </span>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Results added to chat and available for download
              </p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-medium border-0">
              {Math.round((outputContent.length + sourceContent.length) / 1024)} KB
            </Badge>
          </div>
        </div>
      )}

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <div className="pl-8 pr-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <TabsList className="grid w-full grid-cols-3 h-10 bg-white dark:bg-slate-700 shadow-sm">
            <TabsTrigger value="execution" className="text-xs flex items-center gap-2 font-medium">
              <Terminal className="h-3 w-3" />
              Logs
              {(isStreaming || parsedMessages.log.length > 0 || staticLogs.length > 0) && (
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                )} />
              )}
            </TabsTrigger>
            {/* <TabsTrigger value="output" className="text-xs flex items-center gap-2 font-medium">
              <FileOutput className="h-3 w-3" />
              Output
              {outputContent.length > 0 && (
                <Badge className="h-4 px-1.5 text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-medium border-0">
                  Ready
                </Badge>
              )}
            </TabsTrigger> */}
            <TabsTrigger value="source" className="text-xs flex items-center gap-2 font-medium">
              <Search className="h-3 w-3" />
              Sources
              {/* NEW: Show badge for both stream sources and static sources */}
              {(sourceContent.length > 0 || parsedStaticSources.length > 0) && (
                <Badge className="h-4 px-1.5 text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium border-0">
                  {parsedStaticSources.length > 0 ? parsedStaticSources.length : 'Ready'}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs flex items-center gap-2 font-medium">
              <FolderOpen className="h-3 w-3" />
              Files
              {parsedMessages.files.length > 0 && (
                <Badge className="h-4 px-1.5 text-[9px] bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-medium border-0">
                  {parsedMessages.files.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Execution/Logs Tab */}
          <TabsContent value="execution" className="h-full m-0 data-[state=active]:flex flex-col">
            <div className="pl-8 pr-4 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-3 w-3 rounded-full shadow-sm",
                  isStreaming ? 'bg-emerald-500 animate-pulse' :
                    isCompleted ? 'bg-blue-500' :
                      parsedMessages.log.length > 0 ? 'bg-yellow-500' : 'bg-gray-400'
                )} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isStreaming ? 'Live Stream' :
                    isCompleted ? 'Completed' :
                      parsedMessages.log.length > 0 ? 'Processed' : 'Ready'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(parsedMessages.log.length > 0 || staticLogs.length > 0) && (
                  <Button
                    onClick={downloadLogsAsText}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {parsedMessages.log.length > 0 ? parsedMessages.log.length : staticLogs.length} messages
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1 pl-8 pr-4 py-3" ref={scrollAreaRef}>
              <div className="space-y-3">
                {/* Determine which log source to display: live stream logs or stored static logs */}
                {(() => {
                  const displayLogs = parsedMessages.log.length > 0 ? parsedMessages.log : staticLogs
                  if (displayLogs.length === 0 && !isStreaming) {
                    return (
                      <div className="flex items-center justify-center h-40 text-slate-500 dark:text-slate-400">
                        <div className="text-center">
                          <Terminal className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                          <p className="text-sm font-medium">Execution logs will appear here</p>
                          <p className="text-xs text-slate-400 mt-1">Start a research task to see live updates</p>
                        </div>
                      </div>
                    )
                  }
                  return displayLogs.map((message, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex gap-3 items-start py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-2 flex-shrink-0 font-medium",
                            message.type === 'completion'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                              : message.type === 'activity'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          )}
                        >
                          {message.type === 'completion' ? 'DONE' :
                            message.type === 'activity' ? 'ACT' : 'LOG'}
                        </Badge>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed break-words font-mono text-xs flex-1">
                          {normalizeStreamedText(message.content)}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0 font-medium">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                })()}
                <div ref={logsEndRef} className="h-0 w-0" />

                {/* ✅ FIXED: Only show when actively streaming AND not complete */}
                {(isStreaming && progress < 100) && (
                  <div className="flex gap-3 items-center mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-semibold block">
                        Receiving live updates...
                      </span>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3 mt-1">
                        <span>{parsedMessages.log.length} messages</span>
                        {progress > 0 && (
                          <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full font-medium">
                            {progress}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Output Tab */}
          {/* Output Tab */}
          {/* <TabsContent value="output" className="h-full m-0 data-[state=active]:flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Research Report</span>
              {outputContent && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => copyToClipboard(outputContent, 'Research Report')}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    onClick={downloadOutputAsMarkdown}
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
                  <MarkdownContent
                    content={outputContent}
                    isUser={false}
                    isDarkTheme={isDarkTheme}
                    className="max-w-none"
                  />
                </div>
              ) : (isDownloading || isFetchingContent) ? (
                <div className="flex items-center justify-center h-full text-slate-600">
                  <div className="text-center animate-pulse">
                    <Download className="h-16 w-16 mx-auto mb-4 text-slate-500" />
                    <p className="text-lg font-semibold mb-2">
                      {isFetchingContent ? 'Fetching research report...' : 'Downloading research report...'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we fetch your research results</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <FileOutput className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg font-semibold mb-2">
                      {isStreaming ? 'Generating research report...' : 'Research report will appear here'}
                    </p>
                    <p className="text-sm text-slate-400">
                      Start a research task to generate a comprehensive report
                    </p>
                    {researchSession && (
                      <p className="text-xs text-slate-400 mt-2 font-mono">
                        Session: {researchSession.slice(-12)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent> */}

          {/* Enhanced Source Tab with both stream sources AND static sources */}
          <TabsContent value="source" className="h-full m-0 data-[state=active]:flex flex-col">
            <div className="h-full flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="pl-8 pr-4 py-3 space-y-3">
                  {filteredSources.length > 0 ? (
                    filteredSources.map((source: ParsedSource, index: number) => (
                      <SourceCard
                        key={index}
                        source={source}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Database className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {isStreaming ? 'Searching knowledge base...' : 'No sources yet'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {isStreaming ? 'Sources will appear here when found' : 'Sources appear after a query completes'}
                      </p>
                      {isStreaming && (
                        <div className="mt-4 flex gap-1">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="h-full m-0 data-[state=active]:flex flex-col">
            <div className="pl-8 pr-4 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Research Files</span>
              <Button
                onClick={() => {/* Refresh files */ }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                disabled={parsedMessages.files.length === 0}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            <ScrollArea className="flex-1 pl-8 pr-4 py-3">
              {hasDownloadedContent || researchSession ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Downloaded files section */}
                  {hasDownloadedContent && (
                    <>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Available Downloads
                      </div>

                      {outputContent && (
                        <Card className="hover:shadow-sm transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Research Report</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {Math.round(outputContent.length / 1024)} KB • Markdown format
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={downloadOutputAsMarkdown}
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

                      {(sourceContent || parsedStaticSources.length > 0) && (
                        <Card className="hover:shadow-sm transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Source Documents</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {parsedStaticSources.length > 0
                                      ? `${parsedStaticSources.length} sources • Structured data`
                                      : `${Math.round(sourceContent.length / 1024)} KB • Text format`
                                    }
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={parsedStaticSources.length > 0 ? handleDownloadSources : downloadSourceAsText}
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
                    </>
                  )}

                  {/* Research session info */}
                  {researchSession && (
                    <Card className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center">
                            <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Research Session</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 mb-2">
                          {researchSession}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {isCompleted ? 'Files available for download' : 'Files will be available after research completion'}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Regular file messages */}
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
                          <Button
                            onClick={() => {/* Download file */ }}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <FolderOpen className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg font-semibold mb-2">Research files will appear here</p>
                    <p className="text-sm text-slate-400 mb-2">
                      {isStreaming ? 'Research in progress...' : 'Start a research task to see files'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Download reports, source data, and logs when research completes
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs >
    </div >
  )
}