import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Database, Loader2, Trash2 } from 'lucide-react'

import ConnectorConfigDialog from '@/components/connectors/ConnectorConfigDialog'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'

interface CustomConnector {
  connector_id: string
  connector_type?: string
  name: string
  display_name?: string
  instance_name?: string
  category?: string
  description?: string
  base_url: string
  auth_type: string
  endpoints: any[]
  is_active: boolean
  is_configured?: boolean
  created_at: string
  usage_count: number
}

export default function ConnectorDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [connector, setConnector] = useState<CustomConnector | null>(
    (location.state?.connector as CustomConnector | null) ?? null
  )
  const [isLoading, setIsLoading] = useState(!location.state?.connector)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadConnector = async () => {
      if (!id) {
        setIsLoading(false)
        return
      }

      if (connector?.connector_id === id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        const directResponse = await apiClient.connectors.getCustom(id).catch(() => null)
        const directConnector = directResponse?.success
          ? directResponse.data?.data || directResponse.data?.connector || directResponse.data
          : null

        if (directConnector?.connector_id) {
          setConnector(directConnector)
          return
        }

        const listResponse = await apiClient.connectors.listCustom().catch(() => null)
        const connectors = listResponse?.success
          ? listResponse.data?.data?.connectors || listResponse.data?.connectors || []
          : []
        const matchedConnector = connectors.find((item: CustomConnector) => item.connector_id === id) || null
        setConnector(matchedConnector)
      } catch (error) {
        console.error('Failed to load connector details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConnector()
  }, [connector?.connector_id, id])

  const handleDelete = async () => {
    if (!connector) return
    if (!confirm(`Delete "${connector.instance_name || connector.display_name || connector.name}"?`)) return

    try {
      setIsDeleting(true)
      const response = await apiClient.connectors.deleteCustom(connector.connector_id)

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete connector')
      }

      toast({
        title: 'Connector Deleted',
        description: 'Connector removed successfully',
        duration: 2000,
      })
      navigate('/connectors')
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete connector',
        variant: 'destructive',
        duration: 2000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#edf2f7] dark:bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-slate-500 dark:text-slate-300" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading connector details...</p>
        </div>
      </div>
    )
  }

  if (!connector || connector.connector_type !== 'pyairbyte') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#edf2f7] dark:bg-[#0d1117]">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-[#0f1724]">
          <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Connector Not Found</h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            The connector detail page is available for configured marketplace connectors only.
          </p>
          <Button onClick={() => navigate('/connectors')} className="bg-[#105e6e] text-white hover:bg-[#0d4c59]">
            Back to Connectors
          </Button>
        </div>
      </div>
    )
  }

  const connectorTitle = connector.instance_name || connector.display_name || connector.name

  return (
    <div className="min-h-full bg-[#edf2f7] dark:bg-[#0d1117]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-2">
          <Breadcrumbs />
        </div>

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {connectorTitle}
              </h1>
              <Badge className="bg-[#105e6e] text-white hover:bg-[#105e6e]">
                {connector.is_active ? 'active' : 'inactive'}
              </Badge>
              <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">
                {connector.category || 'Other'}
              </Badge>
            </div>

            <p className="max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-400">
              {connector.description || 'Set up credentials and choose which streams to sync for this connector.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                {connector.is_configured ? 'Configured' : 'Not configured'}
              </div>
              <div>{connector.base_url || 'PyAirbyte connector'}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/connectors')}
              className="dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-[#182234]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#08111d]">
          <ConnectorConfigDialog
            connector={{
              connector_id: connector.connector_id,
              name: connector.name,
              display_name: connector.display_name || connector.name,
              category: connector.category || 'Other',
              description: connector.description || '',
              is_configured: connector.is_configured,
            }}
            onComplete={() => {
              toast({
                title: 'Configuration Complete',
                description: `${connectorTitle} is ready to use`,
                duration: 2000,
              })
              navigate('/connectors')
            }}
            onCancel={() => navigate('/connectors')}
          />
        </div>
      </div>
    </div>
  )
}
