'use client'

import { Glass } from './shared'

export function StatCard({ label, value, note, icon: Icon, large = false, size }: { label: string; value: string; note: string; icon: React.ElementType; large?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const valueSizes = { sm: 'font-mono text-xl font-medium', md: 'font-mono text-2xl font-medium', lg: 'font-mono text-4xl font-bold', xl: 'font-mono text-5xl font-bold' }
  const effective = size ?? (large ? 'xl' : 'md')
  const isLarge = effective === 'xl' || effective === 'lg'
  const labelSize = isLarge ? 'text-sm font-semibold text-muted-foreground' : 'text-xs text-muted-foreground'
  const valueSize = valueSizes[effective]
  const noteSize = isLarge ? 'text-base text-muted-foreground' : 'text-xs text-muted-foreground'
  const iconSize = isLarge ? 'size-6' : 'size-4'
  
  const isEarnings = label.toLowerCase().includes('earnings')
  const earningsGradient = isEarnings ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20' : ''
  const earningsIconBg = isEarnings ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/15 text-primary'
  const earningsValueColor = isEarnings ? 'text-emerald-400' : ''
  
  return (
    <Glass className={`flex min-h-28 flex-col items-start p-3.5 ${earningsGradient}`}>
      <div className="flex items-center gap-2">
        <div className={`grid size-7 place-items-center rounded-md ${earningsIconBg}`}><Icon className={iconSize} /></div>
        <p className={labelSize}>{label}</p>
      </div>
      <p className={`${valueSize} ${earningsValueColor}`} style={{ marginTop: isLarge ? '0.5rem' : '0.25rem' }}>{value}</p>
      {note && <p className={noteSize} style={{ marginTop: isLarge ? '0.25rem' : '0.125rem' }}>{note}</p>}
    </Glass>
  )
}
