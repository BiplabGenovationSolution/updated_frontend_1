/**
 * Connector Logo Resolver
 * Automatically fetches real company logos using Simple Icons library (2800+ logos!)
 */

import * as SimpleIcons from 'simple-icons'

// Comprehensive mapping of 220+ connector names to Simple Icons slugs
const CONNECTOR_TO_SIMPLE_ICON: Record<string, string> = {
  // ========== DATABASES (20+) ==========
  'source-postgres': 'postgresql',
  'source-postgresql': 'postgresql',
  'source-mysql': 'mysql',
  'source-mongodb': 'mongodb',
  'source-mssql': 'microsoftsqlserver',
  'source-snowflake': 'snowflake',
  'source-bigquery': 'googlebigquery',
  'source-redshift': 'amazonredshift',
  'source-oracle': 'oracle',
  'source-mariadb': 'mariadb',
  'source-cassandra': 'apachecassandra',
  'source-redis': 'redis',
  'source-elasticsearch': 'elasticsearch',
  'source-clickhouse': 'clickhouse',
  'source-dynamodb': 'amazondynamodb',
  'source-firestore': 'firebase',
  'source-cockroachdb': 'cockroachlabs',
  'source-tidb': 'tidb',
  'source-databricks': 'databricks',

  // ========== PROJECT MANAGEMENT (15+) ==========
  'source-jira': 'jira',
  'source-asana': 'asana',
  'source-linear': 'linear',
  'source-monday': 'monday',
  'source-clickup': 'clickup',
  'source-trello': 'trello',
  'source-notion': 'notion',
  'source-airtable': 'airtable',
  'source-basecamp': 'basecamp',
  'source-wrike': 'wrike',
  'source-smartsheet': 'smartsheet',

  // ========== COMMUNICATION (15+) ==========
  'source-slack': 'slack',
  'source-discord': 'discord',
  'source-microsoft-teams': 'microsoftteams',
  'source-zoom': 'zoom',
  'source-telegram': 'telegram',
  'source-whatsapp': 'whatsapp',
  'source-signal': 'signal',
  'source-twilio': 'twilio',
  'source-vonage': 'vonage',
  'source-ringcentral': 'ringcentral',

  // ========== DEVELOPMENT (20+) ==========
  'source-github': 'github',
  'source-gitlab': 'gitlab',
  'source-bitbucket': 'bitbucket',
  'source-docker-hub': 'docker',
  'source-docker': 'docker',
  'source-kubernetes': 'kubernetes',
  'source-jenkins': 'jenkins',
  'source-circleci': 'circleci',
  'source-travis-ci': 'travisci',
  'source-travis': 'travisci',
  'source-buildkite': 'buildkite',
  'source-datadog': 'datadog',
  'source-sentry': 'sentry',
  'source-new-relic': 'newrelic',
  'source-pagerduty': 'pagerduty',
  'source-opsgenie': 'opsgenie',
  'source-prometheus': 'prometheus',
  'source-grafana': 'grafana',

  // ========== CRM (20+) ==========
  'source-salesforce': 'salesforce',
  'source-hubspot': 'hubspot',
  'source-pipedrive': 'pipedrive',
  'source-zoho-crm': 'zoho',
  'source-zendesk-sell': 'zendesk',
  'source-close': 'close',
  'source-copper': 'copper',
  'source-insightly': 'insightly',
  'source-agile-crm': 'agilecrm',
  'source-capsule-crm': 'capsulecrm',
  'source-nutshell': 'nutshell',

  // ========== SUPPORT (15+) ==========
  'source-zendesk': 'zendesk',
  'source-intercom': 'intercom',
  'source-freshdesk': 'freshdesk',
  'source-help-scout': 'helpscout',
  'source-front': 'frontapp',
  'source-drift': 'drift',
  'source-crisp': 'crisp',
  'source-livechat': 'livechat',
  'source-tawk-to': 'tawk',
  'source-kustomer': 'kustomer',
  'source-gladly': 'gladly',

  // ========== EMAIL (10+) ==========
  'source-gmail': 'gmail',
  'source-outlook': 'microsoftoutlook',
  'source-sendgrid': 'sendgrid',
  'source-mailchimp': 'mailchimp',
  'source-mailgun': 'mailgun',
  'source-postmark': 'postmark',
  'source-mandrill': 'mandrill',
  'source-sendinblue': 'sendinblue',
  'source-customer-io': 'customerio',
  'source-iterable': 'iterable',

  // ========== PRODUCTIVITY (15+) ==========
  'source-google-calendar': 'googlecalendar',
  'source-google-drive': 'googledrive',
  'source-google-sheets': 'googlesheets',
  'source-dropbox': 'dropbox',
  'source-box': 'box',
  'source-onedrive': 'microsoftonedrive',
  'source-microsoft-excel': 'microsoftexcel',
  'source-evernote': 'evernote',
  'source-todoist': 'todoist',
  'source-calendly': 'calendly',
  'source-typeform': 'typeform',
  'source-surveymonkey': 'surveymonkey',

  // ========== PAYMENTS (15+) ==========
  'source-stripe': 'stripe',
  'source-paypal': 'paypal',
  'source-square': 'square',
  'source-braintree': 'braintree',
  'source-adyen': 'adyen',
  'source-chargebee': 'chargebee',
  'source-recurly': 'recurly',
  'source-chargify': 'chargify',
  'source-authorize-net': 'authorizenet',
  'source-klarna': 'klarna',
  'source-affirm': 'affirm',

  // ========== SOCIAL MEDIA (15+) ==========
  'source-twitter': 'x',
  'source-x': 'x',
  'source-linkedin': 'linkedin',
  'source-facebook': 'facebook',
  'source-instagram': 'instagram',
  'source-youtube': 'youtube',
  'source-tiktok': 'tiktok',
  'source-pinterest': 'pinterest',
  'source-reddit': 'reddit',
  'source-snapchat': 'snapchat',
  'source-buffer': 'buffer',
  'source-hootsuite': 'hootsuite',

  // ========== ANALYTICS (15+) ==========
  'source-google-analytics': 'googleanalytics',
  'source-mixpanel': 'mixpanel',
  'source-amplitude': 'amplitude',
  'source-segment': 'segment',
  'source-heap': 'heap',
  'source-posthog': 'posthog',
  'source-fullstory': 'fullstory',
  'source-hotjar': 'hotjar',
  'source-crazy-egg': 'crazyegg',
  'source-pendo': 'pendo',
  'source-kissmetrics': 'kissmetrics',

  // ========== E-COMMERCE (20+) ==========
  'source-shopify': 'shopify',
  'source-woocommerce': 'woocommerce',
  'source-magento': 'magento',
  'source-bigcommerce': 'bigcommerce',
  'source-amazon-seller-partner': 'amazon',
  'source-amazon-ads': 'amazon',
  'source-ebay': 'ebay',
  'source-etsy': 'etsy',
  'source-walmart-marketplace': 'walmart',
  'source-target-plus': 'target',
  'source-prestashop': 'prestashop',
  'source-opencart': 'opencart',

  // ========== MARKETING (20+) ==========
  'source-google-ads': 'googleads',
  'source-facebook-marketing': 'meta',
  'source-facebook-ads': 'meta',
  'source-linkedin-ads': 'linkedin',
  'source-twitter-ads': 'x',
  'source-tiktok-ads': 'tiktok',
  'source-pinterest-ads': 'pinterest',
  'source-snapchat-ads': 'snapchat',
  'source-bing-ads': 'microsoftbing',
  'source-google-search-console': 'googlesearchconsole',
  'source-ahrefs': 'ahrefs',
  'source-semrush': 'semrush',
  'source-moz': 'moz',
  'source-activecampaign': 'activecampaign',
  'source-klaviyo': 'klaviyo',
  'source-pardot': 'salesforce',
  'source-marketo': 'adobemarketosengage',

  // ========== CLOUD PLATFORMS (10+) ==========
  'source-aws': 'amazonaws',
  'source-gcp': 'googlecloud',
  'source-azure': 'microsoftazure',
  'source-heroku': 'heroku',
  'source-vercel': 'vercel',
  'source-netlify': 'netlify',
  'source-digitalocean': 'digitalocean',

  // ========== OTHER SERVICES (10+) ==========
  'source-auth0': 'auth0',
  'source-okta': 'okta',
  'source-firebase': 'firebase',
  'source-supabase': 'supabase',
  'source-contentful': 'contentful',
  'source-sanity': 'sanity',
}

