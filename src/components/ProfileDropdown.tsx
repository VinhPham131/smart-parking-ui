import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlineUser,
  HiOutlineCreditCard,
  HiOutlineLogout,
  HiUser,
} from "react-icons/hi";
import { useNavigate } from 'react-router-dom'

interface ProfileDropdownProps {
  name?: string
  className?: string
}

export default function ProfileDropdown({ name, className = '' }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    setOpen(false)
    navigate('/login')
  }

  const handleMyProfile = () => {
    setOpen(false)
    navigate('/profile')
  }

  const handlePayment = () => {
    setOpen(false)
    navigate('/payment')
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
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
    <div
      ref={rootRef}
      className={`relative inline-flex ${className}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Profile menu"
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none',
          'border-white/10 bg-white/5 hover:border-neon-green/25 hover:bg-neon-green/6',
          'focus-visible:ring-2 focus-visible:ring-neon-green/60',
          open ? 'border-neon-green/30 bg-neon-green/8' : '',
        ].join(' ')}
      >
        <HiUser className="h-5 w-5 text-slate-200" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={[
              'absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl',
              'border border-white/10 bg-sidebar-bg/95 shadow-2xl shadow-black/40',
              'ring-1 ring-neon-green/10 backdrop-blur-xl',
            ].join(' ')}
          >
            {/* User name header */}
            {name && (
              <div className="border-b border-white/8 px-4 py-3">
                <p className="truncate text-sm font-semibold text-white">{name}</p>
              </div>
            )}

            <div className="py-1.5">
              {/* Payment */}
              <button
                type="button"
                onClick={handlePayment}
                className={[
                  'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-200 transition',
                  'hover:bg-neon-green/8 hover:text-white',
                ].join(' ')}
              >
                <HiOutlineCreditCard className="h-4 w-4 shrink-0" />
                <span>My Payment</span>
              </button>

              {/* My Profile */}
              <button
                type="button"
                onClick={handleMyProfile}
                className={[
                  'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-200 transition',
                  'hover:bg-neon-green/8 hover:text-white',
                ].join(' ')}
              >
                <HiOutlineUser className="h-4 w-4 shrink-0" />
                <span>My Profile</span>
              </button>

              <div className="mx-3 my-1 border-t border-white/8" />

              {/* Log out */}
              <button
                type="button"
                onClick={handleLogout}
                className={[
                  'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition',
                  'hover:bg-red-500/10 hover:text-red-300',
                ].join(' ')}
              >
                <HiOutlineLogout className="h-4 w-4 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
