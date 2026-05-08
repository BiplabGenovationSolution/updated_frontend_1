// frontend/src/app/settings/organization/page.tsx
import { useState, useEffect } from 'react'
import { useOrganization } from '@/context/OrganizationContext'
import { governanceAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  Building2,
  CreditCard,
  Users,
  Database,
  HardDrive,
  AlertTriangle,
  Loader2,
  Save,
  Trash2,
  Network,
  Activity,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Role → default permissions mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['read', 'write', 'delete', 'manage_members', 'manage_billing', 'manage_settings'],
  admin: ['read', 'write', 'delete', 'manage_members', 'manage_settings'],
  manager: ['read', 'write', 'delete', 'manage_members'],
  member: ['read', 'write'],
  viewer: ['read'],
}

interface PasswordCriteria {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export default function OrganizationSettingsPage() {
  const {
    currentOrganization,
    organizations,
    isOwner,
    isAdmin,
    refreshOrganizations,
    loading: orgLoading
  } = useOrganization()

  const canEdit = isOwner || isAdmin

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Delete org state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [usage, setUsage] = useState<any>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')

  // ── New Member dialog state ────────────────────────────────────────
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false)
  const [memberCreating, setMemberCreating] = useState(false)

  const [memberEmail, setMemberEmail] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberConfirmPassword, setMemberConfirmPassword] = useState('')
  const [memberDisplayName, setMemberDisplayName] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [memberDepartmentId, setMemberDepartmentId] = useState('')
  const [memberPermissions, setMemberPermissions] = useState<string[]>(ROLE_PERMISSIONS['member'])
  const [memberStatus, setMemberStatus] = useState<'active' | 'inactive'>('active')
  const [showMemberPassword, setShowMemberPassword] = useState(false)
  const [showMemberConfirmPassword, setShowMemberConfirmPassword] = useState(false)

  // Departments for the dropdown
  const [departments, setDepartments] = useState<Array<{ department_id: string; name: string }>>([]
  )
  const [departmentsLoading, setDepartmentsLoading] = useState(false)

  const [memberPasswordCriteria, setMemberPasswordCriteria] = useState<PasswordCriteria>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

  // Real-time password validation
  useEffect(() => {
    setMemberPasswordCriteria({
      minLength: memberPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(memberPassword),
      hasLowerCase: /[a-z]/.test(memberPassword),
      hasNumber: /\d/.test(memberPassword),
      hasSpecialChar: /[@$!%*?&]/.test(memberPassword),
    })
  }, [memberPassword])

  const isMemberPasswordValid = Object.values(memberPasswordCriteria).every(Boolean)
  const memberPasswordsMatch = memberPassword === memberConfirmPassword && memberPassword !== ''

  // Password strength
  const getMemberPasswordStrength = () => {
    const met = Object.values(memberPasswordCriteria).filter(Boolean).length
    if (met <= 1) return { score: 1, label: 'Very Weak', color: 'bg-red-500' }
    if (met <= 2) return { score: 2, label: 'Weak', color: 'bg-orange-500' }
    if (met <= 3) return { score: 3, label: 'Fair', color: 'bg-yellow-500' }
    if (met <= 4) return { score: 4, label: 'Good', color: 'bg-blue-500' }
    return { score: 5, label: 'Strong', color: 'bg-green-500' }
  }
  const memberStrength = getMemberPasswordStrength()

  // Auto-fill permissions when role changes
  const handleMemberRoleChange = (role: string) => {
    setMemberRole(role)
    setMemberPermissions(ROLE_PERMISSIONS[role] ?? [])
  }

  const resetNewMemberForm = () => {
    setMemberEmail('')
    setMemberPassword('')
    setMemberConfirmPassword('')
    setMemberDisplayName('')
    setMemberRole('member')
    setMemberDepartmentId('')
    setMemberPermissions(ROLE_PERMISSIONS['member'])
    setMemberStatus('active')
    setShowMemberPassword(false)
    setShowMemberConfirmPassword(false)
  }

  const openNewMemberDialog = async () => {
    resetNewMemberForm()
    setIsNewMemberOpen(true)
    if (!currentOrganization) return
    try {
      setDepartmentsLoading(true)
      const res = await governanceAPI.departments.list(currentOrganization.organization_id)
      if (res.success && res.data) {
        setDepartments(res.data as Array<{ department_id: string; name: string }>)
      }
    } catch {
      // silently fail — department dropdown is optional
    } finally {
      setDepartmentsLoading(false)
    }
  }

  const handleCreateMember = async () => {
    if (!currentOrganization) return

    if (!memberEmail.trim() || !memberDisplayName.trim()) {
      toast({ 
        
        title: 'Validation Error', 
        description: 'Email and Display Name are required', 
        variant: 'destructive' ,
        duration: 2000  
      })
      return
    }

    if (!isMemberPasswordValid) {
      toast({ 
        
        title: 'Weak Password', 
        description: 'Please ensure all password requirements are met.', 
        variant: 'destructive' ,
        duration: 2000
      })
      return
    }

    if (!memberPasswordsMatch) {
      toast({ 
        title: 'Validation Error', 
        description: 'Passwords do not match', 
        variant: 'destructive' ,
        duration: 2000
      })
      return
    }

    try {
      setMemberCreating(true)
      const payload: any = {
        email: memberEmail.trim(),
        password: memberPassword,
        display_name: memberDisplayName.trim(),
        role: memberRole,
        permissions: memberPermissions,
        status: memberStatus,
      }
      if (memberDepartmentId && memberDepartmentId !== 'none') {
        payload.department_id = memberDepartmentId
      }

      const response = await governanceAPI.organizations.createUser(
        currentOrganization.organization_id,
        payload
      )

      if (response.success) {
        toast({ 
          title: 'Member Created', 
          description: `${memberDisplayName} has been added to your organization.` ,
          duration: 2000  
        })
        setIsNewMemberOpen(false)
        resetNewMemberForm()
      } else {
        toast({ 
          title: 'Error', 
          description: response.error || 'Failed to create member', 
          variant: 'destructive' ,
          duration: 2000
        })
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to create member', 
        variant: 'destructive' ,
        duration: 2000
      })
    } finally {
      setMemberCreating(false)
    }
  }
  // ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentOrganization) {
      setName(currentOrganization.name)
      setSlug(currentOrganization.slug)
    }
  }, [currentOrganization])

  useEffect(() => {
    if (currentOrganization && (canEdit || currentOrganization.permissions?.can_view_usage)) {
      loadUsageData()
    }
  }, [currentOrganization, canEdit])


  // Filter for external organizations (where I am a member but not the owner)
  const externalOrgs = organizations.filter(
    org => org.member_role !== 'owner'
  )

  const loadUsageData = async () => {
    if (!currentOrganization || !canEdit) return

    try {
      setLoading(true)
      const response = await governanceAPI.organizations.getUsage(currentOrganization.organization_id)

      if (response.success && response.data) {
        setUsage(response.data)
      }
    } catch (error) {
      console.error('Failed to load usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentOrganization) return

    try {
      setSaving(true)
      const response = await governanceAPI.organizations.update(
        currentOrganization.organization_id,
        { name }
      )

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Organization settings updated',
          duration: 2000
        })
        await refreshOrganizations()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update organization',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setSaving(false)
    }
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
        <Building2 className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No organization selected. Please select or create an organization first.
        </p>
        <a href="/settings/organization/new">
          <Button>
            <Building2 className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </a>
      </div>
    )
  }

  const tier = currentOrganization.subscription_tier || 'free'
  const status = currentOrganization.subscription_status || 'active'

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'business':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'team':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'trial':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="own" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="own">Own Organization</TabsTrigger>
          <TabsTrigger value="external">External Organizations</TabsTrigger>
        </TabsList>

        <TabsContent value="own" className="space-y-6">
          {isOwner ? (
            <>
              {/* Organization Profile */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <CardTitle>Organization Profile</CardTitle>
                  </div>
                  <CardDescription>
                    Basic information about your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Organization"
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="org-slug">Slug (URL)</Label>
                      <Input
                        id="org-slug"
                        value={slug}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500">
                        Slug cannot be changed after creation
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-description">Description</Label>
                    <Textarea
                      id="org-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your organization..."
                      rows={3}
                      disabled={!canEdit}
                    />
                  </div>

                  {canEdit && (
                    <div className="flex justify-end items-center gap-2">
                      {/* ── New Member button ── */}
                      <Button
                        variant="secondary"
                        onClick={openNewMemberDialog}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        New Member
                      </Button>

                      {/* ── Save Changes button ── */}
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <CardTitle>Subscription</CardTitle>
                  </div>
                  <CardDescription>
                    Your current subscription plan and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Plan:</span>
                        <Badge className={getTierColor(tier)}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <Badge className={getStatusColor(status)}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    {isOwner && (
                      <Button variant="outline">
                        Upgrade Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage Statistics */}
              {(canEdit || currentOrganization?.permissions?.can_view_usage) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-gray-500" />
                      <CardTitle>Usage Statistics</CardTitle>
                    </div>
                    <CardDescription>
                      Current usage and limits for your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : usage ? (
                      <div className="grid gap-4 md:grid-cols-4">
                        {/* Members */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>Members</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {usage.usage?.current_members || 0}
                            <span className="text-sm text-gray-500 font-normal ml-1">
                              / {usage.limits?.max_members || '∞'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((usage.usage?.current_members || 0) / (usage.limits?.max_members || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Departments */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Network className="h-4 w-4" />
                            <span>Departments</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {usage.usage?.current_departments || 0}
                            <span className="text-sm text-gray-500 font-normal ml-1">
                              / {usage.limits?.max_departments || '∞'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((usage.usage?.current_departments || 0) / (usage.limits?.max_departments || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Storage */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <HardDrive className="h-4 w-4" />
                            <span>Storage</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {formatBytes(usage.usage?.storage_used_gb || 0)}
                            <span className="text-sm text-gray-500 font-normal ml-1">
                              / {formatBytes(usage.limits?.storage_gb || 0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((usage.usage?.storage_used_gb || 0) / (usage.limits?.storage_gb || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Api Calls */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Activity className="h-4 w-4" />
                            <span>Api Calls</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {usage.usage?.api_calls_today || 0}
                            <span className="text-sm text-gray-500 font-normal ml-1">
                              / {usage.limits?.api_calls_per_day || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((usage.usage?.api_calls_today || 0) / (usage.limits?.api_calls_per_day || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No usage data available</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Danger Zone */}
              {isOwner && (
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    </div>
                    <CardDescription>
                      Irreversible actions that will affect your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Delete Organization</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Permanently delete this organization and all its data
                        </p>
                      </div>
                      <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>

                      {/* Delete Confirmation Dialog */}
                      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600 dark:text-red-400">
                              Delete Organization
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <div className="space-y-3">
                                <p>
                                  This action <strong>cannot be undone</strong>. This will permanently delete the
                                  {' '}<strong>{currentOrganization?.name}</strong> organization, including all
                                  members, departments, and associated data.
                                </p>
                                <p className="text-sm">
                                  Type <strong>{currentOrganization?.name}</strong> to confirm:
                                </p>
                                <Input
                                  value={deleteConfirmText}
                                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                                  placeholder={currentOrganization?.name}
                                  autoComplete="off"
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={deleteConfirmText !== currentOrganization?.name || deleting}
                              onClick={async (e) => {
                                e.preventDefault()
                                if (!currentOrganization) return
                                try {
                                  setDeleting(true)
                                  const res = await governanceAPI.organizations.delete(currentOrganization.organization_id)
                                  if (res.success) {
                                    toast({ 
                                      title: 'Organization deleted', 
                                      description: `${currentOrganization.name} has been permanently deleted.` ,
                                      duration: 2000
                                    })
                                    setDeleteDialogOpen(false)
                                    setDeleteConfirmText('')
                                    await refreshOrganizations()
                                    window.location.href = '/settings/organization'
                                  } else {
                                    toast({ 
                                      title: 'Error', 
                                      description: res.error || 'Failed to delete organization', 
                                      variant: 'destructive' ,
                                      duration: 2000
                                    })
                                  }
                                } catch (err) {
                                  toast({ 
                                    title: 'Error', 
                                    description: 'Failed to delete organization', 
                                    variant: 'destructive' ,
                                    duration: 2000
                                  })
                                } finally {
                                  setDeleting(false)
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              {deleting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                              ) : (
                                <><Trash2 className="h-4 w-4 mr-2" />Delete Organization</>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>External Organizations</CardTitle>
                  <CardDescription>
                    Other organizations you are a member of
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refreshOrganizations()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {externalOrgs.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    You are not a member of any other organizations
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {externalOrgs.map((org) => (
                        <TableRow key={org.organization_id}>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {org.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {org.slug}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {org.member_role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTierColor(org.subscription_tier || 'free')}>
                              {org.subscription_tier || 'Free'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(org.subscription_status || 'active')}>
                              {org.subscription_status || 'Active'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══ New Member Dialog ════════════════════════════════════════════ */}
      <Dialog
        open={isNewMemberOpen}
        onOpenChange={(open) => {
          setIsNewMemberOpen(open)
          if (!open) resetNewMemberForm()
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Member
            </DialogTitle>
            <DialogDescription>
              Create a new user account and add them to{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {currentOrganization?.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="member-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="member-email"
                type="email"
                autoComplete="off"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="member-display-name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="member-display-name"
                type="text"
                autoComplete="off"
                value={memberDisplayName}
                onChange={(e) => setMemberDisplayName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="member-password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="member-password"
                  type={showMemberPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="Enter password"
                  className={cn(
                    'pr-10',
                    memberPassword && !isMemberPasswordValid
                      ? 'border-red-300 focus-visible:ring-red-300'
                      : ''
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowMemberPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showMemberPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength meter */}
              {memberPassword && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Strength</span>
                    <span className={cn('font-medium', memberStrength.color.replace('bg-', 'text-'))}>
                      {memberStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-300', memberStrength.color)}
                      style={{ width: `${(memberStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Criteria checklist */}
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Password must match:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {[
                    { key: 'minLength', label: 'At least 8 characters' },
                    { key: 'hasUpperCase', label: 'One uppercase letter' },
                    { key: 'hasLowerCase', label: 'One lowercase letter' },
                    { key: 'hasNumber', label: 'One number' },
                    { key: 'hasSpecialChar', label: 'One special char (@$!%*?&)' },
                  ].map(({ key, label }) => {
                    const met = memberPasswordCriteria[key as keyof PasswordCriteria]
                    return (
                      <div
                        key={key}
                        className={cn(
                          'flex items-center gap-1.5 transition-colors',
                          met ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {met
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : <div className="h-3.5 w-3.5 rounded-full border border-current opacity-40 shrink-0" />
                        }
                        {label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="member-confirm-password">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="member-confirm-password"
                  type={showMemberConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={memberConfirmPassword}
                  onChange={(e) => setMemberConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={cn(
                    'pr-10',
                    memberConfirmPassword && !memberPasswordsMatch
                      ? 'border-red-300 focus-visible:ring-red-300'
                      : memberConfirmPassword && memberPasswordsMatch
                        ? 'border-green-300 focus-visible:ring-green-300'
                        : ''
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowMemberConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showMemberConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {memberConfirmPassword && !memberPasswordsMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Role & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Select value={memberRole} onValueChange={handleMemberRoleChange}>
                  <SelectTrigger id="member-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-status">Status</Label>
                <Select value={memberStatus} onValueChange={(v) => setMemberStatus(v as 'active' | 'inactive')}>
                  <SelectTrigger id="member-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="member-department">Department</Label>
              <Select
                value={memberDepartmentId}
                onValueChange={setMemberDepartmentId}
              >
                <SelectTrigger id="member-department" disabled={departmentsLoading}>
                  {departmentsLoading
                    ? <span className="flex items-center gap-2 text-gray-400"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading departments...</span>
                    : <SelectValue placeholder="Select department" />
                  }
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 && !departmentsLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-400">No departments found</div>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.department_id} value={dept.department_id}>
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-selected Permissions */}
            <div className="space-y-2">
              <Label>Permissions</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Auto-selected based on role. Choosing a different role updates these.
              </p>
              <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border min-h-[40px]">
                {memberPermissions.length === 0 ? (
                  <span className="text-xs text-gray-400">No permissions</span>
                ) : (
                  memberPermissions.map((perm) => (
                    <Badge
                      key={perm}
                      variant="secondary"
                      className="text-xs capitalize"
                    >
                      {perm.replace(/_/g, ' ')}
                    </Badge>
                  ))
                )}
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewMemberOpen(false)
                resetNewMemberForm()
              }}
              disabled={memberCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateMember} disabled={memberCreating}>
              {memberCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
