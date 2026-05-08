import { useState, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ChatLayoutProps {
  header: ReactNode
  messages: ReactNode
  input: ReactNode
  panel?: ReactNode
}

export function ChatLayout({ header, messages, input, panel }: ChatLayoutProps) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null)
  const [panelWidth, setPanelWidth] = useState(450)
  const isResizing = useRef(false)

  useEffect(() => {
    setPortalNode(document.getElementById('agent-header-portal'))
  }, [])

  // ── Resizing Logic ──────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return

      // Panel is on the right, so width = window.innerWidth - mouseX
      const newWidth = window.innerWidth - e.clientX
      const clampedWidth = Math.min(Math.max(newWidth, 300), 800)
      setPanelWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="flex h-full bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117] overflow-hidden">
      {/* Main Chat Area - Always flex-1 for smooth shrinking */}
      <div className="flex-1 min-w-0 flex flex-col bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117] border-r border-slate-200 dark:border-[#21262d]">
        {/* Header - Portaled to main App Header if available */}
        {portalNode ? (
          createPortal(header, portalNode)
        ) : (
          <div className="flex-shrink-0">
            {header}
          </div>
        )}

        {/* Messages - Scrollable with proper flex */}
        <div className="flex-1 min-h-0 overflow-hidden bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117]">
          {messages}
        </div>

        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0 bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117]">
          <div className="p-3 lg:p-4">
            {input}
          </div>
        </div>
      </div>

      {/* Side Panel Container - Always in DOM for smooth width transition */}
      <div
        className={cn(
          "h-full bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117] flex-shrink-0 overflow-hidden relative z-20 transition-[width,box-shadow,border] duration-500 ease-in-out",
          panel
            ? "border-l border-slate-200 dark:border-[#21262d] shadow-xl"
            : "w-0 border-l-0 shadow-none"
        )}
        style={{ width: panel ? `${panelWidth}px` : '0px' }}
      >
        {/* Resize Handle - only show if panel is truthy and has width */}
        {panel && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#008fb3]/30 active:bg-[#008fb3]/50 transition-colors z-30 group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 group-hover:bg-[#008fb3]/50" />
          </div>
        )}

        {/* Panel Content - smooth opacity to prevent content popping */}
        <div className={cn(
          "h-full w-full overflow-hidden transition-opacity duration-300",
          panel ? "opacity-100 delay-200" : "opacity-0"
        )}>
          {panel}
        </div>
      </div>
    </div>
  )
}