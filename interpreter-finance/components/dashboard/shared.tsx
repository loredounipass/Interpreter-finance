'use client'

export function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-panel ${className}`}>{children}</section>
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}
