import { LIMIT_OPTIONS } from '../../constants/pagination'

export interface PaginationProps {
  page: number
  limit: number
  totalPages?: number | null
  loading?: boolean
  itemCount?: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function Pagination({
  page,
  limit,
  totalPages,
  loading = false,
  itemCount,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const canGoPrev = page > 1
  const canGoNext =
    totalPages != null ? page < totalPages : (itemCount ?? 0) === limit

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/50">Rows</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
        >
          {LIMIT_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="bg-sidebar-bg">
              {opt}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={!canGoPrev || loading}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <button
        type="button"
        disabled={!canGoNext || loading}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
