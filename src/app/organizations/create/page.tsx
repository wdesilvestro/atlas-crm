'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { OrganizationForm } from '@/components/OrganizationForm'

function CreateOrganizationContent() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/organizations')
  }

  const handleCancel = () => {
    router.push('/organizations')
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
                <OrganizationForm
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                  submitButtonText="Create Organization"
                />
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
