// Placeholder - Full implementation needed from Next.js conversion
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default function FlowsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agent Flow Builder
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Create and manage agent flows
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Flow Builder</h2>
          <p className="text-gray-600 mb-4">
            This page is under development
          </p>
          <Button onClick={() => navigate('/agents')}>
            Go to Chat
          </Button>
        </div>
      </div>
    </div>
  )
}
