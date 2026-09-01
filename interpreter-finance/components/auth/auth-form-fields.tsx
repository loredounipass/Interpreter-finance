'use client'

import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'

interface AuthFormFieldsProps {
  mode: 'login' | 'register'
  firstName: string
  onFirstNameChange: (value: string) => void
  lastName: string
  onLastNameChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  showPassword: boolean
  onTogglePassword: () => void
  verifyPassword: string
  onVerifyPasswordChange: (value: string) => void
  showVerifyPassword: boolean
  onToggleVerifyPassword: () => void
}

export function AuthFormFields({
  mode,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  verifyPassword,
  onVerifyPasswordChange,
  showVerifyPassword,
  onToggleVerifyPassword,
}: AuthFormFieldsProps) {
  return (
    <>
      {mode === 'register' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" required placeholder="First name" value={firstName} onChange={(e) => onFirstNameChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" required placeholder="Last name" value={lastName} onChange={(e) => onLastNameChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
            </div>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" required placeholder="Email" value={email} onChange={(e) => onEmailChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
          </div>
        </>
      )}
      {mode === 'login' && (
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type="email" required placeholder="Email" value={email} onChange={(e) => onEmailChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 text-sm outline-none focus:border-primary/50" />
        </div>
      )}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input type={showPassword ? 'text' : 'password'} required placeholder="Password" value={password} onChange={(e) => onPasswordChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary/50" />
        <button type="button" onClick={onTogglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {mode === 'register' && (
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type={showVerifyPassword ? 'text' : 'password'} required placeholder="Verify password" value={verifyPassword} onChange={(e) => onVerifyPasswordChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary/50" />
          <button type="button" onClick={onToggleVerifyPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showVerifyPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      )}
    </>
  )
}
