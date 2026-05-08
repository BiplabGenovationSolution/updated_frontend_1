// frontend/src/lib/constants.ts

// SOPHIA BACKEND API CONFIGURATION
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005'
export const DIRECT_BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005'

// Enhanced Agent Requirements Interface
export interface AgentRequirements {
  requiresKnowledgeBase?: boolean
  requiresBucket?: boolean  // NEW for Analytica
  requiresCodebase?: boolean  // NEW for Clavis
  supportsStreaming: boolean
  supportsFileUpload: boolean
  primaryTools: string[]
  capabilities: string[]
}

// Enhanced Agent Configuration Interface
export interface EnhancedAgentConfig {
  name: string
  description: string
  color: string
  variant: 'beam' | 'marble' | 'pixel' | 'sunset' | 'ring' | 'bauhaus'
  colors: string[]
  requirements: AgentRequirements
  buttonClass: string
  textGradient: string
  cardClass: string
  shadowClass: string
  borderClass: string
  hoverClass: string
  focusClass: string
  inputClass: string
  animationClass: string
  glowClass: string
}

export const AGENT_CONFIGS = {
  sophia: {
    name: 'Sophia',
    description: 'Creative AI companion for knowledge base queries and intelligent conversations',
    color: 'purple',
    variant: 'beam' as const,
    colors: ['#4a5568', '#667eea', '#5a67d8', '#7c3aed', '#a78bfa'],  // Deep slate to vibrant purple
    gradient: {
      from: '#667eea',
      to: '#7c3aed'
    },
    capabilities: ['knowledge_search', 'document_analysis', 'creative_writing'],
    icon: '🤖'
  },
  aegis: {
    name: 'Aegis',
    description: 'Advanced research assistant for comprehensive analysis and data processing',
    color: 'emerald',
    variant: 'marble' as const,
    colors: ['#2d4a3e', '#215a6d', '#3ca2a2', '#92c7a3', '#c8dfd0'],  // Deep forest to sage green
    gradient: {
      from: '#215a6d',
      to: '#3ca2a2'
    },
    capabilities: ['research', 'data_analysis', 'web_search', 'file_processing'],
    icon: '🛡️'
  },
  clavis: {
    name: 'Clavis',
    description: 'Code repository assistant for understanding and navigating codebases',
    color: 'cyan',
    variant: 'beam' as const,
    colors: ['#1e3a5f', '#2563eb', '#3b82f6', '#06b6d4', '#67e8f9'],  // Deep blue to bright cyan
    gradient: {
      from: '#2563eb',
      to: '#06b6d4'
    },
    capabilities: ['code_search', 'code_explanation', 'repository_analysis'],
    icon: '💻'
  },
  analytica: {
    name: 'Analytica',
    description: 'Data analysis assistant for statistical analysis and interactive visualizations',
    color: 'blue',
    variant: 'marble' as const,
    colors: ['#1e4d5b', '#2c7a7b', '#319795', '#4fd1c5', '#9ae6e1'],  // Deep teal to aqua
    gradient: {
      from: '#2c7a7b',
      to: '#4fd1c5'
    },
    capabilities: ['data_analysis', 'data_visualization', 'statistical_analysis', 'plotly_charts'],
    icon: '📊'
  }
} as const

// Agent Helper Functions
export const AGENT_HELPERS = {
  requiresKnowledgeBase: (agentType: string): boolean => {
    return AGENT_CONFIGS[agentType]?.requirements?.requiresKnowledgeBase || false
  },

  requiresBucket: (agentType: string): boolean => {
    return AGENT_CONFIGS[agentType]?.requirements?.requiresBucket || false
  },

  requiresCodebase: (agentType: string): boolean => {
    return AGENT_CONFIGS[agentType]?.requirements?.requiresCodebase || false
  },

  supportsStreaming: (agentType: string): boolean => {
    return AGENT_CONFIGS[agentType]?.requirements?.supportsStreaming || false
  },

  canUseWithoutKB: (agentType: string): boolean => {
    return !AGENT_CONFIGS[agentType]?.requirements?.requiresKnowledgeBase
  },

  getPrimaryTools: (agentType: string): string[] => {
    return AGENT_CONFIGS[agentType]?.requirements?.primaryTools || []
  },

  getCapabilities: (agentType: string): string[] => {
    return AGENT_CONFIGS[agentType]?.requirements?.capabilities || []
  },

  getAgentConfig: (agentType: string): EnhancedAgentConfig | null => {
    return AGENT_CONFIGS[agentType] || null
  }
} as const

