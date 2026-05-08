import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { IconNav } from '@/components/layout/IconNav'
import { ChatInterface } from '@/components/chat/ChatInterface'

import type { AgentType } from '@/lib/types'

export default function ChatPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const location = useLocation()

    // Get chatId and agent from URL params
    const chatId = searchParams.get('id')
    const agentParam = searchParams.get('agent') as AgentType | null

    // Extract agent from URL path (e.g., /chat/aegis -> 'aegis')
    // Also handle /chat/custom/:agentName -> agent: 'custom', customAgentName: 'agentName'
    const pathSegments = location.pathname.split('/').filter(Boolean)

    let agentFromPath: AgentType | null = null
    let customAgentNameFromPath: string | null = null

    if (pathSegments.length > 1 && pathSegments[0] === 'chat') {
        if (pathSegments[1] === 'custom' && pathSegments.length > 2) {
            agentFromPath = 'custom'
            customAgentNameFromPath = decodeURIComponent(pathSegments[2])
        } else {
            agentFromPath = (pathSegments[1] as AgentType)
        }
    }

    // Prefer agent from path, fallback to query param
    const currentAgent = agentFromPath || agentParam

    console.log('🔍 ChatPage routing:', {
        pathname: location.pathname,
        pathSegments,
        agentFromPath,
        agentParam,
        currentAgent
    })

    const [selectedChatId, setSelectedChatId] = useState<string | null>(chatId)

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Update selectedChatId when URL changes
    useEffect(() => {
        setSelectedChatId(chatId)
    }, [chatId])

    const [resetKey, setResetKey] = useState(0)

    // Handle chat creation - navigate within the and workspace
    const handleChatCreated = (newChatId: string) => {
        console.log('🚀 New chat created, navigating to workspace workspace:')
        setSelectedChatId(newChatId)
        const targetAgent = currentAgent || 'sophia'
        navigate(`/agents/${targetAgent}?id=${newChatId}`)
    }

    // Handle chat selection from sidebar - includes agent type for foolproof routing
    const handleChatSelect = (chatId: string | null, agentType?: string) => {
        if (chatId) {
            // Always update state first
            setSelectedChatId(chatId)

            // Include agent type in URL to ensure correct workspace route
            const targetAgent = agentType || 'sophia'
            const url = `/agents/${targetAgent}?id=${chatId}`
            console.log('🔄 Navigating to workspace workspace with agent:', { chatId, agentType, url })

            // Force navigation even if on same route (different chat ID)
            navigate(url, { replace: false })

            // Keep sidebar open - enterprise UX
        } else {
            // ✅ FIX: Handle New Chat (null chatId)
            // Navigate to root /chat to show the Agent Selection / Landing Page
            console.log('🔄 Navigating to New Chat (Agent Landing Page)')
            setSelectedChatId(null)

            // Force reset of ChatInterface to clear any sticky state (like selected custom agent)
            setResetKey(prev => prev + 1)

            navigate('/agents')
        }
    }

    return (
        <div className="flex h-screen flex-col bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0f1219]">
            {/* Header at the top, full width */}
            <Header
                onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
                isSidebarCollapsed={false}
            />

            {/* Main Content Area (IconNav + Sidebar + Chat) */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* IconNav only visible when sidebar is closed */}
                {!isSidebarOpen && (
                    <IconNav onSidebarClick={() => setIsSidebarOpen(true)} />
                )}

                {/* Chat Sidebar, Mutually exclusive with IconNav */}
                {isSidebarOpen && (
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onChatSelect={handleChatSelect}
                        selectedChatId={selectedChatId}
                        isCollapsed={false}
                        onToggleCollapse={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Chat Area */}
                <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                    <ChatInterface
                        chatId={selectedChatId}
                        onChatCreated={handleChatCreated}
                        initialAgent={currentAgent || undefined}
                        initialCustomAgentName={customAgentNameFromPath}
                        key={`${selectedChatId || 'new'}-${currentAgent || 'none'}-${customAgentNameFromPath || 'none'}-${resetKey}`}
                    />
                </div>

                {/* Overlay for mobile */}
                {isSidebarOpen && (
                    <div
                        className="absolute inset-0 z-20 md:hidden bg-black/50"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>
        </div>
    )
}
