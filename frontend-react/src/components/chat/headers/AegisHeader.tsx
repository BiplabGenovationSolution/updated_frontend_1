'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Search } from 'lucide-react'
import { PrivacyBadge } from '@/components/privacy/PrivacyBadge'
import { PrivacyDetailsModal } from '@/components/privacy/PrivacyDetailsModal'

interface AegisHeaderProps {
  tool: string
}

export function AegisHeader({ tool }: AegisHeaderProps) {
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800 dark:text-[#e6edf3]">
                Aegis
              </h1>
              <Badge className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">
                Research AI
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrivacyBadge
            variant="chat"
            encrypted={true}
            encryptionType="enterprise_e2ee"
            onClick={() => setShowPrivacyDetails(true)}
          />

          <Badge className={`px-3 py-1 text-xs ${tool === 'chat'
            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            } border-0`}>
            {tool === 'chat' ? (
              <>
                <MessageSquare className="h-3 w-3 mr-1" />
                Chat Mode
              </>
            ) : (
              <>
                <Search className="h-3 w-3 mr-1" />
                Research Mode
              </>
            )}
          </Badge>
        </div>
      </div>

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