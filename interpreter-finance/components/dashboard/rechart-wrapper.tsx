'use client'

// eslint-disable-next-line react-doctor/prefer-dynamic-import
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ChartPoint } from '@/lib/finance'

export default function RechartWrapper({ data }: { data: ChartPoint[] }) {
  const goals = data.map((d) => d.goal || 0)
  const goalMax = goals.length > 0 ? Math.max(...goals) : 0
  const minutesMax = data.length > 0 ? Math.max(...data.map((d) => d.minutes || 0)) : 0
  const maxDataValue = Math.max(goalMax, minutesMax)
  const yMax = goalMax > 0 ? Math.ceil((goalMax * 1.15) / 10) * 10 : Math.max(120, Math.ceil(maxDataValue))

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
          <XAxis dataKey={(d) => d.label || d.day} tickLine={false} axisLine={false} tick={false} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} domain={[0, yMax]} />
          <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--foreground)' }} formatter={(value) => [`${value} min`, 'Interpreted']} />
          <Area type="monotone" dataKey="goal" stroke="var(--chart-2)" strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
          <Area type="monotone" dataKey="minutes" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#aquaFill)" dot={false} activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--background)', strokeWidth: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
