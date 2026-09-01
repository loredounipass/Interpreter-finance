'use client'

import { useState } from 'react'
import { Clock3, ListChecks, ChevronRight } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { formatMinutes } from '@/lib/finance'
import { StatCard } from './stat-card'
import { Glass, Eyebrow } from './shared'
import { DailyLogsDialog } from './daily-logs-dialog'

const shortDateTimeFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

function fmtDate(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : shortDateTimeFormatter.format(d) + ' ' + timeFormatter.format(d)
}

export function ActivityView() {
  const { recentEntries, todayTotal, monthTotal } = useFinance()

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
        <StatCard label="Today's total" value={`${Number(todayTotal.toFixed(2))}m`} note="Across all sessions" icon={Clock3} />
        <StatCard label="Month total" value={formatMinutes(monthTotal)} note="This month" icon={ListChecks} />
        <StatCard label="Total days" value={`${recentEntries.length}`} note="Days with logs" icon={ListChecks} />
      </div>

      <Glass className="p-5">
        <div className="flex items-center justify-between">
          <div><Eyebrow>Recent activity</Eyebrow><h2 className="mt-1 text-lg font-semibold">Daily totals</h2></div>
          <span className="font-mono text-xs text-muted-foreground">{recentEntries.length} days</span>
        </div>
        <div className="mt-4 flex flex-col gap-1 max-h-[540px] overflow-y-auto pr-1">
          {recentEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No entries yet. Add your first minutes above.</p>
          ) : (
            recentEntries.map((entry) => (
              <button 
                key={entry.dateKey} 
                onClick={() => setSelectedDateKey(entry.dateKey)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/[0.04] transition-colors"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Clock3 className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.date}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground truncate">{entry.note}</p>
                </div>
                <span className="shrink-0 font-mono text-sm">{Number(entry.minutes.toFixed(2))}m</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </Glass>

      {selectedDateKey && (
        <DailyLogsDialog 
          dateKey={selectedDateKey} 
          onClose={() => setSelectedDateKey(null)} 
        />
      )}
    </div>
  )
}
