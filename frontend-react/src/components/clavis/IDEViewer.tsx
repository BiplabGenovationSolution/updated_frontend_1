/**
 * Clavis IDE Viewer
 * Completely transformed into the Interactive Workspace UI
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api';
import { ClavisChat } from '@/components/chat/agents/ClavisChat';
import { PodConsolePanel } from '@/components/clavis/PodConsolePanel';
import { useChatContext } from '@/context/chat-context';

export const ClavisIDEViewer: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { setSelectedAgent, setSelectedCodebase, setSelectedCodebaseName } = useChatContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [podStatus, setPodStatus] = useState<any>(null);

  const { data: codebasesData } = useQuery({
    queryKey: ['codebases'],
    queryFn: () => apiClient.getCodebases(),
  });

  // Fetch pod info
  const fetchPodInfo = async () => {
    if (!sessionId) return;
    try {
      // Don't set loading back to true once we have data to avoid flickering
      if (!podStatus) setLoading(true);
      setError(null);

      const response = await apiClient.getClavisPodSession(sessionId);
      console.log("🔍 POD INFO RESPONSE:", response);

      if (response.success && response.data) {
        // Find pod info
        const podInfo = response.data.pod_info || response.data;
        setPodStatus(podInfo);
        console.log("🔍 POD INFO DATA:", podInfo);
      } else {
        setError('Failed to fetch pod information');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch pod information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodInfo();

    // Refresh pod status every 30 seconds
    const interval = setInterval(fetchPodInfo, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const codebaseId = podStatus?.codebase?.codebase_id || podStatus?.codebase_id;
  const codebase = (codebasesData?.data || []).find((cb: any) => cb.codebase_id === codebaseId);

  useEffect(() => {
    setSelectedAgent('clavis');
    if (codebaseId) {
      setSelectedCodebase(codebaseId);
    }
    if (codebase?.repo_name) {
      setSelectedCodebaseName(codebase.repo_name);
    }
  }, [codebaseId, codebase?.repo_name, setSelectedAgent, setSelectedCodebase, setSelectedCodebaseName]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>

      {/* Custom Header matching user screenshot */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <button
          onClick={() => navigate('/clavis/pods')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4 font-medium text-sm"
        >
          <ArrowBackIcon fontSize="small" className="mr-1" />
          Back to Hub
        </button>

        <div className="h-6 border-r border-gray-300 mr-4"></div>

        <h1 className="text-md font-bold text-gray-900 flex-1">
          MentisPod: {sessionId}
        </h1>

        {podStatus && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${podStatus.status === 'running'
            ? 'bg-green-100 text-green-800'
            : podStatus.status === 'stopped'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-yellow-100 text-yellow-800'
            }`}>
            {podStatus.status}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !podStatus && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">Loading Workspace...</Typography>
          </Box>
        </Box>
      )}

      {/* Interactive Workspace Panel */}
      {!loading && podStatus && (
        <div className="flex-1 w-full relative overflow-hidden bg-white">
          <ClavisChat
            chatId={null}
            sidePanel={<PodConsolePanel sessionId={sessionId!} />}
            forcedCodebaseId={codebaseId}
            forcedCodebaseName={codebase?.repo_name}
            hideCodebaseSelector
          />
        </div>
      )}
    </Box>
  );
};

export default ClavisIDEViewer;

/**
 * Clavis IDE Viewer
 * Interactive Workspace UI (Refactored)
 */
