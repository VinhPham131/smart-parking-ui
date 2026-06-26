import type { ReactNode } from 'react'

type StatCardColor = 'green' | 'white' | 'emerald' | 'red' | 'amber' | 'yellow'

export interface StatCardProps {
  label: string
  value: number
  color: StatCardColor
  icon: ReactNode
}

const COLOR_MAP: Record<StatCardColor, string> = {
  green: 'text-neon-green border-neon-green/30 bg-sidebar-bg',
  white: 'text-white border-white/20 bg-sidebar-bg',
  emerald: 'text-emerald-300 border-emerald-500/30 bg-sidebar-bg',
  red: 'text-red-300 border-red-500/30 bg-sidebar-bg',
  amber: 'text-amber-300 border-amber-500/30 bg-sidebar-bg',
  yellow: 'text-yellow-300 border-yellow-500/30 bg-sidebar-bg',
}

export function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${COLOR_MAP[color]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/55">{label}</p>
        <span className="text-white/40">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}
