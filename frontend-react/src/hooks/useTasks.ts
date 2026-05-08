/**
 * Custom hook for managing background tasks
 * Provides task list, polling, and completion notifications
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export interface Task {
  id: string
  type: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: string
  config: {
    query?: string
    research_type?: string
    [key: string]: any
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

interface UseTasksOptions {
  /** Enable automatic polling (default: true) */
  poll?: boolean
  /** Polling interval in ms (default: 5000) */
  pollInterval?: number
  /** Show toast notifications for completed tasks (default: true) */
  notifications?: boolean
  /** Filter tasks by status */
  status?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean
}

export function useTasks(options: UseTasksOptions = {}) {
  const {
    poll = true,
    pollInterval = 5000,
    notifications = true,
    status,
    autoFetch = true
  } = options

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Track tasks we've already notified about to avoid duplicate notifications
  const notifiedTasksRef = useRef<Set<string>>(new Set())
  // On the first fetch, we pre-populate the set so we don't toast for historical tasks
  const isInitialFetchRef = useRef(true)

  const fetchTasks = useCallback(async () => {
    try {
      setError(null)
      const response = await apiClient.tasks.list({ status })

      if (response.success && (response.data?.tasks || Array.isArray(response.data))) {
        const tasksList = response.data?.tasks || response.data
        setTasks(tasksList)

        // Check for newly completed tasks and show notifications
        if (notifications) {
          if (isInitialFetchRef.current) {
            // First load: silently mark all existing completed/failed tasks as already seen
            tasksList.forEach((task: Task) => {
              if (task.status === 'completed' || task.status === 'failed') {
                notifiedTasksRef.current.add(task.id)
              }
            })
            isInitialFetchRef.current = false
          } else {
            // Subsequent polls: only notify for newly completed/failed tasks
            tasksList.forEach((task: Task) => {
              if (
                task.status === 'completed' &&
                !notifiedTasksRef.current.has(task.id)
              ) {
                notifiedTasksRef.current.add(task.id)
                toast({
                  title: 'Task Completed',
                  description: task.config.query
                    ? `Research: "${task.config.query.substring(0, 50)}${task.config.query.length > 50 ? '...' : ''}"`
                    : 'Your background task has completed',
                  duration: 2000, 
                })
              } else if (
                task.status === 'failed' &&
                !notifiedTasksRef.current.has(task.id)
              ) {
                notifiedTasksRef.current.add(task.id)
                toast({
                  title: 'Task Failed',
                  description: task.result?.error || 'Background task failed',
                  variant: 'destructive',
                  duration: 2000,
                })
              }
            })
          }
        }
      } else {
        setError(response.error || 'Failed to fetch tasks')
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [status, notifications, toast])

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      setLoading(true)
      fetchTasks()
    }
  }, [autoFetch, fetchTasks])

  // Polling effect
  useEffect(() => {
    if (!poll) return

    // Only poll if there are active tasks
    const hasActiveTasks = tasks.some(
      t => t.status === 'queued' || t.status === 'running'
    )

    if (!hasActiveTasks) return

    const interval = setInterval(() => {
      fetchTasks()
    }, pollInterval)

    return () => clearInterval(interval)
  }, [poll, pollInterval, tasks, fetchTasks])

  const refresh = useCallback(() => {
    setLoading(true)
    return fetchTasks()
  }, [fetchTasks])

  const cancelTask = useCallback(
    async (taskId: string, reason?: string) => {
      try {
        const response = await apiClient.tasks.cancel(taskId, reason)
        if (response.success) {
          toast({
            title: 'Task Cancelled',
            description: 'The task has been cancelled',
            duration: 2000,
          })
          await fetchTasks()
          return true
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to cancel task',
            variant: 'destructive',
            duration: 2000,
          })
          return false
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to cancel task',
          variant: 'destructive',
          duration: 2000,
        })
        return false
      }
    },
    [fetchTasks, toast]
  )

  const createTask = useCallback(
    async (request: {
      type: 'research' | 'analysis' | 'automation'
      config: Record<string, any>
      chat_id?: string
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      metadata?: Record<string, any>
    }) => {
      try {
        const response = await apiClient.tasks.create(request)
        if (response.success) {
          toast({
            title: 'Task Started',
            description: 'Your background task has been started. You can navigate away and check progress later.',
            duration: 2000,
          })
          await fetchTasks()
          return response.data?.task || response.data
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to start task',
            variant: 'destructive',
            duration: 2000,
          })
          return null
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to start task',
          variant: 'destructive',
          duration: 2000,
        })
        return null
      }
    },
    [fetchTasks, toast]
  )

  // Computed values
  const activeTasks = tasks.filter(
    t => t.status === 'queued' || t.status === 'running'
  )
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const failedTasks = tasks.filter(t => t.status === 'failed')

  return {
    tasks,
    activeTasks,
    completedTasks,
    failedTasks,
    loading,
    error,
    refresh,
    cancelTask,
    createTask,
    hasActiveTasks: activeTasks.length > 0
  }
}

/**
 * Hook for getting count of active tasks (for badges/indicators)
 */
export function useActiveTasksCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await apiClient.tasks.list({
          status: undefined, // Get all tasks
          limit: 100
        })
        if (response.success && (response.data?.tasks || Array.isArray(response.data))) {
          const tasksList = response.data?.tasks || response.data
          const activeCount = tasksList.filter(
            (t: Task) => t.status === 'queued' || t.status === 'running'
          ).length
          setCount(activeCount)
        }
      } catch (err) {
        console.error('Failed to fetch active tasks count:', err)
      }
    }

    fetchCount()

    // Poll every 10 seconds for count updates
    const interval = setInterval(fetchCount, 10000)
    return () => clearInterval(interval)
  }, [])

  return count
}
