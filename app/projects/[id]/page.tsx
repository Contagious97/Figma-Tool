import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { projects, figmaPages, figmaFrames } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { UserNav } from '@/components/dashboard/user-nav'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/signin')
  }

  // Fetch project
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, params.id),
      eq(projects.userId, session.user.id)
    ),
  })

  if (!project) {
    redirect('/dashboard')
  }

  // Fetch pages and frames
  const pages = await db.query.figmaPages.findMany({
    where: eq(figmaPages.projectId, project.id),
    orderBy: (figmaPages, { asc }) => [asc(figmaPages.order)],
    with: {
      frames: true,
    },
  })

  const totalFrames = pages.reduce((sum, page) => sum + page.frames.length, 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-bold text-xl">
              Figma Flow Mapper
            </Link>
          </div>
          <UserNav user={session.user} />
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{project.fileName}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{totalFrames} frame{totalFrames !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href={`https://figma.com/file/${project.figmaFileKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Figma
                </a>
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Project overview */}
          {project.thumbnail && (
            <Card>
              <CardHeader>
                <CardTitle>File Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={project.thumbnail}
                  alt={project.fileName}
                  className="rounded-lg w-full border"
                />
              </CardContent>
            </Card>
          )}

          {/* Pages and frames */}
          <div className="space-y-6">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle>{page.name}</CardTitle>
                  <CardDescription>
                    {page.frames.length} frame{page.frames.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {page.frames.map((frame) => (
                      <Card key={frame.id} className="overflow-hidden">
                        {frame.thumbnail && (
                          <div className="aspect-video relative bg-muted">
                            <img
                              src={frame.thumbnail}
                              alt={frame.name}
                              className="object-contain w-full h-full"
                            />
                          </div>
                        )}
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm line-clamp-1">
                            {frame.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {frame.width} × {frame.height}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>

                  {page.frames.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No frames found in this page
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
