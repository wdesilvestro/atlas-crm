'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, DoesFilterPassParams, ValueGetterParams, themeQuartz } from 'ag-grid-community'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Eye, Pencil } from 'lucide-react'
import { usePersons } from '@/lib/hooks/use-persons'
import { Person } from '@/types/person'
import { supabase } from '@/lib/supabase'
import { useState, useCallback, useEffect, useRef } from 'react'
import { createTagFilter, TagFilterModel } from '@/components/TagFilterComponent'
import { createStatusFilter, StatusFilterModel } from '@/components/StatusFilterComponent'
import { createFollowUpReminderFilter, FollowUpReminderFilterModel } from '@/components/FollowUpReminderFilterComponent'
import { createRelationshipOwnerFilter, RelationshipOwnerFilterModel } from '@/components/RelationshipOwnerFilterComponent'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import type { GridReadyEvent, GridApi } from 'ag-grid-community'
import Photo from '@/components/Photo'

function PersonsContent() {
  const router = useRouter()
  const { persons, loading, error, refetch } = usePersons()
  const [deleting, setDeleting] = useState<string | null>(null)
  const gridApiRef = useRef<GridApi | null>(null)
  const filterAppliedRef = useRef(false)

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api
  }, [])

  // Apply filter after data is loaded
  useEffect(() => {
    if (!loading && persons.length > 0 && gridApiRef.current && !filterAppliedRef.current) {
      // Use setTimeout to ensure filter component is fully initialized
      setTimeout(() => {
        const filterModel = {
          status: {
            selectedStatus: 'Active'
          }
        }

        gridApiRef.current?.setFilterModel(filterModel)
        filterAppliedRef.current = true
      }, 100)
    }
  }, [loading, persons])

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
      field: 'photo',
      headerName: '',
      width: 60,
      cellRenderer: (props: { data: Person }) => {
        return (
          <div className="flex items-center justify-center h-full">
            <Photo
              src={props.data?.photo}
              alt={`${props.data?.first_name} ${props.data?.last_name}`}
              variant="circular"
              size="sm"
              type="person"
            />
          </div>
        )
      },
      sortable: false,
      filter: false,
    },
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
        const getStatusStyle = (status: string) => {
          switch (status) {
            case 'Active':
              return 'bg-green-100 text-green-800'
            case 'Inactive':
              return 'bg-gray-100 text-gray-800'
            case 'Needs Qualification':
              return 'bg-yellow-100 text-yellow-800'
            default:
              return 'bg-gray-100 text-gray-800'
          }
        }
        return (
          <div
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap inline-block ${getStatusStyle(props.value)}`}
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
      field: 'relationship_owner',
      headerName: 'Relationship Owner',
      flex: 1,
      minWidth: 150,
      valueGetter: (params: ValueGetterParams<Person>) => {
        return params.data?.relationship_owner?.name || '-'
      },
      cellRenderer: (props: { data: Person }) => {
        const owner = props.data?.relationship_owner
        if (!owner) return <span className="text-gray-400">-</span>
        return <span>{owner.name}</span>
      },
      filter: {
        component: createRelationshipOwnerFilter(),
        handler: (params: any) => {
          return {
            doesFilterPass: (
              filterParams: DoesFilterPassParams<Person, any, RelationshipOwnerFilterModel>
            ) => {
              const selectedOwnerId = filterParams.model?.selectedOwnerId
              if (!selectedOwnerId) return true

              // Handle "none" option (no owner assigned)
              if (selectedOwnerId === 'none') {
                return !filterParams.data?.relationship_owner_id
              }

              // Handle specific owner selection
              return filterParams.data?.relationship_owner_id === selectedOwnerId
            },
          }
        },
      },
    },
    {
      field: 'follow_up_reminder_status',
      headerName: 'Follow-up Reminder',
      flex: 1,
      minWidth: 160,
      cellRenderer: (props: { value: string | undefined }) => {
        const status = props.value
        if (!status) return <span className="text-gray-400">-</span>

        const getConfig = (s: string) => {
          switch (s) {
            case 'action_required':
              return {
                bg: 'bg-orange-50',
                border: 'border-l-2 border-orange-400',
                text: 'text-orange-900',
                label: 'Action Required',
                icon: <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />,
              }
            case 'awaiting_response':
              return {
                bg: 'bg-blue-50',
                border: 'border-l-2 border-blue-400',
                text: 'text-blue-900',
                label: 'Awaiting Response',
                icon: <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />,
              }
            case 'no_follow_up_needed':
              return {
                bg: 'bg-gray-50',
                border: 'border-l-2 border-gray-400',
                text: 'text-gray-900',
                label: 'No Follow-up',
                icon: <CheckCircle2 className="h-4 w-4 text-gray-600 flex-shrink-0" />,
              }
            default:
              return {
                bg: 'bg-gray-50',
                border: 'border-l-2 border-gray-400',
                text: 'text-gray-900',
                label: 'Unknown',
                icon: <CheckCircle2 className="h-4 w-4 text-gray-600 flex-shrink-0" />,
              }
          }
        }

        const config = getConfig(status)

        return (
          <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap inline-flex items-center gap-2 ${config.bg} ${config.text} ${config.border}`}>
            {config.icon}
            <span>{config.label}</span>
          </div>
        )
      },
      filter: {
        component: createFollowUpReminderFilter(),
        handler: (params: any) => {
          return {
            doesFilterPass: (
              filterParams: DoesFilterPassParams<Person, any, FollowUpReminderFilterModel>
            ) => {
              const selectedStatus = filterParams.model?.selectedStatus
              if (!selectedStatus) return true
              return filterParams.data?.follow_up_reminder_status === selectedStatus
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
                  onGridReady={onGridReady}
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
