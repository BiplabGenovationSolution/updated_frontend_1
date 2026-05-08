/**
 * Agent Flow Builder Constants
 * Node definitions, categories, and metadata
 */

import {
  FileText,
  Search,
  FileUp,
  Globe,
  GitBranch,
  Sparkles,
  Filter,
  Zap,
  Wrench,
  RefreshCw,
  Repeat,
  Clock,
  FileOutput,
  Code,
  Send,
  Database,
  FolderOpen,
  FileEdit,
  Terminal,
  GitCommit,
  Upload,
  FolderTree,
  SearchCode,
  FlaskConical,
  Bot,
  Layers,
  AlertTriangle,
  Shield,
  UserCheck,
  ClipboardCheck,
  Bell,
  Webhook,
  CheckCircle,
  GitMerge,
  Shuffle,
  HardDrive,
  Calendar,
  Gauge,
  FileSignature,
  AlertOctagon,
  Mail,
  Zap as Lightning
} from 'lucide-react'
import { NodeType } from './flow-types'
import type { NodeCategory, NodeMetadata } from './flow-types'

// ============================================================================
// Node Colors
// ============================================================================

export const NODE_COLORS = {
  input: '#3b82f6',      // blue
  decision: '#f59e0b',   // amber
  action: '#8b5cf6',     // violet
  output: '#10b981',     // emerald
  connector: '#06b6d4',  // cyan
  filesystem: '#a855f7', // purple
  git: '#f97316',        // orange
  code: '#14b8a6',       // teal
  testing: '#ef4444',    // red
  mcp: '#6366f1',        // indigo
  knowledge: '#d946ef',  // fuchsia
  agent: '#ec4899',      // pink
  error: '#dc2626',      // red-600
  human: '#0891b2',      // cyan-600
  audit: '#16a34a',      // green-600
  notification: '#ea580c', // orange-600
  validation: '#9333ea', // purple-600
  flow: '#4f46e5',       // indigo-600
  cache: '#0d9488',      // teal-600
  schedule: '#7c3aed'    // violet-600
}

// ============================================================================
// Node Metadata Definitions
// ============================================================================

