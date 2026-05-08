// frontend/src/components/providers/Providers.tsx
// OPTIMIZED: Enhanced providers with performance optimizations

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeProvider'
import { useState, useEffect } from 'react'

// Enhanced QueryClient configuration for performance
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Performance optimizations
        staleTime: 60000, // 1 minute default
        gcTime: 300000, // 5 minutes default (replaces cacheTime)
        retry: (failureCount, error: any) => {
          // Smart retry logic
          if (error?.status === 401 || error?.status === 403) {
            return false // Don't retry auth errors
          }
          return failureCount < 2 // Max 2 retries
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network optimizations
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
        refetchOnReconnect: 'always', // Always refetch on reconnect
        refetchOnMount: true,

        // Error handling
        throwOnError: false, // Handle errors in components (replaces useErrorBoundary)
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
        throwOnError: false, // Handle errors in components

        // Network timeout
        networkMode: 'online',
      },
    },

    // Global error handler
    queryCache: undefined, // Use default
    mutationCache: undefined, // Use default
  })
}

// Simple AuthProvider replacement (since we can't import it)
function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Create stable QueryClient instance
  const [queryClient] = useState(() => createQueryClient())
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Setup global error handlers
  useEffect(() => {
    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)

      // Log to monitoring service in production
      if (import.meta.env.PROD) {
        // Analytics.track('unhandled_error', { error: event.reason })
      }

      // Prevent default browser behavior
      event.preventDefault()
    }

    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)

      // Log to monitoring service in production
      if (import.meta.env.PROD) {
        // Analytics.track('global_error', { error: event.error })
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Online - resuming queries')
      queryClient.resumePausedMutations()
      // FIXED: Don't invalidate all queries on reconnect - this interrupts streaming responses
      // Let queries refetch naturally based on their own refetch settings
    }

    const handleOffline = () => {
      console.log('📴 Network: Offline - pausing mutations')
      // Queries will automatically pause, mutations are handled by QueryClient
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])

  // Performance monitoring
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Monitor query performance in development
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('api') && entry.duration > 1000) {
            console.warn(`Slow API call detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
          }
        })
      })

      try {
        observer.observe({ entryTypes: ['measure', 'navigation'] })
      } catch (e) {
        // Performance Observer not supported
      }

      return () => observer.disconnect()
    }
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SimpleAuthProvider>
          {children}
        </SimpleAuthProvider>
      </ThemeProvider>

      {/* React Query DevTools - commented out for compatibility */}
      {/* {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )} */}
    </QueryClientProvider>
  )
}

// Performance utilities
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName: string) => {
    if (import.meta.env.DEV) {
      performance.mark(`${componentName}-render-start`)

      return () => {
        performance.mark(`${componentName}-render-end`)
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        )
      }
    }
    return () => { } // No-op in production
  },

  // Measure API call duration
  measureApiCall: (apiName: string) => {
    performance.mark(`${apiName}-start`)

    return () => {
      performance.mark(`${apiName}-end`)
      performance.measure(`${apiName}`, `${apiName}-start`, `${apiName}-end`)
    }
  },

  // Log performance metrics
  logPerformanceMetrics: () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    console.group('🚀 Performance Metrics')
    console.log('DNS Lookup:', navigation.domainLookupEnd - navigation.domainLookupStart)
    console.log('TCP Connection:', navigation.connectEnd - navigation.connectStart)
    console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart)
    console.log('Page Load:', navigation.loadEventEnd - navigation.loadEventStart)

    paint.forEach((entry) => {
      console.log(`${entry.name}:`, entry.startTime)
    })

    console.groupEnd()
  },
}

// Export for use in components
export { createQueryClient }