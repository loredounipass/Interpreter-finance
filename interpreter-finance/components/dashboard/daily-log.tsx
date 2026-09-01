'use client'

import { BadgeDollarSign } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { StatCard } from './stat-card'
import { GoalCard } from './goal-card'
import { ActivityList } from './activity-list'
import { CalendarCard } from './calendar-card'

export function DailyLog() {
  const { todayEarnings } = useFinance()
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <StatCard label="Today's Earnings" value={`$${todayEarnings.toFixed(2)}`} note="" icon={BadgeDollarSign} size="lg" />
      <GoalCard /><ActivityList /><CalendarCard />
    </div>
  )
}
