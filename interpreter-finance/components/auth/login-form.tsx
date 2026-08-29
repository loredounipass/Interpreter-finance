'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

        // Sign up directly from the browser client so the session is stored here
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

        // Create profile row
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: signUpData.user.id, first_name: firstName, last_name: lastName, email }])

          if (profileError) {
            setError(profileError.message)
            setLoading(false)
            return
          }
        }
      } else {
        // Sign in directly from the browser client — this is the critical fix.
        // The session and tokens are now stored in the browser's Supabase client,
        // so AuthProvider's onAuthStateChange fires immediately and sets the user.
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

      router.push('/')
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 text-center">
          <span className="font-mono text-sm font-bold text-primary">IF</span>
          <h1 className="mt-2 text-2xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === 'login' ? 'Sign in to your account' : 'Start tracking your practice'}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
                </div>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
              </div>
            </>
          )}
          {mode === 'login' && (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
            </div>
          )}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type={showPassword ? 'text' : 'password'} required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary/50" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mode === 'register' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type={showVerifyPassword ? 'text' : 'password'} required placeholder="Verify password" value={verifyPassword} onChange={(e) => setVerifyPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary/50" />
              <button type="button" onClick={() => setShowVerifyPassword(!showVerifyPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showVerifyPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {loading ? 'Signing in...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-primary hover:underline">
            {mode === 'login' ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
        {mode === 'register' && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Password must be 4-64 characters with uppercase, lowercase, number, and special character.</p>
        )}
      </div>
    </div>
  )
}