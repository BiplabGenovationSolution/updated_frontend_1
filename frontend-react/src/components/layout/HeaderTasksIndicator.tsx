import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { List, X, Loader2, Check, AlertCircle, Eye, Trash2, ArrowRight } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import type { Task } from '@/hooks/useTasks'

export function HeaderTasksIndicator() {
    const [open, setOpen] = useState(false)
    const { tasks, activeTasks, completedTasks, failedTasks, cancelTask } = useTasks({
        poll: true,
        pollInterval: 5000,
        notifications: true
    })

    // Derive counts
    const allCount = tasks.length
    const runningCount = activeTasks.length

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'completed': return <Check className="h-4 w-4 text-green-500 mt-0.5" />
            case 'failed': return <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            case 'running':
            case 'queued': return <Loader2 className="h-4 w-4 text-indigo-500 animate-spin mt-0.5" />
            default: return null
        }
    }

    const formatTaskTime = (task: Task) => {
        if (task.status === 'completed' && task.completed_at) {
            try {
                const date = new Date(task.completed_at)
                const now = new Date()
                const diffMs = now.getTime() - date.getTime()
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                const diffMins = Math.floor(diffMs / (1000 * 60))

                if (diffDays > 0) return `Completed ${diffDays}d ago`
                if (diffHours > 0) return `Completed ${diffHours}h ago`
                if (diffMins > 0) return `Completed ${diffMins}m ago`
                return 'Completed just now'
            } catch (e) {
                return 'Completed'
            }
        }
        if (task.status === 'failed') return 'Failed'
        if (task.status === 'queued') return 'Queued'
        if (task.status === 'running') return 'Running'
        return task.status
    }

    const renderTaskCard = (task: Task) => {
        const title = task.config?.query
            ? `Research: ${task.config.query}`
            : `Agent Background Task - ${task.id.slice(0, 8)}`

        return (
            <div key={task.id} className="mb-3 p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-2 min-w-0 flex-1">
                        {getStatusIcon(task.status)}
                        <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">
                                {title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {formatTaskTime(task)} • Agent
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 shrink-0 whitespace-nowrap">
                        {task.progress?.percentage !== undefined ? `${task.progress.percentage}%` : '0%'}
                    </span>
                </div>

                <div className="flex items-center gap-4 mt-3 pl-6">
                    <Link to={`/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => cancelTask(task.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-7 w-7 bg-slate-100 dark:bg-[#21262d] text-slate-500 dark:text-[#6e7681] hover:bg-slate-200 dark:hover:bg-[#30363d] hover:text-slate-900 dark:hover:text-[#c9d1d9] rounded border border-slate-200 dark:border-[#30363d] transition-colors"
                >
                    <List className="h-3.5 w-3.5" />
                    {runningCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#0d1117]" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[400px] p-0" align="end" sideOffset={8}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                        Background Tasks
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500" onClick={() => setOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <div className="px-4 pt-2 border-b border-slate-100 dark:border-slate-800">
                        <TabsList className="bg-transparent h-auto p-0 gap-6">
                            <TabsTrigger
                                value="all"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none px-0 py-2"
                            >
                                All ({allCount})
                            </TabsTrigger>
                            <TabsTrigger
                                value="running"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none px-0 py-2"
                            >
                                Running ({runningCount})
                            </TabsTrigger>
                            <TabsTrigger
                                value="completed"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none px-0 py-2"
                            >
                                Completed
                            </TabsTrigger>
                            <TabsTrigger
                                value="failed"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none px-0 py-2"
                            >
                                Failed
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="overflow-y-auto max-h-[350px]">
                        <div className="px-4 pb-4 pt-3">
                            <TabsContent value="all" className="m-0 space-y-0">
                                {tasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 pt-10">
                                        <p className="text-sm">No tasks found</p>
                                    </div>
                                ) : (
                                    tasks.map(renderTaskCard)
                                )}
                            </TabsContent>

                            <TabsContent value="running" className="m-0 space-y-0">
                                {activeTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 pt-10">
                                        <p className="text-sm">No running tasks</p>
                                    </div>
                                ) : (
                                    activeTasks.map(renderTaskCard)
                                )}
                            </TabsContent>

                            <TabsContent value="completed" className="m-0 space-y-0">
                                {completedTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 pt-10">
                                        <p className="text-sm">No completed tasks</p>
                                    </div>
                                ) : (
                                    completedTasks.map(renderTaskCard)
                                )}
                            </TabsContent>

                            <TabsContent value="failed" className="m-0 space-y-0">
                                {failedTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 pt-10">
                                        <p className="text-sm">No failed tasks</p>
                                    </div>
                                ) : (
                                    failedTasks.map(renderTaskCard)
                                )}
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>

                <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-md">
                    <Link to="/tasks" onClick={() => setOpen(false)}>
                        <Button variant="link" className="text-indigo-600 dark:text-indigo-400 font-medium px-2">
                            View All Tasks
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100">
                        Clear Completed
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
