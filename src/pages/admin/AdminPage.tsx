import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineLocationMarker,
  HiOutlineChip,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamation,
  HiOutlineCalendar,
} from "react-icons/hi";
import { useToast } from "../../components/Toast/useToast";
import { parkingApi } from "../../services/api";
import type { ParkingArea, CreateParkingAreaRequest } from "../../types/parking";
import type { PaginationMeta } from "../../types/pagination";
import type { ApiError } from "../../types/vehicle";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { DEFAULT_PAGE_SIZE } from "../../constants/constants";
import { AdminFilterPills } from "../../components/admin/AdminFilterPills";
import { AdminFilterToolbar } from "../../components/admin/AdminFilterToolbar";
import { StatCard } from "../../components/admin/StatCard";
import { Pagination } from "../../components/ui/Pagination";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { calcOccupiedSlots } from "../../utils/parkingAreaSlots";

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateAreaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateAreaModal({ open, onClose, onCreated }: CreateAreaModalProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<CreateParkingAreaRequest>({ name: "", slots_quantity: 10 });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateParkingAreaRequest, string>>>({});

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Area name is required";
    if (form.slots_quantity < 1) next.slots_quantity = "Must be at least 1 slot";
    if (form.slots_quantity > 9999) next.slots_quantity = "Cannot exceed 9999 slots";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setBusy(true);
      const res = await parkingApi.createParkingArea({
        name: form.name.trim(),
        slots_quantity: form.slots_quantity,
      });
      toast.success(res.message);
      onCreated();
      setForm({ name: "", slots_quantity: 10 });
      setErrors({});
    } catch (err) {
      toast.error((err as ApiError).message || "Failed to create parking area");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    setForm({ name: "", slots_quantity: 10 });
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} title="Add Parking Area" onClose={handleClose} busy={busy}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={handleClose} disabled={busy}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50">
            Cancel
          </button>
          <button form="create-area-form" type="submit" disabled={busy}
            className="flex-1 rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50">
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Creating...
              </span>
            ) : "Create Area"}
          </button>
        </div>
      }
    >
      <form id="create-area-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="ca-name" className="block text-sm font-medium text-white/90">
            Area Name <span className="text-red-400">*</span>
          </label>
          <input
            id="ca-name" type="text" value={form.name} disabled={busy}
            onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
            placeholder="e.g. Area A, Level 1"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/30 disabled:opacity-50"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="ca-slots" className="block text-sm font-medium text-white/90">
            Total Slots <span className="text-red-400">*</span>
          </label>
          <input
            id="ca-slots" type="number" min={1} max={9999} value={form.slots_quantity} disabled={busy}
            onChange={(e) => { setForm((p) => ({ ...p, slots_quantity: Number(e.target.value) })); setErrors((p) => ({ ...p, slots_quantity: undefined })); }}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/30 disabled:opacity-50"
          />
          {errors.slots_quantity && <p className="text-xs text-red-400">{errors.slots_quantity}</p>}
          <p className="text-xs text-white/40">Number of parking slots in this area</p>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive";

interface ConfirmAction {
  area: ParkingArea;
  type: "activate" | "deactivate";
}

