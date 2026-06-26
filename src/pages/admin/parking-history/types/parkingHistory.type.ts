export type ParkingHistoryPaymentMethod = string

export type ParkingHistorySessionStatus = string

export interface ParkingHistoryParkingArea {
  id: string
  name: string
  slots_quantity: number
  available_slots: number
  maintenance_slots: number
  is_active: boolean
  created_at: string
}

export interface ParkingHistoryUserLite {
  id?: string
  name: string | null
  phone: string | null
  email?: string | null
  age?: number | null
  address?: string | null
  role?: string | null
  balance?: number | null
  created_at?: string
  updated_at?: string
}

export interface ParkingHistoryVehicleLite {
  id?: string
  license_plate: string | null
  brand: string | null
  color: string | null
  created_at?: string
  updatedAt?: string
  user?: ParkingHistoryUserLite | null
}

/** Session nested on a parking_history row (admin list/detail API). */
export interface ParkingHistoryParkingSession {
  id: string
  check_in_time: string
  check_out_time: string | null
  check_in_image?: string | null
  check_out_image?: string | null
  amount: number
  status: ParkingHistorySessionStatus | null
  created_at: string
  updated_at?: string
  parking_area: ParkingHistoryParkingArea | null
  /** Present on detail responses; includes nested `user` for admin. */
  vehicle?: ParkingHistoryVehicleLite | null
}

export interface ParkingHistoryListItem {
  id: string
  parking_session: ParkingHistoryParkingSession | null
  vehicle: ParkingHistoryVehicleLite | null
  payment_method: ParkingHistoryPaymentMethod | null
  created_at: string
  updatedAt?: string
}

export type ParkingHistoryDetailItem = ParkingHistoryListItem

export interface ParkingHistoryListResponseMeta {
  page?: number
  limit?: number
  total?: number
  total_pages?: number
  totalPages?: number
}

export interface ParkingHistoryListResponse {
  data: ParkingHistoryListItem[]
  meta?: ParkingHistoryListResponseMeta
}
