'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { supabase } from '@/lib/supabase'

function HomeContent() {
  const [personsCount, setPersonsCount] = useState<number>(0)
  const [organizationsCount, setOrganizationsCount] = useState<number>(0)
  const [todosDueTodayCount, setTodosDueTodayCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch total persons count
        const { count: personsTotal, error: personsError } = await supabase
          .from('person')
          .select('*', { count: 'exact', head: true })

        if (personsError) throw personsError
        setPersonsCount(personsTotal || 0)

        // Fetch total organizations count
        const { count: orgsTotal, error: orgsError } = await supabase
          .from('organization')
          .select('*', { count: 'exact', head: true })

        if (orgsError) throw orgsError
        setOrganizationsCount(orgsTotal || 0)

        // Fetch todo count due today (incomplete todos with a due date on or before today)
        const now = new Date()
        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-')
        const {
          data: todosDueData,
          count: todosDueTotal,
          error: todosDueError,
        } = await supabase
          .from('todos')
          .select('id,title,due_date,completed,user_id,assigned_to', { count: 'exact' })
          .eq('completed', false)
          .not('due_date', 'is', null)
          .lte('due_date', today)

        if (todosDueError) throw todosDueError

        console.log('Todos due today query result:', {
          today,
          todosDueTotal,
          todosDueData,
        })
        setTodosDueTodayCount(todosDueTotal || 0)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Atlas CRM</h1>
              <p className="text-muted-foreground">
                The official CRM for Atlas Strategies.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-card p-6 shadow-sm">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Total Persons</h3>
                <p className="text-2xl font-bold">{loading ? '...' : personsCount}</p>
                <p className="text-xs text-muted-foreground mt-2">In system</p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-card p-6 shadow-sm">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Total Organizations</h3>
                <p className="text-2xl font-bold">{loading ? '...' : organizationsCount}</p>
                <p className="text-xs text-muted-foreground mt-2">In system</p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-card p-6 shadow-sm">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">To-Do Items Due Today</h3>
                <p className="text-2xl font-bold">{loading ? '...' : todosDueTodayCount}</p>
                <p className="text-xs text-muted-foreground mt-2">Across all users</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  )
}
