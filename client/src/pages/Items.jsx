import React, { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Eye, Edit2, Trash2, Download } from 'lucide-react'
import api from '../api'

export default function Items(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [form, setForm] = useState({})
  const [modal, setModal] = useState(null) 
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [borrowForm, setBorrowForm] = useState({ itemId: null, quantity: 1, expectedReturn: '', notes: '' })
  
  const load = async ()=>{
    const { data } = await api.get('/items'); setItems(data)
  }
  useEffect(()=>{ load() }, [])

  const filtered = useMemo(()=>items.filter(it=>{
    const q = search.toLowerCase()
    const match = it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q)
    const cat = category==='all' || it.category===category
    return match && cat
  }),[items,search,category])

  const submit = async (e)=>{
    e.preventDefault()
    if (modal==='add'){
      const { data } = await api.post('/items', form)
      setItems([...items, data])
    } else if (modal==='edit'){
      const { data } = await api.put(`/items/${form.id}`, form)
      setItems(items.map(i=>i.id===data.id?data:i))
    }
    setModal(null); setForm({})
  }

  const del = async (id)=>{
    if (!confirm('Hapus item ini?')) return
    await api.delete(`/items/${id}`)
    setItems(items.filter(i=>i.id!==id))
  }

  const submitBorrow = async (e)=>{
    e.preventDefault()
    await api.post('/borrowings', {
      itemId: borrowForm.itemId,
      quantity: borrowForm.quantity,
      expectedReturn: borrowForm.expectedReturn,
      notes: borrowForm.notes
    })
    setBorrowOpen(false)
    setBorrowForm({ itemId: null, quantity: 1, expectedReturn: '', notes: '' })
    const { data } = await api.get('/items'); setItems(data)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Data Barang</h1>
          <p className="text-gray-600 mt-1">Kelola semua barang inventaris Anda</p>
        </div>
        {user.role==='admin' && (
          <button onClick={()=>{setModal('add'); setForm({})}} className="btn-primary"><Plus size={18}/> Tambah Barang</button>
        )}
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="input pl-10" placeholder="Cari barang..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="input w-48" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="all">Semua Kategori</option>
            <option value="Elektronik">Elektronik</option>
            <option value="Furniture">Furniture</option>
            <option value="Aksesoris">Aksesoris</option>
          </select>
          <button className="btn-secondary"><Download size={18}/> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item=>(
          <div key={item.id} className="card hover:shadow-xl transition-all group">
            <div className="relative overflow-hidden rounded-lg mb-4">
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform"/>
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${item.stock<=item.minStock?'bg-red-500 text-white':'bg-green-500 text-white'}`}>
                Stok: {item.stock}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.code}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{item.category}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span> {item.location}</span>
                <span>✓ {item.condition}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>{setModal('view'); setForm(item)}} className="btn-secondary flex-1 text-sm"><Eye size={16}/> Detail</button>
                {user.role==='admin' && (<>
                  <button onClick={()=>{setModal('edit'); setForm(item)}} className="btn-icon text-blue-600 hover:bg-blue-50"><Edit2 size={16}/></button>
                  <button onClick={()=>del(item.id)} className="btn-icon text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                </>)}
                {user.role!=='admin' && (
                  <button
                    onClick={()=>{
                      setBorrowOpen(true);
                      setBorrowForm({ itemId: item.id, quantity: 1, expectedReturn: '', notes: '' })
                    }}
                    className="btn-primary text-sm"
                  >
                    Pinjam
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">{modal==='add'?'Tambah':'edit' in form ? 'Edit':'Detail'} Barang</h3>
              <button className="btn-icon" onClick={()=>setModal(null)}>✕</button>
            </div>
            {modal==='view' ? (
              <div className="space-y-2 text-sm">
                <p><b>Nama:</b> {form.name}</p>
                <p><b>Kode:</b> {form.code}</p>
                <p><b>Kategori:</b> {form.category}</p>
                <p><b>Lokasi:</b> {form.location}</p>
                <p><b>Kondisi:</b> {form.condition}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-2 gap-3">
                <input className="input col-span-2" placeholder="Nama" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/>
                <input className="input" placeholder="Kode" value={form.code||''} onChange={e=>setForm({...form,code:e.target.value})}/>
                <input className="input" placeholder="Kategori" value={form.category||''} onChange={e=>setForm({...form,category:e.target.value})}/>
                <input className="input" placeholder="Lokasi" value={form.location||''} onChange={e=>setForm({...form,location:e.target.value})}/>
                <input className="input" placeholder="Kondisi" value={form.condition||''} onChange={e=>setForm({...form,condition:e.target.value})}/>
                <input className="input" placeholder="Stok" type="number" value={form.stock||0} onChange={e=>setForm({...form,stock:+e.target.value})}/>
                <input className="input" placeholder="Min Stok" type="number" value={form.minStock||0} onChange={e=>setForm({...form,minStock:+e.target.value})}/>
                <input className="input col-span-2" placeholder="URL Gambar" value={form.image||''} onChange={e=>setForm({...form,image:e.target.value})}/>
                <div className="col-span-2 flex justify-end gap-2 mt-2">
                  <button type="button" className="btn-secondary" onClick={()=>setModal(null)}>Batal</button>
                  <button className="btn-primary">Simpan</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {borrowOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Pinjam Barang</h3>
              <button className="btn-icon" onClick={()=>setBorrowOpen(false)}>✕</button>
            </div>
            <form onSubmit={submitBorrow} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Barang</label>
                <input
                  className="input"
                  value={items.find(i=>i.id===borrowForm.itemId)?.name || ''}
                  disabled
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Jumlah</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={borrowForm.quantity}
                  onChange={e=>setBorrowForm({...borrowForm, quantity:+e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Jatuh Tempo</label>
                <input
                  className="input"
                  type="date"
                  value={borrowForm.expectedReturn}
                  onChange={e=>setBorrowForm({...borrowForm, expectedReturn:e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Catatan</label>
                <input
                  className="input"
                  placeholder="Keperluan peminjaman"
                  value={borrowForm.notes}
                  onChange={e=>setBorrowForm({...borrowForm, notes:e.target.value})}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={()=>setBorrowOpen(false)}>Batal</button>
                <button className="btn-primary">Pinjam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
