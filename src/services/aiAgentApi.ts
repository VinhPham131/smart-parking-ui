import { API_BASE_URL } from '../constants/api'
import { httpClient } from '../utils/httpClient'

interface AiAgentChatRequest {
  prompt: string
}

type AiAgentListItem = {
  reservation_id?: string
  code?: string
  slot_code?: string | null
  plate?: string
  checkin?: string | null
  checkout?: string | null
  status?: string
  amount?: number | string | null
  payment_method?: string | null
  id?: string
  license_plate?: string
  brand?: string
  color?: string
  user?: string
  rfid?: string | null
  rfid_code?: string
  is_active?: boolean
  vehicle?: unknown
  type?: string
  issued_date?: string | null
  expired_date?: string | null
  description?: string | null
  payment_type?: string
  parking_area?: string
  check_in?: string | null
  user_id?: string
  user_name?: string
  user_email?: string
  user_phone?: string
  count?: number
}

type AiAgentParkingAreaStatusItem = {
  name?: string
  available_slots?: number
  maintenance_slots?: number
  total_slots?: number
  reserved_slots?: number
}

type AiAgentStructuredResponse =
  | { type: 'text'; content?: string }
  | { type: 'action_result'; status?: 'success' | 'error' | 'no_change'; message?: string; meta?: Record<string, unknown> }
  | {
      type: 'list'
      list_type?:
        | 'reservation'
        | 'parking_history'
        | 'parking_area'
        | 'vehicle'
        | 'rfid'
        | 'rfid_request'
        | 'payment'
        | 'parking_session'
        | 'user_has_several_cancel_reservation'
      meta?: Record<string, unknown>
      items?:
        | AiAgentListItem[]
        | AiAgentParkingAreaStatusItem
        | AiAgentParkingAreaStatusItem[]
    }

type AiAgentChatResponse = string | { message?: string; response?: string; content?: string } | AiAgentStructuredResponse
type WrappedAiAgentResponse = {
  success?: boolean
  data?: AiAgentChatResponse
  message?: string
}

const unwrapContent = (payload: unknown): string | null => {
  if (typeof payload === 'string') {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  if ('response' in payload && typeof payload.response === 'string') {
    return payload.response
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if ('content' in payload && typeof payload.content === 'string') {
    return payload.content
  }

  return null
}

const isStructuredResponse = (payload: unknown): payload is AiAgentStructuredResponse => {
  if (!payload || typeof payload !== 'object' || !('type' in payload)) {
    return false
  }

  const responseType = (payload as { type?: unknown }).type
  return responseType === 'text' || responseType === 'list' || responseType === 'action_result'
}

export type AiAgentResponse = string | AiAgentStructuredResponse

export const aiAgentApi = {
  async chat(prompt: string): Promise<AiAgentResponse> {
    const data = await httpClient.post<AiAgentChatResponse | WrappedAiAgentResponse>(
      `${API_BASE_URL}/ai-agent/chat`,
      { prompt } satisfies AiAgentChatRequest,
    )

    if (isStructuredResponse(data)) {
      return data
    }

    const directContent = unwrapContent(data)
    if (directContent) {
      return directContent
    }

    if (data && typeof data === 'object' && 'data' in data) {
      if (isStructuredResponse(data.data)) {
        return data.data
      }

      const nestedContent = unwrapContent(data.data)
      if (nestedContent) {
        return nestedContent
      }
    }

    return 'No response from AI agent.'
  },
}
