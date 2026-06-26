import { ParkingSessionStatus } from '../../constants/constants'
import { getVehicleBrand } from '../../constants/vehicles'
import { formatAmountShort } from '../../utils/currency'
import type { MyParkingHistoryRecord } from '../../types/parking'
import type { DateQuickFilter, ParkingSession, ParkingSessionStatusType } from './types'

export const PAGE_SIZE = 10

export const RANGE_MAP: Record<DateQuickFilter, string | undefined> = {
  all: undefined,
  today: 'today',
  week: 'this week',
  month: 'this month',
}

export const DATE_OPTIONS: Array<{ value: DateQuickFilter; label: string }> = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

export function computeDurationLabel(
  checkInIso: string | null,
  checkOutIso: string | null,
): string {
  if (!checkInIso) return '—'
  if (!checkOutIso) return 'In progress'
  const a = new Date(checkInIso).getTime()
  const b = new Date(checkOutIso).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return '—'
  const minutes = Math.round((b - a) / 60000)
  const hours = Math.floor(minutes / 60)
  const m = minutes % 60
  if (hours > 0) return `${hours}h ${m}m`
  if (minutes <= 0) return '< 1m'
  return `${minutes}m`
}

export function parkingDateLabel(checkInIso: string | null): string {
  if (!checkInIso) return '—'
  const d = new Date(checkInIso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function mapApiStatusToSessionStatus(
  status: string | undefined | null,
): ParkingSessionStatusType {
  const s = (status ?? '').toLowerCase()
  if (s.includes('complete')) return ParkingSessionStatus.COMPLETED
  return ParkingSessionStatus.IN_PROGRESS
}

export function mapItem(item: MyParkingHistoryRecord): ParkingSession {
  const ps = item.parking_session
  const v = item.vehicle
  const checkInIso = ps?.check_in_time ?? null
  const checkOutIso = ps?.check_out_time ?? null
  const pa = ps?.parking_area ?? null
  const status = mapApiStatusToSessionStatus(ps?.status)
  const amount = ps?.amount ?? 0
  const completed = status === ParkingSessionStatus.COMPLETED

  return {
    id: item.id,
    sessionId: ps?.id ?? item.id,
    licensePlate: v?.license_plate ?? '—',
    brand: v?.brand ?? '—',
    vehicleColor: v?.color ?? null,
    parkingDate: parkingDateLabel(checkInIso),
    checkInTime: checkInIso,
    checkOutTime: checkOutIso,
    duration: computeDurationLabel(checkInIso, checkOutIso),
    amount,
    areaName: pa?.name ?? '—',
    areaAvailableSlots: pa?.available_slots ?? null,
    areaTotalSlots: pa?.slots_quantity ?? null,
    areaMaintenanceSlots: pa?.maintenance_slots ?? null,
    status,
    paymentMethod: item.payment_method ?? '',
    paymentStatus: completed ? 'paid' : null,
    paidAt: completed && checkOutIso ? checkOutIso : null,
    brandLogo: getVehicleBrand(v?.brand ?? '')?.logo ?? null,
    rawCheckIn: checkInIso,
    historyCreatedAt: item.created_at ?? null,
    sessionCreatedAt: ps?.created_at ?? null,
    sessionUpdatedAt: ps?.updated_at ?? null,
  }
}

export function formatSessionAmountLabel(session: ParkingSession): string {
  if (session.status === ParkingSessionStatus.COMPLETED) {
    return formatAmountShort(session.amount)
  }
  if (session.amount > 0) {
    return formatAmountShort(session.amount)
  }
  return 'Calculating…'
}
