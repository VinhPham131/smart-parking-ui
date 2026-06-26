import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { parkingApi, reservationApi } from "../../services/api";
import { getAppSocket } from "../../services/socket";
import type { ParkingArea } from "../../types/parking";
import type {
  ParkingStatus,
  Reservation,
  ReservationStatus,
} from "../../types/reservation";
import { formatReservationDateTime } from "../../utils/datetime";

const PAGE_SIZE = 10;

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

function reservationDisplayCode(r: Reservation): string {
  return r.reservation_code?.trim() || r.id;
}

function vehiclePlate(r: Reservation): string {
  const v = r.vehicle;
  if (v && "license_plate" in v) return v.license_plate || "—";
  return "—";
}

function areaLabel(r: Reservation): string {
  const a = r.parking_area;
  if (a && "name" in a) return `Area ${a.name}`;
  return "—";
}

type TimelineStepDef = {
  key: string;
  label: string;
  altLabel?: string;
  terminal?: "reject" | "cancel";
};

function buildTimelineSteps(status: ReservationStatus): TimelineStepDef[] {
  const steps: TimelineStepDef[] = [
    { key: "review", label: "Pending" },
    {
      key: "approval",
      label: "Approved",
      altLabel: "Rejected",
      terminal: "reject",
    },
  ];
  if (status !== "Rejected") {
    steps.push(
      { key: "parking-wait", label: "Awaiting" },
      {
        key: "parking",
        label: "Checked In",
        altLabel: "Cancelled",
        terminal: "cancel",
      },
    );
  }
  return steps;
}

function getTimelineActiveIndex(
  status: ReservationStatus,
  parking: ParkingStatus,
): number {
  if (status === "Pending") return 0;
  if (status === "Rejected") return 1;
  if (parking === "Checked In" || parking === "Cancelled") return 3;
  return 2;
}

