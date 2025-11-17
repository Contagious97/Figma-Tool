'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, ExternalLink, Loader2, Trash2 } from 'lucide-react'

interface TokenManagementProps {
  userId: string
}

export function TokenManagement({ userId }: TokenManagementProps) {
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasExistingToken, setHasExistingToken] = useState(false)
  const [tokenUpdatedAt, setTokenUpdatedAt] = useState<Date | null>(null)

  // Check if user has existing token
  useEffect(() => {
    checkTokenStatus()
  }, [])

  const checkTokenStatus = async () => {
    try {
      const response = await fetch('/api/user/token')
      if (response.ok) {
        const data = await response.json()
        setHasExistingToken(data.hasToken)
        if (data.updatedAt) {
          setTokenUpdatedAt(new Date(data.updatedAt))
        }
      }
    } catch (error) {
      console.error('Failed to check token status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const validateAndSave = async () => {
    if (!token) {
      setErrorMessage('Please enter your Figma token')
      setValidationStatus('error')
      return
    }

    setIsValidating(true)
    setValidationStatus('idle')
    setErrorMessage('')

    try {
      // Validate token with Figma API
      const validationRes = await fetch('/api/user/token/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!validationRes.ok) {
        const { error } = await validationRes.json()
        throw new Error(error)
      }

      setIsSaving(true)

      // Save token
      const saveRes = await fetch('/api/user/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!saveRes.ok) {
        throw new Error('Failed to save token')
      }

      setValidationStatus('success')
      setToken('') // Clear input after save
      setHasExistingToken(true)
      setTokenUpdatedAt(new Date())

      // Reset success message after 3 seconds
      setTimeout(() => {
        setValidationStatus('idle')
      }, 3000)
    } catch (error) {
      setValidationStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Invalid token')
    } finally {
      setIsValidating(false)
      setIsSaving(false)
    }
  }

  const deleteToken = async () => {
    if (!confirm('Are you sure you want to delete your Figma token? You will need to add it again to import projects.')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('/api/user/token', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete token')
      }

      setHasExistingToken(false)
      setTokenUpdatedAt(null)
      setValidationStatus('idle')
    } catch (error) {
      setErrorMessage('Failed to delete token')
      setValidationStatus('error')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Figma Personal Access Token</CardTitle>
        <CardDescription>
          Your token is encrypted and stored securely. It's only used to fetch your Figma designs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingToken && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Token is active and ready to use.
              {tokenUpdatedAt && (
                <span className="text-muted-foreground">
                  {' '}Last updated {tokenUpdatedAt.toLocaleDateString()}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="figma-token">
            {hasExistingToken ? 'Update Token' : 'Add Token'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="figma-token"
              type="password"
              placeholder={hasExistingToken ? '••••••••••••' : 'figd_...'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validateAndSave()}
              className="font-mono"
            />
            <Button
              onClick={validateAndSave}
              disabled={!token || isValidating || isSaving}
            >
              {isValidating || isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isValidating ? 'Validating...' : 'Saving...'}
                </>
              ) : hasExistingToken ? (
                'Update'
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>

        {validationStatus === 'success' && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Token validated and saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {validationStatus === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 text-sm text-muted-foreground border-t pt-4">
          <p>
            <strong>Don't have a token?</strong>{' '}
            <a
              href="https://www.figma.com/developers/api#access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Generate one in Figma
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <div className="space-y-1">
            <p><strong>How to get your token:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to Figma Settings → Account</li>
              <li>Scroll to "Personal access tokens"</li>
              <li>Click "Create a new personal access token"</li>
              <li>Copy the token and paste it here</li>
            </ol>
          </div>
          <p className="text-xs">
            Your token is encrypted with AES-256-GCM and never shared with third parties.
          </p>
        </div>

        {hasExistingToken && (
          <div className="border-t pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteToken}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Token
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
