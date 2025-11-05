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
import { Plus, Trash2, Eye, Pencil, ExternalLink } from 'lucide-react'
import { useOrganizations } from '@/lib/hooks/use-organizations'
import { Organization } from '@/types/organization'
import { supabase } from '@/lib/supabase'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createTagFilter, TagFilterModel } from '@/components/TagFilterComponent'
import { createStatusFilter, StatusFilterModel } from '@/components/StatusFilterComponent'
import { createRelationshipOwnerFilter, RelationshipOwnerFilterModel } from '@/components/RelationshipOwnerFilterComponent'
import { createToDoFilter, ToDoFilterModel, ToDoFilterType } from '@/components/ToDoFilterComponent'
import type { GridReadyEvent, GridApi } from 'ag-grid-community'
import Photo from '@/components/Photo'
import { format, startOfWeek, endOfWeek } from 'date-fns'

function OrganizationsContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { organizations, loading, error, refetch } = useOrganizations()
  const [deleting, setDeleting] = useState<string | null>(null)
  const gridApiRef = useRef<GridApi | null>(null)
  const filterAppliedRef = useRef(false)

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api
  }, [])

  // Memoize date calculations to prevent hydration mismatches
  const dateFilters = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd')
    return { today, weekStart, weekEnd }
  }, [])

  // Apply filter after data is loaded
  useEffect(() => {
    if (!loading && organizations.length > 0 && gridApiRef.current && !filterAppliedRef.current) {
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
  }, [loading, organizations])

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

  // Helper function to calculate todo count based on filter type
  const getTodoCount = useCallback((todos: any[], filterType: ToDoFilterType = 'all', userId?: string): number => {
    if (!todos || todos.length === 0) return 0

    const { today, weekStart, weekEnd } = dateFilters

    switch (filterType) {
      case 'all':
        return todos.length
      case 'outstanding':
        return todos.filter((todo: any) => !todo.completed).length
      case 'due_today':
        return todos.filter((todo: any) => {
          if (!todo.due_date || todo.completed) return false
          const dueDate = todo.due_date.split('T')[0] // Handle both date and timestamp formats
          return dueDate === today
        }).length
      case 'due_this_week':
        return todos.filter((todo: any) => {
          if (!todo.due_date || todo.completed) return false
          const dueDate = todo.due_date.split('T')[0] // Handle both date and timestamp formats
          return dueDate >= weekStart && dueDate <= weekEnd
        }).length
      case 'outstanding_for_me':
        return todos.filter((todo: any) => {
          if (todo.completed) return false
          return todo.assigned_to === userId
        }).length
      case 'due_today_for_me':
        return todos.filter((todo: any) => {
          if (!todo.due_date || todo.completed) return false
          if (todo.assigned_to !== userId) return false
          const dueDate = todo.due_date.split('T')[0] // Handle both date and timestamp formats
          return dueDate === today
        }).length
      default:
        return todos.length
    }
  }, [dateFilters])

  const columnDefs: ColDef<Organization>[] = [
    {
      field: 'photo',
      headerName: '',
      width: 80,
      cellRenderer: (props: { data: Organization }) => {
        return (
          <div className="flex items-center justify-center h-full">
            <Photo
              src={props.data?.photo}
              alt={props.data?.name}
              variant="horizontal"
              size="sm"
              type="organization"
            />
          </div>
        )
      },
      sortable: false,
      filter: false,
    },
    {
      field: 'name',
      headerName: 'Name',
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
              filterParams: DoesFilterPassParams<Organization, any, StatusFilterModel>
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
      valueGetter: (params: ValueGetterParams<Organization>) => {
        return params.data?.relationship_owner?.name || '-'
      },
      cellRenderer: (props: { data: Organization }) => {
        const owner = props.data?.relationship_owner
        if (!owner) return <span className="text-gray-400">-</span>
        return <span>{owner.name}</span>
      },
      filter: {
        component: createRelationshipOwnerFilter(),
        handler: (params: any) => {
          return {
            doesFilterPass: (
              filterParams: DoesFilterPassParams<Organization, any, RelationshipOwnerFilterModel>
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
      headerName: 'Tags',
      field: 'tags',
      flex: 1,
      minWidth: 200,
      valueFormatter: (params: { value: any }) => {
        if (!params.value || !Array.isArray(params.value)) return '-'
        const tags = params.value as any[]
        return tags.length === 0 ? '-' : tags.map((tag) => tag.name).join(', ')
      },
      cellRenderer: (props: { data: Organization }) => {
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
        component: createTagFilter('organization'),
        handler: (params: any) => {
          return {
            doesFilterPass: (
              filterParams: DoesFilterPassParams<Organization, any, TagFilterModel>
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
      headerName: 'To-Do Items',
      field: 'todos',
      flex: 1,
      minWidth: 120,
      valueGetter: (params: ValueGetterParams<Organization>) => {
        const todos = params.data?.todos || []
        return getTodoCount(todos, 'all', user?.id)
      },
      cellRenderer: (props: { data: Organization; api: any }) => {
        const todos = props.data?.todos || []

        // Get the current filter model for this column
        const filterModel = props.api.getFilterModel()
        const todoFilter = filterModel?.todos as ToDoFilterModel | null
        const filterType = todoFilter?.filterType || 'all'

        const count = getTodoCount(todos, filterType, user?.id)

        return (
          <div className="flex items-center h-full">
            <span className="text-sm">{count}</span>
          </div>
        )
      },
      filter: {
        component: createToDoFilter(),
        handler: (params: any) => {
          return {
            doesFilterPass: (
              filterParams: DoesFilterPassParams<Organization, any, ToDoFilterModel>
            ) => {
              const filterType = filterParams.model?.filterType || 'all'
              const todos = filterParams.data?.todos || []

              // Filter out rows where the count is 0 for the selected filter type
              const count = getTodoCount(todos, filterType, user?.id)
              return count > 0
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
      cellRenderer: (props: { data: Organization }) => {
        const isDeleting = deleting === props.data.id
        return (
          <div className="flex gap-2 h-full items-center">
            <Link
              href={`/organizations/${props.data.id}`}
              className={`text-blue-600 hover:text-blue-800 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              title="View organization"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`/organizations/${props.data.id}/edit`}
              className={`text-amber-600 hover:text-amber-800 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              title="Edit organization"
            >
              <Pencil className="h-4 w-4" />
            </Link>
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

export default function OrganizationsPage() {
  return (
    <AuthGuard>
      <OrganizationsContent />
    </AuthGuard>
  )
}