// Pastel Theme Configuration
export const PASTEL_THEMES = {
  aegis: {
    name: 'Aegis',
    gradient: 'bg-gradient-aegis',
    gradientDiagonal: 'bg-gradient-aegis-diagonal',
    textGradient: 'text-gradient-aegis',
    pageBackground: 'bg-page-aegis',
    primary: '#A2D18C',
    secondary: '#60B194',
    tertiary: '#2FB8DE',
    description: 'Green to blue gradient for Aegis'
  },
  sophia: {
    name: 'Sophia',
    gradient: 'bg-gradient-sophia',
    gradientDiagonal: 'bg-gradient-sophia-diagonal',
    textGradient: 'text-gradient-sophia',
    pageBackground: 'bg-page-sophia',
    primary: '#eb8868',
    secondary: '#33b7df',
    description: 'Orange to blue gradient for Sophia'
  },
  coral_mint: {
    name: 'Coral & Mint',
    gradient: 'bg-gradient-coral-mint',
    gradientDiagonal: 'bg-gradient-coral-mint-diagonal',
    textGradient: 'text-gradient-coral',
    pageBackground: 'bg-page-coral',
    primary: '#fcb1a6',
    secondary: '#a8edea',
    description: 'Warm coral pink flowing to cool mint aqua'
  },
  lavender_citrus: {
    name: 'Lavender Citrus',
    gradient: 'bg-gradient-lavender-citrus',
    gradientDiagonal: 'bg-gradient-lavender-citrus-diagonal',
    textGradient: 'text-gradient-lavender',
    pageBackground: 'bg-page-lavender',
    primary: '#eac7ff',
    secondary: '#ffe9c7',
    description: 'Soft lavender to creamy citrus'
  },
  peach_frost: {
    name: 'Peach Frost',
    gradient: 'bg-gradient-peach-frost',
    gradientDiagonal: 'bg-gradient-peach-frost-diagonal',
    textGradient: 'text-gradient-peach',
    pageBackground: 'bg-page-peach',
    primary: '#ffd6c0',
    secondary: '#c0e8ff',
    description: 'Warm peach to frosted sky blue'
  },
  blush_lagoon: {
    name: 'Blush Lagoon',
    gradient: 'bg-gradient-blush-lagoon',
    gradientDiagonal: 'bg-gradient-blush-lagoon-diagonal',
    textGradient: 'text-gradient-blush',
    pageBackground: 'bg-page-blush',
    primary: '#fddde6',
    secondary: '#d0f4f7',
    description: 'Pale blush to light lagoon'
  },
  apricot_breeze: {
    name: 'Apricot Breeze',
    gradient: 'bg-gradient-apricot-breeze',
    primary: '#ffe0b5',
    secondary: '#b5e3ff',
    description: 'Apricot to breezy blue'
  },
  soft_sunset: {
    name: 'Soft Sunset',
    gradient: 'bg-gradient-soft-sunset',
    primary: '#ffd3b6',
    secondary: '#c2f0fc',
    description: 'Warm peach to soft aqua'
  },
  cotton_cloud: {
    name: 'Cotton Cloud',
    gradient: 'bg-gradient-cotton-cloud',
    primary: '#fde2ff',
    secondary: '#d0fcf7',
    description: 'Light lavender pink to misty mint'
  },
  petal_sky: {
    name: 'Petal & Sky',
    gradient: 'bg-gradient-petal-sky',
    primary: '#f6c1c7',
    secondary: '#c1e3f6',
    description: 'Petal pink to baby sky blue'
  }
} as const

