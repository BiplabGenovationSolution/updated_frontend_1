import { useState, useEffect } from 'react'
import Avatar from 'boring-avatars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import Plot from 'react-plotly.js'
import {
  Copy,
  Download,
  MoreHorizontal,
  CheckCircle,
  Check,
  FileText,
  Trash2,
  RotateCcw,
  AlertCircle,
  Bot,
  Sparkles,
  Target,
  Database,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Code,
  Terminal,
  FileSpreadsheet,
  BarChart3,
  Image as ImageIcon,
  Upload,
  Activity,
  Clock,
  Zap,
  Brain,
  Lightbulb,
  Edit,
  FileCode,
  TrendingUp,
  Maximize2,
  Minimize2,
  Shield,
  ExternalLink,
  Globe
} from 'lucide-react'
import type { Message, AgentType } from '@/lib/types'
import { cn, deduplicateAgentName } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { AGENT_CONFIGS } from '@/lib/constants'
import { MarkdownContent } from '@/components/markdown/MarkdownContent'
import { useTheme } from '@/context/ThemeProvider'
// import { AnalyticaVisualization } from './AnalyticaVisualization'
// import { FlowExecutionSteps } from './shared/FlowExecutionSteps'

import { generateAnalyticaPDF } from '@/utils/pdfExport'

interface ChatMessageProps {
  message: Message
  chatId: string
  chatAgentType: AgentType
  onMessageDeleted?: () => void
  onMessageRestored?: () => void
  onViewSources?: (messageContent: string, messageId: string, sources?: any[], logs?: any[]) => void
  onViewExecution?: (messageId: string) => void
  onViewResearch?: (sources: SophiaSource[], knowledgeBaseName: string) => void
  sendMessage?: (content: string, chatId: string | null) => Promise<void>
}

// ============================================================================
// SOPHIA SOURCE EXTRACTION AND PARSING
// ============================================================================

function normalizeHardWrappedStreamText(content: string): string {
  if (!content) return content

  const segments = content.split(/(```[\s\S]*?```)/g)

  const normalized = segments.map((segment, index) => {
    if (index % 2 === 1) return segment

    const lines = segment.split('\n')
    const merged: string[] = []
    let buffer: string[] = []

    const flushBuffer = () => {
      if (buffer.length === 0) return
      merged.push(buffer.join(' ').replace(/[ \t]{2,}/g, ' ').trim())
      buffer = []
    }

    for (const rawLine of lines) {
      const line = rawLine.trimEnd()
      const trimmed = line.trim()

      if (!trimmed) {
        flushBuffer()
        merged.push('')
        continue
      }

      const isStructuredLine = /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\|)/.test(trimmed)
      if (isStructuredLine) {
        flushBuffer()
        merged.push(trimmed)
        continue
      }

      buffer.push(trimmed)
    }

    flushBuffer()

    return merged
      .join('\n')
      .replace(/([A-Za-z])\n(?=[A-Za-z])/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
  })

  return normalized.join('').trim()
}

interface SophiaSource {
  filename: string
  relevance: number
  excerpt?: string
  documentContext?: string
  full_content?: string
  document_id?: string
  chunk_index?: number
}

function extractSophiaSources(content: string): { cleanContent: string; sources: SophiaSource[]; rawOutput: string } {


  // Look for the "Sources:" section
  const sourcesMatch = content.match(/\n\s*Sources:\s*\n([\s\S]*?)(?:\n\n|$)/i)

  if (!sourcesMatch) {

    return { cleanContent: content, sources: [], rawOutput: '' }
  }



  // Extract the sources text
  const sourcesText = sourcesMatch[1]
  const cleanContent = content.replace(sourcesMatch[0], '').trim()



  // Parse individual sources
  const sources: SophiaSource[] = []

  // Split by bullet points or new lines and process each source
  const sourceLines = sourcesText.split(/\n\s*[•\*\-]?\s*/).filter(line => line.trim())

  for (const line of sourceLines) {
    // Pattern: "Filename.pdf (Relevance: X.XX)"
    const sourceMatch = line.match(/^([^(]+)\s*\(Relevance:\s*([\d.]+)\)/i)

    if (sourceMatch) {
      const filename = sourceMatch[1].trim()
      const relevance = parseFloat(sourceMatch[2])

      // Look for excerpt in the remaining text
      const remainingText = line.replace(sourceMatch[0], '').trim()
      const excerptMatch = remainingText.match(/\*?Excerpt:\s*"([^"]+)"/i)

      const source: SophiaSource = {
        filename,
        relevance,
        excerpt: excerptMatch ? excerptMatch[1] : undefined
      }

      sources.push(source)


    }
  }



  return { cleanContent, sources, rawOutput: '' }
}


// ============================================================================
// CLAVIS CODE SOURCES COMPONENT
// ============================================================================

interface ClavisSource {
  id: string
  repo_name: string
  file_path: string
  chunk_type: string
  function_name: string
  class_name: string
  content: string
  line_start: number
  line_end: number
  commit_hash: string
  distance: number
  similarity_score: string
}

interface ClavisSourcesDisplayProps {
  sources: ClavisSource[]
  messageId: string
  repoName: string
}

