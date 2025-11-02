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
import { Organization } from '@/types/organization'
import { ArrowLeft } from 'lucide-react'

interface EditOrganizationForm {
  name: string
  website?: string
  linkedin_url?: string
}

function EditOrganizationContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditOrganizationForm>({
    defaultValues: {
      name: '',
      website: '',
      linkedin_url: '',
    },
  })

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('organization')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (!data) {
          throw new Error('Organization not found')
        }

        setOrganization(data)
        reset({
          name: data.name,
          website: data.website || '',
          linkedin_url: data.linkedin_url || '',
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch organization'
        setError(errorMessage)
        console.error('Error fetching organization:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [id, reset])

  const onSubmit = async (data: EditOrganizationForm) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const { error: updateError } = await supabase
        .from('organization')
        .update({
          name: data.name,
          website: data.website || null,
          linkedin_url: data.linkedin_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()

      if (updateError) {
        throw updateError
      }

      // Redirect to organization detail page
      router.push(`/organizations/${id}`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update organization'
      setSubmitError(errorMessage)
      console.error('Error updating organization:', err)
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
              <Link href="/organizations">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Organizations
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
              <Link href={`/organizations/${id}`}>
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Organization
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
              <p className="text-muted-foreground">
                Update information for {organization?.name}
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
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Acme Corporation"
                      {...register('name', {
                        required: 'Organization name is required',
                      })}
                      disabled={submitting}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://acme.com"
                      {...register('website')}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn Profile URL (Optional)</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/company/acme"
                      {...register('linkedin_url')}
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Link href={`/organizations/${id}`}>
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

export default function EditOrganizationPage() {
  return (
    <AuthGuard>
      <EditOrganizationContent />
    </AuthGuard>
  )
}
