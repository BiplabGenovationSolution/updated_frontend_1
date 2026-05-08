import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Building2, Users, Network, Mail, Key, Book, BarChart3, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

interface SettingsLayoutProps {
  children: ReactNode
}

const navItems = [
  { to: '/settings/organization', label: 'Organization', icon: Building2 },
  { to: '/settings/members', label: 'Members', icon: Users },
  { to: '/settings/departments', label: 'Departments', icon: Network },
  { to: '/settings/invitations', label: 'Invitations', icon: Mail },
  { to: '/settings/api-keys', label: 'API Keys', icon: Key },
  { to: '/settings/api-docs', label: 'API Docs', icon: Book },
  { to: '/settings/analytics', label: 'Analytics', icon: BarChart3 },
]

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left Sidebar (locked, never scrolls) ── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-6 px-3">
        {/* Back Button */}
        <div className="px-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const from = (location.state as any)?.from
              if (from) {
                navigate(from)
              } else {
                navigate(-1)
              }
            }}
            className="-ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Title block */}
        <div className="px-3 mb-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your organization, members, and preferences
          </p>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-2">
          Organization
        </p>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ── Main Content (scrolls independently) ── */}
      <main className="flex-1 overflow-y-auto bg-[#EEF2F7] dark:bg-[#0f1219]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
