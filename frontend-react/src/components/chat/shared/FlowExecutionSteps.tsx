import React from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlowExecutionStepsProps {
    events: any[]
}

export function FlowExecutionSteps({ events }: FlowExecutionStepsProps) {
    if (!events || events.length === 0) return null

    // Process events into node states
    // Reusing logic from StreamingMessage
    const nodeStates = events.reduce((acc: any[], event) => {
        if (event.type === 'node_started') {
            const nodeId = event.metadata?.node_id
            if (!nodeId) return acc

            const existingIndex = acc.findIndex(n => n.id === nodeId)
            if (existingIndex >= 0) {
                return acc
            }

            let displayName = "Processing Step"
            if (event.metadata?.node_type) {
                displayName = event.metadata.node_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
            } else if (event.metadata?.label) {
                displayName = event.metadata.label
            }

            acc.push({
                id: nodeId,
                name: displayName,
                status: 'running',
                startTime: event.timestamp
            })
        } else if (event.type === 'node_completed') {
            const nodeId = event.metadata?.node_id
            if (!nodeId) return acc

            const nodeIndex = acc.findIndex(n => n.id === nodeId)
            if (nodeIndex >= 0) {
                acc[nodeIndex].status = 'completed'
                acc[nodeIndex].endTime = event.timestamp
            } else {
                let displayName = "Processing Step"
                if (event.metadata?.node_type) {
                    displayName = event.metadata.node_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                }

                acc.push({
                    id: nodeId,
                    name: displayName,
                    status: 'completed',
                    startTime: event.timestamp,
                    endTime: event.timestamp
                })
            }
        }
        return acc
    }, [])

    if (nodeStates.length === 0) return null

    return (
        <div className="flex flex-row flex-wrap gap-2 mb-3">
            {nodeStates.map((node, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
                        node.status === 'running'
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    )}
                >
                    {node.status === 'running' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{node.name}</span>
                </div>
            ))}
        </div>
    )
}
