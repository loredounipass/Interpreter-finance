'use client'

import { useFinance } from '@/hooks/use-finance'
import { ProgressChart } from './progress-chart'
import { Glass, Eyebrow } from './shared'

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