// Enhanced Tools Configuration
export const TOOLS = {
  research: {
    name: 'Research',
    subtools: {
      quick: 'Fast research with limited sources',
      standard: 'Balanced research approach',
      comprehensive: 'In-depth research with multiple dimensions',
      market_analysis: 'Focused on market data and trends',
      competitive_analysis: 'Competitor analysis',
      technical_review: 'Technical specification analysis',
    },
  },
  chat: {
    name: 'Chat',
    subtools: {
      default: 'Standard conversational AI',
      creative: 'Creative writing and ideation',
      analytical: 'Data analysis and logical reasoning',
      conversational: 'Casual conversation',
    },
  },
  sophia: {
    name: 'Sophia Knowledge Assistant',
    description: 'Query your knowledge bases with intelligent context',
    requirements: ['knowledge_base_selection'],
    subtools: {
      default: 'Standard knowledge base query with sources',
      detailed: 'Comprehensive response with extensive sources and context',
      quick: 'Brief answers with key sources',
      analytical: 'Deep analysis of knowledge base content',
      comparative: 'Compare information across multiple documents'
    },
  },
} as const

export const AEGIS_CHAT_TOOLS = {
  wise: { name: '💙 Wise', description: 'Thoughtful and insightful' },
  creative: { name: '🎨 Creative', description: 'Imaginative and innovative' },
  analytical: { name: '📊 Analytical', description: 'Data-driven and logical' },
  supportive: { name: '💝 Supportive', description: 'Empathetic and encouraging' },
  quirky: { name: '🎭 Quirky', description: 'Fun and unconventional' },
  professional: { name: '💼 Professional', description: 'Formal and business-focused' },
  energetic: { name: '⚡ Energetic', description: 'Dynamic and enthusiastic' },
  calm: { name: '🧘 Calm', description: 'Peaceful and centered' }
} as const

// Enhanced Tools (backward compatibility + new features)
export const ENHANCED_TOOLS = {
  ...TOOLS,
  sophia: {
    name: 'Sophia Knowledge Assistant',
    description: 'Query your knowledge bases with intelligent context',
    requirements: ['knowledge_base_selection'],
    subtools: {
      default: 'Standard knowledge base query with sources',
      detailed: 'Comprehensive response with extensive sources and context',
      quick: 'Brief answers with key sources',
      analytical: 'Deep analysis of knowledge base content',
      comparative: 'Compare information across multiple documents'
    },
  },
} as const

// SOPHIA BACKEND: Enhanced file types configuration
export const FILE_TYPES = {
  documents: ['pdf', 'docx', 'doc', 'txt', 'md', 'rtf'],
  spreadsheets: ['xlsx', 'xls', 'csv'],
  presentations: ['pptx', 'ppt'],
  code: ['py', 'js', 'json', 'xml', 'html', 'css'],
  ebooks: ['epub'],
  richtext: ['rtf'],
} as const

// SOPHIA BACKEND: File size limits per tier
export const FILE_SIZE_LIMITS = {
  free: 5 * 1024 * 1024, // 5MB
  basic: 20 * 1024 * 1024, // 20MB
  professional: 50 * 1024 * 1024, // 50MB
  enterprise: 100 * 1024 * 1024, // 100MB
} as const

// SOPHIA BACKEND: Supported MIME types for validation
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/json',
  'text/javascript',
  'text/html',
  'text/css',
  'application/x-python',
  'application/rtf',
  'application/epub+zip'
] as const

// Rate limiting configuration
export const RATE_LIMITS = {
  standard: 60, // requests per minute
  upload: 10,
  research: 10,
  admin: 20,
} as const

export const PAGINATION_DEFAULTS = {
  limit: 20,
  offset: 0,
  maxLimit: 100,
} as const

