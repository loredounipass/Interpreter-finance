'use client'

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ChartPoint } from '@/lib/finance'

export function ProgressChart({ data }: { data: ChartPoint[] }) {
  const maxDataValue = data.length > 0 ? Math.max(...data.map((d) => Math.max(d.goal || 0, d.minutes || 0))) : 120
  const yMax = Math.max(120, Math.ceil(maxDataValue / 10) * 10)
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i))

  return (
    <div className="h-[200px] w-full" aria-label="Daily interpretation minutes chart" role="img">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="aquaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.34} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="4 6" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} interval={3} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} domain={[0, yMax]} ticks={ticks} />
          <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--foreground)' }} formatter={(value) => [`${value} min`, 'Interpreted']} />
          <Area type="monotone" dataKey="goal" stroke="var(--chart-2)" strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
          <Area type="monotone" dataKey="minutes" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#aquaFill)" dot={false} activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--background)', strokeWidth: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}