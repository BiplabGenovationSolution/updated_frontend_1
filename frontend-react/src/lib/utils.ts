// frontend/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Chat, AgentType, KnowledgeBase, Document } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Enhanced chat data sanitization with proper error handling
export function sanitizeChatData(chat: any): Chat {
  // Note: Field mapping should happen in API client, but this provides fallback

  // Validate agent_type with fallback to camelCase - UPDATED WITH CLAVIS, ANALYTICA, AND CUSTOM SUPPORT
  let agentType: AgentType = 'aegis' // fallback
  if (chat.agent_type === 'sophia' || chat.agent_type === 'aegis' || chat.agent_type === 'clavis' || chat.agent_type === 'analytica' || chat.agent_type === 'custom') {
    agentType = chat.agent_type
    console.log('✅ Valid snake_case agent_type:', chat.agent_type)
  } else if (chat.agentType === 'sophia' || chat.agentType === 'aegis' || chat.agentType === 'clavis' || chat.agentType === 'analytica' || chat.agentType === 'custom') {
    // Handle camelCase from backend (should be mapped in API client)
    agentType = chat.agentType
    console.warn('⚠️ Found camelCase agentType, should be mapped in API client:', {
      chatId: chat.id,
      agentType: chat.agentType
    })
  } else {
    console.error('❌ Invalid or missing agent_type for chat:', {
      chatId: chat.id,
      agent_type: chat.agent_type,
      agentType: chat.agentType,
      title: chat.title?.substring(0, 30)
    })
  }

  return {
    id: chat.id || '',
    title: chat.title || 'Untitled Chat',
    agent_type: agentType,
    knowledge_base_id: chat.knowledge_base_id || chat.knowledgeBaseId,
    codebase_id: chat.codebase_id || chat.codebaseId,
    bucket_id: chat.bucket_id || chat.bucketId,
    user_id: chat.user_id || chat.userId || '',
    status: chat.status || 'active',
    created_at: chat.created_at || chat.createdAt || new Date().toISOString(),
    updated_at: chat.updated_at || chat.updatedAt || new Date().toISOString(),
    last_message_at: chat.last_message_at || chat.lastMessageAt,
    metadata: chat.metadata || {}
  }
}

// ENHANCED: DateTime formatting with better error handling and ISO string support
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) {
    return 'Unknown'
  }

  try {
    let date: Date

    if (typeof dateInput === 'string') {
      // Handle ISO date strings from backend like "2025-07-14T23:59:01.020475"
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      return 'Unknown'
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date input in formatDateTime:', dateInput)
      return 'Invalid date'
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  } catch (error) {
    console.error('Error formatting date time:', error, 'Input:', dateInput)
    return 'Unknown'
  }
}

// ENHANCED: Date formatting that handles various date formats including ISO strings
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) {
    return 'No date'
  }

  try {
    let date: Date

    if (typeof dateInput === 'string') {
      // Handle ISO date strings from backend like "2025-07-14T23:59:01.020475"
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      return 'Invalid date'
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date input in formatDate:', dateInput)
      return 'Invalid date'
    }

    // Format to readable date
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // If it's today, show time
    if (diffDays <= 1) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }

    // If it's this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }

    // Otherwise show full date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateInput)
    return 'Invalid date'
  }
}

// ENHANCED: File size formatting with better precision
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// ✅ FIXED: Validate agent type helper - NOW INCLUDES CLAVIS, ANALYTICA, AND CUSTOM
export function isValidAgentType(agentType: any): agentType is AgentType {
  return agentType === 'sophia' || agentType === 'aegis' || agentType === 'clavis' || agentType === 'analytica' || agentType === 'custom'
}

/**
 * Deduplicate a doubled agent name.
 * If the name is "Bengali WriterBengali Writer", returns "Bengali Writer".
 * Handles cases where the name was accidentally stored twice in the DB.
 */
export function deduplicateAgentName(name: string | null | undefined): string | null {
  if (!name) return name ?? null
  const half = name.length / 2
  if (Number.isInteger(half) && name.slice(0, half) === name.slice(half)) {
    return name.slice(0, half)
  }
  return name
}

// Debug helper for chat data
export function debugChatData(chat: any, context: string) {
  console.log(`🔍 Debug Chat Data (${context}):`, {
    id: chat.id,
    title: chat.title,
    agent_type: chat.agent_type,
    agentType: chat.agentType,
    knowledge_base_id: chat.knowledge_base_id,
    knowledgeBaseId: chat.knowledgeBaseId,
    codebase_id: chat.codebase_id,
    codebaseId: chat.codebaseId,
    bucket_id: chat.bucket_id,
    bucketId: chat.bucketId,
    rawData: chat
  })
}

