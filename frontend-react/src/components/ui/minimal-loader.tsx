'use client'

import { cn } from '@/lib/utils'

interface MinimalLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Professional minimal loader with Mac-level aesthetic
 * Uses simple fade animation instead of spinning circles
 */
export function MinimalLoader({ size = 'md', className }: MinimalLoaderProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full bg-current animate-pulse',
          sizeClasses[size]
        )}
        style={{
          animationDuration: '1.4s',
          animationDelay: '0s'
        }}
      />
      <div
        className={cn(
          'rounded-full bg-current animate-pulse opacity-75',
          sizeClasses[size]
        )}
        style={{
          animationDuration: '1.4s',
          animationDelay: '0.2s'
        }}
      />
      <div
        className={cn(
          'rounded-full bg-current animate-pulse opacity-50',
          sizeClasses[size]
        )}
        style={{
          animationDuration: '1.4s',
          animationDelay: '0.4s'
        }}
      />
    </div>
  )
}

/**
 * Minimal spinner for button loading states
 */
export function MinimalSpinner({ size = 'md', className }: MinimalLoaderProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div
      className={cn(
        'rounded-full border-2 border-current border-t-transparent animate-spin',
        sizeClasses[size],
        className
      )}
      style={{
        animationDuration: '0.8s'
      }}
    />
  )
}
