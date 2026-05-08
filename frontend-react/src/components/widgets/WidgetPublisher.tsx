import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Save,
  Code,
  Eye,
  EyeOff,
  Palette,
  Settings,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Monitor,
  Smartphone,
  MessageSquare,
  Upload,
  FileText,
  Image as ImageIcon,
  Maximize2,
  LayoutGrid,
  GripVertical,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Zap,
  Key
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface WidgetPublisherProps {
  agentId: string
  agentName: string
  agentType?: 'chat' | 'flow'
  interfaceType?: 'chat' | 'form' | 'json' | 'api' | 'wizard'
  interfaceConfig?: Record<string, any>
  onSave?: () => void
}

type WidgetMode = 'popup' | 'inline' | 'form_builder'

interface FormModule {
  id: string
  type: 'input' | 'output' | 'button' | 'text' | 'image'
  label: string
  placeholder?: string
  required?: boolean
  config?: any
  content?: string  // For rich text in text modules
}

export function WidgetPublisher({ agentId, agentName, agentType = 'chat', interfaceType = 'chat', interfaceConfig, onSave }: WidgetPublisherProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<any>({
    widget_mode: 'popup' as WidgetMode,
    widget_type: 'chat',
    theme: 'light',
    primary_color: '#6366F1',
    secondary_color: '#8B5CF6',
    accent_color: '#10B981',
    text_color: '#1F2937',
    background_color: '#FFFFFF',
    background_gradient: false,
    position: 'bottom-right',
    offset_x: 20,
    offset_y: 20,
    border_radius: '16',
    agent_name: agentName,
    agent_avatar_url: '',
    greeting_message: 'Hi! How can I help you today?',
    placeholder_text: 'Type your message...',
    auto_open: false,
    auto_open_delay_ms: 3000,
    show_typing_indicator: true,
    enable_sound: true,
    enable_emoji: true,
    allowed_domains: [],
    custom_css: '',
    session_persistence: true,
    max_history_messages: 50,
    collect_analytics: true,
    enabled: false,
    // Static text fields
    header_text: '',
    footer_text: '',
    disclaimer_text: '',
    help_text: '',
    privacy_policy_url: '',
    terms_of_service_url: '',
    // Inline specific
    container_width: '100%',
    container_height: '700px',
    // Form builder specific
    form_modules: [] as FormModule[],
    form_title: 'Get Started',
    form_subtitle: 'Fill out the form below and our AI will assist you'
  })

  const [apiKey, setApiKey] = useState<string>('')
  const [domainInput, setDomainInput] = useState('')
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showEmbedDialog, setShowEmbedDialog] = useState(false)
  const [draggedModule, setDraggedModule] = useState<string | null>(null)
  const [copiedApiKey, setCopiedApiKey] = useState(false)
  const [copiedEndpoint, setCopiedEndpoint] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    loadWidgetConfig()
  }, [agentId])

  const loadWidgetConfig = async () => {
    if (!agentId || !user?.organization_id) {
      console.warn('Missing agentId or organization_id for widget config')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      try {
        const widgetResponse = await apiClient.widgets.get(agentId, user.organization_id)
        if (widgetResponse.success && widgetResponse.data) {
          setConfig(prev => ({
            ...prev,
            ...widgetResponse.data
          }))
        }
      } catch (widgetError: any) {
        console.log('No existing widget config found, will create on save:', widgetError?.message)
      }

      try {
        const apiKeysResponse = await apiClient.apiKeys.list({
          agent_id: agentId,
          organization_id: user.organization_id
        })

        if (apiKeysResponse.success && apiKeysResponse.data?.api_keys?.length > 0) {
          setApiKey('****** (existing key)')
        } else {
          const createKeyResponse = await apiClient.apiKeys.create({
            name: `Widget Key - ${agentName}`,
            organization_id: user.organization_id,
            agent_id: agentId,
            scopes: ['widget.read', 'chat.create'],
            rate_limit: {
              requests_per_minute: 60,
              requests_per_day: 10000
            }
          })

          if (createKeyResponse.success && createKeyResponse.data?.api_key) {
            setApiKey(createKeyResponse.data.api_key)
          }
        }
      } catch (apiKeyError: any) {
        console.error('Failed to load/create API key:', apiKeyError?.message)
      }
    } catch (error: any) {
      console.error('Failed to load widget config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!agentId || !user?.organization_id) return

    try {
      setIsSaving(true)

      const configData = { ...config }
      delete configData.enabled

      let response = await apiClient.widgets.update(agentId, user.organization_id, configData)

      if (!response.success) {
        response = await apiClient.widgets.create(agentId, user.organization_id, configData)
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Widget configuration saved successfully',
          duration: 2000,
        })
        onSave?.()
      } else {
        throw new Error(response.error || 'Failed to save widget configuration')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save widget configuration',
        variant: 'destructive',
        duration: 2000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleEnabled = async () => {
    if (!agentId || !user?.organization_id) return

    try {
      const response = await apiClient.widgets.toggle(agentId, user.organization_id, !config.enabled)
      if (response.success) {
        setConfig(prev => ({ ...prev, enabled: !prev.enabled }))
        toast({
          title: 'Success',
          description: `Widget ${!config.enabled ? 'enabled' : 'disabled'} successfully`,
          duration: 2000,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to toggle widget status',
        variant: 'destructive',
        duration: 2000,
      })
    }
  }

  const addDomain = () => {
    if (domainInput.trim() && !config.allowed_domains.includes(domainInput.trim())) {
      setConfig(prev => ({
        ...prev,
        allowed_domains: [...prev.allowed_domains, domainInput.trim()]
      }))
      setDomainInput('')
    }
  }

  const removeDomain = (domain: string) => {
    setConfig(prev => ({
      ...prev,
      allowed_domains: prev.allowed_domains.filter((d: string) => d !== domain)
    }))
  }

  const addFormModule = (type: FormModule['type']) => {
    const newModule: FormModule = {
      id: `module_${Date.now()}`,
      type,
      label: type === 'input' ? 'Your Question' : type === 'output' ? 'AI Response' : type === 'button' ? 'Submit' : type === 'text' ? 'Instructions' : 'Image',
      placeholder: type === 'input' ? 'Type your message here...' : undefined,
      required: type === 'input',
      config: {},
      content: type === 'text' ? 'Enter your instructions or information here. You can format this text with multiple lines and styling.' : undefined
    }

    setConfig(prev => ({
      ...prev,
      form_modules: [...prev.form_modules, newModule]
    }))
  }

  const removeFormModule = (moduleId: string) => {
    setConfig(prev => ({
      ...prev,
      form_modules: prev.form_modules.filter((m: FormModule) => m.id !== moduleId)
    }))
  }

  const updateFormModule = (moduleId: string, updates: Partial<FormModule>) => {
    setConfig(prev => ({
      ...prev,
      form_modules: prev.form_modules.map((m: FormModule) =>
        m.id === moduleId ? { ...m, ...updates } : m
      )
    }))
  }

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    setConfig(prev => {
      const modules = [...prev.form_modules]
      const index = modules.findIndex((m: FormModule) => m.id === moduleId)

      if (index === -1) {
        console.warn('Module not found:', moduleId)
        return prev
      }

      const newIndex = direction === 'up' ? index - 1 : index + 1

      // Check bounds
      if (newIndex < 0 || newIndex >= modules.length) {
        return prev
      }

      // Swap modules using temp variable for clarity
      const temp = modules[index]
      modules[index] = modules[newIndex]
      modules[newIndex] = temp

      console.log(`Moved module ${moduleId} ${direction} from ${index} to ${newIndex}`)

      return {
        ...prev,
        form_modules: modules
      }
    })
  }

  const getEmbedCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':8000') : 'http://localhost:8000'

    if (config.widget_mode === 'inline') {
      return `<!-- Mentis Inline Chat Widget -->
<div id="mentis-chat-container" style="width: ${config.container_width}; height: ${config.container_height};"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget-inline.js';
    script.async = true;
    script.onload = function() {
      if (window.MentisInlineWidget) {
        window.MentisInlineWidget.init({
          containerId: 'mentis-chat-container',
          agentId: '${agentId}',
          apiKey: '${apiKey}',
          apiBaseUrl: '${baseUrl}',
          theme: '${config.theme}',
          primaryColor: '${config.primary_color}',
          secondaryColor: '${config.secondary_color}'
        });
      }
    };
    document.head.appendChild(script);
  })();
</script>`
    }

    if (config.widget_mode === 'form_builder') {
      return `<!-- Mentis Custom Form Widget -->
<div id="mentis-form-container"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget-form.js';
    script.async = true;
    script.onload = function() {
      if (window.MentisFormWidget) {
        window.MentisFormWidget.init({
          containerId: 'mentis-form-container',
          agentId: '${agentId}',
          apiKey: '${apiKey}',
          apiBaseUrl: '${baseUrl}',
          modules: ${JSON.stringify(config.form_modules)},
          theme: '${config.theme}',
          primaryColor: '${config.primary_color}',
          secondaryColor: '${config.secondary_color}'
        });
      }
    };
    document.head.appendChild(script);
  })();
</script>`
    }

    return `<!-- Mentis Chat Widget (Popup) -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.onload = function() {
      if (window.MentisWidget) {
        window.MentisWidget.init({
          agentId: '${agentId}',
          apiKey: '${apiKey}',
          apiBaseUrl: '${baseUrl}',
          theme: '${config.theme}',
          primaryColor: '${config.primary_color}',
          position: '${config.position}',
          autoOpen: ${config.auto_open}
        });
      }
    };
    document.head.appendChild(script);
  })();
</script>`
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode())
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
    toast({
      title: 'Copied!',
      description: 'Embed code copied to clipboard',
      duration: 2000,
    })
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopiedApiKey(true)
    setTimeout(() => setCopiedApiKey(false), 2000)
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
      duration: 2000,
    })
  }

  const copyEndpoint = (endpoint: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':8000') : 'http://localhost:8000'
    navigator.clipboard.writeText(`${baseUrl}${endpoint}`)
    setCopiedEndpoint(endpoint)
    setTimeout(() => setCopiedEndpoint(''), 2000)
    toast({
      title: 'Copied!',
      description: 'Endpoint URL copied to clipboard',
      duration: 2000,
    })
  }

  const regenerateApiKey = async () => {
    if (!user?.organization_id) return

    try {
      const createKeyResponse = await apiClient.apiKeys.create({
        name: `Widget Key - ${agentName} (Regenerated)`,
        organization_id: user.organization_id,
        agent_id: agentId,
        scopes: ['widget.read', 'chat.create'],
        rate_limit: {
          requests_per_minute: 60,
          requests_per_day: 10000
        }
      })

      if (createKeyResponse.success && createKeyResponse.data?.api_key) {
        setApiKey(createKeyResponse.data.api_key)
        toast({
          title: 'Success',
          description: 'New API key generated. Update your integrations with the new key.',
          duration: 2000,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate new API key',
        variant: 'destructive',
        duration: 2000,
      })
    }
  }

  // Beautiful gradient background helper
  const getGradientStyle = () => {
    if (config.background_gradient) {
      return {
        background: `linear-gradient(135deg, ${config.primary_color}15 0%, ${config.secondary_color}15 100%)`
      }
    }
    return { backgroundColor: config.background_color }
  }

  // Modern chat bubble style
  const getChatBubbleStyle = (isUser: boolean) => {
    if (isUser) {
      return {
        background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`,
        borderRadius: `${config.border_radius}px ${config.border_radius}px 4px ${config.border_radius}px`
      }
    }
    return {
      backgroundColor: '#F3F4F6',
      borderRadius: `${config.border_radius}px ${config.border_radius}px ${config.border_radius}px 4px`
    }
  }

  // Preview components - Intercom-style design
  const PopupPreview = () => (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shadow-xl",
        previewDevice === 'mobile' ? "h-[600px] max-w-[375px]" : "h-[600px]"
      )}
      style={{ backgroundColor: '#FAFBFC' }}
    >
      {/* Simulated webpage backdrop */}
      <div className="p-6 space-y-3">
        <div className="h-5 bg-gray-200/60 rounded w-3/4"></div>
        <div className="h-4 bg-gray-100/60 rounded w-1/2"></div>
        <div className="h-4 bg-gray-100/60 rounded w-5/6"></div>
      </div>

      {/* Intercom-style chat popup */}
      <div
        className={cn(
          "absolute bg-white rounded-3xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col",
          previewDevice === 'mobile' ? "inset-4" : "bottom-24 w-[380px] h-[550px]",
          config.position.includes('right') && previewDevice === 'desktop' ? "right-6" : "",
          config.position.includes('left') && previewDevice === 'desktop' ? "left-6" : ""
        )}
      >
        {/* Clean header - Intercom style */}
        <div
          className="px-5 py-4 text-white relative"
          style={{
            background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4" style={{ color: config.primary_color }} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[15px]">{config.agent_name}</div>
              {config.header_text && (
                <div className="text-xs opacity-90 mt-0.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  {config.header_text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages area - clean and spacious */}
        <div className="flex-1 p-5 space-y-4 overflow-auto bg-white">
          {config.greeting_message && (
            <div className="flex gap-2.5 items-end">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: `${config.primary_color}15` }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: config.primary_color }} />
              </div>
              <div
                className="px-4 py-2.5 rounded-3xl text-[14px] text-gray-800 max-w-[75%] leading-relaxed"
                style={{
                  backgroundColor: '#F3F4F6',
                  borderBottomLeftRadius: '6px'
                }}
              >
                {config.greeting_message}
              </div>
            </div>
          )}

          {/* Example user message - Intercom style */}
          <div className="flex gap-2.5 items-end justify-end">
            <div
              className="px-4 py-2.5 rounded-3xl text-[14px] text-white max-w-[75%] leading-relaxed shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`,
                borderBottomRightRadius: '6px'
              }}
            >
              Hello! I need help with...
            </div>
          </div>

          {/* Typing indicator - clean design */}
          <div className="flex gap-2.5 items-end">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: `${config.primary_color}15` }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: config.primary_color }} />
            </div>
            <div className="px-4 py-3 bg-gray-100 rounded-3xl" style={{ borderBottomLeftRadius: '6px' }}>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Input area - Intercom style */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                disabled
                placeholder={config.placeholder_text}
                className="w-full px-4 py-3 text-[14px] bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': `${config.primary_color}40` } as any}
              />
            </div>
            <button
              disabled
              className="p-3 rounded-2xl text-white transition-all hover:scale-105 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <div className="text-[11px] text-gray-400 mt-2 text-center">
            Powered by {config.agent_name}
          </div>
        </div>
      </div>

      {/* Floating button - Intercom style */}
      <div
        className="absolute w-14 h-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex items-center justify-center cursor-pointer transition-all hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`,
          [config.position.includes('bottom') ? 'bottom' : 'top']: `${config.offset_y}px`,
          [config.position.includes('right') ? 'right' : 'left']: `${config.offset_x}px`
        }}
      >
        <MessageSquare className="h-6 w-6 text-white" strokeWidth={2.5} />
      </div>
    </div>
  )

  const InlinePreview = () => (
    <div
      className="rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200"
      style={{
        backgroundColor: '#ffffff',
        width: previewDevice === 'mobile' ? '100%' : config.container_width,
        height: config.container_height,
        maxWidth: previewDevice === 'mobile' ? '375px' : 'none'
      }}
    >
      <div className="h-full flex flex-col">
        {/* Clean header - Intercom style */}
        <div
          className="px-6 py-5 text-white relative"
          style={{
            background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <Zap className="h-5 w-5" style={{ color: config.primary_color }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[17px] font-semibold">{config.agent_name}</h3>
              {config.header_text && (
                <p className="text-xs opacity-90 mt-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  {config.header_text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages area - Intercom style */}
        <div className="flex-1 p-5 space-y-4 overflow-auto bg-white">
          {config.greeting_message && (
            <div className="flex gap-2.5 items-end">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: `${config.primary_color}15` }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: config.primary_color }} />
              </div>
              <div
                className="px-4 py-2.5 rounded-3xl text-[14px] text-gray-800 max-w-[75%] leading-relaxed"
                style={{
                  backgroundColor: '#F3F4F6',
                  borderBottomLeftRadius: '6px'
                }}
              >
                {config.greeting_message}
              </div>
            </div>
          )}

          {/* Example message */}
          <div className="flex gap-2.5 items-end justify-end">
            <div
              className="px-4 py-2.5 rounded-3xl text-[14px] text-white max-w-[75%] leading-relaxed shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`,
                borderBottomRightRadius: '6px'
              }}
            >
              Tell me more about your services
            </div>
          </div>
        </div>

        {/* Input area - Intercom style */}
        <div className="p-5 bg-white border-t border-gray-100">
          <div className="flex gap-2.5 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                disabled
                placeholder={config.placeholder_text}
                className="w-full px-4 py-3.5 text-[14px] bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': `${config.primary_color}40` } as any}
              />
            </div>
            <button
              disabled
              className="p-3.5 rounded-2xl text-white transition-all hover:scale-105 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <div className="text-[11px] text-gray-400 mt-2.5 text-center">
            Powered by {config.agent_name}
          </div>
        </div>
      </div>
    </div>
  )

  const FormBuilderPreview = () => (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100 p-8"
      style={{
        ...getGradientStyle(),
        width: previewDevice === 'mobile' ? '100%' : '100%',
        minHeight: '600px',
        maxWidth: previewDevice === 'mobile' ? '375px' : 'none'
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Beautiful header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`
            }}
          >
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: config.primary_color }}>
            {config.form_title}
          </h2>
          <p className="text-gray-600">{config.form_subtitle}</p>
        </div>

        {config.form_modules.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200">
            <LayoutGrid className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium">Add modules to build your form</p>
            <p className="text-sm text-gray-400 mt-1">Drag to reorder after adding</p>
          </div>
        ) : (
          <div className="space-y-4">
            {config.form_modules.map((module: FormModule, index: number) => (
              <div key={module.id} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-100">
                {module.type === 'input' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">{module.label}</Label>
                    <Input
                      disabled
                      placeholder={module.placeholder}
                      className="text-sm border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500"
                    />
                  </div>
                )}
                {module.type === 'output' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">{module.label}</Label>
                    <div
                      className="border-2 rounded-xl p-4"
                      style={{ borderColor: `${config.primary_color}40`, backgroundColor: `${config.primary_color}08` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`
                          }}
                        >
                          <Sparkles className="h-4 w-4 text-white m-2" />
                        </div>
                        <div className="text-sm text-gray-600 flex-1">
                          AI-generated response will appear here...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {module.type === 'button' && (
                  <Button
                    disabled
                    size="lg"
                    className="w-full py-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`
                    }}
                  >
                    {module.label}
                  </Button>
                )}
                {module.type === 'text' && (
                  <div className="space-y-2">
                    {module.label && (
                      <Label className="text-sm font-semibold text-gray-700">{module.label}</Label>
                    )}
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {module.content || module.label}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {config.footer_text && (
          <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t">
            {config.footer_text}
          </div>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Publish as Embeddable Widget</h3>
          <p className="text-sm text-gray-600">Enterprise-grade, beautiful, and fully customizable</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Code className="h-3 w-3 mr-2" />
                Get Embed Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Embed Code</DialogTitle>
                <DialogDescription>
                  Copy and paste this code into your website
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Alert className="py-2 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-3 w-3 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-800">
                    {config.widget_mode === 'popup' && 'Add before the </body> tag'}
                    {config.widget_mode === 'inline' && 'Place where you want the chat'}
                    {config.widget_mode === 'form_builder' && 'Place where you want the form'}
                  </AlertDescription>
                </Alert>

                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto max-h-96">
                    <code>{getEmbedCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    onClick={copyEmbedCode}
                    className="absolute top-2 right-2"
                    variant="secondary"
                  >
                    {copiedEmbed ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggleEnabled}
              className="data-[state=checked]:bg-green-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {config.enabled ? 'Published' : 'Unpublished'}
            </span>
          </div>
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

            {/* Configured Interface */}
            {interfaceConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Configured Interface
                  </CardTitle>
                  <CardDescription>
                    Interface configured in the Interface tab
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-600">
                        {interfaceType === 'chat' && '💬 Chat Interface'}
                        {interfaceType === 'form' && '📝 Form Interface'}
                        {interfaceType === 'json' && '{ } JSON Interface'}
                        {interfaceType === 'api' && '🔌 API Interface'}
                        {interfaceType === 'wizard' && '✨ Wizard Interface'}
                      </Badge>
                    </div>

                    {/* Show Form Fields */}
                    {interfaceType === 'form' && interfaceConfig.fields && interfaceConfig.fields.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Form Fields ({interfaceConfig.fields.length})</Label>
                        <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                          {interfaceConfig.fields.map((field: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm py-1">
                              <span className="font-medium text-gray-700">{field.label || field.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {field.type || 'text'}
                                </Badge>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show JSON Schema */}
                    {interfaceType === 'json' && interfaceConfig.schema && Object.keys(interfaceConfig.schema).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">JSON Schema</Label>
                        <div className="p-3 bg-gray-900 text-green-400 rounded-lg border border-gray-700 font-mono text-xs overflow-auto max-h-48">
                          <pre>{JSON.stringify(interfaceConfig.schema, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    <Alert className="py-2 bg-blue-50 border-blue-200">
                      <AlertCircle className="h-3 w-3 text-blue-600" />
                      <AlertDescription className="text-xs text-blue-800">
                        The published widget will use this interface configuration
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Widget Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Widget Mode</CardTitle>
                <CardDescription>Choose display style</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Card
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-md",
                      config.widget_mode === 'popup' && "ring-2 ring-indigo-500 bg-indigo-50"
                    )}
                    onClick={() => setConfig({ ...config, widget_mode: 'popup' })}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                        config.widget_mode === 'popup' ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gray-100"
                      )}>
                        <MessageSquare className={cn("h-6 w-6", config.widget_mode === 'popup' ? "text-white" : "text-gray-400")} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Popup Chat</div>
                        <p className="text-xs text-gray-600 mt-1">Intercom style</p>
                      </div>
                    </div>
                  </Card>

                  <Card
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-md",
                      config.widget_mode === 'inline' && "ring-2 ring-purple-500 bg-purple-50"
                    )}
                    onClick={() => setConfig({ ...config, widget_mode: 'inline' })}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                        config.widget_mode === 'inline' ? "bg-gradient-to-br from-purple-500 to-pink-600" : "bg-gray-100"
                      )}>
                        <Maximize2 className={cn("h-6 w-6", config.widget_mode === 'inline' ? "text-white" : "text-gray-400")} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Inline Chat</div>
                        <p className="text-xs text-gray-600 mt-1">Embedded</p>
                      </div>
                    </div>
                  </Card>

                  <Card
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-md",
                      config.widget_mode === 'form_builder' && "ring-2 ring-green-500 bg-green-50"
                    )}
                    onClick={() => setConfig({ ...config, widget_mode: 'form_builder' })}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                        config.widget_mode === 'form_builder' ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gray-100"
                      )}>
                        <LayoutGrid className={cn("h-6 w-6", config.widget_mode === 'form_builder' ? "text-white" : "text-gray-400")} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Form Builder</div>
                        <p className="text-xs text-gray-600 mt-1">Custom UI</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Form Builder - Title & Modules */}
            {config.widget_mode === 'form_builder' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Form Header</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={config.form_title}
                        onChange={(e) => setConfig({ ...config, form_title: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Subtitle</Label>
                      <Input
                        value={config.form_subtitle}
                        onChange={(e) => setConfig({ ...config, form_subtitle: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Form Modules
                    </CardTitle>
                    <CardDescription>Build your custom interface</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Module Palette */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFormModule('input')}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Input
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFormModule('output')}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Output
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFormModule('button')}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Button
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFormModule('text')}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Text
                      </Button>
                    </div>

                    {/* Module List with Reordering */}
                    {config.form_modules.length > 0 && (
                      <div className="space-y-2">
                        {config.form_modules.map((module: FormModule, index: number) => (
                          <div key={module.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveModule(module.id, 'up')}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                >
                                  <MoveUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveModule(module.id, 'down')}
                                  disabled={index === config.form_modules.length - 1}
                                  className="h-6 w-6 p-0"
                                >
                                  <MoveDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    {module.type}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFormModule(module.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                                <Input
                                  value={module.label}
                                  onChange={(e) => updateFormModule(module.id, { label: e.target.value })}
                                  placeholder="Label"
                                  className="text-xs h-8"
                                />
                                {module.type === 'input' && (
                                  <Input
                                    value={module.placeholder || ''}
                                    onChange={(e) => updateFormModule(module.id, { placeholder: e.target.value })}
                                    placeholder="Placeholder"
                                    className="text-xs h-8"
                                  />
                                )}
                                {module.type === 'text' && (
                                  <Textarea
                                    value={module.content || ''}
                                    onChange={(e) => updateFormModule(module.id, { content: e.target.value })}
                                    placeholder="Enter your text content here. Supports multiple lines."
                                    className="text-xs min-h-[80px] resize-y"
                                    rows={4}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Colors & Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="w-12 h-9"
                      />
                      <Input
                        type="text"
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.secondary_color}
                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                        className="w-12 h-9"
                      />
                      <Input
                        type="text"
                        value={config.secondary_color}
                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-xs font-medium">Gradient Background</Label>
                    <p className="text-xs text-gray-500">Subtle gradient effect</p>
                  </div>
                  <Switch
                    checked={config.background_gradient}
                    onCheckedChange={(checked) => setConfig({ ...config, background_gradient: checked })}
                  />
                </div>

                <div>
                  <Label className="text-xs">Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={config.border_radius}
                    onChange={(e) => setConfig({ ...config, border_radius: e.target.value })}
                    className="h-9 text-sm"
                    min="0"
                    max="32"
                  />
                </div>

                {config.widget_mode === 'popup' && (
                  <div>
                    <Label className="text-xs">Position</Label>
                    <Select value={config.position} onValueChange={(value: any) => setConfig({ ...config, position: value })}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {config.widget_mode === 'inline' && (
                  <>
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        value={config.container_width}
                        onChange={(e) => setConfig({ ...config, container_width: e.target.value })}
                        className="h-9 text-sm"
                        placeholder="100%"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input
                        value={config.container_height}
                        onChange={(e) => setConfig({ ...config, container_height: e.target.value })}
                        className="h-9 text-sm"
                        placeholder="700px"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Content */}
            {(config.widget_mode === 'popup' || config.widget_mode === 'inline') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Header Text</Label>
                    <Input
                      value={config.header_text || ''}
                      onChange={(e) => setConfig({ ...config, header_text: e.target.value })}
                      placeholder="Always online"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Greeting</Label>
                    <Textarea
                      value={config.greeting_message}
                      onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                      className="text-sm"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={config.placeholder_text}
                      onChange={(e) => setConfig({ ...config, placeholder_text: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-[480px] flex-shrink-0">
          <div className="sticky top-0">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Live Preview
                    </CardTitle>
                    <CardDescription className="text-xs">Updates in real-time</CardDescription>
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
              <CardContent className="p-4 bg-gray-50">
                {config.widget_mode === 'popup' && <PopupPreview />}
                {config.widget_mode === 'inline' && <InlinePreview />}
                {config.widget_mode === 'form_builder' && <FormBuilderPreview />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
