'use client'

import '@/lib/ag-grid-setup'
import { AuthProvider } from '@/lib/auth-context'
import { CommandPalette } from '@/components/command-palette'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CommandPalette />
    </AuthProvider>
  )
}
