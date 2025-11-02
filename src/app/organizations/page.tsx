'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, themeQuartz } from 'ag-grid-community'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Eye, Pencil, ExternalLink } from 'lucide-react'
import { useOrganizations } from '@/lib/hooks/use-organizations'
import { Organization } from '@/types/organization'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

function OrganizationsContent() {
  const router = useRouter()
  const { organizations, loading, error, refetch } = useOrganizations()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleViewOrganization = (id: string) => {
    router.push(`/organizations/${id}`)
  }

  const handleEditOrganization = (id: string) => {
    router.push(`/organizations/${id}/edit`)
  }

  const handleDeleteOrganization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) {
      return
    }

    setDeleting(id)
    try {
      const { error: deleteError } = await supabase
        .from('organization')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      await refetch()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete organization'
      alert(`Error deleting organization: ${errorMessage}`)
      console.error('Error deleting organization:', err)
    } finally {
      setDeleting(null)
    }
  }

  const columnDefs: ColDef<Organization>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'website',
      headerName: 'Website',
      flex: 1,
      minWidth: 200,
      cellRenderer: (props: { value: string | null }) => {
        if (!props.value) return '-'
        return (
          <a
            href={props.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate inline-flex items-center gap-1"
          >
            Visit <ExternalLink className="h-3 w-3" />
          </a>
        )
      },
    },
    {
      field: 'linkedin_url',
      headerName: 'LinkedIn',
      flex: 1,
      minWidth: 200,
      cellRenderer: (props: { value: string | null }) => {
        if (!props.value) return '-'
        return (
          <a
            href={props.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate inline-flex items-center gap-1"
          >
            View Profile <ExternalLink className="h-3 w-3" />
          </a>
        )
      },
    },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params: { value: string }) => {
        if (!params.value) return '-'
        return new Date(params.value).toLocaleDateString()
      },
    },
    {
      field: 'updated_at',
      headerName: 'Updated',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params: { value: string }) => {
        if (!params.value) return '-'
        return new Date(params.value).toLocaleDateString()
      },
    },
    {
      headerName: 'Actions',
      width: 150,
      cellRenderer: (props: { data: Organization }) => {
        const isDeleting = deleting === props.data.id
        return (
          <div className="flex gap-2 h-full items-center">
            <button
              onClick={() => handleViewOrganization(props.data.id)}
              disabled={isDeleting}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              title="View organization"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditOrganization(props.data.id)}
              disabled={isDeleting}
              className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
              title="Edit organization"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteOrganization(props.data.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
              title="Delete organization"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                <p className="text-muted-foreground">
                  Manage and view all organizations in your CRM.
                </p>
              </div>
              <Link href="/organizations/create" className="flex-shrink-0">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </Link>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div style={{ height: 500, width: '100%' }}>
                <AgGridReact<Organization>
                  rowData={organizations}
                  columnDefs={columnDefs}
                  loading={loading}
                  pagination={true}
                  paginationPageSize={10}
                  theme={themeQuartz}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function OrganizationsPage() {
  return (
    <AuthGuard>
      <OrganizationsContent />
    </AuthGuard>
  )
}
