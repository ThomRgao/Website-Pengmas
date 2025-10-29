
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, UserPlus } from 'lucide-react'
import api from '../api'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      nav('/')
    } catch (e) {
      setError(e?.response?.data?.error || 'Gagal login')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-rose-500 opacity-90"></div>
        <div className="absolute inset-0 grid place-items-center text-white p-10">
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.5}} className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-3">Inventory System</h1>
            <p className="text-blue-50">Kelola stok, peminjaman, dan laporan dalam satu dashboard yang modern dan elegan.</p>
          </motion.div>
        </div>
      </div>
      <div className="p-8 lg:p-12 flex items-center justify-center bg-gray-50">
        <motion.form onSubmit={submit} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.4}} className="w-full max-w-md card">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Masuk</h2>
          <p className="text-sm text-gray-600 mb-6">Gunakan akun Anda untuk melanjutkan.</p>
          {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Username</label>
              <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin atau user" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <button disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Memproses...' : (<><LogIn size={18}/> Masuk</>)}</button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Belum punya akun? <Link to="/register" className="link inline-flex items-center gap-1"><UserPlus size={14}/> Daftar</Link>
          </div>
          <div className="mt-6 text-xs text-gray-500">Demo: admin/admin atau user/user</div>
        </motion.form>
      </div>
    </div>
  )
}
