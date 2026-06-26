import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'
import type { GenerateQrTokenRequest, GenerateQrTokenResponse, VerifyQrTokenRequest, VerifyQrTokenResponse, ParkingSessionResponse } from '../types/vehicle'
import type {
  CreateParkingAreaRequest,
  ParkingArea,
  ParkingAreaApiResponse,
  UpdateSlotsQuantityResponse,
  UpdateMaintenanceSlotsResponse,
  MyParkingHistoryRecord,
} from '../types/parking'
import type { CreateRfidRequest, RfidCard, UpdateRfidRequest } from '../types/rfid'
import type { PaginatedResponse } from '../types/pagination'
import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'
import { userApi } from './userApi'
import { vehicleApi } from './vehicleApi'
import { reservationApi } from './reservationApi'
import { notificationsApi } from './notificationsApi'

export interface RfidListParams {
  page: number
  limit: number
  type?: string
  is_active?: boolean
  is_assigned?: boolean
  keyword?: string
}

export interface ParkingAreasListParams {
  page?: number
  limit?: number
  is_active?: boolean
  name?: string
}

export { userApi, vehicleApi, reservationApi, notificationsApi }

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>(
      `${API_BASE_URL}/auth/login`,
      credentials,
      { 'Content-Type': 'application/json' },
    )
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>(
      `${API_BASE_URL}/auth/register`,
      userData,
      { 'Content-Type': 'application/json' },
    )
  },

  async forgotPassword(body: { email: string }): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>(
      `${API_BASE_URL}/auth/forgot-password`,
      body,
      { 'Content-Type': 'application/json' },
    )
  },

  async resetPassword(body: { token: string; password: string }): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>(
      `${API_BASE_URL}/auth/reset-password`,
      body,
      { 'Content-Type': 'application/json' },
    )
  },
}

export const qrCodeApi = {
  async generateQrToken(data: GenerateQrTokenRequest): Promise<GenerateQrTokenResponse> {
    return httpClient.post<GenerateQrTokenResponse>(
      `${API_BASE_URL}/qr-code/generate`,
      data,
    )
  },

  async verifyQrToken(data: VerifyQrTokenRequest): Promise<VerifyQrTokenResponse> {
    return httpClient.post<VerifyQrTokenResponse>(
      `${API_BASE_URL}/qr-code/verify`,
      data,
    )
  },
}

export const parkingApi = {
  async getParkingAreas(
    params: ParkingAreasListParams = {},
  ): Promise<PaginatedResponse<ParkingArea>> {
    const qs = new URLSearchParams()
    const page = params.page ?? 1
    const limit = params.limit ?? 100
    qs.set('page', String(page))
    qs.set('limit', String(limit))
    if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
    if (params.name?.trim()) qs.set('name', params.name.trim())
    return httpClient.get<PaginatedResponse<ParkingArea>>(
      `${API_BASE_URL}/parking-areas?${qs.toString()}`,
    )
  },

  async createParkingArea(data: CreateParkingAreaRequest): Promise<ParkingAreaApiResponse> {
    return httpClient.post<ParkingAreaApiResponse>(
      `${API_BASE_URL}/parking-areas`,
      data,
    )
  },

  async updateSlotsQuantity(id: string, quantity: number): Promise<UpdateSlotsQuantityResponse> {
    return httpClient.patch<UpdateSlotsQuantityResponse>(
      `${API_BASE_URL}/parking-areas/${id}/slots-quantity`,
      { slotsQuantity: quantity },
    )
  },

  async updateMaintenanceSlots(id: string, slots: number): Promise<UpdateMaintenanceSlotsResponse> {
    return httpClient.patch<UpdateMaintenanceSlotsResponse>(
      `${API_BASE_URL}/parking-areas/${id}/maintenance-slots`,
      { maintenanceSlots: slots },
    )
  },

  async deactivateParkingArea(id: string): Promise<ParkingAreaApiResponse> {
    return httpClient.patch<ParkingAreaApiResponse>(
      `${API_BASE_URL}/parking-areas/${id}/deactivate`,
    )
  },

  async activateParkingArea(id: string): Promise<ParkingAreaApiResponse> {
    return httpClient.patch<ParkingAreaApiResponse>(
      `${API_BASE_URL}/parking-areas/${id}/activate`,
    )
  },

  async getParkingHistory(): Promise<MyParkingHistoryRecord[]> {
    const raw = await httpClient.get<unknown>(`${API_BASE_URL}/parking-history/my-histories`)
    if (Array.isArray(raw)) return raw as MyParkingHistoryRecord[]
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: MyParkingHistoryRecord[] }).data
    }
    return []
  },

  async getParkingHistoryPaginated(params: {
    page: number
    limit: number
    range?: string
    status?: string
    keyword?: string
  }): Promise<PaginatedResponse<MyParkingHistoryRecord>> {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('limit', String(params.limit))
    if (params.range) qs.set('range', params.range)
    if (params.status) qs.set('status', params.status)
    if (params.keyword) qs.set('keyword', params.keyword)
    return httpClient.get<PaginatedResponse<MyParkingHistoryRecord>>(
      `${API_BASE_URL}/parking-history/my-histories?${qs.toString()}`,
    )
  },

  async getMyParkingHistoryById(id: string): Promise<MyParkingHistoryRecord> {
    const raw = await httpClient.get<unknown>(`${API_BASE_URL}/parking-history/${id}`)
    if (raw && typeof raw === 'object' && 'data' in raw && (raw as { data: unknown }).data != null) {
      return (raw as { data: MyParkingHistoryRecord }).data
    }
    return raw as MyParkingHistoryRecord
  },

  async processParking(qrToken: string): Promise<ParkingSessionResponse> {
    return httpClient.post<ParkingSessionResponse>(
      `${API_BASE_URL}/parking-sessions/process-parking`,
      { qr_token: qrToken },
    )
  },
}

export const rfidApi = {
  async getRfidList(params: RfidListParams): Promise<PaginatedResponse<RfidCard>> {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('limit', String(params.limit))
    if (params.type) qs.set('type', params.type)
    if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
    if (params.is_assigned !== undefined) qs.set('is_assigned', String(params.is_assigned))
    if (params.keyword) qs.set('keyword', params.keyword)
    return httpClient.get<PaginatedResponse<RfidCard>>(`${API_BASE_URL}/rfid?${qs.toString()}`)
  },

  async getAll(): Promise<RfidCard[]> {
    return httpClient.get<RfidCard[]>(`${API_BASE_URL}/rfid`)
  },

  async create(data: CreateRfidRequest): Promise<{ message: string } & RfidCard> {
    return httpClient.post<{ message: string } & RfidCard>(`${API_BASE_URL}/rfid`, data)
  },

  async update(data: UpdateRfidRequest): Promise<{ message: string } & RfidCard> {
    const { id, ...dto } = data
    return httpClient.patch<{ message: string } & RfidCard>(`${API_BASE_URL}/rfid/${id}`, dto)
  },

  async delete(id: string): Promise<{ message: string }> {
    return httpClient.delete<{ message: string }>(`${API_BASE_URL}/rfid/${id}`)
  },
}
