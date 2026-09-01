'use client'

import { useState } from 'react'
import { useFinance } from '@/hooks/use-finance'
import { useToast } from '@/components/ui/app-toast'
import { Glass, Eyebrow } from './shared'

export function GoalCard() {
  const { currentMinutes, goal, progress, addMinutes, setMinutes, saveMinutes, isSaving } = useFinance()
  const toast = useToast()
  const [draftMins, setDraftMins] = useState('')

  const handleSave = async () => {
    const saved = Number(currentMinutes.toFixed(2))
    await saveMinutes()
    if (goal > 0 && saved >= goal) {
      toast({
        title: 'Goal reached!',
        description: `You hit your ${goal} minute goal.`,
        variant: 'success',
      })
    } else {
      toast({
        title: 'Log saved',
        description: saved > 0 ? `${saved} minutes logged for today.` : undefined,
        variant: 'info',
      })
    }
  }

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (draftMins && Number(draftMins) > 0) {
      addMinutes(Number(draftMins))
      setDraftMins('')
    }
  }
  return (
    <Glass className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Today&apos;s focus</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold">Keep the momentum</h2>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary">
          {goal > 0 ? (goal - currentMinutes > 0 ? `${Number((goal - currentMinutes).toFixed(2))} min remaining` : 'Goal reached!') : 'No goal set'}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="font-mono text-4xl font-medium">{Number(currentMinutes.toFixed(2))}</span>
          <span className="ml-2 text-sm text-muted-foreground">minutes logged</span>
        </div>
        <span className="font-mono text-sm text-primary">{progress}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[15, 30, 45].map((value) => (
          <button key={value} onClick={() => addMinutes(value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-muted-foreground hover:border-primary/30 hover:text-primary">
            +{value}m
          </button>
        ))}
        
        <form onSubmit={handleAdd} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 focus-within:border-primary/50">
          <span className="text-xs text-muted-foreground">+</span>
          <input 
            type="number" 
            min="0.01" 
            step="any"
            placeholder="custom"
            aria-label="Custom minutes"
            value={draftMins} 
            onChange={(e) => setDraftMins(e.target.value)} 
            className="w-14 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/30" 
          />
          <button type="submit" disabled={!draftMins} className="px-2 text-xs font-semibold text-primary disabled:opacity-50">Add</button>
        </form>

        <button onClick={handleSave} disabled={isSaving} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save log'}
        </button>
        <button onClick={() => setMinutes(0)} className="ml-auto rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Reset</button>
      </div>
    </Glass>
  )
}
