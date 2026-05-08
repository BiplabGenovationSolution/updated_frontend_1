/**
 * Clavis Create Mode
 * Build new applications using AI
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Code as CodeIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  description: string;
}

interface CreateStep {
  step: string;
  success: boolean;
  output?: string;
}

export const ClavisCreateMode: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [templates, setTemplates] = useState<Record<string, Template[]>>({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [projectName, setProjectName] = useState('');
  const [typescript, setTypescript] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Select Template', 'Configure Project', 'Create Application'];

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get('/clavis/pods/templates');
        setTemplates(response.data.templates);
      } catch (err: any) {
        setError('Failed to fetch templates');
      }
    };
    fetchTemplates();
  }, []);

  // Create application
  const handleCreate = async () => {
    if (!projectName || !selectedTemplate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/clavis/pods/session/${sessionId}/create`, {
        project_type: selectedTemplate,
        project_name: projectName,
        options: {
          typescript,
        },
      });

      if (response.data.success) {
        setResult(response.data);
        setActiveStep(3); // Show results
      } else {
        setError(response.data.error || 'Failed to create application');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  // Render template card
  const renderTemplateCard = (template: Template) => (
    <Grid item xs={12} sm={6} md={4} key={template.id}>
      <Card
        sx={{
          cursor: 'pointer',
          border: selectedTemplate === template.id ? '2px solid' : '1px solid',
          borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
        }}
        onClick={() => setSelectedTemplate(template.id)}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {template.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {template.description}
          </Typography>
        </CardContent>
        <CardActions>
          {selectedTemplate === template.id && (
            <Chip label="Selected" color="primary" size="small" />
          )}
        </CardActions>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create Application - {sessionId}
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 1: Select Template */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Select Project Template
          </Typography>

          {Object.entries(templates).map(([category, categoryTemplates]) => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, textTransform: 'capitalize' }}>
                {category.replace('_', ' ')}
              </Typography>
              <Grid container spacing={2}>
                {categoryTemplates.map((template) => renderTemplateCard(template))}
              </Grid>
            </Box>
          ))}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={!selectedTemplate}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Configure Project */}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Configure Your Project
          </Typography>

          <Paper sx={{ p: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-awesome-app"
              helperText="Use lowercase with hyphens"
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Template</InputLabel>
              <Select
                value={selectedTemplate}
                label="Template"
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {Object.values(templates)
                  .flat()
                  .map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>TypeScript</InputLabel>
              <Select
                value={typescript ? 'yes' : 'no'}
                label="TypeScript"
                onChange={(e) => setTypescript(e.target.value === 'yes')}
              >
                <MenuItem value="yes">Yes, use TypeScript</MenuItem>
                <MenuItem value="no">No, use JavaScript</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={!projectName || !selectedTemplate}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Review & Create */}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Review & Create
          </Typography>

          <Paper sx={{ p: 3, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Project Name
                </Typography>
                <Typography variant="body1">{projectName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Template
                </Typography>
                <Typography variant="body1">
                  {templates &&
                    Object.values(templates)
                      .flat()
                      .find((t) => t.id === selectedTemplate)?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  TypeScript
                </Typography>
                <Typography variant="body1">{typescript ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Session
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {sessionId}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setActiveStep(1)} disabled={loading}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <BuildIcon />}
            >
              {loading ? 'Creating...' : 'Create Application'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 4: Results */}
      {activeStep === 3 && result && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6">Application Created Successfully!</Typography>
            <Typography variant="body2">
              Your {projectName} application has been created in /workspace/{projectName}
            </Typography>
          </Alert>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Creation Steps
            </Typography>

            <List>
              {result.steps?.map((step: CreateStep, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {step.success ? (
                      <CheckIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={step.step}
                    secondary={step.output}
                    secondaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                </ListItem>
              ))}
            </List>

            {result.post_creation?.file_structure && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  File Structure
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: '#1e1e1e',
                    color: '#d4d4d4',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    overflowX: 'auto',
                  }}
                >
                  <pre>{result.post_creation.file_structure}</pre>
                </Paper>
              </Box>
            )}
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Create Another
            </Button>
            <Button
              variant="contained"
              href={`/clavis/terminal/${sessionId}`}
            >
              Open Terminal
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClavisCreateMode;
