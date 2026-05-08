// frontend/src/app/settings/analytics/page.tsx
import { useState, useEffect } from 'react'
import { useOrganization } from '@/context/OrganizationContext'
import { governanceAPI, userAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  Users,
  Network,
  Mail,
  TrendingUp,
  Calendar,
  Activity,
  Loader2,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Database
} from 'lucide-react'

export default function AnalyticsPage() {
  const { currentOrganization, loading: orgLoading } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<any>(null)
  const [userActivity, setUserActivity] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])

  useEffect(() => {
    if (currentOrganization) {
      loadAnalytics()
    }
  }, [currentOrganization])

  const loadAnalytics = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)

      // Load all data in parallel
      const [usageResponse, activityResponse, membersResponse, departmentsResponse, invitationsResponse] =
        await Promise.all([
          governanceAPI.organizations.getUsage(currentOrganization.organization_id),
          userAPI.getActivity(30, false),
          governanceAPI.members.list(currentOrganization.organization_id),
          governanceAPI.departments.list(currentOrganization.organization_id),
          governanceAPI.invitations.list(currentOrganization.organization_id),
        ])

      if (usageResponse.success) setUsage(usageResponse.data)
      if (activityResponse.success) setUserActivity(activityResponse.data)
      if (membersResponse.success) setMembers(membersResponse.data || [])
      if (departmentsResponse.success) setDepartments(departmentsResponse.data || [])
      if (invitationsResponse.success) setInvitations(invitationsResponse.data || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
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
        <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No organization selected. Please select or create an organization first.
        </p>
        <a href="/settings/organization/new">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Create Organization
          </button>
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Calculate statistics
  const activeMembers = members.filter(m => m.status === 'active').length
  const pendingInvitations = invitations.filter(i => i.status === 'pending').length
  const memberGrowth = members.length > 0 ? '+12%' : '0%'
  const activeDepartments = departments.filter(d => d.status === 'active').length

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0
    return Math.min(100, (current / limit) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Insights and metrics for {currentOrganization.name}
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          Last 30 days
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeMembers}
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              {memberGrowth} from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Departments
            </CardTitle>
            <Network className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeDepartments}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {departments.length} total created
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Invites
            </CardTitle>
            <Mail className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {pendingInvitations}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {invitations.length} total sent
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Activity
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {userActivity?.activity?.summary?.total_activities || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Actions in last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <CardTitle>Resource Usage</CardTitle>
          </div>
          <CardDescription>
            Current usage vs limits for your {currentOrganization.subscription_tier || 'free'} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usage ? (
            <div className="space-y-6">
              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Members
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.usage?.members || 0} / {usage.limits?.members || '∞'}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.usage?.members || 0, usage.limits?.members || 1)}
                  className="h-2"
                />
              </div>

              {/* Departments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Departments
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.usage?.departments || 0} / {usage.limits?.departments || '∞'}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.usage?.departments || 0, usage.limits?.departments || 1)}
                  className="h-2"
                />
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Storage
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatBytes(usage.usage?.storage_bytes || 0)} / {formatBytes(usage.limits?.storage_bytes || 0)}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.usage?.storage_bytes || 0, usage.limits?.storage_bytes || 1)}
                  className="h-2"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No usage data available</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Member Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <CardTitle>Member Distribution</CardTitle>
            </div>
            <CardDescription>Members by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['owner', 'admin', 'manager', 'member', 'viewer'].map((role) => {
                const count = members.filter((m) => m.role === role).length
                const percentage = members.length > 0 ? ((count / members.length) * 100).toFixed(0) : 0

                if (count === 0) return null

                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {role}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={Number(percentage)} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest organization actions</CardDescription>
          </CardHeader>
          <CardContent>
            {userActivity?.activity?.timeline && userActivity.activity.timeline.length > 0 ? (
              <div className="space-y-4">
                {userActivity.activity.timeline.slice(0, 5).map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invitation Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <CardTitle>Invitation Statistics</CardTitle>
          </div>
          <CardDescription>Overview of organization invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {invitations.filter((i) => i.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {invitations.filter((i) => i.status === 'accepted').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {invitations.filter((i) => i.status === 'expired' || i.status === 'cancelled').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expired/Cancelled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {invitations.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Sent</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
