import { Bot, MessageSquare, Palette, Settings, Workflow, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SidebarSection = 'agent-info' | 'system-prompt' | 'avatar' | 'model' | 'interface' | 'flow'

interface LeftSidebarNavProps {
    activeSection: SidebarSection
    onSectionChange: (section: SidebarSection) => void
    isCollapsed?: boolean
    onToggleCollapse?: () => void
}

const navItems = [
    {
        id: 'flow' as SidebarSection,
        icon: Workflow,
        label: 'Flow Builder',
        color: 'text-purple-500'
    },
    {
        id: 'agent-info' as SidebarSection,
        icon: Bot,
        label: 'Agent Info',
        color: 'text-blue-500'
    },
    {
        id: 'system-prompt' as SidebarSection,
        icon: MessageSquare,
        label: 'System Prompt',
        color: 'text-green-500'
    },
    {
        id: 'avatar' as SidebarSection,
        icon: Palette,
        label: 'Avatar',
        color: 'text-orange-500'
    },
    {
        id: 'model' as SidebarSection,
        icon: Sparkles,
        label: 'AI Model',
        color: 'text-pink-500'
    },
    {
        id: 'interface' as SidebarSection,
        icon: Settings,
        label: 'Interface',
        color: 'text-gray-500'
    }
]

export function LeftSidebarNav({ activeSection, onSectionChange, isCollapsed, onToggleCollapse }: LeftSidebarNavProps) {
    return (
        <div className="w-14 h-full bg-gray-100 dark:bg-[#1a1f2e] border-r border-gray-200 dark:border-[#2d3545] flex flex-col items-center py-4 gap-2">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                    <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                            'hover:bg-gray-200 dark:hover:bg-[#2d3545]',
                            isActive && 'bg-white dark:bg-[#2d3545] shadow-sm border border-gray-300 dark:border-[#3d4555]'
                        )}
                        title={item.label}
                    >
                        <Icon
                            className={cn(
                                'w-5 h-5 transition-colors',
                                isActive ? item.color : 'text-gray-500 dark:text-gray-400'
                            )}
                        />
                    </button>
                )
            })}
        </div>
    )
}
