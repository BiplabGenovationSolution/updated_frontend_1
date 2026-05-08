# ExecutionPanel Component - Usage Guide

A unified, reusable execution panel component that supports all agent types (Aegis, Custom Agents, Sophia, etc.) with configurable tabs, progress tracking, and download functionality.

## Features

- 🎯 **Unified Interface**: Single component for all agent execution panels
- 📊 **Progress Tracking**: Real-time progress indicators with animations
- 📑 **Configurable Tabs**: Enable/disable logs, output, sources, and files tabs
- 💾 **Download Support**: Built-in download functionality for all content types
- 🎨 **Theme Support**: Dark mode compatible
- 🔍 **Source Filtering**: Filter sources by type
- 📋 **Copy to Clipboard**: Easy content copying
- ⚡ **Real-time Updates**: Live streaming support
- 🎭 **Type-safe**: Full TypeScript support

## Basic Usage

```typescript
import { ExecutionPanel } from '@/components/shared'

function MyComponent() {
  const [messages, setMessages] = useState<ExecutionMessage[]>([])

  return (
    <ExecutionPanel
      messages={messages}
      isVisible={true}
      isExecuting={false}
      title="My Execution Panel"
    />
  )
}
```

## Usage Examples

### 1. Aegis Research Agent

```typescript
import { ExecutionPanel, ExecutionMessage, ParsedSource, ProgressInfo } from '@/components/shared'

function AegisChat() {
  const [streamMessages, setStreamMessages] = useState<ExecutionMessage[]>([])
  const [parsedSources, setParsedSources] = useState<ParsedSource[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [progress, setProgress] = useState<ProgressInfo>({
    percentage: 0,
    currentStage: 'Initializing...',
    isActive: false,
    isCompleted: false
  })

  return (
    <ExecutionPanel
      // Display
      isVisible={true}
      title="Aegis Research Execution"
      subtitle="Advanced research mode"

      // Data
      messages={streamMessages}
      parsedSources={parsedSources}

      // State
      isStreaming={isStreaming}
      sessionId={researchSessionId}

      // Configuration
      tabs={{ logs: true, output: true, sources: true, files: true }}
      agentType="aegis"

      // Progress
      progress={progress}

      // Theme
      isDarkTheme={theme === 'dark'}

      // Callbacks
      onClose={() => setPanelVisible(false)}
      onResearchComplete={(output, sources, sessionId) => {
        console.log('Research complete!', { output, sources, sessionId })
      }}
    />
  )
}
```

### 2. Custom Agent Execution

```typescript
import { ExecutionPanel, ExecutionMessage } from '@/components/shared'

function CustomAgentChat() {
  const [executionEvents, setExecutionEvents] = useState<ExecutionMessage[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentCapability, setCurrentCapability] = useState<string | null>(null)

  // Map custom agent events to ExecutionMessage format
  const messages: ExecutionMessage[] = executionEvents.map(event => ({
    type: event.type as any, // 'capability', 'info', 'error', 'success'
    content: event.message,
    timestamp: event.timestamp,
    capability: event.capability,
    executionTime: event.executionTime,
    success: event.success,
    metadata: event.metadata
  }))

  return (
    <ExecutionPanel
      // Display
      isVisible={true}
      title="Custom Agent Execution"

      // Data
      messages={messages}

      // State
      isExecuting={isExecuting}
      currentCapability={currentCapability}

      // Configuration
      tabs={{ logs: true, output: true, sources: false, files: false }}
      agentType="custom"

      // Callbacks
      onClose={() => setPanelVisible(false)}
    />
  )
}
```

### 3. Sophia Knowledge Base

```typescript
import { ExecutionPanel, ParsedSource } from '@/components/shared'

function SophiaChat() {
  const [sources, setSources] = useState<ParsedSource[]>([])
  const [selectedSource, setSelectedSource] = useState<ParsedSource | null>(null)

  return (
    <ExecutionPanel
      // Display
      isVisible={!!selectedSource}
      title="Sophia Source Details"
      subtitle={knowledgeBaseName}

      // Data
      messages={[]} // No execution messages for source view
      parsedSources={selectedSource ? [selectedSource] : []}

      // Configuration
      tabs={{ logs: false, output: false, sources: true, files: false }}
      agentType="sophia"

      // Callbacks
      onClose={() => setSelectedSource(null)}
    />
  )
}
```

