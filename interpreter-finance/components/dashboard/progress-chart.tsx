'use client'

import dynamic from 'next/dynamic'
import type { ChartPoint } from '@/lib/finance'

const Rechart = dynamic(() => import('./rechart-wrapper'), { ssr: false })

export function ProgressChart({ data }: { data: ChartPoint[] }) {
  return <Rechart data={data} />
}
