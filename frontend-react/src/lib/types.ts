// frontend/src/lib/types.ts
// COMPLETE UPDATED TYPES with MongoDB Backend Integration and SOPHIA BACKEND

// ============ CORE USER TYPES ============

export interface User {
  id: string                    // MongoDB ObjectId (e.g., "686af3f98a7e2b81fbb96a1e")
  user_id?: string             // Actual user identifier (e.g., "user_708712c883ec_839737")
  email: string
  display_name?: string
  subscription_tier: 'free' | 'basic' | 'professional' | 'enterprise'
  is_system_admin?: boolean    // System admin flag for global marketplace operations
  created_at: string
  updated_at: string
  email_verified?: boolean
  status?: string
  profile?: {
    registration_method?: string
    registration_ip?: string | null
    [key: string]: any
  }
  preferences?: {
    communication_style?: string
    notifications_enabled?: boolean
    [key: string]: any
  }
  metadata?: Record<string, any>
  total_chats?: number
  total_messages?: number
  last_login?: string
  refresh_token?: string
  refresh_token_created?: string
  role: string
}

// ============ ANALYTICA BUCKET TYPES ============

export interface Bucket {
  bucket_id: string
  name: string
  description?: string
  filename: string
  file_type: string
  file_size: number
  row_count: number
  column_count: number
  data_info: BucketDataInfo
  access_count: number
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

export interface BucketDataInfo {
  columns: Record<string, ColumnInfo>
  shape: [number, number]
  numeric_columns: string[]
  categorical_columns: string[]
  datetime_columns: string[]
  data_quality: DataQuality
  sample_data: Record<string, any[]>
}

export interface ColumnInfo {
  dtype: string
  unique_values: number
  missing_values: number
  missing_percentage: number
  sample_values: any[]
  top_categories?: Record<string, number>
  mean?: number
  median?: number
  std?: number
  min?: number | string
  max?: number | string
}

export interface DataQuality {
  total_missing: number
  complete_rows: number
  duplicate_rows: number
  data_completeness: number
}

// ============ CLAVIS CODEBASE TYPES ============

export interface Codebase {
  id: number
  codebase_id: string
  repo_name: string
  repo_path: string
  repo_type: 'local' | 'cloned'
  last_indexed: string
  total_files: number
  total_chunks: number
  source_url: string | null
  commit_hash: string | null
}

export interface CreateCodebaseRequest {
  repo_url: string
  repo_name: string
  max_files: number
  auth_type: 'none' | 'token'
  auth_token?: string
}

// ============ UPDATED KNOWLEDGE BASE TYPES (SOPHIA-ENHANCED) ============

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
  status: 'active' | 'building' | 'error' | 'deleted'
  embedding_model: string
  chunk_size: number
  chunk_overlap: number
  vector_count?: number
  document_count?: number
  documents_count?: number
  documentCount?: number
  doc_count?: number
  num_documents?: number
  total_documents?: number
  last_accessed?: string
  storage_size?: number
  processing_stats?: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
  health_status?: 'healthy' | 'degraded' | 'unhealthy'
  metadata?: Record<string, any>
}

export interface KnowledgeBaseCreateRequest {
  name: string
  description?: string
  user_id?: string
  embedding_model?: string
  chunk_size?: number
  chunk_overlap?: number
  metadata?: Record<string, any>
}

export interface CreateKnowledgeBaseRequest {
  name: string
  description?: string
  embedding_model?: string
  chunk_size?: number
  chunk_overlap?: number
}

export interface KnowledgeBaseResponse {
  success: boolean
  knowledge_base: KnowledgeBase
  message?: string
  metadata?: Record<string, any>
}

export interface KnowledgeBaseListResponse {
  success: boolean
  knowledge_bases: KnowledgeBase[]
  total_count?: number
  user_stats?: {
    total_knowledge_bases: number
    total_documents: number
    total_storage_used: number
  }
  metadata?: Record<string, any>
}

export interface KnowledgeBaseSyncOptions {
  force_reindex?: boolean
  batch_size?: number
  include_metadata?: boolean
}

export interface KnowledgeBaseHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  documents_count: number
  embeddings_count: number
  index_status: string
  last_sync: string
  issues?: string[]
  recommendations?: string[]
}

