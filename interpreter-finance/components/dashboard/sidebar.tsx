'use client'

import { LayoutDashboard, Clock3, Target, BarChart3, Wallet, MessageSquare, ListChecks, Settings2, LogOut, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type View = 'Overview' | 'Daily log' | 'Goals' | 'Earnings' | 'Insights' | 'AI chat' | 'Activity'

function SignOutButton() {
  const { signOut } = useAuth()
  return (
    <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-400">
      <LogOut className="size-4" />Sign out
    </button>
  )
}

const NAV_ITEMS: { key: View; label: string; icon: React.ElementType }[] = [
  { key: 'Overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'Activity', label: 'Activity', icon: ListChecks },
  { key: 'Daily log', label: 'Daily log', icon: Clock3 },
  { key: 'Goals', label: 'Goals', icon: Target },
  { key: 'Earnings', label: 'Earnings', icon: Wallet },
  { key: 'Insights', label: 'Insights', icon: BarChart3 },
  { key: 'AI chat', label: 'interpreter AI', icon: MessageSquare },
]

export function Sidebar({ active, onNavigate, open, onClose }: { active: View; onNavigate: (view: View) => void; open: boolean; onClose: () => void }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-sidebar/90 p-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <img src="/icon.svg" className="w-7 h-7" alt="Interpreter Finance" />
          <div>
            <p className="text-sm font-semibold">Interpreter</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Finance</p>
          </div>
        </div>
        <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X className="size-4" /></button>
      </div>
      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-8">
        <div>
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Activity</p>
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.key} onClick={() => { onNavigate(item.key); onClose() }} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active === item.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                <item.icon className="size-4" />{item.label}
                {active === item.key && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Manage</p>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5"><Settings2 className="size-4" />Settings</button>
          <SignOutButton />
        </div>
      </nav>
    </aside>
  )
}
