import React, { useEffect, useState } from 'react'
import { Plus, Package, TrendingUp } from 'lucide-react'
import api from '../api'

export default function ItemsIn(){
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState({ itemId:'', quantity:1, notes:'' })
  const [open, setOpen] = useState(false)

  const load = async ()=>{
    const [i,t] = await Promise.all([api.get('/items'), api.get('/transactions')])
    setItems(i.data); setTransactions(t.data)
  }
  useEffect(()=>{ load() }, [])

  const stats = {
    itemsIn: transactions.filter(t=>t.type==='in').reduce((s,t)=>s+t.quantity,0),
    transIn: transactions.filter(t=>t.type==='in').length
  }

  const submit = async (e)=>{
    e.preventDefault()
    const { data } = await api.post('/transactions/in', form)
    setTransactions([data, ...transactions])
    setOpen(false); setForm({ itemId:'', quantity:1, notes:'' })
    const { data: itemsNew } = await api.get('/items'); setItems(itemsNew)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Barang Masuk</h1>
          <p className="text-gray-600 mt-1">Catat barang masuk ke inventaris</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 text-white rounded-xl"><TrendingUp size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">Total Masuk (Bulan Ini)</p>
              <p className="text-2xl font-bold text-gray-800">{stats.itemsIn} unit</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl"><Package size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">Transaksi Masuk</p>
              <p className="text-2xl font-bold text-gray-800">{stats.transIn}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 text-white rounded-xl">+</div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xl font-bold text-gray-800">Aktif</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Riwayat Barang Masuk</h3>
        <table className="w-full">
          <thead><tr className="border-b border-gray-200">
            <th className="text-left p-3">Tanggal</th>
            <th className="text-left p-3">Nama Barang</th>
            <th className="text-left p-3">Jumlah</th>
            <th className="text-left p-3">Petugas</th>
            <th className="text-left p-3">Keterangan</th>
          </tr></thead>
          <tbody>
            {transactions.filter(t=>t.type==='in').map(trans=>(
              <tr key={trans.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">{trans.date}</td>
                <td className="p-3 font-medium">{trans.itemName}</td>
                <td className="p-3"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">+{trans.quantity}</span></td>
                <td className="p-3 text-gray-600">{trans.userName}</td>
                <td className="p-3 text-gray-600">{trans.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Tambah Barang Masuk</h3>
              <button className="btn-icon" onClick={()=>setOpen(false)}>✕</button>
            </div>
            <form onSubmit={submit} className="grid grid-cols-2 gap-3">
              <select className="input col-span-2" value={form.itemId} onChange={e=>setForm({...form,itemId:e.target.value})}>
                <option value="">Pilih Barang</option>
                {items.map(i=>(<option key={i.id} value={i.id}>{i.name}</option>))}
              </select>
              <input className="input" type="number" placeholder="Jumlah" value={form.quantity} onChange={e=>setForm({...form,quantity:+e.target.value})}/>
              <div className="col-span-1"></div>
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
