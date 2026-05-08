'use client'

import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { ClavisChat } from '@/components/chat/agents/ClavisChat'
import { PodConsolePanel } from '@/components/clavis/PodConsolePanel'
import { useChatContext } from '@/context/chat-context'

export function InteractiveSessionWorkspace() {
  const { codebaseId, sessionId } = useParams<{ codebaseId: string; sessionId: string }>()
  const navigate = useNavigate()
  const { setSelectedAgent, setSelectedCodebase, setSelectedCodebaseName } = useChatContext()

  const { data: codebasesData } = useQuery({
    queryKey: ['codebases'],
    queryFn: () => apiClient.getCodebases(),
  })

  const codebase = (codebasesData?.data || []).find((cb: any) => cb.codebase_id === codebaseId)

  useEffect(() => {
    setSelectedAgent('clavis')
    if (codebaseId) {
      setSelectedCodebase(codebaseId)
    }
    if (codebase?.repo_name) {
      setSelectedCodebaseName(codebase.repo_name)
    }
  }, [codebaseId, codebase?.repo_name, setSelectedAgent, setSelectedCodebase, setSelectedCodebaseName])

  if (!codebaseId || !sessionId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-600">Missing codebase or session id.</p>
          <button
            onClick={() => navigate('/hub')}
            className="px-3 py-2 rounded bg-slate-900 text-white"
          >
            Back to Hub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-80px)]">
      <ClavisChat
        chatId={null}
        sidePanel={<PodConsolePanel sessionId={sessionId} />}
        forcedCodebaseId={codebaseId}
        forcedCodebaseName={codebase?.repo_name}
        hideCodebaseSelector
      />
    </div>
  )
}
