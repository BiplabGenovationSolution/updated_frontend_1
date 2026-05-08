'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Terminal, MessageSquare, Trash2, Maximize2, Minimize2, Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

interface ExecutionPanelProps {
    isOpen: boolean
    onClose: () => void
    onToggleExpand: () => void
    isExpanded: boolean
    logs: string[]
    onClearLogs: () => void
    messages?: ChatMessage[]
    onSendMessage?: (message: string) => void
    isProcessing?: boolean
}

export function ExecutionPanel({
    isOpen,
    onClose,
    onToggleExpand,
    isExpanded,
    logs,
    onClearLogs,
    messages = [],
    onSendMessage,
    isProcessing = false
}: ExecutionPanelProps) {
    const logsEndRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [inputMessage, setInputMessage] = useState('')

    // Auto-scroll logs to bottom
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [logs, isOpen])

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    const handleSend = () => {
        if (inputMessage.trim() && onSendMessage) {
            onSendMessage(inputMessage)
            setInputMessage('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!isOpen) return null

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a1f2e] border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 z-40 flex flex-col",
                isExpanded ? "h-[80vh]" : "h-[400px]"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#2d3545]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Terminal className="w-4 h-4" />
                        Execution Panel
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-500"
                        onClick={onClearLogs}
                        title="Clear Logs"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500"
                        onClick={onToggleExpand}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500"
                        onClick={onClose}
                        title="Close Panel"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat Section (1/3 width) */}
                <div className="w-1/3 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1f2e]">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#2d3545] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chat</span>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm min-h-[200px]">
                                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                                <p>Chat interaction will appear here</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex gap-3 text-sm max-w-[90%]",
                                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                msg.role === 'user'
                                                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                                    : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                            )}
                                        >
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div
                                            className={cn(
                                                "p-3 rounded-lg",
                                                msg.role === 'user'
                                                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-gray-800 dark:text-gray-200"
                                                    : "bg-gray-50 dark:bg-[#2d3545] text-gray-800 dark:text-gray-200"
                                            )}
                                        >
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {isProcessing && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="bg-gray-50 dark:bg-[#2d3545] p-3 rounded-lg flex items-center">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#2d3545]">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={onSendMessage ? "Type a message..." : "Chat disabled (no agent selected)"}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={!onSendMessage || isProcessing}
                                className="w-full pl-3 pr-10 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f2e] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!inputMessage.trim() || !onSendMessage || isProcessing}
                                onClick={handleSend}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logs Section (2/3 width) */}
                <div className="w-2/3 flex flex-col bg-[#1e1e1e] text-green-400 font-mono text-xs">
                    <div className="px-4 py-2 border-b border-gray-700 bg-[#252526] flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold text-gray-300">System Logs</span>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="flex flex-col gap-1">
                            {logs.length === 0 ? (
                                <span className="text-gray-500 italic">Waiting for execution logs...</span>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className="break-all whitespace-pre-wrap font-mono border-b border-gray-800/50 pb-1 mb-1 last:border-0">
                                        <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                        {log}
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
