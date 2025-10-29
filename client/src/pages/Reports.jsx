
import React from 'react'
import { Package, TrendingUp, TrendingDown, History, AlertCircle, DollarSign, Download } from 'lucide-react'

export default function Reports(){
  const cards = [
    { icon: Package, title: 'Laporan Stok Barang', desc: 'Daftar lengkap semua barang dengan status stok terkini' },
    { icon: TrendingUp, title: 'Laporan Barang Masuk', desc: 'Riwayat barang masuk bulan ini' },
    { icon: TrendingDown, title: 'Laporan Barang Keluar', desc: 'Riwayat barang keluar bulan ini' },
    { icon: History, title: 'Laporan Peminjaman', desc: 'Data lengkap peminjaman dan pengembalian' },
    { icon: AlertCircle, title: 'Laporan Stok Menipis', desc: 'Barang yang perlu direstock segera' },
    { icon: DollarSign, title: 'Laporan Nilai Inventaris', desc: 'Total nilai aset inventaris perusahaan' },
  ]
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-800">Laporan</h1><p className="text-gray-600 mt-1">Lihat dan unduh laporan inventaris</p></div>
        <button className="btn-primary"><Download size={18}/> Export Semua Laporan</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map(({icon:Icon,title,desc})=> (
          <div key={title} className="card hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Icon size={32}/></div>
              <div className="flex-1"><h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3><p className="text-gray-600 text-sm mb-4">{desc}</p>
                <button className="btn-secondary text-sm"><Download size={16}/> Download PDF</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