export const RESEARCH_STAGES = {
  starting: 'Initializing research session',
  searching: 'Searching for relevant information',
  processing: 'Processing and analyzing data',
  completed: 'Research completed successfully',
  error: 'An error occurred during research',
} as const

// SOPHIA BACKEND: Enhanced timeout configurations
export const TIMEOUT_CONFIGS = {
  standard: 30000, // 30 seconds for regular operations
  research: 3600000, // 1 hour for research operations (Aegis)
  upload: 300000, // 5 minutes for file uploads to Sophia
  download: 600000, // 10 minutes for downloads
  knowledgeBase: 120000, // 2 minutes for KB operations
  document: 180000, // 3 minutes for document operations
  sophia: 60000, // 1 minute for Sophia queries
} as const

// SOPHIA BACKEND: API endpoint patterns that require extended timeouts
export const RESEARCH_ENDPOINTS = [
  '/chats/*/messages',
  '/agents/aegis/chat',
  '/agents/aegis/research',
  '/agents/aegis/research/stream',
] as const

// SOPHIA BACKEND: Endpoints that should use the research client (extended timeout)
export const EXTENDED_TIMEOUT_PATTERNS = [
  '/agents/aegis/chat',
  '/agents/aegis/research',
  '/agents/aegis/upload',
  '/research',
] as const

// Pastel Color Palette for UI Elements
export const UI_COLORS = {
  status: {
    online: 'bg-gradient-to-r from-emerald-300 to-teal-300',
    away: 'bg-gradient-to-r from-amber-300 to-orange-300',
    offline: 'bg-gray-300',
    busy: 'bg-gradient-to-r from-rose-300 to-pink-300',
  },
  badges: {
    research: 'bg-gradient-coral-mint text-gray-700',
    knowledge: 'bg-gradient-lavender-citrus text-gray-700',
    chat: 'bg-gradient-peach-frost text-gray-700',
    premium: 'bg-gradient-cotton-cloud text-gray-700',
    aegis: 'bg-gradient-aegis text-white',
    sophia: 'bg-gradient-sophia text-white',
  },
  alerts: {
    success: 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-300',
    warning: 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300',
    error: 'bg-gradient-to-r from-rose-100 to-pink-100 border-rose-300',
    info: 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300',
  },
  progress: {
    background: 'bg-gray-100',
    fill: 'bg-gradient-aegis',
    text: 'text-white',
  }
} as const

// SOPHIA BACKEND: Enhanced local storage keys
export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'mentis_auth_token',
  USER_PREFERENCES: 'mentis_user_preferences',
  THEME: 'mentis_theme',
  LAST_SELECTED_KB: 'mentis_last_kb',
  SELECTED_PASTEL_THEME: 'mentis_pastel_theme',
  SOPHIA_LAST_KB: 'mentis_sophia_last_kb',
  ANALYTICA_LAST_BUCKET: 'mentis_analytica_last_bucket',
  CLAVIS_LAST_CODEBASE: 'mentis_clavis_last_codebase',
  KB_CACHE: 'mentis_kb_cache',
  DOCUMENT_CACHE: 'mentis_doc_cache',
} as const

// Animation configurations for different contexts
export const ANIMATIONS = {
  page_transitions: {
    duration: '300ms',
    easing: 'ease-out',
  },
  button_hover: {
    duration: '200ms',
    easing: 'ease',
    transform: 'translateY(-1px)',
  },
  card_hover: {
    duration: '200ms',
    easing: 'ease',
    transform: 'scale(1.02)',
  },
  modal_appear: {
    duration: '250ms',
    easing: 'ease-out',
  },
  loading_pulse: {
    duration: '2s',
    iteration: 'infinite',
  },
  knowledge_base_selection: {
    duration: '300ms',
    easing: 'ease-in-out',
  }
} as const

// Typography scale for consistent text sizing
export const TYPOGRAPHY = {
  hero: 'text-4xl font-bold tracking-tight',
  heading_1: 'text-3xl font-semibold tracking-tight',
  heading_2: 'text-2xl font-semibold tracking-tight',
  heading_3: 'text-xl font-semibold',
  heading_4: 'text-lg font-semibold',
  body_large: 'text-lg',
  body: 'text-base',
  body_small: 'text-sm',
  caption: 'text-xs',
  button: 'text-sm font-medium',
  label: 'text-sm font-medium',
} as const

