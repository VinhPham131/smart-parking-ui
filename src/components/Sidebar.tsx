import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  HiOutlineCalendar,
  HiOutlineMap,
  HiOutlineClipboardList,
} from 'react-icons/hi'
import { HiOutlineCreditCard } from 'react-icons/hi'

const NAV_OPTIONS = [
  { path: '/', label: 'Booking', icon: HiOutlineMap, default: true },
  { path: '/vehicles', label: 'Vehicles & RFID', icon: HiOutlineCreditCard },
  { path: '/parking-history', label: 'Parking History', icon: HiOutlineCalendar },
  { path: '/my-reservations', label: 'My Reservations', icon: HiOutlineClipboardList },
] as const

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col rounded-r-2xl bg-sidebar-bg/95 shadow-xl backdrop-blur-md transition-all duration-300 ease-out ${
        isHovered ? 'w-53' : 'w-20'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
        <img
          src="/Smart.png"
          alt="Smart Parking"
          className="h-9 w-9 rounded-lg object-contain"
        />
        {isHovered && (
          <span className="ml-3 truncate text-xl font-semibold text-neon-green">
            Smart Parking
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_OPTIONS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
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

    </aside>
  )
}
