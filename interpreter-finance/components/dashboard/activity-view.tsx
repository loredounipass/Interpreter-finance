'use client'

import { useState, useMemo } from 'react'
import { Check, Clock3, ListChecks, Pencil, Trash2, X } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'
import { formatMinutes } from '@/lib/finance'
import { StatCard } from './stat-card'
import { Glass, Eyebrow } from './shared'

const shortDateTimeFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

function fmtDate(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : shortDateTimeFormatter.format(d) + ' ' + timeFormatter.format(d)
}

export function ActivityView() {
  const { logs, updateEntry, deleteEntry, todayTotal, monthTotal } = useFinance()

  const [savingId, setSavingId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editMins, setEditMins] = useState('')
  const [editNote, setEditNote] = useState('')

  const entries = useMemo(
    () => [...logs].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))),
    [logs]
  )

  const startEdit = (id: string, minutes: number, note: string | null) => {
    setEditId(id)
    setEditMins(String(minutes))
    setEditNote(note ?? '')
  }

  const saveEdit = async () => {
    if (!editId) return
    const mins = Number(editMins)
    if (!Number.isFinite(mins) || mins < 0) return
    setSavingId(editId)
    await updateEntry(editId, mins, editNote.trim() || null)
    setSavingId(null)
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
        <StatCard label="Today's total" value={`${Number(todayTotal.toFixed(2))}m`} note="Across all sessions" icon={Clock3} />
        <StatCard label="Month total" value={formatMinutes(monthTotal)} note="This month" icon={ListChecks} />
        <StatCard label="Entries" value={`${entries.length}`} note="Individual logs" icon={ListChecks} />
      </div>

      <Glass className="p-5">
        <div className="flex items-center justify-between">
          <div><Eyebrow>Recent activity</Eyebrow><h2 className="mt-1 text-lg font-semibold">Latest logs</h2></div>
          <span className="font-mono text-xs text-muted-foreground">{entries.length} total</span>
        </div>
        <div className="mt-4 flex flex-col gap-1 max-h-[540px] overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No entries yet. Add your first minutes above.</p>
          ) : (
            entries.map((e) => {
              const editing = editId === e.id
              return (
                <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.04]">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Clock3 className="size-4" /></div>
                  {editing ? (
                    <>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <input
                          type="number" min="0" step="any" inputMode="decimal"
                          value={editMins} onChange={(ev) => setEditMins(ev.target.value)}
                          onKeyDown={(ev) => ev.key === 'Enter' && saveEdit()}
                          aria-label="Minutes"
                          className="w-20 rounded-lg border border-primary/30 bg-white/[0.05] px-2 py-1.5 font-mono text-sm outline-none"
                        />
                        <input
                          type="text" value={editNote} onChange={(ev) => setEditNote(ev.target.value)}
                          onKeyDown={(ev) => ev.key === 'Enter' && saveEdit()}
                          placeholder="Note"
                          aria-label="Note"
                          className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm outline-none focus:border-primary/50"
                        />
                        <span className="text-xs text-muted-foreground">{fmtDate(e.updated_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={saveEdit} disabled={savingId === e.id} aria-label="Save" className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50">
                          <Check className="size-4" />
                        </button>
                        <button onClick={() => setEditId(null)} aria-label="Cancel" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground">
                          <X className="size-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.note || 'Daily practice'}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{fmtDate(e.updated_at)}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm">{Number(e.minutes.toFixed(2))}m</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(e.id, e.minutes, e.note)} aria-label="Edit" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => deleteEntry(e.id)} aria-label="Delete" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Glass>
    </div>
  )
}
