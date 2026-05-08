


// frontend/src/components/layout/Header.tsx
'use client'

import { Menu, HelpCircle, ShieldCheck, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { TaskPanelTrigger } from '@/components/tasks/TaskPanelTrigger'
import { TaskPanel } from '@/components/tasks/TaskPanel'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { CommandPalette } from '@/components/ui/CommandPalette'

interface HeaderProps {
  onSidebarToggle?: () => void
  isSidebarOpen?: boolean
  isSidebarCollapsed?: boolean
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Listen for global Cmd+K to open palette from anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sidebar alignment width
  const leftWidth = 52 + 256 // 308px

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#0d1117] h-14 relative z-50">

      {/* Left Section: Logo */}
      <div
        className="flex items-center gap-4 h-full shrink-0"
        style={{ width: `${leftWidth}px` }}
      >
        <div className="flex items-center gap-4 px-4 h-full w-full">

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="md:hidden hover:bg-slate-100 dark:hover:bg-[#161b22] text-slate-600 dark:text-[#c9d1d9] rounded-lg h-8 w-8 -ml-2"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo */}
          {/* <div className="flex items-center gap-3">
            <img
              src="/mentis-logomark.svg"
              alt="Mentis Logo"
              className="h-6 w-auto object-contain"
            />
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              Mentis
            </span>
          </div> */}
          <Link to="/agents" className="flex items-center gap-3">
            <img
              src="/mentis-logomark.svg"
              alt="Mentis Logo"
              className="h-6 w-auto object-contain"
            />
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              Mentis
            </span>
          </Link>
        </div>
      </div>

      {/* Center Section */}
      <div
        id="agent-header-portal"
        className="flex items-center justify-start flex-1 h-full min-w-0"
      ></div>

      {/* Global Apple-style Command Palette Trigger (Centered) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full pointer-events-none">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="pointer-events-auto flex items-center gap-2 w-[280px] sm:w-[340px] px-3 py-1.5 rounded-[8px] border border-slate-200 dark:border-[#30363d] bg-slate-100/50 dark:bg-[#0d1117] hover:bg-slate-100 dark:hover:bg-[#161b22] text-slate-500 dark:text-[#8b949e] transition-colors shadow-sm cursor-text focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="text-[13px] flex-1 text-left truncate">Search or type a command...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] font-medium text-slate-400 dark:text-[#8b949e]">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 px-4 shrink-0">

        <div className="flex items-center gap-2">

          <ThemeToggle />

          {/* Help Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-slate-100 dark:bg-[#21262d] text-slate-500 dark:text-[#6e7681] hover:bg-slate-200 dark:hover:bg-[#30363d] hover:text-slate-900 dark:hover:text-[#c9d1d9] rounded border border-slate-200 dark:border-[#30363d]"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </Button>

          {/* Task Panel */}
          <TaskPanelTrigger />

        </div>

        <div className="w-px h-4 bg-slate-300 dark:bg-[#30363d] hidden sm:block"></div>

        {/* Models Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/models')}
          className="h-7 w-7 bg-slate-100 dark:bg-[#21262d] text-slate-500 dark:text-[#6e7681] hover:bg-slate-200 dark:hover:bg-[#30363d] hover:text-slate-900 dark:hover:text-[#c9d1d9] rounded border border-slate-200 dark:border-[#30363d]"
        >
          <Cpu className="h-3.5 w-3.5" />
        </Button>

        {/* Governance Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings', { state: { from: location.pathname } })}
          className="h-7 w-7 bg-slate-100 dark:bg-[#21262d] text-slate-500 dark:text-[#6e7681] hover:bg-slate-200 dark:hover:bg-[#30363d] hover:text-slate-900 dark:hover:text-[#c9d1d9] rounded border border-slate-200 dark:border-[#30363d]"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
        </Button>


      </div>

      {/* Task Panel Overlay */}
      <TaskPanel />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

    </header>
  )
}

