/**
 * Connector Branding System
 * Maps connectors to their logos, colors, and visual identity
 */

import {
  Database,
  MessageSquare,
  Code,
  Users,
  Mail,
  FileText,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Workflow,
  Cloud,
  Lock,
  Calendar,
  Phone,
  Video,
  MessageCircle,
  GitBranch,
  DollarSign,
  BarChart,
  Globe,
  Zap,
  Box,
  Package,
  Briefcase,
  Target
} from 'lucide-react'

export interface ConnectorBranding {
  name: string
  displayName: string
  icon: any // Lucide icon component (fallback)
  color: string // Hex color for the connector
  gradient?: string // Optional gradient background
  category: string
  logoUrl?: string // Real company logo URL (SimpleIcons CDN or custom)
  logoSvg?: string // Inline SVG logo
}

/**
 * Connector Branding Database
 * Maps connector names to their visual identity
 */
export const CONNECTOR_BRANDING: Record<string, ConnectorBranding> = {
  // ========== DATABASES ==========
  'source-postgres': {
    name: 'source-postgres',
    displayName: 'PostgreSQL',
    icon: Database,
    color: '#336791',
    gradient: 'from-blue-600 to-blue-800',
    category: 'Database'
  },
  'source-mysql': {
    name: 'source-mysql',
    displayName: 'MySQL',
    icon: Database,
    color: '#00758F',
    gradient: 'from-cyan-600 to-cyan-800',
    category: 'Database'
  },
  'source-mongodb': {
    name: 'source-mongodb',
    displayName: 'MongoDB',
    icon: Database,
    color: '#47A248',
    gradient: 'from-green-600 to-green-800',
    category: 'Database'
  },
  'source-mssql': {
    name: 'source-mssql',
    displayName: 'SQL Server',
    icon: Database,
    color: '#CC2927',
    gradient: 'from-red-600 to-red-800',
    category: 'Database'
  },
  'source-snowflake': {
    name: 'source-snowflake',
    displayName: 'Snowflake',
    icon: Cloud,
    color: '#29B5E8',
    gradient: 'from-sky-500 to-blue-600',
    category: 'Database'
  },
  'source-bigquery': {
    name: 'source-bigquery',
    displayName: 'BigQuery',
    icon: BarChart,
    color: '#4285F4',
    gradient: 'from-blue-500 to-indigo-600',
    category: 'Database'
  },
  'source-redshift': {
    name: 'source-redshift',
    displayName: 'Redshift',
    icon: Database,
    color: '#E25644',
    gradient: 'from-red-500 to-orange-600',
    category: 'Database'
  },

  // ========== PROJECT MANAGEMENT ==========
  'source-jira': {
    name: 'source-jira',
    displayName: 'Jira',
    icon: Target,
    color: '#0052CC',
    gradient: 'from-blue-600 to-blue-800',
    category: 'Project Management'
  },
  'source-asana': {
    name: 'source-asana',
    displayName: 'Asana',
    icon: Target,
    color: '#F06A6A',
    gradient: 'from-pink-500 to-red-500',
    category: 'Project Management'
  },
  'source-linear': {
    name: 'source-linear',
    displayName: 'Linear',
    icon: Workflow,
    color: '#5E6AD2',
    gradient: 'from-indigo-500 to-purple-600',
    category: 'Project Management'
  },
  'source-monday': {
    name: 'source-monday',
    displayName: 'Monday.com',
    icon: Calendar,
    color: '#FF3D57',
    gradient: 'from-rose-500 to-pink-600',
    category: 'Project Management'
  },
  'source-clickup': {
    name: 'source-clickup',
    displayName: 'ClickUp',
    icon: Target,
    color: '#7B68EE',
    gradient: 'from-purple-500 to-indigo-600',
    category: 'Project Management'
  },
  'source-trello': {
    name: 'source-trello',
    displayName: 'Trello',
    icon: Package,
    color: '#0079BF',
    gradient: 'from-blue-500 to-blue-700',
    category: 'Project Management'
  },

  // ========== COMMUNICATION ==========
  'source-slack': {
    name: 'source-slack',
    displayName: 'Slack',
    icon: MessageSquare,
    color: '#4A154B',
    gradient: 'from-purple-600 to-purple-800',
    category: 'Communication'
  },
  'source-discord': {
    name: 'source-discord',
    displayName: 'Discord',
    icon: MessageCircle,
    color: '#5865F2',
    gradient: 'from-indigo-500 to-purple-600',
    category: 'Communication'
  },
  'source-microsoft-teams': {
    name: 'source-microsoft-teams',
    displayName: 'Microsoft Teams',
    icon: Video,
    color: '#6264A7',
    gradient: 'from-indigo-600 to-blue-700',
    category: 'Communication'
  },
  'source-zoom': {
    name: 'source-zoom',
    displayName: 'Zoom',
    icon: Video,
    color: '#2D8CFF',
    gradient: 'from-blue-500 to-blue-600',
    category: 'Communication'
  },
  'source-telegram': {
    name: 'source-telegram',
    displayName: 'Telegram',
    icon: MessageCircle,
    color: '#0088cc',
    gradient: 'from-blue-400 to-blue-600',
    category: 'Communication'
  },

  // ========== CODE & DEVELOPMENT ==========
  'source-github': {
    name: 'source-github',
    displayName: 'GitHub',
    icon: GitBranch,
    color: '#181717',
    gradient: 'from-gray-800 to-gray-900',
    category: 'Development'
  },
  'source-gitlab': {
    name: 'source-gitlab',
    displayName: 'GitLab',
    icon: GitBranch,
    color: '#FC6D26',
    gradient: 'from-orange-500 to-orange-700',
    category: 'Development'
  },
  'source-bitbucket': {
    name: 'source-bitbucket',
    displayName: 'Bitbucket',
    icon: GitBranch,
    color: '#0052CC',
    gradient: 'from-blue-600 to-blue-800',
    category: 'Development'
  },

  // ========== CRM ==========
  'source-salesforce': {
    name: 'source-salesforce',
    displayName: 'Salesforce',
    icon: Users,
    color: '#00A1E0',
    gradient: 'from-cyan-500 to-blue-600',
    category: 'CRM'
  },
  'source-hubspot': {
    name: 'source-hubspot',
    displayName: 'HubSpot',
    icon: Users,
    color: '#FF7A59',
    gradient: 'from-orange-500 to-red-500',
    category: 'CRM'
  },
  'source-pipedrive': {
    name: 'source-pipedrive',
    displayName: 'Pipedrive',
    icon: Briefcase,
    color: '#1F87E8',
    gradient: 'from-blue-500 to-blue-700',
    category: 'CRM'
  },
  'source-zoho-crm': {
    name: 'source-zoho-crm',
    displayName: 'Zoho CRM',
    icon: Users,
    color: '#E42527',
    gradient: 'from-red-500 to-red-700',
    category: 'CRM'
  },

  // ========== EMAIL ==========
  'source-gmail': {
    name: 'source-gmail',
    displayName: 'Gmail',
    icon: Mail,
    color: '#EA4335',
    gradient: 'from-red-500 to-red-600',
    category: 'Email'
  },
  'source-outlook': {
    name: 'source-outlook',
    displayName: 'Outlook',
    icon: Mail,
    color: '#0078D4',
    gradient: 'from-blue-500 to-blue-700',
    category: 'Email'
  },
  'source-sendgrid': {
    name: 'source-sendgrid',
    displayName: 'SendGrid',
    icon: Mail,
    color: '#1A82E2',
    gradient: 'from-blue-500 to-blue-600',
    category: 'Email'
  },
  'source-mailchimp': {
    name: 'source-mailchimp',
    displayName: 'Mailchimp',
    icon: Mail,
    color: '#FFE01B',
    gradient: 'from-yellow-400 to-yellow-600',
    category: 'Email'
  },

  // ========== PRODUCTIVITY ==========
  'source-notion': {
    name: 'source-notion',
    displayName: 'Notion',
    icon: FileText,
    color: '#000000',
    gradient: 'from-gray-800 to-black',
    category: 'Productivity'
  },
  'source-google-calendar': {
    name: 'source-google-calendar',
    displayName: 'Google Calendar',
    icon: Calendar,
    color: '#4285F4',
    gradient: 'from-blue-500 to-blue-600',
    category: 'Productivity'
  },
  'source-google-drive': {
    name: 'source-google-drive',
    displayName: 'Google Drive',
    icon: Cloud,
    color: '#4285F4',
    gradient: 'from-blue-500 to-green-500',
    category: 'Productivity'
  },
  'source-dropbox': {
    name: 'source-dropbox',
    displayName: 'Dropbox',
    icon: Cloud,
    color: '#0061FF',
    gradient: 'from-blue-600 to-blue-800',
    category: 'Productivity'
  },
  'source-airtable': {
    name: 'source-airtable',
    displayName: 'Airtable',
    icon: Database,
    color: '#18BFFF',
    gradient: 'from-cyan-400 to-blue-500',
    category: 'Productivity'
  },

  // ========== SUPPORT ==========
  'source-zendesk': {
    name: 'source-zendesk',
    displayName: 'Zendesk',
    icon: Phone,
    color: '#03363D',
    gradient: 'from-teal-800 to-teal-900',
    category: 'Support'
  },
  'source-intercom': {
    name: 'source-intercom',
    displayName: 'Intercom',
    icon: MessageCircle,
    color: '#1F8DED',
    gradient: 'from-blue-500 to-blue-600',
    category: 'Support'
  },
  'source-freshdesk': {
    name: 'source-freshdesk',
    displayName: 'Freshdesk',
    icon: Phone,
    color: '#2AB27B',
    gradient: 'from-green-500 to-green-600',
    category: 'Support'
  },

  // ========== PAYMENTS ==========
  'source-stripe': {
    name: 'source-stripe',
    displayName: 'Stripe',
    icon: CreditCard,
    color: '#635BFF',
    gradient: 'from-indigo-600 to-purple-600',
    category: 'Payments'
  },
  'source-paypal': {
    name: 'source-paypal',
    displayName: 'PayPal',
    icon: DollarSign,
    color: '#00457C',
    gradient: 'from-blue-700 to-blue-900',
    category: 'Payments'
  },
  'source-square': {
    name: 'source-square',
    displayName: 'Square',
    icon: CreditCard,
    color: '#3E4348',
    gradient: 'from-gray-700 to-gray-900',
    category: 'Payments'
  },

  // ========== SOCIAL MEDIA ==========
  'source-twitter': {
    name: 'source-twitter',
    displayName: 'Twitter',
    icon: MessageCircle,
    color: '#1DA1F2',
    gradient: 'from-blue-400 to-blue-600',
    category: 'Social'
  },
  'source-linkedin': {
    name: 'source-linkedin',
    displayName: 'LinkedIn',
    icon: Briefcase,
    color: '#0A66C2',
    gradient: 'from-blue-600 to-blue-800',
    category: 'Social'
  },
  'source-facebook': {
    name: 'source-facebook',
    displayName: 'Facebook',
    icon: Globe,
    color: '#1877F2',
    gradient: 'from-blue-600 to-blue-700',
    category: 'Social'
  },
  'source-instagram': {
    name: 'source-instagram',
    displayName: 'Instagram',
    icon: Globe,
    color: '#E4405F',
    gradient: 'from-pink-500 via-purple-500 to-yellow-500',
    category: 'Social'
  },

  // ========== ANALYTICS ==========
  'source-google-analytics': {
    name: 'source-google-analytics',
    displayName: 'Google Analytics',
    icon: TrendingUp,
    color: '#F57C00',
    gradient: 'from-orange-500 to-orange-600',
    category: 'Analytics'
  },
  'source-mixpanel': {
    name: 'source-mixpanel',
    displayName: 'Mixpanel',
    icon: BarChart,
    color: '#7856FF',
    gradient: 'from-purple-600 to-indigo-600',
    category: 'Analytics'
  },
  'source-amplitude': {
    name: 'source-amplitude',
    displayName: 'Amplitude',
    icon: TrendingUp,
    color: '#191F34',
    gradient: 'from-gray-800 to-gray-900',
    category: 'Analytics'
  },

  // ========== E-COMMERCE ==========
  'source-shopify': {
    name: 'source-shopify',
    displayName: 'Shopify',
    icon: ShoppingCart,
    color: '#96BF48',
    gradient: 'from-green-500 to-green-600',
    category: 'E-commerce'
  },
  'source-woocommerce': {
    name: 'source-woocommerce',
    displayName: 'WooCommerce',
    icon: ShoppingCart,
    color: '#96588A',
    gradient: 'from-purple-600 to-purple-700',
    category: 'E-commerce'
  },
  'source-amazon-seller-partner': {
    name: 'source-amazon-seller-partner',
    displayName: 'Amazon Seller',
    icon: Package,
    color: '#FF9900',
    gradient: 'from-orange-400 to-orange-600',
    category: 'E-commerce'
  },

  // ========== MARKETING ==========
  'source-google-ads': {
    name: 'source-google-ads',
    displayName: 'Google Ads',
    icon: Zap,
    color: '#4285F4',
    gradient: 'from-blue-500 to-green-500',
    category: 'Marketing'
  },
  'source-facebook-marketing': {
    name: 'source-facebook-marketing',
    displayName: 'Facebook Ads',
    icon: Zap,
    color: '#1877F2',
    gradient: 'from-blue-600 to-blue-700',
    category: 'Marketing'
  },
}

