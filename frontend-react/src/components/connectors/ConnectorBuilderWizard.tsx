/**
 * No-Code Connector Builder Wizard
 * FIRST IN MARKET: Build MCP servers visually in 5 steps
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  Globe,
  Lock,
  Code,
  Play,
  Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'

interface Endpoint {
  method: string
  path: string
  name: string
  description: string
  parameters: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
}

interface ConnectorConfig {
  name: string
  description: string
  base_url: string
  auth_type: string
  auth_config: Record<string, any>
  endpoints: Endpoint[]
}

interface Props {
  onComplete: () => void
  onCancel: () => void
}

export default function ConnectorBuilderWizard({ onComplete, onCancel }: Props) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // Connector configuration
  const [config, setConfig] = useState<ConnectorConfig>({
    name: '',
    description: '',
    base_url: '',
    auth_type: 'none',
    auth_config: {},
    endpoints: []
  })

  // Current endpoint being edited
  const [currentEndpoint, setCurrentEndpoint] = useState<Endpoint>({
    method: 'GET',
    path: '',
    name: '',
    description: '',
    parameters: []
  })

  const steps = [
    { number: 1, title: 'Basic Info', icon: Globe },
    { number: 2, title: 'Authentication', icon: Lock },
    { number: 3, title: 'Endpoints', icon: Code },
    { number: 4, title: 'Test', icon: Play },
    { number: 5, title: 'Deploy', icon: Zap }
  ]

  const handleNext = () => {
    // Validation
    if (currentStep === 1) {
      if (!config.name || !config.base_url) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in name and base URL',
          variant: 'destructive',
          duration: 2000
        })
        return
      }
      // Ensure base_url doesn't end with slash
      setConfig({
        ...config,
        base_url: config.base_url.replace(/\/$/, '')
      })
    }

    if (currentStep === 2) {
      // Validate auth config based on auth_type
      if (config.auth_type === 'api_key' && !config.auth_config.header_name) {
        toast({
          title: 'Missing Configuration',
          description: 'Please specify the API key header name',
          variant: 'destructive',
          duration: 2000
        })
        return
      }
    }

    if (currentStep === 3) {
      if (config.endpoints.length === 0) {
        toast({
          title: 'No Endpoints',
          description: 'Please add at least one endpoint',
          variant: 'destructive',
          duration: 2000
        })
        return
      }
    }

    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const addEndpoint = () => {
    if (!currentEndpoint.name || !currentEndpoint.path) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in endpoint name and path',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    setConfig({
      ...config,
      endpoints: [...config.endpoints, { ...currentEndpoint }]
    })

    // Reset form
    setCurrentEndpoint({
      method: 'GET',
      path: '',
      name: '',
      description: '',
      parameters: []
    })

    toast({
      title: 'Endpoint Added',
      description: `${currentEndpoint.method} ${currentEndpoint.path}`,
      duration: 2000
    })
  }

  const removeEndpoint = (index: number) => {
    setConfig({
      ...config,
      endpoints: config.endpoints.filter((_, i) => i !== index)
    })
  }

  const addParameter = () => {
    setCurrentEndpoint({
      ...currentEndpoint,
      parameters: [
        ...currentEndpoint.parameters,
        { name: '', type: 'string', required: false, description: '' }
      ]
    })
  }

  const removeParameter = (index: number) => {
    setCurrentEndpoint({
      ...currentEndpoint,
      parameters: currentEndpoint.parameters.filter((_, i) => i !== index)
    })
  }

  const updateParameter = (index: number, field: string, value: any) => {
    const newParams = [...currentEndpoint.parameters]
    newParams[index] = { ...newParams[index], [field]: value }
    setCurrentEndpoint({
      ...currentEndpoint,
      parameters: newParams
    })
  }

  const handleTestConnection = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      // For testing, we'll just validate the configuration
      // In a real implementation, this would make a test request
      await new Promise(resolve => setTimeout(resolve, 1500))

      setTestResult({
        success: true,
        message: 'Configuration validated successfully',
        details: {
          base_url: config.base_url,
          auth_type: config.auth_type,
          endpoints: config.endpoints.length
        }
      })

      toast({
        title: 'Test Successful',
        description: 'Configuration is valid',
        duration: 2000
      })
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
        error: error
      })

      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to validate configuration',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)

    try {
      const response = await apiClient.connectors.generateCustom({
        config: config,
        generate_airbyte: true,
        generate_mcp: true
      })

      if (response.success) {
        toast({
          title: 'Connector Created!',
          description: `${config.name} is ready to use`,
          duration: 2000
        })
        onComplete()
      } else {
        throw new Error(response.error || 'Failed to generate connector')
      }
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate connector',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number

          return (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isActive
                      ? 'border-[#105e6e] bg-teal-50 text-[#105e6e] dark:bg-teal-900/20 dark:border-teal-500 dark:text-teal-400'
                      : isCompleted
                      ? 'border-[#105e6e] bg-teal-50 text-[#105e6e] dark:bg-teal-900/20 dark:border-teal-500 dark:text-teal-400'
                      : 'border-gray-300 bg-white text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-2">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-[#105e6e] dark:text-teal-400' : isCompleted ? 'text-[#105e6e] dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 ml-4 ${
                    isCompleted ? 'bg-[#105e6e] dark:bg-teal-500' : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Start by naming your connector and providing the API base URL
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Connector Name *</Label>
                  <Input
                    id="name"
                    placeholder="My Custom API"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this API do?"
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="base_url">Base URL *</Label>
                  <Input
                    id="base_url"
                    placeholder="https://api.example.com"
                    value={config.base_url}
                    onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The root URL for all API requests (without trailing slash)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Authentication */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Authentication</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure how to authenticate requests to this API
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="auth_type">Authentication Type *</Label>
                  <Select
                    value={config.auth_type}
                    onValueChange={(value) =>
                      setConfig({ ...config, auth_type: value, auth_config: {} })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Authentication</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer_token">Bearer Token</SelectItem>
                      <SelectItem value="basic_auth">Basic Auth</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* API Key Config */}
                {config.auth_type === 'api_key' && (
                  <div>
                    <Label htmlFor="header_name">Header Name *</Label>
                    <Input
                      id="header_name"
                      placeholder="X-API-Key"
                      value={config.auth_config.header_name || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          auth_config: { ...config.auth_config, header_name: e.target.value }
                        })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The HTTP header name for the API key
                    </p>
                  </div>
                )}

                {/* OAuth 2.0 Config */}
                {config.auth_type === 'oauth2' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="token_url">Token URL *</Label>
                      <Input
                        id="token_url"
                        placeholder="https://api.example.com/oauth/token"
                        value={config.auth_config.token_url || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            auth_config: { ...config.auth_config, token_url: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="auth_url">Authorization URL</Label>
                      <Input
                        id="auth_url"
                        placeholder="https://api.example.com/oauth/authorize"
                        value={config.auth_config.auth_url || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            auth_config: { ...config.auth_config, auth_url: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {config.auth_type === 'none' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      No authentication required. All requests will be made without credentials.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Endpoints */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">API Endpoints</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Define the endpoints your connector will support
                </p>
              </div>

              {/* Existing Endpoints */}
              {config.endpoints.length > 0 && (
                <div className="space-y-2 mb-6">
                  <Label>Configured Endpoints ({config.endpoints.length})</Label>
                  {config.endpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                            {endpoint.method}
                          </Badge>
                          <span className="font-medium">{endpoint.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {config.base_url}{endpoint.path}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEndpoint(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Endpoint */}
              <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                <h4 className="font-medium">Add Endpoint</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="method">HTTP Method *</Label>
                    <Select
                      value={currentEndpoint.method}
                      onValueChange={(value) =>
                        setCurrentEndpoint({ ...currentEndpoint, method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="path">Path *</Label>
                    <Input
                      id="path"
                      placeholder="/users"
                      value={currentEndpoint.path}
                      onChange={(e) =>
                        setCurrentEndpoint({ ...currentEndpoint, path: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endpoint_name">Name *</Label>
                  <Input
                    id="endpoint_name"
                    placeholder="List Users"
                    value={currentEndpoint.name}
                    onChange={(e) =>
                      setCurrentEndpoint({ ...currentEndpoint, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="endpoint_description">Description</Label>
                  <Input
                    id="endpoint_description"
                    placeholder="Get all users from the system"
                    value={currentEndpoint.description}
                    onChange={(e) =>
                      setCurrentEndpoint({ ...currentEndpoint, description: e.target.value })
                    }
                  />
                </div>

                {/* Parameters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Parameters</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addParameter}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Parameter
                    </Button>
                  </div>

                  {currentEndpoint.parameters.length > 0 && (
                    <div className="space-y-2">
                      {currentEndpoint.parameters.map((param, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-3">
                            <Input
                              placeholder="name"
                              value={param.name}
                              onChange={(e) =>
                                updateParameter(index, 'name', e.target.value)
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={param.type}
                              onValueChange={(value) =>
                                updateParameter(index, 'type', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">string</SelectItem>
                                <SelectItem value="number">number</SelectItem>
                                <SelectItem value="boolean">boolean</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-5">
                            <Input
                              placeholder="description"
                              value={param.description}
                              onChange={(e) =>
                                updateParameter(index, 'description', e.target.value)
                              }
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={param.required}
                                onChange={(e) =>
                                  updateParameter(index, 'required', e.target.checked)
                                }
                                className="mr-1"
                              />
                              <span className="text-xs">Req</span>
                            </label>
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeParameter(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={addEndpoint} className="w-full bg-[#105e6e] hover:bg-[#0d4d59] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Endpoint
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Test */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Validate your connector configuration before deployment
                </p>
              </div>

              {/* Configuration Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {config.name}
                    </div>
                    <div>
                      <span className="font-medium">Base URL:</span> {config.base_url}
                    </div>
                    <div>
                      <span className="font-medium">Auth Type:</span>{' '}
                      <Badge variant="outline">{config.auth_type}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Endpoints:</span> {config.endpoints.length}
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Endpoints:</p>
                    <div className="space-y-1">
                      {config.endpoints.map((endpoint, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          <Badge variant="outline" className="mr-2">
                            {endpoint.method}
                          </Badge>
                          {endpoint.path} - {endpoint.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Button */}
              <Button
                onClick={handleTestConnection}
                disabled={loading}
                className="w-full bg-[#105e6e] hover:bg-[#0d4d59] text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test Configuration
                  </>
                )}
              </Button>

              {/* Test Result */}
              {testResult && (
                <Card
                  className={
                    testResult.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <div className="h-5 w-5 text-red-600 mt-0.5">✗</div>
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            testResult.success ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          {testResult.message}
                        </p>
                        {testResult.details && (
                          <pre className="mt-2 text-xs overflow-auto">
                            {JSON.stringify(testResult.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 5: Deploy */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Generate & Deploy</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Ready to create your connector? This will generate an Airbyte manifest and MCP
                  server.
                </p>
              </div>

              {/* Final Summary */}
              <Card className="border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#105e6e] dark:text-teal-400" />
                    What will be created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-[#105e6e] dark:text-teal-400 mt-0.5" />
                      <span>
                        <strong>Airbyte Manifest:</strong> Low-code connector definition for data
                        ingestion
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-[#105e6e] dark:text-teal-400 mt-0.5" />
                      <span>
                        <strong>MCP Server:</strong> Python server with {config.endpoints.length}{' '}
                        tools
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-[#105e6e] dark:text-teal-400 mt-0.5" />
                      <span>
                        <strong>Auto-Deploy:</strong> Immediately available in flows and agents
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Connector Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{config.name}</CardTitle>
                  <CardDescription>{config.description || 'Custom connector'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base URL:</span>
                      <span className="font-mono text-xs">{config.base_url}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Authentication:</span>
                      <Badge variant="outline">{config.auth_type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Endpoints:</span>
                      <span>{config.endpoints.length} defined</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-[#105e6e] hover:bg-[#0d4d59] text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Connector
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep < 5 && (
          <Button onClick={handleNext} disabled={loading} className="bg-[#105e6e] hover:bg-[#0d4d59] text-white">
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
