/**
 * Unified API Client for Mentis Extended
 * Provides API methods for all agents with SSE streaming support
 */

import { DIRECT_BACKEND_URL } from './constants'

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface Message {
  id: string
  chatId: string
  userId: string
  sender: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  updatedAt: string
  attachments?: any[]
  artifacts?: any[]
  sources?: any[]
  metadata?: Record<string, any>
}

export interface Chat {
  id: string
  userId: string
  title: string
  agentType: 'aegis' | 'sophia' | 'clavis' | 'analytica'
  tool?: string
  subtool?: string
  knowledgeBaseId?: string
  codebaseId?: string
  bucketId?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface CreateChatRequest {
  title: string
  agent_type: 'aegis' | 'sophia' | 'clavis' | 'analytica' | 'custom'
  knowledge_base_id?: string
  codebase_id?: string
  bucket_id?: string
  custom_agent_id?: string
  tool?: string
  subtool?: string
  metadata?: Record<string, any>
}

export interface CreateMessageRequest {
  content: string
  sender?: 'user' | 'assistant' | 'system'
  tool?: string
  subtool?: string
  tool_config?: Record<string, any>
  metadata?: Record<string, any>
  knowledge_base_id?: string
  custom_agent_id?: string
  stream_response?: boolean
}

export interface SSEMessage {
  event: string
  data: any
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mentis_auth_token')
  }
  return null
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

function getAuthHeadersForUpload(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function getSSEHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

async function handle401Response(): Promise<boolean> {
  console.warn('🔐 401 Unauthorized - attempting token refresh')

  // Try to refresh the token first
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('mentis_refresh_token') : null

  if (refreshToken) {
    try {
      const refreshResponse = await authAPI.refreshToken()
      if (refreshResponse.success) {
        console.log('✅ Token refreshed successfully, retry the request')
        return true // Token refreshed, caller should retry
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
    }
  }

  // If refresh failed or no refresh token, clear auth and redirect
  console.warn('🔐 Token refresh failed - clearing auth and redirecting to login')
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mentis_auth_token')
    localStorage.removeItem('mentis_refresh_token')
    localStorage.removeItem('mentis_user_data')

    // Redirect to login page
    window.location.href = '/auth/login'
  }

  return false
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  // Handle 401 Unauthorized - try refresh, then redirect if needed
  if (response.status === 401) {
    const refreshed = await handle401Response()

    return {
      success: false,
      error: refreshed ? 'Token refreshed, please retry' : 'Authentication required. Please login again.'
    }
  }

  if (!response.ok) {
    let errorDetail = ''
    try { errorDetail = await response.text() } catch { /* ignore */ }
    const err = new Error(errorDetail || `HTTP ${response.status}: ${response.statusText}`) as any
    err.status = response.status
    err.response = { data: { detail: errorDetail } }
    throw err
  }

  try {
    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (e) {
    return {
      success: false,
      error: 'Failed to parse response'
    }
  }
}

// ============================================================================
// Authentication API
// ============================================================================

export const authAPI = {
  /**
   * Login with email and password
   */
  async login(data: { email: string; password: string }): Promise<ApiResponse<any>> {
    console.log("*******************************")
    console.log(DIRECT_BACKEND_URL)
    console.log("*******************************")
    const response = await fetch(`${DIRECT_BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    // Handle 401 specifically for login to avoid global redirect/reload
    if (response.status === 401) {
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }

    const result = await handleResponse(response)

    // Store tokens if login successful
    if (result.success && result.data) {
      const { access_token, refresh_token, user } = result.data
      if (access_token) {
        localStorage.setItem('mentis_auth_token', access_token)
      }
      if (refresh_token) {
        localStorage.setItem('mentis_refresh_token', refresh_token)
      }
    }

    return result
  },

  /**
   * Register new user
   */
  async register(data: { email: string; password: string; display_name?: string; id_token?: string }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        display_name: data.display_name
      })
    })

    const result = await handleResponse(response)

    // Store tokens if registration successful
    if (result.success && result.data) {
      const { access_token, refresh_token } = result.data
      if (access_token) {
        localStorage.setItem('mentis_auth_token', access_token)
      }
      if (refresh_token) {
        localStorage.setItem('mentis_refresh_token', refresh_token)
      }
    }

    return result
  },

  /**
   * Get current user from token
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    const refreshToken = localStorage.getItem('mentis_refresh_token')
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token found'
      }
    }

    const response = await fetch(`${DIRECT_BACKEND_URL}/auth/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'token': refreshToken })
    })

    return handleResponse(response)
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<any>> {
    const refreshToken = localStorage.getItem('mentis_refresh_token')
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token found'
      }
    }

    const response = await fetch(`${DIRECT_BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'refresh_token': refreshToken })
    })

    // Manually handle response to avoid infinite loop with handleResponse -> handle401Response -> refreshToken
    if (response.status === 401) {
      return {
        success: false,
        error: 'Refresh token expired or invalid'
      }
    }

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        error: error || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    let data
    try {
      data = await response.json()
    } catch (e) {
      return {
        success: false,
        error: 'Failed to parse response'
      }
    }

    const result = {
      success: true,
      data
    }
    //console.log("result+++++++++++++++++++++", result)

    // Store new tokens
    if (result.success) {
      const { access_token, refresh_token } = result.data
      if (access_token) {
        localStorage.setItem('mentis_auth_token', access_token)
      }
      if (refresh_token) {
        localStorage.setItem('mentis_refresh_token', refresh_token)
      }
    }

    return result
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('mentis_auth_token')
    localStorage.removeItem('mentis_refresh_token')
  }
}

/**
 * Parse SSE stream and call handlers for each event
 */
export async function parseSSEStream(
  response: Response,
  handlers: {
    onStart?: (data: any) => void
    onProgress?: (data: any) => void
    onDelta?: (data: any) => void
    onSources?: (data: any) => void
    onCompletion?: (data: any) => void
    onError?: (data: any) => void
    onEvent?: (event: string, data: any) => void
  }
): Promise<void> {
  console.log('🔍 DEBUG: parseSSEStream started')
  const reader = response.body?.getReader()
  if (!reader) {
    console.error('🔍 DEBUG: No response body reader!')
    throw new Error('No response body')
  }

  console.log('🔍 DEBUG: Got reader, starting to read stream...')
  const decoder = new TextDecoder()
  let buffer = ''
  let chunkCount = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        console.log(`🔍 DEBUG: Stream done after ${chunkCount} chunks`)
        // Fallback: Ensure UI cleans up if backend closes stream without an explicit completion event
        handlers.onCompletion?.({ is_end_of_stream: true, success: true })
        break
      }

      chunkCount++
      console.log(`🔍 DEBUG: Received chunk ${chunkCount}, size: ${value?.byteLength} bytes`)

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || ''

      let currentEvent = 'message'
      let currentData = ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          currentData = line.slice(5).trim()
        } else if (line === '') {
          // Empty line indicates end of message
          if (currentData) {
            try {
              const parsed = JSON.parse(currentData)

              // Check if using new type-based format or old event-based format
              if (parsed.type) {
                // New format: use parsed.type field
                switch (parsed.type) {
                  case 'message_start':
                    handlers.onStart?.(parsed.data || parsed)
                    break
                  case 'content_delta':
                    handlers.onDelta?.(parsed)
                    break
                  case 'message_complete':
                    console.log('✅ Stream completed')
                    handlers.onCompletion?.(parsed)
                    break
                  case 'user_message':
                    // User message sent, no action needed
                    break
                  case 'completed':
                    console.log('✅ Stream completed (legacy)')
                    handlers.onCompletion?.(parsed)
                    break
                  case 'error':
                    console.error('❌ Stream error:', parsed)
                    handlers.onError?.(parsed)
                    break
                  case 'progress':
                    handlers.onProgress?.(parsed)
                    break
                  case 'sources':
                    console.log('📚 Sources received')
                    handlers.onSources?.(parsed)
                    break
                  default:
                    // Call generic event handler for unknown types
                    handlers.onEvent?.(parsed.type, parsed)
                }
              } else {
                // Fallback to old event-based handling
                // console.log('🔄 Using OLD event format, currentEvent:', currentEvent, 'parsed data:', parsed)
                switch (currentEvent) {
                  case 'start':
                    // console.log('✅ Calling onStart handler')
                    handlers.onStart?.(parsed)
                    break
                  case 'progress':
                    // console.log('✅ Calling onProgress handler')
                    handlers.onProgress?.(parsed)
                    break
                  case 'delta':
                    // console.log('✅ Calling onDelta handler with delta:', parsed.delta)
                    handlers.onDelta?.(parsed)
                    break
                  case 'message':
                    // Handle 'message' event type - backend sends content in 'response' field
                    // console.log('✅ Handling message event, response field:', parsed.response)
                    if (parsed.response) {
                      // Convert to delta format for compatibility
                      const deltaData = {
                        type: 'content_delta',
                        delta: parsed.response,
                        ...parsed
                      }
                      // console.log('✅ Calling onDelta handler with response as delta')
                      handlers.onDelta?.(deltaData)
                    } else if (parsed.success) {
                      // This is a completion message
                      // console.log('✅ Message event is completion, calling onCompletion')
                      handlers.onCompletion?.(parsed)
                    }
                    break
                  case 'close':
                    console.log('✅ Close event received, calling onCompletion')
                    handlers.onCompletion?.(parsed)
                    break
                  case 'sources':
                    // console.log('✅ Calling onSources handler')
                    handlers.onSources?.(parsed)
                    break
                  case 'completion':
                    // console.log('✅ Calling onCompletion handler')
                    handlers.onCompletion?.(parsed)
                    break
                  case 'error':
                    // console.log('✅ Calling onError handler')
                    handlers.onError?.(parsed)
                    break
                  default:
                    console.warn('⚠️ Unknown event type:', currentEvent)
                }

                // Also call generic event handler
                handlers.onEvent?.(currentEvent, parsed)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', currentData, e)
            }

            currentData = ''
            currentEvent = 'message'
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ============================================================================
// Chat API
// ============================================================================

export const chatAPI = {
  /**
   * List all chats for the current user
   */
  async getChats(options?: {
    agentType?: string
    status?: string
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<ApiResponse<Chat[]>> {
    const params = new URLSearchParams()
    if (options?.agentType) params.append('agentType', options.agentType)
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    if (options?.sortBy) params.append('sortBy', options.sortBy)
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder)

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/chats?${params}`,
      { headers: getAuthHeaders() }
    )

    const result = await handleResponse(response)

