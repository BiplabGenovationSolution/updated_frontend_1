import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { useClavisWebSocket } from '@/hooks/useClavisWebSocket';
import { useToast } from '@/hooks/use-toast';
import { SessionSharing } from './SessionSharing';

import {
  Search, Code2, Folder, Terminal, Monitor,
  Play, Square, Clock, AlertCircle, RefreshCw, X, GitBranch, Shield, Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, Box, Divider, Grid, LinearProgress, Card, CardContent, Typography, Chip, List, ListItem, ListItemText, IconButton, DialogActions, Dialog as MUIDialog, DialogTitle as MUIDialogTitle, DialogContent as MUIDialogContent, Button as MUIButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ComputerIcon from '@mui/icons-material/Computer';

interface SessionCodebase {
  codebase_id: string;
  user_id: string;
  display_name: string;
  source_type: string;
  source_url?: string;
  total_files: number;
}

interface PodSession {
  session_id: string;
  assessment_mode: string | null;
  codebase: SessionCodebase | null;
  created_at: string;
  expires_at?: string | null;
  ide_url: string;
  ready: boolean;
  mode?: string;
  status: string;
  pod_ip?: string | null;
}

interface Codebase {
  codebase_id: string;
  type: 'git' | 'folder';
  display_name: string;
  repo_url?: string;
  file_count: number;
}

export const ClavisPodManager: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<PodSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'run' | 'stop'; sessionId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'running' | 'stopped'>('all');
  const [viewSessionId, setViewSessionId] = useState<string | null>(null);
  const [viewSessionDetail, setViewSessionDetail] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [selectedMode, setSelectedMode] = useState<'testing' | 'create'>('create');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Codebase selection
  const [codebases, setCodebases] = useState<Codebase[]>([]);
  const [useCodebase, setUseCodebase] = useState<'scratch' | 'existing'>('scratch');
  const [selectedCodebaseId, setSelectedCodebaseId] = useState<string>('none');

  // WebSocket for real-time updates
  useClavisWebSocket(user?.user_id || '', {
    onUpdate: (update) => {
      console.log('Pod update received:', update);
      fetchSessions();
    },
  });

  const fetchSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const response = await apiClient.clavis.getPodSessions();
      setSessions(response.data.sessions || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch sessions');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchCodebases = async () => {
    try {
      const response = await apiClient.clavis.getCodebases();
      setCodebases(response.data.codebases || []);
    } catch (err: any) {
      console.error('Failed to fetch codebases:', err);
    }
  };

  const handleViewSession = async (sessionId: string) => {
    setViewSessionId(sessionId);
    setViewSessionDetail(null);
    setViewLoading(true);
    try {
      const response = await apiClient.clavis.getPodSession(sessionId);
      setViewSessionDetail(response.data);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to load session', description: err.response?.data?.detail || 'An error occurred.', duration: 2000 });
      setViewSessionId(null);
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    if (createDialogOpen) {
      fetchCodebases();
    }
  }, [createDialogOpen]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        mode: selectedMode,
      };

      if (useCodebase === 'existing' && selectedCodebaseId && selectedCodebaseId !== 'none') {
        payload.codebase_id = selectedCodebaseId;
        payload.start_from_scratch = false;
      } else {
        payload.start_from_scratch = true;
      }

      const response = await apiClient.clavis.createPodSession(payload);

      if (response.data.success) {
        setCreateDialogOpen(false);
        setUseCodebase('scratch');
        setSelectedCodebaseId('none');
        toast({
          title: "Pod Created",
          description: "Your new development environment is spinning up.",
          duration: 2000
        });
        fetchSessions();
        setSearchQuery('');
      } else {
        setError(response.data.error || 'Failed to create session');
      }
    } catch (err: any) {
      const is429 = err?.status === 429;
      setError(
        is429
          ? "Pod creation rate limit reached. Please wait a moment before creating another pod."
          : err.response?.data?.detail || err.message || 'Failed to create session'
      );
    } finally {
      setLoading(false);
    }
  };

  // Destroy session — permanently deletes session data and workspace files
  const handleDestroySession = async (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDestroySession = async () => {
    if (!sessionToDelete) return;
    try {
      setLoading(true);
      setDeleteConfirmOpen(false);
      await apiClient.clavis.deletePodSession(sessionToDelete, { permanent: true });
      setSessionToDelete(null);
      fetchSessions();
    } catch (err: any) {
      const is429 = err?.status === 429;
      toast({
        variant: "destructive",
        title: is429 ? "Too Many Requests" : "Failed to Start Pod",
        description: is429
          ? "You've hit the pod creation rate limit. Please wait a moment and try again."
          : err.response?.data?.detail || err.message || 'An unexpected error occurred.',
        duration: is429 ? 5000 : 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Execute the confirmed run/stop action
  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, sessionId } = confirmAction;
    setConfirmAction(null);
    setActionLoadingId(sessionId);
    try {
      if (type === 'run') {
        const response = await apiClient.clavis.startPodSession(sessionId);
        const data = response.data || response;
        // Response: { success: true, session: { session_id, ... } }
        const returnedSessionId: string =
          data.session?.session_id || data.session_id || sessionId;
        toast({
          title: 'Pod Started',
          description: 'Opening your workspace...',
          duration: 1500,
        });
        // Navigate directly to the IDE page
        navigate(`/clavis/ide/${returnedSessionId}`);
      } else {
        await apiClient.clavis.stopPodSession(sessionId);
        fetchSessions();
        toast({
          title: 'Pod Stopped',
          description: 'Your workspace has been paused. Files are preserved.',
          duration: 2500,
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: `Failed to ${type} pod`,
        description: err.message || 'An unexpected error occurred.',
        duration: 4000,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open IDE — calls /start to activate/retrieve session, then navigates using session_id
  const handleOpenIDE = async (session: PodSession) => {
    setActionLoadingId(session.session_id);
    try {
      const response = await apiClient.clavis.startPodSession(session.session_id);
      const data = response.data || response;

      // Response structure: { success: true, session: { session_id, ... } }
      const sessionData = data.session || data;
      const sessionId: string = sessionData.session_id || session.session_id;

      // Check for ide_url in response (may be present in some deployments)
      const ideUrl: string = sessionData.ide_url || data.ide_url || '';

      if (ideUrl && !ideUrl.startsWith('/')) {
        window.open(ideUrl, '_blank');
        return;
      }

      // Navigate to internal IDE page using session_id
      navigate(`/clavis/ide/${sessionId}`);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to open pod',
        description: err.message || 'Could not start the pod session.',
        duration: 4000,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const searchMatch = !searchQuery ||
      session.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.codebase?.display_name && session.codebase.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const tabMatch = activeTab === 'all' ||
      (activeTab === 'running' ? session.status === 'running' : session.status !== 'running');
    return searchMatch && tabMatch;
  });

  const getTimeRemainingString = (expiresAt?: string | null) => {
    if (!expiresAt) return '';
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return '0m';
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto pt-10 pb-24 px-8">

      {/* Header & Search Area */}
      <div className="flex flex-col items-center mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mb-8 tracking-tight">
          Manage Development Pods
        </h1> */}
        <h1 className="text-xl sm:text-3xl font-semibold mb-8 tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
          Manage Development Pods
        </h1>

        <div className="w-full relative bg-white dark:bg-[#1e2433] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50">
          <div className="flex items-center w-full relative">
            <Search className="absolute left-6 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search active pods by ID or Codebase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-6 pl-14 pr-4 bg-transparent outline-none dark:text-white placeholder:text-slate-400 rounded-none mix-blend-normal"
              style={{ boxShadow: 'none' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-6 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 animate-in slide-in-from-top-2">
          <Badge variant="destructive" className="w-full p-3 font-normal justify-start rounded-xl flex items-center border border-red-500/20 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </Badge>
        </div>
      )}

      {/* Tabs & List */}
      <div className="w-full bg-white dark:bg-[#1e2433] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 sm:p-6 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2 border-b border-slate-200 dark:border-slate-800 px-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center transition-colors ${activeTab === 'all' ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
            Sessions
            <Badge className={`ml-2 rounded-full px-2 py-0 border-0 ${activeTab === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {sessions.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('running')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center transition-colors ${activeTab === 'running' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
            Running Sessions
            <Badge className={`ml-2 rounded-full px-2 py-0 border-0 ${activeTab === 'running' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {sessions.filter(s => s.status === 'running').length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('stopped')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center transition-colors ${activeTab === 'stopped' ? 'border-slate-500 text-slate-700 dark:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
            Stopped Sessions
            <Badge className={`ml-2 rounded-full px-2 py-0 border-0 ${activeTab === 'stopped' ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {sessions.filter(s => s.status !== 'running').length}
            </Badge>
          </button>
        </div>

        {/* The List Container */}
        <div className="relative">
          {/* Top Gradient Overlay */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent dark:from-[#1e2433] dark:to-transparent z-10"></div>

          <div className="flex flex-col max-h-[500px] overflow-y-auto scrollbar-minimal">
            {filteredSessions.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                <Terminal className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4 stroke-[1]" />
                {searchQuery ? "No pods found matching your search." : "No active sessions. Create a new pod to get started."}
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.session_id} className="group flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-gray-200 dark:hover:bg-slate-800 transition-all duration-200 cursor-default">
                  {/* Left: Title & Mode Badge */}
                  <div className="flex flex-col min-w-[200px] mb-3 sm:mb-0">
                    <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate w-full" title={session.codebase ? session.codebase.display_name : 'Scratch Workspace'}>
                      {session.codebase ? session.codebase.display_name : 'Scratch Workspace'}
                    </span>
                    <div>
                      <span className="text-[9px] px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-full inline-flex font-medium uppercase tracking-wider bg-white dark:bg-slate-800/50 group-hover:bg-white/50 dark:group-hover:bg-slate-700/50 transition-colors">
                        {session.mode}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Horizontal Data */}
                  <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium mr-4">
                    <span className="text-slate-500 dark:text-slate-400 min-w-[45px]">
                      {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>

                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.05em]
                     ${session.status === 'running' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                        session.status === 'pending' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' :
                          'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                      }`}>
                      {session.status}
                    </span>

                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      {/* <span className="truncate max-w-[120px]" title={session.user_email}>{session.user_email.split('@')[0]}</span> */}
                      <span className="text-[10px] opacity-70">•</span>
                      {session.codebase?.source_type === 'git' ? (
                        <span className="flex items-center"><GitBranch className="h-3 w-3 mr-1 opacity-70" /> Repository</span>
                      ) : (
                        <span className="flex items-center"><Folder className="h-3 w-3 mr-1 opacity-70" /> Folder</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-1 min-w-[220px]">
                    {/* Dashed line or time remaining */}
                    <div className="flex items-center text-xs font-mono font-medium justify-center mr-3 w-16">
                      {session.status === 'running' ? (
                        <span className="text-emerald-500 dark:text-emerald-400 border flex items-center whitespace-nowrap">
                          <Clock className="w-3 h-3 mr-1 opacity-70" />
                          +{getTimeRemainingString(session.expires_at)}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 tracking-[0.2em] font-bold opacity-60">----</span>
                      )}
                    </div>

                    {session.status === 'running' ? (
                      <>
                        <Button variant="outline" size="sm" className="h-[26px] px-2.5 text-xs font-semibold text-indigo-600 bg-white/80 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 dark:bg-transparent dark:border-indigo-500/30 dark:hover:bg-indigo-500/10 mr-2 shadow-sm rounded-md transition-all group-hover:bg-white dark:group-hover:bg-slate-800" disabled={actionLoadingId === session.session_id || loading} onClick={() => handleOpenIDE(session)}>
                          {actionLoadingId === session.session_id ? <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> : <Monitor className="h-3 w-3 mr-1.5" />} Open
                        </Button>
                        <Button variant="outline" size="sm" className="h-[26px] px-2.5 text-xs font-semibold text-amber-600 bg-white/80 hover:text-amber-700 hover:bg-amber-50 border-amber-200 dark:bg-transparent dark:border-amber-500/30 dark:hover:bg-amber-500/10 mr-2 shadow-sm rounded-md transition-all group-hover:bg-white dark:group-hover:bg-slate-800" disabled={actionLoadingId === session.session_id || loading} onClick={() => setConfirmAction({ type: 'stop', sessionId: session.session_id })}>
                          {actionLoadingId === session.session_id ? <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> : <Square className="h-3 w-3 mr-1.5" />} Stop
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="h-[26px] px-2.5 text-xs font-semibold text-emerald-500 bg-white/80 hover:text-emerald-600 hover:bg-emerald-50 border-emerald-200 dark:bg-transparent dark:border-emerald-500/30 dark:hover:bg-emerald-500/10 mr-2 shadow-sm rounded-md transition-all group-hover:bg-white dark:group-hover:bg-slate-800" disabled={actionLoadingId === session.session_id || loading} onClick={() => setConfirmAction({ type: 'run', sessionId: session.session_id })}>
                        {actionLoadingId === session.session_id ? <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> : <Play className="h-3 w-3 mr-1.5" />} Run
                      </Button>
                    )}

                    <Button variant="ghost" size="icon" className="h-[28px] w-[28px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50" onClick={() => handleViewSession(session.session_id)}>
                      {viewLoading && viewSessionId === session.session_id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>

                  </div>
                </div>
              ))
            )}
          </div>
          {/* Bottom Gradient Overlay */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-[#1e2433] dark:to-transparent z-10"></div>
        </div>
      </div>

      {/* Session Detail Dialog */}
      <Dialog open={!!viewSessionId} onOpenChange={(open) => { if (!open) { setViewSessionId(null); setViewSessionDetail(null); } }}>
        <DialogContent hideCloseButton className="sm:max-w-lg dark:bg-[#1e2433] dark:border-[#2d3545]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-semibold dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-500" /> Session Details
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs font-mono">{viewSessionId}</DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
            </div>
          ) : viewSessionDetail ? (
            <div className="space-y-1 text-sm">
              {Object.entries(viewSessionDetail.pod_info || viewSessionDetail)
                .filter(([key]) => !['workspace', 'assessment_mode', 'policy_content'].includes(key))
                .map(([key, value]) => {
                  const dateKeys = ['created_at', 'expires_at'];
                  let displayValue: React.ReactNode;
                  if (value === null || value === undefined || value === '') {
                    displayValue = <span className="text-slate-300 dark:text-slate-600">—</span>;
                  } else if (dateKeys.includes(key) && typeof value === 'string') {
                    const d = new Date(value);
                    displayValue = d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  } else {
                    displayValue = String(value);
                  }
                  return (
                    <div key={key} className="flex gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="w-36 shrink-0 text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide pt-0.5">{key.replace(/_/g, ' ')}</span>
                      <span className="flex-1 text-slate-800 dark:text-slate-100 font-mono text-xs break-all">{displayValue}</span>
                    </div>
                  );
                })}
            </div>
          ) : null}

          <DialogFooter className="mt-4">
            <Button size="sm" variant="outline" onClick={() => { setViewSessionId(null); setViewSessionDetail(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modern Create Pod Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-[#1e2433] dark:border-[#2d3545]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl dark:text-white">Create Development Pod</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Spin up a new secure environment for development or testing.
            </DialogDescription>
          </DialogHeader>

          <Box className="space-y-6">
            <div className="space-y-3">
              <Label className="dark:text-slate-200">Pod Mode</Label>
              <RadioGroup value={selectedMode} onValueChange={(v: 'testing' | 'create') => setSelectedMode(v)} className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <RadioGroupItem value="create" id="mode-create" className="peer sr-only" />
                  <Label htmlFor="mode-create" className="flex flex-col items-center justify-between rounded-md border-2 border-slate-200 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:text-indigo-600 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white dark:peer-data-[state=checked]:border-indigo-500 dark:peer-data-[state=checked]:text-indigo-400 cursor-pointer transition-all">
                    <Code2 className="mb-3 h-6 w-6" />
                    Create Mode
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="testing" id="mode-testing" className="peer sr-only" />
                  <Label htmlFor="mode-testing" className="flex flex-col items-center justify-between rounded-md border-2 border-slate-200 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:text-indigo-600 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white dark:peer-data-[state=checked]:border-indigo-500 dark:peer-data-[state=checked]:text-indigo-400 cursor-pointer transition-all">
                    <Shield className="mb-3 h-6 w-6" />
                    Testing Mode
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="dark:text-slate-200">Starting Point</Label>
              <Select value={useCodebase} onValueChange={(v: 'scratch' | 'existing') => setUseCodebase(v)}>
                <SelectTrigger className="w-full dark:bg-[#0f1219] dark:border-slate-700 dark:text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#1e2433] dark:border-slate-700 dark:text-white">
                  <SelectItem value="scratch">Start From Scratch</SelectItem>
                  <SelectItem value="existing">Use Existing Codebase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {useCodebase === 'existing' && (
              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in">
                <Label className="dark:text-slate-200">Select Codebase</Label>
                <Select value={selectedCodebaseId} onValueChange={setSelectedCodebaseId}>
                  <SelectTrigger className="w-full dark:bg-[#0f1219] dark:border-slate-700 dark:text-white">
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1e2433] dark:border-slate-700 dark:text-white max-h-56">
                    <SelectItem value="none">Choose a codebase...</SelectItem>
                    {codebases.map((codebase) => (
                      <SelectItem key={codebase.codebase_id} value={codebase.codebase_id}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-slate-400" />
                          <span>{codebase.display_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Divider sx={{ my: 3 }} />

            <Alert severity="info" sx={{ mt: 1 }}>
              Sessions persist until you explicitly delete them.
            </Alert>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Session Sharing Dialog */}
      {selectedSessionId && (
        <SessionSharing
          sessionId={selectedSessionId}
          open={sharingDialogOpen}
          onClose={() => {
            setSharingDialogOpen(false);
            setSelectedSessionId(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <MUIDialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setSessionToDelete(null); }}
      >
        <MUIDialogTitle>Permanently Delete Session?</MUIDialogTitle>
        <MUIDialogContent>
          <Typography>
            This will permanently delete the session, all workspace files, terminal history,
            and conversation data. This action cannot be undone.
          </Typography>
        </MUIDialogContent>
        <DialogActions>
          <MUIButton onClick={() => { setDeleteConfirmOpen(false); setSessionToDelete(null); }}>
             Cancel
          </MUIButton>
          <MUIButton onClick={confirmDestroySession} color="error" variant="contained">
            Delete Permanently
          </MUIButton>
        </DialogActions>
      </MUIDialog>

      {/* Run/Stop Confirmation Dialog */}
      <MUIDialog open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <MUIDialogTitle>
          {confirmAction?.type === 'run' ? 'Start Pod Session?' : 'Stop Pod Session?'}
        </MUIDialogTitle>
        <MUIDialogContent>
          <Typography>
            {confirmAction?.type === 'run'
              ? 'This will wake up the pod environment. Your workspace files will be preserved.'
              : 'This will put the pod to sleep to save resources. Your workspace files will be preserved.'}
          </Typography>
        </MUIDialogContent>
        <DialogActions>
          <MUIButton onClick={() => setConfirmAction(null)}>Cancel</MUIButton>
          <MUIButton
            onClick={executeConfirmAction}
            color={confirmAction?.type === 'run' ? 'success' : 'warning'}
            variant="contained"
          >
            {confirmAction?.type === 'run' ? 'Start Pod' : 'Stop Pod'}
          </MUIButton>
        </DialogActions>
      </MUIDialog>
    </div>
  );
};

export default ClavisPodManager;
