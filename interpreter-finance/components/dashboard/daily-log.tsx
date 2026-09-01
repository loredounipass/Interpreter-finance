'use client'

import { useMemo } from 'react'
import { BadgeDollarSign } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useFinance } from '@/hooks/use-finance'
import { StatCard } from './stat-card'
import { GoalCard } from './goal-card'
import { ActivityList } from './activity-list'
import { CalendarCard } from './calendar-card'

function MiniProgressChart({ chartData, ratePerMinute }: { chartData: { day: number; minutes: number; goal: number }[]; ratePerMinute: number }) {
  const earningsData = useMemo(() =>
    chartData.map((p) => ({
      day: p.day,
      earnings: p.goal > 0 && p.minutes < p.goal ? 0 : Number((p.minutes * ratePerMinute).toFixed(2)),
    })),
    [chartData, ratePerMinute]
  )

  if (earningsData.length < 2) return null

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">Progress over time</p>
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
              labelFormatter={(d: React.ReactNode) => `Day ${d}`}
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
  const { todayEarnings, chartData, ratePerMinute } = useFinance()
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <StatCard label="Today's Earnings" value={`$${todayEarnings.toFixed(2)}`} note="" icon={BadgeDollarSign} size="lg">
        <MiniProgressChart chartData={chartData} ratePerMinute={ratePerMinute} />
      </StatCard>
      <GoalCard /><ActivityList onNavigate={onNavigate} /><CalendarCard />
    </div>
  )
}
