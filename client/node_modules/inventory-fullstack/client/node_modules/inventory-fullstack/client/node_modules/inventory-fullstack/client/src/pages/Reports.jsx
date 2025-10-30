import React, { useEffect, useMemo, useState } from 'react'
import { Package, TrendingUp, TrendingDown, History, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../api'

function toISO(d){ return new Date(d).toISOString().slice(0,10) }
function monthStartISO(){
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}
function todayISO(){ return toISO(new Date()) }
function inRange(dateStr, start, end){
  if(!dateStr) return false
  return dateStr >= start && dateStr <= end
}
function fmt(n){ return new Intl.NumberFormat('id-ID').format(n) }
function todayStr(){ return new Date().toLocaleDateString('id-ID') }

function makeHeader(doc, title){
  doc.setFont('helvetica','bold')
  doc.setFontSize(14)
  doc.text('INVENTORY SYSTEM', 14, 16)
  doc.setFont('helvetica','normal')
  doc.setFontSize(10)
  doc.text(`Tanggal: ${todayStr()}`, 200-14, 16, { align:'right' })
  doc.setFontSize(12)
  doc.text(title, 14, 26)
  doc.line(14, 28, 200-14, 28)
}
function makeFooter(doc){
  const pageCount = doc.getNumberOfPages()
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i)
    doc.setFontSize(9)
    doc.text(`Hal ${i} dari ${pageCount}`, 200-14, 290, { align:'right' })
  }
}

