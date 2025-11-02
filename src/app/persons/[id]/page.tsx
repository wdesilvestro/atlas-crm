'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Person } from '@/types/person'
import { ArrowLeft, ExternalLink } from 'lucide-react'

function PersonDetailContent() {
  const params = useParams()
  const id = params.id as string

  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('person')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (!data) {
          throw new Error('Person not found')
        }

        setPerson(data)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch person'
        setError(errorMessage)
        console.error('Error fetching person:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPerson()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b bg-background p-4 flex justify-end">
            <UserMenu />
          </header>
          <main className="p-6">
            <p className="text-muted-foreground">Loading...</p>
          </main>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b bg-background p-4 flex justify-between items-center">
            <Link href="/persons">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <UserMenu />
          </header>
          <main className="p-6">
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error || 'Person not found'}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="border-b bg-background p-4 flex justify-between items-center">
          <Link href="/persons">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <UserMenu />
        </header>
        <main className="p-6">
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {person.first_name} {person.last_name}
              </h1>
              <p className="text-muted-foreground">
                Person details and information
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <p className="mt-1 text-lg">{person.first_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <p className="mt-1 text-lg">{person.last_name}</p>
                </div>
              </div>

              {person.linkedin_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    LinkedIn
                  </label>
                  <a
                    href={person.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    View Profile
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(person.created_at).toLocaleDateString()} at{' '}
                    {new Date(person.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(person.updated_at).toLocaleDateString()} at{' '}
                    {new Date(person.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PersonDetailPage() {
  return (
    <AuthGuard>
      <PersonDetailContent />
    </AuthGuard>
  )
}