export interface KnowledgeBaseStatsResponse {
  documents_count: number
  total_size_bytes: number
  embeddings_count: number
  chunks_count: number
  last_updated: string
  storage_usage: {
    documents: number
    embeddings: number
    metadata: number
  }
  processing_status: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
}

export interface KnowledgeBaseOperationResponse {
  message: string
  operation_id: string
  status: string
  documents_synced?: number
  estimated_time?: number
}

// ============ UPDATED DOCUMENT TYPES (SOPHIA-ENHANCED) ============

export interface Document {
  id: string
  document_id?: string
  filename: string
  original_filename?: string
  description?: string
  size_bytes: number
  mime_type?: string
  content_type?: string
  knowledge_base_id: string
  user_id: string
  uploaded_at?: string
  created_at: string
  updated_at: string
  processed?: boolean
  status: 'pending' | 'processing' | 'active' | 'failed' | 'deleted' | 'uploading' | 'error'
  chunk_count?: number
  s3_url?: string
  download_url?: string
  processing_time_ms?: number
  error_message?: string
  embedding_status?: 'pending' | 'processing' | 'completed' | 'failed'
  metadata?: {
    description?: string
    size_bytes?: number
    content_type?: string
    s3_key?: string
    processing_log?: Array<{
      timestamp: string
      level: string
      message: string
    }>
    custom_metadata?: {
      display_name?: string
      tags?: string[]
      [key: string]: any
    }
    [key: string]: any
  }
}

export interface EnhancedDocument extends Document {
  display_name?: string
  tags?: string[]
}

export interface DocumentUploadResponse {
  success: boolean
  document: Document
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  processing_time_ms?: number
  metadata?: Record<string, any>
}

export interface DocumentUpdateMetadata {
  description?: string
  tags?: string[]
  custom_metadata?: Record<string, any>
}

export interface DocumentDeleteOptions {
  hard_delete?: boolean
  cleanup_embeddings?: boolean
  backup_before_delete?: boolean
}

export interface BulkDocumentOperation {
  type: 'delete' | 'update_metadata' | 'move'
  document_ids: string[]
  data?: any
  options?: Record<string, any>
}

export interface BulkOperationResponse {
  succeeded: string[]
  failed: Array<{ id: string; error: string }>
  operation_id: string
}

export interface BulkDocumentResult {
  total: number
  succeeded: number
  failed: number
  errors: Array<{
    documentId: string
    error: string
  }>
}

export interface DocumentReprocessOptions {
  force_reextract?: boolean
  regenerate_embeddings?: boolean
  update_metadata?: boolean
}

export interface DocumentStatus {
  status: 'uploading' | 'processing' | 'active' | 'failed' | 'deleted'
  progress?: number
  error?: string
  chunks_count?: number
  embedding_status?: string
}

export interface DocumentWithDetails extends Document {
  chunks?: Array<{
    id: string
    content: string
    metadata: Record<string, any>
    embedding_status: string
  }>
  processing_log?: Array<{
    timestamp: string
    level: string
    message: string
  }>
}

export interface DocumentActionResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// ============ CUSTOM AGENTS TYPES ============

export type InterfaceType = 'chat' | 'form' | 'json' | 'api' | 'wizard'

export interface CustomAgent {
  id: string
  name: string
  emoji: string
  description: string
  agent_type?: 'chat' | 'flow'
  system_prompt: string
  initial_message?: string  // Greeting shown when chat starts (chat mode only)

  // Interface configuration - determines how users interact with the agent
  interface_type: InterfaceType
  interface_config: Record<string, any>

  example_queries: ExampleQuery[]
  capabilities: AgentCapability[]
  configuration: AgentConfiguration
  tags: string[]
  visibility: 'private' | 'public' | 'organization'
  is_template: boolean
  is_global: boolean
  imported_from: string | null
  user_id: string
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  deleted_at: string | null
  deleted_by: string | null
  restored_at: string | null
  restored_by: string | null
  deletion_reason: string | null
  usage_count: number
  last_used_at: string | null
  cloned_from: string | null
  clone_count: number
  metadata: Record<string, any>
}

export interface ExampleQuery {
  query: string
  expected_response: string
  description?: string
}

export interface AgentCapability {
  capability_id: string
  enabled: boolean
  custom_config: Record<string, any> | null
}

export interface AgentConfiguration {
  temperature: number
  max_tokens: number
  top_p: number
  frequency_penalty: number
  presence_penalty: number
  stop_sequences: string[]
}

