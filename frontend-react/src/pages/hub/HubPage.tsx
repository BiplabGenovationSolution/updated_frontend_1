import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, BarChart3, Code2, ScrollText } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { KnowledgeBaseList } from '@/components/knowledge/KnowledgeBaseList'
import { BucketList } from '@/components/hub/BucketList'
import { CodebaseList } from '@/components/hub/CodebaseList'
import { PolicyList } from '@/components/hub/PolicyList'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'


export default function HubPage() {
  const { user, loading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || 'knowledge')

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    setSearchParams(newParams, { replace: true });
  }

  // Fetch stats for all data types
  const { data: kbResponse } = useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: () => apiClient.getKnowledgeBases()
  })

  const { data: bucketsResponse } = useQuery({
    queryKey: ['buckets'],
    queryFn: () => apiClient.getBuckets()
  })

  const { data: codebasesResponse } = useQuery({
    queryKey: ['codebases'],
    queryFn: () => apiClient.getCodebases()
  })

  const { data: policiesResponse } = useQuery({
    queryKey: ['policies'],
    queryFn: () => apiClient.getPolicies()
  })

  const knowledgeCount = (kbResponse as any)?.data?.length || 0
  const bucketCount = (bucketsResponse as any)?.data?.length || 0
  const codebaseCount = (codebasesResponse as any)?.data?.length || 0
  const policyCount = (policiesResponse as any)?.data?.length || 0

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-200 dark:bg-[#0d1117]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    )
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="flex flex-col bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0d1117] min-h-full">
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Full Header Section - Card Style */}
        <div className="max-w-6xl mx-auto ">
          <div className="relative overflow-hidden dark:bg-[#0d1117] px-6 py-8 transition-all duration-300">
            <div className="relative z-10">
              <div className="mb-2">
                <Breadcrumbs />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200 mb-2">
                    Data Hub
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
                    Centralized management for all your AI-powered data assets
                  </p>
                </div>
              </div>

              {/* KPI Cards Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {[
                  { label: "KNOWLEDGE BASES", count: knowledgeCount, sub: "Sophia AI Search" },
                  { label: "DATA BUCKETS", count: bucketCount, sub: "Analytica Engine" },
                  { label: "CODEBASES", count: codebaseCount, sub: "Clavis Analysis" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white dark:bg-[#1c2128] 
                 border border-slate-200 dark:border-slate-800 
                 rounded-md px-4 py-4  
                 flex items-center justify-between
                 hover:border-blue-400/40 dark:hover:border-blue-500/30
                 transition-all duration-200"
                  >
                    {/* Left Column */}
                    <div className="flex flex-col">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {stat.sub}
                      </p>
                    </div>

                    {/* Right Column */}
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stat.count}
                    </h3>
                  </div>
                ))}

              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="max-w-6xl mx-auto mt-5 p-6 pt-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-50 dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 p-1.5 h-14 rounded-md">
              <TabsTrigger
                value="knowledge"
                className="w-full gap-2 data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-slate-700 data-[state=active]:border data-[state=active]:border-slate-300 dark:data-[state=active]:border-slate-600 transition-all font-medium"
              >
                Knowledge Bases
                {knowledgeCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                    {knowledgeCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="buckets"
                className="w-full gap-2 data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-slate-700 data-[state=active]:border data-[state=active]:border-slate-300 dark:data-[state=active]:border-slate-600 transition-all font-medium"
              >
                Data Buckets
                {bucketCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                    {bucketCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="codebases"
                className="w-full gap-2 data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-slate-700 data-[state=active]:border data-[state=active]:border-slate-300 dark:data-[state=active]:border-slate-600 transition-all font-medium"
              >
                Codebases
                {codebaseCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                    {codebaseCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="policies"
                className="w-full gap-2 data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-slate-700 data-[state=active]:border data-[state=active]:border-slate-300 dark:data-[state=active]:border-slate-600 transition-all font-medium"
              >
                Policies
                {policyCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                    {policyCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Knowledge Bases Tab */}
            <TabsContent value="knowledge" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Knowledge Bases
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">(Unstructured Data)</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered document search with Sophia</p>
                </div>
                <button
                  onClick={() => navigate('/hub/create-knowledge')}
                  className="px-4 py-2 bg-[#146f84] text-white rounded-md hover:bg-[#105e6e] transition-colors flex items-center gap-2 font-medium text-xs"
                >
                  <Database className="h-4 w-4" />
                  Create Knowledge Base
                </button>
              </div>
              <KnowledgeBaseList
                onKnowledgeBaseSelect={(id) => {
                  if (id) {
                    navigate(`/hub/knowledge?kb=${id}`)
                  }
                }}
                selectedKnowledgeBaseId={null}
                includeStats={true}
              />
            </TabsContent>

            {/* Buckets Tab */}
            <TabsContent value="buckets" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2">
                    Data Buckets
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">(Structured Data)</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Advanced data analysis with Analytica</p>
                </div>
                <button
                  onClick={() => navigate('/hub/create-bucket')}
                  className="px-4 py-2 bg-[#146f84] text-white rounded-md hover:bg-[#105e6e] transition-colors flex items-center gap-2 font-medium text-xs"
                >
                  <BarChart3 className="h-4 w-4" />
                  Create Bucket
                </button>
              </div>
              <BucketList />
            </TabsContent>

            {/* Codebases Tab */}
            <TabsContent value="codebases" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Codebases
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">(Technical Data)</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Code analysis and search with Clavis</p>
                </div>
                <button
                  onClick={() => navigate('/hub/create-codebase')}
                  className="px-4 py-2 bg-[#146f84] text-white rounded-md hover:bg-[#105e6e] transition-colors flex items-center gap-2 font-medium text-xs"
                >
                  <Code2 className="h-4 w-4" />
                  Add Codebase
                </button>
              </div>
              <CodebaseList />
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assessment Policies</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compliance rules for SOC2, HIPAA, and custom standards</p>
                </div>
                <button
                  onClick={() => navigate('/hub/create-policy')}
                  className="px-4 py-2 bg-[#146f84] text-white rounded-md hover:bg-[#105e6e] transition-colors flex items-center gap-2 font-medium text-xs"
                >
                  <ScrollText className="h-4 w-4" />
                  Create Policy
                </button>
              </div>
              <PolicyList />
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </div>
  );
}
