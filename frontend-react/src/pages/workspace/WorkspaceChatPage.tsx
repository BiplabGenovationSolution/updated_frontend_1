
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ChatInterface } from '@/components/chat/ChatInterface'
import type { AgentType } from '@/lib/types'

export default function WorkspaceChatPage() {
    const { agentId, agentName } = useParams()
    const [searchParams] = useSearchParams()
    const chatId = searchParams.get('id') || null
    const navigate = useNavigate()

    // Determine the agent type (either from :agentId or "custom" if using :agentName)
    const isCustom = !!agentName || agentId === 'custom'
    const agentType: AgentType | 'custom' = isCustom ? 'custom' : (agentId as AgentType)

    // Provide the decoded custom agent name if available
    const customAgentName = agentName ? decodeURIComponent(agentName) : null

    // Handle what happens when a new chat is created
    const handleChatCreated = (newChatId: string) => {
        // Navigate within the agents workspace instead of jumping to the legacy /chat route
        const basePath = agentName ? `/agents/custom/${encodeURIComponent(agentName)}` : `/agents/${agentId}`
        navigate(`${basePath}?id=${newChatId}`, { replace: true })
    }

    return (
        <div className="flex-1 h-full w-full overflow-hidden bg-white dark:bg-[#161b22]">
            <ChatInterface
                chatId={chatId}
                onChatCreated={handleChatCreated}
                initialAgent={agentType}
                initialCustomAgentName={customAgentName}
            />
        </div>
    )
}
