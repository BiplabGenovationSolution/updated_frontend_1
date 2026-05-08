import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  CheckCircle2,
  Loader2,
  Database,
  Plus,
  Star,
  XCircle,
  TestTube,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

interface Model {
  model_id: string
  provider: string
  model_name: string
  display_name: string
  description?: string
  model_type: string
  modalities: string[]
  capabilities: string[]
  context_window: number
  max_output_tokens: number
  input_cost_per_1k_tokens?: number
  output_cost_per_1k_tokens?: number
  is_enabled: boolean
  is_default: boolean
  is_global: boolean
  visibility: string
  tags: string[]
  usage_count: number
  last_used_at?: string
  created_at: string
}

export default function ModelsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [models, setModels] = useState<Model[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterEnabled, setFilterEnabled] = useState<string>('all')

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testInput, setTestInput] = useState('Hello, how are you?')
  const [testResult, setTestResult] = useState<any>(null)

  const [formData, setFormData] = useState({
    provider: '',
    model_name: '',
    display_name: '',
    description: '',
    model_type: 'llm',
    context_window: 4096,
    max_output_tokens: 2048,
    input_cost_per_1k_tokens: 0,
    output_cost_per_1k_tokens: 0,
    is_enabled: true,
    is_default: false,
    tags: [] as string[],
    api_endpoint: '',
    api_version: ''
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth/login')
      return
    }
    // All authenticated users can access Models page
    // System admin and org admin get management features
    // Regular users get read-only view of available models
    loadModels()
    loadProviders()
  }, [user, authLoading, navigate])

  const loadModels = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // Use user_id or id as fallback organization_id for superadmins
      // Global models will still be visible with include_global: true
      const orgId = user.user_id || user.id || 'system'
      const response = await apiClient.models.list(orgId, {
        include_global: true
      })

      if (response.success && response.data) {
        setModels(response.data.models || [])
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load models',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const response = await apiClient.models.listProviders()
      if (response.success && response.data) {
        setProviders(response.data.providers || [])
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
    }
  }

  const handleUpdateModel = async () => {
    if (!selectedModel) return

    try {
      setIsSaving(true)
      const response = await apiClient.models.update(selectedModel.model_id, {
        display_name: formData.display_name,
        description: formData.description || undefined,
        context_window: formData.context_window,
        max_output_tokens: formData.max_output_tokens,
        input_cost_per_1k_tokens: formData.input_cost_per_1k_tokens || undefined,
        output_cost_per_1k_tokens: formData.output_cost_per_1k_tokens || undefined,
        is_enabled: formData.is_enabled,
        tags: formData.tags,
        api_endpoint: formData.api_endpoint || undefined,
        api_version: formData.api_version || undefined
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Model updated successfully',
          duration: 2000  
        })
        setIsEditDialogOpen(false)
        setSelectedModel(null)
        resetForm()
        loadModels()
      } else {
        throw new Error(response.error || 'Failed to update model')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update model',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      return
    }

    try {
      const response = await apiClient.models.delete(modelId)
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Model deleted successfully',
          duration: 2000
        })
        loadModels()
      } else {
        throw new Error(response.error || 'Failed to delete model')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete model',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleToggleEnabled = async (modelId: string, currentEnabled: boolean) => {
    try {
      const response = await apiClient.models.update(modelId, {
        is_enabled: !currentEnabled
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: `Model ${!currentEnabled ? 'enabled' : 'disabled'} successfully`,
          duration: 2000
        })
        loadModels()
      } else {
        throw new Error(response.error || 'Failed to toggle model')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle model',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleSetDefault = async (modelId: string, modelType: string) => {
    if (!user) return

    try {
      // Use user_id or id as fallback organization_id for superadmins
      const orgId = user.user_id || user.id || 'system'
      const response = await apiClient.models.setDefault(modelId, orgId, modelType)
      if (response.success) {
        toast({
          title: 'Success',
          description: `Set as default ${modelType} model`,
          duration: 2000
        })
        loadModels()
      } else {
        throw new Error(response.error || 'Failed to set default')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set default',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleTestModel = async () => {
    if (!selectedModel) return

    try {
      setIsTesting(true)
      const response = await apiClient.models.test(selectedModel.model_id, testInput)
      setTestResult(response)

      if (response.success) {
        toast({
          title: 'Test Complete',
          description: 'Model test executed successfully',
          duration: 2000
        })
      }
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message || 'Model test failed',
        variant: 'destructive',
        duration: 2000
      })
      setTestResult({ success: false, error: error.message })
    } finally {
      setIsTesting(false)
    }
  }

  const openEditDialog = (model: Model) => {
    setSelectedModel(model)
    setFormData({
      provider: model.provider,
      model_name: model.model_name,
      display_name: model.display_name,
      description: model.description || '',
      model_type: model.model_type,
      context_window: model.context_window,
      max_output_tokens: model.max_output_tokens,
      input_cost_per_1k_tokens: model.input_cost_per_1k_tokens || 0,
      output_cost_per_1k_tokens: model.output_cost_per_1k_tokens || 0,
      is_enabled: model.is_enabled,
      is_default: model.is_default,
      tags: model.tags || [],
      api_endpoint: '',
      api_version: ''
    })
    setIsEditDialogOpen(true)
  }

  const openTestDialog = (model: Model) => {
    setSelectedModel(model)
    setTestInput('Hello, how are you?')
    setTestResult(null)
    setIsTestDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      provider: '',
      model_name: '',
      display_name: '',
      description: '',
      model_type: 'llm',
      context_window: 4096,
      max_output_tokens: 2048,
      input_cost_per_1k_tokens: 0,
      output_cost_per_1k_tokens: 0,
      is_enabled: true,
      is_default: false,
      tags: [],
      api_endpoint: '',
      api_version: ''
    })
  }

  const filteredModels = models.filter(model => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!model.display_name.toLowerCase().includes(query) &&
        !model.provider.toLowerCase().includes(query) &&
        !model.model_name.toLowerCase().includes(query)) {
        return false
      }
    }
    if (filterProvider !== 'all' && model.provider !== filterProvider) return false
    if (filterType !== 'all' && model.model_type !== filterType) return false
    if (filterEnabled === 'enabled' && !model.is_enabled) return false
    if (filterEnabled === 'disabled' && model.is_enabled) return false
    return true
  })

  const uniqueProviders = Array.from(new Set(models.map(m => m.provider)))
  const uniqueTypes = Array.from(new Set(models.map(m => m.model_type)))

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#EEF2F7] dark:bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#0d4d59] mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Model Manager...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#EEF2F7] dark:bg-[#0d1117] min-h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Breadcrumbs />
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#2d3545] px-6 py-4 rounded-lg shadow-sm"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-white dark:text-white">
                    <Database className="h-5 w-5 text-[#105e6e]" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {user?.is_system_admin || user?.role === 'admin' ? 'Model Manager' : 'Available Models'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {user?.is_system_admin
                        ? 'Manage AI models across all providers (System-wide)'
                        : user?.role === 'admin'
                          ? 'Manage AI models for your organization'
                          : 'View available AI models you can use'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {user?.role === 'admin' && !user?.is_system_admin && (
                    <div className="text-right text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-300">Organization Admin</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Enable/disable models</p>
                    </div>
                  )}
                  {user?.role !== 'admin' && !user?.is_system_admin && (
                    <div className="text-right text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-300">User View</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Browse models</p>
                    </div>
                  )}
                  {user?.is_system_admin && (
                    <Button
                      onClick={() => navigate('/models/add')}
                      size="sm"
                      className="bg-[#105e6e] text-white hover:bg-[#0d4d59]"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Model
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
  {[
    {
      label: "TOTAL MODELS",
      count: models.length,
      sub: "All Registered Models",
    },
    {
      label: "ENABLED",
      count: models.filter((m) => m.is_enabled).length,
      sub: "Active Models",
    },
    {
      label: "PROVIDERS",
      count: uniqueProviders.length,
      sub: "Available Providers",
    },
    {
      label: "TOTAL USAGE",
      count: models.reduce((sum, m) => sum + m.usage_count, 0),
      sub: "Usage Count",
    },
  ].map((stat) => (
    <div
      key={stat.label}
      className="bg-white dark:bg-[#1c2128] 
      border border-slate-200 dark:border-slate-800 
      rounded-md px-4 py-4  
      flex items-center justify-between
      hover:border-blue-400/40 dark:hover:border-blue-500/30
      transition-all duration-200"
    >
      {/* Left */}
      <div className="flex flex-col">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {stat.label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {stat.sub}
        </p>
      </div>

      {/* Right */}
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
        {stat.count}
      </h3>
    </div>
  ))}
</div>

          {/* Filters */}
          <Card className="dark:bg-[#0d1117] dark:border-[#2d3545] shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545] dark:placeholder:text-gray-500 shadow-sm"
                    />
                  </div>
                </div>

                <Select value={filterProvider} onValueChange={setFilterProvider}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545] shadow-sm">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#0d1117] dark:text-white dark:border-[#2d3545]">
                    <SelectItem value="all">All Providers</SelectItem>
                    {uniqueProviders.map(provider => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545] shadow-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#0d1117] dark:text-white dark:border-[#2d3545]">
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEnabled} onValueChange={setFilterEnabled}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545] shadow-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#0d1117] dark:text-white dark:border-[#2d3545]">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Models Table */}
          <Card className="dark:bg-[#0d1117] dark:border-[#2d3545] shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-[#2d3545]">
              <CardTitle className="dark:text-white">Models ({filteredModels.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="dark:text-white">Model</TableHead>
                    <TableHead className="dark:text-white">Provider</TableHead>
                    <TableHead className="dark:text-white">Type</TableHead>
                    <TableHead className="dark:text-white">Context</TableHead>
                    <TableHead className="dark:text-white">Cost</TableHead>
                    <TableHead className="dark:text-white">Usage</TableHead>
                    <TableHead className="dark:text-white">Status</TableHead>
                    <TableHead className="text-right dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow key={model.model_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2 dark:text-white">
                            {model.display_name}
                            {model.is_default && (
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            )}
                            {model.is_global && (
                              <Badge variant="outline" className="text-xs">Global</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{model.model_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{model.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.model_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-400">
                        {model.context_window.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-400">
                        {model.input_cost_per_1k_tokens !== undefined && model.output_cost_per_1k_tokens !== undefined ? (
                          <div className="text-xs">
                            <div>In: ${model.input_cost_per_1k_tokens.toFixed(4)}</div>
                            <div>Out: ${model.output_cost_per_1k_tokens.toFixed(4)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-400">
                        {model.usage_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(user?.is_system_admin || user?.role === 'admin') ? (
                            <>
                              <Switch
                                checked={model.is_enabled}
                                onCheckedChange={() => handleToggleEnabled(model.model_id, model.is_enabled)}
                                className="data-[state=checked]:bg-green-500"
                              />
                              <span className="text-xs">
                                {model.is_enabled ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                              </span>
                            </>
                          ) : (
                            <Badge variant={model.is_enabled ? "default" : "secondary"} className="text-xs">
                              {model.is_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user?.is_system_admin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openTestDialog(model)}
                              title="Test Model"
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                          )}
                          {(user?.is_system_admin || user?.role === 'admin') && !model.is_default && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSetDefault(model.model_id, model.model_type)}
                              title="Set as Default"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {user?.is_system_admin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(model)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {user?.is_system_admin && !model.is_global && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteModel(model.model_id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredModels.length === 0 && (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No models found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    {searchQuery || filterProvider !== 'all' || filterType !== 'all' || filterEnabled !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add your first model to get started'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Model Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false)
          setSelectedModel(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-[#353d4f] dark:border-[#3d4555]">
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update model configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-white">Provider *</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  disabled={isEditDialogOpen}
                >
                  <SelectTrigger className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="dark:text-white">Model Type *</Label>
                <Select
                  value={formData.model_type}
                  onValueChange={(value) => setFormData({ ...formData, model_type: value })}
                >
                  <SelectTrigger className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                    <SelectItem value="llm">LLM (Text)</SelectItem>
                    <SelectItem value="embedding">Embedding</SelectItem>
                    <SelectItem value="image">Image Generation</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="speech-to-text">Speech-to-Text</SelectItem>
                    <SelectItem value="text-to-speech">Text-to-Speech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="dark:text-white">Model Name *</Label>
              <Input
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                placeholder="e.g., gpt-4, claude-3-opus, llama-2-70b"
                disabled={isEditDialogOpen}
                className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label className="dark:text-white">Display Name *</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., GPT-4 Turbo, Claude 3 Opus"
                className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label className="dark:text-white">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the model's capabilities..."
                rows={3}
                className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555] dark:placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-white">Context Window (tokens)</Label>
                <Input
                  type="number"
                  value={formData.context_window}
                  onChange={(e) => setFormData({ ...formData, context_window: parseInt(e.target.value) || 0 })}
                  className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
                />
              </div>

              <div>
                <Label className="dark:text-white">Max Output Tokens</Label>
                <Input
                  type="number"
                  value={formData.max_output_tokens}
                  onChange={(e) => setFormData({ ...formData, max_output_tokens: parseInt(e.target.value) || 0 })}
                  className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-white">Input Cost (per 1K tokens)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.input_cost_per_1k_tokens}
                  onChange={(e) => setFormData({ ...formData, input_cost_per_1k_tokens: parseFloat(e.target.value) || 0 })}
                  className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
                />
              </div>

              <div>
                <Label className="dark:text-white">Output Cost (per 1K tokens)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.output_cost_per_1k_tokens}
                  onChange={(e) => setFormData({ ...formData, output_cost_per_1k_tokens: parseFloat(e.target.value) || 0 })}
                  className="dark:bg-[#2d3545] dark:text-white dark:border-[#3d4555]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="dark:text-white">Enable Model</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Allow this model to be used</p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedModel(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateModel}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Model'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Model Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Model</DialogTitle>
            <DialogDescription>
              Send a test message to {selectedModel?.display_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Test Input</Label>
              <Textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Enter test message..."
                rows={3}
              />
            </div>

            {testResult && (
              <Alert className={testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <AlertCircle className={cn('h-4 w-4', testResult.success ? 'text-green-600' : 'text-red-600')} />
                <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  <pre className="text-xs mt-2 whitespace-pre-wrap">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleTestModel} disabled={isTesting}>
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
