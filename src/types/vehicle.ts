import type { RfidCard } from './rfid'
export type { ApiError } from './common'

export interface Vehicle {
  id: string
  license_plate: string
  user_id: string
  color: string
  brand: string
  created_at: string
  updatedAt: string
  rfid?: RfidCard | null
}

export interface RegisterVehicleRequest {
  license_plate: string
  color: string
  brand: string
}

export interface GenerateQrTokenRequest {
  vehicle_id: string
}

export interface GenerateQrTokenResponse {
  message: string
  qr_token: string
  payload: {
    vehicle_id: string
    user_id: number
    type: string
    timestamp: string
  }
}

export interface VerifyQrTokenRequest {
  qr_token: string
}

export interface VerifyQrTokenResponse {
  message: string
  payload: {
    vehicle_id?: string
    session_id?: number
    user_id: number
    type: string
    timestamp: string
  }
}

export interface UserProfileResponse {
  id: string
  name: string
  email: string
  address: string
  phone: string
  age: number
  balance: number
}

export interface ParkingSessionResponse {
  message: string
  payload: {
    vehicle_id?: string
    session_id?: number
    user_id: number
    type: string
    timestamp: string
  }
}