/**
 * Get branding for a connector
 * Falls back to default branding if not found
 */
export function getConnectorBranding(connectorName: string): ConnectorBranding {
  const branding = CONNECTOR_BRANDING[connectorName]

  if (branding) {
    return branding
  }

  // Default fallback branding
  return {
    name: connectorName,
    displayName: connectorName.replace('source-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: Database,
    color: '#6B7280',
    gradient: 'from-gray-500 to-gray-600',
    category: 'Other'
  }
}

/**
 * Category colors for badges
 */
const NEUTRAL_BADGE = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'

export const CATEGORY_COLORS: Record<string, string> = {
  'Database': NEUTRAL_BADGE,
  'Project Management': NEUTRAL_BADGE,
  'Communication': NEUTRAL_BADGE,
  'Development': NEUTRAL_BADGE,
  'CRM': NEUTRAL_BADGE,
  'Email': NEUTRAL_BADGE,
  'Productivity': NEUTRAL_BADGE,
  'Support': NEUTRAL_BADGE,
  'Payments': NEUTRAL_BADGE,
  'Social': NEUTRAL_BADGE,
  'Analytics': NEUTRAL_BADGE,
  'E-commerce': NEUTRAL_BADGE,
  'Marketing': NEUTRAL_BADGE,
  'Other': NEUTRAL_BADGE,
}
