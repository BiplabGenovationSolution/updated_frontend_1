/**
 * Agent Flow Builder Types
 * Type definitions for the visual flow builder
 */

import type { Node, Edge } from 'reactflow'

// ============================================================================
// Enums
// ============================================================================

export enum FlowStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum NodeType {
  // Input nodes
  INPUT_TEXT = 'input.text',
  INPUT_FORM = 'input.form',
  INPUT_JSON = 'input.json',
  INPUT_QUERY = 'input.query',
  INPUT_DOCUMENT = 'input.document',
  INPUT_API = 'input.api',

  // Decision nodes
  DECISION_CONDITIONAL = 'decision.conditional',
  DECISION_LLM = 'decision.llm',
  DECISION_PATTERN = 'decision.pattern',

  // Action nodes
  ACTION_LLM = 'action.llm',
  ACTION_AGENT = 'action.agent',
  ACTION_CAPABILITY = 'action.capability',
  ACTION_TRANSFORM = 'action.transform',
  ACTION_LOOP = 'action.loop',
  ACTION_DELAY = 'action.delay',

  // Output nodes
  OUTPUT_TEXT = 'output.text',
  OUTPUT_JSON = 'output.json',
  OUTPUT_API = 'output.api',

  // Connector nodes (NEW - PyAirbyte + Custom connectors)
  CONNECTOR_READ = 'connector.read',
  CONNECTOR_WRITE = 'connector.write',

  // Filesystem nodes (NEW - File and shell operations)
  FILE_READ = 'file.read',
  FILE_WRITE = 'file.write',
  SHELL_EXEC = 'shell.exec',

  // Git nodes (NEW - Version control operations)
  GIT_CLONE = 'git.clone',
  GIT_COMMIT = 'git.commit',
  GIT_PUSH = 'git.push',

  // Code analysis nodes (NEW - Code understanding)
  CODE_TREE = 'code.tree',
  CODE_SEARCH = 'code.search',

  // Testing nodes (NEW - Test execution)
  TEST_RUN = 'test.run',

  // MCP nodes (NEW - Model Context Protocol integration)
  MCP_TOOL = 'mcp.tool',

  // Knowledge base nodes (NEW - Vector database and semantic search)
  KNOWLEDGE_BASE_SEARCH = 'knowledge.search',
  KNOWLEDGE_BASE_WRITE = 'knowledge.write',

  // Error handling nodes (NEW - Production error handling)
  ERROR_HANDLER = 'error.handler',
  TRY_CATCH = 'error.try_catch',

  // Human-in-the-loop nodes (NEW - Human approval and review)
  HUMAN_APPROVAL = 'human.approval',
  HUMAN_REVIEW = 'human.review',

  // Audit and compliance nodes (NEW - Logging and compliance)
  AUDIT_LOG = 'audit.log',
  COMPLIANCE_CHECK = 'audit.compliance',

  // Notification nodes (NEW - Alerts and notifications)
  NOTIFICATION = 'notification.send',
  ALERT = 'notification.alert',
  WEBHOOK = 'notification.webhook',

  // Data validation nodes (NEW - Data integrity)
  DATA_VALIDATION = 'validation.data',
  SCHEMA_VALIDATION = 'validation.schema',

  // Parallel execution nodes (NEW - Concurrent processing)
  PARALLEL = 'flow.parallel',
  MERGE = 'flow.merge',
  JOIN = 'flow.join',

  // Cache nodes (NEW - Performance optimization)
  CACHE_READ = 'cache.read',
  CACHE_WRITE = 'cache.write',
  CACHE_INVALIDATE = 'cache.invalidate',

  // Scheduling nodes (NEW - Time-based execution)
  SCHEDULE = 'schedule.time',
  TRIGGER = 'schedule.trigger',
  CRON = 'schedule.cron',

  // Rate limiting node (NEW - API protection)
  RATE_LIMIT = 'flow.rate_limit',

  // Advanced agent nodes (NEW - Iterative and tool-enabled agents)
  AGENT_ITERATIVE = 'agent.iterative',
  AGENT_WITH_TOOLS = 'agent.with_tools'
}

