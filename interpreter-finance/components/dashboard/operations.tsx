'use client'

import { Check, Clock3, Flame, Target, BadgeDollarSign } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { formatMinutes } from '@/lib/finance'
import { StatCard } from './stat-card'
import { MonthlyChart } from './monthly-chart'
import { ActivityList } from './activity-list'

export function Operations({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { todayTotal, goal, monthTotal, goalHitRate, completedDays, summary, weekDelta, todayEarnings, monthEarnings } = useFinance()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Minutes logged today" value={`${Number(todayTotal.toFixed(2))}m`} note={goal > 0 ? (goal - todayTotal > 0 ? `${Number((goal - todayTotal).toFixed(2))}m left` : 'Completed') : 'No goal set'} icon={Clock3} />
        <StatCard label="Today's Earnings" value={`$${todayEarnings.toFixed(2)}`} note={`$${monthEarnings.toFixed(2)} this month`} icon={BadgeDollarSign} />
        <StatCard label="Monthly total" value={formatMinutes(monthTotal)} note={`${weekDelta} vs last month`} icon={Target} />
        <StatCard label="Goal completion" value={`${goalHitRate}%`} note={`${completedDays} of ${daysInMonth} days`} icon={Check} />
        <StatCard label="Current streak" value={`${summary.streak}d`} note="Keep it going!" icon={Flame} />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <MonthlyChart />
        <ActivityList onNavigate={onNavigate} />
      </div>
    </>
  )
}
