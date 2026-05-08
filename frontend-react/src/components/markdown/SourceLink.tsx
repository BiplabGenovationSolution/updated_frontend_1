// components/markdown/SourceLink.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { ExternalLink, Globe, FileText, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SourceLinkProps {
  href: string
  children: React.ReactNode
  isUser?: boolean
  className?: string
}

export function SourceLink({ href, children, isUser = false, className, ...props }: SourceLinkProps) {
  const [favicon, setFavicon] = useState<string | null>(null)
  const [domain, setDomain] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [linkTitle, setLinkTitle] = useState<string>('')

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const url = new URL(href)
        setDomain(url.hostname.replace('www.', ''))
        
        // Extract title from children or use domain
        const childText = typeof children === 'string' ? children : href
        const cleanTitle = childText
          .replace(/^Source:\s*/i, '')
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0] || domain
        
        setLinkTitle(cleanTitle)
        
        // Try multiple high-quality favicon sources
        const faviconSources = [
          `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`,
          `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`,
          `https://favicon.yandex.net/favicon/v2/${url.hostname}?size=32`,
          `${url.origin}/apple-touch-icon.png`,
          `${url.origin}/favicon-32x32.png`,
          `${url.origin}/favicon.ico`
        ]
        
        for (const faviconUrl of faviconSources) {
          try {
            const img = new Image()
            img.onload = () => {
              setFavicon(faviconUrl)
              setIsLoading(false)
              return
            }
            img.onerror = () => {
              // Continue to next source
            }
            img.src = faviconUrl
            
            // Wait a bit to see if it loads
            await new Promise(resolve => setTimeout(resolve, 100))
            if (favicon) break
          } catch {
            continue
          }
        }
        
        if (!favicon) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching favicon:', error)
        setIsLoading(false)
      }
    }

    if (href) {
      fetchFavicon()
    }
  }, [href, favicon])

  // Clean and format the display text
  const displayText = typeof children === 'string' 
    ? children.replace(/^Source:\s*/i, '').trim()
    : linkTitle || domain

  // Determine link type for styling
  const isSourceCitation = typeof children === 'string' && 
    (children.toLowerCase().includes('source') || href.includes('source'))

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium underline decoration-2 underline-offset-2 transition-all duration-200 hover:no-underline",
        isUser 
          ? "text-white decoration-white/60 hover:decoration-white" 
          : "text-blue-600 decoration-blue-400 hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-500 dark:hover:text-blue-300",
        className
      )}
      {...props}
    >
      {/* Favicon - small and inline */}
      <span className="inline-flex items-center justify-center flex-shrink-0">
        {isLoading ? (
          <div className={cn(
            "w-3 h-3 rounded-sm animate-pulse",
            isUser ? "bg-white/40" : "bg-blue-400/60"
          )} />
        ) : favicon ? (
          <img 
            src={favicon} 
            alt={`${domain} favicon`}
            className="w-3 h-3 rounded-sm"
            onError={() => setFavicon(null)}
          />
        ) : (
          <Globe className={cn(
            "w-3 h-3",
            isUser ? "text-white/70" : "text-blue-500"
          )} />
        )}
      </span>

      {/* Link text - clean and inline */}
      <span className="inline">
        {displayText}
      </span>

      {/* External link indicator - small and subtle */}
      <ExternalLink className={cn(
        "w-3 h-3 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0",
        isUser ? "text-white" : "text-blue-500"
      )} />
    </a>
  )
}