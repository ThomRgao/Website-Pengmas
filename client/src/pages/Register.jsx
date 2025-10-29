
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import api from '../api'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/register', { username, password, fullName, email })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      nav('/')
    } catch (e) {
      setError(e?.response?.data?.error || 'Gagal daftar')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-rose-500 opacity-90"></div>
        <div className="absolute inset-0 grid place-items-center text-white p-10">
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.5}} className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-3">Buat Akun</h1>
            <p className="text-blue-50">Registrasi cepat untuk mulai mengelola inventaris.</p>
          </motion.div>
        </div>
      </div>
      <div className="p-8 lg:p-12 flex items-center justify-center bg-gray-50">
        <motion.form onSubmit={submit} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.4}} className="w-full max-w-md card">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Register</h2>
          <p className="text-sm text-gray-600 mb-6">Isi data di bawah ini.</p>
          {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-sm text-gray-600">Nama Lengkap</label>
              <input className="input" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nama Anda" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@contoh.com" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Username</label>
              <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <button disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Memproses...' : (<><UserPlus size={18}/> Daftar</>)}</button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Sudah punya akun? <Link to="/login" className="link">Masuk</Link>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