function ReservationProgressTimeline({
  reservation,
}: {
  reservation: Reservation;
}) {
  const status = normalizeStatus(reservation.status);
  const parking = normalizeParkingStatus(reservation.parking_status);
  const steps = buildTimelineSteps(status);
  const activeIndex = getTimelineActiveIndex(status, parking);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone = i < activeIndex;
        const isCurrent = i === activeIndex;
        const isRejected = isCurrent && status === "Rejected";
        const isCancelled = isCurrent && parking === "Cancelled";
        const showTerminal = isRejected || isCancelled;
        const label = isRejected
          ? step.altLabel!
          : isCancelled
            ? step.altLabel!
            : step.label;

        const terminalBorder = "border-rose-400 bg-rose-400/20";
        const terminalText = "text-rose-400";

        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                  showTerminal
                    ? terminalBorder
                    : isDone || isCurrent
                      ? "border-neon-green bg-neon-green/20"
                      : "border-white/15 bg-white/5"
                }`}
              >
                {showTerminal ? (
                  <svg
                    className={`h-3.5 w-3.5 ${terminalText}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : isDone || isCurrent ? (
                  <svg
                    className="h-3.5 w-3.5 text-neon-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                )}
              </div>
              <p
                className={`max-w-18 text-center text-[10px] font-medium leading-tight ${
                  showTerminal
                    ? terminalText
                    : isDone || isCurrent
                      ? "text-neon-green"
                      : "text-white/30"
                }`}
              >
                {label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 h-px flex-1 ${isDone ? "bg-neon-green/40" : "bg-white/10"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type DateQuickFilter = "all" | "today" | "week" | "month";

const RANGE_MAP: Record<DateQuickFilter, string | undefined> = {
  all: undefined,
  today: "today",
  week: "this week",
  month: "this month",
};

const STATUS_OPTIONS: Array<{
  value: "all" | ReservationStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "Approved", label: "Approved" },
  { value: "Pending", label: "Pending" },
  { value: "Rejected", label: "Rejected" },
];

const DATE_OPTIONS: Array<{ value: DateQuickFilter; label: string }> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-3 flex shrink-0 items-center justify-between gap-2 border-t border-white/8 pt-3">
      <span className="text-[11px] text-white/30">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-white/25">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p as number)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-medium transition ${
                p === page
                  ? "border-neon-green bg-neon-green/15 text-neon-green"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function MyReservationPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>(
    "all",
  );
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateQuickFilter>("all");

  const highlightRef = useRef<HTMLButtonElement | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch parking areas once (for filter dropdown)
  useEffect(() => {
    parkingApi
      .getParkingAreas({ page: 1, limit: 500 })
      .then((res) => setParkingAreas(res.data))
      .catch(() => {});
  }, []);

  const fetchReservations = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const result = await reservationApi.getMyReservationsPaginated({
          page: targetPage,
          limit: PAGE_SIZE,
          range: RANGE_MAP[dateFilter],
          status: statusFilter !== "all" ? statusFilter : undefined,
          parking_area_id: areaFilter !== "all" ? areaFilter : undefined,
          keyword: debouncedSearch || undefined,
        });
        setReservations(result.data);
        setTotalPages(result.pagination.total_pages);
        setTotal(result.pagination.total);
        if (highlightId) {
          setSelectedId(highlightId);
        } else if (result.data.length > 0 && !selectedId) {
          setSelectedId(result.data[0].id);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      dateFilter,
      statusFilter,
      areaFilter,
      debouncedSearch,
      highlightId,
      selectedId,
    ],
  );

  // Fetch when page changes
  useEffect(() => {
    void fetchReservations(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (page === 1) {
      void fetchReservations(1);
    } else {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, areaFilter, dateFilter]);

  useEffect(() => {
    if (highlightId) setSelectedId(highlightId);
  }, [highlightId]);

  useEffect(() => {
    const socket = getAppSocket();
    const onNotification = () => {
      void fetchReservations(page);
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [fetchReservations, page]);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [reservations, highlightId]);

  const selected = useMemo(
    () =>
      reservations.find((r) => r.id === selectedId) ?? reservations[0] ?? null,
    [reservations, selectedId],
  );

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    areaFilter !== "all" ||
    dateFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setAreaFilter("all");
    setDateFilter("all");
  }

  function handlePage(p: number) {
    setPage(p);
    setSelectedId(null);
  }

  return (
    <div className="container mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-8 pt-1">
      <header className="mb-5 flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium uppercase tracking-[0.2em] text-neon-green">
            My Reservations
          </h1>
        </div>
        {loading && (
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[13px] text-white/60">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-neon-green" />
            <span>Loading...</span>
          </div>
        )}
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:min-h-0">
        <div className="flex min-h-0 min-w-0 flex-col gap-5">
          <div className="shrink-0 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
            <div className="relative shrink-0">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by code or plate…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/25 outline-none transition focus:border-neon-green focus:ring-1 focus:ring-neon-green/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 space-y-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {STATUS_OPTIONS.map((opt) => {
                const active = statusFilter === opt.value;
                const colorMap: Record<string, string> = {
                  Approved:
                    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                  Pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  Rejected: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                };
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? opt.value === "all"
                          ? "border-neon-green bg-neon-green text-black"
                          : `${colorMap[opt.value as string]} font-semibold`
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDateFilter(opt.value)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                      dateFilter === opt.value
                        ? "bg-white/15 text-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {parkingAreas.length > 0 && (
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 outline-none transition focus:border-neon-green"
                >
                  <option value="all">All areas</option>
                  {parkingAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      Area {a.name}
                    </option>
                  ))}
                </select>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/40 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
            {!loading && (
              <p className="mb-2 shrink-0 text-[11px] text-white/30">
                {total} reservation{total !== 1 ? "s" : ""}
                {hasActiveFilters ? " matching filters" : ""}
              </p>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
                </div>
              ) : reservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                  {hasActiveFilters ? (
                    <>
                      <svg
                        className="mb-3 h-8 w-8 text-white/20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                        />
                      </svg>
                      <p className="text-sm text-white/50">
                        No results match your filters.
                      </p>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-2 text-xs text-neon-green/70 underline hover:text-neon-green"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white/60">
                        No reservations yet.
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        Your reservations will appear here after you book a
                        parking spot.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                reservations.map((r) => {
                  const st = normalizeStatus(r.status);
                  const isSelected = r.id === selected?.id;
                  const isHighlighted = r.id === highlightId;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      ref={isHighlighted ? highlightRef : null}
                      onClick={() => setSelectedId(r.id)}
                      className={`group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-neon-green bg-neon-green/10"
                          : isHighlighted
                            ? "border-neon-green/60 bg-neon-green/5 ring-1 ring-neon-green/40"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-1 flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-white truncate">
                            {reservationDisplayCode(r)}
                          </span>
                          {isHighlighted && !isSelected && (
                            <span className="shrink-0 rounded-full bg-neon-green/20 px-2 py-0.5 text-[10px] font-semibold text-neon-green">
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                          <span className="font-semibold text-white/80">
                            {vehiclePlate(r)}
                          </span>
                          <span>•</span>
                          <span className="text-neon-green/80">
                            {areaLabel(r)}
                          </span>
                          <span>•</span>
                          <span>{formatReservationDateTime(r.check_in)}</span>
                        </div>
                      </div>
                      <Badge variant={statusBadgeVariant(st)}>{st}</Badge>
                    </button>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onPage={handlePage}
            />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-sidebar-bg/90 p-5 shadow-xl backdrop-blur-md">
            {selected ? (
              <div className="flex h-full flex-col overflow-hidden">
                <div>
                  <p className="text-[20px] font-medium uppercase tracking-[0.3em] text-neon-green">
                    Reservation details
                  </p>
                  <h3 className="mt-2 text-[22px] font-semibold text-white">
                    {reservationDisplayCode(selected)}
                  </h3>
                  <p className="mt-1 text-[15px] text-white/60">
                    {vehiclePlate(selected)} · {areaLabel(selected)}
                  </p>
                </div>

                <div className="mt-4 shrink-0">
                  <ReservationProgressTimeline reservation={selected} />
                </div>

                <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[13px] text-white/50">Check-in</p>
                      <p className="mt-1 text-[15px] font-semibold text-white">
                        {formatReservationDateTime(selected.check_in)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[13px] text-white/50">Parking area</p>
                      <p className="mt-1 text-[15px] font-semibold text-neon-green">
                        {areaLabel(selected)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4 sm:col-span-2">
                      <p className="text-[13px] text-white/50">Vehicle</p>
                      <p className="mt-1 text-[15px] font-semibold text-white">
                        {vehiclePlate(selected)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[13px] text-white/50">Status</p>
                      <div className="mt-2">
                        <Badge
                          variant={statusBadgeVariant(
                            normalizeStatus(selected.status),
                          )}
                        >
                          {normalizeStatus(selected.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[13px] text-white/50">Parking status</p>
                      <div className="mt-2">
                        <Badge
                          variant={parkingStatusBadgeVariant(
                            normalizeParkingStatus(selected.parking_status),
                          )}
                        >
                          {normalizeParkingStatus(selected.parking_status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selected.amount != null && (
                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[13px] text-white/50">Amount</p>
                      <p className="mt-1 text-[17px] font-semibold text-neon-green">
                        {selected.amount > 0
                          ? selected.amount.toLocaleString("vi-VN") + "đ"
                          : "To be calculated"}
                      </p>
                    </div>
                  )}

                  {/* Reservation code with copy */}
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
                      Reservation code
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="font-mono text-[17px] font-semibold text-white">
                        {reservationDisplayCode(selected)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            reservationDisplayCode(selected),
                          )
                        }
                        className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-white/40 transition hover:border-neon-green/30 hover:bg-neon-green/10 hover:text-neon-green"
                        title="Copy code"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Tip / note */}
                  {normalizeStatus(selected.status) === "Approved" && (
                    <div className="rounded-xl border border-neon-green/15 bg-neon-green/5 p-3">
                      <div className="flex items-start gap-2.5">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-neon-green/70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs text-white/50">
                          Your reservation is approved. Please arrive on time
                          and present your reservation code at the parking gate.
                        </p>
                      </div>
                    </div>
                  )}

                  {normalizeStatus(selected.status) === "Pending" && (
                    <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
                      <div className="flex items-start gap-2.5">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs text-white/50">
                          Your reservation is being reviewed. You'll be notified
                          once it's approved or rejected.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-white/60">
                <svg
                  className="mb-3 h-10 w-10 text-white/10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-sm">Select a reservation to see details.</p>
                <p className="mt-1 text-xs text-white/40">
                  Your reservations will appear here after booking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
