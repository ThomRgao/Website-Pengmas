import React, { useEffect, useMemo, useState } from 'react'
import { Download, Plus, Check } from 'lucide-react'
import api from '../api'

export default function Borrowing(){
  const [user] = useState(JSON.parse(localStorage.getItem('user')||'{}'))
  const [items, setItems] = useState([])
  const [borrowings, setBorrowings] = useState([])
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ itemId:'', quantity:1, expectedReturn:'', notes:'' })

  const load = async ()=>{
    const [i,b] = await Promise.all([api.get('/items'), api.get('/borrowings')])
    setItems(i.data); setBorrowings(b.data)
  }
  useEffect(()=>{ load() }, [])

  const scoped = useMemo(()=>{
    if (user.role === 'admin') return borrowings
    return borrowings.filter(b=>String(b.userId)===String(user.id))
  },[borrowings,user])

  const filtered = useMemo(()=>{
    if (status==='all') return scoped
    return scoped.filter(b=>b.status===status)
  },[scoped,status])

  const stats = useMemo(()=>({
    borrowedNow: scoped.filter(b=>b.status==='borrowed').length,
    returned: scoped.filter(b=>b.status==='returned').length,
    dueThisWeek:  scoped.filter(b=>{
      if (b.status!=='borrowed') return false
      const d = b.expectedReturn ? new Date(b.expectedReturn) : null
      if (!d) return false
      const today = new Date()
      const start = new Date(today); start.setDate(today.getDate() - today.getDay())
      const end = new Date(start); end.setDate(start.getDate() + 6)
      return d>=start && d<=end
    }).length,
    overdue: scoped.filter(b=>{
      if (b.status!=='borrowed') return false
      const d = b.expectedReturn ? new Date(b.expectedReturn) : null
      if (!d) return false
      const today = new Date(new Date().toDateString())
      return d < today
    }).length
  }),[scoped])

  const submit = async (e)=>{
    e.preventDefault()
    const { data } = await api.post('/borrowings', form)
    setBorrowings([data, ...borrowings])
    setOpen(false); setForm({ itemId:'', quantity:1, expectedReturn:'', notes:'' })
    const { data: itemsNew } = await api.get('/items'); setItems(itemsNew)
  }

  const doReturn = async (id)=>{
    const { data } = await api.post(`/borrowings/${id}/return`)
    setBorrowings(borrowings.map(b=>b.id===id?data:b))
    const { data: itemsNew } = await api.get('/items'); setItems(itemsNew)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Riwayat Peminjaman</h1>
          <p className="text-gray-600 mt-1">Kelola peminjaman barang inventaris</p>
        </div>
        <button onClick={()=>setOpen(true)} className="btn-primary"><Plus size={18}/> Pinjam Barang</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <p className="text-xs text-gray-600">Sedang Dipinjam</p>
          <p className="text-2xl font-bold text-gray-800">{stats.borrowedNow}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <p className="text-xs text-gray-600">Sudah Kembali</p>
          <p className="text-2xl font-bold text-gray-800">{stats.returned}</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <p className="text-xs text-gray-600">Jatuh Tempo Minggu Ini</p>
          <p className="text-2xl font-bold text-gray-800">{stats.dueThisWeek}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
          <p className="text-xs text-gray-600">Terlambat</p>
          <p className="text-2xl font-bold text-gray-800">{stats.overdue}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-4">
          <select className="input w-48" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="borrowed">Dipinjam</option>
            <option value="returned">Dikembalikan</option>
          </select>
          <button className="btn-secondary ml-auto"><Download size={18}/> Export</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3">Barang</th>
              {user.role==='admin' && <th className="text-left p-3">Peminjam</th>}
              <th className="text-left p-3">Jumlah</th>
              <th className="text-left p-3">Tgl Pinjam</th>
              <th className="text-left p-3">Tgl Kembali</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(borrow=>(
              <tr key={borrow.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-medium text-gray-800">{borrow.itemName}</p>
                  <p className="text-sm text-gray-500">{borrow.notes}</p>
                </td>
                {user.role==='admin' && <td className="p-3 text-gray-600">{borrow.userName}</td>}
                <td className="p-3"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{borrow.quantity} unit</span></td>
                <td className="p-3 text-gray-600">{borrow.borrowDate}</td>
                <td className="p-3 text-gray-600">{borrow.returnDate || borrow.expectedReturn}</td>
                <td className="p-3">{borrow.status==='borrowed' ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Dipinjam</span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Dikembalikan</span>
                )}</td>
                <td className="p-3">
                  {borrow.status==='borrowed' && (user.role==='admin' || String(borrow.userId)===String(user.id)) && (
                    <button onClick={()=>doReturn(borrow.id)} className="btn-secondary text-sm inline-flex items-center gap-2"><Check size={16}/> Kembalikan</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Pinjam Barang</h3>
              <button className="btn-icon" onClick={()=>setOpen(false)}>✕</button>
            </div>
            <form onSubmit={submit} className="grid grid-cols-2 gap-3">
              <select className="input col-span-2" value={form.itemId} onChange={e=>setForm({...form,itemId:e.target.value})}>
                <option value="">Pilih Barang</option>
                {items.map(i=>(<option key={i.id} value={i.id}>{i.name}</option>))}
              </select>
              <input className="input" type="number" placeholder="Jumlah" value={form.quantity} onChange={e=>setForm({...form,quantity:+e.target.value})}/>
              <input className="input" type="date" placeholder="Jatuh Tempo" value={form.expectedReturn} onChange={e=>setForm({...form,expectedReturn:e.target.value})}/>
              <input className="input col-span-2" placeholder="Catatan" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={()=>setOpen(false)}>Batal</button>
                <button className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
