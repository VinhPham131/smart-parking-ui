import { useEffect, useState } from 'react'
import AiChatTablePagination, { AI_CHAT_TABLE_PAGE_SIZE, slicePage } from './aiChatTablePagination'
import type { ParkingHistoryListPayload } from './TableList.types'

interface AiParkingHistoryListTableProps {
  payload: ParkingHistoryListPayload
}

export default function AiParkingHistoryListTable({ payload }: AiParkingHistoryListTableProps) {
  const items = Array.isArray(payload.items) ? payload.items : []
  const [page, setPage] = useState(1)

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / AI_CHAT_TABLE_PAGE_SIZE))
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [items.length])

  const visibleItems = slicePage(items, page, AI_CHAT_TABLE_PAGE_SIZE)
  const totalLabel = typeof payload.meta?.total === 'number' ? payload.meta.total : items.length
  const formatAmount = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined || amount === '') {
      return '—'
    }
    return String(amount)
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/70">Total {totalLabel}</div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-xs">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-2 py-2 font-medium">Plate</th>
                <th className="px-2 py-2 font-medium">Check-in</th>
                <th className="px-2 py-2 font-medium">Check-out</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleItems.map((item, index) => (
                <tr key={`${item.slot_code ?? 'slot'}-${item.plate ?? 'plate'}-${index}`}>
                  <td className="px-2 py-2 text-white">{item.plate ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80 text-center">{item.checkin ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80 text-center">{item.checkout ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80 text-center">{item.status ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80 text-center">{formatAmount(item.amount)}</td>
                  <td className="px-2 py-2 text-white/80 text-center">{item.payment_method ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AiChatTablePagination page={page} totalItems={items.length} onPageChange={setPage} />
      </div>
    </div>
  )
}
