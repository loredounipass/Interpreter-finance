'use client'

import { useState } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useFinance } from '@/hooks/use-finance'

const shortDateTimeFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

function fmtDate(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : shortDateTimeFormatter.format(d) + ' ' + timeFormatter.format(d)
}

export function DailyLogsDialog({ dateKey, onClose }: { dateKey: string; onClose: () => void }) {
  const { logs, recentEntries, updateEntry, deleteEntry } = useFinance()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editMins, setEditMins] = useState('')
  const [editNote, setEditNote] = useState('')

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

  const selectedLogs = logs
    .filter((l) => l.logged_on === dateKey)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))

  const entryData = recentEntries.find((e) => e.dateKey === dateKey)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-md relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Entries for {entryData?.date || dateKey}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10 transition-colors">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {selectedLogs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No individual entries found.</p>
          ) : (
            selectedLogs.map((e) => {
              const editing = editId === e.id
              return (
                <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
                  {editing ? (
                    <>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center gap-2">
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
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm outline-none focus:border-primary/50"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{fmtDate(e.updated_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={saveEdit} disabled={savingId === e.id} aria-label="Save" className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50 transition-colors">
                          <Check className="size-4" />
                        </button>
                        <button onClick={() => setEditId(null)} aria-label="Cancel" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
                          <X className="size-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.note || 'Individual log'}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{fmtDate(e.updated_at)}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm">{Number(e.minutes.toFixed(2))}m</span>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => startEdit(e.id, e.minutes, e.note)} aria-label="Edit" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => deleteEntry(e.id)} aria-label="Delete" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors">
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
      </div>
    </div>
  )
}
