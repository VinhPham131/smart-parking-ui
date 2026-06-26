export const AI_CHAT_TABLE_PAGE_SIZE = 5

interface AiChatTablePaginationProps {
  page: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
}

export default function AiChatTablePagination({
  page,
  totalItems,
  pageSize = AI_CHAT_TABLE_PAGE_SIZE,
  onPageChange,
}: AiChatTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, totalItems)

  if (totalItems <= pageSize) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/3 px-2 py-2 text-[11px] text-white/65">
      <span>
        {from}–{to} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <span className="px-1 tabular-nums">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function slicePage<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}
