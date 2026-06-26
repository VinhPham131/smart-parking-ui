export interface FilterTabItem<T extends string = string> {
  key: T
  label: string
}

export interface FilterTabConfig {
  label?: string
  cls?: string
}

export interface FilterTabsProps<T extends string = string> {
  tabs: FilterTabItem<T>[]
  value: T
  onChange: (key: T) => void
  configMap?: Partial<Record<string, FilterTabConfig>>
}

/** Status / secondary filters — matches original Payment Management status row. */
export function FilterTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  configMap,
}: FilterTabsProps<T>) {
  return (
    <div
      className="inline-flex max-w-full shrink-0 flex-wrap gap-1"
      role="group"
    >
      {tabs.map((tab) => {
        const active = tab.key === value
        const cfg = configMap?.[tab.key]
        const label = cfg?.label ?? tab.label

        let activeCls =
          'border-white/30 bg-white/15 text-white'
        if (active && tab.key !== 'all' && cfg?.cls) {
          activeCls = `border ${cfg.cls}`
        }

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? activeCls
                : 'border-white/15 text-white/50 hover:border-white/25 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
