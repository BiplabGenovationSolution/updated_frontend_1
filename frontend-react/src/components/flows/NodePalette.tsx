'use client'

import React, { useState } from 'react'
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

} from 'lucide-react'
import type { NodeType } from '@/lib/flow-types'
import { NODE_CATEGORIES } from '@/lib/flow-constants'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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

interface NodePaletteProps {
  className?: string
}

export default function NodePalette({ className }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }



  // Filter categories based on search
  const filteredCategories = NODE_CATEGORIES.map(category => ({
    ...category,
    nodes: category.nodes.filter(node =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0)

  // Get all nodes for "All" category
  const allNodes = NODE_CATEGORIES.flatMap(cat => cat.nodes).filter(node =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get current category data for popup
  const currentCategory = selectedCategory === 'all'
    ? { id: 'all', label: 'All', nodes: allNodes, color: '#6366f1', icon: 'Sparkles' }
    : filteredCategories.find(cat => cat.id === selectedCategory)

  const CategoryIcon = currentCategory && currentCategory.icon !== 'Sparkles'
    ? ICON_MAP[currentCategory.icon]
    : Sparkles

  return (
    <>
      <Card className={cn('flex flex-col h-full overflow-hidden bg-white dark:bg-[#1e2433]', className)}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#3d4555] flex-shrink-0 bg-white dark:bg-[#1e2433]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Node Palette
          </h3>
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#2d3545] dark:border-[#3d4555] dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Horizontal Category Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-[#3d4555] flex-shrink-0 bg-white dark:bg-[#1e2433]">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => handleCategoryClick('all')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d3545]'
              )}
            >
              All
            </button>
            {NODE_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap',
                  'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d3545]'
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Category/Node List */}
        <ScrollArea className="flex-1 p-3 min-h-0 bg-white dark:bg-[#1e2433]">
          {selectedCategory && currentCategory ? (
            /* Show Nodes for Selected Category */
            <div className="space-y-3">


              {/* Category Header */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#2d3545] rounded-lg border border-gray-200 dark:border-[#3d4555]">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${currentCategory.color}15`, color: currentCategory.color }}
                >
                  {CategoryIcon && <CategoryIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                    {currentCategory.label} Nodes
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentCategory.nodes.length} node{currentCategory.nodes.length !== 1 ? 's' : ''} • Drag to canvas
                  </p>
                </div>
              </div>

              {/* Node List */}
              <div className="space-y-2">
                {currentCategory.nodes.map(node => {
                  const IconComponent = ICON_MAP[node.icon]

                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#3d4555]',
                        'bg-white dark:bg-[#2d3545] hover:bg-gray-50 dark:hover:bg-[#353d4f]',
                        'cursor-grab active:cursor-grabbing transition-all duration-200',
                        'hover:shadow-sm hover:border-gray-300 dark:hover:border-[#4d5565]'
                      )}
                      style={{
                        borderLeftColor: currentCategory.color,
                        borderLeftWidth: '3px'
                      }}
                    >
                      <div
                        className="p-2 rounded-md flex-shrink-0"
                        style={{ backgroundColor: `${node.color}15`, color: node.color }}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                          {node.label}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Show instruction when no category selected */
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select a Category
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click on a category tab above to view available nodes
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-[#3d4555] bg-gray-50 dark:bg-[#2d3545] flex-shrink-0">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {selectedCategory ? 'Drag nodes to canvas' : 'Select a category from tabs above'}
          </p>
        </div>
      </Card>
    </>
  )
}
