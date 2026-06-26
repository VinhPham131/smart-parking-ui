export type NotificationCategory =
  | 'booking'
  | 'payment'
  | 'system'
  | 'admin'
  | 'user'

export interface Notification {
  id: string
  title: string
  message: string
  /** ISO 8601 timestamp */
  createdAt: string
  read: boolean
  category?: NotificationCategory
  /** ID of the related reservation, if any */
  reservationId?: string
}