export interface CreateCustomAgentRequest {
  name: string
  emoji: string
  description: string
  agent_type?: 'chat' | 'flow'
  system_prompt: string

  // Interface configuration
  interface_type?: InterfaceType
  interface_config?: Record<string, any>

  example_queries?: ExampleQuery[]
  capabilities?: AgentCapability[]
  configuration?: Partial<AgentConfiguration>
  tags?: string[]
  visibility?: 'private' | 'public' | 'organization'
  is_template?: boolean
  metadata?: Record<string, any>
}

export interface UpdateCustomAgentRequest {
  name?: string
  emoji?: string
  description?: string
  agent_type?: 'chat' | 'flow'
  system_prompt?: string

  // Interface configuration
  interface_type?: InterfaceType
  interface_config?: Record<string, any>

  example_queries?: ExampleQuery[]
  capabilities?: AgentCapability[]
  configuration?: Partial<AgentConfiguration>
  tags?: string[]
  visibility?: 'private' | 'public' | 'organization'
  is_template?: boolean
  metadata?: Record<string, any>
}

// ============ CAPABILITIES TYPES ============

export interface Capability {
  id: string
  name: string
  description: string
  category: string
  code: string
  parameters: CapabilityParameter[]
  return_type: string
  timeout_seconds: number
  requires_approval: boolean
  is_global: boolean
  user_id: string
  usage_count: number
  last_used_at: string | null
  status: 'active' | 'inactive' | 'archived'
  tags: string[]
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface CapabilityParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description?: string
  required: boolean
  default?: any
  copyable?: boolean  // Whether this field can be copied to clipboard
  sensitive?: boolean  // Whether this is sensitive data (e.g., API keys)

  // LLM-Based Parameter Collection
  llm_collection?: {
    prompt: string  // How to ask the user for this parameter
    extraction_hint?: string  // Guide LLM on how to extract value from response
    examples?: Array<{  // Example inputs and how to interpret them
      input: string
      extracted_value: string
      explanation?: string
    }>
    context_aware?: boolean  // Should consider conversation context
  }

  // LLM-Based Validation (no regex!)
  validation?: {
    enabled: boolean
    instruction: string  // Natural language: "Verify this is a real city name"
    on_invalid: 'retry' | 'use_default' | 'skip' | 'ask_user'
    max_retries?: number
    retry_prompt?: string  // What to say when retrying
    examples?: {
      valid?: string[]  // Examples of valid inputs
      invalid?: string[]  // Examples of invalid inputs
    }
  }

  // Confirmation Flow
  confirmation?: {
    enabled: boolean
    template: string  // "You want weather for {city}, correct?"
    allow_correction: boolean
    correction_prompt?: string  // "Which city did you mean?"
    max_corrections?: number
  }

  api_config?: {  // API-specific configuration
    endpoint?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    payload?: Record<string, any>
    auth_type?: 'none' | 'bearer' | 'basic' | 'api_key'
  }
  metadata?: Record<string, any>  // Additional custom metadata
}

