'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { AI_MODELS } from '@/utils/ai-models'
import type { ChatSession } from '@/hooks/use-ai-chat'

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  sidebarOpen: boolean
  collapsed: boolean
  onOpenSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onStartNewChat: () => void
  onCloseSidebar: () => void
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  sidebarOpen,
  collapsed,
  onOpenSession,
  onDeleteSession,
  onStartNewChat,
  onCloseSidebar,
}: ChatSidebarProps) {
  return (
    <aside
      className={`absolute inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-sidebar/90 backdrop-blur-xl transition-[transform,width] md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'md:hidden' : 'md:flex'}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Chats</p>
        <button
          onClick={onCloseSidebar}
          aria-label="Cerrar"
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="p-3">
        <button
          onClick={onStartNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> Nuevo chat
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {sessions.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">Aun no hay conversaciones.</p>
        ) : (
          sessions.map((s) => {
            const active = s.id === currentSessionId
            return (
              <div
                key={s.id}
                className={`group flex items-start gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                  active ? 'bg-primary/10' : 'hover:bg-white/5'
                }`}
              >
                <button onClick={() => { onOpenSession(s.id); onCloseSidebar() }} className="min-w-0 flex-1 text-left">
                  <p className={`truncate text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{s.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {AI_MODELS[s.model]?.name ?? s.model}
                  </p>
                </button>
                <button
                  onClick={() => onDeleteSession(s.id)}
                  aria-label="Borrar historial"
                  className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
