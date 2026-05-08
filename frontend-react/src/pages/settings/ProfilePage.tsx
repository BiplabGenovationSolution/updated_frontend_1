// frontend/src/app/settings/profile/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { userAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  User, Mail, Loader2, Save, Camera, Upload,
  MessageSquare, Activity, Clock,
  Shield, CheckCircle2, LogOut, ArrowLeft
} from 'lucide-react'
import Avatar from 'boring-avatars'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeProvider'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Plot from 'react-plotly.js'
import {
  BarChart3, PieChart, Calendar, Filter,
  Coins, Zap, TrendingUp
} from 'lucide-react'

// Types based on API response
interface UserStatistics {
  user_id: string
  active_chats: number
  total_messages: number
  last_activity: string
  account_created: string
  subscription_tier: string
}

interface RecentChat {
  id: string
  userId: string
  title: string
  agentType: string
  status: string
  messageCount: number
  createdAt: string
  updatedAt: string
  lastActivity: string
  metadata: any
}

interface UserProfile {
  user_id: string
  email: string
  display_name: string
  subscription_tier: string
  status: string
  created_at: string
  last_login: string
  email_verified: boolean
  role: string
  profile?: {
    avatar_url?: string
    registration_method?: string
  }
  preferences?: {
    communication_style: string
    notifications_enabled: boolean
  }
  statistics?: UserStatistics
  recent_activity?: {
    recent_chats: RecentChat[]
    last_activity: string
  }
}

interface TokenUsageData {
  success: boolean
  total_usage: {
    total_tokens: number
    total_requests: number
  }
  agent_wise_usage: Array<{
    agent_name: string
    total_tokens: number
    total_requests: number
  }>
  user_wise_usage: Array<{
    user_id: string
    total_tokens: number
  }>
  usages: Array<{
    user_id: string
    organization_id: string | null
    agent_name: string
    model_name: string
    input_tokens: number
    output_tokens: number
    reasoning_tokens: number
    total_tokens: number
    tokens_used: number
    timestamp: string
    metadata: any
  }>
}


