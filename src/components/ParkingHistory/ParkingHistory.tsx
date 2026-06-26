import { useEffect, useMemo, useState, useCallback } from 'react'
import { Badge } from 'flowbite-react'
import { useToast } from '../Toast/useToast'
import { parkingApi, vehicleApi } from '../../services/api'
import type { MyParkingHistoryRecord } from '../../types/parking'
import type { Vehicle } from '../../types/vehicle'
import { ParkingSessionStatus } from '../../constants/constants'
import { getVehicleBrand } from '../../constants/vehicles'
import { formatReservationDateTime } from '../../utils/datetime'
import { formatAmountShort } from '../../utils/currency'
import { useSocketEvent } from '../../hooks/useSocketEvent'
import ColorDot from '../ColorDot'
import {
  PAGE_SIZE,
  RANGE_MAP,
  DATE_OPTIONS,
  mapItem,
  formatSessionAmountLabel,
} from './helpers'
import { ParkingPaginationBar } from './ParkingPaginationBar'
import type { DateQuickFilter, ParkingSessionStatusType } from './types'

export default function ParkingHistory() {
  const toast = useToast()
  const [historyRows, setHistoryRows] = useState<MyParkingHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [activePlate, setActivePlate] = useState<string | 'all'>('all')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [detailRecord, setDetailRecord] = useState<MyParkingHistoryRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ParkingSessionStatusType>('all')
  const [dateFilter, setDateFilter] = useState<DateQuickFilter>('all')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    vehicleApi.getVehicles().then(setVehicles).catch(() => {})
  }, [])

  const effectiveKeyword =
    activePlate !== 'all' ? activePlate : debouncedSearch || undefined

  const fetchHistory = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        const result = await parkingApi.getParkingHistoryPaginated({
          page: targetPage,
          limit: PAGE_SIZE,
          range: RANGE_MAP[dateFilter],
          status: statusFilter !== 'all' ? statusFilter : undefined,
          keyword: effectiveKeyword,
        })
        const rows = Array.isArray(result.data) ? result.data : []
        setHistoryRows(rows)
        setTotalPages(result.pagination.total_pages)
        setTotal(result.pagination.total)
        setSelectedSessionId((prev) => {
          if (prev && rows.some((r) => r.id === prev)) return prev
          return rows[0]?.id ?? null
        })
      } catch {
        toast.error('Failed to load parking history')
      } finally {
        setLoading(false)
      }
    },
    [dateFilter, statusFilter, effectiveKeyword, toast],
  )

  const handleParkingHistoryChanged = useCallback(() => {
    void fetchHistory(page)
  }, [fetchHistory, page])

  useSocketEvent('parking-history-changed', handleParkingHistoryChanged)

  useEffect(() => {
    if (!selectedSessionId) {
      setDetailRecord(null)
      setDetailLoading(false)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    void parkingApi
      .getMyParkingHistoryById(selectedSessionId)
      .then((record) => {
        if (!cancelled) setDetailRecord(record)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load session details')
          setDetailRecord(null)
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedSessionId, toast])

  useEffect(() => {
    void fetchHistory(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    setSelectedSessionId(null)
    if (page === 1) {
      void fetchHistory(1)
    } else {
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, dateFilter, activePlate])

  function handleVehicleTab(plate: string | 'all') {
    setActivePlate(plate)
    setSearchQuery('')
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    if (value) setActivePlate('all')
  }

  const selectedSourceRecord = useMemo(() => {
    if (!selectedSessionId) return null
    if (detailRecord?.id === selectedSessionId) return detailRecord
    return historyRows.find((r) => r.id === selectedSessionId) ?? null
  }, [selectedSessionId, detailRecord, historyRows])

  const selectedSession = useMemo(
    () => (selectedSourceRecord ? mapItem(selectedSourceRecord) : null),
    [selectedSourceRecord],
  )

  const paymentBadge = useMemo(() => {
    if (!selectedSession) return null
    const wallet = selectedSession.paymentMethod === 'Wallet'
    const membership = selectedSession.paymentMethod === 'Membership'
    if (wallet) return <Badge color="primary">Wallet</Badge>
    if (membership) return <Badge color="blue">Membership</Badge>
  }, [selectedSession])

  const formatIso = (iso: string | null | undefined) => {
    if (!iso) return '—'
    return formatReservationDateTime(iso)
  }

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    dateFilter !== 'all' ||
    activePlate !== 'all'

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFilter('all')
    setActivePlate('all')
  }

  function handlePage(p: number) {
    setPage(p)
    setSelectedSessionId(null)
  }

  return (
    <div className="container mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-8 pt-1">
      <header className="mb-5 flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium uppercase tracking-[0.2em] text-neon-green">
            Parking history
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
          {/* Vehicle + search filter */}
          <div className="shrink-0 space-y-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
            {vehicles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleVehicleTab('all')}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    activePlate === 'all'
                      ? 'bg-neon-green text-black shadow-md shadow-neon-green/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  All vehicles
                </button>
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVehicleTab(v.license_plate)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition ${
                      activePlate === v.license_plate
                        ? 'bg-neon-green text-black shadow-md shadow-neon-green/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-semibold tracking-widest uppercase">
                      {v.license_plate}
                    </span>
                  </button>
                ))}
              </div>
            )}

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
                placeholder="Search by plate, area, slot…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/25 outline-none transition focus:border-neon-green focus:ring-1 focus:ring-neon-green/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
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

          {/* Status + date filter */}
          <div className="shrink-0 space-y-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {[
                { value: 'all', label: 'All' },
                { value: ParkingSessionStatus.COMPLETED, label: 'Completed' },
                { value: ParkingSessionStatus.IN_PROGRESS, label: 'In Progress' },
              ].map((opt) => {
                const active = statusFilter === opt.value
                const colorActive =
                  opt.value === ParkingSessionStatus.COMPLETED
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : opt.value === ParkingSessionStatus.IN_PROGRESS
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-neon-green text-black border-neon-green'
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(opt.value as 'all' | ParkingSessionStatusType)
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? colorActive
                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
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
                        ? 'bg-white/15 text-white'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

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
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Session list */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-sidebar-bg/90 p-4 shadow-xl backdrop-blur-md">
            {!loading && (
              <p className="mb-2 shrink-0 text-[11px] text-white/30">
                {total} session{total !== 1 ? 's' : ''}
                {hasActiveFilters ? ' matching filters' : ''}
              </p>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
                </div>
              ) : historyRows.length === 0 ? (
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
                      <p className="text-sm text-white/50">No sessions match your filters.</p>
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
                      <p className="text-sm text-white/60">No parking sessions found.</p>
                      <p className="mt-1 text-xs text-white/40">
                        Your history will appear here after a completed parking session.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                historyRows.map((row) => {
                  const session = mapItem(row)
                  const isSelected = session.id === selectedSessionId
                  const brandInfo = getVehicleBrand(session.brand)

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() =>
                        setSelectedSessionId(isSelected ? null : session.id)
                      }
                      className={`group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                        selectedSession && session.id === selectedSession.id
                          ? 'border-neon-green bg-neon-green/8'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-black/40">
                          {brandInfo?.logo ? (
                            <img
                              src={brandInfo.logo}
                              alt={`${session.brand} logo`}
                              className="h-10 w-10 object-contain"
                            />
                          ) : (
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                              {session.licensePlate}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {session.parkingDate}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
                              <p className="text-[10px] font-medium text-white/60">
                                {session.duration}
                              </p>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                              <p className="text-[10px] font-medium text-white/60">
                                Area {session.areaName}
                              </p>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-semibold text-neon-green">
                          {formatSessionAmountLabel(session)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            session.status === ParkingSessionStatus.COMPLETED
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-sky-500/15 text-sky-300'
                          }`}
                        >
                          {session.status === ParkingSessionStatus.COMPLETED
                            ? 'Completed'
                            : 'In Progress'}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <ParkingPaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onPage={handlePage}
            />
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-sidebar-bg/90 p-5 shadow-xl backdrop-blur-md">
            {selectedSession ? (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex items-start justify-between gap-3 shrink-0">
                  <div>
                    <p className="text-[20px] font-medium uppercase tracking-[0.3em] text-neon-green">
                      Session details
                      {detailLoading && (
                        <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-neon-green align-middle" />
                      )}
                    </p>
                    <h3 className="mt-2 text-[22px] font-semibold text-white">
                      {selectedSession.licensePlate} · {selectedSession.brand}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {selectedSession.vehicleColor && (
                        <span className="flex items-center gap-2 text-sm text-white/70">
                          <ColorDot color={selectedSession.vehicleColor} size={12} />
                          <span className="uppercase tracking-wide">
                            {selectedSession.vehicleColor}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-white/50">
                      {selectedSession.parkingDate}
                    </p>
                  </div>
                  <span
                    className={`mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedSession.status === ParkingSessionStatus.COMPLETED
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-sky-500/15 text-sky-300'
                    }`}
                  >
                    {selectedSession.status === ParkingSessionStatus.COMPLETED
                      ? 'Completed'
                      : 'In Progress'}
                  </span>
                </div>

                <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[12px] text-white/50">Check-in</p>
                      <p className="mt-1 text-[14px] font-semibold leading-snug text-white">
                        {formatIso(selectedSession.checkInTime)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[12px] text-white/50">Check-out</p>
                      <p className="mt-1 text-[14px] font-semibold leading-snug text-white">
                        {formatIso(selectedSession.checkOutTime)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4 sm:col-span-2">
                      <p className="text-[12px] text-white/50">Parking area</p>
                      <p className="mt-1 text-[16px] font-semibold text-white">
                        {selectedSession.areaName}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[12px] text-white/50">Duration</p>
                      <p className="mt-1 text-[15px] font-semibold text-white">
                        {selectedSession.duration}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4">
                      <p className="text-[12px] text-white/50">Total amount</p>
                      <p className="mt-1 text-[16px] font-semibold text-neon-green">
                        {selectedSession.status === ParkingSessionStatus.COMPLETED
                          ? formatAmountShort(selectedSession.amount)
                          : selectedSession.amount > 0
                            ? formatAmountShort(selectedSession.amount)
                            : '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-4 sm:col-span-2">
                      <p className="text-[12px] text-white/50">Payment</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {paymentBadge}
                      </div>
                      {selectedSession.paidAt && (
                        <p className="mt-2 text-[11px] text-white/45">
                          Settled at {formatIso(selectedSession.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-sm">Select a session to see details.</p>
                <p className="mt-1 text-xs text-white/40">
                  Your history updates automatically after each parking session.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
