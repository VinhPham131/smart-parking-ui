import { ParkingSessionStatus } from '../../constants/constants'

export type ParkingSessionStatusType =
  (typeof ParkingSessionStatus)[keyof typeof ParkingSessionStatus]

export type DateQuickFilter = 'all' | 'today' | 'week' | 'month'

export interface ParkingSession {
  id: string
  sessionId: string
  licensePlate: string
  brand: string
  vehicleColor: string | null
  parkingDate: string
  checkInTime: string | null
  checkOutTime: string | null
  duration: string
  amount: number
  areaName: string
  areaAvailableSlots: number | null
  areaTotalSlots: number | null
  areaMaintenanceSlots: number | null
  status: ParkingSessionStatusType
  paymentMethod: string
  paymentStatus: string | null
  paidAt: string | null
  brandLogo?: string | null
  rawCheckIn?: string | null
  historyCreatedAt: string | null
  sessionCreatedAt: string | null
  sessionUpdatedAt: string | null
}
