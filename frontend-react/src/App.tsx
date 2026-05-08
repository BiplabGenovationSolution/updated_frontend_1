import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeProvider'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { OrganizationProvider } from '@/context/OrganizationContext'
import { Toaster } from '@/components/ui/toaster'
import { Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// Layout components
import { Header } from '@/components/layout/Header'
import { IconNav } from '@/components/layout/IconNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { SettingsLayout } from '@/components/layout/SettingsLayout'
import { ChatProvider } from '@/context/ChatContext'
import { TaskPanel } from '@/components/tasks/TaskPanel'
import { Footer } from '@/components/layout/Footer'

// Page components
import { LoginPage, RegisterPage } from '@/pages/auth'
import { KnowledgePage } from '@/pages/knowledge'
import { FlowsPage } from '@/pages/flows'
import { CapabilitiesPage, CapabilityDetailPage } from '@/pages/capabilities'
import { CustomAgentsPage } from '@/pages/custom-agents'
import { HubPage, CreateBucketPage, CreateKnowledgeBasePage, CreateCodebasePage, CreatePolicyPage } from '@/pages/hub'
import { TasksPage } from '@/pages/tasks'
import { WorkspacePage, CreateCustomAgentPage, EditCustomAgentPage, WorkspaceChatPage, AgentDetailPage } from '@/pages/workspace'
import { LibraryPage, CreateGlobalAgentPage, CreateGlobalCapabilityPage, LibraryItemDetailPage } from '@/pages/library'
import CreateCapabilityPage from '@/pages/capabilities/CreateCapabilityPage'
import EditCapabilityPage from '@/pages/capabilities/EditCapabilityPage'
import { ConnectorsPage, ConnectorDetailPage, DataBucketDetailPage } from '@/pages/connectors'
import { AutomationsPage, CreateAutomationPage } from '@/pages/automations'
import { ModelsPage, AddModelPage } from '@/pages/models'
import {

  ProfilePage,
  OrganizationPage,
  NewOrganizationPage,
  MembersPage,
  ApiKeysPage,
  AnalyticsPage,
  DepartmentsPage,
  InvitationsPage,
  ApiDocsPage,
} from '@/pages/settings'

// Clavis Pod components
import { InteractiveSessionWorkspace } from '@/components/clavis/InteractiveSessionWorkspace'
import { ClavisPodsPage, ClavisModernIDEPage } from '@/pages/clavis'


// Lazy-load legacy MUI Clavis screens
const CodebaseManager = lazy(() => import('@/components/clavis/CodebaseManager').then(m => ({ default: m.CodebaseManager })))
const ClavisPodTerminal = lazy(() => import('@/components/clavis/PodTerminal').then(m => ({ default: m.ClavisPodTerminal })))
const ClavisCreateMode = lazy(() => import('@/components/clavis/CreateMode').then(m => ({ default: m.ClavisCreateMode })))
const ClavisTestingMode = lazy(() => import('@/components/clavis/TestingMode').then(m => ({ default: m.ClavisTestingMode })))
// const ClavisIDEViewer = lazy(() => import('@/components/clavis/IDEViewer').then(m => ({ default: m.ClavisIDEViewer })))

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Protected Route Wrapper
interface ProtectedRouteProps {
  children: ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <img
              src="/mentis-animated.gif"
              alt="Mentis loading"
              className="w-16 h-16"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Mentis...
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

// Layout wrapper for authenticated pages
interface AppLayoutProps {
  children: ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try { return localStorage.getItem('mentis_sidebar_open') === 'true' } catch { return false }
  })
  const navigate = useNavigate()

  const toggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open)
    try { localStorage.setItem('mentis_sidebar_open', String(open)) } catch { /* ignore */ }
  }

  const handleChatSelect = (chatId: string | null, agentType?: string) => {
    if (chatId) {
      const targetAgent = agentType || 'sophia'
      navigate(`/agents/${targetAgent}?id=${chatId}`)
    } else {
      navigate('/agents')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0f1219]">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {!isSidebarOpen && (
          <IconNav onSidebarClick={() => toggleSidebar(true)} />
        )}

        {isSidebarOpen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onChatSelect={handleChatSelect}
            selectedChatId={null}
            isCollapsed={false}
            onToggleCollapse={() => toggleSidebar(false)}
          />
        )}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <main className="flex-1 overflow-auto bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0f1219]">
            {children}
          </main>
          <Footer />
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="absolute inset-0 z-20 md:hidden bg-black/50"
            onClick={() => toggleSidebar(false)}
          />
        )}
      </div>
    </div>
  )
}

