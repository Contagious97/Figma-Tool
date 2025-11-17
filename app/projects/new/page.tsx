'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ArrowLeft, FileText } from 'lucide-react'
import { parseFigmaUrl } from '@/lib/figma/client'

interface FileMetadata {
  name: string
  lastModified: string
  thumbnail: string | null
  pages: Array<{
    id: string
    name: string
  }>
  version: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null)
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [fileKey, setFileKey] = useState('')

  const handleFetch = async () => {
    setError('')
    setFileMetadata(null)

    const parsed = parseFigmaUrl(url)

    if (!parsed) {
      setError('Invalid Figma URL. Please paste a valid Figma file link.')
      return
    }

    setFileKey(parsed.fileKey)
    setIsLoading(true)

    try {
      const response = await fetch('/api/figma/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey: parsed.fileKey }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }

      const metadata = await response.json()
      setFileMetadata(metadata)
      // Select all pages by default
      setSelectedPages(metadata.pages.map((p: any) => p.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!fileMetadata || selectedPages.length === 0) {
      setError('Please select at least one page to import')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey,
          fileName: fileMetadata.name,
          pages: selectedPages,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }

      const { projectId } = await response.json()
      router.push(`/projects/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePage = (pageId: string) => {
    setSelectedPages((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId]
    )
  }

  const toggleAll = () => {
    if (!fileMetadata) return

    if (selectedPages.length === fileMetadata.pages.length) {
      setSelectedPages([])
    } else {
      setSelectedPages(fileMetadata.pages.map((p) => p.id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Link href="/dashboard" className="font-bold text-xl">
            Figma Flow Mapper
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Import Figma File</h1>
              <p className="text-muted-foreground">
                Paste a Figma file URL to get started
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Figma File URL</CardTitle>
              <CardDescription>
                Paste the URL of the Figma file you want to import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="figma-url">File URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="figma-url"
                    placeholder="https://figma.com/file/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleFetch}
                    disabled={!url || isLoading}
                  >
                    {isLoading && !fileMetadata ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      'Fetch'
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: figma.com/file/..., figma.com/design/..., or just the file key
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {fileMetadata && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {fileMetadata.name}
                </CardTitle>
                <CardDescription>
                  Last modified: {new Date(fileMetadata.lastModified).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {fileMetadata.thumbnail && (
                  <img
                    src={fileMetadata.thumbnail}
                    alt={fileMetadata.name}
                    className="rounded-lg w-full border"
                  />
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">
                      Select Pages to Import ({selectedPages.length}/{fileMetadata.pages.length})
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAll}
                    >
                      {selectedPages.length === fileMetadata.pages.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  </div>

                  <div className="space-y-2 border rounded-lg p-4">
                    {fileMetadata.pages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-accent"
                      >
                        <Checkbox
                          id={page.id}
                          checked={selectedPages.includes(page.id)}
                          onCheckedChange={() => togglePage(page.id)}
                        />
                        <label
                          htmlFor={page.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {page.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={isLoading || selectedPages.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isLoading && fileMetadata ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Import ${selectedPages.length} Page${selectedPages.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
