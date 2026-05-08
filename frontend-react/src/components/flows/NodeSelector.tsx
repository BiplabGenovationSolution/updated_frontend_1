'use client'

import React, { useState, useMemo } from 'react'
import {
    X,
    Search,
    Sparkles,
    FileText,
    GitBranch,
    Zap,
    FileOutput,
    Database,
    FolderOpen,
    SearchCode,
    FlaskConical,
    Wrench,
    AlertTriangle,
    UserCheck,
    FileSignature,
    Bell,
    CheckCircle,
    Shuffle,
    HardDrive,
    Calendar,
    Bot
} from 'lucide-react'
import type { NodeType } from '@/lib/flow-types'
import { NODE_CATEGORIES } from '@/lib/flow-constants'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    FileText,
    Search,
    GitBranch,
    Sparkles,
    Zap,
    FileOutput,
    Database,
    FolderOpen,
    SearchCode,
    FlaskConical,
    Wrench,
    AlertTriangle,
    UserCheck,
    FileSignature,
    Bell,
    CheckCircle,
    Shuffle,
    HardDrive,
    Calendar,
    Bot
}

interface NodeSelectorProps {
    onNodeSelect: (nodeType: NodeType) => void
    onClose: () => void
    title?: string
    className?: string
}

export default function NodeSelector({
    onNodeSelect,
    onClose,
    title = "What happens next?",
    className
}: NodeSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Filter categories and nodes based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) {
            return NODE_CATEGORIES
        }

        return NODE_CATEGORIES.map(category => ({
            ...category,
            nodes: category.nodes.filter(node =>
                node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(category => category.nodes.length > 0)
    }, [searchQuery])

    // Get all nodes for search results
    const allFilteredNodes = useMemo(() => {
        if (!searchQuery.trim()) return []
        return filteredCategories.flatMap(cat => cat.nodes)
    }, [searchQuery, filteredCategories])

    const handleNodeClick = (nodeType: NodeType) => {
        onNodeSelect(nodeType)
    }

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId)
    }

    // Get current category for detail view
    const currentCategory = selectedCategory
        ? filteredCategories.find(cat => cat.id === selectedCategory)
        : null

    const CategoryIcon = currentCategory?.icon
        ? ICON_MAP[currentCategory.icon]
        : Sparkles

    return (
        <Card className={cn('flex flex-col h-full overflow-hidden bg-white dark:bg-[#1e2433] border-l-2', className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#3d4555] flex-shrink-0 bg-white dark:bg-[#1e2433]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#2d3545]"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <Input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setSelectedCategory(null) // Reset category when searching
                    }}
                    className="w-full bg-white dark:bg-[#2d3545] dark:border-[#3d4555] dark:text-white dark:placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    A trigger is a set-up that starts your workflow
                </p>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4 min-h-0 bg-white dark:bg-[#1e2433]">
                {searchQuery.trim() ? (
                    /* Search Results */
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            {allFilteredNodes.length} result{allFilteredNodes.length !== 1 ? 's' : ''}
                        </p>
                        {allFilteredNodes.map(node => {
                            const IconComponent = ICON_MAP[node.icon]
                            return (
                                <button
                                    key={node.type}
                                    onClick={() => handleNodeClick(node.type)}
                                    className={cn(
                                        'w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#3d4555]',
                                        'bg-white dark:bg-[#2d3545] hover:bg-gray-50 dark:hover:bg-[#353d4f]',
                                        'transition-all duration-200 text-left',
                                        'hover:shadow-sm hover:border-gray-300 dark:hover:border-[#4d5565]'
                                    )}
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
                                </button>
                            )
                        })}
                    </div>
                ) : selectedCategory && currentCategory ? (
                    /* Category Detail View */
                    <div className="space-y-3">
                        {/* Back Button */}
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
                        >
                            ← Back to categories
                        </button>

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
                                    {currentCategory.label}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {currentCategory.nodes.length} node{currentCategory.nodes.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Node List */}
                        <div className="space-y-2">
                            {currentCategory.nodes.map(node => {
                                const IconComponent = ICON_MAP[node.icon]
                                return (
                                    <button
                                        key={node.type}
                                        onClick={() => handleNodeClick(node.type)}
                                        className={cn(
                                            'w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#3d4555]',
                                            'bg-white dark:bg-[#2d3545] hover:bg-gray-50 dark:hover:bg-[#353d4f]',
                                            'transition-all duration-200 text-left',
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
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ) : (() => {
                    console.log('NODE_CATEGORIES:', filteredCategories)
                    return (
                        /* Category List View */
                        <div className="space-y-2">
                            {filteredCategories.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No categories available
                                    </p>
                                </div>
                            ) : (
                                filteredCategories.map(category => {
                                    const IconComponent = ICON_MAP[category.icon] || Sparkles
                                    console.log('Rendering category:', category.label, 'nodes:', category.nodes?.length)
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategoryClick(category.id)}
                                            className={cn(
                                                'w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#3d4555]',
                                                'bg-white dark:bg-[#2d3545] hover:bg-gray-50 dark:hover:bg-[#353d4f]',
                                                'transition-all duration-200 text-left',
                                                'hover:shadow-sm hover:border-gray-300 dark:hover:border-[#4d5565]'
                                            )}
                                        >
                                            <div
                                                className="p-2 rounded-lg flex-shrink-0"
                                                style={{ backgroundColor: `${category.color}15`, color: category.color }}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                                    {category.label}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {category.nodes.length} node{category.nodes.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="text-gray-400 dark:text-gray-500">
                                                →
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    )
                })()}
            </ScrollArea>
        </Card>
    )
}
