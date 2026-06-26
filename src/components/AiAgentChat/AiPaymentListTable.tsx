import { useEffect, useState } from 'react'
import AiChatTablePagination, { AI_CHAT_TABLE_PAGE_SIZE, slicePage } from './aiChatTablePagination'
import type { PaymentListPayload } from './TableList.types'

interface AiPaymentListTableProps {
  payload: PaymentListPayload
}

const statusBadgeClass = (raw?: string) => {
  const status = (raw ?? '').toLowerCase()
  if (status === 'success' || status === 'successful') {
    return 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  }
  if (status === 'failed' || status === 'failure') {
    return 'border border-red-500/30 bg-red-500/15 text-red-300'
  }
  if (status === 'pending') {
    return 'border border-amber-500/30 bg-amber-500/15 text-amber-300'
  }
  return 'border border-white/15 bg-white/5 text-white/60'
}

const formatAmount = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined || amount === '') {
    return '—'
  }
  const num = typeof amount === 'number' ? amount : Number(amount)
  if (Number.isNaN(num)) return String(amount)
  return num.toLocaleString('vi-VN')
}

export default function AiPaymentListTable({ payload }: AiPaymentListTableProps) {
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
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Description</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleItems.map((item, index) => (
                <tr key={`${item.id ?? 'row'}-${index}`}>
                  <td className="px-2 py-2 text-white/80">{item.user ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80">{item.payment_type ?? '—'}</td>
                  <td className="px-2 py-2 font-mono text-white">{formatAmount(item.amount)}</td>
                  <td className="px-2 py-2 text-white/70">{item.description ?? '—'}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(item.status)}`}
                    >
                      {item.status ?? '—'}
                    </span>
                  </td>
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
