'use client'

import { useState, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Send,
  Paperclip,
  Mic,
  MessageSquare,
  Search,
  Brain,
  Heart,
  Zap,
  Code,
  Lightbulb,
  ChevronDown,
  Image,
  FileText,
  Settings,
  BookOpen,
  Calculator,
  Crown,
  Coffee,
  Star,
  Palette,
  X,
  Upload,
  FileSpreadsheet,
  Database,
  File,
  Square
} from 'lucide-react'
import { useChatContext } from '@/context/chat-context'
import { useToast } from '@/hooks/use-toast'
import type { AgentType, AegisChatTool } from '@/lib/types'
import { AGENT_CONFIGS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Avatar from 'boring-avatars'
import { PrivacyBadge } from '@/components/privacy/PrivacyBadge'
import { PrivacyDetailsModal } from '@/components/privacy/PrivacyDetailsModal'

// File upload interface
interface UploadFile {
  file: File
  preview?: string
  id: string
}

interface ChatInputProps {
  onSendMessage: (content: string) => void
  onUploadFile?: (file: File, message: string) => void
  isLoading?: boolean
  onStopStream?: () => void
  placeholder?: string
  // Optional props for backward compatibility
  selectedAgent?: AgentType
  selectedTool?: string
  onToolChange?: (tool: string) => void
  selectedChatTool?: AegisChatTool
  onChatToolChange?: (tool: AegisChatTool) => void
  selectedSubtool?: string
  onSubtoolChange?: (subtool: string) => void
  selectedKnowledgeBase?: string | null
  selectedKnowledgeBaseName?: string | null
  selectedCodebase?: string | null
  selectedCodebaseName?: string | null
  // Quick action suggestions (for Analytica, etc.)
  quickSuggestions?: Array<{ label: string; action: string }>
}

// Personality options
const PERSONALITY_OPTIONS = [
  {
    id: 'wise',
    name: 'Wise',
    description: 'Thoughtful and insightful',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'text-blue-600'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Imaginative and innovative',
    icon: <Palette className="h-4 w-4" />,
    color: 'text-purple-600'
  },
  {
    id: 'analytical',
    name: 'Analytical',
    description: 'Data-driven and logical',
    icon: <Calculator className="h-4 w-4" />,
    color: 'text-green-600'
  },
  {
    id: 'supportive',
    name: 'Supportive',
    description: 'Empathetic and encouraging',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-pink-600'
  },
  {
    id: 'quirky',
    name: 'Quirky',
    description: 'Fun and unconventional',
    icon: <Star className="h-4 w-4" />,
    color: 'text-yellow-600'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal and business-focused',
    icon: <Crown className="h-4 w-4" />,
    color: 'text-indigo-600'
  },
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'Dynamic and enthusiastic',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-orange-600'
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Peaceful and centered',
    icon: <Coffee className="h-4 w-4" />,
    color: 'text-teal-600'
  }
] as const

// Research subtool config
const RESEARCH_SUBTOOL_CONFIG = {
  quick: {
    icon: <Zap className="h-4 w-4" />,
    color: 'text-yellow-600',
    description: 'Fast, focused research with key insights'
  },
  deep: {
    icon: <Brain className="h-4 w-4" />,
    color: 'text-blue-600',
    description: 'Comprehensive deep-dive analysis with detailed reports'
  }
} as const

// Supported file types
const SUPPORTED_FILE_TYPES = {
  'text/csv': {
    icon: <FileSpreadsheet className="h-4 w-4" />,
    name: 'CSV',
    color: 'text-green-600',
    accept: '.csv'
  },
  'application/json': {
    icon: <Code className="h-4 w-4" />,
    name: 'JSON',
    color: 'text-blue-600',
    accept: '.json'
  },
  'text/plain': {
    icon: <FileText className="h-4 w-4" />,
    name: 'Text',
    color: 'text-gray-600',
    accept: '.txt'
  },
  'application/vnd.ms-excel': {
    icon: <FileSpreadsheet className="h-4 w-4" />,
    name: 'Excel',
    color: 'text-green-600',
    accept: '.xls,.xlsx'
  }
} as const

