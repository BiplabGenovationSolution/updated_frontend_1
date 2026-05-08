import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

import {
  Save,
  Eye,
  Palette,
  Loader2,
  AlertCircle,
  Sparkles,
  Monitor,
  Smartphone,
  MessageSquare,
  FileJson,
  Code,
  Terminal,
  Zap,
  Plus,
  X,
  MoveUp,
  MoveDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Capability {
  id: string
  name: string
  description: string
  parameters: CapabilityParameter[]
  [key: string]: any
}

interface CapabilityParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description?: string
  required: boolean
  default?: any
}

interface AgentCapability {
  capability_id: string
  enabled: boolean
  custom_config?: Record<string, any> | null
}

interface InterfaceConfiguratorProps {
  agentId: string
  agentName: string
  agentType?: 'chat' | 'flow'
  capabilities?: Capability[]
  agentCapabilities?: AgentCapability[]
  flowNodes?: any[]
  onSave?: (config: any) => void
  initialConfig?: any
}

type InterfaceType = 'chat' | 'form' | 'json' | 'api' | 'wizard'

export function InterfaceConfigurator({
  agentId,
  agentName,
  agentType = 'chat',
  capabilities = [],
  agentCapabilities = [],
  flowNodes = [],
  onSave,
  initialConfig
}: InterfaceConfiguratorProps) {
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)

  // Auto-generate form fields from flow input nodes
  const generateFieldsFromFlowNodes = () => {
    const fields: any[] = []

    // Find input nodes (type starts with 'input.')
    const inputNodes = flowNodes.filter(node =>
      node.type?.startsWith('input.') && (node.config?.fields || node.config?.form_schema?.fields)
    )

    // Extract fields from the first input node
    if (inputNodes.length > 0) {
      const inputNode = inputNodes[0]
      // Check both config.fields and config.form_schema.fields
      const nodeFields = inputNode.config.fields || inputNode.config.form_schema?.fields

      if (Array.isArray(nodeFields)) {
        nodeFields.forEach((field: any) => {
          fields.push({
            name: field.name,
            label: field.label || field.name,
            type: field.type || 'text',
            required: field.required || false,
            placeholder: field.placeholder || `Enter ${field.label || field.name}`,
            default: field.default || field.default_value
          })
        })
      }
    }

    return fields
  }

  // Auto-generate form fields from capabilities
  const generateFieldsFromCapabilities = () => {
    const enabledCapIds = agentCapabilities.map(ac => ac.capability_id)
    const enabledCaps = capabilities.filter(cap => enabledCapIds.includes(cap.id))

    const fields: any[] = []
    enabledCaps.forEach(cap => {
      cap.parameters?.forEach(param => {
        fields.push({
          name: param.name,
          label: param.description || param.name,
          type: param.type === 'number' ? 'number' : param.type === 'boolean' ? 'checkbox' : 'text',
          required: param.required,
          placeholder: `Enter ${param.name}`,
          default: param.default
        })
      })
    })

    return fields
  }

  // Generate fields from either flow nodes or capabilities
  const generateFields = () => {
    // For flow agents, try to get fields from flow input nodes first
    if (agentType === 'flow' && flowNodes.length > 0) {
      const flowFields = generateFieldsFromFlowNodes()
      if (flowFields.length > 0) {
        return flowFields
      }
    }

    // Fall back to capabilities
    return generateFieldsFromCapabilities()
  }

  const [config, setConfig] = useState<any>({
    interface_type: 'chat' as InterfaceType,
    interface_config: {
      // Chat config
      greeting_message: 'Hi! How can I help you today?',
      placeholder_text: 'Type your message...',
      primary_color: '#6366F1',
      secondary_color: '#8B5CF6',
      theme: 'light',
      header_text: 'Online',
      // Form config
      form_title: agentName,
      form_subtitle: 'Fill out the form below to get started',
      fields: [],
      // JSON config
      schema: {},
      editor_theme: 'dark',
      // Output config
      output: {
        type: 'text',
        template: {}
      }
    },
    ...initialConfig
  })
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    if (initialConfig) {
      setConfig({
        interface_type: initialConfig.interface_type || 'chat',
        interface_config: {
          greeting_message: 'Hi! How can I help you today?',
          placeholder_text: 'Type your message...',
          primary_color: '#6366F1',
          secondary_color: '#8B5CF6',
          theme: 'light',
          header_text: 'Online',
          form_title: agentName,
          form_subtitle: 'Fill out the form below to get started',
          fields: [],
          schema: {},
          editor_theme: 'dark',
          output: { type: 'text', template: {} },
          ...initialConfig.interface_config
        }
      })
    }
  }, [initialConfig, agentName])

  // Auto-populate form fields when switching to form interface
  useEffect(() => {
    if (config.interface_type === 'form' && (!config.interface_config?.fields || config.interface_config.fields.length === 0)) {
      const autoFields = generateFields()
      if (autoFields.length > 0) {
        setConfig(prev => ({
          ...prev,
          interface_config: {
            ...(prev.interface_config || {}),
            fields: autoFields
          }
        }))
      }
    }
  }, [config.interface_type, agentCapabilities.length, capabilities.length, flowNodes.length])

  // Generate JSON schema from flow nodes or capabilities
  const generateSchema = () => {
    const properties: Record<string, any> = {}
    const required: string[] = []

    // For flow agents, try to get schema from flow input nodes first
    if (agentType === 'flow' && flowNodes.length > 0) {
      const inputNodes = flowNodes.filter(node =>
        node.type?.startsWith('input.') && (node.config?.fields || node.config?.form_schema?.fields)
      )

      if (inputNodes.length > 0) {
        const inputNode = inputNodes[0]
        // Check both config.fields and config.form_schema.fields
        const nodeFields = inputNode.config.fields || inputNode.config.form_schema?.fields

        if (Array.isArray(nodeFields)) {
          nodeFields.forEach((field: any) => {
            const fieldType = field.type || 'string'
            properties[field.name] = {
              type: fieldType === 'number' ? 'number' : fieldType === 'date' ? 'string' : 'string',
              description: field.label || field.name,
              ...(fieldType === 'date' && { format: 'date' })
            }
            if (field.required) {
              required.push(field.name)
            }
            if (field.default !== undefined) {
              properties[field.name].default = field.default
            }
          })

          if (Object.keys(properties).length > 0) {
            return {
              type: 'object',
              properties,
              ...(required.length > 0 && { required })
            }
          }
        }
      }
    }

    // Fall back to capabilities
    const enabledCapIds = agentCapabilities.map(ac => ac.capability_id)
    const enabledCaps = capabilities.filter(cap => enabledCapIds.includes(cap.id))

    if (enabledCaps.length > 0) {
      enabledCaps.forEach(cap => {
        cap.parameters?.forEach(param => {
          properties[param.name] = {
            type: param.type,
            description: param.description || param.name
          }
          if (param.required) {
            required.push(param.name)
          }
          if (param.default !== undefined) {
            properties[param.name].default = param.default
          }
        })
      })

      if (Object.keys(properties).length > 0) {
        return {
          type: 'object',
          properties,
          ...(required.length > 0 && { required })
        }
      }
    }

    return null
  }

  // Auto-populate JSON schema when switching to JSON interface
  useEffect(() => {
    if (config.interface_type === 'json' && (!config.interface_config?.schema || Object.keys(config.interface_config.schema || {}).length === 0)) {
      const schema = generateSchema()
      if (schema) {
        setConfig(prev => ({
          ...prev,
          interface_config: {
            ...(prev.interface_config || {}),
            schema
          }
        }))
      }
    }
  }, [config.interface_type, agentCapabilities.length, capabilities.length, flowNodes.length])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave?.(config)
      toast({
        title: 'Success',
        description: 'Interface configuration saved successfully',
        duration: 2000
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save interface configuration',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addFormField = () => {
    const newField = {
      name: '',
      label: '',
      type: 'text',
      required: false
    }
    setConfig({
      ...config,
      interface_config: {
        ...config.interface_config,
        fields: [...(config.interface_config.fields || []), newField]
      }
    })
  }

  const regenerateFields = () => {
    const autoFields = generateFields()
    setConfig({
      ...config,
      interface_config: {
        ...config.interface_config,
        fields: autoFields
      }
    })
    const source = agentType === 'flow' && flowNodes.length > 0 ? 'flow input nodes' : 'agent capabilities'
    toast({
      title: 'Fields Generated',
      description: `Generated ${autoFields.length} fields from ${source}`,
      duration: 2000
    })
  }

  const removeFormField = (index: number) => {
    setConfig({
      ...config,
      interface_config: {
        ...config.interface_config,
        fields: config.interface_config.fields.filter((_: any, i: number) => i !== index)
      }
    })
  }

  const updateFormField = (index: number, updates: any) => {
    const newFields = [...config.interface_config.fields]
    newFields[index] = { ...newFields[index], ...updates }
    setConfig({
      ...config,
      interface_config: {
        ...config.interface_config,
        fields: newFields
      }
    })
  }

  // Preview Components
  const ChatPreview = () => {
    const primaryColor = config.interface_config.primary_color || '#6366F1'
    const secondaryColor = config.interface_config.secondary_color || '#8B5CF6'
    const greeting = config.interface_config.greeting_message || 'Hi! How can I help you today?'
    const placeholder = config.interface_config.placeholder_text || 'Type your message...'
    const headerText = config.interface_config.header_text || 'Online'

    return (
      <div
        className={cn(
          "rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:bg-[#1e2433]",
          previewDevice === 'mobile' ? "h-[600px] max-w-[375px]" : "h-[600px]"
        )}
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div
            className="px-5 py-4 text-white"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <div className="font-semibold">{agentName}</div>
                <div className="text-xs opacity-90">{headerText}</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 space-y-4 overflow-auto bg-gray-50 dark:bg-[#2d3545]">
            <div className="flex gap-2.5 items-end">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
              </div>
              <div className="px-4 py-2.5 rounded-3xl text-sm bg-white dark:bg-[#353d4f] dark:text-white border border-gray-200 dark:border-[#3d4555] max-w-[75%]">
                {greeting}
              </div>
            </div>

            <div className="flex gap-2.5 items-end justify-end">
              <div
                className="px-4 py-2.5 rounded-3xl text-sm text-white max-w-[75%]"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
              >
                Hello! I need help with...
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-[#1e2433] border-t border-gray-200 dark:border-[#3d4555]">
            <div className="flex gap-2">
              <Input
                disabled
                placeholder={placeholder}
                className="flex-1"
              />
              <Button disabled style={{ background: primaryColor }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const FormPreview = () => {
    const primaryColor = config.interface_config.primary_color || '#6366F1'
    const secondaryColor = config.interface_config.secondary_color || '#8B5CF6'
    const formTitle = config.interface_config.form_title || agentName
    const formSubtitle = config.interface_config.form_subtitle || 'Fill out the form below to get started'

    return (
      <div
        className={cn(
          "rounded-2xl overflow-hidden shadow-xl p-8",
          previewDevice === 'mobile' ? "max-w-[375px]" : "w-full"
        )}
        style={{ backgroundColor: '#F9FAFB', minHeight: '600px' }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
            >
              <FileJson className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{formTitle}</h2>
            <p className="text-gray-600">{formSubtitle}</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {config.interface_config.fields && config.interface_config.fields.length > 0 ? (
              config.interface_config.fields.map((field: any, index: number) => (
                <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{field.label || field.name || 'Field'}</Label>
                  <Input
                    disabled
                    placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                    className="mt-2"
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <FileJson className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">Add form fields to see preview</p>
              </div>
            )}

            {config.interface_config.fields && config.interface_config.fields.length > 0 && (
              <Button
                disabled
                className="w-full"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`, color: 'white' }}
              >
                Submit
              </Button>
            )}
          </div>

          {/* Output Preview */}
          {config.interface_config.output?.type !== 'text' && (
            <div className="mt-8 p-6 bg-white rounded-xl border-2" style={{ borderColor: `${primaryColor}40` }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="text-sm font-semibold text-gray-700">Output Preview</span>
              </div>
              {config.interface_config.output?.type === 'card' && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {config.interface_config.output?.template?.title || '✅ Result Title'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {config.interface_config.output?.template?.subtitle || 'Subtitle will appear here'}
                  </div>
                </div>
              )}
              {config.interface_config.output?.type === 'table' && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Column 1</th>
                        <th className="px-4 py-2 text-left">Column 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-2">Sample</td>
                        <td className="px-4 py-2">Data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {config.interface_config.output?.type === 'list' && (
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span className="text-sm text-gray-700">List item 1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span className="text-sm text-gray-700">List item 2</span>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const JSONPreview = () => {
    const primaryColor = config.interface_config.primary_color || '#9333EA'
    const editorTheme = config.interface_config.editor_theme || 'dark'
    const isDark = editorTheme === 'dark'

    return (
      <div
        className={cn(
          "rounded-2xl overflow-hidden shadow-xl p-8",
          previewDevice === 'mobile' ? "max-w-[375px]" : "w-full"
        )}
        style={{
          backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
          minHeight: '600px'
        }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Code className="h-8 w-8 text-white" />
            </div>
            <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
              {agentName}
            </h2>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>JSON Interface</p>
          </div>

          {/* JSON Editor */}
          <div
            className={cn("rounded-xl p-4 font-mono text-sm border", isDark ? "border-gray-700" : "border-gray-300")}
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              color: isDark ? '#10B981' : '#059669'
            }}
          >
            <pre className="whitespace-pre-wrap">{(() => {
              // Generate example JSON from schema if available
              if (config.interface_config.schema && Object.keys(config.interface_config.schema).length > 0) {
                const schema = config.interface_config.schema
                const exampleData: Record<string, any> = {}

                if (schema.properties) {
                  Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
                    // Generate example values based on type
                    if (prop.default !== undefined) {
                      exampleData[key] = prop.default
                    } else if (prop.type === 'number') {
                      exampleData[key] = 0
                    } else if (prop.type === 'boolean') {
                      exampleData[key] = false
                    } else if (prop.format === 'date') {
                      exampleData[key] = '2024-01-01'
                    } else {
                      exampleData[key] = `example_${key}`
                    }
                  })
                }

                return JSON.stringify(exampleData, null, 2)
              }

              // Default placeholder
              return `{
  "message": "Your JSON input here",
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}`
            })()}</pre>
          </div>

          <Button disabled className="w-full mt-4" style={{ backgroundColor: primaryColor }}>
            Submit JSON
          </Button>

          {/* Output */}
          {config.interface_config.output?.type !== 'text' && (
            <div
              className={cn("mt-6 rounded-xl p-4 border", isDark ? "border-gray-700" : "border-gray-300")}
              style={{ backgroundColor: isDark ? '#111827' : '#FFFFFF' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
                <span className={cn("text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
                  Response
                </span>
              </div>
              <pre
                className="whitespace-pre-wrap font-mono text-xs"
                style={{ color: isDark ? '#10B981' : '#059669' }}
              >{`{
  "status": "success",
  "result": {...}
}`}</pre>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}

      <div
        className="
    flex items-center justify-between p-4 rounded-lg border mb-4
    bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50
    border-indigo-100

    dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
    dark:border-slate-700
  "
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Interface Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Configure how users interact with this agent
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>


      {/* Two-column layout */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Left: Configuration */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Interface Type */}
            <Card className="dark:bg-[#353d4f] dark:border-[#3d4555]">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">Interface Type</CardTitle>
                <CardDescription className="dark:text-gray-300">Choose how users interact with this agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'chat', icon: MessageSquare, label: '💬 Chat', desc: 'Conversation' },
                    { value: 'form', icon: FileJson, label: '📝 Form', desc: 'Structured' },
                    { value: 'json', icon: Code, label: '{ } JSON', desc: 'Developer' },
                    { value: 'api', icon: Terminal, label: '🔌 API', desc: 'REST API' },
                    { value: 'wizard', icon: Zap, label: '✨ Wizard', desc: 'Step-by-step' }
                  ].slice(0, 3).map((type) => (
                    <Card
                      key={type.value}
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:shadow-md dark:bg-[#2d3545] dark:border-[#3d4555]",
                        config.interface_type === type.value && "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      )}
                      onClick={() => setConfig({ ...config, interface_type: type.value })}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          config.interface_type === type.value ? "bg-indigo-600" : "bg-gray-100 dark:bg-[#1e2433]"
                        )}>
                          <type.icon className={cn("h-5 w-5", config.interface_type === type.value ? "text-white" : "text-gray-400")} />
                        </div>
                        <div>
                          <div className="font-semibold text-sm dark:text-white">{type.label}</div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{type.desc}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Configuration */}
            {config.interface_type === 'chat' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Chat Customization
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">Customize messages and appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm dark:text-white">Greeting Message</Label>
                    <Textarea
                      value={config.interface_config.greeting_message || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        interface_config: { ...config.interface_config, greeting_message: e.target.value }
                      })}
                      placeholder="Hi! How can I help you today?"
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-sm dark:text-white">Placeholder Text</Label>
                    <Input
                      value={config.interface_config.placeholder_text || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        interface_config: { ...config.interface_config, placeholder_text: e.target.value }
                      })}
                      placeholder="Type your message..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm dark:text-white">Header Text</Label>
                    <Input
                      value={config.interface_config.header_text || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        interface_config: { ...config.interface_config, header_text: e.target.value }
                      })}
                      placeholder="Online"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.interface_config.primary_color || '#6366F1'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, primary_color: e.target.value }
                          })}
                          className="w-12 h-9"
                        />
                        <Input
                          type="text"
                          value={config.interface_config.primary_color || '#6366F1'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, primary_color: e.target.value }
                          })}
                          className="flex-1 h-9 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Secondary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.interface_config.secondary_color || '#8B5CF6'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, secondary_color: e.target.value }
                          })}
                          className="w-12 h-9"
                        />
                        <Input
                          type="text"
                          value={config.interface_config.secondary_color || '#8B5CF6'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, secondary_color: e.target.value }
                          })}
                          className="flex-1 h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* <Alert className="py-2 bg-blue-50 border-blue-200  dark:bg-sky-950 tex">
                    <AlertCircle className="h-3 w-3 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-800 ">
                      Changes appear instantly in the preview on the right
                    </AlertDescription>
                  </Alert> */}
                  <Alert
                    className="
                                            relative py-2 px-4
                                            border border-sky-900
                                            bg-blue-50

                                            dark:bg-gradient-to-r dark:from-sky-950 dark:via-sky-900 dark:to-sky-950
                        rounded-md
                      "
                  >
                    {/* Left icon (vertically centered) */}
                    <AlertCircle
                      className="
                          absolute left-4 top-1/2 -translate-y-1/2
                          h-4 w-4
                          text-blue-600 dark:text-sky-400
                        "
                    />

                    {/* Centered text */}
                    <AlertDescription
                      className="
                          text-xs text-blue-800 dark:text-sky-200
                         
                        "
                    >
                      Changes appear instantly in the preview on the right
                    </AlertDescription>
                  </Alert>


                </CardContent>
              </Card>
            )}

            {/* Form Configuration */}
            {config.interface_type === 'form' && (
              <Card className="dark:bg-[#353d4f] dark:border-[#3d4555]">
                <CardHeader>
                  <CardTitle className="text-base dark:text-white">Form Configuration</CardTitle>
                  <CardDescription className="dark:text-gray-300">Customize form appearance and fields</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-[#2d3545] rounded-lg">
                    <div>
                      <Label className="text-sm dark:text-white">Form Title</Label>
                      <Input
                        value={config.interface_config.form_title || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          interface_config: { ...config.interface_config, form_title: e.target.value }
                        })}
                        placeholder={agentName}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm dark:text-white">Form Subtitle</Label>
                      <Input
                        value={config.interface_config.form_subtitle || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          interface_config: { ...config.interface_config, form_subtitle: e.target.value }
                        })}
                        placeholder="Fill out the form below to get started"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.interface_config.primary_color || '#6366F1'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, primary_color: e.target.value }
                          })}
                          className="w-12 h-9"
                        />
                        <Input
                          type="text"
                          value={config.interface_config.primary_color || '#6366F1'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, primary_color: e.target.value }
                          })}
                          className="flex-1 h-9 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Secondary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.interface_config.secondary_color || '#8B5CF6'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, secondary_color: e.target.value }
                          })}
                          className="w-12 h-9"
                        />
                        <Input
                          type="text"
                          value={config.interface_config.secondary_color || '#8B5CF6'}
                          onChange={(e) => setConfig({
                            ...config,
                            interface_config: { ...config.interface_config, secondary_color: e.target.value }
                          })}
                          className="flex-1 h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold dark:text-white">Form Fields</Label>
                      {(agentCapabilities.length > 0 || (agentType === 'flow' && flowNodes.length > 0)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={regenerateFields}
                          className="h-7 text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {agentType === 'flow' && flowNodes.length > 0 ? 'Generate from Flow' : 'Generate from Capabilities'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {config.interface_config.fields?.length === 0 && (agentCapabilities.length > 0 || (agentType === 'flow' && flowNodes.length > 0)) && (
                        <Alert className="py-2 bg-purple-50 dark:bg-[#2d3545] border-purple-200 dark:border-[#3d4555]">
                          <Sparkles className="h-3 w-3 text-purple-600" />
                          <AlertDescription className="text-xs text-purple-800 dark:text-purple-300">
                            {agentType === 'flow' && flowNodes.length > 0
                              ? 'Click "Generate from Flow" to auto-populate fields from your workflow input nodes'
                              : 'Click "Generate from Capabilities" to auto-populate fields from your agent\'s tools'}
                          </AlertDescription>
                        </Alert>
                      )}
                      {config.interface_config.fields?.map((field: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#2d3545] rounded-lg border dark:border-[#3d4555]">
                          <Input
                            value={field.name}
                            onChange={(e) => updateFormField(index, { name: e.target.value })}
                            placeholder="Field name"
                            className="flex-1"
                          />
                          <Input
                            value={field.label}
                            onChange={(e) => updateFormField(index, { label: e.target.value })}
                            placeholder="Label"
                            className="flex-1"
                          />
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateFormField(index, { type: value })}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFormField(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addFormField}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  </div>

                  <Alert className="py-2 bg-blue-50 dark:bg-[#2d3545] border-blue-200 dark:border-[#3d4555]">
                    <AlertCircle className="h-3 w-3 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
                      Changes appear instantly in the preview on the right
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}





            {/* JSON Configuration */}
            {config.interface_type === 'json' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    JSON Editor Configuration
                  </CardTitle>
                  <CardDescription>Customize the JSON editor appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Editor Theme</Label>
                    <Select
                      value={config.interface_config.editor_theme || 'dark'}
                      onValueChange={(value) => setConfig({
                        ...config,
                        interface_config: { ...config.interface_config, editor_theme: value }
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">🌙 Dark Theme</SelectItem>
                        <SelectItem value="light">☀️ Light Theme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={config.interface_config.primary_color || '#6366F1'}
                        onChange={(e) => setConfig({
                          ...config,
                          interface_config: { ...config.interface_config, primary_color: e.target.value }
                        })}
                        className="w-12 h-9"
                      />
                      <Input
                        type="text"
                        value={config.interface_config.primary_color || '#6366F1'}
                        onChange={(e) => setConfig({
                          ...config,
                          interface_config: { ...config.interface_config, primary_color: e.target.value }
                        })}
                        className="flex-1 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">JSON Schema</Label>
                      {(agentCapabilities.length > 0 || (agentType === 'flow' && flowNodes.length > 0)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const schema = generateSchema()
                            if (schema) {
                              setConfig({
                                ...config,
                                interface_config: {
                                  ...config.interface_config,
                                  schema
                                }
                              })

                              const source = agentType === 'flow' && flowNodes.length > 0 ? 'flow input nodes' : 'agent capabilities'
                              toast({
                                title: 'Schema Generated',
                                description: `Generated JSON schema from ${source}`,
                                duration: 2000,
                              })
                            }
                          }}
                          className="h-7 text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {agentType === 'flow' && flowNodes.length > 0 ? 'Generate from Flow' : 'Generate from Capabilities'}
                        </Button>
                      )}
                    </div>
                    {config.interface_config.schema && Object.keys(config.interface_config.schema).length > 0 ? (
                      <div className="p-3 bg-gray-900 text-green-400 rounded-lg border border-gray-700 font-mono text-xs overflow-auto max-h-48">
                        <pre>{JSON.stringify(config.interface_config.schema, null, 2)}</pre>
                      </div>
                    ) : (
                      <Alert className="py-2 bg-purple-50 border-purple-200">
                        <Sparkles className="h-3 w-3 text-purple-600" />
                        <AlertDescription className="text-xs text-purple-800">
                          {agentType === 'flow' && flowNodes.length > 0
                            ? 'Click "Generate from Flow" to auto-populate schema from your workflow input nodes'
                            : (agentCapabilities.length > 0
                              ? 'Click "Generate from Capabilities" to auto-populate schema from your agent\'s tools'
                              : 'Add capabilities to your agent or configure workflow input nodes to generate a JSON schema')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Alert className="py-2 bg-blue-50 border-blue-200">
                    <AlertCircle className="h-3 w-3 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-800">
                      Changes appear instantly in the preview on the right
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Output Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Output Format</CardTitle>
                <CardDescription>How results are displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={config.interface_config?.output?.type || 'text'}
                  onValueChange={(value) => setConfig({
                    ...config,
                    interface_config: {
                      ...(config.interface_config || {}),
                      output: { ...(config.interface_config?.output || {}), type: value }
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">📄 Plain Text</SelectItem>
                    <SelectItem value="card">💳 Structured Card</SelectItem>
                    <SelectItem value="table">📊 Table</SelectItem>
                    <SelectItem value="list">📋 List</SelectItem>
                  </SelectContent>
                </Select>

                {config.interface_config?.output?.type === 'card' && (
                  <div className="space-y-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Input
                      placeholder="Title (e.g., ✅ Claim Approved)"
                      value={config.interface_config?.output?.template?.title || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        interface_config: {
                          ...(config.interface_config || {}),
                          output: {
                            ...(config.interface_config?.output || {}),
                            template: { ...(config.interface_config?.output?.template || {}), title: e.target.value }
                          }
                        }
                      })}
                    />
                    <Input
                      placeholder="Subtitle (optional)"
                      value={config.interface_config?.output?.template?.subtitle || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        interface_config: {
                          ...(config.interface_config || {}),
                          output: {
                            ...(config.interface_config?.output || {}),
                            template: { ...(config.interface_config?.output?.template || {}), subtitle: e.target.value }
                          }
                        }
                      })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-[480px] flex-shrink-0">
          <div className="sticky top-0">
            <Card className="border-2 dark:bg-[#353d4f] dark:border-[#3d4555]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2 dark:text-white">
                      <Eye className="h-4 w-4" />
                      Live Preview
                    </CardTitle>
                    <CardDescription className="text-xs dark:text-gray-300">Updates in real-time</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewDevice('desktop')}
                    >
                      <Monitor className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewDevice('mobile')}
                    >
                      <Smartphone className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 bg-gray-50 dark:bg-[#2d3545]">
                {config.interface_type === 'chat' && <ChatPreview />}
                {config.interface_type === 'form' && <FormPreview />}
                {config.interface_type === 'json' && <JSONPreview />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
