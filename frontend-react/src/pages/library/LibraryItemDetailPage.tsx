import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Download, Users, Loader2, Code, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'
import type { MarketplaceAgent, MarketplaceCapability } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

export default function LibraryItemDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [selectedItem, setSelectedItem] = useState<MarketplaceAgent | MarketplaceCapability | null>(
    (location.state?.item as MarketplaceAgent | MarketplaceCapability | null) ?? null
  )
  const [importingId, setImportingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!location.state?.item)

  useEffect(() => {
    const loadItem = async () => {
      if (selectedItem || !id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        const [agentResponse, capabilityResponse] = await Promise.all([
          apiClient.getMarketplaceAgent(id).catch(() => null),
          apiClient.getMarketplaceCapabilities({ limit: 100 }).catch(() => null),
        ])

        if (agentResponse?.success && agentResponse.data) {
          const agent = agentResponse.data.agent || agentResponse.data
          setSelectedItem(agent)
          return
        }

        const capabilities = capabilityResponse?.success && capabilityResponse.data
          ? capabilityResponse.data.capabilities || []
          : []
        const capability = capabilities.find((item: MarketplaceCapability) => item.id === id)

        if (capability) {
          setSelectedItem(capability)
          return
        }
      } catch (error) {
        console.error('Failed to load library item:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadItem()
  }, [id, selectedItem])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#edf2f7] dark:bg-[#0d1117]">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading item details...</p>
      </div>
    )
  }

  if (!selectedItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#edf2f7] dark:bg-[#0d1117]">
        <div className="p-8 text-center">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Item Details Not Found</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">Please navigate from the library page.</p>
          <Button onClick={() => navigate('/library')}>Back to Library</Button>
        </div>
      </div>
    )
  }

  const handleImportAgent = async (agentId: string) => {
    try {
      setImportingId(agentId)
      const response = await apiClient.importMarketplaceAgent(agentId, {})
      if (response.success) {
        toast({ title: 'Success!', description: 'Agent imported to your workspace.' })
        navigate('/agents')
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to import agent', variant: 'destructive' })
    } finally {
      setImportingId(null)
    }
  }

  const handleImportCapability = async (capabilityId: string, capabilityName: string) => {
    try {
      setImportingId(capabilityId)
      const response = await apiClient.importMarketplaceCapability(capabilityId, {
        custom_name: capabilityName,
      })
      if (!response.success) throw new Error(response.error || 'Failed to import capability')
      toast({ title: 'Success!', description: 'Capability imported to your workspace.' })
      navigate('/capabilities')
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to import capability', variant: 'destructive' })
    } finally {
      setImportingId(null)
    }
  }

  const isAgent = 'system_prompt' in selectedItem
  const isReady = selectedItem.status === 'active'
  const tags = ('tags' in selectedItem ? selectedItem.tags : []) as string[]
  const category = ('category' in selectedItem ? (selectedItem as any).category : null) as string | null

  return (
    <div className="flex flex-col min-h-full bg-[#edf2f7] dark:bg-[#0d1117]">
      <div className="flex-1">

        {/* ── Header Section - Exact Data Hub Style ── */}
        <div className="max-w-6xl mx-auto w-full">
          <div className="relative overflow-hidden px-6 py-8 transition-all duration-300">
            <div className="relative z-10">
              <div className="mb-2">
                <Breadcrumbs />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
                      {selectedItem.name}
                    </h1>
                    <Badge variant={isReady ? 'default' : 'secondary'}>
                      {selectedItem.status || 'active'}
                    </Badge>
                    {(selectedItem as any).is_global && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Global
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium mb-4">
                    {selectedItem.description}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-[#EEF2F7] flex-wrap">
                    {category && (
                      <div className="flex items-center gap-1">
                        <Code className="w-4 h-4" /> {category}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" /> {selectedItem.download_count || 0} downloads
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {selectedItem.rating ? selectedItem.rating.toFixed(1) : '5.0'}
                    </div>
                    {selectedItem.author_name && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {selectedItem.author_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Import button */}
                <div className="flex items-center gap-3">
                  {isAgent ? (
                    <Button
                      onClick={() => handleImportAgent(selectedItem.id)}
                      disabled={importingId === selectedItem.id}
                      className="px-6 font-semibold text-white shadow-sm bg-[#105e6e] hover:bg-[#0d4d59] h-10"
                    >
                      {importingId === selectedItem.id
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                        : <><Download className="w-4 h-4 mr-2" />Import Agent</>}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleImportCapability(selectedItem.id, selectedItem.name)}
                      disabled={importingId === selectedItem.id}
                      className="px-6 font-semibold text-white shadow-sm bg-[#105e6e] hover:bg-[#0d4d59] h-10"
                    >
                      {importingId === selectedItem.id
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                        : <><Download className="w-4 h-4 mr-2" />Import Capability</>}
                    </Button>
                  )}
                </div>
              </div>

              {/* Tags row */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="p-6 mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#0f1825] border border-slate-200 dark:border-[#323942] rounded-md p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Description</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </p>
              </div>

              {isAgent && ('system_prompt' in selectedItem) && (
                <>
                  <div className="bg-white dark:bg-[#0f1825] border border-slate-200 dark:border-[#323942] rounded-md p-6 shadow-sm">
                    <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-2.5">System Prompt</h3>
                    <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-[#2a3358] p-4 rounded-sm text-[13px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed overflow-x-auto">
                      {selectedItem.system_prompt}
                    </div>
                  </div>

                  {selectedItem.capabilities.length > 0 && (
                    <div className="bg-white dark:bg-[#0f1825] border border-slate-200 dark:border-[#323942] rounded-md p-6 shadow-sm">
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-2.5">
                        Included Capabilities <span className="ml-1 font-normal text-slate-400">({selectedItem.capabilities.length})</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.capabilities.map((cap: any, index: number) => (
                          <span key={index} className="flex items-center text-[12px] px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#2a3358] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0d1117]">
                            <Code className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            {cap.name || 'Unknown'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isAgent && ('code' in selectedItem) && (
                <>
                  {selectedItem.parameters.length > 0 && (
                    <div className="bg-white dark:bg-[#0f1825] border border-slate-200 dark:border-[#323942] rounded-md p-6 shadow-sm">
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-4">Parameters</h3>
                      <div className="space-y-3">
                        {selectedItem.parameters.map((param, index) => (
                          <div key={index} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-[#2a3358] p-4 rounded-sm text-[13px]">
                            <div className="flex items-center gap-2.5 flex-wrap mb-2">
                              <code className="bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-[#2a3358] px-2 py-0.5 rounded-sm text-[13px] font-mono font-bold text-slate-900 dark:text-white">
                                {param.name}
                              </code>
                              <span className="text-[11px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-sm">
                                {param.type}
                              </span>
                              {param.required && (
                                <span className="text-[11px] font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-sm">
                                  required
                                </span>
                              )}
                            </div>
                            {param.description && (
                              <p className="text-slate-600 dark:text-slate-400 text-[13px]">{param.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-[#2a3358] rounded-xl p-6 shadow-sm">
                    <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-4">Code Snippet</h3>
                    <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-[13px] overflow-x-auto font-mono">
                      {selectedItem.code}
                    </pre>
                  </div>
                </>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-[#2a3358] rounded-xl p-6 shadow-sm">
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0
                    ? tags.map((tag) => (
                      <span key={tag} className="text-[12px] px-3 py-1 rounded-md border border-slate-200 dark:border-[#323942] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0f1825]">
                        {tag}
                      </span>
                    ))
                    : <span className="text-slate-400 text-[12px]">No tags</span>
                  }
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f1825] border border-slate-200 dark:border-[#323942] rounded-md p-6 shadow-sm">
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-4">Properties</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {isReady ? 'Ready' : (selectedItem.status || 'Ready')}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Updated</p>
                    <p className="text-[13px] font-medium text-slate-900 dark:text-white">{formatRelativeTime(selectedItem.last_updated)}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
