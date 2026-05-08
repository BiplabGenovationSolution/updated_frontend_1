'use client'

import React, { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Pin,
  MoreVertical,
  Eye,
  EyeOff,
  Star,
  Grip
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Avatar from 'boring-avatars'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Agent {
  id: string
  name: string
  description?: string
  emoji?: string
  agent_type: 'chat' | 'flow'
  tags?: string[]
  is_global?: boolean
  pinned?: boolean
  hidden?: boolean
}

interface AgentGridProps {
  agents: Agent[]
  gridSize: 'compact' | 'normal' | 'large'
  onAgentClick: (agent: Agent) => void
  onAgentReorder?: (agents: Agent[]) => void
  onAgentPin?: (agentId: string, pinned: boolean) => void
  onAgentHide?: (agentId: string, hidden: boolean) => void
  className?: string
}

export function AgentGrid({
  agents,
  gridSize = 'normal',
  onAgentClick,
  onAgentReorder,
  onAgentPin,
  onAgentHide,
  className
}: AgentGridProps) {
  const [draggedItem, setDraggedItem] = useState<Agent | null>(null)
  const [dragOverItem, setDragOverItem] = useState<Agent | null>(null)

  // Grid size classes
  const gridClasses = {
    compact: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2',
    normal: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
  }

  const cardSizeClasses = {
    compact: 'p-3',
    normal: 'p-4',
    large: 'p-6'
  }

  const avatarSizes = {
    compact: 32,
    normal: 48,
    large: 64
  }

  // Separate pinned and unpinned agents
  const pinnedAgents = agents.filter(a => a.pinned && !a.hidden)
  const unpinnedAgents = agents.filter(a => !a.pinned && !a.hidden)
  const visibleAgents = [...pinnedAgents, ...unpinnedAgents]

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, agent: Agent) => {
    setDraggedItem(agent)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, agent: Agent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(agent)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedItem && dragOverItem && draggedItem.id !== dragOverItem.id && onAgentReorder) {
      const newAgents = [...agents]
      const draggedIndex = newAgents.findIndex(a => a.id === draggedItem.id)
      const dragOverIndex = newAgents.findIndex(a => a.id === dragOverItem.id)

      // Remove dragged item
      const [removed] = newAgents.splice(draggedIndex, 1)
      // Insert at new position
      newAgents.splice(dragOverIndex, 0, removed)

      onAgentReorder(newAgents)
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }, [draggedItem, dragOverItem, agents, onAgentReorder])

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null)
  }, [])

  const getAgentColor = (agent: Agent) => {
    if (agent.is_global) return 'from-purple-500 to-pink-500'
    if (agent.agent_type === 'flow') return 'from-blue-500 to-cyan-500'
    return 'from-gray-400 to-gray-600'
  }

  return (
    <div className={className}>
      {/* Pinned Section */}
      {pinnedAgents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Pinned
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className={cn('grid', gridClasses[gridSize])}>
            {pinnedAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                gridSize={gridSize}
                avatarSize={avatarSizes[gridSize]}
                cardSizeClass={cardSizeClasses[gridSize]}
                isDragging={draggedItem?.id === agent.id}
                isDragOver={dragOverItem?.id === agent.id}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onClick={onAgentClick}
                onPin={onAgentPin}
                onHide={onAgentHide}
                getAgentColor={getAgentColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Agents Section */}
      {unpinnedAgents.length > 0 && (
        <div>
          {pinnedAgents.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                All Agents
              </h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}
          <div className={cn('grid', gridClasses[gridSize])}>
            {unpinnedAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                gridSize={gridSize}
                avatarSize={avatarSizes[gridSize]}
                cardSizeClass={cardSizeClasses[gridSize]}
                isDragging={draggedItem?.id === agent.id}
                isDragOver={dragOverItem?.id === agent.id}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onClick={onAgentClick}
                onPin={onAgentPin}
                onHide={onAgentHide}
                getAgentColor={getAgentColor}
              />
            ))}
          </div>
        </div>
      )}

      {visibleAgents.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents visible</h3>
          <p className="text-sm text-gray-600">
            All agents are currently hidden. Unhide agents to see them here.
          </p>
        </div>
      )}
    </div>
  )
}

interface AgentCardProps {
  agent: Agent
  gridSize: 'compact' | 'normal' | 'large'
  avatarSize: number
  cardSizeClass: string
  isDragging: boolean
  isDragOver: boolean
  onDragStart: (e: React.DragEvent, agent: Agent) => void
  onDragOver: (e: React.DragEvent, agent: Agent) => void
  onDragEnd: () => void
  onDragLeave: () => void
  onClick: (agent: Agent) => void
  onPin?: (agentId: string, pinned: boolean) => void
  onHide?: (agentId: string, hidden: boolean) => void
  getAgentColor: (agent: Agent) => string
}

function AgentCard({
  agent,
  gridSize,
  avatarSize,
  cardSizeClass,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragLeave,
  onClick,
  onPin,
  onHide,
 
}: AgentCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, agent)}
      onDragOver={(e) => onDragOver(e, agent)}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      className={cn(
        'group relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        cardSizeClass,
        isDragging && 'opacity-50 cursor-grabbing',
        isDragOver && 'ring-2 ring-blue-400 ring-offset-2'
      )}
      onClick={() => onClick(agent)}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <Grip className="h-4 w-4 text-gray-400" />
      </div>

      {/* Menu Button */}
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onPin?.(agent.id, !agent.pinned)}>
              <Pin className="h-4 w-4 mr-2" />
              {agent.pinned ? 'Unpin' : 'Pin'} Agent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHide?.(agent.id, true)}>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Agent Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <Avatar
              size={avatarSize}
              name={agent.name}
              variant="marble"
              colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#fa709a', '#fee140']}
            />
          </div>

          {/* Badges */}
          <div className="absolute -top-1 -right-1 flex gap-1">
            {agent.pinned && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                <Pin className="h-3 w-3 text-white" />
              </div>
            )}
            {agent.is_global && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Agent Name */}
        <div className="text-center w-full">
          <h4 className={cn(
            "font-semibold text-gray-900 truncate",
            gridSize === 'compact' ? 'text-xs' : gridSize === 'large' ? 'text-base' : 'text-sm'
          )}>
            {agent.name}
          </h4>

          {gridSize !== 'compact' && agent.description && (
            <p className={cn(
              "text-gray-600 line-clamp-2 mt-1",
              gridSize === 'large' ? 'text-sm' : 'text-xs'
            )}>
              {agent.description}
            </p>
          )}

          {/* Tags */}
          {gridSize === 'large' && agent.tags && agent.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap justify-center">
              {agent.tags.slice(0, 3).map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-2 py-0 h-5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Type Badge */}
          <div className="mt-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                agent.agent_type === 'flow'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              )}
            >
              {agent.agent_type === 'flow' ? 'Flow' : 'Chat'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
