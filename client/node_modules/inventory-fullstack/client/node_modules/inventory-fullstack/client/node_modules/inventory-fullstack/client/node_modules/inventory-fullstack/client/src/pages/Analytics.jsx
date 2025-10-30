import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import ReactApexChart from 'react-apexcharts'

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

  const trendSeries = useMemo(()=>{
    const map = {}
    transactions.forEach(t=>{
      const d = (t.date||'').slice(0,10)
      if(!d) return
      if(!map[d]) map[d] = { in:0, out:0 }
      if(t.type==='in') map[d].in += Number(t.quantity||0)
      if(t.type==='out') map[d].out += Number(t.quantity||0)
    })
    const dates = Object.keys(map).sort()
    const masuk = dates.map(d=>({ x: new Date(d).getTime(), y: map[d].in }))
    const keluar = dates.map(d=>({ x: new Date(d).getTime(), y: map[d].out }))
    return [
      { name: 'Masuk', data: masuk },
      { name: 'Keluar', data: keluar }
    ]
  },[transactions])

  const lineOptions = {
    chart: { type: 'area', stacked: false, height: 350, zoom: { type: 'x', enabled: true, autoScaleYaxis: true }, toolbar: { autoSelected: 'zoom' } },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    title: { text: 'Tren Barang Masuk & Keluar', align: 'left' },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, inverseColors: false, opacityFrom: 0.5, opacityTo: 0, stops: [0, 90, 100] } },
    yaxis: { labels: { formatter: v => String(Math.round(v)) }, title: { text: 'Unit' } },
    xaxis: { type: 'datetime' },
    tooltip: { shared: false, y: { formatter: v => String(Math.round(v)) } }
  }

  const categoryData = useMemo(()=>{
    const m = {}
    items.forEach(it=>{
      const k = it.category||'Lainnya'
      m[k] = (m[k]||0) + Number(it.stock||0)
    })
    const cats = Object.keys(m)
    const vals = cats.map(k=>m[k])
    return { cats, vals }
  },[items])

  const barOptions = {
    chart: { height: 350, type: 'bar' },
    plotOptions: { bar: { borderRadius: 10, dataLabels: { position: 'top' } } },
    dataLabels: { enabled: true, formatter: val => String(val), offsetY: -20, style: { fontSize: '12px', colors: ['#304758'] } },
    xaxis: {
      categories: categoryData.cats,
      position: 'top',
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { fill: { type: 'gradient', gradient: { colorFrom: '#D8E3F0', colorTo: '#BED1E6', stops: [0,100], opacityFrom: 0.4, opacityTo: 0.5 } } },
      tooltip: { enabled: true }
    },
    yaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { show: false } },
    title: { text: 'Distribusi Stok per Kategori', floating: true, offsetY: 330, align: 'center', style: { color: '#444' } },
    grid: { strokeDashArray: 3 }
  }
  const barSeries = [{ name: 'Stok', data: categoryData.vals }]

  const topItemsData = useMemo(()=>{
    const sorted = [...items].sort((a,b)=>(b.stock||0)-(a.stock||0)).slice(0,10)
    return sorted.map(it=>({ x: it.name, y: Number(it.stock||0) }))
  },[items])

  const topOptions = {
    chart: { height: 350, type: 'bar' },
    plotOptions: { bar: { columnWidth: '60%' } },
    colors: ['#00E396'],
    dataLabels: { enabled: false },
    legend: { show: true, showForSingleSeries: true, customLegendItems: ['Actual'], markers: { fillColors: ['#00E396'] } },
    xaxis: { type: 'category' },
    grid: { strokeDashArray: 3 },
    title: { text: 'Top 10 Stok Barang', align: 'left' }
  }
  const topSeries = [{ name: 'Actual', data: topItemsData }]

  const statusData = useMemo(()=>{
    const borrowedQty = borrowings.filter(b=>b.status==='borrowed').reduce((s,b)=>s+Number(b.quantity||0),0)
    const total = items.reduce((s,it)=>s+Number(it.stock||0),0)
    const available = Math.max(total - borrowedQty, 0)
    return [{name:'Tersedia', value:available}, {name:'Dipinjam', value:borrowedQty}]
  },[items,borrowings])

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
            <ReactApexChart options={lineOptions} series={trendSeries} type="area" height={350} />
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Distribusi Kategori</h3>
          <div className="h-80">
            <ReactApexChart options={barOptions} series={barSeries} type="bar" height={350} />
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Top 10 Stok Barang</h3>
          <div className="h-80">
            <ReactApexChart options={topOptions} series={topSeries} type="bar" height={350} />
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Komposisi Status</h3>
          <div className="h-80">
            <ReactApexChart
              options={{
                labels: statusData.map(d=>d.name),
                legend: { position: 'bottom' }
              }}
              series={statusData.map(d=>d.value)}
              type="pie"
              height={350}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