// ADDED: Format relative time utility
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Unknown'

  try {
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return 'Invalid date'

    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return formatDate(date)
  } catch (error) {
    console.error('Relative time formatting error:', error)
    return 'Unknown'
  }
}

// ADDED: Force React Query refresh utility
export function forceQueryRefresh(queryClient: any, queryKeys: string[]): void {
  try {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] })
      queryClient.refetchQueries({ queryKey: [key] })
    })
  } catch (error) {
    console.warn('Failed to force query refresh:', error)
  }
}

// ADDED: Debug utility for checking data
export function debugLog(label: string, data: any): void {
  if (import.meta.env.DEV) {
    console.log(`🔍 ${label}:`, data)
  }
}

// ADDED: Safe document field extraction
export function safeDocumentField(doc: any, field: string, fallback: any = null): any {
  try {
    // Try direct field access first
    if (doc[field] !== undefined && doc[field] !== null) {
      return doc[field]
    }

    // Try metadata field access
    if (doc.metadata && doc.metadata[field] !== undefined && doc.metadata[field] !== null) {
      return doc.metadata[field]
    }

    return fallback
  } catch (error) {
    console.warn(`Error accessing field ${field} from document:`, error)
    return fallback
  }
}

// ADDED: Validate document data
export function validateDocumentData(doc: any): boolean {
  if (!doc || typeof doc !== 'object') {
    return false
  }

  // Check required fields
  const requiredFields = ['id', 'filename', 'created_at']
  for (const field of requiredFields) {
    if (!doc[field] && !doc.document_id) {
      console.warn(`Document missing required field: ${field}`, doc)
      return false
    }
  }

  return true
}

// CRITICAL: Knowledge base document count helper - ENHANCED for Sophia API
export function getDocumentCountFromKB(kb: any): number {
  // Handle all possible field names from different API responses
  const count = kb.document_count ||
    kb.documents_count ||
    kb.documentCount ||
    kb.doc_count ||
    kb.num_documents ||
    kb.total_documents ||
    0

  // Log for debugging in development
  if (import.meta.env.DEV && count === 0 && kb.id) {
    console.log(`📊 KB Document Count - ${kb.name}:`, {
      id: kb.id,
      document_count: kb.document_count,
      documents_count: kb.documents_count,
      documentCount: kb.documentCount,
      doc_count: kb.doc_count,
      total_documents: kb.total_documents,
      computed_count: count
    })
  }

  return count
}

// ADDED: Format processing status for display
export function formatProcessingStatus(status: string): { label: string; color: string } {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'active':
      return { label: 'Ready', color: 'green' }
    case 'processing':
      return { label: 'Processing', color: 'blue' }
    case 'pending':
      return { label: 'Pending', color: 'yellow' }
    case 'failed':
    case 'error':
      return { label: 'Failed', color: 'red' }
    default:
      return { label: 'Unknown', color: 'gray' }
  }
}

// ADDED: Extract chunk count safely
export function getChunkCount(doc: any): number {
  return doc.chunk_count ||
    doc.chunks_count ||
    doc.chunkCount ||
    (doc.metadata?.chunk_count) ||
    0
}

// ADDED: Extract file size safely  
export function getFileSize(doc: any): number {
  return doc.size_bytes ||
    doc.file_size ||
    doc.fileSize ||
    (doc.metadata?.size_bytes) ||
    (doc.metadata?.file_size) ||
    0
}

