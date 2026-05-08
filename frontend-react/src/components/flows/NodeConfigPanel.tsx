'use client'

import React, { useState, useEffect } from 'react'
import { NodeType } from '@/lib/flow-types'
import type { FlowNode } from '@/lib/flow-types'
import { getNodeMetadata } from '@/lib/flow-constants'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, capabilitiesAPI } from '@/lib/api'

interface NodeConfigPanelProps {
  node: FlowNode | null
  onUpdate?: (nodeId: string, config: Record<string, any>, label?: string) => void
  onClose?: () => void
  className?: string
}

export default function NodeConfigPanel({
  node,
  onUpdate,
  onClose,
  className
}: NodeConfigPanelProps) {
  const { user } = useAuth()
  const [label, setLabel] = useState('')
  const [config, setConfig] = useState<Record<string, any>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<any[]>([])
  const [availableCapabilities, setAvailableCapabilities] = useState<any[]>([])
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false)

  useEffect(() => {
    if (node) {
      setLabel(node.label)
      setConfig(node.config || {})
      setHasChanges(false)
    }
  }, [node])

  // Load available agents when ACTION_AGENT node is selected
  useEffect(() => {
    if (node?.type === NodeType.ACTION_AGENT && user) {
      loadAvailableAgents()
    }
  }, [node?.type, user])

  // Load available capabilities when ACTION_CAPABILITY node is selected
  useEffect(() => {
    if (node?.type === NodeType.ACTION_CAPABILITY && user) {
      loadAvailableCapabilities()
    }
  }, [node?.type, user])

  const loadAvailableAgents = async () => {
    try {
      const response = await apiClient.getCustomAgents({
        limit: 100,
        sort_by: 'name',
        sort_order: 'asc'
      })
      if (response.success && response.data) {
        setAvailableAgents(response.data.agents || [])
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const loadAvailableCapabilities = async () => {
    setCapabilitiesLoading(true)
    try {
      const response = await capabilitiesAPI.list({ limit: 100 })
      if (response.success && response.data) {
        setAvailableCapabilities(response.data.capabilities || [])
      }
    } catch (error) {
      console.error('Failed to load capabilities:', error)
    } finally {
      setCapabilitiesLoading(false)
    }
  }

  if (!node) {
    return (
      <Card className={cn('flex flex-col items-center justify-center h-full p-8 dark:bg-[#1e2433]', className)}>
        <Settings className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
          No Node Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
          Click on a node in the canvas to configure its settings
        </p>
      </Card>
    )
  }

  const metadata = getNodeMetadata(node.type as NodeType)

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel)
    setHasChanges(true)
  }

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(node.id, config, label)
      setHasChanges(false)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleReset = () => {
    if (metadata) {
      setConfig(metadata.defaultConfig)
      setHasChanges(true)
    }
  }

  const renderConfigField = (field: any) => {
    const value = config[field.key] ?? field.default

    // Special handling for agent_id field in ACTION_AGENT nodes
    if (node?.type === NodeType.ACTION_AGENT && field.key === 'agent_id') {
      return (
        <Select
          value={value || ''}
          onValueChange={(newValue) => handleConfigChange(field.key, newValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {availableAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name} {agent.agent_type && `(${agent.agent_type})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Special handling for capability_id field in ACTION_CAPABILITY nodes
    if (node?.type === NodeType.ACTION_CAPABILITY && field.key === 'capability_id') {
      if (capabilitiesLoading) {
        return (
          <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading capabilities...
          </div>
        )
      }
      return (
        <Select
          value={value || ''}
          onValueChange={(newValue) => handleConfigChange(field.key, newValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a capability" />
          </SelectTrigger>
          <SelectContent>
            {availableCapabilities.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No capabilities found</div>
            ) : (
              availableCapabilities.map((cap) => (
                <SelectItem key={cap.id} value={cap.id}>
                  {cap.name}{cap.category ? ` (${cap.category})` : ''}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )
    }

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.default}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => handleConfigChange(field.key, parseFloat(e.target.value) || 0)}
            placeholder={field.default?.toString()}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.default}
            rows={4}
            className="font-mono text-sm"
          />
        )

      case 'select':
        return (
          <Select
            value={value?.toString()}
            onValueChange={(newValue) => {
              // Convert back to appropriate type
              const option = field.options?.find((opt: any) => opt.value?.toString() === newValue)
              handleConfigChange(field.key, option?.value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value?.toString()} value={option.value?.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'json':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleConfigChange(field.key, parsed)
              } catch {
                handleConfigChange(field.key, e.target.value)
              }
            }}
            placeholder={JSON.stringify(field.default, null, 2)}
            rows={6}
            className="font-mono text-sm"
          />
        )

      default:
        return (
          <Input
            type="text"
            value={value?.toString() || ''}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
          />
        )
    }
  }

  return (
    <Card className={cn('flex flex-col h-full dark:bg-[#1e2433]', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-[#3d4555] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Node Configuration
          </h3>
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Node Info */}
          <div className="p-3 bg-gray-50 dark:bg-[#2d3545] rounded-lg border border-gray-200 dark:border-[#3d4555]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Node Type</span>
              {metadata && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: metadata.color,
                    color: metadata.color
                  }}
                >
                  {metadata.category}
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {metadata?.label || node.type}
            </p>
            {metadata?.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {metadata.description}
              </p>
            )}
          </div>

          {/* Node Label */}
          <div className="space-y-2">
            <Label htmlFor="node-label">Node Label</Label>
            <Input
              id="node-label"
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Enter node label"
            />
          </div>

          {/* Node ID */}
          <div className="space-y-2">
            <Label htmlFor="node-id">Node ID</Label>
            <Input
              id="node-id"
              type="text"
              value={node.id}
              disabled
              className="bg-gray-50 dark:bg-[#2d3545] text-gray-500 dark:text-gray-400"
            />
          </div>

          {/* Configuration Fields */}
          {metadata?.configSchema && metadata.configSchema.length > 0 && (
            <>
              <div className="pt-3 border-t border-gray-200 dark:border-[#3d4555]">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Configuration
                </h4>
              </div>

              {metadata.configSchema.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`config-${field.key}`}>
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  {renderConfigField(field)}
                  {field.type === 'json' && (
                    <p className="text-xs text-gray-500">
                      Enter valid JSON format
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-[#3d4555] bg-gray-50 dark:bg-[#2d3545] flex items-center justify-between gap-2">
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          disabled={!metadata}
        >
          Reset to Default
        </Button>
        <div className="flex items-center gap-2">
          {/* {hasChanges && (
            <span className="text-xs text-amber-600 font-medium">
              Unsaved changes
            </span>
          )} */}
          <Button
            onClick={handleSave}
            size="sm"
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  )
}
