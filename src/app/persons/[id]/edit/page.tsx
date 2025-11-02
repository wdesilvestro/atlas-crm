'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
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
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
              <Link href="/persons">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Persons
                </Button>
              </Link>
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div>
              <Link href={`/persons/${id}`}>
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Person
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
              <p className="text-muted-foreground">
                Update information for {person?.first_name} {person?.last_name}
              </p>
            </div>

            <div className="max-w-2xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {submitError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
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
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function EditPersonPage() {
  return (
    <AuthGuard>
      <EditPersonContent />
    </AuthGuard>
  )
}
