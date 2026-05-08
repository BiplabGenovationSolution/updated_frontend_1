/**
 * Tabbed Connector Configuration Dialog
 * Combines Credentials and Stream Selection in one modal
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Database,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'

interface Connector {
  connector_id?: string
  name: string
  display_name: string
  category: string
  description: string
  is_configured?: boolean
}

interface Props {
  connector: Connector
  onComplete: () => void
  onCancel: () => void
}

// Common credential fields for different connector types
const CONNECTOR_FIELDS: Record<string, Array<{
  key: string
  label: string
  type: string
  placeholder: string
  description?: string
  required?: boolean
}>> = {
  'source-google-drive': [
    {
      key: 'folder_url',
      label: 'Folder URL',
      type: 'text',
      placeholder: 'https://drive.google.com/drive/folders/... or just "root"',
      description: 'Google Drive folder URL or folder ID (use "root" for root folder)',
      required: true
    },
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      placeholder: 'Your Google Drive API key',
      description: 'API key from Google Cloud Console',
      required: true
    }
  ],
  'source-jira': [
    {
      key: 'api_token',
      label: 'API Token',
      type: 'password',
      placeholder: 'Your Jira API token',
      description: 'Generate from Atlassian Account Settings',
      required: true
    },
    {
      key: 'domain',
      label: 'Domain',
      type: 'text',
      placeholder: 'company.atlassian.net',
      description: 'Your Jira domain (without https://)',
      required: true
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@company.com',
      description: 'Your Atlassian account email',
      required: true
    }
  ],
  'source-slack': [
    {
      key: 'access_token',
      label: 'Access Token',
      type: 'password',
      placeholder: 'xoxb-...',
      description: 'Bot User OAuth Token from Slack App',
      required: true
    }
  ],
  'source-github': [
    {
      key: 'access_token',
      label: 'Personal Access Token',
      type: 'password',
      placeholder: 'ghp_...',
      description: 'Generate from GitHub Settings > Developer settings',
      required: true
    },
    {
      key: 'repository',
      label: 'Repository',
      type: 'text',
      placeholder: 'owner/repo',
      description: 'Optional: Specific repository to access',
      required: false
    }
  ],
  'source-notion': [
    {
      key: 'access_token',
      label: 'Integration Token',
      type: 'password',
      placeholder: 'secret_...',
      description: 'Internal Integration Token from Notion',
      required: true
    }
  ],
  // Generic API Key auth for other connectors
  'default': [
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      placeholder: 'Your API key',
      description: 'API key for authentication',
      required: true
    }
  ]
}

export default function ConnectorConfigDialog({ connector, onComplete, onCancel }: Props) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('credentials')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [isConfigured, setIsConfigured] = useState(connector.is_configured || false)

  // Get fields for this connector type
  const fields = CONNECTOR_FIELDS[connector.name] || CONNECTOR_FIELDS['default']

  // Credentials state
  const [displayName, setDisplayName] = useState('')
  const [credentials, setCredentials] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {})
  )

  // Streams state
  const [availableStreams, setAvailableStreams] = useState<Array<{ name: string, selected: boolean }>>([])
  const [loadingStreams, setLoadingStreams] = useState(false)
  const [streamsDiscovered, setStreamsDiscovered] = useState(false)

  // Test connection state
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFieldChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }))
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }))
  }

  /**
   * Process credentials for API call
   * Can be extended for connector-specific processing if needed
   */
  const processCredentials = (rawCredentials: Record<string, string>): Record<string, any> => {
    // Currently just returns credentials as-is
    // Can add connector-specific processing here if needed
    return { ...rawCredentials }
  }

  const handleTest = async () => {
    // Validate required fields
    const missingFields = fields
      .filter(f => f.required && !credentials[f.key])
      .map(f => f.label)

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Process credentials (handles JSON parsing for Google Drive, etc.)
      const processedCredentials = processCredentials(credentials)

      const response = await apiClient.connectors.testAirbyte({
        connector_name: connector.name,
        config: processedCredentials
      })

      if (response.success) {
        setTestResult({
          success: true,
          message: 'Connection successful'
        })
        toast({
          title: 'Test Successful',
          description: 'Credentials are valid',
          duration: 2000
        })
      } else {
        throw new Error(response.error || 'Test failed')
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Connection failed'
      })
      toast({
        title: 'Test Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveCredentials = async () => {
    // Validate required fields
    const missingFields = fields
      .filter(f => f.required && !credentials[f.key])
      .map(f => f.label)

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    setLoading(true)

    try {
      // Process credentials (handles JSON parsing for Google Drive, etc.)
      const processedCredentials = processCredentials(credentials)

      const response = await apiClient.connectors.saveCredentials({
        connector_name: connector.name,
        connector_type: 'pyairbyte',
        display_name: displayName || `${connector.display_name} Credentials`,
        credentials: processedCredentials
      })

      if (response.success) {
        setIsConfigured(true)
        toast({
          title: 'Credentials Saved',
          description: 'Now you can configure data streams',
          duration: 2000
        })
        // Auto-switch to streams tab
        setActiveTab('streams')
        // Auto-discover streams
        handleDiscoverStreams()
      } else {
        throw new Error(response.error || 'Failed to save credentials')
      }
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save credentials',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDiscoverStreams = async () => {
    if (!connector.connector_id) {
      toast({
        title: 'Error',
        description: 'Connector ID not found',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    setLoadingStreams(true)
    setAvailableStreams([])

    try {
      const response = await apiClient.connectors.discoverStreams(connector.connector_id)
      if (response.success && response.data) {
        const streams = response.data.data?.streams || response.data.streams || []
        setAvailableStreams(streams.map((s: any) => ({
          name: s.name,
          selected: false
        })))
        setStreamsDiscovered(true)
      } else {
        toast({
          title: 'Discovery Failed',
          description: response.error || 'Failed to discover streams',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error: any) {
      toast({
        title: 'Discovery Failed',
        description: error.message || 'Failed to discover streams',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoadingStreams(false)
    }
  }

  const toggleStreamSelection = (streamName: string) => {
    setAvailableStreams(prev =>
      prev.map(s => s.name === streamName ? { ...s, selected: !s.selected } : s)
    )
  }

  const handleSelectAll = () => {
    setAvailableStreams(prev => prev.map(s => ({ ...s, selected: true })))
  }

  const handleDeselectAll = () => {
    setAvailableStreams(prev => prev.map(s => ({ ...s, selected: false })))
  }

  const handleSaveConfiguration = () => {
    const selectedCount = availableStreams.filter(s => s.selected).length
    if (selectedCount === 0) {
      toast({
        title: 'No Streams Selected',
        description: 'Please select at least one data stream',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    toast({
      title: 'Configuration Complete',
      description: `${connector.display_name} configured with ${selectedCount} stream(s)`,
      duration: 2000
    })
    onComplete()
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-[#0a0d14] p-1 rounded-lg border border-slate-200 dark:border-slate-800/60">
        <TabsTrigger value="credentials" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b2b] data-[state=active]:shadow-sm rounded-md transition-all text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white py-1.5">
          <Key className="h-4 w-4" />
          Credentials
          {isConfigured && <CheckCircle className="h-4 w-4 text-green-500" />}
        </TabsTrigger>
        <TabsTrigger value="streams" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b2b] data-[state=active]:shadow-sm rounded-md transition-all text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white py-1.5">
          <Database className="h-4 w-4" />
          Data Streams
          {availableStreams.filter(s => s.selected).length > 0 && (
            <Badge variant="default" className="ml-1">
              {availableStreams.filter(s => s.selected).length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* CREDENTIALS TAB */}
      <TabsContent value="credentials" className="space-y-6 mt-6">
        {/* Connector Info */}
        <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-transparent shadow-none">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-1 dark:text-slate-200">{connector.display_name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{connector.description}</p>
          </CardContent>
        </Card>

        {isConfigured && (
          <Card className="border-green-200 bg-green-50 dark:border-emerald-900/50 dark:bg-emerald-900/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-emerald-500" />
                <span className="font-medium text-green-900 dark:text-emerald-400">
                  Credentials Already Configured
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-emerald-500/80 mt-1">
                You can reconfigure by entering new credentials below
              </p>
            </CardContent>
          </Card>
        )}

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display_name" className="text-slate-900 dark:text-slate-200">
            Configuration Name (Optional)
          </Label>

          <Input
            id="display_name"
            placeholder={`${connector.display_name} - Production`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="off"
            className="bg-slate-100 dark:bg-[#0a0d14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-md px-3 py-2 transition-colors"
          />

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Give this configuration a memorable name
          </p>
        </div>

        {/* Dynamic Credential Fields */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3 dark:text-slate-200">Credentials</h4>
            {fields.map((field) => (
              <div key={field.key} className="mb-4">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="relative">
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.key}
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      rows={6}
                      className="font-mono text-sm bg-slate-100 dark:bg-[#0a0d14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={
                        field.type === 'password' && showPassword[field.key]
                          ? 'text'
                          : field.type
                      }
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                      className={`${field.type === 'password' ? 'pr-10 ' : ''}bg-slate-100 dark:bg-[#0a0d14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors`}
                    />
                  )}
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {showPassword[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                {field.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{field.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Card
            className={
              testResult.success
                ? 'border-green-200 bg-green-50 dark:border-emerald-900/50 dark:bg-emerald-900/10'
                : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10'
            }
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                )}
                <span
                  className={`font-medium ${testResult.success ? 'text-green-900 dark:text-emerald-400' : 'text-red-900 dark:text-red-400'
                    }`}
                >
                  {testResult.message}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-800/60">
          <Button
            variant="destructive"
            onClick={onCancel}
            disabled={loading || testing}
            className="transition-colors"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={loading || testing}
            className="flex-1 dark:bg-[#0a0d14] dark:border-slate-800 dark:text-slate-300 dark:hover:bg-[#151b2b] dark:hover:text-white transition-colors"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button
            onClick={handleSaveCredentials}
            disabled={loading || testing}
            className="flex-1 border-0 bg-[#105e6e] text-white transition-colors hover:bg-[#0d4c59]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </TabsContent>

      {/* STREAMS TAB */}
      <TabsContent value="streams" className="space-y-6 mt-6">
        {!isConfigured ? (
          /* Not Configured State */
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/10">
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2 dark:text-slate-200">Configure Credentials First</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Before you can browse and select data streams, you need to configure your credentials.
                </p>
                <Button
                  onClick={() => setActiveTab('credentials')}
                  className="bg-[#105e6e] text-white hover:bg-[#0d4c59]"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Go to Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Configured State */
          <>
            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-transparent shadow-none">
              <CardContent className="pt-4">
                <h3 className="font-medium mb-1 dark:text-slate-200">Select Data Streams</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose which data types you want to sync from {connector.display_name}
                </p>
              </CardContent>
            </Card>

            {!streamsDiscovered ? (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e2433]">
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Database className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2 dark:text-slate-200">Discover Available Streams</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Click below to discover what data you can sync from {connector.display_name}
                    </p>
                    <Button
                      onClick={handleDiscoverStreams}
                      disabled={loadingStreams}
                      className="bg-[#105e6e] hover:bg-[#0d4c59]"
                    >
                      {loadingStreams ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Discovering...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Discover Streams
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : loadingStreams ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Discovering available data streams...</p>
              </div>
            ) : availableStreams.length === 0 ? (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e2433]">
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No streams discovered</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stream Selection Controls */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {availableStreams.filter(s => s.selected).length} of {availableStreams.length} streams selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectAll}
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDiscoverStreams}
                      disabled={loadingStreams}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Stream List */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                  {availableStreams.map((stream) => (
                    <div
                      key={stream.name}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => toggleStreamSelection(stream.name)}
                    >
                      <input
                        type="checkbox"
                        checked={stream.selected}
                        onChange={() => toggleStreamSelection(stream.name)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-700"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-slate-200">{stream.name}</p>
                      </div>
                      {stream.selected && (
                        <Badge variant="default" className="bg-blue-600 dark:bg-blue-700">
                          Selected
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-200">Note:</strong> Each sync will fetch up to 1,000 records per stream. You can run multiple syncs to get more data.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-800/60">
              <Button variant="destructive" onClick={onCancel} className="flex-1 transition-colors">
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfiguration}
                disabled={availableStreams.filter(s => s.selected).length === 0}
                className="flex-1 border-0 bg-[#105e6e] text-white transition-colors hover:bg-[#0d4c59]"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  )
}
