'use client';

import React, { useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { List as IconList, Loader2 as IconLoader } from 'lucide-react';

export function TaskPanelTrigger() {
  const {
    toggleTaskPanel,
    activeCount,
    fetchTasks,
    isLoading
  } = useTaskStore();

  const count = activeCount();

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <button
      onClick={toggleTaskPanel}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      aria-label={`Background Tasks (${count} active)`}
      title={`Background Tasks (${count} active)`}
    >
      {/* Icon */}
      {isLoading ? (
        <IconLoader className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-spin" />
      ) : (
        <IconList className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}

      {/* Badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full z-10">
          {count > 9 ? '9+' : count}
        </span>
      )}

      {/* Pulse animation for active tasks */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full animate-ping opacity-75"></span>
      )}
    </button>
  );
}
