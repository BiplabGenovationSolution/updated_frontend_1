import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Play,
  AlertCircle,
  Brain,
  Wrench,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Send,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { apiClient, clavisAPI } from '@/lib/api';
import { DIRECT_BACKEND_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ClavisFileBrowser } from '@/components/clavis/ClavisFileBrowser';
import { ClavisTerminal } from '@/components/clavis/ClavisTerminal';
import type { ClavisTerminalHandle } from '@/components/clavis/ClavisTerminal';
import { useChatContext } from '@/context/chat-context';
import { MarkdownContent } from '@/components/markdown/MarkdownContent';
import { useTheme } from '@/context/ThemeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text' | 'task_update' | 'done' | 'error' | 'stream_end';
  content?: string;
  tool?: string;
  args?: Record<string, any>;
  result?: string;
  tasks?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  events?: AgentEvent[];
}

// ---------------------------------------------------------------------------
// Agent Event Card Component
// ---------------------------------------------------------------------------

const AgentEventCard: React.FC<{ event: AgentEvent }> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);

  if (event.type === 'thinking') {
    return (
      <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 py-1 font-medium italic">
        <Brain className="h-3.5 w-3.5 animate-pulse" />
        <span>{event.content || 'Thinking...'}</span>
      </div>
    );
  }

  if (event.type === 'tool_call') {
    const argsPreview = event.args
      ? Object.entries(event.args).map(([k, v]) => {
        const val = typeof v === 'string' ? (v.length > 40 ? v.slice(0, 40) + '...' : v) : JSON.stringify(v).slice(0, 40);
        return `${k}=${val}`;
      }).join(', ')
      : '';

    return (
      <div className="my-1 rounded border border-border dark:border-[#30363d] bg-slate-50 dark:bg-[#161b22] overflow-hidden shadow-sm transition-all duration-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors"
        >
          <Wrench className="h-3 w-3 shrink-0" />
          <span className="font-bold uppercase tracking-tighter">{event.tool}</span>
          <span className="text-slate-500 truncate opacity-70">({argsPreview})</span>
          <span className="ml-auto text-slate-400">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        </button>
        {expanded && event.args && (
          <pre className="px-3 py-2 text-[10px] bg-white dark:bg-[#0d1117] border-t border-border dark:border-[#30363d] text-slate-600 dark:text-slate-400 overflow-x-auto font-mono">
            {JSON.stringify(event.args, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (event.type === 'tool_result') {
    return (
      <div className="my-1 rounded border border-border dark:border-[#30363d] bg-slate-50 dark:bg-[#161b22] overflow-hidden shadow-sm">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors"
        >
          <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <span className="text-[10px] text-slate-500 font-medium">Result from <span className="text-slate-900 dark:text-slate-200">{event.tool}</span></span>
          <span className="ml-auto text-slate-400">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        </button>
        {expanded && (
          <pre className="px-3 py-2 text-[10px] bg-white dark:bg-[#0d1117] text-emerald-700 dark:text-emerald-400 border-t border-border dark:border-[#30363d] overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto font-mono scrollbar-minimal">
            {event.result}
          </pre>
        )}
      </div>
    );
  }

  if (event.type === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-[#ff7b72] py-1 bg-red-50 dark:bg-red-900/10 px-2 rounded border border-red-200 dark:border-red-900/30 my-1 font-medium">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{event.content}</span>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const ClavisModernIDEPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { setSelectedAgent, setSelectedCodebase, setSelectedCodebaseName } = useChatContext();

  const [podStatus, setPodStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [refreshFileTrigger, setRefreshFileTrigger] = useState(0);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: 'MentisPod Agent ready. I can read, write, and edit files, run commands, and help you build your project. What would you like to do?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const autoContinueCountRef = useRef(0);
  const MAX_AUTO_CONTINUES = 3;
  const messageListRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<ClavisTerminalHandle>(null);

  const { data: codebasesData } = useQuery({
    queryKey: ['codebases'],
    queryFn: () => apiClient.getCodebases(),
  });

  // Fetch chat history for the session
  const historyLoadedRef = useRef(false);

  const fetchChatHistory = async (chatId: string) => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    try {
      const response = await apiClient.getChatMessages(chatId, { sortOrder: 'asc' });
      if (response.success && response.data?.messages) {
        const historyMessages: ChatMessage[] = response.data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.sender as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          // Extract events from metadata (support both 'events' and 'steps' naming)
          events: msg.metadata?.events || msg.metadata?.steps || []
        }));

        if (historyMessages.length > 0) {
          setMessages(historyMessages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
      historyLoadedRef.current = false; // Allow retry if it failed
    }
  };

  const fetchPodStatus = async (showLoading = false) => {
    if (!sessionId) return;
    if (showLoading) setLoading(true);

    try {
      const response = await clavisAPI.getPodSession(sessionId);
      if (response.success) {
        const podInfo = response.data.pod_info || response.data;
        setPodStatus(podInfo);

        // Fetch history if not already fetched
        const chatId = podInfo.chat_id || sessionId;
        if (chatId && messages.length <= 1) { // Only fetch if we only have the greeting
          fetchChatHistory(chatId);
        }
      } else {
        setError(response.error || 'Failed to fetch pod status');
      }
    } catch (err) {
      setError('An error occurred while fetching pod status');
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodStatus(true);
    const interval = setInterval(() => fetchPodStatus(false), 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, [sessionId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      const { scrollHeight, clientHeight } = messageListRef.current;
      messageListRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Sync context when podStatus changes
  useEffect(() => {
    if (podStatus) {
      setSelectedAgent('clavis');
      const codebaseId = podStatus.codebase?.codebase_id || podStatus.codebase_id;
      if (codebaseId) {
        setSelectedCodebase(codebaseId);
        const codebase = (codebasesData?.data || []).find((cb: any) => cb.codebase_id === codebaseId);
        if (codebase?.repo_name) {
          setSelectedCodebaseName(codebase.repo_name);
        }
      }
    }
  }, [podStatus, codebasesData, setSelectedAgent, setSelectedCodebase, setSelectedCodebaseName]);

  const handleStartPod = async () => {
    if (!sessionId) return;
    setStarting(true);
    try {
      const response = await clavisAPI.startPodSession(sessionId);
      if (response.success) {
        fetchPodStatus(true);
      } else {
        setError(response.error || 'Failed to start pod');
      }
    } catch (err) {
      setError('An error occurred while starting the pod');
    } finally {
      setStarting(false);
    }
  };

  const sendAgentMessage = async (messageText: string, isAutoContinue: boolean = false) => {
    if (sendingMessage || !sessionId) return;

    if (!isAutoContinue) {
      autoContinueCountRef.current = 0;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: isAutoContinue ? 'system' : 'user',
      content: isAutoContinue ? '⏩ Auto-continuing...' : messageText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setSendingMessage(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      events: [],
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/agent/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('mentis_auth_token')}`,
          },
          body: JSON.stringify({ message: messageText }),
        }
      );

      if (!response.ok) throw new Error(`Agent API error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let confirmedText = '';
      let streamingText = '';
      const accumulatedEvents: AgentEvent[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event: AgentEvent = JSON.parse(jsonStr);
            if (event.type === 'stream_end') continue;

            if (event.type !== 'thinking' && event.type !== 'text' && event.type !== 'done') {
              accumulatedEvents.push(event);
            }

            if (event.type === 'thinking') {
              streamingText += event.content || '';
            } else if (event.type === 'text') {
              confirmedText += (confirmedText ? '\n\n' : '') + (event.content || '');
              streamingText = '';
            } else if (event.type === 'done') {
              const content = event.content || '';
              if (content && !confirmedText.includes(content)) {
                confirmedText += (confirmedText ? '\n\n' : '') + content;
              }
              streamingText = '';
            }

            // Terminal Mirroring
            if (event.type === 'tool_call' && event.tool === 'shell_execute' && event.args?.command) {
              terminalRef.current?.appendOutput(event.args?.terminal_id, `$ [agent] ${event.args.command}`);
            }
            if (event.type === 'tool_result' && event.tool === 'shell_execute') {
              const lastShellCall = [...accumulatedEvents].reverse().find(e => e.type === 'tool_call' && e.tool === 'shell_execute');
              terminalRef.current?.appendOutput(lastShellCall?.args?.terminal_id, event.result || '(no output)');
            }

            // Sync messages state
            let rawCombined = confirmedText;
            if (streamingText) rawCombined += (confirmedText ? '\n\n' : '') + streamingText;

            const cleanPreview = rawCombined
              .replace(/<continue>[\s\S]*?(?:<\/continue>|$)/ig, '')
              .replace(/<\/?continue>/ig, '')
              .replace(/<tool_calls?>[\s\S]*?(?:<\/tool_calls?>|$)/ig, '')
              .replace(/<\/?tool_calls?>/ig, '')
              .replace(/<\|eot_id\|>|<\|start_header_id\|>|<\|end_header_id\|>|<\|reserved_special_token_\d+\|>/ig, '');

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: cleanPreview.trim(), events: [...accumulatedEvents] }
                  : m
              )
            );
          } catch (e) { /* ignore parse errors */ }
        }
      }

      // Refresh file browser
      setRefreshFileTrigger(prev => prev + 1);

      // Auto-continue
      const lastDone = [...accumulatedEvents].reverse().find(e => e.type === 'done');
      const hadToolCalls = accumulatedEvents.some(e => e.type === 'tool_call');
      const doneContent = (lastDone?.content || '').toLowerCase();

      const hitStepLimit = doneContent.includes('maximum number of steps');
      const forwardIntentPhrases = ["let me", "let's", "i'll", "i will", "i need to", "i should", "next step", "to fix this", "will now"];
      const looksLikeUnfinished = forwardIntentPhrases.some(phrase => doneContent.includes(phrase));

      if (hadToolCalls && autoContinueCountRef.current < MAX_AUTO_CONTINUES && (hitStepLimit || looksLikeUnfinished)) {
        autoContinueCountRef.current += 1;
        setTimeout(() => {
          sendAgentMessage('Continue and complete the task. Execute the next step now.', true);
        }, 500);
      } else {
        autoContinueCountRef.current = 0;
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `Connect Error: ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendingMessage) return;
    const text = inputMessage;
    setInputMessage('');
    sendAgentMessage(text);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background dark:bg-[#0d1117]">
        <Loader2 className="h-10 w-10 animate-spin text-slate-500 mb-4" />
        <span className="text-slate-600 dark:text-slate-400 font-medium font-inter">Loading Workspace...</span>
      </div>
    );
  }

  const isRunning = podStatus?.status === 'running';

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-[#0d1117] overflow-hidden text-slate-900 dark:text-slate-300 font-inter">
      {/* GitHub Styled Header */}
      <header className="h-14 bg-white dark:bg-[#161b22] border-b border-border dark:border-[#30363d] px-4 flex items-center justify-between shrink-0 z-20 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clavis/pods')}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] gap-2 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Hub
          </Button>
          <div className="h-6 w-px bg-border dark:bg-[#30363d]" />
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-300">
              MentisPod: <span className="text-slate-500 dark:text-slate-400 font-mono">{sessionId}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] w-8 h-8 rounded-lg transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="h-6 w-px bg-border dark:bg-[#30363d]" />

          {podStatus && (
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border transition-all shadow-sm",
              isRunning
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-slate-100 dark:bg-[#21262d] text-slate-600 dark:text-slate-400 border-border dark:border-[#30363d]"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
              )} />
              {podStatus.status}
            </div>
          )}
          
          {!isRunning && (
            <Button
              size="sm"
              onClick={handleStartPod}
              disabled={starting}
              className="bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-900 dark:text-slate-300 gap-2 h-8 border border-border dark:border-[#30363d] hover:border-slate-400 dark:hover:border-[#8b949e] shadow-sm transition-all active:scale-95 font-semibold"
            >
              {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              {starting ? 'Starting...' : 'Start Pod'}
            </Button>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* LEFT: Agent Chat (50%) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full bg-background dark:bg-[#0d1117] flex flex-col border-r border-border dark:border-[#30363d] transition-colors">
              {/* Message List */}
              <div
                ref={messageListRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-minimal"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                    {/* Role Label */}
                    <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">
                      {msg.role}
                    </span>

                    <div className={cn(
                      "max-w-[90%] rounded-xl px-4 py-3 text-sm shadow-md border transition-all",
                      msg.role === 'user' 
                        ? "bg-slate-800 dark:bg-[#30363d] border-slate-700 dark:border-[#484f58] text-white dark:text-slate-200 self-end ml-12" 
                        : msg.role === 'system' 
                          ? "bg-slate-50 dark:bg-[#161b22] border-border dark:border-[#30363d] text-slate-500 dark:text-slate-400 italic" 
                          : "bg-white dark:bg-[#161b22] border-border dark:border-[#30363d] text-slate-900 dark:text-slate-300 mr-12"
                    )}>
                      {/* Render agent events for assistant */}
                      {msg.role === 'assistant' && msg.events && msg.events.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {msg.events.map((event, idx) => (
                            <AgentEventCard key={idx} event={event} />
                          ))}
                        </div>
                      )}

                      {/* Message Content */}
                      {msg.content && (
                        <MarkdownContent
                          content={msg.content}
                          isDarkTheme={resolvedTheme === 'dark'}
                          className="prose-sm max-w-none"
                        />
                      )}

                      {/* Working Indicator */}
                      {msg.role === 'assistant' && !msg.content && (!msg.events || msg.events.length === 0) && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-xs font-medium">Agent is processing...</span>
                        </div>
                      )}

                      <div className={cn("text-[9px] mt-2 font-mono", 
                        msg.role === 'user' 
                          ? "text-slate-300 dark:text-slate-400 opacity-80" 
                          : "text-slate-500 dark:text-slate-400 opacity-80"
                      )}>
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border dark:border-[#30363d] bg-white dark:bg-[#161b22] transition-colors">
                <div className="relative group">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask the agent to do something... (Shift+Enter for new line)"
                    className="min-h-[80px] bg-slate-50 dark:bg-[#0d1117] border-border dark:border-[#30363d] text-slate-900 dark:text-slate-300 placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-[#8b949e] focus:ring-0 focus-visible:ring-0 outline-none transition-all rounded-xl pr-24 scrollbar-minimal text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !inputMessage.trim()}
                    className={cn(
                      "absolute bottom-3 right-3 h-8 px-4 rounded-lg shadow-md transition-all gap-2 font-semibold",
                      sendingMessage ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600" : "bg-slate-900 dark:bg-[#21262d] hover:bg-slate-800 dark:hover:bg-[#30363d] text-white dark:text-slate-300 border border-slate-800 dark:border-[#30363d] hover:border-slate-600 dark:hover:border-[#8b949e]"
                    )}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-white dark:text-slate-400 group-hover:text-slate-300" />
                        <span className="text-white dark:text-slate-300 group-hover:text-slate-300 text-xs font-semibold">Send</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border dark:bg-[#30363d] w-1.5 hover:bg-slate-400 dark:hover:bg-[#8b949e] transition-colors" />

          {/* RIGHT: File Browser + Terminal (50%) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="relative h-full bg-background dark:bg-[#0d1117]">

              <ResizablePanelGroup direction="vertical">
                {/* TOP: File Browser (60%) */}
                <ResizablePanel defaultSize={60} minSize={20}>
                  <div className="h-full p-2 relative">
                    {!isRunning && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-[#0d1117]/40 backdrop-blur-[2px] p-4 text-center rounded-lg m-2">
                        <div className="max-w-xs w-full bg-white dark:bg-[#161b22] p-6 rounded-2xl shadow-2xl border border-border dark:border-[#30363d] scale-up-center transition-all">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-300 mb-2">Environment Offline</h2>
                          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                            Launch the pod to manage files.
                          </p>
                          <Button
                            size="sm"
                            onClick={handleStartPod}
                            disabled={starting}
                            className="w-full bg-slate-900 dark:bg-[#21262d] hover:bg-slate-800 dark:hover:bg-[#30363d] text-white dark:text-slate-300 gap-2 font-bold"
                          >
                            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                            {starting ? 'Starting...' : 'Launch'}
                          </Button>
                        </div>
                      </div>
                    )}
                    <ClavisFileBrowser
                      sessionId={sessionId!}
                      refreshTrigger={refreshFileTrigger}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-border dark:bg-[#30363d] h-1.5 hover:bg-slate-400 dark:hover:bg-[#8b949e] transition-colors" />

                {/* BOTTOM: Terminal (40%) */}
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="h-full p-2">
                    <ClavisTerminal ref={terminalRef} sessionId={sessionId!} />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* Global Error Banner */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-lg w-full z-50">
          <Alert variant="destructive" className="shadow-2xl bg-red-50 dark:bg-[#a01100]/10 border-red-200 dark:border-[#a01100]/30 text-red-600 dark:text-[#ff7b72] backdrop-blur-md font-inter">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between font-medium">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 px-2 hover:bg-black/5 dark:hover:bg-white/10">Dismiss</Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