// SOPHIA BACKEND: Enhanced Knowledge Base Configuration
export const KNOWLEDGE_BASE_CONFIG = {
  search: {
    debounce_delay: 300,
    min_query_length: 2,
    max_results: 50,
  },
  selection: {
    modal_animation_duration: 300,
    auto_select_delay: 1000,
  },
  validation: {
    min_name_length: 3,
    max_name_length: 100,
    max_description_length: 500,
  },
  display: {
    truncate_description_length: 120,
    documents_per_page: 20,
  },
  creation: {
    default_chunk_size: 1000,
    default_chunk_overlap: 200,
    default_embedding_model: 'beautyyuyanli/multilingual-e5-large',
    min_chunk_size: 100,
    max_chunk_size: 4000,
    max_chunk_overlap_ratio: 0.5,
  },
  embedding_models: [
    {
      value: 'beautyyuyanli/multilingual-e5-large',
      name: 'E5 Large (Recommended)',
      description: 'Multilingual, high accuracy'
    },
    {
      value: 'text-embedding-3-small',
      name: 'OpenAI Small',
      description: 'Fast and efficient'
    },
    {
      value: 'text-embedding-3-large',
      name: 'OpenAI Large',
      description: 'Higher accuracy, slower'
    },
    {
      value: 'text-embedding-ada-002',
      name: 'Ada-002 (Legacy)',
      description: 'Older model, compatible'
    }
  ]
} as const

// SOPHIA BACKEND: Sophia Specific Configuration
export const SOPHIA_CONFIG = {
  response_format: {
    include_sources: true,
    max_sources: 5,
    include_excerpts: true,
    excerpt_length: 200,
  },
  ui: {
    theme_colors: ['#8b5cf6', '#a855f7', '#9333ea', '#7c3aed', '#6366f1'],
    gradient_stops: ['from-purple-600', 'via-violet-600', 'to-blue-600'],
    selection_indicator_color: '#8b5cf6',
  },
  requirements: {
    knowledge_base_required: true,
    show_selection_modal_on_agent_switch: true,
    persist_selection: true,
  },
  api: {
    endpoints: {
      create_kb: '/knowledgebase/create',
      list_kbs: '/knowledgebase/',
      get_kb: '/knowledgebase/{id}',
      delete_kb: '/knowledgebase/{id}',
      upload_document: '/knowledgebase/{id}/documents/upload',
      list_documents: '/knowledgebase/{id}/documents',
      delete_document: '/knowledgebase/{id}/documents/{doc_id}',
      chat: '/sophia/chat',
      query: '/sophia/query',
      health: '/sophia/health'
    },
    default_params: {
      include_sources: true,
      max_sources: 5,
      temperature: 0.7,
      context_window: 4000,
    }
  }
} as const

// Aegis Specific Configuration1
export const AEGIS_CONFIG = {
  research_modes: {
    quick: {
      max_sources: 5,
      depth: 'shallow',
      estimated_time: '2-5 minutes'
    },
    standard: {
      max_sources: 10,
      depth: 'medium',
      estimated_time: '5-10 minutes'
    },
    comprehensive: {
      max_sources: 20,
      depth: 'deep',
      estimated_time: '10-30 minutes'
    }
  },
  streaming: {
    chunk_size: 1024,
    buffer_size: 4096,
    reconnect_attempts: 3,
    heartbeat_interval: 30000,
  },
  ui: {
    theme_colors: ['#A2D18C', '#60B194', '#2FB8DE', '#7BC4A4', '#4FBAD3'],
    gradient_stops: ['from-emerald-400', 'via-teal-500', 'to-cyan-500'],
  }
} as const

