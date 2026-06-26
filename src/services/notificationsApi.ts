import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'
import type { Notification } from '../types/notification'

type NotificationDto = {
  id: string
  message: string
  metadata?: any
  is_read: boolean
  created_at: string | Date
}

function toIsoString(value: string | Date): string {
  if (value instanceof Date) return value.toISOString()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export function mapNotificationDto(dto: NotificationDto): Notification {
  const title =
    (dto.metadata && typeof dto.metadata === 'object' && 'title' in dto.metadata
      ? String(dto.metadata.title)
      : null) || 'Notification'

  const category =
    dto.metadata && typeof dto.metadata === 'object' && 'category' in dto.metadata
      ? (dto.metadata.category as Notification['category'])
      : undefined

  const reservationId =
    dto.metadata && typeof dto.metadata === 'object' && 'reservationId' in dto.metadata
      ? String(dto.metadata.reservationId)
      : undefined

  return {
    id: dto.id,
    title,
    message: dto.message,
    createdAt: toIsoString(dto.created_at),
    read: !!dto.is_read,
    category,
    reservationId,
  }
}

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    const list = await httpClient.get<NotificationDto[]>(`${API_BASE_URL}/notifications`)
    return list.map(mapNotificationDto)
  },

  async markAsRead(id: string): Promise<void> {
    await httpClient.delete(`${API_BASE_URL}/notifications/${id}/read`)
  },

  async deleteNotification(id: string): Promise<void> {
    await httpClient.delete(`${API_BASE_URL}/notifications/${id}`)
  },
}

