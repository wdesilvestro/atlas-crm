'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, DoesFilterPassParams, themeQuartz } from 'ag-grid-community'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Eye, Pencil } from 'lucide-react'
import { usePersons } from '@/lib/hooks/use-persons'
import { Person } from '@/types/person'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { createTagFilter, TagFilterModel } from '@/components/TagFilterComponent'
import { createStatusFilter, StatusFilterModel } from '@/components/StatusFilterComponent'

function PersonsContent() {
  const router = useRouter()
  const { persons, loading, error, refetch } = usePersons()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleViewPerson = (id: string) => {
    router.push(`/persons/${id}`)
  }

  const handleEditPerson = (id: string) => {
    router.push(`/persons/${id}/edit`)
  }

  const handleDeletePerson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this person?')) {
      return
    }

    setDeleting(id)
    try {
      const { error: deleteError } = await supabase
        .from('person')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      await refetch()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete person'
      alert(`Error deleting person: ${errorMessage}`)
      console.error('Error deleting person:', err)
    } finally {
      setDeleting(null)
    }
  }

  const columnDefs: ColDef<Person>[] = [
    {
      field: 'first_name',
      headerName: 'First Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'last_name',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      cellRenderer: (props: { value: string }) => {
        const isActive = props.value === 'Active'
        return (
          <div
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap inline-block ${
              isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {props.value}
          </div>
        )
      },
      filter: {
        component: createStatusFilter(),
        handler: (params: any) => {
          return {
            doesFilterPass: (
              filterParams: DoesFilterPassParams<Person, any, StatusFilterModel>
            ) => {
              const selectedStatus = filterParams.model?.selectedStatus
              if (!selectedStatus) return true
              return filterParams.data?.status === selectedStatus
            },
          }
        },
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
            className="text-blue-600 hover:underline truncate"
          >
            View Profile
          </a>
        )
      },
    },
    {
      headerName: 'Tags',
      field: 'tags',
      flex: 1,
      minWidth: 200,
      valueFormatter: (params: { value: any }) => {
        if (!params.value || !Array.isArray(params.value)) return '-'
        const tags = params.value as any[]
        return tags.length === 0 ? '-' : tags.map((tag) => tag.name).join(', ')
      },
      cellRenderer: (props: { data: Person }) => {
        const tags = props.data?.tags || []
        if (tags.length === 0) return <span className="text-gray-400">-</span>
        return (
          <div className="flex flex-wrap gap-1 py-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
              >
                {tag.name}
              </div>
            ))}
          </div>
        )
      },
      filter: {
        component: createTagFilter('person'),
        handler: (params: any) => {
          return {
            doesFilterPass: (
              filterParams: DoesFilterPassParams<Person, any, TagFilterModel>
            ) => {
              const selectedTagIds = filterParams.model?.selectedTagIds || []

              // If no tags selected, pass all rows
              if (selectedTagIds.length === 0) {
                return true
              }

              // Get tags from the row
              const rowTags = filterParams.data?.tags || []
              const rowTagIds = rowTags.map((t: any) => t.id)

              // Require the row to include every selected tag
              const result = selectedTagIds.every((tagId: string) =>
                rowTagIds.includes(tagId)
              )
              return result
            },
          }
        },
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
      cellRenderer: (props: { data: Person }) => {
        const isDeleting = deleting === props.data.id
        return (
          <div className="flex gap-2 h-full items-center">
            <button
              onClick={() => handleViewPerson(props.data.id)}
              disabled={isDeleting}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              title="View person"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditPerson(props.data.id)}
              disabled={isDeleting}
              className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
              title="Edit person"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeletePerson(props.data.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
              title="Delete person"
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
                <h1 className="text-3xl font-bold tracking-tight">Persons</h1>
                <p className="text-muted-foreground">
                  Manage and view all persons in your CRM.
                </p>
              </div>
              <Link href="/persons/create" className="flex-shrink-0">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Person
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
                <AgGridReact<Person>
                  rowData={persons}
                  columnDefs={columnDefs}
                  loading={loading}
                  pagination={true}
                  paginationPageSize={100}
                  theme={themeQuartz}
                  enableFilterHandlers={true}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function PersonsPage() {
  return (
    <AuthGuard>
      <PersonsContent />
    </AuthGuard>
  )
}
