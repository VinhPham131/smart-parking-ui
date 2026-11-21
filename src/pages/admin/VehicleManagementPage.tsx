import { useCallback, useEffect, useMemo, useState } from 'react'
import ColorDot from '../../components/ColorDot'
import { AdminFilterPills } from '../../components/admin/AdminFilterPills'
import { AdminFilterToolbar } from '../../components/admin/AdminFilterToolbar'
import { AdminRefreshButton } from '../../components/admin/AdminRefreshButton'
import { useToast } from '../../components/Toast/useToast'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { AdminVehicle } from '../../types/admin'
import type { ApiError } from '../../types/vehicle'
import type { PaginationMeta } from '../../types/pagination'
import { vehicleApi } from '../../services/vehicleApi'
import { DEFAULT_PAGE_SIZE } from '../../constants/constants'
import { Pagination } from '../../components/ui/Pagination'
import { getVehicleBrand } from '../../constants/vehicles'

type RfidFilter = 'all' | 'assigned' | 'unassigned'

const RFID_TABS: { key: RfidFilter; label: string }[] = [
  { key: 'all', label: 'All Vehicles' },
  { key: 'assigned', label: 'Has RFID' },
  { key: 'unassigned', label: 'No RFID' },
]

type ModalMode = 'create' | 'edit' | 'view'

function hasRfidAssigned(v: AdminVehicle): boolean {
  return !!(v.rfid?.rfid_code && String(v.rfid.rfid_code).trim())
}

const emptyForm = {
  license_plate: '',
  brand: '',
  color: '',
}

