import type { ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  busy?: boolean
  panelClassName?: string
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  busy = false,
  panelClassName,
}: ModalProps) {
  if (!open) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/20 bg-sidebar-bg p-6 shadow-xl sm:max-w-md sm:p-8 ${panelClassName ?? ''}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="modal-title" className="text-xl font-semibold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="shrink-0 text-white/60 transition hover:text-neon-green disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        <div className="text-white/90">{children}</div>
        {footer != null ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  )
}
