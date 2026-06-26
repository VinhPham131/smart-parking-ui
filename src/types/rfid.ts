export type RfidType = 'regular' | 'member'

export interface RfidVehicle {
  id: string
  license_plate: string
  brand: string
  color: string
  created_at: string
  updatedAt: string
}

export interface RfidCard {
  id: string
  rfid_code: string
  type: RfidType
  vehicle?: RfidVehicle | null
  is_active?: boolean
  expired_date?: string | null
  issued_date?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface CreateRfidRequest {
  rfid_code: string
  type: RfidType
}

export interface UpdateRfidRequest {
  id: string
  rfid_code?: string
  type?: RfidType
  vehicle_id?: string | null
  is_active?: boolean
  expired_date?: string | null
}