// Shared layout for /agents routes — keeps Header alive during navigation
function AgentsLayout() {
  const location = useLocation()

  const isChatRoute = location.pathname !== '/agents' &&
    location.pathname !== '/agents/create' &&
    !location.pathname.endsWith('/edit')

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try { return localStorage.getItem('mentis_sidebar_open') === 'true' || isChatRoute } catch { return isChatRoute }
  })
  const navigate = useNavigate()

  const toggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open)
    try { localStorage.setItem('mentis_sidebar_open', String(open)) } catch { /* ignore */ }
  }

  useEffect(() => {
    if (isChatRoute) {
      toggleSidebar(true)
    }
  }, [isChatRoute])

  const handleChatSelect = (chatId: string | null, agentType?: string) => {
    if (chatId) {
      const targetAgent = agentType || 'sophia'
      navigate(`/agents/${targetAgent}?id=${chatId}`)
    } else {
      navigate('/agents')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0f1219]">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {!isSidebarOpen && (
          <IconNav onSidebarClick={() => toggleSidebar(true)} />
        )}

        {isSidebarOpen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onChatSelect={handleChatSelect}
            selectedChatId={null}
            isCollapsed={false}
            onToggleCollapse={() => toggleSidebar(false)}
          />
        )}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-[var(--app-bg,#EEF2F7)] dark:bg-[#0f1219] scrollbar-minimal">
            <Outlet />
          </div>
          {!isChatRoute && <Footer />}
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="absolute inset-0 z-20 md:hidden bg-black/50"
            onClick={() => toggleSidebar(false)}
          />
        )}
      </div>
    </div>
  )
}

// Landing page component
// function LandingPage() {
//   return (
//     <div className="flex items-center justify-center h-full">
//       <div className="text-center">
//         <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
//           Welcome to Mentis
//         </h1>
//         <p className="text-gray-600 dark:text-gray-400">
//           Your AI-powered knowledge management platform
//         </p>
//       </div>
//     </div>
//   )
// }

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <ThemeProvider defaultTheme="light" storageKey="mentis-ui-theme-v2">
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* Protected routes with layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/agents" replace />
                    </ProtectedRoute>
                  }
                />


                <Route
                  path="/knowledge"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <KnowledgePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hub/knowledge"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <KnowledgePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/flows"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <FlowsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/capabilities"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CapabilitiesPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/capabilities/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CapabilityDetailPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/custom-agents"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CustomAgentsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hub"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <HubPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hub/create-bucket"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CreateBucketPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hub/create-knowledge"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CreateKnowledgeBasePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hub/create-codebase"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CreateCodebasePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hub/create-policy"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CreatePolicyPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <TasksPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Legacy /chat route redirected to modern /agents workspace */}
                <Route
                  path="/chat"
                  element={<Navigate to="/agents" replace />}
                />

                {/* Agents routes — share a persistent Header via AgentsLayout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AgentsLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/agents" element={<WorkspacePage />} />
                  <Route path="/agents/create" element={<CreateCustomAgentPage />} />
                  <Route path="/agents/:agentId/edit" element={<EditCustomAgentPage />} />

                  {/* Chat interface integrated into Workspace flow */}
                  <Route path="/agents/:agentId/details" element={<AgentDetailPage />} />
                  <Route path="/agents/:agentId" element={<WorkspaceChatPage />} />
                  <Route path="/agents/custom/:agentName" element={<WorkspaceChatPage />} />

                  <Route path="/capabilities/create" element={<CreateCapabilityPage />} />
                  <Route path="/capabilities/:id" element={<CapabilityDetailPage />} />
                  <Route path="/capabilities/:id/edit" element={<EditCapabilityPage />} />
                  <Route path="/library/create-global-capability" element={<CreateGlobalCapabilityPage />} />
                </Route>

                <Route
                  path="/library"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Outlet />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<LibraryPage />} />
                  <Route path="items/:id" element={<LibraryItemDetailPage />} />
                </Route>

                <Route
                  path="/library/create-global-agent"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CreateGlobalAgentPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/connectors"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ConnectorsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/connectors/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ConnectorDetailPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hub/bucket/:bucketId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <DataBucketDetailPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/automations"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AutomationsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/automations/create"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CreateAutomationPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/models"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ModelsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/models/add"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AddModelPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Settings routes */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/settings/organization" replace />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/profile"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ProfilePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/organization"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <OrganizationPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/members"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <MembersPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/api-keys"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <ApiKeysPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/analytics"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <AnalyticsPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/departments"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <DepartmentsPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/invitations"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <InvitationsPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/api-docs"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <ApiDocsPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/organization/new"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsLayout>
                          <NewOrganizationPage />
                        </SettingsLayout>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Clavis Pod Management Routes */}
                <Route
                  path="/clavis/pods"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ClavisPodsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clavis/codebases"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<div className="p-4">Loading…</div>}><CodebaseManager /></Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clavis/terminal/:sessionId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<div className="p-4">Loading…</div>}><ClavisPodTerminal /></Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clavis/create/:sessionId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<div className="p-4">Loading…</div>}><ClavisCreateMode /></Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clavis/test/:sessionId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<div className="p-4">Loading…</div>}><ClavisTestingMode /></Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />


                <Route
                  path="/clavis/interactive/:codebaseId/:sessionId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <InteractiveSessionWorkspace />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clavis/ide/:sessionId"
                  element={
                    <ProtectedRoute>
                      <ChatProvider>
                        <ClavisModernIDEPage />
                      </ChatProvider>
                    </ProtectedRoute>
                  }
                />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <TaskPanel />
              <Toaster />
            </BrowserRouter>
          </ThemeProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}


export default App
