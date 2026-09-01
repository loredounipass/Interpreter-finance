'use client'

import { Check, Target, Flame } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { ProgressChart } from './progress-chart'
import { StatCard } from './stat-card'
import { GoalSettings } from './goal-settings'
import { Glass, Eyebrow } from './shared'

export function Goals() {
  const { goal, goalHitRate, summary, dailyData } = useFinance()
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
        
        <div className="mt-8">
          <Eyebrow>Progress over time</Eyebrow>
          <h2 className="mt-1 text-xl font-semibold">Interpretation minutes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Daily minutes compared with the {goal} minute goal.</p>
          <div className="mt-4 h-[200px] w-full">
            <ProgressChart data={dailyData} />
          </div>
        </div>
      </Glass>
    </div>
  )
}
