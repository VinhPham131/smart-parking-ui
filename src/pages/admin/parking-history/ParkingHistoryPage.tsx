import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminRefreshButton } from "../../../components/admin/AdminRefreshButton";
import { useToast } from "../../../components/Toast/useToast";
import type { ApiError } from "../../../types/vehicle";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useSocketEvent } from "../../../hooks/useSocketEvent";
import { parkingHistoryApi } from "./services/parkingHistory.api";
import type {
  ParkingHistoryDetailItem,
  ParkingHistoryListItem,
} from "./types/parkingHistory.type";
import type { PaginationMeta } from "../../../types/pagination";
import {
  ParkingHistoryFilters,
  type PaymentMethodFilter,
} from "./components/ParkingHistoryFilters";
import { ParkingHistoryTable } from "./components/ParkingHistoryTable";
import { ParkingHistoryDetailModal } from "./components/ParkingHistoryDetailModal";
import { parkingApi } from "../../../services/api";
import type { ParkingArea } from "../../../types/parking";
import { DEFAULT_PAGE_SIZE } from "../../../constants/constants";
import { Pagination } from "../../../components/ui/Pagination";

const DEFAULT_LIMIT = DEFAULT_PAGE_SIZE;

export default function ParkingHistoryPage() {
  const toast = useToast();

  const [areaOptions, setAreaOptions] = useState<ParkingArea[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [parkingAreaId, setParkingAreaId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodFilter>("all");
  const [keyword, setKeyword] = useState("");

  const debouncedKeyword = useDebouncedValue(keyword, 320);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [items, setItems] = useState<ParkingHistoryListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ParkingHistoryDetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const keywordNormalized = useMemo(
    () => debouncedKeyword.trim(),
    [debouncedKeyword],
  );

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

  const refreshAreaOptions = useCallback(() => {
    void parkingApi
      .getParkingAreas({ page: 1, limit: 500 })
      .then((res) => setAreaOptions(res.data))
      .catch(() => setAreaOptions([]));
  }, []);

  useSocketEvent("parking-area-changed", refreshAreaOptions);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, parkingAreaId, paymentMethod]);

  useEffect(() => {
    setPage(1);
  }, [keywordNormalized]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setItems([]);
        setMeta(null);

        const res = await parkingHistoryApi.getParkingHistoryList({
          page,
          limit,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          parking_area_id: parkingAreaId || undefined,
          keyword: keywordNormalized || undefined,
          payment_method:
            paymentMethod !== "all" ? paymentMethod : undefined,
        });

        if (cancelled) return;
        setItems(Array.isArray(res.data) ? res.data : []);
        setMeta(res.pagination ?? null);
      } catch (err) {
        const apiError = err as ApiError;
        toast.error(apiError.message || "Failed to load parking history");
        if (cancelled) return;
        setItems([]);
        setMeta(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    limit,
    refreshNonce,
    fromDate,
    toDate,
    parkingAreaId,
    paymentMethod,
    keywordNormalized,
    toast,
  ]);

  const refetch = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  useSocketEvent("parking-history-changed", refetch);

  const total = meta?.total ?? null;
  const totalPages = meta?.total_pages ?? null;

  const showingRange = useMemo(() => {
    if (total == null || items.length === 0) return null;
    const start = (page - 1) * limit + 1;
    const end = (page - 1) * limit + items.length;
    return { start, end };
  }, [page, limit, items.length, total]);

  const handleViewDetail = useCallback(
    async (id: string) => {
      setDetailOpen(true);
      setDetailId(id);
      setDetailLoading(true);
      setDetail(null);

      try {
        const res = await parkingHistoryApi.getParkingHistoryDetail(id);
        setDetail(res);
      } catch (err) {
        const apiError = err as ApiError;
        toast.error(
          apiError.message || "Failed to load parking history detail",
        );
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [toast],
  );

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[25px] font-bold uppercase tracking-[0.2em] text-neon-green">
            Parking History
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminRefreshButton onClick={refetch} loading={loading} />
        </div>
      </div>

      <ParkingHistoryFilters
        values={{
          fromDate,
          toDate,
          parkingAreaId,
          paymentMethod,
          keyword,
        }}
        onChange={(next) => {
          setFromDate(next.fromDate);
          setToDate(next.toDate);
          setParkingAreaId(next.parkingAreaId);
          setPaymentMethod(next.paymentMethod);
          setKeyword(next.keyword);
        }}
        areaOptions={areaOptions}
      />

      <div className="flex flex-col gap-2 px-1 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {loading
            ? "Loading…"
            : total != null
              ? `${total} record${total === 1 ? "" : "s"}`
              : ""}
        </span>
        {total != null && total > 0 && (
          <span className="text-white/50">
            Page {page}
            {totalPages != null ? ` of ${totalPages}` : ""}
          </span>
        )}
      </div>

      <ParkingHistoryTable
        items={items}
        loading={loading}
        emptyMessage="No parking history records found. Try adjusting the filters or search."
        viewBusyId={detailId && detailOpen ? detailId : null}
        onViewDetail={(id) => void handleViewDetail(id)}
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

      <ParkingHistoryDetailModal
        open={detailOpen}
        loading={detailLoading}
        detail={detail}
        onClose={() => {
          setDetailOpen(false);
          setDetailId(null);
          setDetail(null);
          setDetailLoading(false);
        }}
      />
    </div>
  );
}
