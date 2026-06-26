export type PaymentType = 'Subscription' | 'Parking Fee' | 'Deposit' | 'Refund'
export type PaymentStatus = 'Pending' | 'Success' | 'Failed'

export interface PaymentRecord {
  id: string
  amount: number
  description: string
  payment_type: PaymentType
  status: PaymentStatus
  created_at: string
}

export interface AdminPaymentUser {
  id: string
  name: string
  email: string
}

export interface AdminPaymentRecord extends PaymentRecord {
  user: AdminPaymentUser
}

export interface PaymentListParams {
  payment_type?: PaymentType
  status?: PaymentStatus
}

export interface AdminPaymentListParams {
  page?: number
  limit?: number
  payment_type?: PaymentType
  status?: PaymentStatus
  keyword?: string
}
