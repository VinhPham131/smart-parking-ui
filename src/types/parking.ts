export interface ParkingArea {
  id: string
  name: string
  slots_quantity: number
  available_slots: number
  reserved_slots: number
  maintenance_slots: number
  is_active: boolean
  created_at: string
}

export interface CreateParkingAreaRequest {
  name: string
  slots_quantity: number
}

export interface ParkingAreaApiResponse {
  message: string
  parkingArea: ParkingArea
}

export interface UpdateSlotsQuantityResponse {
  message: string
  slotsQuantity: number
}

export interface UpdateMaintenanceSlotsResponse {
  message: string
  maintenanceSlots: number
}

/** Parking area nested under a parking session in history APIs */
export interface ParkingHistoryParkingArea {
  id: string
  name: string
  slots_quantity: number
  available_slots: number
  maintenance_slots: number
  is_active: boolean
  created_at: string
}

/** Parking session nested under a parking history record */
export interface ParkingHistorySessionNested {
  id: string
  check_in_time: string
  check_out_time: string | null
  amount: number
  status: string
  created_at: string
  updated_at: string
  parking_area: ParkingHistoryParkingArea | null
}

export interface MyParkingHistoryVehicle {
  id: string
  license_plate: string
  brand: string
  color: string
  created_at: string
  updatedAt?: string
}

/**
 * One row from GET /parking-history/my-histories (paginated `data[]`)
 * or GET /parking-history/:id for the signed-in user's history.
 */
export interface MyParkingHistoryRecord {
  id: string
  parking_session: ParkingHistorySessionNested
  vehicle: MyParkingHistoryVehicle
  payment_method: string
  created_at: string
  updatedAt?: string
}
