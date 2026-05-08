import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function CustomAgentsRedirect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Custom agents are now managed in workspace
    // Redirect preserving any query parameters
    const action = searchParams.get('action')
    if (action === 'create') {
      // If they were trying to create, workspace will handle it
      navigate('/workspace')
    } else {
      // Otherwise just go to workspace
      navigate('/workspace')
    }
  }, [navigate, searchParams])

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-sm">Redirecting to Workspace...</p>
        <p className="text-gray-400 text-xs mt-2">Custom agents are now managed in Workspace</p>
      </div>
    </div>
  )
}
