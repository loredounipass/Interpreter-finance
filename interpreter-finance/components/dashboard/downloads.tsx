'use client'

import { useState } from 'react'
import { Download, FileText, Loader2, CalendarRange, Clock3, CalendarDays, BarChart3 } from 'lucide-react'
import { useDownloads } from '@/hooks/use-downloads'
import { Glass, Eyebrow } from './shared'



export function Downloads() {
  const { isDownloading, error, downloadReport } = useDownloads()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground ml-1">From Date</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input 
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-3 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground hover:bg-white/5"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground ml-1">To Date</label>
                <div className="relative">
                  <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input 
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-3 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground hover:bg-white/5"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={() => downloadReport(fromDate, toDate)}
            disabled={isDownloading || !fromDate || !toDate}
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
