'use client'

import { Card } from '@/components/ui/card'
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertCircle,
  Sparkles,
  Filter,
  Calendar,
  Users,
  Database,
  Table2,
  BoxSelect,
  BarChart,
  Grid3x3,
  AreaChart
} from 'lucide-react'

interface SuggestionCard {
  icon: React.ReactNode
  title: string
  query: string
  color: string
}

interface TableSchema {
  table_name?: string
  row_count?: number
  columns?: Record<string, {
    sqlite_type?: string
    not_null?: boolean
    is_primary_key?: boolean
    default_value?: any
  }>
  primary_keys?: string[]
  foreign_keys?: Array<{
    column: string
    references_table: string
    references_column: string
  }>
  indexes?: Array<{
    name: string
    unique: boolean
  }>
  relationships?: Record<string, { type: string; references: string }>
}

interface DataInfo {
  numeric_columns?: string[]
  categorical_columns?: string[]
  datetime_columns?: string[]
  shape?: number[]
  // Multi-table schema support
  schema?: {
    // Multi-table format (new)
    tables?: Record<string, TableSchema>
    table_count?: number
    total_rows?: number
    total_columns?: number
    relationships?: Array<{
      from_table: string
      from_column: string
      to_table: string
      to_column: string
    }>
    indexes?: Array<{
      name: string
      unique: boolean
      table?: string
    }>
    // Single-table format (legacy)
    table_name?: string
    primary_keys?: string[]
    foreign_keys?: Array<{
      column: string
      references_table: string
      references_column: string
    }>
    columns?: Record<string, {
      sqlite_type?: string
      not_null?: boolean
      is_primary_key?: boolean
      foreign_key?: { type: string; references: string }
    }>
  }
  // Multi-table info
  tables?: Record<string, TableSchema>
  table_count?: number
  columns?: Record<string, any>
}

interface AISuggestion {
  title: string
  description: string
  visualization_type: 'bar' | 'pie' | 'line' | 'scatter'
  relevant_columns: string[]
  business_priority: 'high' | 'medium' | 'low'
}

interface AnalyticaSuggestionCardsProps {
  onSelectSuggestion: (query: string) => void
  type?: 'initial' | 'followup'
  context?: string
  dataInfo?: DataInfo
  bucketName?: string
  aiSuggestions?: AISuggestion[]
  suggestionsLoading?: boolean
}

