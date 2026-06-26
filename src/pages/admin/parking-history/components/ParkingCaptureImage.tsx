import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { resolveCaptureImageSrc } from '../../../../utils/captureImage'

export interface ParkingCaptureImageProps {
  raw: string | null | undefined
  label: string
  variant?: 'thumb' | 'detail'
}

function CaptureImageLightbox({
  src,
  label,
  onClose,
}: {
  src: string
  label: string
  onClose: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-sm font-semibold text-white">{label}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            Close
          </button>
        </div>
        <img
          src={src}
          alt={label}
          className="max-h-[calc(92vh-3rem)] w-full rounded-xl border border-white/20 object-contain shadow-2xl"
        />
      </div>
    </div>,
    document.body,
  )
}

export function ParkingCaptureImage({
  raw,
  label,
  variant = 'thumb',
}: ParkingCaptureImageProps) {
  const src = resolveCaptureImageSrc(raw)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const openLightbox = useCallback(() => setLightboxOpen(true), [])
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  if (!src) {
    return (
      <div
        className={
          variant === 'detail'
            ? 'flex aspect-video min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 text-xs text-white/40'
            : 'flex h-12 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/20 text-[9px] text-white/35'
        }
        title={`No ${label} capture`}
      >
        <span>{variant === 'detail' ? 'No image' : '—'}</span>
      </div>
    )
  }

  const thumbClass =
    variant === 'detail'
      ? 'aspect-video w-full rounded-xl border border-white/15 object-cover'
      : 'h-12 w-16 rounded-lg border border-white/15 object-cover transition hover:border-neon-green/50 hover:ring-1 hover:ring-neon-green/30'

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        className="group relative block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/60"
        title={`View ${label}`}
      >
        <img src={src} alt={label} className={thumbClass} loading="lazy" />
        {variant === 'thumb' && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-[9px] font-semibold uppercase tracking-wide text-white/90 opacity-0 transition group-hover:opacity-100">
            View
          </span>
        )}
      </button>

      {lightboxOpen && (
        <CaptureImageLightbox src={src} label={label} onClose={closeLightbox} />
      )}
    </>
  )
}
