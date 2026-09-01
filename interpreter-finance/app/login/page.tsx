'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      // eslint-disable-next-line react-doctor/nextjs-no-client-side-redirect
      router.replace('/')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return <LoginForm />
}