'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ScrollText,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  Shield,
  FileText,
  Tag,
  Plus,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { POLICY_TEMPLATES } from './CreatePolicy'

const FRAMEWORK_COLORS: Record<string, string> = {
  soc2: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  hipaa: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  pci_dss: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  gdpr: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  iso27001: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  owasp: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  nist_csf: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  ccpa: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  fedramp: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  custom: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const BUILT_IN_TEMPLATES = [
  { framework: 'soc2', label: 'SOC 2', desc: 'Trust service criteria for security, availability, and confidentiality' },
  { framework: 'hipaa', label: 'HIPAA', desc: 'Safeguards for electronic protected health information (ePHI)' },
  { framework: 'pci_dss', label: 'PCI DSS', desc: 'Payment card industry data security requirements' },
  { framework: 'gdpr', label: 'GDPR', desc: 'EU data protection and privacy regulation' },
  { framework: 'iso27001', label: 'ISO 27001', desc: 'Information security management system controls' },
  { framework: 'owasp', label: 'OWASP Top 10', desc: 'Top 10 web application security risks' },
  { framework: 'nist_csf', label: 'NIST CSF', desc: 'Cybersecurity framework for managing security risk' },
  { framework: 'ccpa', label: 'CCPA', desc: 'California consumer privacy and data protection' },
  { framework: 'fedramp', label: 'FedRAMP', desc: 'Federal security controls for cloud services' },
]

export function PolicyList() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<any>(null)
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null)
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null)

  const { data: policiesData, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: () => apiClient.getPolicies(),
  })

  const deletePolicyMutation = useMutation({
    mutationFn: (policyId: string) => apiClient.deletePolicy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      setIsDeleteDialogOpen(false)
      setPolicyToDelete(null)
      toast({ title: 'Success', description: 'Policy deleted' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete policy', variant: 'destructive' })
    },
  })

  const addTemplateMutation = useMutation({
    mutationFn: async (framework: string) => {
      const template = POLICY_TEMPLATES[framework]
      if (!template) throw new Error('Template not found')
      setAddingTemplate(framework)
      return apiClient.createPolicy({
        name: template.name,
        description: template.description,
        content: template.content,
        framework,
        tags: template.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      })
    },
    onSuccess: (_, framework) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      const label = BUILT_IN_TEMPLATES.find(t => t.framework === framework)?.label || framework
      toast({ title: 'Policy added', description: `${label} policy is ready to use in assessments` })
      setAddingTemplate(null)
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to add policy', variant: 'destructive' })
      setAddingTemplate(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#146f84] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading policies...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">Failed to load policies.</AlertDescription>
      </Alert>
    )
  }

  const policies = policiesData?.data?.policies || []

  // Find which templates haven't been added yet
  const existingFrameworks = new Set(policies.map((p: any) => p.framework))
  const availableTemplates = BUILT_IN_TEMPLATES.filter(t => !existingFrameworks.has(t.framework))

  return (
    <>
      {/* Built-in Template Gallery */}
      {availableTemplates.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Quick Add Compliance Policies
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {availableTemplates.map((template) => {
              const isAdding = addingTemplate === template.framework
              const alreadyAdded = existingFrameworks.has(template.framework)
              return (
                <button
                  key={template.framework}
                  onClick={() => !isAdding && !alreadyAdded && addTemplateMutation.mutate(template.framework)}
                  disabled={isAdding || alreadyAdded}
                  className={cn(
                    "relative p-4 rounded-md border-2 border-dashed text-left transition-all",
                    isAdding
                      ? "border-[#146f84]/40 bg-[#146f84]/5 cursor-wait"
                      : alreadyAdded
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 cursor-default"
                        : "border-slate-200 dark:border-slate-700 hover:border-[#146f84]/50 hover:bg-[#146f84]/5 cursor-pointer"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn("text-xs border-0", FRAMEWORK_COLORS[template.framework] || FRAMEWORK_COLORS.custom)}>
                      {template.label}
                    </Badge>
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 text-[#146f84] animate-spin" />
                    ) : alreadyAdded ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{template.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Existing Policies */}
      {policies.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-[#146f84]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ScrollText className="h-7 w-7 text-[#146f84]" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">No Policies Yet</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
            Click a template above to add it instantly, or create a custom policy
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((policy: any) => (
            <Card
              key={policy.policy_id}
              className={cn(
                "p-5 transition-all duration-200 group border cursor-pointer bg-white dark:bg-[#1c2128] border-slate-200 dark:border-slate-800 hover:border-blue-400/40 dark:hover:border-blue-500/30 rounded-md",
                expandedPolicy === policy.policy_id && "border-[#146f84]/40 dark:border-[#146f84]/40"
              )}
              onClick={() => setExpandedPolicy(
                expandedPolicy === policy.policy_id ? null : policy.policy_id
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{policy.name}</h3>
                  <Badge className={cn("text-xs mt-1 border-0", FRAMEWORK_COLORS[policy.framework] || FRAMEWORK_COLORS.custom)}>
                    {policy.framework.toUpperCase()}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPolicyToDelete(policy)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {policy.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{policy.description}</p>
              )}

              {/* Tags */}
              {policy.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {policy.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Expanded content preview */}
              {expandedPolicy === policy.policy_id && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-[#0d1117] rounded-md border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <FileText className="h-3 w-3" />
                    Policy Content Preview
                  </div>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {policy.content?.substring(0, 500)}
                    {(policy.content?.length || 0) > 500 && '...'}
                  </pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{policyToDelete?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => policyToDelete && deletePolicyMutation.mutate(policyToDelete.policy_id)}
              disabled={deletePolicyMutation.isPending}
            >
              {deletePolicyMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
