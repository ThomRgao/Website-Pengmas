import React, { useMemo, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardPublic from './pages/DashboardPublic'
import DashboardAdmin from './pages/DashboardAdmin'
import Items from './pages/Items'
import ItemsIn from './pages/ItemsIn'
import ItemsOut from './pages/ItemsOut'
import Borrowing from './pages/Borrowing'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App() {
  const loc = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isAdmin = user?.role === 'admin'

  const contentWrapperClass = useMemo(() => {
    return loc.pathname === '/analytics'
      ? 'w-full max-w-none'
      : 'w-full max-w-none'
  }, [loc.pathname])

  const adminFrame = children => (
    <div className="min-h-screen grid grid-cols-[auto_1fr] bg-gray-50">
      <Sidebar user={user} open={sidebarOpen} />
      <div className="min-w-0 w-full">
        <Topbar user={user} onToggleSidebar={() => setSidebarOpen(s => !s)} />
        <main className="p-4 sm:p-5 lg:p-6 xl:p-7 w-full">
          <div className={contentWrapperClass}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )

  if (loc.pathname.startsWith('/login') || loc.pathname.startsWith('/register')) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAdmin ? adminFrame(<DashboardAdmin />) : <DashboardPublic />}
      />

      <Route
        path="/borrowing"
        element={
          <ProtectedRoute role="admin">
            {adminFrame(<Borrowing />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/items"
        element={
          <ProtectedRoute role="admin">
            {adminFrame(<Items />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/items-in"
        element={
          <ProtectedRoute role="admin">
            {adminFrame(<ItemsIn />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/items-out"
        element={
          <ProtectedRoute role="admin">
            {adminFrame(<ItemsOut />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute role="admin">
            {adminFrame(<Reports />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute role="admin">
            {adminFrame(<Analytics />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute role="admin">
            {adminFrame(<Settings />)}
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}