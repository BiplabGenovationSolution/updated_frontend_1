import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Loader2,
    Check,
    AlertCircle,
    Sparkles,
    Plus,
    X,
    ArrowLeft,
    ArrowRight,
    Code,
    ChevronRight,
    Zap,
    Bot,
    GitBranch,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ExampleQuery, AgentCapability, Capability } from '@/lib/types'
import { cn } from '@/lib/utils'
import Avatar from 'boring-avatars'
import { FlowCanvas, NodeConfigPanel } from '@/components/flows'
import NodeSelector from '@/components/flows/NodeSelector'
import type { FlowNode as FlowNodeType, FlowEdge } from '@/lib/flow-types'
import { InterfaceConfigurator } from '@/components/InterfaceConfigurator'

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabKey = 'basic' | 'prompt' | 'examples' | 'capabilities' | 'workflows' | 'interface'

interface StepDef {
    key: TabKey
    label: string
    required: boolean
}

const CHAT_STEPS: StepDef[] = [
    { key: 'basic', label: 'Basic Info', required: true },
    { key: 'prompt', label: 'System Prompt', required: true },
    { key: 'examples', label: 'Examples', required: false },
    { key: 'capabilities', label: 'Capabilities', required: false },
    { key: 'interface', label: 'Interface', required: false },
]

