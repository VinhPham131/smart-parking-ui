import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiChevronDown, HiChevronRight } from 'react-icons/hi'
import { AdminFilterPills } from '../../components/admin/AdminFilterPills'
import { AdminFilterToolbar } from '../../components/admin/AdminFilterToolbar'
import { AdminRefreshButton } from '../../components/admin/AdminRefreshButton'
import { FilterTabs } from '../../components/admin/FilterTabs'
import { useToast } from '../../components/Toast/useToast'
import { Badge, type BadgeVariant } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { AdminUser } from '../../types/admin'
import type { ApiError } from '../../types/vehicle'
import type { PaginationMeta } from '../../types/pagination'
import { userApi } from '../../services/userApi'
import { DEFAULT_PAGE_SIZE } from '../../constants/constants'
import { formatVND } from '../../utils/currency'
import { Pagination } from '../../components/ui/Pagination'

type RoleFilter = 'all' | 'admin' | 'user'
type VehicleFilter = 'all' | 'has' | 'none'
type ModalMode = 'create' | 'edit' | 'view'

const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All Roles' },
  { key: 'admin', label: 'Admin' },
  { key: 'user', label: 'User' },
]

const VEHICLE_TABS: { key: VehicleFilter; label: string }[] = [
  { key: 'all', label: 'All Users' },
  { key: 'has', label: 'Has Vehicle(s)' },
  { key: 'none', label: 'No Vehicles' },
]

const VEHICLE_FILTER_CONFIG: Partial<Record<VehicleFilter, { cls: string }>> = {
  has: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  none: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
}

function roleBadgeVariant(role: string): BadgeVariant {
  const r = (role || '').toLowerCase()
  if (r === 'admin') return 'primary'
  return 'neutral'
}

const emptyForm = {
  name: '',
  age: '' as number | '',
  phone: '',
  address: '',
  email: '',
  role: 'user',
  password: '',
}

