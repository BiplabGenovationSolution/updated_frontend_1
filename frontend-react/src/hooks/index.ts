/**
 * Hooks index file
 * Exports all custom hooks for easy importing
 */

// Toast notifications
export { useToast, toast } from './use-toast'

// Authentication
export { useAuth } from './useAuth'

// API utilities
export { useApi } from './useApi'

// Chat functionality
export { useChat } from './useChat'
export { useChatMessages } from './useChatMessages'

// Streaming chat
export { useStreamingResearch } from './useStreamingResearch'
export { useStreamingSophia } from './useStreamingSophia'
export { useStreamingClavis } from './useStreamingClavis'
export { useStreamingAnalytica } from './useStreamingAnalytica'
export { useStreamingCustomAgent } from './useStreamingCustomAgent'

// Data management
export { useKnowledgeBase } from './useKnowledgeBase'
export { useFileUpload } from './useFileUpload'

// Tasks and background operations
export { useTasks, useActiveTasksCount } from './useTasks'
export type { Task } from './useTasks'

// WebSocket connection
export { useWebSocket } from './useWebSocket'
export type { WebSocketStatus } from './useWebSocket'

// Query optimization
export {
  useOptimizedChat,
  useOptimizedMessages,
  useOptimizedChatWithMessages,
  useOptimizedChats,
  useKnowledgeBasesPrefetch,
  useOptimizedChatMutations,
  useGlobalPrefetch,
  useCacheManager,
  useEnhancedPrefetch,
  useBatchOperations,
  useQueryPerformance,
} from './useOptimizedQueries'
