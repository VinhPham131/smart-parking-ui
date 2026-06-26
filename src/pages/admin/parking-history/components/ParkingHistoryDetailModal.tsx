import type {
  ParkingHistoryDetailItem,
  ParkingHistorySessionStatus,
} from '../types/parkingHistory.type'
import { Badge, type BadgeVariant } from '../../../../components/ui/Badge'
import ColorDot from '../../../../components/ColorDot'
import { Modal } from '../../../../components/ui/Modal'
import { formatReservationDateTime } from '../../../../utils/datetime'
import { formatAmountShort } from '../../../../utils/currency'
import { ParkingCaptureImage } from './ParkingCaptureImage'

export interface ParkingHistoryDetailModalProps {
  open: boolean
  loading: boolean
  detail: ParkingHistoryDetailItem | null
  onClose: () => void
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
  if (s === 'cash') return 'success'
  if (s === 'wallet') return 'primary'
  if (s === 'card' || s === 'online' || s === 'online_payment') return 'primary'
  if (s === 'momo') return 'warning'
  if (s === 'bank_transfer') return 'neutral'
  if (s === 'other') return 'neutral'
  return 'neutral'
}

function paymentMethodLabel(paymentMethod: string | null): string {
  const s = safeString(paymentMethod)
  if (!s) return '—'
  const withSpaces = s.replace(/_/g, ' ')
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
}

function formatMaybeIso(iso: string | null): string {
  if (!iso) return '—'
  return formatReservationDateTime(iso)
}

function formatMoney(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—'
  return formatAmountShort(amount)
}

function pickSessionVehicle(detail: ParkingHistoryDetailItem | null) {
  return detail?.parking_session?.vehicle ?? null
}

function pickRootVehicle(detail: ParkingHistoryDetailItem | null) {
  return detail?.vehicle ?? null
}

/** Prefer session vehicle when it carries plate data; otherwise root vehicle. */
function pickDisplayVehicle(detail: ParkingHistoryDetailItem | null) {
  const sv = pickSessionVehicle(detail)
  const rv = pickRootVehicle(detail)
  if (sv?.license_plate) return sv
  return rv ?? sv
}

function pickUser(detail: ParkingHistoryDetailItem | null) {
  if (!detail) return null
  return (
    detail.parking_session?.vehicle?.user ??
    detail.vehicle?.user ??
    null
  )
}

