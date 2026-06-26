import { useMemo } from 'react'
import type { ParkingHistoryListItem, ParkingHistorySessionStatus } from '../types/parkingHistory.type'
import { Badge, type BadgeVariant } from '../../../../components/ui/Badge'
import { DataTable, type DataTableColumn } from '../../../../components/ui/DataTable'
import { formatReservationDateTime } from '../../../../utils/datetime'
import { formatAmountShort } from '../../../../utils/currency'
import { HiOutlineEye } from 'react-icons/hi'
import { ParkingCaptureImage } from './ParkingCaptureImage'

export interface ParkingHistoryTableProps {
  items: ParkingHistoryListItem[]
  loading: boolean
  emptyMessage: string
  viewBusyId: string | null
  onViewDetail: (id: string) => void
}

function safeString(value: string | null | undefined) {
  const s = value ?? ''
  return s.trim() ? s : ''
}

function statusBadgeVariant(status: ParkingHistorySessionStatus | null): BadgeVariant {
  const s = safeString(status).toLowerCase()
  if (!s) return 'neutral'
  if (s.includes('complete')) return 'success'
  if (s.includes('progress')) return 'warning'
  if (s.includes('cancel') || s.includes('fail') || s.includes('reject')) return 'danger'
  return 'neutral'
}

function normalizeStatusLabel(status: ParkingHistorySessionStatus | null): string {
  const s = safeString(status)
  if (!s) return '—'
  const lower = s.toLowerCase()
  if (lower.includes('completed')) return 'Completed'
  if (lower.includes('in progress') || (lower.includes('progress') && lower.includes('in'))) {
    return 'In Progress'
  }
  if (lower.includes('progress')) return 'In Progress'
  if (lower.includes('cancel')) return 'Cancelled'
  return s
}

function paymentMethodBadgeVariant(paymentMethod: string | null): BadgeVariant {
  const s = safeString(paymentMethod).toLowerCase()
  if (!s) return 'neutral'
  if (s === 'wallet') return 'primary'
  if (s === 'membership') return 'success'
  return 'neutral'
}

function paymentMethodLabel(paymentMethod: string | null): string {
  const s = safeString(paymentMethod)
  if (!s) return '—'
  return s
}

function licensePlate(row: ParkingHistoryListItem): string {
  return (
    row.parking_session?.vehicle?.license_plate ??
    row.vehicle?.license_plate ??
    '—'
  )
}

function userName(row: ParkingHistoryListItem): string | null {
  return (
    row.parking_session?.vehicle?.user?.name ??
    row.vehicle?.user?.name ??
    null
  )
}

function parkingAreaName(row: ParkingHistoryListItem): string {
  const name = row.parking_session?.parking_area?.name
  return name ? `${name}` : '—'
}

function checkInTime(row: ParkingHistoryListItem): string | null {
  return row.parking_session?.check_in_time ?? null
}

function checkOutTime(row: ParkingHistoryListItem): string | null {
  return row.parking_session?.check_out_time ?? null
}

function sessionStatus(row: ParkingHistoryListItem): ParkingHistorySessionStatus | null {
  return row.parking_session?.status ?? null
}

function sessionAmount(row: ParkingHistoryListItem): number {
  const n = row.parking_session?.amount
  return n != null && Number.isFinite(n) ? n : 0
}

function formatMaybeDateTime(iso: string | null): string {
  if (!iso) return '—'
  return formatReservationDateTime(iso)
}

function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  return formatAmountShort(amount)
}

export function ParkingHistoryTable({
  items,
  loading,
  emptyMessage,
  viewBusyId,
  onViewDetail,
}: ParkingHistoryTableProps) {
  const rowIndexById = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((row, index) => map.set(row.id, index))
    return map
  }, [items])

  const columns: DataTableColumn<ParkingHistoryListItem>[] = useMemo(
    () => [
      {
        key: 'plate',
        header: 'Plate',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (row) => (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-base font-bold tracking-wide text-white">
              {licensePlate(row)}
            </span>
            <span className="text-xs text-white/55">{userName(row) ?? '—'}</span>
          </div>
        ),
      },
      {
        key: 'area',
        header: 'Area',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (row) => (
          <span className="text-sm font-semibold text-neon-green">
            {parkingAreaName(row)}
          </span>
        ),
      },
      {
        key: 'time',
        header: 'Time',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (row) => (
          <div className="flex flex-col gap-1 text-xs tabular-nums">
            <div className="flex items-center gap-1.5">
              <span className="w-8 shrink-0 font-medium uppercase text-neon-green/80">
                In
              </span>
              <span className="text-white/75">
                {formatMaybeDateTime(checkInTime(row))}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-8 shrink-0 font-medium uppercase text-white/40">
                Out
              </span>
              <span className="text-white/55">
                {formatMaybeDateTime(checkOutTime(row))}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'captures',
        header: 'Captures',
        render: (row) => {
          const session = row.parking_session
          return (
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] font-medium uppercase text-neon-green/70">
                  In
                </span>
                <ParkingCaptureImage
                  raw={session?.check_in_image}
                  label="Check-in capture"
                  variant="thumb"
                />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] font-medium uppercase text-white/40">
                  Out
                </span>
                <ParkingCaptureImage
                  raw={session?.check_out_image}
                  label="Check-out capture"
                  variant="thumb"
                />
              </div>
            </div>
          )
        },
      },
      {
        key: 'status_amount',
        header: 'Status / Fee',
        headerClassName: 'min-w-[110px]',
        render: (row) => (
          <div className="flex flex-col items-center gap-1.5">
            <Badge variant={statusBadgeVariant(sessionStatus(row))}>
              {normalizeStatusLabel(sessionStatus(row))}
            </Badge>
            <span className="text-sm font-bold tabular-nums text-neon-green">
              {formatAmount(sessionAmount(row))}
            </span>
          </div>
        ),
      },
      {
        key: 'payment_method',
        header: 'Payment',
        render: (row) => (
          <div className="flex justify-center">
            <Badge variant={paymentMethodBadgeVariant(row.payment_method)}>
              {paymentMethodLabel(row.payment_method)}
            </Badge>
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        headerClassName: 'w-12',
        cellClassName: 'text-left',
        render: (row) => {
          const busy = viewBusyId === row.id
          return (
            <button
              type="button"
              disabled={busy}
              onClick={() => onViewDetail(row.id)}
              title="View detail"
              className="rounded-xl border border-white/15 bg-white/5 p-2 text-white transition hover:border-neon-green/40 hover:bg-neon-green/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <span className="text-[10px]">…</span>
              ) : (
                <HiOutlineEye className="h-4 w-4" />
              )}
            </button>
          )
        },
      },
    ],
    [onViewDetail, viewBusyId],
  )

  const getRowClassName = (row: ParkingHistoryListItem) => {
    const index = rowIndexById.get(row.id) ?? 0
    if (index % 2 === 1) return 'bg-white/[0.02]'
    return undefined
  }

  return (
    <DataTable
      columns={columns}
      data={items}
      rowKey={(r) => r.id}
      loading={loading}
      emptyMessage={emptyMessage}
      getRowClassName={getRowClassName}
      skeletonRows={7}
    />
  )
}
