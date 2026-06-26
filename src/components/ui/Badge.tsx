import type { ReactNode } from 'react'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

const variantClass: Record<BadgeVariant, string> = {
  primary:
    'border border-neon-green/35 bg-neon-green/15 text-neon-green',
  success:
    'border border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
  warning:
    'border border-amber-500/35 bg-amber-500/15 text-amber-200',
  danger:
    'border border-red-500/35 bg-red-500/15 text-red-300',
  neutral:
    'border border-white/15 bg-white/10 text-white/85',
}

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClass[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  )
}