export default function VehicleManagementPage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword, 320)
  const [rfidFilter, setRfidFilter] = useState<RfidFilter>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [saving, setSaving] = useState(false)
  const [activeVehicle, setActiveVehicle] = useState<AdminVehicle | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [deleteTarget, setDeleteTarget] = useState<AdminVehicle | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [items, setItems] = useState<AdminVehicle[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const refetch = useCallback(() => {
    setRefreshNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedKeyword, rfidFilter])

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
        const res = await vehicleApi.getVehiclesList({
          page,
          limit,
          is_has_rfid: rfidFilter === 'assigned' ? true : rfidFilter === 'unassigned' ? false : undefined,
          keyword: debouncedKeyword.trim() || undefined,
        })
        if (cancelled) return
        setItems(Array.isArray(res.data) ? res.data : [])
        setMeta(res.pagination ?? null)
      } catch (err) {
        if (!cancelled) {
          const apiError = err as ApiError
          toast.error(apiError.message || 'Failed to load vehicles')
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
  }, [page, limit, refreshNonce, debouncedKeyword, rfidFilter, toast])

  const total = meta?.total ?? null
  const totalPages = meta?.total_pages ?? null

  const showingRange = useMemo(() => {
    if (total == null || items.length === 0) return null
    const start = (page - 1) * limit + 1
    const end = (page - 1) * limit + items.length
    return { start, end }
  }, [page, limit, items.length, total])

  const openCreate = () => {
    setModalMode('create')
    setActiveVehicle(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const openEdit = (v: AdminVehicle) => {
    setModalMode('edit')
    setActiveVehicle(v)
    setForm({
      license_plate: v.license_plate ?? '',
      brand: v.brand ?? '',
      color: v.color ?? '',
    })
    setModalOpen(true)
  }

  const openView = (v: AdminVehicle) => {
    setModalMode('view')
    setActiveVehicle(v)
    setForm({
      license_plate: v.license_plate ?? '',
      brand: v.brand ?? '',
      color: v.color ?? '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const license_plate = form.license_plate.trim()
    const brand = form.brand.trim()
    const color = form.color.trim()
    if (!license_plate || !brand || !color) {
      toast.error('License plate, brand, and color are required.')
      return
    }

    try {
      setSaving(true)
      if (modalMode === 'create') {
        const response = await vehicleApi.createVehicle({
          license_plate,
          brand,
          color,
        })
        if (response.message) {
          toast.success(response.message)
        }
      } else if (modalMode === 'edit' && activeVehicle) {
        const response = await vehicleApi.updateVehicle(activeVehicle.id, {
          license_plate,
          brand,
          color,
        })
        if (response.message) {
          toast.success(response.message)
        }
      }
      setModalOpen(false)
      refetch()
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const res = await vehicleApi.deleteVehicle(deleteTarget.id)
      toast.success(res.message)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
    } finally {
      setDeleting(false)
    }
  }

  const columns: DataTableColumn<AdminVehicle>[] = useMemo(
    () => [
      {
        key: 'plate',
        header: 'Vehicle',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (v) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{v.license_plate}</p>
            <p className="truncate text-xs text-white/55">
              {v.brand ? (getVehicleBrand(v.brand)?.label ?? v.brand) : '—'}
            </p>
          </div>
        ),
      },
      {
        key: 'color',
        header: 'Color',
        render: (v) => (
          <div className="flex items-center justify-center gap-2">
            <ColorDot color={v.color || '#888'} size={12} />
            <span className="text-sm text-white/80">{v.color || '—'}</span>
          </div>
        ),
      },
      {
        key: 'user',
        header: 'Owner',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (v) =>
          v.user ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-white">{v.user.name}</span>
              <span className="text-xs text-white/55">{v.user.email}</span>
            </div>
          ) : (
            <span className="text-white/45">—</span>
          ),
      },
      {
        key: 'rfid',
        header: 'RFID',
        render: (v) => {
          const assigned = hasRfidAssigned(v)
          return (
            <div className="flex justify-center">
              <Badge variant={assigned ? 'success' : 'warning'}>
                {assigned ? v.rfid?.rfid_code : 'Unassigned'}
              </Badge>
            </div>
          )
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        render: (v) => (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => openView(v)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => openEdit(v)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(v)}
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
            Vehicles
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminRefreshButton onClick={refetch} loading={loading} />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:opacity-90 hover:shadow-neon-green/40"
          >
            + Create vehicle
          </button>
        </div>
      </div>

      <AdminFilterToolbar
        search={{
          value: keyword,
          onChange: setKeyword,
          placeholder: 'Search plate or brand…',
        }}
      >
        <AdminFilterPills
          tabs={RFID_TABS}
          value={rfidFilter}
          onChange={setRfidFilter}
        />
      </AdminFilterToolbar>

      <div className="flex flex-col gap-2 px-1 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {loading
            ? 'Loading…'
            : total != null
              ? `${total} vehicle${total === 1 ? '' : 's'}`
              : ''}
        </span>
        {total != null && total > 0 ? (
          <span className="text-white/50">
            Page {page}
            {totalPages != null ? ` of ${totalPages}` : ""}
          </span>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(v) => v.id}
        loading={loading}
        skeletonRows={8}
        emptyMessage="No vehicles found. Try adjusting the filters or search."
      />

      {(total ?? 0) > 0 ? (
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
            itemCount={items.length}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        title={
          modalMode === "create"
            ? "Create vehicle"
            : modalMode === "edit"
              ? "Edit vehicle"
              : "Vehicle details"
        }
        onClose={closeModal}
        busy={saving}
        footer={
          modalMode === "view" ? (
            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Close
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="vehicle-form"
                disabled={saving}
                className="flex-1 rounded-xl bg-neon-green py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : modalMode === "create"
                    ? "Create"
                    : "Save"}
              </button>
            </div>
          )
        }
      >
        {modalMode === "view" && activeVehicle ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-white/50">License plate</dt>
              <dd className="font-medium text-white">
                {activeVehicle.license_plate}
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Brand / color</dt>
              <dd className="flex items-center gap-2 text-white">
                {activeVehicle.brand}
                <ColorDot color={activeVehicle.color || "#888"} size={14} />
                {activeVehicle.color}
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Owner</dt>
              <dd className="text-white/90">
                {activeVehicle.user ? (
                  <>
                    <div>{activeVehicle.user.name}</div>
                    <div className="text-xs text-white/55">
                      {activeVehicle.user.email} · {activeVehicle.user.phone}
                    </div>
                    <div className="mt-1">
                      <Badge
                        variant={
                          (activeVehicle.user.role || "").toLowerCase() ===
                          "admin"
                            ? "primary"
                            : "neutral"
                        }
                      >
                        {(activeVehicle.user.role || "user").toLowerCase()}
                      </Badge>
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-white/50">RFID</dt>
              <dd>
                <Badge
                  variant={
                    hasRfidAssigned(activeVehicle) ? "success" : "warning"
                  }
                >
                  {hasRfidAssigned(activeVehicle)
                    ? activeVehicle.rfid?.rfid_code
                    : "Not assigned"}
                </Badge>
                {activeVehicle.rfid?.type ? (
                  <p className="mt-1 text-xs text-white/50">
                    Type: {activeVehicle.rfid.type}
                  </p>
                ) : null}
              </dd>
            </div>
          </dl>
        ) : (
          <form id="vehicle-form" className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-white/90">
                License plate <span className="text-red-400">*</span>
              </label>
              <input
                value={form.license_plate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, license_plate: e.target.value }))
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                disabled={saving}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Brand <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Color <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                  required
                />
              </div>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete vehicle"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.license_plate}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
