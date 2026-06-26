import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useToast } from './Toast/useToast'
import { resetAppSocket } from '../services/socket'
import {
  HiOutlineViewGrid,
  HiOutlineCreditCard,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineUserGroup,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineQrcode,
} from 'react-icons/hi'

const NAV_OPTIONS = [
  { path: '/admin', label: 'Parking Areas', icon: HiOutlineViewGrid, default: true },
  { path: '/admin/users', label: 'Users', icon: HiOutlineUserGroup },
  { path: '/admin/vehicles', label: 'Vehicles', icon: HiOutlineTruck },
  { path: '/admin/reservations', label: 'Reservations', icon: HiOutlineClipboardList },
  { path: '/admin/parking-history', label: 'Parking History', icon: HiOutlineClipboardList },
  { path: '/admin/rfid', label: 'RFID Cards', icon: HiOutlineCreditCard },
  { path: '/admin/rfid-requests', label: 'RFID Requests', icon: HiOutlineDocumentText },
  { path: '/admin/payments', label: 'Payments', icon: HiOutlineCash },
  { path: '/admin/scan', label: 'Scan QR', icon: HiOutlineQrcode },
] as const

export default function AdminSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogout = () => {
    localStorage.removeItem('token')
    resetAppSocket()
    setUserMenuOpen(false)
    toast.success('Log out successfully')
    navigate('/login')
  }

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setUserMenuOpen(false)
      }}
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col rounded-r-2xl bg-sidebar-bg/95 shadow-xl backdrop-blur-md transition-all duration-300 ease-out ${
        isHovered ? 'w-53' : 'w-20'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
        <img
          src="/Smart.png"
          alt="Smart Parking Admin"
          className="h-9 w-9 rounded-lg object-contain"
        />
        {isHovered && (
          <span className="ml-3 truncate text-xl font-semibold text-neon-green">
            Admin Panel
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_OPTIONS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-neon-green text-black shadow-lg shadow-neon-green/25'
                  : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {isHovered && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mx-4 border-t border-white/10" />

      <div className="space-y-1 px-3 py-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-sidebar-hover hover:text-white"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon-green/20 text-neon-green">
              <HiOutlineUser className="h-4 w-4" />
            </div>
            {isHovered && <span className="truncate">Admin</span>}
          </button>

          {userMenuOpen && isHovered && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/10 bg-sidebar-bg py-1 shadow-xl">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition hover:bg-sidebar-hover hover:text-red-300"
              >
                <HiOutlineLogout className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

