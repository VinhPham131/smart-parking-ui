import type { CreateReservationRequest, Reservation } from '../types/reservation'
import type { PaginatedResponse } from '../types/pagination'
import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'

export interface ReservationListParams {
  page: number
  limit: number
  date?: string
  parking_area_id?: string
  status?: string
  parking_status?: string
  keyword?: string
}

export interface MyReservationListParams {
  page: number
  limit: number
  range?: string
  status?: string
  parking_area_id?: string
  keyword?: string
}

export function normalizeReservationsPayload(
  payload: Reservation[] | { data: Reservation[] },
): Reservation[] {
  if (Array.isArray(payload)) return payload
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray(payload.data)
  ) {
    return payload.data
  }
  return []
}

export const reservationApi = {
  async getReservationsList(params: ReservationListParams): Promise<PaginatedResponse<Reservation>> {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('limit', String(params.limit))
    if (params.date) qs.set('date', params.date)
    if (params.parking_area_id) qs.set('parking_area_id', params.parking_area_id)
    if (params.status) qs.set('status', params.status)
    if (params.parking_status) qs.set('parking_status', params.parking_status)
    if (params.keyword) qs.set('keyword', params.keyword)
    return httpClient.get<PaginatedResponse<Reservation>>(`${API_BASE_URL}/reservations?${qs.toString()}`)
  },

  async getReservations(): Promise<Reservation[]> {
    const raw = await httpClient.get<Reservation[] | { data: Reservation[] }>(
      `${API_BASE_URL}/reservations`,
    )
    return normalizeReservationsPayload(raw)
  },

  async getMyReservations(): Promise<Reservation[]> {
    const raw = await httpClient.get<Reservation[] | { data: Reservation[] }>(
      `${API_BASE_URL}/reservations/my-reservations`,
    )
    return normalizeReservationsPayload(raw)
  },

  async getMyReservationsPaginated(params: MyReservationListParams): Promise<PaginatedResponse<Reservation>> {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('limit', String(params.limit))
    if (params.range) qs.set('range', params.range)
    if (params.status) qs.set('status', params.status)
    if (params.parking_area_id) qs.set('parking_area_id', params.parking_area_id)
    if (params.keyword) qs.set('keyword', params.keyword)
    return httpClient.get<PaginatedResponse<Reservation>>(`${API_BASE_URL}/reservations/my-reservations?${qs.toString()}`)
  },

  async createReservation(data: CreateReservationRequest): Promise<Reservation & { message?: string }> {
    return httpClient.post<Reservation & { message?: string }>(`${API_BASE_URL}/reservations`, data)
  },

  async updateStatus(
    id: string,
    status: 'Approved' | 'Rejected',
  ): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>(`${API_BASE_URL}/reservations/${id}/status`, {
      status,
    })
  },

  async deleteReservation(id: string): Promise<{ message: string }> {
    return httpClient.delete<{ message: string }>(`${API_BASE_URL}/reservations/${id}`)
  },
}
