// frontend/src/app/settings/departments/page.tsx
import { useState, useEffect } from 'react'
import { useOrganization } from '@/context/OrganizationContext'
import { useAuth } from '@/hooks/useAuth'
import { governanceAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  Network,
  Plus,
  Loader2,
  ChevronRight,
  ChevronDown,
  Building,
  Users,
  Bot,
  Edit,
  Trash2,
  MoreVertical,
  Save,
  Building2,
  RefreshCw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Available agents in the system
const AVAILABLE_AGENTS = [
  { id: 'sophia', name: 'Sophia', description: 'Research Assistant' },
  { id: 'aegis', name: 'Aegis', description: 'Security Specialist' },
  { id: 'clavis', name: 'Clavis', description: 'Key Management' },
  { id: 'analytica', name: 'Analytica', description: 'Data Analysis' },
]

interface Department {
  department_id: string
  name: string
  description?: string
  parent_department_id?: string
  allowed_agents: string[]
  member_count?: number
  children?: Department[]
}

export default function DepartmentsPage() {
  const { user } = useAuth()
  const { currentOrganization, organizations, isOwner, canManage, loading: orgLoading, refreshOrganizations } = useOrganization()

  // External orgs = orgs where I am NOT the owner (I'm a member/admin/manager of someone else's org)
  const externalOrgs = organizations.filter(
    org => org.member_role !== 'owner'
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'manager':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'viewer':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'invited':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deptName, setDeptName] = useState('')
  const [deptDescription, setDeptDescription] = useState('')
  const [deptParentId, setDeptParentId] = useState<string>('root')
  const [deptAllowedAgents, setDeptAllowedAgents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Selected department for details
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)

  useEffect(() => {
    if (currentOrganization) {
      loadDepartments()
    }
  }, [currentOrganization])

  const loadDepartments = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const response = await governanceAPI.departments.getTree(currentOrganization.organization_id)

      if (response.success && response.data) {
        setDepartments(response.data)
        // Auto-expand first level
        const firstLevelIds = response.data.map(d => d.department_id)
        setExpandedDepts(new Set(firstLevelIds))
      }
    } catch (error) {
      console.error('Failed to load departments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const [externalDepartments, setExternalDepartments] = useState<any[]>([])
  const [loadingExternal, setLoadingExternal] = useState(false)
  const [failedExternalOrgs, setFailedExternalOrgs] = useState<string[]>([])
  // Map of orgId → the current user's permissions in that external org
  const [externalOrgPermissions, setExternalOrgPermissions] = useState<Record<string, any>>({})

  const loadExternalDepartments = async () => {
    setLoadingExternal(true)
    setFailedExternalOrgs([])
    const allExternalDepartments: any[] = []
    const failed: string[] = []
    const perOrgPermissions: Record<string, any> = {}

    for (const org of externalOrgs) {
      console.log(`[DepartmentsPage] Fetching departments for external org: ${org.name} (${org.organization_id})`)
      try {
        // First, fetch the current user's member record to get their permissions
        const membersRes = await governanceAPI.members.list(org.organization_id)
        if (membersRes.success && membersRes.data) {
          // Find current user's own member record by email to extract their permissions
          const myMember = membersRes.data.find((m: any) => m.user?.email === user?.email)
          perOrgPermissions[org.organization_id] = myMember?.permissions || {}
          console.log(`[DepartmentsPage] My permissions in ${org.name}:`, perOrgPermissions[org.organization_id])
        } else {
          perOrgPermissions[org.organization_id] = {}
        }

        const res = await governanceAPI.departments.getTree(org.organization_id)
        if (res.success && res.data) {
          console.log(`[DepartmentsPage] Successfully fetched departments for ${org.name}`)
          const flatDepts = flattenDepartments(res.data)
          const taggedDepts = flatDepts.map((d: any) => ({ ...d, organization_name: org.name, organization_id: org.organization_id }))
          allExternalDepartments.push(...taggedDepts)
        } else {
          console.warn(`[DepartmentsPage] Failed to fetch departments for ${org.name}:`, res)
        }
      } catch (e) {
        console.error(`[DepartmentsPage] Error fetching departments for external org ${org.organization_id}`, e)
        perOrgPermissions[org.organization_id] = {}
      }
    }
    setExternalDepartments(allExternalDepartments)
    setExternalOrgPermissions(perOrgPermissions)
    setFailedExternalOrgs(failed)
    setLoadingExternal(false)
  }

  const handleOpenDialog = (dept?: Department, parentId?: string) => {
    if (dept) {
      setEditingDept(dept)
      setDeptName(dept.name)
      setDeptDescription(dept.description || '')
      setDeptParentId(dept.parent_department_id || 'root')
      setDeptAllowedAgents(dept.allowed_agents || [])
    } else {
      setEditingDept(null)
      setDeptName('')
      setDeptDescription('')
      setDeptParentId(parentId || 'root')
      setDeptAllowedAgents([])
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentOrganization || !deptName.trim()) return

    try {
      setSaving(true)

      if (editingDept) {
        // Update existing department
        const response = await governanceAPI.departments.update(editingDept.department_id, {
          name: deptName,
          description: deptDescription,
          allowed_agents: deptAllowedAgents,
        })

        if (response.success) {
          toast({
            title: 'Success',
            description: 'Department updated',
            duration: 2000
          })
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to update department',
            variant: 'destructive',
            duration: 2000
          })
          return
        }
      } else {
        // Create new department
        const response = await governanceAPI.departments.create({
          organization_id: currentOrganization.organization_id,
          name: deptName,
          description: deptDescription,
          parent_department_id: deptParentId === 'root' ? undefined : deptParentId,
          allowed_agents: deptAllowedAgents,
        })

        if (response.success) {
          toast({
            title: 'Success',
            description: 'Department created',
            duration: 2000
          })
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to create department',
            variant: 'destructive',
            duration: 2000
          })
          return
        }
      }

      setDialogOpen(false)
      await loadDepartments()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save department',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (dept: Department) => {
    if (!confirm(`Archive department "${dept.name}"? Members will be reassigned to parent.`)) {
      return
    }

    try {
      const response = await governanceAPI.departments.archive(dept.department_id)

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Department archived',
          duration: 2000
        })
        await loadDepartments()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to archive department',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive department',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const toggleExpand = (deptId: string) => {
    const newExpanded = new Set(expandedDepts)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpandedDepts(newExpanded)
  }

  const toggleAgent = (agentId: string) => {
    setDeptAllowedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    )
  }

  const renderDepartmentTree = (depts: Department[], depth: number = 0) => {
    return depts.map((dept) => {
      const hasChildren = dept.children && dept.children.length > 0
      const isExpanded = expandedDepts.has(dept.department_id)
      const isSelected = selectedDept?.department_id === dept.department_id

      return (
        <div key={dept.department_id}>
          <div
            className={`
              flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800
              ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}
            `}
            style={{ marginLeft: `${depth * 24}px` }}
            onClick={() => setSelectedDept(dept)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(dept.department_id)
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <Building className="h-4 w-4 text-gray-500" />

            <div className="flex-1 flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {dept.name}
                </span>
                {dept.member_count !== undefined && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({dept.member_count} member{dept.member_count !== 1 ? 's' : ''})
                  </span>
                )}
              </div>

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDialog(undefined, dept.department_id)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sub-department
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDialog(dept)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchive(dept)
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {hasChildren && isExpanded && renderDepartmentTree(dept.children!, depth + 1)}
        </div>
      )
    })
  }

  const flattenDepartments = (depts: Department[]): Department[] => {
    let result: Department[] = []
    for (const dept of depts) {
      result.push(dept)
      if (dept.children) {
        result = result.concat(flattenDepartments(dept.children))
      }
    }
    return result
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Network className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No organization selected. Please select or create an organization first.
        </p>
        <a href="/settings/organization/new">
          <Button>
            Create Organization
          </Button>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="own" className="w-full" onValueChange={(value) => {
        if (value === 'external') {
          void loadExternalDepartments()
        }
      }}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="own">Own Organization</TabsTrigger>
          <TabsTrigger value="external">External Organizations</TabsTrigger>
        </TabsList>

        <TabsContent value="own">
          {isOwner ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Tree */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-gray-500" />
                        <CardTitle>Department Structure</CardTitle>
                      </div>
                      <CardDescription>
                        Hierarchical organization of departments
                      </CardDescription>
                    </div>
                    {canManage && (
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Department
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingDept ? 'Edit Department' : 'Create Department'}
                            </DialogTitle>
                            <DialogDescription>
                              {editingDept
                                ? 'Update department information and agent access'
                                : 'Create a new department in your organization'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="dept-name">Department Name</Label>
                              <Input
                                id="dept-name"
                                placeholder="Engineering"
                                value={deptName}
                                onChange={(e) => setDeptName(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="dept-description">Description</Label>
                              <Textarea
                                id="dept-description"
                                placeholder="Describe the department..."
                                value={deptDescription}
                                onChange={(e) => setDeptDescription(e.target.value)}
                                rows={3}
                              />
                            </div>

                            {!editingDept && (
                              <div className="space-y-2">
                                <Label htmlFor="dept-parent">Parent Department (Optional)</Label>
                                <Select value={deptParentId} onValueChange={setDeptParentId}>
                                  <SelectTrigger id="dept-parent">
                                    <SelectValue placeholder="No parent (top-level)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="root">No parent (top-level)</SelectItem>
                                    {flattenDepartments(departments).map((dept) => (
                                      <SelectItem key={dept.department_id} value={dept.department_id}>
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Allowed Agents</Label>
                              <p className="text-sm text-gray-500">
                                Select agents that department members can access. Leave empty for all agents.
                              </p>
                              <div className="space-y-2">
                                {AVAILABLE_AGENTS.map((agent) => (
                                  <div key={agent.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`agent-${agent.id}`}
                                      checked={deptAllowedAgents.includes(agent.id)}
                                      onCheckedChange={() => toggleAgent(agent.id)}
                                    />
                                    <Label
                                      htmlFor={`agent-${agent.id}`}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium">{agent.name}</div>
                                          <div className="text-xs text-gray-500">{agent.description}</div>
                                        </div>
                                        <Bot className="h-4 w-4 text-gray-400" />
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving || !deptName.trim()}>
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  {editingDept ? 'Update' : 'Create'}
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="text-center py-12">
                      <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No departments yet
                      </p>
                      {canManage && (
                        <Button onClick={() => handleOpenDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Department
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {renderDepartmentTree(departments)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Department Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Details</CardTitle>
                  <CardDescription>
                    {selectedDept ? 'Information about selected department' : 'Select a department to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDept ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{selectedDept.name}</h3>
                        {selectedDept.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedDept.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Members</span>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{selectedDept.member_count || 0}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Allowed Agents
                          </h4>
                          {!selectedDept.allowed_agents || selectedDept.allowed_agents.length === 0 ? (
                            <p className="text-sm text-gray-500">All agents allowed</p>
                          ) : (
                            <div className="space-y-1">
                              {selectedDept.allowed_agents.map((agentId) => {
                                const agent = AVAILABLE_AGENTS.find(a => a.id === agentId)
                                return (
                                  <div key={agentId} className="flex items-center gap-2 text-sm">
                                    <Badge variant="secondary">{agent?.name || agentId}</Badge>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">
                        Select a department from the tree to view its details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You are currently viewing an external organization.
                <br />
                Create your own organization to manage your team and resources.
              </p>
              <a href="/settings/organization/new">
                <Button>
                  Create Organization
                </Button>
              </a>
            </div>
          )}
        </TabsContent>

        <TabsContent value="external">
          {externalOrgs.length === 0 ? (
            <div className="text-center py-12">
              <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">You are not a member of any external organizations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {loadingExternal ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                externalOrgs.map(org => {
                  const perms = externalOrgPermissions[org.organization_id] || {}
                  const canViewDepts = !!perms.can_manage_departments
                  const orgDepts = externalDepartments.filter(d => d.organization_id === org.organization_id)

                  return (
                    <Card key={org.organization_id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{org.name}</CardTitle>
                            <CardDescription>
                              Your role: <span className="font-medium capitalize">{org.member_role}</span>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!canViewDepts ? (
                          <div className="text-center py-8">
                            <Network className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              You don't have permission to view departments in this organization.
                            </p>
                          </div>
                        ) : orgDepts.length === 0 ? (
                          <div className="text-center py-8">
                            <Network className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No departments found.</p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Department</TableHead>
                                  <TableHead>Members</TableHead>
                                  <TableHead>Allowed Agents</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {orgDepts.map((dept) => (
                                  <TableRow key={`${dept.organization_id}-${dept.department_id}`}>
                                    <TableCell>
                                      <div className="font-medium text-gray-900 dark:text-white">{dept.name}</div>
                                      {dept.description && (
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{dept.description}</div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-gray-400" />
                                        <span>{dept.member_count || 0}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {!dept.allowed_agents || dept.allowed_agents.length === 0 ? (
                                          <span className="text-xs text-gray-500">All</span>
                                        ) : (
                                          dept.allowed_agents.slice(0, 3).map((agentId: string) => {
                                            const agent = AVAILABLE_AGENTS.find(a => a.id === agentId)
                                            return (
                                              <Badge key={agentId} variant="secondary" className="text-[10px] px-1 h-5">
                                                {agent?.name || agentId}
                                              </Badge>
                                            )
                                          })
                                        )}
                                        {dept.allowed_agents && dept.allowed_agents.length > 3 && (
                                          <Badge variant="secondary" className="text-[10px] px-1 h-5">
                                            +{dept.allowed_agents.length - 3}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => loadExternalDepartments()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
