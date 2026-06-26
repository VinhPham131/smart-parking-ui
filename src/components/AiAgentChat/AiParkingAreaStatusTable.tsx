import { HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineCog } from 'react-icons/hi'
import { calcOccupiedSlots } from '../../utils/parkingAreaSlots'
import type { ParkingAreaStatusItem, ParkingAreaStatusPayload } from './TableList.types'


interface AiParkingAreaStatusTableProps {
  payload: ParkingAreaStatusPayload
}

function normalizeAreas(raw: ParkingAreaStatusPayload['items']): ParkingAreaStatusItem[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((item): item is ParkingAreaStatusItem => !!item && typeof item === 'object')
  }
  if (typeof raw === 'object') {
    return [raw as ParkingAreaStatusItem]
  }
  return []
}

interface AreaCounts {
  name: string
  total: number
  available: number
  reserved: number
  maintenance: number
  occupied: number
}

function deriveCounts(area: ParkingAreaStatusItem, index: number): AreaCounts {
  const total = Math.max(0, Number(area.total_slots ?? 0))
  const available = Math.max(0, Number(area.available_slots ?? 0))
  const reserved = Math.max(0, Number(area.reserved_slots ?? 0))
  const maintenance = Math.max(0, Number(area.maintenance_slots ?? 0))
  const occupied = calcOccupiedSlots(area)
  return {
    name: area.name ?? `Area ${index + 1}`,
    total,
    available,
    reserved,
    maintenance,
    occupied,
  }
}

function MetricCard({
  label,
  value,
  icon,
  accentClass,
  hint,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accentClass: string
  hint: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/6 p-3 shadow-sm ring-1 ring-inset transition hover:border-white/15">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/50">{label}</p>
          <p className={`text-2xl font-semibold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
          <p className="text-[10px] text-white/45">{hint}</p>
        </div>
        <span className={`shrink-0 ${accentClass} opacity-90`}>{icon}</span>
      </div>
    </div>
  )
}

function AreaCard({ counts }: { counts: AreaCounts }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/4 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">Parking area {counts.name}</span>
        <span className="text-[10px] uppercase tracking-wide text-white/50">{counts.total} slots</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard
          label="Available"
          value={counts.available}
          accentClass="text-emerald-300"
          hint="Ready for parking"
          icon={<HiOutlineCheckCircle className="h-5 w-5" />}
        />
        <MetricCard
          label="Occupied"
          value={counts.occupied}
          accentClass="text-red-300"
          hint="Currently parked"
          icon={<HiOutlineClock className="h-5 w-5" />}
        />
        <MetricCard
          label="Reserved"
          value={counts.reserved}
          accentClass="text-amber-300"
          hint="Booked / held"
          icon={<HiOutlineCalendar className="h-5 w-5" />}
        />
        <MetricCard
          label="Maintenance"
          value={counts.maintenance}
          accentClass="text-sky-300"
          hint="Under maintenance"
          icon={<HiOutlineCog className="h-5 w-5" />}
        />
      </div>
    </div>
  )
}

export default function AiParkingAreaStatusTable({ payload }: AiParkingAreaStatusTableProps) {
  const areas = normalizeAreas(payload.items)

  if (areas.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/4 p-3 text-xs text-white/60">
        No parking area data.
      </div>
    )
  }

  const counts = areas.map((area, index) => deriveCounts(area, index))
  const isSingle = counts.length === 1

  return (
    <div className="min-w-[280px] space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-white/85">
        <span>{isSingle ? 'Parking area status' : `Parking areas (${counts.length})`}</span>
      </div>

      <div className="space-y-3">
        {counts.map((c) => (
          <AreaCard key={c.name} counts={c} />
        ))}
      </div>
    </div>
  )
}
