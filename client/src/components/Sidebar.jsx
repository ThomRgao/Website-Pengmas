import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Package, Users, TrendingUp, TrendingDown, History, Settings,
  BarChart3, Activity, Archive
} from 'lucide-react'

const linkCls = ({isActive}) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function Sidebar({ user, open }) {
  // MENU KHUSUS USER (dibatasi sesuai permintaan)
  const userMenuLimited = [
    { to: '/',            label: 'Dashboard',            icon: BarChart3 },
    { to: '/items',       label: 'Data Barang',          icon: Package },
    { to: '/borrowing',   label: 'Riwayat Peminjaman',   icon: History },
    { to: '/settings',    label: 'Pengaturan',           icon: Settings },
  ]

  // MENU KHUSUS ADMIN (lengkap)
  const adminMenu = [
    { to: '/',            label: 'Dashboard',          icon: BarChart3 },
    { to: '/users',       label: 'Manajemen User',     icon: Users },
    { to: '/items',       label: 'Data Barang',        icon: Package },
    { to: '/items-in',    label: 'Barang Masuk',       icon: TrendingUp },
    { to: '/items-out',   label: 'Barang Keluar',      icon: TrendingDown },
    { to: '/borrowing',   label: 'Riwayat Peminjaman', icon: History },
    { to: '/reports',     label: 'Laporan',            icon: Archive },
    { to: '/analytics',   label: 'Analytics',          icon: Activity },
    { to: '/settings',    label: 'Pengaturan',         icon: Settings },
  ]

  const menu = user.role === 'admin' ? adminMenu : userMenuLimited

  return (
    <aside className={`transition-all ${open ? 'w-72' : 'w-[4.5rem]'} bg-white border-r border-gray-100 p-3 h-screen sticky top-0`}>
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500"></div>
        {open && (
          <div>
            <p className="font-bold text-gray-800 leading-tight">Inventory</p>
            <p className="text-xs text-gray-500 -mt-0.5"></p>
          </div>
        )}
      </div>

      <nav className="space-y-1">
        {menu.map(({to,label,icon:Icon})=>(
          <NavLink key={to} to={to} className={linkCls}>
            <Icon size={18}/>{open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
        {open ? (
          <div>
            <p className="text-xs text-gray-500">Masuk sebagai</p>
            <p className="font-semibold text-gray-800">{user.fullName}</p>
            <span className={`mt-1 inline-block text-xs px-2 py-1 rounded-full ${
              user.role==='admin'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'
            }`}>{user.role}</span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto"></div>
        )}
      </div>
    </aside>
  )
}