// NEW: Analytica Specific Configuration
export const ANALYTICA_CONFIG = {
  api: {
    endpoints: {
      chat: '/analytica/chat',
      buckets: '/analytica/buckets',
      create_bucket: '/analytica/buckets',
      delete_bucket: '/analytica/buckets/{id}',
    },
    default_params: {
      context_chunks: 8,
      temperature: 0.7,
    }
  },
  ui: {
    theme_colors: ['#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9'],
    gradient_stops: ['from-blue-500', 'via-purple-500', 'to-pink-500'],
  },
  requirements: {
    bucket_required: true,
    show_selection_modal_on_agent_switch: true,
    persist_selection: true,
  }
} as const

// NEW: Clavis Specific Configuration
export const CLAVIS_CONFIG = {
  api: {
    endpoints: {
      chat: '/clavis/chat',
      codebases: '/clavis/codebases',
      create_codebase: '/clavis/codebases',
      delete_codebase: '/clavis/codebases/{id}',
    },
    default_params: {
      mode: 'chat',
      context_chunks: 8,
      temperature: 0.7,
    }
  },
  ui: {
    theme_colors: ['#34d399', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'],
    gradient_stops: ['from-emerald-500', 'via-teal-500', 'to-cyan-600'],
  },
  requirements: {
    codebase_required: true,
    show_selection_modal_on_agent_switch: true,
    persist_selection: true,
  }
} as const

// SOPHIA BACKEND: Document processing status mappings
export const DOCUMENT_STATUS = {
  pending: { label: 'Pending', color: 'yellow', description: 'Waiting to be processed' },
  processing: { label: 'Processing', color: 'blue', description: 'Currently being processed' },
  completed: { label: 'Ready', color: 'green', description: 'Ready for Sophia queries' },
  active: { label: 'Active', color: 'green', description: 'Active and searchable' },
  failed: { label: 'Failed', color: 'red', description: 'Processing failed' },
  error: { label: 'Error', color: 'red', description: 'An error occurred' },
} as const

// SOPHIA BACKEND: Cache configurations
export const CACHE_CONFIG = {
  knowledge_bases: {
    ttl: 300000, // 5 minutes
    key: 'knowledgeBases',
    max_age: 600000, // 10 minutes
  },
  documents: {
    ttl: 120000, // 2 minutes
    key: 'documents',
    max_age: 300000, // 5 minutes
  },
  user: {
    ttl: 600000, // 10 minutes
    key: 'user',
    max_age: 1200000, // 20 minutes
  },
  sophia_responses: {
    ttl: 180000, // 3 minutes
    key: 'sophia',
    max_age: 600000, // 10 minutes
  }
} as const

// SOPHIA BACKEND: Query configurations
export const QUERY_CONFIG = {
  retry: {
    attempts: 3,
    delay: 1000,
    backoff_multiplier: 2,
  },
  stale_time: {
    knowledge_bases: 300000, // 5 minutes
    documents: 120000, // 2 minutes
    user: 600000, // 10 minutes
  },
  cache_time: {
    knowledge_bases: 600000, // 10 minutes
    documents: 300000, // 5 minutes
    user: 1200000, // 20 minutes
  }
} as const

// Agent Type Definitions for TypeScript
export type AgentType = 'sophia' | 'aegis' | 'analytica' | 'clavis' | 'custom'
export type ToolType = keyof typeof TOOLS
export type SubtoolType = string
export type ThemeType = keyof typeof PASTEL_THEMES

// Export utility functions for agent management
export const getAgentRequirement = (agentType: AgentType, requirement: keyof AgentRequirements): boolean | string[] => {
  return AGENT_CONFIGS[agentType]?.requirements?.[requirement] || false
}

export const isKnowledgeBaseRequired = (agentType: AgentType): boolean => {
  return AGENT_HELPERS.requiresKnowledgeBase(agentType)
}

export const isBucketRequired = (agentType: AgentType): boolean => {
  return AGENT_HELPERS.requiresBucket(agentType)
}

export const isCodebaseRequired = (agentType: AgentType): boolean => {
  return AGENT_HELPERS.requiresCodebase(agentType)
}

export const getAgentCapabilities = (agentType: AgentType): string[] => {
  return AGENT_HELPERS.getCapabilities(agentType)
}

export const getAgentPrimaryTools = (agentType: AgentType): string[] => {
  return AGENT_HELPERS.getPrimaryTools(agentType)
}

// SOPHIA BACKEND: Validation helpers
export const validateKnowledgeBaseName = (name: string): { valid: boolean; error?: string } => {
  const config = KNOWLEDGE_BASE_CONFIG.validation

  if (!name.trim()) {
    return { valid: false, error: 'Name is required' }
  }

  if (name.trim().length < config.min_name_length) {
    return { valid: false, error: `Name must be at least ${config.min_name_length} characters` }
  }

  if (name.trim().length > config.max_name_length) {
    return { valid: false, error: `Name must be less than ${config.max_name_length} characters` }
  }

  return { valid: true }
}

export const validateKnowledgeBaseDescription = (description: string): { valid: boolean; error?: string } => {
  const config = KNOWLEDGE_BASE_CONFIG.validation

  if (description && description.length > config.max_description_length) {
    return { valid: false, error: `Description must be less than ${config.max_description_length} characters` }
  }

  return { valid: true }
}

export const validateChunkSettings = (chunkSize: number, chunkOverlap: number): { valid: boolean; error?: string } => {
  const config = KNOWLEDGE_BASE_CONFIG.creation

  if (chunkSize < config.min_chunk_size || chunkSize > config.max_chunk_size) {
    return { valid: false, error: `Chunk size must be between ${config.min_chunk_size} and ${config.max_chunk_size}` }
  }

  if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    return { valid: false, error: 'Chunk overlap must be less than chunk size' }
  }

  if (chunkOverlap > chunkSize * config.max_chunk_overlap_ratio) {
    return { valid: false, error: `Chunk overlap should not exceed ${config.max_chunk_overlap_ratio * 100}% of chunk size` }
  }

  return { valid: true }
}

