// frontend/src/components/providers/DataProvider.tsx
// OPTIMIZED: App-level data prefetching and cache management

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useGlobalPrefetch } from '@/hooks/useOptimizedQueries'
import { apiClient } from '@/lib/api'

interface DataProviderContextType {
  isDataReady: boolean
  prefetchComplete: boolean
  retryPrefetch: () => Promise<void>
}

const DataProviderContext = createContext<DataProviderContextType | undefined>(undefined)

export function useDataProvider() {
  const context = useContext(DataProviderContext)
  if (!context) {
    throw new Error('useDataProvider must be used within a DataProvider')
  }
  return context
}

interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { prefetchUserData } = useGlobalPrefetch()
  
  const [isDataReady, setIsDataReady] = useState(false)
  const [prefetchComplete, setPrefetchComplete] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Enhanced prefetch with retry logic
  const performPrefetch = async () => {
    if (!isAuthenticated || !user) {
      console.log('⏭️ Skipping prefetch - user not authenticated')
      return
    }

    try {
      console.log('🚀 Starting enhanced data prefetch')
      
      // Prefetch core data in parallel
     const prefetchPromises = [
       // Core user data
       queryClient.prefetchQuery({
         queryKey: ['chats'],
         queryFn: () => apiClient.getChats({ limit: 50 }),
         staleTime: 60000, // 1 minute
       }),
       
       // Knowledge bases (always useful)
       queryClient.prefetchQuery({
         queryKey: ['knowledgeBases'],
         queryFn: () => apiClient.getKnowledgeBases(),
         staleTime: 600000, // 10 minutes
       }),
       
       // Recent chats with messages (for quick loading)
       queryClient.prefetchQuery({
         queryKey: ['recentChats'],
         queryFn: async () => {
           const chatsResponse = await apiClient.getChats({ limit: 5 })
           if (chatsResponse.success && chatsResponse.data && chatsResponse.data.length > 0) {
            const recentChat = chatsResponse.data[0]
             await queryClient.prefetchQuery({
               queryKey: ['messages', recentChat.id],
               queryFn: () => apiClient.getChatMessages(recentChat.id, { limit: 20 }),
               staleTime: 30000,
             })
           }
           return chatsResponse
         },
         staleTime: 120000, // 2 minutes
       }),
     ]

     // Execute all prefetch operations
     const results = await Promise.allSettled(prefetchPromises)
     
     // Log results for debugging
     const successful = results.filter(r => r.status === 'fulfilled').length
     const failed = results.filter(r => r.status === 'rejected').length
     
     console.log(`✅ Prefetch completed: ${successful} successful, ${failed} failed`)
     
     if (failed > 0) {
       console.warn('Some prefetch operations failed:', 
         results.filter(r => r.status === 'rejected').map(r => r.reason)
       )
     }
     
     setPrefetchComplete(true)
     setIsDataReady(true)
     
   } catch (error) {
     console.error('❌ Prefetch error:', error)
     
     // Retry logic with exponential backoff
     if (retryCount < 3) {
       const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
       console.log(`🔄 Retrying prefetch in ${delay}ms (attempt ${retryCount + 1}/3)`)
       
       setTimeout(() => {
         setRetryCount(prev => prev + 1)
         performPrefetch()
       }, delay)
     } else {
       console.error('❌ Prefetch failed after 3 attempts')
       setIsDataReady(true) // Allow app to continue even if prefetch fails
     }
   }
 }

 // Manual retry function
 const retryPrefetch = async () => {
   console.log('🔄 Manual prefetch retry requested')
   setRetryCount(0)
   setPrefetchComplete(false)
   setIsDataReady(false)
   await performPrefetch()
 }

 // Auto-prefetch when user becomes available
 useEffect(() => {
   if (isAuthenticated && user && !prefetchComplete) {
     console.log('👤 User authenticated, starting prefetch')
     performPrefetch()
   }
 }, [isAuthenticated, user, prefetchComplete])

 // Clear cache on user change
 useEffect(() => {
   if (!isAuthenticated || !user) {
     console.log('🧹 Clearing cache - user logged out')
     queryClient.clear()
     apiClient.clearAuthCache()
     setPrefetchComplete(false)
     setIsDataReady(false)
     setRetryCount(0)
   }
 }, [isAuthenticated, user, queryClient])

 // Periodic cache refresh (every 5 minutes)
 useEffect(() => {
   if (!isAuthenticated || !prefetchComplete) return

   const interval = setInterval(() => {
     console.log('🔄 Periodic cache refresh')
     queryClient.invalidateQueries({ 
       queryKey: ['chats'],
       refetchType: 'active' // Only refetch if component is mounted
     })
   }, 5 * 60 * 1000) // 5 minutes

   return () => clearInterval(interval)
 }, [isAuthenticated, prefetchComplete, queryClient])

 const contextValue: DataProviderContextType = {
   isDataReady,
   prefetchComplete,
   retryPrefetch,
 }

 return (
   <DataProviderContext.Provider value={contextValue}>
     {children}
   </DataProviderContext.Provider>
 )
}

// Enhanced loading component for better UX during prefetch
export function DataLoadingIndicator() {
 const { isDataReady, prefetchComplete } = useDataProvider()
 const [showLoader, setShowLoader] = useState(false)

 useEffect(() => {
   // Only show loader if prefetch takes longer than 500ms
   const timer = setTimeout(() => {
     if (!prefetchComplete) {
       setShowLoader(true)
     }
   }, 500)

   return () => clearTimeout(timer)
 }, [prefetchComplete])

 if (isDataReady || !showLoader) {
   return null
 }

 return (
   <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
     <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 border border-gray-200">
       <div className="relative">
         <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
         <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-blue-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
       </div>
       <div>
         <div className="font-medium text-gray-900">Loading your data...</div>
         <div className="text-sm text-gray-600">Preparing your workspace</div>
       </div>
     </div>
   </div>
 )
}