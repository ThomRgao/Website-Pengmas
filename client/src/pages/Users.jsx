import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users, User, KeyRound } from 'lucide-react'
import api from '../api'

export default function UsersPage(){
  const [users, setUsers] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ role: 'user', status: 'active' })
  const [editId, setEditId] = useState(null)

  const [pwOpen, setPwOpen] = useState(false)
  const [pwUser, setPwUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  const load = async ()=>{
    const { data } = await api.get('/users')
    setUsers(data)
  }
  useEffect(()=>{ load() }, [])

  const submit = async (e)=>{
    e.preventDefault()
    if (editId){
      const { data } = await api.put(`/users/${editId}`, form)
      setUsers(users.map(u=>u.id===editId?data:u))
    } else {
      const { data } = await api.post('/users', form)
      setUsers([...users, data])
    }
    setOpen(false); setForm({ role:'user', status:'active' }); setEditId(null)
  }

  const del = async (id)=>{
    if (!confirm('Hapus user ini?')) return
    await api.delete(`/users/${id}`)
    setUsers(users.filter(u=>u.id!==id))
  }

  const openPw = (u)=>{
    setPwUser(u)
    setNewPassword('')
    setPwOpen(true)
  }

  const savePassword = async (e)=>{
    e.preventDefault()
    if(!newPassword) return
    setSavingPw(true)
    try{
      await api.put(`/users/${pwUser.id}`, { password: newPassword })
      setPwOpen(false)
      setPwUser(null)
      setNewPassword('')
    } finally {
      setSavingPw(false)
    }
  }

  const tableUsers = users.filter(u=>u.role !== 'admin')

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen User</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna sistem inventaris</p>
        </div>
        <button onClick={()=>{ setOpen(true); setEditId(null); setForm({ role:'user', status:'active' }) }} className="btn-primary">
          <Plus size={18}/> Tambah User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 text-white rounded-xl"><Users size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">Total User</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl"><User size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">Admin</p>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u=>u.role==='admin').length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 text-white rounded-xl"><User size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">User Aktif</p>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u=>u.status==='active').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Bergabung</th>
              <th className="text-left p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tableUsers.map(user=>(
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.fullName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.fullName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-gray-600">{user.username}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.role==='admin'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                    {user.role==='admin'?'Admin':'User'}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{user.status}</span>
                </td>
                <td className="p-3 text-gray-600">{user.joinDate}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={()=>{setOpen(true); setEditId(user.id); setForm(user)}} className="btn-icon text-blue-600 hover:bg-blue-50"><Edit2 size={16}/></button>
                    <button onClick={()=>openPw(user)} className="btn-icon text-amber-600 hover:bg-amber-50"><KeyRound size={16}/></button>
                    <button onClick={()=>del(user.id)} className="btn-icon text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {tableUsers.length===0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={6}>Tidak ada user ditampilkan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">{editId?'Edit':'Tambah'} User</h3>
              <button className="btn-icon" onClick={()=>setOpen(false)}>✕</button>
            </div>
            <form onSubmit={submit} className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Full Name" value={form.fullName||''} onChange={e=>setForm({...form,fullName:e.target.value})}/>
              <input className="input" placeholder="Email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/>
              <input className="input" placeholder="Username" value={form.username||''} onChange={e=>setForm({...form,username:e.target.value})}/>
              {!editId && <input className="input" placeholder="Password" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})}/>}
              <select className="input" value={form.role||'user'} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <select className="input" value={form.status||'active'} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={()=>setOpen(false)}>Batal</button>
                <button className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pwOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Ubah Password {pwUser?.fullName}</h3>
              <button className="btn-icon" onClick={()=>setPwOpen(false)}>✕</button>
            </div>
            <form onSubmit={savePassword} className="grid grid-cols-1 gap-3">
              <input className="input" type="password" placeholder="Password baru" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={()=>setPwOpen(false)}>Batal</button>
                <button disabled={!newPassword || savingPw} className="btn-primary">{savingPw?'Menyimpan...':'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
