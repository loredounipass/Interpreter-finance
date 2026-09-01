'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { buildCalendarData, localToday } from '@/lib/finance'
import { Glass, Eyebrow } from './shared'

const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function CalendarCard() {
  const { logs, goal } = useFinance()
  const now = new Date()
  
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const monthYearStr = useMemo(() => {
    return monthYearFormatter.format(new Date(Date.UTC(viewYear, viewMonth, 1)))
  }, [viewYear, viewMonth])

  const calendarDays = useMemo(() => {
    return buildCalendarData(logs, goal, viewYear, viewMonth)
  }, [logs, goal, viewYear, viewMonth])

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const today = now.getDate()
  const todayStr = localToday()

  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Monthly rhythm</Eyebrow>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold min-w-[140px]">{monthYearStr}</h2>
            <div className="flex items-center gap-1">
              <button onClick={handlePrevMonth} className="rounded hover:bg-white/10 p-1 transition-colors">
                <ChevronLeft className="size-4 text-muted-foreground" />
              </button>
              <button onClick={handleNextMonth} className="rounded hover:bg-white/10 p-1 transition-colors">
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-green-500" /> goal met</div>
          <div className="flex items-center gap-1.5"><X className="size-3 text-red-500" /> missed & paid</div>
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
          const isToday = isCurrentMonth && cell.day === today
          const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
          const isPastDay = dayStr < todayStr
          
          let content: React.ReactNode = <span>{cell.day}</span>
          let className = `grid aspect-square place-items-center rounded-md text-xs `
          
          if (cell.goalMet) {
             content = <CheckCircle2 className="size-5 text-green-500" strokeWidth={2.5} />
             className += `bg-green-500/10 `
          } else if (cell.hasEarnings) {
             content = <X className="size-5 text-red-500" strokeWidth={2.5} />
             className += `bg-red-500/10 `
          } else if (isPastDay) {
             content = <X className="size-5 text-muted-foreground/50" strokeWidth={2} />
             className += `bg-white/[0.03] `
          } else {
             className += isToday ? 'font-bold text-primary ring-1 ring-primary bg-primary/10 ' : 'text-muted-foreground bg-white/[0.03] '
          }

          return (
            <div
              key={cell.day}
              title={cell.minutes > 0 ? `${cell.minutes} min logged` : 'No minutes logged'}
              className={className}
            >
              {content}
            </div>
          )
        })}
      </div>
    </Glass>
  )
}