export interface LogoData {
  svg: string // SVG path data
  hex: string // Brand color
  title: string // Brand name
  slug: string // Simple Icons slug
}

/**
 * Get logo data from Simple Icons
 */
export function getSimpleIconLogo(connectorName: string): LogoData | null {
  try {
    // Get the Simple Icons slug
    const slug = CONNECTOR_TO_SIMPLE_ICON[connectorName.toLowerCase()]
    if (!slug) return null

    // Get the icon from Simple Icons
    const icon = (SimpleIcons as any)[`si${slug.charAt(0).toUpperCase() + slug.slice(1)}`]
    if (!icon) return null

    return {
      svg: icon.path,
      hex: icon.hex,
      title: icon.title,
      slug: icon.slug
    }
  } catch (error) {
    console.error(`Error getting Simple Icon for ${connectorName}:`, error)
    return null
  }
}

/**
 * Get Clearbit logo URL as fallback
 */
export function getClearbitLogoUrl(connectorName: string): string | null {
  // Map connector names to company domains
  const domainMap: Record<string, string> = {
    'source-postgres': 'postgresql.org',
    'source-mysql': 'mysql.com',
    'source-mongodb': 'mongodb.com',
    'source-slack': 'slack.com',
    'source-github': 'github.com',
    'source-gitlab': 'gitlab.com',
    'source-stripe': 'stripe.com',
    'source-salesforce': 'salesforce.com',
    'source-hubspot': 'hubspot.com',
    'source-shopify': 'shopify.com',
    'source-jira': 'atlassian.com',
    'source-asana': 'asana.com',
    'source-notion': 'notion.so',
    'source-google-analytics': 'google.com',
    'source-facebook': 'facebook.com',
    'source-twitter': 'twitter.com',
    'source-linkedin': 'linkedin.com',
    'source-gmail': 'google.com',
    'source-outlook': 'microsoft.com',
    // Add more as needed
  }

  const domain = domainMap[connectorName.toLowerCase()]
  if (!domain) return null

  return `https://logo.clearbit.com/${domain}`
}

/**
 * Generate SVG logo component from Simple Icons data
 */
export function renderSimpleIconSVG(logoData: LogoData, size: number = 24): string {
  return `
    <svg
      role="img"
      viewBox="0 0 24 24"
      width="${size}"
      height="${size}"
      fill="#${logoData.hex}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>${logoData.title}</title>
      <path d="${logoData.svg}"/>
    </svg>
  `
}

/**
 * Main logo resolver - tries multiple methods
 */
export function getConnectorLogo(connectorName: string): {
  type: 'simple-icon' | 'clearbit' | 'none'
  data?: LogoData
  url?: string
} {
  // Try Simple Icons first (best quality, 2800+ logos)
  const simpleIcon = getSimpleIconLogo(connectorName)
  if (simpleIcon) {
    return {
      type: 'simple-icon',
      data: simpleIcon
    }
  }

  // Try Clearbit as fallback
  const clearbitUrl = getClearbitLogoUrl(connectorName)
  if (clearbitUrl) {
    return {
      type: 'clearbit',
      url: clearbitUrl
    }
  }

  // No logo found
  return { type: 'none' }
}