export function ParkingHistoryDetailModal({
  open,
  loading,
  detail,
  onClose,
}: ParkingHistoryDetailModalProps) {
  const vehicle = pickDisplayVehicle(detail);
  const user = pickUser(detail);
  const sessionId = detail?.parking_session?.id ?? null;
  const historyId = detail?.id ?? null;
  const checkIn = detail?.parking_session?.check_in_time ?? null;
  const checkOut = detail?.parking_session?.check_out_time ?? null;
  const checkInImage = detail?.parking_session?.check_in_image ?? null;
  const checkOutImage = detail?.parking_session?.check_out_image ?? null;
  const status = detail?.parking_session?.status ?? null;
  const sessionAmount = detail?.parking_session?.amount;
  const sessionCreatedAt = detail?.parking_session?.created_at ?? null;
  const sessionUpdatedAt = detail?.parking_session?.updated_at ?? null;
  const historyCreatedAt = detail?.created_at ?? null;
  const historyUpdatedAt = detail?.updatedAt ?? null;

  return (
    <Modal
      open={open}
      title="Parking History Detail"
      onClose={onClose}
      busy={loading}
      panelClassName="!max-w-2xl sm:!max-w-2xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Close
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 rounded bg-white/10" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="rounded-2xl border border-neon-green/20 bg-gradient-to-br from-neon-green/10 to-white/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">
                  Vehicle
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-white">
                  {vehicle?.license_plate ?? "—"}
                </p>
                <p className="mt-1 text-sm text-white/65">
                  {vehicle?.brand ?? "—"}
                  {vehicle?.color ? (
                    <span className="ml-2 inline-flex items-center gap-1.5">
                      <ColorDot color={vehicle.color} size={12} />
                      {vehicle.color}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={statusBadgeVariant(status)}>
                  {normalizeStatusLabel(status)}
                </Badge>
                <p className="text-xl font-bold tabular-nums text-neon-green">
                  {formatMoney(sessionAmount ?? null)}
                </p>
                <Badge
                  variant={paymentMethodBadgeVariant(
                    detail?.payment_method ?? null,
                  )}
                >
                  {paymentMethodLabel(detail?.payment_method ?? null)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/50">
              Gate captures
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs text-neon-green/80">Check-in</p>
                <ParkingCaptureImage
                  raw={checkInImage}
                  label="Check-in capture"
                  variant="detail"
                />
                <p className="mt-2 text-xs text-white/60">
                  {formatMaybeIso(checkIn)}
                </p>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-neon-green/80">Check-out</p>
                <ParkingCaptureImage
                  raw={checkOutImage}
                  label="Check-out capture"
                  variant="detail"
                />
                <p className="mt-2 text-xs text-white/60">
                  {formatMaybeIso(checkOut)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-xs text-white/50">User</p>
            {!user ? (
              <p className="text-xs text-white/45">
                No user profile on this record.
              </p>
            ) : (
              <>
                <p className="font-semibold text-white">{user.name ?? "—"}</p>
                <div className="grid gap-1 text-xs text-white/70 sm:grid-cols-2">
                  {user.phone && (
                    <p>
                      <span className="text-white/40">Phone · </span>
                      {user.phone}
                    </p>
                  )}
                  {user.email && (
                    <p className="break-all">
                      <span className="text-white/40">Email · </span>
                      {user.email}
                    </p>
                  )}
                  {user.age != null && (
                    <p>
                      <span className="text-white/40">Age · </span>
                      {user.age}
                    </p>
                  )}
                  {user.role && (
                    <p>
                      <span className="text-white/40">Role · </span>
                      {user.role}
                    </p>
                  )}
                  {user.balance != null && Number.isFinite(user.balance) && (
                    <p className="sm:col-span-2">
                      <span className="text-white/40">Balance · </span>
                      <span className="font-medium text-neon-green">
                        {formatMoney(user.balance)}
                      </span>
                    </p>
                  )}
                  {user.address && (
                    <p className="sm:col-span-2 text-white/60">
                      <span className="text-white/40">Address · </span>
                      {user.address}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <details className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/55">
            <summary className="cursor-pointer font-medium text-white/70">
              Technical IDs & timestamps
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-white/40">History</p>
                <p className="mt-0.5 font-mono break-all text-white/80">
                  {historyId ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-white/40">Session</p>
                <p className="mt-0.5 font-mono break-all text-white/80">
                  {sessionId ?? "—"}
                </p>
              </div>
            </div>
            {(historyCreatedAt || historyUpdatedAt) && (
              <p className="mt-2 text-[11px] text-white/35">
                Record:{" "}
                {historyCreatedAt ? formatMaybeIso(historyCreatedAt) : "—"}
                {historyUpdatedAt && historyUpdatedAt !== historyCreatedAt
                  ? ` · Updated ${formatMaybeIso(historyUpdatedAt)}`
                  : ""}
              </p>
            )}
            {(sessionCreatedAt || sessionUpdatedAt) && (
              <p className="mt-1 text-[11px] text-white/35">
                Session:{" "}
                {sessionCreatedAt ? formatMaybeIso(sessionCreatedAt) : "—"}
                {sessionUpdatedAt && sessionUpdatedAt !== sessionCreatedAt
                  ? ` · Updated ${formatMaybeIso(sessionUpdatedAt)}`
                  : ""}
              </p>
            )}
          </details>
        </div>
      )}
    </Modal>
  );
}

