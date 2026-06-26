export interface AdminUserVehicleRfid {
  id?: string
  rfid_code?: string | null
}

export interface AdminUserVehicle {
  id?: string
  brand: string
  color: string
  license_plate: string
  rfid?: AdminUserVehicleRfid | null
  /** @deprecated use rfid.rfid_code */
  rfid_code?: string | null
}

export interface AdminUser {
  id: string
  name: string
  age: number
  phone: string
  address: string
  email: string
  role: string
  balance?: number
  vehicles: AdminUserVehicle[]
}

export interface CreateUserRequest {
  name: string
  age: number
  phone: string
  address: string
  email: string
  role: string
  password?: string
}

export interface UpdateUserRequest {
  name?: string
  age?: number
  phone?: string
  address?: string
  email?: string
  role?: string
}

export interface AdminVehicleUser {
  id?: string
  name: string
  email: string
  phone: string
  role: string
}

export interface AdminVehicleRfid {
  id?: string
  rfid_code?: string
  type?: string
}

export interface AdminVehicle {
  id: string
  brand: string
  color: string
  license_plate: string
  user: AdminVehicleUser | null
  rfid: AdminVehicleRfid | null
}

export interface CreateVehicleRequest {
  brand: string
  color: string
  license_plate: string
}

export interface UpdateVehicleRequest {
  brand?: string
  color?: string
  license_plate?: string
}

export interface SuccessResponse {
  message: string
}

