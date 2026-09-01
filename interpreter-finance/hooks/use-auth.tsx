'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {}, isLoading: true, signOut: async () => {} })


// RETRIEVES THE CURRENT USER STATE FROM THE AUTHENTICATION CONTEXT
// CUSTOM HOOK TO ACCESS THE AUTHENTICATION CONTEXT, PROVIDING USER STATE AND AUTH METHODS
export function useAuth() {
  return useContext(AuthContext)
}


// PROVIDES AUTHENTICATION CONTEXT INCLUDING SESSION INITIALIZATION, PROFILE LOADING, AND SIGN-OUT
// AUTHENTICATION PROVIDER COMPONENT THAT INITIALIZES SESSION STATE, LISTENS FOR AUTH CHANGES, AND FETCHES USER PROFILES
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select().eq('id', session.user.id).single().then(({ data, error }) => {
          if (error || !data) {
            setUser(null)
          } else {
            setUser(data)
          }
          setIsLoading(false)
        })
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        setUser(null)
        setIsLoading(false)
        return
      }
      if (_event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
        return
      }

      if (session?.user) {
        supabase.from('profiles').select().eq('id', session.user.id).single().then(({ data, error }) => {
          if (error || !data) {
            setUser(null)
          } else {
            setUser(data)
          }
          setIsLoading(false)
        })
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  // SIGNS OUT THE CURRENT USER, CLEARS THE SESSION STATE, AND REDIRECTS TO THE LOGIN PAGE
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
    router.refresh()
  }, [router])

  const value = useMemo(() => ({ user, setUser, isLoading, signOut }), [user, isLoading, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}