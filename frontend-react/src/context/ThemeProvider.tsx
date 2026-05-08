import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
  backgroundColor: string
  setBackgroundColor: (color: string) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'mentis-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored as Theme
      }
    }
    return defaultTheme
  })

  const [backgroundColor, setBackgroundColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mentis_app_bg_v2') || '#EEF2F7'
    }
    return '#EEF2F7'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let actualTheme: 'dark' | 'light' = 'light'
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      actualTheme = theme as 'dark' | 'light'
    }

    root.classList.add(actualTheme)
    setResolvedTheme(actualTheme)
    localStorage.setItem(storageKey, theme)

    // Inject background color variable for light mode
    if (actualTheme === 'light') {
      root.style.setProperty('--app-bg', backgroundColor)
    } else {
      root.style.removeProperty('--app-bg')
    }
    localStorage.setItem('mentis_app_bg_v2', backgroundColor)
  }, [theme, backgroundColor, storageKey])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      const newTheme = e.matches ? 'dark' : 'light'
      root.classList.add(newTheme)
      setResolvedTheme(newTheme)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [theme])

  const value: ThemeProviderState = {
    theme,
    setTheme,
    resolvedTheme,
    backgroundColor,
    setBackgroundColor,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
