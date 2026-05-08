import { createContext, useContext } from 'react'
import type { AgentType, AegisChatTool, Message } from '@/lib/types'

export interface ChatContextType {
  selectedAgent: AgentType | null
  setSelectedAgent: (agent: AgentType | null) => void
  selectedTool: string
  setSelectedTool: (tool: string) => void
  selectedChatTool: AegisChatTool
  setSelectedChatTool: (tool: AegisChatTool) => void
  selectedSubtool: string
  setSelectedSubtool: (subtool: string) => void
  customAgentId: string | null
  setCustomAgentId: (id: string | null) => void
  customAgentName: string | null
  setCustomAgentName: (name: string | null) => void
  customAgentMetadata: any
  setCustomAgentMetadata: (metadata: any) => void
  selectedKnowledgeBase: string | null
  setSelectedKnowledgeBase: (id: string | null) => void
  selectedKnowledgeBaseName: string | null
  setSelectedKnowledgeBaseName: (name: string | null) => void
  showKnowledgeBaseSelector: boolean
  setShowKnowledgeBaseSelector: (show: boolean) => void
  selectedCodebase: string | null
  setSelectedCodebase: (id: string | null) => void
  selectedCodebaseName: string | null
  setSelectedCodebaseName: (name: string | null) => void
  showCodebaseSelector: boolean
  setShowCodebaseSelector: (show: boolean) => void
  selectedBucket: string | null
  setSelectedBucket: (id: string | null) => void
  selectedBucketName: string | null
  setSelectedBucketName: (name: string | null) => void
  showBucketSelector: boolean
  setShowBucketSelector: (show: boolean) => void
  sendMessage: (content: string, chatId: string | null) => Promise<void>
  uploadFile: (file: File, message: string, chatId: string) => Promise<void>
  stopStream: (chatId: string) => Promise<void>
  isProcessing: boolean
  uploadState: {
    isUploading: boolean
    uploadProgress: number
    fileName: string
  }
  wasInterrupted: boolean
  interruptedPrompt: string
  partialResponse: string
  clearInterrupted: () => void
  setLastPrompt: (prompt: string) => void
  streamMessages: Message[]
  isStreaming: boolean
  streamingContent: string
  streamingStage: string
  streamingProgress: string
  streamingVisualizations: any[]
  rawSSEEvents: Array<{ event: string, data: any }>
  clearStreamMessages: () => void
  resetStreaming: () => void
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
