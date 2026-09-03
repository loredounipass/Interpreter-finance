'use client'

import { useState, useMemo } from 'react'
import { Check, Target, Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { buildPaginatedChartData } from '@/lib/finance'
import { ProgressChart } from './progress-chart'
import { StatCard } from './stat-card'
import { GoalSettings } from './goal-settings'
import { Glass, Eyebrow } from './shared'

export function Goals() {
  const { logs, goal, allGoals, goalHitRate, summary } = useFinance()
  const [page, setPage] = useState(0)

  const { points, totalPages, dateRange } = useMemo(
    () => buildPaginatedChartData(logs, goal, allGoals, page),
    [logs, goal, allGoals, page]
  )

  const canGoBack = page < totalPages - 1
  const canGoForward = page > 0

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
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Progress over time</Eyebrow>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-xl font-semibold">Interpretation minutes</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!canGoBack}
                    className="rounded hover:bg-white/10 p-1 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Previous period"
                  >
                    <ChevronLeft className="size-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!canGoForward}
                    className="rounded hover:bg-white/10 p-1 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Next period"
                  >
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {dateRange || 'No data yet'}
                {page > 0 && (
                  <button
                    onClick={() => setPage(0)}
                    className="ml-2 text-primary hover:underline"
                  >
                    ← Back to latest
                  </button>
                )}
              </p>
            </div>
            {totalPages > 1 && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
            )}
          </div>
          <div className="mt-4 h-[200px] w-full">
            <ProgressChart data={points} />
          </div>
        </div>
      </Glass>
    </div>
  )
}
