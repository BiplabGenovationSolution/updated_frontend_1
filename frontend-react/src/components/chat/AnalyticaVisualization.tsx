'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
    BarChart3,
    Download,
    Minimize2,
    Maximize2,
    ChevronUp,
    ChevronDown,
    TrendingUp,
    Zap
} from 'lucide-react'
import Plot from 'react-plotly.js'

export interface AnalyticaVisualizationProps {
    visualization: any
    index: number
    messageId?: string
}

export function AnalyticaVisualization({ visualization, index, messageId = 'streaming' }: AnalyticaVisualizationProps) {
    const { toast } = useToast()
    const [isExpanded, setIsExpanded] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)

    if (!visualization || !visualization.data) return null

    const chartTitle = visualization.data?.layout?.title?.text || `Chart ${index + 1}`
    const chartType = visualization.type || 'plotly'

    const handleDownloadChart = () => {
        // Create a download link for the chart data
        const dataStr = JSON.stringify(visualization.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `chart-${messageId}-${index + 1}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
            title: 'Chart Data Downloaded',
            description: 'Chart configuration saved as JSON',
            duration: 2000
        })
    }

    // Detect dark mode
    const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

    // Prepare layout with responsive sizing and dark mode support
    const layout = {
        ...visualization.data.layout,
        autosize: true,
        margin: { l: 50, r: 30, t: 50, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            family: 'ui-sans-serif, system-ui, sans-serif',
            size: 12,
            color: isDarkMode ? '#e5e7eb' : '#374151'
        },
        hoverlabel: {
            bgcolor: isDarkMode ? '#1e293b' : 'white',
            bordercolor: isDarkMode ? '#475569' : '#e5e7eb',
            font: { size: 11, color: isDarkMode ? '#e5e7eb' : '#374151' }
        },
        xaxis: {
            ...visualization.data.layout?.xaxis,
            gridcolor: isDarkMode ? '#334155' : '#e5e7eb',
            color: isDarkMode ? '#e5e7eb' : '#374151'
        },
        yaxis: {
            ...visualization.data.layout?.yaxis,
            gridcolor: isDarkMode ? '#334155' : '#e5e7eb',
            color: isDarkMode ? '#e5e7eb' : '#374151'
        }
    }

    // Config for Plotly
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: `analytica-chart-${index + 1}`,
            height: 800,
            width: 1200,
            scale: 2
        }
    }

    return (
        <>
            <Card className={cn(
                "overflow-hidden border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 transition-all duration-200",
                isFullscreen && "fixed inset-4 z-50 m-0"
            )}>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-cyan-200 dark:border-cyan-800 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                                {chartTitle}
                            </span>
                            <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-0 text-xs">
                                {chartType}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
                                onClick={handleDownloadChart}
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Data
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-3 w-3" />
                                ) : (
                                    <Maximize2 className="h-3 w-3" />
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-cyan-700 hover:bg-cyan-100"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <CardContent className={cn(
                        "bg-white dark:bg-slate-800",
                        isFullscreen ? "p-8 h-[calc(100vh-8rem)] flex items-center justify-center" : "p-6"
                    )}>
                        <div
                            className={cn(
                                "w-full",
                                isFullscreen ? "h-full" : "h-[400px]"
                            )}
                            data-plotly-chart
                        >
                            <Plot
                                data={visualization.data.data}
                                layout={layout}
                                config={config as any}
                                style={{ width: '100%', height: '100%' }}
                                useResizeHandler={true}
                            />
                        </div>
                    </CardContent>
                )}

                {isExpanded && (
                    <div className="bg-white/80 dark:bg-slate-800/80 border-t border-cyan-200 dark:border-cyan-800 px-4 py-2">
                        <div className="flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-300">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" />
                                <span>Interactive visualization powered by Plotly</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3" />
                                <span>Hover for details • Click and drag to zoom</span>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Fullscreen Overlay */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsFullscreen(false)}
                />
            )}
        </>
    )
}
