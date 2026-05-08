/**
 * Clavis File Upload
 * Upload files to pod workspace
 */
import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api';

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  sessionId: string;
  targetPath?: string;
  onUploadComplete?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  sessionId,
  targetPath = '/workspace',
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove file from list
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload a single file
  const uploadFile = async (file: UploadFile, index: number): Promise<void> => {
    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const } : f))
      );

      // Read file content
      const content = await file.file.text();

      // Determine file path
      const filePath = `${targetPath}/${file.file.name}`;

      // Upload using cat command (write file content)
      const command = `cat > ${filePath} << 'CLAVIS_EOF'\n${content}\nCLAVIS_EOF`;

      const response = await apiClient.post(`/clavis/pods/session/${sessionId}/execute`, {
        command,
        working_dir: targetPath,
      });

      if (response.data.success) {
        // Mark as success
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: 'success' as const, progress: 100 } : f))
        );
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (err: any) {
      // Mark as error
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'error' as const,
                error: err.response?.data?.detail || err.message || 'Upload failed',
              }
            : f
        )
      );
    }
  };

  // Upload all pending files
  const handleUploadAll = async () => {
    setError(null);

    const pendingFiles = files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.status === 'pending');

    if (pendingFiles.length === 0) {
      setError('No files to upload');
      return;
    }

    // Upload files sequentially
    for (const { file, index } of pendingFiles) {
      await uploadFile(file, index);
    }

    // Notify completion
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  // Get upload summary
  const getUploadSummary = () => {
    const total = files.length;
    const success = files.filter((f) => f.status === 'success').length;
    const error = files.filter((f) => f.status === 'error').length;
    const pending = files.filter((f) => f.status === 'pending').length;
    const uploading = files.filter((f) => f.status === 'uploading').length;

    return { total, success, error, pending, uploading };
  };

  const summary = getUploadSummary();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Files to {targetPath}
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload Summary */}
      {files.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`Total: ${summary.total}`} size="small" />
          {summary.success > 0 && (
            <Chip label={`Success: ${summary.success}`} color="success" size="small" />
          )}
          {summary.error > 0 && (
            <Chip label={`Failed: ${summary.error}`} color="error" size="small" />
          )}
          {summary.pending > 0 && (
            <Chip label={`Pending: ${summary.pending}`} color="default" size="small" />
          )}
          {summary.uploading > 0 && (
            <Chip label={`Uploading: ${summary.uploading}`} color="primary" size="small" />
          )}
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <List sx={{ mb: 2, maxHeight: '300px', overflowY: 'auto' }}>
          {files.map((fileItem, index) => (
            <ListItem
              key={index}
              secondaryAction={
                fileItem.status === 'pending' && (
                  <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemIcon>
                {fileItem.status === 'success' && <CheckIcon color="success" />}
                {fileItem.status === 'error' && <ErrorIcon color="error" />}
                {(fileItem.status === 'pending' || fileItem.status === 'uploading') && (
                  <FileIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={fileItem.file.name}
                secondary={
                  <>
                    <Typography variant="caption" component="span">
                      {(fileItem.file.size / 1024).toFixed(2)} KB
                    </Typography>
                    {fileItem.status === 'uploading' && (
                      <LinearProgress sx={{ mt: 1 }} />
                    )}
                    {fileItem.error && (
                      <Typography variant="caption" color="error" display="block">
                        {fileItem.error}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Select Files
        </Button>

        <Button
          variant="contained"
          onClick={handleUploadAll}
          disabled={summary.pending === 0 || summary.uploading > 0}
        >
          Upload {summary.pending > 0 ? `(${summary.pending})` : 'All'}
        </Button>

        {files.length > 0 && (
          <Button variant="outlined" onClick={() => setFiles([])}>
            Clear All
          </Button>
        )}
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Files will be uploaded to <strong>{targetPath}</strong> in the pod workspace.
          Text files only (no binary files supported yet).
        </Typography>
      </Alert>
    </Paper>
  );
};

export default FileUpload;
