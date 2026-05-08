// frontend/src/components/chat/headers/AnalyticaHeader.tsx
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Settings, Database } from 'lucide-react'
import { PrivacyBadge } from '@/components/privacy/PrivacyBadge'
import { PrivacyDetailsModal } from '@/components/privacy/PrivacyDetailsModal'

interface AnalyticaHeaderProps {
  bucket: string | null
  bucketName: string | null
  onShowSelector: () => void
}

export function AnalyticaHeader({ bucket, bucketName, onShowSelector }: AnalyticaHeaderProps) {
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {/* Avatar icon commented out for compact view */}
          {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                <Avatar
                  size={28}
                  name="Analytica"
                  variant={AGENT_CONFIGS.analytica.variant}
                  colors={AGENT_CONFIGS.analytica.colors}
                />
              </div> */}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800 dark:text-[#e6edf3]">
                Analytica
              </h1>
              <Badge className="px-2 py-0.5 text-xs bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-0">
                Data AI
              </Badge>
            </div>
            {/* Subtitle commented out for compact view */}
            {/* <p className="text-xs text-slate-500 dark:text-[#8b949e]">
                  Data analysis and visualization
                </p> */}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Badge - Always visible */}
          <PrivacyBadge
            variant="data"
            encrypted={true}
            encryptionType="enterprise_e2ee"
            onClick={() => setShowPrivacyDetails(true)}
            label="Data Protected"
          />

          {bucket && bucketName ? (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-lg px-3 py-1.5 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
              <Database className="h-4 w-4 text-slate-500 dark:text-[#8b949e] shrink-0" />
              <span className="text-[13px] font-medium text-slate-700 dark:text-[#c9d1d9] truncate">
                {bucketName}
              </span>
              <CheckCircle className="h-4 w-4 text-green-500 ml-1 shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-500 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#c9d1d9] hover:bg-slate-100 dark:hover:bg-[#21262d] ml-1 shrink-0"
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
              <Database className="h-3 w-3 mr-1.5 text-slate-500 dark:text-[#8b949e]" />
              Select Data Bucket
            </Button>
          )}
        </div>
      </div>

      {/* Privacy Details Modal */}
      <PrivacyDetailsModal
        open={showPrivacyDetails}
        onOpenChange={setShowPrivacyDetails}
        context="data"
        encrypted={true}
        encryptionType="enterprise_e2ee"
      />
    </>
  )
}