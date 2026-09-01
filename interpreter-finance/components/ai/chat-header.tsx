'use client'

import { Bot, Trash2, Menu, PanelLeftClose, PanelLeft } from 'lucide-react'
import { AI_MODEL_LIST } from '@/utils/ai-models'

interface ChatHeaderProps {
  model: string
  onModelChange: (value: string) => void
  onClear: () => void
  onToggleSidebar: () => void
  collapsed: boolean
  onOpenMobileSidebar: () => void
}

export function ChatHeader({
  model,
  onModelChange,
  onClear,
  onToggleSidebar,
  collapsed,
  onOpenMobileSidebar,
}: ChatHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Abrir chats"
          className="grid size-8 place-items-center rounded-xl border border-white/10 text-muted-foreground md:hidden"
        >
          <Menu className="size-4" />
        </button>
        <button
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Mostrar chats' : 'Ocultar chats'}
          className="hidden size-8 place-items-center rounded-xl border border-white/10 text-muted-foreground transition-colors hover:text-foreground md:grid"
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary sm:size-9">
          <Bot className="size-4 sm:size-5" />
        </div>
        <div className="min-w-0">
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">Assistant</p>
          <h2 className="truncate text-base font-semibold leading-tight sm:text-lg">interpreter AI</h2>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/50 sm:flex-none sm:px-3"
        >
          {AI_MODEL_LIST.map((m) => (
            <option key={m.key} value={m.key} className="bg-card text-foreground">
              {m.name}
            </option>
          ))}
        </select>
        <button
          onClick={onClear}
          aria-label="Clear chat"
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}