    // Extract chats array from response and map camelCase to snake_case
    if (result.success && result.data) {
      const chats = (result.data.chats || []).map((chat: any) => {
        const mapped = {
          ...chat,
          agent_type: chat.agentType || chat.agent_type,
          knowledge_base_id: chat.knowledgeBaseId || chat.knowledge_base_id,
          codebase_id: chat.codebaseId || chat.codebase_id,
          bucket_id: chat.bucketId || chat.bucket_id,
          // CRITICAL FIX: Extract custom_agent_id from metadata if not at top level
          custom_agent_id: chat.customAgentId || chat.custom_agent_id || chat.metadata?.custom_agent_id,
          customAgentId: chat.customAgentId || chat.custom_agent_id || chat.metadata?.custom_agent_id,
          custom_agent_name: chat.customAgentName || chat.custom_agent_name || chat.metadata?.custom_agent_name,
          customAgentName: chat.customAgentName || chat.custom_agent_name || chat.metadata?.custom_agent_name,
          user_id: chat.userId || chat.user_id,
          created_at: chat.createdAt || chat.created_at,
          updated_at: chat.updatedAt || chat.updated_at,
          last_message_at: chat.lastMessageAt || chat.last_message_at,
        }

        // Debug: Log custom agent chats
        if (mapped.agent_type === 'custom') {
          console.log('🔍 API: Custom agent chat mapping:', {
            id: chat.id,
            title: chat.title?.substring(0, 30),
            raw_customAgentId: chat.customAgentId,
            raw_custom_agent_id: chat.custom_agent_id,
            metadata_custom_agent_id: chat.metadata?.custom_agent_id,
            metadata_customAgentId: chat.metadata?.customAgentId,
            mapped_custom_agent_id: mapped.custom_agent_id
          })
        }

        return mapped
      })

      return {
        success: true,
        data: chats
      }
    }

    return result
  },

  async createChat(data: CreateChatRequest): Promise<ApiResponse<Chat>> {
    // Map snake_case to camelCase for backend
    const requestBody = {
      title: data.title,
      agentType: data.agent_type,
      knowledgeBaseId: data.knowledge_base_id,
      codebaseId: data.codebase_id,
      bucketId: data.bucket_id,
      customAgentId: data.custom_agent_id,
      tool: data.tool,
      subtool: data.subtool,
      metadata: data.metadata
    }

    const response = await fetch(`${DIRECT_BACKEND_URL}/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    })
    return handleResponse<Chat>(response)
  },

  async getChat(chatId: string): Promise<ApiResponse<Chat>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/chats/${chatId}`, {
      headers: getAuthHeaders()
    })
    const result = await handleResponse<Chat>(response)

    // Extract custom_agent_id from metadata if needed
    if (result.success && result.data) {
      const chat = result.data as any
      result.data = {
        ...chat,
        customAgentId: chat.customAgentId || chat.custom_agent_id || chat.metadata?.custom_agent_id,
        custom_agent_id: chat.customAgentId || chat.custom_agent_id || chat.metadata?.custom_agent_id,
        customAgentName: chat.customAgentName || chat.custom_agent_name || chat.metadata?.custom_agent_name,
        custom_agent_name: chat.customAgentName || chat.custom_agent_name || chat.metadata?.custom_agent_name,
      } as Chat
    }

    return result
  },

  async getChatMessages(
    chatId: string,
    options?: {
      limit?: number
      offset?: number
      sortOrder?: 'asc' | 'desc'
      include_artifacts?: boolean
    }
  ): Promise<ApiResponse<{ messages: Message[]; total: number }>> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    if (options?.sortOrder) params.append('sort_order', options.sortOrder)
    if (options?.include_artifacts) params.append('include_artifacts', 'true')

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/chats/${chatId}/messages?${params}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  async createMessage(
    chatId: string,
    data: CreateMessageRequest
  ): Promise<ApiResponse<Message>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse<Message>(response)
  },

  async sendSimpleMessage(
    chatId: string,
    data: {
      content: string
      sender?: 'user' | 'assistant' | 'system'
      tool?: string
      subtool?: string
      knowledge_base_id?: string
      metadata?: Record<string, any>
    }
  ): Promise<ApiResponse<Message>> {
    return this.createMessage(chatId, data)
  },

  async testConnection(): Promise<void> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/health`, {
      headers: getAuthHeaders()
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`API connection failed: ${response.statusText}`)
    }
  },

  async deleteChat(chatId: string, hardDelete: boolean = false): Promise<ApiResponse<any>> {
    const params = hardDelete ? '?hard_delete=true' : ''
    const response = await fetch(`${DIRECT_BACKEND_URL}/chats/${chatId}${params}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async renameChat(chatId: string, title: string): Promise<ApiResponse<Chat>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/chats/${chatId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title })
    })
    return handleResponse<Chat>(response)
  },

  async restoreChat(chatId: string): Promise<ApiResponse<Chat>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/chats/${chatId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse<Chat>(response)
  },

  async bulkDeleteChats(data: {
    chat_ids: string[]
    hard_delete?: boolean
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/chats/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async deleteChatMessage(chatId: string, messageId: string, hardDelete: boolean = false): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (hardDelete) {
      params.append('hard_delete', 'true')
    }
    const queryString = params.toString()
    const url = `${DIRECT_BACKEND_URL}/messages/${messageId}${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async restoreMessage(chatId: string, messageId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/messages/${messageId}/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async stopStream(chatId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${DIRECT_BACKEND_URL}/chats/${chatId}/stop-stream`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    } catch {
      // Even if the API call fails, we still reset the UI
      return { success: false, error: 'Failed to stop stream' }
    }
  }
}

// ============================================================================
// Sophia API (Knowledge Base RAG Agent)
// ============================================================================

