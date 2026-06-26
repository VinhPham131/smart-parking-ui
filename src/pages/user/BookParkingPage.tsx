import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/Toast/useToast";
import { parkingApi, reservationApi, vehicleApi } from "../../services/api";
import type { ParkingArea } from "../../types/parking";
import type { Reservation } from "../../types/reservation";
import type { ApiError, Vehicle } from "../../types/vehicle";
import { useSocketEvent } from "../../hooks/useSocketEvent";

const DEFAULT_ADVANCE_MS = 30 * 60 * 1000;
const ARRIVAL_GRACE_MS = 15 * 60 * 1000;

function getDefaultCheckIn(from: Date): Date {
  return new Date(from.getTime() + DEFAULT_ADVANCE_MS);
}

function formatArrivalWindow(checkIn: Date): string {
  const early = new Date(checkIn.getTime() - ARRIVAL_GRACE_MS);
  const late = new Date(checkIn.getTime() + ARRIVAL_GRACE_MS);
  return `${formatDateTime(early)} – ${formatDateTime(late)}`;
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "--";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
function isAreaUnavailable(area: ParkingArea): boolean {
  return !area.is_active || area.available_slots <= 0;
}

export default function BookParkingPage() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const defaultCheckIn = useMemo(() => getDefaultCheckIn(now), [now]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  );
  const selectedArea = useMemo(
    () => areas.find((a) => a.id === selectedAreaId) ?? null,
    [selectedAreaId, areas],
  );

  const canSubmit = useMemo(() => {
    if (submitting || loading) return false;
    if (!selectedVehicleId || !selectedAreaId) return false;
    if (!selectedArea || isAreaUnavailable(selectedArea)) return false;
    return true;
  }, [
    loading,
    selectedAreaId,
    selectedVehicleId,
    selectedArea,
    submitting,
  ]);

  const fetchBookingData = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiclesData, areasRes, reservationsData] = await Promise.all([
        vehicleApi.getVehicles(),
        parkingApi.getParkingAreas({ page: 1, limit: 500, is_active: true }),
        reservationApi.getMyReservationsPaginated({ page: 1, limit: 10 }),
      ]);
      setVehicles(vehiclesData);
      setAreas(areasRes.data);
      setReservations(reservationsData.data);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || "Failed to load booking data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchBookingData();
  }, [fetchBookingData]);

  useSocketEvent("parking-area-changed", () => {
    void parkingApi
      .getParkingAreas({ page: 1, limit: 500, is_active: true })
      .then((res) => setAreas(res.data))
      .catch(() => {});
  });

  const handleCreateReservation = async () => {
    if (!selectedVehicleId || !selectedAreaId) {
      toast.error("Please select vehicle and parking area");
      return;
    }
    const start = getDefaultCheckIn(new Date());
    setSubmitting(true);
    try {
      const res = await reservationApi.createReservation({
        check_in: start.toISOString(),
        vehicle_id: selectedVehicleId,
        parking_area_id: selectedAreaId,
      });
      const updated = await reservationApi.getMyReservationsPaginated({
        page: 1,
        limit: 10,
      });
      setReservations(updated.data);
      setSelectedVehicleId("");
      setSelectedAreaId("");
      if (res.message) toast.success(res.message);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-8 pt-1">
      <header className="mb-5 shrink-0">
        <h1 className="text-[20px] font-medium uppercase tracking-[0.2em] text-neon-green">
          Book Parking
        </h1>
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1.65fr_1fr] lg:min-h-0">
        <div className="flex min-h-0 min-w-0 flex-col gap-5">
          {loading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 px-4 py-12 shadow-xl backdrop-blur-md">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
              <p className="text-sm text-white/45">Loading booking data…</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch">
                <div className="flex h-[150px] flex-col rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                    Vehicle
                  </p>
                  <div className="relative mt-[25px] w-full">
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/20 bg-[#12151c] px-3 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-neon-green focus:ring-2 focus:ring-neon-green/25"
                    >
                      <option value="" className="bg-sidebar-bg">
                        Select your vehicle
                      </option>
                      {vehicles.map((vehicle) => (
                        <option
                          key={vehicle.id}
                          value={vehicle.id}
                          className="bg-sidebar-bg"
                        >
                          {vehicle.license_plate} - {vehicle.brand}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex h-[150px] flex-col rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                    Parking area
                  </p>
                  <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1.5">
                    {areas.length === 0 ? (
                      <span className="text-sm text-white/45">
                        No areas available
                      </span>
                    ) : (
                      areas.map((area) => {
                        const areaDisabled = isAreaUnavailable(area);
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() =>
                              !areaDisabled && setSelectedAreaId(area.id)
                            }
                            disabled={areaDisabled}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                              selectedAreaId === area.id
                                ? "border-neon-green/50 bg-neon-green text-black shadow-md"
                                : areaDisabled
                                  ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                                  : "border-white/15 bg-white/10 text-white/70 hover:border-white/25 hover:bg-white/15 hover:text-white"
                            }`}
                          >
                            Area {area.name}
                            {area.available_slots <= 0 && (
                              <span className="ml-1 text-[11px] font-medium opacity-80">
                                (Full)
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                  Area capacity
                </p>
                {selectedArea ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                        Total
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">
                        {selectedArea.slots_quantity}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-300/75">
                        Available
                      </p>
                      <p className="mt-1 text-xl font-bold text-emerald-300">
                        {selectedArea.available_slots}
                      </p>
                    </div>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-red-300/75">
                        Reserved
                      </p>
                      <p className="mt-1 text-xl font-bold text-red-300">
                        {selectedArea.reserved_slots}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-amber-200/75">
                        Maintenance
                      </p>
                      <p className="mt-1 text-xl font-bold text-amber-200">
                        {selectedArea.maintenance_slots}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/35">
                    Select an area to see capacity
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                  Check-in time
                </p>
                <div className="rounded-xl border border-neon-green/20 bg-neon-green/6 px-4 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Scheduled check-in
                  </p>
                  <p className="mt-1 text-base font-bold text-neon-green">
                    {formatDateTime(defaultCheckIn)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Arrival window
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/75">
                    {formatArrivalWindow(defaultCheckIn)}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                    You may arrive up to 15 minutes early or 15 minutes late
                    compared to the scheduled time above.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-5">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                  Vehicle
                </span>
                <span className="max-w-[60%] text-right text-sm font-semibold text-white">
                  {selectedVehicle
                    ? `${selectedVehicle.license_plate} (${selectedVehicle.brand})`
                    : "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                  Parking area
                </span>
                <span className="text-right text-sm font-semibold text-white">
                  {selectedArea ? `Area ${selectedArea.name}` : "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-white/50">
                  Check-in
                </span>
                <span className="max-w-[60%] text-right text-sm font-semibold text-white">
                  {formatDateTime(defaultCheckIn)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateReservation}
              disabled={!canSubmit}
              className="w-full rounded-xl bg-neon-green px-5 py-3 text-sm font-bold text-black shadow-md transition hover:opacity-90 hover:shadow-neon-green/40 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? "Booking…" : "Book Place"}
            </button>

            <div className="rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                Recent reservations
              </p>
              <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto pr-1">
                {reservations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-sidebar-bg/80 px-4 py-10 text-center">
                    <p className="text-sm font-medium text-white/40">
                      No reservations yet
                    </p>
                    <p className="mt-1 text-xs text-white/25">
                      Completed bookings will show up here.
                    </p>
                  </div>
                ) : (
                  reservations.map((reservation) => (
                    <article
                      key={reservation.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-3.5 transition hover:border-white/15"
                    >
                      <p className="text-sm font-semibold text-white">
                        {reservation.reservation_code ?? reservation.id}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-white/50">
                        {formatDateTime(reservation.check_in)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
