'use client'

import { Menu } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type View = 'Overview' | 'Daily log' | 'Goals' | 'Earnings' | 'Insights' | 'AI chat' | 'Activity' | 'Downloads'

const VIEW_LABELS: Record<View, string> = {
  Overview: 'Overview',
  'Daily log': 'Daily log',
  Goals: 'Goals',
  Earnings: 'Earnings',
  Insights: 'Insights',
  'AI chat': 'interpreter AI',
  Activity: 'Activity',
  Downloads: 'Downloads',
}

export function Header({ view, onMenu }: { view: View; onMenu: () => void }) {
  const { user } = useAuth()
  const firstName = user?.first_name ?? ''
  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:px-10">
      <div className="flex items-center gap-3">
        <button className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="size-5" /></button>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{VIEW_LABELS[view]}</p>
          <h1 className="mt-1 text-lg font-semibold">{greeting}, {firstName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-primary" />Synced just now
        </span>
        <div className="grid size-9 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">{initials}</div>
      </div>
    </header>
  )
}
