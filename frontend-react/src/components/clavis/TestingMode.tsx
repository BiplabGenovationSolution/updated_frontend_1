/**
 * Clavis Testing/Assessment Mode
 * Run security scans and code quality assessments
 */
import React, { useState } from 'react';
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
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api';

interface AssessmentResult {
  success: boolean;
  results?: {
    summary: {
      overall_score: number;
      grade: string;
      critical_issues: number;
      warnings: number;
      recommendations: string[];
    };
    assessments: {
      security?: any;
      compliance?: any;
      quality?: any;
      performance?: any;
    };
    project_info?: any;
  };
  error?: string;
}

export const ClavisTestingMode: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [repoUrl, setRepoUrl] = useState('');
  const [assessmentType, setAssessmentType] = useState('full');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Configure', 'Run Assessment', 'View Results'];

  const assessmentTypes = [
    { value: 'full', label: 'Full Assessment', desc: 'Security + Compliance + Quality + Performance' },
    { value: 'security', label: 'Security Only', desc: 'Vulnerability scanning with Bandit, Trivy, npm audit' },
    { value: 'compliance', label: 'Compliance Only', desc: 'LICENSE, README, secrets detection' },
    { value: 'quality', label: 'Code Quality', desc: 'Linting with pylint, eslint' },
    { value: 'performance', label: 'Performance', desc: 'Complexity analysis, large files' },
  ];

  // Run assessment
  const handleRunAssessment = async () => {
    if (!repoUrl) {
      setError('Please enter a repository URL');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveStep(1);

    try {
      const response = await apiClient.post(`/clavis/pods/session/${sessionId}/test`, {
        repo_url: repoUrl,
        assessment_type: assessmentType,
      });

      if (response.data.success) {
        setResult(response.data);
        setActiveStep(2);
      } else {
        setError(response.data.error || 'Assessment failed');
        setActiveStep(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to run assessment');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'success';
    }
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return '#4caf50';
      case 'B':
        return '#8bc34a';
      case 'C':
        return '#ff9800';
      case 'D':
        return '#ff5722';
      case 'F':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Testing & Assessment - {sessionId}
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

      {/* Step 1: Configure */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Configure Assessment
          </Typography>

          <Paper sx={{ p: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Repository URL"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              helperText="Enter the Git repository URL to analyze"
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Assessment Type</InputLabel>
              <Select
                value={assessmentType}
                label="Assessment Type"
                onChange={(e) => setAssessmentType(e.target.value)}
              >
                {assessmentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography variant="body1">{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.desc}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Alert severity="info">
              <Typography variant="body2">
                The assessment will:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Clone your repository into the pod</li>
                <li>Run security scanners (Bandit, Trivy, npm audit)</li>
                <li>Check for compliance issues</li>
                <li>Analyze code quality</li>
                <li>Generate a comprehensive report</li>
              </ul>
            </Alert>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleRunAssessment}
              disabled={!repoUrl || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
            >
              {loading ? 'Starting Assessment...' : 'Run Assessment'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Running */}
      {activeStep === 1 && (
        <Box>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Running Assessment...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take a few minutes depending on repository size.
            </Typography>
            <LinearProgress sx={{ mt: 3 }} />
          </Paper>
        </Box>
      )}

      {/* Step 3: Results */}
      {activeStep === 2 && result?.results && (
        <Box>
          {/* Summary Card */}
          <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${getGradeColor(result.results.summary.grade)} 0%, ${getGradeColor(result.results.summary.grade)}dd 100%)` }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3} textAlign="center">
                  <Typography variant="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {result.results.summary.grade}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Overall Grade
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3} textAlign="center">
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {result.results.summary.overall_score}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Score (out of 100)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3} textAlign="center">
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {result.results.summary.critical_issues}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Critical Issues
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3} textAlign="center">
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {result.results.summary.warnings}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Warnings
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Project Info */}
          {result.results.project_info && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Project Information
              </Typography>
              <Grid container spacing={2}>
                {result.results.project_info.languages?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Languages
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {result.results.project_info.languages.map((lang: string) => (
                        <Chip key={lang} label={lang} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
                {result.results.project_info.frameworks?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Frameworks
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {result.results.project_info.frameworks.map((fw: string) => (
                        <Chip key={fw} label={fw} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Security Assessment */}
          {result.results.assessments.security && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <SecurityIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Security Vulnerabilities</Typography>
                <Chip
                  label={`${result.results.assessments.security.total_vulnerabilities || 0} issues`}
                  color={result.results.assessments.security.total_vulnerabilities > 0 ? 'error' : 'success'}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                {/* Severity Counts */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {Object.entries(result.results.assessments.security.severity_counts || {}).map(([severity, count]) => (
                    <Grid item xs={6} sm={3} key={severity}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color={getSeverityColor(severity)}>
                            {count as number}
                          </Typography>
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {severity}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Vulnerability List */}
                <List>
                  {result.results.assessments.security.vulnerabilities?.slice(0, 10).map((vuln: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={vuln.severity}
                                color={getSeverityColor(vuln.severity)}
                                size="small"
                              />
                              <Typography variant="body1">
                                {vuln.issue || vuln.title || vuln.vulnerability_id}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                Tool: {vuln.tool} | File: {vuln.file || vuln.package}
                              </Typography>
                              {vuln.line && (
                                <Typography variant="caption" color="text.secondary">
                                  Line: {vuln.line}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Compliance */}
          {result.results.assessments.compliance && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <CheckIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Compliance</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {result.results.assessments.compliance.missing_files?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Missing Files
                    </Typography>
                    {result.results.assessments.compliance.missing_files.map((file: string) => (
                      <Chip key={file} label={file} color="warning" size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>
                )}

                {result.results.assessments.compliance.recommendations?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Recommendations
                    </Typography>
                    <List>
                      {result.results.assessments.compliance.recommendations.map((rec: string, idx: number) => (
                        <ListItem key={idx}>
                          <InfoIcon sx={{ mr: 2, color: 'info.main' }} />
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Quality */}
          {result.results.assessments.quality && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <WarningIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Code Quality</Typography>
                <Chip
                  label={`${result.results.assessments.quality.total_issues || 0} issues`}
                  color={result.results.assessments.quality.total_issues > 0 ? 'warning' : 'success'}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {result.results.assessments.quality.issues?.slice(0, 15).map((issue: any, idx: number) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={issue.message}
                        secondary={`Tool: ${issue.tool} | File: ${issue.file} | Line: ${issue.line}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Actions */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Run Another Assessment
            </Button>
            <Button variant="contained" href={`/clavis/terminal/${sessionId}`}>
              Open Terminal
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClavisTestingMode;
