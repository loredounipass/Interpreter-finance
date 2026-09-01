'use client'

import { useState, useEffect } from 'react'
import { Target } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { useToast } from '@/components/ui/app-toast'
import { getMinutesPerHour, getWholeMinutesPerHour } from '@/lib/finance'
import { Glass, Eyebrow } from './shared'

export function GoalSettings() {
  const { goal: hookGoal, workHours: hookWorkHours, ratePerMinute: hookRatePerMinute, saveGoal } = useFinance()
  const toast = useToast()
  const [goal, setGoal] = useState(String(hookGoal))
  const [workHours, setWorkHoursLocal] = useState(String(hookWorkHours))
  const [ratePerMinute, setRatePerMinute] = useState(String(hookRatePerMinute))

  useEffect(() => { setGoal(String(hookGoal)) }, [hookGoal])
  useEffect(() => { setWorkHoursLocal(String(hookWorkHours)) }, [hookWorkHours])
  useEffect(() => { setRatePerMinute(String(hookRatePerMinute)) }, [hookRatePerMinute])

  const numGoal = Number(goal) || 0
  const numWorkHours = Number(workHours) || 0
  const numRate = Number(ratePerMinute) || 0

  const minutesPerHour = getMinutesPerHour(numGoal, numWorkHours)
  const wholeMinutesPerHour = getWholeMinutesPerHour(numGoal, numWorkHours)

  const clearAll = () => {
    setGoal('')
    setWorkHoursLocal('')
    setRatePerMinute('')
  }

  const handleSaveGoal = async () => {
    await saveGoal(numGoal, numWorkHours, numRate)
    toast({
      title: 'Goal updated',
      description: `Daily target set to ${numGoal} minutes.`,
      variant: 'success',
    })
  }

  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Daily target</Eyebrow>
          <p className="mt-1 text-sm text-muted-foreground">Set your goal and available work period.</p>
        </div>
        <Target className="size-5 text-primary" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Goal minutes</span>
          <input type="number" min="0" step="any" value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Work period</span>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="any" value={workHours} onChange={(e) => setWorkHoursLocal(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rate per minute</span>
          <input type="number" min="0" step="0.01" value={ratePerMinute} onChange={(e) => setRatePerMinute(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
        </label>
      </div>
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <p className="text-xs text-muted-foreground">Required pace per hour</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-3xl text-primary">{minutesPerHour}</span>
          <span className="text-sm text-muted-foreground">minutes / hour</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          For {numGoal} minutes across {numWorkHours} hours, plan about <span className="font-semibold text-foreground">{wholeMinutesPerHour} minutes every hour</span>.
        </p>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={handleSaveGoal} className="flex-1 rounded-lg border border-primary/25 bg-primary/10 py-2.5 text-xs font-semibold text-primary">Update daily goal</button>
        <button onClick={clearAll} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground">Clear</button>
      </div>
    </Glass>
  )
}
