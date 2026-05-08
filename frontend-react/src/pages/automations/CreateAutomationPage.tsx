import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

export default function CreateAutomationPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [agents, setAgents] = useState<any[]>([])
  const [flows, setFlows] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_type: 'agent' as 'agent' | 'flow',
    agent_id: '',
    flow_id: '',
    schedule_type: 'cron' as 'cron' | 'interval' | 'one_time',
    cron_expression: '0 13 * * *',
    timezone: 'UTC',
    interval_seconds: 3600,
    start_date: '',
    end_date: '',
    timeout_seconds: 300,
    input_template: {} as any,
    retry_policy: {} as any,
    notification_config: {} as any,
    tags: [] as string[],
    is_enabled: true,
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth/login'); return }
    loadAgentsAndFlows()
  }, [user, authLoading, navigate])

  const loadAgentsAndFlows = async () => {
    try {
      const [agentsRes, flowsRes] = await Promise.all([
        apiClient.getCustomAgents({ limit: 100 }),
        apiClient.flows.list(),
      ])
      if (agentsRes.success && agentsRes.data) setAgents(agentsRes.data.agents || [])
      if (flowsRes.success && flowsRes.data) setFlows(flowsRes.data.flows || [])
    } catch (err) {
      console.error('Failed to load agents/flows:', err)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Name is required', variant: 'destructive', duration: 2000 })
      return
    }
    if (formData.target_type === 'agent' && !formData.agent_id) {
      toast({ title: 'Validation Error', description: 'Please select an agent', variant: 'destructive', duration: 2000 })
      return
    }
    if (formData.target_type === 'flow' && !formData.flow_id) {
      toast({ title: 'Validation Error', description: 'Please select a flow', variant: 'destructive', duration: 2000 })
      return
    }

    try {
      setSaving(true)
      const response = await apiClient.automations.create(formData)
      if (response.success) {
        toast({ title: 'Success', description: 'Automation created successfully', duration: 2000 })
        navigate('/automations')
      } else {
        toast({ title: 'Error', description: 'Failed to create automation', variant: 'destructive', duration: 2000 })
      }
    } catch (error) {
      console.error('Failed to create automation:', error)
      toast({ title: 'Error', description: 'Failed to create automation', variant: 'destructive', duration: 2000 })
    } finally {
      setSaving(false)
    }
  }

  const parseJson = (val: string, fallback: any) => {
    try { return val ? JSON.parse(val) : fallback } catch { return fallback }
  }

  return (
    <div className="min-h-full bg-[#EEF2F7] dark:bg-[#0d1117]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Breadcrumbs />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-200">
            Create Automation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure scheduled execution for an agent or flow
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#105e6e] rounded-full inline-block" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Daily Report Automation"
                  className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this automation does..."
                  rows={3}
                  className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Enable Immediately</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Start running this automation right after creation</p>
                </div>
                <Switch
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Target */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#105e6e] rounded-full inline-block" />
              Target
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Target Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value: any) => setFormData({ ...formData, target_type: value, agent_id: '', flow_id: '' })}
                >
                  <SelectTrigger className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1c2128] dark:border-slate-700 dark:text-white">
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="flow">Flow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_type === 'agent' ? (
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Agent <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.agent_id}
                    onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                  >
                    <SelectTrigger className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#1c2128] dark:border-slate-700 dark:text-white">
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Flow <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.flow_id}
                    onValueChange={(value) => setFormData({ ...formData, flow_id: value })}
                  >
                    <SelectTrigger className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select a flow" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#1c2128] dark:border-slate-700 dark:text-white">
                      {flows.map((flow) => (
                        <SelectItem key={flow.flow_id} value={flow.flow_id}>{flow.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>

          {/* Schedule */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#105e6e] rounded-full inline-block" />
              Schedule
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Schedule Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.schedule_type}
                  onValueChange={(value: any) => setFormData({ ...formData, schedule_type: value })}
                >
                  <SelectTrigger className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1c2128] dark:border-slate-700 dark:text-white">
                    <SelectItem value="cron">Cron Expression</SelectItem>
                    <SelectItem value="interval">Fixed Interval</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.schedule_type === 'cron' && (
                <>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Cron Expression <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.cron_expression}
                      onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                      placeholder="0 13 * * *"
                      className="mt-1.5 font-mono bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Example: "0 13 * * *" = Daily at 1 PM</p>
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Timezone <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    >
                      <SelectTrigger className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-[#1c2128] dark:border-slate-700 dark:text-white">
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
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Interval (seconds) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={formData.interval_seconds}
                    onChange={(e) => setFormData({ ...formData, interval_seconds: parseInt(e.target.value) || 3600 })}
                    className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">3600 = 1 hour, 86400 = 1 day</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Start Date (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">End Date (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Advanced */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#105e6e] rounded-full inline-block" />
              Advanced Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Tags (Optional)</Label>
                <Input
                  value={formData.tags.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="production, critical, daily-report"
                  className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Comma-separated tags for organization</p>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={formData.timeout_seconds}
                  onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) || 300 })}
                  className="mt-1.5 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Input Template (Optional — JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.input_template, null, 2)}
                  onChange={(e) => setFormData({ ...formData, input_template: parseJson(e.target.value, formData.input_template) })}
                  placeholder='{"param1": "value1"}'
                  rows={3}
                  className="mt-1.5 font-mono text-sm bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">JSON input parameters to pass to the agent or flow</p>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Retry Policy (Optional — JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.retry_policy, null, 2)}
                  onChange={(e) => setFormData({ ...formData, retry_policy: parseJson(e.target.value, formData.retry_policy) })}
                  placeholder='{"max_retries": 3, "retry_delay_seconds": 60}'
                  rows={3}
                  className="mt-1.5 font-mono text-sm bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Notification Config (Optional — JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.notification_config, null, 2)}
                  onChange={(e) => setFormData({ ...formData, notification_config: parseJson(e.target.value, formData.notification_config) })}
                  placeholder='{"email": "admin@example.com", "on_failure": true}'
                  rows={3}
                  className="mt-1.5 font-mono text-sm bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/automations')}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#105e6e] hover:bg-[#0d4d59] text-white min-w-[130px]"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><Clock className="h-4 w-4 mr-2" />Create Automation</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
