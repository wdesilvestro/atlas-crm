'use client'

import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

function HomeContent() {
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
                Your customer relationship management solution. Use the sidebar to navigate to different sections.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-card p-6 shadow-sm">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Total Contacts</h3>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-muted-foreground mt-2">Across all contacts</p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-card p-6 shadow-sm">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Active Deals</h3>
                <p className="text-2xl font-bold">45</p>
                <p className="text-xs text-muted-foreground mt-2">In progress</p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-card p-6 shadow-sm">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Closed This Month</h3>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground mt-2">Successfully completed</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="font-semibold mb-4">Quick Actions</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  Create a new contact
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  View all deals
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  Check your pipeline
                </li>
              </ul>
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
