'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { buildPaginatedChartData } from '@/lib/finance'
import { ProgressChart } from './progress-chart'
import { Glass, Eyebrow } from './shared'

export function MonthlyChart() {
  const { logs, goal, allGoals } = useFinance()
  const [page, setPage] = useState(0)

  const { points, totalPages, dateRange } = useMemo(
    () => buildPaginatedChartData(logs, goal, allGoals, page),
    [logs, goal, allGoals, page]
  )

  const canGoBack = page < totalPages - 1
  const canGoForward = page > 0

  return (
    <Glass className="h-fit p-4">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Progress over time</Eyebrow>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-base font-semibold">Interpretation minutes</h2>
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
          <p className="mt-1 text-xs text-muted-foreground">
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
      <div className="mt-3"><ProgressChart data={points} /></div>
    </Glass>
  )
}
