import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

import {
  Search,
  Filter,
  Download,
  Star,
  Bot,
  Code,
  Loader2,
  Users,
  Sparkles,
  Library,
  Grid,
  List,
  Plus,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useToast } from '@/hooks/use-toast'
import type { MarketplaceAgent, MarketplaceCapability } from '@/lib/types'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function LibraryPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'agents' | 'capabilities'>('agents')
  const [agents, setAgents] = useState<MarketplaceAgent[]>([])
  const [capabilities, setCapabilities] = useState<MarketplaceCapability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [importingId, setImportingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')



  // Set initial tab from URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const tabParam = searchParams.get('tab')
      if (tabParam === 'capabilities') {
        setActiveTab('capabilities')
      }
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth/login')
      return
    }
    loadMarketplaceItems()
  }, [user, authLoading, navigate, activeTab])

  const loadMarketplaceItems = async () => {
    try {
      setIsLoading(true)

      if (activeTab === 'agents') {
        const response = await apiClient.getMarketplaceAgents({
          limit: 100,
          sort_by: sortBy === 'popular' ? 'download_count' : sortBy === 'rating' ? 'rating' : 'created_at',
          sort_order: 'desc'
        })
        if (response.success && response.data) {
          setAgents(response.data.agents || [])
        }
      } else {
        const response = await apiClient.getMarketplaceCapabilities({
          limit: 100,
          sort_by: sortBy === 'popular' ? 'download_count' : sortBy === 'rating' ? 'rating' : 'created_at',
          sort_order: 'desc'
        })
        if (response.success && response.data) {
          setCapabilities(response.data.capabilities || [])
        }
      }
    } catch (error) {
      console.error('Failed to load library items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load library items',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  const handleImportAgent = async (agentId: string) => {
    try {
      setImportingId(agentId)

      const response = await apiClient.importMarketplaceAgent(agentId, {})

      if (response.success) {
        toast({
          title: 'Success!',
          description: 'Agent imported to your workspace. You can now customize it in Custom Agents.'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import agent',
        variant: 'destructive'
      })
    } finally {
      setImportingId(null)
    }
  }

  const handleImportCapability = async (capabilityId: string, capabilityName?: string) => {
    try {
      setImportingId(capabilityId)
      const response = await apiClient.importMarketplaceCapability(capabilityId, {
        custom_name: capabilityName,
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to import capability')
      }

      toast({
        title: 'Success!',
        description: 'Capability imported to your workspace. You can now use it with your custom agents.'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import capability',
        variant: 'destructive'
      })
    } finally {
      setImportingId(null)
    }
  }

  const openDetailPage = (item: MarketplaceAgent | MarketplaceCapability) => {
    navigate(`/library/items/${item.id}`, { state: { item } })
  }

  // Filter items
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || (agent as any).category === filterCategory
    return matchesSearch && matchesCategory
  })

  const filteredCapabilities = capabilities.filter(capability => {
    const matchesSearch = capability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capability.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || capability.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const allCategories = activeTab === 'agents'
    ? Array.from(new Set(agents.map(a => (a as any).category || 'General')))
    : Array.from(new Set(capabilities.map(c => c.category)))

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#1c2128] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-400 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#EEF2F7] dark:bg-[#0a0a0b] min-h-full">
      <div className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-[#EEF2F7] dark:bg-[#0d1117] px-6 py-5 transition-colors duration-300">

          <div className="max-w-7xl mx-auto relative">
            <Breadcrumbs />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between mb-5"
            >
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Library
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                    Discover and import global templates
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'ghost' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "h-8 w-8 p-0 rounded-md transition-all",
                    viewMode === 'grid'
                      ? "bg-white dark:bg-[#2d3545] text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'ghost' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-8 w-8 p-0 rounded-md transition-all",
                    viewMode === 'list'
                      ? "bg-white dark:bg-[#2d3545] text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* System Admin Actions */}
            {user?.is_system_admin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-2 mb-5"
              >
                <Button
                  onClick={() => navigate('/library/create-global-agent')}
                  className="bg-[#146f84] hover:bg-[#105e6e] text-white transition-colors text-xs h-8 px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create Global Agent
                </Button>
                <Button
                  onClick={() => navigate('/library/create-global-capability')}
                  className="bg-[#146f84] hover:bg-[#105e6e] text-white transition-colors text-xs h-8 px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create Global Capability
                </Button>
              </motion.div>
            )}

            {/* Stats Cards - Staggered Entry */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {[
                {
                  label: "Agents",
                  count: agents.length,
                  sub: "Global Templates",
                  icon: Bot,
                  color: "purple",
                },
                {
                  label: "Capabilities",
                  count: capabilities.length,
                  sub: "Custom Functions",
                  icon: Code,
                  color: "blue",
                },
                {
                  label: "Categories",
                  count: allCategories.length,
                  sub: "Different Types",
                  icon: Filter,
                  color: "amber",
                },
                {
                  label: "Available",
                  count: activeTab === 'agents' ? filteredAgents.length : filteredCapabilities.length,
                  sub: "Ready to Import",
                  icon: Sparkles,
                  color: "emerald",
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="bg-white dark:bg-[#1c2128] 
                    border border-slate-200 dark:border-slate-800 
                    rounded-md px-4 py-4  
                    flex items-center justify-between
                    hover:border-blue-400/40 dark:hover:border-blue-500/30
                    transition-all duration-200 cursor-pointer group shadow-sm"
                >
                  <div className="flex flex-col">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stat.sub}
                    </p>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.count}
                  </h3>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto p-6">

          {/* Tabs */}
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="mb-6">
            <div className="flex items-center justify-center mb-8">
              <div className="relative p-1 bg-slate-200 dark:bg-[#1c2128] backdrop-blur-xl rounded-lg border border-slate-300/50 dark:border-slate-800 w-full max-w-sm overflow-hidden">
                <TabsList className="flex w-full h-10 bg-transparent p-0 gap-1 relative z-10">
                  <TabsTrigger
                    value="agents"
                    className={cn(
                      "flex-1 min-h-[2.25rem] flex items-center justify-center gap-2 px-4 rounded-lg transition-all duration-300 relative",
                      "data-[state=active]:bg-white dark:data-[state=active]:bg-[#2d3545]",
                      "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                      "data-[state=active]:shadow-sm",
                      "text-slate-500 dark:text-slate-400 font-medium text-xs",
                      "hover:text-slate-700 dark:hover:text-slate-300",
                      "z-20"
                    )}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>Agents</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="capabilities"
                    className={cn(
                      "flex-1 min-h-[2.25rem] flex items-center justify-center gap-2 px-4 rounded-lg transition-all duration-300 relative",
                      "data-[state=active]:bg-white dark:data-[state=active]:bg-[#2d3545]",
                      "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                      "data-[state=active]:shadow-sm",
                      "text-slate-500 dark:text-slate-400 font-medium text-xs",
                      "hover:text-slate-700 dark:hover:text-slate-300",
                      "z-20"
                    )}
                  >
                    <Code className="h-3.5 w-3.5" />
                    <span>Capabilities</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </Tabs>

          {/* Search and Filters - Sticky */}
          <div
            className="sticky top-0 z-20 -mx-6 px-6 py-4 mb-6 transition-all duration-200 bg-[#EEF2F7]/95 backdrop-blur-xl dark:bg-[#0a0a0b]/95"
            id="sticky-library-search"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative group mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white dark:bg-[#1c2128] border-gray-200 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm"
                  />
                </div>
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 bg-white dark:bg-[#1c2128] border-gray-200 dark:border-slate-800 dark:text-white shadow-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1c2128] dark:text-white dark:border-slate-800">
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40 bg-white dark:bg-[#1c2128] border-gray-200 dark:border-slate-800 dark:text-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1c2128] dark:text-white dark:border-slate-800">
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading library items...</p>
              </div>
            ) : activeTab === 'agents' ? (
              filteredAgents.length === 0 ? (
                <Card className="border shadow-sm bg-white dark:bg-[#1c2128] dark:border-slate-800">
                  <CardContent className="p-12 text-center">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No agents found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
                  </CardContent>
                </Card>
              ) : viewMode === 'list' ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131727] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold tracking-wider text-slate-500 uppercase bg-slate-50/50 dark:bg-[#1c2128]/50">
                        <th className="px-4 py-3">Agent Name</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Tags</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e2740]">
                      {filteredAgents.map((agent, index) => (
                        <tr
                          key={agent.id}
                          className={cn(
                            "transition-colors cursor-pointer group",
                            index % 2 === 0
                              ? "bg-white dark:bg-[#131727]"
                              : "bg-slate-50/50 dark:bg-[#1a2035]/50",
                            "hover:bg-slate-100 dark:hover:bg-[#21283e]"
                          )}
                          onClick={() => openDetailPage(agent)}
                        >
                          {/* Agent Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-[36px] h-[36px] rounded-[10px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0">
                                <div className="w-[10px] h-[10px] bg-[#146f84] rounded-full" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-snug truncate">
                                  {agent.name}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {agent.is_global ? 'Global' : 'Custom'} · {formatRelativeTime(agent.last_updated)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="px-4 py-3 max-w-[280px]">
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                              {agent.description}
                            </p>
                          </td>

                          {/* Tags */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {agent.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#2a3358] text-slate-500 dark:text-slate-400">
                                  {tag}
                                </span>
                              ))}
                              {agent.tags.length > 2 && (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 dark:bg-[#1a2035] px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-[#2a3358]">
                                  +{agent.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span className="text-[12px] font-semibold text-emerald-500">
                                {(agent as any).agent_type === 'flow' ? 'Flow' : 'Ready'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <button
                                className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 dark:bg-[#2a3558] dark:hover:bg-[#3a4568] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => { e.stopPropagation(); handleImportAgent(agent.id) }}
                                disabled={importingId === agent.id}
                              >
                                {importingId === agent.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                                {importingId === agent.id ? 'Importing...' : 'Import'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                  {filteredAgents.map(agent => (
                    <Card
                      key={agent.id}
                      className={cn(
                        "rounded-md border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer group flex flex-col h-full bg-white dark:bg-[#1c2128] hover:border-blue-400/40 dark:hover:border-blue-500/30 overflow-hidden min-h-[220px] px-2"
                      )}
                      onClick={() => openDetailPage(agent)}
                    >
                      <CardHeader className="flex-shrink-0 p-5 pb-1">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold truncate text-slate-900 dark:text-slate-300 group-hover:text-[#146f84] transition-colors">
                            {agent.name}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-2 mt-1 text-slate-500 dark:text-slate-400">
                            {agent.is_global ? 'Global' : 'Custom'}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 pt-3 flex flex-col flex-1">
                        <div className="flex flex-col flex-1 gap-2.5">
                          {/* Description */}
                          <div className="mb-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {agent.description}
                            </p>
                          </div>

                          {/* Tags as outlined pills */}
                          {agent.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {agent.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] rounded-sm py-0 border-slate-200 dark:border-[#2a3358] text-slate-500 dark:text-slate-400 bg-transparent lowercase">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              filteredCapabilities.length === 0 ? (
                <Card className="border shadow-sm bg-white dark:bg-[#1c2128] dark:border-slate-800">
                  <CardContent className="p-12 text-center">
                    <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No capabilities found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className={cn(
                  viewMode === 'grid'
                    ? "grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
                    : "space-y-4"
                )}>
                  {filteredCapabilities.map(capability => {
                    return (
                      <Card
                        key={capability.id}
                        className={cn(
                          "rounded-md border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer group flex flex-col h-full bg-white dark:bg-[#1c2128] hover:border-blue-400/40 dark:hover:border-blue-500/30 overflow-hidden min-h-[220px] px-2",
                          viewMode === 'list' && "flex h-auto rounded-none"
                        )}
                        onClick={() => openDetailPage(capability)}
                      >
                        <CardHeader className={cn("flex-shrink-0 p-5 pb-1", viewMode === 'list' && "flex-1 h-auto")}>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-bold truncate text-slate-900 dark:text-slate-300 group-hover:text-[#146f84] transition-colors">
                              {capability.name}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-2 mt-1 text-slate-500 dark:text-slate-400">
                              {capability.category}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className={cn("p-5 pt-3 flex flex-col flex-1", viewMode === 'list' && "p-4 flex-row items-center gap-8")}>
                          <div className="flex flex-col flex-1 gap-2.5">
                            {/* Description */}
                            <div className="mb-1">
                              <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                                {capability.description}
                              </p>
                            </div>

                            {/* Tags as outlined pills */}
                            {(capability.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {capability.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-[10px] rounded-sm py-0 border-slate-200 dark:border-[#2a3358] text-slate-500 dark:text-slate-400 bg-transparent lowercase">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div >
  )
}
