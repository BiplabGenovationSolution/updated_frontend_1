'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  FileJson,
  Code,
  X,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Activity,
  Zap
} from 'lucide-react'
import AgentInterface from '@/components/agent-interfaces/AgentInterface'
import { cn } from '@/lib/utils'
import Avatar from 'boring-avatars'

interface TestAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: {
    id: string
    name: string
    emoji: string
    description: string
    agent_type: 'chat' | 'flow'
    interface_type: 'chat' | 'form' | 'json' | 'api' | 'wizard'
    interface_config?: Record<string, any>
    [key: string]: any
  }
}

type InterfaceType = 'chat' | 'form' | 'json'

interface ExecutionLog {
  id: string
  timestamp: Date
  status: 'running' | 'success' | 'error'
  interface: InterfaceType
  input: any
  output?: any
  error?: string
  duration?: number
}

export function TestAgentDialog({ open, onOpenChange, agent }: TestAgentDialogProps) {
  const [selectedInterface, setSelectedInterface] = useState<InterfaceType>(
    (agent.interface_type as InterfaceType) || 'chat'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([])

  const handleMessage = async (message: string | Record<string, any>) => {
    const logId = Date.now().toString()
    const startTime = Date.now()

    // Add running log
    const newLog: ExecutionLog = {
      id: logId,
      timestamp: new Date(),
      status: 'running',
      interface: selectedInterface,
      input: message
    }
    setExecutionLogs(prev => [newLog, ...prev])

    try {
      setIsLoading(true)
      console.log('Test message:', message)

      // TODO: Implement actual API call to test the agent
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

      const duration = Date.now() - startTime

      // Update log with success
      setExecutionLogs(prev => prev.map(log =>
        log.id === logId
          ? {
              ...log,
              status: 'success' as const,
              output: { result: 'Mock response from agent' },
              duration
            }
          : log
      ))
    } catch (error) {
      console.error('Failed to send test message:', error)

      // Update log with error
      setExecutionLogs(prev => prev.map(log =>
        log.id === logId
          ? {
              ...log,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Unknown error',
              duration: Date.now() - startTime
            }
          : log
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const interfaceOptions = [
    { value: 'chat' as InterfaceType, label: 'Chat', icon: MessageSquare, gradient: 'from-blue-500 to-indigo-600' },
    { value: 'form' as InterfaceType, label: 'Form', icon: FileJson, gradient: 'from-purple-500 to-pink-600' },
    { value: 'json' as InterfaceType, label: 'JSON', icon: Code, gradient: 'from-emerald-500 to-teal-600' }
  ]

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Running</Badge>
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
      case 'error':
        return <Badge className="bg-red-500 hover:bg-red-600">Error</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col p-0 gap-0">
        {/* Stunning Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-white/20 text-white z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="relative z-10 flex items-start gap-6">
            {/* Avatar with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 blur-xl rounded-3xl" />
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/30">
                <Avatar
                  size={80}
                  name={agent.name}
                  variant="marble"
                  colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']}
                />
              </div>
            </div>

            <div className="flex-1 pt-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  {agent.name}
                </h2>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {agent.agent_type === 'flow' ? '🔄 Flow Agent' : '💬 Chat Agent'}
                </Badge>
              </div>
              <p className="text-white/90 text-sm max-w-2xl leading-relaxed">
                {agent.description}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Activity className="h-4 w-4 text-white/80" />
                <span className="text-xs text-white/80">Live Testing Environment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden bg-gray-50">
          {/* Left: Interface Tester */}
          <div className="flex-1 flex flex-col border-r">
            {/* Interface Type Tabs */}
            <div className="px-6 pt-6 pb-4 bg-white border-b">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Interface Type</h3>
              </div>
              <div className="flex gap-2">
                {interfaceOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedInterface === option.value
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedInterface(option.value)}
                      className={cn(
                        'flex items-center gap-2 transition-all relative overflow-hidden group',
                        isSelected && `bg-gradient-to-r ${option.gradient} hover:opacity-90 shadow-lg border-0 text-white`,
                        !isSelected && 'hover:bg-gray-50 hover:border-gray-300'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
                      )}
                      <Icon className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">{option.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Interface Preview */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full bg-white rounded-xl shadow-sm border-2 border-gray-100 overflow-hidden">
                <AgentInterface
                  agent={{
                    ...agent,
                    interface_type: selectedInterface,
                    interface_config: agent.interface_config || {}
                  }}
                  onMessage={handleMessage}
                  isLoading={isLoading}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* Right: Execution Logs */}
          <div className="w-[400px] flex flex-col bg-white">
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Execution Logs</h3>
                <Badge variant="outline" className="ml-auto text-xs">
                  {executionLogs.length} total
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {executionLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <PlayCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No executions yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Send a message to start testing
                    </p>
                  </div>
                ) : (
                  executionLogs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'rounded-lg border p-3 transition-all',
                        log.status === 'success' && 'bg-green-50 border-green-200',
                        log.status === 'error' && 'bg-red-50 border-red-200',
                        log.status === 'running' && 'bg-blue-50 border-blue-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="text-xs font-medium text-gray-700">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600 font-medium mb-1">Input:</p>
                          <div className="bg-white/60 rounded p-2 text-xs font-mono text-gray-800 border">
                            {typeof log.input === 'string'
                              ? log.input.substring(0, 100) + (log.input.length > 100 ? '...' : '')
                              : JSON.stringify(log.input, null, 2).substring(0, 100) + '...'
                            }
                          </div>
                        </div>

                        {log.output && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium mb-1">Output:</p>
                            <div className="bg-white/60 rounded p-2 text-xs font-mono text-gray-800 border">
                              {JSON.stringify(log.output, null, 2).substring(0, 100) + '...'}
                            </div>
                          </div>
                        )}

                        {log.error && (
                          <div>
                            <p className="text-xs text-red-600 font-medium mb-1">Error:</p>
                            <div className="bg-white/60 rounded p-2 text-xs font-mono text-red-700 border border-red-200">
                              {log.error}
                            </div>
                          </div>
                        )}

                        {log.duration !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{log.duration}ms</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Clear Logs Button */}
            {executionLogs.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExecutionLogs([])}
                  className="w-full"
                >
                  Clear Logs
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
