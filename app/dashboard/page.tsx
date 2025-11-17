import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { projects, userTokens } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import { UserNav } from '@/components/dashboard/user-nav'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/signin')
  }

  // Check if user has a Figma token
  const token = await db
    .select()
    .from(userTokens)
    .where(eq(userTokens.userId, session.user.id))
    .limit(1)

  const hasToken = token.length > 0

  // Get user's projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt))
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-bold text-xl">
              Figma Flow Mapper
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground"
              >
                Projects
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Settings
              </Link>
            </nav>
          </div>
          <UserNav user={session.user} />
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground">
                Import and analyze your Figma designs
              </p>
            </div>
            <Button asChild disabled={!hasToken}>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>

          {/* Token warning */}
          {!hasToken && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to add your Figma Personal Access Token before creating
                projects.{' '}
                <Link
                  href="/settings/token"
                  className="font-medium underline underline-offset-4"
                >
                  Add token in settings
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Projects list */}
          {userProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  {hasToken
                    ? 'Import your first Figma file to get started'
                    : 'Add your Figma token in settings to start importing projects'}
                </p>
                {hasToken && (
                  <Button asChild>
                    <Link href="/projects/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="line-clamp-1">
                        {project.fileName}
                      </CardTitle>
                      <CardDescription>
                        Updated{' '}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    {project.thumbnail && (
                      <CardContent>
                        <img
                          src={project.thumbnail}
                          alt={project.fileName}
                          className="rounded-md w-full aspect-video object-cover"
                        />
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