const FLOW_STEPS: StepDef[] = [
    { key: 'basic', label: 'Basic Info', required: true },
    { key: 'workflows', label: 'Flow Builder', required: true },
    { key: 'interface', label: 'Interface', required: false },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateCustomAgentPage() {
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const { toast } = useToast()

    const [isSaving, setIsSaving] = useState(false)
    const [allCapabilities, setAllCapabilities] = useState<Capability[]>([])
    const [availableModels, setAvailableModels] = useState<any[]>([])

    // ── Form state ──────────────────────────────────────────────────────────
    const [agentFormData, setAgentFormData] = useState({
        name: '',
        description: '',
        agent_type: 'chat' as 'chat' | 'flow',
        model_id: undefined as string | undefined,
        system_prompt: '',
        initial_message: '',
        interface_type: 'chat' as 'chat' | 'form' | 'json' | 'api' | 'wizard',
        interface_config: {} as Record<string, any>,
        visibility: 'private' as 'private' | 'public' | 'shared',
        tags: [] as string[],
        configuration: {
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop_sequences: [] as string[],
        },
        example_queries: [] as ExampleQuery[],
        capabilities: [] as AgentCapability[],
    })

    const [newTag, setNewTag] = useState('')
    const [newExampleQuery, setNewExampleQuery] = useState({
        query: '', expected_response: '', description: '',
    })

    // ── Flow builder state ──────────────────────────────────────────────────────
    const [flowNodes, setFlowNodes] = useState<FlowNodeType[]>([])
    const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([])
    const [selectedFlowNode, setSelectedFlowNode] = useState<FlowNodeType | null>(null)
    const [flowBuilderOpen, setFlowBuilderOpen] = useState(false)
    const [flowBuilderKey, setFlowBuilderKey] = useState(0)
    const [showNodeSelector, setShowNodeSelector] = useState(false)
    const [nodeSelectorPosition, setNodeSelectorPosition] = useState<{ x: number, y: number } | null>(null)
    const [nodeSelectorSourceNode, setNodeSelectorSourceNode] = useState<string | null>(null)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    // ── Avatar state ────────────────────────────────────────────────────────
    const [selectedAvatar, setSelectedAvatar] = useState({
        variant: 'beam', seed: '', colors: ['#a855f7', '#ec4899', '#ffffff'],
    })
    const [avatarOptions, setAvatarOptions] = useState<
        Array<{ variant: string; seed: string; colors: string[] }>
    >([])

    // ── Wizard tab state ────────────────────────────────────────────────────
    const steps = agentFormData.agent_type === 'chat' ? CHAT_STEPS : FLOW_STEPS
    const [activeTab, setActiveTab] = useState<TabKey>('basic')

    // Keep activeTab valid when agent type changes
    useEffect(() => {
        const keys = steps.map(s => s.key)
        if (!keys.includes(activeTab)) setActiveTab('basic')
    }, [agentFormData.agent_type]) // eslint-disable-line react-hooks/exhaustive-deps

    const currentStepIndex = steps.findIndex(s => s.key === activeTab)
    const isFirstStep = currentStepIndex === 0
    const isLastStep = currentStepIndex === steps.length - 1

    // ── Avatar helpers ──────────────────────────────────────────────────────
    const avatarVariants = ['beam', 'marble', 'pixel', 'sunset', 'ring', 'bauhaus']
    const colorSchemes = [
        ['#a855f7', '#ec4899', '#ffffff'],
        ['#10b981', '#06b6d4', '#ffffff'],
        ['#f59e0b', '#ef4444', '#ffffff'],
        ['#3b82f6', '#8b5cf6', '#ffffff'],
        ['#14b8a6', '#06b6d4', '#ffffff'],
        ['#f97316', '#dc2626', '#ffffff'],
        ['#6366f1', '#a855f7', '#ffffff'],
        ['#22d3ee', '#0891b2', '#ffffff'],
    ]

    const generateAvatarOptions = () => {
        const options = []
        for (let i = 0; i < 10; i++) {
            const variant = avatarVariants[Math.floor(Math.random() * avatarVariants.length)]
            const colors = colorSchemes[Math.floor(Math.random() * colorSchemes.length)]
            const seed = `${Date.now()}-${Math.random()}`
            options.push({ variant, seed, colors })
        }
        setAvatarOptions(options)
        if (options.length > 0 && !selectedAvatar.seed) setSelectedAvatar(options[0])
    }

    // ── Models loader ───────────────────────────────────────────────────────
    const loadAvailableModels = async () => {
        if (!user) return
        try {
            const response = await apiClient.models.list('default', { include_global: true, is_enabled: true })
            if (response.success && response.data) setAvailableModels(response.data.models || [])
        } catch (error) {
            console.error('Failed to load models:', error)
        }
    }

    // ── Auth / init ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return
        if (!user) { navigate('/auth/login'); return }
        loadCapabilitiesForAgents()
        loadAvailableModels()
        generateAvatarOptions()
    }, [user, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

    const loadCapabilitiesForAgents = async () => {
        try {
            const [localRes, globalRes] = await Promise.all([
                apiClient.getCapabilities({ limit: 100 }),
                apiClient.getMarketplaceCapabilities({ limit: 100, sort_by: 'usage_count', sort_order: 'desc' }),
            ])
            const localCaps = localRes.success && localRes.data ? localRes.data.capabilities || [] : []
            const globalCaps = globalRes.success && globalRes.data ? globalRes.data.capabilities || [] : []
            const markedGlobal = globalCaps.map((c: any) => ({ ...c, is_global: true }))
            setAllCapabilities([
                ...localCaps,
                ...markedGlobal.filter((gc: any) => !localCaps.some((lc: any) => lc.id === gc.id)),
            ])
        } catch (err) {
            console.error('Failed to load capabilities:', err)
        }
    }

    // ── Tag helpers ─────────────────────────────────────────────────────────
    const addTag = () => {
        if (newTag.trim() && !agentFormData.tags.includes(newTag.trim())) {
            setAgentFormData({ ...agentFormData, tags: [...agentFormData.tags, newTag.trim()] })
            setNewTag('')
        }
    }
    const removeTag = (tag: string) =>
        setAgentFormData({ ...agentFormData, tags: agentFormData.tags.filter(t => t !== tag) })

    // ── Example helpers ─────────────────────────────────────────────────────
    const addExampleQuery = () => {
        if (newExampleQuery.query.trim()) {
            setAgentFormData({
                ...agentFormData,
                example_queries: [...agentFormData.example_queries, { ...newExampleQuery }],
            })
            setNewExampleQuery({ query: '', expected_response: '', description: '' })
        }
    }
    const removeExampleQuery = (index: number) =>
        setAgentFormData({
            ...agentFormData,
            example_queries: agentFormData.example_queries.filter((_, i) => i !== index),
        })

    // ── Capability toggle ───────────────────────────────────────────────────
    const toggleCapability = (capabilityId: string) => {
        const isEnabled = agentFormData.capabilities.some(c => c.capability_id === capabilityId)
        setAgentFormData({
            ...agentFormData,
            capabilities: isEnabled
                ? agentFormData.capabilities.filter(c => c.capability_id !== capabilityId)
                : [...agentFormData.capabilities, { capability_id: capabilityId, enabled: true, custom_config: null }],
        })
    }

    // ── Flow node handler ───────────────────────────────────────────────────
    const handleNodeConfigUpdate = (nodeId: string, newConfig: Record<string, any>, newLabel?: string) => {
        setFlowNodes(prev => prev.map(node =>
            node.id === nodeId ? { ...node, label: newLabel || node.label, config: newConfig } : node
        ))
    }

    // ── Per-step validation ─────────────────────────────────────────────────
    const validateStep = (key: TabKey): boolean => {
        switch (key) {
            case 'basic':
                if (!agentFormData.name.trim()) {
                    toast({ 
                        title: 'Required', 
                        description: 'Please enter an agent name.', 
                        variant: 'destructive',
                        duration: 2000
                    })
                    return false
                }
                return true
            case 'prompt':
                if (!agentFormData.system_prompt.trim()) {
                    toast({ 
                        title: 'Required', 
                        description: 'System prompt is required for conversational agents.', 
                        variant: 'destructive',
                        duration: 2000
                    })
                    return false
                }
                return true
            case 'workflows':
                if (flowNodes.length === 0) {
                    toast({ 
                        title: 'Required', 
                        description: 'Add at least one node to the flow before continuing.', 
                        variant: 'destructive',
                        duration: 2000
                    })
                    return false
                }
                return true
            default:
                return true // optional tabs
        }
    }

    const goNext = () => {
        if (!validateStep(activeTab)) return
        const next = steps[currentStepIndex + 1]
        if (next) setActiveTab(next.key)
    }

    const goPrev = () => {
        const prev = steps[currentStepIndex - 1]
        if (prev) setActiveTab(prev.key)
    }

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleCreateCustomAgent = async () => {
        // Final validation pass on all required steps
        for (const step of steps) {
            if (step.required && !validateStep(step.key)) {
                setActiveTab(step.key)
                return
            }
        }

        try {
            setIsSaving(true)

            const payload: any = {
                name: agentFormData.name,
                emoji: '🤖',
                description: agentFormData.description || agentFormData.name,
                agent_type: agentFormData.agent_type,
                system_prompt: agentFormData.agent_type === 'chat' ? agentFormData.system_prompt : ' ',
                initial_message: agentFormData.initial_message || undefined,
                interface_type: agentFormData.interface_type,
                interface_config: agentFormData.interface_config,
                tags: agentFormData.tags,
                visibility: agentFormData.visibility,
                configuration: agentFormData.configuration,
                example_queries: agentFormData.example_queries,
                capabilities: agentFormData.agent_type === 'chat'
                    ? agentFormData.capabilities.map(c => ({
                        capability_id: c.capability_id,
                        enabled: c.enabled,
                        custom_config: c.custom_config ?? undefined,
                    }))
                    : [],
                metadata: { avatar: selectedAvatar },
            }
            const response = await apiClient.createCustomAgent(payload)

            if (response.success && response.data) {
                const createdAgent = response.data.agent || response.data

                // If flow agent, also create the flow
                if (agentFormData.agent_type === 'flow' && flowNodes.length > 0) {
                    try {
                        const startNode = flowNodes.find(n => n.type?.startsWith('input')) || flowNodes[0]
                        await apiClient.flows.create({
                            name: `${agentFormData.name} Workflow`,
                            description: `Workflow for ${agentFormData.name}`,
                            agent_id: createdAgent.id,
                            nodes: flowNodes.map(node => ({
                                id: node.id, type: node.type || 'default',
                                label: node.label, config: node.config || {}, position: node.position,
                            })),
                            edges: flowEdges.map(edge => ({
                                id: edge.id, source: edge.source, target: edge.target,
                                sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle,
                                label: edge.label, condition: edge.condition,
                            })),
                            config: {
                                startNodeId: startNode?.id || flowNodes[0]?.id,
                                maxExecutionTime: 300, errorHandling: 'stop', retryAttempts: 3, timeout: 300,
                            },
                            variables: {},
                            tags: agentFormData.tags,
                            metadata: { created_with: 'visual_builder', agent_name: agentFormData.name },
                        })
                    } catch (flowErr) {
                        console.error('Failed to create flow:', flowErr)
                        toast({ 
                            title: 'Partial Success', 
                            description: 'Agent created but flow creation failed.', 
                            variant: 'destructive',
                            duration: 2000
                        })
                    }
                }

                toast({ 
                    title: 'Success', 
                    description: 'Custom agent created successfully.', 
                    duration: 2000
                })
                navigate('/agents')
            }
        } catch (error: any) {
            toast({ 
                title: 'Error', 
                description: error.message || 'Failed to create agent', 
                variant: 'destructive',
                duration: 2000
            })
        } finally {
            setIsSaving(false)
        }
    }

    // ── Loading ─────────────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#1e2433] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto p-6">

            {/* ── Page header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Custom Agent</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Build a personalized AI agent with custom behavior, capabilities, and interface.
                </p>
            </div>

            {/* ── Agent Type selector (only on first step) ── */}
            {activeTab === 'basic' && (
                <div className="mb-6 p-4 border rounded-md bg-white dark:bg-[#1c2128] border-slate-200 dark:border-slate-800">
                    <Label className="text-sm font-semibold mb-3 block text-slate-700 dark:text-slate-300">Agent Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Chat */}
                        <Card
                            className={cn(
                                'p-4 cursor-pointer transition-all dark:bg-[#1c2128] dark:border-slate-800',
                                agentFormData.agent_type === 'chat'
                                    ? 'border-[#146f84] bg-[#146f84]/5 dark:bg-[#146f84]/10'
                                    : 'border-slate-200 hover:border-blue-400/40 dark:hover:border-blue-500/30'
                            )}
                            onClick={() => setAgentFormData({ ...agentFormData, agent_type: 'chat' })}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0',
                                    agentFormData.agent_type === 'chat' ? 'bg-[#146f84] border-[#146f84]' : 'border-slate-300 dark:border-slate-600'
                                )}>
                                    {agentFormData.agent_type === 'chat' && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-1">Conversational Agent</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Free-flowing conversations with LLM. Define behavior through system prompts and capabilities.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Flow */}
                        <Card
                            className={cn(
                                'p-4 cursor-pointer transition-all dark:bg-[#1c2128] dark:border-slate-800',
                                agentFormData.agent_type === 'flow'
                                    ? 'border-[#146f84] bg-[#146f84]/5 dark:bg-[#146f84]/10'
                                    : 'border-slate-200 hover:border-blue-400/40 dark:hover:border-blue-500/30'
                            )}
                            onClick={() => setAgentFormData({ ...agentFormData, agent_type: 'flow' })}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0',
                                    agentFormData.agent_type === 'flow' ? 'bg-[#146f84] border-[#146f84]' : 'border-slate-300 dark:border-slate-600'
                                )}>
                                    {agentFormData.agent_type === 'flow' && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-1">Flow Agent</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Strict sequential workflow. Build visual flows with input, decision, action, and output nodes.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* ── Progress stepper ── */}
            <div className="mb-6">
                <div className="flex items-center gap-0">
                    {steps.map((step, idx) => {
                        const isDone = idx < currentStepIndex
                        const isActive = idx === currentStepIndex
                        const isLast = idx === steps.length - 1
                        return (
                            <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                                        isDone && 'bg-green-500 border-green-500 text-white',
                                        isActive && 'bg-indigo-600 border-indigo-600 text-white',
                                        !isDone && !isActive && 'bg-white dark:bg-[#1e2433] border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                                    )}>
                                        {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <span className={cn(
                                        'text-xs mt-1 font-medium whitespace-nowrap',
                                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                                    )}>
                                        {step.label}
                                        {!step.required && <span className="ml-1 text-gray-400 dark:text-gray-600">(optional)</span>}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className={cn(
                                        'h-0.5 flex-1 mx-1 rounded transition-all',
                                        idx < currentStepIndex ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                                    )} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ══════════════════════════════════════════
              STEP CONTENT
          ══════════════════════════════════════════ */}

            {/* ── Basic Info ── */}
            {activeTab === 'basic' && (
                <Card className="p-6 dark:bg-[#1e2433] dark:border-[#2d3545] space-y-5">
                    <div>
                        <Label htmlFor="agent-name" className="dark:text-white">
                            Agent Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="agent-name"
                            placeholder="My Custom Agent"
                            value={agentFormData.name}
                            onChange={e => setAgentFormData({ ...agentFormData, name: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="agent-description" className="dark:text-white">Description</Label>
                        <Textarea
                            id="agent-description"
                            placeholder="Describe what your agent does..."
                            value={agentFormData.description}
                            onChange={e => setAgentFormData({ ...agentFormData, description: e.target.value })}
                            rows={3}
                            className="mt-1"
                        />
                    </div>

                    {/* Initial Message */}
                    <div>
                        <Label htmlFor="agent-initial-message" className="dark:text-white">Initial Message</Label>
                        <Textarea
                            id="agent-initial-message"
                            placeholder="Hi! I'm your assistant. I can help you with..."
                            value={agentFormData.initial_message}
                            onChange={e => setAgentFormData({ ...agentFormData, initial_message: e.target.value })}
                            rows={3}
                            className="mt-1 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Greeting shown when chat starts (only in chat interface mode)
                        </p>
                    </div>

                    {/* AI Model */}
                    <div>
                        <Label className="dark:text-white">AI Model</Label>
                        <Select
                            value={agentFormData.model_id}
                            onValueChange={value => setAgentFormData({ ...agentFormData, model_id: value })}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__default__">Use Organization Default</SelectItem>
                                {availableModels.map(model => (
                                    <SelectItem key={model.model_id} value={model.model_id}>
                                        {model.display_name} ({model.provider}){model.is_default ? ' - Default' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Choose which AI model powers this agent. Leave as default to use your organization's default model.
                        </p>
                    </div>

                    {/* Avatar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="dark:text-white">Avatar</Label>
                            <Button type="button" onClick={generateAvatarOptions} size="sm" variant="outline">
                                Generate More
                            </Button>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {avatarOptions.map((option, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        'cursor-pointer rounded-lg p-2 border-2 transition-all hover:shadow-md',
                                        selectedAvatar.seed === option.seed
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    )}
                                    onClick={() => setSelectedAvatar(option)}
                                >
                                    <div
                                        className="w-full aspect-square rounded-lg flex items-center justify-center"
                                        style={{ background: `linear-gradient(135deg, ${option.colors[0]} 0%, ${option.colors[1]} 100%)` }}
                                    >
                                        <Avatar size={40} name={option.seed} variant={option.variant as any} colors={option.colors} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {avatarOptions.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Click "Generate More" to see avatar options</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <Label className="dark:text-white">Tags</Label>
                        <div className="flex gap-2 mt-1 mb-2">
                            <Input
                                placeholder="Add a tag..."
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <Button type="button" onClick={addTag} size="sm"><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {agentFormData.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                    {tag}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Visibility */}
                    <div>
                        <Label className="dark:text-white">Visibility</Label>
                        <Select
                            value={agentFormData.visibility}
                            onValueChange={(value: any) => setAgentFormData({ ...agentFormData, visibility: value })}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="organization">Organization</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Temperature / Max tokens */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="dark:text-white">Temperature</Label>
                            <Input
                                type="number" min="0" max="2" step="0.1"
                                value={agentFormData.configuration.temperature}
                                onChange={e => setAgentFormData({
                                    ...agentFormData,
                                    configuration: { ...agentFormData.configuration, temperature: parseFloat(e.target.value) },
                                })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="dark:text-white">Max Tokens</Label>
                            <Input
                                type="number" min="1" max="8192"
                                value={agentFormData.configuration.max_tokens}
                                onChange={e => setAgentFormData({
                                    ...agentFormData,
                                    configuration: { ...agentFormData.configuration, max_tokens: parseInt(e.target.value) },
                                })}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* ── System Prompt ── */}
            {activeTab === 'prompt' && (
                <Card className="p-6 dark:bg-[#1e2433] dark:border-[#2d3545]">
                    <Label htmlFor="agent-prompt" className="dark:text-white">
                        System Prompt <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="agent-prompt"
                        placeholder="You are an expert assistant that..."
                        value={agentFormData.system_prompt}
                        onChange={e => setAgentFormData({ ...agentFormData, system_prompt: e.target.value })}
                        rows={22}
                        className="font-mono text-sm mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        This defines your agent's behavior, personality, and expertise.
                    </p>
                </Card>
            )}

            {/* ── Examples (optional) ── */}
            {activeTab === 'examples' && (
                <Card className="p-6 dark:bg-[#1e2433] dark:border-[#2d3545] space-y-4">
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-300">
                            Examples are <strong>optional</strong> — they help users understand what the agent can do.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label className="dark:text-white">Example Query</Label>
                            <Input
                                placeholder="What can you help me with?"
                                value={newExampleQuery.query}
                                onChange={e => setNewExampleQuery({ ...newExampleQuery, query: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="dark:text-white">Expected Response</Label>
                            <Textarea
                                placeholder="I can help you with..."
                                value={newExampleQuery.expected_response}
                                onChange={e => setNewExampleQuery({ ...newExampleQuery, expected_response: e.target.value })}
                                rows={2}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="dark:text-white">Description</Label>
                            <Input
                                placeholder="General capabilities example"
                                value={newExampleQuery.description}
                                onChange={e => setNewExampleQuery({ ...newExampleQuery, description: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <Button type="button" onClick={addExampleQuery} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />Add Example
                        </Button>
                    </div>

                    {agentFormData.example_queries.length > 0 && (
                        <div className="space-y-2">
                            {agentFormData.example_queries.map((example, index) => (
                                <Card key={index} className="p-4 dark:bg-[#252d3f] dark:border-[#2d3545]">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm dark:text-white">{example.query}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{example.expected_response}</p>
                                            {example.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{example.description}</p>
                                            )}
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExampleQuery(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ── Capabilities (optional) ── */}
            {activeTab === 'capabilities' && (
                <div className="space-y-4">
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-300">
                            <strong>Optional</strong> — Select which tools this agent can use. The LLM automatically handles when and how to call them.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label className="text-base font-semibold dark:text-white">
                            Available Tools ({agentFormData.capabilities.length} selected)
                        </Label>
                        {allCapabilities.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>No capabilities available. Create capabilities first.</AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-1">
                                {allCapabilities.map(capability => {
                                    const isEnabled = agentFormData.capabilities.some(c => c.capability_id === capability.id)
                                    const isGlobal = (capability as any).is_global
                                    return (
                                        <Card
                                            key={capability.id}
                                            className={cn(
                                                'p-4 cursor-pointer transition-all dark:bg-[#1e2433] dark:border-[#2d3545]',
                                                isEnabled
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800 shadow-sm'
                                                    : 'hover:bg-gray-50 dark:hover:bg-[#2d3545]'
                                            )}
                                            onClick={() => toggleCapability(capability.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                                                    isEnabled ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600'
                                                )}>
                                                    {isEnabled && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <Code className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                                        <h4 className="font-semibold text-sm dark:text-white">{capability.name}</h4>
                                                        <Badge variant="secondary" className="text-xs">{capability.category}</Badge>
                                                        {isGlobal && (
                                                            <Badge className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                                                <Sparkles className="h-2.5 w-2.5 mr-1" />Global
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{capability.description}</p>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="font-medium dark:text-gray-300">Parameters:</span>{' '}
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
                </div>
            )}

            {/* ── Interface (optional) ── */}
            {activeTab === 'interface' && (
                <InterfaceConfigurator
                    agentId={""}
                    agentName={agentFormData.name}
                    agentType={agentFormData.agent_type}
                    capabilities={allCapabilities}
                    agentCapabilities={agentFormData.capabilities}
                    flowNodes={flowNodes}
                    initialConfig={{
                        interface_type: agentFormData.interface_type,
                        interface_config: agentFormData.interface_config,
                    }}
                    onSave={async (config) => {
                        setAgentFormData({
                            ...agentFormData,
                            interface_type: config.interface_type,
                            interface_config: config.interface_config,
                        })
                    }}
                />
            )}

            {/* ── Flow Builder ── */}
            {activeTab === 'workflows' && (
                <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-gray-200 dark:border-gray-700 mx-10 rounded-xl bg-gray-50/50 dark:bg-[#1a1f2e]">
                        <div className="text-center max-w-lg mx-auto p-6">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                                Design Your Workflow
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                Use the visual flow builder to create your agent's logic. Drag and drop nodes, connect them, and test your workflow in real-time.
                            </p>

                            <Button
                                onClick={(e) => {
                                    e.preventDefault()
                                    setFlowBuilderOpen(true)
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-8 py-6 text-base rounded-full transition-transform hover:scale-105 active:scale-95"
                            >
                                <GitBranch className="h-5 w-5 mr-2" />
                                Open Visual Flow Builder
                            </Button>

                            <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
                                {flowNodes.length > 0
                                    ? `${flowNodes.length} nodes configured in this workflow`
                                    : "No nodes configured yet"}
                            </p>
                        </div>
                    </div>

                    {/* Full-screen flow builder Dialog */}
                    <Dialog open={flowBuilderOpen} onOpenChange={(open) => {
                        if (open) setFlowBuilderKey(k => k + 1)
                        setFlowBuilderOpen(open)
                    }}>
                        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 overflow-hidden bg-white dark:bg-[#0f1219] border-none [&>button]:hidden">
                            <div className="flex w-full h-full overflow-hidden relative">
                                {/* Flow Canvas Area */}
                                <div className="absolute inset-0 z-0">
                                    <FlowCanvas
                                        key={flowBuilderKey}
                                        initialNodes={flowNodes}
                                        initialEdges={flowEdges}
                                        onNodesChange={setFlowNodes}
                                        onEdgesChange={setFlowEdges}
                                        onNodeSelect={(node) => {
                                            setSelectedFlowNode(node);
                                            setIsSidebarCollapsed(false);
                                        }}
                                        onAddNodeClick={(position, sourceNodeId) => {
                                            setNodeSelectorPosition(position);
                                            setNodeSelectorSourceNode(sourceNodeId || null);
                                            setShowNodeSelector(true);
                                            setSelectedFlowNode(null);
                                        }}
                                        toolbarActions={
                                            <div className="flex items-center gap-2 border-l pl-2 ml-2 border-gray-200 dark:border-gray-700">
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                    onClick={() => {
                                                        setFlowBuilderOpen(false);
                                                        toast({ 
                                                            title: "Flow Saved", 
                                                            description: "Your changes have been applied." ,
                                                            duration: 2000
                                                        });
                                                    }}
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Save & Return
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setFlowBuilderOpen(false)}
                                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Close
                                                </Button>
                                            </div>
                                        }
                                    />
                                </div>

                                {/* Node Selector Overlay */}
                                {showNodeSelector && (
                                    <div className="absolute right-0 top-[61px] bottom-0 z-50 w-80 shadow-xl border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e]">
                                        <NodeSelector
                                            onNodeSelect={(nodeType: string) => {
                                                const newNode: FlowNodeType = {
                                                    id: `node-${Date.now()}`,
                                                    type: nodeType,
                                                    label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
                                                    config: {},
                                                    position: nodeSelectorPosition || { x: 100, y: 100 },
                                                };
                                                setFlowNodes((prev) => [...prev, newNode]);
                                                if (nodeSelectorSourceNode) {
                                                    const newEdge: FlowEdge = {
                                                        id: `edge-${Date.now()}`,
                                                        source: nodeSelectorSourceNode,
                                                        target: newNode.id,
                                                    };
                                                    setFlowEdges((prev) => [...prev, newEdge]);
                                                }
                                                setShowNodeSelector(false);
                                            }}
                                            onClose={() => setShowNodeSelector(false)}
                                            title={flowNodes.length === 0 ? "Start Workflow" : "Add Step"}
                                            className="h-full border-0 rounded-none shadow-none"
                                        />
                                    </div>
                                )}

                                {/* Node Config Panel Overlay (Right Side) */}
                                {selectedFlowNode && !isSidebarCollapsed && (
                                    <div className="absolute right-0 top-[61px] bottom-0 w-80 bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-gray-800 shadow-xl z-20 overflow-y-auto">
                                        <NodeConfigPanel
                                            node={selectedFlowNode}
                                            onUpdate={handleNodeConfigUpdate}
                                            onClose={() => setSelectedFlowNode(null)}
                                        />
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* ══════════════════════════════════════════
              NAVIGATION BAR
          ══════════════════════════════════════════ */}
            <div className="flex justify-between items-center mt-8 pb-8">
                {/* Left: Cancel / Previous */}
                <div className="flex gap-2">
                    {isFirstStep ? (
                        <Button variant="outline" onClick={() => navigate('/agents')}>
                            Cancel
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={goPrev}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>
                    )}
                </div>

                {/* Right: Next / Create */}
                <div>
                    {isLastStep ? (
                        <Button
                            onClick={handleCreateCustomAgent}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                            ) : (
                                <><Bot className="mr-2 h-4 w-4" />Create Agent</>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={goNext} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white">
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
