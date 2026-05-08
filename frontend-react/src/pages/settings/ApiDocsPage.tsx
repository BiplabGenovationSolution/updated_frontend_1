// frontend/src/app/settings/api-docs/page.tsx
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import {
  Book,
  Code,
  Copy,
  Key,
  Lock,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

export default function APIDocumentationPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('curl')

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard',
      duration: 2000  
    })
  }

  const getCodeExample = (endpoint: string, method: string, language: string) => {
    const examples: Record<string, Record<string, string>> = {
      'POST /api/v1/agents/{agent_id}/chat': {
        curl: `curl -X POST "${apiBaseUrl}/api/v1/agents/YOUR_AGENT_ID/chat" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how can you help me?"}
    ],
    "stream": true
  }'`,
        python: `import requests

url = "${apiBaseUrl}/api/v1/agents/YOUR_AGENT_ID/chat"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "messages": [
        {"role": "user", "content": "Hello, how can you help me?"}
    ],
    "stream": True
}

response = requests.post(url, headers=headers, json=data, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))`,
        javascript: `const response = await fetch('${apiBaseUrl}/api/v1/agents/YOUR_AGENT_ID/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      {role: 'user', content: 'Hello, how can you help me?'}
    ],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const {done, value} = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}`
      },
      'GET /api/v1/agents/{agent_id}': {
        curl: `curl -X GET "${apiBaseUrl}/api/v1/agents/YOUR_AGENT_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        python: `import requests

url = "${apiBaseUrl}/api/v1/agents/YOUR_AGENT_ID"
headers = {"Authorization": "Bearer YOUR_API_KEY"}

response = requests.get(url, headers=headers)
agent = response.json()
print(agent)`,
        javascript: `const response = await fetch('${apiBaseUrl}/api/v1/agents/YOUR_AGENT_ID', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const agent = await response.json();
console.log(agent);`
      },
      'GET /api/v1/agents': {
        curl: `curl -X GET "${apiBaseUrl}/api/v1/agents" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        python: `import requests

url = "${apiBaseUrl}/api/v1/agents"
headers = {"Authorization": "Bearer YOUR_API_KEY"}

response = requests.get(url, headers=headers)
agents = response.json()
print(agents)`,
        javascript: `const response = await fetch('${apiBaseUrl}/api/v1/agents', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const agents = await response.json();
console.log(agents);`
      }
    }

    return examples[endpoint]?.[language] || ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-gray-500 mt-2">
          Learn how to integrate your custom agents into external applications
        </p>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Quick guide to start using the Mentis Extended Agent API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Create an API Key</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Navigate to the API Keys tab and create a new API key with the appropriate scopes
              (chat, read, write) for your use case.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Authenticate Your Requests</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Include your API key in the Authorization header:
            </p>
            <div className="relative">
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                <code>Authorization: Bearer YOUR_API_KEY</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyCode('Authorization: Bearer YOUR_API_KEY')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Make API Requests</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use the base URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{apiBaseUrl}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All API requests must be authenticated using an API key in the Authorization header
            with the Bearer scheme.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">API Key Format</h4>
           
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Security Best Practices</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Never commit API keys to version control</li>
              <li>Use environment variables to store keys</li>
              <li>Rotate keys regularly</li>
              <li>Use IP whitelisting when possible</li>
              <li>Implement rate limiting in your application</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>
            Available endpoints for agent interaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curl">cURL</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* POST /api/v1/agents/{agent_id}/chat */}
          <div className="space-y-3 border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">POST</Badge>
              <code className="text-sm">/api/v1/agents/{'{agent_id}'}/chat</code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chat with a specific agent. Supports streaming responses.
            </p>

            <div>
              <h5 className="font-medium text-sm mb-2">Required Scopes</h5>
              <Badge variant="outline">chat</Badge>
            </div>

            <div>
              <h5 className="font-medium text-sm mb-2">Request Body</h5>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`{
  "messages": [
    {"role": "user", "content": "Your message here"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000
}`}
              </pre>
            </div>

            <div>
              <h5 className="font-medium text-sm mb-2">Example</h5>
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                  {getCodeExample('POST /api/v1/agents/{agent_id}/chat', 'POST', selectedLanguage)}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode(getCodeExample('POST /api/v1/agents/{agent_id}/chat', 'POST', selectedLanguage))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* GET /api/v1/agents/{agent_id} */}
          <div className="space-y-3 border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">GET</Badge>
              <code className="text-sm">/api/v1/agents/{'{agent_id}'}</code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get information about a specific agent.
            </p>

            <div>
              <h5 className="font-medium text-sm mb-2">Required Scopes</h5>
              <Badge variant="outline">read</Badge>
            </div>

            <div>
              <h5 className="font-medium text-sm mb-2">Example</h5>
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                  {getCodeExample('GET /api/v1/agents/{agent_id}', 'GET', selectedLanguage)}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode(getCodeExample('GET /api/v1/agents/{agent_id}', 'GET', selectedLanguage))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* GET /api/v1/agents */}
          <div className="space-y-3 border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">GET</Badge>
              <code className="text-sm">/api/v1/agents</code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              List all accessible agents in your organization.
            </p>

            <div>
              <h5 className="font-medium text-sm mb-2">Required Scopes</h5>
              <Badge variant="outline">read</Badge>
            </div>

            <div>
              <h5 className="font-medium text-sm mb-2">Example</h5>
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                  {getCodeExample('GET /api/v1/agents', 'GET', selectedLanguage)}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode(getCodeExample('GET /api/v1/agents', 'GET', selectedLanguage))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Rate Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Rate limits are enforced based on your organization's subscription tier:
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="font-medium">Free</div>
              <div className="text-2xl font-bold mt-2">10</div>
              <div className="text-xs text-gray-500">requests/minute</div>
              <div className="text-lg font-semibold mt-2">1,000</div>
              <div className="text-xs text-gray-500">requests/day</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="font-medium">Team</div>
              <div className="text-2xl font-bold mt-2">100</div>
              <div className="text-xs text-gray-500">requests/minute</div>
              <div className="text-lg font-semibold mt-2">10,000</div>
              <div className="text-xs text-gray-500">requests/day</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="font-medium">Business</div>
              <div className="text-2xl font-bold mt-2">500</div>
              <div className="text-xs text-gray-500">requests/minute</div>
              <div className="text-lg font-semibold mt-2">50,000</div>
              <div className="text-xs text-gray-500">requests/day</div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="font-medium">Enterprise</div>
              <div className="text-2xl font-bold mt-2">5,000</div>
              <div className="text-xs text-gray-500">requests/minute</div>
              <div className="text-lg font-semibold mt-2">500,000</div>
              <div className="text-xs text-gray-500">requests/day</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                When rate limits are exceeded, the API returns a 429 status code.
                Implement exponential backoff in your application to handle rate limit errors gracefully.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge variant="destructive">401</Badge>
              <div>
                <div className="font-medium text-sm">Unauthorized</div>
                <div className="text-xs text-gray-500">Invalid or missing API key</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge variant="destructive">403</Badge>
              <div>
                <div className="font-medium text-sm">Forbidden</div>
                <div className="text-xs text-gray-500">
                  Insufficient scopes or agent not accessible
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge variant="destructive">404</Badge>
              <div>
                <div className="font-medium text-sm">Not Found</div>
                <div className="text-xs text-gray-500">Agent not found</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge variant="destructive">429</Badge>
              <div>
                <div className="font-medium text-sm">Too Many Requests</div>
                <div className="text-xs text-gray-500">Rate limit exceeded</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge variant="destructive">500</Badge>
              <div>
                <div className="font-medium text-sm">Internal Server Error</div>
                <div className="text-xs text-gray-500">
                  Server error - contact support if persists
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Always use HTTPS in production environments</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Implement proper error handling with retries and exponential backoff</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Cache agent information to reduce API calls</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Use streaming for real-time chat experiences</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Monitor your API usage to avoid rate limits</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Rotate API keys regularly as a security best practice</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