export interface CreateCapabilityRequest {
  name: string
  description: string
  category: string
  code: string
  parameters: CapabilityParameter[]
  return_type: string
  timeout_seconds?: number
  requires_approval?: boolean
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateCapabilityRequest {
  name?: string
  description?: string
  category?: string
  code?: string
  parameters?: CapabilityParameter[]
  return_type?: string
  timeout_seconds?: number
  requires_approval?: boolean
  tags?: string[]
  metadata?: Record<string, any>
}

export interface ExecuteCapabilityRequest {
  [key: string]: any
}

export interface ExecuteCapabilityResponse {
  success: boolean
  capability_id: string
  capability_name: string
  result: any
  print_output: string
  execution_time_ms: number
  error: string | null
  timestamp: string
}

// ============ MARKETPLACE TYPES ============

export interface MarketplaceAgent extends CustomAgent {
  rating: number
  download_count: number
  author_name: string
  last_updated: string
}

export interface MarketplaceCapability extends Capability {
  rating: number
  download_count: number
  author_name: string
  last_updated: string
}

// ============ ANALYTICA TYPES ============

export interface AnalyticaChatRequest {
  message: string
  bucket_id: string
  chat_id: string
  context_chunks?: number
  temperature?: number
}

export interface AnalyticaChatResponse {
  success: boolean
  response: string
  chat_id: string
  message_id: string
  user_message_id: string
  session_data: {
    has_data: boolean
    data_shape: [number, number] | null
    filename: string | null
    bucket_id: string | null
    insights_count: number
    conversation_length: number
  }
  processing_time_ms: number | null
  visualizations?: any[]
  execution_output?: string
  code_generated?: string
}

// ============ CLAVIS TYPES (UPDATED - CONSISTENT WITH SOPHIA/AEGIS) ============

export interface ClavisChatRequest {
  message: string
  codebase_id: string
  chat_id: string
  mode?: 'chat' | 'search' | 'explain'
  context_chunks?: number
  temperature?: number
}

export interface ClavisChatResponse {
  success: boolean
  response: string              // ✅ AI's actual response (same as Sophia/Aegis)
  chat_id: string
  codebase_id: string
  repo_name: string
  mode: string
  sources_used: CodeSource[]
  context_chunks: number
  response_time_ms: number
  message_id?: string           // Optional: if backend returns it
  user_message_id?: string      // Optional: if backend returns it
}

export interface CodeSource {
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

// ============ CHAT TYPES ============

export interface Chat {
  id: string
  title: string
  agent_type: AgentType
  knowledge_base_id?: string
  bucket_id?: string            // For Analytica
  codebase_id?: string          // For Clavis
  user_id: string
  status: 'active' | 'archived' | 'deleted' | 'paused'
  created_at: string
  updated_at: string
  last_message_at?: string
  lastActivity?: string
  messageCount?: number
  tool?: string
  subtool?: string
  customAgentId?: string
  custom_agent_id?: string
  metadata?: Record<string, any>
  lastMessage?: string
  lastMessageSender?: string
  deletedAt?: string
  deletedBy?: string
  deletionReason?: string
  restoredAt?: string
  restoredBy?: string
  totalTokensUsed?: number
  averageResponseTime?: number
  favorited?: boolean
  tags?: string[]
}

export interface CreateChatRequest {
  title: string
  agent_type: AgentType
  knowledge_base_id?: string
  bucket_id?: string            // For Analytica
  codebase_id?: string          // For Clavis
  tool?: string
  subtool?: string
  custom_agent_id?: string
  metadata?: Record<string, any>
  initial_message?: string
}

export interface CreateChatWithMessageRequest {
  title: string
  agent_type: AgentType
  knowledge_base_id?: string
  bucket_id?: string            // For Analytica
  codebase_id?: string          // For Clavis
  first_message: string
  tool?: string
  subtool?: string
  custom_agent_id?: string
  metadata?: Record<string, any>
}

export interface ChatUpdateRequest {
  title?: string
  knowledge_base_id?: string
  bucket_id?: string            // For Analytica
  codebase_id?: string          // For Clavis
  tool?: string
  subtool?: string
  status?: 'active' | 'archived' | 'deleted' | 'paused'
  metadata?: Record<string, any>
}

// ============ MESSAGE TYPES ============

export interface Message {
  id: string
  chat_id: string
  user_id?: string
  content: string
  sender: 'user' | 'assistant' | 'system'
  tool?: string
  subtool?: string
  tool_config?: Record<string, any>
  created_at: string
  updated_at?: string
  attachments?: Attachment[]
  artifacts?: Artifact[]
  sources?: SourceInfo[]
  execution_id?: string
  execution_status?: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'stopped' | 'paused' | 'cancelled' | 'timeout'
  status?: 'active' | 'deleted' | 'archived' | 'hidden' | 'flagged'
  deleted_at?: string
  deleted_by?: string
  deletion_reason?: string
  restored_at?: string
  restored_by?: string
  metadata?: Record<string, any>
  tags?: string[]
  regenerated?: boolean
  regenerated_from?: string
  token_count?: number
  processing_time_ms?: number
  cost_usd?: number
  user_rating?: number
  user_feedback?: string
  bookmarked?: boolean
}

export interface CreateMessageRequest {
  content: string
  sender?: 'user' | 'assistant' | 'system'
  tool?: string
  subtool?: string
  tool_config?: Record<string, any>
  attachments?: Attachment[]
  metadata?: Record<string, any>
  knowledge_base_id?: string
  bucket_id?: string            // For Analytica
  codebase_id?: string          // For Clavis
  custom_agent_id?: string
  stream_response?: boolean
  execute_immediately?: boolean
  priority?: number
}

export interface EnhancedMessageResponse {
  success: boolean
  response: string
  tool_used: string
  tool_name: string
  personality_used: string
  routing_method: string
  routing_info: string
  context_used: boolean
  processing_time_ms: number
}

export interface MessageWithFileAnalysis extends Message {
  file_analysis?: {
    filename: string
    file_type: string
    analysis_results: string
    visualizations: string[] // base64 encoded images
    processing_time: number
  }
}

// ============ ATTACHMENT AND SOURCE TYPES ============

export interface Attachment {
  id?: string
  type?: 'file' | 'image' | 'document' | 'audio' | 'video' | 'spreadsheet' | 'presentation' | 'archive' | 'code'
  name?: string
  filename: string
  size?: number
  size_bytes: number
  data?: string  // Base64 encoded
  url?: string
  mime_type: string
  metadata?: Record<string, any>
  uploaded_at?: string
  file_id?: string
}

export interface SourceInfo {
  document_id: string
  document_name: string
  chunk_index?: number
  chunk_text?: string
  score: number
  page_number?: number
  metadata: Record<string, any>
  knowledge_base_id?: string
  chunk_id?: string
  relevance_score?: number
  context_window?: string
  source_url?: string
}

export interface Artifact {
  type: string
  name: string
  content: string
  size_bytes: number
  metadata?: Record<string, any>
}

// ============ SOPHIA-SPECIFIC TYPES ============

export interface SophiaChatRequest {
  message: string
  chat_id: string
  knowledge_base_id?: string
  include_sources?: boolean
  max_sources?: number
  temperature?: number
  include_context?: boolean
}

export interface SophiaChatResponse {
  success: boolean
  response: string
  knowledge_base_id?: string
  sources: SourceInfo[]
  chat_id?: string
  message_id?: string
  token_usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  response_time_ms?: number
  model_used?: string
  metadata?: Record<string, any>
}

export interface EnhancedChatRequest {
  message: string
  user_id: string
  knowledge_base_id?: string
  include_sources?: boolean
  max_sources?: number
  context_window?: number
  temperature?: number
  stream?: boolean
}

export interface QueryRequest {
  query: string
  knowledge_base_id: string
  user_id: string
  include_sources?: boolean
  max_sources?: number
  temperature?: number
}

export interface QueryResponse {
  success: boolean
  response: string
  sources: SourceInfo[]
  knowledge_base_id: string
  query_id?: string
  token_usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  response_time_ms?: number
  model_used?: string
  metadata?: Record<string, any>
}

// ============ AEGIS TYPES ============

export interface AegisChatRequest {
  user_id: string
  message: string
  tool: 'auto' | 'general_aegis' | 'data_analyzer' | 'emotional_support' | 'research' | 'code_executor' | 'file_processor'
  subtool?: string
  personality?: 'quirky' | 'professional' | 'wise' | 'energetic' | 'calm' | 'witty' | 'analytical' | 'creative' | 'supportive'
  custom_agent_id?: string
  knowledge_base_id?: string
  temperature?: number
  include_context?: boolean
  execute_code?: boolean
  chat_id?: string
  max_tokens?: number
  stream_response?: boolean
}

export interface ResearchRequest {
  user_id?: string
  query: string
  knowledge_base_id?: string
}

// ============ FILE UPLOAD TYPES ============

export interface AegisUploadRequest {
  message: string
  filename: string
  content: string // base64 encoded
  mime_type: string
  chat_id: string
  tool?: string
  subtool?: string
  auto_process?: boolean
  temperature?: number
}

export interface AegisUploadResponse {
  success: boolean
  chat_id: string
  message_id: string
  user_message_id: string
  response: string
  file_info: {
    success: boolean
    filename: string
    file_type: string
    status: string
    file_size: number
    shape?: number[]
    columns?: string[]
    length?: number
    encoding?: string
    summary_stats?: any
    processing_time_ms: number
    errors: string[]
  }
  tool_used: string
  subtool_used: string
  processing_time_ms: number
  storage_path: string
  accessible_in_code: boolean
}

export interface UploadFileInfo {
  file: File
  preview?: string
  id: string
}

export interface FileUploadState {
  isUploading: boolean
  uploadProgress: number
  fileName: string
  fileSize?: number
  fileType?: string
}

export interface UploadProgressCallback {
  (progress: number): void
}

export interface FileUploadOptions {
  description?: string
  tags?: string[]
  onProgress?: UploadProgressCallback
  metadata?: Record<string, any>
}

export interface FileUploadProgress {
  status: FileUploadStatus
  progress: number
  message: string
  fileName: string
  startTime: number
  estimatedCompletion?: number
}

export interface FileTypeConfig {
  icon: React.ReactNode
  name: string
  color: string
  accept: string
  maxSize?: number
  description?: string
}

// ============ RESEARCH TYPES ============

export interface ResearchSession {
  session_id: string
  status: 'starting' | 'searching' | 'processing' | 'completed' | 'error'
  progress: number
  current_stage: string
  query: string
  estimated_time?: number
  max_sources?: number
  created_at: string
  files?: ResearchFile[]
}

export interface ResearchFile {
  filename: string
  size: number
  type: string
  download_url?: string
}

// ============ TOOLS AND AGENTS ============

export interface Tool {
  name: string
  description: string
  subtools: Subtool[]
}

export interface Subtool {
  name: string
  description: string
  estimated_time?: string
}

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  detail?: string
  message?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore?: boolean
    has_more?: boolean
    currentPage?: number
    totalPages?: number
  }
}

