'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Code, CheckCircle, Settings } from 'lucide-react'
import { PrivacyBadge } from '@/components/privacy/PrivacyBadge'
import { PrivacyDetailsModal } from '@/components/privacy/PrivacyDetailsModal'

interface ClavisHeaderProps {
  codebase: string | null
  codebaseName: string | null
  onShowSelector: () => void
}

export function ClavisHeader({ codebase, codebaseName, onShowSelector }: ClavisHeaderProps) {
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {/* Avatar icon commented out for compact view */}
          {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <Avatar
                  size={28}
                  name="Clavis"
                  variant={AGENT_CONFIGS.clavis.variant}
                  colors={AGENT_CONFIGS.clavis.colors}
                />
              </div> */}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800 dark:text-[#e6edf3]">
                Clavis
              </h1>
              <Badge className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">
                Code AI
              </Badge>
            </div>
            {/* Subtitle commented out for compact view */}
            {/* <p className="text-xs text-slate-500 dark:text-[#8b949e]">
                  Code repository assistant
                </p> */}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Badge - Always visible */}
          <PrivacyBadge
            variant="agent"
            encrypted={true}
            encryptionType="enterprise_e2ee"
            onClick={() => setShowPrivacyDetails(true)}
            label="Code Encrypted"
          />

          {codebase && codebaseName ? (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-lg px-3 py-1.5">
              <Code className="h-4 w-4 text-slate-500 dark:text-[#8b949e]" />
              <span className="text-[13px] font-medium text-slate-700 dark:text-[#c9d1d9]">
                {codebaseName}
              </span>
              <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-500 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#c9d1d9] hover:bg-slate-100 dark:hover:bg-[#21262d] ml-1"
                onClick={onShowSelector}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-[#c9d1d9] hover:bg-slate-100 dark:hover:bg-[#161b22] hover:text-slate-900 dark:hover:text-white h-7 text-xs px-2.5 font-medium transition-colors"
              onClick={onShowSelector}
            >
              <Code className="h-3 w-3 mr-1.5 text-slate-500 dark:text-[#8b949e]" />
              Select Codebase
            </Button>
          )}
        </div>
      </div>

      {/* Privacy Details Modal */}
      <PrivacyDetailsModal
        open={showPrivacyDetails}
        onOpenChange={setShowPrivacyDetails}
        context="agent"
        encrypted={true}
        encryptionType="enterprise_e2ee"
      />
    </>
  )
}