// ADDED: Check if date is valid
export function isValidDate(dateInput: any): boolean {
  if (!dateInput) return false

  try {
    const date = new Date(dateInput)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}

// NEW: Sophia-specific utilities
export function normalizeSophiaResponse<T>(response: any): T | null {
  try {
    if (response && response.success === true && response.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error('Error normalizing Sophia response:', error)
    return null
  }
}

// NEW: Enhanced document validation for Sophia backend
export function validateSophiaDocument(doc: any): boolean {
  if (!doc || typeof doc !== 'object') {
    return false
  }

  // Required fields for Sophia documents
  const hasId = doc.id || doc.document_id
  const hasFilename = doc.filename
  const hasCreatedAt = doc.created_at

  if (!hasId || !hasFilename || !hasCreatedAt) {
    console.warn('Sophia document validation failed:', {
      hasId: !!hasId,
      hasFilename: !!hasFilename,
      hasCreatedAt: !!hasCreatedAt,
      doc
    })
    return false
  }

  return true
}

// NEW: Knowledge base validation for Sophia backend
export function validateSophiaKnowledgeBase(kb: any): boolean {
  if (!kb || typeof kb !== 'object') {
    return false
  }

  const hasId = !!kb.id
  const hasName = !!kb.name
  const hasCreatedAt = !!kb.created_at

  if (!hasId || !hasName || !hasCreatedAt) {
    console.warn('Sophia knowledge base validation failed:', {
      hasId,
      hasName,
      hasCreatedAt,
      kb
    })
    return false
  }

  return true
}

// NEW: Extract download URL safely
export function getDownloadUrl(doc: any): string | null {
  return doc.download_url ||
    doc.s3_url ||
    doc.url ||
    (doc.metadata?.download_url) ||
    (doc.metadata?.s3_url) ||
    null
}

// NEW: Get embedding status
export function getEmbeddingStatus(doc: any): string {
  return doc.embedding_status ||
    doc.processing_status ||
    (doc.metadata?.embedding_status) ||
    'unknown'
}

// NEW: Check if document is ready for Sophia queries
export function isDocumentReadyForSophia(doc: any): boolean {
  const status = getEmbeddingStatus(doc)
  const chunkCount = getChunkCount(doc)

  return (status === 'completed' || status === 'active') && chunkCount > 0
}

// NEW: Enhanced cache key generation for React Query
export function generateCacheKey(baseKey: string, params?: Record<string, any>): (string | Record<string, any>)[] {
  const key: (string | Record<string, any>)[] = [baseKey]

  if (params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: Record<string, any>, k) => {
        acc[k] = params[k]
        return acc
      }, {})

    key.push(sortedParams)
  }

  return key
}

// NEW: Error message extractor for API responses
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.message) {
    return error.message
  }

  if (error?.response?.data?.error) {
    return error.response.data.error
  }

  if (error?.response?.data?.detail) {
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail
        .map((err: any) => err.msg || err.message || 'Validation error')
        .join(', ')
    }
    return error.response.data.detail
  }

  return 'An unknown error occurred'
}

// NEW: Sophia health status checker
export function getSophiaHealthStatus(kb: any): 'healthy' | 'degraded' | 'unhealthy' {
  return kb.health_status || 'healthy'
}

// NEW: Format processing time
export function formatProcessingTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  } else {
    return `${(ms / 60000).toFixed(1)}m`
  }
}

// NEW: Get KB storage size formatted
export function formatStorageSize(bytes: number): string {
  if (!bytes) return '0 MB'
  return formatFileSize(bytes)
}

// NEW: Check if KB needs document count refresh
export function needsDocumentCountRefresh(kb: any): boolean {
  const count = getDocumentCountFromKB(kb)
  const hasDocuments = kb.documents && Array.isArray(kb.documents) && kb.documents.length > 0

  // If we have documents but count is 0, we need a refresh
  return hasDocuments && count === 0
}

// NEW: Validate file type for upload
export function isValidFileTypeForSophia(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension) return false

  const supportedExtensions = [
    'pdf', 'docx', 'doc', 'txt', 'md', 'rtf',
    'xlsx', 'xls', 'csv',
    'json', 'py', 'js', 'html', 'css'
  ]

  return supportedExtensions.includes(extension)
}

// NEW: Get file type category
export function getFileTypeCategory(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension) return 'Unknown'

  const categories = {
    documents: ['pdf', 'docx', 'doc', 'txt', 'md', 'rtf'],
    spreadsheets: ['xlsx', 'xls', 'csv'],
    code: ['py', 'js', 'json', 'html', 'css'],
    archives: ['zip', 'tar', 'gz'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'svg']
  }

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(extension)) {
      return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }

  return 'File'
}