export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { backgroundColor, setBackgroundColor } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)


  // Form state
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Real-time validation state
  interface PasswordCriteria {
    minLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }

  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

  useEffect(() => {
    setPasswordCriteria({
      minLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecialChar: /[@$!%*?&]/.test(newPassword)
    })
  }, [newPassword])

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean)

  // Password Strength Calculation
  const getPasswordStrength = () => {
    const metCriteria = Object.values(passwordCriteria).filter(Boolean).length
    if (metCriteria <= 1) return { score: 1, label: 'Very Weak', color: 'bg-red-500' }
    if (metCriteria <= 2) return { score: 2, label: 'Weak', color: 'bg-orange-500' }
    if (metCriteria <= 3) return { score: 3, label: 'Fair', color: 'bg-yellow-500' }
    if (metCriteria <= 4) return { score: 4, label: 'Good', color: 'bg-blue-500' }
    return { score: 5, label: 'Strong', color: 'bg-green-500' }
  }

  const strength = getPasswordStrength()
  const passwordsMatch = newPassword === confirmPassword && newPassword !== ''

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Token Usage state
  const [usageData, setUsageData] = useState<TokenUsageData | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('30') // Days

  useEffect(() => {
    loadProfile()
    loadTokenUsage()
  }, [])

  useEffect(() => {
    loadTokenUsage()
  }, [agentFilter, dateRange])

  const loadTokenUsage = async () => {
    try {
      setUsageLoading(true)

      const params: any = {}

      // Only send date params if not using the default 30-day view
      if (dateRange !== '30') {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - parseInt(dateRange))

        params.start_date = start.toISOString()
        params.end_date = end.toISOString()
      }

      if (agentFilter !== 'all') {
        params.agent_name = agentFilter
      }

      const response = await userAPI.getTokenUsage(params)
      if (response.success) {
        setUsageData(response.data)
      }
    } catch (error) {
      console.error('Failed to load token usage:', error)
    } finally {
      setUsageLoading(false)
    }
  }

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getProfile({ include_stats: true, include_activity: true })

      console.log(response)

      if (response.success && response.data) {
        const userData = response.data.user
        setProfile(userData)
        setDisplayName(userData.display_name || '')
        setAvatarUrl(userData.profile?.avatar_url || '')

      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Avatar must be less than 5MB',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setAvatarPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Display name is required',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    try {
      setSaving(true)

      const updateData: any = {
        display_name: displayName.trim(),
      }

      // If there's a new avatar preview, include it
      if (avatarPreview) {
        updateData.profile = {
          avatar_url: avatarPreview,
        }
      }

      const response = await userAPI.updateProfile(updateData)

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          duration: 2000
        })

        // Update local state
        setProfile(response.data.user)
        setAvatarUrl(response.data.user?.profile?.avatar_url || '')
        setAvatarPreview(null)

        // Reload auth context (if needed)
        await loadProfile()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update profile',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    if (!isPasswordValid) {
      toast({
        title: 'Weak Password',
        description: 'Please ensure all password requirements are met.',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    if (!passwordsMatch) {
      toast({
        title: 'Validation Error',
        description: 'New passwords do not match',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    try {
      setPasswordSaving(true)
      const response = await userAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
          duration: 2000
        })
        setIsPasswordDialogOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to change password',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Failed to change password:', error)
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const currentAvatarUrl = avatarPreview || avatarUrl

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const from = (location.state as any)?.from
            if (from) {
              navigate(from)
            } else {
              navigate(-1)
            }
          }}
          className="-ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Manage your personal profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-gray-100 dark:border-gray-800 overflow-hidden">
                      <Avatar
                        size={96}
                        name={user.id || user.email || 'user'}
                        variant="marble"
                        colors={['#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#F9FAFB']}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Profile Picture
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Upload a photo to personalize your account. Max size: 5MB.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                This is how your name will appear across the platform
              </p>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="pl-10 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <p className="text-xs text-gray-500">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>


            {/* Save Button */}
            <div className="flex items-center justify-between pt-4">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" type="button">
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and a new password to update your credentials.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={cn(
                          newPassword && !isPasswordValid ? "border-red-300 focus-visible:ring-red-300" : ""
                        )}
                      />

                      {/* Password Strength Meter */}
                      {newPassword && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Strength</span>
                            <span className={cn("font-medium", strength.color.replace('bg-', 'text-'))}>
                              {strength.label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-300", strength.color)}
                              style={{ width: `${(strength.score / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Password Requirements Checklist */}
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Password must match:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className={cn("flex items-center gap-1.5 transition-colors", passwordCriteria.minLength ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400")}>
                            {passwordCriteria.minLength ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-current opacity-40 shrink-0" />}
                            At least 8 characters
                          </div>
                          <div className={cn("flex items-center gap-1.5 transition-colors", passwordCriteria.hasUpperCase ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400")}>
                            {passwordCriteria.hasUpperCase ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-current opacity-40 shrink-0" />}
                            One uppercase letter
                          </div>
                          <div className={cn("flex items-center gap-1.5 transition-colors", passwordCriteria.hasLowerCase ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400")}>
                            {passwordCriteria.hasLowerCase ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-current opacity-40 shrink-0" />}
                            One lowercase letter
                          </div>
                          <div className={cn("flex items-center gap-1.5 transition-colors", passwordCriteria.hasNumber ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400")}>
                            {passwordCriteria.hasNumber ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-current opacity-40 shrink-0" />}
                            One number
                          </div>
                          <div className={cn("flex items-center gap-1.5 transition-colors", passwordCriteria.hasSpecialChar ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400")}>
                            {passwordCriteria.hasSpecialChar ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-current opacity-40 shrink-0" />}
                            One special character (@$!%*?&)
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={cn(
                          confirmPassword && !passwordsMatch ? "border-red-300 focus-visible:ring-red-300" :
                            confirmPassword && passwordsMatch ? "border-green-300 focus-visible:ring-green-300" : ""
                        )}
                      />
                      {confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                      disabled={passwordSaving}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleChangePassword} disabled={passwordSaving}>
                      {passwordSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.statistics?.total_messages || 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Chats</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.statistics?.active_chats || 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Activity</p>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {profile?.statistics?.last_activity
                    ? new Date(profile.statistics.last_activity).toLocaleDateString()
                    : 'N/A'}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Consumption Section */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle>Token Consumption</CardTitle>
                </div>
                <CardDescription>
                  Track your usage metrics and agent performance over time
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <Filter className="h-3.5 w-3.5 mr-2 opacity-50" />
                    <SelectValue placeholder="Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="analytica">Analytica</SelectItem>
                    <SelectItem value="Aegis">Aegis</SelectItem>
                    <SelectItem value="sophia">Sophia</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[140px] h-9">
                    <Calendar className="h-3.5 w-3.5 mr-2 opacity-50" />
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {usageLoading && !usageData ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Loading consumption data...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Usage Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tokens</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {usageData?.total_usage.total_tokens.toLocaleString() || 0}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20 w-fit px-1.5 py-0.5 rounded">
                      <TrendingUp className="h-3 w-3" />
                      <span>Volume</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Requests</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {usageData?.total_usage.total_requests.toLocaleString() || 0}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/20 w-fit px-1.5 py-0.5 rounded">
                      <MessageSquare className="h-3 w-3" />
                      <span>Traffic</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Tokens / Req</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {usageData?.total_usage.total_requests
                        ? Math.round(usageData.total_usage.total_tokens / usageData.total_usage.total_requests).toLocaleString()
                        : 0}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-purple-600 font-semibold bg-purple-50 dark:bg-purple-900/20 w-fit px-1.5 py-0.5 rounded">
                      <TrendingUp className="h-3 w-3" />
                      <span>Efficiency</span>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Usage Over Time */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                        Consumption Trend
                      </h4>
                      <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600">Tokens</Badge>
                    </div>
                    <div className="h-[320px] w-full">
                      <Plot
                        data={[
                          {
                            x: usageData?.usages.map(u => new Date(u.timestamp).toLocaleDateString()) || [],
                            y: usageData?.usages.map(u => u.total_tokens) || [],
                            type: 'bar',
                            marker: {
                              color: 'rgba(59, 130, 246, 0.7)',
                              line: { color: '#3b82f6', width: 1.5 }
                            },
                            name: 'Usage'
                          }
                        ]}
                        layout={{
                          autosize: true,
                          margin: { t: 5, r: 10, b: 35, l: 45 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          showlegend: false,
                          bargap: 0.4,
                          xaxis: {
                            showgrid: false,
                            zeroline: false,
                            tickfont: { size: 10, color: '#94a3b8', family: 'Inter' },
                          },
                          yaxis: {
                            showgrid: true,
                            gridcolor: 'rgba(148, 163, 184, 0.05)',
                            zeroline: false,
                            tickfont: { size: 10, color: '#94a3b8', family: 'Inter' }
                          },
                          hovermode: 'closest'
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Agent Distribution */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <PieChart className="h-4 w-4 text-purple-500" />
                        Resource Allocation
                      </h4>
                      <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5 bg-purple-100/50 dark:bg-purple-900/30 text-purple-600">Agents</Badge>
                    </div>
                    <div className="h-[320px] w-full">
                      <Plot
                        data={[
                          {
                            values: usageData?.agent_wise_usage.map(a => a.total_tokens) || [],
                            labels: usageData?.agent_wise_usage.map(a => a.agent_name.charAt(0).toUpperCase() + a.agent_name.slice(1)) || [],
                            type: 'pie',
                            hole: 0.55,
                            marker: {
                              colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#475569'],
                              line: { color: 'rgba(0,0,0,0)', width: 0 }
                            },
                            textinfo: 'percent',
                            textposition: 'outside',
                            insidetextorientation: 'radial',
                            pull: [0.03, 0.03, 0.03, 0.03]
                          }
                        ]}
                        layout={{
                          autosize: true,
                          margin: { t: 0, r: 0, b: 10, l: 0 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          showlegend: true,
                          legend: {
                            orientation: 'h',
                            y: -0.1,
                            x: 0.5,
                            xanchor: 'center',
                            font: { size: 11, color: '#94a3b8', family: 'Inter' }
                          }
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Table Breakdown */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th className="px-4 py-3">Agent</th>
                        <th className="px-4 py-3 text-right">Tokens</th>
                        <th className="px-4 py-3 text-right">Requests</th>
                        <th className="px-4 py-3 text-right text-xs">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {usageData?.agent_wise_usage.map((agent, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {agent.agent_name}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {agent.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {agent.total_requests}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              {usageData?.total_usage.total_tokens
                                ? Math.round((agent.total_tokens / usageData.total_usage.total_tokens) * 100)
                                : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Information */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View your account details and subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Account Status</span>
                  <span className="font-medium capitalize bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded text-xs">
                    {profile?.status || 'Active'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Subscription Tier</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {profile?.subscription_tier || 'Free'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email Verified</span>
                  <span className={cn(
                    "font-medium px-2 py-0.5 rounded text-xs",
                    profile?.email_verified
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                  )}>
                    {profile?.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {profile?.last_login
                      ? new Date(profile.last_login).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Registration Method</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {profile?.profile?.registration_method?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
                  <Badge className="font-medium text-white capitalize">
                    {profile?.role || 'User'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Customize the platform's background color (Light Mode)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Default', value: '#EEF2F7' },
                    { name: 'Soft Slate', value: '#F1F5F9' },
                    { name: 'Pure White', value: '#FFFFFF' },
                    { name: 'Modern Gray', value: '#F8FAFC' },
                    { name: 'Zinc Light', value: '#F4F4F5' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setBackgroundColor(color.value)}
                      className={cn(
                        "group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                        backgroundColor === color.value
                          ? "bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/20"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800"
                      )}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-slate-200 shadow-inner"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs font-medium">{color.name}</span>
                      {backgroundColor === color.value && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 block">Custom Color</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#EEF2F7"
                          className="pl-8 h-9 text-sm font-mono"
                        />
                        <div
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-slate-200 shadow-inner"
                          style={{ backgroundColor }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBackgroundColor('#EEF2F7')}
                        className="h-9 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Your personal settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Communication Style</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {profile?.preferences?.communication_style || 'Professional'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Notifications</span>
                  <span className={cn(
                    "font-medium px-2 py-0.5 rounded text-xs",
                    profile?.preferences?.notifications_enabled
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  )}>
                    {profile?.preferences?.notifications_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sign Out / Danger Zone */}
      <Card className="border border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Sign Out</CardTitle>
          <CardDescription>
            Sign out of your account on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>

  )
}
