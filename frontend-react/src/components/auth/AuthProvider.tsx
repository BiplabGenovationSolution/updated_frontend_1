'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user from token on mount
  const loadUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mentis_auth_token') : null

    if (!token) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await apiClient.getCurrentUser()

      if (response.success && response.data) {
        setUser(response.data.user || response.data)
      } else {
        // Only clear token on actual auth errors, not rate limits or network errors
        const isAuthError = response.error?.includes('Invalid') ||
                           response.error?.includes('Unauthorized') ||
                           response.error?.includes('expired')

        if (isAuthError) {
          console.warn('Auth error, clearing tokens:', response.error)
          localStorage.removeItem('mentis_auth_token')
          localStorage.removeItem('mentis_refresh_token')
          setUser(null)
        } else {
          // For rate limits or network errors, keep user logged in with cached token
          console.warn('Non-auth error, keeping user logged in:', response.error)
          // Try to get user from token payload (JWT contains user info)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setUser({
              id: payload.user_id,
              email: payload.email,
              role: 'user',
              subscription_tier: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any)
          } catch {
            // If can't parse token, just keep user null but don't clear token
          }
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err)
      // Don't clear token on network errors, keep user logged in
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const response = await apiClient.login({ email, password })

      if (response.success && response.data) {
        setUser(response.data.user || response.data)
        return { success: true }
      } else {
        setError(response.error || 'Login failed')
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setError(null)
      setLoading(true)

      const response = await apiClient.register({
        email,
        password,
        display_name: displayName
      })

      if (response.success && response.data) {
        setUser(response.data.user || response.data)
        return { success: true }
      } else {
        setError(response.error || 'Registration failed')
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('mentis_auth_token')
    localStorage.removeItem('mentis_refresh_token')

    // Call logout API if it exists
    try {
      apiClient.logout?.()
    } catch (err) {
      console.error('Logout API call failed:', err)
    }

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }, [])

  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