export function ChatInput({
  onSendMessage,
  onUploadFile,
  isLoading = false,
  onStopStream,
  placeholder = "Type your message...",
  // Props for backward compatibility
  selectedAgent: propAgent,
  selectedTool: propTool,
  onToolChange: propOnToolChange,
  selectedChatTool: propChatTool,
  onChatToolChange: propOnChatToolChange,
  selectedSubtool: propSubtool,
  onSubtoolChange: propOnSubtoolChange,
  selectedKnowledgeBaseName: propKnowledgeBaseName,
  selectedCodebaseName: propCodebaseName,
  quickSuggestions
}: ChatInputProps) {
  // Try to get context, fallback to props
  const context = useChatContext()
  const { isStreaming = false, isProcessing = false, stopStream } = context || {}

  // Update isLoading to include isProcessing
  const effectiveIsLoading = isLoading || isProcessing

  // Use context values if available, otherwise use props
  const selectedAgent = context?.selectedAgent || propAgent || 'aegis'
  const selectedTool = context?.selectedTool || propTool || 'chat'
  const onToolChange = context?.setSelectedTool || propOnToolChange
  const selectedChatTool = context?.selectedChatTool || propChatTool || 'professional'
  const onChatToolChange = context?.setSelectedChatTool || propOnChatToolChange
  const selectedSubtool = context?.selectedSubtool || propSubtool || 'quick'
  const onSubtoolChange = context?.setSelectedSubtool || propOnSubtoolChange
  const selectedKnowledgeBaseName = context?.selectedKnowledgeBaseName || propKnowledgeBaseName
  const selectedCodebaseName = context?.selectedCodebaseName || propCodebaseName

  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([])
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Get agent config safely
  const agentConfig = AGENT_CONFIGS[selectedAgent as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.aegis

  const handleStopStream = () => {
    if (onStopStream) {
      onStopStream()
    } else if (stopStream) {
      // Fallback: try to get chatId from URL if onStopStream isn't provided
      const urlParams = new URLSearchParams(window.location.search)
      const chatId = urlParams.get('id')
      if (chatId) {
        stopStream(chatId)
      } else {
        // If we can't find the ID in URL, try to find an active stream session
        const streamChatId = (window as any).__streamingChatId
        if (streamChatId) stopStream(streamChatId)
      }
    }
  }


  const handleSend = () => {
    if (!message.trim() && selectedFiles.length === 0) return
    if (effectiveIsLoading) return

    let messageToSend = message.trim()

    // Add deep research prefix when deep research is selected
    if (selectedAgent === 'aegis' && selectedTool === 'research' && selectedSubtool === 'deep' && messageToSend) {
      messageToSend = `deep comprehensive research: ${messageToSend}`
    }

    // Handle file upload
    if (selectedFiles.length > 0 && onUploadFile) {
      const fileMessage = messageToSend || 'Please analyze this file'
      selectedFiles.forEach(uploadFile => {
        onUploadFile(uploadFile.file, fileMessage)
      })
      setSelectedFiles([])
    } else {
      onSendMessage(messageToSend)
    }

    setMessage('')

    // Defers height reset to ensure React has re-rendered the empty message text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const unsupportedFiles: string[] = []

    files.forEach(file => {
      const fileType = file.type
      if (!SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES]) {
        unsupportedFiles.push(file.name)
        return
      }

      const uploadFile: UploadFile = {
        file,
        id: Math.random().toString(36).substr(2, 9)
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          uploadFile.preview = e.target?.result as string
          setSelectedFiles(prev => [...prev, uploadFile])
        }
        reader.readAsDataURL(file)
      } else {
        setSelectedFiles(prev => [...prev, uploadFile])
      }
    })

    // Show error toast for unsupported files
    if (unsupportedFiles.length > 0) {
      toast({
        title: 'Unsupported File Type',
        description: `The following file${unsupportedFiles.length > 1 ? 's are' : ' is'} not supported: ${unsupportedFiles.join(', ')}. Supported formats: CSV, JSON, TXT, Excel (.xls, .xlsx)`,
        variant: 'destructive',
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const canSend = (message.trim().length > 0 || selectedFiles.length > 0) && !effectiveIsLoading && !isStreaming
  const hasFiles = selectedFiles.length > 0

  // Get personality info
  const getCurrentPersonality = () => {
    return PERSONALITY_OPTIONS.find(p => p.id === selectedChatTool) || PERSONALITY_OPTIONS[0]
  }

  // Get current research subtool config
  const getCurrentSubtoolConfig = () => {
    return RESEARCH_SUBTOOL_CONFIG[selectedSubtool as keyof typeof RESEARCH_SUBTOOL_CONFIG] || RESEARCH_SUBTOOL_CONFIG.quick
  }

  // File upload availability
  const originalCanUploadFiles = selectedAgent === 'aegis' && onUploadFile
  const canUploadFiles = originalCanUploadFiles

  const handleQuickSuggestion = (action: string) => {
    setMessage(action)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto w-full px-4">
        {/* Quick Suggestions */}
        {quickSuggestions && quickSuggestions.length > 0 && !isLoading && !hasFiles && (
          <div className="mb-3 animate-slide-up">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSuggestion(suggestion.action)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* File Preview Section */}
        {hasFiles && (
          <div className="mb-4 animate-slide-up">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready for analysis
                </span>
              </div>

              <div className="space-y-2">
                {selectedFiles.map(uploadFile => {
                  const fileType = SUPPORTED_FILE_TYPES[uploadFile.file.type as keyof typeof SUPPORTED_FILE_TYPES]
                  return (
                    <div key={uploadFile.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-200">
                      <div className={cn("flex-shrink-0", fileType?.color || "text-gray-600")}>
                        {fileType?.icon || <File className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {fileType?.name || 'Unknown'} • {(uploadFile.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-red-600"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <Alert className="mt-3 border-blue-200 bg-blue-50">
                <Database className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Aegis will analyze your {selectedFiles.length > 1 ? 'files' : 'file'} and create visualizations.
                  {!message.trim() && " Add a message to specify what kind of analysis you want."}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Main Input Container */}
        <div className={cn(
          "bg-white dark:bg-[#1a1f1e] rounded-2xl overflow-hidden transition-all duration-300 ease-out border border-gray-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          isFocused && "ring-1 ring-blue-500/20 dark:ring-blue-500/20 border-blue-200 dark:border-blue-500/40 shadow-[0_8px_30px_rgb(0,0,0,0.15)]",
          hasFiles && "border-blue-300/60 dark:border-[#58a6ff]/60"
        )}>

          {/* Text Input Area */}
          <div className="relative px-2 pt-2 pb-1">
            {/* Animated Dots placed physically inside the left side where user sends their message */}
            {(effectiveIsLoading || isStreaming) && !message && (
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex space-x-1.5 pointer-events-none">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={(effectiveIsLoading || isStreaming) ? "" : (hasFiles ? "Describe the analysis you want..." : placeholder)}
              disabled={effectiveIsLoading || isStreaming}
              className={cn(
                "max-h-[160px] resize-none border-0 bg-transparent focus:ring-0 text-[15px] px-4 py-2 placeholder:text-gray-400 text-gray-900 dark:text-white leading-relaxed transition-all duration-300 scrollbar-minimal",
                (effectiveIsLoading || isStreaming) ? "min-h-[44px]" : "min-h-[44px]"
              )}
              rows={1}
              style={{
                boxShadow: 'none',
                WebkitAppearance: 'none',
              }}
            />

            {/* Send Button */}
            {(canSend || effectiveIsLoading || isStreaming) && (
              <div className={cn(
                "absolute right-4 transition-all duration-300 flex items-center gap-3",
                (effectiveIsLoading || isStreaming) ? "bottom-2" : "bottom-2"
              )}>
                {(effectiveIsLoading || isStreaming) ? (
                  // Red ChatGPT-style stop button
                  <button
                    onClick={handleStopStream}
                    title="Stop generating"
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700/50 active:scale-95 transition-all duration-200 group"
                  >
                    <Square
                      className="h-3 w-3 text-red-500 fill-red-500 transition-colors"
                      strokeWidth={0}
                    />
                  </button>
                ) : (
                  <Button
                    onClick={handleSend}
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full transition-all duration-300 transform-gpu shadow-md hover:shadow-lg hover:scale-105 active:scale-95", // Larger circular send button
                      hasFiles
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : selectedAgent === 'aegis' && selectedTool === 'research'
                          ? selectedSubtool === 'deep'
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                          : selectedAgent === 'aegis' && selectedTool === 'chat'
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : selectedAgent === 'clavis'
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Loading Indicator removed (Animated Dots consolidated near Stop Button) */}
          {/* Bottom Toolbar */}
          <div className="px-4 py-1.5 bg-transparent border-t border-gray-100/50 dark:border-slate-700/30">
            <div className="flex items-center justify-between">

              {/* Left Section - File & Media */}
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all duration-200",
                          canUploadFiles
                            ? hasFiles
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60"
                              : "hover:bg-white/80 dark:hover:bg-slate-800/50 text-gray-900 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:scale-105"
                            : "text-gray-900 dark:text-white opacity-40 cursor-not-allowed"
                        )}
                        onClick={() => canUploadFiles && fileInputRef.current?.click()}
                        disabled={!canUploadFiles || effectiveIsLoading || isStreaming}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-3 py-2 z-50 min-w-max"
                    sideOffset={8}
                  >
                    {canUploadFiles ? "Upload files (CSV, JSON, TXT, Excel)" : "File upload available for Aegis"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg text-gray-900 dark:text-gray-400 opacity-40 cursor-not-allowed transition-all duration-200"
                        disabled={true}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-3 py-2 z-50 min-w-max"
                    sideOffset={8}
                  >
                    Coming Soon
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg text-gray-900 dark:text-white opacity-40 cursor-not-allowed transition-all duration-200"
                        disabled={true}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-3 py-2 z-50 min-w-max"
                    sideOffset={8}
                  >
                    Coming Soon
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* Center Section - Agent & Mode Controls */}
              {selectedAgent === 'aegis' && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/80 dark:bg-slate-700/80 rounded-lg border border-gray-200/60 dark:border-slate-600/60 shadow-sm">

                  {/* Agent Avatar with Status */}
                  <div className="relative">
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center shadow-sm transition-all duration-300 bg-gradient-to-br from-emerald-400 to-blue-500"
                    )}>
                      <Avatar
                        size={11}
                        name={agentConfig.name}
                        variant={agentConfig.variant}
                        colors={[...agentConfig.colors]}
                      />
                    </div>

                    {/* Status indicator */}
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-white rounded-full",
                      isLoading ? "bg-orange-400 animate-pulse" : "bg-emerald-500"
                    )} />
                  </div>

                  {/* Mode Selector for Aegis */}
                  {onToolChange && (
                    <>
                      <div className="w-px h-6 bg-gray-200/80 dark:bg-slate-600/80 mx-1" />

                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 px-2 rounded-md transition-all duration-200 text-[11px] font-medium",
                          selectedTool === 'chat'
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-150 dark:hover:bg-green-900/60"
                            : "hover:bg-white/80 dark:hover:bg-slate-600/50 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100"
                        )}
                        onClick={() => onToolChange('chat')}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Chat
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 px-2 rounded-md transition-all duration-200 text-[11px] font-medium",
                          selectedTool === 'research'
                            ? selectedSubtool === 'deep'
                              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 hover:bg-purple-150 dark:hover:bg-purple-900/60"
                              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-150 dark:hover:bg-blue-900/60"
                            : "hover:bg-white/80 dark:hover:bg-slate-600/50 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100"
                        )}
                        onClick={() => onToolChange('research')}
                      >
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        Research
                      </Button>

                      {/* Research Subtool Selector */}
                      {selectedTool === 'research' && onSubtoolChange && (
                        <>
                          <div className="w-px h-6 bg-gray-200/80 mx-1" />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-6 px-2 rounded-md transition-all duration-200 text-[11px] font-medium",
                                  getCurrentSubtoolConfig().color,
                                  "hover:bg-gray-100 dark:hover:bg-slate-600/50"
                                )}
                              >
                                {getCurrentSubtoolConfig().icon}
                                <span className="ml-1.5 mr-1 capitalize">
                                  {selectedSubtool}
                                </span>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-gray-200/60 dark:border-slate-700/60 shadow-xl">
                              {Object.entries(RESEARCH_SUBTOOL_CONFIG).map(([key, config]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => onSubtoolChange(key)}
                                  className="flex items-start gap-3 hover:bg-gray-50/80 dark:hover:bg-slate-700/80 py-3 px-3"
                                >
                                  <div className={cn("flex-shrink-0 mt-0.5", config.color)}>
                                    {config.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                        {key} Research
                                      </span>
                                      {selectedSubtool === key && (
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                      {config.description}
                                    </p>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </>
                  )}

                  {/* Personality Selector for Chat Mode */}
                  {selectedTool === 'chat' && onChatToolChange && (
                    <>
                      <div className="w-px h-6 bg-gray-200/80 mx-1" />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-6 px-2 rounded-md transition-all duration-200 text-[11px] font-medium",
                              getCurrentPersonality().color,
                              "hover:bg-gray-100 dark:hover:bg-slate-600/50"
                            )}
                          >
                            {getCurrentPersonality().icon}
                            <span className="ml-1.5 mr-1">
                              {getCurrentPersonality().name}
                            </span>
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-gray-200/60 dark:border-slate-700/60 shadow-xl">
                          {PERSONALITY_OPTIONS.map(personality => (
                            <DropdownMenuItem
                              key={personality.id}
                              onClick={() => onChatToolChange(personality.id as AegisChatTool)}
                              className="flex items-start gap-3 hover:bg-gray-50/80 dark:hover:bg-slate-700/80 py-3 px-3"
                            >
                              <div className={cn("flex-shrink-0 mt-0.5", personality.color)}>
                                {personality.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {personality.name}
                                  </span>
                                  {selectedChatTool === personality.id && (
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                  {personality.description}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              )}

              {/* [BEGIN COMMENTED] Original Selector Logic for Sophia, Clavis, Analytica (Hidden per user request, commented here to preserve) 
              {selectedAgent !== 'aegis' && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/80 dark:bg-slate-700/80 rounded-lg border border-gray-200/60 dark:border-slate-600/60 shadow-sm">
                  <div className="relative">
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center shadow-sm transition-all duration-300",
                      selectedAgent === 'sophia' ? "bg-gradient-to-br from-purple-400 to-pink-500" :
                        "bg-gradient-to-br from-orange-400 to-red-500"
                    )}>
                      <Avatar size={11} name={agentConfig.name} variant={agentConfig.variant} colors={[...agentConfig.colors]} />
                    </div>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-white rounded-full", isLoading ? "bg-orange-400 animate-pulse" : "bg-emerald-500")} />
                  </div>

                  {selectedAgent === 'sophia' && (
                    <>
                      <div className="w-px h-4 bg-gray-200/80 mx-0.5" />
                      {selectedKnowledgeBaseName ? (
                        <Button variant="ghost" size="sm" className="h-5 px-1.5 rounded transition-all duration-200 text-[10px] font-medium bg-[#e0e0eb] dark:bg-[#003d4d] text-slate-900 dark:text-white hover:bg-[#d1d1e0] dark:hover:bg-[#002b36]" onClick={onShowKnowledgeBaseSelector}>
                          <Database className="h-2.5 w-2.5 mr-0.5" />
                          {selectedKnowledgeBaseName}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-5 px-1.5 rounded transition-all duration-200 text-[10px] font-medium bg-[#e0e0eb]/50 dark:bg-[#003d4d]/10 text-slate-600 dark:text-[#003d4d] hover:bg-[#e0e0eb]/80 dark:hover:bg-[#003d4d]/20 border border-slate-200 dark:border-[#003d4d]/30" onClick={onShowKnowledgeBaseSelector}>
                          <Database className="h-2.5 w-2.5 mr-0.5" />
                          Select KB
                        </Button>
                      )}
                    </>
                  )}

                  {selectedAgent === 'clavis' && (
                    <>
                      <div className="w-px h-6 bg-gray-200/80 mx-1" />
                      {selectedCodebaseName ? (
                        <Button variant="ghost" size="sm" className="h-6 px-2 rounded-md transition-all duration-200 text-[11px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-150 dark:hover:bg-blue-900/60" onClick={onShowCodebaseSelector}>
                          <Code className="h-3 w-3 mr-1" />
                          {selectedCodebaseName}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-6 px-2 rounded-md transition-all duration-200 text-[11px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-150" onClick={onShowCodebaseSelector}>
                          <Code className="h-3 w-3 mr-1" />
                          Select Codebase
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
              [END COMMENTED] */}

              {/* Right Section - Voice & Options */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg 
                                  text-gray-900 dark:text-gray-400 opacity-40
                                  hover:opacity-60
                                  hover:bg-gray-100 dark:hover:bg-slate-800/50
                                  cursor-not-allowed transition-all duration-200"
                        disabled={true}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="end"
                    className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-3 py-2 z-50 min-w-max"
                    sideOffset={8}
                  >
                    Coming Soon
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg 
                                  text-gray-900 dark:text-gray-400 opacity-40
                                  hover:opacity-60
                                  hover:bg-gray-100 dark:hover:bg-slate-800/50
                                  cursor-not-allowed transition-all duration-200"
                        disabled={true}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="end"
                    className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-3 py-2 z-50 min-w-max"
                    sideOffset={8}
                  >
                    Coming Soon
                  </TooltipContent>
                </Tooltip>
              </div>

            </div>
          </div>
        </div >

        {/* Status Bar */}
        <div className="flex items-center justify-center text-[11px] text-gray-400 dark:text-gray-300 mt-2 -mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                (effectiveIsLoading || isStreaming) ? "bg-orange-400 animate-pulse" : "bg-emerald-400"
              )} />
              <span>
                {selectedAgent === 'aegis' ? 'Aegis' : selectedAgent === 'sophia' ? 'Sophia' : 'Clavis'}
                {selectedAgent === 'aegis' && selectedTool === 'research' && (
                  <span> • {selectedSubtool === 'deep' ? 'Deep Research' : 'Quick Research'}</span>
                )}
                {selectedAgent === 'aegis' && selectedTool === 'chat' && (
                  <span> • {getCurrentPersonality().name}</span>
                )}
                {selectedAgent === 'sophia' && selectedKnowledgeBaseName && (
                  <span> • {selectedKnowledgeBaseName}</span>
                )}
                {selectedAgent === 'clavis' && selectedCodebaseName && (
                  <span> • {selectedCodebaseName}</span>
                )}
                {hasFiles && (
                  <span> • File Analysis</span>
                )}
              </span>
            </div>

            <span className="text-gray-300 dark:text-gray-600">•</span>

            <span>
              {(effectiveIsLoading || isStreaming) ?
                selectedAgent === 'aegis' && selectedTool === 'research' && selectedSubtool === 'deep' ?
                  'Conducting deep research...' :
                  selectedAgent === 'aegis' && selectedTool === 'chat' ? 'Thinking...' :
                    selectedAgent === 'clavis' ?
                      'Analyzing code...' :
                      'Processing...'
                : hasFiles ? 'Ready to analyze files' :
                  selectedAgent === 'aegis' && selectedTool === 'research' && selectedSubtool === 'deep' ?
                    'Ready for deep research' :
                    selectedAgent === 'clavis' && !selectedCodebaseName ?
                      'Select a codebase to start' :
                      'Ready to assist'
              }
            </span>

            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>Clavis code analysis enabled</span>
          </div>
        </div>
      </div>

      {/* Privacy Badge */}
      <div className="mt-3 flex items-center justify-center">
        <PrivacyBadge
          variant="inline"
          encrypted={true}
          encryptionType="enterprise_e2ee"
          onClick={() => setShowPrivacyDetails(true)}
          className="cursor-pointer hover:shadow-sm transition-shadow"
        />
      </div>

      {/* Privacy Details Modal */}
      <PrivacyDetailsModal
        open={showPrivacyDetails}
        onOpenChange={setShowPrivacyDetails}
        context="chat"
        encrypted={true}
        encryptionType="enterprise_e2ee"
      />
    </TooltipProvider>
  )
}
