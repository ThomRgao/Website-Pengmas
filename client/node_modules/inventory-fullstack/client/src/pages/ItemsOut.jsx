import React, { useEffect, useState } from 'react'
import { Check, X, Undo2, TrendingDown, ShoppingCart, Activity } from 'lucide-react'
import api from '../api'

export default function ItemsOut(){
  const me = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = me?.role === 'admin'

  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [borrowings, setBorrowings] = useState([])

  const load = async ()=>{
    const [i,t,b] = await Promise.all([api.get('/items'), api.get('/transactions'), api.get('/borrowings')])
    setItems(i.data); setTransactions(t.data); setBorrowings(b.data)
  }
  useEffect(()=>{ load() }, [])

  const stats = {
    itemsOut: transactions.filter(t=>t.type==='out').reduce((s,t)=>s+t.quantity,0),
    borrowed: borrowings.filter(b=>b.status==='borrowed').reduce((s,b)=>s+b.quantity,0),
    transOut: transactions.filter(t=>t.type==='out').length
  }

  const approve = async (id)=>{
    if(!isAdmin) return
    await api.patch(`/borrowings/${id}/approve`)
    await load()
  }

  const reject = async (id)=>{
    if(!isAdmin) return
    await api.patch(`/borrowings/${id}/reject`)
    await load()
  }

  const doReturn = async (id)=>{
    if(!isAdmin) return
    await api.post(`/borrowings/${id}/return`)
    await load()
  }

  const pending = isAdmin ? borrowings.filter(b=>b.status==='pending') : []
  const active = isAdmin ? borrowings.filter(b=>b.status==='borrowed') : []

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Barang Keluar</h1>
          <p className="text-gray-600 mt-1">{isAdmin ? 'ACC peminjaman, barang keluar, dan pengembalian' : 'Ringkasan barang keluar'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 text-white rounded-xl"><TrendingDown size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">Total Keluar (Bulan Ini)</p>
              <p className="text-2xl font-bold text-gray-800">{stats.itemsOut} unit</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 text-white rounded-xl"><ShoppingCart size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">Sedang Dipinjam</p>
              <p className="text-2xl font-bold text-gray-800">{stats.borrowed}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500 text-white rounded-xl"><Activity size={28}/></div>
            <div>
              <p className="text-sm text-gray-600">Transaksi Keluar</p>
              <p className="text-2xl font-bold text-gray-800">{stats.transOut}</p>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Pengajuan Pending</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Barang</th>
                  <th className="text-left p-3">Jumlah</th>
                  <th className="text-left p-3">Jatuh Tempo</th>
                  <th className="text-left p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pending.length===0 && (
                  <tr><td className="p-3 text-gray-500" colSpan={6}>Tidak ada pengajuan</td></tr>
                )}
                {pending.map(b=>(
                  <tr key={b.id} className="border-b border-gray-100">
                    <td className="p-3 text-gray-600">-</td>
                    <td className="p-3">{b.userName}</td>
                    <td className="p-3">{b.itemName}</td>
                    <td className="p-3">{b.quantity}</td>
                    <td className="p-3">{b.expectedReturn || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={()=>approve(b.id)} className="px-3 py-1 rounded-lg bg-green-600 text-white inline-flex items-center gap-1"><Check size={16}/> ACC</button>
                        <button onClick={()=>reject(b.id)} className="px-3 py-1 rounded-lg bg-red-600 text-white inline-flex items-center gap-1"><X size={16}/> Tolak</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card overflow-hidden">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Sedang Dipinjam</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3">Tgl Pinjam</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Barang</th>
                  <th className="text-left p-3">Jumlah</th>
                  <th className="text-left p-3">Jatuh Tempo</th>
                  <th className="text-left p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {active.length===0 && (
                  <tr><td className="p-3 text-gray-500" colSpan={6}>Belum ada yang dipinjam</td></tr>
                )}
                {active.map(b=>(
                  <tr key={b.id} className="border-b border-gray-100">
                    <td className="p-3">{b.borrowDate}</td>
                    <td className="p-3">{b.userName}</td>
                    <td className="p-3">{b.itemName}</td>
                    <td className="p-3">{b.quantity}</td>
                    <td className="p-3">{b.expectedReturn || '-'}</td>
                    <td className="p-3">
                      <button onClick={()=>doReturn(b.id)} className="px-3 py-1 rounded-lg bg-blue-600 text-white inline-flex items-center gap-1"><Undo2 size={16}/> Kembalikan</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Riwayat Barang Keluar</h3>
        <table className="w-full">
          <thead><tr className="border-b border-gray-200">
            <th className="text-left p-3">Tanggal</th>
            <th className="text-left p-3">Nama Barang</th>
            <th className="text-left p-3">Jumlah</th>
            <th className="text-left p-3">Petugas</th>
            <th className="text-left p-3">Keterangan</th>
          </tr></thead>
          <tbody>
            {transactions.filter(t=>t.type==='out').map(trans=>(
              <tr key={trans.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">{trans.date}</td>
                <td className="p-3 font-medium">{trans.itemName}</td>
                <td className="p-3"><span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">-{trans.quantity}</span></td>
                <td className="p-3 text-gray-600">{trans.userName}</td>
                <td className="p-3 text-gray-600">{trans.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
