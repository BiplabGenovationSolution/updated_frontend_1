/**
 * Clavis Codebase Manager
 * Manage Git repositories and uploaded folders for pod sessions
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  GitHub as GitHubIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api';

interface Codebase {
  codebase_id: string;
  type: 'git' | 'folder';
  display_name: string;
  repo_url?: string;
  branch?: string;
  storage_path?: string;
  file_count: number;
  total_size: number;
  created_at: string;
  indexed_at: string;
}

export const CodebaseManager: React.FC = () => {
  const [codebases, setCodebases] = useState<Codebase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add Codebase Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Git Repository Form
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitDisplayName, setGitDisplayName] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitMaxFiles, setGitMaxFiles] = useState(100);
  const [gitSubmitting, setGitSubmitting] = useState(false);

  // Folder Upload Form
  const [folderFile, setFolderFile] = useState<File | null>(null);
  const [folderDisplayName, setFolderDisplayName] = useState('');
  const [folderMaxFiles, setFolderMaxFiles] = useState(100);
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch codebases
  const fetchCodebases = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/clavis/codebases');
      setCodebases(response.data.codebases || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch codebases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodebases();
  }, []);

  // Add Git repository
  const handleAddGitRepo = async () => {
    if (!gitRepoUrl || !gitDisplayName) {
      setError('Please fill in all required fields');
      return;
    }

    setGitSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.post('/clavis/codebases/git', {
        repo_url: gitRepoUrl,
        display_name: gitDisplayName,
        branch: gitBranch || 'main',
        max_files: gitMaxFiles,
      });

      setSuccess(`Git repository "${gitDisplayName}" added successfully`);
      setGitRepoUrl('');
      setGitDisplayName('');
      setGitBranch('main');
      setGitMaxFiles(100);
      setAddDialogOpen(false);
      fetchCodebases();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add Git repository');
    } finally {
      setGitSubmitting(false);
    }
  };

  // Handle folder file selection
  const handleFolderFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFolderFile(file);

      // Auto-fill display name from file name
      if (!folderDisplayName) {
        const name = file.name.replace('.zip', '');
        setFolderDisplayName(name);
      }
    }
  };

  // Add folder upload
  const handleAddFolder = async () => {
    if (!folderFile || !folderDisplayName) {
      setError('Please select a ZIP file and provide a display name');
      return;
    }

    setFolderSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', folderFile);
      formData.append('display_name', folderDisplayName);
      formData.append('max_files', folderMaxFiles.toString());

      const response = await apiClient.post('/clavis/codebases/folder', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`Folder "${folderDisplayName}" uploaded successfully`);
      setFolderFile(null);
      setFolderDisplayName('');
      setFolderMaxFiles(100);
      setAddDialogOpen(false);
      fetchCodebases();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload folder');
    } finally {
      setFolderSubmitting(false);
    }
  };

  // Delete codebase
  const handleDelete = async (codebaseId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete "${displayName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/clavis/codebases/${codebaseId}`);
      setSuccess(`Codebase "${displayName}" deleted successfully`);
      fetchCodebases();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete codebase');
    }
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Codebase Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCodebases}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Codebase
          </Button>
        </Box>
      </Box>

      {/* Error/Success Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && codebases.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CodeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No codebases yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a Git repository or upload a folder to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Your First Codebase
          </Button>
        </Paper>
      )}

      {/* Codebase Grid */}
      {!loading && codebases.length > 0 && (
        <Grid container spacing={3}>
          {codebases.map((codebase) => (
            <Grid item xs={12} md={6} lg={4} key={codebase.codebase_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {codebase.type === 'git' ? (
                      <GitHubIcon sx={{ mr: 1, color: 'primary.main' }} />
                    ) : (
                      <FolderIcon sx={{ mr: 1, color: 'warning.main' }} />
                    )}
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {codebase.display_name}
                    </Typography>
                    <Chip
                      label={codebase.type}
                      size="small"
                      color={codebase.type === 'git' ? 'primary' : 'warning'}
                    />
                  </Box>

                  {codebase.type === 'git' && codebase.repo_url && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {codebase.repo_url}
                    </Typography>
                  )}

                  {codebase.branch && (
                    <Chip label={`Branch: ${codebase.branch}`} size="small" sx={{ mb: 1 }} />
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Files: {codebase.file_count}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Size: {formatSize(codebase.total_size)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Added: {formatDate(codebase.created_at)}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(codebase.codebase_id, codebase.display_name)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Codebase Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Codebase</DialogTitle>

        <DialogContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="Git Repository" icon={<GitHubIcon />} iconPosition="start" />
            <Tab label="Upload Folder (ZIP)" icon={<FolderIcon />} iconPosition="start" />
          </Tabs>

          {/* Git Repository Tab */}
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Repository URL"
                placeholder="https://github.com/username/repo.git"
                value={gitRepoUrl}
                onChange={(e) => setGitRepoUrl(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Display Name"
                placeholder="My Project"
                value={gitDisplayName}
                onChange={(e) => setGitDisplayName(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Branch"
                placeholder="main"
                value={gitBranch}
                onChange={(e) => setGitBranch(e.target.value)}
                fullWidth
              />

              <TextField
                label="Max Files to Index"
                type="number"
                value={gitMaxFiles}
                onChange={(e) => setGitMaxFiles(parseInt(e.target.value))}
                fullWidth
                helperText="Maximum number of files to index for search (default: 100)"
              />

              <Alert severity="info">
                <Typography variant="body2">
                  The repository will be cloned and indexed for code search. Private repositories
                  require authentication (not yet supported).
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Folder Upload Tab */}
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFolderFileSelect}
                style={{ display: 'none' }}
              />

              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
              >
                {folderFile ? folderFile.name : 'Select ZIP File'}
              </Button>

              {folderFile && (
                <Alert severity="success">
                  <Typography variant="body2">
                    File selected: {folderFile.name} ({formatSize(folderFile.size)})
                  </Typography>
                </Alert>
              )}

              <TextField
                label="Display Name"
                placeholder="My Project"
                value={folderDisplayName}
                onChange={(e) => setFolderDisplayName(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Max Files to Index"
                type="number"
                value={folderMaxFiles}
                onChange={(e) => setFolderMaxFiles(parseInt(e.target.value))}
                fullWidth
                helperText="Maximum number of files to index for search (default: 100)"
              />

              <Alert severity="info">
                <Typography variant="body2">
                  Upload a ZIP file containing your project. The files will be extracted and
                  indexed for code search.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          {tabValue === 0 ? (
            <Button
              variant="contained"
              onClick={handleAddGitRepo}
              disabled={gitSubmitting || !gitRepoUrl || !gitDisplayName}
              startIcon={gitSubmitting ? <CircularProgress size={20} /> : <GitHubIcon />}
            >
              Add Repository
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleAddFolder}
              disabled={folderSubmitting || !folderFile || !folderDisplayName}
              startIcon={folderSubmitting ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              Upload Folder
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CodebaseManager;