### 4. Generic Agent with Progress

```typescript
import { ExecutionPanel, ExecutionMessage, ProgressInfo } from '@/components/shared'

function GenericAgent() {
  const [messages, setMessages] = useState<ExecutionMessage[]>([])
  const [progress, setProgress] = useState<ProgressInfo>({
    percentage: 0,
    currentStage: 'Ready',
    isActive: false
  })

  // Update progress as execution proceeds
  useEffect(() => {
    if (isExecuting) {
      setProgress({
        percentage: calculateProgress(messages),
        currentStage: extractStage(messages),
        isActive: true,
        isCompleted: false
      })
    }
  }, [messages, isExecuting])

  return (
    <ExecutionPanel
      messages={messages}
      isVisible={true}
      isExecuting={isExecuting}
      progress={progress}
      tabs={{ logs: true, output: true, sources: true, files: true }}
    />
  )
}
```

## Props Reference

### ExecutionPanelProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVisible` | `boolean` | `true` | Controls panel visibility |
| `onClose` | `() => void` | - | Callback when panel is closed |
| `messages` | `ExecutionMessage[]` | Required | Array of execution messages/events |
| `parsedSources` | `ParsedSource[]` | `[]` | Array of parsed sources with metadata |
| `staticSourceContent` | `string` | - | Raw source content (alternative to parsedSources) |
| `isExecuting` | `boolean` | `false` | Whether execution is in progress |
| `isStreaming` | `boolean` | `false` | Whether streaming is active |
| `currentCapability` | `string \| null` | - | Currently executing capability |
| `sessionId` | `string \| null` | - | Execution session ID |
| `tabs` | `TabConfig` | All enabled | Which tabs to show |
| `title` | `string` | `'Execution Panel'` | Panel title |
| `subtitle` | `string` | - | Panel subtitle |
| `agentType` | `'aegis' \| 'custom' \| 'sophia' \| 'generic'` | `'generic'` | Agent type for filename prefixes |
| `progress` | `ProgressInfo` | - | Progress tracking information |
| `isDarkTheme` | `boolean` | `false` | Dark theme mode |
| `onResearchComplete` | `(output, sources, sessionId) => void` | - | Research completion callback |

### ExecutionMessage

```typescript
interface ExecutionMessage {
  type: 'log' | 'output' | 'source' | 'files' | 'status' | 'activity' | 'completion' | 'capability' | 'info' | 'error' | 'success'
  content: string
  timestamp: string
  metadata?: any
  capability?: string
  executionTime?: number
  success?: boolean
}
```

### ParsedSource

```typescript
interface ParsedSource {
  title: string
  url: string
  sourceType?: string
  relevanceScore?: number
  relevance?: number
  content?: string
  excerpt?: string
  citationFormat?: string
  filename?: string
  document_id?: string
  document_name?: string
  score?: number
  content_preview?: string
  full_content?: string
  chunk_index?: number
  metadata?: {
    size_bytes?: number
    content_type?: string
    created_at?: string
    chunk_index?: number
  }
}
```

### TabConfig

```typescript
interface TabConfig {
  logs?: boolean
  output?: boolean
  sources?: boolean
  files?: boolean
}
```

### ProgressInfo

```typescript
interface ProgressInfo {
  percentage: number
  currentStage: string
  isActive: boolean
  isCompleted?: boolean
}
```

## Advanced Features

### Message Deduplication

The component automatically deduplicates repetitive messages to reduce noise:

```typescript
// Repetitive "in progress" messages are filtered (keeps every 3rd)
// Duplicate messages within 1 second are filtered
// This happens automatically - no configuration needed
```

### Source Filtering

When multiple source types are present, users can filter by type:

