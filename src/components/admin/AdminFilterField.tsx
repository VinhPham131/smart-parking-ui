import type { ReactNode } from 'react'

export const adminFilterFieldCls =
  'rounded-xl border border-white/20 bg-[#12151c] px-3 py-2 text-sm text-white focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/25'

export interface AdminFilterFieldProps {
  label: string
  children: ReactNode
  className?: string
}

export function AdminFilterField({ label, children, className }: AdminFilterFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-white/50">{label}</label>
      {children}
    </div>
  )
}
