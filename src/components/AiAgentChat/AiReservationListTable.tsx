import { useEffect, useState } from 'react'
import AiChatTablePagination, { AI_CHAT_TABLE_PAGE_SIZE } from './aiChatTablePagination'
import type { ReservationListItem, ReservationListPayload } from './TableList.types'

interface AiReservationListTableProps {
  payload: ReservationListPayload
  isSending: boolean
  actionBusyKey: string | null
  onAction: (item: ReservationListItem, action: 'approve' | 'reject') => Promise<void> | void
}

const isPendingReservation = (item: ReservationListItem): boolean =>
  (item.status ?? '').toLowerCase() === 'pending'

export default function AiReservationListTable({
  payload,
  isSending,
  actionBusyKey,
  onAction,
}: AiReservationListTableProps) {
  const items = Array.isArray(payload.items) ? payload.items : []
  const [page, setPage] = useState(1)

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / AI_CHAT_TABLE_PAGE_SIZE))
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [items.length])

  const totalPages = Math.max(1, Math.ceil(items.length / AI_CHAT_TABLE_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const visibleItems = items.slice(
    (safePage - 1) * AI_CHAT_TABLE_PAGE_SIZE,
    safePage * AI_CHAT_TABLE_PAGE_SIZE,
  )

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/70">
        Total {payload.meta?.total ?? items.length} | Pending {payload.meta?.pending ?? 0} | Approved{' '}
        {payload.meta?.approved ?? 0} | Rejected {payload.meta?.rejected ?? 0}
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-xs">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-2 py-2 font-medium">Code</th>
                <th className="px-2 py-2 font-medium">Area</th>
                <th className="px-2 py-2 font-medium">Plate</th>
                <th className="px-2 py-2 font-medium">Check-in</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleItems.map((item, index) => {
                const globalIndex = (safePage - 1) * AI_CHAT_TABLE_PAGE_SIZE + index
                const isPending = isPendingReservation(item)
                const rowRef = item.reservation_id ?? item.code ?? String(globalIndex)
                const approveKey = `${rowRef}-approve`
                const rejectKey = `${rowRef}-reject`

                return (
                  <tr key={`${rowRef}-${item.plate ?? 'plate'}`}>
                    <td className="px-2 py-2 font-mono text-white">{item.code ?? '—'}</td>
                    <td className="px-2 py-2 font-mono text-white">{item.parking_area ?? '—'}</td>
                    <td className="px-2 py-2 text-white">{item.plate ?? '—'}</td>
                    <td className="px-2 py-2 text-white/80">{item.checkin ?? '—'}</td>
                    <td className="px-2 py-2 text-white/80">{item.status ?? '—'}</td>
                    <td className="px-2 py-2">
                      {isPending ? (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            disabled={isSending || actionBusyKey === approveKey}
                            onClick={() => void onAction(item, 'approve')}
                            className="rounded-lg bg-neon-green px-2 py-1 text-[11px] font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionBusyKey === approveKey ? '...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={isSending || actionBusyKey === rejectKey}
                            onClick={() => void onAction(item, 'reject')}
                            className="rounded-lg border border-red-500/35 bg-red-500/15 px-2 py-1 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionBusyKey === rejectKey ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <AiChatTablePagination page={page} totalItems={items.length} onPageChange={setPage} />
      </div>
    </div>
  )
}
