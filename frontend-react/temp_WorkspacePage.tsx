import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Filter,
  Bot,
  Code,
  Plus,
  Clock,
  Sparkles,
  Grid,
  List,
  Edit,
  Trash2,
  Copy,
  Zap,
  // Lock,
  // Globe,
  ArrowRight,
  MessageSquare,
  // Tag,
  // TrendingUp,
  AlertCircle,
  Check,
  X,
  Loader2,
  // ChevronDown,
  // Eye,
  // EyeOff,
  Monitor,
  TestTube,
  Key,
  Upload,
  Download,
  FileJson,
  Terminal
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { CustomAgent, Capability, AgentCapability, ExampleQuery } from '@/lib/types'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Footer } from '@/components/layout/Footer'
import Avatar from 'boring-avatars'
import { FlowCanvas, NodePalette, NodeConfigPanel } from '@/components/flows'
import type { FlowNode as FlowNodeType, FlowEdge } from '@/lib/flow-types'
import { WidgetPublisher } from '@/components/widgets/WidgetPublisher'
import { InterfaceConfigurator } from '@/components/InterfaceConfigurator'

function WorkspacePage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [agents, setAgents] = useState<CustomAgent[]>([])
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItem, setSelectedItem] = useState<CustomAgent | Capability | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')

  // Custom agent creation/editing state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<CustomAgent | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '',
    agent_type: 'chat' as 'chat' | 'flow',
    model_id: undefined as string | undefined,
    fallback_model_ids: [] as string[],
    system_prompt: '',
    initial_message: '',
    interface_type: 'chat' as 'chat' | 'form' | 'json' | 'api' | 'wizard',
    interface_config: {} as Record<string, any>,
    tags: [] as string[],
    visibility: 'private' as 'private' | 'public' | 'shared',
    configuration: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop_sequences: []
    },
    example_queries: [] as ExampleQuery[],
    capabilities: [] as AgentCapability[]
  })

  // Available models for selection
  const [availableModels, setAvailableModels] = useState<any[]>([])

  const [newTag, setNewTag] = useState('')
  const [newExampleQuery, setNewExampleQuery] = useState({ query: '', expected_response: '', description: '' })

  // Flow builder state
  const [flowNodes, setFlowNodes] = useState<FlowNodeType[]>([])
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([])
  const [selectedFlowNode, setSelectedFlowNode] = useState<FlowNodeType | null>(null)

  // Avatar selection state
  const [selectedAvatar, setSelectedAvatar] = useState({ variant: 'beam', seed: '', colors: ['#a855f7', '#ec4899', '#ffffff'] })
  const [avatarOptions, setAvatarOptions] = useState<Array<{ variant: string; seed: string; colors: string[] }>>([])

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importJSON, setImportJSON] = useState('')
  const [importMethod, setImportMethod] = useState<'paste' | 'upload'>('paste')

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'agent' | 'capability' } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const avatarVariants = ['beam', 'marble', 'pixel', 'sunset', 'ring', 'bauhaus']
  const colorSchemes = [
    ['#a855f7', '#ec4899', '#ffffff'], // purple-pink
    ['#10b981', '#06b6d4', '#ffffff'], // emerald-cyan
    ['#f59e0b', '#ef4444', '#ffffff'], // orange-red
    ['#3b82f6', '#8b5cf6', '#ffffff'], // blue-purple
    ['#14b8a6', '#06b6d4', '#ffffff'], // teal-cyan
    ['#f97316', '#dc2626', '#ffffff'], // orange-red
    ['#6366f1', '#a855f7', '#ffffff'], // indigo-purple
    ['#22d3ee', '#0891b2', '#ffffff'], // cyan-cyan
  ]

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth/login')
      return
    }
    loadWorkspaceItems()
    loadAvailableModels()
  }, [user, authLoading, navigate])

  const generateAvatarOptions = () => {
    const options = []
    for (let i = 0; i < 10; i++) {
      const variant = avatarVariants[Math.floor(Math.random() * avatarVariants.length)]
      const colors = colorSchemes[Math.floor(Math.random() * colorSchemes.length)]
      const seed = `${Date.now()}-${Math.random()}`
      options.push({ variant, seed, colors })
    }
    setAvatarOptions(options)
    if (options.length > 0 && !selectedAvatar.seed) {
      setSelectedAvatar(options[0])
    }
  }

  const loadWorkspaceItems = async () => {
    try {
      setIsLoading(true)

      // Load agents
      const response = await apiClient.getCustomAgents({
        limit: 100,
        sort_by: sortBy === 'recent' ? 'created_at' : 'name',
        sort_order: 'desc'
      })
      if (response.success && response.data) {
        setAgents(response.data.agents || [])
      }

      // Also load capabilities for agent creation (if not already loaded)
      if (capabilities.length === 0) {
        await loadCapabilities()
      }
    } catch (error) {
      console.error('Failed to load workspace items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load workspace items',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableModels = async () => {
    if (!user) return

    try {
      const response = await apiClient.models.list('default', {
        include_global: true,
        is_enabled: true
      })

      if (response.success && response.data) {
        setAvailableModels(response.data.models || [])
      }
    } catch (error) {
      console.error('Failed to load available models:', error)
    }
  }

  const loadCapabilities = async () => {
    try {
      // SECURITY: Only load local (user-owned) capabilities
      // Global capabilities must be imported first before use
      const localResponse = await apiClient.getCapabilities({ limit: 100 })

      const localCaps = localResponse.success && localResponse.data ? localResponse.data.capabilities || [] : []

      setCapabilities(localCaps)
    } catch (error) {
      console.error('Failed to load capabilities:', error)
    }
  }

  const handleEditAgent = (agentId: string) => {
    navigate(`/custom-agents/${agentId}`)
  }

  const handleEditCapability = (capabilityId: string) => {
    navigate(`/capabilities/${capabilityId}`)
  }

  const openDetailDialog = (item: CustomAgent | Capability) => {
    setSelectedItem(item)
    setIsDetailDialogOpen(true)
  }

  const handleCreateAgent = async () => {
    // Validation based on agent type
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Agent name is required',
        variant: 'destructive'
      })
      return
    }

    if (formData.agent_type === 'chat' && !formData.system_prompt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'System prompt is required for conversational agents',
        variant: 'destructive'
      })
      return
    }

    if (formData.agent_type === 'flow' && flowNodes.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one node is required for flow agents',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await apiClient.createCustomAgent({
        name: formData.name,
        emoji: formData.emoji || '🤖',
        description: formData.description,
        agent_type: formData.agent_type,
        system_prompt: formData.system_prompt || '',
        initial_message: formData.initial_message || undefined,
        interface_type: formData.interface_type,
        interface_config: formData.interface_config,
        tags: formData.tags,
        visibility: formData.visibility,
        configuration: formData.configuration,
        example_queries: formData.example_queries,
        capabilities: formData.agent_type === 'chat' ? formData.capabilities.map(cap => ({
          ...cap,
          custom_config: cap.custom_config ?? undefined
        })) : []
      })

      if (response.success && response.data) {
        // The API returns { success: true, agent: { id, name, ... } }
        // So we need to access response.data.agent, not response.data directly
        const createdAgent = response.data.agent || response.data

        // Debug log the response structure
        console.log('Created agent response:', createdAgent)
        console.log('Agent ID:', createdAgent?.id)

        // If there are flow nodes, create a flow for this agent
        if (formData.agent_type === 'flow' && flowNodes.length > 0) {
          try {
            // Find the start node (usually the first input node)
            const startNode = flowNodes.find(n => n.type?.startsWith('input')) || flowNodes[0]

            // Validate agent_id exists
            if (!createdAgent?.id) {
              console.error('Agent response structure:', JSON.stringify(createdAgent, null, 2))
              throw new Error('Agent ID is missing from created agent response')
            }

            const flowResponse = await apiClient.flows.create({
              name: `${formData.name} Workflow`,
              description: `Workflow for ${formData.name}`,
              agent_id: createdAgent.id,
              nodes: flowNodes.map(node => ({
                id: node.id,
                type: node.type || 'default',
                label: node.label,
                config: node.config || {},
                position: node.position
              })),
              edges: flowEdges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                // Only include condition if it's a valid object
                ...(edge.condition && typeof edge.condition === 'object' && !Array.isArray(edge.condition)
                  ? { condition: edge.condition }
                  : {})
              })),
              config: {
                startNodeId: startNode?.id || flowNodes[0]?.id,
                maxExecutionTime: 300,
                errorHandling: 'stop',
                retryAttempts: 3,
                timeout: 300
              },
              variables: {},
              tags: formData.tags,
              metadata: {
                created_with: 'visual_builder',
                agent_name: formData.name
              }
            })

            if (flowResponse.success) {
              toast({
                title: 'Success',
                description: 'Custom agent and workflow created successfully'
              })
            } else {
              toast({
                title: 'Partial Success',
                description: 'Agent created but workflow creation failed. You can add a workflow later.',
                variant: 'destructive'
              })
            }
          } catch (flowError: any) {
            console.error('Failed to create flow:', flowError)
            console.error('Flow error details:', JSON.stringify(flowError, null, 2))

            // Log the payload that was sent
            console.error('Flow creation payload:', JSON.stringify({
              name: `${formData.name} Workflow`,
              description: `Workflow for ${formData.name}`,
              agent_id: createdAgent.id,
              nodes: flowNodes,
              edges: flowEdges,
              config: {
                startNodeId: startNode?.id || flowNodes[0]?.id,
                maxExecutionTime: 300,
                errorHandling: 'stop',
                retryAttempts: 3,
                timeout: 300
              }
            }, null, 2))

            toast({
              title: 'Partial Success',
              description: `Agent created but workflow creation failed: ${flowError.message || 'Unknown error'}. Check console for details.`,
              variant: 'destructive'
            })
          }
        } else {
          toast({
            title: 'Success',
            description: 'Custom agent created successfully'
          })
        }

        setIsCreateDialogOpen(false)
        resetForm()
        loadWorkspaceItems()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create agent',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return

    // Validation based on agent type
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Agent name is required',
        variant: 'destructive'
      })
      return
    }

    if (formData.agent_type === 'chat' && !formData.system_prompt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'System prompt is required for conversational agents',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSaving(true)

      // Preserve existing metadata and update flow if needed
      const existingMetadata = (selectedAgent as any).metadata || {}
      let updatedMetadata = { ...existingMetadata }

      // If flow agent and has flow nodes, update flow metadata
      if (formData.agent_type === 'flow' && flowNodes.length > 0) {
        updatedMetadata = {
          ...updatedMetadata,
          flow: {
            ...updatedMetadata.flow,
            steps: flowNodes.map((node, index) => ({
              id: node.id,
              name: node.label,
              type: node.type?.split('.')[1] || 'action',
              action: node.config?.action || '',
              timeout: node.config?.timeout,
              retry: node.config?.retry,
              conditions: node.config?.conditions,
              parallel: node.config?.parallel,
              depends_on: flowEdges
                .filter(edge => edge.target === node.id)
                .map(edge => edge.source)
            }))
          }
        }
      }

      const response = await apiClient.updateCustomAgent(selectedAgent.id, {
        name: formData.name,
        emoji: formData.emoji || '🤖',
        description: formData.description,
        agent_type: formData.agent_type,
        system_prompt: formData.system_prompt || '',
        initial_message: formData.initial_message || undefined,
        tags: formData.tags,
        visibility: formData.visibility,
        configuration: formData.configuration,
        example_queries: formData.example_queries,
        capabilities: formData.agent_type === 'chat' ? formData.capabilities.map(cap => ({
          ...cap,
          custom_config: cap.custom_config ?? undefined
        })) : [],
        metadata: updatedMetadata
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Agent updated successfully'
        })
        setIsEditDialogOpen(false)
        setSelectedAgent(null)
        resetForm()
        loadWorkspaceItems()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteDialog = (id: string, name: string, type: 'agent' | 'capability') => {
    setItemToDelete({ id, name, type })
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      setIsDeleting(true)

      if (itemToDelete.type === 'agent') {
        const response = await apiClient.deleteCustomAgent(itemToDelete.id, false)
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Agent deleted successfully'
          })
        }
      } else {
        const response = await apiClient.deleteCapability(itemToDelete.id, false)
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Capability deleted successfully'
          })
        }
      }

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      loadWorkspaceItems()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to delete ${itemToDelete.type}`,
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloneAgent = async (agentId: string) => {
    try {
      const response = await apiClient.cloneCustomAgent(agentId, {
        new_name: `Clone of ${agents.find(a => a.id === agentId)?.name}`,
        new_description: 'Cloned agent'
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Agent cloned successfully'
        })
        loadWorkspaceItems()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clone agent',
        variant: 'destructive'
      })
    }
  }

  const openEditDialog = async (agent: CustomAgent) => {
    setSelectedAgent(agent)

    // Clear any previously selected flow node
    setSelectedFlowNode(null)

    setFormData({
      name: agent.name,
      emoji: (agent as any).emoji || '🤖',
      description: agent.description,
      agent_type: (agent as any).agent_type || 'chat',
      model_id: (agent as any).model_id,
      fallback_model_ids: (agent as any).fallback_model_ids || [],
      system_prompt: agent.system_prompt,
      initial_message: (agent as any).initial_message || '',
      interface_type: agent.interface_type || 'chat',
      interface_config: agent.interface_config || {},
      tags: agent.tags,
      visibility: agent.visibility === 'organization' ? 'shared' : agent.visibility as 'private' | 'public' | 'shared',
      configuration: {
        temperature: agent.configuration.temperature,
        max_tokens: agent.configuration.max_tokens,
        top_p: agent.configuration.top_p,
        frequency_penalty: agent.configuration.frequency_penalty,
        presence_penalty: agent.configuration.presence_penalty,
        stop_sequences: []
      },
      example_queries: agent.example_queries,
      capabilities: agent.capabilities
    })

    // Load flow data from flows API if agent is flow type
    if ((agent as any).agent_type === 'flow') {
      try {
        // Fetch flows for this agent (get all flows and filter client-side)
        const flowsResponse = await apiClient.flows.list({
          limit: 100,
          offset: 0
        })

        if (flowsResponse.success && flowsResponse.data?.flows) {
          // Find the flow that belongs to this agent
          const agentFlow = flowsResponse.data.flows.find((flow: any) => flow.agent_id === agent.id)

          if (agentFlow) {
            console.log('Loaded flow for agent:', agentFlow)
            // Ensure nodes and edges have the expected structure
            setFlowNodes(agentFlow.nodes || [])
            setFlowEdges(agentFlow.edges || [])
          } else {
            console.log('No flow found for agent:', agent.id)
            setFlowNodes([])
            setFlowEdges([])
          }
        } else {
          setFlowNodes([])
          setFlowEdges([])
        }
      } catch (error) {
        console.error('Failed to load flow data:', error)
        setFlowNodes([])
        setFlowEdges([])
      }
    } else {
      // Clear flow state for non-flow agents
      setFlowNodes([])
      setFlowEdges([])
    }

    setIsEditDialogOpen(true)
  }

  // Handler to update node configuration
  const handleNodeConfigUpdate = (nodeId: string, newConfig: Record<string, any>, newLabel?: string) => {
    setFlowNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          label: newLabel || node.label,
          config: newConfig
        }
      }
      return node
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      emoji: '',
      description: '',
      agent_type: 'chat',
      model_id: undefined,
      fallback_model_ids: [],
      initial_message: '',
      interface_type: 'chat' as 'chat' | 'form' | 'json' | 'api' | 'wizard',
      interface_config: {} as Record<string, any>,
      system_prompt: '',
      tags: [],
      visibility: 'private',
      configuration: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: []
      },
      example_queries: [],
      capabilities: []
    })
    setNewTag('')
    setNewExampleQuery({ query: '', expected_response: '', description: '' })
    setSelectedAvatar({ variant: 'beam', seed: '', colors: ['#a855f7', '#ec4899', '#ffffff'] })
    setAvatarOptions([])
    generateAvatarOptions()
    setFlowNodes([])
    setFlowEdges([])
    setSelectedFlowNode(null)
  }

  const handleOpenImportDialog = () => {
    setImportJSON('')
    setImportMethod('paste')
    setIsImportDialogOpen(true)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a .json file',
        variant: 'destructive'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportJSON(content)
    }
    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read file',
        variant: 'destructive'
      })
    }
    reader.readAsText(file)
  }

  const processImportJSON = () => {
    try {
      const json = importJSON.trim()
      if (!json) {
        toast({
          title: 'Error',
          description: 'Please paste or upload JSON content',
          variant: 'destructive'
        })
        return
      }

      const data = JSON.parse(json)

      // Validate required fields
      if (!data.name) {
        toast({
          title: 'Invalid JSON',
          description: 'JSON must include "name" field',
          variant: 'destructive'
        })
        return
      }

      // Ensure configuration has proper structure
      const validatedConfig = {
        temperature: data.configuration?.temperature ?? 0.7,
        max_tokens: data.configuration?.max_tokens ?? 2048,
        top_p: data.configuration?.top_p ?? 1,
        frequency_penalty: data.configuration?.frequency_penalty ?? 0,
        presence_penalty: data.configuration?.presence_penalty ?? 0,
        stop_sequences: data.configuration?.stop_sequences || []
      }

      // Ensure capabilities have proper structure
      const validatedCapabilities = (data.capabilities || []).map((cap: any) => ({
        capability_id: cap.capability_id || cap,
        enabled: cap.enabled ?? true
      }))

      // Ensure example queries have proper structure
      const validatedExamples = (data.example_queries || []).map((ex: any) => ({
        query: ex.query || '',
        expected_response: ex.expected_response || '',
        description: ex.description || ''
      }))

      // Auto-detect agent type if not specified
      // If flow_nodes are present, it's a flow agent; otherwise it's a chat agent
      const detectedAgentType = data.agent_type || (data.flow_nodes && data.flow_nodes.length > 0 ? 'flow' : 'chat')

      setFormData({
        name: data.name,
        emoji: data.emoji || '',
        description: data.description || '',
        agent_type: detectedAgentType as 'chat' | 'flow',
        model_id: data.model_id,
        fallback_model_ids: data.fallback_model_ids || [],
        system_prompt: data.system_prompt || '',
        tags: data.tags || [],
        visibility: data.visibility || 'private',
        configuration: validatedConfig,
        example_queries: validatedExamples,
        capabilities: validatedCapabilities,
        initial_message: data.initial_message || '',
        interface_type: (data.interface_type || 'chat') as 'chat' | 'form' | 'json' | 'api' | 'wizard',
        interface_config: data.interface_config || {} as Record<string, any>,
      })

      // Handle flow nodes if present
      if (data.flow_nodes) {
        setFlowNodes(data.flow_nodes)
      }
      if (data.flow_edges) {
        setFlowEdges(data.flow_edges)
      }

      // Handle avatar if present
      if (data.avatar) {
        setSelectedAvatar(data.avatar)
      }

      toast({
        title: 'Success!',
        description: `Imported agent: ${data.name}. Review and click Create to save.`,
      })

      setIsImportDialogOpen(false)
      setIsCreateDialogOpen(true)
    } catch (e: any) {
      toast({
        title: 'Invalid JSON',
        description: e.message || 'Failed to parse JSON. Please check the format.',
        variant: 'destructive'
      })
    }
  }

  const handleExportAgentToJSON = () => {
    const exportData: any = {
      name: formData.name,
      emoji: formData.emoji,
      description: formData.description,
      agent_type: formData.agent_type,
      model_id: formData.model_id,
      fallback_model_ids: formData.fallback_model_ids,
      system_prompt: formData.system_prompt,
      tags: formData.tags,
      visibility: formData.visibility,
      configuration: formData.configuration,
      example_queries: formData.example_queries,
      capabilities: formData.capabilities,
      avatar: selectedAvatar
    }

    // Include flow data if it's a flow agent
    if (formData.agent_type === 'flow') {
      exportData.flow_nodes = flowNodes
      exportData.flow_edges = flowEdges
    }

    const json = JSON.stringify(exportData, null, 2)

    navigator.clipboard.writeText(json).then(() => {
      toast({
        title: 'Copied to Clipboard!',
        description: 'Agent JSON has been copied. You can paste it anywhere.',
      })
    }).catch(() => {
      // Fallback: show in a text area
      const textarea = document.createElement('textarea')
      textarea.value = json
      textarea.style.position = 'fixed'
      textarea.style.top = '50%'
      textarea.style.left = '50%'
      textarea.style.transform = 'translate(-50%, -50%)'
      textarea.style.width = '80%'
      textarea.style.height = '60%'
      textarea.style.zIndex = '10000'
      textarea.style.padding = '20px'
      textarea.style.fontSize = '14px'
      textarea.style.fontFamily = 'monospace'
      textarea.style.border = '3px solid #10b981'
      textarea.style.borderRadius = '12px'
      textarea.style.boxShadow = '0 20px 50px rgba(0,0,0,0.3)'
      textarea.readOnly = true

      const overlay = document.createElement('div')
      overlay.style.position = 'fixed'
      overlay.style.top = '0'
      overlay.style.left = '0'
      overlay.style.width = '100%'
      overlay.style.height = '100%'
      overlay.style.backgroundColor = 'rgba(0,0,0,0.7)'
      overlay.style.zIndex = '9999'
      overlay.style.backdropFilter = 'blur(4px)'

      const closeBtn = document.createElement('button')
      closeBtn.textContent = 'Close'
      closeBtn.style.position = 'fixed'
      closeBtn.style.top = '50%'
      closeBtn.style.left = '50%'
      closeBtn.style.transform = 'translate(-50%, calc(-50% + 250px))'
      closeBtn.style.zIndex = '10001'
      closeBtn.style.padding = '10px 24px'
      closeBtn.style.backgroundColor = '#10b981'
      closeBtn.style.color = 'white'
      closeBtn.style.border = 'none'
      closeBtn.style.borderRadius = '8px'
      closeBtn.style.cursor = 'pointer'
      closeBtn.style.fontWeight = '600'

      const cleanup = () => {
        document.body.removeChild(overlay)
        document.body.removeChild(textarea)
        document.body.removeChild(closeBtn)
      }

      closeBtn.onclick = cleanup
      overlay.onclick = cleanup

      document.body.appendChild(overlay)
      document.body.appendChild(textarea)
      document.body.appendChild(closeBtn)

      textarea.select()

      toast({
        title: 'Export Ready',
        description: 'Select all and copy the JSON manually',
      })
    })
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  const addExampleQuery = () => {
    if (newExampleQuery.query.trim()) {
      setFormData({
        ...formData,
        example_queries: [...formData.example_queries, { ...newExampleQuery }]
      })
      setNewExampleQuery({ query: '', expected_response: '', description: '' })
    }
  }

  const removeExampleQuery = (index: number) => {
    setFormData({
      ...formData,
      example_queries: formData.example_queries.filter((_, i) => i !== index)
    })
  }

  // Simple toggle capability - no complex configuration needed
  // The LLM handles all intent detection, parameter gathering, and response formatting
  const toggleCapability = (capabilityId: string) => {
    const isCurrentlyEnabled = formData.capabilities.some(c => c.capability_id === capabilityId)

    if (isCurrentlyEnabled) {
      // Remove capability
      setFormData({
        ...formData,
        capabilities: formData.capabilities.filter(c => c.capability_id !== capabilityId)
      })
    } else {
      // Add capability
      setFormData({
        ...formData,
        capabilities: [
          ...formData.capabilities,
          {
            capability_id: capabilityId,
            enabled: true,
            custom_config: null
          }
        ]
      })
    }
  }

  // Load sample data for conversation agent
  const loadConversationAgentSample = () => {
    setFormData({
      name: 'Sample Conversation Agent',
      emoji: '🧪',
      description: 'A helpful conversation agent that demonstrates conversational capabilities with sample configuration',
      agent_type: 'chat',
      model_id: undefined,
      fallback_model_ids: [],
      system_prompt: `You are a helpful assistant designed to demonstrate conversational AI capabilities.

