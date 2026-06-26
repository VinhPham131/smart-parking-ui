import { AnimatePresence, motion } from 'framer-motion'
import type { Notification } from '../../types/notification'
import NotificationItem from './NotificationItem'

export interface NotificationDropdownProps {
  open: boolean
  notifications: Notification[]
  unreadCount: number
  onMarkAllRead: () => void
  onNotificationClick: (id: string) => void
  onDeleteNotification: (id: string) => void
  panelId: string
  labelledBy?: string
}

export default function NotificationDropdown({
  open,
  notifications,
  unreadCount,
  onMarkAllRead,
  onNotificationClick,
  onDeleteNotification,
  panelId,
  labelledBy,
}: NotificationDropdownProps) {
  const hasItems = notifications.length > 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={labelledBy}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className={[
            "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,24rem)] origin-top-right overflow-hidden rounded-2xl",
            "border border-neon-green/15 bg-sidebar-bg/92 shadow-2xl shadow-black/40 ring-1 ring-neon-green/10 backdrop-blur-xl",
            "sm:w-lg",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-base font-semibold text-white">Notifications</p>
              {unreadCount > 0 ? (
                <p className="text-sm text-slate-400">
                  {unreadCount} unread
                </p>
              ) : (
                <p className="text-sm text-slate-500">You&apos;re all caught up</p>
              )}
            </div>
            {hasItems && unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAllRead()
                }}
                className="rounded-lg border border-neon-green/20 bg-neon-green/6 px-2.5 py-1.5 text-sm font-semibold text-neon-green transition hover:bg-neon-green/10"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto p-2">
            {!hasItems ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.082A2.02 2.02 0 0021 14.018V9.5a7.5 7.5 0 00-15 0v4.518a2.02 2.02 0 001.689 1.982 23.85 23.85 0 005.454 1.082M9 10h.01M15 10h.01M12 12h.01"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-300">
                  No notifications yet
                </p>
                <p className="max-w-56 text-xs text-slate-500">
                  When something important happens, you&apos;ll see it here.
                </p>
              </motion.div>
            ) : (
              <ul className="space-y-1.5">
                {notifications.map((n, i) => (
                  <li key={n.id}>
                    <NotificationItem
                      notification={n}
                      onClick={onNotificationClick}
                      onDelete={onDeleteNotification}
                      index={i}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
