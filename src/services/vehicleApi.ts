import type {
  RegisterVehicleRequest,
  Vehicle,
} from '../types/vehicle'
import type {
  AdminVehicle,
  CreateVehicleRequest,
  SuccessResponse,
  UpdateVehicleRequest,
} from '../types/admin'
import type { PaginatedResponse } from '../types/pagination'
import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'

export interface VehicleListParams {
  page: number
  limit: number
  is_has_rfid?: boolean
  keyword?: string
}

export const vehicleApi = {
  async getVehicles(): Promise<Vehicle[]> {
    return httpClient.get<Vehicle[]>(`${API_BASE_URL}/vehicles/my-vehicles`)
  },

  async registerVehicle(vehicleData: RegisterVehicleRequest): Promise<Vehicle & { message?: string }> {
    return httpClient.post<Vehicle & { message?: string }>(
      `${API_BASE_URL}/vehicles`,
      vehicleData,
    )
  },

  async getVehiclesList(params: VehicleListParams): Promise<PaginatedResponse<AdminVehicle>> {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('limit', String(params.limit))
    if (params.is_has_rfid !== undefined) qs.set('is_has_rfid', String(params.is_has_rfid))
    if (params.keyword) qs.set('keyword', params.keyword)
    return httpClient.get<PaginatedResponse<AdminVehicle>>(`${API_BASE_URL}/vehicles?${qs.toString()}`)
  },

  async getAllVehicles(): Promise<AdminVehicle[]> {
    const res = await httpClient.get<PaginatedResponse<AdminVehicle>>(
      `${API_BASE_URL}/vehicles?page=1&limit=999`,
    )
    return Array.isArray(res.data) ? res.data : []
  },

  async createVehicle(data: CreateVehicleRequest): Promise<SuccessResponse> {
    return httpClient.post<SuccessResponse>(`${API_BASE_URL}/vehicles`, data)
  },

  async updateVehicle(
    id: string,
    data: UpdateVehicleRequest,
  ): Promise<SuccessResponse> {
    return httpClient.patch<SuccessResponse>(
      `${API_BASE_URL}/vehicles/${id}`,
      data,
    )
  },

  async deleteVehicle(id: string): Promise<{ message: string }> {
    return httpClient.delete<{ message: string }>(`${API_BASE_URL}/vehicles/${id}`)
  },
}
