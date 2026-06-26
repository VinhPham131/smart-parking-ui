import type { RfidType } from '../types/rfid'

export const ParkingSessionStatus = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

export const RfidTypeLabel: Record<RfidType, string> = {
  member: 'Member',
  regular: 'Regular',
}

export const PaymentMethodLabel: Record<string, string> = {
  Card: 'Card',
  Banking: 'Banking',
  '': 'All',
}
