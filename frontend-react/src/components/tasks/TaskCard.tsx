'use client';

import React, { useState } from 'react';
import type { Task } from '@/store/taskStore';
import {
  Check as IconCheck,
  X as IconX,
  Clock as IconClock,
  Loader2 as IconLoader,
  Pause as IconPause,
  Eye as IconEye,
  Trash2 as IconTrash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '@/store/taskStore';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate();
  const { deleteTask, cancelTask } = useTaskStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Status icon and color
  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <IconLoader className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <IconCheck className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <IconX className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <IconPause className="w-4 h-4 text-gray-600" />;
      case 'queued':
        return <IconClock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get task title
  const getTitle = () => {
    const type = task.type.charAt(0).toUpperCase() + task.type.slice(1);
    const query = task.config.query || task.config.description || 'Untitled';
    return `${type}: ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}`;
  };

  // Handle view task details
  const handleView = () => {
    // Close the panel first
    useTaskStore.getState().setTaskPanelOpen(false);

    if (task.chat_id) {
      const agent = task.config.tool || 'aegis';
      // Modernized agent-aware workspace routing
      navigate(`/agents/${agent}?id=${task.chat_id}`);
    } else {
      navigate(`/tasks/${task.id}`);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      alert('Failed to delete task');
      setIsDeleting(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!confirm('Cancel this task?')) return;

    setIsCancelling(true);
    try {
      await cancelTask(task.id);
    } catch (error) {
      alert('Failed to cancel task');
      setIsCancelling(false);
    }
  };

  const timeString = task.completed_at
    ? `Completed ${formatTimeAgo(task.completed_at)}`
    : task.started_at
      ? `Started ${formatTimeAgo(task.started_at)}`
      : `Created ${formatTimeAgo(task.created_at)}`;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {getStatusIcon()}
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
            {getTitle()}
          </h3>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {task.progress.percentage}%
        </span>
      </div>

      {/* Details */}
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {timeString} • {task.config.tool || 'Agent'}
      </div>

      {/* Progress bar (for running tasks) */}
      {task.status === 'running' && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${task.progress.percentage}%` }}
            />
          </div>
          {task.progress.current_stage && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {task.progress.current_stage}
            </div>
          )}
          {task.progress.estimated_remaining_seconds && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              ~{Math.ceil(task.progress.estimated_remaining_seconds / 60)}m left
            </div>
          )}
        </div>
      )}

      {/* Error message (for failed tasks) */}
      {task.status === 'failed' && task.result?.error && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">
          Error: {task.result.error.slice(0, 100)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleView}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
        >
          <IconEye className="w-3.5 h-3.5" />
          View
        </button>

        {(task.status === 'running' || task.status === 'queued') && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
          >
            <IconX className="w-3.5 h-3.5" />
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}

        {(task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
          >
            <IconTrash className="w-3.5 h-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
