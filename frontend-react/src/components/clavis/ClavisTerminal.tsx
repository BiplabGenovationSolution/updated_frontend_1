import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal as TerminalIcon, Plus, X, Loader2, Send, Globe, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clavisAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TerminalTab {
  id: string;
  name: string;
  output: string[];
  input: string;
  executing: boolean;
  tunnel_url?: string;
}

interface ClavisTerminalProps {
  sessionId: string;
  className?: string;
}

export interface ClavisTerminalHandle {
  appendOutput: (terminalId: string | undefined, line: string) => void;
}

export const ClavisTerminal = React.forwardRef<ClavisTerminalHandle, ClavisTerminalProps>(
  ({ sessionId, className }, ref) => {
    const [terminals, setTerminals] = useState<TerminalTab[]>([]);
    const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    const terminalContainerRef = useRef<HTMLDivElement>(null);
    const eventSourcesRef = useRef<Record<string, EventSource>>({});

    const AGENT_TERMINAL_ID = '__agent_activity__';

    // Expose appendOutput to parent
    React.useImperativeHandle(ref, () => ({
      appendOutput: (terminalId: string | undefined, line: string) => {
        const targetTerminalId = terminalId || AGENT_TERMINAL_ID;

        setTerminals(prev => {
          const existing = prev.find(t => t.id === targetTerminalId);
          if (existing) {
            return prev.map(t =>
              t.id === targetTerminalId ? { ...t, output: [...t.output, line] } : t
            );
          }

          // If terminal doesn't exist, create a synthetic one (Agent Activity)
          const fallbackName = targetTerminalId === AGENT_TERMINAL_ID ? 'Agent Activity' : `Terminal ${targetTerminalId}`;
          const newTerminal: TerminalTab = {
            id: targetTerminalId,
            name: fallbackName,
            output: [
              `$ Welcome to ${fallbackName}`,
              `$ Session: ${sessionId}`,
              '$ Live output mirrored from agent tool execution',
              line,
            ],
            input: '',
            executing: false,
          };
          return [...prev, newTerminal];
        });

        // Auto-focus the agent activity terminal if it's the first time
        setActiveTerminalId(prev => prev || targetTerminalId);
      }
    }));

    // Auto-scroll to bottom of active terminal
    useEffect(() => {
      if (terminalContainerRef.current) {
        const { scrollHeight, clientHeight } = terminalContainerRef.current;
        terminalContainerRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: 'smooth'
        });
      }
    }, [terminals.find(t => t.id === activeTerminalId)?.output.length]);

    const fetchTerminals = useCallback(async (): Promise<number> => {
      setLoading(true);
      try {
        const response = await clavisAPI.listTerminals(sessionId);
        if (response.success) {
          const existingTerms = response.data.terminals || [];
          const newTerminals: TerminalTab[] = existingTerms.map((t: any) => ({
            id: t.terminal_id,
            name: t.name || `Terminal ${t.terminal_id.substring(0, 4)}`,
            output: [],
            input: '',
            executing: t.executing || false,
            tunnel_url: t.tunnel_url
          }));

          setTerminals(newTerminals);
          if (newTerminals.length > 0 && !activeTerminalId) {
            setActiveTerminalId(newTerminals[0].id);
          }
          return newTerminals.length;
        }
        return 0;
      } catch (err) {
        console.error('Failed to fetch terminals:', err);
        return 0;
      } finally {
        setLoading(false);
      }
    }, [sessionId, activeTerminalId]);

    useEffect(() => {
      fetchTerminals();
      return () => {
        // Cleanup SSE connections on unmount
        Object.values(eventSourcesRef.current).forEach(es => es.close());
      };
    }, [sessionId]);

    // Setup/Manager SSE for a specific terminal
    const setupTerminalStream = useCallback((terminalId: string) => {
      if (eventSourcesRef.current[terminalId]) {
        eventSourcesRef.current[terminalId].close();
      }

      const url = clavisAPI.getTerminalStreamUrl(sessionId, terminalId);

      // Actually, the Next.js app used a fetch-based stream. Let's do that for reliability.
      const streamOutput = async () => {
        const abortController = new AbortController();

        try {
          const response = await fetch(url, {
            signal: abortController.signal
          });

          if (!response.ok || !response.body) return;

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.substring(6));

                  setTerminals(prev => prev.map(t => {
                    if (t.id === terminalId) {
                      const newOutput = [...t.output];
                      if (event.output) newOutput.push(event.output);

                      return {
                        ...t,
                        output: newOutput,
                        executing: event.status === 'executing',
                        tunnel_url: event.tunnel_url || t.tunnel_url
                      };
                    }
                    return t;
                  }));
                } catch (e) {
                  // Ignore parse errors for malformed events
                }
              }
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          console.error('Terminal stream error:', err);
        }
      };

      streamOutput();
    }, [sessionId]);

    // Handle active terminal changes
    useEffect(() => {
      if (activeTerminalId) {
        // If we don't have output for this terminal yet, start streaming
        const term = terminals.find(t => t.id === activeTerminalId);
        if (term && term.output.length === 0) {
          setupTerminalStream(activeTerminalId);
        }
      }
    }, [activeTerminalId, terminals, setupTerminalStream]);

    const createTerminal = async () => {
      setCreating(true);
      try {
        const response = await clavisAPI.createTerminal(sessionId);
        if (response.success) {
          const t = response.data;
          const newTerminal: TerminalTab = {
            id: t.terminal_id,
            name: t.name || `Terminal ${t.terminal_id.substring(0, 4)}`,
            output: [],
            input: '',
            executing: false
          };
          setTerminals(prev => [...prev, newTerminal]);
          setActiveTerminalId(newTerminal.id);
          setupTerminalStream(newTerminal.id);
        }
      } catch (err) {
        console.error('Failed to create terminal:', err);
      } finally {
        setCreating(false);
      }
    };

    // Auto-create a terminal if none exist when the component first loads
    const autoCreatedRef = useRef(false);
    useEffect(() => {
      autoCreatedRef.current = false;
      fetchTerminals().then(count => {
        if (count === 0 && !autoCreatedRef.current) {
          autoCreatedRef.current = true;
          createTerminal();
        }
      });
    }, [sessionId]);

    const deleteTerminal = async (id: string) => {
      try {
        const response = await clavisAPI.deleteTerminal(sessionId, id);
        if (response.success) {
          setTerminals(prev => prev.filter(t => t.id !== id));
          if (activeTerminalId === id) {
            const remaining = terminals.filter(t => t.id !== id);
            setActiveTerminalId(remaining.length > 0 ? remaining[0].id : null);
          }
          // Cleanup stream
          if (eventSourcesRef.current[id]) {
            eventSourcesRef.current[id].close();
            delete eventSourcesRef.current[id];
          }
        }
      } catch (err) {
        console.error('Failed to delete terminal:', err);
      }
    };

    const handleTerminalInput = (id: string, value: string) => {
      setTerminals(prev => prev.map(t => t.id === id ? { ...t, input: value } : t));
    };

    const handleTerminalSubmit = async (id: string) => {
      const term = terminals.find(t => t.id === id);
      if (!term || !term.input.trim() || term.executing) return;

      const command = term.input;
      // Optimistic update
      setTerminals(prev => prev.map(t => t.id === id ? { ...t, input: '', executing: true, output: [...t.output, `> ${command}`] } : t));

      try {
        const response = await clavisAPI.executeTerminalCommand(sessionId, id, command);
        if (!response.success) {
          setTerminals(prev => prev.map(t => t.id === id ? { ...t, output: [...t.output, `Error: ${response.error}`], executing: false } : t));
        }
      } catch (err) {
        console.error('Command execution error:', err);
        setTerminals(prev => prev.map(t => t.id === id ? { ...t, output: [...t.output, `Error: Failed to execute command`], executing: false } : t));
      }
    };

    const activeTerminal = terminals.find(t => t.id === activeTerminalId);

    return (
      <div className={cn("flex flex-col h-full bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden shrink-0 transition-colors shadow-2xl", className)}>
        {/* Tabs Header */}
        <div className="flex items-center px-4 bg-[#161b22] border-b border-[#30363d] h-12 shrink-0 overflow-x-auto scrollbar-minimal">
          <div className="flex items-center gap-4 mr-4">
            <div className="flex items-center gap-2">
              <TerminalIcon className="h-4 w-4 text-emerald-500" />
            </div>
            <Button
              variant="ghost" 
              size="sm"
              onClick={createTerminal}
              disabled={creating || loading}
              className="h-8 px-2 text-slate-400 hover:text-slate-200 hover:bg-[#21262d] gap-1.5 font-medium transition-all"
            >
              <Plus className={cn("h-3.5 w-3.5", creating && "animate-spin")} />
              New
            </Button>
          </div>

          <div className="h-6 w-px bg-[#30363d] mr-4" />

          <div className="flex items-center h-full">
            {terminals.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex items-center gap-2 h-full px-4 text-[11px] font-medium cursor-pointer transition-all border-r border-[#30363d] select-none min-w-[120px] max-w-[200px] group",
                  activeTerminalId === t.id
                    ? "bg-[#0d1117] text-[#c9d1d9] border-t-2 border-t-[#f78166] shadow-inner"
                    : "text-slate-500 hover:bg-[#161b22] hover:text-slate-300"
                )}
                onClick={() => setActiveTerminalId(t.id)}
              >
                <TerminalIcon className={cn("h-3 w-3", activeTerminalId === t.id ? "text-[#c9d1d9]" : "text-slate-600")} />
                <span className="font-mono truncate max-w-[100px]">{t.name}</span>
                {t.executing && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(250,204,21,0.5)]" />}
                {t.id !== AGENT_TERMINAL_ID && (
                  <button
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#30363d] rounded transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTerminal(t.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Terminal View area */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0d1117]">
          {loading && terminals.length === 0 ? (
            <div className="absolute top-4 right-4 z-10">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500 opacity-50" />
            </div>
          ) : null}

          {!activeTerminal ? (
            <div className="flex flex-col items-center justify-center h-[80%] px-4 text-center">
              <div className="mb-4">
                <TerminalIcon className="h-12 w-12 text-slate-700 opacity-40 shrink-0" />
              </div>
              
              <h3 className="text-sm font-medium text-slate-500 mb-5 tracking-tight">No terminals open</h3>

              <Button
                onClick={createTerminal}
                disabled={creating}
                className="bg-[#161b22] border border-[#30363d] text-emerald-400 hover:text-emerald-300 hover:bg-[#21262d] hover:border-emerald-500/50 px-4 py-1.5 h-8 rounded-lg font-bold text-[11px] transition-all active:scale-95 shadow-md"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Create Terminal'
                )}
              </Button>
            </div>
          ) : (
            <>
              <div
                ref={terminalContainerRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-[13px] scrollbar-minimal selection:bg-emerald-500/30"
              >
                <div className="space-y-1">
                  {activeTerminal.output.map((line, i) => (
                    <div key={i} className={cn(
                      "whitespace-pre-wrap break-all",
                      line.startsWith('>') ? "text-slate-500 italic opacity-80" : "text-slate-300"
                    )}>
                      {line}
                    </div>
                  ))}
                  {activeTerminal.executing && (
                    <div className="flex items-center gap-2 text-yellow-400 animate-pulse mt-1">
                      <span className="text-[10px] uppercase font-bold tracking-tighter">Process Active</span>
                      <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#0d1117] border-t border-[#30363d] flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 focus-within:border-emerald-500/50 transition-colors shadow-inner">
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={activeTerminal.input}
                    onChange={(e) => handleTerminalInput(activeTerminal.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTerminalSubmit(activeTerminal.id)}
                    placeholder={activeTerminal.executing ? "Wait for process to finish..." : "Type a command..."}
                    className="flex-1 bg-transparent py-2.5 focus:outline-none text-slate-200 font-mono text-sm placeholder:text-slate-600"
                    disabled={activeTerminal.executing}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/5 transition-colors"
                    onClick={() => handleTerminalSubmit(activeTerminal.id)}
                    disabled={!activeTerminal.input.trim() || activeTerminal.executing}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {activeTerminal.tunnel_url && (
                  <a
                    href={activeTerminal.tunnel_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-900 dark:bg-[#21262d] hover:bg-slate-800 dark:hover:bg-[#30363d] text-white dark:text-slate-300 border border-slate-900 dark:border-[#30363d] hover:border-slate-700 dark:hover:border-[#8b949e] text-xs font-bold rounded flex items-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Launch App
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);
