import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiLink,
  HiOutlineRefresh,
  HiOutlineClipboardList,
} from "react-icons/hi";
import VehicleRegistrationForm from "../../components/VehicleRegistrationForm";
import VehicleCard from "../../components/VehicleCard";
import { useToast } from "../../components/Toast/useToast";
import { vehicleApi } from "../../services/api";
import { rfidRequestApi } from "../../services/rfidRequestApi";
import { getVehicleBrand } from "../../constants/vehicles";
import type { ApiError, Vehicle } from "../../types/vehicle";
import { formatDateTime } from "../../utils/datetime";
import type {
  RfidRequestRecord,
  RfidRequestStatus,
} from "../../types/rfid-request";

type MainTab = "vehicles" | "requests";

type StatusFilter = RfidRequestStatus | "all";

const REQUEST_STATUS_CONFIG: Record<
  RfidRequestStatus,
  { label: string; cls: string }
> = {
  Pending: {
    label: "Pending",
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  Approved: {
    label: "Approved",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  Rejected: {
    label: "Rejected",
    cls: "bg-red-500/15 text-red-400 border-red-500/20",
  },
};

const STATUS_FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Approved", label: "Approved" },
  { key: "Rejected", label: "Rejected" },
];


export default function VehicleRfidManagementPage() {
  const toast = useToast();

  const [mainTab, setMainTab] = useState<MainTab>("vehicles");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);

  const [myRequests, setMyRequests] = useState<RfidRequestRecord[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestingRfid, setRequestingRfid] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingVehicleIds, setPendingVehicleIds] = useState<Set<string>>(
    () => new Set(),
  );

  const fetchVehicles = useCallback(async () => {
    try {
      setLoadingVehicles(true);
      const vehiclesData = await vehicleApi.getVehicles();
      setVehicles(vehiclesData);
      setSelectedVehicle((prev) => {
        if (!prev) return vehiclesData[0] ?? null;
        return vehiclesData.find((v) => v.id === prev.id) ?? null;
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || "Failed to fetch vehicles");
    } finally {
      setLoadingVehicles(false);
    }
  }, [toast]);

  const fetchMyRequests = useCallback(
    async (filter: StatusFilter = statusFilter) => {
      try {
        setLoadingRequests(true);
        const status = filter === "all" ? undefined : filter;
        const list = await rfidRequestApi.getMy(status);
        setMyRequests(list);

        if (filter === "all" || filter === "Pending") {
          const ids = list
            .filter((r) => r.status === "Pending")
            .map((r) => r.vehicle?.id)
            .filter((id): id is string => Boolean(id));
          if (ids.length > 0) {
            setPendingVehicleIds((prev) => {
              const next = new Set(prev);
              ids.forEach((id) => next.add(id));
              return next;
            });
          }
        }
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(apiError.message || "Failed to load RFID requests");
        setMyRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    },
    [statusFilter, toast],
  );

  useEffect(() => {
    if (mainTab === "vehicles") {
      void fetchVehicles();
    }
  }, [mainTab, fetchVehicles]);

  useEffect(() => {
    if (mainTab === "requests") {
      void fetchMyRequests(statusFilter);
    }
  }, [mainTab, statusFilter, fetchMyRequests]);

  const selectedRfid = selectedVehicle?.rfid ?? null;
  const rfidStatus = selectedRfid ? "Linked" : "Unlinked";

  const pendingForSelected =
    selectedVehicle != null && pendingVehicleIds.has(selectedVehicle.id);

  const handleRequestRfid = async () => {
    if (!selectedVehicle) return;
    try {
      setRequestingRfid(true);
      await rfidRequestApi.create(selectedVehicle.id);
      setPendingVehicleIds((prev) => new Set(prev).add(selectedVehicle.id));
      toast.success(
        "RFID request submitted. We will notify you when it is processed.",
      );
      if (mainTab === "requests") {
        await fetchMyRequests(statusFilter);
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || "Could not submit RFID request");
    } finally {
      setRequestingRfid(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-0 min-w-0 flex-col px-4 pb-8 pt-1">
      <header className="mb-5 shrink-0 space-y-3">
        <div>
          <h1 className="text-[20px] font-medium uppercase tracking-[0.2em] text-neon-green">
            Vehicles & RFID
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-1 rounded-xl border border-white/15 bg-[#12151c] p-1 sm:w-auto sm:min-w-[320px]">
            <button
              type="button"
              onClick={() => setMainTab("vehicles")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:flex-initial sm:px-4 ${
                mainTab === "vehicles"
                  ? "bg-neon-green text-black shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <HiOutlineTruck className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Vehicles & RFID</span>
            </button>
            <button
              type="button"
              onClick={() => setMainTab("requests")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:flex-initial sm:px-4 ${
                mainTab === "requests"
                  ? "bg-neon-green text-black shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <HiOutlineClipboardList className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">My requests</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {mainTab === "vehicles" && (
              <button
                type="button"
                onClick={() => setIsVehicleFormOpen(true)}
                className="w-full rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black shadow-md transition hover:opacity-90 hover:shadow-neon-green/40 sm:w-auto"
              >
                + Add vehicle
              </button>
            )}
            {mainTab === "requests" && (
              <button
                type="button"
                onClick={() => void fetchMyRequests(statusFilter)}
                disabled={loadingRequests}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-[#1e222b] px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-[#262b36] disabled:opacity-50 sm:w-auto"
              >
                <HiOutlineRefresh
                  className={`h-4 w-4 ${loadingRequests ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            )}
          </div>
        </div>
      </header>

      {mainTab === "vehicles" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6">
          <section className="flex min-h-[280px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-sidebar-bg/90 shadow-xl backdrop-blur-md lg:max-w-md lg:shrink-0 lg:self-stretch">
            <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-green">
                Your vehicles
              </p>
            </div>

            {loadingVehicles ? (
              <div className="flex flex-1 justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
                <p className="mb-4 text-white/60">
                  You haven&apos;t registered any vehicles yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsVehicleFormOpen(true)}
                  className="rounded-xl bg-neon-green px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Register your first vehicle
                </button>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-gutter:stable] sm:px-4 sm:py-4">
                <div className="flex flex-col gap-2">
                  {vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      layout="row"
                      vehicle={vehicle}
                      selected={selectedVehicle?.id === vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-sidebar-bg/90 shadow-xl backdrop-blur-md">
            <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-green">
                RFID for selected vehicle
              </p>
              {selectedVehicle ? (
                <p className="mt-1 truncate text-sm font-medium text-white">
                  {selectedVehicle.license_plate}
                  <span className="font-normal text-white/40"> · </span>
                  <span className="text-white/55">
                    {getVehicleBrand(selectedVehicle.brand)?.label ??
                      selectedVehicle.brand}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-white/45">
                  Select a vehicle from the list.
                </p>
              )}
            </div>

            <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                Link overview
              </p>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-2">
                <div
                  className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border p-3 transition sm:flex-row sm:items-center sm:gap-3 sm:py-3 sm:pl-3 sm:pr-4 ${
                    selectedVehicle
                      ? "border-white/20 bg-white/5"
                      : "border-white/10 bg-white/2"
                  }`}
                >
                  <HiOutlineTruck
                    className={`h-6 w-6 shrink-0 sm:h-7 sm:w-7 ${
                      selectedVehicle ? "text-white/70" : "text-white/20"
                    }`}
                  />
                  <div className="w-full min-w-0 text-center sm:text-left">
                    <p className="truncate text-xs font-bold text-white sm:text-sm">
                      {selectedVehicle?.license_plate ?? "—"}
                    </p>
                    <p className="truncate text-[10px] text-white/45 sm:text-xs">
                      {selectedVehicle
                        ? (getVehicleBrand(selectedVehicle.brand)?.label ??
                          selectedVehicle.brand)
                        : "No vehicle selected"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-row items-center justify-center gap-2 sm:flex-col sm:gap-0.5 sm:px-1">
                  <div
                    className={`hidden h-px w-4 sm:block ${
                      selectedRfid ? "bg-neon-green/60" : "bg-white/15"
                    }`}
                  />
                  <HiLink
                    className={`h-4 w-4 shrink-0 rotate-90 sm:rotate-0 ${
                      selectedRfid ? "text-neon-green" : "text-white/20"
                    }`}
                  />
                  <div
                    className={`hidden h-px w-4 sm:block ${
                      selectedRfid ? "bg-neon-green/60" : "bg-white/15"
                    }`}
                  />
                  <p
                    className={`text-[9px] font-bold uppercase tracking-wider sm:mt-1 ${
                      selectedRfid ? "text-neon-green" : "text-amber-200/70"
                    }`}
                  >
                    {rfidStatus}
                  </p>
                </div>

                <div
                  className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border p-3 transition sm:flex-row sm:items-center sm:gap-3 sm:py-3 sm:pl-3 sm:pr-4 ${
                    selectedRfid
                      ? "border-neon-green/30 bg-neon-green/5"
                      : "border-white/10 bg-white/2"
                  }`}
                >
                  <HiOutlineCreditCard
                    className={`h-6 w-6 shrink-0 sm:h-7 sm:w-7 ${
                      selectedRfid ? "text-neon-green" : "text-white/20"
                    }`}
                  />
                  <div className="w-full min-w-0 text-center sm:text-left">
                    <p className="truncate font-mono text-xs font-bold text-white sm:text-sm">
                      {selectedRfid?.rfid_code ?? "—"}
                    </p>
                    <p
                      className={`text-[10px] font-semibold sm:text-xs ${
                        selectedRfid?.is_active === false
                          ? "text-red-300"
                          : selectedRfid
                            ? "text-neon-green"
                            : "text-white/25"
                      }`}
                    >
                      {selectedRfid
                        ? selectedRfid.is_active === false
                          ? "Inactive"
                          : "Active"
                        : "No RFID"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-gutter:stable] sm:px-6 sm:py-5">
              {selectedVehicle == null ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <HiOutlineTruck className="h-10 w-10 text-white/15" />
                  <p className="text-sm text-white/45">
                    Select a vehicle to view RFID details.
                  </p>
                </div>
              ) : selectedRfid == null ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-1">
                  <HiOutlineCreditCard className="h-10 w-10 text-white/15" />
                  <p className="text-sm text-white/60">
                    This vehicle doesn&apos;t have an RFID linked yet.
                  </p>
                  {pendingForSelected ? (
                    <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200/90">
                      A request is pending admin review.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRequestRfid()}
                      disabled={requestingRfid || pendingForSelected}
                      className="w-full max-w-xs rounded-xl bg-neon-green px-5 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {requestingRfid ? "Submitting…" : "Request RFID"}
                    </button>
                  )}
                  <p className="text-xs text-white/35">
                    Admin will assign an available RFID after approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                        RFID Code
                      </p>
                      <p className="mt-1 truncate text-[15px] font-semibold text-white">
                        {selectedRfid.rfid_code}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                        Status
                      </p>
                      <p
                        className={`mt-1 text-[15px] font-semibold ${
                          selectedRfid.is_active === false
                            ? "text-red-300"
                            : "text-neon-green"
                        }`}
                      >
                        {selectedRfid.is_active === false
                          ? "Inactive"
                          : "Active"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                      Type
                    </p>
                    <p className="mt-1 text-[15px] font-semibold capitalize text-white">
                      {selectedRfid.type}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                        Issued
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-white">
                        {selectedRfid.issued_date
                          ? new Date(
                              selectedRfid.issued_date,
                            ).toLocaleDateString()
                          : "--"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                        Expired
                      </p>
                      <p
                        className={`mt-1 text-[15px] font-semibold ${
                          selectedRfid.expired_date &&
                          new Date(selectedRfid.expired_date) < new Date()
                            ? "text-red-300"
                            : "text-white"
                        }`}
                      >
                        {selectedRfid.expired_date
                          ? new Date(
                              selectedRfid.expired_date,
                            ).toLocaleDateString()
                          : "--"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {STATUS_FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    statusFilter === key
                      ? key === "all"
                        ? "border-white/30 bg-white/15 text-white"
                        : `border ${REQUEST_STATUS_CONFIG[key as RfidRequestStatus].cls}`
                      : "border-white/15 text-white/50 hover:border-white/25 hover:text-white/80"
                  }`}
                >
                  {label}
                </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 md:hidden">
            {loadingRequests &&
              myRequests.length === 0 &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="h-4 max-w-[66%] rounded bg-white/10" />
                  <div className="mt-3 h-3 max-w-[33%] rounded bg-white/10" />
                </div>
              ))}

            {!loadingRequests && myRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-sidebar-bg/80 px-6 py-14 text-center">
                <HiOutlineClipboardList className="h-10 w-10 text-white/20" />
                <p className="mt-2 text-sm font-medium text-white/40">
                  No RFID requests yet
                </p>
                <p className="mt-1 text-xs text-white/25">
                  Submit a request from the Vehicles & RFID tab.
                </p>
              </div>
            )}

            {myRequests.map((r) => {
              const v = r.vehicle;
              const cfg = REQUEST_STATUS_CONFIG[r.status];
              return (
                <article
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <HiOutlineTruck className="h-5 w-5 shrink-0 text-white/35" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {v?.license_plate ?? "—"}
                        </p>
                        <p className="truncate text-xs text-white/40">
                          {v?.brand
                            ? (getVehicleBrand(v.brand)?.label ?? v.brand)
                            : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-white/10 pt-3 text-xs text-white/50">
                    <div className="flex justify-between gap-2">
                      <dt>Requested</dt>
                      <dd className="tabular-nums text-white/70">
                        {formatDateTime(r.created_at)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Updated</dt>
                      <dd className="tabular-nums text-white/70">
                        {formatDateTime(r.updated_at)}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>

          <div className="hidden min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/15 bg-sidebar-bg md:flex md:flex-col">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#1e222b]">
                  <tr className="border-b border-white/15">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
                      Vehicle
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-white/50">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-white/50">
                      Requested
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-white/50">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRequests &&
                    myRequests.length === 0 &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/10">
                        {Array.from({ length: 4 }).map((__, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 animate-pulse rounded-md bg-white/10" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!loadingRequests && myRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-20 text-center">
                        <HiOutlineClipboardList className="mx-auto h-10 w-10 text-white/20" />
                        <p className="mt-2 text-sm font-medium text-white/40">
                          No RFID requests yet
                        </p>
                        <p className="text-xs text-white/25">
                          Submit a request from the Vehicles & RFID tab.
                        </p>
                      </td>
                    </tr>
                  )}

                  {myRequests.map((r) => {
                    const v = r.vehicle;
                    const cfg = REQUEST_STATUS_CONFIG[r.status];
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-white/8 transition-colors hover:bg-white/4"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {v?.license_plate ?? "—"}
                              </p>
                              <p className="truncate text-xs text-white/35">
                                {v?.brand
                                  ? (getVehicleBrand(v.brand)?.label ?? v.brand)
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-white/45 tabular-nums">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-white/45 tabular-nums">
                          {formatDateTime(r.updated_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <VehicleRegistrationForm
        isOpen={isVehicleFormOpen}
        onClose={() => setIsVehicleFormOpen(false)}
        onSuccess={fetchVehicles}
      />
    </div>
  );
}
