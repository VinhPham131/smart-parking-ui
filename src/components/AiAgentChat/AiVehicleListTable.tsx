import { useEffect, useState } from 'react'
import AiChatTablePagination, { AI_CHAT_TABLE_PAGE_SIZE, slicePage } from './aiChatTablePagination'
import type { VehicleListPayload } from './TableList.types'

interface AiVehicleListTableProps {
  payload: VehicleListPayload
}

export default function AiVehicleListTable({ payload }: AiVehicleListTableProps) {
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
                <th className="px-2 py-2 font-medium">Plate</th>
                <th className="px-2 py-2 font-medium">Brand</th>
                <th className="px-2 py-2 font-medium">Color</th>
                <th className="px-2 py-2 font-medium">Owner</th>
                <th className="px-2 py-2 font-medium">RFID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleItems.map((item, index) => (
                <tr key={`${item.id ?? item.license_plate ?? 'row'}-${index}`}>
                  <td className="px-2 py-2 font-mono text-white">{item.license_plate ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80">{item.brand ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80">{item.color ?? '—'}</td>
                  <td className="px-2 py-2 text-white/80">{item.user ?? '—'}</td>
                  <td className="px-2 py-2 font-mono text-white/80">{item.rfid ?? '—'}</td>
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