function AdminPage() {
  const toast = useToast();
  const navigate = useNavigate();

  // Data state
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsRows, setStatsRows] = useState<ParkingArea[]>([]);
  const [tabCounts, setTabCounts] = useState({ all: 0, active: 0, inactive: 0 });

  // UI state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);

  // Modal / inline-edit state
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  interface InlineEdit {
    areaId: string;
    field: "slots_quantity" | "maintenance_slots";
    value: string;
    busy: boolean;
  }
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  interface PendingInlineConfirm {
    areaId: string;
    areaName: string;
    field: "slots_quantity" | "maintenance_slots";
    newValue: number;
  }
  const [pendingInlineConfirm, setPendingInlineConfirm] = useState<PendingInlineConfirm | null>(null);
  const [pendingInlineConfirmBusy, setPendingInlineConfirmBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Data fetching (GET /parking-areas — server filter + pagination) ───────

  const fetchDashboardMeta = useCallback(async () => {
    try {
      const [allRes, actRes, inactRes, statsRes] = await Promise.all([
        parkingApi.getParkingAreas({ page: 1, limit: 1 }),
        parkingApi.getParkingAreas({ page: 1, limit: 1, is_active: true }),
        parkingApi.getParkingAreas({ page: 1, limit: 1, is_active: false }),
        parkingApi.getParkingAreas({ page: 1, limit: 500 }),
      ]);
      setTabCounts({
        all: allRes.pagination.total,
        active: actRes.pagination.total,
        inactive: inactRes.pagination.total,
      });
      setStatsRows(statsRes.data);
    } catch {
      /* keep previous stats on failure */
    }
  }, []);

  const fetchTable = useCallback(async () => {
    try {
      setLoading(true);
      const isActiveParam =
        statusFilter === "all" ? undefined : statusFilter === "active";
      const res = await parkingApi.getParkingAreas({
        page,
        limit,
        name: debouncedSearch || undefined,
        is_active: isActiveParam,
      });
      setAreas(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error((err as ApiError).message || "Failed to load parking areas");
      setAreas([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [toast, page, limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    void fetchTable();
  }, [fetchTable]);

  useEffect(() => {
    void fetchDashboardMeta();
  }, [fetchDashboardMeta]);

  const refreshParkingAreas = useCallback(() => {
    void fetchTable();
    void fetchDashboardMeta();
  }, [fetchTable, fetchDashboardMeta]);

  useSocketEvent("parking-area-changed", refreshParkingAreas);

  // ── Local state updates (optimistic-like after API calls) ──────────────────

  const handleCreated = () => {
    setCreateOpen(false);
    void fetchTable();
    void fetchDashboardMeta();
  };

  const openInlineEdit = (area: ParkingArea, field: "slots_quantity" | "maintenance_slots") => {
    if (inlineEdit?.busy) return;
    setInlineEdit({ areaId: area.id, field, value: String(area[field]), busy: false });
    setTimeout(() => inlineInputRef.current?.select(), 0);
  };

  const cancelInlineEdit = () => {
    if (!inlineEdit?.busy) setInlineEdit(null);
  };

  const commitInlineEdit = () => {
    if (!inlineEdit || inlineEdit.busy) return;
    const area = areas.find((a) => a.id === inlineEdit.areaId);
    if (!area) { setInlineEdit(null); return; }

    const num = Number(inlineEdit.value);
    if (!Number.isInteger(num) || Number.isNaN(num)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (inlineEdit.field === "slots_quantity" && (num < 1 || num > 9999)) {
      toast.error("Total slots must be between 1 and 9999");
      return;
    }
    if (inlineEdit.field === "maintenance_slots" && num < 0) {
      toast.error("Maintenance slots cannot be negative");
      return;
    }
    if (inlineEdit.field === "maintenance_slots" && num > area.slots_quantity) {
      toast.error("Maintenance slots cannot exceed total slots");
      return;
    }
    if (num === area[inlineEdit.field]) { setInlineEdit(null); return; }

    setPendingInlineConfirm({
      areaId: inlineEdit.areaId,
      areaName: area.name ?? "",
      field: inlineEdit.field,
      newValue: num,
    });
    setInlineEdit(null);
  };

  const confirmInlineEdit = async () => {
    if (!pendingInlineConfirm) return;
    try {
      setPendingInlineConfirmBusy(true);
      const res = pendingInlineConfirm.field === "slots_quantity"
        ? await parkingApi.updateSlotsQuantity(pendingInlineConfirm.areaId, pendingInlineConfirm.newValue)
        : await parkingApi.updateMaintenanceSlots(pendingInlineConfirm.areaId, pendingInlineConfirm.newValue);
      toast.success(res.message);
      setPendingInlineConfirm(null);
      void fetchTable();
      void fetchDashboardMeta();
    } catch (err) {
      toast.error((err as ApiError).message || "Failed to update");
    } finally {
      setPendingInlineConfirmBusy(false);
    }
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitInlineEdit();
    if (e.key === "Escape") cancelInlineEdit();
  };

  const handleConfirmToggle = async () => {
    if (!confirmAction) return;
    try {
      setConfirmBusy(true);
      const res = confirmAction.type === "deactivate"
        ? await parkingApi.deactivateParkingArea(confirmAction.area.id)
        : await parkingApi.activateParkingArea(confirmAction.area.id);
      toast.success(res.message);
      setConfirmAction(null);
      void fetchTable();
      void fetchDashboardMeta();
    } catch (err) {
      toast.error((err as ApiError).message || "Action failed");
    } finally {
      setConfirmBusy(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useLayoutEffect(() => {
    setPage(1);
  }, [limit]);

  const totalFiltered = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const canGoPrev = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;
  const showingRange = useMemo(() => {
    if (totalFiltered === 0 || areas.length === 0) return null;
    const start = (page - 1) * limit + 1;
    const end = (page - 1) * limit + areas.length;
    return { start, end };
  }, [page, limit, areas.length, totalFiltered]);

  const emptyMessage =
    tabCounts.all === 0
      ? "No parking areas yet. Click Add Area to create your first parking area."
      : "No areas match your search or filters.";

  const totalSlots = statsRows.reduce((s, a) => s + a.slots_quantity, 0);
  const totalAvailable = statsRows.reduce((s, a) => s + a.available_slots, 0);
  const totalReserved = statsRows.reduce((s, a) => s + a.reserved_slots, 0);
  const totalMaintenance = statsRows.reduce((s, a) => s + a.maintenance_slots, 0);
  const totalOccupied = statsRows.reduce((s, a) => s + calcOccupiedSlots(a), 0);

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: tabCounts.all },
    { key: "active", label: "Active", count: tabCounts.active },
    { key: "inactive", label: "Inactive", count: tabCounts.inactive },
  ];

  const columns: DataTableColumn<ParkingArea>[] = [
      {
        key: "name",
        header: "Name",
        render: (area) => (
          <div className="flex items-center justify-center gap-2.5">
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${area.is_active ? "bg-neon-green" : "bg-white/20"}`}
            />
            <span className="font-semibold text-white">{area.name ?? "—"}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (area) =>
          area.is_active ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="neutral">Inactive</Badge>
          ),
      },
      {
        key: "slots_quantity",
        header: "Total",
        render: (area) =>
          inlineEdit?.areaId === area.id && inlineEdit.field === "slots_quantity" ? (
            <input
              ref={inlineInputRef}
              type="number"
              min={1}
              max={9999}
              value={inlineEdit.value}
              disabled={inlineEdit.busy}
              onChange={(e) =>
                setInlineEdit((p) => p && { ...p, value: e.target.value })
              }
              onKeyDown={handleInlineKeyDown}
              onBlur={commitInlineEdit}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto w-20 rounded-lg border border-neon-green/60 bg-[#1e222b] px-2 py-1 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-green/30 disabled:opacity-50"
            />
          ) : (
            <button
              type="button"
              title="Click to edit total slots"
              onClick={() => openInlineEdit(area, "slots_quantity")}
              className="cursor-pointer rounded px-2 py-0.5 font-medium transition hover:bg-neon-green/10 hover:text-neon-green"
            >
              {area.slots_quantity}
            </button>
          ),
      },
      {
        key: "available_slots",
        header: "Available",
        render: (area) => (
          <span className="font-medium text-emerald-300">{area.available_slots}</span>
        ),
      },
      {
        key: "occupied",
        header: "Occupied",
        render: (area) => (
          <span className="font-medium text-red-300">{calcOccupiedSlots(area)}</span>
        ),
      },
      {
        key: "reserved_slots",
        header: "Reserved",
        render: (area) => (
          <button
            type="button"
            onClick={() => navigate("/admin/reservations")}
            className="font-medium text-amber-300 transition hover:text-amber-200 hover:underline"
            title="View reservations"
          >
            {area.reserved_slots}
          </button>
        ),
      },
      {
        key: "maintenance_slots",
        header: "Maintenance",
        render: (area) =>
          inlineEdit?.areaId === area.id && inlineEdit.field === "maintenance_slots" ? (
            <input
              ref={inlineInputRef}
              type="number"
              min={0}
              value={inlineEdit.value}
              disabled={inlineEdit.busy}
              onChange={(e) =>
                setInlineEdit((p) => p && { ...p, value: e.target.value })
              }
              onKeyDown={handleInlineKeyDown}
              onBlur={commitInlineEdit}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto w-20 rounded-lg border border-yellow-400/60 bg-[#1e222b] px-2 py-1 text-center text-sm text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-50"
            />
          ) : (
            <button
              type="button"
              title="Click to edit maintenance slots"
              onClick={() => openInlineEdit(area, "maintenance_slots")}
              className="cursor-pointer rounded px-2 py-0.5 font-medium text-yellow-300 transition hover:bg-yellow-400/10"
            >
              {area.maintenance_slots}
            </button>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-center",
        cellClassName: "text-center",
        render: (area) => (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                setConfirmAction({
                  area,
                  type: area.is_active ? "deactivate" : "activate",
                })
              }
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                area.is_active
                  ? "border-red-500/35 bg-[#2a1e1e] text-red-400 hover:border-red-500/60 hover:bg-red-500/20"
                  : "border-emerald-500/35 bg-[#1a2a1e] text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/20"
              }`}
            >
              {area.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ),
      },
    ];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[25px] font-bold uppercase tracking-[0.2em] text-neon-green">
            Parking Areas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void fetchTable();
              void fetchDashboardMeta();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#1e222b] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#262b36] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineRefresh
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-neon-green px-3.5 py-2 text-sm font-semibold text-black shadow-md transition hover:opacity-90"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Add Area
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-3 sm:grid-cols-6">
        <StatCard
          label="Total Areas"
          value={tabCounts.all}
          color="green"
          icon={<HiOutlineLocationMarker className="h-4 w-4" />}
        />
        <StatCard
          label="Total Slots"
          value={totalSlots}
          color="white"
          icon={<HiOutlineChip className="h-4 w-4" />}
        />
        <StatCard
          label="Available"
          value={totalAvailable}
          color="emerald"
          icon={<HiOutlineCheckCircle className="h-4 w-4" />}
        />
        <StatCard
          label="Occupied"
          value={totalOccupied}
          color="red"
          icon={<HiOutlineXCircle className="h-4 w-4" />}
        />
        <StatCard
          label="Reserved"
          value={totalReserved}
          color="amber"
          icon={<HiOutlineCalendar className="h-4 w-4" />}
        />
        <StatCard
          label="Maintenance"
          value={totalMaintenance}
          color="yellow"
          icon={<HiOutlineExclamation className="h-4 w-4" />}
        />
      </div>

      <AdminFilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search areas…',
        }}
      >
        <AdminFilterPills
          tabs={statusTabs.map(({ key, label, count }) => ({
            key,
            label,
            count,
          }))}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </AdminFilterToolbar>

      <div className="flex shrink-0 items-center justify-between px-1 text-sm text-white/70">
        <span>
          {loading ? "Loading…" : `${totalFiltered} area(s)`}
        </span>
        {totalFiltered > 0 ? (
          <span className="text-white/50">
            Page {page}
            {totalPages > 0 ? ` of ${totalPages}` : ""}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <DataTable
          columns={columns}
          data={areas}
          rowKey={(a) => a.id}
          loading={loading}
          emptyMessage={emptyMessage}
        />

        {totalFiltered > 0 ? (
          <div className="flex shrink-0 items-center justify-between px-1">
            <span className="text-sm text-white/50">
              {showingRange != null ? (
                <>
                  Showing {showingRange.start}–{showingRange.end} of {totalFiltered}
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
              itemCount={areas.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <CreateAreaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.type === "deactivate"
            ? "Deactivate Area"
            : "Activate Area"
        }
        message={
          confirmAction?.type === "deactivate"
            ? `Deactivate "${confirmAction.area.name}"? Users will no longer be able to book slots in this area.`
            : `Activate "${confirmAction?.area.name}"? This area will become available for bookings.`
        }
        confirmLabel={
          confirmAction?.type === "deactivate" ? "Deactivate" : "Activate"
        }
        danger={confirmAction?.type === "deactivate"}
        loading={confirmBusy}
        onConfirm={() => void handleConfirmToggle()}
        onCancel={() => !confirmBusy && setConfirmAction(null)}
      />

      <ConfirmDialog
        open={!!pendingInlineConfirm}
        title={
          pendingInlineConfirm?.field === "slots_quantity"
            ? "Update Total Slots"
            : "Update Maintenance Slots"
        }
        message={
          pendingInlineConfirm?.field === "slots_quantity"
            ? `Set total slots for "${pendingInlineConfirm.areaName}" to ${pendingInlineConfirm?.newValue}?`
            : `Set maintenance slots for "${pendingInlineConfirm?.areaName}" to ${pendingInlineConfirm?.newValue}?`
        }
        confirmLabel="Update"
        danger={false}
        loading={pendingInlineConfirmBusy}
        onConfirm={() => void confirmInlineEdit()}
        onCancel={() =>
          !pendingInlineConfirmBusy && setPendingInlineConfirm(null)
        }
      />
    </div>
  );
}

export default AdminPage;
