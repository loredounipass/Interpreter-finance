'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { AIChat } from '@/components/ai/ai-chat'
import { useFinance } from '@/hooks/use-finance'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Operations } from './operations'
import { DailyLog } from './daily-log'
import { Goals } from './goals'
import { Insights } from './insights'
import { Earnings } from './earnings'
import { ActivityView } from './activity-view'

type View = 'Overview' | 'Daily log' | 'Goals' | 'Earnings' | 'Insights' | 'AI chat' | 'Activity'

const todayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const VIEW_LABELS: Record<View, string> = {
  Overview: 'Overview',
  'Daily log': 'Daily log',
  Goals: 'Goals',
  Earnings: 'Earnings',
  Insights: 'Insights',
  'AI chat': 'interpreter AI',
  Activity: 'Activity',
}

export function Dashboard() {
  const [active, setActive] = useState<View>('Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const { summaryMessage } = useFinance()
  const todayStr = useMemo(() => todayFormatter.format(new Date()), [])
  
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_view') as View
    if (saved && ['Overview', 'Activity', 'Daily log', 'Goals', 'Earnings', 'Insights', 'AI chat'].includes(saved)) {
      setActive(saved)
    }
  }, [])

  const handleNavigate = (view: View) => {
    setActive(view)
    localStorage.setItem('dashboard_view', view)
  }

  let content = null;
  if (active !== 'AI chat') {
    content = active === 'Overview' ? <Operations onNavigate={handleNavigate} /> : active === 'Activity' ? <ActivityView /> : active === 'Daily log' ? <DailyLog onNavigate={handleNavigate} /> : active === 'Goals' ? <Goals /> : active === 'Earnings' ? <Earnings /> : <Insights />;
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <Sidebar active={active} onNavigate={handleNavigate} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 flex-1 flex flex-col h-full overflow-y-auto">
          <Header view={active} onMenu={() => setMenuOpen(true)} />
          <main className={active === 'AI chat' ? 'w-full flex-1 min-h-0 p-0 flex flex-col' : 'mx-auto w-full max-w-[1280px] flex-1 p-4 lg:p-7 flex flex-col'}>
            <div className={active === 'AI chat' ? 'hidden' : 'contents'}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{todayStr}</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {active === 'Overview' ? <>Your practice,<br className="sm:hidden" /> in perspective.</> : VIEW_LABELS[active]}
                  </h2>
                </div>
                {active !== 'Daily log' && (
                  <button onClick={() => handleNavigate('Daily log')} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                    <Plus className="size-4" />Log minutes
                  </button>
                )}
              </div>
              {content}
              <footer className="mt-10 flex justify-between gap-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Interpreter Finance · {todayStr}</span>
                <span>{summaryMessage}</span>
              </footer>
            </div>
            <div className={active === 'AI chat' ? 'flex-1 min-h-0 w-full flex flex-col' : 'hidden'}>
              <AIChat />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
