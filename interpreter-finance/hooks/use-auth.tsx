'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type User = {
  id: string
  first_name: string
  last_name: string
  email: string
  timezone: string
  created_at: string
  updated_at: string
} | null

type AuthContextType = {
  user: User
  setUser: (user: User) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {}, isLoading: true })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select().eq('id', session.user.id).single().then(({ data }) => {
          setUser(data)
          setIsLoading(false)
        })
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('profiles').select().eq('id', session.user.id).single().then(({ data }) => {
          setUser(data)
          setIsLoading(false)
        })
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  return <AuthContext.Provider value={{ user, setUser, isLoading }}>{children}</AuthContext.Provider>
}