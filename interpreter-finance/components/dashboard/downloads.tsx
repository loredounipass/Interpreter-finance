'use client'

import { useState } from 'react'
import { Download, FileText, Loader2, CalendarRange, Clock3, CalendarDays, BarChart3 } from 'lucide-react'
import { useDownloads } from '@/hooks/use-downloads'
import { Glass, Eyebrow } from './shared'

const PERIODS = [
  { id: 'day', label: 'Today', icon: Clock3 },
  { id: 'week', label: 'This Week', icon: CalendarDays },
  { id: 'month', label: 'This Month', icon: CalendarRange },
  { id: 'year', label: 'This Year', icon: BarChart3 },
] as const

type Period = typeof PERIODS[number]['id']

export function Downloads() {
  const { isDownloading, error, downloadReport } = useDownloads()
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month')

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <Glass className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
            <FileText className="size-6" />
          </div>
          <Eyebrow>Professional Reports</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold">Download your data</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Generate a detailed, professional PDF report of your practice minutes and earnings. Perfect for your personal records.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Select timeframe</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {PERIODS.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                    selectedPeriod === period.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  <period.icon className="size-5" />
                  <span className="font-medium">{period.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={() => downloadReport(selectedPeriod)}
            disabled={isDownloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isDownloading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="size-5" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </Glass>
    </div>
  )
}
