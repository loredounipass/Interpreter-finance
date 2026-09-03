'use client'

import { useState, useMemo } from 'react'
import { BadgeDollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useFinance } from '@/hooks/use-finance'
import { buildPaginatedChartData } from '@/lib/finance'
import { StatCard } from './stat-card'
import { GoalCard } from './goal-card'
import { ActivityList } from './activity-list'
import { CalendarCard } from './calendar-card'

function MiniProgressChart({ ratePerMinute }: { ratePerMinute: number }) {
  const { logs, goal, allGoals } = useFinance()
  const [page, setPage] = useState(0)

  const { points, totalPages } = useMemo(
    () => buildPaginatedChartData(logs, goal, allGoals, page),
    [logs, goal, allGoals, page]
  )

  const canGoBack = page < totalPages - 1
  const canGoForward = page > 0

  const earningsData = useMemo(() =>
    points.map((p) => ({
      day: p.day,
      label: p.label,
      earnings: Number((p.minutes * ratePerMinute).toFixed(2)),
    })),
    [points, ratePerMinute]
  )

  if (earningsData.length < 2) return null

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">Progress over time</p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!canGoBack}
            className="rounded p-0.5 transition-colors hover:bg-emerald-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-3.5 text-emerald-400/70" />
          </button>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!canGoForward}
            className="rounded p-0.5 transition-colors hover:bg-emerald-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-3.5 text-emerald-400/70" />
          </button>
        </div>
      </div>
      <div style={{ width: '100%', height: 56 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={earningsData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id="miniEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <Tooltip
              contentStyle={{ background: 'rgba(10,15,20,0.85)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, fontSize: 11, padding: '4px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              labelStyle={{ color: '#6ee7b7', fontSize: 10, fontWeight: 600 }}
              itemStyle={{ color: '#a7f3d0', fontSize: 11 }}
              formatter={(v: number | string | readonly (string | number)[] | undefined) => [`$${Number(v ?? 0).toFixed(2)}`, 'Earnings']}
              labelFormatter={(d: React.ReactNode, payload: any) => payload?.[0]?.payload?.label || `Day ${d}`}
              cursor={{ stroke: 'rgba(52,211,153,0.3)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="#34d399"
              strokeWidth={1.5}
              fill="url(#miniEarningsGrad)"
              dot={false}
              activeDot={{ r: 3, fill: '#34d399', stroke: '#064e3b', strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function DailyLog({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { currentMinutes, chartData, ratePerMinute } = useFinance()
  const displayEarnings = Number((currentMinutes * ratePerMinute).toFixed(2))
  
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <StatCard label="Today's Earnings" value={`$${displayEarnings.toFixed(2)}`} note="" icon={BadgeDollarSign} size="lg">
        <MiniProgressChart ratePerMinute={ratePerMinute} />
      </StatCard>
      <GoalCard /><ActivityList onNavigate={onNavigate} /><CalendarCard />
    </div>
  )
}
