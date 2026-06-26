import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiOutlineClipboardList,
  HiOutlineStar,
} from 'react-icons/hi'
import { AdminFilterPills } from '../../components/admin/AdminFilterPills'
import { AdminFilterToolbar } from '../../components/admin/AdminFilterToolbar'
import { AdminRefreshButton } from '../../components/admin/AdminRefreshButton'
import { FilterTabs } from '../../components/admin/FilterTabs'
import { useToast } from '../../components/Toast/useToast'
import { Badge } from '../../components/ui/Badge'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { rfidApi, type RfidListParams } from '../../services/api'
import { vehicleApi } from '../../services/vehicleApi'
import type { ApiError } from '../../types/vehicle'
import type { AdminVehicle } from '../../types/admin'
import type { RfidCard, RfidType } from '../../types/rfid'
import type { PaginationMeta } from '../../types/pagination'
import { RfidTypeLabel, DEFAULT_PAGE_SIZE } from '../../constants/constants'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatDateTime } from '../../utils/datetime'
import { Pagination } from '../../components/ui/Pagination'

type ModalMode = 'create' | 'edit'
type ActiveFilter = 'all' | 'active' | 'inactive'
type AssignedFilter = 'all' | 'assigned' | 'unassigned'


const TYPE_TABS: { key: RfidType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'regular', label: 'Regular' },
  { key: 'member', label: 'Member' },
]

