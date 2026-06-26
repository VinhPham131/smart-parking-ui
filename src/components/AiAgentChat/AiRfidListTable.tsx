import { useEffect, useState } from 'react'
import AiChatTablePagination, { AI_CHAT_TABLE_PAGE_SIZE, slicePage } from './aiChatTablePagination'
import type { RfidListItem, RfidListPayload } from './TableList.types'

interface AiRfidListTableProps {
  payload: RfidListPayload
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const statusBadgeClass = (isActive?: boolean) => {
  if (isActive === true) {
    return 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  }
  if (isActive === false) {
    return 'border border-red-500/30 bg-red-500/15 text-red-300'
  }
  return 'border border-white/15 bg-white/5 text-white/60'
}

const statusLabel = (item: RfidListItem) => {
  if (item.is_active === true) return 'Active'
  if (item.is_active === false) return 'Inactive'
  return '—'
}

export default function AiRfidListTable({ payload }: AiRfidListTableProps) {
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
                <th className="px-2 py-2 font-medium">RFID Code</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Vehicle</th>
                <th className="px-2 py-2 font-medium">Issued</th>
                <th className="px-2 py-2 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleItems.map((item, index) => (
                <tr key={`${item.id ?? item.rfid_code ?? 'row'}-${index}`}>
                  <td className="px-2 py-2 font-mono text-white">{item.rfid_code ?? '—'}</td>
                  <td className="px-2 py-2 capitalize text-white/80">{item.type ?? '—'}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(item.is_active)}`}
                    >
                      {statusLabel(item)}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-mono text-white/80">{item.vehicle ?? '—'}</td>
                  <td className="px-2 py-2 text-white/70">{formatDate(item.issued_date)}</td>
                  <td className="px-2 py-2 text-white/70">{formatDate(item.expired_date)}</td>
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
