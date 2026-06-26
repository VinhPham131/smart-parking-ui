import { HiOutlineRefresh } from 'react-icons/hi'

export interface AdminRefreshButtonProps {
  onClick: () => void
  loading?: boolean
  label?: string
}

export function AdminRefreshButton({
  onClick,
  loading = false,
  label = 'Refresh',
}: AdminRefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#1e222b] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#262b36] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {label}
    </button>
  )
}
