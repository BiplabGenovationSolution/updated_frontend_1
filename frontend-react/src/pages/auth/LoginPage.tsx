import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { MinimalSpinner } from '@/components/ui/minimal-loader'
import { Mail, Sparkles, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        navigate('/agents')
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid email or password',
          variant: 'destructive',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Login failed:', error)
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
        duration: 2000
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

      <Card className="relative w-full max-w-md shadow-xl border border-gray-200/60 bg-white/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Logo */}
          <Link to="/" className="inline-block mx-auto hover:opacity-80 transition-opacity">
            <img src="/mentis-logomark.svg" alt="Mentis" className="w-16 h-16 mx-auto" />
          </Link>

          {/* Beta Badge */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100/80 border border-gray-200/60 rounded-full">
              <Sparkles className="w-3 h-3 text-gray-500" />
              <span>Beta v0.9</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Sign in to your Mentis account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                className="h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-gray-900/10 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-gray-900/10 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gray-900 text-white hover:bg-gray-800 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <MinimalSpinner size="sm" className="text-white" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-500">Invite Only</span>
            </div>
          </div>

          {/* Waitlist */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">Mentis is currently invite-only</p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg font-medium transition-all duration-200"
            >
              <a href="https://mentis-ai.com/waitlist" target="_blank" rel="noopener noreferrer">
                <Mail className="mr-2 h-4 w-4" />
                Join Waitlist
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
