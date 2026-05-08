// frontend/src/app/settings/members/page.tsx
import { useState, useEffect } from 'react'
import { useOrganization } from '@/context/OrganizationContext'
import { useAuth } from '@/hooks/useAuth'
import { governanceAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from '@/hooks/use-toast'
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  MoreVertical,
  Trash2,
  Mail,
  Filter,
  RefreshCw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import Avatar from 'boring-avatars'



export default function MembersPage() {
  const { user } = useAuth()
  const { currentOrganization, organizations, isOwner, isAdmin, canManage, loading: orgLoading } = useOrganization()
  // External orgs = orgs where I am NOT the owner (I'm a member/admin/manager of someone else's org)
  const externalOrgs = organizations.filter(
    org => org.member_role !== 'owner'
  )

  const [members, setMembers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteDepartment, setInviteDepartment] = useState('')
  const [invitePermissions, setInvitePermissions] = useState<string[]>([])
  const [permissionStructure, setPermissionStructure] = useState<any[]>([])
  const [inviting, setInviting] = useState(false)

  // Remove member state
  const [memberToRemove, setMemberToRemove] = useState<any>(null)

  useEffect(() => {
    if (currentOrganization) {
      loadData()
    }
  }, [currentOrganization])

  const loadData = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)

      console.group('[MembersPage] loadData')
      console.log('currentOrganization:', currentOrganization.name, '(', currentOrganization.organization_id, ')')
      console.log('my role:', currentOrganization.member_role)
      console.log('isOwner:', isOwner, '| isAdmin:', isAdmin, '| canManage:', canManage)

      let fetchedMembers: any[] = []
      let fetchedDepartments: any[] = []

      // Load departments
      const departmentsResponse = await governanceAPI.departments.list(currentOrganization.organization_id)
      console.log('Departments API response:', departmentsResponse)
      if (departmentsResponse.success && departmentsResponse.data) {
        fetchedDepartments = departmentsResponse.data
        console.log('Departments fetched:', fetchedDepartments.length, fetchedDepartments.map((d: any) => d.name))
        if (!inviteDepartment && departmentsResponse.data.length > 0) {
          setInviteDepartment(departmentsResponse.data[0].department_id)
        }
      } else {
        console.warn('Departments API failed:', departmentsResponse.error)
      }

      // Try to fetch all members first (optimistic approach)
      try {
        const membersResponse = await governanceAPI.members.list(currentOrganization.organization_id)
        console.log('Members API response:', membersResponse)
        if (membersResponse.success && membersResponse.data) {
          fetchedMembers = membersResponse.data
          console.log('Members fetched:', fetchedMembers.length, fetchedMembers.map((m: any) => ({ email: m.user?.email, role: m.role })))
        } else {
          console.warn('[MembersPage] Members API returned error/empty:', membersResponse.error)
        }
      } catch (e) {
        console.error('[MembersPage] Exception fetching members (likely 403):', e)
      }

      console.groupEnd()

      setMembers(fetchedMembers)
      setDepartments(fetchedDepartments)

      // Fetch external members if we are allowed
      if (externalOrgs.length > 0) {
        void loadExternalMembers()
      }

    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const [externalMembers, setExternalMembers] = useState<any[]>([])
  const [loadingExternal, setLoadingExternal] = useState(false)
  const [failedExternalOrgs, setFailedExternalOrgs] = useState<string[]>([])
  // Map of orgId → the current user's permissions in that org
  const [externalOrgPermissions, setExternalOrgPermissions] = useState<Record<string, any>>({})

  const loadExternalMembers = async () => {
    setLoadingExternal(true)
    setFailedExternalOrgs([])
    const allExternalMembers: any[] = []
    const failed: string[] = []
    const perOrgPermissions: Record<string, any> = {}

    for (const org of externalOrgs) {
      // Attempt to load members for all external organizations
      // We rely on the backend to enforce permissions (403 if not allowed)
      console.log(`[MembersPage] Fetching members for external org: ${org.name} (${org.organization_id})`)
      try {
        const res = await governanceAPI.members.list(org.organization_id)
        if (res.success && res.data) {
          console.log(`[MembersPage] Successfully fetched ${res.data.length} members for ${org.name}`)
          // Find the current user's own member record to extract their permissions
          const myRecord = res.data.find((m: any) => m.user_id === user?.id || m.user?.email === user?.email)
          perOrgPermissions[org.organization_id] = myRecord?.permissions || {}
          console.log(`[MembersPage] My permissions in ${org.name}:`, perOrgPermissions[org.organization_id])
          // Tag them with org name for display
          const taggedMembers = res.data.map((m: any) => ({ ...m, organization_name: org.name, organization_id: org.organization_id }))
          allExternalMembers.push(...taggedMembers)
        } else {
          console.warn(`[MembersPage] Failed to fetch members for ${org.name}:`, res)
          perOrgPermissions[org.organization_id] = {}
        }
      } catch (e) {
        // This is expected if we don't have permission
        console.error(`[MembersPage] Error fetching members for external org ${org.organization_id}`, e)
        perOrgPermissions[org.organization_id] = {}
      }
    }
    setExternalMembers(allExternalMembers)
    setExternalOrgPermissions(perOrgPermissions)
    setFailedExternalOrgs(failed)
    setLoadingExternal(false)
  }

  const handleInvite = async () => {
    if (!currentOrganization || !inviteEmail || !inviteDepartment) return

    try {
      setInviting(true)
      const response = await governanceAPI.invitations.send({
        organization_id: currentOrganization.organization_id,
        email: inviteEmail,
        role: inviteRole,
        department_id: inviteDepartment,
        // Convert permissions array to object { [permission]: true }
        permissions: invitePermissions.reduce((acc, perm) => ({ ...acc, [perm]: true }), {}),
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: `Invitation sent to ${inviteEmail}`,
          duration: 2000
        })
        setInviteDialogOpen(false)
        setInviteEmail('')
        setInviteRole('member')
        setInvitePermissions([])
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to send invitation',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
        duration: 2000  
      })
    } finally {
      setInviting(false)
    }
  }



  const handleRemoveMember = async () => {
    if (!currentOrganization || !memberToRemove) return

    try {
      const response = await governanceAPI.members.remove(
        currentOrganization.organization_id,
        memberToRemove.user_id
      )

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Member removed from organization',
          duration: 2000
        })
        setMemberToRemove(null)
        await loadData()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to remove member',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  // Filter members
  const filteredMembers = members.filter((member) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    // Role filter
    const matchesRole = roleFilter === 'all' || member.role === roleFilter

    // Department filter
    const matchesDepartment = departmentFilter === 'all' || member.department_id === departmentFilter

    return matchesSearch && matchesRole && matchesDepartment
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'manager':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'member':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'viewer':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'pending_activation':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }



  const canRemove = (member: any) => {
    // Cannot remove owner
    if (member.role === 'owner') return false
    // Cannot remove self (handled by UI usually, but good check)
    if (member.user_id === user?.id) return false

    // Owner can remove anyone (except other owners if singular, but logic here says owner simply returns false above for target)
    // Actually, owner check above is for TARGET.

    if (isOwner) return true
    if (isAdmin) return !['owner', 'admin'].includes(member.role)

    // Manager can remove members and viewers
    if (currentOrganization?.member_role === 'manager') {
      return ['member', 'viewer'].includes(member.role)
    }

    return false
  }
  // Fetch all available permissions to build the UI structure
  const fetchAllPermissionsStructure = async () => {
    try {
      const response = await governanceAPI.invitations.getAllPermissions()
      if (response.success && response.data) {
        const internalData = response.data.data || response.data
        if (internalData && typeof internalData === 'object' && !Array.isArray(internalData)) {
          let permissionKeys: string[] = []

          // Check if this is a role-keyed object (contains 'owner', 'admin', etc.)
          // or a direct permission object (contains 'can_manage_...')
          const keys = Object.keys(internalData)
          const hasRoleKeys = keys.includes('owner') || keys.includes('admin')

          if (hasRoleKeys) {
            // It's a map of roles. We want the union of all permissions, or just owner's since owner usually has all.
            // Let's collect from all to be safe.
            const allKeys = new Set<string>()
            Object.values(internalData).forEach((rolePerms: any) => {
              if (rolePerms && typeof rolePerms === 'object') {
                Object.keys(rolePerms).forEach(k => {
                  if (k !== 'allowed_agents') allKeys.add(k)
                })
              }
            })
            permissionKeys = Array.from(allKeys)
          } else {
            // It's likely already the flat permission object
            permissionKeys = keys.filter(k => k !== 'allowed_agents')
          }

          const formatLabel = (key: string) => {
            return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          }

          const groups: Record<string, any[]> = {
            'Manage': [],
            'View': [],
            'Create': [],
            'Delete': [],
            'Other': []
          }

          permissionKeys.forEach(key => {
            const node = {
              id: key,
              label: formatLabel(key),
              description: formatLabel(key)
            }

            if (key.startsWith('can_manage_')) groups['Manage'].push(node)
            else if (key.startsWith('can_view_')) groups['View'].push(node)
            else if (key.startsWith('can_create_')) groups['Create'].push(node)
            else if (key.startsWith('can_delete_')) groups['Delete'].push(node)
            else groups['Other'].push(node)
          })

          const newStructure = Object.entries(groups)
            .filter(([_, children]) => children.length > 0)
            .map(([groupName, children]) => ({
              id: groupName.toLowerCase(),
              label: groupName + ' Permissions',
              description: `Permissions related to ${groupName.toLowerCase()} operations`,
              children: children
            }))

          setPermissionStructure(newStructure)
        }
      }
    } catch (error) {
      console.error("Failed to fetch permission structure", error)
    }
  }

  const fetchRoleDefaults = async (role: string) => {
    try {
      const response = await governanceAPI.invitations.getPermissions(role)
      if (response.success && response.data) {
        const internalData = response.data.data || response.data
        if (internalData && typeof internalData === 'object' && !Array.isArray(internalData)) {
          const permissionKeys = Object.keys(internalData).filter(k => k !== 'allowed_agents')
          // Extract defaults (keys with true values)
          const defaults = permissionKeys.filter(key => internalData[key] === true)
          setInvitePermissions(defaults)
        }
      }
    } catch (error) {
      console.error("Failed to fetch role defaults", error)
      toast({
        title: "Error",
        description: "Failed to load role permissions",
        variant: "destructive",
        duration: 2000
      })
    }
  }

  const fetchPermissions = async (role: string) => {
    // Only fetch structure if it's empty
    if (permissionStructure.length === 0) {
      await fetchAllPermissionsStructure()
    }

    if (role === 'custom') {
      setInvitePermissions([])
    } else {
      await fetchRoleDefaults(role)
    }
  }

  const togglePermission = (permissionId: string) => {
    setInvitePermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  const handleInviteRoleChange = (role: string) => {
    setInviteRole(role)
    fetchPermissions(role)
  }

  // Initial fetch when dialog opens
  useEffect(() => {
    if (inviteDialogOpen) {
      fetchPermissions(inviteRole)
    }
  }, [inviteDialogOpen])

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
        <Users className="h-12 w-12 text-gray-400 mb-4" />
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
          void loadExternalMembers()
        }
      }}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="own">Own Organization</TabsTrigger>
          <TabsTrigger value="external">External Organizations</TabsTrigger>
        </TabsList>

        <TabsContent value="own" className="space-y-6">
          {isOwner ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <CardTitle>Members</CardTitle>
                      </div>
                      <CardDescription>
                        Manage organization members and their roles
                      </CardDescription>
                    </div>
                    {(canManage || currentOrganization.permissions?.can_create_invitations || currentOrganization.permissions?.can_invite_members) && (
                      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>Invite Member</DialogTitle>
                            <DialogDescription>
                              Send an invitation to join your organization
                            </DialogDescription>
                          </DialogHeader>
                          <div className="w-full">
                            <div className="py-2">
                              <Tabs defaultValue="user" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="user">User</TabsTrigger>
                                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                                </TabsList>
                                <TabsContent value="user" className="space-y-4 pt-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="invite-email">Email Address</Label>
                                    <Input
                                      id="invite-email"
                                      type="email"
                                      placeholder="user@example.com"
                                      value={inviteEmail}
                                      onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="invite-role">Role</Label>
                                    <Select value={inviteRole} onValueChange={handleInviteRoleChange}>
                                      <SelectTrigger id="invite-role">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="invite-department">Department</Label>
                                    <Select value={inviteDepartment} onValueChange={setInviteDepartment}>
                                      <SelectTrigger id="invite-department">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments.map((dept) => (
                                          <SelectItem key={dept.department_id} value={dept.department_id}>
                                            {dept.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TabsContent>
                                <TabsContent value="permissions" className="pt-4">
                                  <ScrollArea className="h-[300px] w-full border rounded-md p-4">
                                    <div className="space-y-4">
                                      {permissionStructure.map((group) => (
                                        <div key={group.id} className="space-y-2">
                                          <div className="flex items-start space-x-2">
                                            <Checkbox
                                              id={group.id}
                                              checked={
                                                group.children && group.children.length > 0
                                                  ? group.children.every((child: any) => invitePermissions.includes(child.id))
                                                  : invitePermissions.includes(group.id)
                                              }
                                              onCheckedChange={(checked) => {
                                                if (group.children && group.children.length > 0) {
                                                  const childIds = group.children.map((c: any) => c.id)
                                                  if (checked) {
                                                    // Add all missing children
                                                    setInvitePermissions(prev => [...Array.from(new Set([...prev, ...childIds]))])
                                                  } else {
                                                    // Remove all children
                                                    setInvitePermissions(prev => prev.filter(id => !childIds.includes(id)))
                                                  }
                                                } else {
                                                  togglePermission(group.id)
                                                }
                                              }}
                                              className="mt-1"
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                              <label
                                                htmlFor={group.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                              >
                                                {group.label}
                                              </label>
                                              <p className="text-sm text-muted-foreground">
                                                {group.description}
                                              </p>
                                            </div>
                                          </div>
                                          {group.children && (
                                            <div className="pl-6 space-y-2">
                                              {group.children.map((child: any) => (
                                                <div key={child.id} className="flex items-start space-x-2">
                                                  <Checkbox
                                                    id={child.id}
                                                    checked={invitePermissions.includes(child.id)}
                                                    onCheckedChange={() => togglePermission(child.id)}
                                                    className="mt-1"
                                                  />
                                                  <div className="grid gap-1.5 leading-none">
                                                    <label
                                                      htmlFor={child.id}
                                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                      {child.label}
                                                    </label>
                                                    <p className="text-sm text-muted-foreground">
                                                      {child.description}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                              {inviting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Invitation
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
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search members..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full md:w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-full md:w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.department_id} value={dept.department_id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Members Table */}
                  {orgLoading || loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : !currentOrganization ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No organization selected. Please select or create an organization first.
                      </p>
                      <a href="/settings/organization/new">
                        <Button>
                          Create Organization
                        </Button>
                      </a>
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchQuery || roleFilter !== 'all' || departmentFilter !== 'all'
                          ? 'No members found matching your filters'
                          : 'No members yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.map((member) => {
                            const department = departments.find(d => d.department_id === member.department_id)
                            console.log('Member value:', member)
                            console.log(`Checking canRemove for ${member.role}:`, { isOwner, isAdmin, result: canRemove(member) })

                            return (
                              <TableRow key={member.member_id} className="hover:bg-transparent">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar
                                      size={32}
                                      name={member?.user?.email || member.user_id}
                                      variant="marble"
                                      colors={['#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#F9FAFB']}
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {member?.user?.display_name || member?.user?.email?.split('@')[0] || 'Unknown'}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {member?.user?.email || 'No email'}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(member.role)}>
                                    {member.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {department?.name || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadgeColor(member.status)}>
                                    {member.status?.replace('_', ' ') || 'unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(member.created_at).toLocaleDateString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {canRemove(member) && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => setMemberToRemove(member)}
                                          className="text-red-600 dark:text-red-400"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remove Member
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Remove Member Confirmation */}
              <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove <strong>{memberToRemove?.user?.email}</strong> from
                      the organization? They will lose access to all organization resources.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
                      Remove Member
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You do not have permission to view other members in this external organization.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="external">
          {externalOrgs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                  const canInvite = !!perms.can_manage_members
                  const orgMembers = externalMembers.filter(m => m.organization_id === org.organization_id)

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
                          {canInvite && (
                            <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Member
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!canInvite ? (
                          <div className="text-center py-8">
                            <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              You don't have permission to view members in this organization.
                            </p>
                          </div>
                        ) : orgMembers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No members found.</p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Member</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Joined</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {orgMembers.map((member) => (
                                  <TableRow key={`${member.organization_id}-${member.member_id}`}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar
                                          size={32}
                                          name={member?.user?.email || member.user_id}
                                          variant="marble"
                                          colors={['#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#F9FAFB']}
                                        />
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            {member?.user?.display_name || member?.user?.email?.split('@')[0] || 'Unknown'}
                                          </div>
                                          <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {member?.user?.email || 'No email'}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getRoleBadgeColor(member.role)}>{member.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getStatusBadgeColor(member.status)}>
                                        {member.status?.replace('_', ' ') || 'Active'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(member.created_at).toLocaleDateString()}
                                      </span>
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
                <Button variant="outline" size="sm" onClick={() => loadExternalMembers()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div >
  )
}
