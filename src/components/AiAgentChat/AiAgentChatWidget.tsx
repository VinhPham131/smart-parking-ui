import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { aiAgentApi, type AiAgentResponse } from '../../services/aiAgentApi'
import { reservationApi } from '../../services/api'
import AiParkingHistoryListTable from './AiParkingHistoryListTable'
import AiParkingAreaStatusTable from './AiParkingAreaStatusTable'
import AiReservationListTable from './AiReservationListTable'
import AiVehicleListTable from './AiVehicleListTable'
import AiRfidListTable from './AiRfidListTable'
import AiRfidRequestListTable from './AiRfidRequestListTable'
import AiPaymentListTable from './AiPaymentListTable'
import AiParkingSessionListTable from './AiParkingSessionListTable'
import AiUserCancelReservationListTable from './AiUserCancelReservationListTable'
import type {
  ParkingHistoryListPayload,
  ParkingAreaStatusPayload,
  ParkingSessionListPayload,
  PaymentListPayload,
  ReservationListItem,
  ReservationListPayload,
  RfidListPayload,
  RfidRequestListPayload,
  UserCancelReservationListPayload,
  VehicleListPayload,
} from './TableList.types'
import { HiOutlineTrash } from 'react-icons/hi'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  payload?: Exclude<AiAgentResponse, string>
  isTyping?: boolean
  isError?: boolean
}

const TYPING_MESSAGE_ID = 'typing-indicator'
const DEFAULT_GREETING = 'Hello! Ask me anything about the system.'

const createMessage = (role: ChatRole, content: string, extra?: Partial<ChatMessage>): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  ...extra,
})

