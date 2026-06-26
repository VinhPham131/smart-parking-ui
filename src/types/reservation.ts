import type { ParkingArea } from './parking'
import type { Vehicle } from './vehicle'

export type ReservationStatus = 'Pending' | 'Approved' | 'Rejected'

export type ParkingStatus = 'Pending' | 'Checked In' | 'Cancelled'

export interface CreateReservationRequest {
  check_in: string
  vehicle_id: string
  parking_area_id: string
}

/** Nested vehicle payload from GET /reservations (admin) */
export interface ReservationVehicleInfo {
  id: string
  license_plate: string
  brand: string
  color: string
}

/** Nested area payload from GET /reservations */
export interface ReservationParkingAreaInfo {
  id: string
  available_slots: number
  slots_quantity: number
}

export interface Reservation {
  id: string
  check_in: string
  check_out_time: string
  vehicle_id?: string
  parking_area_id?: string
  status?: ReservationStatus | string
  parking_status?: ParkingStatus | string
  reservation_code?: string
  amount?: number | null
  rate?: number | null
  price_rule?: 'per_hour' | 'flat' | string | null
  created_at?: string
  updated_at?: string
  vehicle?: Vehicle | ReservationVehicleInfo
  parking_area?: ParkingArea | ReservationParkingAreaInfo
}

export interface UpdateReservationStatusBody {
  status: 'Approved' | 'Rejected'
}
