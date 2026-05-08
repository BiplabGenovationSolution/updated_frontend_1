'use client'

import React, { useEffect, useState } from 'react'
import type { FlowExecution, ExecutionStatus } from '@/lib/flow-types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  History,
  ChevronRight,
  Eye,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExecutionHistoryProps {
  executions: FlowExecution[]
  onRefresh?: () => void
  onSelectExecution?: (execution: FlowExecution) => void
  isLoading?: boolean
  className?: string
}

export default function ExecutionHistory({
  executions,
  onRefresh,
  onSelectExecution,
  isLoading = false,
  className
}: ExecutionHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.PENDING:
        return <Clock className="w-4 h-4 text-gray-500" />
      case ExecutionStatus.RUNNING:
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case ExecutionStatus.COMPLETED:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case ExecutionStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<ExecutionStatus, string> = {
      [ExecutionStatus.PENDING]: 'bg-gray-100 text-gray-700 border-gray-300',
      [ExecutionStatus.RUNNING]: 'bg-blue-100 text-blue-700 border-blue-300',
      [ExecutionStatus.COMPLETED]: 'bg-green-100 text-green-700 border-green-300',
      [ExecutionStatus.FAILED]: 'bg-red-100 text-red-700 border-red-300'
    }

    return (
      <Badge
        variant="outline"
        className={cn('text-xs', variants[status])}
      >
        {status}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const handleSelectExecution = (execution: FlowExecution) => {
    setSelectedId(execution.execution_id)
    onSelectExecution?.(execution)
  }

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Execution History
            </h3>
          </div>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={cn('w-4 h-4', isLoading && 'animate-spin')}
              />
              Refresh
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-600">
          {executions.length} execution{executions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : executions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <History className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-600">No executions yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Execute your flow to see history
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {executions.map((execution) => (
              <div
                key={execution.execution_id}
                className={cn(
                  'p-3 rounded-lg border-2 cursor-pointer transition-all duration-150',
                  'hover:bg-gray-50 hover:border-gray-300',
                  selectedId === execution.execution_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                )}
                onClick={() => handleSelectExecution(execution)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(execution.status as ExecutionStatus)}
                    <span className="text-xs font-mono text-gray-600">
                      {execution.execution_id.substring(0, 8)}...
                    </span>
                  </div>
                  {getStatusBadge(execution.status as ExecutionStatus)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-gray-500">Started:</span>
                    <div className="font-medium text-gray-900">
                      {execution.started_at
                        ? formatDate(execution.started_at)
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <div className="font-medium text-gray-900">
                      {formatDuration(execution.duration_ms)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      Nodes: <span className="font-medium text-gray-900">
                        {execution.visited_nodes.length}
                      </span>
                    </span>
                    {execution.error_message && (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Error
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                {selectedId === execution.execution_id && execution.error_message && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-red-600 break-words">
                      {execution.error_message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {executions.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              Success:{' '}
              <span className="font-semibold text-green-600">
                {executions.filter(e => e.status === ExecutionStatus.COMPLETED).length}
              </span>
            </span>
            <span>
              Failed:{' '}
              <span className="font-semibold text-red-600">
                {executions.filter(e => e.status === ExecutionStatus.FAILED).length}
              </span>
            </span>
            <span>
              Running:{' '}
              <span className="font-semibold text-blue-600">
                {executions.filter(e => e.status === ExecutionStatus.RUNNING).length}
              </span>
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
