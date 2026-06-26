export interface LoginRequest {
  email: string
  password: string
  remember_me: boolean
}

export interface RegisterRequest {
  name: string
  age: number
  phone: string
  address: string
  email: string
  password: string
  confirmPassword?: string
}

export interface AuthResponse {
  access_token?: string
  user?: {
    id: string
    name: string
    email: string
  }
  message?: string
}