// ============================================================================
// Node & Edge Types
// ============================================================================

export interface FlowNode {
  id: string
  type: string
  label: string
  step_id?: number
  config?: Record<string, any>
  position?: { x: number; y: number }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  condition?: Record<string, any>
}

export interface FlowConfig {
  startNodeId: string
  maxExecutionTime?: number
  errorHandling?: string
  retryAttempts?: number
  timeout?: number
}

// ============================================================================
// Flow Types
// ============================================================================

export interface Flow {
  flow_id: string
  agent_id?: string
  user_id: string
  name: string
  description?: string
  version: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  config: FlowConfig
  variables: Record<string, any>
  status: FlowStatus
  is_global: boolean
  execution_count: number
  last_executed_at?: string
  tags: string[]
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface FlowExecution {
  execution_id: string
  flow_id: string
  user_id: string
  input_data: Record<string, any>
  output_data?: Record<string, any>
  status: ExecutionStatus
  current_node_id?: string
  visited_nodes: string[]
  node_outputs: Record<string, any>
  started_at?: string
  completed_at?: string
  duration_ms?: number
  success: boolean
  error_message?: string
  logs: Array<{
    timestamp: string
    level: string
    message: string
    node_id?: string
  }>
  created_at: string
  metadata: Record<string, any>
}

// ============================================================================
// Node Configuration Types
// ============================================================================

export interface InputTextConfig {
  prompt?: string
  placeholder?: string
  multiline?: boolean
}

export interface InputFormConfig {
  fields: Array<{
    name: string
    label?: string
    type?: 'text' | 'number' | 'email' | 'date' | 'tel' | 'textarea'
    placeholder?: string
    required?: boolean
    default?: any
    default_value?: any
  }>
}

export interface InputJSONConfig {
  schema?: Record<string, any>
  editor_theme?: 'light' | 'dark'
}

export interface InputQueryConfig {
  query: string
  data_source?: string
}

export interface InputDocumentConfig {
  allowed_types?: string[]
  max_size_mb?: number
}

export interface InputAPIConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: Record<string, any>
}

export interface DecisionConditionalConfig {
  conditions: Array<{
    field: string
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
    value: any
    target_node_id: string
  }>
  default_node_id?: string
}

export interface DecisionLLMConfig {
  prompt: string
  model?: string
  options: Array<{
    label: string
    value: string
    target_node_id: string
  }>
}

export interface DecisionPatternConfig {
  patterns: Array<{
    regex: string
    target_node_id: string
  }>
  default_node_id?: string
}

export interface ActionLLMConfig {
  prompt: string
  model?: string
  temperature?: number
  max_tokens?: number
}

export interface ActionAgentConfig {
  agent_id: string
  input_variable?: string
  output_variable?: string
  timeout?: number
  include_context?: boolean
}

export interface ActionCapabilityConfig {
  capability_id: string
  parameters?: Record<string, any>
}

export interface ActionTransformConfig {
  transformation: 'map' | 'filter' | 'reduce' | 'custom'
  script?: string
}

export interface ActionLoopConfig {
  items_field: string
  body_node_id: string
  max_iterations?: number
}

export interface ActionDelayConfig {
  duration_ms: number
}

export interface OutputTextConfig {
  template?: string
}

export interface OutputJSONConfig {
  schema?: Record<string, any>
  format?: 'pretty' | 'compact'
}

export interface OutputAPIConfig {
  url: string
  method: 'POST' | 'PUT' | 'PATCH'
  headers?: Record<string, string>
  body_template?: Record<string, any>
}

// ============================================================================
// NEW Node Configuration Types
// ============================================================================

// Connector nodes
export interface ConnectorReadConfig {
  connector_type: 'pyairbyte' | 'custom'
  connector_id?: string
  connector_name?: string
  config?: Record<string, any>
  stream_names?: string[]
  credential_id?: string
}

export interface ConnectorWriteConfig {
  connector_type: 'pyairbyte' | 'custom'
  connector_id?: string
  endpoint?: string
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: Record<string, any>
  credential_id?: string
}