export interface SophiaSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  metadata?: {
    request_id?: string
    processing_time_ms?: number
    model_used?: string
    knowledge_base_id?: string
    source_count?: number
    [key: string]: any
  }
}

// ============ ERROR HANDLING TYPES ============

export interface ErrorDetail {
  code: string
  message: string
  field?: string
  context?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ApiError {
  success: false
  error: string
  details?: ErrorDetail[]
  validation_errors?: ValidationError[]
  status_code?: number
  timestamp?: string
  request_id?: string
}

export interface SophiaError {
  success: false
  error: string
  error_code?: string
  details?: {
    field?: string
    message: string
    code?: string
  }[]
  knowledge_base_id?: string
  timestamp?: string
  request_id?: string
}

export interface SophiaValidationError {
  field: string
  message: string
  code: string
  value?: any
  knowledge_base_context?: string
}

// ============ AUTHENTICATION TYPES ============

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  id_token?: string
  email: string
  password?: string
  display_name?: string
}

export interface AuthResponse {
  success: boolean
  access_token: string
  refresh_token: string
  user: User
  token_type: string
  expires_in: number
}

// ============ USER PROFILE TYPES ============

export interface UserProfileUpdateRequest {
  display_name?: string
  preferences?: Record<string, any>
  profile?: Record<string, any>
  metadata?: Record<string, any>
}

