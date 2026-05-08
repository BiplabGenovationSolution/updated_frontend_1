import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ArrowLeft, Loader2, Database } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AddModelPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [providers, setProviders] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

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
    if (!user.is_system_admin) {
      navigate('/models')
      return
    }
    loadProviders()
  }, [user, authLoading, navigate])

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

  const handleCreateModel = async () => {
    if (!user) return
    if (!formData.provider || !formData.model_name || !formData.display_name) {
      toast({
        title: 'Validation Error',
        description: 'Provider, model name, and display name are required',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    try {
      setIsSaving(true)
      const orgId = user.user_id || user.id || 'system'
      const response = await apiClient.models.create(orgId, {
        provider: formData.provider,
        model_name: formData.model_name,
        display_name: formData.display_name,
        description: formData.description || undefined,
        model_type: formData.model_type,
        context_window: formData.context_window,
        max_output_tokens: formData.max_output_tokens,
        input_cost_per_1k_tokens: formData.input_cost_per_1k_tokens || undefined,
        output_cost_per_1k_tokens: formData.output_cost_per_1k_tokens || undefined,
        is_enabled: formData.is_enabled,
        is_default: formData.is_default,
        tags: formData.tags,
        api_endpoint: formData.api_endpoint || undefined,
        api_version: formData.api_version || undefined
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Model created successfully',
          duration: 2000
        })
        navigate('/models')
      } else {
        throw new Error(response.error || 'Failed to create model')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create model',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EEF2F7] dark:bg-[#1e2433] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#0d4d59] mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#EEF2F7] dark:bg-[#0f1219] min-h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Breadcrumbs />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#1e2433] border border-slate-200 dark:border-[#2d3545] px-6 py-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/models')}
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-[#2d3545] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                  <Database className="h-5 w-5 text-[#105e6e]" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Add Model</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add a new AI model to your organization</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-[#1e2433] border border-slate-200 dark:border-[#2d3545] rounded-lg shadow-sm p-6"
          >
            <div className="space-y-5">
              {/* Provider + Model Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                    Provider <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545]">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#1e2433] dark:text-white dark:border-[#2d3545]">
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                    Model Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.model_type}
                    onValueChange={(value) => setFormData({ ...formData, model_type: value })}
                  >
                    <SelectTrigger className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#1e2433] dark:text-white dark:border-[#2d3545]">
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

              {/* Model Name */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Model Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="e.g., gpt-4, claude-3-opus, llama-2-70b"
                  className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545] dark:placeholder:text-gray-500"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., GPT-4 Turbo, Claude 3 Opus"
                  className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545] dark:placeholder:text-gray-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the model's capabilities..."
                  rows={3}
                  className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545] dark:placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Context Window + Max Output Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                    Context Window (tokens)
                  </Label>
                  <Input
                    type="number"
                    value={formData.context_window}
                    onChange={(e) => setFormData({ ...formData, context_window: parseInt(e.target.value) || 0 })}
                    className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                    Max Output Tokens
                  </Label>
                  <Input
                    type="number"
                    value={formData.max_output_tokens}
                    onChange={(e) => setFormData({ ...formData, max_output_tokens: parseInt(e.target.value) || 0 })}
                    className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545]"
                  />
                </div>
              </div>

              {/* Cost Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                    Input Cost (per 1K tokens)
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.input_cost_per_1k_tokens}
                    onChange={(e) => setFormData({ ...formData, input_cost_per_1k_tokens: parseFloat(e.target.value) || 0 })}
                    className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                    Output Cost (per 1K tokens)
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.output_cost_per_1k_tokens}
                    onChange={(e) => setFormData({ ...formData, output_cost_per_1k_tokens: parseFloat(e.target.value) || 0 })}
                    className="bg-white dark:bg-[#161b22] dark:text-white dark:border-[#2d3545]"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-[#2d3545]" />

              {/* Enable Model Toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Model</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allow this model to be used</p>
                </div>
                <Switch
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                  className="data-[state=checked]:bg-[#105e6e]"
                />
              </div>

              {/* Set as Default Toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as Default</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Default model for this type</p>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center justify-end gap-3 pb-6"
          >
            <Button
              variant="outline"
              onClick={() => navigate('/models')}
              className="dark:bg-[#1e2433] dark:text-slate-300 dark:border-[#2d3545] dark:hover:bg-[#2d3545]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateModel}
              disabled={isSaving}
              className="bg-[#105e6e] text-white hover:bg-[#0d4d59]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Model'
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
