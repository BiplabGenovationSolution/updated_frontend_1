'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, Settings, CheckCircle } from 'lucide-react'
import { PrivacyBadge } from '@/components/privacy/PrivacyBadge'
import { PrivacyDetailsModal } from '@/components/privacy/PrivacyDetailsModal'

interface SophiaHeaderProps {
  knowledgeBase: string | null
  knowledgeBaseName: string | null
  onShowSelector: () => void
}

export function SophiaHeader({ knowledgeBase, knowledgeBaseName, onShowSelector }: SophiaHeaderProps) {
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800 dark:text-[#e6edf3]">
                Sophia
              </h1>
              <Badge className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">
                Knowledge Base AI
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Badge - Always visible */}
          <PrivacyBadge
            variant="chat"
            encrypted={true}
            encryptionType="enterprise_e2ee"
            onClick={() => setShowPrivacyDetails(true)}
          />

          {knowledgeBase && knowledgeBaseName ? (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-lg px-3 py-1.5 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
              <Database className="h-4 w-4 text-slate-500 dark:text-[#8b949e] shrink-0" />
              <span className="text-[13px] font-medium text-slate-700 dark:text-[#c9d1d9] truncate">
                {knowledgeBaseName}
              </span>
              <CheckCircle className="h-4 w-4 text-green-500 ml-1 shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-500 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#c9d1d9] hover:bg-slate-100 dark:hover:bg-[#21262d] ml-1 shrink-0"
                onClick={onShowSelector}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-[#c9d1d9] hover:bg-slate-100 dark:hover:bg-[#161b22] hover:text-slate-900 dark:hover:text-white h-7 text-xs px-2.5 font-medium transition-colors"
              onClick={onShowSelector}
            >
              <Database className="h-3 w-3 mr-1.5 text-slate-500 dark:text-[#8b949e]" />
              Select Knowledge Base
            </Button>
          )}
        </div>
      </div>

      {/* Privacy Details Modal */}
      <PrivacyDetailsModal
        open={showPrivacyDetails}
        onOpenChange={setShowPrivacyDetails}
        context="chat"
        encrypted={true}
        encryptionType="enterprise_e2ee"
      />
    </>
  )
}