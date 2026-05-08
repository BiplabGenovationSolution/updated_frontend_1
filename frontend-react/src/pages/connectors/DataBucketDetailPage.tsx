import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Database, FileText, HardDrive, Rows3,
  Columns3, Calendar, Loader2, AlertCircle, Hash,
  Type, Clock, ToggleLeft
} from 'lucide-react'
import { DIRECT_BACKEND_URL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

// ─── Types ─────────────────────────────────────────────────────────────────

interface ColumnInfo {
  sqlite_type: string
  not_null: boolean
  default_value: string | null
  is_primary_key: boolean
}

interface BucketFile {
  filename: string
  table_name: string
  file_type: string
  file_size: number
  row_count: number
  column_count: number
  columns: Record<string, ColumnInfo>
  uploaded_at: string
}

interface DataInfo {
  numeric_columns: string[]
  categorical_columns: string[]
  datetime_columns: string[]
  data_quality: {
    total_missing: number
    complete_rows: number
    duplicate_rows: number
    data_completeness: number
  }
}

interface Bucket {
  bucket_id: string
  name: string
  description: string | null
  files: BucketFile[]
  table_count: number
  file_type: string
  file_size: number
  row_count: number
  column_count: number
  data_info: DataInfo
  access_count: number
  created_at: string
  updated_at: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${bytes} B`
}

function formatRows(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const TYPE_ICON: Record<string, React.ElementType> = {
  INTEGER: Hash,
  REAL: Hash,
  TEXT: Type,
  TIMESTAMP: Clock,
  DATE: Calendar,
}

function TypeBadge({ sqlType, categorized }: { sqlType: string; categorized: 'numeric' | 'categorical' | 'datetime' | 'other' }) {
  const Icon = TYPE_ICON[sqlType] ?? ToggleLeft
  const colorMap = {
    numeric: 'bg-[#146f84]/10 text-[#146f84] border-[#146f84]/20',
    categorical: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30',
    datetime: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    other: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-600',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border', colorMap[categorized])}>
      <Icon className="h-2.5 w-2.5" />
      {sqlType}
    </span>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function DataBucketDetailPage() {
  const { bucketId } = useParams<{ bucketId: string }>()
  const navigate = useNavigate()
  const [bucket, setBucket] = useState<Bucket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<BucketFile | null>(null)

  useEffect(() => {
    if (!bucketId) return
    const controller = new AbortController()

    const fetchBucket = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('mentis_auth_token')
        const res = await fetch(`${DIRECT_BACKEND_URL}/analytica/buckets/${bucketId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load bucket')
        setBucket(data.bucket)
        if (data.bucket.files?.length) setActiveFile(data.bucket.files[0])
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message || 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchBucket()
    return () => controller.abort()
  }, [bucketId])

  if (isLoading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#146f84]" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading bucket data...</p>
      </div>
    </div>
  )

  if (error || !bucket) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{error || 'Bucket not found'}</p>
        <button onClick={() => navigate('/hub?tab=buckets')} className="text-sm text-[#146f84] hover:underline">← Back to Hub</button>
      </div>
    </div>
  )

  // Determine column category
  const getCategory = (colName: string): 'numeric' | 'categorical' | 'datetime' | 'other' => {
    const di = bucket.data_info
    if (di.numeric_columns?.includes(colName)) return 'numeric'
    if (di.categorical_columns?.includes(colName)) return 'categorical'
    if (di.datetime_columns?.includes(colName)) return 'datetime'
    return 'other'
  }

  const dq = bucket.data_info?.data_quality

  return (
    <div className="min-h-full bg-[#EEF2F7] dark:bg-[#0d1117] p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs />

        {/* Title row */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-white truncate">{bucket.name}</h1>
            {bucket.description && (
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{bucket.description}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            { label: 'Rows', sub: 'Total records', value: formatRows(bucket.row_count) },
            { label: 'Columns', sub: 'Data fields', value: `${bucket.column_count}` },
            { label: 'Size', sub: 'File size', value: formatBytes(bucket.file_size) },
            { label: 'Created', sub: 'Upload date', value: formatDate(bucket.created_at) },
          ].map(({ label, sub, value }) => (
            <div key={label} className="flex items-center justify-between p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2128] hover:border-blue-400/40 dark:hover:border-blue-500/30 transition-all duration-200">
              <div className="flex flex-col">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</h3>
            </div>
          ))}
        </div>

        {/* Data Quality strip */}
        {dq && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Completeness', sub: 'Data health', value: `${dq.data_completeness}%`, color: dq.data_completeness === 100 ? 'text-emerald-500' : 'text-amber-500' },
              { label: 'Complete Rows', sub: 'Full records', value: formatRows(dq.complete_rows), color: 'text-slate-900 dark:text-white' },
              { label: 'Missing', sub: 'Null values', value: `${dq.total_missing}`, color: dq.total_missing === 0 ? 'text-emerald-500' : 'text-red-500' },
              { label: 'Duplicates', sub: 'Repeated rows', value: `${dq.duplicate_rows}`, color: dq.duplicate_rows === 0 ? 'text-emerald-500' : 'text-amber-500' },
            ].map(({ label, sub, value, color }) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2128] hover:border-blue-400/40 dark:hover:border-blue-500/30 transition-all duration-200">
                <div className="flex flex-col">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
                </div>
                <h3 className={cn("text-2xl font-bold tabular-nums", color)}>{value}</h3>
              </div>
            ))}
          </div>
        )}

        {/* Files tab selector */}
        {bucket.files.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {bucket.files.map((f) => (
              <button
                key={f.table_name}
                onClick={() => setActiveFile(f)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors whitespace-nowrap',
                  activeFile?.table_name === f.table_name
                    ? 'bg-[#146f84] text-white border-[#146f84]'
                    : 'bg-white dark:bg-[#1c2128] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#146f84]'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {f.filename}
              </button>
            ))}
          </div>
        )}

        {/* Schema table */}
        {activeFile && (
          <div className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">Schema — {activeFile.table_name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeFile.column_count} columns · {formatRows(activeFile.row_count)} rows</p>
              </div>
              <span className="text-[11px] bg-slate-100 dark:bg-[#0d1117] text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 font-medium uppercase tracking-wide">{activeFile.file_type}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0d1117]">
                    {['Column', 'Type', 'Category', 'Nullable', 'Primary Key'].map((h) => (
                      <th key={h} className="px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(activeFile.columns).map(([colName, info], i) => {
                    const cat = getCategory(colName)
                    const catLabel = cat === 'other' ? '' : cat
                    const catColors: Record<string, string> = {
                      numeric: 'text-blue-600 dark:text-blue-400',
                      categorical: 'text-violet-600 dark:text-violet-400',
                      datetime: 'text-amber-600 dark:text-amber-400',
                    }
                    return (
                      <tr
                        key={colName}
                        className={cn(
                          'border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2035]',
                          i % 2 === 0
                            ? 'bg-white dark:bg-[#1c2128]'
                            : 'bg-slate-50/60 dark:bg-[#16203a]/40'
                        )}
                      >
                        <td className="px-5 py-3 font-mono text-[12px] text-slate-900 dark:text-white font-semibold">{colName}</td>
                        <td className="px-5 py-3">
                          <TypeBadge sqlType={info.sqlite_type} categorized={cat} />
                        </td>
                        <td className={cn('px-5 py-3 text-[12px] font-medium capitalize', catColors[cat] || 'text-slate-400')}>
                          {catLabel}
                        </td>
                        <td className="px-5 py-3 text-[12px]">
                          {info.not_null
                            ? <span className="text-red-500 font-medium">NOT NULL</span>
                            : <span className="text-slate-400">nullable</span>}
                        </td>
                        <td className="px-5 py-3 text-[12px]">
                          {info.is_primary_key
                            ? <span className="text-[#146f84] font-semibold">PK</span>
                            : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
