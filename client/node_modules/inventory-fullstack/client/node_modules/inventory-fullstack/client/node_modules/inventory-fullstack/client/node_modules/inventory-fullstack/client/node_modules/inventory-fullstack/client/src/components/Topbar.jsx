
import React from 'react'
import { Menu, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ user, onToggleSidebar }) {
  const nav = useNavigate()
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    nav('/login')
  }
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-10">
      <button onClick={onToggleSidebar} className="btn-icon"><Menu size={18}/></button>
      <div className="flex items-center gap-3">
        <button className="btn-icon"><Bell size={18}/></button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-tight">{user.fullName}</p>
          <button onClick={logout} className="text-xs text-red-600 hover:underline">Logout</button>
        </div>
      </div>
    </header>
  )
}
