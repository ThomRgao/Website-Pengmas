import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts'

export default function Analytics(){
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [borrowings, setBorrowings] = useState([])

  useEffect(()=>{
    ;(async()=>{
      const [i,t,b] = await Promise.all([api.get('/items'), api.get('/transactions'), api.get('/borrowings')])
      setItems(i.data||[]); setTransactions(t.data||[]); setBorrowings(b.data||[])
    })()
  },[])

  const trendData = useMemo(()=>{
    const map = {}
    transactions.forEach(t=>{
      const d = (t.date||'').slice(0,10)
      if(!d) return
      if(!map[d]) map[d] = { date: d, masuk: 0, keluar: 0 }
      if(t.type==='in') map[d].masuk += Number(t.quantity||0)
      if(t.type==='out') map[d].keluar += Number(t.quantity||0)
    })
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date))
  },[transactions])

  const categoryData = useMemo(()=>{
    const m = {}
    items.forEach(it=>{
      const k = it.category||'Lainnya'
      m[k] = (m[k]||0) + Number(it.stock||0)
    })
    return Object.entries(m).map(([name,value])=>({name,value}))
  },[items])

  const statusData = useMemo(()=>{
    const borrowedQty = borrowings.filter(b=>b.status==='borrowed').reduce((s,b)=>s+Number(b.quantity||0),0)
    const total = items.reduce((s,it)=>s+Number(it.stock||0),0)
    const available = Math.max(total - borrowedQty, 0)
    return [{name:'Tersedia', value:available}, {name:'Dipinjam', value:borrowedQty}]
  },[items,borrowings])

  const topItemsData = useMemo(()=>{
    const sorted = [...items].sort((a,b)=>(b.stock||0)-(a.stock||0)).slice(0,10)
    return sorted.map(it=>({name: it.name, stock: it.stock||0}))
  },[items])

  const pieColors = ['#3b82f6','#f59e0b']

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <p className="text-gray-600 mt-1">Analisis mendalam data peminjaman</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tren Barang Masuk & Keluar</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="date"/>
                <YAxis allowDecimals={false}/>
                <Tooltip/>
                <Legend/>
                <Line type="monotone" dataKey="masuk" stroke="#10b981" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="keluar" stroke="#ef4444" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Distribusi Kategori</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name"/>
                <YAxis allowDecimals={false}/>
                <Tooltip/>
                <Bar dataKey="value" name="Stok"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Top 10 Stok Barang</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItemsData}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name"/>
                <YAxis allowDecimals={false}/>
                <Tooltip/>
                <Bar dataKey="stock" name="Stok"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Komposisi Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={120} label>
                  {statusData.map((e,i)=>(<Cell key={i} fill={pieColors[i%pieColors.length]}/>))}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
