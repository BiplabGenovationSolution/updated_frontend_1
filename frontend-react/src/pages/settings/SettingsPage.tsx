// frontend/src/app/settings/page.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to organization settings by default
    navigate('/settings/organization')
  }, [navigate])

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )
}
