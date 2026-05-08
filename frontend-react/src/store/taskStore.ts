import { create } from 'zustand';

export interface TaskProgress {
  percentage: number;
  current_stage: string;
  estimated_remaining_seconds?: number;
  stages_completed: number;
  total_stages?: number;
}

export interface Task {
  id: string;
  user_id: string;
  organization_id?: string;
  type: 'research' | 'analysis' | 'automation' | 'data_processing';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  config: {
    query?: string;
    tool?: string;
    subtool?: string;
    [key: string]: any;
  };
  chat_id?: string;
  progress: TaskProgress;
  result?: {
    message_id?: string;
    data?: Record<string, any>;
    error?: string;
    error_details?: Record<string, any>;
  };
  workflow_id?: string;
  run_id?: string;
  created_at: string;
  queued_at?: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  metadata: Record<string, any>;
}

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  isTaskPanelOpen: boolean;
  lastFetch: number;

  // Computed
  activeTasks: () => Task[];
  completedTasks: () => Task[];
  failedTasks: () => Task[];
  activeCount: () => number;

  // Actions
  fetchTasks: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string, reason?: string) => Promise<void>;
  toggleTaskPanel: () => void;
  setTaskPanelOpen: (open: boolean) => void;

  // Real-time update
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

// Helper function to get the correct backend API URL
function getApiUrl(): string {
  // 1. Priority: If the Env variable exists, return it immediately.
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Secondary: If in the browser, construct URL dynamically based on current host
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;

    // Determine backend port based on frontend port
    let backendPort = '3002'; // default prod port
    if (currentPort === '3004') backendPort = '3005'; // dev mode
    else if (currentPort === '3006') backendPort = '3007'; // staging mode

    return `${window.location.protocol}//${currentHost}:${backendPort}`;
  }

  // 3. Fallback: If not in browser and no Env var (e.g. SSR edge case)
  return 'http://localhost:3005';
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  isTaskPanelOpen: false,
  lastFetch: 0,

  // Computed getters
  activeTasks: () => {
    return get().tasks.filter(t =>
      t.status === 'running' || t.status === 'queued'
    );
  },

  completedTasks: () => {
    return get().tasks.filter(t => t.status === 'completed');
  },

  failedTasks: () => {
    return get().tasks.filter(t => t.status === 'failed');
  },

  activeCount: () => {
    return get().activeTasks().length;
  },

  // Fetch tasks from API
  fetchTasks: async () => {
    // Don't fetch if recently fetched (< 3 seconds ago)
    const now = Date.now();
    if (now - get().lastFetch < 3000) {
      return;
    }

    set({ isLoading: true });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.17:3005';

      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('mentis_auth_token') : null;

      if (!token) {
        // console.warn('⚠️ [TaskStore] No auth token found - user not logged in');
        set({ isLoading: false, tasks: [] });
        return;
      }

      const response = await fetch(`${apiUrl}/api/v1/tasks/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // console.log('📋 [TaskStore] Response status:', response.status);
      // console.log('📋 [TaskStore] Response headers:', {
      //   contentType: response.headers.get('content-type'),
      //   contentLength: response.headers.get('content-length')
      // });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      // Clone the response to read it twice for debugging
      // const responseClone = response.clone();
      // const rawText = await responseClone.text();
      // console.log('📋 [TaskStore] Raw response text (first 500 chars):', rawText.substring(0, 500));

      const data = await response.json();
      // console.log('📋 [TaskStore] Parsed JSON:', data);
      // console.log('📋 [TaskStore] Tasks array:', data?.tasks);

      set({
        tasks: data.tasks || [],
        lastFetch: now,
        isLoading: false
      });
    } catch (error) {
      // console.error('❌ [TaskStore] Failed to fetch tasks:', error);
      set({ isLoading: false });
    }
  },

  // Delete task
  deleteTask: async (taskId: string) => {
    try {
      const apiUrl = getApiUrl();

      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('mentis_auth_token') : null;

      if (!token) {
        // console.warn('⚠️ [TaskStore] No auth token found - cannot delete task');
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${apiUrl}/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Remove from local state
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  },

  // Cancel task
  cancelTask: async (taskId: string, reason?: string) => {
    try {
      const apiUrl = getApiUrl();

      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('mentis_auth_token') : null;

      if (!token) {
        // console.warn('⚠️ [TaskStore] No auth token found - cannot cancel task');
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${apiUrl}/api/v1/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason || 'User cancelled' })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel task');
      }

      const data = await response.json();

      // Update local state
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? data.task : t
        )
      }));
    } catch (error) {
      // console.error('Failed to cancel task:', error);
      throw error;
    }
  },

  // Toggle panel
  toggleTaskPanel: () => {
    set(state => ({ isTaskPanelOpen: !state.isTaskPanelOpen }));
  },

  setTaskPanelOpen: (open: boolean) => {
    set({ isTaskPanelOpen: open });
  },

  // Update task (for real-time updates)
  updateTask: (taskId: string, updates: Partial<Task>) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      )
    }));
  }
}));

// Auto-fetch tasks every 5 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useTaskStore.getState();
    // Always fetch to pick up new tasks
    store.fetchTasks();
  }, 5000);
}
