'use client'

import { useState } from 'react'
import { ArrowUpRight, Clock3, ChevronRight } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { Glass, Eyebrow } from './shared'
import { DailyLogsDialog } from './daily-logs-dialog'

export function ActivityList() {
  const { recentEntries } = useFinance()
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

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
            <button 
              key={entry.dateKey + i} 
              onClick={() => setSelectedDateKey(entry.dateKey)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/[0.04] transition-colors"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Clock3 className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.date}</p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{entry.note}</p>
              </div>
              <span className="shrink-0 font-mono text-sm">{Number(entry.minutes.toFixed(2))}m</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      {selectedDateKey && (
        <DailyLogsDialog 
          dateKey={selectedDateKey} 
          onClose={() => setSelectedDateKey(null)} 
        />
      )}
    </Glass>
  )
}
