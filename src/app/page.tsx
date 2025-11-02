'use client'

import { AuthGuard } from '@/components/auth-guard'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

function HomeContent() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Atlas CRM</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Logged in as: <span className="font-semibold">{user?.email}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Get started by exploring the CRM features
        </p>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="mt-6"
        >
          Sign Out
        </Button>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  )
}
