import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserNav } from '@/components/dashboard/user-nav'
import { TokenManagement } from '@/components/settings/token-management'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/signin')
  }

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
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Projects
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-foreground"
              >
                Settings
              </Link>
            </nav>
          </div>
          <UserNav user={session.user} />
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and Figma integration
            </p>
          </div>

          <TokenManagement userId={session.user.id} />
        </div>
      </main>
    </div>
  )
}
