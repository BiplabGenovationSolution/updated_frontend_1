'use client'

import React, { memo } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import type { NodeProps } from 'reactflow'
import {
  FileText,
  Search,
  FileUp,
  Globe,
  GitBranch,
  Sparkles,
  Filter,
  Zap,
  Wrench,
  RefreshCw,
  Repeat,
  Clock,
  FileOutput,
  Code,
  Send,
  Trash2,
  Plus
} from 'lucide-react'
import type { NodeType } from '@/lib/flow-types'
import { getNodeMetadata } from '@/lib/flow-constants'
import { cn } from '@/lib/utils'


const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Search,
  FileUp,
  Globe,
  GitBranch,
  Sparkles,
  Filter,
  Zap,
  Wrench,
  RefreshCw,
  Repeat,
  Clock,
  FileOutput,
  Code,
  Send
}

interface FlowNodeData {
  label: string
  config: Record<string, any>
  nodeType: NodeType
  step_id?: number
  isSelected?: boolean
}

function FlowNode({ data, selected, id }: NodeProps<FlowNodeData>) {
  const metadata = getNodeMetadata(data.nodeType)
  const IconComponent = metadata ? ICON_MAP[metadata.icon] : FileText
  const color = metadata?.color || '#gray'
  const { getNodes, deleteElements } = useReactFlow()

  const hasInputs = !data.nodeType.startsWith('input.')
  const hasOutputs = !data.nodeType.startsWith('output.')

  // Helper to calculate position for new node based on direction
  const getNewNodePosition = (direction: 'top' | 'right' | 'bottom' | 'left') => {
    const currentNode = getNodes().find(n => n.id === id)
    if (!currentNode) return { x: 0, y: 0 }

    switch (direction) {
      case 'top':
        return { x: currentNode.position.x, y: currentNode.position.y - 150 }
      case 'right':
        return { x: currentNode.position.x + 250, y: currentNode.position.y }
      case 'bottom':
        return { x: currentNode.position.x, y: currentNode.position.y + 150 }
      case 'left':
        return { x: currentNode.position.x - 250, y: currentNode.position.y }
    }
  }

  return (
    <div
      className={cn(
        'relative px-5 py-4 rounded-2xl border bg-white min-w-[160px] transition-all duration-200 group',
        selected ? 'shadow-xl ring-2 ring-blue-400' : 'shadow-md hover:shadow-xl'
      )}
      style={{
        boxShadow: selected
          ? '0 8px 24px rgba(59, 130, 246, 0.15), 0 0 0 2px rgba(59, 130, 246, 0.2)'
          : '0 4px 12px rgba(0, 0, 0, 0.08)',
        borderColor: selected ? '#3b82f6' : '#f0f0f0',
        borderWidth: '2px'
      }}
    >
      {/* Input Handles - Top and Bottom */}
      {/* Input Handles - All Sides */}
      {hasInputs && (
        <>
          {/* Top Input (Primary) */}
          <Handle
            type="target"
            position={Position.Top}
            id="input"
            isConnectable={true}
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#6366f1',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
              top: -6,
              left: '30%',
              zIndex: 10
            }}
          />
          {/* Bottom Input */}
          <Handle
            type="target"
            position={Position.Bottom}
            id="input-bottom"
            isConnectable={true}
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#6366f1',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
              bottom: -6,
              left: '30%',
              zIndex: 10
            }}
          />
          {/* Left Input */}
          <Handle
            type="target"
            position={Position.Left}
            id="input-left"
            isConnectable={true}
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#6366f1',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
              left: -6,
              top: '30%',
              zIndex: 10
            }}
          />
          {/* Right Input */}
          <Handle
            type="target"
            position={Position.Right}
            id="input-right"
            isConnectable={true}
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#6366f1',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
              right: -6,
              top: '30%',
              zIndex: 10
            }}
          />
        </>
      )}


      {/* Node Content - Horizontal Layout */}
      <div className="flex flex-row items-center gap-3 nopan">
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`
          }}
        >
          {IconComponent && (
            <IconComponent
              className="w-6 h-6"
              style={{ color }}
            />
          )}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {data.label}
          </div>
          {metadata && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {metadata.label}
            </div>
          )}
        </div>
      </div>

      {/* Output Handles - All sides */}
      {/* Output Handles - All Sides */}
      {hasOutputs && (
        <>
          {/* Bottom Output (Primary) */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            isConnectable={true}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#10b981',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              bottom: -6,
              left: '70%',
              zIndex: 10
            }}
          />
          {/* Top Output */}
          <Handle
            type="source"
            position={Position.Top}
            id="output-top"
            isConnectable={true}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#10b981',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              top: -6,
              left: '70%',
              zIndex: 10
            }}
          />
          {/* Left Output */}
          <Handle
            type="source"
            position={Position.Left}
            id="output-left"
            isConnectable={true}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#10b981',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              left: -6,
              top: '70%',
              zIndex: 10
            }}
          />
          {/* Right Output */}
          <Handle
            type="source"
            position={Position.Right}
            id="output-right"
            isConnectable={true}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all !cursor-crosshair opacity-0 group-hover:opacity-100"
            style={{
              background: '#10b981',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              right: -6,
              top: '70%',
              zIndex: 10
            }}
          />
        </>
      )}

      {/* Delete Button - Top Right (Visible on Hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteElements({ nodes: [{ id }] })
        }}
        className="absolute -top-3 -right-3 w-6 h-6 rounded-full text-red-700 border  bg-red-100 hover:bg-red-200 border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md z-30"
        title="Delete Node"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Plus Buttons for Adding Nodes - Show on appropriate sides */}
      <>
        {/* Top Plus Button - show when node has inputs (to add a node that feeds into this one) */}
        {hasInputs && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const position = getNewNodePosition('top')
                // Trigger the onAddNodeClick callback from FlowCanvas
                const event = new CustomEvent('addNodeClick', {
                  detail: { position, sourceNodeId: id }
                })
                window.dispatchEvent(event)
              }}
              className="w-6 h-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center border-2 border-white z-20"
              title="Add and connect a new node above"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Bottom, Left, Right Plus Buttons - show when node has outputs */}
        {hasOutputs && (
          <>
            {/* Bottom Plus Button */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const position = getNewNodePosition('bottom')
                  const event = new CustomEvent('addNodeClick', {
                    detail: { position, sourceNodeId: id }
                  })
                  window.dispatchEvent(event)
                }}
                className="w-6 h-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center border-2 border-white z-20"
                title="Add and connect a new node below"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Left Plus Button */}
            <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const position = getNewNodePosition('left')
                  const event = new CustomEvent('addNodeClick', {
                    detail: { position, sourceNodeId: id }
                  })
                  window.dispatchEvent(event)
                }}
                className="w-6 h-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center border-2 border-white z-20"
                title="Add and connect a new node to the left"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Right Plus Button */}
            <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const position = getNewNodePosition('right')
                  const event = new CustomEvent('addNodeClick', {
                    detail: { position, sourceNodeId: id }
                  })
                  window.dispatchEvent(event)
                }}
                className="w-6 h-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center border-2 border-white z-20"
                title="Add and connect a new node to the right"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </>


    </div >
  )
}

export default memo(FlowNode)