const ACTIVE_TABS: { key: ActiveFilter; label: string }[] = [
  { key: 'all', label: 'All Statuses' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

const ASSIGNED_TABS: { key: AssignedFilter; label: string }[] = [
  { key: 'all', label: 'All Cards' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'unassigned', label: 'Unassigned' },
]

const ACTIVE_FILTER_CONFIG: Partial<Record<ActiveFilter, { cls: string }>> = {
  active: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  inactive: { cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const ASSIGNED_FILTER_CONFIG: Partial<Record<AssignedFilter, { cls: string }>> = {
  assigned: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  unassigned: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
}


const TYPE_OPTIONS: { value: RfidType; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'member', label: 'Member' },
]

function toDateInputValue(input?: string | null) {
  if (!input) return ''
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function AdminRfidPage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword, 320)
  const [typeFilter, setTypeFilter] = useState<RfidType | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>('all')

  const [items, setItems] = useState<RfidCard[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<{
    id?: string
    rfid_code: string
    type: RfidType
    is_active: boolean
    expired_date: string
  }>({
    rfid_code: '',
    type: 'regular',
    is_active: true,
    expired_date: '',
  })

  const [assignTarget, setAssignTarget] = useState<RfidCard | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')

  const [deleteTarget, setDeleteTarget] = useState<RfidCard | null>(null)
  const [deleting, setDeleting] = useState(false)

  const refetch = useCallback(() => {
    setRefreshNonce((n) => n + 1)
  }, [])


  useEffect(() => {
    setPage(1)
  }, [debouncedKeyword, typeFilter, activeFilter, assignedFilter])

  useEffect(() => {
    setPage(1)
  }, [limit])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        setItems([])
        setMeta(null)
        const params: RfidListParams = {
          page,
          limit,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          is_active: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
          is_assigned: assignedFilter === 'assigned' ? true : assignedFilter === 'unassigned' ? false : undefined,
          keyword: debouncedKeyword.trim() || undefined,
        }
        const res = await rfidApi.getRfidList(params)
        if (cancelled) return
        setItems(Array.isArray(res.data) ? res.data : [])
        setMeta(res.pagination ?? null)
      } catch (error) {
        if (!cancelled) {
          const apiError = error as ApiError
          toast.error(apiError.message || 'Failed to load RFID cards')
          setItems([])
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
  }, [page, limit, refreshNonce, debouncedKeyword, typeFilter, activeFilter, assignedFilter, toast])

  const total = meta?.total ?? null
  const totalPages = meta?.total_pages ?? null
  const canGoPrev = page > 1
  const canGoNext = totalPages != null ? page < totalPages : items.length === limit

  const showingRange = useMemo(() => {
    if (total == null || items.length === 0) return null
    const start = (page - 1) * limit + 1
    const end = (page - 1) * limit + items.length
    return { start, end }
  }, [page, limit, items.length, total])

  const openCreate = () => {
    setModalMode('create')
    setForm({ rfid_code: '', type: 'regular', is_active: true, expired_date: '' })
    setIsModalOpen(true)
  }

  const openEdit = (card: RfidCard) => {
    setModalMode('edit')
    setForm({
      id: card.id,
      rfid_code: card.rfid_code ?? '',
      type: (card.type ?? 'regular') as RfidType,
      is_active: card.is_active ?? true,
      expired_date: toDateInputValue(card.expired_date),
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setIsModalOpen(false)
  }

  const openAssign = async (card: RfidCard) => {
    setAssignTarget(card)
    setSelectedVehicleId(card.vehicle?.id ?? '')

    try {
      setLoadingVehicles(true)
      const list = await vehicleApi.getAllVehicles()
      setVehicles(Array.isArray(list) ? list : [])
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message || 'Failed to load vehicles')
      setVehicles([])
    } finally {
      setLoadingVehicles(false)
    }
  }

  const closeAssign = () => {
    if (assigning) return
    setAssignTarget(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const rfid_code = form.rfid_code.trim()
    if (!rfid_code) {
      toast.error('Please enter RFID code')
      return
    }

    try {
      setSaving(true)
      if (modalMode === 'create') {
        const res = await rfidApi.create({ rfid_code, type: form.type })
        toast.success(res.message)
      } else {
        if (!form.id) {
          toast.error('Missing RFID id')
          return
        }
        const res = await rfidApi.update({
          id: form.id,
          rfid_code,
          type: form.type,
          is_active: form.is_active,
          expired_date: form.expired_date ? form.expired_date : null,
        })
        toast.success(res.message)
      }
      setIsModalOpen(false)
      refetch()
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTarget) return
    try {
      setAssigning(true)
      const res = await rfidApi.update({
        id: assignTarget.id,
        vehicle_id: selectedVehicleId ? selectedVehicleId : null,
      })
      toast.success(res.message)
      setAssignTarget(null)
      refetch()
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message)
    } finally {
      setAssigning(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const res = await rfidApi.delete(deleteTarget.id)
      toast.success(res.message)
      setDeleteTarget(null)
      refetch()
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message)
    } finally {
      setDeleting(false)
    }
  }


  const rfidColumns: DataTableColumn<RfidCard>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'RFID Code',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (card) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{card.rfid_code}</p>
            <p className="truncate text-xs text-white/45">ID: {card.id}</p>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (card) => (
          <Badge variant={card.type === 'member' ? 'primary' : 'neutral'}>
            {RfidTypeLabel[card.type]}
          </Badge>
        ),
      },
      {
        key: 'vehicle',
        header: 'Vehicle',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (card) =>
          card.vehicle?.license_plate ? (
            <span className="font-medium text-white">{card.vehicle.license_plate}</span>
          ) : (
            <span className="text-white/40">Unassigned</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (card) => (
          <div className="flex justify-center">
            <Badge variant={card.is_active === false ? 'danger' : 'success'}>
              {card.is_active === false ? 'Inactive' : 'Active'}
            </Badge>
          </div>
        ),
      },
      {
        key: 'expired',
        header: 'Expired',
        headerClassName: '!text-right',
        cellClassName: '!text-right',
        render: (card) => (
          <span className="tabular-nums text-xs text-white/60">
            {formatDateTime(card.expired_date)}
          </span>
        ),
      },
      {
        key: 'issued',
        header: 'Issued',
        headerClassName: '!text-right',
        cellClassName: '!text-right',
        render: (card) => (
          <span className="tabular-nums text-xs text-white/60">
            {formatDateTime(card.issued_date)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (card) => (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => void openAssign(card)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Assign
            </button>
            <button
              type="button"
              onClick={() => openEdit(card)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(card)}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[25px] font-bold uppercase tracking-[0.2em] text-neon-green">
            RFID Cards
          </p>
        </div>

        <div className="flex gap-3">
          <AdminRefreshButton onClick={refetch} loading={loading} />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black shadow-md transition hover:opacity-90 hover:shadow-neon-green/50"
          >
            + Create RFID
          </button>
        </div>
      </div>

      <AdminFilterPills
        tabs={TYPE_TABS.map(({ key, label }) => ({
          key,
          label,
          icon:
            key === 'member'
              ? HiOutlineStar
              : key === 'regular'
                ? HiOutlineClipboardList
                : undefined,
        }))}
        value={typeFilter}
        onChange={setTypeFilter}
      />

      <AdminFilterToolbar
        search={{
          value: keyword,
          onChange: setKeyword,
          placeholder: 'Search code or vehicle plate…',
        }}
      >
        <FilterTabs
          tabs={ACTIVE_TABS}
          value={activeFilter}
          onChange={setActiveFilter}
          configMap={ACTIVE_FILTER_CONFIG}
        />
        <FilterTabs
          tabs={ASSIGNED_TABS}
          value={assignedFilter}
          onChange={setAssignedFilter}
          configMap={ASSIGNED_FILTER_CONFIG}
        />
      </AdminFilterToolbar>

      <div className="flex flex-col gap-2 px-1 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {loading
            ? 'Loading…'
            : total != null
              ? `${total} card${total === 1 ? '' : 's'}`
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
        columns={rfidColumns}
        data={items}
        rowKey={(card) => card.id}
        loading={loading}
        skeletonRows={8}
        emptyMessage="No RFID cards found. Try adjusting the filters or search."
      />

      {(total ?? 0) > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-white/50">
            {showingRange != null ? (
              <>Showing {showingRange.start}–{showingRange.end} of {total}</>
            ) : (
              <>Page {page}</>
            )}
          </span>
          <Pagination
            page={page}
            limit={limit}
            totalPages={totalPages}
            loading={loading}
            itemCount={items.length}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/20 bg-sidebar-bg p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {modalMode === 'create' ? 'Create RFID' : 'Edit RFID'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-white/60 hover:text-neon-green"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  RFID Code <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.rfid_code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, rfid_code: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  placeholder="Enter RFID code..."
                  disabled={saving}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as RfidType,
                    }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-sidebar-bg">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {modalMode === 'edit' && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-white/90">
                        Active
                      </label>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            is_active: !prev.is_active,
                          }))
                        }
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                          form.is_active
                            ? 'border-neon-green/40 bg-neon-green/15 text-neon-green'
                            : 'border-red-500/30 bg-red-500/10 text-red-300'
                        }`}
                      >
                        {form.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-white/90">
                        Expired Date
                      </label>
                      <input
                        type="date"
                        value={form.expired_date}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            expired_date: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <p className="-mt-2 text-xs text-white/50">
                    Leave expired date empty to clear.
                  </p>
                </>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Saving...
                    </span>
                  ) : modalMode === 'create' ? (
                    'Create'
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeAssign}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/20 bg-sidebar-bg p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Assign Vehicle
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  RFID:{' '}
                  <span className="font-semibold text-white">
                    {assignTarget.rfid_code}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeAssign}
                className="text-white/60 hover:text-neon-green"
                disabled={assigning}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  disabled={assigning || loadingVehicles}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                >
                  <option value="" className="bg-sidebar-bg">
                    Unassigned
                  </option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-sidebar-bg">
                      {v.license_plate}
                      {v.brand ? ` · ${v.brand}` : ''} ({v.id})
                    </option>
                  ))}
                </select>
                {loadingVehicles && (
                  <div className="text-xs text-white/50">
                    Loading vehicles...
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeAssign}
                  disabled={assigning}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning}
                  className="flex-1 rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigning ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Saving...
                    </span>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/20 bg-sidebar-bg p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-xl font-semibold text-white">
              Delete RFID
            </div>
            <p className="text-sm text-white/70">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                {deleteTarget.rfid_code}
              </span>
              ?
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => !deleting && setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
