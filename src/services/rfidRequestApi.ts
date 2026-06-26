import type { PaginatedResponse } from '../types/pagination'
import type {
  AdminRfidRequestListParams,
  RfidRequestRecord,
  RfidRequestStatus,
} from '../types/rfid-request'
import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'

export const rfidRequestApi = {
  async getAll(
    params: AdminRfidRequestListParams,
  ): Promise<PaginatedResponse<RfidRequestRecord>> {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('limit', String(params.limit))
    if (params.status) qs.set('status', params.status)
    if (params.keyword?.trim()) qs.set('keyword', params.keyword.trim())
    return httpClient.get<PaginatedResponse<RfidRequestRecord>>(
      `${API_BASE_URL}/rfid-requests?${qs.toString()}`,
    )
  },

  /** Omit status to load all (backend may return every status for the user). */
  async getMy(status?: RfidRequestStatus): Promise<RfidRequestRecord[]> {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    const q = qs.toString()
    return httpClient.get<RfidRequestRecord[]>(
      `${API_BASE_URL}/rfid-requests/my-rfid-requests${q ? `?${q}` : ''}`,
    )
  },

  async create(vehicleId: string): Promise<RfidRequestRecord> {
    return httpClient.post<RfidRequestRecord>(`${API_BASE_URL}/rfid-requests`, {
      vehicleId,
    })
  },

  async updateStatus(id: string, status: RfidRequestStatus): Promise<{ message: string }> {
    return httpClient.patch<{ message: string }>(`${API_BASE_URL}/rfid-requests/${id}`, {
      status,
    })
  },
}
