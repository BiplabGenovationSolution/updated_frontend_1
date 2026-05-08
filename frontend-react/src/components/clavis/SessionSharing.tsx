/**
 * Clavis Session Sharing
 * Share development pods with team members
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api';

interface SharedUser {
  user_id: string;
  email: string;
  permission: 'view' | 'edit';
  shared_at: string;
}

interface SessionSharingProps {
  sessionId: string;
  open: boolean;
  onClose: () => void;
}

export const SessionSharing: React.FC<SessionSharingProps> = ({
  sessionId,
  open,
  onClose,
}) => {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch shared users
  const fetchSharedUsers = async () => {
    try {
      const response = await apiClient.get(`/clavis/pods/session/${sessionId}/shared`);
      setSharedUsers(response.data.shared_users || []);
    } catch (err: any) {
      console.error('Failed to fetch shared users:', err);
    }
  };

  // Fetch available users (organization members)
  const fetchAvailableUsers = async () => {
    try {
      const response = await apiClient.get('/users/organization/members');
      setAvailableUsers(response.data.members || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSharedUsers();
      fetchAvailableUsers();
      generateShareLink();
    }
  }, [open, sessionId]);

  // Generate share link
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/clavis/join/${sessionId}`;
    setShareLink(link);
  };

  // Share with user
  const handleShareWithUser = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post(`/clavis/pods/session/${sessionId}/share`, {
        user_id: selectedUser.user_id,
        permission,
      });

      setSuccess(`Shared with ${selectedUser.email}`);
      setSelectedUser(null);
      fetchSharedUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to share session');
    } finally {
      setLoading(false);
    }
  };

  // Revoke access
  const handleRevokeAccess = async (userId: string) => {
    try {
      await apiClient.delete(`/clavis/pods/session/${sessionId}/share/${userId}`);
      setSuccess('Access revoked');
      fetchSharedUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to revoke access');
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setSuccess('Link copied to clipboard!');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShareIcon />
          <Typography variant="h6">Share Session</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
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

        {/* Share Link */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Share Link
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              value={shareLink}
              InputProps={{
                readOnly: true,
              }}
              size="small"
            />
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleCopyLink}
            >
              Copy
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Anyone with this link can join the session (read-only by default)
          </Typography>
        </Box>

        {/* Share with Specific User */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Share with Team Member
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Autocomplete
              fullWidth
              options={availableUsers.filter(
                (user) => !sharedUsers.some((su) => su.user_id === user.user_id)
              )}
              getOptionLabel={(option) => option.email || option.name}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select user" size="small" />
              )}
            />

            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Permission</InputLabel>
              <Select
                value={permission}
                label="Permission"
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              >
                <MenuItem value="view">View Only</MenuItem>
                <MenuItem value="edit">Edit</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleShareWithUser}
              disabled={!selectedUser || loading}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* Shared Users List */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Shared With ({sharedUsers.length})
          </Typography>

          {sharedUsers.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Not shared with anyone yet
            </Typography>
          )}

          <List>
            {sharedUsers.map((user) => (
              <ListItem key={user.user_id}>
                <ListItemText
                  primary={user.email}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={user.permission}
                        size="small"
                        color={user.permission === 'edit' ? 'primary' : 'default'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Shared {new Date(user.shared_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRevokeAccess(user.user_id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Info */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Permissions:</strong>
          </Typography>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            <li><strong>View:</strong> Can see files and terminal output</li>
            <li><strong>Edit:</strong> Can execute commands and modify files</li>
          </ul>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionSharing;
