'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function useApi() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiClient.testConnection()
        setIsOnline(true)
      } catch (error) {
        setIsOnline(false)
      }
    }

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    // Initial check
    checkConnection()

    return () => clearInterval(interval)
  }, [])

  return {
    isOnline,
    apiClient,
  }
}