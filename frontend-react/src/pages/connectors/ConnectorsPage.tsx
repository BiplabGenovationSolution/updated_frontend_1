/**
 * Connector Marketplace & Builder
 * - Browse 600+ PyAirbyte connectors
 * - Build custom connectors (no-code)
 * - Manage credentials
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/api'
import { cn } from '@/lib/utils'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Database, Plug, Code, Trash2, CheckCircle, Sparkles, Circle, ArrowRight, LayoutGrid, List as ListIcon } from 'lucide-react'
import { motion, AnimatePresence } from "motion/react"
import { useToast } from '@/hooks/use-toast'
import ConnectorBuilderWizard from '@/components/connectors/ConnectorBuilderWizard'
import { getConnectorBranding, CATEGORY_COLORS } from '@/lib/connector-branding'
import { getConnectorLogo } from '@/lib/connector-logos'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

interface Connector {
  name: string
  display_name: string
  category: string
  description: string
}

interface CustomConnector {
  connector_id: string
  connector_type?: string  // 'pyairbyte' or 'custom'
  name: string
  display_name?: string
  instance_name?: string  // User-friendly instance name (e.g., "Gmail-1", "Work Gmail")
  category?: string
  description?: string
  base_url: string
  auth_type: string
  endpoints: any[]
  is_active: boolean
  is_configured?: boolean  // For PyAirbyte connectors
  created_at: string
  usage_count: number
  docker_image?: string
  docker_image_tag?: string
  icon?: string
  release_stage?: string
}

interface Credential {
  credential_id: string
  connector_name: string
  display_name: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  usage_count: number
}

export default function ConnectorsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // State
  const [activeTab, setActiveTab] = useState('marketplace')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [customConnectors, setCustomConnectors] = useState<CustomConnector[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])

  // Lazy loading states for each tab
  const [marketplaceLoading, setMarketplaceLoading] = useState(false)
  const [customLoading, setCustomLoading] = useState(false)
  const [credentialsLoading, setCredentialsLoading] = useState(false)

  // Track which tabs have been loaded
  const [marketplaceLoaded, setMarketplaceLoaded] = useState(false)
  const [customLoaded, setCustomLoaded] = useState(false)
  const [credentialsLoaded, setCredentialsLoaded] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 48

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, activeTab])

  // Dialogs
  const [showBuilderDialog, setShowBuilderDialog] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [connectorToImport, setConnectorToImport] = useState<Connector | null>(null)
  const [instanceName, setInstanceName] = useState('')
  const [selectedConnectorForRename, setSelectedConnectorForRename] = useState<CustomConnector | null>(null)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [connectorToDelete, setConnectorToDelete] = useState<string | null>(null)
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null)

  // Lazy load data based on active tab
  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === 'marketplace' && !marketplaceLoaded) {
        setMarketplaceLoading(true)
        try {
          await loadConnectors()
          setMarketplaceLoaded(true)
        } finally {
          setMarketplaceLoading(false)
        }
      } else if (activeTab === 'custom' && !customLoaded) {
        setCustomLoading(true)
        try {
          await loadCustomConnectors()
          setCustomLoaded(true)
        } finally {
          setCustomLoading(false)
        }
      } else if (activeTab === 'credentials' && !credentialsLoaded) {
        setCredentialsLoading(true)
        try {
          await loadCredentials()
          setCredentialsLoaded(true)
        } finally {
          setCredentialsLoading(false)
        }
      }
    }
    loadTabData()
  }, [activeTab, marketplaceLoaded, customLoaded, credentialsLoaded])

  const loadConnectors = async () => {
    try {
      const response = await apiClient.connectors.listAirbyte()
      if (response.success && response.data) {
        // Backend response is wrapped: { success, data: { success, data: { connectors } } }
        const connectors = response.data.data?.connectors || response.data.connectors || []
        setConnectors(connectors)
      }
    } catch (error) {
      console.error('Error loading connectors:', error)
    }
  }

  const loadCustomConnectors = async () => {
    try {
      const response = await apiClient.connectors.listCustom()
      if (response.success && response.data) {
        // Backend response is wrapped: { success, data: { success, data: { connectors } } }
        const connectors = response.data.data?.connectors || response.data.connectors || []
        setCustomConnectors(connectors)
      }
    } catch (error) {
      console.error('Error loading custom connectors:', error)
    }
  }

  const loadCredentials = async () => {
    try {
      const response = await apiClient.connectors.listCredentials()
      if (response.success && response.data) {
        setCredentials(response.data.credentials || [])
      }
    } catch (error) {
      console.error('Error loading credentials:', error)
    }
  }

  const deleteCustomConnector = (connectorId: string) => {
    setConnectorToDelete(connectorId)
    setShowDeleteDialog(true)
  }

  const deleteCredential = (credentialId: string) => {
    setCredentialToDelete(credentialId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      if (connectorToDelete) {
        const response = await apiClient.connectors.deleteCustom(connectorToDelete)
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Connector deleted successfully',
            duration: 2000,
          })
          loadCustomConnectors()
        }
      } else if (credentialToDelete) {
        const response = await apiClient.connectors.deleteCredentials(credentialToDelete)
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Credentials deleted successfully',
            duration: 2000,
          })
          loadCredentials()
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: connectorToDelete ? 'Failed to delete connector' : 'Failed to delete credentials',
        variant: 'destructive',
        duration: 2000,
      })
    } finally {
      setShowDeleteDialog(false)
      setConnectorToDelete(null)
      setCredentialToDelete(null)
    }
  }

  const handleImportConnector = async (customName?: string) => {
    if (!connectorToImport) return

    try {
      const response = await apiClient.connectors.importAirbyte({
        ...connectorToImport,
        instance_name: customName || undefined
      })

      if (response.success) {
        const instanceName = response.data?.data?.instance_name || response.data?.instance_name
        toast({
          title: 'Added Successfully',
          description: `${instanceName} added to My Connectors`,
          duration: 2000
        })
        loadCustomConnectors()
        setActiveTab('custom')
        setShowNameDialog(false)
        setInstanceName('')
        setConnectorToImport(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add connector',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleRenameConnector = async () => {
    if (!selectedConnectorForRename || !instanceName.trim()) return

    try {
      const response = await apiClient.connectors.renameAirbyte(
        selectedConnectorForRename.connector_id,
        instanceName.trim()
      )

      if (response.success) {
        toast({
          title: 'Renamed',
          description: `Renamed to '${instanceName.trim()}'`,
          duration: 2000
        })
        loadCustomConnectors()
        setShowRenameDialog(false)
        setInstanceName('')
        setSelectedConnectorForRename(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename connector',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  // Filter connectors
  const categories = ['all', ...Array.from(new Set(connectors.map(c => c.category)))]
  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connector.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || connector.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredCustomConnectors = customConnectors.filter(connector => {
    const nameToMatch = connector.connector_type === 'pyairbyte' ? connector.instance_name || connector.name : connector.name
    const matchesSearch = nameToMatch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (connector.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || connector.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Define counts for stats
  const marketplaceCount = connectors.length
  const customCount = customConnectors.length
  const credentialsCount = credentials.length

  const openConnectorDetailPage = (connector: CustomConnector) => {
    navigate(`/connectors/${connector.connector_id}`, {
      state: {
        connector,
      },
    })
  }

  const totalMarketplacePages = Math.ceil(filteredConnectors.length / ITEMS_PER_PAGE)
  const paginatedMarketplace = filteredConnectors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalCustomPages = Math.ceil(filteredCustomConnectors.length / ITEMS_PER_PAGE)
  const paginatedCustom = filteredCustomConnectors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const filteredCredentials = credentials.filter(cred => {
    if (searchQuery) {
      if (!cred.connector_type.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  })
  const totalCredentialsPages = Math.ceil(filteredCredentials.length / ITEMS_PER_PAGE)
  const paginatedCredentials = filteredCredentials.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="flex flex-col bg-[#EEF2F7] dark:bg-[#0d1117] min-h-full">      <div className="flex-1">
      {/* Hero Section */}
      <div className="bg-[#EEF2F7] dark:bg-[#0d1117] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-8 pt-6 pb-0">
          <Breadcrumbs />

          {/* Title Row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Connectors
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Connect to 600+ apps or build custom connectors with no code
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                onClick={() => setShowBuilderDialog(true)}
                className="bg-[#105e6e] hover:bg-[#0d4d59] text-white font-semibold px-5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Build Connector
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Cards — solid colors, no gradients */}
          <motion.div
            id="connectors-stats-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pb-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
          >
            {[
              {
                label: "Marketplace Connectors",
                count: marketplaceCount,
                sub: "PyAirbyte Integration",
                icon: Plug,
                iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
                iconColor: "text-emerald-700 dark:text-emerald-400",
                accent: "border-l-emerald-500",
              },
              {
                label: "Custom Connectors",
                count: customCount,
                sub: "Built by you",
                icon: Code,
                iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
                iconColor: "text-cyan-700 dark:text-cyan-400",
                accent: "border-l-cyan-500",
              },
              {
                label: "Saved Credentials",
                count: credentialsCount,
                sub: "Configured & Ready",
                icon: Sparkles,
                iconBg: "bg-amber-100 dark:bg-amber-900/40",
                iconColor: "text-amber-700 dark:text-amber-400",
                accent: "border-l-amber-500",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group flex items-center justify-between p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2128] hover:border-blue-400/40 dark:hover:border-blue-500/30 transition-all duration-200 cursor-pointer shadow-sm"
              >
                {/* Text Section */}
                <div className="flex flex-col">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {stat.sub}
                  </p>
                </div>

                {/* Value Section */}
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {stat.count}
                </h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Apple Grade Glass Tab Switcher */}
          <div className="relative mb-8 mx-auto p-1 bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-200/50 dark:border-slate-800/50 w-fit max-w-[400px] overflow-hidden">
            <TabsList className="flex w-full h-8 bg-transparent p-0 gap-1 relative z-10">
              {[
                { id: "marketplace", label: "Marketplace", icon: Plug },
                { id: "custom", label: "My Connectors", icon: Code },
                { id: "credentials", label: "Credentials", icon: Sparkles },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                      min-h-full inline-flex flex-1 items-center justify-center gap-1.5 px-3 rounded-md transition-all duration-300 relative
                      data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800
                      data-[state=active]:text-slate-900 dark:data-[state=active]:text-white
                      data-[state=active]:shadow-sm
                      text-slate-500 dark:text-slate-400 font-medium text-[11px]
                      hover:text-slate-700 dark:hover:text-slate-300
                      z-20
                    `}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >

              {/* Search & Filter & View Toggle - Sticky below cards */}
              {(activeTab === 'marketplace' || activeTab === 'custom') && (
                <div className="sticky top-0 z-20 bg-[#EEF2F7]/95 dark:bg-[#0d1117]/95 backdrop-blur py-4 mb-4 border-b border-transparent">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search connectors..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-white dark:bg-[#1c2128] dark:border-slate-800 shadow-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white dark:bg-[#1e2433] border dark:border-[#2d3545] rounded-md overflow-hidden shadow-sm">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 transition-colors border-l dark:border-[#2d3545] ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            <ListIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Category Pills Row */}
                    <div className="flex items-center flex-wrap gap-2 pb-1">
                      {categories.slice(0, showAllCategories ? categories.length : 6).map(category => {
                        const value = category || 'unassigned';
                        const label = category === 'all' ? 'All Categories' : (category || 'Other');
                        const isActive = selectedCategory === value || (!selectedCategory && value === 'all');

                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedCategory(value === 'all' ? 'all' : value)}
                            className={`flex-none px-4 py-1.5 text-[11px] font-medium rounded-full transition-all duration-200 border ${isActive
                              ? 'bg-[#146f84] text-white border-[#146f84]'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-[#146f84]/40 dark:bg-[#1c2128] dark:border-slate-700 dark:text-slate-400 dark:hover:border-[#146f84]/40'
                              }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                      {!showAllCategories && categories.length > 6 && (
                        <button
                          onClick={() => setShowAllCategories(true)}
                          className="flex-none px-4 py-1.5 text-[11px] font-bold rounded-full transition-all duration-200 border bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-[#1c2128] dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          See All
                        </button>
                      )}
                      {showAllCategories && categories.length > 6 && (
                        <button
                          onClick={() => setShowAllCategories(false)}
                          className="flex-none px-4 py-1.5 text-[11px] font-medium rounded-full transition-all duration-200 border bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-[#1c2128] dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Marketplace Tab Content */}
              <TabsContent value="marketplace" className="space-y-4 data-[state=inactive]:hidden mt-0">
                {marketplaceLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#146f84] dark:border-slate-700 dark:border-t-[#146f84]"></div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Loading marketplace connectors...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Connector Grid or List */}
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
                        {paginatedMarketplace.map((connector) => {
                          const branding = getConnectorBranding(connector.name)
                          const Icon = branding.icon
                          const categoryColor = CATEGORY_COLORS[connector.category] || CATEGORY_COLORS['Other']
                          const logo = getConnectorLogo(connector.name)

                          return (
                            <Card
                              key={connector.name}
                              className="rounded-md border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer group bg-white dark:bg-[#1c2128] hover:border-blue-400/40 dark:hover:border-blue-500/30 overflow-hidden"
                            >
                              <CardHeader className="pb-3 pt-4">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base font-bold truncate text-slate-900 dark:text-slate-200 group-hover:text-[#146f84] transition-colors">
                                    {connector.display_name}
                                  </CardTitle>
                                  <Badge variant="outline" className={`mt-1 text-[10px] ${categoryColor}`}>
                                    {connector.category}
                                  </Badge>
                                </div>
                              </CardHeader>

                              <CardContent>
                                <CardDescription className="mb-4 text-xs line-clamp-2 min-h-[34px] text-slate-500 dark:text-slate-400">
                                  {connector.description}
                                </CardDescription>

                                <Button
                                  size="sm"
                                  className="w-full bg-[#146f84] hover:bg-[#105e6e] text-white border-0 transition-colors"
                                  onClick={() => {
                                    setConnectorToImport(connector)
                                    setShowNameDialog(true)
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-2" />
                                  Add to My Connectors
                                </Button>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>


                    ) : (
                      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#00040d] overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 border-b border-slate-200 dark:border-slate-800 p-3 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          <div className="col-span-3">CONNECTOR NAME</div>
                          <div className="col-span-5">DESCRIPTION</div>
                          <div className="col-span-2">CATEGORY</div>
                          <div className="col-span-2 text-right">ACTIONS</div>
                        </div>
                        <div className="flex flex-col">
                          {paginatedMarketplace.map((connector) => {
                            const branding = getConnectorBranding(connector.name)
                            const Icon = branding.icon
                            const categoryColor = CATEGORY_COLORS[connector.category] || CATEGORY_COLORS['Other']
                            const logo = getConnectorLogo(connector.name)

                            return (
                              <div key={connector.name} className="grid grid-cols-12 gap-4 px-4 py-3 items-center odd:bg-slate-50 dark:odd:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                                <div className="col-span-3">
                                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate block">{connector.display_name}</span>
                                </div>
                                <div className="col-span-5">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{connector.description}</span>
                                </div>
                                <div className="col-span-2">
                                  <Badge variant="outline" className={`text-[10px] ${categoryColor}`}>{connector.category}</Badge>
                                </div>
                                <div className="col-span-2 flex justify-end">
                                  <Button
                                    size="sm"
                                    className="bg-[#146f84] hover:bg-[#105e6e] text-white border-0 px-3"
                                    onClick={() => {
                                      setConnectorToImport(connector)
                                      setShowNameDialog(true)
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {filteredConnectors.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No connectors found matching your search</p>
                      </div>
                    )}

                    {totalMarketplacePages > 1 && (
                      <div className="flex justify-center items-center py-8 gap-4">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}>Previous</Button>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Page {currentPage} of {totalMarketplacePages}</span>
                        <Button variant="outline" size="sm" disabled={currentPage === totalMarketplacePages} onClick={() => { setCurrentPage(p => Math.min(totalMarketplacePages, p + 1)); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}>Next</Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Custom Connectors Tab */}
              <TabsContent value="custom" className="space-y-4">
                {customLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600 dark:border-slate-700 dark:border-t-cyan-500"></div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your connectors...</p>
                    </div>
                  </div>
                ) : filteredCustomConnectors.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">No custom connectors yet</p>
                    <Button onClick={() => setShowBuilderDialog(true)} className='text-slate-200'>
                      <Plus className="h-4 w-4 mr-2" />
                      Build Your First Connector
                    </Button>
                  </div>
                ) : (
                  <>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
                        {paginatedCustom.map((connector) => {
                          const isPyAirbyte = connector.connector_type === 'pyairbyte'
                          const branding = isPyAirbyte ? getConnectorBranding(connector.name) : null
                          const Icon = branding?.icon || Code
                          const logo = isPyAirbyte ? getConnectorLogo(connector.name) : null

                          return (
                            <div
                              key={connector.connector_id}
                              className={cn(
                                "rounded-md overflow-hidden border border-slate-200 dark:border-[#2a3245] bg-white dark:bg-[#18202e] hover:border-slate-300 dark:hover:border-[#3d4f6b] shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-xl dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col",
                                isPyAirbyte && "cursor-pointer",
                                !isPyAirbyte && "cursor-pointer"
                              )}
                              onClick={() => {
                                if (isPyAirbyte) {
                                  openConnectorDetailPage(connector)
                                } else {
                                  navigate(`/hub/bucket/${connector.connector_id}`)
                                }
                              }}
                            >
                              {/* Card Top: Icon + Name + Active Badge */}
                              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                                {/* Icon */}
                                {isPyAirbyte && (
                                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#0f1521] border border-slate-200 dark:border-[#232f42] flex-shrink-0">
                                    {logo?.type === 'simple-icon' && logo.data ? (
                                      <svg role="img" viewBox="0 0 24 24" width={20} height={20} fill={`#${logo.data.hex}`} xmlns="http://www.w3.org/2000/svg">
                                        <path d={logo.data.svg} />
                                      </svg>
                                    ) : logo?.type === 'clearbit' && logo.url ? (
                                      <img
                                        src={logo.url}
                                        alt={connector.display_name || connector.name}
                                        className="w-5 h-5 object-contain"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                        }}
                                      />
                                    ) : null}
                                    <Icon className={`h-5 w-5 ${logo && logo.type !== 'none' ? 'hidden' : ''}`} style={{ color: branding?.color }} />
                                  </div>
                                )}

                                {/* Name + Active Badge */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                                    {isPyAirbyte ? connector.instance_name : connector.name}
                                  </p>
                                  {!isPyAirbyte && (
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{connector.base_url}</p>
                                  )}
                                </div>

                                {/* Active Badge */}
                                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${connector.is_active
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                                  }`}>
                                  {connector.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              {/* Status Bar: category | configured */}
                              {isPyAirbyte && (
                                <div className="flex items-center justify-between px-4 py-2 border-y border-slate-100 dark:border-[#1e2a3a] bg-slate-50 dark:bg-[#101824]">
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    {connector.category || 'Other'}
                                  </span>
                                  <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${connector.is_configured
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${connector.is_configured ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                                    {connector.is_configured ? 'Configured' : 'Not Configured'}
                                  </span>
                                </div>
                              )}

                              {/* Description */}
                              <div className="px-4 py-3 flex-1">
                                <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {connector.description || 'No description available.'}
                                </p>
                                {!isPyAirbyte && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 dark:border-slate-700 dark:text-slate-400">{connector.auth_type}</Badge>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 dark:border-slate-700 dark:text-slate-400">{connector.endpoints.length} endpoints</Badge>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {isPyAirbyte ? (
                                <div className="px-4 pb-4 flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    className="w-full text-white font-semibold transition-colors border-0"
                                    style={{ backgroundColor: '#105e6e' }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openConnectorDetailPage(connector)
                                    }}
                                  >
                                    <Database className="h-3.5 w-3.5 mr-2" />
                                    {connector.is_configured ? 'Manage' : 'Configure'}
                                  </Button>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-slate-600 dark:text-slate-300 dark:bg-[#0f1521] dark:border-[#1e2a3a] dark:hover:bg-[#151e2c] transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedConnectorForRename(connector)
                                        setInstanceName(connector.instance_name || '')
                                        setShowRenameDialog(true)
                                      }}
                                    >
                                      Rename
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="dark:bg-[#0f1521] dark:border-[#1e2a3a] dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:border-red-900/50 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteCustomConnector(connector.connector_id)
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="px-4 pb-4">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteCustomConnector(connector.connector_id)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#00040d] overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 border-b border-slate-200 dark:border-slate-800 p-3 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          <div className="col-span-3">CONNECTOR NAME</div>
                          <div className="col-span-4">DESCRIPTION</div>
                          <div className="col-span-2">TAGS</div>
                          <div className="col-span-1">STATUS</div>
                          <div className="col-span-2 text-right">ACTIONS</div>
                        </div>
                        <div className="flex flex-col">
                          {paginatedCustom.map((connector) => {
                            const isPyAirbyte = connector.connector_type === 'pyairbyte'
                            const branding = isPyAirbyte ? getConnectorBranding(connector.name) : null
                            const Icon = branding?.icon || Code
                            const logo = isPyAirbyte ? getConnectorLogo(connector.name) : null

                            return (
                              <div
                                key={connector.connector_id}
                                className={cn(
                                  "grid grid-cols-12 gap-4 p-3 items-center odd:bg-slate-200 dark:odd:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                                )}
                                onClick={() => {
                                  if (isPyAirbyte) {
                                    openConnectorDetailPage(connector)
                                  } else {
                                    navigate(`/hub/bucket/${connector.connector_id}`)
                                  }
                                }}
                              >
                                <div className="col-span-3 flex items-center gap-3">
                                  {isPyAirbyte ? (
                                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 flex-shrink-0 border border-gray-100 dark:border-slate-700 shadow-sm">
                                      {logo?.type === 'simple-icon' && logo.data ? (
                                        <svg role="img" viewBox="0 0 24 24" width={18} height={18} fill={`#${logo.data.hex}`} xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                                          <path d={logo.data.svg} />
                                        </svg>
                                      ) : logo?.type === 'clearbit' && logo.url ? (
                                        <img src={logo.url} alt={connector.display_name || connector.name} className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
                                      ) : null}
                                      <Icon className={`h-4 w-4 ${logo && logo.type !== 'none' ? 'hidden' : ''}`} style={{ color: branding?.color }} />
                                    </div>
                                  ) : (
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-transparent shadow-sm">
                                      <Icon className="h-4 w-4 text-slate-500" />
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-xs truncate dark:text-slate-200">{isPyAirbyte ? connector.instance_name : connector.name}</span>
                                    {!isPyAirbyte && <span className="text-[10px] text-slate-500 truncate">{connector.base_url}</span>}
                                  </div>
                                </div>
                                <div className="col-span-4 flex items-center gap-2">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex-1">{connector.description || 'No description'}</span>
                                </div>
                                <div className="col-span-2 flex flex-wrap gap-1">
                                  {isPyAirbyte ? (
                                    <Badge variant="outline" className="text-[10px] bg-transparent font-normal border-slate-200 dark:border-slate-700 dark:text-slate-300 pt-0 pb-0">{connector.category || 'Other'}</Badge>
                                  ) : (
                                    <>
                                      <Badge variant="outline" className="text-[10px] bg-transparent font-normal border-slate-200 dark:border-slate-700 dark:text-slate-300 pt-0 pb-0">{connector.auth_type}</Badge>
                                      <Badge variant="outline" className="text-[10px] bg-transparent font-normal border-slate-200 dark:border-slate-700 dark:text-slate-300 pt-0 pb-0">{connector.endpoints.length} pts</Badge>
                                    </>
                                  )}
                                </div>
                                <div className="col-span-1">
                                  <div className="flex flex-col gap-1 items-start">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`h-1.5 w-1.5 rounded-full ${connector.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                      <span className="text-[11px] text-slate-600 dark:text-slate-400">{connector.is_active ? 'Ready' : 'Inactive'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-span-2 flex justify-end gap-1">
                                  {isPyAirbyte ? (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-7 px-2.5 text-xs text-white font-semibold transition-colors border-0"
                                        style={{ backgroundColor: '#105e6e' }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openConnectorDetailPage(connector)
                                        }}
                                      >
                                        <Database className="h-3.5 w-3.5 mr-1" /> Config
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedConnectorForRename(connector); setInstanceName(connector.instance_name || ''); setShowRenameDialog(true); }}>
                                        <Code className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" onClick={(e) => { e.stopPropagation(); deleteCustomConnector(connector.connector_id) }}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" onClick={(e) => { e.stopPropagation(); deleteCustomConnector(connector.connector_id); }}>
                                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Credentials Tab */}
              <TabsContent value="credentials" className="space-y-4">
                {credentialsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600 dark:border-slate-700 dark:border-t-amber-500"></div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Loading credentials...</p>
                    </div>
                  </div>
                ) : credentials.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Plug className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">No saved credentials</p>
                    <p className="text-sm text-gray-500">
                      Connect to a connector from the Marketplace to save credentials
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {paginatedCredentials.map((cred) => (
                      <Card key={cred.credential_id} className="bg-white dark:bg-[#353d4f] dark:border-[#3d4555]">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-sm font-semibold dark:text-white">{cred.display_name}</CardTitle>
                              <p className="text-xs text-slate-500 mt-0.5">{cred.connector_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {cred.is_verified && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCredential(cred.credential_id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 text-[11px] text-gray-500 font-medium">
                            <span>Used {cred.usage_count} times</span>
                            <span>•</span>
                            <span>Created {new Date(cred.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {totalCredentialsPages > 1 && (
                  <div className="flex justify-center items-center py-8 gap-4">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}>Previous</Button>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Page {currentPage} of {totalCredentialsPages}</span>
                    <Button variant="outline" size="sm" disabled={currentPage === totalCredentialsPages} onClick={() => { setCurrentPage(p => Math.min(totalCredentialsPages, p + 1)); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}>Next</Button>
                  </div>
                )}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Connector Builder Dialog */}
        <Dialog open={showBuilderDialog} onOpenChange={setShowBuilderDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Build Custom Connector</DialogTitle>
              <DialogDescription>
                Create a custom connector in 5 steps - no code required
              </DialogDescription>
            </DialogHeader>

            <ConnectorBuilderWizard
              onComplete={() => {
                setShowBuilderDialog(false)
                loadCustomConnectors()
                toast({
                  title: 'Connector Created',
                  description: 'Your custom connector is ready to use',
                  duration: 2000,
                })
              }}
              onCancel={() => setShowBuilderDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Name Instance Dialog (for importing) */}
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Name Your Connector</DialogTitle>
              <DialogDescription>
                Give this connector a custom name, or leave blank to auto-number (e.g., {connectorToImport?.display_name}-1)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="instance-name">Instance Name (Optional)</Label>
                <Input
                  id="instance-name"
                  placeholder={`e.g., Work ${connectorToImport?.display_name}, Personal Account`}
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleImportConnector(instanceName.trim() || undefined)
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNameDialog(false)
                    setInstanceName('')
                    setConnectorToImport(null)
                  }}
                >
                  Cancel
                </Button>
                <Button className="bg-[#146f84] hover:bg-[#105e6e] text-white" onClick={() => handleImportConnector(instanceName.trim() || undefined)}>
                  Add Connector
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Connector</DialogTitle>
              <DialogDescription>
                Change the name of this connector instance
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rename-instance">Instance Name</Label>
                <Input
                  id="rename-instance"
                  placeholder="Enter new name"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && instanceName.trim()) {
                      handleRenameConnector()
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRenameDialog(false)
                    setInstanceName('')
                    setSelectedConnectorForRename(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRenameConnector}
                  disabled={!instanceName.trim()}
                >
                  Rename
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {connectorToDelete
                  ? 'This will permanently delete this connector. This action cannot be undone.'
                  : 'This will permanently delete these credentials. This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false)
                setConnectorToDelete(null)
                setCredentialToDelete(null)
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


      </div>
    </div>
  </div>
)
}
