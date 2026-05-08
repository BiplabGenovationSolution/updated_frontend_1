import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
    Save,
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

export default function EditCustomAgentPage() {
    const { agentId } = useParams<{ agentId: string }>()
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [currentFlowId, setCurrentFlowId] = useState<string | null>(null)
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

    const generateAvatarOptions = (existingAvatar?: { variant: string; seed: string; colors: string[] }) => {
        const options = []
        for (let i = 0; i < 10; i++) {
            const variant = avatarVariants[Math.floor(Math.random() * avatarVariants.length)]
            const colors = colorSchemes[Math.floor(Math.random() * colorSchemes.length)]
            const seed = `${Date.now()}-${Math.random()}`
            options.push({ variant, seed, colors })
        }
        // Prepend existing avatar so it stays selectable
        if (existingAvatar?.seed) options.unshift(existingAvatar)
        setAvatarOptions(options)
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

    // ── Load agent data ──────────────────────────────────────────────────────
    const loadAgentData = async () => {
        if (!agentId) return
        setIsLoading(true)
        try {
            const agentRes = await apiClient.customAgents.get(agentId)
            if (!agentRes.success || !agentRes.data) {
                toast({
                    title: 'Error',
                    description: 'Agent not found',
                    variant: 'destructive',
                    duration: 2000
                })
                navigate('/agents')
                return
            }
            const agent = agentRes.data.agent || agentRes.data

            const existingAvatar = agent.metadata?.avatar || { variant: 'beam', seed: '', colors: ['#a855f7', '#ec4899', '#ffffff'] }

            setAgentFormData({
                name: agent.name || '',
                description: agent.description || '',
                agent_type: agent.agent_type || 'chat',
                model_id: agent.model_id,
                system_prompt: agent.system_prompt || '',
                initial_message: agent.initial_message || '',
                interface_type: agent.interface_type || 'chat',
                interface_config: agent.interface_config || {},
                visibility: agent.visibility === 'organization' ? 'shared' : (agent.visibility || 'private'),
                tags: agent.tags || [],
                configuration: {
                    temperature: agent.configuration?.temperature ?? 0.7,
                    max_tokens: agent.configuration?.max_tokens ?? 2048,
                    top_p: agent.configuration?.top_p ?? 1,
                    frequency_penalty: agent.configuration?.frequency_penalty ?? 0,
                    presence_penalty: agent.configuration?.presence_penalty ?? 0,
                    stop_sequences: agent.configuration?.stop_sequences || [],
                },
                example_queries: agent.example_queries || [],
                capabilities: agent.capabilities || [],
            })

            setSelectedAvatar(existingAvatar)
            generateAvatarOptions(existingAvatar)

            // Load flow if flow type
            if (agent.agent_type === 'flow') {
                try {
                    const flowsRes = await apiClient.flows.list({ limit: 100, offset: 0 })
                    if (flowsRes.success && flowsRes.data?.flows) {
                        const agentFlow = flowsRes.data.flows.find((f: any) => f.agent_id === agentId)
                        if (agentFlow) {
                            setFlowNodes(agentFlow.nodes || [])
                            setFlowEdges(agentFlow.edges || [])
                            setCurrentFlowId(agentFlow.id)
                        }
                    }
                } catch (err) {
                    console.error('Failed to load flow:', err)
                }
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to load agent',
                variant: 'destructive',
                duration: 2000
            })
            navigate('/agents')
        } finally {
            setIsLoading(false)
        }
    }

    // ── Auth / init ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return
        if (!user) { navigate('/auth/login'); return }
        loadCapabilitiesForAgents()
        loadAvailableModels()
        loadAgentData()
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

    // ── Validation ─────────────────────────────────────────────────────────
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
                return true
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

    // ── Submit (update) ──────────────────────────────────────────────────────
    const handleUpdateAgent = async () => {
        for (const step of steps) {
            if (step.required && !validateStep(step.key)) {
                setActiveTab(step.key)
                return
            }
        }

        if (!agentId) return

        try {
            setIsSaving(true)

            const payload: any = {
                name: agentFormData.name,
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

            const response = await apiClient.customAgents.update(agentId, payload)

            if (response.success) {
                // Update or create flow if flow agent
                if (agentFormData.agent_type === 'flow' && flowNodes.length > 0) {
                    try {
                        const startNode = flowNodes.find(n => n.type?.startsWith('input')) || flowNodes[0]
                        const flowPayload = {
                            name: `${agentFormData.name} Workflow`,
                            description: `Workflow for ${agentFormData.name}`,
                            agent_id: agentId,
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
                            metadata: { updated_with: 'visual_builder', agent_name: agentFormData.name },
                        }

                        if (currentFlowId) {
                            await apiClient.flows.update(currentFlowId, flowPayload)
                        } else {
                            const newFlow = await apiClient.flows.create(flowPayload)
                            if (newFlow.success && newFlow.data?.flow?.id) {
                                setCurrentFlowId(newFlow.data.flow.id)
                            }
                        }
                    } catch (flowErr) {
                        console.error('Failed to update flow:', flowErr)
                        toast({
                            title: 'Partial Success',
                            description: 'Agent updated but flow update failed.',
                            variant: 'destructive',
                            duration: 2000
                        })
                    }
                }

                toast({
                    title: 'Success', description:
                        'Agent updated successfully.',
                    duration: 2000
                })
                navigate('/agents')
            } else {
                toast({
                    title: 'Error',
                    description: (response as any).error || 'Failed to update agent', variant: 'destructive',
                    duration: 2000
                })
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update agent', variant: 'destructive',
                duration: 2000
            })
        } finally {
            setIsSaving(false)
        }
    }

    // ── Loading ─────────────────────────────────────────────────────────────
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#1e2433] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading agent...</p>
                </div>
            </div>
        )
    }

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto p-6">

            {/* ── Page header ── */}
            <div className="mb-6">

                {/* <Button
                    onClick={() => navigate('/agents')}
                    variant="ghost"
                    className="mb-4 bg-white text-black "
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Workspace
                </Button> */}
                <Button
                    onClick={() => navigate('/agents')}
                    variant="ghost"
                    className="mb-4 bg-white text-black hover:bg-gray-100 border border-gray-300
             dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Workspace
                </Button>
                <div className="flex items-center gap-3 mb-2">

                    <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-400">Edit Agent</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Update your agent's configuration, behavior, and capabilities.
                </p>
            </div>

            {/* ── Agent Type selector (only on first step) ── */}
            {activeTab === 'basic' && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-[#1e2433] dark:border-[#2d3545]">
                    <Label className="text-base font-semibold mb-3 block dark:text-white">Agent Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Chat */}


                        <Card
                            className={cn(
                                "p-4 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md",
                                agentFormData.agent_type === "chat" &&
                                "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-slate-800 rounded-sm"
                            )}
                            onClick={() =>
                                setAgentFormData({ ...agentFormData, agent_type: "chat" })
                            }
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                                        agentFormData.agent_type === "chat"
                                            ? "bg-gray-500 border-gray-500"
                                            : "border-gray-300 dark:border-gray-600"
                                    )}
                                >
                                    {agentFormData.agent_type === "chat" && (
                                        <Check className="h-3 w-3 text-white" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">

                                        <h3 className="font-semibold dark:text-white">
                                            Conversational Agent
                                        </h3>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Free-flowing conversations with LLM. Define behavior through system
                                        prompts and capabilities.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Flow */}
                        <Card
                            className={cn(
                                "p-4 cursor-pointer transition-all bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md shadow-md hover:shadow-md",
                                agentFormData.agent_type === "flow" &&
                                "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-slate-800 rounded-sm shadow-lg"
                            )}
                            onClick={() =>
                                setAgentFormData({ ...agentFormData, agent_type: "flow" })
                            }
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                                        agentFormData.agent_type === "flow"
                                            ? "bg-gray-500 border-gray-500"
                                            : "border-gray-300 dark:border-gray-600"
                                    )}
                                >
                                    {agentFormData.agent_type === "flow" && (
                                        <Check className="h-3 w-3 text-white" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">

                                        <h3 className="font-semibold dark:text-white">
                                            Flow Agent
                                        </h3>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Strict sequential workflow. Build visual flows with input, decision,
                                        action, and output nodes.
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
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                                            isDone && "bg-green-400 border-green-400 text-white",
                                            isActive && "bg-gray-500 border-gray-500 text-white",
                                            !isDone &&
                                            !isActive &&
                                            "bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                                        )}
                                    >
                                        {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                                    </div>

                                    <span
                                        className={cn(
                                            "text-xs mt-1 font-medium whitespace-nowrap",
                                            isActive
                                                ? "text-gray-600 dark:text-gray-300"
                                                : "text-gray-400 dark:text-gray-500"
                                        )}
                                    >
                                        {step.label}
                                        {!step.required && (
                                            <span className="ml-1 text-gray-400 dark:text-gray-600">
                                                (optional)
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {!isLast && (
                                    <div
                                        className={cn(
                                            "h-0.5 flex-1 mx-1 rounded transition-all",
                                            idx < currentStepIndex
                                                ? "bg-green-400"
                                                : "bg-gray-200 dark:bg-gray-700"
                                        )}
                                    />
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
                    </div>

                    {/* Avatar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="dark:text-white">Avatar</Label>
                            <Button type="button" onClick={() => generateAvatarOptions(selectedAvatar)} size="sm" variant="outline">
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

            {/* ── Examples ── */}
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

            {/* ── Capabilities ── */}
            {activeTab === 'capabilities' && (
                <div className="space-y-4">
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-300">
                            <strong>Optional</strong> — Select which tools this agent can use.
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
                                                    isEnabled ? 'bg-purple-500 border-purple-500' : 'border-gray-300 dark:border-gray-600'
                                                )}>
                                                    {isEnabled && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <Zap className="h-4 w-4 text-purple-500" />
                                                        <span className="font-medium text-sm dark:text-white">{capability.name}</span>
                                                        {isGlobal && <Badge className="text-xs bg-gray-900 text-white">Global</Badge>}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{capability.description}</p>
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

            {/* ── Flow Builder ── */}
            {activeTab === 'workflows' && (
                <Card className="p-6 dark:bg-[#1e2433] dark:border-[#2d3545]">
                    <div className="flex items-center justify-between mb-4">
                        <div>

                            <Label className="text-base font-medium text-gray-700 dark:text-white flex items-center gap-2">
                                <GitBranch className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                Flow Builder
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Build visual workflows with input, decision, action, and output nodes.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => {
                                setFlowBuilderKey(k => k + 1)
                                setFlowBuilderOpen(true)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <GitBranch className="h-4 w-4 mr-2" />
                            {flowNodes.length > 0 ? 'Edit Flow' : 'Open Flow Builder'}
                        </Button>
                    </div>

                    {/* Flow preview */}
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-[#252d3f] dark:border-[#2d3545]">
                        {flowNodes.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {flowNodes.length} node{flowNodes.length !== 1 ? 's' : ''} configured
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {flowNodes.map(node => (
                                        <Badge key={node.id} variant="secondary" className="text-xs gap-1">
                                            <Code className="h-3 w-3" />
                                            {node.label || node.type}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <GitBranch className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No nodes configured yet
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Full-screen flow builder Dialog */}
                    <Dialog open={flowBuilderOpen} onOpenChange={(open) => {
                        if (open) setFlowBuilderKey(k => k + 1)
                        setFlowBuilderOpen(open)
                    }}>
                        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 overflow-hidden bg-white dark:bg-[#0f1219] border-none [&>button]:hidden">
                            <div className="flex w-full h-full overflow-hidden relative">
                                {/* Flow Canvas */}
                                <div className="absolute inset-0 z-0">
                                    <FlowCanvas
                                        key={flowBuilderKey}
                                        initialNodes={flowNodes}
                                        initialEdges={flowEdges}
                                        onNodesChange={setFlowNodes}
                                        onEdgesChange={setFlowEdges}
                                        onNodeSelect={(node) => {
                                            setSelectedFlowNode(node)
                                            setIsSidebarCollapsed(false)
                                        }}
                                        onAddNodeClick={(position, sourceNodeId) => {
                                            setNodeSelectorPosition(position)
                                            setNodeSelectorSourceNode(sourceNodeId || null)
                                            setShowNodeSelector(true)
                                            setSelectedFlowNode(null) // Close config panel when opening node selector
                                        }}
                                        toolbarActions={
                                            <div className="flex items-center gap-2 border-l pl-2 ml-2 border-gray-200 dark:border-gray-700">
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                    onClick={() => {
                                                        setFlowBuilderOpen(false)
                                                        toast({
                                                            title: 'Flow Saved',
                                                            description: 'Your changes have been applied.',
                                                            duration: 2000
                                                        })
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

                                {/* Node Config Panel */}
                                {selectedFlowNode && !isSidebarCollapsed && (
                                    <div className="absolute right-0 top-[61px] bottom-0 z-20 w-80 border-l bg-white dark:bg-[#1e2433] dark:border-[#2d3545] shadow-xl overflow-y-auto">
                                        <NodeConfigPanel
                                            node={selectedFlowNode}
                                            onUpdate={handleNodeConfigUpdate}
                                            onClose={() => { setSelectedFlowNode(null); setIsSidebarCollapsed(true) }}
                                        />
                                    </div>
                                )}

                                {/* Node Selector */}
                                {showNodeSelector && (
                                    <div className="absolute right-0 top-[61px] bottom-0 z-50 w-80 shadow-xl border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e]">
                                        <NodeSelector
                                            onNodeSelect={(nodeType) => {
                                                const newNode: FlowNodeType = {
                                                    id: `node-${Date.now()}`,
                                                    type: nodeType,
                                                    label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
                                                    config: {},
                                                    position: nodeSelectorPosition || { x: 100, y: 100 },
                                                }
                                                setFlowNodes(prev => [...prev, newNode])
                                                if (nodeSelectorSourceNode) {
                                                    const newEdge: FlowEdge = {
                                                        id: `edge-${Date.now()}`,
                                                        source: nodeSelectorSourceNode,
                                                        target: newNode.id,
                                                    }
                                                    setFlowEdges(prev => [...prev, newEdge])
                                                }
                                                setShowNodeSelector(false)
                                                setNodeSelectorPosition(null)
                                                setNodeSelectorSourceNode(null)
                                            }}
                                            onClose={() => {
                                                setShowNodeSelector(false)
                                                setNodeSelectorPosition(null)
                                                setNodeSelectorSourceNode(null)
                                            }}
                                            title={flowNodes.length === 0 ? 'Start Workflow' : 'Add Step'}
                                            className="h-full border-0 rounded-none shadow-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </Card>
            )}

            {/* ── Interface ── */}
            {activeTab === 'interface' && (
                <InterfaceConfigurator
                    agentId={agentId || ''}
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

            {/* ── Navigation ── */}
            <div className="flex justify-between mt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={isFirstStep ? () => navigate('/agents') : goPrev}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {isFirstStep ? 'Cancel' : 'Back'}
                </Button>

                {isLastStep ? (
                    <Button
                        type="button"
                        onClick={handleUpdateAgent}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isSaving ? (
                            <><Loader2 className="animate-spin h-4 w-4 mr-2" />Saving...</>
                        ) : (
                            <><Save className="h-4 w-4 mr-2" />Save Changes</>
                        )}
                    </Button>
                ) : (

                    <Button
                        type="button"
                        onClick={goNext}
                        className="bg-white text-black hover:bg-gray-100 border border-gray-300 
             dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
                    >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    )
}