// ============ BULK OPERATIONS INTERFACES ============

export interface BulkDeleteChatsRequest {
  chat_ids: string[]
  hard_delete?: boolean
}

export interface BulkDeleteMessagesRequest {
  message_ids: string[]
  hard_delete?: boolean
  reason?: string
  delete_artifacts?: boolean
  delete_files?: boolean
}

// ============ SIMPLE MESSAGE TYPES ============

export interface SimpleMessageRequest {
  content: string
  sender?: 'user' | 'assistant' | 'system'
  tool?: string
  subtool?: string
  knowledge_base_id?: string
  bucket_id?: string            // For Analytica
  codebase_id?: string          // For Clavis
  metadata?: Record<string, any>
}

export interface SimpleMessageResponse {
  success: boolean
  user_message: Message
  ai_message: Message
  processing_time_ms: number
}

// ============ FILTER TYPES WITH PROPER PARAMETER NAMES ============

export interface ChatFilters {
  limit?: number
  offset?: number
  agentType?: string
  agent_type?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface MessageFilters {
  limit?: number
  offset?: number
  sortOrder?: 'asc' | 'desc'
  include_artifacts?: boolean
  includeArtifacts?: boolean
  sort_order?: 'asc' | 'desc'
}

// ============ EXTENDED TYPES FOR SPECIFIC USE CASES ============

export interface AttachmentInfo {
  type: 'file' | 'image' | 'document' | 'audio' | 'video' | 'spreadsheet' | 'presentation' | 'archive' | 'code'
  name: string
  size: number
  data?: string  // Base64 encoded
  url?: string
  mime_type?: string
  metadata: Record<string, any>
  uploaded_at?: string
  file_id?: string
}

// ============ UTILITY TYPE DEFINITIONS ============

export type AgentType = 'sophia' | 'aegis' | 'analytica' | 'clavis' | 'custom'
export type AegisChatTool = 'wise' | 'creative' | 'analytical' | 'supportive' | 'quirky' | 'professional' | 'energetic' | 'calm'
export type ChatStatus = 'active' | 'archived' | 'deleted' | 'paused'
export type MessageSender = 'user' | 'assistant' | 'system'
export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise'
export type DocumentStatusType = 'pending' | 'processing' | 'active' | 'failed' | 'deleted' | 'uploading' | 'error'
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'
export type OperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type DocumentOperation = 'rename' | 'delete' | 'download' | 'reprocess' | 'view'
export type FileUploadStatus = 'preparing' | 'uploading' | 'processing' | 'analyzing' | 'generating' | 'completed' | 'error'

export type SupportedFileType =
  | 'text/csv'
  | 'application/json'
  | 'text/plain'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// ============ TYPE GUARDS ============

export function isDocument(obj: any): obj is Document {
  return obj && (typeof obj.id === 'string' || typeof obj.document_id === 'string') && typeof obj.filename === 'string'
}

export function isKnowledgeBase(obj: any): obj is KnowledgeBase {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.user_id === 'string'
}

export function isEnhancedKnowledgeBase(obj: any): obj is KnowledgeBase {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.embedding_model === 'string'
}

export function isChat(obj: any): obj is Chat {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && typeof obj.agent_type === 'string'
}

export function isMessage(obj: any): obj is Message {
  return obj && typeof obj.id === 'string' && typeof obj.content === 'string' && typeof obj.sender === 'string'
}

export function isApiError(obj: any): obj is ApiError {
  return obj && obj.success === false && typeof obj.error === 'string'
}

export function isSophiaError(obj: any): obj is SophiaError {
  return obj && obj.success === false && typeof obj.error === 'string'
}

export function isSophiaResponse<T>(obj: any): obj is SophiaSuccessResponse<T> {
  return obj && obj.success === true && obj.data !== undefined
}

// ============ SOPHIA API CLIENT INTERFACE ============

export interface SophiaApiMethods {
  // Chat methods
  chatWithSophia(data: SophiaChatRequest): Promise<ApiResponse<SophiaChatResponse>>
  querySophia(data: QueryRequest): Promise<ApiResponse<QueryResponse>>