export const NODE_METADATA: Record<NodeType, NodeMetadata> = {
  // Input Nodes
  [NodeType.INPUT_TEXT]: {
    type: NodeType.INPUT_TEXT,
    label: 'Text Input',
    description: 'Accept text input from the user',
    icon: 'FileText',
    color: NODE_COLORS.input,
    category: 'input',
    defaultConfig: {
      prompt: 'Enter your input',
      placeholder: 'Type here...',
      multiline: false
    },
    configSchema: [
      {
        key: 'prompt',
        label: 'Prompt',
        type: 'text',
        required: false,
        default: 'Enter your input'
      },
      {
        key: 'placeholder',
        label: 'Placeholder',
        type: 'text',
        required: false,
        default: 'Type here...'
      },
      {
        key: 'multiline',
        label: 'Multiline',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.INPUT_FORM]: {
    type: NodeType.INPUT_FORM,
    label: 'Form Input',
    description: 'Structured form with multiple fields',
    icon: 'FileText',
    color: NODE_COLORS.input,
    category: 'input',
    defaultConfig: {
      fields: []
    },
    configSchema: [
      {
        key: 'fields',
        label: 'Form Fields (JSON)',
        type: 'json',
        required: true,
        default: []
      }
    ]
  },

  [NodeType.INPUT_JSON]: {
    type: NodeType.INPUT_JSON,
    label: 'JSON Input',
    description: 'Accept raw JSON data input',
    icon: 'Code',
    color: NODE_COLORS.input,
    category: 'input',
    defaultConfig: {
      schema: {},
      editor_theme: 'dark'
    },
    configSchema: [
      {
        key: 'schema',
        label: 'JSON Schema (optional)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'editor_theme',
        label: 'Editor Theme',
        type: 'select',
        required: false,
        default: 'dark',
        options: [
          { label: 'Dark', value: 'dark' },
          { label: 'Light', value: 'light' }
        ]
      }
    ]
  },

  [NodeType.INPUT_QUERY]: {
    type: NodeType.INPUT_QUERY,
    label: 'Query Input',
    description: 'Execute a database or search query',
    icon: 'Search',
    color: NODE_COLORS.input,
    category: 'input',
    defaultConfig: {
      query: '',
      data_source: ''
    },
    configSchema: [
      {
        key: 'query',
        label: 'Query',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'data_source',
        label: 'Data Source',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.INPUT_DOCUMENT]: {
    type: NodeType.INPUT_DOCUMENT,
    label: 'Document Input',
    description: 'Upload and process documents',
    icon: 'FileUp',
    color: NODE_COLORS.input,
    category: 'input',
    defaultConfig: {
      allowed_types: ['pdf', 'txt', 'docx'],
      max_size_mb: 10
    },
    configSchema: [
      {
        key: 'allowed_types',
        label: 'Allowed Types (comma-separated)',
        type: 'text',
        required: false,
        default: 'pdf,txt,docx'
      },
      {
        key: 'max_size_mb',
        label: 'Max Size (MB)',
        type: 'number',
        required: false,
        default: 10
      }
    ]
  },

  [NodeType.INPUT_API]: {
    type: NodeType.INPUT_API,
    label: 'API Input',
    description: 'Fetch data from an external API',
    icon: 'Globe',
    color: NODE_COLORS.input,
    category: 'input',
    defaultConfig: {
      url: '',
      method: 'GET',
      headers: {},
      body: {}
    },
    configSchema: [
      {
        key: 'url',
        label: 'API URL',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        default: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        key: 'headers',
        label: 'Headers (JSON)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'body',
        label: 'Request Body (JSON)',
        type: 'json',
        required: false,
        default: {}
      }
    ]
  },

  // Decision Nodes
  [NodeType.DECISION_CONDITIONAL]: {
    type: NodeType.DECISION_CONDITIONAL,
    label: 'Conditional',
    description: 'Branch based on conditions',
    icon: 'GitBranch',
    color: NODE_COLORS.decision,
    category: 'decision',
    defaultConfig: {
      conditions: [],
      default_node_id: ''
    },
    configSchema: [
      {
        key: 'conditions',
        label: 'Conditions (JSON Array)',
        type: 'json',
        required: true,
        default: []
      },
      {
        key: 'default_node_id',
        label: 'Default Target Node ID',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.DECISION_LLM]: {
    type: NodeType.DECISION_LLM,
    label: 'LLM Decision',
    description: 'Use AI to make a decision',
    icon: 'Sparkles',
    color: NODE_COLORS.decision,
    category: 'decision',
    defaultConfig: {
      prompt: '',
      model: 'gpt-4',
      options: []
    },
    configSchema: [
      {
        key: 'prompt',
        label: 'Decision Prompt',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        required: false,
        default: 'gpt-4',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'Claude', value: 'claude' }
        ]
      },
      {
        key: 'options',
        label: 'Decision Options (JSON Array)',
        type: 'json',
        required: true,
        default: []
      }
    ]
  },

  [NodeType.DECISION_PATTERN]: {
    type: NodeType.DECISION_PATTERN,
    label: 'Pattern Match',
    description: 'Branch based on regex patterns',
    icon: 'Filter',
    color: NODE_COLORS.decision,
    category: 'decision',
    defaultConfig: {
      patterns: [],
      default_node_id: ''
    },
    configSchema: [
      {
        key: 'patterns',
        label: 'Patterns (JSON Array)',
        type: 'json',
        required: true,
        default: []
      },
      {
        key: 'default_node_id',
        label: 'Default Target Node ID',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  // Action Nodes
  [NodeType.ACTION_LLM]: {
    type: NodeType.ACTION_LLM,
    label: 'LLM Action',
    description: 'Process with an LLM',
    icon: 'Zap',
    color: NODE_COLORS.action,
    category: 'action',
    defaultConfig: {
      prompt: '',
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000
    },
    configSchema: [
      {
        key: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        required: false,
        default: 'gpt-4',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'Claude', value: 'claude' }
        ]
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'number',
        required: false,
        default: 0.7
      },
      {
        key: 'max_tokens',
        label: 'Max Tokens',
        type: 'number',
        required: false,
        default: 2000
      }
    ]
  },

  [NodeType.ACTION_AGENT]: {
    type: NodeType.ACTION_AGENT,
    label: 'Invoke Agent',
    description: 'Call another custom agent',
    icon: 'Sparkles',
    color: NODE_COLORS.action,
    category: 'action',
    defaultConfig: {
      agent_id: '',
      input_variable: 'input',
      output_variable: 'agent_output',
      timeout: 120,
      include_context: false
    },
    configSchema: [
      {
        key: 'agent_id',
        label: 'Agent ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'input_variable',
        label: 'Input Variable',
        type: 'text',
        required: false,
        default: 'input'
      },
      {
        key: 'output_variable',
        label: 'Output Variable',
        type: 'text',
        required: false,
        default: 'agent_output'
      },
      {
        key: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        required: false,
        default: 120
      },
      {
        key: 'include_context',
        label: 'Include Flow Context',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.ACTION_CAPABILITY]: {
    type: NodeType.ACTION_CAPABILITY,
    label: 'Capability',
    description: 'Execute a custom capability',
    icon: 'Wrench',
    color: NODE_COLORS.action,
    category: 'action',
    defaultConfig: {
      capability_id: '',
      parameters: {}
    },
    configSchema: [
      {
        key: 'capability_id',
        label: 'Capability ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'parameters',
        label: 'Parameters (JSON)',
        type: 'json',
        required: false,
        default: {}
      }
    ]
  },

  [NodeType.ACTION_TRANSFORM]: {
    type: NodeType.ACTION_TRANSFORM,
    label: 'Transform',
    description: 'Transform data',
    icon: 'RefreshCw',
    color: NODE_COLORS.action,
    category: 'action',
    defaultConfig: {
      transformation: 'map',
      script: ''
    },
    configSchema: [
      {
        key: 'transformation',
        label: 'Transformation Type',
        type: 'select',
        required: true,
        default: 'map',
        options: [
          { label: 'Map', value: 'map' },
          { label: 'Filter', value: 'filter' },
          { label: 'Reduce', value: 'reduce' },
          { label: 'Custom', value: 'custom' }
        ]
      },
      {
        key: 'script',
        label: 'Script',
        type: 'textarea',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.ACTION_LOOP]: {
    type: NodeType.ACTION_LOOP,
    label: 'Loop',
    description: 'Iterate over items',
    icon: 'Repeat',
    color: NODE_COLORS.action,
    category: 'action',
    defaultConfig: {
      items_field: '',
      body_node_id: '',
      max_iterations: 100
    },
    configSchema: [
      {
        key: 'items_field',
        label: 'Items Field Name',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'body_node_id',
        label: 'Loop Body Node ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'max_iterations',
        label: 'Max Iterations',
        type: 'number',
        required: false,
        default: 100
      }
    ]
  },

  [NodeType.ACTION_DELAY]: {
    type: NodeType.ACTION_DELAY,
    label: 'Delay',
    description: 'Wait for a specified time',
    icon: 'Clock',
    color: NODE_COLORS.action,
    category: 'action',
    defaultConfig: {
      duration_ms: 1000
    },
    configSchema: [
      {
        key: 'duration_ms',
        label: 'Duration (milliseconds)',
        type: 'number',
        required: true,
        default: 1000
      }
    ]
  },

  // Output Nodes
  [NodeType.OUTPUT_TEXT]: {
    type: NodeType.OUTPUT_TEXT,
    label: 'Text Output',
    description: 'Display text output',
    icon: 'FileOutput',
    color: NODE_COLORS.output,
    category: 'output',
    defaultConfig: {
      template: ''
    },
    configSchema: [
      {
        key: 'template',
        label: 'Output Template',
        type: 'textarea',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.OUTPUT_JSON]: {
    type: NodeType.OUTPUT_JSON,
    label: 'JSON Output',
    description: 'Output structured JSON',
    icon: 'Code',
    color: NODE_COLORS.output,
    category: 'output',
    defaultConfig: {
      schema: {},
      format: 'pretty'
    },
    configSchema: [
      {
        key: 'schema',
        label: 'JSON Schema',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'format',
        label: 'Format',
        type: 'select',
        required: false,
        default: 'pretty',
        options: [
          { label: 'Pretty', value: 'pretty' },
          { label: 'Compact', value: 'compact' }
        ]
      }
    ]
  },

  [NodeType.OUTPUT_API]: {
    type: NodeType.OUTPUT_API,
    label: 'API Output',
    description: 'Send data to an external API',
    icon: 'Send',
    color: NODE_COLORS.output,
    category: 'output',
    defaultConfig: {
      url: '',
      method: 'POST',
      headers: {},
      body_template: {}
    },
    configSchema: [
      {
        key: 'url',
        label: 'API URL',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        default: 'POST',
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' }
        ]
      },
      {
        key: 'headers',
        label: 'Headers (JSON)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'body_template',
        label: 'Body Template (JSON)',
        type: 'json',
        required: false,
        default: {}
      }
    ]
  },

  // ===== NEW NODE TYPES =====

  // Connector Nodes
  [NodeType.CONNECTOR_READ]: {
    type: NodeType.CONNECTOR_READ,
    label: 'Read Connector',
    description: 'Pull data from 600+ sources (PyAirbyte)',
    icon: 'Database',
    color: NODE_COLORS.connector,
    category: 'connector',
    defaultConfig: {
      connector_type: 'pyairbyte',
      connector_name: '',
      config: {},
      credential_id: ''
    },
    configSchema: [
      {
        key: 'connector_type',
        label: 'Connector Type',
        type: 'select',
        required: true,
        default: 'pyairbyte',
        options: [
          { label: 'PyAirbyte', value: 'pyairbyte' },
          { label: 'Custom', value: 'custom' }
        ]
      },
      {
        key: 'connector_name',
        label: 'Connector Name',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'config',
        label: 'Configuration (JSON)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'credential_id',
        label: 'Credential ID',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.CONNECTOR_WRITE]: {
    type: NodeType.CONNECTOR_WRITE,
    label: 'Write Connector',
    description: 'Send data to external systems',
    icon: 'Database',
    color: NODE_COLORS.connector,
    category: 'connector',
    defaultConfig: {
      connector_type: 'custom',
      connector_id: '',
      endpoint: '',
      method: 'POST',
      data: {}
    },
    configSchema: [
      {
        key: 'connector_type',
        label: 'Connector Type',
        type: 'select',
        required: true,
        default: 'custom',
        options: [
          { label: 'Custom', value: 'custom' }
        ]
      },
      {
        key: 'connector_id',
        label: 'Connector ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'endpoint',
        label: 'Endpoint',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        default: 'POST',
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        key: 'data',
        label: 'Data (JSON)',
        type: 'json',
        required: false,
        default: {}
      }
    ]
  },

  // Filesystem Nodes
  [NodeType.FILE_READ]: {
    type: NodeType.FILE_READ,
    label: 'Read File',
    description: 'Read file from filesystem',
    icon: 'FolderOpen',
    color: NODE_COLORS.filesystem,
    category: 'filesystem',
    defaultConfig: {
      file_path: '',
      encoding: 'utf-8'
    },
    configSchema: [
      {
        key: 'file_path',
        label: 'File Path',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'encoding',
        label: 'Encoding',
        type: 'select',
        required: false,
        default: 'utf-8',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'ASCII', value: 'ascii' },
          { label: 'Latin-1', value: 'latin1' }
        ]
      }
    ]
  },

  [NodeType.FILE_WRITE]: {
    type: NodeType.FILE_WRITE,
    label: 'Write File',
    description: 'Write file to filesystem',
    icon: 'FileEdit',
    color: NODE_COLORS.filesystem,
    category: 'filesystem',
    defaultConfig: {
      file_path: '',
      content: '',
      mode: 'write',
      create_dirs: true
    },
    configSchema: [
      {
        key: 'file_path',
        label: 'File Path',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'content',
        label: 'Content',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        required: false,
        default: 'write',
        options: [
          { label: 'Write', value: 'write' },
          { label: 'Append', value: 'append' }
        ]
      },
      {
        key: 'create_dirs',
        label: 'Create Directories',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.SHELL_EXEC]: {
    type: NodeType.SHELL_EXEC,
    label: 'Shell Command',
    description: 'Execute shell command',
    icon: 'Terminal',
    color: NODE_COLORS.filesystem,
    category: 'filesystem',
    defaultConfig: {
      command: '',
      working_dir: '',
      timeout: 60,
      capture_output: true
    },
    configSchema: [
      {
        key: 'command',
        label: 'Command',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'working_dir',
        label: 'Working Directory',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        required: false,
        default: 60
      },
      {
        key: 'capture_output',
        label: 'Capture Output',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  // Git Nodes
  [NodeType.GIT_CLONE]: {
    type: NodeType.GIT_CLONE,
    label: 'Git Clone',
    description: 'Clone git repository',
    icon: 'GitBranch',
    color: NODE_COLORS.git,
    category: 'git',
    defaultConfig: {
      repo_url: '',
      dest_path: '',
      branch: 'main',
      depth: 1
    },
    configSchema: [
      {
        key: 'repo_url',
        label: 'Repository URL',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'dest_path',
        label: 'Destination Path',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'branch',
        label: 'Branch',
        type: 'text',
        required: false,
        default: 'main'
      },
      {
        key: 'depth',
        label: 'Depth (shallow clone)',
        type: 'number',
        required: false,
        default: 1
      }
    ]
  },

  [NodeType.GIT_COMMIT]: {
    type: NodeType.GIT_COMMIT,
    label: 'Git Commit',
    description: 'Commit changes to repository',
    icon: 'GitCommit',
    color: NODE_COLORS.git,
    category: 'git',
    defaultConfig: {
      repo_path: '',
      message: '',
      author_name: '',
      author_email: ''
    },
    configSchema: [
      {
        key: 'repo_path',
        label: 'Repository Path',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'message',
        label: 'Commit Message',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'author_name',
        label: 'Author Name',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'author_email',
        label: 'Author Email',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.GIT_PUSH]: {
    type: NodeType.GIT_PUSH,
    label: 'Git Push',
    description: 'Push commits to remote',
    icon: 'Upload',
    color: NODE_COLORS.git,
    category: 'git',
    defaultConfig: {
      repo_path: '',
      remote: 'origin',
      branch: 'main'
    },
    configSchema: [
      {
        key: 'repo_path',
        label: 'Repository Path',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'remote',
        label: 'Remote Name',
        type: 'text',
        required: false,
        default: 'origin'
      },
      {
        key: 'branch',
        label: 'Branch',
        type: 'text',
        required: false,
        default: 'main'
      }
    ]
  },

  // Code Analysis Nodes
  [NodeType.CODE_TREE]: {
    type: NodeType.CODE_TREE,
    label: 'Code Tree',
    description: 'Generate codebase file tree',
    icon: 'FolderTree',
    color: NODE_COLORS.code,
    category: 'code',
    defaultConfig: {
      root_path: '',
      max_depth: 10,
      exclude_patterns: ['node_modules', '.git', '__pycache__'],
      include_hidden: false
    },
    configSchema: [
      {
        key: 'root_path',
        label: 'Root Path',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'max_depth',
        label: 'Max Depth',
        type: 'number',
        required: false,
        default: 10
      },
      {
        key: 'exclude_patterns',
        label: 'Exclude Patterns (comma-separated)',
        type: 'text',
        required: false,
        default: 'node_modules,.git,__pycache__'
      },
      {
        key: 'include_hidden',
        label: 'Include Hidden Files',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.CODE_SEARCH]: {
    type: NodeType.CODE_SEARCH,
    label: 'Code Search',
    description: 'Search code with patterns',
    icon: 'SearchCode',
    color: NODE_COLORS.code,
    category: 'code',
    defaultConfig: {
      search_path: '',
      pattern: '',
      search_type: 'regex',
      case_sensitive: false,
      max_results: 100
    },
    configSchema: [
      {
        key: 'search_path',
        label: 'Search Path',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'pattern',
        label: 'Search Pattern',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'search_type',
        label: 'Search Type',
        type: 'select',
        required: false,
        default: 'regex',
        options: [
          { label: 'Regex', value: 'regex' },
          { label: 'Literal', value: 'literal' },
          { label: 'Fuzzy', value: 'fuzzy' }
        ]
      },
      {
        key: 'case_sensitive',
        label: 'Case Sensitive',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'max_results',
        label: 'Max Results',
        type: 'number',
        required: false,
        default: 100
      }
    ]
  },

  // Testing Nodes
  [NodeType.TEST_RUN]: {
    type: NodeType.TEST_RUN,
    label: 'Run Tests',
    description: 'Execute test suite',
    icon: 'FlaskConical',
    color: NODE_COLORS.testing,
    category: 'testing',
    defaultConfig: {
      test_dir: '',
      test_command: 'pytest',
      framework: 'pytest',
      timeout: 300
    },
    configSchema: [
      {
        key: 'test_dir',
        label: 'Test Directory',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'test_command',
        label: 'Test Command',
        type: 'text',
        required: true,
        default: 'pytest'
      },
      {
        key: 'framework',
        label: 'Test Framework',
        type: 'select',
        required: false,
        default: 'pytest',
        options: [
          { label: 'pytest', value: 'pytest' },
          { label: 'jest', value: 'jest' },
          { label: 'mocha', value: 'mocha' },
          { label: 'junit', value: 'junit' },
          { label: 'custom', value: 'custom' }
        ]
      },
      {
        key: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        required: false,
        default: 300
      }
    ]
  },

  // MCP Nodes
  [NodeType.MCP_TOOL]: {
    type: NodeType.MCP_TOOL,
    label: 'MCP Tool',
    description: 'Execute MCP tool',
    icon: 'Wrench',
    color: NODE_COLORS.mcp,
    category: 'mcp',
    defaultConfig: {
      server_id: '',
      tool_name: '',
      arguments: {},
      timeout: 60
    },
    configSchema: [
      {
        key: 'server_id',
        label: 'MCP Server ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'tool_name',
        label: 'Tool Name',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'arguments',
        label: 'Arguments (JSON)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        required: false,
        default: 60
      }
    ]
  },

  // Knowledge Base Nodes
  [NodeType.KNOWLEDGE_BASE_SEARCH]: {
    type: NodeType.KNOWLEDGE_BASE_SEARCH,
    label: 'Knowledge Base Search',
    description: 'Search vector database for similar content',
    icon: 'Database',
    color: NODE_COLORS.knowledge,
    category: 'knowledge',
    defaultConfig: {
      knowledge_base_id: '',
      query_field: 'input',
      vector_db_type: 'chromadb',
      similarity_threshold: 0.7,
      max_results: 5,
      return_fields: [],
      include_metadata: true,
      include_scores: true,
      filter: {}
    },
    configSchema: [
      {
        key: 'knowledge_base_id',
        label: 'Knowledge Base ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'query_field',
        label: 'Query Field',
        type: 'text',
        required: true,
        default: 'input'
      },
      {
        key: 'vector_db_type',
        label: 'Vector DB Type',
        type: 'select',
        required: false,
        default: 'chromadb',
        options: [
          { label: 'ChromaDB', value: 'chromadb' },
          { label: 'Pinecone', value: 'pinecone' },
          { label: 'Weaviate', value: 'weaviate' },
          { label: 'Qdrant', value: 'qdrant' }
        ]
      },
      {
        key: 'similarity_threshold',
        label: 'Similarity Threshold',
        type: 'number',
        required: false,
        default: 0.7
      },
      {
        key: 'max_results',
        label: 'Max Results',
        type: 'number',
        required: false,
        default: 5
      },
      {
        key: 'return_fields',
        label: 'Return Fields (comma-separated)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'include_metadata',
        label: 'Include Metadata',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'include_scores',
        label: 'Include Similarity Scores',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'filter',
        label: 'Filter (JSON)',
        type: 'json',
        required: false,
        default: {}
      }
    ]
  },

  [NodeType.KNOWLEDGE_BASE_WRITE]: {
    type: NodeType.KNOWLEDGE_BASE_WRITE,
    label: 'Knowledge Base Write',
    description: 'Add documents to knowledge base',
    icon: 'Database',
    color: NODE_COLORS.knowledge,
    category: 'knowledge',
    defaultConfig: {
      knowledge_base_id: '',
      content_field: 'content',
      metadata: {},
      chunk_size: 1500,
      chunk_overlap: 200,
      auto_embed: true
    },
    configSchema: [
      {
        key: 'knowledge_base_id',
        label: 'Knowledge Base ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'content_field',
        label: 'Content Field',
        type: 'text',
        required: true,
        default: 'content'
      },
      {
        key: 'chunk_size',
        label: 'Chunk Size',
        type: 'number',
        required: false,
        default: 1500
      },
      {
        key: 'chunk_overlap',
        label: 'Chunk Overlap',
        type: 'number',
        required: false,
        default: 200
      },
      {
        key: 'metadata',
        label: 'Metadata (JSON)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'auto_embed',
        label: 'Auto Embed',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  // Error Handling Nodes
  [NodeType.ERROR_HANDLER]: {
    type: NodeType.ERROR_HANDLER,
    label: 'Error Handler',
    description: 'Handle errors with retry and fallback',
    icon: 'AlertTriangle',
    color: NODE_COLORS.error,
    category: 'error',
    defaultConfig: {
      error_types: [],
      fallback_node_id: '',
      retry_attempts: 3,
      retry_delay_ms: 1000,
      log_errors: true
    },
    configSchema: [
      {
        key: 'error_types',
        label: 'Error Types (comma-separated)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'fallback_node_id',
        label: 'Fallback Node ID',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'retry_attempts',
        label: 'Retry Attempts',
        type: 'number',
        required: false,
        default: 3
      },
      {
        key: 'retry_delay_ms',
        label: 'Retry Delay (ms)',
        type: 'number',
        required: false,
        default: 1000
      },
      {
        key: 'log_errors',
        label: 'Log Errors',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.TRY_CATCH]: {
    type: NodeType.TRY_CATCH,
    label: 'Try-Catch',
    description: 'Try-catch-finally error handling',
    icon: 'Shield',
    color: NODE_COLORS.error,
    category: 'error',
    defaultConfig: {
      try_node_id: '',
      catch_node_id: '',
      finally_node_id: '',
      retry_on_failure: false,
      max_retries: 0
    },
    configSchema: [
      {
        key: 'try_node_id',
        label: 'Try Node ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'catch_node_id',
        label: 'Catch Node ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'finally_node_id',
        label: 'Finally Node ID',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'retry_on_failure',
        label: 'Retry on Failure',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'max_retries',
        label: 'Max Retries',
        type: 'number',
        required: false,
        default: 0
      }
    ]
  },

  // Advanced Agent Nodes
  [NodeType.AGENT_ITERATIVE]: {
    type: NodeType.AGENT_ITERATIVE,
    label: 'Iterative Agent',
    description: 'Agent that loops until task complete',
    icon: 'Bot',
    color: NODE_COLORS.agent,
    category: 'agent',
    defaultConfig: {
      task: '',
      max_iterations: 10,
      model: 'gpt-4',
      temperature: 0.7,
      success_condition: ''
    },
    configSchema: [
      {
        key: 'task',
        label: 'Task Description',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'max_iterations',
        label: 'Max Iterations',
        type: 'number',
        required: false,
        default: 10
      },
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        required: false,
        default: 'gpt-4',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'Claude', value: 'claude' }
        ]
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'number',
        required: false,
        default: 0.7
      },
      {
        key: 'success_condition',
        label: 'Success Condition',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.AGENT_WITH_TOOLS]: {
    type: NodeType.AGENT_WITH_TOOLS,
    label: 'Agent with Tools',
    description: 'Agent with access to tools and capabilities',
    icon: 'Layers',
    color: NODE_COLORS.agent,
    category: 'agent',
    defaultConfig: {
      agent_id: '',
      task: '',
      allow_shell: false,
      max_tool_calls: 10,
      timeout: 300
    },
    configSchema: [
      {
        key: 'agent_id',
        label: 'Agent ID',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'task',
        label: 'Task Description',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'allow_shell',
        label: 'Allow Shell Commands',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'max_tool_calls',
        label: 'Max Tool Calls',
        type: 'number',
        required: false,
        default: 10
      },
      {
        key: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        required: false,
        default: 300
      }
    ]
  },

  // Human-in-the-Loop Nodes
  [NodeType.HUMAN_APPROVAL]: {
    type: NodeType.HUMAN_APPROVAL,
    label: 'Human Approval',
    description: 'Require human approval before continuing',
    icon: 'UserCheck',
    color: NODE_COLORS.human,
    category: 'human',
    defaultConfig: {
      approval_message: 'Please review and approve',
      approvers: [],
      approval_type: 'any',
      timeout_minutes: 60,
      auto_approve_after_timeout: false,
      notification_channels: []
    },
    configSchema: [
      {
        key: 'approval_message',
        label: 'Approval Message',
        type: 'textarea',
        required: true,
        default: 'Please review and approve'
      },
      {
        key: 'approvers',
        label: 'Approvers (comma-separated emails)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'approval_type',
        label: 'Approval Type',
        type: 'select',
        required: false,
        default: 'any',
        options: [
          { label: 'Any Approver', value: 'any' },
          { label: 'All Approvers', value: 'all' },
          { label: 'Majority', value: 'majority' }
        ]
      },
      {
        key: 'timeout_minutes',
        label: 'Timeout (minutes)',
        type: 'number',
        required: false,
        default: 60
      },
      {
        key: 'auto_approve_after_timeout',
        label: 'Auto-approve After Timeout',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.HUMAN_REVIEW]: {
    type: NodeType.HUMAN_REVIEW,
    label: 'Human Review',
    description: 'Allow human to review and edit data',
    icon: 'ClipboardCheck',
    color: NODE_COLORS.human,
    category: 'human',
    defaultConfig: {
      review_message: 'Please review the following data',
      reviewers: [],
      fields_to_review: [],
      allow_edit: true,
      require_comment: false,
      timeout_minutes: 60
    },
    configSchema: [
      {
        key: 'review_message',
        label: 'Review Message',
        type: 'textarea',
        required: true,
        default: 'Please review the following data'
      },
      {
        key: 'reviewers',
        label: 'Reviewers (comma-separated emails)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'fields_to_review',
        label: 'Fields to Review (comma-separated)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'allow_edit',
        label: 'Allow Edit',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'require_comment',
        label: 'Require Comment',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'timeout_minutes',
        label: 'Timeout (minutes)',
        type: 'number',
        required: false,
        default: 60
      }
    ]
  },

  // Audit and Compliance Nodes
  [NodeType.AUDIT_LOG]: {
    type: NodeType.AUDIT_LOG,
    label: 'Audit Log',
    description: 'Log events for compliance and auditing',
    icon: 'FileSignature',
    color: NODE_COLORS.audit,
    category: 'audit',
    defaultConfig: {
      event_type: '',
      log_level: 'info',
      include_fields: [],
      exclude_fields: [],
      retention_days: 365,
      compliance_standard: 'custom'
    },
    configSchema: [
      {
        key: 'event_type',
        label: 'Event Type',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'log_level',
        label: 'Log Level',
        type: 'select',
        required: false,
        default: 'info',
        options: [
          { label: 'Info', value: 'info' },
          { label: 'Warning', value: 'warning' },
          { label: 'Error', value: 'error' },
          { label: 'Critical', value: 'critical' }
        ]
      },
      {
        key: 'include_fields',
        label: 'Include Fields (comma-separated)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'exclude_fields',
        label: 'Exclude Fields (comma-separated)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'retention_days',
        label: 'Retention Days',
        type: 'number',
        required: false,
        default: 365
      },
      {
        key: 'compliance_standard',
        label: 'Compliance Standard',
        type: 'select',
        required: false,
        default: 'custom',
        options: [
          { label: 'HIPAA', value: 'HIPAA' },
          { label: 'GDPR', value: 'GDPR' },
          { label: 'SOC2', value: 'SOC2' },
          { label: 'PCI-DSS', value: 'PCI-DSS' },
          { label: 'Custom', value: 'custom' }
        ]
      }
    ]
  },

  [NodeType.COMPLIANCE_CHECK]: {
    type: NodeType.COMPLIANCE_CHECK,
    label: 'Compliance Check',
    description: 'Validate compliance with rules and regulations',
    icon: 'Shield',
    color: NODE_COLORS.audit,
    category: 'audit',
    defaultConfig: {
      compliance_rules: [],
      fail_on_violation: true,
      generate_report: true
    },
    configSchema: [
      {
        key: 'compliance_rules',
        label: 'Compliance Rules (JSON)',
        type: 'json',
        required: true,
        default: []
      },
      {
        key: 'fail_on_violation',
        label: 'Fail on Violation',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'generate_report',
        label: 'Generate Report',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  // Notification Nodes
  [NodeType.NOTIFICATION]: {
    type: NodeType.NOTIFICATION,
    label: 'Send Notification',
    description: 'Send notifications via email, Slack, SMS, etc.',
    icon: 'Bell',
    color: NODE_COLORS.notification,
    category: 'notification',
    defaultConfig: {
      notification_type: 'email',
      recipients: [],
      subject: '',
      message: '',
      template: '',
      priority: 'normal',
      attachments: []
    },
    configSchema: [
      {
        key: 'notification_type',
        label: 'Notification Type',
        type: 'select',
        required: true,
        default: 'email',
        options: [
          { label: 'Email', value: 'email' },
          { label: 'SMS', value: 'sms' },
          { label: 'Slack', value: 'slack' },
          { label: 'Teams', value: 'teams' },
          { label: 'Discord', value: 'discord' }
        ]
      },
      {
        key: 'recipients',
        label: 'Recipients (comma-separated)',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'subject',
        label: 'Subject',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'message',
        label: 'Message',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        required: false,
        default: 'normal',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' }
        ]
      }
    ]
  },

  [NodeType.ALERT]: {
    type: NodeType.ALERT,
    label: 'Send Alert',
    description: 'Send critical alerts with escalation',
    icon: 'AlertOctagon',
    color: NODE_COLORS.notification,
    category: 'notification',
    defaultConfig: {
      alert_level: 'warning',
      alert_message: '',
      channels: [],
      condition: '',
      throttle_minutes: 5,
      escalation_rules: []
    },
    configSchema: [
      {
        key: 'alert_level',
        label: 'Alert Level',
        type: 'select',
        required: true,
        default: 'warning',
        options: [
          { label: 'Info', value: 'info' },
          { label: 'Warning', value: 'warning' },
          { label: 'Error', value: 'error' },
          { label: 'Critical', value: 'critical' }
        ]
      },
      {
        key: 'alert_message',
        label: 'Alert Message',
        type: 'textarea',
        required: true,
        default: ''
      },
      {
        key: 'channels',
        label: 'Channels (comma-separated)',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'throttle_minutes',
        label: 'Throttle (minutes)',
        type: 'number',
        required: false,
        default: 5
      },
      {
        key: 'escalation_rules',
        label: 'Escalation Rules (JSON)',
        type: 'json',
        required: false,
        default: []
      }
    ]
  },

  [NodeType.WEBHOOK]: {
    type: NodeType.WEBHOOK,
    label: 'Webhook',
    description: 'Send data to external webhooks',
    icon: 'Webhook',
    color: NODE_COLORS.notification,
    category: 'notification',
    defaultConfig: {
      url: '',
      method: 'POST',
      headers: {},
      body_template: {},
      authentication: { type: 'none' },
      retry_on_failure: true,
      timeout_ms: 30000
    },
    configSchema: [
      {
        key: 'url',
        label: 'Webhook URL',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        default: 'POST',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        key: 'headers',
        label: 'Headers (JSON)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'body_template',
        label: 'Body Template (JSON)',
        type: 'json',
        required: false,
        default: {}
      },
      {
        key: 'timeout_ms',
        label: 'Timeout (ms)',
        type: 'number',
        required: false,
        default: 30000
      },
      {
        key: 'retry_on_failure',
        label: 'Retry on Failure',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  // Data Validation Nodes
  [NodeType.DATA_VALIDATION]: {
    type: NodeType.DATA_VALIDATION,
    label: 'Data Validation',
    description: 'Validate data against rules',
    icon: 'CheckCircle',
    color: NODE_COLORS.validation,
    category: 'validation',
    defaultConfig: {
      validation_rules: [],
      fail_on_error: true,
      collect_all_errors: true
    },
    configSchema: [
      {
        key: 'validation_rules',
        label: 'Validation Rules (JSON)',
        type: 'json',
        required: true,
        default: []
      },
      {
        key: 'fail_on_error',
        label: 'Fail on Error',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'collect_all_errors',
        label: 'Collect All Errors',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.SCHEMA_VALIDATION]: {
    type: NodeType.SCHEMA_VALIDATION,
    label: 'Schema Validation',
    description: 'Validate data against a schema',
    icon: 'FileSignature',
    color: NODE_COLORS.validation,
    category: 'validation',
    defaultConfig: {
      schema: {},
      schema_type: 'json_schema',
      strict_mode: true,
      allow_unknown_fields: false
    },
    configSchema: [
      {
        key: 'schema',
        label: 'Schema (JSON)',
        type: 'json',
        required: true,
        default: {}
      },
      {
        key: 'schema_type',
        label: 'Schema Type',
        type: 'select',
        required: false,
        default: 'json_schema',
        options: [
          { label: 'JSON Schema', value: 'json_schema' },
          { label: 'Yup', value: 'yup' },
          { label: 'Zod', value: 'zod' },
          { label: 'Custom', value: 'custom' }
        ]
      },
      {
        key: 'strict_mode',
        label: 'Strict Mode',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'allow_unknown_fields',
        label: 'Allow Unknown Fields',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  // Parallel Execution Nodes
  [NodeType.PARALLEL]: {
    type: NodeType.PARALLEL,
    label: 'Parallel Execution',
    description: 'Execute multiple branches in parallel',
    icon: 'Shuffle',
    color: NODE_COLORS.flow,
    category: 'flow',
    defaultConfig: {
      branch_node_ids: [],
      max_parallel: 10,
      fail_fast: false,
      timeout_ms: 60000,
      collect_results: true
    },
    configSchema: [
      {
        key: 'branch_node_ids',
        label: 'Branch Node IDs (comma-separated)',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'max_parallel',
        label: 'Max Parallel',
        type: 'number',
        required: false,
        default: 10
      },
      {
        key: 'fail_fast',
        label: 'Fail Fast',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'timeout_ms',
        label: 'Timeout (ms)',
        type: 'number',
        required: false,
        default: 60000
      },
      {
        key: 'collect_results',
        label: 'Collect Results',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.MERGE]: {
    type: NodeType.MERGE,
    label: 'Merge Results',
    description: 'Merge results from parallel branches',
    icon: 'GitMerge',
    color: NODE_COLORS.flow,
    category: 'flow',
    defaultConfig: {
      merge_strategy: 'combine',
      combine_logic: '',
      output_field: 'merged_result'
    },
    configSchema: [
      {
        key: 'merge_strategy',
        label: 'Merge Strategy',
        type: 'select',
        required: true,
        default: 'combine',
        options: [
          { label: 'Combine', value: 'combine' },
          { label: 'First', value: 'first' },
          { label: 'Last', value: 'last' },
          { label: 'Custom', value: 'custom' }
        ]
      },
      {
        key: 'combine_logic',
        label: 'Custom Combine Logic',
        type: 'textarea',
        required: false,
        default: ''
      },
      {
        key: 'output_field',
        label: 'Output Field',
        type: 'text',
        required: false,
        default: 'merged_result'
      }
    ]
  },

  [NodeType.JOIN]: {
    type: NodeType.JOIN,
    label: 'Join Data',
    description: 'Join data from multiple sources',
    icon: 'GitMerge',
    color: NODE_COLORS.flow,
    category: 'flow',
    defaultConfig: {
      join_type: 'inner',
      join_on: '',
      timeout_ms: 60000,
      wait_for_all: true
    },
    configSchema: [
      {
        key: 'join_type',
        label: 'Join Type',
        type: 'select',
        required: true,
        default: 'inner',
        options: [
          { label: 'Inner', value: 'inner' },
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
          { label: 'Full', value: 'full' }
        ]
      },
      {
        key: 'join_on',
        label: 'Join On Field',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'timeout_ms',
        label: 'Timeout (ms)',
        type: 'number',
        required: false,
        default: 60000
      },
      {
        key: 'wait_for_all',
        label: 'Wait for All',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  // Cache Nodes
  [NodeType.CACHE_READ]: {
    type: NodeType.CACHE_READ,
    label: 'Read from Cache',
    description: 'Read data from cache',
    icon: 'HardDrive',
    color: NODE_COLORS.cache,
    category: 'cache',
    defaultConfig: {
      cache_key: '',
      cache_namespace: 'default',
      ttl_seconds: 3600,
      fallback_node_id: ''
    },
    configSchema: [
      {
        key: 'cache_key',
        label: 'Cache Key',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'cache_namespace',
        label: 'Cache Namespace',
        type: 'text',
        required: false,
        default: 'default'
      },
      {
        key: 'ttl_seconds',
        label: 'TTL (seconds)',
        type: 'number',
        required: false,
        default: 3600
      },
      {
        key: 'fallback_node_id',
        label: 'Fallback Node ID',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.CACHE_WRITE]: {
    type: NodeType.CACHE_WRITE,
    label: 'Write to Cache',
    description: 'Write data to cache',
    icon: 'HardDrive',
    color: NODE_COLORS.cache,
    category: 'cache',
    defaultConfig: {
      cache_key: '',
      cache_value_field: 'result',
      cache_namespace: 'default',
      ttl_seconds: 3600,
      overwrite: true
    },
    configSchema: [
      {
        key: 'cache_key',
        label: 'Cache Key',
        type: 'text',
        required: true,
        default: ''
      },
      {
        key: 'cache_value_field',
        label: 'Cache Value Field',
        type: 'text',
        required: true,
        default: 'result'
      },
      {
        key: 'cache_namespace',
        label: 'Cache Namespace',
        type: 'text',
        required: false,
        default: 'default'
      },
      {
        key: 'ttl_seconds',
        label: 'TTL (seconds)',
        type: 'number',
        required: false,
        default: 3600
      },
      {
        key: 'overwrite',
        label: 'Overwrite Existing',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.CACHE_INVALIDATE]: {
    type: NodeType.CACHE_INVALIDATE,
    label: 'Invalidate Cache',
    description: 'Invalidate cache entries',
    icon: 'HardDrive',
    color: NODE_COLORS.cache,
    category: 'cache',
    defaultConfig: {
      cache_key: '',
      cache_namespace: 'default',
      pattern: '',
      invalidate_all: false
    },
    configSchema: [
      {
        key: 'cache_key',
        label: 'Cache Key',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'cache_namespace',
        label: 'Cache Namespace',
        type: 'text',
        required: false,
        default: 'default'
      },
      {
        key: 'pattern',
        label: 'Pattern (regex)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'invalidate_all',
        label: 'Invalidate All',
        type: 'select',
        required: false,
        default: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  // Scheduling Nodes
  [NodeType.SCHEDULE]: {
    type: NodeType.SCHEDULE,
    label: 'Schedule',
    description: 'Schedule flow execution',
    icon: 'Calendar',
    color: NODE_COLORS.schedule,
    category: 'schedule',
    defaultConfig: {
      schedule_type: 'interval',
      start_time: '',
      interval_minutes: 60,
      timezone: 'UTC',
      enabled: true
    },
    configSchema: [
      {
        key: 'schedule_type',
        label: 'Schedule Type',
        type: 'select',
        required: true,
        default: 'interval',
        options: [
          { label: 'Once', value: 'once' },
          { label: 'Interval', value: 'interval' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' }
        ]
      },
      {
        key: 'start_time',
        label: 'Start Time (ISO 8601)',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'interval_minutes',
        label: 'Interval (minutes)',
        type: 'number',
        required: false,
        default: 60
      },
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'text',
        required: false,
        default: 'UTC'
      },
      {
        key: 'enabled',
        label: 'Enabled',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ]
  },

  [NodeType.TRIGGER]: {
    type: NodeType.TRIGGER,
    label: 'Trigger',
    description: 'Trigger flow based on events',
    icon: 'Zap',
    color: NODE_COLORS.schedule,
    category: 'schedule',
    defaultConfig: {
      trigger_type: 'webhook',
      trigger_condition: '',
      event_name: '',
      webhook_path: ''
    },
    configSchema: [
      {
        key: 'trigger_type',
        label: 'Trigger Type',
        type: 'select',
        required: true,
        default: 'webhook',
        options: [
          { label: 'Webhook', value: 'webhook' },
          { label: 'Event', value: 'event' },
          { label: 'Condition', value: 'condition' },
          { label: 'Manual', value: 'manual' }
        ]
      },
      {
        key: 'trigger_condition',
        label: 'Trigger Condition',
        type: 'textarea',
        required: false,
        default: ''
      },
      {
        key: 'event_name',
        label: 'Event Name',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'webhook_path',
        label: 'Webhook Path',
        type: 'text',
        required: false,
        default: ''
      }
    ]
  },

  [NodeType.CRON]: {
    type: NodeType.CRON,
    label: 'Cron Schedule',
    description: 'Schedule using cron expressions',
    icon: 'Clock',
    color: NODE_COLORS.schedule,
    category: 'schedule',
    defaultConfig: {
      cron_expression: '0 * * * *',
      timezone: 'UTC',
      enabled: true,
      max_runs: 0
    },
    configSchema: [
      {
        key: 'cron_expression',
        label: 'Cron Expression',
        type: 'text',
        required: true,
        default: '0 * * * *'
      },
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'text',
        required: false,
        default: 'UTC'
      },
      {
        key: 'enabled',
        label: 'Enabled',
        type: 'select',
        required: false,
        default: true,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'max_runs',
        label: 'Max Runs (0 = unlimited)',
        type: 'number',
        required: false,
        default: 0
      }
    ]
  },

  // Rate Limiting Node
  [NodeType.RATE_LIMIT]: {
    type: NodeType.RATE_LIMIT,
    label: 'Rate Limit',
    description: 'Limit execution rate',
    icon: 'Gauge',
    color: NODE_COLORS.flow,
    category: 'flow',
    defaultConfig: {
      max_requests: 100,
      time_window_seconds: 60,
      rate_limit_key: '',
      behavior: 'reject',
      queue_size: 100
    },
    configSchema: [
      {
        key: 'max_requests',
        label: 'Max Requests',
        type: 'number',
        required: true,
        default: 100
      },
      {
        key: 'time_window_seconds',
        label: 'Time Window (seconds)',
        type: 'number',
        required: true,
        default: 60
      },
      {
        key: 'rate_limit_key',
        label: 'Rate Limit Key',
        type: 'text',
        required: false,
        default: ''
      },
      {
        key: 'behavior',
        label: 'Behavior',
        type: 'select',
        required: false,
        default: 'reject',
        options: [
          { label: 'Reject', value: 'reject' },
          { label: 'Queue', value: 'queue' },
          { label: 'Delay', value: 'delay' }
        ]
      },
      {
        key: 'queue_size',
        label: 'Queue Size',
        type: 'number',
        required: false,
        default: 100
      }
    ]
  }
}

// ============================================================================
// Node Categories
// ============================================================================

export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'input',
    label: 'Input',
    icon: 'FileText',
    color: NODE_COLORS.input,
    nodes: [
      NODE_METADATA[NodeType.INPUT_TEXT],
      NODE_METADATA[NodeType.INPUT_FORM],
      NODE_METADATA[NodeType.INPUT_JSON],
      NODE_METADATA[NodeType.INPUT_QUERY],
      NODE_METADATA[NodeType.INPUT_DOCUMENT],
      NODE_METADATA[NodeType.INPUT_API]
    ]
  },
  {
    id: 'decision',
    label: 'Decision',
    icon: 'GitBranch',
    color: NODE_COLORS.decision,
    nodes: [
      NODE_METADATA[NodeType.DECISION_CONDITIONAL],
      NODE_METADATA[NodeType.DECISION_LLM],
      NODE_METADATA[NodeType.DECISION_PATTERN]
    ]
  },
  {
    id: 'action',
    label: 'Action',
    icon: 'Zap',
    color: NODE_COLORS.action,
    nodes: [
      NODE_METADATA[NodeType.ACTION_LLM],
      NODE_METADATA[NodeType.ACTION_AGENT],
      NODE_METADATA[NodeType.ACTION_CAPABILITY],
      NODE_METADATA[NodeType.ACTION_TRANSFORM],
      NODE_METADATA[NodeType.ACTION_LOOP],
      NODE_METADATA[NodeType.ACTION_DELAY]
    ]
  },
  {
    id: 'output',
    label: 'Output',
    icon: 'FileOutput',
    color: NODE_COLORS.output,
    nodes: [
      NODE_METADATA[NodeType.OUTPUT_TEXT],
      NODE_METADATA[NodeType.OUTPUT_JSON],
      NODE_METADATA[NodeType.OUTPUT_API]
    ]
  },
  {
    id: 'connector',
    label: 'Connectors',
    icon: 'Database',
    color: NODE_COLORS.connector,
    nodes: [
      NODE_METADATA[NodeType.CONNECTOR_READ],
      NODE_METADATA[NodeType.CONNECTOR_WRITE]
    ]
  },
  {
    id: 'filesystem',
    label: 'Filesystem',
    icon: 'FolderOpen',
    color: NODE_COLORS.filesystem,
    nodes: [
      NODE_METADATA[NodeType.FILE_READ],
      NODE_METADATA[NodeType.FILE_WRITE],
      NODE_METADATA[NodeType.SHELL_EXEC]
    ]
  },
  {
    id: 'git',
    label: 'Git',
    icon: 'GitBranch',
    color: NODE_COLORS.git,
    nodes: [
      NODE_METADATA[NodeType.GIT_CLONE],
      NODE_METADATA[NodeType.GIT_COMMIT],
      NODE_METADATA[NodeType.GIT_PUSH]
    ]
  },
  {
    id: 'code',
    label: 'Code Analysis',
    icon: 'SearchCode',
    color: NODE_COLORS.code,
    nodes: [
      NODE_METADATA[NodeType.CODE_TREE],
      NODE_METADATA[NodeType.CODE_SEARCH]
    ]
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: 'FlaskConical',
    color: NODE_COLORS.testing,
    nodes: [
      NODE_METADATA[NodeType.TEST_RUN]
    ]
  },
  {
    id: 'mcp',
    label: 'MCP',
    icon: 'Wrench',
    color: NODE_COLORS.mcp,
    nodes: [
      NODE_METADATA[NodeType.MCP_TOOL]
    ]
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: 'Database',
    color: NODE_COLORS.knowledge,
    nodes: [
      NODE_METADATA[NodeType.KNOWLEDGE_BASE_SEARCH],
      NODE_METADATA[NodeType.KNOWLEDGE_BASE_WRITE]
    ]
  },
  {
    id: 'error',
    label: 'Error Handling',
    icon: 'AlertTriangle',
    color: NODE_COLORS.error,
    nodes: [
      NODE_METADATA[NodeType.ERROR_HANDLER],
      NODE_METADATA[NodeType.TRY_CATCH]
    ]
  },
  {
    id: 'human',
    label: 'Human-in-the-Loop',
    icon: 'UserCheck',
    color: NODE_COLORS.human,
    nodes: [
      NODE_METADATA[NodeType.HUMAN_APPROVAL],
      NODE_METADATA[NodeType.HUMAN_REVIEW]
    ]
  },
  {
    id: 'audit',
    label: 'Audit & Compliance',
    icon: 'FileSignature',
    color: NODE_COLORS.audit,
    nodes: [
      NODE_METADATA[NodeType.AUDIT_LOG],
      NODE_METADATA[NodeType.COMPLIANCE_CHECK]
    ]
  },
  {
    id: 'notification',
    label: 'Notifications',
    icon: 'Bell',
    color: NODE_COLORS.notification,
    nodes: [
      NODE_METADATA[NodeType.NOTIFICATION],
      NODE_METADATA[NodeType.ALERT],
      NODE_METADATA[NodeType.WEBHOOK]
    ]
  },
  {
    id: 'validation',
    label: 'Data Validation',
    icon: 'CheckCircle',
    color: NODE_COLORS.validation,
    nodes: [
      NODE_METADATA[NodeType.DATA_VALIDATION],
      NODE_METADATA[NodeType.SCHEMA_VALIDATION]
    ]
  },
  {
    id: 'flow',
    label: 'Flow Control',
    icon: 'Shuffle',
    color: NODE_COLORS.flow,
    nodes: [
      NODE_METADATA[NodeType.PARALLEL],
      NODE_METADATA[NodeType.MERGE],
      NODE_METADATA[NodeType.JOIN],
      NODE_METADATA[NodeType.RATE_LIMIT]
    ]
  },
  {
    id: 'cache',
    label: 'Cache',
    icon: 'HardDrive',
    color: NODE_COLORS.cache,
    nodes: [
      NODE_METADATA[NodeType.CACHE_READ],
      NODE_METADATA[NodeType.CACHE_WRITE],
      NODE_METADATA[NodeType.CACHE_INVALIDATE]
    ]
  },
  {
    id: 'schedule',
    label: 'Scheduling',
    icon: 'Calendar',
    color: NODE_COLORS.schedule,
    nodes: [
      NODE_METADATA[NodeType.SCHEDULE],
      NODE_METADATA[NodeType.TRIGGER],
      NODE_METADATA[NodeType.CRON]
    ]
  },
  {
    id: 'agent',
    label: 'Advanced Agents',
    icon: 'Bot',
    color: NODE_COLORS.agent,
    nodes: [
      NODE_METADATA[NodeType.AGENT_ITERATIVE],
      NODE_METADATA[NodeType.AGENT_WITH_TOOLS]
    ]
  }
]

// ============================================================================
// Helper Functions
// ============================================================================

export function getNodeMetadata(nodeType: NodeType): NodeMetadata | undefined {
  return NODE_METADATA[nodeType]
}

export function getNodeColor(nodeType: NodeType): string {
  const metadata = getNodeMetadata(nodeType)
  return metadata?.color || '#gray'
}

export function getNodesByCategory(category: string): NodeMetadata[] {
  return Object.values(NODE_METADATA).filter(node => node.category === category)
}

export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateEdgeId(source: string, target: string): string {
  return `edge_${source}_${target}_${Math.random().toString(36).substr(2, 9)}`
}
