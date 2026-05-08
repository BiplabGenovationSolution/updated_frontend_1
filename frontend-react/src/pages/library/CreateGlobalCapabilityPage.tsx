import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Plus,
  X,
  ArrowLeft,
  Copy,
  Lock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { CapabilityParameter } from '@/lib/types'
import Editor from '@monaco-editor/react'

export default function CreateGlobalCapabilityPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)

  // Global Capability Form
  const [capabilityFormData, setCapabilityFormData] = useState({
    name: '',
    description: '',
    category: 'utility',
    code: '# Write your Python code here\ndef main():\n    return "Hello, World!"',
    parameters: [] as CapabilityParameter[],
    return_type: 'string',
    timeout_seconds: 30,
    tags: [] as string[]
  })

  const [newParameter, setNewParameter] = useState<CapabilityParameter>({
    name: '',
    type: 'string',
    description: '',
    required: true,
    copyable: false,
    sensitive: false
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth/login')
      return
    }
    if (!user.is_system_admin) {
      toast({
        title: 'Access Denied',
        description: 'Only system administrators can create global capabilities',
        variant: 'destructive',
        duration: 2000
      })
      navigate('/library')
      return
    }
  }, [user, authLoading, navigate])

  const addParameter = () => {
    if (newParameter.name.trim()) {
      setCapabilityFormData({
        ...capabilityFormData,
        parameters: [...capabilityFormData.parameters, { ...newParameter }]
      })
      setNewParameter({
        name: '',
        type: 'string',
        description: '',
        required: true,
        copyable: false,
        sensitive: false
      })
    }
  }

  const removeParameter = (index: number) => {
    setCapabilityFormData({
      ...capabilityFormData,
      parameters: capabilityFormData.parameters.filter((_, i) => i !== index)
    })
  }

  // Create Global Capability Handler
  const handleCreateGlobalCapability = async () => {
    if (!capabilityFormData.name.trim() || !capabilityFormData.code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required',
        variant: 'destructive',
        duration: 2000  
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await apiClient.capabilities.marketplace.createGlobal({
        name: capabilityFormData.name,
        description: capabilityFormData.description,
        category: capabilityFormData.category,
        code: capabilityFormData.code,
        parameters: capabilityFormData.parameters,
        return_type: capabilityFormData.return_type,
        timeout_seconds: capabilityFormData.timeout_seconds,
        tags: capabilityFormData.tags
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Global capability created successfully and is now available in the marketplace',
          duration: 2000  
        })
        navigate('/library?tab=capabilities')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create global capability',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 dark:bg-[#0d1117] min-h-screen">
      <div className="max-w-4xl mx-auto p-6 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Minimalist Header Statistics (Step Progress) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border shadow-sm hover:border-blue-500 transition-all cursor-default bg-white dark:bg-[#1e2433] dark:border-[#2d3545]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Step</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Creation</span>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:border-blue-500 transition-all cursor-default bg-white dark:bg-[#1e2433] dark:border-[#2d3545]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Visibility</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Global</span>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:border-blue-500 transition-all cursor-default bg-white dark:bg-[#1e2433] dark:border-[#2d3545]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Access</span>
            <span className="text-2xl font-bold text-slate-500 dark:text-slate-400 mt-1">Admin</span>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Button
          onClick={() => navigate('/library?tab=capabilities')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Global Capability</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Define shared logic available to all agents and users.
        </p>
      </div>

      <Alert className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 mb-6">
        <AlertCircle className="h-4 w-4 text-[#105e6e] dark:text-teal-400" />
        <AlertDescription className="text-[#105e6e] dark:text-teal-300">
          This is a system admin feature. Global capabilities will be visible to all users and can be used by any agent.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card className="p-6 dark:bg-[#161b22] dark:border-slate-800">
          <div className="space-y-4">
            <div>
              <Label htmlFor="global-cap-name">Capability Name *</Label>
              <Input
                id="global-cap-name"
                placeholder="e.g., Calculate Statistics"
                value={capabilityFormData.name}
                onChange={(e) => setCapabilityFormData({ ...capabilityFormData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="global-cap-description">Description</Label>
              <Textarea
                id="global-cap-description"
                placeholder="Describe what this capability does..."
                value={capabilityFormData.description}
                onChange={(e) => setCapabilityFormData({ ...capabilityFormData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="global-cap-category">Category</Label>
                <Select
                  value={capabilityFormData.category}
                  onValueChange={(value) => setCapabilityFormData({ ...capabilityFormData, category: value })}
                >
                  <SelectTrigger id="global-cap-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="data">Data Processing</SelectItem>
                    <SelectItem value="api">API Integration</SelectItem>
                    <SelectItem value="computation">Computation</SelectItem>
                    <SelectItem value="visualization">Visualization</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="global-cap-timeout">Timeout (seconds)</Label>
                <Input
                  id="global-cap-timeout"
                  type="number"
                  min="1"
                  max="300"
                  value={capabilityFormData.timeout_seconds}
                  onChange={(e) => setCapabilityFormData({ ...capabilityFormData, timeout_seconds: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 dark:bg-[#161b22] dark:border-slate-800">
          <div>
            <Label className="dark:text-white">Python Code *</Label>
            <div className="border rounded-lg overflow-hidden mt-2 dark:border-slate-800">
              <Editor
                height="400px"
                defaultLanguage="python"
                value={capabilityFormData.code}
                onChange={(value) => setCapabilityFormData({ ...capabilityFormData, code: value || '' })}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true
                }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Write Python code. Define a main() function that will be executed.
            </p>
          </div>
        </Card>

        <Card className="p-6 dark:bg-[#161b22] dark:border-slate-800">
          <div>
            <Label className="dark:text-white">Parameters</Label>
            <div className="space-y-3 mt-2">
              {/* Add Parameter Form */}
              <Card className="p-4 bg-gray-50 dark:bg-[#0d1117] dark:border-slate-800">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="param-name" className="text-xs dark:text-white">Name *</Label>
                      <Input
                        id="param-name"
                        placeholder="Parameter name"
                        value={newParameter.name}
                        onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                        className="dark:bg-[#161b22] dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="param-type" className="text-xs dark:text-white">Type</Label>
                      <Select
                        value={newParameter.type}
                        onValueChange={(value: any) => setNewParameter({ ...newParameter, type: value })}
                      >
                        <SelectTrigger id="param-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="array">Array</SelectItem>
                          <SelectItem value="object">Object</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="param-desc" className="text-xs dark:text-white">Description</Label>
                    <Input
                      id="param-desc"
                      placeholder="Parameter description"
                      value={newParameter.description || ''}
                      onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                      className="dark:bg-[#161b22] dark:border-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        id="param-required"
                        type="checkbox"
                        checked={newParameter.required}
                        onChange={(e) => setNewParameter({ ...newParameter, required: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-[#161b22]"
                      />
                      <Label htmlFor="param-required" className="text-sm font-normal cursor-pointer dark:text-gray-300">
                        Required
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="param-copyable"
                        type="checkbox"
                        checked={newParameter.copyable || false}
                        onChange={(e) => setNewParameter({ ...newParameter, copyable: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-[#161b22]"
                      />
                      <Label htmlFor="param-copyable" className="text-sm font-normal cursor-pointer flex items-center gap-1 dark:text-gray-300">
                        <Copy className="h-3 w-3" />
                        Copyable
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="param-sensitive"
                        type="checkbox"
                        checked={newParameter.sensitive || false}
                        onChange={(e) => setNewParameter({ ...newParameter, sensitive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-[#161b22]"
                      />
                      <Label htmlFor="param-sensitive" className="text-sm font-normal cursor-pointer flex items-center gap-1 dark:text-gray-300">
                        <Lock className="h-3 w-3" />
                        Sensitive
                      </Label>
                    </div>
                  </div>
                  <Button type="button" onClick={addParameter} size="sm" className="w-full bg-[#105e6e] hover:bg-[#0d4d59] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>
              </Card>

              {/* Parameters List */}
              {capabilityFormData.parameters.length > 0 && (
                <div className="space-y-2">
                  {capabilityFormData.parameters.map((param, index) => (
                    <Card key={index} className="p-3 dark:bg-[#0d1117] dark:border-slate-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-sm dark:text-white">{param.name}</code>
                            <Badge variant="secondary" className="text-xs">{param.type}</Badge>
                            {param.required && <Badge variant="outline" className="text-xs">required</Badge>}
                            {param.copyable && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Copy className="h-3 w-3" />
                                copyable
                              </Badge>
                            )}
                            {param.sensitive && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                sensitive
                              </Badge>
                            )}
                          </div>
                          {param.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">{param.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameter(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-auto pt-6 pb-6 pr-6">
        <Button
          variant="outline"
          onClick={() => navigate('/library?tab=capabilities')}
          className="dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateGlobalCapability}
          disabled={isSaving || !capabilityFormData.name.trim() || !capabilityFormData.code.trim()}
          className="bg-[#105e6e] hover:bg-[#0d4d59] text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Global Capability
            </>
          )}
        </Button>
      </div>
    </div>
    </div>
  )
}
