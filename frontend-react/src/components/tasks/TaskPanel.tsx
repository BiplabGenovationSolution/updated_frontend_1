'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { TaskCard } from './TaskCard';
import { X as IconX } from 'lucide-react';

export function TaskPanel() {
  const {
    isTaskPanelOpen,
    setTaskPanelOpen,
    tasks,
    fetchTasks,
    activeCount,
    isLoading
  } = useTaskStore();

  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');

  // Fetch tasks when panel opens
  useEffect(() => {
    if (isTaskPanelOpen) {
      fetchTasks();
    }
  }, [isTaskPanelOpen, fetchTasks]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTaskPanelOpen) {
        setTaskPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isTaskPanelOpen, setTaskPanelOpen]);

  if (!isTaskPanelOpen) return null;

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'running') return task.status === 'running' || task.status === 'queued';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'failed') return task.status === 'failed';
    return true;
  });

  // Clear completed tasks
  const handleClearCompleted = async () => {
    if (!confirm('Delete all completed tasks?')) return;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    await Promise.all(completedTasks.map(t => useTaskStore.getState().deleteTask(t.id)));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[90]"
        onClick={() => setTaskPanelOpen(false)}
      />

      {/* Panel */}
      <div className="fixed top-16 right-4 w-[400px] max-h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[100] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Background Tasks
          </h2>
          <button
            onClick={() => setTaskPanelOpen(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            aria-label="Close"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap ${filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('running')}
            className={`flex-1 px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap ${filter === 'running'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
          >
            Running ({activeCount()})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap ${filter === 'completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`flex-1 px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap ${filter === 'failed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
          >
            Failed
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {/* Navigate to full tasks page */ }}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All Tasks →
          </button>
          <button
            onClick={handleClearCompleted}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Clear Completed
          </button>
        </div>
      </div>
    </>
  );
}
