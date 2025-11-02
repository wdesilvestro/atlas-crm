'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Person } from '@/types/person'
import { ArrowLeft } from 'lucide-react'

interface EditPersonForm {
  first_name: string
  last_name: string
  linkedin_url?: string
}

function EditPersonContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditPersonForm>({
    defaultValues: {
      first_name: '',
      last_name: '',
      linkedin_url: '',
    },
  })

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
        reset({
          first_name: data.first_name,
          last_name: data.last_name,
          linkedin_url: data.linkedin_url || '',
        })
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
  }, [id, reset])

  const onSubmit = async (data: EditPersonForm) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const { error: updateError } = await supabase
        .from('person')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          linkedin_url: data.linkedin_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()

      if (updateError) {
        throw updateError
      }

      // Redirect to person detail page
      router.push(`/persons/${id}`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update person'
      setSubmitError(errorMessage)
      console.error('Error updating person:', err)
    } finally {
      setSubmitting(false)
    }
  }

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

  if (error) {
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
              {error}
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
          <Link href={`/persons/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <UserMenu />
        </header>
        <main className="p-6">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
              <p className="text-muted-foreground">
                Update information for {person?.first_name} {person?.last_name}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {submitError && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  {...register('first_name', {
                    required: 'First name is required',
                  })}
                  disabled={submitting}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  {...register('last_name', {
                    required: 'Last name is required',
                  })}
                  disabled={submitting}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">
                    {errors.last_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL (Optional)</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/johndoe"
                  {...register('linkedin_url')}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href={`/persons/${id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function EditPersonPage() {
  return (
    <AuthGuard>
      <EditPersonContent />
    </AuthGuard>
  )
}