  // Knowledge base methods (Sophia-specific)
  createKnowledgeBase(data: KnowledgeBaseCreateRequest): Promise<ApiResponse<KnowledgeBase>>
  getKnowledgeBases(includeStats?: boolean): Promise<ApiResponse<KnowledgeBase[]>>
  getKnowledgeBase(kbId: string, includeDocuments?: boolean): Promise<ApiResponse<KnowledgeBase>>
  updateKnowledgeBase(kbId: string, data: Partial<KnowledgeBaseCreateRequest>): Promise<ApiResponse<KnowledgeBase>>
  deleteKnowledgeBase(kbId: string, hardDelete?: boolean): Promise<ApiResponse<void>>

  // Document methods (Sophia-specific)
  uploadDocumentToSophia(kbId: string, file: File, description?: string, processImmediately?: boolean): Promise<ApiResponse<Document>>
  uploadDocumentToSophiaWithProgress(kbId: string, file: File, description?: string, processImmediately?: boolean, onProgress?: (progress: number) => void): Promise<ApiResponse<Document>>
  getKnowledgeBaseDocuments(kbId: string, includeProcessingStatus?: boolean, limit?: number, offset?: number): Promise<ApiResponse<Document[]>>
  deleteDocument(kbId: string, documentId: string, cleanupVectors?: boolean): Promise<ApiResponse<void>>

  // Health check
  getSophiaHealth(): Promise<ApiResponse<any>>
}

// ============ CONFIGURATION TYPES ============

export interface SophiaConfiguration {
  baseUrl: string
  timeout: number
  retryAttempts: number
  defaultTemperature: number
  defaultMaxSources: number
  defaultChunkSize: number
  defaultChunkOverlap: number
  enableStatistics: boolean
  enableHealthChecks: boolean
}

// ============ MIGRATION HELPERS ============

export interface SophiaMigrationHelper {
  // Maps old knowledge base response to new format
  migrateKnowledgeBaseResponse(oldResponse: any): KnowledgeBase

  // Maps old chat response to new format
  migrateChatResponse(oldResponse: any): SophiaChatResponse

  // Maps old document response to new format
  migrateDocumentResponse(oldResponse: any): Document
}