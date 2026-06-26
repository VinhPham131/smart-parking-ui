import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiOutlineCash,
  HiOutlinePlusSm,
  HiOutlineStar,
  HiOutlineReply,
  HiOutlineClipboardList,
} from 'react-icons/hi'
import { AdminFilterPills } from '../../components/admin/AdminFilterPills'
import { AdminFilterToolbar } from '../../components/admin/AdminFilterToolbar'
import { AdminRefreshButton } from '../../components/admin/AdminRefreshButton'
import { FilterTabs } from '../../components/admin/FilterTabs'
import { useToast } from '../../components/Toast/useToast'
import { Badge, type BadgeVariant } from '../../components/ui/Badge'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { paymentApi } from '../../services/paymentApi'
import type { AdminPaymentRecord, PaymentType, PaymentStatus } from '../../types/payment'
import type { PaginationMeta } from '../../types/pagination'
import type { ApiError } from '../../types/vehicle'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { DEFAULT_PAGE_SIZE } from '../../constants/constants'
import { formatVND } from '../../utils/currency'
import { formatDateTime } from '../../utils/datetime'
import { Pagination } from '../../components/ui/Pagination'

// ── Config ────────────────────────────────────────────────────────────────────

type TypeFilter = PaymentType | 'all'
type StatusFilter = PaymentStatus | 'all'

interface TypeTabConfig {
  key: TypeFilter
  label: string
  icon: React.ElementType
  iconCls: string
  amountCls: string
  sign: '+' | '-'
}

const TYPE_TABS: TypeTabConfig[] = [
  {
    key: 'all',
    label: 'All',
    icon: HiOutlineClipboardList,
    iconCls: 'bg-white/10 text-white/60',
    amountCls: 'text-white',
    sign: '+',
  },
  {
    key: 'Deposit',
    label: 'Deposit',
    icon: HiOutlinePlusSm,
    iconCls: 'bg-emerald-500/15 text-emerald-400',
    amountCls: 'text-emerald-400',
    sign: '+',
  },
  {
    key: 'Parking Fee',
    label: 'Parking Fee',
    icon: HiOutlineCash,
    iconCls: 'bg-red-500/15 text-red-400',
    amountCls: 'text-red-400',
    sign: '-',
  },
  {
    key: 'Subscription',
    label: 'Subscription',
    icon: HiOutlineStar,
    iconCls: 'bg-amber-500/15 text-amber-400',
    amountCls: 'text-red-400',
    sign: '-',
  },
  {
    key: 'Refund',
    label: 'Refund',
    icon: HiOutlineReply,
    iconCls: 'bg-sky-500/15 text-sky-400',
    amountCls: 'text-emerald-400',
    sign: '+',
  },
]

const TYPE_CONFIG_MAP = Object.fromEntries(TYPE_TABS.map((t) => [t.key, t])) as Record<
  TypeFilter,
  TypeTabConfig
>

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Success: { label: 'Success', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  Pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  Failed: { label: 'Failed', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All Statuses' },
  { key: 'Success', label: 'Success' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Failed', label: 'Failed' },
]

function paymentStatusVariant(status: PaymentStatus): BadgeVariant {
  if (status === 'Success') return 'success'
  if (status === 'Pending') return 'warning'
  return 'danger'
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PaymentManagementPage() {
  const toast = useToast()

  const [payments, setPayments] = useState<AdminPaymentRecord[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(false)

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
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
  }, [typeFilter, statusFilter, debouncedKeyword])

  useEffect(() => {
    setPage(1)
  }, [limit])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setPayments([])
      setMeta(null)
      try {
        const res = await paymentApi.getAllPayments({
          page,
          limit,
          payment_type: typeFilter !== 'all' ? (typeFilter as PaymentType) : undefined,
          status: statusFilter !== 'all' ? (statusFilter as PaymentStatus) : undefined,
          keyword: debouncedKeyword.trim() || undefined,
        })
        if (cancelled) return
        setPayments(res.data)
        setMeta(res.pagination)
      } catch (err) {
        if (!cancelled) {
          toast.error((err as ApiError).message || 'Failed to load payments')
          setPayments([])
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
  }, [page, limit, typeFilter, statusFilter, debouncedKeyword, refreshNonce, toast])

  const handleTypeFilter = (t: TypeFilter) => {
    setTypeFilter(t)
  }

  const handleStatusFilter = (s: StatusFilter) => {
    setStatusFilter(s)
  }

  const total = meta?.total ?? null
  const totalPages = meta?.total_pages ?? null
  const canGoPrev = page > 1
  const canGoNext = totalPages != null ? page < totalPages : payments.length === limit

  const showingRange = useMemo(() => {
    if (total == null || payments.length === 0) return null
    const start = (page - 1) * limit + 1
    const end = (page - 1) * limit + payments.length
    return { start, end }
  }, [page, limit, payments.length, total])

  const paymentColumns: DataTableColumn<AdminPaymentRecord>[] = useMemo(
    () => [
      {
        key: 'user',
        header: 'User',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (p) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-white">{p.user?.name ?? '—'}</span>
            <span className="text-xs text-white/55">{p.user?.email ?? ''}</span>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (p) => {
          const typeCfg = TYPE_CONFIG_MAP[p.payment_type] ?? TYPE_CONFIG_MAP['all']
          const TypeIcon = typeCfg.icon
          return (
            <div className="flex items-center justify-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${typeCfg.iconCls}`}
              >
                <TypeIcon className="h-3.5 w-3.5" />
              </span>
              <span className="font-medium text-white/90">
                {typeCfg.key === 'all' ? p.payment_type : typeCfg.label}
              </span>
            </div>
          )
        },
      },
      {
        key: 'description',
        header: 'Description',
        headerClassName: '!text-left',
        cellClassName: '!text-left max-w-[220px]',
        render: (p) => (
          <span className="block truncate text-white/70" title={p.description}>
            {p.description || '—'}
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        headerClassName: '!text-right',
        cellClassName: '!text-right',
        render: (p) => {
          const typeCfg = TYPE_CONFIG_MAP[p.payment_type] ?? TYPE_CONFIG_MAP['all']
          return (
            <span className={`font-semibold tabular-nums ${typeCfg.amountCls}`}>
              {typeCfg.sign}
              {formatVND(p.amount)}
            </span>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (p) => (
          <div className="flex justify-center">
            <Badge variant={paymentStatusVariant(p.status)}>{p.status}</Badge>
          </div>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        headerClassName: '!text-right',
        cellClassName: '!text-right',
        render: (p) => (
          <span className="tabular-nums text-xs text-white/60">{formatDateTime(p.created_at)}</span>
        ),
      },
    ],
    [],
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[25px] font-bold uppercase tracking-[0.2em] text-neon-green">
            Payment Management
          </p>
        </div>
        <AdminRefreshButton onClick={refetch} loading={loading} />
      </div>

      <AdminFilterPills
        tabs={TYPE_TABS.map(({ key, label, icon }) => ({ key, label, icon }))}
        value={typeFilter}
        onChange={handleTypeFilter}
      />

      <AdminFilterToolbar
        search={{
          value: keyword,
          onChange: setKeyword,
          placeholder: 'Search user or description…',
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
              ? `${total} payment${total === 1 ? '' : 's'}`
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
        columns={paymentColumns}
        data={payments}
        rowKey={(p) => p.id}
        loading={loading}
        skeletonRows={8}
        emptyMessage="No payment records found. Try adjusting the filters or search."
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
            itemCount={payments.length}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      )}
    </div>
  );
}
