import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Archive,
  Activity,
  Settings
} from 'lucide-react'

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function Sidebar({ user, open }) {
  const adminMenu = [
    { to: '/', label: 'Dashboard Admin', icon: LayoutDashboard },
    { to: '/borrowing', label: 'Tracking Peminjam', icon: ClipboardList },
    { to: '/items', label: 'Data Barang', icon: Package },
    { to: '/items-in', label: 'Barang Masuk', icon: TrendingUp },
    { to: '/items-out', label: 'Barang Keluar', icon: TrendingDown },
    { to: '/reports', label: 'Laporan', icon: Archive },
    { to: '/analytics', label: 'Analytics', icon: Activity },
    { to: '/settings', label: 'Pengaturan', icon: Settings }
  ]

  const menu = user?.role === 'admin' ? adminMenu : []

  return (
    <aside
      className={`transition-all ${
        open ? 'w-72' : 'w-[4.5rem]'
      } bg-white border-r border-gray-100 p-3 h-screen sticky top-0`}
    >
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500"></div>
        {open && (
          <div>
            <p className="font-bold text-gray-800 leading-tight">Inventory</p>
            <p className="text-xs text-gray-500 -mt-0.5">Admin Panel</p>
          </div>
        )}
      </div>

      <nav className="space-y-1">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkCls}>
            <Icon size={18} />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}