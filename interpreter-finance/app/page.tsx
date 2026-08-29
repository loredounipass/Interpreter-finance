'use client'

import { useAuth } from '@/hooks/use-auth'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/dashboard/dashboard-components'

export default function Page() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    redirect('/login')
  }

  return <Dashboard />
}