// Filesystem nodes
export interface FileReadConfig {
  file_path: string
  encoding?: 'utf-8' | 'ascii' | 'latin1'
}

export interface FileWriteConfig {
  file_path: string
  content: string
  mode?: 'write' | 'append'
  encoding?: 'utf-8' | 'ascii' | 'latin1'
  create_dirs?: boolean
}

export interface ShellExecConfig {
  command: string
  working_dir?: string
  timeout?: number
  capture_output?: boolean
}

// Git nodes
export interface GitCloneConfig {
  repo_url: string
  dest_path: string
  branch?: string
  depth?: number
  credentials?: {
    username?: string
    token?: string
  }
}

export interface GitCommitConfig {
  repo_path: string
  message: string
  files?: string[]
  author_name?: string
  author_email?: string
}

export interface GitPushConfig {
  repo_path: string
  remote?: string
  branch?: string
  credentials?: {
    username?: string
    token?: string
  }
}

// Code analysis nodes
export interface CodeTreeConfig {
  root_path: string
  max_depth?: number
  exclude_patterns?: string[]
  include_hidden?: boolean
}

export interface CodeSearchConfig {
  search_path: string
  pattern: string
  search_type?: 'regex' | 'literal' | 'fuzzy'
  file_pattern?: string
  case_sensitive?: boolean
  max_results?: number
}

// Testing nodes
export interface TestRunConfig {
  test_dir: string
  test_command: string
  framework?: 'pytest' | 'jest' | 'mocha' | 'junit' | 'custom'
  test_files?: string[]
  env_vars?: Record<string, string>
  timeout?: number
}

// MCP nodes
export interface MCPToolConfig {
  server_id: string
  tool_name: string
  arguments?: Record<string, any>
  timeout?: number
}

// Advanced agent nodes
export interface AgentIterativeConfig {
  task: string
  max_iterations?: number
  model?: string
  temperature?: number
  success_condition?: string
  include_context?: boolean
}

export interface AgentWithToolsConfig {
  agent_id: string
  task: string
  tool_ids?: string[]
  mcp_server_ids?: string[]
  capability_ids?: string[]
  allow_shell?: boolean
  max_tool_calls?: number
  timeout?: number
}

// Knowledge base nodes
export interface KnowledgeBaseSearchConfig {
  knowledge_base_id: string
  query_field: string
  vector_db_type?: 'chromadb' | 'pinecone' | 'weaviate' | 'qdrant'
  similarity_threshold?: number
  max_results?: number
  return_fields?: string[]
  include_metadata?: boolean
  include_scores?: boolean
  filter?: Record<string, any>
}

export interface KnowledgeBaseWriteConfig {
  knowledge_base_id: string
  content_field: string
  metadata?: Record<string, any>
  chunk_size?: number
  chunk_overlap?: number
  auto_embed?: boolean
}

// Error handling nodes
export interface ErrorHandlerConfig {
  error_types?: string[]
  fallback_node_id?: string
  retry_attempts?: number
  retry_delay_ms?: number
  log_errors?: boolean
}

export interface TryCatchConfig {
  try_node_id: string
  catch_node_id: string
  finally_node_id?: string
  retry_on_failure?: boolean
  max_retries?: number
}

// Human-in-the-loop nodes
export interface HumanApprovalConfig {
  approval_message: string
  approvers?: string[]
  approval_type?: 'any' | 'all' | 'majority'
  timeout_minutes?: number
  auto_approve_after_timeout?: boolean
  notification_channels?: string[]
}

export interface HumanReviewConfig {
  review_message: string
  reviewers?: string[]
  fields_to_review?: string[]
  allow_edit?: boolean
  require_comment?: boolean
  timeout_minutes?: number
}

// Audit and compliance nodes
export interface AuditLogConfig {
  event_type: string
  log_level?: 'info' | 'warning' | 'error' | 'critical'
  include_fields?: string[]
  exclude_fields?: string[]
  retention_days?: number
  compliance_standard?: 'HIPAA' | 'GDPR' | 'SOC2' | 'PCI-DSS' | 'custom'
}

