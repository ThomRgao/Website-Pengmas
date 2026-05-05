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
import logoDesa from '../images/logo-desa.png'

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function Sidebar({ user, open }) {
  const adminMenu = [
    { to: '/', label: 'Dashboard Admin', icon: LayoutDashboard },
    { to: '/borrowing', label: 'Tracking Peminjam', icon: ClipboardList },
    { to: '/items', label: 'Data Barang', icon: Package },
    //{ to: '/items-in', label: 'Barang Masuk', icon: TrendingUp },
    //{ to: '/items-out', label: 'Barang Keluar', icon: TrendingDown },
    { to: '/reports', label: 'Laporan', icon: Archive },
    { to: '/analytics', label: 'Analytics', icon: Activity },
    { to: '/settings', label: 'Pengaturan', icon: Settings }
  ]

  const menu = user?.role === 'admin' ? adminMenu : []

  return (
    <aside
      className={`transition-all duration-300 ${
        open ? 'w-72' : 'w-[5.25rem]'
      } bg-white border-r border-gray-100 p-3 h-screen sticky top-0 shrink-0`}
    >
      <div className="flex items-center gap-3 px-2 py-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
          <img
            src={logoDesa}
            alt="Logo Desa"
            className="w-full h-full object-contain p-1"
          />
        </div>

        {open && (
          <div className="min-w-0">
            <p className="font-bold text-gray-800 leading-tight truncate">
              Inventory Desa
            </p>
            <p className="text-xs text-gray-500 -mt-0.5 truncate">
              Admin Panel Peminjaman
            </p>
          </div>
        )}
      </div>

      <div className="mb-3 px-2">
        <div className={`${open ? 'block' : 'hidden'} rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 p-3`}>
          <p className="text-xs text-slate-500">Login sebagai</p>
          <p className="text-sm font-bold text-slate-800 truncate">
            {user?.fullName || 'Administrator'}
          </p>
        </div>
      </div>

      <nav className="space-y-1">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkCls}>
            <Icon size={18} className="shrink-0" />
            {open && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}