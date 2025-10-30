import React, { useEffect, useMemo, useState } from 'react'
import { Package, ShoppingCart, TrendingUp, TrendingDown, User } from 'lucide-react'
import api from '../api'
import ReactApexChart from 'react-apexcharts'

export default function Dashboard(){
  const [user] = useState(JSON.parse(localStorage.getItem('user')||'{}'))
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [borrowings, setBorrowings] = useState([])

  useEffect(()=>{
    ;(async()=>{
      const [i,t,b] = await Promise.all([api.get('/items'), api.get('/transactions'), api.get('/borrowings')])
      setItems(i.data||[]); setTransactions(t.data||[]); setBorrowings(b.data||[])
    })()
  }, [])

  const stats = useMemo(()=>{
    const totalItems = items.reduce((s, it)=>s+(it.stock||0),0)
    const borrowedActive = borrowings.filter(x=>x.status==='borrowed')
    const borrowedUnits = borrowedActive.reduce((s,b)=>s+(b.quantity||0),0)
    const itemsIn = transactions.filter(t=>t.type==='in').reduce((s,t)=>s+(t.quantity||0),0)
    const itemsOut = transactions.filter(t=>t.type==='out').reduce((s,t)=>s+(t.quantity||0),0)
    const availableUnits = Math.max(totalItems - borrowedUnits, 0)
    return { totalItems, borrowed: borrowedActive.length, borrowedUnits, itemsIn, itemsOut, availableUnits }
  },[items,transactions,borrowings])

  const linePrepared = useMemo(()=>{
    const map = {}
    transactions.forEach(t=>{
      const d = (t.date||'').slice(0,10)
      if(!d) return
      if(!map[d]) map[d] = { in:0, out:0 }
      if(t.type==='in') map[d].in += Number(t.quantity||0)
      if(t.type==='out') map[d].out += Number(t.quantity||0)
    })
    const dates = Object.keys(map).sort()
    const masuk = dates.map(d=>map[d].in)
    const keluar = dates.map(d=>map[d].out)
    return { dates, masuk, keluar }
  },[transactions])

  const apexLine = {
    series: [
      { name: 'Masuk', data: linePrepared.masuk },
      { name: 'Keluar', data: linePrepared.keluar }
    ],
    options: {
      chart: { type: 'area', height: 350, toolbar: { show: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { type: 'category', categories: linePrepared.dates },
      yaxis: { labels: { formatter: v => Math.round(v) } },
      tooltip: { x: { format: 'yyyy-MM-dd' } },
      legend: { show: true }
    }
  }

  const barPrepared = useMemo(()=>{
    const m = {}
    items.forEach(it=>{
      const k = it.category||'Lainnya'
      m[k] = (m[k]||0) + Number(it.stock||0)
    })
    const cats = Object.keys(m)
    const vals = cats.map(k=>m[k])
    return { cats, vals }
  },[items])

  const apexBar = {
    series: [{ name: 'Stok', data: barPrepared.vals }],
    options: {
      chart: { type: 'bar', height: 350, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 8, dataLabels: { position: 'top' } } },
      dataLabels: {
        enabled: true,
        formatter: val => String(val),
        offsetY: -16,
        style: { fontSize: '12px' }
      },
      xaxis: {
        categories: barPrepared.cats,
        position: 'top',
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: true }
      },
      yaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { show: false } },
      grid: { strokeDashArray: 3 }
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Selamat datang kembali, {user.fullName}!</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Hari ini</p>
          <p className="text-lg font-semibold text-gray-800">{new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Unit</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalItems}</h3>
              <p className="text-blue-100 text-xs mt-2">Update realtime</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Package size={32}/>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Unit Tersedia</p>
              <h3 className="text-3xl font-bold mt-2">{stats.availableUnits}</h3>
              <p className="text-emerald-100 text-xs mt-2">Siap dipinjam</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <TrendingUp size={28}/>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Peminjaman Aktif</p>
              <h3 className="text-3xl font-bold mt-2">{stats.borrowed}</h3>
              <p className="text-purple-100 text-xs mt-2">{stats.borrowedUnits} unit dipinjam</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <ShoppingCart size={32}/>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Aktivitas Bulan Ini</p>
              <h3 className="text-2xl font-bold mt-2">+{stats.itemsIn} / -{stats.itemsOut}</h3>
              <p className="text-cyan-100 text-xs mt-2">Masuk vs Keluar</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <TrendingUp size={28}/>
            </div>
          </div>
        </div>
      </div>

      {user.role==='admin' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tren Barang Masuk & Keluar</h3>
            <div className="h-80">
              <ReactApexChart options={apexLine.options} series={apexLine.series} type="area" height={320} />
            </div>
          </div>
          <div className="card">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Distribusi Stok per Kategori</h3>
            <div className="h-80">
              <ReactApexChart options={apexBar.options} series={apexBar.series} type="bar" height={320} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Aktivitas Terakhir</h3>
            <a href="/items-in" className="text-blue-600 text-sm hover:underline">Lihat Semua</a>
          </div>
          <div className="space-y-3">
            {transactions.slice(0,5).map(trans=>(
              <div key={trans.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-lg ${trans.type==='in'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>
                  {trans.type==='in'?<TrendingUp size={20}/> : <TrendingDown size={20}/>}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{trans.itemName}</p>
                  <p className="text-sm text-gray-600">{trans.type==='in'?'Masuk':'Keluar'} - {trans.quantity} unit</p>
                </div>
                <p className="text-sm text-gray-500">{trans.date}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Peminjaman Aktif</h3>
            <a href="/borrowing" className="text-blue-600 text-sm hover:underline">Lihat Semua</a>
          </div>
          <div className="space-y-3">
            {borrowings.filter(b=>b.status==='borrowed').map(borrow=>(
              <div key={borrow.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <User size={20}/>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{borrow.itemName}</p>
                  <p className="text-sm text-gray-600">{borrow.userName} - {borrow.quantity} unit</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Kembali:</p>
                  <p className="text-sm font-medium text-gray-800">{borrow.expectedReturn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
