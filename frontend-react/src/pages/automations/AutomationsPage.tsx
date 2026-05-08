import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient, { parseSSEStream } from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  Edit,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

export default function AutomationsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [automations, setAutomations] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [flows, setFlows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showExecutionsDialog, setShowExecutionsDialog] = useState(false)
  const [executions, setExecutions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  // Scheduler management state
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null)
  const [schedulerLogs, setSchedulerLogs] = useState<string[]>([])
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [schedulerLoading, setSchedulerLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_type: 'agent' as 'agent' | 'flow',
    agent_id: '',
    flow_id: '',
    schedule_type: 'cron' as 'cron' | 'interval' | 'one_time',
    cron_expression: '0 13 * * *', // Default: 1 PM daily
    timezone: 'UTC',
    interval_seconds: 3600,
    start_date: '',
    end_date: '',
    timeout_seconds: 300,
    input_template: {},
    retry_policy: {},
    notification_config: {},
    tags: [] as string[],
    is_enabled: true
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth/login')
      return
    }
    loadData()
    loadSchedulerStatus()
  }, [user, authLoading, navigate])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load automations, agents, and flows in parallel
      const [automationsRes, agentsRes, flowsRes] = await Promise.all([
        apiClient.automations.list(),
        apiClient.getCustomAgents({ limit: 100 }),
        apiClient.flows.list()
      ])

      console.log('Automations Response:', automationsRes)
      console.log('Automations Data:', automationsRes?.data)
      console.log('Automations Array:', automationsRes?.data?.data?.automations)

      if (automationsRes.success && automationsRes.data) {
        // Handle double-nested data structure
        const dataWrapper = automationsRes.data.data || automationsRes.data
        const automationsList = dataWrapper.automations || []
        console.log('Setting automations:', automationsList)
        setAutomations(automationsList)
      } else {
        console.warn('Automation response not successful or missing data:', automationsRes)
        setAutomations([])
      }

      if (agentsRes.success && agentsRes.data) {
        setAgents(agentsRes.data.agents || [])
      }

      if (flowsRes.success && flowsRes.data) {
        setFlows(flowsRes.data.flows || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load automations',
        variant: 'destructive',
        duration: 2000  
      })
      setAutomations([])
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to scheduler status updates via SSE
  useEffect(() => {
    let stopStatusStream = false
    let retryTimeout: any

    const startStatusStream = async () => {
      try {
        const response = await apiClient.scheduler.streamStatus()
        await parseSSEStream(response, {
          onEvent: (_, data) => {
            if (stopStatusStream) return
            console.log('📡 Scheduler status update:', data)
            setSchedulerStatus(data)
          },
          onError: (err) => {
            console.error('❌ Status stream error:', err)
          }
        })
      } catch (error) {
        if (!stopStatusStream) {
          console.log('🔄 Status stream disconnected, retrying in 5s...')
          retryTimeout = setTimeout(startStatusStream, 5000)
        }
      }
    }

    startStatusStream()

    return () => {
      stopStatusStream = true
      clearTimeout(retryTimeout)
    }
  }, [])

  // Subscribe to scheduler logs when the logs dialog is open
  useEffect(() => {
    if (!showLogsDialog) return

    let stopLogStream = false
    let retryTimeout: any

    const startLogStream = async () => {
      try {
        const response = await apiClient.scheduler.streamLogs()
        await parseSSEStream(response, {
          onEvent: (_, data) => {
            if (stopLogStream) return
            // data is {line: "..."} or {message: "..."} for errors
            if (data.line) {
              setSchedulerLogs(prev => {
                // Keep only last 200 lines to prevent memory issues
                const newLogs = [...prev, data.line]
                return newLogs.slice(-200)
              })
            }
          },
          onError: (err) => {
            console.error('❌ Log stream error:', err)
          }
        })
      } catch (error) {
        if (!stopLogStream) {
          console.log('🔄 Log stream disconnected, retrying in 5s...')
          retryTimeout = setTimeout(startLogStream, 5000)
        }
      }
    }

    startLogStream()

    return () => {
      stopLogStream = true
      clearTimeout(retryTimeout)
    }
  }, [showLogsDialog])

  const loadSchedulerStatus = async () => {
    try {
      const response = await apiClient.scheduler.getStatus()
      if (response.success && response.data) {
        setSchedulerStatus(response.data)
      }
      return response
    } catch (error) {
      console.error('Failed to load scheduler status:', error)
      return { success: false }
    }
  }

  const handleSchedulerStart = async () => {
    try {
      setSchedulerLoading(true)
      const response = await apiClient.scheduler.start()

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Scheduler started successfully',
          duration: 2000
        })
        await loadSchedulerStatus()
      } else {
        toast({
          title: 'Info',
          description: response.message || 'Scheduler may already be running',
          variant: 'default',
          duration: 2000
        })
        // Refresh status in case it's actually running but UI was out of sync
        await loadSchedulerStatus()
      }
    } catch (error) {
      console.error('Failed to start scheduler:', error)
      toast({
        title: 'Error',
        description: 'Failed to start scheduler',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setSchedulerLoading(false)
    }
  }

  const handleSchedulerStop = async () => {
    try {
      setSchedulerLoading(true)
      const response = await apiClient.scheduler.stop()

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Scheduler stopped successfully',
          duration: 2000
        })
        await loadSchedulerStatus()
      } else {
        toast({
          title: 'Info',
          description: response.message || 'Scheduler may not be running',
          variant: 'default',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Failed to stop scheduler:', error)
      toast({
        title: 'Error',
        description: 'Failed to stop scheduler',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setSchedulerLoading(false)
    }
  }

  const handleSchedulerRestart = async () => {
    try {
      setSchedulerLoading(true)
      const response = await apiClient.scheduler.restart()

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Scheduler restarted successfully',
          duration: 2000
        })
        await loadSchedulerStatus()
      }
    } catch (error) {
      console.error('Failed to restart scheduler:', error)
      toast({
        title: 'Error',
        description: 'Failed to restart scheduler',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setSchedulerLoading(false)
    }
  }

  const handleViewLogs = async () => {
    try {
      // Load initial batch of logs
      const response = await apiClient.scheduler.getLogs(100)

      if (response.success && response.data) {
        setSchedulerLogs(response.data.logs || [])
        setShowLogsDialog(true)
      }
    } catch (error) {
      console.error('Failed to load scheduler logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load scheduler logs',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const openCreateDialog = () => {
    setSelectedAutomation(null)
    setFormData({
      name: '',
      description: '',
      target_type: 'agent',
      agent_id: '',
      flow_id: '',
      schedule_type: 'cron',
      cron_expression: '0 13 * * *',
      timezone: 'UTC',
      interval_seconds: 3600,
      start_date: '',
      end_date: '',
      timeout_seconds: 300,
      input_template: {},
      retry_policy: {},
      notification_config: {},
      tags: [],
      is_enabled: true
    })
    setShowDialog(true)
  }

  const openEditDialog = (automation: any) => {
    setSelectedAutomation(automation)
    setFormData({
      name: automation.name,
      description: automation.description || '',
      target_type: automation.target_type,
      agent_id: automation.agent_id || '',
      flow_id: automation.flow_id || '',
      schedule_type: automation.schedule_type,
      cron_expression: automation.cron_expression || '0 13 * * *',
      timezone: automation.timezone || 'UTC',
      interval_seconds: automation.interval_seconds || 3600,
      start_date: automation.start_date || '',
      end_date: automation.end_date || '',
      timeout_seconds: automation.timeout_seconds || 300,
      input_template: automation.input_template || {},
      retry_policy: automation.retry_policy || {},
      notification_config: automation.notification_config || {},
      tags: automation.tags || [],
      is_enabled: automation.is_enabled
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      const data: any = {
        ...formData,
        [formData.target_type === 'agent' ? 'agent_id' : 'flow_id']:
          formData.target_type === 'agent' ? formData.agent_id : formData.flow_id
      }

      if (selectedAutomation) {
        // Update
        const response = await apiClient.automations.update(selectedAutomation.automation_id, data)
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Automation updated successfully',
            duration: 2000
          })
          setShowDialog(false)
          loadData()
        }
      } else {
        // Create
        const response = await apiClient.automations.create(data)
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Automation created successfully',
            duration: 2000
          })
          setShowDialog(false)
          loadData()
        }
      }
    } catch (error) {
      console.error('Failed to save automation:', error)
      toast({
        title: 'Error',
        description: 'Failed to save automation',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleDelete = async (automationId: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return

    try {
      const response = await apiClient.automations.delete(automationId)
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Automation deleted successfully',
          duration: 2000
        })
        loadData()
      }
    } catch (error) {
      console.error('Failed to delete automation:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete automation',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleTogglePause = async (automation: any) => {
    try {
      const response = automation.is_paused
        ? await apiClient.automations.resume(automation.automation_id)
        : await apiClient.automations.pause(automation.automation_id)

      if (response.success) {
        toast({
          title: 'Success',
          description: automation.is_paused ? 'Automation resumed' : 'Automation paused',
          duration: 2000
        })
        loadData()
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error)
      toast({
        title: 'Error',
        description: 'Failed to update automation',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleTrigger = async (automationId: string) => {
    try {
      const response = await apiClient.automations.trigger(automationId)
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Automation triggered successfully',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Failed to trigger automation:', error)
      toast({
        title: 'Error',
        description: 'Failed to trigger automation',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const viewExecutions = async (automation: any) => {
    try {
      const [executionsRes, statsRes] = await Promise.all([
        apiClient.automations.getExecutions(automation.automation_id),
        apiClient.automations.getStats(automation.automation_id)
      ])

      if (executionsRes.success) {
        setExecutions(executionsRes.data.executions || [])
      }

      if (statsRes.success) {
        setStats(statsRes.data)
      }

      setSelectedAutomation(automation)
      setShowExecutionsDialog(true)
    } catch (error) {
      console.error('Failed to load executions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load execution history',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const getStatusBadge = (automation: any) => {
    if (!automation.is_enabled) {
      return <Badge variant="outline" className="bg-gray-100">Disabled</Badge>
    }
    if (automation.is_paused) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Paused</Badge>
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
  }

  const formatSchedule = (automation: any) => {
    if (automation.schedule_type === 'cron') {
      return `Cron: ${automation.cron_expression} (${automation.timezone})`
    } else if (automation.schedule_type === 'interval') {
      const hours = Math.floor(automation.interval_seconds / 3600)
      const minutes = Math.floor((automation.interval_seconds % 3600) / 60)
      return `Every ${hours}h ${minutes}m`
    } else {
      return 'One-time'
    }
  }

  useEffect(() => {
    console.log('Automations state updated:', automations.length, automations)
  }, [automations])

  // No full-page loading - render shell immediately

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F7] dark:bg-[#0d1117]">      <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Automations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Schedule agents and flows to run automatically
            </p>
          </div>
          <Button onClick={() => navigate('/automations/create')} className="flex items-center gap-2 bg-[#105e6e] hover:bg-[#0d4d59] text-white">
            <Plus className="h-4 w-4" />
            Create Automation
          </Button>
        </div>

        {/* Scheduler Status Card */}
        <Card className="dark:bg-[#1c2128] dark:border-slate-800 shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold dark:text-white">Scheduler Service</h2>
                </div>
                {schedulerStatus ? (
                  <>
                    {schedulerStatus.running ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Running (PID: {schedulerStatus.pid})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                        <div className="w-2 h-2 bg-gray-600 rounded-full mr-2"></div>
                        Stopped
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                    <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                    Loading...
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {schedulerStatus?.running ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSchedulerRestart}
                      disabled={schedulerLoading}
                      className="flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {schedulerLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Restart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSchedulerStop}
                      disabled={schedulerLoading}
                      className="flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <Pause className="h-4 w-4" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSchedulerStart}
                    disabled={schedulerLoading}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {schedulerLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewLogs}
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Clock className="h-4 w-4" />
                  View Logs
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadSchedulerStatus}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {schedulerStatus && schedulerStatus.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                {schedulerStatus.message}
              </p>
            )}

            {schedulerStatus && schedulerStatus.timestamp && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Last updated: {new Date(schedulerStatus.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </Card>

        {/* Automations List */}
        <Card className="dark:bg-[#1c2128] dark:border-slate-800 shadow-sm">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-slate-800">
              <TableRow className="dark:border-slate-800 hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="dark:text-white">Name</TableHead>
                <TableHead className="dark:text-white">Type</TableHead>
                <TableHead className="dark:text-white">Schedule</TableHead>
                <TableHead className="dark:text-white">Status</TableHead>
                <TableHead className="dark:text-white">Last Run</TableHead>
                <TableHead className="dark:text-white">Success Rate</TableHead>
                <TableHead className="text-right dark:text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading automations...</p>
                  </TableCell>
                </TableRow>
              ) : automations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-12">
                    No automations yet. Create your first automation to get started.
                  </TableCell>
                </TableRow>
              ) : (
                automations.map((automation) => (
                  <TableRow key={automation.automation_id} className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="font-medium dark:text-white">{automation.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="dark:border-[#3d4555] dark:text-gray-300">
                        {automation.target_type === 'agent' ? 'Agent' : 'Flow'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {formatSchedule(automation)}
                    </TableCell>
                    <TableCell>{getStatusBadge(automation)}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {automation.last_run_at
                        ? new Date(automation.last_run_at).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-sm dark:text-gray-300">
                      {automation.total_runs > 0
                        ? `${Math.round((automation.successful_runs / automation.total_runs) * 100)}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewExecutions(automation)}
                          className="dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTrigger(automation.automation_id)}
                          className="dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePause(automation)}
                          className="dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                        >
                          {automation.is_paused ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Pause className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(automation)}
                          className="dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(automation.automation_id)}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#1c2128] dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>
              {selectedAutomation ? 'Edit Automation' : 'Create Automation'}
            </DialogTitle>
            <DialogDescription>
              Configure scheduled execution for an agent or flow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <Label className="dark:text-white">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label className="dark:text-white">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this automation does..."
                rows={2}
                className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
            </div>

            {/* Target Selection */}
            <div>
              <Label className="dark:text-white">Target Type *</Label>
              <Select
                value={formData.target_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, target_type: value })
                }
              >
                <SelectTrigger className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="flow">Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.target_type === 'agent' ? (
              <div>
                <Label className="dark:text-white">Agent *</Label>
                <Select
                  value={formData.agent_id}
                  onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                >
                  <SelectTrigger className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="dark:text-white">Flow *</Label>
                <Select
                  value={formData.flow_id}
                  onValueChange={(value) => setFormData({ ...formData, flow_id: value })}
                >
                  <SelectTrigger className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]">
                    <SelectValue placeholder="Select a flow" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                    {flows.map((flow) => (
                      <SelectItem key={flow.flow_id} value={flow.flow_id}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Schedule Configuration */}
            <div>
              <Label className="dark:text-white">Schedule Type *</Label>
              <Select
                value={formData.schedule_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, schedule_type: value })
                }
              >
                <SelectTrigger className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                  <SelectItem value="cron">Cron Expression</SelectItem>
                  <SelectItem value="interval">Fixed Interval</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.schedule_type === 'cron' && (
              <>
                <div>
                  <Label className="dark:text-white">Cron Expression *</Label>
                  <Input
                    value={formData.cron_expression}
                    onChange={(e) =>
                      setFormData({ ...formData, cron_expression: e.target.value })
                    }
                    placeholder="0 13 * * *"
                    className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Example: "0 13 * * *" = Daily at 1 PM
                  </p>
                </div>

                <div>
                  <Label className="dark:text-white">Timezone *</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formData.schedule_type === 'interval' && (
              <div>
                <Label className="dark:text-white">Interval (seconds) *</Label>
                <Input
                  type="number"
                  value={formData.interval_seconds}
                  onChange={(e) =>
                    setFormData({ ...formData, interval_seconds: parseInt(e.target.value) })
                  }
                  className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  3600 = 1 hour, 86400 = 1 day
                </p>
              </div>
            )}

            {/* Date Range (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-white">Start Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  When to start executing this automation
                </p>
              </div>

              <div>
                <Label className="dark:text-white">End Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  When to stop executing this automation
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="dark:text-white">Tags (Optional)</Label>
              <Input
                value={formData.tags.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean)
                  })
                }
                placeholder="production, critical, daily-report"
                className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Comma-separated tags for organization
              </p>
            </div>

            {/* Advanced Configuration - Retry Policy */}
            <div>
              <Label className="dark:text-white">Retry Policy (Optional - JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.retry_policy, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : {}
                    setFormData({ ...formData, retry_policy: parsed })
                  } catch (err) {
                    // Invalid JSON, just update the string value
                    // User will see error when they try to save
                  }
                }}
                placeholder='{"max_retries": 3, "retry_delay_seconds": 60}'
                rows={3}
                className="font-mono text-sm dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JSON object for retry configuration (e.g., max_retries, retry_delay_seconds)
              </p>
            </div>

            {/* Notification Configuration */}
            <div>
              <Label className="dark:text-white">Notification Config (Optional - JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.notification_config, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : {}
                    setFormData({ ...formData, notification_config: parsed })
                  } catch (err) {
                    // Invalid JSON, just update the string value
                  }
                }}
                placeholder='{"email": "admin@example.com", "on_failure": true}'
                rows={3}
                className="font-mono text-sm dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JSON object for notification settings (e.g., email, webhooks, on_failure)
              </p>
            </div>

            {/* Input Template */}
            <div>
              <Label className="dark:text-white">Input Template (Optional - JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.input_template, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : {}
                    setFormData({ ...formData, input_template: parsed })
                  } catch (err) {
                    // Invalid JSON
                  }
                }}
                placeholder='{"param1": "value1", "param2": "value2"}'
                rows={3}
                className="font-mono text-sm dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JSON object with input parameters to pass to the agent or flow
              </p>
            </div>

            <div>
              <Label className="dark:text-white">Timeout (seconds)</Label>
              <Input
                type="number"
                value={formData.timeout_seconds}
                onChange={(e) =>
                  setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })
                }
                className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="dark:text-white">Enable Immediately</Label>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_enabled: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedAutomation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Executions Dialog */}
      <Dialog open={showExecutionsDialog} onOpenChange={setShowExecutionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#1c2128] dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Execution History</DialogTitle>
            <DialogDescription>
              {selectedAutomation?.name}
            </DialogDescription>
          </DialogHeader>

          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <Card className="p-4 dark:bg-[#2d3545] dark:border-[#3d4555]">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Runs</div>
                <div className="text-2xl font-bold dark:text-white">{stats.data.total_runs}</div>
              </Card>
              <Card className="p-4 dark:bg-[#2d3545] dark:border-[#3d4555]">
                <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.data.successful_runs}
                </div>
              </Card>
              <Card className="p-4 dark:bg-[#2d3545] dark:border-[#3d4555]">
                <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                <div className="text-2xl font-bold text-red-600">{stats.data.failed_runs}</div>
              </Card>
              <Card className="p-4 dark:bg-[#2d3545] dark:border-[#3d4555]">
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                <div className="text-2xl font-bold dark:text-white">
                  {Math.round(stats.data.success_rate * 100)}%
                </div>
              </Card>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="dark:text-white">Status</TableHead>
                <TableHead className="dark:text-white">Started</TableHead>
                <TableHead className="dark:text-white">Duration</TableHead>
                <TableHead className="dark:text-white">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No executions yet
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution) => (
                  <TableRow key={execution.execution_id}>
                    <TableCell>
                      {execution.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {execution.status === 'failed' && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                      {execution.status === 'running' && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Running
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(execution.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {execution.duration_ms
                        ? `${(execution.duration_ms / 1000).toFixed(1)}s`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-red-600">
                      {execution.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Scheduler Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#1c2128] dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Scheduler Logs</DialogTitle>
            <DialogDescription>
              Recent scheduler activity (last 100 lines)
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-900 dark:bg-[#0d1117] rounded-md p-4 max-h-[500px] overflow-y-auto font-mono text-xs dark:border dark:border-slate-800">
            {schedulerLogs.length === 0 ? (
              <p className="text-gray-400">No logs available</p>
            ) : (
              <div className="space-y-1">
                {schedulerLogs.map((log, index) => (
                  <div key={index} className="text-green-400">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