```typescript
const parsedSources: ParsedSource[] = [
  { title: 'Article 1', url: '...', sourceType: 'news' },
  { title: 'Page 1', url: '...', sourceType: 'web' },
  { title: 'Doc 1', url: '...', sourceType: 'document' }
]

// Filter UI appears automatically when 2+ source types exist
```

### Download Functionality

Built-in download support for all content types:

- **Logs**: Download as `.txt` file
- **Output**: Download as `.md` (Markdown) file
- **Sources**: Download as `.json` (structured) or `.txt` (raw)
- **Files**: Individual file downloads

All downloads include timestamps in filenames.

### Copy to Clipboard

Click "Copy" buttons to copy content to clipboard. Toast notifications confirm success/failure.

### Dark Mode

The component automatically adapts to theme changes:

```typescript
import { useTheme } from '@/context/ThemeProvider'

function MyComponent() {
  const { theme } = useTheme()

  return (
    <ExecutionPanel
      messages={messages}
      isDarkTheme={theme === 'dark'}
    />
  )
}
```

## Migration Guide

### From AegisExecutionPanel

```typescript
// Before
<AegisExecutionPanel
  chatId={chatId}
  streamMessages={streamMessages}
  isStreaming={isStreaming}
  researchSession={researchSession}
  isVisible={isVisible}
  onClose={onClose}
  onResearchComplete={onResearchComplete}
  staticSources={staticSources}
/>

// After
<ExecutionPanel
  messages={streamMessages}
  isStreaming={isStreaming}
  sessionId={researchSession}
  isVisible={isVisible}
  onClose={onClose}
  onResearchComplete={onResearchComplete}
  parsedSources={staticSources?.parsedSources}
  staticSourceContent={staticSources?.content}
  agentType="aegis"
  tabs={{ logs: true, output: true, sources: true, files: true }}
/>
```

### From CustomAgentExecutionPanel

```typescript
// Before
<CustomAgentExecutionPanel
  events={events}
  isExecuting={isExecuting}
  currentCapability={currentCapability}
  isVisible={isVisible}
  onClose={onClose}
/>

// After
<ExecutionPanel
  messages={events.map(e => ({
    type: e.type as any,
    content: e.message,
    timestamp: e.timestamp,
    capability: e.capability,
    executionTime: e.executionTime,
    success: e.success,
    metadata: e.metadata
  }))}
  isExecuting={isExecuting}
  currentCapability={currentCapability}
  isVisible={isVisible}
  onClose={onClose}
  agentType="custom"
  tabs={{ logs: true, output: true, sources: false, files: false }}
/>
```

### From SophiaSourcePanel

```typescript
// Before
<SophiaSourcePanel
  source={source}
  isVisible={isVisible}
  onClose={onClose}
  knowledgeBaseName={knowledgeBaseName}
  knowledgeBaseId={knowledgeBaseId}
/>

// After
<ExecutionPanel
  messages={[]}
  parsedSources={source ? [source] : []}
  isVisible={isVisible}
  onClose={onClose}
  title="Source Details"
  subtitle={knowledgeBaseName}
  agentType="sophia"
  tabs={{ logs: false, output: false, sources: true, files: false }}
/>
```

## Best Practices

1. **Always provide timestamps**: Ensure all messages have valid timestamp strings
2. **Use appropriate message types**: Choose the correct type for proper categorization
3. **Enable relevant tabs**: Only enable tabs you'll use to reduce UI clutter
4. **Handle callbacks**: Implement onClose and other callbacks as needed
5. **Progress updates**: Update progress info regularly for better UX
6. **Theme consistency**: Pass isDarkTheme to match your app's theme

## Examples Repository

See the original implementation files for more examples:
- `/home/user/mentis-extended/frontend/src/components/chat/AegisExecutionPanel.tsx`
- `/home/user/mentis-extended/frontend/src/components/chat/CustomAgentExecutionPanel.tsx`
- `/home/user/mentis-extended/frontend/src/components/chat/SophiaSourcePanel.tsx`
