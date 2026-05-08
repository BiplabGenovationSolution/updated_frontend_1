/**
 * Tasks Indicator Widget
 * Shows active tasks count and provides quick access to tasks page
 */
'use client'

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useActiveTasksCount } from '@/hooks/useTasks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function TasksIndicator() {
  const activeCount = useActiveTasksCount()
  const location = useLocation()
  const isTasksPage = location.pathname === '/tasks'

  // Don't show indicator on tasks page itself
  if (isTasksPage) return null

  // Don't show if no active tasks
  if (activeCount === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Loader2 className="h-4 w-4 mr-2 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">{activeCount} Task{activeCount !== 1 ? 's' : ''}</span>
          <Badge
            className="ml-2 bg-indigo-600 text-white"
            variant="default"
          >
            Running
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Background Tasks</h3>
            <Badge variant="outline" className="text-xs">
              {activeCount} active
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You have {activeCount} task{activeCount !== 1 ? 's' : ''} running in the background.
            You can navigate away and check back later.
          </p>
          <Link href="/tasks">
            <Button className="w-full" size="sm">
              View All Tasks
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Compact version for mobile or tight spaces
 */
export function TasksIndicatorCompact() {
  const activeCount = useActiveTasksCount()
  const location = useLocation()
  const isTasksPage = location.pathname === '/tasks'

  if (isTasksPage || activeCount === 0) return null

  return (
    <Link href="/tasks">
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
      >
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </Button>
    </Link>
  )
}

/**
 * Tasks badge for navigation menu items
 */
export function TasksBadge() {
  const activeCount = useActiveTasksCount()

  if (activeCount === 0) return null

  return (
    <Badge className="ml-2 bg-indigo-600 text-white text-xs px-1.5 py-0.5">
      {activeCount}
    </Badge>
  )
}
