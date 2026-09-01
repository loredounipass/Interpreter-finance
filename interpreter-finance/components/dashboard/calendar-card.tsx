'use client'

import { useMemo } from 'react'
import { useFinance } from '@/hooks/use-finance'
import { Glass, Eyebrow } from './shared'

const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function CalendarCard() {
  const { calendarDays, goal } = useFinance()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const monthYearStr = useMemo(() => monthYearFormatter.format(new Date()), [])

  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Monthly rhythm</Eyebrow>
          <h2 className="mt-1 text-lg font-semibold">{monthYearStr}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" />
          <span>logged</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`wd-${d}-${i}`} className="text-center font-mono text-[10px] uppercase text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {calendarDays.map((cell) => {
          const intensity = goal > 0 ? Math.min(cell.minutes / goal, 1) : cell.minutes > 0 ? 1 : 0
          const pct = Math.round(15 + intensity * 60)
          const isToday = cell.day === today
          const bg = cell.minutes === 0
            ? 'rgba(255,255,255,0.03)'
            : `color-mix(in oklab, var(--primary) ${pct}%, transparent)`
          return (
            <div
              key={cell.day}
              title={cell.minutes > 0 ? `${cell.minutes} min logged` : 'No minutes logged'}
              style={{ backgroundColor: bg }}
              className={`grid aspect-square place-items-center rounded-md text-xs ${isToday ? 'font-bold text-primary ring-1 ring-primary' : cell.minutes > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {cell.day}
            </div>
          )
        })}
      </div>
    </Glass>
  )
}
