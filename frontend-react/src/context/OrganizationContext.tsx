// frontend/src/context/OrganizationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { governanceAPI } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface Organization {
  organization_id: string
  slug: string
  name: string
  member_role: string
  owner_user_id: string
  subscription_tier: string
  subscription_status: string
  member_count: number
  created_at: string
  member?: {
    role: string
    status: string
    department_id: string
  }
  permissions?: Record<string, boolean>
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  loading: boolean
  error: string | null
  setCurrentOrganization: (org: Organization) => void
  refreshOrganizations: () => Promise<void>
  isOwner: boolean
  isAdmin: boolean
  canManage: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

const STORAGE_KEY = 'mentis_current_organization_id'

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load organizations from API
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.group('[OrganizationContext] loadOrganizations')
      console.log('Fetching organizations from API...')

      const response = await governanceAPI.organizations.list()

      console.log('Raw API response:', response)

      if (response.success && response.data) {
        console.log('Organizations returned by API:', response.data.map((o: any) => ({
          id: o.organization_id,
          name: o.name,
          slug: o.slug,
          member_role: o.member_role,
          owner_user_id: o.owner_user_id,
          permissions: o.permissions,
        })))

        setOrganizations(response.data)

        // Priority: (1) owned org, (2) last-saved org, (3) first org
        const ownedOrg = response.data.find((org: any) => org.member_role === 'owner')
        const savedOrgId = localStorage.getItem(STORAGE_KEY)
        console.log('Saved org ID in localStorage:', savedOrgId)
        const savedOrg = response.data.find((org: any) => org.organization_id === savedOrgId)
        const defaultOrg = ownedOrg || savedOrg || response.data[0] || null

        console.log('Owned org:', ownedOrg?.name || 'none')
        console.log('Selected organization:', defaultOrg?.name, '| role:', defaultOrg?.member_role, '| org_id:', defaultOrg?.organization_id)
        console.groupEnd()

        setCurrentOrganizationState(defaultOrg)
      } else {
        console.warn('[OrganizationContext] API returned no data or error:', response.error)
        console.groupEnd()
        setError(response.error || 'Failed to load organizations')
      }
    } catch (err) {
      console.error('[OrganizationContext] Exception in loadOrganizations:', err)
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load organizations only when user is authenticated
  useEffect(() => {
    if (user) {
      loadOrganizations()
    } else {
      // Clear organizations when user logs out
      setOrganizations([])
      setCurrentOrganizationState(null)
      setLoading(false)
    }
  }, [user, loadOrganizations])

  // Save current organization to localStorage
  const setCurrentOrganization = useCallback((org: Organization) => {
    setCurrentOrganizationState(org)
    localStorage.setItem(STORAGE_KEY, org.organization_id)
  }, [])

  // Refresh organizations
  const refreshOrganizations = useCallback(async () => {
    await loadOrganizations()
  }, [loadOrganizations])

  // Role checks
  const isOwner = currentOrganization?.member_role === 'owner'
  const isAdmin = currentOrganization?.member_role === 'admin' || isOwner
  const canManage = ['owner', 'admin', 'manager'].includes(currentOrganization?.member_role || '')

  console.log('[OrganizationContext] Role flags:', {
    org: currentOrganization?.name,
    member_role: currentOrganization?.member_role,
    isOwner,
    isAdmin,
    canManage,
    permissions: currentOrganization?.permissions,
  })

  const value: OrganizationContextType = {
    currentOrganization,
    organizations,
    loading,
    error,
    setCurrentOrganization,
    refreshOrganizations,
    isOwner,
    isAdmin,
    canManage,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
