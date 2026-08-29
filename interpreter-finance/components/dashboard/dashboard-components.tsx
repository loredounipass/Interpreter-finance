'use client'

import { useState } from 'react'
import {
  ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown,
  Clock3, Flame, LayoutDashboard, Menu, Plus, Settings2,
  Target, X,
} from 'lucide-react'
import { ProgressChart } from './progress-chart'
import { useFinance } from '@/hooks/use-finance'
import {
  getMinutesPerHour, getWholeMinutesPerHour,
  goalMinutes, defaultWorkHours,
} from '@/lib/finance'
import { formatMinutes } from '@/lib/finance'

type View = 'Overview' | 'Daily log' | 'Goals' | 'Insights'

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-panel ${className}`}>{children}</section>
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

export function Sidebar({ active, onNavigate, open, onClose }: { active: View; onNavigate: (view: View) => void; open: boolean; onClose: () => void }) {
  const items: [View, React.ElementType][] = [
    ['Overview', LayoutDashboard],
    ['Daily log', Clock3],
    ['Goals', Target],
    ['Insights', BarChart3],
  ]
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-white/10 bg-sidebar/90 p-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <span className="font-mono text-sm font-bold">IF</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Interpreter</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Finance</p>
          </div>
        </div>
        <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X className="size-4" /></button>
      </div>
      <nav aria-label="Main navigation" className="flex flex-col gap-8">
        <div>
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
          <div className="flex flex-col gap-1">
            {items.map(([label, Icon]) => (
              <button key={label} onClick={() => { onNavigate(label); onClose() }} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active === label ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                <Icon className="size-4" />{label}
                {active === label && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Manage</p>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5"><Settings2 className="size-4" />Settings</button>
        </div>
      </nav>
    </aside>
  )
}

export function Header({ view, onMenu }: { view: View; onMenu: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:px-10">
      <div className="flex items-center gap-3">
        <button className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="size-5" /></button>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{view}</p>
          <h1 className="mt-1 text-lg font-semibold">Good morning, Alex</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-primary" />Synced just now
        </span>
        <div className="grid size-9 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">AM</div>
      </div>
    </header>
  )
}

export function StatCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: React.ElementType }) {
  return (
    <Glass className="flex min-h-28 flex-col justify-between p-3.5">
      <div className="flex items-start justify-between">
        <p className="max-w-32 text-xs leading-5 text-muted-foreground">{label}</p>
        <div className="grid size-7 place-items-center rounded-md bg-primary/15 text-primary"><Icon className="size-4" /></div>
      </div>
      <div>
        <p className="font-mono text-2xl font-medium">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </div>
    </Glass>
  )
}

export function GoalCard() {
  const { currentMinutes, goal, progress, addMinutes, setMinutes, saveMinutes, isSaving } = useFinance()
  return (
    <Glass className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Today&apos;s focus</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold">Keep the momentum</h2>
          <p className="mt-1 text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary">{goal} min goal</span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="font-mono text-4xl font-medium">{currentMinutes}</span>
          <span className="ml-2 text-sm text-muted-foreground">minutes logged</span>
        </div>
        <span className="font-mono text-sm text-primary">{progress}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {[15, 30, 45].map((value) => (
          <button key={value} onClick={() => addMinutes(value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-muted-foreground hover:border-primary/30 hover:text-primary">+{value} min</button>
        ))}
        <button onClick={() => setMinutes(0)} className="ml-auto rounded-lg px-3 py-2 text-xs text-muted-foreground">Reset</button>
        <button onClick={saveMinutes} disabled={isSaving} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save log'}
        </button>
      </div>
    </Glass>
  )
}

export function GoalSettings() {
  const { goal: hookGoal, saveGoal } = useFinance()
  const [goal, setGoal] = useState(hookGoal)
  const [workHours, setWorkHours] = useState(defaultWorkHours)
  const minutesPerHour = getMinutesPerHour(goal, workHours)
  const wholeMinutesPerHour = getWholeMinutesPerHour(goal, workHours)
  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Daily target</Eyebrow>
          <p className="mt-1 text-sm text-muted-foreground">Set your goal and available work period.</p>
        </div>
        <Target className="size-5 text-primary" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Goal minutes</span>
          <input type="number" min="1" value={goal} onChange={(e) => setGoal(Math.max(1, Number(e.target.value) || 0))} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Work period</span>
          <div className="flex items-center gap-2">
            <input type="number" min="1" max="24" value={workHours} onChange={(e) => setWorkHours(Math.max(1, Math.min(24, Number(e.target.value) || 1)))} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </label>
      </div>
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <p className="text-xs text-muted-foreground">Required pace per hour</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-3xl text-primary">{minutesPerHour}</span>
          <span className="text-sm text-muted-foreground">minutes / hour</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          For {goal} minutes across {workHours} hours, plan about <span className="font-semibold text-foreground">{wholeMinutesPerHour} minutes every hour</span>.
        </p>
      </div>
      <button onClick={() => saveGoal(goal)} className="mt-5 w-full rounded-lg border border-primary/25 bg-primary/10 py-2.5 text-xs font-semibold text-primary">Update daily goal</button>
    </Glass>
  )
}

export function ActivityList() {
  const { recentEntries } = useFinance()
  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div><Eyebrow>Recent activity</Eyebrow><h2 className="mt-1 text-lg font-semibold">Latest logs</h2></div>
        <button className="flex items-center gap-1 text-xs text-primary">View all <ArrowUpRight className="size-3.5" /></button>
      </div>
      <div className="mt-5 flex flex-col gap-1">
        {recentEntries.map((entry, i) => (
          <div key={entry.date + i} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.04]">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary"><Clock3 className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.note}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{entry.date}</p>
            </div>
            <span className="font-mono text-sm">{entry.minutes}m</span>
          </div>
        ))}
      </div>
    </Glass>
  )
}

export function CalendarCard() {
  const { calendarDays, goal } = useFinance()
  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div><Eyebrow>Monthly rhythm</Eyebrow><h2 className="mt-1 text-lg font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div>
        <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Month <ChevronDown className="size-3" /></button>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <span key={`${day}-${i}`} className="pb-1 text-center font-mono text-[10px] text-muted-foreground">{day}</span>)}
        {Array.from({ length: 5 }).map((_, i) => <span key={`empty-${i}`} />)}
        {calendarDays.map(({ day, minutes }) => (
          <div key={day} className={`grid aspect-square place-items-center rounded-md font-mono text-[10px] ${minutes >= goal ? 'bg-primary/25 text-primary' : 'bg-white/[0.07] text-muted-foreground'} ${day === new Date().getDate() ? 'ring-1 ring-primary' : ''}`}>{day}</div>
        ))}
      </div>
    </Glass>
  )
}

export function MonthlyChart() {
  const { goal, chartData } = useFinance()
  return (
    <Glass className="h-fit self-start p-4">
      <div>
        <Eyebrow>Progress over time</Eyebrow>
        <h2 className="mt-1 text-base font-semibold">Interpretation minutes</h2>
        <p className="mt-1 text-xs text-muted-foreground">Daily minutes compared with the {goal} minute goal.</p>
      </div>
      <div className="mt-3"><ProgressChart data={chartData} /></div>
    </Glass>
  )
}

function Operations() {
  const { currentMinutes, goal, monthTotal, goalHitRate, completedDays, summary } = useFinance()
  return (
    <>
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <StatCard label="Minutes logged today" value={`${currentMinutes}m`} note={`of ${goal} minute goal`} icon={Clock3} />
        <StatCard label="Monthly total" value={formatMinutes(monthTotal)} note="+12.4% vs last month" icon={Target} />
        <StatCard label="Goal completion" value={`${goalHitRate}%`} note={`${completedDays} of 29 days`} icon={Check} />
        <StatCard label="Current streak" value={`${summary.streak}d`} note="Best streak: 12 days" icon={Flame} />
      </div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <MonthlyChart />
        <div className="flex flex-col gap-4"><GoalCard /><GoalSettings /></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <ActivityList /><CalendarCard />
      </div>
    </>
  )
}

function DailyLog() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <GoalCard /><ActivityList /><CalendarCard />
    </div>
  )
}

function Goals() {
  const { goal } = useFinance()
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <GoalSettings />
      <Glass className="p-6">
        <Eyebrow>Goal performance</Eyebrow>
        <h2 className="mt-1 text-xl font-semibold">Your target, in context</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="Daily goal" value={`${goal}m`} note="Current target" icon={Target} />
          <StatCard label="Hit rate" value="62%" note="This month" icon={Check} />
          <StatCard label="Best streak" value="12d" note="Personal best" icon={Flame} />
        </div>
      </Glass>
    </div>
  )
}

function Insights() {
  const { weeklyData, monthTotal, goalHitRate } = useFinance()
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly total" value={formatMinutes(monthTotal)} note="Trending upward" icon={Clock3} />
        <StatCard label="Average session" value={`${Math.round(monthTotal / Math.max(weeklyData.length, 1))}m`} note={`Across ${weeklyData.length} sessions`} icon={BarChart3} />
        <StatCard label="Consistency" value={`${goalHitRate}%`} note="Strong rhythm" icon={Flame} />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <MonthlyChart />
        <Glass className="h-fit p-4">
          <Eyebrow>Weekly breakdown</Eyebrow>
          <h2 className="mt-1 text-base font-semibold">Where your time went</h2>
          <div className="mt-4 flex flex-col gap-4">
            {weeklyData.map((week) => (
              <div key={week.week} className="flex items-center gap-4">
                <span className="w-8 font-mono text-xs text-muted-foreground">{week.week}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((week.actual / 560) * 100)}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-xs">{formatMinutes(week.actual)}</span>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [active, setActive] = useState<View>('Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const { summaryMessage } = useFinance()
  const content = active === 'Overview' ? <Operations /> : active === 'Daily log' ? <DailyLog /> : active === 'Goals' ? <Goals /> : <Insights />
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar active={active} onNavigate={setActive} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 flex-1">
          <Header view={active} onMenu={() => setMenuOpen(true)} />
          <main className="mx-auto max-w-[1280px] p-4 lg:p-7">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {active === 'Overview' ? <>Your practice,<br className="sm:hidden" /> in perspective.</> : active}
                </h2>
              </div>
              <button onClick={() => setActive('Daily log')} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                <Plus className="size-4" />Log minutes
              </button>
            </div>
            {content}
            <footer className="mt-10 flex justify-between gap-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Interpreter Finance · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>{summaryMessage}</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
