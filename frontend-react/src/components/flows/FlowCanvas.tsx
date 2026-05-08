'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow'
import type { Node, Edge, Connection, EdgeChange, NodeChange, NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'
import FlowNodeComponent from './FlowNode'
import type { NodeType, FlowNode as FlowNodeType, FlowEdge } from '@/lib/flow-types'
import { generateNodeId, generateEdgeId, getNodeMetadata } from '@/lib/flow-constants'
import { Button } from '@/components/ui/button'
import { Play, Trash2, Download, Upload, Sparkles, Loader2, Plus } from 'lucide-react'
import { flowsAPI, apiClient } from '@/lib/api'
import { ExecutionPanel } from './ExecutionPanel'

// Simple ID generator to avoid external dependencies
const generateId = () => Math.random().toString(36).substring(2, 15)

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface FlowCanvasProps {
  initialNodes?: FlowNodeType[]
  initialEdges?: FlowEdge[]
  onNodesChange?: (nodes: FlowNodeType[]) => void
  onEdgesChange?: (edges: FlowEdge[]) => void
  onSave?: (nodes: FlowNodeType[], edges: FlowEdge[]) => void
  onExecute?: () => void
  onNodeSelect?: (node: FlowNodeType | null) => void
  onAddNodeClick?: (position: { x: number, y: number }, sourceNodeId?: string) => void
  readOnly?: boolean
  toolbarActions?: React.ReactNode
  agentId?: string | null
}

const nodeTypes: NodeTypes = {
  custom: FlowNodeComponent
}

function FlowCanvasInner({
  initialNodes = [],
  initialEdges = [],
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  onSave,
  onExecute,
  onNodeSelect,
  onAddNodeClick,
  readOnly = false,
  toolbarActions,
  agentId
}: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { screenToFlowPosition, fitView: reactFlowFitView, deleteElements } = useReactFlow()
  const isInternalUpdateRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // AI Generation state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generateDescription, setGenerateDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDescribing, setIsDescribing] = useState(false)

  // Execution Panel State
  const [showExecutionPanel, setShowExecutionPanel] = useState(false)
  const [isExecutionPanelExpanded, setIsExecutionPanelExpanded] = useState(false)
  const [executionLogs, setExecutionLogs] = useState<string[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleExecute = () => {
    setShowExecutionPanel(true)
    setExecutionLogs(prev => [...prev, 'Starting execution...'])

    // Simulate execution steps for now
    setTimeout(() => {
      setExecutionLogs(prev => [...prev, 'Initializing agents...'])
    }, 500)

    setTimeout(() => {
      setExecutionLogs(prev => [...prev, 'Executing first step...'])
    }, 1500)

    if (onExecute) {
      onExecute()
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    setChatMessages(prev => [...prev, userMsg])
    setIsProcessing(true)

    // Ensure panel is open
    setShowExecutionPanel(true)

    try {
      if (!agentId) {
        setChatMessages(prev => [...prev, {
          id: generateId(),
          role: 'assistant',
          content: 'Error: No agent selected. Please save the agent first.',
          timestamp: new Date().toISOString()
        }])
        setIsProcessing(false)
        return
      }

      // Prepare request
      const responseStream = await apiClient.customAgents.chat(agentId, {
        messages: [{ role: 'user', content: message }],
        stream: true
      })

      // Initialize assistant message with a unique ID
      let fullResponse = ''
      const assistantMsgId = generateId()
      setChatMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '', // Start empty
        timestamp: new Date().toISOString()
      }])

      // Add log start
      setExecutionLogs(prev => [...prev, `[CHAT] Sending message to agent ${agentId}...`])

      // Stream response
      const reader = responseStream.body?.getReader()
      if (!reader) throw new Error('Response body is null')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') continue

            try {
              const data = JSON.parse(dataStr)

              if (data.delta) {
                fullResponse += data.delta

                // Content Clean-up: Remove tool usage and thinking tags for the chat view
                // We keep the full response for logic but clean it for display
                const displayContent = fullResponse
                  .replace(/<use_tool>[\s\S]*?<\/use_tool>/g, '') // Remove tool usage
                  .replace(/<thinking>[\s\S]*?<\/thinking>/g, '') // Remove thinking blocks if any
                  .trim()

                setChatMessages(prev => prev.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: displayContent }
                    : msg
                ))
              }

              if (data.error) {
                setExecutionLogs(prev => [...prev, `[ERROR] ${data.error}`])
              }

              // Identify if we can extract logs or metadata from the stream
              if (data.usage?.flow_execution) {
                setExecutionLogs(prev => [...prev, `[FLOW] Executed flow ${data.usage.flow_id}`])
              }

            } catch (e) {
              console.error('Error parsing stream data:', e)
            }
          }
        }
      }

      setExecutionLogs(prev => [...prev, `[CHAT] Response received.`])

    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: 'Error communicating with agent. Please try again.',
        timestamp: new Date().toISOString()
      }])
      setExecutionLogs(prev => [...prev, `[ERROR] Failed to send message: ${error}`])
    } finally {
      setIsProcessing(false)
    }
  }
  // Listen for custom addNodeClick events from FlowNode components
  useEffect(() => {
    const handleAddNodeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ position: { x: number, y: number }, sourceNodeId: string }>
      const { position, sourceNodeId } = customEvent.detail
      console.log('🎯 FlowCanvas received addNodeClick event:', { position, sourceNodeId })
      if (onAddNodeClick) {
        onAddNodeClick(position, sourceNodeId)
      }
    }

    window.addEventListener('addNodeClick', handleAddNodeEvent)
    return () => {
      window.removeEventListener('addNodeClick', handleAddNodeEvent)
    }
  }, [onAddNodeClick])

  // Generate description from current workflow
  const describeCurrentWorkflow = useCallback(() => {
    if (nodes.length === 0) return ''

    // Helper to get a meaningful description from a node
    const getNodeDescription = (n: Node) => {
      const nodeType = n.data?.nodeType || ''
      const label = n.data?.label || ''
      const config = n.data?.config || {}
      const stepId = n.data?.step_id || ''

      // If there's a meaningful label, use it
      if (label && label !== 'Unnamed Node' && !label.match(/^(Node|Step)\s*\d*$/i)) {
        return label
      }

      // Helper to extract meaningful values from config
      const getConfigSummary = () => {
        const parts = []

        // Common fields to look for
        if (config.url) parts.push(`URL: ${config.url}`)
        if (config.endpoint) parts.push(`Endpoint: ${config.endpoint}`)
        if (config.method) parts.push(`${config.method}`)
        if (config.operation) parts.push(`${config.operation}`)
        if (config.query) parts.push(`Query: ${config.query}`)
        if (config.table) parts.push(`Table: ${config.table}`)
        if (config.condition) parts.push(`${config.condition}`)
        if (config.expression) parts.push(`${config.expression}`)
        if (config.to) parts.push(`to ${config.to}`)
        if (config.recipient) parts.push(`to ${config.recipient}`)
        if (config.subject) parts.push(`"${config.subject}"`)
        if (config.message) parts.push(`"${config.message}"`)
        if (config.channel) parts.push(`#${config.channel}`)
        if (config.script) parts.push(`Script`)
        if (config.function) parts.push(`Function: ${config.function}`)
        if (config.model) parts.push(`Model: ${config.model}`)
        if (config.prompt) parts.push(`Prompt`)
        if (config.file_path) parts.push(`File: ${config.file_path}`)
        if (config.format) parts.push(`Format: ${config.format}`)
        if (config.schema) parts.push(`Schema validation`)
        if (config.rules) parts.push(`${config.rules.length || 0} rules`)

        return parts.length > 0 ? parts.join(', ') : null
      }

      const configSummary = getConfigSummary()

      // Generate description based on node type
      if (nodeType.startsWith('input.')) {
        const type = nodeType.replace('input.', '')
        if (configSummary) return `${type} Input (${configSummary})`
        return `${type.replace('_', ' ')} Input`.replace(/\b\w/g, l => l.toUpperCase())
      }

      if (nodeType.startsWith('action.')) {
        const type = nodeType.replace('action.', '')
        if (configSummary) return `${type.replace('_', ' ')} (${configSummary})`
        return `${type.replace('_', ' ')}`.replace(/\b\w/g, l => l.toUpperCase())
      }

      if (nodeType.startsWith('decision.')) {
        const type = nodeType.replace('decision.', '')
        if (configSummary) return `Decision: ${configSummary}`
        return `${type.replace('_', ' ')} Decision`.replace(/\b\w/g, l => l.toUpperCase())
      }

      if (nodeType.startsWith('output.')) {
        const type = nodeType.replace('output.', '')
        if (configSummary) return `Output ${type.replace('_', ' ')} (${configSummary})`
        return `Output ${type.replace('_', ' ')}`.replace(/\b\w/g, l => l.toUpperCase())
      }

      if (nodeType.startsWith('notification.')) {
        const type = nodeType.replace('notification.', '')
        if (configSummary) return `${type} Notification (${configSummary})`
        return `${type.replace('_', ' ')} Notification`.replace(/\b\w/g, l => l.toUpperCase())
      }

      if (nodeType.startsWith('human.')) {
        const type = nodeType.replace('human.', '')
        if (configSummary) return `Human ${type.replace('_', ' ')} (${configSummary})`
        return `Human ${type.replace('_', ' ')}`.replace(/\b\w/g, l => l.toUpperCase())
      }

      if (nodeType.startsWith('audit.')) {
        const type = nodeType.replace('audit.', '')
        if (configSummary) return `Audit: ${configSummary}`
        return `${type.replace('_', ' ')} Audit`.replace(/\b\w/g, l => l.toUpperCase())
      }

      if (nodeType.startsWith('validation.')) {
        const type = nodeType.replace('validation.', '')
        if (configSummary) return `Validation: ${configSummary}`
        return `${type.replace('_', ' ')} Validation`.replace(/\b\w/g, l => l.toUpperCase())
      }

      // Fallback: use step_id or node type or config summary
      if (configSummary) return configSummary
      if (stepId) return stepId
      if (nodeType) return nodeType.split('.').pop()?.replace(/_/g, ' ') || 'Step'
      return label || 'Processing Step'
    }

    // Group nodes by category
    const inputNodes = nodes.filter(n => n.data?.nodeType?.startsWith('input.'))
    const actionNodes = nodes.filter(n => n.data?.nodeType?.startsWith('action.'))
    const decisionNodes = nodes.filter(n => n.data?.nodeType?.startsWith('decision.'))
    const outputNodes = nodes.filter(n => n.data?.nodeType?.startsWith('output.'))
    const notificationNodes = nodes.filter(n => n.data?.nodeType?.startsWith('notification.'))
    const humanNodes = nodes.filter(n => n.data?.nodeType?.startsWith('human.'))
    const auditNodes = nodes.filter(n => n.data?.nodeType?.startsWith('audit.'))
    const validationNodes = nodes.filter(n => n.data?.nodeType?.startsWith('validation.'))

    let description = `A workflow with ${nodes.length} nodes and ${edges.length} connections. `

    if (inputNodes.length > 0) {
      description += `It starts with ${inputNodes.map(getNodeDescription).join(', ')}. `
    }

    if (actionNodes.length > 0) {
      description += `It performs actions: ${actionNodes.map(getNodeDescription).join(', ')}. `
    }

    if (decisionNodes.length > 0) {
      description += `It includes decision points: ${decisionNodes.map(getNodeDescription).join(', ')}. `
    }

    if (humanNodes.length > 0) {
      description += `It requires human interaction: ${humanNodes.map(getNodeDescription).join(', ')}. `
    }

    if (validationNodes.length > 0) {
      description += `It validates data: ${validationNodes.map(getNodeDescription).join(', ')}. `
    }

    if (auditNodes.length > 0) {
      description += `It includes audit/compliance: ${auditNodes.map(getNodeDescription).join(', ')}. `
    }

    if (notificationNodes.length > 0) {
      description += `It sends notifications: ${notificationNodes.map(getNodeDescription).join(', ')}. `
    }

    if (outputNodes.length > 0) {
      description += `It outputs: ${outputNodes.map(getNodeDescription).join(', ')}.`
    }

    return description.trim()
  }, [nodes, edges])

  // Generate intelligent description using LLM
  const generateIntelligentDescription = useCallback(async () => {
    if (nodes.length === 0) return ''

    console.log('🤖 Starting LLM-based workflow description generation...')
    setIsDescribing(true)
    try {
      // Prepare workflow data for API
      const workflowData = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.data?.nodeType || 'unknown',
          label: n.data?.label || '',
          config: n.data?.config || {},
          position: n.position || { x: 0, y: 0 }
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || ''
        }))
      }

      console.log('📊 Workflow data prepared:', {
        nodeCount: workflowData.nodes.length,
        edgeCount: workflowData.edges.length
      })

      console.log('📤 Calling flowsAPI.describe...')

      // Call dedicated describe endpoint
      const response = await flowsAPI.describe(workflowData)

      if (response.success && response.data?.description) {
        console.log('✨ LLM-generated description:', response.data.description)
        return response.data.description
      } else {
        console.warn('⚠️ No description in response, using fallback')
        return describeCurrentWorkflow()
      }
    } catch (error) {
      console.error('❌ Error generating intelligent description:', error)
      console.log('⚠️ Falling back to template-based description')
      // Fallback to template-based description
      return describeCurrentWorkflow()
    } finally {
      setIsDescribing(false)
    }
  }, [nodes, edges, describeCurrentWorkflow])

  // Update description when opening dialog if workflow exists
  useEffect(() => {
    if (showGenerateDialog && nodes.length > 0 && !generateDescription) {
      console.log('🎯 Dialog opened with workflow, generating intelligent description...')
      // Use intelligent LLM-based description
      generateIntelligentDescription().then(description => {
        if (description) {
          console.log('✅ Setting description in textarea:', description.substring(0, 100) + '...')
          setGenerateDescription(description)
        } else {
          console.log('⚠️ No description returned from LLM')
        }
      }).catch(err => {
        console.error('❌ Error in useEffect calling generateIntelligentDescription:', err)
      })
    } else {
      console.log('ℹ️ Dialog state:', { showGenerateDialog, nodesLength: nodes.length, hasDescription: !!generateDescription })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGenerateDialog])

  // Debug: Check container dimensions
  useEffect(() => {
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect()
      console.log('📐 FlowCanvas container dimensions:', {
        width: rect.width,
        height: rect.height,
        clientWidth: reactFlowWrapper.current.clientWidth,
        clientHeight: reactFlowWrapper.current.clientHeight
      })
    }
  }, [nodes, edges])

  // Convert flow nodes to React Flow nodes
  useEffect(() => {
    // Skip if this is an internal update (from drag and drop)
    if (isInternalUpdateRef.current) {
      console.log('🔄 FlowCanvas useEffect: Skipping - internal update')
      isInternalUpdateRef.current = false
      return
    }

    console.log('🔄 FlowCanvas useEffect: initialNodes changed, count =', initialNodes.length, initialNodes)
    const reactFlowNodes: Node[] = initialNodes.map(node => ({
      id: node.id,
      type: 'custom',
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.label,
        config: node.config || {},
        nodeType: node.type as NodeType,
        step_id: node.step_id
      }
    }))
    console.log('🔄 FlowCanvas useEffect: setting reactFlowNodes =', reactFlowNodes)
    setNodes(reactFlowNodes)

    // Only fitView on initial load with nodes, not on every update
    if (!hasInitializedRef.current && reactFlowNodes.length > 0) {
      hasInitializedRef.current = true
      setTimeout(() => {
        reactFlowFitView({
          padding: 0.3,
          minZoom: 0.5,
          maxZoom: 1.5,
          duration: 200
        })
      }, 50)
    }
  }, [initialNodes, reactFlowFitView])

  // Convert flow edges to React Flow edges
  useEffect(() => {
    console.log('🔄 FlowCanvas useEffect: initialEdges changed, count =', initialEdges.length, initialEdges)
    const reactFlowEdges: Edge[] = initialEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      data: edge.condition,
      animated: false,
      style: { stroke: '#d1d5db', strokeWidth: 2 }
    }))
    console.log('🔄 FlowCanvas useEffect: setting reactFlowEdges =', reactFlowEdges)
    setEdges(reactFlowEdges)
  }, [initialEdges])

  const onNodesChangeInternal = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes)
      setNodes(updatedNodes)

      // Convert back to flow nodes and notify parent
      if (onNodesChangeProp) {
        // Only set internal update flag for non-structural changes (like dragging)
        // For structural changes (remove), allow parent prop update to flow through normal cycle
        const hasStructuralChanges = changes.some(c => c.type === 'remove')
        if (!hasStructuralChanges) {
          isInternalUpdateRef.current = true
        } else {
          console.log('🔄 Structural change detected (remove), allowing parent prop update')
        }

        const flowNodes: FlowNodeType[] = updatedNodes.map(node => ({
          id: node.id,
          type: node.data.nodeType,
          label: node.data.label,
          step_id: node.data.step_id,
          config: node.data.config,
          position: node.position
        }))
        onNodesChangeProp(flowNodes)
      }
    },
    [nodes, onNodesChangeProp]
  )

  const onEdgesChangeInternal = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges)
      setEdges(updatedEdges)

      // Convert back to flow edges and notify parent
      if (onEdgesChangeProp) {
        // Note: No need to set isInternalUpdateRef here since we only track node changes
        const flowEdges: FlowEdge[] = updatedEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: typeof edge.label === 'string' ? edge.label : undefined,
          condition: edge.data
        }))
        onEdgesChangeProp(flowEdges)
      }
    },
    [edges, onEdgesChangeProp]
  )

  // Helper function to get node category from nodeType
  const getNodeCategory = (nodeType: string): 'input' | 'decision' | 'action' | 'output' | null => {
    if (nodeType.startsWith('input.')) return 'input'
    if (nodeType.startsWith('decision.')) return 'decision'
    if (nodeType.startsWith('action.')) return 'action'
    if (nodeType.startsWith('output.')) return 'output'
    return null
  }

  // Validate connections based on node types
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source)
      const targetNode = nodes.find(n => n.id === connection.target)

      if (!sourceNode || !targetNode) {
        console.log('❌ Invalid connection: Source or target node not found')
        return false
      }

      const sourceCategory = getNodeCategory(sourceNode.data.nodeType)
      const targetCategory = getNodeCategory(targetNode.data.nodeType)

      // Rule 1: Two input nodes cannot be connected
      if (sourceCategory === 'input' && targetCategory === 'input') {
        console.log('❌ Invalid connection: Cannot connect two input nodes')
        return false
      }

      // Rule 2: Decision nodes cannot connect to each other
      if (sourceCategory === 'decision' && targetCategory === 'decision') {
        console.log('❌ Invalid connection: Cannot connect two decision nodes')
        return false
      }

      // Rule 3: Action and output nodes CAN connect to multiple of same type (allowed)
      // This is the default behavior, no restriction needed

      console.log('✅ Valid connection:', sourceCategory, '→', targetCategory)
      return true
    },
    [nodes]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 onConnect: params =', params)

      // Validate the connection first
      if (!isValidConnection(params)) {
        return
      }

      const newEdge: Edge = {
        ...params,
        id: generateEdgeId(params.source || '', params.target || ''),
        animated: false,
        style: { stroke: '#d1d5db', strokeWidth: 2 }
      }
      console.log('🔗 onConnect: newEdge =', newEdge)
      const updatedEdges = addEdge(newEdge, edges)
      console.log('🔗 onConnect: updatedEdges =', updatedEdges)
      setEdges(updatedEdges)

      // Notify parent with updated edges array
      if (onEdgesChangeProp) {
        const flowEdges: FlowEdge[] = updatedEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: typeof e.label === 'string' ? e.label : undefined,
          condition: e.data
        }))
        console.log('🔗 onConnect: notifying parent with flowEdges =', flowEdges)
        onEdgesChangeProp(flowEdges)
      }
    },
    [edges, onEdgesChangeProp, isValidConnection]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node)
      if (onNodeSelect) {
        const flowNode: FlowNodeType = {
          id: node.id,
          type: node.data.nodeType,
          label: node.data.label,
          step_id: node.data.step_id,
          config: node.data.config,
          position: node.position
        }
        onNodeSelect(flowNode)
      }
    },
    [onNodeSelect]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    if (onNodeSelect) {
      onNodeSelect(null)
    }
  }, [onNodeSelect])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const nodeTypeStr = event.dataTransfer.getData('application/reactflow')
      console.log('🎯 onDrop: nodeTypeStr =', nodeTypeStr)
      if (!nodeTypeStr) {
        console.log('❌ onDrop: No nodeTypeStr')
        return
      }

      const nodeType = nodeTypeStr as NodeType
      const metadata = getNodeMetadata(nodeType)
      console.log('🎯 onDrop: metadata =', metadata)
      if (!metadata) {
        console.log('❌ onDrop: No metadata for nodeType', nodeType)
        return
      }

      // Use screenToFlowPosition directly with screen coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      })
      console.log('🎯 onDrop: position =', position, 'clientX =', event.clientX, 'clientY =', event.clientY)

      const newNode: Node = {
        id: generateNodeId(),
        type: 'custom',
        position,
        data: {
          label: metadata.label,
          config: { ...metadata.defaultConfig },
          nodeType: nodeType
        }
      }
      console.log('🎯 onDrop: newNode =', newNode)

      const updatedNodes = [...nodes, newNode]
      console.log('🎯 onDrop: updatedNodes =', updatedNodes)
      setNodes(updatedNodes)

      // Notify parent with updated nodes array
      if (onNodesChangeProp) {
        isInternalUpdateRef.current = true
        const flowNodes: FlowNodeType[] = updatedNodes.map(n => ({
          id: n.id,
          type: n.data.nodeType,
          label: n.data.label,
          step_id: n.data.step_id,
          config: n.data.config,
          position: n.position
        }))
        console.log('🎯 onDrop: notifying parent with flowNodes =', flowNodes)
        onNodesChangeProp(flowNodes)
      }
    },
    [screenToFlowPosition, nodes, onNodesChangeProp]
  )

  const handleSave = useCallback(() => {
    if (onSave) {
      const flowNodes: FlowNodeType[] = nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        label: node.data.label,
        step_id: node.data.step_id,
        config: node.data.config,
        position: node.position
      }))
      const flowEdges: FlowEdge[] = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
        condition: edge.data
      }))
      onSave(flowNodes, flowEdges)
    }
  }, [nodes, edges, onSave])

  const handleDelete = useCallback(async () => {
    if (selectedNode) {
      console.log('🗑️ Deleting node:', {
        id: selectedNode.id,
        label: selectedNode.data?.label,
        type: selectedNode.data?.nodeType,
        position: selectedNode.position
      })

      // 1. Manually calculate new state to ensure Parent gets it accurately and immediately
      // This acts as a failsafe to ensure persistence even if internal events are delayed
      const updatedNodes = nodes.filter(n => n.id !== selectedNode.id)
      const updatedEdges = edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id)

      // Notify parent component of the changes immediately
      if (onNodesChangeProp) {
        const flowNodes: FlowNodeType[] = updatedNodes.map(node => ({
          id: node.id,
          type: node.data.nodeType,
          label: node.data.label,
          step_id: node.data.step_id,
          config: node.data.config,
          position: node.position
        }))
        console.log('📤 FORCE Notifying parent of node deletion, count:', flowNodes.length)
        onNodesChangeProp(flowNodes)
      }

      if (onEdgesChangeProp) {
        const flowEdges: FlowEdge[] = updatedEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: typeof edge.label === 'string' ? edge.label : undefined,
          condition: edge.data
        }))
        console.log('📤 FORCE Notifying parent of edge deletion, count:', flowEdges.length)
        onEdgesChangeProp(flowEdges)
      }

      // 2. Call ReactFlow deleteElements to handle internal state/visuals/events
      // This ensures the visual graph updates correctly via the library's standard flow
      try {
        await deleteElements({ nodes: [selectedNode], edges: [] })
        console.log('✅ deleteElements called successfully')
      } catch (error) {
        console.error('❌ Error in deleteElements, falling back to manual setNodes:', error)
        setNodes(updatedNodes)
        setEdges(updatedEdges)
      }

      setSelectedNode(null)
      if (onNodeSelect) {
        onNodeSelect(null)
      }
    } else {
      console.log('⚠️ No node selected for deletion')
    }
  }, [selectedNode, nodes, edges, onNodeSelect, deleteElements, onNodesChangeProp, onEdgesChangeProp])

  const handleExport = useCallback(() => {
    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        label: node.data.label,
        step_id: node.data.step_id,
        config: node.data.config,
        position: node.position
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        condition: edge.data
      }))
    }
    const dataStr = JSON.stringify(flowData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `flow-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const flowData = JSON.parse(e.target?.result as string)

        // Convert imported nodes to ReactFlow format
        const importedNodes: Node[] = flowData.nodes.map((node: any) => {
          const metadata = getNodeMetadata(node.type)
          return {
            id: node.id,
            type: 'custom',
            position: node.position || { x: 100, y: 100 },
            data: {
              nodeType: node.type,
              label: node.label || metadata?.label || 'Node',
              step_id: node.step_id,
              config: node.config || {},
              icon: metadata?.icon,
              color: metadata?.color
            }
          }
        })

        // Convert imported edges to ReactFlow format
        const importedEdges: Edge[] = flowData.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          data: edge.condition,
          type: 'default',
          animated: false
        }))

        setNodes(importedNodes)
        setEdges(importedEdges)

        // Reset file input for re-import
        if (event.target) {
          event.target.value = ''
        }
      } catch (error) {
        console.error('Failed to import flow:', error)
        alert('Failed to import flow. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleGenerateWithAI = useCallback(async () => {
    if (!generateDescription.trim()) {
      alert('Please enter a description for the workflow')
      return
    }

    setIsGenerating(true)
    try {
      // Get agent_id from URL or use a default
      const urlParams = new URLSearchParams(window.location.search)
      const agentId = urlParams.get('agent_id') || 'default'

      const response = await flowsAPI.generate({
        description: generateDescription,
        agent_id: agentId,
        tags: ['generated', 'ai']
      })

      if (response.success && response.data.flow) {
        const generatedFlow = response.data.flow

        // Convert generated nodes to ReactFlow format
        const importedNodes: Node[] = generatedFlow.nodes.map((node: any) => {
          const metadata = getNodeMetadata(node.type)
          return {
            id: node.id,
            type: 'custom',
            position: node.position || { x: 100, y: 100 },
            data: {
              nodeType: node.type,
              label: node.label || metadata?.label || 'Node',
              step_id: node.step_id,
              config: node.config || {},
              icon: metadata?.icon,
              color: metadata?.color
            }
          }
        })

        // Convert generated edges to ReactFlow format
        const importedEdges: Edge[] = generatedFlow.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          data: edge.condition,
          type: 'default',
          animated: false
        }))

        setNodes(importedNodes)
        setEdges(importedEdges)
        setShowGenerateDialog(false)
        setGenerateDescription('')

        alert(`Successfully generated workflow "${generatedFlow.name}" with ${importedNodes.length} nodes!`)
      } else {
        throw new Error(response.error || 'Failed to generate workflow')
      }
    } catch (error: any) {
      console.error('Failed to generate workflow:', error)
      alert(`Failed to generate workflow: ${error.message || 'Please try again'}`)
    } finally {
      setIsGenerating(false)
    }
  }, [generateDescription])

  return (
    <div className="flex flex-col h-full w-full" ref={reactFlowWrapper}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#1e2433] border-b border-gray-200 dark:border-[#3d4555]">
          <Button
            onClick={handleImport}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            onClick={handleExport}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          {onExecute && (
            <Button
              onClick={onExecute}
              size="sm"
              variant="default"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              Execute
            </Button>
          )}

          <div className="flex-1" />
          <Button
            onClick={() => setShowGenerateDialog(true)}
            size="sm"
            variant="default"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </Button>
          {/* <Button
            onClick={handleSave}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </Button> */}

          {toolbarActions}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Flow Canvas */}
      <div className="flex-1 relative min-h-0 bg-gray-50 dark:bg-[#1e2433]">
        <div className="absolute inset-0">
          {/* Top Center Controls - Execute Button */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2">
            <Button
              onClick={handleExecute}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center gap-2 px-6 py-2 rounded-full transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              Execute Flow
            </Button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeInternal}
            onEdgesChange={onEdgesChangeInternal}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 50, y: 50, zoom: 0.8 }}
            minZoom={0.3}
            maxZoom={2}
            attributionPosition="bottom-right"
            className="bg-gray-50 dark:bg-[#1e2433]"
            connectionLineStyle={{ stroke: '#6b7280', strokeWidth: 2 }}
            connectionLineType="smoothstep"
            connectionMode="loose"
            connectionRadius={50}
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#d1d5db', strokeWidth: 2 }
            }}
          >
            <Background
              color="#9ca3af"
              gap={20}
              size={1}
              variant="dots"
              style={{ backgroundColor: 'transparent' }}
            />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const metadata = getNodeMetadata(node.data.nodeType)
                return metadata?.color || '#gray'
              }}
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="dark:bg-[#2d3545] dark:border-[#3d4555]"
              style={{
                backgroundColor: 'var(--tw-prose-body)'
              }}
            />

            {/* Empty Canvas Button - Show when no nodes exist */}
            {nodes.length === 0 && onAddNodeClick && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button
                  onClick={() => {
                    console.log('🔴 Add first step button clicked!');
                    // Center of canvas
                    const position = { x: 250, y: 200 };
                    console.log('🔴 Calling onAddNodeClick with position:', position);
                    onAddNodeClick(position);
                    console.log('🔴 onAddNodeClick called');
                  }}
                  className="pointer-events-auto flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2d3545] hover:bg-gray-50 dark:hover:bg-[#353d4f] hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Add first step...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Click to start building your workflow
                    </p>
                  </div>
                </button>
              </div>
            )}
          </ReactFlow>

          {/* Empty Canvas Button - Overlay outside ReactFlow */}
          {nodes.length === 0 && onAddNodeClick && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔴 Add first step button clicked!');
                  const position = { x: 250, y: 200 };
                  console.log('🔴 Calling onAddNodeClick with position:', position);
                  if (onAddNodeClick) {
                    onAddNodeClick(position);
                    console.log('🔴 onAddNodeClick called');
                  } else {
                    console.error('❌ onAddNodeClick is undefined!');
                  }
                }}
                className="pointer-events-auto flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2d3545] hover:bg-gray-50 dark:hover:bg-[#353d4f] hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Add first step...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click to start building your workflow
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Dialog */}
      {showGenerateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#353d4f] rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Generate Workflow with AI
            </h2>
            {nodes.length > 0 ? (
              <div className="bg-blue-50 dark:bg-[#2d3545] border border-blue-200 dark:border-[#3d4555] rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>✨ AI-Powered:</strong> Your workflow has been analyzed by AI and described below. Use the "AI Describe" button to regenerate, or edit the description to refine it!
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-white mb-4">
                Describe the workflow you want to create, and AI will generate a complete flow for you.
              </p>
            )}
            <div className="relative">
              <textarea
                className="w-full h-40 p-3 border border-gray-300 dark:bg-[#2d3545] dark:border-[#3d4555] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Example: Create a workflow that reads customer support emails, analyzes sentiment, categorizes them by urgency, and sends high-priority tickets to Slack while storing all tickets in a database"
                value={generateDescription}
                onChange={(e) => setGenerateDescription(e.target.value)}
                disabled={isGenerating}
              />
              {nodes.length > 0 && (
                <Button
                  onClick={async () => {
                    const description = await generateIntelligentDescription()
                    if (description) {
                      setGenerateDescription(description)
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-xs flex items-center gap-1"
                  disabled={isGenerating || isDescribing}
                >
                  {isDescribing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      ✨ AI Describe
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowGenerateDialog(false)
                  setGenerateDescription('')
                }}
                variant="outline"
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !generateDescription.trim()}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Execution Panel */}
      <ExecutionPanel
        isOpen={showExecutionPanel}
        onClose={() => setShowExecutionPanel(false)}
        onToggleExpand={() => setIsExecutionPanelExpanded(!isExecutionPanelExpanded)}
        isExpanded={isExecutionPanelExpanded}
        logs={executionLogs}
        onClearLogs={() => setExecutionLogs([])}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
