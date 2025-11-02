'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, themeQuartz } from 'ag-grid-community'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Eye, Pencil } from 'lucide-react'
import { usePersons } from '@/lib/hooks/use-persons'
import { Person } from '@/types/person'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="border-b bg-background p-4 flex justify-end">
          <UserMenu />
        </header>
        <main className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Persons</h1>
                <p className="text-muted-foreground">
                  Manage and view all persons in your CRM.
                </p>
              </div>
              <Link href="/persons/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Person
                </Button>
              </Link>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="rounded-lg border bg-background overflow-hidden">
              <div style={{ height: 500, width: '100%' }}>
                <AgGridReact<Person>
                  rowData={persons}
                  columnDefs={columnDefs}
                  loading={loading}
                  pagination={true}
                  paginationPageSize={10}
                  theme={themeQuartz}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PersonsPage() {
  return (
    <AuthGuard>
      <PersonsContent />
    </AuthGuard>
  )
}
