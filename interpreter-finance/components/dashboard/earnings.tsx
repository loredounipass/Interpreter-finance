'use client'

import { useMemo } from 'react'
import { Check, Clock3, CalendarDays, BarChart3, CalendarRange, Trophy, BadgeDollarSign, Wallet } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { formatMinutes, formatLongDate, computeEarnings } from '@/lib/finance'
import { StatCard } from './stat-card'
import { Glass, Eyebrow } from './shared'

export function Earnings() {
  const { logs, goal, ratePerMinute } = useFinance()
  const { todayEarnings, weekEarnings, monthEarnings, yearEarnings, totalEarnings, qualifiedDays } = useMemo(
    () => computeEarnings(logs, goal, ratePerMinute),
    [logs, goal, ratePerMinute]
  )
  const qualifiedCount = qualifiedDays.filter((d) => d.qualified).length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <StatCard label="Today" value={`$${todayEarnings.toFixed(2)}`} note="Goal met days only" icon={BadgeDollarSign} />
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