// SOPHIA BACKEND: File validation helpers
export const isValidFileSize = (size: number, tier: keyof typeof FILE_SIZE_LIMITS = 'professional'): boolean => {
  return size <= FILE_SIZE_LIMITS[tier]
}

export const isValidMimeType = (mimeType: string): boolean => {
  return SUPPORTED_MIME_TYPES.includes(mimeType as any)
}

export const getFileExtension = (filename: string): string | null => {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || null : null
}

export const isValidFileExtension = (filename: string): boolean => {
  const extension = getFileExtension(filename)
  if (!extension) return false

  return Object.values(FILE_TYPES).flat().includes(extension as any)
}

// SOPHIA BACKEND: Error code mappings
export const ERROR_CODES = {
  KNOWLEDGE_BASE_NOT_FOUND: 'KB_NOT_FOUND',
  DOCUMENT_NOT_FOUND: 'DOC_NOT_FOUND',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  BUCKET_NOT_FOUND: 'BUCKET_NOT_FOUND',
  CODEBASE_NOT_FOUND: 'CODEBASE_NOT_FOUND',
} as const

// SOPHIA BACKEND: Success message templates
export const SUCCESS_MESSAGES = {
  KB_CREATED: 'Knowledge base created successfully with Sophia',
  KB_DELETED: 'Knowledge base deleted from Sophia',
  DOC_UPLOADED: 'Document uploaded to Sophia successfully',
  DOC_DELETED: 'Document removed from Sophia',
  PROCESSING_STARTED: 'Document processing started with Sophia',
  PROCESSING_COMPLETED: 'Document ready for Sophia queries',
  BUCKET_CREATED: 'Data bucket created successfully for Analytica',
  BUCKET_DELETED: 'Data bucket deleted from Analytica',
  CODEBASE_CREATED: 'Codebase indexed successfully for Clavis',
  CODEBASE_DELETED: 'Codebase removed from Clavis',
} as const