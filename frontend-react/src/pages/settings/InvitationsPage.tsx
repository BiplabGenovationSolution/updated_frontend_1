// frontend/src/app/settings/invitations/page.tsx
import { useState, useEffect } from 'react'
import { useOrganization } from '@/context/OrganizationContext'
import { governanceAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import {
  Mail,
  Loader2,
  MoreVertical,
  RefreshCw,
  XCircle,
  Clock,
  CheckCircle,
  Copy
} from 'lucide-react'

export default function InvitationsPage() {
  const { currentOrganization, canManage, loading: orgLoading, refreshOrganizations, setCurrentOrganization } = useOrganization()
  const [invitations, setInvitations] = useState<any[]>([])
  const [myInvitations, setMyInvitations] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization) {
      loadData()
    }
    loadMyInvitations()
  }, [currentOrganization])

  const loadMyInvitations = async () => {
    try {
      const response = await governanceAPI.invitations.getMyInvitations()
      if (response.success && response.data) {
        setMyInvitations(response.data)
      }
    } catch (error) {
      console.error("Failed to load my invitations", error)
    }
  }

  const loadData = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)

      const [invitationsResponse, departmentsResponse] = await Promise.all([
        governanceAPI.invitations.list(currentOrganization.organization_id),
        governanceAPI.departments.list(currentOrganization.organization_id),
      ])

      if (invitationsResponse.success && invitationsResponse.data) {
        setInvitations(invitationsResponse.data)
      }

      if (departmentsResponse.success && departmentsResponse.data) {
        setDepartments(departmentsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (invitation: any) => {
    try {
      const response = await governanceAPI.invitations.resend(invitation.invitation_id)

      if (response.success) {
        toast({
          title: 'Success',
          description: `Invitation resent to ${invitation.email}`,
          duration: 2000
        })
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to resend invitation',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleCancel = async (invitation: any) => {
    if (!confirm(`Cancel invitation to ${invitation.email}?`)) {
      return
    }

    try {
      const response = await governanceAPI.invitations.cancel(invitation.invitation_id)

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Invitation cancelled',
          duration: 2000
        })
        await loadData()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to cancel invitation',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleCopyLink = (invitation: any) => {
    const link = `${window.location.origin}/invitations/accept/${invitation.token}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Copied',
      description: 'Invitation link copied to clipboard',
      duration
    })
  }

  const handleAccept = async (invitation: any) => {
    const token = invitation?.token
    if (!token) return

    try {
      const response = await governanceAPI.invitations.acceptInvitation(token)
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Invitation accepted successfully',
          duration: 2000  
        })

        // Refresh organizations list to get the new membership
        await refreshOrganizations()

        // Find and switch to the new organization
        try {
          // We fetch the list again directly to ensure we have the latest data immediately available to find the new org
          const orgsResponse = await governanceAPI.organizations.list()
          if (orgsResponse.success && orgsResponse.data) {
            const newOrg = orgsResponse.data.find((org: any) => org.organization_id === invitation.organization_id)
            if (newOrg) {
              setCurrentOrganization(newOrg)
              toast({
                title: 'Organization Switched',
                description: `You remain now in ${newOrg.name}`,
                duration: 2000
              })
            }
          }
        } catch (switchError) {
          console.error("Failed to switch organization automatically", switchError)
        }

        loadMyInvitations()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to accept invitation',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'accepted':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'expired':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff < 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} remaining`
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} remaining`
    return 'Less than 1 hour remaining'
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }



  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !isExpired(inv.expires_at))
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending' || isExpired(inv.expires_at))

  return (
    <div className="space-y-6">
      <Tabs defaultValue={currentOrganization ? "pending" : "by_org"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
          <TabsTrigger value="by_org">Invitations by Org</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-6">
          {!currentOrganization ? (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card text-card-foreground shadow-sm">
              <Mail className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No organization selected. Please select or create an organization to view pending invitations.
              </p>
              <a href="/settings/organization/new">
                <Button>
                  Create Organization
                </Button>
              </a>
            </div>
          ) : (
            <>
              {/* Pending Invitations */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <CardTitle>Pending Invitations</CardTitle>
                  </div>
                  <CardDescription>
                    Active invitations waiting to be accepted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : pendingInvitations.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No pending invitations
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Invited By</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingInvitations.map((invitation) => {
                            console.log(invitation)
                            const department = departments.find(d => d.department_id === invitation.department_id)
                            const expired = isExpired(invitation.expires_at)

                            return (
                              <TableRow key={invitation.invitation_id}>
                                <TableCell>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {invitation.email}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(invitation.role)}>
                                    {invitation.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {department?.name || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {invitation.invited_by?.display_name || invitation.invited_by?.email?.split('@')[0] || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className={expired ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}>
                                      {formatTimeRemaining(invitation.expires_at)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadgeColor(expired ? 'expired' : invitation.status)}>
                                    {expired ? 'expired' : invitation.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {canManage && !expired && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleCopyLink(invitation)}>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy Link
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleResend(invitation)}>
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          Resend Email
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleCancel(invitation)}
                                          className="text-red-600 dark:text-red-400"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Cancel
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

              {/* History */}
              {otherInvitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Invitation History</CardTitle>
                    <CardDescription>
                      Accepted, expired, and cancelled invitations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {otherInvitations.map((invitation) => {
                            const department = departments.find(d => d.department_id === invitation.department_id)
                            const expired = isExpired(invitation.expires_at)
                            const status = expired && invitation.status === 'pending' ? 'expired' : invitation.status

                            return (
                              <TableRow key={invitation.invitation_id}>
                                <TableCell>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {invitation.email}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(invitation.role)}>
                                    {invitation.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {department?.name || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadgeColor(status)}>
                                    {status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(invitation.created_at).toLocaleDateString()}
                                  </span>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="by_org" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitations by Organization</CardTitle>
              <CardDescription>
                Invitations you have received from other organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No invitations found
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Organization Name</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myInvitations.map((inv) => {
                        const expired = isExpired(inv.expires_at)
                        return (
                          <TableRow key={inv.invitation_id}>
                            <TableCell>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {inv?.invited_by?.name || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {inv?.invited_by?.email || 'Unknown'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {inv.organization_name || 'Demo Org'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={expired ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}>
                                {formatTimeRemaining(inv.expires_at)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(expired ? 'expired' : inv.status)}>
                                {expired ? 'expired' : inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {inv.status === 'pending' && !expired && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleAccept(inv)}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Accept
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