export interface ComplianceCheckConfig {
  compliance_rules: Array<{
    rule_id: string
    rule_name: string
    check_type: 'field_present' | 'value_range' | 'pattern_match' | 'custom'
    field?: string
    condition?: any
    severity?: 'critical' | 'high' | 'medium' | 'low'
  }>
  fail_on_violation?: boolean
  generate_report?: boolean
}

// Notification nodes
export interface NotificationConfig {
  notification_type: 'email' | 'sms' | 'slack' | 'teams' | 'discord' | 'custom'
  recipients: string[]
  subject?: string
  message: string
  template?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  attachments?: string[]
}

export interface AlertConfig {
  alert_level: 'info' | 'warning' | 'error' | 'critical'
  alert_message: string
  channels: string[]
  condition?: string
  throttle_minutes?: number
  escalation_rules?: Array<{
    after_minutes: number
    escalate_to: string[]
  }>
}

export interface WebhookConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body_template?: Record<string, any>
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api_key'
    credentials?: Record<string, string>
  }
  retry_on_failure?: boolean
  timeout_ms?: number
}

// Data validation nodes
export interface DataValidationConfig {
  validation_rules: Array<{
    field: string
    rule_type: 'required' | 'type' | 'range' | 'pattern' | 'custom'
    value?: any
    error_message?: string
  }>
  fail_on_error?: boolean
  collect_all_errors?: boolean
}

export interface SchemaValidationConfig {
  schema: Record<string, any>
  schema_type?: 'json_schema' | 'yup' | 'zod' | 'custom'
  strict_mode?: boolean
  allow_unknown_fields?: boolean
}

// Parallel execution nodes
export interface ParallelConfig {
  branch_node_ids: string[]
  max_parallel?: number
  fail_fast?: boolean
  timeout_ms?: number
  collect_results?: boolean
}

export interface MergeConfig {
  merge_strategy: 'combine' | 'first' | 'last' | 'custom'
  combine_logic?: string
  output_field?: string
}

export interface JoinConfig {
  join_type: 'inner' | 'left' | 'right' | 'full'
  join_on?: string
  timeout_ms?: number
  wait_for_all?: boolean
}

// Cache nodes
export interface CacheReadConfig {
  cache_key: string
  cache_namespace?: string
  ttl_seconds?: number
  fallback_node_id?: string
}

export interface CacheWriteConfig {
  cache_key: string
  cache_value_field: string
  cache_namespace?: string
  ttl_seconds?: number
  overwrite?: boolean
}

export interface CacheInvalidateConfig {
  cache_key?: string
  cache_namespace?: string
  pattern?: string
  invalidate_all?: boolean
}

// Scheduling nodes
export interface ScheduleConfig {
  schedule_type: 'once' | 'interval' | 'daily' | 'weekly' | 'monthly'
  start_time?: string
  interval_minutes?: number
  timezone?: string
  enabled?: boolean
}

export interface TriggerConfig {
  trigger_type: 'webhook' | 'event' | 'condition' | 'manual'
  trigger_condition?: string
  event_name?: string
  webhook_path?: string
}

export interface CronConfig {
  cron_expression: string
  timezone?: string
  enabled?: boolean
  max_runs?: number
}

// Rate limiting node
export interface RateLimitConfig {
  max_requests: number
  time_window_seconds: number
  rate_limit_key?: string
  behavior?: 'reject' | 'queue' | 'delay'
  queue_size?: number
}

// ============================================================================
// Node Category & Metadata
// ============================================================================

export interface NodeCategory {
  id: string
  label: string
  icon: string
  color: string
  nodes: NodeMetadata[]
}

export interface NodeMetadata {
  type: NodeType
  label: string
  description: string
  icon: string
  color: string
  category: string
  defaultConfig: Record<string, any>
  configSchema: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'select' | 'json' | 'textarea'
    required?: boolean
    default?: any
    options?: Array<{ label: string; value: any }>
  }>
}

// ============================================================================
// React Flow Extended Types
// ============================================================================

export type FlowReactNode = Node<{
  label: string
  config: Record<string, any>
  nodeType: NodeType
  step_id?: number
}>

export type FlowReactEdge = Edge<{
  label?: string
  condition?: Record<string, any>
}>
