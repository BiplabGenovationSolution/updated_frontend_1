
// frontend/src/components/chat/shared/MessageList.tsx



import { useRef, useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ChatMessage } from '../ChatMessage'
import { StreamingMessage } from '../StreamingMessage'
import type { Message, AgentType } from '@/lib/types'
import { MarkdownContent } from '@/components/markdown/MarkdownContent'
import { cn } from '@/lib/utils'

import Avatar from 'boring-avatars'
import { useChatContext } from '@/context/chat-context'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeProvider'


interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  chatId: string | null
  agentType: AgentType
  agentDisplayName?: string
  onViewSources?: (messageContent: string, messageId: string) => void
  onViewExecution?: (messageId: string) => void
  onViewResearch?: (sources: any[], knowledgeBaseName: string) => void
  children?: React.ReactNode // For rendering suggestion cards or other content
  isReadOnly?: boolean
  customEmptyState?: React.ReactNode
  emptyStateInput?: React.ReactNode
  agentDescription?: string
  topChildren?: React.ReactNode
}


export function MessageList({ messages, isLoading, chatId, agentType, onViewSources, onViewExecution, onViewResearch, children, isReadOnly, customEmptyState, emptyStateInput, agentDescription, topChildren }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingMessageRef = useRef<HTMLDivElement>(null)  // ✅ Add ref for streaming message
  const { isStreaming, streamingContent, streamingStage, streamingProgress, isProcessing, streamingVisualizations, streamMessages, sendMessage,
    wasInterrupted, interruptedPrompt, partialResponse, clearInterrupted
  } = useChatContext()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDarkTheme = theme === 'dark'






  // Smart auto-scroll: 
  // 1. Always scroll to bottom when streaming STARTS (first chunk)
  // 2. After that, only scroll if user is near bottom
  // This ensures response is visible from start, but allows scrolling up

  useEffect(() => {
    if (!scrollContainerRef.current || (!isStreaming && !isProcessing)) return;

    const container = scrollContainerRef.current;

    setTimeout(() => {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      });
    }, 0);
  }, [isStreaming, isProcessing]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    if (!scrollContainerRef.current || messages.length === 0) return;

    const container = scrollContainerRef.current;

    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      });
    }, 100); // Small delay to ensure DOM has updated
  }, [messages.length]); // Trigger when message count changes


  // useEffect(() => {
  //   if (messagesEndRef.current && scrollContainerRef.current) {
  //     const container = scrollContainerRef.current
  //     const scrollHeight = container.scrollHeight
  //     const scrollTop = container.scrollTop
  //     const clientHeight = container.clientHeight


  //     // Check if streaming just started (transition from false to true)
  //     const streamingJustStarted = isStreaming && !prevStreamingRef.current


  //     // Check if user is near bottom (within 100px)
  //     const isNearBottom = scrollHeight - scrollTop - clientHeight < 100


  //     // Force scroll when streaming starts OR if user is near bottom
  //     if (streamingJustStarted) {
  //       // ✅ Scroll streaming message to top when it first appears
  //       if (streamingMessageRef.current) {
  //         streamingMessageRef.current.scrollIntoView({
  //           behavior: 'smooth',
  //           block: 'start'
  //         })
  //       }
  //     } else if (isStreaming || isNearBottom) {
  //       // Continue scrolling to bottom DURING STREAMING or if user is already near bottom
  //       messagesEndRef.current.scrollIntoView({
  //         behavior: 'auto',
  //         block: 'end'
  //       })
  //     }


  // Update previous streaming state
  //   prevStreamingRef.current = isStreaming
  // }
  //   }, [messages, streamingContent, isStreaming])



  if (isLoading && chatId) {
    return (
      <div className="flex items-center justify-center h-full py-12 bg-[var(--app-bg,#EEF2F7)] dark:bg-slate-900">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <Avatar
              size={32}
              name="Loading"
              variant="marble"
              colors={['#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6']}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading messages...</p>
        </div>
      </div>
    )
  }


  // Get time-based greeting with emoji
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' }
    if (hour < 18) return { text: 'Good afternoon', emoji: '👋' }
    return { text: 'Good evening', emoji: '🌙' }
  }


  // Check if chat is empty (no messages and not processing)
  const isEmpty = messages.length === 0 && !isProcessing && !isStreaming
  const greeting = getGreeting()
  const userName = user?.display_name || user?.email?.split('@')[0] || 'there'



  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117] scrollbar-minimal"
      style={{
        scrollBehavior: 'smooth'
      }}
    >
      <div className={cn(
        "px-4 w-full max-w-4xl mx-auto flex flex-col",
        isEmpty
          ? (topChildren ? "min-h-full justify-between pt-8 pb-10" : "min-h-full justify-center pt-20 pb-10")
          : "py-6 space-y-6"
      )}>
        {/* Render top children (e.g., initial insights for Analytica) */}
        {topChildren}

        {/* ChatGPT-like greeting when empty */}
        {isEmpty && (
          customEmptyState ? (
            customEmptyState
          ) : emptyStateInput ? (
            <div className="flex flex-col items-center justify-center w-full text-center px-4 animate-in fade-in duration-500">
              <h1 className="text-2xl font-medium text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
                Where should we begin?
              </h1>
              {agentDescription && (
                <p
                  className="text-[14px] font-medium mb-2 max-w-lg text-center leading-relaxed"
                  style={{ color: '#29a3a3', fontFamily: "'Roboto', sans-serif" }}
                >
                  {agentDescription}
                </p>
              )}
              <div className="w-full max-w-2xl mt-2 relative z-10 text-left">
                {emptyStateInput}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                {greeting.emoji} {greeting.text}, {userName}
              </h1>
              <p className="text-md text-slate-600 dark:text-slate-400">
                What can I help you with today?
              </p>
            </div>
          )
        )}


        {/* Filter out messages that are currently streaming to avoid duplication */}
        {messages
          .filter((message: any) => !message.isStreaming)
          .map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              chatId={chatId || ''}
              chatAgentType={agentType}
              onViewSources={onViewSources}
              onViewExecution={onViewExecution}
              onViewResearch={onViewResearch}
              sendMessage={isReadOnly ? undefined : sendMessage}
            />
          ))}


        {/* Show streaming message when processing OR streaming */}
        {/* isProcessing = true immediately after sending message (shows "thinking") */}
        {/* isStreaming = true when backend starts streaming (shows content) */}
        {(isProcessing || isStreaming) && (
          <div ref={streamingMessageRef}>
            <StreamingMessage
              agentType={agentType}
              content={streamingContent}
              stage={streamingStage}
              progress={streamingProgress}
              isStreaming={isStreaming || isProcessing}
              visualizations={streamingVisualizations}
              events={streamMessages}
            />
          </div>
        )}

        {/* --- Generation Interrupted Banner (in message area) --- */}
        {wasInterrupted && !isStreaming && !isProcessing && (
          <div className="flex flex-col items-start w-full gap-1 mb-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
            {/* Header matching standard AI message */}
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                {agentType.charAt(0).toUpperCase() + agentType.slice(1)} • Interrupted
              </span>
            </div>

            {/* Bubble matching standard AI message */}
            <div className="flex flex-col gap-3 bg-white dark:bg-[#1c2128] text-slate-800 dark:text-slate-200 rounded-[10px] rounded-tl-sm text-left max-w-[85%] px-5 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
              {/* Title row */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/60">
                  <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Response stopped
                </p>
              </div>

              {/* Partial response — rendered as markdown */}
              {partialResponse && (
                <div className="w-full markdown-content">
                  <MarkdownContent content={partialResponse} isDarkTheme={isDarkTheme} />
                </div>
              )}

              {/* Retry button */}
              <div>
                <button
                  onClick={() => {
                    if (interruptedPrompt && chatId) {
                      clearInterrupted?.()
                      sendMessage(interruptedPrompt, chatId)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Render children (e.g., suggestion cards) */}
        {children}


        {/* Invisible anchor for auto-scroll */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  )
}
//               chatId={chatId || ''}
//               chatAgentType={agentType}
//               onViewSources={onViewSources}
//               onViewExecution={onViewExecution}
//               onViewResearch={onViewResearch}
//             />
//           ))}

//         {/* Show streaming message when processing OR streaming */}
//         {/* isProcessing = true immediately after sending message (shows "thinking") */}
//         {/* isStreaming = true when backend starts streaming (shows content) */}
//         {(isProcessing || isStreaming) && (
//           <div >
//             <StreamingMessage
//               agentType={agentType}
//               content={streamingContent}
//               stage={streamingStage}
//               progress={streamingProgress}
//               isStreaming={isStreaming || isProcessing}
//             />
//           </div>
//         )}

//         {/* Render children (e.g., suggestion cards) */}
//         {children}

//         {/* Invisible anchor for auto-scroll */}
//         <div ref={messagesEndRef} className="h-1" />
//       </div>
//     </div>
//   )
// }
