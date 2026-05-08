// frontend/src/app/settings/organization/new/page.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { governanceAPI } from '@/lib/api'
import { useOrganization } from '@/context/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/use-toast'
import {
  Building2,
  Loader2,
  ArrowLeft,
  Check,
  Sparkles,
  Users,
  Briefcase,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'

const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for small teams getting started',
    icon: Sparkles,
    features: ['5 members', '10 departments', '10 GB storage', 'Basic support'],
    price: '$0',
    recommended: false,
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For growing teams that need more',
    icon: Users,
    features: ['25 members', '50 departments', '100 GB storage', 'Priority support'],
    price: '$29',
    recommended: true,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For established businesses',
    icon: Briefcase,
    features: ['100 members', '200 departments', '500 GB storage', 'Premium support'],
    price: '$99',
    recommended: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    icon: Zap,
    features: ['1000 members', '1000 departments', '5 TB storage', 'Dedicated support'],
    price: 'Custom',
    recommended: false,
  },
]

export default function CreateOrganizationPage() {
  const navigate = useNavigate()
  const { refreshOrganizations } = useOrganization()
  const [creating, setCreating] = useState(false)
  const [step, setStep] = useState<'details' | 'plan'>('details')

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [subscriptionTier, setSubscriptionTier] = useState('free')
  const [autoSlug, setAutoSlug] = useState(true)

  // Generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (autoSlug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generatedSlug)
    }
  }

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setAutoSlug(false)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    if (slug && (slug.length < 3 || slug.length > 50)) {
      toast({
        title: 'Validation Error',
        description: 'Slug must be between 3 and 50 characters',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    try {
      setCreating(true)

      const response = await governanceAPI.organizations.create({
        name: name.trim(),
        slug: slug || undefined,
        subscription_tier: subscriptionTier,
      })

      if (response.success) {
        toast({
          title: 'Success!',
          description: `${name} has been created`,
          duration: 2000
        })

        // Refresh organizations list
        await refreshOrganizations()

        // Redirect to the new organization settings
        navigate('/settings/organization')
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create organization',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast({
        title: 'Error',
        description: 'Failed to create organization',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to="/settings/organization">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create Organization
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Set up a new workspace for your team
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'details'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-500 text-white'
                }`}
              >
                {step === 'plan' ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <span className={`font-medium ${step === 'details' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Details
              </span>
            </div>

            <div className="w-24 h-0.5 bg-gray-300 dark:bg-gray-700" />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'plan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                2
              </div>
              <span className={`font-medium ${step === 'plan' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Choose Plan
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Organization Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Enter basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name">
                  Organization Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="org-name"
                  placeholder="Acme Corporation"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  The name of your organization or team
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-slug">
                  URL Slug <span className="text-gray-500">(optional)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">mentis.app/</span>
                  <Input
                    id="org-slug"
                    placeholder="acme-corp"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  A unique identifier for your organization. If not provided, one will be generated automatically.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Link to="/settings/organization">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  onClick={() => setStep('plan')}
                  disabled={!name.trim()}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Plan */}
        {step === 'plan' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
                <CardDescription>
                  Select the plan that best fits your team's needs. You can upgrade or downgrade anytime.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={subscriptionTier} onValueChange={setSubscriptionTier}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {SUBSCRIPTION_TIERS.map((tier) => {
                      const Icon = tier.icon
                      const isSelected = subscriptionTier === tier.id

                      return (
                        <div
                          key={tier.id}
                          className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => setSubscriptionTier(tier.id)}
                        >
                          {tier.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                                Recommended
                              </span>
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                  {tier.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {tier.description}
                                </p>
                              </div>
                            </div>
                            <RadioGroupItem value={tier.id} />
                          </div>

                          <div className="mb-4">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {tier.price}
                              </span>
                              {tier.id !== 'enterprise' && (
                                <span className="text-gray-600 dark:text-gray-400">/month</span>
                              )}
                            </div>
                          </div>

                          <ul className="space-y-2">
                            {tier.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('details')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Create Organization
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
