'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Terminal,
  FileOutput,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  X,
  Zap,
  Code,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { MarkdownContent } from '@/components/markdown/MarkdownContent'

interface ExecutionEvent {
  type: 'capability' | 'info' | 'error' | 'success'
  timestamp: string
  capability?: string
  message: string
  executionTime?: number
  success?: boolean
  metadata?: any
}

interface CustomAgentExecutionPanelProps {
  events: ExecutionEvent[]
  isExecuting: boolean
  currentCapability?: string | null
  isVisible?: boolean
  isCollapsed?: boolean
  onClose?: () => void
}

export function CustomAgentExecutionPanel({
  events,
  isExecuting,
  currentCapability,
  isVisible = true,
  isCollapsed = false,
  onClose
}: CustomAgentExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'output'>('logs')
  const { toast } = useToast()
  const viewportRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (activeTab === 'logs' && viewportRef.current) {
      const viewport = viewportRef.current
      requestAnimationFrame(() => {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight
        }, 0)
      })
    }
  }, [events, activeTab, isExecuting])

  if (!isVisible) return null

  // Aggregate output content from events
  const outputContent = events
    .filter(e => e.type === 'success' && e.message && e.message.length > 50)
    .map(e => e.message)
    .join('\n\n')

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard',
        description: `${label} copied successfully`,
        duration: 2000
      })
    }).catch(() => {
      toast({
        title: 'Copy failed',
        description: 'Please try again',
        variant: 'destructive',
        duration: 2000
      })
    })
  }

  // Download helper
  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
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
      duration: 2000
    })
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Format execution time
  const formatExecutionTime = (ms?: number) => {
    if (!ms) return ''
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Get icon for event type
  const getEventIcon = (event: ExecutionEvent) => {
    switch (event.type) {
      case 'capability':
        return event.success === false ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Zap className="h-4 w-4 text-purple-500" />
        )
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'info':
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  // Get badge color for event type
  const getEventBadgeColor = (event: ExecutionEvent) => {
    switch (event.type) {
      case 'capability':
        return event.success === false
          ? 'bg-red-100 text-red-700 border-red-200'
          : 'bg-purple-100 text-purple-700 border-purple-200'
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>

      {/* Header - fixed, never shrinks */}
      <div className={cn(
        "flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            isExecuting ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
          )} />
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              Execution Details
            </h3>
          )}
          {!isCollapsed && isExecuting && currentCapability && (
            <Badge variant="outline" className="text-xs truncate max-w-[120px]">
              <Code className="h-3 w-3 mr-1" />
              {currentCapability}
            </Badge>
          )}
        </div>
        {!isCollapsed && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tab bar - fixed, never shrinks */}
      <div className={cn(
        "flex-shrink-0 flex border-b border-slate-200 dark:border-slate-700 bg-transparent",
        isCollapsed ? "flex-col" : "flex-row"
      )}>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            "flex items-center justify-center py-2.5 text-sm font-medium transition-colors",
            isCollapsed ? "px-2 border-l-2 w-full" : "px-4 border-b-2 flex-1",
            activeTab === 'logs'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          )}
          title="Execution Logs"
        >
          <Terminal className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Execution Logs"}
          {!isCollapsed && events.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {events.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={cn(
            "flex items-center justify-center py-2.5 text-sm font-medium transition-colors",
            isCollapsed ? "px-2 border-l-2 w-full" : "px-4 border-b-2 flex-1",
            activeTab === 'output'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          )}
          title="Output"
        >
          <FileOutput className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Output"}
        </button>
      </div>

      {/* Tab content - takes ALL remaining space, scrolls internally */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div
            ref={viewportRef}
            className="h-full w-full overflow-y-auto p-4 space-y-2"
          >
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Activity className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">
                  {isExecuting ? 'Waiting for execution events...' : 'No execution events yet'}
                </p>
              </div>
            ) : (
              events.map((event, idx) => (
                <Card
                  key={`${event.timestamp}-${idx}`}
                  className="border border-slate-200 dark:border-slate-700"
                >
                  <CardContent className={cn("p-3", isCollapsed && "flex flex-col items-center justify-center py-4")}>
                    {isCollapsed ? (
                      <div title={event.message} className="flex flex-col items-center gap-2 w-full">
                        {getEventIcon(event)}
                        <span className="text-[9px] text-slate-400 text-center leading-tight truncate w-full">{formatTime(event.timestamp)}</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getEventIcon(event)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn('text-xs', getEventBadgeColor(event))}>
                            {event.type.toUpperCase()}
                          </Badge>
                          {event.capability && (
                            <>
                              <ChevronRight className="h-3 w-3 text-slate-400" />
                              <Badge variant="outline" className="text-xs">
                                {event.capability}
                              </Badge>
                            </>
                          )}
                          {event.executionTime && (
                            <>
                              <Clock className="h-3 w-3 text-slate-400 ml-auto" />
                              <span className="text-xs text-slate-500">
                                {formatExecutionTime(event.executionTime)}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                          {event.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">
                            {formatTime(event.timestamp)}
                          </span>
                          {event.metadata && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => copyToClipboard(JSON.stringify(event.metadata, null, 2), 'Metadata')}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy JSON
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}

            {/* Currently executing indicator */}
            {isExecuting && currentCapability && (
              <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                <CardContent className={cn("p-3", isCollapsed && "flex justify-center")}>
                  {isCollapsed ? (
                    <div className="flex flex-col items-center gap-2" title={`Executing: ${currentCapability}`}>
                      <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse" />
                      <Activity className="h-3 w-3 text-blue-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-1">
                        EXECUTING
                      </Badge>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Running capability: <code className="font-mono">{currentCapability}</code>
                      </p>
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* OUTPUT TAB */}
        {activeTab === 'output' && (
          <div className="h-full flex flex-col overflow-hidden">
            <div className={cn("flex-shrink-0 p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between", isCollapsed && "justify-center")}>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {outputContent.length > 0 ? (isCollapsed ? 'Out' : `${(outputContent.length / 1024).toFixed(1)} KB`) : (isCollapsed ? '-' : 'No output yet')}
              </span>
              {!isCollapsed && outputContent.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(outputContent, 'Output')}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadAsText(outputContent, 'agent-output.txt')}
                    className="h-7 px-2 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {outputContent.length > 0 ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownContent content={outputContent} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileOutput className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">
                    {isExecuting ? 'Waiting for output...' : 'No output available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
