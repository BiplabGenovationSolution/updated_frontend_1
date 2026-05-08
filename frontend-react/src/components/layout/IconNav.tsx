'use client'

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bot, Database, Plug, Zap, User, LogOut, Code, PanelLeft, Wrench, Library } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
    { name: 'Agents', path: '/agents', icon: Bot },
    { name: 'Data Hub', path: '/hub', icon: Database },
    { name: 'Connectors', path: '/connectors', icon: Plug },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Automations', path: '/automations', icon: Zap },
    { name: 'Capabilities', path: '/capabilities', icon: Wrench },
    { name: 'Clavis', path: '/clavis/pods', icon: Code },
    // { name: 'Governance', path: '/settings', icon: Shield },
]

export function IconNav({ onSidebarClick }: { onSidebarClick?: () => void } = {}) {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

    const getInitials = () => {
        const name = user?.display_name?.trim()
        if (name) {
            const parts = name.split(/\s+/)
            if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            return parts[0][0].toUpperCase()
        }
        return (user?.email?.[0] || 'U').toUpperCase()
    }

    const isItemActive = (item: typeof navItems[number]) => {
        if (item.name === 'Chat') return location.pathname.startsWith('/chat')
        if (item.name === 'Agents') return location.pathname.startsWith('/agents')
        return location.pathname.startsWith(item.path)
    }

    const handleConfirmLogout = () => {
        setLogoutDialogOpen(false)
        logout()
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex flex-col items-center w-[54px] h-full bg-white dark:bg-[#0d1117] border-r border-slate-100 dark:border-white/[0.06] py-3 flex-shrink-0 select-none">

                {/* Nav Icons */}
                <div className="flex flex-col items-center flex-1 w-full mt-2">
                    {navItems.map((item) => {
                        const active = isItemActive(item)
                        const Icon = item.icon

                        return (
                            <Tooltip key={item.name}>
                                <TooltipTrigger asChild>
                                    <Link
                                        to={item.path}
                                        className={cn(
                                            'group relative flex items-center justify-center w-full h-11 transition-all duration-200',
                                            active
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-indigo-600 dark:before:bg-indigo-500'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22] hover:text-slate-700 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center w-[28px] h-[28px] rounded-[6px] transition-all duration-200",
                                            active
                                                ? " dark:bg-[#161b22] dark:border-indigo-500/30 shadow-sm"
                                                : "bg-transparent border border-transparent"
                                        )}>
                                            <Icon className={cn(
                                                'h-[18px] w-[18px] transition-transform duration-200',
                                                active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                                            )} />
                                        </div>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    sideOffset={10}
                                    className="text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white border-0 shadow-xl px-2.5 py-1.5 rounded-lg"
                                >
                                    {item.name}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>

                {/* Divider */}
                <div className="w-6 h-px bg-slate-200 dark:bg-white/[0.06] my-3" />

                {/* Bottom: Sidebar toggle and User avatar dropdown */}
                <div className="flex flex-col items-center w-full pb-2 gap-2">
                    {onSidebarClick && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onSidebarClick}
                                    className="group relative flex items-center justify-center w-full h-11 transition-all duration-200 outline-none text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22] hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                    <div className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] transition-all duration-200 bg-transparent border border-transparent group-hover:bg-slate-100 dark:group-hover:bg-[#21262d]">
                                        <PanelLeft className="h-[18px] w-[18px] transition-transform duration-200 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                                    </div>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10} className="text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white border-0 shadow-xl px-2.5 py-1.5 rounded-lg">
                                Sidebar
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    'group relative flex items-center justify-center w-full h-11 transition-all duration-200 outline-none',
                                    location.pathname.startsWith('/settings/profile')
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-indigo-600 dark:before:bg-indigo-500'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22] hover:text-slate-700 dark:hover:text-slate-200'
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-[28px] h-[28px] rounded-[6px] transition-all duration-200",
                                    location.pathname.startsWith('/settings/profile')
                                        ? "bg-white dark:bg-[#161b22] border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                                        : "bg-transparent border border-transparent"
                                )}>
                                    <span className={cn(
                                        'text-[10px] font-bold uppercase transition-transform duration-200',
                                        'group-hover:scale-110',
                                        location.pathname.startsWith('/settings/profile') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                                    )}>
                                        {getInitials()}
                                    </span>
                                </div>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            side="right"
                            sideOffset={8}
                            align="center"
                            // avoidCollisions={false}
                            className="w-44 shadow-xl rounded-xl border border-slate-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-1"
                        >
                            {/* User info header */}
                            <div className="px-2 py-1.5 mb-1">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {user?.display_name || 'Account'}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                    {user?.email || ''}
                                </p>
                            </div>

                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-[#30363d]" />

                            <DropdownMenuItem
                                onClick={() => navigate('/settings/profile', { state: { from: location.pathname } })}
                                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.06] focus:bg-slate-50 dark:focus:bg-white/[0.06]"
                            >
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                Profile
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-[#30363d]" />

                            <DropdownMenuItem
                                onClick={() => setLogoutDialogOpen(true)}
                                className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent className="max-w-sm rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will be signed out of your account on this device. Any unsaved changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmLogout}
                            className="rounded-lg bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sign Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    )
}
