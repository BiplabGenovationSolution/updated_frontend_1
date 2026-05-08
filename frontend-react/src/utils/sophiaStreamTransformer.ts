// frontend/src/utils/sophiaStreamTransformer.ts
/**
 * Transforms Sophia's SSE events into StreamMessage format for AegisExecutionPanel
 */

export interface SSEEvent {
    event: string
    data: string
}

export interface StreamMessage {
    type: 'log' | 'output' | 'source' | 'files' | 'status' | 'activity' | 'completion'
    content: string
    timestamp: string
    metadata?: any
}

/**
 * Calculate progress percentage based on SSE events
 * Stages: start (0%) → processing (20%) → searching (40%) → sources (60%) → generating (80%) → completion (100%)
 */
export function calculateSophiaProgress(sseEvents: SSEEvent[]): number {
    if (sseEvents.length === 0) return 0

    const stageProgress: Record<string, number> = {
        start: 10,
        processing: 25,
        searching: 45,
        sources: 65,
        generating: 85,
        completion: 100,
        complete: 100
    }

    let maxProgress = 0

    for (const event of sseEvents) {
        try {
            if (event.event === 'start') {
                maxProgress = Math.max(maxProgress, stageProgress.start)
            } else if (event.event === 'progress') {
                const data = JSON.parse(event.data)
                const stage = data.stage

                // If the backend passes an explicit progress number, prefer that
                if (typeof data.progress === 'number') {
                    maxProgress = Math.max(maxProgress, data.progress)
                } else if (stageProgress[stage]) {
                    maxProgress = Math.max(maxProgress, stageProgress[stage])
                }
            } else if (event.event === 'sources') {
                maxProgress = Math.max(maxProgress, stageProgress.sources)
            } else if (event.event === 'delta') {
                // First delta means we're generating
                maxProgress = Math.max(maxProgress, stageProgress.generating)
            } else if (event.event === 'completion') {
                maxProgress = 100
            }
        } catch (error) {
            console.error('Error calculating progress:', error)
        }
    }

    return maxProgress
}

/**
 * Transform Sophia SSE events to StreamMessage format
 */
export function transformSophiaSSEToStreamMessages(
    sseEvents: SSEEvent[]
): StreamMessage[] {
    const messages: StreamMessage[] = []
    let accumulatedOutput = ''

    for (const event of sseEvents) {
        const timestamp = new Date().toISOString()

        try {
            switch (event.event) {
                case 'start': {
                    const data = JSON.parse(event.data)
                    messages.push({
                        type: 'status',
                        content: '🚀 Starting Sophia query...',
                        timestamp,
                        metadata: { stage: 'start', progress: 10, ...data }
                    })
                    break
                }

                case 'progress': {
                    const data = JSON.parse(event.data)
                    const stageEmojis: Record<string, string> = {
                        processing: '⚙️',
                        searching: '🔍',
                        generating: '✨'
                    }
                    const emoji = stageEmojis[data.stage] || '📝'

                    // Show message or fallback to stage name
                    const logMessage = data.message || `Continuing ${data.stage || 'process'}...`

                    messages.push({
                        type: 'log',
                        content: `${emoji} ${logMessage}`,
                        timestamp,
                        metadata: { stage: data.stage, progress: data.progress }
                    })
                    break
                }

                case 'sources': {
                    const data = JSON.parse(event.data)
                    messages.push({
                        type: 'source',
                        content: JSON.stringify(data.sources, null, 2),
                        timestamp,
                        metadata: {
                            count: data.count,
                            sources: data.sources
                        }
                    })

                    // Also add a log message
                    messages.push({
                        type: 'log',
                        content: `📚 Retrieved ${data.count} relevant sources from knowledge base`,
                        timestamp,
                        metadata: { stage: 'sources' }
                    })
                    break
                }

                case 'delta': {
                    const data = JSON.parse(event.data)
                    accumulatedOutput += data.delta

                    messages.push({
                        type: 'output',
                        content: data.delta,
                        timestamp,
                        metadata: { accumulated: accumulatedOutput }
                    })
                    break
                }

                case 'completion': {
                    const data = JSON.parse(event.data)
                    messages.push({
                        type: 'completion',
                        content: '✅ Query completed successfully',
                        timestamp,
                        metadata: {
                            message_id: data.message_id,
                            user_message_id: data.user_message_id,
                            full_response: data.full_response,
                            sources: data.sources,
                            response_time_ms: data.response_time_ms,
                            progress: 100
                        }
                    })

                    // Add final log
                    messages.push({
                        type: 'log',
                        content: `✅ Completed in ${(data.response_time_ms / 1000).toFixed(2)}s`,
                        timestamp,
                        metadata: { stage: 'complete', progress: 100 }
                    })
                    break
                }

                case 'error': {
                    const data = JSON.parse(event.data)
                    messages.push({
                        type: 'status',
                        content: `❌ Error: ${data.error}`,
                        timestamp,
                        metadata: { error: true, ...data }
                    })
                    break
                }

                default:
                    // Unknown event type - log it
                    messages.push({
                        type: 'log',
                        content: `Unknown event: ${event.event}`,
                        timestamp,
                        metadata: { raw: event }
                    })
            }
        } catch (error) {
            console.error('Error parsing SSE event:', event, error)
            messages.push({
                type: 'log',
                content: `⚠️ Error parsing event: ${event.event}`,
                timestamp,
                metadata: { error: true, raw: event }
            })
        }
    }

    return messages
}

/**
 * Format Sophia sources for display in execution panel
 */
export function formatSophiaSources(sources: any[]): any[] {
    return sources.map((source, index) => ({
        title: source.document_name || `Document ${index + 1}`,
        url: `#doc-${source.document_id}`,
        sourceType: 'Knowledge Base',
        relevanceScore: source.score || 0,
        content: source.full_content || source.content_preview || '',
        citationFormat: `[${index + 1}] ${source.document_name} (Score: ${(source.score * 100).toFixed(1)}%)`,
        metadata: {
            document_id: source.document_id,
            chunk_index: source.chunk_index,
            ...source.metadata
        }
    }))
}
