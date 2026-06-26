import type { UserProfileResponse } from '../types/vehicle'
import type {
  AdminUser,
  CreateUserRequest,
  SuccessResponse,
  UpdateUserRequest,
} from '../types/admin'
import type { PaginatedResponse } from '../types/pagination'
import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'

export interface UserListParams {
  page: number
  limit: number
  role?: string
  is_has_vehicle?: boolean
  keyword?: string
}

export interface UpdateMyProfileRequest {
  name?: string
  age?: number
  phone?: string
  address?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const userApi = {
  async getUserProfile(): Promise<UserProfileResponse> {
    return httpClient.get<UserProfileResponse>(`${API_BASE_URL}/users/my-profile`)
  },

  async updateMyProfile(data: UpdateMyProfileRequest): Promise<UserProfileResponse> {
    return httpClient.patch<UserProfileResponse>(`${API_BASE_URL}/users/my-profile`, data)
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>(`${API_BASE_URL}/users/my-profile/change-password`, data)
  },

  async getUsersList(params: UserListParams): Promise<PaginatedResponse<AdminUser>> {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('limit', String(params.limit))
    if (params.role) qs.set('role', params.role)
    if (params.is_has_vehicle !== undefined) qs.set('is_has_vehicle', String(params.is_has_vehicle))
    if (params.keyword) qs.set('keyword', params.keyword)
    return httpClient.get<PaginatedResponse<AdminUser>>(`${API_BASE_URL}/users?${qs.toString()}`)
  },

  async getAllUsers(): Promise<AdminUser[]> {
    return httpClient.get<AdminUser[]>(`${API_BASE_URL}/users`)
  },

  async createUser(data: CreateUserRequest): Promise<SuccessResponse> {
    return httpClient.post<SuccessResponse>(`${API_BASE_URL}/users`, data)
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<SuccessResponse> {
    return httpClient.patch<SuccessResponse>(`${API_BASE_URL}/users/${id}`, data)
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return httpClient.delete<{ message: string }>(`${API_BASE_URL}/users/${id}`)
  },
}
