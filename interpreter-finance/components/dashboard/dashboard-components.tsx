'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown,
  Clock3, Flame, LayoutDashboard, LogOut, Menu, Plus, Settings2,
  Target, X, BadgeDollarSign, Wallet, CalendarRange, Trophy,
} from 'lucide-react'
import { ProgressChart } from './progress-chart'
import { useFinance } from '@/hooks/use-finance'
import { useAuth } from '@/hooks/use-auth'
import {
  getMinutesPerHour, getWholeMinutesPerHour,
  goalMinutes, defaultWorkHours,
} from '@/lib/finance'
import { formatMinutes, formatLongDate, computeEarnings } from '@/lib/finance'

type View = 'Overview' | 'Daily log' | 'Goals' | 'Insights' | 'Earnings'

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
    ['Earnings', Wallet],
    ['Insights', BarChart3],
  ]
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-sidebar/90 p-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
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
      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-8">
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
        <div className="mt-auto">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Manage</p>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5"><Settings2 className="size-4" />Settings</button>
          <SignOutButton />
        </div>
      </nav>
    </aside>
  )
}

function SignOutButton() {
  const { signOut } = useAuth()
  return (
    <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-400">
      <LogOut className="size-4" />Sign out
    </button>
  )
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
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{view}</p>
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

export function StatCard({ label, value, note, icon: Icon, large = false, size }: { label: string; value: string; note: string; icon: React.ElementType; large?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const valueSizes = { sm: 'font-mono text-xl font-medium', md: 'font-mono text-2xl font-medium', lg: 'font-mono text-4xl font-bold', xl: 'font-mono text-5xl font-bold' }
  const effective = size ?? (large ? 'xl' : 'md')
  const isLarge = effective === 'xl' || effective === 'lg'
  const labelSize = isLarge ? 'text-xl font-bold' : 'text-xs text-muted-foreground'
  const valueSize = valueSizes[effective]
  const noteSize = isLarge ? 'text-lg text-muted-foreground' : 'text-xs text-muted-foreground'
  const iconSize = isLarge ? 'size-6' : 'size-4'
  return (
    <Glass className="flex min-h-28 flex-col items-start p-3.5">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-primary/15 text-primary"><Icon className={iconSize} /></div>
        <p className={labelSize}>{label}</p>
      </div>
      <p className={valueSize} style={{ marginTop: isLarge ? '0.5rem' : '0.25rem' }}>{value}</p>
      {note && <p className={noteSize} style={{ marginTop: isLarge ? '0.25rem' : '0.125rem' }}>{note}</p>}
    </Glass>
  )
}

export function GoalCard() {
  const { currentMinutes, goal, progress, addMinutes, setMinutes, saveMinutes, isSaving } = useFinance()
  const [draftMins, setDraftMins] = useState('')

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (draftMins && Number(draftMins) > 0) {
      addMinutes(Number(draftMins))
      setDraftMins('')
    }
  }
  return (
    <Glass className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Today&apos;s focus</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold">Keep the momentum</h2>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary">
          {goal > 0 ? (goal - currentMinutes > 0 ? `${Number((goal - currentMinutes).toFixed(2))} min remaining` : 'Goal reached! 🎉') : 'No goal set'}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="font-mono text-4xl font-medium">{Number(currentMinutes.toFixed(2))}</span>
          <span className="ml-2 text-sm text-muted-foreground">minutes logged</span>
        </div>
        <span className="font-mono text-sm text-primary">{progress}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[15, 30, 45].map((value) => (
          <button key={value} onClick={() => addMinutes(value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-muted-foreground hover:border-primary/30 hover:text-primary">
            +{value}m
          </button>
        ))}
        
        <form onSubmit={handleAdd} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 focus-within:border-primary/50">
          <span className="text-xs text-muted-foreground">+</span>
          <input 
            type="number" 
            min="0.01" 
            step="any"
            placeholder="custom"
            value={draftMins} 
            onChange={(e) => setDraftMins(e.target.value)} 
            className="w-14 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/30" 
          />
          <button type="submit" disabled={!draftMins} className="px-2 text-xs font-semibold text-primary disabled:opacity-50">Add</button>
        </form>

        <button onClick={saveMinutes} disabled={isSaving} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save log'}
        </button>
        <button onClick={() => setMinutes(0)} className="ml-auto rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Reset</button>
      </div>
    </Glass>
  )
}

export function GoalSettings() {
  const { goal: hookGoal, workHours: hookWorkHours, ratePerMinute: hookRatePerMinute, saveGoal } = useFinance()
  // Use string state so the fields can be cleared and typed freely (e.g. 24, 50)
  // without snapping back to 0 or being capped.
  const [goal, setGoal] = useState(String(hookGoal))
  const [workHours, setWorkHoursLocal] = useState(String(hookWorkHours))
  const [ratePerMinute, setRatePerMinute] = useState(String(hookRatePerMinute))

  // Sync local state when hook loads data from Supabase
  useEffect(() => { setGoal(String(hookGoal)) }, [hookGoal])
  useEffect(() => { setWorkHoursLocal(String(hookWorkHours)) }, [hookWorkHours])
  useEffect(() => { setRatePerMinute(String(hookRatePerMinute)) }, [hookRatePerMinute])

  const numGoal = Number(goal) || 0
  const numWorkHours = Number(workHours) || 0
  const numRate = Number(ratePerMinute) || 0

  const minutesPerHour = getMinutesPerHour(numGoal, numWorkHours)
  const wholeMinutesPerHour = getWholeMinutesPerHour(numGoal, numWorkHours)

  const clearAll = () => {
    setGoal('')
    setWorkHoursLocal('')
    setRatePerMinute('')
  }

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
          <input type="number" min="0" step="any" value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Work period</span>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="any" value={workHours} onChange={(e) => setWorkHoursLocal(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rate per minute</span>
          <input type="number" min="0" step="0.01" value={ratePerMinute} onChange={(e) => setRatePerMinute(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
        </label>
      </div>
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <p className="text-xs text-muted-foreground">Required pace per hour</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-3xl text-primary">{minutesPerHour}</span>
          <span className="text-sm text-muted-foreground">minutes / hour</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          For {numGoal} minutes across {numWorkHours} hours, plan about <span className="font-semibold text-foreground">{wholeMinutesPerHour} minutes every hour</span>.
        </p>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={() => saveGoal(numGoal, numWorkHours, numRate)} className="flex-1 rounded-lg border border-primary/25 bg-primary/10 py-2.5 text-xs font-semibold text-primary">Update daily goal</button>
        <button onClick={clearAll} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground">Clear</button>
      </div>
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
      <div className="mt-5 flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
        {recentEntries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No practice logged yet.</p>
        ) : (
          recentEntries.map((entry, i) => (
            <div key={entry.date + i} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.04]">
              <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary"><Clock3 className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.note}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{entry.date}</p>
              </div>
              <span className="font-mono text-sm">{entry.minutes}m</span>
            </div>
          ))
        )}
      </div>
    </Glass>
  )
}

export function CalendarCard() {
  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div><Eyebrow>Monthly rhythm</Eyebrow><h2 className="mt-1 text-lg font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div>
        <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Month <ChevronDown className="size-3" /></button>
      </div>
    </Glass>
  )
}

export function MonthlyChart() {
  const { goal, chartData } = useFinance()
  return (
    <Glass className="h-fit p-4">
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
  const { currentMinutes, todayTotal, goal, monthTotal, goalHitRate, completedDays, summary, weekDelta, todayEarnings, monthEarnings } = useFinance()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  return (
    <>
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <StatCard label="Minutes logged today" value={`${Number(todayTotal.toFixed(2))}m`} note={goal > 0 ? (goal - todayTotal > 0 ? `${Number((goal - todayTotal).toFixed(2))}m left` : 'Completed') : 'No goal set'} icon={Clock3} />
        <StatCard label="Today's Earnings" value={`$${todayEarnings.toFixed(2)}`} note={`$${monthEarnings.toFixed(2)} this month`} icon={BadgeDollarSign} />
        <StatCard label="Monthly total" value={formatMinutes(monthTotal)} note={`${weekDelta} vs last month`} icon={Target} />
        <StatCard label="Goal completion" value={`${goalHitRate}%`} note={`${completedDays} of ${daysInMonth} days`} icon={Check} />
        <StatCard label="Current streak" value={`${summary.streak}d`} note="Keep it going!" icon={Flame} />
      </div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <div className="flex flex-col gap-4">
          <MonthlyChart />
          <ActivityList />
        </div>
        <div className="flex flex-col gap-4">
          <GoalCard />
          <GoalSettings />
          <CalendarCard />
        </div>
      </div>
    </>
  )
}

function DailyLog() {
  const { todayEarnings } = useFinance()
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <StatCard label="Today's Earnings" value={`$${todayEarnings.toFixed(2)}`} note="" icon={BadgeDollarSign} size="lg" />
      <GoalCard /><ActivityList /><CalendarCard />
    </div>
  )
}

function Goals() {
  const { goal, goalHitRate, summary } = useFinance()
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <GoalSettings />
      <Glass className="p-6">
        <Eyebrow>Goal performance</Eyebrow>
        <h2 className="mt-1 text-xl font-semibold">Your target, in context</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="Daily goal" value={`${goal}m`} note="Current target" icon={Target} />
          <StatCard label="Hit rate" value={`${goalHitRate}%`} note="This month" icon={Check} />
          <StatCard label="Current streak" value={`${summary.streak}d`} note="Keep going!" icon={Flame} />
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

function Earnings() {
  const { logs, goal, ratePerMinute } = useFinance()
  const { todayEarnings, weekEarnings, monthEarnings, yearEarnings, totalEarnings, qualifiedDays } = useMemo(
    () => computeEarnings(logs, goal, ratePerMinute),
    [logs, goal, ratePerMinute]
  )
  const qualifiedCount = qualifiedDays.filter((d) => d.qualified).length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <StatCard label="Today" value={`$${todayEarnings.toFixed(2)}`} note="Goal met days only" icon={BadgeDollarSign} large />
        <StatCard label="This week" value={`$${weekEarnings.toFixed(2)}`} note="Last 7 days" icon={CalendarDays} />
        <StatCard label="This month" value={`$${monthEarnings.toFixed(2)}`} note="Current month" icon={CalendarRange} />
        <StatCard label="This year" value={`$${yearEarnings.toFixed(2)}`} note="Current year" icon={BarChart3} />
        <StatCard label="Total" value={`$${totalEarnings.toFixed(2)}`} note="All time" icon={Wallet} />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <Glass className="p-5">
          <div className="flex items-center justify-between">
            <div><Eyebrow>Qualified days</Eyebrow><h2 className="mt-1 text-lg font-semibold">Days that hit the goal</h2></div>
            <span className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary"><Trophy className="size-3.5" />{qualifiedCount} of {qualifiedDays.length} days</span>
          </div>
          <div className="mt-5 flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-1">
            {qualifiedDays.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Log some minutes to see your earnings.</p>
            ) : (
              qualifiedDays.map((d) => (
                <div key={d.date} className={`flex items-center gap-3 rounded-xl px-2 py-3 ${d.qualified ? '' : 'opacity-50'}`}>
                  <div className={`grid size-9 place-items-center rounded-lg ${d.qualified ? 'bg-primary/15 text-primary' : 'bg-white/[0.06] text-muted-foreground'}`}>
                    {d.qualified ? <Check className="size-4" /> : <Clock3 className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.note || 'Daily practice'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatLongDate(d.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{d.qualified ? `$${d.earnings.toFixed(2)}` : '$0.00'}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{d.minutes}m {goal > 0 ? `/ ${goal}m` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Glass>
        <Glass className="h-fit p-5">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-1 text-base font-semibold">Goal-based pay</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            You earn on days where you hit your daily goal of <span className="font-semibold text-foreground">{goal}m</span> at{' '}
            <span className="font-semibold text-foreground">${ratePerMinute.toFixed(2)}/minute</span>.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-muted-foreground">Daily rate check</p>
            <p className="mt-1 font-mono text-2xl">${Number((goal * ratePerMinute).toFixed(2))}/day</p>
            <p className="mt-1 text-[10px] text-muted-foreground">if you meet your {goal}m goal</p>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-muted-foreground">Potential monthly total</p>
            <p className="mt-1 font-mono text-2xl">${Number((goal * ratePerMinute * 22).toFixed(2))}/month</p>
            <p className="mt-1 text-[10px] text-muted-foreground">at ~22 qualified days</p>
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
  
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_view') as View
    if (saved && ['Overview', 'Daily log', 'Goals', 'Insights', 'Earnings'].includes(saved)) {
      setActive(saved)
    }
  }, [])

  const handleNavigate = (view: View) => {
    setActive(view)
    localStorage.setItem('dashboard_view', view)
  }

  const content = active === 'Overview' ? <Operations /> : active === 'Daily log' ? <DailyLog /> : active === 'Goals' ? <Goals /> : active === 'Earnings' ? <Earnings /> : <Insights />
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <Sidebar active={active} onNavigate={handleNavigate} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 flex-1 flex flex-col h-full overflow-y-auto">
          <Header view={active} onMenu={() => setMenuOpen(true)} />
          <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 lg:p-7">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {active === 'Overview' ? <>Your practice,<br className="sm:hidden" /> in perspective.</> : active}
                </h2>
              </div>
              <button onClick={() => handleNavigate('Daily log')} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20">
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
