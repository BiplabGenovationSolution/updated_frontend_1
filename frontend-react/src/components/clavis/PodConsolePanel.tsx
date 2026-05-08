'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Terminal, Play, Loader2, AlertCircle } from 'lucide-react'

interface PodConsolePanelProps {
  sessionId: string
}

interface CommandEntry {
  command: string
  output: string
  error?: string
  exitCode?: number
}

export function PodConsolePanel({ sessionId }: PodConsolePanelProps) {
  const [command, setCommand] = useState('')
  const [workingDir, setWorkingDir] = useState('/workspace')
  const [entries, setEntries] = useState<CommandEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [entries])

  const executeCommand = async () => {
    if (!command.trim()) return

    const cmd = command
    setCommand('')
    setIsRunning(true)
    setError(null)

    try {
      const result = await apiClient.executeClavisPodCommand(sessionId, {
        command: cmd,
        working_dir: workingDir,
      })

      setEntries((prev) => [
        ...prev,
        {
          command: cmd,
          output: result.data?.output || '',
          error: result.data?.error,
          exitCode: result.data?.exit_code,
        },
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to execute command')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium">Pod Console</span>
        </div>
        <code className="text-xs text-slate-400">{sessionId}</code>
      </div>

      <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
        <span className="text-xs text-slate-400">Dir</span>
        <input
          value={workingDir}
          onChange={(e) => setWorkingDir(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
        />
      </div>

      <div ref={terminalRef} className="flex-1 overflow-auto p-3 space-y-3 font-mono text-xs">
        {entries.length === 0 && (
          <div className="text-slate-500">Run commands to create/edit/execute files in this Clavis pod.</div>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="space-y-1">
            <div className="text-emerald-400">$ {entry.command}</div>
            {entry.output && <pre className="text-slate-200 whitespace-pre-wrap">{entry.output}</pre>}
            {entry.error && <pre className="text-red-400 whitespace-pre-wrap">{entry.error}</pre>}
            {typeof entry.exitCode === 'number' && (
              <div className="text-slate-500">exit: {entry.exitCode}</div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="px-3 py-2 border-t border-slate-800 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="p-3 border-t border-slate-800 flex items-center gap-2">
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              executeCommand()
            }
          }}
          placeholder="npm create vite@latest app -- --template react-ts"
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs"
        />
        <button
          onClick={executeCommand}
          disabled={isRunning}
          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