export default function UserManagementPage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword, 320)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [saving, setSaving] = useState(false)
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [items, setItems] = useState<AdminUser[]>([])
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
  }, [debouncedKeyword, roleFilter, vehicleFilter])

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
        const res = await userApi.getUsersList({
          page,
          limit,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          is_has_vehicle: vehicleFilter === 'has' ? true : vehicleFilter === 'none' ? false : undefined,
          keyword: debouncedKeyword.trim() || undefined,
        })
        if (cancelled) return
        setItems(Array.isArray(res.data) ? res.data : [])
        setMeta(res.pagination ?? null)
      } catch (err) {
        if (!cancelled) {
          const apiError = err as ApiError
          toast.error(apiError.message || 'Failed to load users')
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
  }, [page, limit, refreshNonce, debouncedKeyword, roleFilter, vehicleFilter, toast])

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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreate = () => {
    setModalMode('create')
    setActiveUser(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const openEdit = (u: AdminUser) => {
    setModalMode('edit')
    setActiveUser(u)
    setForm({
      name: u.name ?? '',
      age: u.age ?? '',
      phone: u.phone ?? '',
      address: u.address ?? '',
      email: u.email ?? '',
      role: u.role ?? 'user',
      password: '',
    })
    setModalOpen(true)
  }

  const openView = (u: AdminUser) => {
    setModalMode('view')
    setActiveUser(u)
    setForm({
      name: u.name ?? '',
      age: u.age ?? '',
      phone: u.phone ?? '',
      address: u.address ?? '',
      email: u.email ?? '',
      role: u.role ?? 'user',
      password: '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()
    if (!name || !email) {
      toast.error('Name and email are required.')
      return
    }

    const age =
      form.age === '' ? undefined : Number(form.age)
    if (age !== undefined && (Number.isNaN(age) || age < 0)) {
      toast.error('Please enter a valid age.')
      return
    }

    try {
      setSaving(true)
      if (modalMode === 'create') {
        const response = await userApi.createUser({
          name,
          email,
          phone: form.phone.trim(),
          address: form.address.trim(),
          role: form.role,
          age: age ?? 0,
          ...(form.password.trim()
            ? { password: form.password.trim() }
            : {}),
        })
        if (response.message) {
          toast.success(response.message)
        }
      } else if (modalMode === 'edit' && activeUser) {
        const response = await userApi.updateUser(activeUser.id, {
          name,
          email,
          phone: form.phone.trim(),
          address: form.address.trim(),
          role: form.role,
          ...(age !== undefined ? { age } : {}),
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
      const res = await userApi.deleteUser(deleteTarget.id)
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

  const columns: DataTableColumn<AdminUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (u) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleExpand(u.id)}
              className="rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-expanded={expandedIds.has(u.id)}
              title={expandedIds.has(u.id) ? 'Collapse vehicles' : 'Expand vehicles'}
            >
              {expandedIds.has(u.id) ? (
                <HiChevronDown className="h-4 w-4" />
              ) : (
                <HiChevronRight className="h-4 w-4" />
              )}
            </button>
            <span className="font-medium text-white">{u.name || '—'}</span>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'email',
        headerClassName: '!text-left',
        cellClassName: '!text-left',
        render: (u) => (
          <span className="text-sm text-white/90">{u.email || '—'}</span>
        ),
      },
      {
        key: 'balance',
        header: 'Balance',
        headerClassName: 'text-right',
        cellClassName: 'text-right tabular-nums',
        render: (u) => (
          <span className="font-medium text-neon-green">
            {u.balance != null && Number.isFinite(u.balance)
              ? formatVND(u.balance)
              : '—'}
          </span>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (u) => (
          <Badge variant={roleBadgeVariant(u.role)}>
            {(u.role || 'user').toLowerCase()}
          </Badge>
        ),
      },
      {
        key: 'vehicles',
        header: 'Vehicles',
        headerClassName: 'text-center',
        cellClassName: 'text-center tabular-nums text-white/90',
        render: (u) => u.vehicles?.length ?? 0,
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        render: (u) => (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => openView(u)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => openEdit(u)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(u)}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [expandedIds],
  )

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[25px] font-bold uppercase tracking-[0.2em] text-neon-green">
            Users
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminRefreshButton onClick={refetch} loading={loading} />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:opacity-90 hover:shadow-neon-green/40"
          >
            + Create user
          </button>
        </div>
      </div>

      <AdminFilterPills
        tabs={ROLE_TABS}
        value={roleFilter}
        onChange={setRoleFilter}
      />

      <AdminFilterToolbar
        search={{
          value: keyword,
          onChange: setKeyword,
          placeholder: 'Search name, email, phone, plate…',
        }}
      >
        <FilterTabs
          tabs={VEHICLE_TABS}
          value={vehicleFilter}
          onChange={setVehicleFilter}
          configMap={VEHICLE_FILTER_CONFIG}
        />
      </AdminFilterToolbar>

      <div className="flex flex-col gap-2 px-1 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {loading
            ? 'Loading…'
            : total != null
              ? `${total} user${total === 1 ? '' : 's'}`
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
        rowKey={(u) => u.id}
        loading={loading}
        skeletonRows={8}
        emptyMessage="No users found. Try adjusting the filters or search."
        renderSubRow={(u) => (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Vehicles
            </p>
            {(u.vehicles?.length ?? 0) === 0 ? (
              <p className="text-sm text-white/45">No vehicles linked.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {u.vehicles!.map((v, i) => (
                  <li
                    key={`${v.license_plate}-${i}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs shadow-sm transition hover:border-white/20"
                  >
                    <span className="font-semibold text-white">
                      {v.license_plate}
                    </span>
                    <span className="text-white/50"> · {v.brand}</span>
                    <span className="text-white/50"> · {v.color}</span>
                    {(v.rfid?.rfid_code ?? v.rfid_code) ? (
                      <span className="ml-1 text-emerald-400/90">
                        · RFID {v.rfid?.rfid_code ?? v.rfid_code}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        isSubRowVisible={(u) => expandedIds.has(u.id)}
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
            ? "Create user"
            : modalMode === "edit"
              ? "Edit user"
              : "User details"
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
                form="user-form"
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
        {modalMode === "view" && activeUser ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-white/50">Name</dt>
              <dd className="text-white">{activeUser.name}</dd>
            </div>
            <div>
              <dt className="text-white/50">Email</dt>
              <dd className="text-white">{activeUser.email}</dd>
            </div>
            <div>
              <dt className="text-white/50">Phone</dt>
              <dd className="text-white">{activeUser.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">Address</dt>
              <dd className="text-white">{activeUser.address || "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">Age</dt>
              <dd className="text-white">{activeUser.age ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">Role</dt>
              <dd>
                <Badge variant={roleBadgeVariant(activeUser.role)}>
                  {(activeUser.role || "user").toLowerCase()}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Vehicles</dt>
              <dd className="text-white/80">
                {activeUser.vehicles?.length ?? 0} registered
              </dd>
            </div>
          </dl>
        ) : (
          <form id="user-form" className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-white/90">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm placeholder:text-white/40 focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Age
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.age}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      age: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white/90">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                >
                  <option value="user" className="bg-sidebar-bg">
                    user
                  </option>
                  <option value="admin" className="bg-sidebar-bg">
                    admin
                  </option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-white/90">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                  disabled={saving}
                />
              </div>
              {modalMode === "create" && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-white/90">
                    Password <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-sm focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                    disabled={saving}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.name || deleteTarget.email}? This cannot be undone.`
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
