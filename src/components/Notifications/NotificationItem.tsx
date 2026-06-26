import { motion } from 'framer-motion'
import type { Notification } from '../../types/notification'
import { formatRelativeTime } from '../../utils/datetime'
import { HiOutlineTrash } from 'react-icons/hi'

export interface NotificationItemProps {
  notification: Notification
  onClick: (id: string) => void
  onDelete: (id: string) => void
  index?: number
}

export default function NotificationItem({
  notification,
  onClick,
  onDelete,
  index = 0,
}: NotificationItemProps) {
  const { id, title, message, createdAt, read } = notification

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      onClick={() => onClick(id)}
      className={`group flex w-full gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-200 ${
        read
          ? 'border-white/10 bg-white/3 hover:bg-white/5'
          : 'border-neon-green/25 bg-neon-green/6 hover:bg-neon-green/10'
      }`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-110 ${
          read ? 'bg-slate-500' : 'bg-neon-green shadow-[0_0_10px_rgba(0,230,118,0.55)]'
        }`}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span
            className={`text-[15px] font-semibold leading-tight ${
              read ? 'text-slate-200' : 'text-white'
            }`}
          >
            {title}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <time className="text-sm text-slate-500 tabular-nums" dateTime={createdAt}>
              {formatRelativeTime(createdAt)}
            </time>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(id)
              }}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-100"
              aria-label="Delete notification"
              title="Delete"
            >
              <HiOutlineTrash className="h-4 w-4" aria-hidden />
            </button>
          </span>
        </span>
        <p
          className={`mt-1.5 text-sm leading-relaxed ${
            read ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {message}
        </p>
      </span>
    </motion.button>
  )
}
