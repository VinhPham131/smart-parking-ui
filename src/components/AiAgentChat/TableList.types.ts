export interface ReservationListItem {
  reservation_id?: string
  code?: string
  plate?: string
  checkin?: string
  status?: string
  parking_area?: string | null
}

export interface ReservationListPayload {
  type: 'list'
  list_type?: 'reservation'
  meta?: {
    total?: number
    approved?: number
    rejected?: number
    pending?: number
  }
  items?: ReservationListItem[]
}

export interface ParkingHistoryListItem {
  plate?: string
  slot_code?: string | null
  checkin?: string | null
  checkout?: string | null
  status?: string
  amount?: number | string | null
  payment_method?: string | null
}

export interface ParkingHistoryListPayload {
  type: 'list'
  list_type: 'parking_history'
  meta?: Record<string, unknown>
  items?: ParkingHistoryListItem[]
}

export interface ParkingAreaStatusItem {
  name?: string
  available_slots?: number
  maintenance_slots?: number
  total_slots?: number
  reserved_slots?: number
}

export interface ParkingAreaStatusPayload {
  type: 'list'
  list_type: 'parking_area'
  meta?: {
    total?: number
  }
  items?: ParkingAreaStatusItem | ParkingAreaStatusItem[]
}

export interface VehicleListItem {
  id?: string
  license_plate?: string
  brand?: string
  color?: string
  user?: string
  rfid?: string | null
}

export interface VehicleListPayload {
  type: 'list'
  list_type: 'vehicle'
  meta?: {
    total?: number
  }
  items?: VehicleListItem[]
}

export interface RfidListItem {
  id?: string
  rfid_code?: string
  is_active?: boolean
  vehicle?: string | null
  type?: string
  issued_date?: string | null
  expired_date?: string | null
}

export interface RfidListPayload {
  type: 'list'
  list_type: 'rfid'
  meta?: {
    total?: number
  }
  items?: RfidListItem[]
}

export interface RfidRequestListItem {
  id?: string
  status?: string
  user?: string
  vehicle?:
    | {
        id?: string
        license_plate?: string
        brand?: string
        color?: string
      }
    | string
    | null
}

export interface RfidRequestListPayload {
  type: 'list'
  list_type: 'rfid_request'
  meta?: {
    total?: number
  }
  items?: RfidRequestListItem[]
}

export interface PaymentListItem {
  id?: string
  user?: string
  amount?: number | string | null
  description?: string | null
  payment_type?: string
  status?: string
}

export interface PaymentListPayload {
  type: 'list'
  list_type: 'payment'
  meta?: {
    total?: number
  }
  items?: PaymentListItem[]
}

export interface ParkingSessionListItem {
  id?: string
  vehicle?: string
  type?: string
  parking_area?: string
  amount?: number | string | null
  status?: string
  check_in?: string | null
}

export interface ParkingSessionListPayload {
  type: 'list'
  list_type: 'parking_session'
  meta?: {
    total?: number
  }
  items?: ParkingSessionListItem[]
}

export interface UserCancelReservationListItem {
  user_id?: string
  user_name?: string
  user_email?: string
  user_phone?: string
  count?: number
}

export interface UserCancelReservationListPayload {
  type: 'list'
  list_type: 'user_has_several_cancel_reservation'
  meta?: {
    total?: number
  }
  items?: UserCancelReservationListItem[]
}