// NEW: Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        break
      }

      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retry attempt ${attempt + 1}/${maxRetries + 1} in ${delay}ms`)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// ============================================================================
// CLAVIS-SPECIFIC UTILITIES
// ============================================================================

// NEW: Validate codebase data
export function validateClavisCodebase(codebase: any): boolean {
  if (!codebase || typeof codebase !== 'object') {
    return false
  }

  const hasId = !!codebase.id || !!codebase.codebase_id
  const hasRepoName = !!codebase.repo_name
  const hasRepoPath = !!codebase.repo_path

  if (!hasId || !hasRepoName || !hasRepoPath) {
    console.warn('Clavis codebase validation failed:', {
      hasId,
      hasRepoName,
      hasRepoPath,
      codebase
    })
    return false
  }

  return true
}

// NEW: Get codebase chunk count
export function getCodebaseChunkCount(codebase: any): number {
  return codebase.total_chunks ||
    codebase.chunks_count ||
    codebase.chunkCount ||
    0
}

// NEW: Get codebase file count
export function getCodebaseFileCount(codebase: any): number {
  return codebase.total_files ||
    codebase.files_count ||
    codebase.fileCount ||
    0
}

// NEW: Check if codebase is ready for Clavis queries
export function isCodebaseReadyForClavis(codebase: any): boolean {
  const chunkCount = getCodebaseChunkCount(codebase)
  const fileCount = getCodebaseFileCount(codebase)

  return chunkCount > 0 && fileCount > 0
}

// NEW: Format codebase repo type
export function formatRepoType(repoType: string): string {
  switch (repoType?.toLowerCase()) {
    case 'cloned':
      return 'Git Repository'
    case 'local':
      return 'Local Upload'
    default:
      return 'Repository'
  }
}

// NEW: Get codebase ID safely
export function getCodebaseId(codebase: any): string {
  return codebase.codebase_id || codebase.id || ''
}

// NEW: Validate code source (for displaying in UI)
export function validateCodeSource(source: any): boolean {
  if (!source || typeof source !== 'object') {
    return false
  }

  return !!(source.file_path && source.content)
}

// NEW: Format similarity score
export function formatSimilarityScore(score: string | number): string {
  if (typeof score === 'string' && score.includes('%')) {
    return score
  }

  const numScore = typeof score === 'string' ? parseFloat(score) : score
  return `${(numScore * 100).toFixed(1)}%`
}

// NEW: Get code language from file path
export function getCodeLanguage(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()

  const languageMap: Record<string, string> = {
    'py': 'Python',
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'jsx': 'React',
    'tsx': 'React TypeScript',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'go': 'Go',
    'rs': 'Rust',
    'php': 'PHP',
    'rb': 'Ruby',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'md': 'Markdown',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Bash'
  }

  return languageMap[extension || ''] || 'Code'
}

// ============================================================================
// ANALYTICA-SPECIFIC UTILITIES
// ============================================================================

// NEW: Validate bucket data
export function validateAnalyticaBucket(bucket: any): boolean {
  if (!bucket || typeof bucket !== 'object') {
    return false
  }

  const hasId = !!bucket.id || !!bucket.bucket_id
  const hasName = !!bucket.name

  if (!hasId || !hasName) {
    console.warn('Analytica bucket validation failed:', {
      hasId,
      hasName,
      bucket
    })
    return false
  }

  return true
}

// NEW: Get bucket file count
export function getBucketFileCount(bucket: any): number {
  return bucket.file_count ||
    bucket.files_count ||
    bucket.fileCount ||
    bucket.total_files ||
    0
}

// NEW: Get bucket data size
export function getBucketDataSize(bucket: any): number {
  return bucket.total_size ||
    bucket.data_size ||
    bucket.size ||
    0
}

// NEW: Check if bucket is ready for Analytica queries
export function isBucketReadyForAnalytica(bucket: any): boolean {
  const fileCount = getBucketFileCount(bucket)
  return fileCount > 0
}

// NEW: Get bucket ID safely
export function getBucketId(bucket: any): string {
  return bucket.bucket_id || bucket.id || ''
}

// NEW: Validate data file for Analytica
export function isValidDataFileForAnalytica(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension) return false

  const supportedExtensions = ['csv', 'xlsx', 'xls', 'json']
  return supportedExtensions.includes(extension)
}

// NEW: Get data file type
export function getDataFileType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()

  const typeMap: Record<string, string> = {
    'csv': 'CSV',
    'xlsx': 'Excel',
    'xls': 'Excel',
    'json': 'JSON',
    'parquet': 'Parquet'
  }

  return typeMap[extension || ''] || 'Data File'
}

// NEW: Format data size for display
export function formatDataSize(bytes: number): string {
  return formatFileSize(bytes)
}

// NEW: Validate visualization data
export function validateVisualization(viz: any): boolean {
  if (!viz || typeof viz !== 'object') {
    return false
  }

  return !!(viz.type && viz.data)
}

// NEW: Get visualization type label
export function getVisualizationType(type: string): string {
  const typeMap: Record<string, string> = {
    'bar': 'Bar Chart',
    'line': 'Line Chart',
    'scatter': 'Scatter Plot',
    'pie': 'Pie Chart',
    'histogram': 'Histogram',
    'box': 'Box Plot',
    'heatmap': 'Heatmap',
    'plotly': 'Interactive Chart'
  }

  return typeMap[type?.toLowerCase()] || 'Chart'
}