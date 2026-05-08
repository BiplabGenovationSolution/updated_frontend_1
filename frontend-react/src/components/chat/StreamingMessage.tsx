/**
 * StreamingMessage Component
 * Displays a real-time streaming message as it arrives via SSE
 */
'use client'

import { useEffect, useRef } from 'react'

import { Bot, Loader2, TrendingUp, Target, Code, Activity, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AgentType } from '@/lib/types'
import { AGENT_CONFIGS } from '@/lib/constants'
import { MarkdownContent } from '@/components/markdown/MarkdownContent'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/context/chat-context'
import { AnalyticaVisualization } from './AnalyticaVisualization'
import { FlowExecutionSteps } from './shared/FlowExecutionSteps'


const normalizeStreamedText = (value: string): string => {
  if (!value) return value

  return value
    .replace(/\r\n/g, '\n')   // normalize line endings only
    .replace(/\n{3,}/g, '\n\n') // cap excessive blank lines at one blank line
}

interface StreamingMessageProps {
  agentType: AgentType
  content: string
  stage?: string
  progress?: string
  isStreaming: boolean
  visualizations?: any[]  // Analytica visualizations to display when streaming completes
  events?: any[] // Stream events for flow execution tracking
}


import { useTheme } from '@/context/ThemeProvider'

export function StreamingMessage({
  agentType,
  content,
  stage,

  isStreaming,
  visualizations,
  events = []
}: StreamingMessageProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme() // Add theme hook
  const isDarkTheme = theme === 'dark'

  // Handle custom agents - need to get custom agent info from context
  const { customAgentName, customAgentId } = useChatContext()

  // Direct display of streaming content (buffered by ChatContext at 120 chars/sec)
  // Removed local typing effect as it was bottlenecking the speed (20 chars/sec)
  const displayedContent = normalizeStreamedText(content)

  // Get agent config - use custom agent if applicable
  let agentConfig

  // If custom agent, create custom config
  if (agentType === 'custom' && customAgentId) {
    agentConfig = {
      name: customAgentName || 'Custom Agent',
      icon: Bot,
      color: 'purple-600',
      bgColor: 'bg-purple-100',
      gradient: {
        from: '#9333ea',
        to: '#c084fc'
      }
    }
  } else {
    // Use built-in agent config
    agentConfig = AGENT_CONFIGS[agentType as keyof typeof AGENT_CONFIGS]
  }

  // Auto-scroll as content grows
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [displayedContent]) // Changed from 'content' to 'displayedContent'

  // Show thinking indicator only when no content yet
  const isThinking = isStreaming && !content

  // Render flow steps using shared component
  // Note: We pass raw events, the component handles state consolidation

  if (!content && !stage && !isThinking && (!events || events.length === 0)) return null

  return (
    <div className="flex flex-col group relative w-full mb-10">
      {/* Consolidated Message Header (Avatar + Name + Metadata) */}
      <div className={cn(
        "flex items-center gap-3 mb-2.5 px-1 w-full flex-row"
      )}>
        {/* Avatar (Left-aligned always for agent) */}
        <div className="shrink-0">
          {agentType === 'custom' ? (
            <div className="w-[32px] h-[32px] rounded-[8px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0">
              <div className="w-[10px] h-[10px] bg-indigo-500 rounded-full" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-[#1e2329] border border-gray-100 dark:border-gray-800 shadow-sm">
              {agentConfig?.name === 'Sophia' ? (
                <Target className="h-5 w-5 text-indigo-500" />
              ) : agentConfig?.name === 'Clavis' ? (
                <Code className="h-4 w-4 text-[#4ECDC4]" />
              ) : agentConfig?.name === 'Analytica' ? (
                <Activity className="h-4 w-4 text-[#06b6d4]" />
              ) : (
                <Shield className="h-4 w-4 text-indigo-500" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-hidden flex-wrap max-w-full flex-row">
          <span className="font-semibold text-[13px] text-gray-900 dark:text-gray-100 shrink-0">
            {agentConfig.name}
          </span>
          <Badge variant="secondary" className={cn(
            "text-[10px] px-1.5 py-0 border-0 rounded-md uppercase tracking-wider font-bold shrink-0",
            agentType === 'custom'
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
              : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
          )}>
            {agentType === 'custom' ? 'Custom Agent' :
              agentConfig.name === 'Sophia' ? 'Creative AI' :
                agentConfig.name === 'Clavis' ? 'Code Assistant' :
                  agentConfig.name === 'Analytica' ? 'Data AI' : 'Agent'}
          </Badge>
          
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap shrink-0 ml-auto pr-2">
            Just now
          </span>
          
          {isStreaming && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">Streaming...</span>
            </div>
          )}

          {/* Sync contextual badges from ChatMessage if relevant, but for streaming we usually keep it clean */}
        </div>
      </div>

      {/* AI Header Bold Divider */}
      <div className="w-full h-px bg-slate-100 dark:bg-slate-800/60 mb-2" />

      {/* Message Content Bubble (Matches ChatMessage exactly) */}
      <div className="flex flex-col min-w-0 transition-all duration-200 relative items-start w-full max-w-full">
        {/* Content Box (Matches ChatMessage bg-white card) */}
        <div className="bg-white dark:bg-[#1c2128] text-slate-800 dark:text-slate-200 rounded-[10px] rounded-tl-sm text-left max-w-[85%] w-full px-5 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
          {/* Start with Horizontal Flow Steps */}
          <FlowExecutionSteps events={events} />

          {/* Progress/Stage Indicator */}
          {stage && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1 px-1">
              {normalizeStreamedText(stage || '')}
            </div>
          )}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mt-2 px-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {agentConfig.name} is thinking
                <span className="inline-flex ml-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
              </span>
            </div>
          )}

          {/* Streaming Content - Show during AND after streaming (Claude-style) */}
          {displayedContent && displayedContent.trim().length >= 3 && displayedContent.trim() !== '{}' && (
            <div
              ref={contentRef}
              className="w-full markdown-content"
            >
              {/* ✅ INSTANT MARKDOWN: Render markdown immediately during streaming */}
              <MarkdownContent
                content={displayedContent}
                isDarkTheme={isDarkTheme}
              />

              {/* Typing Cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-slate-400 dark:bg-slate-500 animate-pulse rounded-sm" />
              )}
            </div>
          )}

          {/* ANALYTICA VISUALIZATIONS - Show when available */}
          {visualizations && visualizations.length > 0 && agentType === 'analytica' && (
            <div className="mt-6 space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Data Visualizations ({visualizations.length})
                </h3>
              </div>
              {visualizations.map((viz: any, index: number) => (
                <AnalyticaVisualization
                  key={index}
                  visualization={viz}
                  index={index}
                  messageId="streaming"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
