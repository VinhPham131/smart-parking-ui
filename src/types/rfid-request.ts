export type RfidRequestStatus = 'Pending' | 'Approved' | 'Rejected'

export interface RfidRequestVehicle {
  id: string
  license_plate: string
  brand?: string
  color?: string
  user?: {
    id: string
    name?: string
    email?: string
  }
}

export interface RfidRequestRecord {
  id: string
  status: RfidRequestStatus
  created_at: string
  updated_at: string
  vehicle?: RfidRequestVehicle
  rfid?: { id: string; rfid_code: string; is_active?: boolean } | null
}

export interface AdminRfidRequestListParams {
  page: number
  limit: number
  status?: RfidRequestStatus
  keyword?: string
}
