import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineTrash } from "react-icons/hi";
import { AdminFilterPills } from "../../components/admin/AdminFilterPills";
import { AdminFilterToolbar } from "../../components/admin/AdminFilterToolbar";
import {
  AdminFilterField,
  adminFilterFieldCls,
} from "../../components/admin/AdminFilterField";
import { AdminRefreshButton } from "../../components/admin/AdminRefreshButton";
import ColorDot from "../../components/ColorDot";
import { useToast } from "../../components/Toast/useToast";
import { Badge } from "../../components/ui/Badge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { parkingApi, reservationApi } from "../../services/api";
import { getAppSocket } from "../../services/socket";
import type { ParkingArea } from "../../types/parking";
import type { PaginationMeta } from "../../types/pagination";
import type { ParkingStatus, Reservation, ReservationStatus } from "../../types/reservation";
import type { ApiError } from "../../types/vehicle";
import { formatReservationDateTime } from "../../utils/datetime";
import { DEFAULT_PAGE_SIZE } from "../../constants/constants";
import { Pagination } from "../../components/ui/Pagination";


const RESERVATION_STATUS_TABS: { key: "all" | ReservationStatus; label: string }[] = [
  { key: "all", label: "All Statuses" },
  { key: "Pending", label: "Pending" },
  { key: "Approved", label: "Approved" },
  { key: "Rejected", label: "Rejected" },
];

const PARKING_STATUS_TABS: { key: "all" | ParkingStatus; label: string }[] = [
  { key: "all", label: "All Parking" },
  { key: "Pending", label: "Pending" },
  { key: "Checked In", label: "Checked In" },
  { key: "Cancelled", label: "Cancelled" },
];

function normalizeStatus(raw: string | undefined): ReservationStatus {
  const x = (raw || "").toLowerCase();
  if (x === "approved") return "Approved";
  if (x === "rejected") return "Rejected";
  return "Pending";
}

function statusBadgeVariant(
  s: ReservationStatus,
): "success" | "warning" | "danger" {
  if (s === "Approved") return "success";
  if (s === "Rejected") return "danger";
  return "warning";
}

function vehiclePlate(r: Reservation): string {
  const v = r.vehicle;
  if (v && "license_plate" in v) return v.license_plate || "—";
  return "—";
}

function vehicleBrand(r: Reservation): string {
  const v = r.vehicle;
  if (v && "brand" in v) return v.brand || "—";
  return "—";
}

function vehicleColor(r: Reservation): string {
  const v = r.vehicle;
  if (v && "color" in v) return v.color || "#888";
  return "#888";
}

function areaLabel(r: Reservation): string {
  const a = r.parking_area;
  if (a && "name" in a) return `Area ${a.name}`;
  return "—";
}

function reservationDisplayCode(r: Reservation): string {
  return r.reservation_code?.trim() || r.id;
}

function normalizeParkingStatus(raw: string | undefined): ParkingStatus {
  if (raw === "Checked In") return "Checked In";
  if (raw === "Cancelled") return "Cancelled";
  return "Pending";
}

function parkingStatusBadgeVariant(
  s: ParkingStatus,
): "primary" | "warning" | "danger" {
  if (s === "Checked In") return "primary";
  if (s === "Cancelled") return "danger";
  return "warning";
}