export default function Reports(){
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [borrowings, setBorrowings] = useState([])

  const [inStart, setInStart] = useState(monthStartISO())
  const [inEnd, setInEnd] = useState(todayISO())
  const [outStart, setOutStart] = useState(monthStartISO())
  const [outEnd, setOutEnd] = useState(todayISO())
  const [borStart, setBorStart] = useState(monthStartISO())
  const [borEnd, setBorEnd] = useState(todayISO())
  const [allStart, setAllStart] = useState(monthStartISO())
  const [allEnd, setAllEnd] = useState(todayISO())

  const load = async ()=>{
    setLoading(true)
    try{
      const [i,t,b] = await Promise.all([api.get('/items'), api.get('/transactions'), api.get('/borrowings')])
      setItems(i.data); setTransactions(t.data); setBorrowings(b.data)
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  const txIn = useMemo(()=>transactions.filter(x=>x.type==='in' && inRange(x.date, inStart, inEnd)),[transactions,inStart,inEnd])
  const txOut = useMemo(()=>transactions.filter(x=>x.type==='out' && inRange(x.date, outStart, outEnd)),[transactions,outStart,outEnd])
  const borFiltered = useMemo(()=>borrowings.filter(b=>inRange(b.borrowDate, borStart, borEnd)),[borrowings,borStart,borEnd])

  const downloadStock = ()=>{
    const doc = new jsPDF('p','mm','a4')
    makeHeader(doc, 'Laporan Stok Barang')
    const body = items.map((it,idx)=>[
      idx+1,
      it.code||'-',
      it.name||'-',
      it.category||'-',
      it.location||'-',
      it.condition||'-',
      fmt(it.stock||0),
      fmt(it.minStock||0),
      it.stock<=it.minStock?'Perlu Restok':'Aman'
    ])
    autoTable(doc, {
      startY: 34,
      head:[['No','Kode','Nama','Kategori','Lokasi','Kondisi','Stok','Min Stok','Status']],
      body,
      styles:{ fontSize:9, halign:'left', valign:'middle' },
      headStyles:{ fillColor:[37,99,235] }
    })
    makeFooter(doc)
    doc.save(`Laporan_Stok_${todayStr().replaceAll('/','-')}.pdf`)
  }

  const downloadIn = ()=>{
    const doc = new jsPDF('p','mm','a4')
    makeHeader(doc, `Laporan Barang Masuk ${inStart} s.d ${inEnd}`)
    const subtotal = txIn.reduce((s,x)=>s+(x.totalPrice||0),0)
    const body = txIn.map((t,idx)=>[
      idx+1,
      t.date||'-',
      t.itemName||'-',
      fmt(t.quantity||0),
      t.userName||'-',
      t.notes||'-',
      t.totalPrice?`Rp ${fmt(t.totalPrice)}`:'-'
    ])
    autoTable(doc, {
      startY:34,
      head:[['No','Tanggal','Barang','Jumlah','Petugas','Keterangan']],
      body,
      styles:{ fontSize:9 },
      headStyles:{ fillColor:[16,185,129] }
    })
    const y = doc.lastAutoTable?.finalY || 34
    doc.setFontSize(10)
    doc.text(`Total transaksi: ${txIn.length}`, 14, y+8)
    makeFooter(doc)
    doc.save(`Laporan_Masuk_${inStart}_sd_${inEnd}.pdf`)
  }

  const downloadOut = ()=>{
    const doc = new jsPDF('p','mm','a4')
    makeHeader(doc, `Laporan Barang Keluar ${outStart} s.d ${outEnd}`)
    const body = txOut.map((t,idx)=>[
      idx+1,
      t.date||'-',
      t.itemName||'-',
      fmt(t.quantity||0),
      t.userName||'-',
      t.notes||'-'
    ])
    autoTable(doc, {
      startY:34,
      head:[['No','Tanggal','Barang','Jumlah','Petugas','Keterangan']],
      body,
      styles:{ fontSize:9 },
      headStyles:{ fillColor:[239,68,68] }
    })
    const y = doc.lastAutoTable?.finalY || 34
    const totalKeluar = txOut.reduce((s,x)=>s+(x.quantity||0),0)
    doc.setFontSize(10)
    doc.text(`Total transaksi keluar: ${txOut.length}`, 14, y+8)
    doc.text(`Total unit keluar: ${fmt(totalKeluar)}`, 14, y+14)
    makeFooter(doc)
    doc.save(`Laporan_Keluar_${outStart}_sd_${outEnd}.pdf`)
  }

  const downloadBorrow = ()=>{
    const doc = new jsPDF('p','mm','a4')
    makeHeader(doc, `Laporan Peminjaman ${borStart} s.d ${borEnd}`)
    const body = borFiltered.map((b,idx)=>[
      idx+1,
      b.itemName||'-',
      b.userName||'-',
      fmt(b.quantity||0),
      b.borrowDate||'-',
      b.expectedReturn||'-',
      b.returnDate||'-',
      b.status==='pending'?'Menunggu ACC':b.status==='borrowed'?'Dipinjam':b.status==='returned'?'Dikembalikan':'Ditolak',
      b.notes||'-'
    ])
    autoTable(doc, {
      startY:34,
      head:[['No','Barang','Peminjam','Jumlah','Tgl Pinjam','Jatuh Tempo','Tgl Kembali','Status','Catatan']],
      body,
      styles:{ fontSize:8 },
      headStyles:{ fillColor:[234,179,8] }
    })
    const y = doc.lastAutoTable?.finalY || 34
    const aktif = borFiltered.filter(b=>b.status==='borrowed').length
    const kembali = borFiltered.filter(b=>b.status==='returned').length
    const pending = borFiltered.filter(b=>b.status==='pending').length
    const tolak = borFiltered.filter(b=>b.status==='rejected').length
    doc.setFontSize(10)
    doc.text(`Total: ${borFiltered.length} | Dipinjam: ${aktif} | Dikembalikan: ${kembali} | Pending: ${pending} | Ditolak: ${tolak}`, 14, y+8)
    makeFooter(doc)
    doc.save(`Laporan_Peminjaman_${borStart}_sd_${borEnd}.pdf`)
  }

  const downloadAll = ()=>{
    const doc = new jsPDF('p','mm','a4')
    const txInAll = transactions.filter(x=>x.type==='in' && inRange(x.date, allStart, allEnd))
    const txOutAll = transactions.filter(x=>x.type==='out' && inRange(x.date, allStart, allEnd))
    const borAll = borrowings.filter(b=>inRange(b.borrowDate, allStart, allEnd))

    makeHeader(doc, `Laporan Ringkas Inventaris ${allStart} s.d ${allEnd}`)
    doc.setFontSize(10)
    doc.text('Ringkasan',14,34)
    autoTable(doc, {
      startY:38,
      head:[['Metrik']],
      body:[
        ['Total Item', fmt(items.length)],
        ['Total Stok', fmt(items.reduce((s,x)=>s+(x.stock||0),0))],
        ['Transaksi Masuk (rentang)', fmt(txInAll.length)],
        ['Transaksi Keluar (rentang)', fmt(txOutAll.length)],
        ['Peminjaman Aktif (rentang)', fmt(borAll.filter(b=>b.status==='borrowed').length)]
      ],
      styles:{ fontSize:9 },
      headStyles:{ fillColor:[59,130,246] }
    })

    doc.addPage()
    makeHeader(doc, 'Lampiran A: Stok Barang')
    autoTable(doc, {
      startY:34,
      head:[['No','Kode','Nama','Kategori','Lokasi','Kondisi','Stok','Min Stok','Status']],
      body: items.map((it,idx)=>[
        idx+1,it.code||'-',it.name||'-',it.category||'-',it.location||'-',it.condition||'-',fmt(it.stock||0),fmt(it.minStock||0),it.stock<=it.minStock?'Perlu Restok':'Aman'
      ]),
      styles:{ fontSize:8 },
      headStyles:{ fillColor:[37,99,235] }
    })

    doc.addPage()
    makeHeader(doc, `Lampiran B: Barang Masuk ${allStart} s.d ${allEnd}`)
    autoTable(doc, {
      startY:34,
      head:[['No','Tanggal','Barang','Jumlah','Petugas','Keterangan']],
      body: txInAll.map((t,idx)=>[idx+1,t.date||'-',t.itemName||'-',fmt(t.quantity||0),t.userName||'-',t.notes||'-',t.totalPrice?`Rp ${fmt(t.totalPrice)}`:'-']),
      styles:{ fontSize:8 },
      headStyles:{ fillColor:[16,185,129] }
    })

    doc.addPage()
    makeHeader(doc, `Lampiran C: Barang Keluar ${allStart} s.d ${allEnd}`)
    autoTable(doc, {
      startY:34,
      head:[['No','Tanggal','Barang','Jumlah','Petugas','Keterangan']],
      body: txOutAll.map((t,idx)=>[idx+1,t.date||'-',t.itemName||'-',fmt(t.quantity||0),t.userName||'-',t.notes||'-']),
      styles:{ fontSize:8 },
      headStyles:{ fillColor:[239,68,68] }
    })

    doc.addPage()
    makeHeader(doc, `Lampiran D: Peminjaman ${allStart} s.d ${allEnd}`)
    autoTable(doc, {
      startY:34,
      head:[['No','Barang','Peminjam','Jumlah','Tgl Pinjam','Jatuh Tempo','Tgl Kembali','Status','Catatan']],
      body: borAll.map((b,idx)=>[
        idx+1,b.itemName||'-',b.userName||'-',fmt(b.quantity||0),b.borrowDate||'-',b.expectedReturn||'-',b.returnDate||'-',b.status==='pending'?'Menunggu ACC':b.status==='borrowed'?'Dipinjam':b.status==='returned'?'Dikembalikan':'Ditolak',b.notes||'-'
      ]),
      styles:{ fontSize:8 },
      headStyles:{ fillColor:[234,179,8] }
    })

    makeFooter(doc)
    doc.save(`Laporan_Inventaris_${allStart}_sd_${allEnd}.pdf`)
  }

  const cards = [
    { icon: Package, title: 'Laporan Stok Barang', desc: 'Daftar lengkap semua barang dengan status stok terkini', onClick: downloadStock, range: null },
    { icon: TrendingUp, title: 'Laporan Barang Masuk', desc: 'Riwayat barang masuk pada rentang waktu terpilih', onClick: downloadIn, range: {start: inStart, end: inEnd, setStart: setInStart, setEnd: setInEnd} },
    { icon: TrendingDown, title: 'Laporan Barang Keluar', desc: 'Riwayat barang keluar pada rentang waktu terpilih', onClick: downloadOut, range: {start: outStart, end: outEnd, setStart: setOutStart, setEnd: setOutEnd} },
    { icon: History, title: 'Laporan Peminjaman', desc: 'Data peminjaman dan pengembalian pada rentang waktu terpilih', onClick: downloadBorrow, range: {start: borStart, end: borEnd, setStart: setBorStart, setEnd: setBorEnd} }
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Laporan</h1>
          <p className="text-gray-600 mt-1">Lihat dan unduh laporan inventaris</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Dari</label>
            <input type="date" className="input h-10" value={allStart} max={allEnd} onChange={e=>setAllStart(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Sampai</label>
            <input type="date" className="input h-10" value={allEnd} min={allStart} onChange={e=>setAllEnd(e.target.value)} />
          </div>
          <button disabled={loading} onClick={downloadAll} className="btn-primary h-10 mt-5 disabled:opacity-60 disabled:cursor-not-allowed"><Download size={18}/> Export Semua</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map(({icon:Icon,title,desc,onClick,range})=>(
          <div key={title} className="card hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Icon size={32}/></div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm mb-4">{desc}</p>
                {range && (
                  <div className="flex items-end gap-2 mb-3">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Dari</label>
                      <input type="date" className="input h-10" value={range.start} max={range.end} onChange={e=>range.setStart(e.target.value)} />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Sampai</label>
                      <input type="date" className="input h-10" value={range.end} min={range.start} onChange={e=>range.setEnd(e.target.value)} />
                    </div>
                  </div>
                )}
                <button disabled={loading} onClick={onClick} className="btn-secondary text-sm disabled:opacity-60 disabled:cursor-not-allowed"><Download size={16}/> Download PDF</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
