// frontend/src/lib/logoUtils.ts

export class LogoUtils {
  private static logoCache: string | null = null
  private static logoPromise: Promise<string | null> | null = null

  /**
   * Load and cache the Mentis logomark for use in PDFs
   */
  static async loadMentisLogo(): Promise<string | null> {
    // Return cached version if available
    if (this.logoCache !== null) {
      return this.logoCache
    }

    // Return existing promise if already loading
    if (this.logoPromise) {
      return this.logoPromise
    }

    // Create new loading promise
    this.logoPromise = this.fetchAndProcessLogo()
    const result = await this.logoPromise
    this.logoCache = result
    return result
  }

  private static async fetchAndProcessLogo(): Promise<string | null> {
    try {
      // Try to fetch the SVG file
      const response = await fetch('/mentis-logomark.svg')
      if (!response.ok) {
        console.warn('Mentis logomark not found at /mentis-logomark.svg')
        return null
      }

      const svgText = await response.text()
      
      // Clean and optimize the SVG
      const cleanSvg = svgText
        .replace(/\s+/g, ' ')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim()

      // Convert SVG to data URL for embedding in PDF
      const encodedSvg = encodeURIComponent(cleanSvg)
      const dataUrl = `data:image/svg+xml,${encodedSvg}`

      return dataUrl
    } catch (error) {
      console.error('Failed to load Mentis logomark:', error)
      return null
    }
  }

  /**
   * Create a fallback logo for use when the SVG is not available
   */
  static createFallbackLogo(): string {
    const fallbackSvg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mentisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="url(#mentisGradient)" stroke="#1e40af" stroke-width="2"/>
        <circle cx="16" cy="16" r="3" fill="#93c5fd" opacity="0.7"/>
        <text x="20" y="28" font-family="Arial, sans-serif" font-size="20" font-weight="bold" 
              text-anchor="middle" fill="white">M</text>
      </svg>
    `
    
    const encodedSvg = encodeURIComponent(fallbackSvg.trim())
    return `data:image/svg+xml,${encodedSvg}`
  }

  /**
   * Preload the logo when the app starts
   */
  static preloadLogo(): void {
    // Start loading the logo in the background
    this.loadMentisLogo().catch(err => {
      console.warn('Failed to preload Mentis logo:', err)
    })
  }
}