'use client'

import { Clock3, BarChart3, Flame } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { formatMinutes } from '@/lib/finance'
import { StatCard } from './stat-card'
import { MonthlyChart } from './monthly-chart'
import { Glass, Eyebrow } from './shared'

export function Insights() {
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
