import type { PaymentRecord, PaymentListParams, AdminPaymentRecord, AdminPaymentListParams } from '../types/payment'
import type { PaginatedResponse } from '../types/pagination'
import type { RfidCard } from '../types/rfid'
import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'

export const paymentApi = {
  async getMyPayments(params: PaymentListParams = {}): Promise<PaymentRecord[]> {
    const qs = new URLSearchParams()
    if (params.payment_type) qs.set('payment_type', params.payment_type)
    if (params.status) qs.set('status', params.status)
    const query = qs.toString()
    return httpClient.get<PaymentRecord[]>(
      `${API_BASE_URL}/payments/my-payments${query ? `?${query}` : ''}`,
    )
  },

  async getAllPayments(params: AdminPaymentListParams = {}): Promise<PaginatedResponse<AdminPaymentRecord>> {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.payment_type) qs.set('payment_type', params.payment_type)
    if (params.status) qs.set('status', params.status)
    if (params.keyword) qs.set('keyword', params.keyword)
    const query = qs.toString()
    return httpClient.get<PaginatedResponse<AdminPaymentRecord>>(
      `${API_BASE_URL}/payments${query ? `?${query}` : ''}`,
    )
  },

  async deposit(amount: number): Promise<{ balance: number }> {
    return httpClient.post<{ balance: number }>(`${API_BASE_URL}/payments/deposit`, { amount })
  },

  async getMyRfid(): Promise<RfidCard | null> {
    return httpClient.get<RfidCard | null>(`${API_BASE_URL}/rfid/my-rfid`)
  },

  async subscribe(): Promise<{ message: string }> {
    return httpClient.patch<{ message: string }>(`${API_BASE_URL}/rfid/subscribe`, {})
  },
}