export function AnalyticaSuggestionCards({
  onSelectSuggestion,
  type = 'initial',
  context,
  dataInfo,
  bucketName,
  aiSuggestions,
  suggestionsLoading
}: AnalyticaSuggestionCardsProps) {

  // Helper to get table info from multi-table or single-table schema
  const getTableInfo = () => {
    const schema = dataInfo?.schema
    const tables = schema?.tables || dataInfo?.tables

    if (tables && Object.keys(tables).length > 0) {
      // Multi-table format
      const tableNames = Object.keys(tables)
      const tableCount = tableNames.length
      const tableInfoList = tableNames.map(name => {
        const t = tables[name]
        const colCount = t.columns ? Object.keys(t.columns).length : 0
        const rowCount = t.row_count || 0
        return { name, columns: t.columns || {}, rowCount, colCount, primaryKeys: t.primary_keys || [] }
      })
      return { isMultiTable: tableCount > 1, tableCount, tables: tableInfoList, tableNames }
    } else if (schema?.table_name) {
      // Single-table format (legacy)
      return {
        isMultiTable: false,
        tableCount: 1,
        tables: [{
          name: schema.table_name,
          columns: schema.columns || {},
          rowCount: dataInfo?.shape?.[0] || 0,
          colCount: dataInfo?.shape?.[1] || 0,
          primaryKeys: schema.primary_keys || []
        }],
        tableNames: [schema.table_name]
      }
    }

    return { isMultiTable: false, tableCount: 0, tables: [], tableNames: [] }
  }

  const tableInfo = getTableInfo()

  // Get cross-table relationships
  const getRelationships = () => {
    const schema = dataInfo?.schema
    // Multi-table format has relationships array
    if (schema?.relationships && Array.isArray(schema.relationships)) {
      return schema.relationships
    }
    // Legacy format has foreign_keys
    if (schema?.foreign_keys) {
      return schema.foreign_keys.map(fk => ({
        from_table: schema.table_name || 'unknown',
        from_column: fk.column,
        to_table: fk.references_table,
        to_column: fk.references_column
      }))
    }
    return []
  }

  const relationships = getRelationships()

  // Helper to build context-aware query prefix with schema information
  const buildQueryPrefix = () => {
    if (!dataInfo) return ''

    const parts: string[] = []

    // Multi-table info
    if (tableInfo.isMultiTable) {
      parts.push(`Database with ${tableInfo.tableCount} tables: ${tableInfo.tableNames.join(', ')}`)
    } else if (tableInfo.tableNames.length === 1) {
      parts.push(`Table: ${tableInfo.tableNames[0]}`)
    }

    // Add primary key info from all tables
    const allPrimaryKeys: string[] = []
    tableInfo.tables.forEach(t => {
      if (t.primaryKeys.length > 0) {
        allPrimaryKeys.push(`${t.name}: ${t.primaryKeys.join(', ')}`)
      }
    })
    if (allPrimaryKeys.length > 0) {
      parts.push(`Primary key(s): ${allPrimaryKeys.join('; ')}`)
    }

    if (dataInfo.numeric_columns && dataInfo.numeric_columns.length > 0) {
      parts.push(`Numeric columns: ${dataInfo.numeric_columns.slice(0, 5).join(', ')}${dataInfo.numeric_columns.length > 5 ? ` and ${dataInfo.numeric_columns.length - 5} more` : ''}`)
    }

    if (dataInfo.categorical_columns && dataInfo.categorical_columns.length > 0) {
      parts.push(`Categorical columns: ${dataInfo.categorical_columns.slice(0, 3).join(', ')}${dataInfo.categorical_columns.length > 3 ? ` and ${dataInfo.categorical_columns.length - 3} more` : ''}`)
    }

    if (dataInfo.datetime_columns && dataInfo.datetime_columns.length > 0) {
      parts.push(`Date/Time columns: ${dataInfo.datetime_columns.join(', ')}`)
    }

    // Add cross-table relationships
    if (relationships.length > 0) {
      const relDescriptions = relationships.slice(0, 3).map(rel =>
        `${rel.from_table}.${rel.from_column} → ${rel.to_table}.${rel.to_column}`
      )
      parts.push(`Relationships: ${relDescriptions.join(', ')}${relationships.length > 3 ? ` and ${relationships.length - 3} more` : ''}`)
    }

    if (parts.length === 0) return ''

    return `For this dataset with ${parts.join('; ')}: `
  }

  const queryPrefix = buildQueryPrefix()
  const hasTimeData = dataInfo?.datetime_columns && dataInfo.datetime_columns.length > 0
  const hasCategoricalData = dataInfo?.categorical_columns && dataInfo.categorical_columns.length > 0
  const hasNumericData = dataInfo?.numeric_columns && dataInfo.numeric_columns.length > 0
  const hasRelationships = relationships.length > 0
  const isMultiTable = tableInfo.isMultiTable
  const primaryKey = tableInfo.tables[0]?.primaryKeys?.[0]

  // Build suggestion cards based on data characteristics
  const baseSuggestions: SuggestionCard[] = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: hasTimeData ? 'Time Series Trends' : 'Overall Trends & Patterns',
      query: queryPrefix + (hasTimeData
        ? `Analyze temporal trends and patterns over time with comprehensive visualizations including time series plots, trend lines, moving averages, seasonal decomposition, and correlation analysis`
        : `Analyze overall trends, patterns, and key metrics in the dataset with comprehensive visualizations including distribution plots, correlation heatmaps, and relationship charts`),
      color: 'blue'
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: hasCategoricalData ? 'Top Categories & Rankings' : 'Top Performers & Rankings',
      query: queryPrefix + (hasCategoricalData
        ? `Identify top categories, rankings, and distributions across ${dataInfo?.categorical_columns?.[0] || 'categorical fields'} with detailed breakdowns, comparative bar charts, and percentage analysis`
        : `Identify top performers, rankings, and outliers with detailed breakdowns, comparative analysis, and performance segmentation charts`),
      color: 'green'
    }
  ]

  // Add multi-table cross-analysis if multiple tables exist
  if (isMultiTable) {
    baseSuggestions.push({
      icon: <Users className="h-5 w-5" />,
      title: `Cross-Table Analysis (${tableInfo.tableCount} tables)`,
      query: queryPrefix + `Analyze relationships across all ${tableInfo.tableCount} tables (${tableInfo.tableNames.join(', ')}) with JOIN operations where applicable, cross-table aggregations, comparative metrics between tables, and relationship mapping`,
      color: 'teal'
    })
  } else if (hasRelationships && relationships[0]) {
    // Single table with foreign keys
    const rel = relationships[0]
    baseSuggestions.push({
      icon: <Users className="h-5 w-5" />,
      title: `${rel.from_column} Relationships`,
      query: queryPrefix + `Analyze relationships and patterns based on ${rel.from_column} (references ${rel.to_table}.${rel.to_column}) with grouping analysis, aggregations by relationship, distribution across related entities, and comparative metrics`,
      color: 'teal'
    })
  } else {
    baseSuggestions.push({
      icon: <PieChart className="h-5 w-5" />,
      title: hasCategoricalData ? `${dataInfo?.categorical_columns?.[0] || 'Category'} Distribution` : 'Category Distribution',
      query: queryPrefix + `Provide comprehensive distribution analysis with multiple visualization types including pie charts, bar charts, treemaps, and detailed breakdown tables with percentages and counts`,
      color: 'purple'
    })
  }

  baseSuggestions.push(
    {
      icon: <Activity className="h-5 w-5" />,
      title: hasNumericData ? `Stats for ${dataInfo?.numeric_columns?.[0] || 'Metrics'}` : 'Statistical Summary',
      query: queryPrefix + (hasNumericData
        ? `Generate complete statistical summary for ${dataInfo?.numeric_columns?.slice(0, 3).join(', ')}${(dataInfo?.numeric_columns?.length || 0) > 3 ? ' and other metrics' : ''} with descriptive stats, quartile analysis, variance measures, skewness, kurtosis, histograms, and box plots`
        : `Generate a complete statistical summary with descriptive statistics, quartile analysis, variance measures, and distribution visualizations`),
      color: 'orange'
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: 'Anomalies & Outliers',
      query: queryPrefix + `Detect and visualize anomalies, outliers, and unusual patterns using statistical methods, box plots, scatter plots, and z-score analysis with detailed explanations of potential data quality issues`,
      color: 'red'
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      title: 'Data Quality Check',
      query: queryPrefix + `Perform thorough data quality assessment including missing values analysis, duplicate detection${primaryKey ? `, primary key (${primaryKey}) uniqueness validation` : ''}, completeness metrics per column, data type verification, value distribution, and outlier detection with visual reports`,
      color: 'amber'
    }
  )

  const initialSuggestions = baseSuggestions

  const followupSuggestions: SuggestionCard[] = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'Deeper Dive',
      query: queryPrefix + `Based on the previous analysis, dive deeper with segmentation analysis, cohort breakdowns, multi-dimensional visualizations, and correlation analysis between key metrics`,
      color: 'indigo'
    },
    {
      icon: <Filter className="h-5 w-5" />,
      title: hasCategoricalData ? `Filter by ${dataInfo?.categorical_columns?.[0]}` : 'Filtered Analysis',
      query: queryPrefix + (hasCategoricalData
        ? `Show filtered analysis grouped by ${dataInfo?.categorical_columns?.[0]} with comparative visualizations, statistical breakdowns, and side-by-side comparisons of top segments`
        : `Show filtered analysis for specific segments with comparative visualizations and detailed statistical breakdowns`),
      color: 'cyan'
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: hasTimeData ? `${dataInfo?.datetime_columns?.[0]} Trends` : 'Time-based Analysis',
      query: queryPrefix + (hasTimeData
        ? `Analyze patterns over ${dataInfo?.datetime_columns?.[0]} with time series decomposition, seasonal trends, moving averages, year-over-year comparisons, and forecasting visualizations`
        : `Analyze temporal patterns with time series analysis, seasonal trends, and moving averages`),
      color: 'pink'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: hasCategoricalData ? `Compare ${dataInfo?.categorical_columns?.[0]} Segments` : 'Segment Comparison',
      query: queryPrefix + (hasCategoricalData
        ? `Compare different ${dataInfo?.categorical_columns?.[0]} segments side-by-side with comparative bar charts, statistical tests, performance metrics, and trend analysis for each segment`
        : `Compare different segments side-by-side with comparative charts, statistical tests, and performance metrics`),
      color: 'teal'
    }
  ]

  // Convert AI suggestions to SuggestionCards
  const getIconForVizType = (vizType: string) => {
    switch (vizType) {
      case 'bar': return <BarChart3 className="h-5 w-5" />
      case 'pie': return <PieChart className="h-5 w-5" />
      case 'line': return <TrendingUp className="h-5 w-5" />
      case 'scatter': return <Activity className="h-5 w-5" />
      case 'boxplot': return <BoxSelect className="h-5 w-5" />
      case 'histogram': return <BarChart className="h-5 w-5" />
      case 'heatmap': return <Grid3x3 className="h-5 w-5" />
      case 'area': return <AreaChart className="h-5 w-5" />
      case 'violin': return <Activity className="h-5 w-5" />
      default: return <Sparkles className="h-5 w-5" />
    }
  }

  const getColorForPriority = (priority: string): string => {
    switch (priority) {
      case 'high': return 'blue'
      case 'medium': return 'green'
      case 'low': return 'purple'
      default: return 'indigo'
    }
  }

  const convertAISuggestionsToCards = (suggestions: AISuggestion[]): SuggestionCard[] => {
    return suggestions.map(suggestion => ({
      icon: getIconForVizType(suggestion.visualization_type),
      title: suggestion.title,
      query: queryPrefix + `${suggestion.description} Focus on columns: ${suggestion.relevant_columns.join(', ')}. Visualize using a ${suggestion.visualization_type} chart.`,
      color: getColorForPriority(suggestion.business_priority)
    }))
  }

  // Use AI suggestions if available, otherwise fall back to static suggestions
  // BUT: Don't show fallback suggestions if we're currently loading AI suggestions
  const hasAISuggestions = aiSuggestions && aiSuggestions.length > 0
  const aiSuggestionCards = hasAISuggestions ? convertAISuggestionsToCards(aiSuggestions) : []

  // Don't show suggestions while loading AI insights on initial load
  if (type === 'initial' && suggestionsLoading && !hasAISuggestions) {
    // Show only loading message, no cards
    return (
      <div className="w-full px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              🤖 AI-Powered Insights
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Generating AI insights...</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while we analyze your data
            </p>
          </div>
        </div>
      </div>
    )
  }

  const suggestions = hasAISuggestions
    ? aiSuggestionCards
    : (type === 'initial' ? initialSuggestions : followupSuggestions)

  const colorClasses = {
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700 text-blue-900 dark:text-blue-100',
    green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/60 hover:border-green-300 dark:hover:border-green-700 text-green-900 dark:text-green-100',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700 text-purple-900 dark:text-purple-100',
    orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 hover:border-orange-300 dark:hover:border-orange-700 text-orange-900 dark:text-orange-100',
    red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 hover:border-red-300 dark:hover:border-red-700 text-red-900 dark:text-red-100',
    amber: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700 text-amber-900 dark:text-amber-100',
    indigo: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 text-indigo-900 dark:text-indigo-100',
    cyan: 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 hover:border-cyan-300 dark:hover:border-cyan-700 text-cyan-900 dark:text-cyan-100',
    pink: 'border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60 hover:border-pink-300 dark:hover:border-pink-700 text-pink-900 dark:text-pink-100',
    teal: 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 hover:border-teal-300 dark:hover:border-teal-700 text-teal-900 dark:text-teal-100'
  }

  return (
    <div className="w-full px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {type === 'initial' ? (
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {hasAISuggestions ? '🤖 AI-Powered Insights' : '💡 Explore Your Data'}
            </h3>
            {suggestionsLoading && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Generating AI insights...</span>
              </div>
            )}
            {isMultiTable ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p className="flex items-center justify-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">{tableInfo.tableCount} tables available:</span>
                  <span>{tableInfo.tableNames.slice(0, 3).join(', ')}{tableInfo.tableNames.length > 3 ? ` +${tableInfo.tableNames.length - 3} more` : ''}</span>
                </p>
                <p>Click any suggestion below to start your analysis</p>
              </div>
            ) : tableInfo.tableNames.length === 1 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p className="flex items-center justify-center gap-2">
                  <Table2 className="h-4 w-4" />
                  <span>Table: <span className="font-medium text-gray-900 dark:text-gray-200">{tableInfo.tableNames[0]}</span></span>
                  {tableInfo.tables[0]?.rowCount > 0 && (
                    <span className="text-gray-500 dark:text-gray-500">({tableInfo.tables[0].rowCount.toLocaleString()} rows)</span>
                  )}
                </p>
                <p>Click any suggestion below to start your analysis</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click any suggestion below to start your analysis
              </p>
            )}
          </div>
        ) : (
          <div className="text-center mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🔍 Suggested Follow-ups
            </h4>
          </div>
        )}

        <div className={`grid gap-3 ${type === 'initial' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className={`p-4 cursor-pointer transition-all duration-200 border-2 ${colorClasses[suggestion.color as keyof typeof colorClasses]
                }`}
              onClick={() => onSelectSuggestion(suggestion.query)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1 leading-tight">
                    {suggestion.title}
                  </h4>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Generate More Insights Button */}
        {type === 'followup' && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => onSelectSuggestion(queryPrefix + "Generate additional insights and analysis opportunities that haven't been explored yet. Focus on unique perspectives, cross-dimensional analysis, and actionable recommendations.")}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate More Insights
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
