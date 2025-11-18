'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, Chrome, Shield, Lock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const errorMessages: Record<string, string> = {
  OAuthSignin: 'Error constructing an authorization URL.',
  OAuthCallback: 'Error handling the OAuth callback.',
  OAuthCreateAccount: 'Could not create OAuth provider user in the database.',
  EmailCreateAccount: 'Could not create email provider user in the database.',
  Callback: 'Error in the OAuth callback handler route.',
  OAuthAccountNotLinked: 'This email is already associated with another account.',
  EmailSignin: 'Check your email for the sign in link.',
  CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'Unable to sign in. Please try again.',
  AccessDenied: 'You cancelled the sign-in. Please try again.',
}

export default function SignInPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl })
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Back to Home */}
      <div className="absolute top-6 left-6 z-10">
        <Button variant="ghost" asChild size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 bg-gradient-to-b from-background via-background to-muted/20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <Card className={`w-full max-w-md relative z-10 border-2 shadow-xl transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access Figma Flow Mapper
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessages[error] || errorMessages.Default}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGoogleSignIn}
              className="w-full h-12 text-base shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <Chrome className="mr-3 h-5 w-5" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">
                  Secure Authentication
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Password-less & Secure</p>
                  <p className="text-xs text-muted-foreground">
                    We use Google OAuth for secure, password-less authentication
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Your Data is Private</p>
                  <p className="text-xs text-muted-foreground">
                    Your Figma tokens are AES-256 encrypted and never shared
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <a href="#" className="underline hover:text-primary transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