function ClavisSourcesDisplay({ sources, messageId, repoName }: ClavisSourcesDisplayProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  console.log("Clavis MessageId", messageId)

  if (!sources || sources.length === 0) return null

  const handleCopySources = async () => {
    const sourcesText = sources.map(source =>
      `${source.file_path}:${source.line_start}-${source.line_end} (${source.similarity_score})`
    ).join('\n')

    try {
      await navigator.clipboard.writeText(sourcesText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: 'Sources Copied',
        description: `${sources.length} code source(s) copied to clipboard`,
        duration: 2000
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy sources',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const getRelevanceColor = (score: string) => {
    const percentage = parseFloat(score.replace('%', ''))
    if (percentage >= 80) return 'text-emerald-700 bg-emerald-100'
    if (percentage >= 60) return 'text-blue-700 bg-blue-100'
    if (percentage >= 40) return 'text-amber-700 bg-amber-100'
    return 'text-gray-700 bg-gray-100'
  }

  return (
    <div className="mt-4 animate-slide-up">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
        {/* Header */}
        <div className="border-b border-blue-200 bg-white/50">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-white/70"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Code className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-900">Code Sources</span>
                  <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                    {sources.length} chunk{sources.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-xs text-blue-700 mt-0.5">
                  From {repoName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopySources()
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </div>
          </Button>
        </div>

        {/* Sources List */}
        {isExpanded && (
          <CardContent className="p-4 space-y-3">
            {sources.map((source, index) => (
              <div
                key={index}
                className="bg-white border border-blue-100 rounded-lg p-4 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* File Path */}
                    <div className="flex items-center gap-2 mb-2">
                      <FileCode className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-mono text-sm text-gray-900 truncate">
                        {source.file_path}
                      </span>
                    </div>

                    {/* Function/Class Info */}
                    {(source.function_name || source.class_name) && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                        {source.class_name && (
                          <Badge variant="outline" className="border-purple-200 text-purple-700">
                            Class: {source.class_name}
                          </Badge>
                        )}
                        {source.function_name && (
                          <Badge variant="outline" className="border-green-200 text-green-700">
                            Function: {source.function_name}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Code Preview */}
                    <div className="mt-2 p-3 bg-gray-900 border border-gray-700 rounded-lg overflow-x-auto">
                      <pre className="text-xs text-green-400 font-mono leading-relaxed">
                        {source.content}
                      </pre>
                    </div>

                    {/* Metadata */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                      <span className="font-mono">
                        Lines {source.line_start}-{source.line_end}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{source.commit_hash}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {source.chunk_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Relevance Score */}
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={cn(
                      "text-xs px-2 py-1 font-medium border-0",
                      getRelevanceColor(source.similarity_score)
                    )}>
                      {source.similarity_score}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-blue-700">
              <div className="flex items-center gap-2">
                <Brain className="h-3 w-3" />
                <span>Powered by Clavis Code Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-3 w-3" />
                <span>Semantic code search</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// ============================================================================
// ANALYTICA PLOTLY VISUALIZATION COMPONENT
// ============================================================================

interface AnalyticaVisualizationProps {
  visualization: any
  index: number
  messageId: string
}

function AnalyticaVisualization({ visualization, index, messageId }: AnalyticaVisualizationProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!visualization || !visualization.data) return null

  const chartTitle = visualization.data?.layout?.title?.text || `Chart ${index + 1}`
  const chartType = visualization.type || 'plotly'

  const handleDownloadChart = () => {
    // Create a download link for the chart data
    const dataStr = JSON.stringify(visualization.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chart-${messageId}-${index + 1}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Chart Data Downloaded',
      description: 'Chart configuration saved as JSON',
      duration: 2000
    })
  }

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark')

  // Prepare layout with responsive sizing and dark mode support
  const layout = {
    ...visualization.data.layout,
    autosize: true,
    margin: { l: 50, r: 30, t: 50, b: 50 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'ui-sans-serif, system-ui, sans-serif',
      size: 12,
      color: isDarkMode ? '#e5e7eb' : '#374151'
    },
    hoverlabel: {
      bgcolor: isDarkMode ? '#1e293b' : 'white',
      bordercolor: isDarkMode ? '#475569' : '#e5e7eb',
      font: { size: 11, color: isDarkMode ? '#e5e7eb' : '#374151' }
    },
    xaxis: {
      ...visualization.data.layout?.xaxis,
      gridcolor: isDarkMode ? '#334155' : '#e5e7eb',
      color: isDarkMode ? '#e5e7eb' : '#374151'
    },
    yaxis: {
      ...visualization.data.layout?.yaxis,
      gridcolor: isDarkMode ? '#334155' : '#e5e7eb',
      color: isDarkMode ? '#e5e7eb' : '#374151'
    }
  }

  // Config for Plotly
  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: `analytica-chart-${index + 1}`,
      height: 800,
      width: 1200,
      scale: 2
    }
  }

  return (
    <>
      <Card className={cn(
        "overflow-hidden border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 transition-all duration-200",
        isFullscreen && "fixed inset-4 z-50 m-0"
      )}>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-cyan-200 dark:border-cyan-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                {chartTitle}
              </span>
              <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-0 text-xs">
                {chartType}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
                onClick={handleDownloadChart}
              >
                <Download className="h-3 w-3 mr-1" />
                Data
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-cyan-700 hover:bg-cyan-100"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <CardContent className={cn(
            "bg-white",
            isFullscreen ? "p-8 h-[calc(100vh-8rem)] flex items-center justify-center" : "p-6"
          )}>
            <div
              className={cn(
                "w-full",
                isFullscreen ? "h-full" : "h-[400px]"
              )}
              data-plotly-chart
            >
              <Plot
                data={visualization.data.data}
                layout={layout}
                config={config as any}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          </CardContent>
        )}

        {isExpanded && (
          <div className="bg-white/80 border-t border-cyan-200 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-cyan-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                <span>Interactive visualization powered by Plotly</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span>Hover for details • Click and drag to zoom</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </>
  )
}

// ============================================================================
// ENHANCED RAW PANDAS OUTPUT DETECTION & EXTRACTION
// ============================================================================

const RAW_PANDAS_PATTERNS = [
  /^\s*(count|mean|std|min|25%|50%|75%|max)\s+[\d\.\-]+/gm,
  /^Value[_\s]*counts?\s*for.*?:/gm,
  /^Summary Statistics:?\s*$/gm,
  /<class 'pandas\.core\.frame\.DataFrame'>/gm,
  /^\s*\[\d+ rows x \d+ columns\]/gm,
  /^Index\(['"].*?['"], dtype=/gm,
  /memory usage:.*?$/gm,
  /^Correlation Matrix:?\s*$/gm,
  /^Columns:.*?$/gm,
  /^Non-Null Count.*?$/gm,
]

const PANDAS_SECTION_HEADERS = [
  'Summary Statistics:',
  'Value counts for',
  'Correlation Matrix:',
  'Dataset Information:',
  'Column Information:',
  'Data Types:',
  'Missing Values:',
  'Null Values:',
  'Memory Usage:',
  '<class \'pandas.',
  '# Dataset Overview',
  '## Data Summary',
  '### Statistical Summary',
  '## Dataset Information',
  '### Dataset Shape',
  '### Column Analysis',
  '## Statistical Overview',
]

function extractRawPandasOutput(content: string): { cleanContent: string; rawOutput: string; sources: never[] } {


  let cleanContent = content
  const rawSections: string[] = []

  // Method 1: Extract sections that start with pandas headers
  PANDAS_SECTION_HEADERS.forEach(header => {
    const headerIndex = cleanContent.indexOf(header)
    if (headerIndex !== -1) {


      const afterHeader = cleanContent.substring(headerIndex)
      const nextHeaderMatch = afterHeader.match(/\n\n#+\s|\n\n\*\*[A-Z]|\n\n[A-Z][^:]*:\s*$|\n\n```|\n\n---/m)
      const sectionEnd = nextHeaderMatch ? headerIndex + (nextHeaderMatch.index || 0) : cleanContent.length

      const section = cleanContent.substring(headerIndex, sectionEnd)
      rawSections.push(section.trim())

      cleanContent = cleanContent.substring(0, headerIndex) + cleanContent.substring(sectionEnd)


    }
  })

  cleanContent = cleanContent
    .replace(/\n\n\n+/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
    .trim()

  const rawOutput = rawSections.join('\n\n---\n\n').trim()



  return { cleanContent, rawOutput, sources: [] }
}

// ============================================================================
// ENHANCED TERMINAL-STYLE RAW OUTPUT COMPONENT
// ============================================================================

interface RawOutputTerminalProps {
  content: string
  messageId: string
  isVisible: boolean
  onToggle: () => void
  isFileAnalysis?: boolean
}

function RawOutputTerminal({ content, messageId, isVisible, onToggle, isFileAnalysis = false }: RawOutputTerminalProps) {
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyRawOutput = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: 'Raw Output Copied',
        description: 'Complete execution output copied to clipboard',
        duration: 2000
      })
    } catch (error) {
      console.error('Failed to copy raw output:', error)
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy raw output',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleDownloadRawOutput = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `raw-analysis-output-${messageId}-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Raw Output Downloaded',
      description: 'Complete analysis output saved as text file',
      duration: 2000
    })
  }

  if (!content || content.length === 0) {
    return null
  }

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
      <div className="bg-slate-800 border-b border-slate-700">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full h-10 px-4 text-left flex items-center justify-between hover:bg-slate-700/50 text-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center">
              <Terminal className="h-3 w-3 text-green-400" />
            </div>
            <div>
              <span className="font-medium text-slate-100 text-sm">
                {isFileAnalysis ? 'Analysis Output' : 'Raw Output'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-700 text-slate-300 border-0 text-xs">
              {content.split('\n').length} lines
            </Badge>
            {isVisible ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </Button>
      </div>

      {isVisible && (
        <div className="bg-slate-900">
          <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-slate-300 text-xs font-mono">
                {isFileAnalysis ? 'data-analysis.txt' : 'output.txt'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                onClick={handleCopyRawOutput}
              >
                {isCopied ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
                {isCopied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                onClick={handleDownloadRawOutput}
              >
                <Download className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </div>

          <div className="p-3 max-h-80 overflow-auto bg-slate-900">
            <pre className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap break-words selection:bg-green-400/20">
              {content}
            </pre>
          </div>

          <div className="bg-slate-800 px-3 py-1 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                {content.split('\n').length} lines • {Math.round(content.length / 1024)} KB
              </span>
              <span className="text-green-400 font-mono text-xs">
                ● {isFileAnalysis ? 'pandas output' : 'raw data'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HELPER FOR SENTENCE TRUNCATION
// ============================================================================
function truncateBySentences(text: string, maxSentences: number = 5) {
  if (!text) return { text: '', isTruncated: false };

  const parts = text.split(/([.!?]+(?:\s+|\n)|(?:\n){2,})/);

  const sentencesCount = Math.floor(parts.length / 2) + (parts.length % 2 === 1 ? 1 : 0);

  if (sentencesCount <= maxSentences) {
    return { text, isTruncated: false };
  }

  let truncated = '';
  const maxItems = maxSentences * 2;
  for (let i = 0; i < Math.min(parts.length, maxItems); i++) {
    truncated += parts[i];
  }

  const codeBlockCount = (truncated.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    truncated += '\n```\n';
  }

  return { text: truncated.trim() + '...', isTruncated: true };
}

// ============================================================================
// MAIN CHATMESSAGE COMPONENT
// ============================================================================

export function ChatMessage({
  message,
  chatId,
  chatAgentType,
  onMessageDeleted,
  onMessageRestored,
  onViewSources,
  onViewExecution,
  onViewResearch,
  sendMessage
}: ChatMessageProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { theme } = useTheme()
  const queryClient = useQueryClient()

  const [showActions, setShowActions] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

  // Copy state
  const [isCopied, setIsCopied] = useState(false)
  const [isCodeExecCopied, setIsCodeExecCopied] = useState(false)
  const [isCodeGeneratedCopied, setIsCodeGeneratedCopied] = useState(false)

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Debug states
  const [showDebugContent, setShowDebugContent] = useState(false)
  // const [showRawJSON, setShowRawJSON] = useState(false)

  // Sentences truncation state
  const [isMessageExpanded, setIsMessageExpanded] = useState(false)

  const isUser = message.sender === 'user'
  const isInitialMessage = message.id === 'initial-greeting' || (message as any).isInitialMessage === true
  const isDarkTheme = theme === 'dark'
  const isDeleted = message.metadata?.deleted === true

  // ============================================================================
  // ENHANCED MESSAGE TYPE DETECTION
  // ============================================================================

  const isFileAnalysisMessage = !isUser && (
    message.tool === 'data_analyzer' ||
    message.metadata?.tool_used === 'data_analyzer' ||
    message.content.includes('data analysis') ||
    message.content.includes('file analysis') ||
    message.content.includes('uploaded file') ||
    message.content.includes('data:image/png;base64') ||
    message.attachments?.some(att => att.type === 'file') ||
    (message.metadata?.file_info && message.metadata.file_info.success)
  )

  // Sophia message detection - use chat agent type as primary source
  const isSophiaMessage = !isUser && (
    chatAgentType === 'sophia' ||
    message.tool === 'sophia' ||
    message.metadata?.tool_used === 'sophia' ||
    (message.content.includes('Sources:') && message.content.includes('Relevance:'))
  )

  // Clavis message detection
  const isClavisMessage = !isUser && (
    chatAgentType === 'clavis' ||
    message.tool === 'clavis' ||
    message.metadata?.tool_used === 'clavis' ||
    (message.metadata?.codebase_id) ||
    (message.metadata?.sources_used && Array.isArray(message.metadata.sources_used))
  )

  // Analytica message detection
  const isAnalyticaMessage = !isUser && (
    chatAgentType === 'analytica' ||
    message.tool === 'analytica' ||
    message.metadata?.tool_used === 'analytica' ||
    message.metadata?.bucket_id ||
    message.metadata?.visualizations ||
    message.metadata?.execution_output ||
    message.metadata?.code_generated ||
    message.metadata?.session_data
  )

  // Custom agent capability execution detection
  const hasCapabilityExecution = !isUser && message.metadata?.capability_execution === true

  // Raw output terminal state
  const [showRawOutput, setShowRawOutput] = useState(isFileAnalysisMessage)

  // Auto-expand raw output for file analysis messages
  useEffect(() => {
    if (isFileAnalysisMessage) {
      setShowRawOutput(true)
    }
  }, [isFileAnalysisMessage])

  // RESEARCH SEPARATORS
  const RESEARCH_SEPARATORS = [
    "\n\n---\n\n## Complete Research Data\n\n",
    "## Complete Research Data",
    "# Enhanced Quick Search Data Dump",
    "## Search Information",
    "## All Enhanced Search Results",
    "**Session ID**:",
    "### Result 1",
    "**Citation Format**:"
  ]

  const hasResearchSources = !isUser && !isFileAnalysisMessage && !isSophiaMessage && !isClavisMessage && !isAnalyticaMessage && (
    RESEARCH_SEPARATORS.some(sep => message.content.includes(sep)) ||
    (message.tool === 'research' && message.content.length > 1000) ||
    (message.content.match(/\(Source: https?:\/\/[^\)]+\)/g) || []).length > 3 ||
    (message.metadata?.tool_used === 'research') ||
    (!!message.metadata?.research_session_id) ||
    message.content.includes("**Search Type**:") ||
    message.content.includes("**Generated**:") ||
    message.content.includes("**Relevance Score**:")
  )

  // ============================================================================
  // ENHANCED CONTENT PROCESSING
  // ============================================================================

  const getDisplayContent = (): { cleanContent: string; rawOutput: string; sources: SophiaSource[] } => {


    let content = message.content

    // Clean up general chat responses that end with {} (handling potential trailing whitespace)
    content = content.replace(/\{\}\s*$/, '').trim()

    // Handle Sophia messages with sources
    if (isSophiaMessage) {


      // Check if message has sources field from database
      if (message.sources && message.sources.length > 0) {

        // Convert SourceInfo to SophiaSource format
        const allSources: SophiaSource[] = message.sources.map((source: any) => ({
          filename: source.document_name || source.filename || 'Unknown',
          relevance: source.score || 0,
          excerpt: source.content_preview || source.excerpt,
          full_content: source.full_content,
          document_id: source.document_id,
          chunk_index: source.chunk_index
        }))



        // Deduplicate by filename, keeping highest relevance
        const sourcesByFilename = new Map<string, SophiaSource>()
        allSources.forEach(source => {
          const existing = sourcesByFilename.get(source.filename)
          if (!existing || source.relevance > existing.relevance) {
            sourcesByFilename.set(source.filename, source)
          }
        })

        const sources = Array.from(sourcesByFilename.values())
          .sort((a, b) => b.relevance - a.relevance) // Sort by relevance descending



        return { cleanContent: content, sources, rawOutput: '' }
      }

      // Fallback to parsing from text content
      console.log('⚠️ No message.sources found, falling back to text parsing')
      return extractSophiaSources(content)
    }

    // Handle file analysis messages
    if (isFileAnalysisMessage) {
      console.log('🚨 === FILE ANALYSIS MESSAGE - EXTRACTING RAW OUTPUT ===')
      return extractRawPandasOutput(content)
    }

    // Handle research sources
    if (!hasResearchSources) {
      // console.log('📄 No research sources detected - returning full content')
      return { cleanContent: content, rawOutput: '', sources: [] }
    }

    console.log('🔍 === RESEARCH MESSAGE SPLITTING ===')
    for (const separator of RESEARCH_SEPARATORS) {
      if (content.includes(separator)) {
        const parts = content.split(separator)
        const displayContent = parts[0].trim()

        return { cleanContent: displayContent, rawOutput: '', sources: [] }
      }
    }

    return { cleanContent: content, rawOutput: '', sources: [] }
  }

  const contentData = getDisplayContent()
  const displayContent = contentData.cleanContent
  const normalizedDisplayContent = (!isUser && isClavisMessage)
    ? normalizeHardWrappedStreamText(displayContent)
    : displayContent
  const rawOutput = contentData.rawOutput || ''
  const sophiaSources = contentData.sources || []



  // Extract base64 images from clean content only
  const extractBase64Images = (content: string): string[] => {
    const base64ImageRegex = /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/g
    const matches = []
    let match

    while ((match = base64ImageRegex.exec(content)) !== null) {
      matches.push(match[0])
    }

    return matches
  }

  const base64Images = extractBase64Images(normalizedDisplayContent)
  const hasVisualization = base64Images.length > 0

  // File analysis metadata
  const fileAnalysisInfo = message.metadata?.file_info || null
  const processingTime = message.metadata?.processing_time_ms || 0
  const toolUsed = message.metadata?.tool_used || message.tool
  const subtoolUsed = message.metadata?.subtool_used || message.subtool

  // Analytica specific data
  const analyticaVisualizations = message.metadata?.visualizations || []
  const analyticaExecutionOutput = message.metadata?.execution_output || null
  const analyticaCodeGenerated = message.metadata?.code_generated || null
  const analyticaSessionData = message.metadata?.session_data || null

  // 🔍 DEBUG: Log visualization data
  if (isAnalyticaMessage && !isUser) {
    console.log('\n========== CHAT MESSAGE RENDER ==========');
    console.log('📊 Message ID:', message.id);
    console.log('📊 Has visualizations in metadata:', !!message.metadata?.visualizations);
    console.log('📊 Visualizations count:', analyticaVisualizations?.length || 0);
    console.log('=========================================\n');
  }

  // ============================================================================
  // MUTATION HANDLERS
  // ============================================================================

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: ({ hardDelete }: { hardDelete: boolean }) =>
      apiClient.deleteChatMessage(chatId, message.id, hardDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      setIsDeleteDialogOpen(false)
      onMessageDeleted?.()
      toast({
        title: 'Success',
        description: 'Message deleted successfully',
        duration: 2000
      })
    },
    onError: (error) => {
      console.error('Failed to delete message:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  // Restore message mutation
  const restoreMessageMutation = useMutation({
    mutationFn: () => apiClient.restoreMessage(chatId, message.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      setIsRestoreDialogOpen(false)
      onMessageRestored?.()
      toast({
        title: 'Success',
        description: 'Message restored successfully',
        duration: 2000
      })
    },
    onError: (error) => {
      console.error('Failed to restore message:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore message',
        variant: 'destructive',
        duration: 2000
      })
    },
  })

  // ============================================================================
  // UTILITY HANDLERS
  // ============================================================================

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(normalizedDisplayContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: 'Copied',
        description: 'Message copied to clipboard',
        duration: 2000
      })
    } catch (error) {
      console.error('Failed to copy message:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy message',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleCopyRawContent = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: 'Copied Raw Content',
        description: 'Complete message content copied to clipboard',
        duration: 2000
      })
    } catch (error) {
      console.error('Failed to copy raw content:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy raw content',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleDownloadMessageAsPDF = async () => {
    try {
      const token = localStorage.getItem('mentis_auth_token')
      const apiUrl = import.meta.env.VITE_API_URL
      const response = await fetch(`${apiUrl}/message/${message.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `message-${message.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'PDF Downloaded',
        description: 'Message saved as PDF file',
        duration: 2000
      })
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleDownloadMessage = () => {
    const blob = new Blob([message.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `message-${message.id}-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded',
      description: 'Message saved as markdown file',
      duration: 2000
    })
  }

  const handleDownloadImages = () => {
    if (base64Images.length === 0) return

    base64Images.forEach((base64, index) => {
      const link = document.createElement('a')
      link.href = base64
      link.download = `analysis-chart-${message.id}-${index + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })

    toast({
      title: 'Images Downloaded',
      description: `${base64Images.length} visualization(s) downloaded`,
      duration: 2000
    })
  }

  const handleDownloadPDF = async () => {
    try {
      const bucketName = message.metadata?.bucket_name || message.metadata?.bucket_id || 'Data'

      await generateAnalyticaPDF({
        title: 'Analytical Report',
        content: message.content,
        visualizations: analyticaVisualizations,
        metadata: {
          bucketName,
          timestamp: new Date(message.created_at)
        }
      })

      toast({
        title: 'PDF Downloaded',
        description: 'Analysis report saved as PDF',
        duration: 2000
      })
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
        duration: 2000
      })
    }
  }

  const handleViewSourcesClick = () => {
    if (hasResearchSources && onViewSources) {
      // Pass structured sources and logs from the stored message data
      // so the execution panel can show them after page refresh
      const messageSources = message.sources && message.sources.length > 0 ? message.sources : undefined
      const messageLogs = message.metadata?.logs && Array.isArray(message.metadata.logs) ? message.metadata.logs : undefined
      onViewSources(message.content, message.id, messageSources, messageLogs)
    }
  }

  const handleDeleteMessage = (hardDelete: boolean = false) => {
    deleteMessageMutation.mutate({ hardDelete })
  }

  const handleRestoreMessage = () => {
    restoreMessageMutation.mutate()
  }

  // Edit handlers
  const handleStartEdit = () => {
    setEditedContent(message.content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent('')
  }

  const handleSendEdit = async () => {
    if (!sendMessage || !editedContent.trim() || isSending) return

    try {
      setIsSending(true)
      await sendMessage(editedContent.trim(), chatId)
      setIsEditing(false)
      setEditedContent('')
      toast({
        title: 'Message sent',
        description: 'Your edited message has been sent',
        duration: 2000
      })
    } catch (error) {
      console.error('Failed to send edited message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send edited message',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setIsSending(false)
    }
  }

  // Agent config detection
  const getAgentConfig = () => {
    if (isUser) return null


    // PRIORITY 1: Check for custom agent metadata
    if (message.metadata?.custom_agent_id && message.metadata?.custom_agent_name) {

      return {
        name: deduplicateAgentName(message.metadata.custom_agent_name) || message.metadata.custom_agent_name,
        icon: Bot,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        variant: 'beam' as const,
        colors: ['#9333ea', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff']
      }
    }


    // PRIORITY 2: Use chat-level agent type for assistant messages
    if (chatAgentType === 'sophia') {
      // console.log('🤖 Using Sophia config from chat agent type')
      return AGENT_CONFIGS.sophia
    } else if (chatAgentType === 'aegis') {
      console.log('🛡️ Using Aegis config from chat agent type')
      return AGENT_CONFIGS.aegis
    } else if (chatAgentType === 'clavis') {
      // console.log('💻 Using Clavis config from chat agent type')
      return AGENT_CONFIGS.clavis
    } else if (chatAgentType === 'analytica') {
      // console.log('📊 Using Analytica config from chat agent type')
      return AGENT_CONFIGS.analytica
    } else if (chatAgentType === 'custom') {
      // console.log('🎭 Using custom agent config from chat agent type')
      // Return generic custom agent config (metadata check above should have caught specific name)
      return {
        name: 'Custom Agent',
        icon: Bot,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        variant: 'beam' as const,
        colors: ['#9333ea', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff']
      }
    }

    // FALLBACK: Use message-level detection
    if (isSophiaMessage || message.tool === 'sophia') {
      console.log('🤖 Using Sophia config from message detection')
      return AGENT_CONFIGS.sophia
    } else if (isClavisMessage || message.tool === 'clavis') {
      console.log('💻 Using Clavis config from message detection')
      return AGENT_CONFIGS.clavis
    } else if (isAnalyticaMessage || message.tool === 'analytica') {
      console.log('📊 Using Analytica config from message detection')
      return AGENT_CONFIGS.analytica
    }

    // DEFAULT: Aegis
    console.log('🛡️ Using Aegis config as default')
    return AGENT_CONFIGS.aegis
  }

  const agentConfig = getAgentConfig()

  // Get knowledge base name from chat context if available
  const knowledgeBaseName = message.metadata?.knowledge_base_name || 'Knowledge Base'

  // Error Detection Helper
  const isErrorMessage = !isUser && (
    displayContent.startsWith('Error:') ||
    message.execution_status === 'failed' ||
    message.metadata?.error ||
    message.metadata?.success === false
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      <div
        className={cn(
          "flex flex-col group relative w-full mb-10", // Vertical stack, increased margin for clarity
          isDeleted && "opacity-60"
        )}
      >
        {/* Deleted Message Indicator */}
        {isDeleted && (
          <div className="absolute -top-2 left-0 z-10">
            <Badge variant="destructive" className="text-xs px-2 py-1">
              <Trash2 className="h-3 w-3 mr-1" />
              Deleted
            </Badge>
          </div>
        )}

        {/* Consolidated Message Header */}
        <div className={cn(
          "flex items-center gap-3 mb-2.5 px-1 w-full",
          isUser ? "flex-row justify-end" : "flex-row"
        )}>
          {/* Avatar (Assistant Only) */}
          {!isUser && (
            <div className="shrink-0">
              {message.metadata?.custom_agent_id || chatAgentType === 'custom' ? (
                <div className={cn(
                  "w-[32px] h-[32px] rounded-[8px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0",
                  isDeleted && "grayscale"
                )}>
                  <div className="w-[10px] h-[10px] bg-indigo-500 rounded-full" />
                </div>
              ) : (
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-[#1e2329] border border-gray-100 dark:border-gray-800 shadow-sm",
                  isDeleted && "grayscale"
                )}>
                  {agentConfig?.name === 'Sophia' ? (
                    <Target className="h-5 w-5 text-indigo-500" />
                  ) : agentConfig?.name === 'Clavis' ? (
                    <Code className="h-4 w-4 text-[#4ECDC4]" />
                  ) : agentConfig?.name === 'Analytica' ? (
                    <Activity className="h-4 w-4 text-[#06b6d4]" />
                  ) : (
                    <Shield className="h-4 w-4 text-indigo-500" />
                  )}
                </div>
              )}
            </div>
          )}

          <div className={cn(
            "flex items-center gap-2 overflow-hidden flex-wrap max-w-full w-full",
            isUser ? "flex-row justify-end" : "flex-row"
          )}>
            <span className={cn(
              "font-semibold text-[13px] shrink-0",
              isUser ? "text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-gray-100"
            )}>
              {isUser ? (user?.display_name?.split(' ')[0] || 'You') : (agentConfig?.name || 'Assistant')}
            </span>

            {!isUser && agentConfig && (
              <Badge variant="secondary" className={cn(
                "text-[10px] px-1.5 py-0 border-0 rounded-md uppercase tracking-wider font-bold shrink-0",
                message.metadata?.custom_agent_id || chatAgentType === 'custom'
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                  : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
              )}>
                {message.metadata?.custom_agent_id || chatAgentType === 'custom' ? 'Custom Agent' :
                  agentConfig.name === 'Sophia' ? 'Creative AI' :
                    agentConfig.name === 'Clavis' ? 'Code Assistant' :
                      agentConfig.name === 'Analytica' ? 'Data AI' : 'Agent'}
              </Badge>
            )}

            {/* Contextual Status Badges (Consolidated into Row 1) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isSophiaMessage && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 rounded-md border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 whitespace-nowrap"
                >
                  <Brain className="h-2.5 w-2.5 mr-1" />
                  Enhanced AI
                </Badge>
              )}

              {isClavisMessage && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 rounded-md border border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap"
                >
                  <Code className="h-2.5 w-2.5 mr-1" />
                  Code Analysis
                </Badge>
              )}

              {isAnalyticaMessage && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 rounded-md border border-cyan-200 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/40 whitespace-nowrap"
                >
                  <BarChart3 className="h-2.5 w-2.5 mr-1" />
                  Data Analysis
                </Badge>
              )}

              {hasCapabilityExecution && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 rounded-md border border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 whitespace-nowrap"
                >
                  <Zap className="h-2.5 w-2.5 mr-1" />
                  Execution
                </Badge>
              )}

              {isFileAnalysisMessage && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 rounded-md border border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-2.5 w-2.5 mr-1" />
                  File Analysis
                </Badge>
              )}

              {hasResearchSources && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 rounded-md border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 whitespace-nowrap"
                >
                  <Search className="h-2.5 w-2.5 mr-1" />
                  Research
                </Badge>
              )}

              {analyticaVisualizations?.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md border border-cyan-200 text-cyan-700 bg-cyan-50 whitespace-nowrap">
                  <TrendingUp className="h-2.5 w-2.5 mr-1" />
                  {analyticaVisualizations.length} Viz
                </Badge>
              )}

              {sophiaSources.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md border border-purple-300 text-purple-700 bg-purple-50 whitespace-nowrap">
                  <Database className="h-2.5 w-2.5 mr-1" />
                  {sophiaSources.length} Source{sophiaSources.length > 1 ? 's' : ''}
                </Badge>
              )}

              {!isUser && processingTime > 0 && (
                <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 opacity-70 px-1 shrink-0">
                  <Clock className="h-2.5 w-2.5" />
                  {Math.round(processingTime)}ms
                </span>
              )}

              {/* Timestamp */}
              <span className={cn(
                "text-[11px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap shrink-0 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
                isUser ? "pl-2" : "ml-auto pr-2"
              )}>
                {new Date(message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>
        </div>

        {/* AI Header Bold Divider */}
        {!isUser && (
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800/60 mb-2" />
        )}

        {/* Message Content Bubble / Card */}
        <div className={cn(
          "flex flex-col min-w-0 transition-all duration-200 relative w-full",
          isUser ? "items-end" : "items-start"
        )}>

          {/* File Analysis Metadata Display */}
          {isFileAnalysisMessage && fileAnalysisInfo && (
            <div className="mb-3 animate-slide-up">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">File Analysis Complete</span>
                  {fileAnalysisInfo.success && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-blue-700 font-medium">File:</span>
                    <span className="text-blue-600 ml-1 font-mono">{fileAnalysisInfo.filename}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Type:</span>
                    <span className="text-blue-600 ml-1">{fileAnalysisInfo.file_type}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Size:</span>
                    <span className="text-blue-600 ml-1">{(fileAnalysisInfo.file_size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Status:</span>
                    <span className="text-blue-600 ml-1 capitalize">{fileAnalysisInfo.status}</span>
                  </div>
                  {fileAnalysisInfo.shape && (
                    <div>
                      <span className="text-blue-700 font-medium">Shape:</span>
                      <span className="text-blue-600 ml-1 font-mono">{fileAnalysisInfo.shape.join(' × ')}</span>
                    </div>
                  )}
                  {fileAnalysisInfo.columns && fileAnalysisInfo.columns.length > 0 && (
                    <div>
                      <span className="text-blue-700 font-medium">Columns:</span>
                      <span className="text-blue-600 ml-1">{fileAnalysisInfo.columns.length}</span>
                    </div>
                  )}
                </div>

                {fileAnalysisInfo.errors && fileAnalysisInfo.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-xs text-red-800">
                      <span className="font-medium">Errors:</span> {fileAnalysisInfo.errors.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Content (Bubble Removed) */}
          <div
            className={cn(
              "rounded-2xl transition-all duration-200", // Increased rounding
              isUser
                ? isEditing
                  ? "bg-transparent w-full text-gray-800 dark:text-gray-200" // Remove background when editing
                  : cn(
                    "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-br-sm text-left max-w-[85%] px-5 py-3 shadow-sm border border-slate-200/60 dark:border-slate-700/50" // Slate bubble for user
                  )
                : "bg-white dark:bg-[#1c2128] text-slate-800 dark:text-slate-200 rounded-[10px] rounded-tl-sm text-left max-w-[85%] px-5 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800", // Bubble for AI message
              isDeleted && "border-red-200 bg-red-50 dark:bg-red-950/20"
            )}
          >
            {isUser && isEditing ? (
              <div
                className={cn(
                  "w-full max-w-[50%] ml-auto flex flex-col gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-3 shadow-none",
                  isDeleted && "line-through"
                )}
              >
                <textarea
                  ref={(el) => {
                    // Safe auto-focus mechanism that runs ONLY when element heavily mounts
                    // avoiding cursor hijacks on every render state change.
                    if (el && !el.dataset.focused) {
                      el.dataset.focused = 'true'
                      el.focus()
                      el.setSelectionRange(0, 0) // Puts cursor at very beginning (left)
                    }
                  }}
                  value={editedContent}
                  dir="ltr"
                  rows={2}
                  onChange={(e) => {
                    setEditedContent(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendEdit()
                    }
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  className="w-full text-[15px] leading-relaxed bg-transparent text-left text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  style={{
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    resize: 'none',
                    minHeight: '40px',
                    overflow: 'hidden',
                  }}
                />
                <div className="flex items-center justify-end pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSending}
                      className="h-7 px-3 text-xs rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendEdit}
                      disabled={isSending || !editedContent.trim()}
                      className="h-7 px-4 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isSending ? (
                        <>
                          <div className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(
                "markdown-content bg-transparent break-words overflow-hidden",
                isUser && "text-[15px] leading-relaxed", // Slightly larger base text for user bubbles
                isDeleted && "line-through"
              )}>
                {(() => {
                  if (isUser && !isMessageExpanded) {
                    const { text: truncatedText, isTruncated } = truncateBySentences(displayContent, 5);
                    return (
                      <>
                        <MarkdownContent
                          content={truncatedText}
                          isDarkTheme={isDarkTheme}
                        />
                        {isTruncated && (
                          <div className="mt-2 text-left">
                            <button
                              onClick={(e) => { e.preventDefault(); setIsMessageExpanded(true); }}
                              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline opacity-80 hover:opacity-100"
                            >
                              Show more
                            </button>
                          </div>
                        )}
                      </>
                    )
                  }

                  return (
                    <>
                      {isErrorMessage ? (
                        <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <AlertDescription className="text-red-800 dark:text-red-300 ml-1">
                            <MarkdownContent
                              content={displayContent}
                              isDarkTheme={isDarkTheme}
                            />
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <MarkdownContent
                          content={displayContent}
                          isDarkTheme={isDarkTheme}
                        />
                      )}
                      {isUser && isMessageExpanded && (
                        <div className="mt-2 text-left">
                          <button
                            onClick={(e) => { e.preventDefault(); setIsMessageExpanded(false); }}
                            className="text-xs text-slate-500 dark:text-slate-400 font-medium hover:underline opacity-80 hover:opacity-100"
                          >
                            Show less
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {/* EMBEDDED RAW OUTPUT TERMINAL */}
            {rawOutput && rawOutput.length > 0 && !isDeleted && (
              <div className="mt-6 animate-slide-up">
                <RawOutputTerminal
                  content={rawOutput}
                  messageId={message.id}
                  isVisible={showRawOutput}
                  onToggle={() => setShowRawOutput(!showRawOutput)}
                  isFileAnalysis={isFileAnalysisMessage}
                />
              </div>
            )}

            {/* INLINE MESSAGE ACTIONS (Bottom of AI Message) */}
            {!isUser && !isEditing && !isDeleted && !isInitialMessage && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  onClick={handleCopyMessage}
                >
                  {isCopied ? <Check className="h-3 w-3 mr-1.5 text-green-500" /> : <Copy className="h-3 w-3 mr-1.5" />}
                  {isCopied ? "Copied" : "Copy"}
                </Button>

                {!isErrorMessage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      onClick={handleDownloadMessage}
                    >
                      <Download className="h-3 w-3 mr-1.5" />
                      Markdown
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      onClick={handleDownloadMessageAsPDF}
                    >
                      <FileText className="h-3 w-3 mr-1.5" />
                      PDF
                    </Button>
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <MoreHorizontal className="h-3 w-3 mr-1.5" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">                  {chatAgentType === 'analytica' && analyticaVisualizations.length > 0 && !isErrorMessage && (
                    <DropdownMenuItem onClick={handleDownloadPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download as PDF
                    </DropdownMenuItem>
                  )}

                    {hasVisualization && (
                      <DropdownMenuItem onClick={handleDownloadImages}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Download Charts ({base64Images.length})
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setShowDebugContent(!showDebugContent)}>
                      <Terminal className="h-4 w-4 mr-2" />
                      {showDebugContent ? 'Hide' : 'Show'} Debug
                    </DropdownMenuItem>

                    {!isErrorMessage && (
                      <DropdownMenuItem onClick={handleCopyRawContent}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Raw Content
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

          </div>

          {/* USER MESSAGE ACTIONS (Below Bubble, Right Aligned) */}
          {isUser && !isEditing && (
            <div className="mt-1.5 flex items-center justify-end gap-2 pr-1 w-full opacity-60 hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-full"
                onClick={handleCopyMessage}
                title="Copy"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>

              {!isDeleted && sendMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-full"
                  onClick={handleStartEdit}
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}

              {isDeleted ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-full"
                  onClick={() => setIsRestoreDialogOpen(true)}
                  title="Restore"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
          {/* View Research Button for Sophia */}
          {
            sophiaSources.length > 0 && !isDeleted && (
              // <Button
              //   variant="outline"
              //   size="sm"
              //   onClick={() => onViewResearch?.(sophiaSources, knowledgeBaseName || 'Knowledge Base')}
              //   className="mt-2 text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-950"
              // >
              //   <FileText className="h-4 w-4 mr-2" />
              //   View Research ({sophiaSources.length} {sophiaSources.length === 1 ? 'source' : 'sources'})
              // </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewResearch?.(sophiaSources, knowledgeBaseName || 'Knowledge Base')}
                className="
              mt-1
              px-2 py-1
              text-xs
              text-slate-700
              border-slate-300
              bg-white
              hover:bg-slate-50
              hover:border-slate-400
              dark:bg-slate-900
              dark:text-slate-200
              dark:border-slate-700
              dark:hover:bg-slate-800
              dark:hover:border-slate-600
              rounded-md
              shadow-sm
              transition-all duration-200
            "
              >
                <FileText className="h-3 w-3 mr-1" />
                View Research Sources
              </Button>
            )
          }

          {/* Clavis Code Sources Display */}
          {
            isClavisMessage && message.metadata?.sources_used && !isDeleted && (
              <ClavisSourcesDisplay
                sources={message.metadata.sources_used}
                messageId={message.id}
                repoName={message.metadata.repo_name || 'Repository'}
              />
            )
          }

          {/* ANALYTICA PLOTLY VISUALIZATIONS */}
          {
            !isDeleted && analyticaVisualizations && Array.isArray(analyticaVisualizations) && analyticaVisualizations.length > 0 && (
              <div className="mt-6 space-y-4 animate-slide-up w-full max-w-[85%]">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Data Visualizations ({analyticaVisualizations.length})
                  </h3>
                </div>

                {analyticaVisualizations.map((viz: any, index: number) => (
                  <AnalyticaVisualization
                    key={index}
                    visualization={viz}
                    index={index}
                    messageId={message.id}
                  />
                ))}
              </div>
            )
          }

          {/* ANALYTICA EXECUTION OUTPUT */}
          {
            !isDeleted && analyticaExecutionOutput && (
              <div className="mt-4 animate-slide-up w-full max-w-[85%]">
                <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                  <div className="bg-slate-800 border-b border-slate-700 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-slate-200">Python Execution Output</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                        onClick={() => {
                          navigator.clipboard.writeText(analyticaExecutionOutput)
                          setIsCodeExecCopied(true)
                          setTimeout(() => setIsCodeExecCopied(false), 2000)
                        }}
                      >
                        {isCodeExecCopied ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
                        {isCodeExecCopied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <pre className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap max-h-64 overflow-auto">
                      {analyticaExecutionOutput}
                    </pre>
                  </CardContent>

                  <div className="bg-slate-800 px-3 py-2 border-t border-slate-700">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono">
                        {analyticaExecutionOutput.split('\n').length} lines
                      </span>
                      <Badge className="bg-green-900/50 text-green-400 border-0">
                        Executed
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            )
          }

          {/* ANALYTICA CODE GENERATED */}
          {
            !isDeleted && analyticaCodeGenerated && (
              <div className="mt-4 animate-slide-up w-full max-w-[85%]">
                <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                  <div className="bg-slate-800 border-b border-slate-700 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-200">Generated Python Code</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                        onClick={() => {
                          navigator.clipboard.writeText(analyticaCodeGenerated)
                          setIsCodeGeneratedCopied(true)
                          setTimeout(() => setIsCodeGeneratedCopied(false), 2000)
                        }}
                      >
                        {isCodeGeneratedCopied ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
                        {isCodeGeneratedCopied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <pre className="text-xs font-mono text-blue-400 leading-relaxed whitespace-pre-wrap max-h-64 overflow-auto">
                      {analyticaCodeGenerated}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )
          }

          {/* ANALYTICA SESSION DATA INFO */}
          {
            !isDeleted && analyticaSessionData && (
              <div className="mt-4 animate-slide-up w-full max-w-[85%]">
                <Alert className="border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30">
                  <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <AlertDescription className="text-cyan-900 dark:text-cyan-100 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Data Session Active</strong>
                        {analyticaSessionData.filename && (
                          <span className="ml-2 text-cyan-700">
                            • {analyticaSessionData.filename}
                          </span>
                        )}
                      </div>
                      {analyticaSessionData.data_shape && (
                        <Badge className="bg-cyan-100 text-cyan-800 border-0">
                          {analyticaSessionData.data_shape[0]} × {analyticaSessionData.data_shape[1]}
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )
          }

          {/* VIEW EXECUTION BUTTON for Custom Agent Capability Execution */}
          {
            hasCapabilityExecution && !isDeleted && onViewExecution && (
              <div className="mt-2 animate-slide-up w-full">
                <Button
                  onClick={() => onViewExecution(message.id)}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 py-1 text-xs border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
                >
                  <Zap className="h-3 w-3 mr-1.5" />
                  View Execution
                  <Eye className="h-3 w-3 ml-1.5" />
                </Button>
              </div>
            )
          }

          {/* View Research Sources Button (for Aegis research) */}
          {
            hasResearchSources && !isDeleted && (
              <div className="mt-2 animate-slide-up w-full">
                <Button
                  onClick={handleViewSourcesClick}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 py-1 text-xs border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
                >
                  <Database className="h-3 w-3 mr-1.5" />
                  View Research Sources
                  <Eye className="h-3 w-3 ml-1.5" />
                </Button>
              </div>
            )
          }

          {/* File Analysis Actions */}
          {isFileAnalysisMessage && !isDeleted && (
            <div className="mt-2 animate-slide-up w-full">
              <div className="flex items-center gap-2">
                {hasVisualization && (
                  <Button
                    onClick={handleDownloadImages}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 py-1 text-xs border border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    <BarChart3 className="h-3 w-3 mr-1.5" />
                    Download Charts ({base64Images.length})
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Message Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="card-glass">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete this message? This action can be undone by restoring the message.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border backdrop-blur-sm">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {normalizedDisplayContent}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMessageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteMessage(false)}
              disabled={deleteMessageMutation.isPending}
            >
              {deleteMessageMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Message Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="card-glass">
          <DialogHeader>
            <DialogTitle>Restore Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This will restore the deleted message and make it visible in the chat again.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border backdrop-blur-sm">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {normalizedDisplayContent}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRestoreDialogOpen(false)}
              disabled={restoreMessageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreMessage}
              disabled={restoreMessageMutation.isPending}
            >
              {restoreMessageMutation.isPending ? 'Restoring...' : 'Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}