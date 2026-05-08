// frontend/src/lib/pdfGenerator.ts
import jsPDF from 'jspdf'

interface PDFGenerationOptions {
  title?: string
  agentName?: string
  timestamp?: string
  content: string
  isMarkdown?: boolean
}

export class PDFGenerator {
  // Mentis brand colors - teal gradient
  private static readonly MENTIS_LOGO_SVG = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mentisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#A2D18C;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#60B194;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2FB8DE;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#mentisGradient)" stroke="#60B194" stroke-width="1"/>
      <text x="16" y="21" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">M</text>
    </svg>
  `

  private static readonly AGENT_DESCRIPTIONS = {
    'Aegis': 'Aegis is a Mentis agent specialized for search and research, providing comprehensive analysis and insights.',
    'Sophia': 'Sophia is a Mentis agent specialized for creative assistance and knowledge exploration.',
    'Assistant': 'A Mentis AI assistant providing intelligent responses and analysis.'
  }

  static async generatePDF(options: PDFGenerationOptions): Promise<void> {
    const {
      title = 'AI Response',
      agentName = 'Assistant',
      timestamp = new Date().toLocaleString(),
      content,
      isMarkdown = true
    } = options

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Add clean header
    this.addCleanHeader(pdf, pageWidth, margin, agentName, title, timestamp)

    // Add content starting below header
    let yPos = 40
    if (isMarkdown) {
      yPos = this.addCleanMarkdownContent(pdf, content, margin, yPos, contentWidth, pageHeight, margin)
    } else {
      yPos = this.addPlainTextContent(pdf, content, margin, yPos, contentWidth, pageHeight, margin)
    }

    // Add simple footer
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      this.addCleanFooter(pdf, pageWidth, pageHeight, i, totalPages)
    }

    // Download
    const filename = `mentis-${agentName.toLowerCase()}-${Date.now()}.pdf`
    pdf.save(filename)
  }

  private static addCleanHeader(
    pdf: jsPDF,
    pageWidth: number,
    margin: number,
    agentName: string,
    title: string,
    timestamp: string
  ): void {
    // Simple header background
    pdf.setFillColor(248, 250, 252) // light gray
    pdf.rect(0, 0, pageWidth, 30, 'F')

    // Mentis brand top bar (teal gradient effect)
    pdf.setFillColor(162, 209, 140) // A2D18C - primary brand color
    pdf.rect(0, 0, pageWidth, 2, 'F')

    // Small subtle branding - no logo, just text
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(120, 120, 120)
    pdf.text('Mentis AI', margin, 15)

    // Agent description - small and subtle
    const description = (this.AGENT_DESCRIPTIONS as any)[agentName] || this.AGENT_DESCRIPTIONS['Assistant']
    pdf.setFontSize(7)
    pdf.setTextColor(140, 140, 140)
    const wrappedDesc = pdf.splitTextToSize(description, pageWidth - margin - 25)
    pdf.text(wrappedDesc, margin, 20)

    // Timestamp only
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`Generated: ${timestamp}`, margin, 25)

    // Bottom line
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.5)
    pdf.line(0, 30, pageWidth, 30)
  }

  private static addCleanMarkdownContent(
    pdf: jsPDF,
    content: string,
    startX: number,
    startY: number,
    maxWidth: number,
    pageHeight: number,
    margin: number
  ): number {
    let yPos = startY
    
    // Clean the content first - remove markdown symbols but preserve structure
    const cleanedContent = this.cleanMarkdownContent(content)
    const lines = cleanedContent.split('\n')

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(60, 60, 60)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Check for new page
      if (yPos > pageHeight - 40) {
        pdf.addPage()
        yPos = margin + 10
      }

      if (!line) {
        yPos += 4 // Add spacing for empty lines
        continue
      }

      // Detect if this was a header (now cleaned)
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
      const isHeader = this.detectHeader(line, nextLine)

      if (isHeader.isHeader) {
        // Add header styling
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(isHeader.level === 1 ? 16 : isHeader.level === 2 ? 14 : 12)
        pdf.setTextColor(40, 40, 40)
        
        const wrappedText = pdf.splitTextToSize(line, maxWidth - 10)
        pdf.text(wrappedText, startX, yPos)
        
        yPos += wrappedText.length * (isHeader.level === 1 ? 8 : isHeader.level === 2 ? 7 : 6)
        
        // Add underline for headers (using brand color)
        pdf.setDrawColor(96, 177, 148) // 60B194 - brand color
        pdf.setLineWidth(0.5)
        pdf.line(startX, yPos + 1, startX + 60, yPos + 1)
        
        yPos += 8
        
        // Reset font for next content
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(11)
        pdf.setTextColor(60, 60, 60)
        continue
      }

      // Detect list items
      if (this.isListItem(line)) {
        // Add bullet point (using brand color)
        pdf.setFillColor(47, 184, 222) // 2FB8DE - brand accent color
        pdf.circle(startX + 5, yPos - 2, 1, 'F')
        
        // Add list item text
        const itemText = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '')
        const wrappedText = pdf.splitTextToSize(itemText, maxWidth - 20)
        pdf.text(wrappedText, startX + 10, yPos)
        yPos += wrappedText.length * 6 + 2
        continue
      }

      // Regular paragraph
      const wrappedText = pdf.splitTextToSize(line, maxWidth - 10)
      pdf.text(wrappedText, startX, yPos)
      yPos += wrappedText.length * 6 + 4
    }

    return yPos
  }

  private static cleanMarkdownContent(content: string): string {
    return content
      // Remove ALL markdown headers (# ## ### #### ##### ######) but keep the text
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers but keep text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '[Code Block]')
      .replace(/`([^`]+)`/g, '$1')
      // Clean up links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove blockquote markers
      .replace(/^>\s+/gm, '')
      // Remove any remaining # symbols at start of lines
      .replace(/^#+\s*/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  private static detectHeader(line: string, nextLine: string): { isHeader: boolean; level: number } {
    // Detect headers by looking for patterns that suggest this was a header
    if (line.length < 100 && // Headers are usually shorter
        !line.includes('.') && // Headers usually don't end with periods
        (line.match(/[A-Z]/g) || []).length > 1 && // Has multiple capital letters
        (nextLine === '' || nextLine.length > 20)) { // Followed by empty line or paragraph
      
      // Guess header level based on content
      if (line.toLowerCase().includes('section') || 
          line.toLowerCase().includes('chapter') ||
          line.toLowerCase().includes('part')) {
        return { isHeader: true, level: 2 }
      }
      
      if (line.split(' ').length <= 6) { // Short titles are likely H1
        return { isHeader: true, level: 1 }
      }
      
      return { isHeader: true, level: 2 }
    }
    
    return { isHeader: false, level: 0 }
  }

  private static isListItem(line: string): boolean {
    return /^[-*•]\s/.test(line) || /^\d+\.\s/.test(line)
  }

  private static addPlainTextContent(
    pdf: jsPDF,
    content: string,
    startX: number,
    startY: number,
    maxWidth: number,
    pageHeight: number,
    margin: number
  ): number {
    let yPos = startY
    const lines = content.split('\n')

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(60, 60, 60)

    for (const line of lines) {
      // Check for new page
      if (yPos > pageHeight - 40) {
        pdf.addPage()
        yPos = margin + 10
      }

      if (line.trim()) {
        const wrappedText = pdf.splitTextToSize(line, maxWidth - 10)
        pdf.text(wrappedText, startX, yPos)
        yPos += wrappedText.length * 6
      } else {
        yPos += 4
      }
    }

    return yPos
  }

  private static addCleanFooter(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
    currentPage: number,
    totalPages: number
  ): void {
    const footerY = pageHeight - 15

    // Simple footer line
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5)

    // Footer text
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(120, 120, 120)

    // Left: Company
    pdf.text('Generated by Mentis AI', 20, footerY)

    // Right: Page numbers
    const pageText = `${currentPage} / ${totalPages}`
    const pageTextWidth = pdf.getTextWidth(pageText)
    pdf.text(pageText, pageWidth - 20 - pageTextWidth, footerY)
  }

  // DOCX placeholder
  static async generateDOCX(options: PDFGenerationOptions): Promise<void> {
    alert('DOCX export coming soon! PDF export is available now.')
  }
}