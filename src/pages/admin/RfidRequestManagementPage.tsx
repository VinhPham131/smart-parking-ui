import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiOutlineCheck, HiOutlineX } from 'react-icons/hi'
import { AdminFilterToolbar } from '../../components/admin/AdminFilterToolbar'
import { FilterTabs } from '../../components/admin/FilterTabs'
import { AdminRefreshButton } from '../../components/admin/AdminRefreshButton'
import { useToast } from '../../components/Toast/useToast'
import { Badge, type BadgeVariant } from '../../components/ui/Badge'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { rfidRequestApi } from '../../services/rfidRequestApi'
import type { RfidRequestRecord, RfidRequestStatus } from '../../types/rfid-request'
import type { PaginationMeta } from '../../types/pagination'
import type { ApiError } from '../../types/vehicle'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { DEFAULT_PAGE_SIZE } from '../../constants/constants'
import { getVehicleBrand } from '../../constants/vehicles'
import { formatDateTime } from '../../utils/datetime'
import { Pagination } from '../../components/ui/Pagination'

type StatusFilter = RfidRequestStatus | 'all'

const STATUS_CONFIG: Record<
  RfidRequestStatus,
  { label: string; cls: string }
> = {
  Pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  Approved: { label: 'Approved', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  Rejected: { label: 'Rejected', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All Statuses' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
]

function rfidRequestStatusVariant(status: RfidRequestStatus): BadgeVariant {
  if (status === 'Pending') return 'warning'
  if (status === 'Approved') return 'success'
  return 'danger'
}

export default function RfidRequestManagementPage() {
  const toast = useToast()

  const [rows, setRows] = useState<RfidRequestRecord[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword, 320)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const refetch = useCallback(() => {
    setRefreshNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, debouncedKeyword])

  useEffect(() => {
    setPage(1)
  }, [limit])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setRows([])
      setMeta(null)
      try {
        const res = await rfidRequestApi.getAll({
          page,
          limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          keyword: debouncedKeyword.trim() || undefined,
        })
        if (cancelled) return
        setRows(res.data)
        setMeta(res.pagination)
      } catch (err) {
        if (!cancelled) {
          toast.error((err as ApiError).message || 'Failed to load RFID requests')
          setRows([])
          setMeta(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [page, limit, statusFilter, debouncedKeyword, refreshNonce, toast])

  const handleStatusFilter = (s: StatusFilter) => {
    setStatusFilter(s)
  }

  const total = meta?.total ?? null
  const totalPages = meta?.total_pages ?? null

  const showingRange = useMemo(() => {
    if (total == null || rows.length === 0) return null
    const start = (page - 1) * limit + 1
    const end = (page - 1) * limit + rows.length
    return { start, end }
  }, [page, limit, rows.length, total])

  const patchRequestStatus = useCallback(
    async (id: string, status: RfidRequestStatus) => {
      setUpdatingId(id)
      try {
        const res = await rfidRequestApi.updateStatus(id, status)
        toast.success(res.message)
        refetch()
      } catch (err) {
        toast.error((err as ApiError).message || 'Update failed')
      } finally {
        setUpdatingId(null)
      }
    },
    [refetch, toast],
  )

  const showActionsColumn = rows.some((r) => r.status === 'Pending')

  const requestColumns = useMemo<DataTableColumn<RfidRequestRecord>[]>(() => {
    const cols: DataTableColumn<RfidRequestRecord>[] = [
      {
        key: 'vehicle',
        header: 'Vehicle',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (r) => {
          const v = r.vehicle
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{v?.license_plate ?? '—'}</p>
              <p className="truncate text-xs text-white/55">
                {v?.brand ? (getVehicleBrand(v.brand)?.label ?? v.brand) : '—'}
              </p>
            </div>
          )
        },
      },
      {
        key: 'owner',
        header: 'Owner',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (r) => {
          const v = r.vehicle
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-white">{v?.user?.name ?? '—'}</span>
              <span className="text-xs text-white/55">{v?.user?.email ?? ''}</span>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => (
          <div className="flex justify-center">
            <Badge variant={rfidRequestStatusVariant(r.status)}>{r.status}</Badge>
          </div>
        ),
      },
      {
        key: 'requested',
        header: 'Requested',
        headerClassName: '!text-right',
        cellClassName: '!text-right',
        render: (r) => (
          <span className="tabular-nums text-xs text-white/60">{formatDateTime(r.created_at)}</span>
        ),
      },
    ]

    if (showActionsColumn) {
      cols.push({
        key: 'actions',
        header: 'Actions',
        render: (r) => {
          const busy = updatingId === r.id
          if (r.status !== 'Pending') {
            return <span className="text-white/35">—</span>
          }
          return (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void patchRequestStatus(r.id, 'Approved')}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1">
                  <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Approve
                </span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void patchRequestStatus(r.id, 'Rejected')}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1">
                  <HiOutlineX className="h-3.5 w-3.5" />
                  Reject
                </span>
              </button>
            </div>
          )
        },
      })
    }

    return cols
  }, [showActionsColumn, updatingId, patchRequestStatus])

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[25px] font-bold uppercase tracking-[0.2em] text-neon-green">
            RFID Request Management
          </p>
        </div>
        <AdminRefreshButton onClick={refetch} loading={loading} />
      </div>

      <AdminFilterToolbar
        search={{
          value: keyword,
          onChange: setKeyword,
          placeholder: 'Search plate or user name…',
        }}
      >
        <FilterTabs
          tabs={STATUS_TABS}
          value={statusFilter}
          onChange={handleStatusFilter}
          configMap={STATUS_CONFIG}
        />
      </AdminFilterToolbar>

      <div className="flex flex-col gap-2 px-1 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {loading
            ? 'Loading…'
            : total != null
              ? `${total} request${total === 1 ? '' : 's'}`
              : ''}
        </span>
        {total != null && total > 0 && (
          <span className="text-white/50">
            Page {page}
            {totalPages != null ? ` of ${totalPages}` : ''}
          </span>
        )}
      </div>

      <DataTable
        columns={requestColumns}
        data={rows}
        rowKey={(r) => r.id}
        loading={loading}
        skeletonRows={8}
        emptyMessage="No RFID requests found. Try adjusting filters or search."
      />

      {(total ?? 0) > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-white/50">
            {showingRange != null ? (
              <>
                Showing {showingRange.start}–{showingRange.end} of {total}
              </>
            ) : (
              <>Page {page}</>
            )}
          </span>
          <Pagination
            page={page}
            limit={limit}
            totalPages={totalPages}
            loading={loading}
            itemCount={rows.length}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      )}
    </div>
  );
}
