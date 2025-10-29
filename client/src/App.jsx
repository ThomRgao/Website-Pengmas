
import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import ItemsIn from './pages/ItemsIn'
import ItemsOut from './pages/ItemsOut'
import Borrowing from './pages/Borrowing'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App(){
  const loc = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const frame = (children) => (
    <div className="min-h-screen grid grid-cols-[auto_1fr]">
      <Sidebar user={user} open={sidebarOpen} />
      <div>
        <Topbar user={user} onToggleSidebar={()=>setSidebarOpen(s=>!s)} />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )

  if (loc.pathname.startsWith('/login') || loc.pathname.startsWith('/register')) {
    return (
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    )
  }

  return (
  <Routes>
  <Route path="/" element={
    <ProtectedRoute>{frame(<Dashboard/>)}</ProtectedRoute>
  }/>
  <Route path="/items" element={
    <ProtectedRoute>{frame(<Items/>)}</ProtectedRoute>
  }/>
  <Route path="/borrowing" element={
    <ProtectedRoute>{frame(<Borrowing/>)}</ProtectedRoute>
  }/>
  <Route path="/settings" element={
    <ProtectedRoute>{frame(<Settings/>)}</ProtectedRoute>
  }/>

  {/* ADMIN ONLY */}
  <Route path="/users" element={
    <ProtectedRoute role="admin">{frame(<Users/>)}</ProtectedRoute>
  }/>
  <Route path="/items-in" element={
    <ProtectedRoute role="admin">{frame(<ItemsIn/>)}</ProtectedRoute>
  }/>
  <Route path="/items-out" element={
    <ProtectedRoute role="admin">{frame(<ItemsOut/>)}</ProtectedRoute>
  }/>
  <Route path="/reports" element={
    <ProtectedRoute role="admin">{frame(<Reports/>)}</ProtectedRoute>
  }/>
  <Route path="/analytics" element={
    <ProtectedRoute role="admin">{frame(<Analytics/>)}</ProtectedRoute>
  }/>

  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>
  )
}
