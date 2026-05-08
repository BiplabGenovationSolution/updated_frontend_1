/**
 * Clavis Pod Terminal
 * Execute shell commands in development pods
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api';
import { FileUpload } from './FileUpload';

interface CommandHistory {
  command: string;
  output: string;
  error: string;
  timestamp: Date;
  exitCode: number;
}

export const ClavisPodTerminal: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [command, setCommand] = useState('');
  const [workingDir, setWorkingDir] = useState('/workspace');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [podStatus, setPodStatus] = useState<any>(null);

  const terminalRef = useRef<HTMLDivElement>(null);

  // Fetch pod status
  const fetchPodStatus = async () => {
    try {
      const response = await apiClient.get(`/clavis/pods/session/${sessionId}`);
      setPodStatus(response.data.pod_info);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch pod status');
    }
  };

  // Fetch files
  const fetchFiles = async () => {
    try {
      const response = await apiClient.get(`/clavis/pods/session/${sessionId}/files`, {
        params: { directory: workingDir },
      });
      setFiles(response.data.files || []);
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
    }
  };

  useEffect(() => {
    fetchPodStatus();
    fetchFiles();
  }, [sessionId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Execute command
  const executeCommand = async () => {
    if (!command.trim()) return;

    const cmd = command;
    setCommand('');
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/clavis/pods/session/${sessionId}/execute`, {
        command: cmd,
        working_dir: workingDir,
      });

      const result: CommandHistory = {
        command: cmd,
        output: response.data.output || '',
        error: response.data.error || '',
        exitCode: response.data.exit_code || 0,
        timestamp: new Date(),
      };

      setHistory((prev) => [...prev, result]);

      // Update files if command might have changed filesystem
      if (cmd.includes('mkdir') || cmd.includes('touch') || cmd.includes('cat >')) {
        fetchFiles();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to execute command');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  // Clear terminal
  const clearTerminal = () => {
    setHistory([]);
  };

  // View file
  const viewFile = async (filePath: string) => {
    try {
      const response = await apiClient.get(`/clavis/pods/session/${sessionId}/file`, {
        params: { file_path: filePath },
      });

      const result: CommandHistory = {
        command: `cat ${filePath}`,
        output: response.data.content || '',
        error: '',
        exitCode: 0,
        timestamp: new Date(),
      };

      setHistory((prev) => [...prev, result]);
      setTabValue(0); // Switch to terminal tab
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to read file');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/clavis/pods')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ ml: 2 }}>
          Pod Terminal: {sessionId}
        </Typography>
        {podStatus && (
          <Chip
            label={podStatus.status}
            color={podStatus.status === 'running' ? 'success' : 'warning'}
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Terminal" />
          <Tab label="Files" />
          <Tab label="Upload" />
        </Tabs>
      </Paper>

      {/* Terminal Tab */}
      {tabValue === 0 && (
        <Box>
          {/* Terminal Output */}
          <Paper
            ref={terminalRef}
            sx={{
              p: 2,
              bgcolor: '#1e1e1e',
              color: '#d4d4d4',
              fontFamily: 'monospace',
              fontSize: '14px',
              height: '500px',
              overflowY: 'auto',
              mb: 2,
            }}
          >
            {history.length === 0 && (
              <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                Welcome to Clavis Pod Terminal
                <br />
                Type commands and press Enter to execute
                <br />
                <br />
                Examples:
                <br />
                • ls -la
                <br />
                • cat {'>'} hello.js {'<<'} EOF
                <br />
                • npm install
                <br />
                • python app.py
                <br />
              </Typography>
            )}

            {history.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography sx={{ color: '#4ec9b0', fontFamily: 'monospace' }}>
                  $ {item.command}
                </Typography>
                {item.output && (
                  <Typography
                    sx={{ color: '#d4d4d4', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                  >
                    {item.output}
                  </Typography>
                )}
                {item.error && (
                  <Typography
                    sx={{ color: '#f48771', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                  >
                    {item.error}
                  </Typography>
                )}
                {item.exitCode !== 0 && (
                  <Typography sx={{ color: '#f48771', fontFamily: 'monospace' }}>
                    Exit code: {item.exitCode}
                  </Typography>
                )}
              </Box>
            ))}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography sx={{ color: '#808080', fontFamily: 'monospace' }}>
                  Executing...
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Command Input */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Working Directory"
                value={workingDir}
                onChange={(e) => setWorkingDir(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearTerminal}
                size="small"
              >
                Clear
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter command..."
                disabled={loading}
                multiline
                maxRows={4}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={executeCommand}
                disabled={loading || !command.trim()}
              >
                Execute
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Press Enter to execute • Shift+Enter for new line
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Files Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2, height: '600px', overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Files in {workingDir}</Typography>
            <Button size="small" onClick={fetchFiles} startIcon={<FolderIcon />}>
              Refresh
            </Button>
          </Box>

          {files.length === 0 && (
            <Typography color="text.secondary">No files found</Typography>
          )}

          <List>
            {files.map((file, index) => (
              <ListItem
                key={index}
                button
                onClick={() => viewFile(file)}
              >
                <FileIcon sx={{ mr: 2 }} />
                <ListItemText
                  primary={file}
                  primaryTypographyProps={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Upload Tab */}
      {tabValue === 2 && (
        <FileUpload
          sessionId={sessionId!}
          targetPath={workingDir}
          onUploadComplete={fetchFiles}
        />
      )}
    </Box>
  );
};

export default ClavisPodTerminal;
