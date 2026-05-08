'use client'

import React, { useState } from 'react'
import type { FlowExecution, ExecutionStatus } from '@/lib/flow-types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Code
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlowExecutorProps {
  flowId: string
  onExecute: (inputData: Record<string, any>) => Promise<FlowExecution>
  currentExecution?: FlowExecution | null
  className?: string
}

export default function FlowExecutor({
  flowId,
  onExecute,
  currentExecution,
  className
}: FlowExecutorProps) {
  const [inputData, setInputData] = useState('{}')
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExecute = async () => {
    try {
      setIsExecuting(true)
      setError(null)

      let parsedInput: Record<string, any> = {}
      try {
        parsedInput = JSON.parse(inputData)
      } catch (e) {
        setError('Invalid JSON input')
        return
      }

      await onExecute(parsedInput)
    } catch (err: any) {
      setError(err.message || 'Execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.PENDING:
        return <Clock className="w-5 h-5 text-gray-500" />
      case ExecutionStatus.RUNNING:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case ExecutionStatus.COMPLETED:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case ExecutionStatus.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />
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
        className={cn('font-semibold', variants[status])}
      >
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Play className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Flow Executor
          </h3>
        </div>
        <p className="text-xs text-gray-600">
          Execute your flow with custom input data
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Input Data */}
          <div className="space-y-2">
            <Label htmlFor="input-data">Input Data (JSON)</Label>
            <Textarea
              id="input-data"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='{"key": "value"}'
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Enter input data as JSON. This will be passed to the flow's starting node.
            </p>
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Execute Flow
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-1">
                    Execution Error
                  </h4>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Execution Status */}
          {currentExecution && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">
                  Current Execution
                </h4>
                {getStatusBadge(currentExecution.status as ExecutionStatus)}
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Execution ID:</span>
                  <span className="font-mono text-gray-900">
                    {currentExecution.execution_id.substring(0, 12)}...
                  </span>
                </div>

                {currentExecution.current_node_id && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Current Node:</span>
                    <span className="font-mono text-gray-900">
                      {currentExecution.current_node_id}
                    </span>
                  </div>
                )}

                {currentExecution.duration_ms !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-mono text-gray-900">
                      {currentExecution.duration_ms}ms
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Visited Nodes:</span>
                  <span className="font-mono text-gray-900">
                    {currentExecution.visited_nodes.length}
                  </span>
                </div>
              </div>

              {/* Output Data */}
              {currentExecution.output_data && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-gray-600" />
                    <Label>Output Data</Label>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    <pre className="text-xs font-mono text-gray-900 overflow-x-auto">
                      {JSON.stringify(currentExecution.output_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {currentExecution.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">
                        Error
                      </h4>
                      <p className="text-xs text-red-600 break-words">
                        {currentExecution.error_message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Logs */}
              {currentExecution.logs && currentExecution.logs.length > 0 && (
                <div className="space-y-2">
                  <Label>Execution Logs</Label>
                  <div className="p-3 bg-gray-900 rounded-lg max-h-48 overflow-y-auto">
                    {currentExecution.logs.map((log, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono mb-1 last:mb-0"
                      >
                        <span className="text-gray-500">
                          [{log.timestamp}]
                        </span>{' '}
                        <span
                          className={cn(
                            log.level === 'error' && 'text-red-400',
                            log.level === 'warn' && 'text-yellow-400',
                            log.level === 'info' && 'text-blue-400',
                            !log.level && 'text-gray-300'
                          )}
                        >
                          {log.level?.toUpperCase()}
                        </span>{' '}
                        <span className="text-gray-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
