import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SidebarSection } from './LeftSidebarNav'

interface AgentConfigSidebarProps {
    section: SidebarSection
    formData: any
    onUpdate: (field: string, value: any) => void
    onClose: () => void
    isCollapsed: boolean
    onToggleCollapse: () => void
}

export function AgentConfigSidebar({
    section,
    formData,
    onUpdate,
    onClose,
    isCollapsed,
    onToggleCollapse
}: AgentConfigSidebarProps) {
    const [localValues, setLocalValues] = useState<Record<string, any>>({})

    // Debounced update
    useEffect(() => {
        const timers: Record<string, ReturnType<typeof setTimeout>> = {}

        Object.keys(localValues).forEach(key => {
            timers[key] = setTimeout(() => {
                onUpdate(key, localValues[key])
            }, 500)
        })

        return () => {
            Object.values(timers).forEach(timer => clearTimeout(timer))
        }
    }, [localValues, onUpdate])

    const handleChange = (field: string, value: any) => {
        setLocalValues(prev => ({ ...prev, [field]: value }))
    }

    const getValue = (field: string) => {
        return localValues[field] !== undefined ? localValues[field] : formData[field] || ''
    }

    if (isCollapsed) {
        return (
            <div className="w-8 h-full bg-gray-50 dark:bg-[#1e2433] border-r border-gray-200 dark:border-[#2d3545] flex items-center justify-center">
                <button
                    onClick={onToggleCollapse}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#2d3545] rounded"
                >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
            </div>
        )
    }

    return (
        <div className="w-80 h-full bg-gray-50 dark:bg-[#1e2433] border-r border-gray-200 dark:border-[#2d3545] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2d3545]">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getSectionTitle(section)}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleCollapse}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#2d3545] rounded"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#2d3545] rounded"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {section === 'agent-info' && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Agent Name
                            </Label>
                            <Input
                                id="name"
                                value={getValue('name')}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="My Custom Agent"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={getValue('description')}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Describe what your agent does..."
                                className="mt-1 min-h-[100px]"
                            />
                        </div>
                    </div>
                )}

                {section === 'system-prompt' && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="system_prompt" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                System Prompt
                            </Label>
                            <Textarea
                                id="system_prompt"
                                value={getValue('system_prompt')}
                                onChange={(e) => handleChange('system_prompt', e.target.value)}
                                placeholder="You are an AI assistant that..."
                                className="mt-1 min-h-[200px] font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Instructions for the LLM on how to extract structured data
                            </p>
                        </div>
                    </div>
                )}

                {section === 'avatar' && (
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Avatar
                            </Label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                                Select an avatar for your agent
                            </p>
                            {/* Avatar selector will go here */}
                            <div className="text-sm text-gray-500">Avatar selector coming soon...</div>
                        </div>
                    </div>
                )}

                {section === 'model' && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="model" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                AI Model
                            </Label>
                            <Select
                                value={getValue('model') || 'default'}
                                onValueChange={(value) => handleChange('model', value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Organization Default</SelectItem>
                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                    <SelectItem value="claude-3">Claude 3</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Choose which AI model powers this agent
                            </p>
                        </div>
                    </div>
                )}

                {section === 'interface' && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="initial_message" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Initial Message
                            </Label>
                            <Textarea
                                id="initial_message"
                                value={getValue('initial_message')}
                                onChange={(e) => handleChange('initial_message', e.target.value)}
                                placeholder="Hi! I'm your assistant. I can help with..."
                                className="mt-1 min-h-[100px]"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Greeting shown when chat starts
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Auto-save indicator */}
            <div className="p-3 border-t border-gray-200 dark:border-[#2d3545]">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Changes auto-save
                </p>
            </div>
        </div>
    )
}

function getSectionTitle(section: SidebarSection): string {
    const titles: Record<SidebarSection, string> = {
        'agent-info': 'Agent Information',
        'system-prompt': 'System Prompt',
        'avatar': 'Avatar',
        'model': 'AI Model',
        'interface': 'Interface Settings',
        'flow': 'Flow Builder'
    }
    return titles[section]
}