export default function ReservationManagementPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);

  const [areaOptions, setAreaOptions] = useState<ParkingArea[]>([]);
  const [dayDate, setDayDate] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const [parkingStatusFilter, setParkingStatusFilter] = useState<"all" | ParkingStatus>("all");
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword, 320);


  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [items, setItems] = useState<Reservation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  useEffect(() => {
    let cancelled = false;
    parkingApi
      .getParkingAreas({ page: 1, limit: 500 })
      .then((res) => {
        if (!cancelled) setAreaOptions(res.data);
      })
      .catch(() => {
        if (!cancelled) setAreaOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [dayDate, areaFilter, statusFilter, parkingStatusFilter, debouncedKeyword]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  useEffect(() => {
    const socket = getAppSocket();
    const onNotification = (payload: {
      message: string;
      metadata?: { category?: string };
    }) => {
      if (
        payload.metadata?.category === "admin" ||
        payload.metadata?.category === "user"
      ) {
        refetch();
      }
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setItems([]);
        setMeta(null);
        const res = await reservationApi.getReservationsList({
          page,
          limit,
          date: dayDate || undefined,
          parking_area_id: areaFilter !== "all" ? areaFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          parking_status: parkingStatusFilter !== "all" ? parkingStatusFilter : undefined,
          keyword: debouncedKeyword.trim() || undefined,
        });
        if (cancelled) return;
        setItems(Array.isArray(res.data) ? res.data : []);
        setMeta(res.pagination ?? null);
      } catch (err) {
        if (!cancelled) {
          const apiError = err as ApiError;
          toast.error(apiError.message || "Failed to load reservations");
          setItems([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [page, limit, refreshNonce, dayDate, areaFilter, statusFilter, parkingStatusFilter, debouncedKeyword, toast]);

  const total = meta?.total ?? null;
  const totalPages = meta?.total_pages ?? null;

  const showingRange = useMemo(() => {
    if (total == null || items.length === 0) return null;
    const start = (page - 1) * limit + 1;
    const end = (page - 1) * limit + items.length;
    return { start, end };
  }, [page, limit, items.length, total]);

  const handleApprove = useCallback(
    async (r: Reservation) => {
      const id = r.id;
      setStatusBusyId(id);
      setItems((list) =>
        list.map((x) => (x.id === id ? { ...x, status: "Approved" } : x)),
      );
      try {
        const res = await reservationApi.updateStatus(id, "Approved");
        toast.success(res.message);
        refetch();
      } catch (err) {
        const apiError = err as ApiError;
        toast.error(apiError.message);
        refetch();
      } finally {
        setStatusBusyId(null);
      }
    },
    [toast, refetch],
  );

  const handleReject = useCallback(
    async (r: Reservation) => {
      const id = r.id;
      setStatusBusyId(id);
      setItems((list) =>
        list.map((x) => (x.id === id ? { ...x, status: "Rejected" } : x)),
      );
      try {
        const res = await reservationApi.updateStatus(id, "Rejected");
        toast.success(res.message);
        refetch();
      } catch (err) {
        const apiError = err as ApiError;
        toast.error(apiError.message);
        refetch();
      } finally {
        setStatusBusyId(null);
      }
    },
    [toast, refetch],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(true);
    try {
      const res = await reservationApi.deleteReservation(id);
      toast.success(res.message);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError.message);
    } finally {
      setDeleting(false);
    }
  };

  const isTodayReservation = useCallback((r: Reservation) => {
    const checkIn = new Date(r.check_in);
    if (Number.isNaN(checkIn.getTime())) return false;
    const today = new Date();
    return (
      checkIn.getFullYear() === today.getFullYear() &&
      checkIn.getMonth() === today.getMonth() &&
      checkIn.getDate() === today.getDate()
    );
  }, []);

  const columns: DataTableColumn<Reservation>[] = useMemo(
    () => [
      {
        key: "code",
        header: "Code",
        headerClassName: "!text-left",
        cellClassName: "!text-left",
        render: (r) => (
          <span className="font-mono text-sm text-white/90">
            {reservationDisplayCode(r)}
          </span>
        ),
      },
      {
        key: "vehicle",
        header: "Vehicle",
        headerClassName: "!text-left",
        cellClassName: "!text-left",
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{vehiclePlate(r)}</p>
            <div className="flex items-center gap-1.5 text-xs text-white/55">
              <ColorDot color={vehicleColor(r)} size={10} />
              <span className="truncate">{vehicleBrand(r)}</span>
            </div>
          </div>
        ),
      },
      {
        key: "area",
        header: "Area",
        render: (r) => (
          <span className="font-semibold text-neon-green">{areaLabel(r)}</span>
        ),
      },
      {
        key: "check_in",
        header: "Check-in",
        headerClassName: "!text-center",
        cellClassName: "!text-center",
        render: (r) => (
          <span className="tabular-nums text-xs text-white/60">
            {formatReservationDateTime(r.check_in)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (r) => {
          const st = normalizeStatus(r.status);
          return (
            <div className="flex justify-center">
              <Badge variant={statusBadgeVariant(st)}>{st}</Badge>
            </div>
          );
        },
      },
      {
        key: "parking_status",
        header: "Parking Status",
        render: (r) => {
          const ps = normalizeParkingStatus(r.parking_status);
          return (
            <div className="flex justify-center">
              <Badge variant={parkingStatusBadgeVariant(ps)}>{ps}</Badge>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (r) => {
          const st = normalizeStatus(r.status);
          const busy = statusBusyId === r.id;
          return (
            <div className="flex flex-wrap justify-center gap-2">
              {st === "Pending" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleApprove(r)}
                    className="rounded-xl bg-neon-green px-3 py-2 text-xs font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleReject(r)}
                    className="rounded-xl border border-red-500/35 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "…" : "Reject"}
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={busy || deleting}
                onClick={() => setDeleteTarget(r)}
                className="rounded-xl border border-red-500/35 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineTrash className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [statusBusyId, deleting, handleApprove, handleReject],
  );

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[25px] font-bold uppercase tracking-[0.2em] text-neon-green">
            Reservations
          </p>
        </div>
        <AdminRefreshButton onClick={refetch} loading={loading} />
      </div>

      <AdminFilterPills
        tabs={RESERVATION_STATUS_TABS}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <AdminFilterPills
        tabs={PARKING_STATUS_TABS}
        value={parkingStatusFilter}
        onChange={setParkingStatusFilter}
      />

      <AdminFilterToolbar
        search={{
          value: keyword,
          onChange: setKeyword,
          placeholder: "Search plate or reservation code…",
        }}
      >
        <AdminFilterField label="Date">
          <input
            type="date"
            value={dayDate}
            onChange={(e) => setDayDate(e.target.value)}
            className={adminFilterFieldCls}
          />
        </AdminFilterField>
        <AdminFilterField label="Parking area">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className={`min-w-[140px] ${adminFilterFieldCls}`}
          >
            <option value="all" className="bg-sidebar-bg">
              All areas
            </option>
            {areaOptions.map((a) => (
              <option key={a.id} value={a.id} className="bg-sidebar-bg">
                Area {a.name}
              </option>
            ))}
          </select>
        </AdminFilterField>
      </AdminFilterToolbar>

      <div className="flex flex-col gap-2 px-1 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {loading
            ? "Loading…"
            : total != null
              ? `${total} reservation${total === 1 ? "" : "s"}`
              : ""}
        </span>
        {total != null && total > 0 && (
          <span className="text-white/50">
            Page {page}
            {totalPages != null ? ` of ${totalPages}` : ""}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(r) => r.id}
        loading={loading}
        skeletonRows={8}
        emptyMessage="No reservations found. Try adjusting the filters or search."
        getRowClassName={(r) => {
          if (r.id === highlightId)
            return "bg-neon-green/[0.12] ring-2 ring-inset ring-neon-green/50";
          if (isTodayReservation(r))
            return "bg-neon-green/[0.06] ring-1 ring-inset ring-neon-green/25";
          return undefined;
        }}
        getRowRef={(key) =>
          key === highlightId
            ? (el) => {
                highlightRowRef.current = el;
              }
            : undefined
        }
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
            itemCount={items.length}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete reservation"
        message={
          deleteTarget
            ? `Delete reservation ${reservationDisplayCode(deleteTarget)}? This cannot be undone.`
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
