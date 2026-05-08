// frontend/src/app/settings/api-keys/page.tsx
import { useState, useEffect } from 'react'
import { useOrganization } from '@/context/OrganizationContext'
import { governanceAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import {
  Key,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Trash2,
  RefreshCw,
  Eye,
  Copy,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Shield
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function APIKeysPage() {
  const { currentOrganization, isOwner, isAdmin } = useOrganization()
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    description: '',
    scopes: ['chat', 'read'],
    expires_in_days: 0,
    ip_whitelist: [] as string[]
  })

  // Key display dialog
  const [keyDisplayDialogOpen, setKeyDisplayDialogOpen] = useState(false)
  const [displayedKey, setDisplayedKey] = useState<{key: string, name: string} | null>(null)

  // Details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<any>(null)
  const [keyUsage, setKeyUsage] = useState<any>(null)

  // Revoke dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<any>(null)

  // Rotate dialog state
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false)
  const [keyToRotate, setKeyToRotate] = useState<any>(null)

  const canManageKeys = isOwner || isAdmin

  useEffect(() => {
    if (currentOrganization) {
      loadAPIKeys()
    }
  }, [currentOrganization])

  const loadAPIKeys = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const response = await governanceAPI.apiKeys.list({
        organization_id: currentOrganization.organization_id
      })

      if (response.success && response.data) {
        setApiKeys(response.data.api_keys || [])
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load API keys',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load API keys',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!currentOrganization || !newKeyData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a key name',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    try {
      setCreating(true)

      const response = await governanceAPI.apiKeys.create({
        organization_id: currentOrganization.organization_id,
        name: newKeyData.name,
        description: newKeyData.description || undefined,
        scopes: newKeyData.scopes,
        expires_in_days: newKeyData.expires_in_days > 0 ? newKeyData.expires_in_days : undefined,
        ip_whitelist: newKeyData.ip_whitelist.length > 0 ? newKeyData.ip_whitelist : undefined
      })

      if (response.success && response.data) {
        toast({
          title: 'API Key Created',
          description: 'Your API key has been created successfully. Save it now - it won\'t be shown again!',
          duration: 2000
        })

        // Show the key in a dialog
        setDisplayedKey({
          key: response.data.api_key.api_key,
          name: response.data.api_key.name
        })
        setKeyDisplayDialogOpen(true)

        // Reset form
        setNewKeyData({
          name: '',
          description: '',
          scopes: ['chat', 'read'],
          expires_in_days: 0,
          ip_whitelist: []
        })
        setCreateDialogOpen(false)

        // Reload keys
        loadAPIKeys()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create API key',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create API key',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setCreating(false)
    }
  }

  const handleViewDetails = async (key: any) => {
    setSelectedKey(key)

    // Load usage stats
    try {
      const response = await governanceAPI.apiKeys.getUsage(
        key.api_key_id,
        currentOrganization!.organization_id,
        30
      )
      if (response.success && response.data) {
        setKeyUsage(response.data)
      }
    } catch (error) {
      console.error('Failed to load usage:', error)
    }

    setDetailsDialogOpen(true)
  }

  const handleRevokeKey = async () => {
    if (!keyToRevoke || !currentOrganization) return

    try {
      const response = await governanceAPI.apiKeys.revoke(
        keyToRevoke.api_key_id,
        currentOrganization.organization_id,
        'Revoked by user'
      )

      if (response.success) {
        toast({
          title: 'API Key Revoked',
          description: 'The API key has been revoked and can no longer be used',
          duration: 2000
        })
        loadAPIKeys()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to revoke API key',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke API key',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setRevokeDialogOpen(false)
      setKeyToRevoke(null)
    }
  }

  const handleRotateKey = async () => {
    if (!keyToRotate || !currentOrganization) return

    try {
      const response = await governanceAPI.apiKeys.rotate(
        keyToRotate.api_key_id,
        currentOrganization.organization_id
      )

      if (response.success && response.data) {
        toast({
          title: 'API Key Rotated',
          description: 'A new key has been generated. Save it now - it won\'t be shown again!',
          duration: 2000
        })

        // Show the new key
        setDisplayedKey({
          key: response.data.api_key.api_key,
          name: response.data.api_key.name
        })
        setKeyDisplayDialogOpen(true)

        loadAPIKeys()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to rotate API key',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rotate API key',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setRotateDialogOpen(false)
      setKeyToRotate(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
      duration: 2000
    })
  }

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          key.key_prefix.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No organization selected</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-gray-500 mt-2">
          Manage API keys for external access to your custom agents
        </p>
      </div>

      {/* API Keys Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Create and manage API keys for programmatic access
              </CardDescription>
            </div>
            {canManageKeys && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search API keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* API Keys Table */}
          {filteredKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No API keys found' : 'No API keys yet'}
              {canManageKeys && !searchQuery && (
                <div className="mt-4">
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First API Key
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.api_key_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{key.name}</div>
                        {key.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {key.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {key.key_prefix}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(key.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {key.scopes.map((scope: string) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{key.usage.total_requests.toLocaleString()} requests</div>
                        {key.usage.last_used_at && (
                          <div className="text-xs text-gray-500">
                            Last used: {new Date(key.usage.last_used_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(key)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canManageKeys && key.status === 'active' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setKeyToRotate(key)
                                setRotateDialogOpen(true)
                              }}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Rotate Key
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setKeyToRevoke(key)
                                  setRevokeDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Revoke
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external access to your custom agents.
              The key will be shown only once after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="key-name">Name *</Label>
              <Input
                id="key-name"
                placeholder="Production API Key"
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="key-description">Description</Label>
              <Textarea
                id="key-description"
                placeholder="Used for production mobile app integration"
                value={newKeyData.description}
                onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Scopes</Label>
              <div className="space-y-2 mt-2">
                {['chat', 'read', 'write'].map((scope) => (
                  <div key={scope} className="flex items-center space-x-2">
                    <Checkbox
                      id={`scope-${scope}`}
                      checked={newKeyData.scopes.includes(scope)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewKeyData({
                            ...newKeyData,
                            scopes: [...newKeyData.scopes, scope]
                          })
                        } else {
                          setNewKeyData({
                            ...newKeyData,
                            scopes: newKeyData.scopes.filter(s => s !== scope)
                          })
                        }
                      }}
                    />
                    <Label htmlFor={`scope-${scope}`} className="cursor-pointer">
                      {scope}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expires-in">Expires In (days, 0 = never)</Label>
              <Input
                id="expires-in"
                type="number"
                min="0"
                placeholder="90"
                value={newKeyData.expires_in_days}
                onChange={(e) => setNewKeyData({
                  ...newKeyData,
                  expires_in_days: parseInt(e.target.value) || 0
                })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Key Display Dialog */}
      <Dialog open={keyDisplayDialogOpen} onOpenChange={setKeyDisplayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Save this key now. For security reasons, it won't be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  Make sure to copy your API key now. You won't be able to see it again!
                </div>
              </div>
            </div>

            {displayedKey && (
              <div>
                <Label>API Key for "{displayedKey.name}"</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={displayedKey.key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(displayedKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setKeyDisplayDialogOpen(false)
              setDisplayedKey(null)
            }}>
              I've Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Key Details</DialogTitle>
          </DialogHeader>

          {selectedKey && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <div className="mt-1">{selectedKey.name}</div>
              </div>

              {selectedKey.description && (
                <div>
                  <Label>Description</Label>
                  <div className="mt-1 text-sm text-gray-600">{selectedKey.description}</div>
                </div>
              )}

              <div>
                <Label>Key Prefix</Label>
                <div className="mt-1">
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {selectedKey.key_prefix}
                  </code>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedKey.status)}</div>
              </div>

              <div>
                <Label>Scopes</Label>
                <div className="flex gap-2 mt-1">
                  {selectedKey.scopes.map((scope: string) => (
                    <Badge key={scope} variant="outline">{scope}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Rate Limits</Label>
                <div className="mt-1 text-sm space-y-1">
                  <div>Per Minute: {selectedKey.rate_limit.requests_per_minute} requests</div>
                  <div>Per Day: {selectedKey.rate_limit.requests_per_day} requests</div>
                </div>
              </div>

              {keyUsage && (
                <div>
                  <Label>Usage Statistics (Last 30 Days)</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500">Total Requests</div>
                      <div className="text-2xl font-bold mt-1">
                        {keyUsage.total_requests.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500">Success Rate</div>
                      <div className="text-2xl font-bold mt-1">
                        {keyUsage.success_rate ? `${(keyUsage.success_rate * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Created</Label>
                <div className="mt-1 text-sm">
                  {new Date(selectedKey.created_at).toLocaleString()}
                </div>
              </div>

              {selectedKey.usage.last_used_at && (
                <div>
                  <Label>Last Used</Label>
                  <div className="mt-1 text-sm">
                    {new Date(selectedKey.usage.last_used_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke the API key "{keyToRevoke?.name}".
              Any applications using this key will no longer be able to access your agents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeKey} className="bg-red-600">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rotate Confirmation Dialog */}
      <AlertDialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new API key for "{keyToRotate?.name}" while keeping all settings.
              The old key will be immediately revoked. Make sure you're ready to update your applications
              with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotateKey}>
              Rotate Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
