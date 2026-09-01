'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createProfile } from '@/lib/profiles'
import { AuthSuccessScreen } from './auth-success-screen'
import { AuthFormFields } from './auth-form-fields'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verifyPassword, setVerifyPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showVerifyPassword, setShowVerifyPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (signedIn) {
      const t = setTimeout(() => { router.push('/'); router.refresh() }, 1200)
      return () => clearTimeout(t)
    }
  }, [signedIn, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (password !== verifyPassword) {
          setError('Passwords do not match.')
          setLoading(false)
          return
        }

        if (password.length > 64 || password.length < 4) {
          setError('Password must be between 4 and 64 characters.')
          setLoading(false)
          return
        }

        if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
          setError('Password must include uppercase, lowercase, number, and special character.')
          setLoading(false)
          return
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName } },
        })

        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }

        if (signUpData.user) {
          const { error: profileError } = await createProfile(signUpData.user.id, firstName, lastName, email)

          if (profileError) {
            setError(profileError.message)
            setLoading(false)
            return
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          setLoading(false)
          return
        }
      }

      setSignedIn(true)
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (signedIn) {
    return <AuthSuccessScreen />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 text-center">
          <img src="/icon.svg" className="mx-auto w-10 h-10" alt="Interpreter Finance" />
          <h1 className="mt-2 text-2xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === 'login' ? 'Sign in to your account' : 'Start tracking your practice'}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthFormFields
            mode={mode}
            firstName={firstName}
            onFirstNameChange={setFirstName}
            lastName={lastName}
            onLastNameChange={setLastName}
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            verifyPassword={verifyPassword}
            onVerifyPasswordChange={setVerifyPassword}
            showVerifyPassword={showVerifyPassword}
            onToggleVerifyPassword={() => setShowVerifyPassword(!showVerifyPassword)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {loading ? 'Signing in...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-primary hover:underline">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
        {mode === 'register' && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Password must be 4-64 characters with uppercase, lowercase, number, and special character.</p>
        )}
      </div>
    </div>
  )
}
