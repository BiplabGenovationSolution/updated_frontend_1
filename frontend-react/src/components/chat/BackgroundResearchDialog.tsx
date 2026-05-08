/**
 * Background Research Dialog
 * Allows users to choose between running research now (SSE) or in background (Temporal)
 */
'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Zap, Loader2 } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'

interface BackgroundResearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  researchType: 'quick' | 'deep' | 'comprehensive'
  chatId: string | null
  knowledgeBaseId?: string | null
  onRunNow: () => void
  onRunInBackground?: () => Promise<void>
}

export function BackgroundResearchDialog({
  open,
  onOpenChange,
  query,
  researchType,
  chatId,
  knowledgeBaseId,
  onRunNow,
  onRunInBackground
}: BackgroundResearchDialogProps) {
  const [isStartingBackground, setIsStartingBackground] = useState(false)
  const { createTask } = useTasks({ autoFetch: false })
  const navigate = useNavigate()

  const getEstimatedTime = () => {
    switch (researchType) {
      case 'quick':
        return '2-3 minutes'
      case 'deep':
        return '8-12 minutes'
      case 'comprehensive':
        return '15-20 minutes'
      default:
        return '10 minutes'
    }
  }

  const handleRunInBackground = async () => {
    if (!chatId) {
      // Cannot run in background without a chat
      alert('Please create a chat first')
      return
    }

    setIsStartingBackground(true)

    try {
      if (onRunInBackground) {
        await onRunInBackground()
      } else {
        // Default implementation: create task via API
        const task = await createTask({
          type: 'research',
          config: {
            query,
            research_type: researchType,
            knowledge_base_id: knowledgeBaseId
          },
          chat_id: chatId,
          priority: 'normal',
          metadata: {
            source: 'aegis_research_dialog'
          }
        })

        if (task) {
          // Navigate to tasks page
          navigate('/tasks')
        }
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to start background research:', error)
    } finally {
      setIsStartingBackground(false)
    }
  }

  const handleRunNow = () => {
    onRunNow()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start {researchType.charAt(0).toUpperCase() + researchType.slice(1)} Research</DialogTitle>
          <DialogDescription>
            This research will take approximately {getEstimatedTime()}. Choose how you'd like to run it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Query Preview */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Research Query:
            </div>
            <div className="text-sm text-gray-900 dark:text-gray-100 line-clamp-3">
              {query}
            </div>
          </div>

          {/* Research Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {researchType} Research
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ~{getEstimatedTime()}
            </span>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Run Now Option */}
            <button
              onClick={handleRunNow}
              className="flex flex-col p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
                <h3 className="font-semibold text-sm">Run Now</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                Stay on this page and watch the research progress in real-time.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-1">
                    ✓ Real-time progress
                  </li>
                  <li className="flex items-center gap-1">
                    ✓ Immediate results
                  </li>
                  <li className="flex items-center gap-1 text-amber-600">
                    ⚠ Must stay on page
                  </li>
                </ul>
              </div>
            </button>

            {/* Run in Background Option */}
            <button
              onClick={handleRunInBackground}
              disabled={isStartingBackground || !chatId}
              className="flex flex-col p-4 border-2 border-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
                <h3 className="font-semibold text-sm">Run in Background</h3>
                <Badge className="ml-auto bg-indigo-600 text-white text-[10px]">
                  Recommended
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                Navigate away and check back later. You'll be notified when complete.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-1 text-green-600">
                    ✓ Navigate away freely
                  </li>
                  <li className="flex items-center gap-1 text-green-600">
                    ✓ Close browser tab
                  </li>
                  <li className="flex items-center gap-1 text-green-600">
                    ✓ Get notified when done
                  </li>
                </ul>
              </div>
            </button>
          </div>

          {!chatId && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Background research requires a chat to be created first. Please run now for the first message.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStartingBackground}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
