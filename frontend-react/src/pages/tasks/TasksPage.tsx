import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  X,
  RefreshCw,
  FileText
} from 'lucide-react'

interface Task {
  id: string
  type: string
  status: string
  priority: string
  config: {
    query?: string
    research_type?: string
  }
  progress: {
    percentage: number
    current_stage: string
    estimated_remaining_seconds?: number
    stages_completed: number
    total_stages?: number
  }
  result?: {
    message_id?: string
    data?: any
    error?: string
  }
  chat_id?: string
  created_at: string
  started_at?: string
  completed_at?: string
  duration_seconds?: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const navigate = useNavigate()
  const { toast } = useToast()

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get('/api/v1/tasks/')
      if (response.success) {
        setTasks(response.tasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()

    // Auto-refresh every 5 seconds if there are active tasks
    const interval = setInterval(() => {
      const hasActiveTasks = tasks.some(t =>
        t.status === 'queued' || t.status === 'running'
      )
      if (hasActiveTasks) {
        fetchTasks()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [tasks])

  const handleViewResult = (task: Task) => {
    if (task.chat_id && task.result?.message_id) {
      // Modernized agent-aware workspace routing
      navigate(`/agents/sophia?id=${task.chat_id}`)
    }
  }

  const handleCancelTask = async (taskId: string) => {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/cancel`, {
        reason: 'Cancelled by user'
      })
      toast({
        title: 'Task cancelled',
        description: 'The task has been cancelled',
        duration: 2000
      })
      fetchTasks()
    } catch (error) {
      console.error('Failed to cancel task:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel task',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return ''
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return ['queued', 'running'].includes(task.status)
    return task.status === statusFilter
  })

  const activeCount = tasks.filter(t => ['queued', 'running'].includes(t.status)).length
  const completedCount = tasks.filter(t => t.status === 'completed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Background Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor long-running tasks and view results
          </p>
        </div>
        <Button onClick={fetchTasks} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-indigo-600">{activeCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{tasks.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'active', 'completed', 'failed'].map(filter => (
          <Button
            key={filter}
            variant={statusFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(filter)}
            className="capitalize"
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No tasks found
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getStatusColor(task.status)} flex items-center gap-1`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {task.config.research_type || task.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {task.config.query || 'Background Task'}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'completed' && task.result?.message_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewResult(task)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    {['queued', 'running'].includes(task.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelTask(task.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {task.status === 'running' && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {task.progress.current_stage}
                      </span>
                      <span className="font-medium">{task.progress.percentage}%</span>
                    </div>
                    <Progress value={task.progress.percentage} className="h-2" />
                    {task.progress.estimated_remaining_seconds && (
                      <div className="text-xs text-gray-500">
                        ~{Math.ceil(task.progress.estimated_remaining_seconds / 60)} min remaining
                      </div>
                    )}
                  </div>
                )}

                {task.status === 'failed' && task.result?.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-200">{task.result.error}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Created: {new Date(task.created_at).toLocaleString()}</span>
                  {task.duration_seconds && (
                    <span>Duration: {Math.ceil(task.duration_seconds / 60)}m</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
