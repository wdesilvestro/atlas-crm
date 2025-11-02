'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

interface CreateOrganizationForm {
  name: string
  website?: string
  linkedin_url?: string
}

function CreateOrganizationContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationForm>({
    defaultValues: {
      name: '',
      website: '',
      linkedin_url: '',
    },
  })

  const onSubmit = async (data: CreateOrganizationForm) => {
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data: result, error: insertError } = await supabase
        .from('organization')
        .insert([
          {
            name: data.name,
            website: data.website || null,
            linkedin_url: data.linkedin_url || null,
            user_id: user.id,
          },
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      if (!result) {
        throw new Error('No data returned from insert')
      }

      // Redirect back to organizations page
      router.push('/organizations')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create organization'
      setError(errorMessage)
      console.error('Error creating organization:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="mb-2">
              <Link href="/organizations">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Organizations
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
              <p className="text-muted-foreground">
                Add a new organization to your CRM.
              </p>
            </div>

            <div className="max-w-2xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                      {error}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn Profile URL (Optional)</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/company/acme"
                      {...register('linkedin_url')}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Organization'}
                    </Button>
                    <Link href="/organizations">
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

export default function CreateOrganizationPage() {
  return (
    <AuthGuard>
      <CreateOrganizationContent />
    </AuthGuard>
  )
}
