import { useEffect, useState } from 'react'
import AiChatTablePagination, { AI_CHAT_TABLE_PAGE_SIZE, slicePage } from './aiChatTablePagination'
import type { UserCancelReservationListPayload } from './TableList.types'

interface AiUserCancelReservationListTableProps {
  payload: UserCancelReservationListPayload
}

export default function AiUserCancelReservationListTable({
  payload,
}: AiUserCancelReservationListTableProps) {
  const items = Array.isArray(payload.items) ? payload.items : []
  const [page, setPage] = useState(1)

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / AI_CHAT_TABLE_PAGE_SIZE))
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [items.length])

  const visibleItems = slicePage(items, page, AI_CHAT_TABLE_PAGE_SIZE)
  const totalLabel = typeof payload.meta?.total === 'number' ? payload.meta.total : items.length

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/70">Total {totalLabel}</div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-xs">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Phone</th>
                <th className="px-2 py-2 font-medium">Cancel count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleItems.map((item, index) => (
                <tr key={`${item.user_id ?? 'user'}-${index}`}>
                  <td className="px-2 py-2 text-white">{item.user_name ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80">{item.user_email ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80">{item.user_phone ?? '—'}</td>
                  <td className="px-2 py-2 tabular-nums text-white">{item.count ?? '—'}</td>
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
