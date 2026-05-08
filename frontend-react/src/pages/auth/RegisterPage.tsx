import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, UserPlus, ArrowLeft, Sparkles, Shield } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      {/* Background pattern for Mac-level aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

      <Card className="relative w-full max-w-md shadow-xl border border-gray-200/60 bg-white/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Logo */}
          <Link to="/" className="inline-block mx-auto hover:opacity-80 transition-opacity">
            <div className="relative">
              <img
                src="/mentis-logomark.svg"
                alt="Mentis"
                className="w-16 h-16 mx-auto"
              />
            </div>
          </Link>

          {/* Beta Badge */}
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100/80 border border-gray-200/60 rounded-full backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-gray-500" />
              <span>Beta v0.9</span>
            </div>
          </div>

          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Shield className="w-7 h-7 text-gray-600" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
              Invite Only
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Mentis is currently available by invitation only
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div className="space-y-3 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              We're currently in a limited access phase to ensure the best experience for our users.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              If you're interested in joining Mentis, please reach out to our team for an invitation.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              asChild
              className="w-full h-11 bg-gray-900 text-white hover:bg-gray-800 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <a href="https://mentis-ai.com/waitlist" target="_blank" rel="noopener noreferrer">
                <UserPlus className="mr-2 h-4 w-4" />
                Join Waitlist
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg font-medium transition-all duration-200"
            >
              <Link to="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Already have an invitation?{' '}
              <Link to="/auth/login" className="text-gray-900 hover:text-gray-700 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
