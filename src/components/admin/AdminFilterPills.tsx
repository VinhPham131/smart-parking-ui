import type { ElementType } from 'react'

export interface AdminFilterPillTab<T extends string = string> {
  key: T
  label: string
  icon?: ElementType
  count?: number
}

export interface AdminFilterPillsProps<T extends string = string> {
  tabs: AdminFilterPillTab<T>[]
  value: T
  onChange: (key: T) => void
}

/** Segmented control — matches original Payment Management type tabs. */
export function AdminFilterPills<T extends string = string>({
  tabs,
  value,
  onChange,
}: AdminFilterPillsProps<T>) {
  return (
    <div
      className="inline-flex max-w-full shrink-0 flex-wrap gap-1 rounded-xl border border-white/15 bg-[#12151c] p-1"
      role="group"
      aria-label="Filter"
    >
      {tabs.map((tab) => {
        const active = tab.key === value
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? 'bg-neon-green text-black shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
            <span>{tab.label}</span>
            {tab.count != null ? (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? 'bg-black/15 text-black/70' : 'bg-white/10 text-white/45'
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