export const sophiaAPI = {
  /**
   * Chat with Sophia using SSE streaming
   */
  async chat(data: {
    message: string
    chat_id: string
    knowledge_base_id?: string
    include_sources?: boolean
    max_sources?: number
    temperature?: number
    include_context?: boolean
  }): Promise<Response> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/sophia/chat`, {
      method: 'POST',
      headers: getSSEHeaders(),
      body: JSON.stringify(data)
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Sophia API error: ${response.statusText}`)
    }

    return response
  },

  /**
   * Get Sophia health status
   */
  async health(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/sophia/health`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Clavis API (Code Analysis Agent)
// ============================================================================

export const clavisAPI = {
  /**
   * Chat with Clavis using SSE streaming
   */
  async chat(data: {
    message: string
    codebase_id: string
    mode?: 'search' | 'chat' | 'analyze'
    context_chunks?: number
  }, chatId?: string): Promise<Response> {
    const params = chatId ? `?chat_id=${chatId}` : ''
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/chat${params}`, {
      method: 'POST',
      headers: getSSEHeaders(),
      body: JSON.stringify(data)
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Clavis API error: ${response.statusText}`)
    }

    return response
  },

  /**
   * Search code in a codebase
   */
  async searchCode(data: {
    query: string
    codebase_id: string
    limit?: number
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * List all codebases
   */
  async getCodebases(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/codebases`, {
      headers: getAuthHeaders()
    })
    const result = await handleResponse(response)

    // Extract repositories array from response and normalize legacy fields expected by UI
    if (result.success && result.data) {
      const repositories = (result.data.repositories || []).map((repo: any) => ({
        ...repo,
        repo_name: repo.repo_name || repo.display_name,
        repo_type: repo.repo_type || (repo.source_type === 'git' ? 'cloned' : 'local'),
        last_indexed: repo.last_indexed || repo.updated_at || repo.created_at,
      }))

      return {
        success: true,
        data: repositories
      }
    }

    return result
  },

  /**
   * Create a new codebase
   */
  async createCodebase(payload: {
    type: 'git' | 'folder'
    data: any
  }): Promise<ApiResponse<any>> {
    const { type, data } = payload

    if (type === 'folder') {
      // Handle folder upload with FormData
      const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/codebases/folder`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization
        },
        body: data // FormData
      })
      return handleResponse(response)
    } else {
      // Handle Git repository - use legacy /clavis/codebases endpoint
      const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/codebases`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    }
  },

  /**
   * Create an empty scratch codebase (start from scratch)
   */
  async createScratchCodebase(displayName: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/codebases/scratch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ display_name: displayName })
    })
    return handleResponse(response)
  },

  /**
   * Delete a codebase
   */
  async deleteCodebase(codebaseId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/codebases/${codebaseId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Reindex an existing codebase
   */
  async reindexCodebase(codebaseId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/codebases/${codebaseId}/reindex`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },


  /**
   * Create a Clavis pod session
   */
  async createPodSession(data: {
    codebase_id?: string;
    timeout_hours?: number;
    mode?: string;
    start_from_scratch?: boolean;
    assessment_mode?: string;
    policy_id?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Get all active Clavis pod sessions
   */
  async getPodSessions(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/sessions`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Delete a Clavis pod session
   */
  async deletePodSession(sessionId: string, options?: { permanent?: boolean }): Promise<ApiResponse<any>> {
    const params = options?.permanent ? '?permanent=true' : '';
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}${params}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Start a stopped Clavis pod session
   */
  async startPodSession(sessionId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Stop a running Clavis pod session (soft-stop — preserves workspace, can be resumed)
   */
  async stopPodSession(sessionId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}?permanent=false`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // --- Assessment Policies ---
  async getPolicies(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/policies`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async createPolicy(data: {
    name: string
    description?: string
    content: string
    framework?: string
    tags?: string[]
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/policies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async updatePolicy(policyId: string, data: {
    name?: string
    description?: string
    content?: string
    framework?: string
    tags?: string[]
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/policies/${policyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async deletePolicy(policyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/policies/${policyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get Clavis pod session information
   */
  async getPodSession(sessionId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Execute command in Clavis pod session
   */
  async executePodCommand(sessionId: string, data: {
    command: string
    working_dir?: string
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Get files in a Clavis pod session directory
   */
  async getPodFiles(sessionId: string, directory: string = '/workspace'): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/files?directory=${encodeURIComponent(directory)}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get content of a file in a Clavis pod session
   */
  async getPodFile(sessionId: string, filePath: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/file?file_path=${encodeURIComponent(filePath)}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Write content to a file in a Clavis pod session
   */
  async writePodFile(sessionId: string, data: { file_path: string, content: string }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/write_file`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Edit a file in a Clavis pod session using string replacement
   */
  async editPodFile(sessionId: string, data: { file_path: string, old_str: string, new_str: string }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/edit_file`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * List all terminals for a Clavis pod session
   */
  async listTerminals(sessionId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/terminals`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Create a new terminal in a Clavis pod session
   */
  async createTerminal(sessionId: string, name?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/terminals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    })
    return handleResponse(response)
  },

  /**
   * Delete a terminal in a Clavis pod session
   */
  async deleteTerminal(sessionId: string, terminalId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/terminals/${terminalId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Execute a command in a specific terminal
   */
  async executeTerminalCommand(sessionId: string, terminalId: string, command: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/terminals/${terminalId}/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ command })
    })
    return handleResponse(response)
  },

  /**
   * Get the SSE stream URL for a terminal
   */
  getTerminalStreamUrl(sessionId: string, terminalId: string): string {
    return `${DIRECT_BACKEND_URL}/clavis/pods/session/${sessionId}/terminals/${terminalId}/stream`
  },

  /**
   * Get Clavis health status
   */
  async health(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/clavis/health`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Analytica API (Data Analysis Agent)
// ============================================================================

export const analyticaAPI = {
  /**
   * Chat with Analytica using SSE streaming
   */
  async chat(data: {
    message: string
  }, chatId?: string, bucketId?: string): Promise<Response> {
    const params = new URLSearchParams()
    if (chatId) params.append('chat_id', chatId)
    if (bucketId) params.append('bucket_id', bucketId)

    const queryString = params.toString()
    const url = `${DIRECT_BACKEND_URL}/analytica/chat${queryString ? '?' + queryString : ''}`

    const response = await fetch(url, {
      method: 'POST',
      headers: getSSEHeaders(),
      body: JSON.stringify(data)
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Analytica API error: ${response.statusText}`)
    }

    return response
  },

  /**
   * Upload data file for analysis
   */
  async uploadData(file: File, message: string, chatId?: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('message', message)
    if (chatId) formData.append('chat_id', chatId)

    const token = getAuthToken()
    const response = await fetch(`${DIRECT_BACKEND_URL}/analytica/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    })
    return handleResponse(response)
  },

  /**
   * Generate insights from data
   */
  async generateInsights(data: {
    message: string
    user_goal?: string
  }, chatId?: string, bucketId?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (chatId) params.append('chat_id', chatId)
    if (bucketId) params.append('bucket_id', bucketId)

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/analytica/insights?${params}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }
    )
    return handleResponse(response)
  },

  /**
   * Get Analytica health status
   */
  async health(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/analytica/health`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Aegis API (General Purpose Agent)
// ============================================================================

export const aegisAPI = {
  /**
   * Chat with Aegis using SSE streaming
   */
  async chat(data: {
    message: string
    chat_id: string
    tool: string
    subtool: string
    personality?: string
    temperature?: number
    include_context?: boolean
    knowledge_base_id?: string
    stream_response?: boolean
    max_tokens?: number
  }): Promise<Response> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/aegis/chat`, {
      method: 'POST',
      headers: getSSEHeaders(),
      body: JSON.stringify({
        stream_response: true,
        ...data
      })
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Aegis API error: ${response.statusText}`)
    }

    return response
  },

  /**
   * Upload file to Aegis
   */
  async uploadFile(data: {
    file: File
    message: string
    chat_id: string
    tool?: string
    subtool?: string
    auto_process?: boolean
    temperature?: number
  }): Promise<ApiResponse<{
    success: boolean
    chat_id: string
    message_id: string
    user_message_id: string
    response: string
    file_info?: {
      success: boolean
      filename: string
      file_type: string
      status: string
      file_size: number
      shape?: number[]
      columns?: string[]
      length?: number
      encoding?: string
      summary_stats?: Record<string, any>
      processing_time_ms?: number
      errors?: string[]
    }
    tool_used?: string
    subtool_used?: string
    processing_time_ms?: number
    storage_path?: string
    accessible_in_code?: boolean
  }>> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('message', data.message)
    formData.append('chat_id', data.chat_id)

    if (data.tool) formData.append('tool', data.tool)
    if (data.subtool) formData.append('subtool', data.subtool)
    if (data.auto_process !== undefined) formData.append('auto_process', String(data.auto_process))
    if (data.temperature !== undefined) formData.append('temperature', String(data.temperature))


    const response = await fetch(`${DIRECT_BACKEND_URL}/aegis/upload/file`, {
      method: 'POST',
      headers: getAuthHeadersForUpload(), // Use upload-specific headers (no Content-Type)
      body: formData
    })

    return handleResponse(response)
  },

  /**
   * Get Aegis health status
   */
  async health(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/aegis/health`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Knowledge Base API
// ============================================================================

export const knowledgeBaseAPI = {
  async list(includeStats?: boolean): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (includeStats) {
      params.append('include_stats', 'true')
    }

    const response = await fetch(`${DIRECT_BACKEND_URL}/knowledgebase?${params}`, {
      headers: getAuthHeaders()
    })
    const result = await handleResponse(response)

    // Extract knowledge_bases array from response
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.knowledge_bases || []
      }
    }

    return result
  },

  async get(id: string, includeDocuments?: boolean): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (includeDocuments) {
      params.append('include_documents', 'true')
    }

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/knowledgebase/${id}?${params}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  async delete(id: string, hardDelete: boolean = false): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (hardDelete) {
      params.append('hard_delete', 'true')
    }

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/knowledgebase/${id}?${params}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      }
    )
    return handleResponse(response)
  },

  async getDocumentCount(id: string): Promise<ApiResponse<number>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/knowledgebase/${id}/documents/count`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async getDocuments(
    id: string,
    includeProcessingStatus: boolean = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (includeProcessingStatus) params.append('include_processing_status', 'true')
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/knowledgebase/${id}/documents?${params}`,
      { headers: getAuthHeaders() }
    )
    const result = await handleResponse(response)

    // Extract documents array from response
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.documents || []
      }
    }

    return result
  },

  async create(data: {
    name: string
    description?: string
    embedding_model?: string
    chunk_size?: number
    chunk_overlap?: number
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/knowledgebase/create`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        embedding_model: data.embedding_model || 'beautyyuyanli/multilingual-e5-large',
        chunk_size: data.chunk_size || 1500,
        chunk_overlap: data.chunk_overlap || 200
      })
    })
    return handleResponse(response)
  },

  async uploadDocument(
    kbId: string,
    file: File,
    description?: string,
    processImmediately: boolean = true
  ): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    formData.append('process_immediately', processImmediately.toString())

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/documents/upload`,
      {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      }
    )
    return handleResponse(response)
  },

  async uploadDocumentWithProgress(
    kbId: string,
    file: File,
    description?: string,
    processImmediately: boolean = true,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📤 DOCUMENT UPLOAD STARTED')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('Knowledge Base ID:', kbId)
    console.log('File Name:', file.name)
    console.log('File Size:', file.size, 'bytes', `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    console.log('File Type:', file.type)
    console.log('Description:', description || 'None')
    console.log('Process Immediately:', processImmediately)
    console.log('Backend URL:', DIRECT_BACKEND_URL)
    console.log('Full Upload URL:', `${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/documents/upload`)
    console.log('═══════════════════════════════════════════════════════════')

    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    formData.append('process_immediately', processImmediately.toString())

    console.log('📦 FormData prepared with fields:', {
      file: file.name,
      description: description || 'not provided',
      process_immediately: processImmediately.toString()
    })

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      let uploadComplete = false
      let progressInterval: number | null = null

      // Simulate gradual progress for better UX
      const simulateProgress = () => {
        let currentProgress = 0
        progressInterval = setInterval(() => {
          if (uploadComplete) {
            if (progressInterval) clearInterval(progressInterval)
            return
          }

          // Gradually increase progress up to 90% while waiting
          if (currentProgress < 90) {
            currentProgress += Math.random() * 5
            if (currentProgress > 90) currentProgress = 90
            if (onProgress) onProgress(Math.round(currentProgress))
          }
        }, 300) // Update every 300ms
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          console.log(`📊 Upload progress: ${percentComplete}% (${e.loaded}/${e.total} bytes)`)
          // Cap at 50% for upload, rest is for processing
          const displayProgress = Math.min(percentComplete * 0.5, 50)
          onProgress(Math.round(displayProgress))

          // Start simulated progress after upload completes
          if (percentComplete >= 100 && !progressInterval) {
            simulateProgress()
          }
        }
      })

      xhr.addEventListener('load', async () => {
        uploadComplete = true
        if (progressInterval) clearInterval(progressInterval)

        console.log('───────────────────────────────────────────────────────────')
        console.log('📥 RESPONSE RECEIVED')
        console.log('───────────────────────────────────────────────────────────')
        console.log('Status Code:', xhr.status)
        console.log('Status Text:', xhr.statusText)
        console.log('Response Length:', xhr.responseText.length, 'characters')
        console.log('Response Preview:', xhr.responseText.substring(0, 200))
        console.log('───────────────────────────────────────────────────────────')

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            console.log('✅ SUCCESS - Upload completed successfully!')
            console.log('Response Data:', result)
            console.log('═══════════════════════════════════════════════════════════')
            if (onProgress) onProgress(100)
            resolve({ success: true, data: result })
          } catch (error) {
            console.error('❌ ERROR - Failed to parse success response')
            console.error('Parse Error:', error)
            console.error('Raw Response:', xhr.responseText)
            console.error('═══════════════════════════════════════════════════════════')
            reject(new Error('Failed to parse response'))
          }
        } else {
          console.error('❌ ERROR - Upload failed!')
          console.error('Status Code:', xhr.status)
          console.error('Status Text:', xhr.statusText)
          console.error('Raw Response Text:', xhr.responseText)
          console.error('───────────────────────────────────────────────────────────')

          try {
            const errorData = JSON.parse(xhr.responseText)
            console.error('Parsed Error Data:', errorData)
            console.error('Error Detail:', errorData.detail || 'No detail provided')
            console.error('═══════════════════════════════════════════════════════════')
            reject(new Error(`Upload failed: ${errorData.detail || xhr.statusText}`))
          } catch (e) {
            console.error('Could not parse error response as JSON')
            console.error('Parse Error:', e)
            console.error('═══════════════════════════════════════════════════════════')
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        console.error('═══════════════════════════════════════════════════════════')
        console.error('❌ NETWORK ERROR - Upload failed due to network issue')
        console.error('This usually means:')
        console.error('  - Backend server is not running')
        console.error('  - CORS issue')
        console.error('  - Network connectivity problem')
        console.error('═══════════════════════════════════════════════════════════')
        reject(new Error('Upload failed'))
      })

      const uploadUrl = `${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/documents/upload`
      console.log('🌐 Opening XHR POST connection to:', uploadUrl)
      xhr.open('POST', uploadUrl)

      const authHeaders = getAuthHeadersForUpload()
      console.log('🔐 Setting authentication headers:', Object.keys(authHeaders))
      console.log('Header details:', authHeaders)
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      console.log('🚀 Sending upload request NOW...')
      console.log('═══════════════════════════════════════════════════════════')
      xhr.send(formData)
    })
  },

  async deleteDocument(
    kbId: string,
    documentId: string,
    cleanupVectors: boolean = true
  ): Promise<ApiResponse<any>> {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🗑️ DOCUMENT DELETE STARTED')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('Knowledge Base ID:', kbId)
    console.log('Document ID:', documentId)
    console.log('Cleanup Vectors:', cleanupVectors)
    console.log('Backend URL:', DIRECT_BACKEND_URL)

    const params = new URLSearchParams()
    if (cleanupVectors) {
      params.append('cleanup_vectors', 'true')
    }

    const deleteUrl = `${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/documents/${documentId}?${params}`
    console.log('Full Delete URL:', deleteUrl)
    console.log('═══════════════════════════════════════════════════════════')

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    console.log('───────────────────────────────────────────────────────────')
    console.log('📥 DELETE RESPONSE RECEIVED')
    console.log('Status Code:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('───────────────────────────────────────────────────────────')

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ DELETE FAILED!')
      console.error('Error Response:', errorText)
      console.error('═══════════════════════════════════════════════════════════')
      throw new Error(`Failed to delete document: ${response.statusText}`)
    }

    const result = await handleResponse(response)
    console.log('✅ DELETE SUCCESSFUL')
    console.log('Response:', result)
    console.log('═══════════════════════════════════════════════════════════')
    return result
  },

  async retryDocument(kbId: string, documentId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/documents/${documentId}/retry`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async downloadDocument(kbId: string, documentId: string): Promise<string | Blob> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/documents/${documentId}/download`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || `Failed to download: ${response.statusText}`)
      } catch (e: any) {
        if (e.message) throw e
        throw new Error(`Failed to download: ${response.statusText}`)
      }
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      // If the API directly returns a string URL or an object with a URL
      if (typeof data === 'string') return data
      if (data?.url) return data.url
      if (data?.download_url) return data.download_url
      // Fallback: return the raw JSON if we can't figure it out, but it's probably a string
      return data
    }

    return response.blob()
  },

  async downloadKnowledgeBase(kbId: string): Promise<Blob> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/download`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Failed to download knowledge base: ${response.statusText}`)
    }
    return response.blob()
  },

  streamDocumentStatus(
    kbId: string,
    documentId: string,
    handlers: {
      onProgress?: (data: any) => void
      onCompletion?: (data: any) => void
      onError?: (error: any) => void
      onEvent?: (event: string, data: any) => void
    }
  ): AbortController {
    const controller = new AbortController()

    const connect = async () => {
      try {
        const response = await fetch(
          `${DIRECT_BACKEND_URL}/knowledgebase/${kbId}/documents/${documentId}/stream`,
          {
            headers: getSSEHeaders(),
            signal: controller.signal
          }
        )

        if (response.status === 401) {
          await handle401Response()
          handlers.onError?.(new Error('Authentication required'))
          return
        }

        if (!response.ok) {
          handlers.onError?.(new Error(`Stream connection failed: ${response.statusText}`))
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let currentEvent = 'message'
          let currentData = ''

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              currentData = line.slice(5).trim()
            } else if (line === '') {
              if (currentData) {
                try {
                  const parsed = JSON.parse(currentData)

                  if (currentEvent === 'close') {
                    handlers.onCompletion?.(parsed)
                    controller.abort() // Stop listening gracefully
                    return
                  }

                  handlers.onProgress?.(parsed)
                  handlers.onEvent?.(currentEvent, parsed)
                } catch (e) {
                  // Ignore JSON parse errors for raw stream data
                  console.error('Failed to parse document SSE data:', currentData, e)
                }
                currentData = ''
                currentEvent = 'message'
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Document SSE Stream error:', error)
          handlers.onError?.(error)
        }
      }
    }

    // Start connection asynchronously
    connect()

    return controller
  }
}

// ============================================================================
// Custom Agents API
// ============================================================================

export const customAgentsAPI = {
  /**
   * Create a new custom agent
   */
  async create(data: {
    name: string
    emoji: string
    description: string
    system_prompt: string
    example_queries?: Array<{ query: string; expected_response?: string; description?: string }>
    capabilities?: Array<{ capability_id: string; enabled?: boolean; custom_config?: Record<string, any> }>
    configuration?: {
      temperature?: number
      max_tokens?: number
      top_p?: number
      frequency_penalty?: number
      presence_penalty?: number
      stop_sequences?: string[]
    }
    tags?: string[]
    visibility?: 'private' | 'public' | 'shared'
    is_template?: boolean
    metadata?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Get list of custom agents
   */
  async list(params?: {
    status?: 'active' | 'deleted' | 'archived' | 'draft'
    visibility?: 'private' | 'public' | 'shared'
    is_template?: boolean
    include_deleted?: boolean
    limit?: number
    offset?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/custom-agents?${queryParams}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get a specific custom agent
   */
  async get(agentId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/${agentId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Update a custom agent
   */
  async update(agentId: string, data: Partial<{
    name: string
    emoji: string
    description: string
    system_prompt: string
    initial_message: string
    example_queries: Array<{ query: string; expected_response?: string; description?: string }>
    capabilities: Array<{ capability_id: string; enabled?: boolean; custom_config?: Record<string, any> }>
    configuration: {
      temperature?: number
      max_tokens?: number
      top_p?: number
      frequency_penalty?: number
      presence_penalty?: number
      stop_sequences?: string[]
    }
    tags: string[]
    visibility: 'private' | 'public' | 'shared'
    status: 'active' | 'archived' | 'draft'
    agent_type: 'chat' | 'flow'
    interface_type: 'chat' | 'form' | 'json' | 'api' | 'wizard'
    interface_config: Record<string, any>
    metadata: Record<string, any>
  }>): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/${agentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Delete a custom agent
   */
  async delete(agentId: string, hardDelete: boolean = false): Promise<ApiResponse<any>> {
    const params = hardDelete ? '?hard_delete=true' : ''
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/${agentId}${params}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Restore a deleted custom agent
   */
  async restore(agentId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/${agentId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Clone a custom agent
   */
  async clone(agentId: string, data?: {
    new_name?: string
    new_description?: string
    new_emoji?: string
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/${agentId}/clone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    })
    return handleResponse(response)
  },

  /**
   * Search custom agents
   */
  async search(data: {
    query: string
    filters?: {
      status?: string[]
      visibility?: string[]
      tags?: string[]
      is_template?: boolean
    }
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Record agent usage
   */
  async recordUsage(agentId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/${agentId}/use`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get agent statistics
   */
  async getStatistics(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/statistics`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Chat with a custom agent (SSE streaming)
   */
  async chat(agentId: string, data: {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
    chat_id?: string
    stream?: boolean
    temperature_override?: number
    max_tokens_override?: number
  }): Promise<Response> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/${agentId}/chat`, {
      method: 'POST',
      headers: getSSEHeaders(),
      body: JSON.stringify(data)
    })

    // Handle 401
    if (response.status === 401) {
      await handle401Response()
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Custom agent chat error: ${response.statusText}`)
    }

    return response
  },

  /**
   * Validate agent data
   */
  async validate(data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Bulk delete agents
   */
  async bulkDelete(data: {
    agent_ids: string[]
    hard_delete?: boolean
    reason?: string
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/bulk`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Bulk update agents
   */
  async bulkUpdate(data: {
    agent_ids: string[]
    updates: {
      visibility?: string
      status?: string
      tags?: string[]
    }
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/custom-agents/bulk`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Marketplace methods
  marketplace: {
    /**
     * Browse global agents marketplace
     */
    async browse(params?: {
      tags?: string[]
      search?: string
      sort_by?: string
      sort_order?: 'asc' | 'desc'
      limit?: number
      offset?: number
    }): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams()
      if (params) {
        if (params.tags) params.tags.forEach(tag => queryParams.append('tags', tag))
        if (params.search) queryParams.append('search', params.search)
        if (params.sort_by) queryParams.append('sort_by', params.sort_by)
        if (params.sort_order) queryParams.append('sort_order', params.sort_order)
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.offset) queryParams.append('offset', params.offset.toString())
      }
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/custom-agents/library?${queryParams}`,
        { headers: getAuthHeaders() }
      )
      return handleResponse(response)
    },

    /**
     * Get global agent details
     */
    async get(agentId: string): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/custom-agents/library/${agentId}`,
        { headers: getAuthHeaders() }
      )
      return handleResponse(response)
    },

    /**
     * Import global agent to local collection
     */
    async import(agentId: string, data?: {
      custom_name?: string
      custom_description?: string
      modify_system_prompt?: string
    }): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/custom-agents/library/${agentId}/import`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data || {})
        }
      )
      return handleResponse(response)
    },

    /**
     * Create global agent (requires system admin)
     */
    async createGlobal(data: {
      name: string
      emoji: string
      description: string
      agent_type?: 'chat' | 'flow'
      system_prompt: string
      example_queries?: Array<{
        query: string
        expected_response?: string
        description?: string
      }>
      capabilities?: Array<{
        capability_id: string
        enabled: boolean
        custom_config?: Record<string, any>
      }>
      configuration?: {
        temperature?: number
        max_tokens?: number
        top_p?: number
        frequency_penalty?: number
        presence_penalty?: number
        stop_sequences?: string[]
      }
      tags?: string[]
      metadata?: Record<string, any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/custom-agents/global`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        }
      )
      return handleResponse(response)
    },

    /**
     * Update global agent (requires system admin)
     */
    async updateGlobal(agentId: string, data: {
      name?: string
      emoji?: string
      description?: string
      system_prompt?: string
      example_queries?: Array<{
        query: string
        expected_response: string
        description?: string
      }>
      capabilities?: Array<{
        capability_id: string
        enabled: boolean
        custom_config?: Record<string, any>
      }>
      configuration?: {
        temperature?: number
        max_tokens?: number
        top_p?: number
        frequency_penalty?: number
        presence_penalty?: number
        stop_sequences?: string[]
      }
      tags?: string[]
      metadata?: Record<string, any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/custom-agents/global/${agentId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        }
      )
      return handleResponse(response)
    },

    /**
     * Delete global agent (requires system admin)
     */
    async deleteGlobal(agentId: string, hardDelete: boolean = false): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams()
      if (hardDelete) queryParams.append('hard_delete', 'true')

      const response = await fetch(
        `${DIRECT_BACKEND_URL}/custom-agents/global/${agentId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      )
      return handleResponse(response)
    }
  }
}

// ============================================================================
// Capabilities API
// ============================================================================

export const capabilitiesAPI = {
  /**
   * Get list of capabilities
   */
  async list(params?: {
    category?: string
    is_global?: boolean
    status?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/capabilities?${queryParams}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get a specific capability
   */
  async get(capabilityId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/capabilities/${capabilityId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Create a new capability
   */
  async create(data: {
    name: string
    description: string
    category: string
    code: string
    parameters?: Array<{
      name: string
      type: string
      description?: string
      required?: boolean
      default?: any
    }>
    return_type?: string
    timeout_seconds?: number
    requires_approval?: boolean
    tags?: string[]
    metadata?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/capabilities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Update a capability
   */
  async update(capabilityId: string, data: Partial<{
    name: string
    description: string
    category: string
    code: string
    parameters: Array<{
      name: string
      type: string
      description?: string
      required?: boolean
      default?: any
    }>
    return_type: string
    timeout_seconds: number
    requires_approval: boolean
    status: string
    tags: string[]
    metadata: Record<string, any>
  }>): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/capabilities/${capabilityId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Delete a capability
   */
  async delete(capabilityId: string, hardDelete: boolean = false): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (hardDelete) queryParams.append('hard_delete', 'true')

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/capabilities/${capabilityId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      }
    )
    return handleResponse(response)
  },

  /**
   * Execute a capability
   */
  async execute(capabilityId: string, data: {
    parameters?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/capabilities/${capabilityId}/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Import a global capability template as a local capability
   */
  async importTemplate(templateId: string, customName?: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/capabilities/library/${templateId}/import`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ custom_name: customName })
      }
    )
    return handleResponse(response)
  },

  /**
   * Configure a local capability with parameter values
   */
  async configure(capabilityId: string, data: {
    configured_parameters: Record<string, any>
    custom_name?: string
  }): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/capabilities/${capabilityId}/configure`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }
    )
    return handleResponse(response)
  },

  /**
   * Duplicate a configured capability
   */
  async duplicate(capabilityId: string, newName: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/capabilities/${capabilityId}/duplicate`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ new_name: newName })
      }
    )
    return handleResponse(response)
  },

  /**
   * Search capabilities
   */
  async search(data: {
    query: string
    filters?: {
      category?: string[]
      tags?: string[]
      is_global?: boolean
    }
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/capabilities/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Marketplace methods for global capabilities
  marketplace: {
    /**
     * Browse global capabilities marketplace
     */
    async browse(params?: {
      category?: string
      tags?: string[]
      search?: string
      sort_by?: string
      sort_order?: 'asc' | 'desc'
      limit?: number
      offset?: number
    }): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams()
      if (params) {
        if (params.category) queryParams.append('category', params.category)
        if (params.tags) params.tags.forEach(tag => queryParams.append('tags', tag))
        if (params.search) queryParams.append('search', params.search)
        if (params.sort_by) queryParams.append('sort_by', params.sort_by)
        if (params.sort_order) queryParams.append('sort_order', params.sort_order)
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.offset) queryParams.append('offset', params.offset.toString())
      }
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/capabilities/library?${queryParams}`,
        { headers: getAuthHeaders() }
      )
      return handleResponse(response)
    },

    /**
     * Import a global capability template to user's local collection
     */
    async import(templateId: string, customData?: {
      custom_name?: string
      custom_description?: string
    }): Promise<ApiResponse<any>> {
      const token = getAuthToken()
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/capabilities/marketplace/${templateId}/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: customData?.custom_name || ''
        }
      )
      return handleResponse(response)
    },

    /**
     * Create global capability (requires system admin)
     */
    async createGlobal(data: {
      name: string
      description: string
      category: string
      code: string
      parameters?: Array<{
        name: string
        type: string
        description?: string
        required?: boolean
        default?: any
      }>
      return_type?: string
      timeout_seconds?: number
      requires_approval?: boolean
      tags?: string[]
      metadata?: Record<string, any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/capabilities/global`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        }
      )
      return handleResponse(response)
    },

    /**
     * Update global capability (requires system admin)
     */
    async updateGlobal(capabilityId: string, data: {
      name?: string
      description?: string
      category?: string
      code?: string
      parameters?: Array<{
        name: string
        type: string
        description?: string
        required?: boolean
        default?: any
      }>
      return_type?: string
      timeout_seconds?: number
      requires_approval?: boolean
      tags?: string[]
      metadata?: Record<string, any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/capabilities/global/${capabilityId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        }
      )
      return handleResponse(response)
    },

    /**
     * Delete global capability (requires system admin)
     */
    async deleteGlobal(capabilityId: string, hardDelete: boolean = false): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams()
      if (hardDelete) queryParams.append('hard_delete', 'true')

      const response = await fetch(
        `${DIRECT_BACKEND_URL}/capabilities/global/${capabilityId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      )
      return handleResponse(response)
    }
  }
}

// ============================================================================
// Data Bucket API
// ============================================================================

export const bucketAPI = {
  async list(limit: number = 100, skip: number = 0): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/analytica/buckets?limit=${limit}&skip=${skip}`, {
      headers: getAuthHeaders()
    })
    const result = await handleResponse(response)

    // Extract buckets array from response
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.buckets || []
      }
    }

    return result
  },

  async get(bucketId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/analytica/buckets/${bucketId}`, {
      headers: getAuthHeaders()
    })
    const result = await handleResponse(response)

    // Extract bucket from response
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.bucket || result.data
      }
    }

    return result
  },

  async getSuggestions(bucketId: string, userGoal?: string): Promise<ApiResponse<any[]>> {
    const url = new URL(`${DIRECT_BACKEND_URL}/analytica/buckets/${bucketId}/suggestions`)
    if (userGoal) {
      url.searchParams.append('user_goal', userGoal)
    }

    const response = await fetch(url.toString(), {
      headers: getAuthHeaders()
    })
    const result = await handleResponse(response)

    // Extract suggestions array from response
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.suggestions || []
      }
    }

    return result
  },

  async create(
    file: File,
    name: string,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          onProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            if (onProgress) onProgress(100)
            resolve({ success: true, data: result })
          } catch (error) {
            reject(new Error('Failed to parse response'))
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.detail || `Upload failed with status ${xhr.status}`))
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      // Open the request
      xhr.open('POST', `${DIRECT_BACKEND_URL}/analytica/buckets`)

      // Set auth headers
      const token = localStorage.getItem('mentis_auth_token')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.send(formData)
    })
  },

  async update(
    bucketId: string,
    file: File,
    name: string,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', `${DIRECT_BACKEND_URL}/analytica/buckets/${bucketId}`)

      const token = getAuthToken()
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          onProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            if (onProgress) onProgress(100)
            resolve({ success: true, data: result })
          } catch (error) {
            reject(new Error('Failed to parse response'))
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.detail || `Update failed with status ${xhr.status}`))
          } catch {
            reject(new Error(`Update failed with status ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Update failed'))
      })

      xhr.send(formData)
    })
  },

  async updateMetadata(
    bucketId: string,
    name: string,
    description?: string
  ): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('file', new Blob([]), 'empty') // Send empty file to satisfy required field if backend requires it, but usually backend handles optional file
    // Based on user screenshot, file is part of multipart form data.
    // If we only update metadata, we might need a different specialized endpoint or handle it carefully.
    // Let's assume for updateMetadata we might use JSON if backend supports it, OR multipart without file. 
    // The previous implementation plan suggested using multipart. 
    // Let's double check backend requirements from screenshot - it shows PUT /analytica/buckets/{bucket_id} and multipart payload.
    // Ideally we use the same endpoint. If file is optional in backend for updates, we just don't append it?
    // Wait, the screenshot shows "file" as "string | (string | null)".
    // Let's try sending just name/description as multipart.

    // Reset formData
    const data = new FormData()
    data.append('name', name)
    if (description) {
      data.append('description', description)
    }

    // We can use fetch here if we don't need progress for metadata update
    const response = await fetch(`${DIRECT_BACKEND_URL}/analytica/buckets/${bucketId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeadersForUpload() // Only Authorization, no Content-Type (browser sets multipart boundary)
      },
      body: data
    })

    return handleResponse(response)
  },

  async delete(bucketId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/analytica/buckets/${bucketId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Agent Flow Builder API
// ============================================================================

export const flowsAPI = {
  /**
   * List all flows
   */
  async list(params?: {
    agent_id?: string
    status?: string
    tags?: string[]
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    // Backend only supports limit, offset, status
    // For other filters, we must fetch more data and filter client-side
    const needsClientFiltering = params?.agent_id || params?.tags || params?.search

    const queryParams = new URLSearchParams()

    // If filtering client-side, fetch more items to ensure we find matches
    // Otherwise use requested limit (default 20)
    const fetchLimit = needsClientFiltering ? 100 : (params?.limit || 20)
    queryParams.append('limit', fetchLimit.toString())

    // Offset handling is tricky with client-side filtering
    // Ideally we'd fetch all pages but for now we'll just fetch from 0 if filtering
    const fetchOffset = needsClientFiltering ? 0 : (params?.offset || 0)
    queryParams.append('offset', fetchOffset.toString())

    if (params?.status) queryParams.append('status', params.status)
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/flows${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )

    const result = await handleResponse(response)

    if (result.success && result.data && needsClientFiltering) {
      // Use explicit casting to avoid TypeScript errors with unknown/{} type
      const responseData = result.data as any
      let flows = responseData.flows || []

      // Filter by agent_id
      if (params?.agent_id) {
        flows = flows.filter((flow: any) => flow.agent_id === params.agent_id)
      }

      // Filter by tags
      if (params?.tags && params.tags.length > 0) {
        flows = flows.filter((flow: any) =>
          flow.tags && params.tags!.some((tag: string) => flow.tags.includes(tag))
        )
      }

      // Filter by search query (name or description)
      if (params?.search) {
        const searchLower = params.search.toLowerCase()
        flows = flows.filter((flow: any) =>
          (flow.name && flow.name.toLowerCase().includes(searchLower)) ||
          (flow.description && flow.description.toLowerCase().includes(searchLower))
        )
      }

      // Update result data
      responseData.flows = flows
      responseData.pagination = {
        ...responseData.pagination,
        total: flows.length,
        limit: params?.limit || 20,
        offset: params?.offset || 0
      }

      // Handle manual pagination slicing if needed
      // (This is simplistic and assumes we fetched enough data)
      if (params?.limit) {
        const start = params.offset || 0
        const end = start + params.limit
        responseData.flows = flows.slice(start, end)
      }
    }

    return result
  },

  /**
   * Get a flow by ID
   */
  async get(flowId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/${flowId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get flows for a specific agent
   */
  async getByAgentId(agentId: string, params?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<ApiResponse<any>> {
    // Use the main list function which now handles agent_id filtering
    return this.list({
      agent_id: agentId,
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      status: params?.status
    })
  },

  /**
   * Generate a flow using LLM
   */
  async generate(data: {
    description: string
    agent_id: string
    name?: string
    tags?: string[]
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Describe a workflow using LLM
   */
  async describe(data: {
    nodes: Array<{
      id: string
      type: string
      label: string
      config?: Record<string, any>
      position?: { x: number; y: number }
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      label?: string
    }>
  }): Promise<ApiResponse<{ description: string }>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/describe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Create a new flow
   */
  async create(data: {
    name: string
    description?: string
    agent_id: string
    nodes: Array<{
      id: string
      type: string
      label: string
      config?: Record<string, any>
      position?: { x: number; y: number }
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      label?: string
      condition?: Record<string, any>
    }>
    config?: {
      startNodeId?: string
      maxExecutionTime?: number
      errorHandling?: string
      retryAttempts?: number
      timeout?: number
    }
    variables?: Record<string, any>
    tags?: string[]
    metadata?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Update a flow
   */
  async update(flowId: string, data: Partial<{
    name: string
    description: string
    agent_id: string
    nodes: Array<{
      id: string
      type: string
      label: string
      config?: Record<string, any>
      position?: { x: number; y: number }
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      label?: string
      condition?: Record<string, any>
    }>
    config: {
      startNodeId?: string
      maxExecutionTime?: number
      errorHandling?: string
      retryAttempts?: number
      timeout?: number
    }
    variables: Record<string, any>
    status: string
    tags: string[]
    metadata: Record<string, any>
  }>): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/${flowId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Delete a flow
   */
  async delete(flowId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/${flowId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Clone a flow
   */
  async clone(flowId: string, data: {
    new_name: string
    description?: string
    clone_executions?: boolean
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/${flowId}/clone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Validate a flow
   */
  async validate(data: {
    nodes: Array<{
      id: string
      type: string
      label: string
      config?: Record<string, any>
      position?: { x: number; y: number }
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      label?: string
      condition?: Record<string, any>
    }>
    config: {
      startNodeId?: string
      maxExecutionTime?: number
      errorHandling?: string
      retryAttempts?: number
      timeout?: number
    }
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Execute a flow
   */
  async execute(flowId: string, data: {
    input_data?: Record<string, any>
    variables?: Record<string, any>
    timeout?: number
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/${flowId}/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Get flow executions
   */
  async getExecutions(flowId: string, params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params) {
      if (params.status) queryParams.append('status', params.status)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())
    }
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/flows/${flowId}/executions${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get execution details
   */
  async getExecution(flowId: string, executionId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/flows/${flowId}/executions/${executionId}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get execution logs
   */
  async getExecutionLogs(flowId: string, executionId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/flows/${flowId}/executions/${executionId}/logs`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Bulk delete flows
   */
  async bulkDelete(data: {
    flow_ids: string[]
    permanent?: boolean
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/flows/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Marketplace methods for global flows
  marketplace: {
    /**
     * Browse global flows marketplace
     */
    async browse(params?: {
      category?: string
      tags?: string[]
      search?: string
      sort_by?: string
      sort_order?: 'asc' | 'desc'
      limit?: number
      offset?: number
    }): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams()
      if (params) {
        if (params.category) queryParams.append('category', params.category)
        if (params.tags) params.tags.forEach(tag => queryParams.append('tags', tag))
        if (params.search) queryParams.append('search', params.search)
        if (params.sort_by) queryParams.append('sort_by', params.sort_by)
        if (params.sort_order) queryParams.append('sort_order', params.sort_order)
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.offset) queryParams.append('offset', params.offset.toString())
      }
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/flows/library/browse${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        { headers: getAuthHeaders() }
      )
      return handleResponse(response)
    },

    /**
     * Publish flow to marketplace
     */
    async publish(flowId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/flows/${flowId}/publish`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    /**
     * Create global flow (admin only)
     */
    async createGlobal(data: {
      name: string
      description: string
      category: string
      nodes: Array<{
        id: string
        type: string
        label: string
        config?: Record<string, any>
        position?: { x: number; y: number }
      }>
      edges: Array<{
        id: string
        source: string
        target: string
        label?: string
        condition?: Record<string, any>
      }>
      config: {
        startNodeId?: string
        maxExecutionTime?: number
        errorHandling?: string
        retryAttempts?: number
        timeout?: number
      }
      variables?: Record<string, any>
      tags?: string[]
      metadata?: Record<string, any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/flows/global`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    /**
     * Bulk import global flows (admin only)
     */
    async bulkImport(data: {
      flows: Array<any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/flows/global/bulk-import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    }
  }
}

// ============================================================================
// Governance API (Organizations, Departments, Invitations)
// ============================================================================

export const governanceAPI = {
  organizations: {
    async create(data: {
      name: string
      slug?: string
      subscription_tier?: string
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    async list(): Promise<ApiResponse<any[]>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async get(organizationId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/${organizationId}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getBySlug(slug: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/by-slug/${slug}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async update(organizationId: string, data: {
      name?: string
      display_name?: string
      billing_email?: string
      settings?: Record<string, any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/${organizationId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    async delete(organizationId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/${organizationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getSettings(organizationId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/${organizationId}/settings`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async updateSettings(organizationId: string, settings: Record<string, any>): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/${organizationId}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      })
      return handleResponse(response)
    },

    async getUsage(organizationId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/${organizationId}/usage`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async createUser(organizationId: string, data: {
      email: string
      password: string
      display_name: string
      role: string
      department_id?: string
      permissions?: string[]
      status?: string
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/organizations/${organizationId}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    }
  },

  members: {
    async list(organizationId: string, params?: {
      department_id?: string
      role?: string
      status?: string
    }): Promise<ApiResponse<any[]>> {
      const queryParams = new URLSearchParams()
      if (params) {
        if (params.department_id) queryParams.append('department_id', params.department_id)
        if (params.role) queryParams.append('role', params.role)
        if (params.status) queryParams.append('status', params.status)
      }
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/organizations/${organizationId}/members${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        { headers: getAuthHeaders() }
      )
      return handleResponse(response)
    },

    async updateRole(organizationId: string, userId: string, newRole: string): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/organizations/${organizationId}/members/${userId}/role`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ new_role: newRole })
        }
      )
      return handleResponse(response)
    },

    async remove(organizationId: string, userId: string): Promise<ApiResponse<any>> {
      const response = await fetch(
        `${DIRECT_BACKEND_URL}/organizations/${organizationId}/members/${userId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      )
      return handleResponse(response)
    }
  },

  departments: {
    async create(data: {
      organization_id: string
      name: string
      description?: string
      parent_department_id?: string
      manager_user_ids?: string[]
      allowed_agents?: string[]
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    async list(organizationId: string): Promise<ApiResponse<any[]>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments?${queryParams}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getTree(organizationId: string): Promise<ApiResponse<any[]>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments/tree?${queryParams}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async get(departmentId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments/${departmentId}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async update(departmentId: string, data: {
      name?: string
      description?: string
      manager_user_ids?: string[]
      allowed_agents?: string[]
      settings?: Record<string, any>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments/${departmentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    async archive(departmentId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments/${departmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getMembers(departmentId: string): Promise<ApiResponse<any[]>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments/${departmentId}/members`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getAgents(departmentId: string): Promise<ApiResponse<string[]>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments/${departmentId}/agents`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async updateAgents(departmentId: string, allowedAgents: string[]): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/departments/${departmentId}/agents`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ allowed_agents: allowedAgents })
      })
      return handleResponse(response)
    }
  },

  invitations: {
    async send(data: {
      organization_id: string
      email: string
      role: string
      department_id: string
      message?: string
      permissions?: Record<string, boolean>
    }): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    async list(organizationId: string, status?: string): Promise<ApiResponse<any[]>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      if (status) queryParams.append('status', status)
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations?${queryParams}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getByToken(token: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/accept/${token}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async acceptInvitation(token: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token })
      })
      return handleResponse(response)
    },

    async accept(token: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token })
      })
      return handleResponse(response)
    },

    async cancel(invitationId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getPermissions(role: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/permissions/${role}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getAllPermissions(): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/permissions`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getMyInvitations(): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/me`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async resend(invitationId: string): Promise<ApiResponse<any>> {
      const response = await fetch(`${DIRECT_BACKEND_URL}/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    }
  },

  apiKeys: {
    async create(data: {
      organization_id: string
      name: string
      description?: string
      agent_id?: string
      department_id?: string
      scopes?: string[]
      rate_limit?: { requests_per_minute?: number; requests_per_day?: number; concurrent_requests?: number }
      expires_in_days?: number
      ip_whitelist?: string[]
      webhook_url?: string
    }): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({ organization_id: data.organization_id })
      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys?${queryParams}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    async list(params: {
      organization_id: string
      department_id?: string
      status?: string
      limit?: number
      offset?: number
    }): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({ organization_id: params.organization_id })
      if (params.department_id) queryParams.append('department_id', params.department_id)
      if (params.status) queryParams.append('status', params.status)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())

      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys?${queryParams}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async get(apiKeyId: string, organizationId: string): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys/${apiKeyId}?${queryParams}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async update(apiKeyId: string, organizationId: string, data: {
      name?: string
      description?: string
      scopes?: string[]
      rate_limit?: { requests_per_minute?: number; requests_per_day?: number; concurrent_requests?: number }
      ip_whitelist?: string[]
      webhook_url?: string
      status?: string
    }): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys/${apiKeyId}?${queryParams}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return handleResponse(response)
    },

    async revoke(apiKeyId: string, organizationId: string, reason?: string): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      if (reason) queryParams.append('reason', reason)
      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys/${apiKeyId}?${queryParams}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async rotate(apiKeyId: string, organizationId: string): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys/${apiKeyId}/rotate?${queryParams}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getUsage(apiKeyId: string, organizationId: string, days: number = 30): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({
        organization_id: organizationId,
        days: days.toString()
      })
      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys/${apiKeyId}/usage?${queryParams}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    },

    async getLogs(apiKeyId: string, organizationId: string, params?: {
      limit?: number
      offset?: number
    }): Promise<ApiResponse<any>> {
      const queryParams = new URLSearchParams({ organization_id: organizationId })
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.offset) queryParams.append('offset', params.offset.toString())

      const response = await fetch(`${DIRECT_BACKEND_URL}/api-keys/${apiKeyId}/logs?${queryParams}`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    }
  }
}

// ============================================================================
// Widget Configuration API
// ============================================================================

export const widgetAPI = {
  async create(agentId: string, organizationId: string, data: {
    widget_type?: 'chat' | 'file_upload' | 'form' | 'image_upload'
    theme?: 'light' | 'dark' | 'auto'
    primary_color?: string
    text_color?: string
    background_color?: string
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    offset_x?: number
    offset_y?: number
    agent_name?: string
    agent_avatar_url?: string
    greeting_message?: string
    placeholder_text?: string
    header_text?: string
    footer_text?: string
    disclaimer_text?: string
    help_text?: string
    privacy_policy_url?: string
    terms_of_service_url?: string
    auto_open?: boolean
    auto_open_delay_ms?: number
    show_typing_indicator?: boolean
    enable_sound?: boolean
    enable_emoji?: boolean
    allowed_domains?: string[]
    custom_css?: string
    session_persistence?: boolean
    max_history_messages?: number
    collect_analytics?: boolean
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    const response = await fetch(`${DIRECT_BACKEND_URL}/widgets?${queryParams}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ agent_id: agentId, ...data })
    })
    return handleResponse(response)
  },

  async get(agentId: string, organizationId: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    const response = await fetch(`${DIRECT_BACKEND_URL}/widgets/${agentId}?${queryParams}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async update(agentId: string, organizationId: string, data: {
    widget_type?: 'chat' | 'file_upload' | 'form' | 'image_upload'
    theme?: 'light' | 'dark' | 'auto'
    primary_color?: string
    text_color?: string
    background_color?: string
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    offset_x?: number
    offset_y?: number
    agent_name?: string
    agent_avatar_url?: string
    greeting_message?: string
    placeholder_text?: string
    header_text?: string
    footer_text?: string
    disclaimer_text?: string
    help_text?: string
    privacy_policy_url?: string
    terms_of_service_url?: string
    auto_open?: boolean
    auto_open_delay_ms?: number
    show_typing_indicator?: boolean
    enable_sound?: boolean
    enable_emoji?: boolean
    allowed_domains?: string[]
    custom_css?: string
    session_persistence?: boolean
    max_history_messages?: number
    collect_analytics?: boolean
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    const response = await fetch(`${DIRECT_BACKEND_URL}/widgets/${agentId}?${queryParams}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async delete(agentId: string, organizationId: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    const response = await fetch(`${DIRECT_BACKEND_URL}/widgets/${agentId}?${queryParams}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async toggle(agentId: string, organizationId: string, enabled: boolean): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({
      organization_id: organizationId,
      enabled: enabled.toString()
    })
    const response = await fetch(`${DIRECT_BACKEND_URL}/widgets/${agentId}/toggle?${queryParams}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async list(organizationId: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    const response = await fetch(`${DIRECT_BACKEND_URL}/widgets?${queryParams}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Model Management API
// ============================================================================

export const modelsAPI = {
  async create(organizationId: string, data: {
    provider: string
    model_name: string
    display_name: string
    description?: string
    model_type: string
    modalities?: string[]
    capabilities?: string[]
    api_key_id?: string
    api_endpoint?: string
    api_version?: string
    default_parameters?: Record<string, any>
    supported_parameters?: string[]
    context_window?: number
    max_output_tokens?: number
    input_cost_per_1k_tokens?: number
    output_cost_per_1k_tokens?: number
    rate_limit_rpm?: number
    rate_limit_tpm?: number
    is_enabled?: boolean
    is_default?: boolean
    is_global?: boolean
    visibility?: string
    tags?: string[]
    version?: string
    extra_metadata?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    const response = await fetch(`${DIRECT_BACKEND_URL}/models?${queryParams}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async list(organizationId: string, params?: {
    include_global?: boolean
    provider?: string
    model_type?: string
    is_enabled?: boolean
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    if (params?.include_global !== undefined) queryParams.append('include_global', params.include_global.toString())
    if (params?.provider) queryParams.append('provider', params.provider)
    if (params?.model_type) queryParams.append('model_type', params.model_type)
    if (params?.is_enabled !== undefined) queryParams.append('is_enabled', params.is_enabled.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(`${DIRECT_BACKEND_URL}/models?${queryParams}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async search(organizationId: string, query: string, params?: {
    include_global?: boolean
    limit?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({
      q: query,
      organization_id: organizationId
    })
    if (params?.include_global !== undefined) queryParams.append('include_global', params.include_global.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await fetch(`${DIRECT_BACKEND_URL}/models/search?${queryParams}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async get(modelId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/models/${modelId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async update(modelId: string, data: {
    display_name?: string
    description?: string
    modalities?: string[]
    capabilities?: string[]
    api_key_id?: string
    api_endpoint?: string
    api_version?: string
    default_parameters?: Record<string, any>
    supported_parameters?: string[]
    context_window?: number
    max_output_tokens?: number
    input_cost_per_1k_tokens?: number
    output_cost_per_1k_tokens?: number
    rate_limit_rpm?: number
    rate_limit_tpm?: number
    is_enabled?: boolean
    is_default?: boolean
    visibility?: string
    tags?: string[]
    version?: string
    extra_metadata?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/models/${modelId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async delete(modelId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/models/${modelId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async setDefault(modelId: string, organizationId: string, modelType?: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    if (modelType) queryParams.append('model_type', modelType)

    const response = await fetch(`${DIRECT_BACKEND_URL}/models/${modelId}/set-default?${queryParams}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async getDefault(organizationId: string, modelType: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ organization_id: organizationId })
    const response = await fetch(`${DIRECT_BACKEND_URL}/models/default/${modelType}?${queryParams}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async test(modelId: string, testInput: string, testType: string = 'completion'): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/models/${modelId}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ test_input: testInput, test_type: testType })
    })
    return handleResponse(response)
  },

  async listProviders(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/models/providers/list`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// User Profile API
// ============================================================================

export const userAPI = {
  async getProfile(params?: { include_stats?: boolean; include_activity?: boolean }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.include_stats) queryParams.append('include_stats', 'true')
    if (params?.include_activity) queryParams.append('include_activity', 'true')

    const response = await fetch(`${DIRECT_BACKEND_URL}/users/me${queryParams.toString() ? '?' + queryParams.toString() : ''}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async updateProfile(data: {
    display_name?: string
    preferences?: Record<string, any>
    profile?: Record<string, any>
    metadata?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async getUsage(days?: number, include_details?: boolean): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (days) queryParams.append('days', days.toString())
    if (include_details) queryParams.append('include_details', 'true')

    const response = await fetch(`${DIRECT_BACKEND_URL}/usage${queryParams.toString() ? '?' + queryParams.toString() : ''}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async getActivity(days?: number, include_messages?: boolean): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (days) queryParams.append('days', days.toString())
    if (include_messages) queryParams.append('include_messages', 'true')

    const response = await fetch(`${DIRECT_BACKEND_URL}/activity${queryParams.toString() ? '?' + queryParams.toString() : ''}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/users/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async getTokenUsage(params?: {
    agent_name?: string
    start_date?: string
    end_date?: string
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.agent_name) queryParams.append('agent_name', params.agent_name)
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)

    const response = await fetch(`${DIRECT_BACKEND_URL}/tokens/usage${queryParams.toString() ? '?' + queryParams.toString() : ''}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Automations API (Temporal-based scheduling)
// ============================================================================

export const automationsAPI = {
  /**
   * Create a new automation
   */
  async create(data: {
    name: string
    description?: string
    target_type: 'agent' | 'flow'
    agent_id?: string
    flow_id?: string
    input_template?: Record<string, any>
    schedule_type: 'cron' | 'interval' | 'one_time'
    cron_expression?: string
    timezone?: string
    interval_seconds?: number
    start_date?: string
    end_date?: string
    timeout_seconds?: number
    retry_policy?: Record<string, any>
    notification_config?: Record<string, any>
    tags?: string[]
    is_enabled?: boolean
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/automations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * List automations with optional filtering
   */
  async list(params?: {
    target_type?: 'agent' | 'flow'
    is_enabled?: boolean
    skip?: number
    limit?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params) {
      if (params.target_type) queryParams.append('target_type', params.target_type)
      if (params.is_enabled !== undefined) queryParams.append('is_enabled', params.is_enabled.toString())
      if (params.skip) queryParams.append('skip', params.skip.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
    }

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/automations/${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get automation by ID
   */
  async get(automationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/automations/${automationId}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Update an automation
   */
  async update(automationId: string, data: {
    name?: string
    description?: string
    input_template?: Record<string, any>
    cron_expression?: string
    timezone?: string
    interval_seconds?: number
    start_date?: string
    end_date?: string
    timeout_seconds?: number
    retry_policy?: Record<string, any>
    notification_config?: Record<string, any>
    tags?: string[]
    is_enabled?: boolean
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/automations/${automationId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Delete an automation
   */
  async delete(automationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/automations/${automationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Pause an automation
   */
  async pause(automationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/automations/${automationId}/pause`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Resume a paused automation
   */
  async resume(automationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/automations/${automationId}/resume`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Manually trigger an automation
   */
  async trigger(automationId: string, inputOverride?: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/automations/${automationId}/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ input_override: inputOverride })
    })
    return handleResponse(response)
  },

  /**
   * Get execution history for an automation
   */
  async getExecutions(automationId: string, params?: {
    status?: 'running' | 'completed' | 'failed' | 'cancelled'
    skip?: number
    limit?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params) {
      if (params.status) queryParams.append('status', params.status)
      if (params.skip) queryParams.append('skip', params.skip.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
    }

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/automations/${automationId}/executions${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get statistics for an automation
   */
  async getStats(automationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/automations/${automationId}/stats`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  }
}

// ============================================================================
// CONNECTOR BUILDER API
// ============================================================================

export const connectorsAPI = {
  /**
   * List available PyAirbyte connectors (600+)
   */
  async listAirbyte(): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/airbyte/list`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Test PyAirbyte connector configuration
   */
  async testAirbyte(data: {
    connector_name: string
    config: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/airbyte/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Import PyAirbyte connector from marketplace to workspace
   */
  async importAirbyte(connector: {
    name: string
    display_name: string
    category: string
    description: string
    docker_image?: string
    docker_image_tag?: string
    icon?: string
    release_stage?: string
    instance_name?: string  // Optional custom name
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/airbyte/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(connector)
    })
    return handleResponse(response)
  },

  /**
   * Rename a connector instance
   */
  async renameAirbyte(connectorId: string, instanceName: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/airbyte/rename/${connectorId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ instance_name: instanceName })
    })
    return handleResponse(response)
  },

  /**
   * Discover available streams for a connector
   */
  async discoverStreams(connectorId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/airbyte/${connectorId}/discover`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Sync data from selected streams
   */
  async syncData(connectorId: string, data: {
    streams: string[]
    limit?: number
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/airbyte/${connectorId}/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Generate custom connector (no-code)
   */
  async generateCustom(data: {
    config: {
      name: string
      description?: string
      base_url: string
      auth_type: string
      auth_config: Record<string, any>
      endpoints: Array<{
        method: string
        path: string
        name: string
        description?: string
        parameters?: Array<Record<string, any>>
        request_body_schema?: Record<string, any>
      }>
    }
    generate_airbyte?: boolean
    generate_mcp?: boolean
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/custom/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * List user's custom connectors
   */
  async listCustom(params?: {
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/custom/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get custom connector by ID
   */
  async getCustom(connectorId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/custom/${connectorId}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Delete custom connector
   */
  async deleteCustom(connectorId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/custom/${connectorId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Save connector credentials
   */
  async saveCredentials(data: {
    connector_name: string
    connector_type?: string
    display_name?: string
    credentials: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/credentials/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * List saved credentials
   */
  async listCredentials(): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/credentials/list`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Delete credentials
   */
  async deleteCredentials(credentialId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/credentials/${credentialId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // ============================================================================
  // OAuth Flow
  // ============================================================================

  /**
   * Initiate OAuth 2.0 flow
   */
  async initiateOAuth(data: {
    connector_name: string
    provider: string
    client_id: string
    client_secret?: string
    redirect_uri: string
    scopes?: string[]
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/oauth/initiate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(state: string, code?: string, error?: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ state })
    if (code) queryParams.append('code', code)
    if (error) queryParams.append('error', error)

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/oauth/callback?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Refresh OAuth token
   */
  async refreshOAuthToken(credentialId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/oauth/refresh/${credentialId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * List available OAuth providers
   */
  async listOAuthProviders(): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/oauth/providers`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  // ============================================================================
  // Connector Templates
  // ============================================================================

  /**
   * List connector templates
   */
  async listTemplates(category?: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (category) queryParams.append('category', category)

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/templates/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/templates/${templateId}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Instantiate template with variables
   */
  async instantiateTemplate(data: {
    template_id: string
    variables: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/templates/instantiate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // ============================================================================
  // Testing Playground
  // ============================================================================

  /**
   * Test connector endpoint
   */
  async testEndpoint(data: {
    connector_id?: string
    connector_name: string
    connector_type?: string
    endpoint: string
    method: string
    params?: Record<string, any>
    headers?: Record<string, any>
    body?: Record<string, any>
    credential_id?: string
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/test/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Get test history
   */
  async getTestHistory(params?: {
    connector_id?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.connector_id) queryParams.append('connector_id', params.connector_id)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/test/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get connector test statistics
   */
  async getTestStats(connectorId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/test/stats/${connectorId}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Generate sample request for endpoint
   */
  async generateSampleRequest(connectorId: string, endpointName: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/test/sample/${connectorId}/${endpointName}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  // ============================================================================
  // Connector Library (Global)
  // ============================================================================

  /**
   * List connectors in global library
   */
  async listLibraryConnectors(params?: {
    category?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.category) queryParams.append('category', params.category)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/library/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Get connector from library
   */
  async getLibraryConnector(libraryId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${DIRECT_BACKEND_URL}/connectors/library/${libraryId}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Import connector from library to workspace
   */
  async importFromLibrary(libraryId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/library/import/${libraryId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Add connector to library (admin only)
   */
  async addToLibrary(data: {
    connector_id?: string
    name: string
    display_name: string
    description: string
    icon_url?: string
    category: string
    base_url: string
    auth_type: string
    auth_config?: Record<string, any>
    endpoints: Array<any>
    airbyte_manifest?: Record<string, any>
    mcp_server_code?: string
    is_official?: boolean
    is_verified?: boolean
    visibility?: string
    documentation?: string
    setup_guide?: string
    example_use_cases?: string[]
    tags?: string[]
    keywords?: string[]
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/library/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  /**
   * Remove connector from library (admin only)
   */
  async removeFromLibrary(libraryId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/connectors/library/${libraryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Built-in Agents API
// ============================================================================

export const agentsAPI = {
  /**
   * List all built-in agents
   */
  async list(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/agents`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get built-in agent details
   */
  async get(agentId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/agents/${agentId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Background Tasks API
// ============================================================================

const tasksAPI = {
  /**
   * Create a new background task
   */
  async create(request: {
    type: 'research' | 'analysis' | 'automation'
    config: Record<string, any>
    chat_id?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    metadata?: Record<string, any>
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/api/v1/tasks/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    })
    return handleResponse(response)
  },

  /**
   * List user's tasks with optional filters
   */
  async list(params?: {
    status?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
    task_type?: 'research' | 'analysis' | 'automation'
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.task_type) queryParams.append('task_type', params.task_type)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(
      `${DIRECT_BACKEND_URL}/api/v1/tasks/?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    )
    return handleResponse(response)
  },

  /**
   * Get a specific task by ID
   */
  async get(taskId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/api/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Cancel a running or queued task
   */
  async cancel(taskId: string, reason?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/api/v1/tasks/${taskId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    })
    return handleResponse(response)
  },

  /**
   * Get task statistics for current user
   */
  async getStats(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/api/v1/tasks/stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// ============================================================================
// Scheduler Management API
// ============================================================================

const schedulerAPI = {
  /**
   * Get scheduler status
   */
  async getStatus(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/scheduler/status`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Start the scheduler service
   */
  async start(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/scheduler/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Stop the scheduler service
   */
  async stop(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/scheduler/stop`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Restart the scheduler service
   */
  async restart(): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/scheduler/restart`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get scheduler logs
   */
  async getLogs(lines: number = 100): Promise<ApiResponse<any>> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/scheduler/logs?lines=${lines}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Stream scheduler status via SSE
   */
  async streamStatus(): Promise<Response> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/scheduler/stream/status`, {
      headers: getSSEHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to start status stream: ${response.statusText}`)
    }

    return response
  },

  /**
   * Stream scheduler logs via SSE
   */
  async streamLogs(): Promise<Response> {
    const response = await fetch(`${DIRECT_BACKEND_URL}/scheduler/stream/logs`, {
      headers: getSSEHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to start log stream: ${response.statusText}`)
    }

    return response
  }
}

// ============================================================================
// Unified API Client Export
// ============================================================================

export const apiClient = {
  // Authentication
  login: authAPI.login,
  register: authAPI.register,
  getCurrentUser: authAPI.getCurrentUser,
  refreshToken: authAPI.refreshToken,
  logout: authAPI.logout,

  // Chat operations
  getChats: chatAPI.getChats,
  createChat: chatAPI.createChat,
  getChat: chatAPI.getChat,
  getChatMessages: chatAPI.getChatMessages,
  createMessage: chatAPI.createMessage,
  sendSimpleMessage: chatAPI.sendSimpleMessage,
  testConnection: chatAPI.testConnection,
  deleteChat: chatAPI.deleteChat,
  renameChat: chatAPI.renameChat,
  restoreChat: chatAPI.restoreChat,
  bulkDeleteChats: chatAPI.bulkDeleteChats,
  deleteChatMessage: chatAPI.deleteChatMessage,
  restoreMessage: chatAPI.restoreMessage,

  // Agent-specific APIs
  sophia: sophiaAPI,
  clavis: clavisAPI,
  analytica: analyticaAPI,
  aegis: aegisAPI,

  // Custom Agents APIs
  getCustomAgents: customAgentsAPI.list,
  getCustomAgent: customAgentsAPI.get,
  createCustomAgent: customAgentsAPI.create,
  updateCustomAgent: customAgentsAPI.update,
  deleteCustomAgent: customAgentsAPI.delete,
  restoreCustomAgent: customAgentsAPI.restore,
  cloneCustomAgent: customAgentsAPI.clone,
  searchCustomAgents: customAgentsAPI.search,
  recordCustomAgentUsage: customAgentsAPI.recordUsage,
  getCustomAgentStatistics: customAgentsAPI.getStatistics,
  chatWithCustomAgent: customAgentsAPI.chat,
  validateCustomAgent: customAgentsAPI.validate,
  bulkDeleteCustomAgents: customAgentsAPI.bulkDelete,
  bulkUpdateCustomAgents: customAgentsAPI.bulkUpdate,
  customAgents: customAgentsAPI,

  // Capabilities APIs
  getCapabilities: capabilitiesAPI.list,
  getCapability: capabilitiesAPI.get,
  createCapability: capabilitiesAPI.create,
  updateCapability: capabilitiesAPI.update,
  deleteCapability: capabilitiesAPI.delete,
  executeCapability: capabilitiesAPI.execute,
  searchCapabilities: capabilitiesAPI.search,
  capabilities: capabilitiesAPI,

  // Data source APIs
  getKnowledgeBases: knowledgeBaseAPI.list,
  getKnowledgeBase: knowledgeBaseAPI.get,
  createKnowledgeBase: knowledgeBaseAPI.create,
  getKnowledgeBaseDocumentCount: knowledgeBaseAPI.getDocumentCount,
  getKnowledgeBaseDocuments: knowledgeBaseAPI.getDocuments,
  deleteKnowledgeBase: knowledgeBaseAPI.delete,
  uploadDocument: knowledgeBaseAPI.uploadDocument,
  uploadDocumentToSophiaWithProgress: knowledgeBaseAPI.uploadDocumentWithProgress,
  deleteDocument: knowledgeBaseAPI.deleteDocument,
  retryDocumentProcessing: knowledgeBaseAPI.retryDocument,
  downloadDocument: knowledgeBaseAPI.downloadDocument,
  downloadKnowledgeBase: knowledgeBaseAPI.downloadKnowledgeBase,
  streamDocumentStatus: knowledgeBaseAPI.streamDocumentStatus,
  getCodebases: clavisAPI.getCodebases,
  createCodebase: clavisAPI.createCodebase,
  createScratchCodebase: clavisAPI.createScratchCodebase,
  deleteCodebase: clavisAPI.deleteCodebase,
  reindexCodebase: clavisAPI.reindexCodebase,
  createClavisPodSession: clavisAPI.createPodSession,
  getClavisPodSession: clavisAPI.getPodSession,
  startClavisPodSession: clavisAPI.startPodSession,
  executeClavisPodCommand: clavisAPI.executePodCommand,
  getPolicies: clavisAPI.getPolicies,
  createPolicy: clavisAPI.createPolicy,
  updatePolicy: clavisAPI.updatePolicy,
  deletePolicy: clavisAPI.deletePolicy,
  getBuckets: bucketAPI.list,
  getBucket: bucketAPI.get,
  getBucketSuggestions: bucketAPI.getSuggestions,
  createBucket: bucketAPI.create,
  updateBucket: bucketAPI.update,
  updateBucketMetadata: bucketAPI.updateMetadata,
  deleteBucket: bucketAPI.delete,

  // Marketplace APIs
  getMarketplaceAgents: customAgentsAPI.marketplace.browse,
  getMarketplaceAgent: customAgentsAPI.marketplace.get,
  importMarketplaceAgent: customAgentsAPI.marketplace.import,
  importMarketplaceCapability: capabilitiesAPI.marketplace.import,
  getMarketplaceCapabilities: capabilitiesAPI.marketplace.browse,

  // Widget APIs
  widgets: widgetAPI,

  // Model Management APIs
  models: modelsAPI,

  // Flow APIs
  flows: flowsAPI,

  // Automation APIs
  automations: automationsAPI,

  // Scheduler Management APIs
  scheduler: schedulerAPI,

  // Connector APIs
  connectors: connectorsAPI,

  // Background Tasks APIs
  tasks: tasksAPI,

  // Built-in Agents API
  getBuiltInAgents: agentsAPI.list,
  getBuiltInAgent: agentsAPI.get,
  agents: agentsAPI
}

export default apiClient
