'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { Check, Info, TriangleAlert, X } from 'lucide-react'

type ToastVariant = 'success' | 'info' | 'error'

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastItem extends Required<Omit<ToastOptions, 'description' | 'duration'>> {
  id: string
  description?: string
  duration: number
  leaving: boolean
}

const ToastContext = createContext<(opts: ToastOptions) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: ElementType; iconClass: string }> = {
  success: {
    ring: 'border-l-2 border-l-primary',
    icon: Check,
    iconClass: 'text-primary',
  },
  info: {
    ring: 'border-l-2 border-l-chart-2',
    icon: Info,
    iconClass: 'text-chart-2',
  },
  error: {
    ring: 'border-l-2 border-l-destructive',
    icon: TriangleAlert,
    iconClass: 'text-destructive',
  },
}

const TOAST_DURATION = 3500
const EXIT_DURATION = 300

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
      delete timers.current[id]
    }, EXIT_DURATION)
    timers.current[id] = [...(timers.current[id] ?? []), t]
  }, [])

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = Math.random().toString(36).slice(2)
      const item: ToastItem = {
        id,
        title: opts.title,
        description: opts.description,
        variant: opts.variant ?? 'success',
        duration: opts.duration ?? TOAST_DURATION,
        leaving: false,
      }
      setToasts((prev) => [...prev, item])
      const t = setTimeout(() => dismiss(id), item.duration)
      timers.current[id] = [t]
    },
    [dismiss]
  )

  useEffect(() => {
    const snapshot = timers.current
    return () => {
      Object.values(snapshot).forEach((arr) => arr.forEach(clearTimeout))
    }
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant]
          const Icon = style.icon
          return (
            <div
              key={t.id}
              className={`glass-panel pointer-events-auto rounded-xl border border-white/10 ${style.ring} p-4 shadow-lg shadow-black/30 ${
                t.leaving
                  ? 'animate-out fade-out-0 slide-out-to-right-4 duration-300'
                  : 'animate-in fade-in-0 slide-in-from-bottom-4 duration-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 size-5 shrink-0 ${style.iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  {t.description && (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