You should:
- Provide clear, concise responses
- Be friendly and professional
- Help users understand how custom agents work
- Demonstrate the agent's capabilities through example interactions

When users ask about your features, explain that you're a sample agent created for testing purposes.`,
      tags: ['sample', 'conversation', 'demo'],
      visibility: 'private',
      configuration: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: []
      },
      initial_message: '',
      interface_type: 'chat' as 'chat' | 'form' | 'json' | 'api' | 'wizard',
      interface_config: {} as Record<string, any>,
      example_queries: [
        {
          query: 'What can you help me with?',
          expected_response: 'I\'m a conversation agent designed to demonstrate how custom agents work. I can help you understand conversational AI capabilities, answer questions, and show how agents can be configured with custom behaviors.',
          description: 'General capabilities question'
        },
        {
          query: 'Tell me about yourself',
          expected_response: 'I\'m a sample agent created to showcase the custom agent feature. I\'m powered by an LLM and configured with a specific system prompt that defines my behavior and personality.',
          description: 'Agent identity question'
        }
      ],
      capabilities: []
    })

    // Generate sample avatar
    if (avatarOptions.length === 0) {
      generateAvatarOptions()
    }

    toast({
      title: 'Sample Data Loaded',
      description: 'Conversation agent template loaded. Review and modify as needed.'
    })
  }

  // Load sample data for flow agent
  const loadFlowAgentSample = () => {
    setFormData({
      name: 'Sample Flow Agent',
      emoji: '⚡',
      description: 'A sample flow-based agent that demonstrates sequential workflow execution with multiple steps',
      agent_type: 'flow',
      model_id: undefined,
      fallback_model_ids: [],
      system_prompt: 'This is a flow-based agent that executes tasks in a defined sequence.',
      tags: ['sample', 'flow', 'workflow', 'demo'],
      visibility: 'private',
      configuration: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: []
      },
      initial_message: '',
      interface_type: 'chat' as 'chat' | 'form' | 'json' | 'api' | 'wizard',
      interface_config: {} as Record<string, any>,
      example_queries: [],
      capabilities: []
    })

    // Set sample flow nodes
    const sampleFlowNodes: FlowNodeType[] = [
      {
        id: 'start_node',
        type: 'input.form',
        label: 'User Input',
        config: {
          fields: [
            { name: 'query', type: 'text', required: true, label: 'Enter your question' }
          ]
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'process_node',
        type: 'action.llm',
        label: 'Process with AI',
        config: {
          model: 'default',
          prompt: 'Process the user query: {{input.query}}',
          temperature: 0.7
        },
        position: { x: 100, y: 250 }
      },
      {
        id: 'output_node',
        type: 'output.message',
        label: 'Send Response',
        config: {
          message: '{{process_node.result}}'
        },
        position: { x: 100, y: 400 }
      }
    ]

    const sampleFlowEdges: FlowEdge[] = [
      {
        id: 'edge_1',
        source: 'start_node',
        target: 'process_node',
        label: 'Submit'
      },
      {
        id: 'edge_2',
        source: 'process_node',
        target: 'output_node',
        label: 'Complete'
      }
    ]

    setFlowNodes(sampleFlowNodes)
    setFlowEdges(sampleFlowEdges)

    // Generate sample avatar
    if (avatarOptions.length === 0) {
      generateAvatarOptions()
    }

    toast({
      title: 'Sample Data Loaded',
      description: 'Flow agent template loaded with 3-node workflow. Review and modify as needed.'
    })
  }

  // Filter items
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || (agent as any).tags?.includes(filterCategory)
    return matchesSearch && matchesCategory
  })

  const filteredCapabilities = capabilities.filter(capability => {
    const matchesSearch = capability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capability.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || capability.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const allCategories = Array.from(new Set(agents.flatMap(a => (a as any).tags || [])))

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-white">Loading Workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-[#1e2433]">
      <Header
        onSidebarToggle={() => { }}
        isSidebarOpen={false}
        isSidebarCollapsed={false}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Beautiful Gradient Hero Section - Scrollable */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:bg-gradient-to-r dark:from-[#0d1117] dark:via-[#0d1117] dark:to-[#0d1117] text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Workspace</h1>
                  <p className="text-blue-100">Your custom agents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white text-indigo-600' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-white text-indigo-600' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <Button
                onClick={() => navigate('/library')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Browse Library
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setIsCreateDialogOpen(true)
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Agent
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Custom Agents</p>
                    <p className="text-3xl font-bold mt-1">{agents.length}</p>
                    <p className="text-blue-200 text-xs mt-1">Your Agents</p>
                  </div>
                  <Bot className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Active</p>
                    <p className="text-3xl font-bold mt-1">
                      {agents.filter(a => (a as any).status === 'active').length}
                    </p>
                    <p className="text-blue-200 text-xs mt-1">Ready to Use</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Recent</p>
                    <p className="text-3xl font-bold mt-1">
                      {agents.filter(a => {
                        const created = new Date(a.created_at)
                        const now = new Date()
                        return (now.getTime() - created.getTime()) < 7 * 24 * 60 * 60 * 1000
                      }).length}
                    </p>
                    <p className="text-blue-200 text-xs mt-1">Last 7 Days</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto p-6">

          {/* Search and Filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]"
                />
              </div>
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40 dark:bg-[#353d4f] dark:text-white dark:border-[#3d4555]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          {(
            filteredAgents.length === 0 ? (
              <Card className="border-0 shadow-sm dark:bg-[#353d4f] dark:border-[#3d4555]">
                <CardContent className="p-12 text-center">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No custom agents yet</h3>
                  <p className="text-gray-600 dark:text-white mb-6">Create your first agent or import one from the library</p>
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={() => navigate('/custom-agents?action=create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Agent
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/library')}>
                      Browse Library
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {filteredAgents.map(agent => {
                  // Generate unique gradient colors based on agent name
                  const getAgentGradient = (agent: any) => {
                    const gradients = [
                      { from: '#6366f1', to: '#8b5cf6', shadow: 'shadow-indigo-200' },
                      { from: '#8b5cf6', to: '#d946ef', shadow: 'shadow-purple-200' },
                      { from: '#06b6d4', to: '#3b82f6', shadow: 'shadow-cyan-200' },
                      { from: '#10b981', to: '#06b6d4', shadow: 'shadow-emerald-200' },
                      { from: '#f59e0b', to: '#ef4444', shadow: 'shadow-orange-200' },
                      { from: '#ec4899', to: '#f43f5e', shadow: 'shadow-pink-200' },
                      { from: '#14b8a6', to: '#06b6d4', shadow: 'shadow-teal-200' },
                      { from: '#3b82f6', to: '#06b6d4', shadow: 'shadow-blue-200' },
                    ]
                    const hash = agent.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
                    return gradients[hash % gradients.length]
                  }

                  const gradient = getAgentGradient(agent)

                  return (
                    <Card
                      key={agent.id}
                      className={cn(
                        "border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group overflow-hidden",
                        viewMode === 'list' && "flex"
                      )}
                      onClick={() => openDetailDialog(agent)}
                    >
                      <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Professional gradient icon */}
                            <div
                              className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0", gradient.shadow)}
                              style={{
                                background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
                              }}
                            >
                              <Avatar
                                size={40}
                                name={agent.name}
                                variant="marble"
                                colors={[gradient.from, gradient.to, '#ffffff']}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg mb-1 dark:text-white transition-colors truncate">
                                {agent.name}
                              </CardTitle>
                              <CardDescription className="text-sm line-clamp-2 break-words">
                                {agent.description}
                              </CardDescription>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge className="bg-indigo-500 text-white text-xs">
                                  <Bot className="h-3 w-3 mr-1" />
                                  Custom
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className={viewMode === 'list' ? 'flex items-center gap-8' : ''}>
                        <div className="space-y-3">
                          {/* Tags */}
                          {(agent as any).tags && (agent as any).tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(agent as any).tags.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs truncate max-w-[100px]">
                                  {tag}
                                </Badge>
                              ))}
                              {(agent as any).tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(agent as any).tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t text-xs text-gray-500 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime((agent as any).last_updated || agent.created_at)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/test-agent/${agent.id}`)
                                }}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Test
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditDialog(agent)
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDeleteDialog(agent.id, agent.name, 'agent')
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Detail Dialog - Similar to Library */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    }}
                  >
                    <Avatar
                      size={56}
                      name={selectedItem.name}
                      variant="marble"
                      colors={['#6366f1', '#8b5cf6', '#ffffff']}
                    />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">{selectedItem.name}</DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedItem.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Metadata */}
                <div>
                  <h3 className="font-semibold mb-2">Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-300">Created</p>
                      <p className="text-sm font-semibold">{formatRelativeTime(selectedItem.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-300">Status</p>
                      <Badge variant="default" className="text-xs">{selectedItem.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
                {'system_prompt' in selectedItem ? (
                  <Button
                    onClick={() => handleEditAgent(selectedItem.id)}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Agent
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleEditCapability(selectedItem.id)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Capability
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Agent Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedAgent(null)
          resetForm()
        }
      }}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Agent' : 'Create New Agent'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? 'Update your custom agent configuration'
                : 'Configure your custom AI agent with specific behaviors and capabilities'}
            </DialogDescription>
          </DialogHeader>

          {/* Import/Export Section */}

          <div className="mb-6 p-4 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <div className="flex items-start gap-3">
              <FileJson className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-white mb-1">
                  ⚡ Quick Actions - Import/Export JSON
                </h3>
                <p className="text-xs text-emerald-700 dark:text-gray-300 mb-3">
                  Import an agent from JSON for rapid testing, or export your current configuration
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenImportDialog}
                    className="flex-1 border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-900 dark:text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import from JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportAgentToJSON}
                    className="flex-1 border-teal-300 dark:border-teal-700 hover:border-teal-500 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-900 dark:text-white"
                    disabled={!formData.name}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>


          {/* Agent Type Selector */}

          <div className="mb-6 p-4 border border-gray-200 dark:border-[#3d4555] rounded-lg bg-gray-50 dark:bg-[#2d3545]">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold dark:text-white">Agent Type</Label>
              {user?.is_system_admin && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={loadConversationAgentSample}
                    className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    Load Chat Sample
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={loadFlowAgentSample}
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    Load Flow Sample
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md dark:bg-[#353d4f] dark:border-[#3d4555]",
                  formData.agent_type === 'chat' && "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20"
                )}
                onClick={() => setFormData({ ...formData, agent_type: 'chat' })}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    formData.agent_type === 'chat' ? "bg-purple-500 border-purple-500" : "border-gray-300 dark:border-gray-600"
                  )}>
                    {formData.agent_type === 'chat' && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold dark:text-white">Conversational Agent</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Free-flowing conversations with LLM. Define behavior through system prompts and give the agent capabilities to call.
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md dark:bg-[#353d4f] dark:border-[#3d4555]",
                  formData.agent_type === 'flow' && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => setFormData({ ...formData, agent_type: 'flow' })}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    formData.agent_type === 'flow' ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600"
                  )}>
                    {formData.agent_type === 'flow' && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold dark:text-white">Flow Agent</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Strict sequential workflow. Build visual flows with input, decision, action, and output nodes.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>


          <Tabs defaultValue="basic" className="w-full">
            <TabsList className={cn(
              "grid w-full",
              // Calculate grid columns based on agent type and edit mode
              formData.agent_type === 'chat'
                ? (selectedAgent ? "grid-cols-7" : "grid-cols-5")
                : (selectedAgent ? "grid-cols-5" : "grid-cols-3")
            )}>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              {formData.agent_type === 'chat' && (
                <>
                  <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                </>
              )}
              {formData.agent_type === 'flow' && (
                <TabsTrigger value="flow">Flow Builder</TabsTrigger>
              )}
              <TabsTrigger value="interface">Interface</TabsTrigger>
              {selectedAgent && (
                <>
                  <TabsTrigger value="api">
                    <Key className="h-3 w-3 mr-2" />
                    API
                  </TabsTrigger>
                  <TabsTrigger value="publish">
                    <Monitor className="h-3 w-3 mr-2" />
                    Publish
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  placeholder="My Custom Agent"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your agent does..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* System Prompt - For flow agents with chat interface */}
              {formData.agent_type === 'flow' && (
                <div>
                  <Label htmlFor="flow_system_prompt">System Prompt (For Chat Mode)</Label>
                  <Textarea
                    id="flow_system_prompt"
                    placeholder="You are an AI assistant that collects data conversationally. Extract structured data and validate before submitting..."
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Instructions for the LLM on how to extract structured data from conversation and handle missing fields (required for chat interface mode)
                  </p>
                </div>
              )}

              {/* Initial Message - For chat interface mode */}
              <div>
                <Label htmlFor="initial_message">Initial Message (Optional)</Label>
                <Textarea
                  id="initial_message"
                  placeholder="Hi! I'm your assistant. I can help you with..."
                  value={formData.initial_message}
                  onChange={(e) => setFormData({ ...formData, initial_message: e.target.value })}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Greeting shown when chat starts (only in chat interface mode, not form/JSON/API modes)
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select
                  value={formData.model_id}
                  onValueChange={(value) => setFormData({ ...formData, model_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Use Organization Default</SelectItem>
                    {availableModels.map(model => (
                      <SelectItem key={model.model_id} value={model.model_id}>
                        {model.display_name} ({model.provider})
                        {model.is_default && ' - Default'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose which AI model powers this agent. Leave as default to use your organization's default model.
                </p>
              </div>

              {/* Avatar Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Avatar</Label>
                  <Button
                    type="button"
                    onClick={generateAvatarOptions}
                    size="sm"
                    variant="outline"
                  >
                    Generate More
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {avatarOptions.map((option, index) => (
                    <div
                      key={index}
                      className={cn(
                        "cursor-pointer rounded-lg p-2 border-2 transition-all hover:shadow-md",
                        selectedAvatar.seed === option.seed
                          ? "border-purple-500 bg-purple-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedAvatar(option)}
                    >
                      <div
                        className="w-full aspect-square rounded-lg flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${option.colors[0]} 0%, ${option.colors[1]} 100%)`
                        }}
                      >
                        <Avatar
                          size={40}
                          name={option.seed}
                          variant={option.variant as any}
                          colors={[...option.colors]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {avatarOptions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Click &quot;Generate More&quot; to see avatar options
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: any) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.configuration.temperature}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, temperature: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    min="1"
                    max="8192"
                    value={formData.configuration.max_tokens}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, max_tokens: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <Textarea
                  id="system_prompt"
                  placeholder="You are an expert assistant that..."
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This defines your agent's behavior, personality, and expertise
                </p>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Example Query</Label>
                    <Input
                      placeholder="What can you help me with?"
                      value={newExampleQuery.query}
                      onChange={(e) => setNewExampleQuery({ ...newExampleQuery, query: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Expected Response</Label>
                    <Textarea
                      placeholder="I can help you with..."
                      value={newExampleQuery.expected_response}
                      onChange={(e) => setNewExampleQuery({ ...newExampleQuery, expected_response: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="General capabilities example"
                      value={newExampleQuery.description}
                      onChange={(e) => setNewExampleQuery({ ...newExampleQuery, description: e.target.value })}
                    />
                  </div>
                  <Button type="button" onClick={addExampleQuery} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Example
                  </Button>
                </div>

                {formData.example_queries.length > 0 && (
                  <div className="space-y-2">
                    {formData.example_queries.map((example, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1">{example.query}</p>
                            <p className="text-xs text-gray-600 mb-1">{example.expected_response}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-300">{example.description}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExampleQuery(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-4 mt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Simplified Tool Selection:</strong> Just check which tools this agent can use.
                  The agent's system prompt and examples determine when and how tools are called.
                  The LLM automatically handles intent detection, parameter gathering, and response formatting.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Available Tools ({formData.capabilities.length} selected)</Label>
                {capabilities.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No capabilities available. Create capabilities first or browse the marketplace.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {capabilities.map(capability => {
                      const isEnabled = formData.capabilities.some(c => c.capability_id === capability.id)
                      const isGlobal = (capability as any).is_global

                      return (
                        <Card
                          key={capability.id}
                          className={cn(
                            "p-4 cursor-pointer transition-all",
                            isEnabled ? "bg-purple-50 border-purple-300 shadow-sm" : "hover:bg-gray-50 dark:bg-[#2d3545]"
                          )}
                          onClick={() => toggleCapability(capability.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                              isEnabled ? "bg-purple-600 border-purple-600" : "border-gray-300"
                            )}>
                              {isEnabled && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Code className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                <h4 className="font-semibold text-sm">{capability.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {capability.category}
                                </Badge>
                                {isGlobal && (
                                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                                    Global
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{capability.description}</p>
                              <div className="text-xs text-gray-500 dark:text-gray-300">
                                <span className="font-medium">Parameters:</span>{' '}
                                {capability.parameters.map(p => p.name).join(', ') || 'None'}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/library?tab=capabilities')
                  }}
                  className="w-full border-dashed"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse More Capabilities in Marketplace
                </Button>
              </div>
            </TabsContent>

            {/* Flow Builder Tab */}
            <TabsContent value="flow" className="mt-4">
              <div className="flex gap-4 bg-white rounded-lg border p-4"
                style={{ width: '100%', height: '600px', minWidth: '1200px' }}>
                {/* Node Palette - 320px */}
                <div className="w-80 h-full flex-shrink-0">
                  <NodePalette />
                </div>

                {/* Flow Canvas - flexible but minimum 400px */}
                <div className="h-full border rounded-lg bg-white overflow-hidden"
                  style={{ flex: '1 1 0%', minWidth: '400px' }}>
                  <FlowCanvas
                    initialNodes={flowNodes}
                    initialEdges={flowEdges}
                    onNodesChange={setFlowNodes}
                    onEdgesChange={setFlowEdges}
                    onNodeSelect={setSelectedFlowNode}
                  />
                </div>

                {/* Node Configuration Panel - 384px */}
                <div className="w-96 h-full flex-shrink-0">
                  <NodeConfigPanel
                    node={selectedFlowNode}
                    onUpdate={handleNodeConfigUpdate}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Interface Tab */}
            <TabsContent value="interface" className="mt-4">
              <InterfaceConfigurator
                agentId={selectedAgent?.id || ''}
                agentName={formData.name}
                agentType={formData.agent_type}
                capabilities={capabilities}
                agentCapabilities={formData.capabilities}
                flowNodes={flowNodes}
                initialConfig={{
                  interface_type: formData.interface_type,
                  interface_config: formData.interface_config
                }}
                onSave={async (config) => {
                  setFormData({
                    ...formData,
                    interface_type: config.interface_type,
                    interface_config: config.interface_config
                  })
                }}
              />
            </TabsContent>


            {/* API Tab */}
            {selectedAgent && (
              <TabsContent value="api" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Management
                    </CardTitle>
                    <CardDescription>
                      Manage API keys, endpoints, and access for this agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Publishing Status */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm text-gray-900">Publishing Status</div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Enable to make your agent accessible via API
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-500 text-white">
                          Ready
                        </Badge>
                      </div>
                    </div>

                    {/* API Key Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">API Key</Label>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          Generate New Key
                        </Button>
                      </div>
                      <Alert className="py-2 bg-amber-50 border-amber-200">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        <AlertDescription className="text-xs text-amber-800">
                          API keys are managed at the organization level. Go to Settings → API Keys to manage keys for this agent.
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* API Endpoints */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">API Endpoints</Label>

                      {/* Chat Endpoint */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700">Chat API</span>
                          <Badge variant="secondary" className="text-xs">POST</Badge>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border font-mono text-xs">
                          <code className="flex-1 break-all">
                            /api/v1/agents/{selectedAgent.id}/chat
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Agent Info Endpoint */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700">Agent Info</span>
                          <Badge variant="secondary" className="text-xs">GET</Badge>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border font-mono text-xs">
                          <code className="flex-1 break-all">
                            /api/v1/agents/{selectedAgent.id}
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Example Request */}
                      <details className="mt-4">
                        <summary className="text-xs font-medium text-indigo-600 cursor-pointer hover:text-indigo-700 select-none">
                          View example request
                        </summary>
                        <div className="mt-2 p-4 bg-gray-900 rounded-lg">
                          <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre">
                            {`curl -X POST \\
  ${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':8000') : 'https://api.mentis.ai'}/api/v1/agents/${selectedAgent.id}/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello!",
    "session_id": "unique-session-id"
  }'`}
                          </pre>
                        </div>
                      </details>
                    </div>

                    {/* Rate Limits */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-sm font-semibold text-blue-900 mb-3">Rate Limits</div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                          <div className="text-xs text-blue-600">Per minute</div>
                          <div className="font-mono font-semibold">60 requests</div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-600">Per day</div>
                          <div className="font-mono font-semibold">10,000 requests</div>
                        </div>
                      </div>
                    </div>

                    {/* Documentation Link */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <Code className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1">API Documentation</div>
                          <p className="text-xs text-gray-600 mb-3">
                            Learn how to integrate this agent into your applications
                          </p>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Full Documentation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Publish Tab */}
            {selectedAgent && (
              <TabsContent value="publish" className="mt-4">
                <WidgetPublisher
                  agentId={selectedAgent.id}
                  agentName={selectedAgent.name}
                  agentType={(selectedAgent as any).agent_type}
                  interfaceType={formData.interface_type}
                  interfaceConfig={formData.interface_config}
                  onSave={() => {
                    toast({
                      title: 'Success',
                      description: 'Widget configuration saved successfully'
                    })
                  }}
                />
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate to test page if agent is saved
                  if (selectedAgent?.id) {
                    navigate(`/test-agent/${selectedAgent.id}`)
                  } else {
                    toast({
                      title: 'Save Required',
                      description: 'Please save the agent first before testing',
                      variant: 'default'
                    })
                  }
                }}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Test Agent
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setIsEditDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={isEditDialogOpen ? handleUpdateAgent : handleCreateAgent}
                  disabled={
                    isSaving ||
                    !formData.name.trim() ||
                    (formData.agent_type === 'chat' && !formData.system_prompt.trim()) ||
                    (formData.agent_type === 'flow' && flowNodes.length === 0)
                  }
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {isEditDialogOpen ? 'Update' : 'Create'} Agent
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-emerald-600" />
              Import Agent from JSON
            </DialogTitle>
            <DialogDescription>
              Upload a JSON file or paste JSON content to quickly create an agent
            </DialogDescription>
          </DialogHeader>

          <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as 'paste' | 'upload')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Paste JSON
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="flex-1 flex flex-col min-h-0 mt-4">
              <div className="flex-1 flex flex-col min-h-0">
                <Label htmlFor="json-input" className="mb-2">
                  JSON Content
                </Label>
                <Textarea
                  id="json-input"
                  placeholder='Paste your agent JSON here...

Example:
{
  "name": "My Agent",
  "agent_type": "chat",
  "description": "Description here",
  "system_prompt": "System prompt...",
  "capabilities": [],
  "tags": ["test"]
}'
                  value={importJSON}
                  onChange={(e) => setImportJSON(e.target.value)}
                  className="flex-1 min-h-[400px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex-1 flex flex-col items-center justify-center mt-4 border-2 border-dashed rounded-lg p-8">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload JSON File</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Click to browse or drag and drop your .json file here
                </p>
                <Button type="button" variant="outline">
                  <FileJson className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </label>
              {importJSON && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg w-full">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">File loaded successfully!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {importJSON.length} characters • Ready to import
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={processImportJSON}
              disabled={!importJSON.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <FileJson className="h-4 w-4 mr-2" />
              Import & Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {itemToDelete && (
                <>
                  Are you sure you want to delete <strong className="text-gray-900">{itemToDelete.name}</strong>?
                  <br />
                  <br />
                  This {itemToDelete.type} will be moved to trash and can be restored later.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setItemToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {itemToDelete?.type}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer variant="minimal" />
    </div>
  )
}

export { WorkspacePage }
export default WorkspacePage
