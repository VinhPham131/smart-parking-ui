import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineBell } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import type { Notification } from '../../types/notification'
import NotificationDropdown from './NotificationDropdown'
import { notificationsApi } from '../../services/api'
import { getAppSocket } from '../../services/socket'

type WsPreview = {
  id: string
  title: string
  message: string
  createdAt: string
}

export interface NotificationBellProps {
  initialNotifications?: Notification[]
  className?: string
  ariaLabel?: string
}

export default function NotificationBell({
  initialNotifications,
  className = '',
  ariaLabel = 'Notifications',
}: NotificationBellProps) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const seed = initialNotifications ? [...initialNotifications] : []
    return seed.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  })
  const [open, setOpen] = useState(false)
  const [wsPreview, setWsPreview] = useState<WsPreview | null>(null)
  const wsPreviewTimeoutRef = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const buttonId = useId()

  const unreadCount = notifications.filter((n) => !n.read).length

  const syncNotifications = useCallback(async () => {
    const list = await notificationsApi.getNotifications()
    setNotifications(
      [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    )
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await notificationsApi.getNotifications()
        if (cancelled) return
        setNotifications(
          [...list].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        )
      } catch {
        // best-effort: keep whatever is currently shown
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const socket = getAppSocket()

    const onNotification = (payload: {
      userId?: string
      message: string
      metadata?: {
        title: string
        category: string
        reservationId: string
      }
    }) => {
      const title =
        payload.metadata && typeof payload.metadata === 'object' && 'title' in payload.metadata
          ? String(payload.metadata.title)
          : 'Notification'

      const preview: WsPreview = {
        id: `ws-preview-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        message: payload.message,
        createdAt: new Date().toISOString(),
      }

      setWsPreview(preview)

      if (wsPreviewTimeoutRef.current) {
        window.clearTimeout(wsPreviewTimeoutRef.current)
      }

      void syncNotifications().catch(() => {})

      wsPreviewTimeoutRef.current = window.setTimeout(() => {
        setWsPreview(null)
      }, 4000)
    }

    socket.on('notification', onNotification)
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err?.message ?? err)
    })
    return () => {
      socket.off('notification', onNotification)
    }
  }, [syncNotifications])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const el = rootRef.current
      if (el && !el.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <AnimatePresence>
        {wsPreview && (
          <motion.div
            key={wsPreview.id}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={[
              "absolute right-0 top-full z-60 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl",
              "border border-neon-green/20 bg-sidebar-bg/95 shadow-2xl shadow-black/40 ring-1 ring-neon-green/10 backdrop-blur-xl",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-wide text-neon-green/90">
                  New notification
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-white">
                  {wsPreview.title}
                </div>
                <div className="mt-1 line-clamp-2 text-sm text-slate-300/90">
                  {wsPreview.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (wsPreviewTimeoutRef.current) {
                    window.clearTimeout(wsPreviewTimeoutRef.current)
                    wsPreviewTimeoutRef.current = null
                  }
                  setWsPreview(null)
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Dismiss
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5">
              <div className="text-xs text-slate-400">Will appear in the bell shortly.</div>
              <button
                type="button"
                onClick={() => {
                  if (wsPreviewTimeoutRef.current) {
                    window.clearTimeout(wsPreviewTimeoutRef.current)
                    wsPreviewTimeoutRef.current = null
                  }
                  void (async () => {
                    try {
                      await syncNotifications()
                    } finally {
                      setWsPreview(null)
                      setOpen(true)
                    }
                  })()
                }}
                className="rounded-lg border border-neon-green/25 bg-neon-green/6 px-2.5 py-1.5 text-xs font-semibold text-neon-green transition hover:bg-neon-green/10"
              >
                View
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={[
          "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none",
          "border-white/10 bg-white/5 text-slate-200 hover:border-neon-green/25 hover:bg-neon-green/6 hover:text-white",
          "focus-visible:ring-2 focus-visible:ring-neon-green/60",
        ].join(" ")}
      >
        <HiOutlineBell className="h-5 w-5" aria-hidden />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="absolute -right-0.5 -top-0.5 flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full border border-neon-green/25 bg-neon-green px-1 text-[10px] font-bold text-black shadow-lg shadow-neon-green/30"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <NotificationDropdown
        open={open}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={async () => {
          const unread = notifications.filter((n) => !n.read)
          markAllAsRead()
          await Promise.allSettled(unread.map((n) => notificationsApi.markAsRead(n.id)))
        }}
        onNotificationClick={(id) => {
          markAsRead(id)
          void notificationsApi.markAsRead(id)
          setOpen(false)
          const n = notifications.find((x) => x.id === id)
          if (n?.reservationId) {
            if (n.category === 'admin') {
              navigate(`/admin/reservations?highlight=${n.reservationId}`)
            } else if (n.category === 'user') {
              navigate(`/my-reservations?highlight=${n.reservationId}`)
            }
          }
        }}
        onDeleteNotification={async (id) => {
          setNotifications((prev) => prev.filter((n) => n.id !== id))
          await notificationsApi.deleteNotification(id)
        }}
        panelId={panelId}
        labelledBy={buttonId}
      />
    </div>
  )
}
