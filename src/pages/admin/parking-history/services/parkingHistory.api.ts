import { API_BASE_URL } from '../../../../constants/api'
import { httpClient } from '../../../../utils/httpClient'
import { normalizePaginatedResponse } from '../../../../utils/normalizePaginatedResponse'
import type { PaginatedResponse } from '../../../../types/pagination'
import type {
  ParkingHistoryDetailItem,
  ParkingHistoryListItem,
} from '../types/parkingHistory.type'

export interface ParkingHistoryListQuery {
  page: number
  limit: number
  from_date?: string
  to_date?: string
  parking_area_id?: string
  keyword?: string
  payment_method?: string
}

function normalizeDetail(raw: unknown): ParkingHistoryDetailItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      payment_method: null,
      created_at: '',
      parking_session: null,
      vehicle: null,
    }
  }

  const obj = raw as Record<string, unknown>

  const candidate =
    (obj.data && typeof obj.data === 'object' ? obj.data : null) ??
    (obj.parking_history && typeof obj.parking_history === 'object'
      ? obj.parking_history
      : null) ??
    (obj.parkingHistory && typeof obj.parkingHistory === 'object'
      ? obj.parkingHistory
      : null) ??
    raw

  return candidate as ParkingHistoryDetailItem
}

export const parkingHistoryApi = {
  async getParkingHistoryList(
    query: ParkingHistoryListQuery,
  ): Promise<PaginatedResponse<ParkingHistoryListItem>> {
    const qs = new URLSearchParams()
    qs.set('page', String(query.page))
    qs.set('limit', String(query.limit))
    if (query.from_date) qs.set('from_date', query.from_date)
    if (query.to_date) qs.set('to_date', query.to_date)
    if (query.parking_area_id) qs.set('parking_area_id', query.parking_area_id)
    if (query.keyword) qs.set('keyword', query.keyword)
    if (query.payment_method) qs.set('payment_method', query.payment_method)

    const raw = await httpClient.get<unknown>(
      `${API_BASE_URL}/parking-history?${qs.toString()}`,
    )
    return normalizePaginatedResponse<ParkingHistoryListItem>(raw)
  },

  async getParkingHistoryDetail(id: string): Promise<ParkingHistoryDetailItem> {
    const raw = await httpClient.get<unknown>(`${API_BASE_URL}/parking-history/${id}`)
    return normalizeDetail(raw)
  },
}