export default function AiAgentChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', DEFAULT_GREETING),
  ])
  const [isSending, setIsSending] = useState(false)
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null)

  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 72,
    y: window.innerHeight - 72,
  }))

  const inFlightRef = useRef(false)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const dragStartRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  const canSend = useMemo(() => inputValue.trim().length > 0 && !isSending, [inputValue, isSending])

  const scrollToBottom = () => {
    if (!messagesContainerRef.current) {
      return
    }

    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    scrollToBottom()
  }, [messages, isOpen, isSending])

  useEffect(() => {
    const handleEscapeToClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscapeToClose)
    return () => window.removeEventListener('keydown', handleEscapeToClose)
  }, [isOpen])

  const upsertTypingIndicator = (show: boolean) => {
    setMessages((prev) => {
      const hasTyping = prev.some((message) => message.id === TYPING_MESSAGE_ID)
      if (show && !hasTyping) {
        return [
          ...prev,
          {
            id: TYPING_MESSAGE_ID,
            role: 'assistant',
            content: 'AI is typing...',
            isTyping: true,
          },
        ]
      }

      if (!show && hasTyping) {
        return prev.filter((message) => message.id !== TYPING_MESSAGE_ID)
      }

      return prev
    })
  }

  const replaceTypingWithMessage = (nextMessage: ChatMessage) => {
    setMessages((prev) => {
      const withoutTyping = prev.filter((message) => message.id !== TYPING_MESSAGE_ID)
      const lastMessage = withoutTyping[withoutTyping.length - 1]
      if (
        lastMessage &&
        lastMessage.role === nextMessage.role &&
        lastMessage.content === nextMessage.content &&
        lastMessage.isError === nextMessage.isError
      ) {
        return withoutTyping
      }

      const typingIndex = prev.findIndex((message) => message.id === TYPING_MESSAGE_ID)

      if (typingIndex === -1) {
        return [...withoutTyping, nextMessage]
      }

      const cloned = [...prev]
      cloned.splice(typingIndex, 1, nextMessage)
      return cloned
    })
  }

  const normalizeAssistantMessage = (response: AiAgentResponse): ChatMessage => {
    if (typeof response === 'string') {
      return createMessage('assistant', response)
    }

    if (response.type === 'text') {
      return createMessage('assistant', response.content ?? 'No response from AI agent.', {
        payload: response,
      })
    }

    if (response.type === 'action_result') {
      const isError = response.status === 'error'
      return createMessage(
        'assistant',
        response.message ?? (isError ? 'An error occurred.' : 'Done.'),
        { payload: response, isError },
      )
    }

    const listLabel =
      response.list_type === 'parking_area'
        ? 'Parking lot status'
        : response.list_type === 'parking_history'
          ? 'Parking history'
          : response.list_type === 'vehicle'
            ? 'Vehicle list'
            : response.list_type === 'rfid'
              ? 'RFID list'
              : response.list_type === 'rfid_request'
                ? 'RFID requests'
                : response.list_type === 'payment'
                  ? 'Payment list'
                  : response.list_type === 'parking_session'
                    ? 'Current parking sessions'
                    : response.list_type === 'user_has_several_cancel_reservation'
                      ? 'Users with multiple cancelled reservations'
                      : 'Reservation list'
    return createMessage('assistant', listLabel, { payload: response })
  }

  const sendPrompt = async (prompt: string) => {
    if (!prompt || inFlightRef.current) {
      return
    }

    setMessages((prev) => [...prev, createMessage('user', prompt)])
    upsertTypingIndicator(true)
    setIsSending(true)
    inFlightRef.current = true

    try {
      const response = await aiAgentApi.chat(prompt)
      replaceTypingWithMessage(normalizeAssistantMessage(response))
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Unable to reach AI service.'
      replaceTypingWithMessage(
        createMessage('assistant', fallbackMessage, { isError: true }),
      )
    } finally {
      setIsSending(false)
      inFlightRef.current = false
      upsertTypingIndicator(false)
    }
  }

  const handleSend = async () => {
    const prompt = inputValue.trim()
    if (!prompt) {
      return
    }

    setInputValue('')
    await sendPrompt(prompt)
  }

  const handleReservationAction = async (item: ReservationListItem, action: 'approve' | 'reject') => {
    const reservationId = item.reservation_id
    if (!reservationId || inFlightRef.current) {
      return
    }

    const key = `${reservationId}-${action}`
    setActionBusyKey(key)

    try {
      const nextStatus = action === 'approve' ? 'Approved' : 'Rejected'
      await reservationApi.updateStatus(reservationId, nextStatus)

      setMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.payload?.type !== 'list' ||
            msg.payload.list_type !== 'reservation' ||
            !Array.isArray(msg.payload.items)
          ) {
            return msg
          }

          const reservationItems = msg.payload.items as ReservationListItem[]
          const items: ReservationListItem[] = reservationItems.map((row) =>
            row.reservation_id === reservationId ? { ...row, status: nextStatus } : row,
          )

          const approved = items.filter((row) => (row.status ?? '').toLowerCase() === 'approved').length
          const rejected = items.filter((row) => (row.status ?? '').toLowerCase() === 'rejected').length
          const pending = items.filter((row) => (row.status ?? '').toLowerCase() === 'pending').length

          return {
            ...msg,
            payload: {
              ...msg.payload,
              meta: {
                ...(msg.payload.meta ?? {}),
                total: items.length,
                approved,
                rejected,
                pending,
              },
              items,
            },
          }
        }),
      )

      setMessages((prev) => [
        ...prev,
        createMessage(
          'assistant',
          `Reservation ${item.code ?? reservationId} updated to ${nextStatus}.`,
        ),
      ])
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Could not update reservation.'
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', fallbackMessage, { isError: true }),
      ])
    } finally {
      setActionBusyKey(null)
    }
  }

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSend) {
        void handleSend()
      }
    }
  }

  const handleButtonMouseDown = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    isDraggingRef.current = true
    hasDraggedRef.current = false
    dragStartRef.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return
      const dx = ev.clientX - dragStartRef.current.mx
      const dy = ev.clientY - dragStartRef.current.my
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDraggedRef.current = true
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 56, dragStartRef.current.px + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, dragStartRef.current.py + dy)),
      })
    }

    const onUp = () => {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!hasDraggedRef.current) {
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleClearHistory = () => {
    if (isSending || inFlightRef.current) {
      return
    }

    setMessages([createMessage('assistant', DEFAULT_GREETING)])
  }

  return (
    <div
      className="fixed z-50 select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className={`absolute bottom-full right-0 mb-2 w-[700px] transform overflow-hidden rounded-2xl border border-white/10 bg-sidebar-bg/95 shadow-2xl backdrop-blur transition-all duration-300 ${
          isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-white/10 bg-sidebar-hover px-4 py-3 text-white">
          <div>
            <h3 className="text-sm font-semibold sm:text-base">AI Assistant</h3>
            <p className="text-xs text-white/70">Ask anything, get instant help.</p>
          </div>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={isSending}
            className="rounded-lg border border-white/20 px-2.5 py-1 text-xs font-medium text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={messagesContainerRef}
          className="max-h-[55vh] min-h-64 space-y-3 overflow-y-auto bg-transparent px-3 py-3 sm:px-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_.2s_ease-out]`}
            >
              <div
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                  message.payload?.type === 'list' ? 'max-w-[95%]' : 'max-w-[85%]'
                } ${
                  message.role === 'user'
                    ? 'bg-neon-green text-black'
                    : message.isError
                      ? 'bg-rose-500/15 text-rose-200'
                      : 'bg-white/10 text-white'
                }`}
              >
                {message.isTyping ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon-green [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon-green [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon-green" />
                  </span>
                ) : (
                  <>
                    {message.payload?.type === 'list' ? (
                      <div className="space-y-2">
                        {message.content ? (
                          <p className="text-xs font-medium text-white/85">{message.content}</p>
                        ) : null}
                        {message.payload.list_type === 'parking_history' ? (
                        <AiParkingHistoryListTable
                          payload={message.payload as ParkingHistoryListPayload}
                        />
                      ) : message.payload.list_type === 'parking_area' ? (
                        <AiParkingAreaStatusTable
                          payload={message.payload as ParkingAreaStatusPayload}
                        />
                      ) : message.payload.list_type === 'vehicle' ? (
                        <AiVehicleListTable
                          payload={message.payload as VehicleListPayload}
                        />
                      ) : message.payload.list_type === 'rfid' ? (
                        <AiRfidListTable payload={message.payload as RfidListPayload} />
                      ) : message.payload.list_type === 'rfid_request' ? (
                        <AiRfidRequestListTable
                          payload={message.payload as RfidRequestListPayload}
                        />
                      ) : message.payload.list_type === 'payment' ? (
                        <AiPaymentListTable
                          payload={message.payload as PaymentListPayload}
                        />
                      ) : message.payload.list_type === 'parking_session' ? (
                        <AiParkingSessionListTable
                          payload={message.payload as ParkingSessionListPayload}
                        />
                      ) : message.payload.list_type === 'user_has_several_cancel_reservation' ? (
                        <AiUserCancelReservationListTable
                          payload={message.payload as UserCancelReservationListPayload}
                        />
                      ) : (
                        <AiReservationListTable
                          payload={message.payload as ReservationListPayload}
                          isSending={isSending}
                          actionBusyKey={actionBusyKey}
                          onAction={handleReservationAction}
                        />
                      )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 bg-sidebar-bg px-3 py-3 sm:px-4">
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type your message..."
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-neon-green/60 focus:ring-2 focus:ring-neon-green/20"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              className="rounded-xl bg-neon-green px-4 py-2 text-sm font-medium text-black shadow-md transition hover:brightness-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onMouseDown={handleButtonMouseDown}
        aria-label="Toggle AI chat"
        className="group flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-neon-green text-black shadow-xl transition duration-300 hover:scale-105 hover:shadow-2xl active:cursor-grabbing"
      >
        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
          {isOpen ? '✕' : '💬'}
        </span>
      </button>
    </div>
  )
}
