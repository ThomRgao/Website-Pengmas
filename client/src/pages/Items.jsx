import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Package,
  Tag,
  MapPin,
  Boxes,
  BadgeDollarSign,
  CheckCircle2,
  AlertTriangle,
  Info,
  X
} from 'lucide-react'
import api from '../api'

const emptyBorrowForm = {
  itemId: null,
  borrowType: 'peminjaman',
  quantity: 1,
  expectedReturn: '',
  notes: '',
  borrowerName: '',
  borrowerPhone: '',
  borrowerAddress: '',
  paymentProof: '',
  paymentProofName: ''
}

const emptyItemForm = {
  name: '',
  code: '',
  category: '',
  location: '',
  condition: 'Baik',
  stock: 0,
  minStock: 0,
  price: 0,
  image: '',
  serviceMode: 'both'
}

function serviceModeLabel(mode) {
  if (mode === 'borrow') return 'Peminjaman'
  if (mode === 'rent') return 'Penyewaan'
  return 'Peminjaman & Penyewaan'
}

function CenterToast({ open, type = 'success', title, message, onClose }) {
  if (!open) return null

  const themes = {
    success: {
      line: 'bg-emerald-500',
      iconWrap: 'bg-emerald-100 text-emerald-600',
      title: 'text-emerald-600',
      icon: <CheckCircle2 size={24} />
    },
    warning: {
      line: 'bg-orange-500',
      iconWrap: 'bg-orange-100 text-orange-500',
      title: 'text-orange-500',
      icon: <AlertTriangle size={24} />
    },
    error: {
      line: 'bg-rose-500',
      iconWrap: 'bg-rose-100 text-rose-500',
      title: 'text-rose-500',
      icon: <X size={24} />
    },
    info: {
      line: 'bg-blue-500',
      iconWrap: 'bg-blue-100 text-blue-500',
      title: 'text-blue-500',
      icon: <Info size={24} />
    }
  }

  const current = themes[type] || themes.info

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 backdrop-blur-[2px] px-4">
      <div className="w-full max-w-[760px] animate-[toastPop_.22s_ease-out]">
        <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className={`w-1.5 self-stretch rounded-full ${current.line}`}></div>

            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm shrink-0 ${current.iconWrap}`}>
              {current.icon}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className={`text-2xl sm:text-3xl font-extrabold ${current.title}`}>
                {title}
              </h3>
              <p className="mt-2 text-slate-600 text-base sm:text-lg leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 flex items-center justify-center shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Items() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isAdmin = user?.role === 'admin'

  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [form, setForm] = useState(emptyItemForm)
  const [modal, setModal] = useState(null)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [borrowForm, setBorrowForm] = useState(emptyBorrowForm)
  const [imageMode, setImageMode] = useState('url')
  const [uploadName, setUploadName] = useState('')
  const [paymentUploadName, setPaymentUploadName] = useState('')

  const [toast, setToast] = useState({
    open: false,
    type: 'success',
    title: '',
    message: ''
  })

  const showToast = (type, title, message) => {
    setToast({
      open: true,
      type,
      title,
      message
    })
  }

  useEffect(() => {
    if (!toast.open) return
    const t = setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }))
    }, 2600)
    return () => clearTimeout(t)
  }, [toast.open])

  const load = async () => {
    const { data } = await api.get('/items')
    setItems(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const categoryOptions = useMemo(() => {
    const raw = items.map(it => it.category).filter(Boolean)
    return [...new Set(raw)]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(it => {
      const q = search.toLowerCase().trim()
      const text = [it.name, it.code, it.category, it.location, it.condition]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchSearch = !q || text.includes(q)
      const matchCategory = category === 'all' || it.category === category
      const mode = String(it.serviceMode || 'both')
      const matchService = serviceFilter === 'all' || mode === serviceFilter

      return matchSearch && matchCategory && matchService
    })
  }, [items, search, category, serviceFilter])

  const summary = useMemo(() => {
    const totalJenis = items.length
    const totalUnit = items.reduce((sum, item) => sum + Number(item.stock || 0), 0)
    const totalBorrowOnly = items.filter(item => item.serviceMode === 'borrow').length
    const totalRentOnly = items.filter(item => item.serviceMode === 'rent').length
    const totalBoth = items.filter(item => item.serviceMode === 'both' || !item.serviceMode).length

    return {
      totalJenis,
      totalUnit,
      totalBorrowOnly,
      totalRentOnly,
      totalBoth
    }
  }, [items])

  const resetItemFormState = () => {
    setForm(emptyItemForm)
    setImageMode('url')
    setUploadName('')
  }

  const submit = async e => {
    e.preventDefault()

    const payload = {
      ...form,
      stock: Number(form.stock || 0),
      minStock: Number(form.minStock || 0),
      price: Number(form.price || 0),
      serviceMode: form.serviceMode || 'both'
    }

    if (!payload.name || !payload.code || !payload.category || !payload.location) {
      showToast(
        'warning',
        'Warning!',
        'Nama, kode, kategori, dan lokasi wajib diisi terlebih dahulu.'
      )
      return
    }

    if (!payload.image) {
      showToast(
        'warning',
        'Warning!',
        'Gambar barang wajib diisi, bisa menggunakan URL atau upload file.'
      )
      return
    }

    if (modal === 'add') {
      const { data } = await api.post('/items', payload)
      setItems(prev => [...prev, data])
      showToast('success', 'Success!', 'Data barang baru berhasil ditambahkan.')
    } else if (modal === 'edit') {
      const { data } = await api.put(`/items/${form.id}`, payload)
      setItems(prev => prev.map(item => (item.id === data.id ? data : item)))
      showToast('success', 'Success!', 'Data barang berhasil diperbarui.')
    }

    setModal(null)
    resetItemFormState()
  }

  const del = async id => {
    if (!confirm('Hapus item ini?')) return
    await api.delete(`/items/${id}`)
    setItems(prev => prev.filter(item => item.id !== id))
    showToast('success', 'Success!', 'Data barang berhasil dihapus.')
  }

  const submitBorrow = async e => {
    e.preventDefault()

    if (!borrowForm.borrowerName || !borrowForm.borrowerPhone) {
      showToast(
        'warning',
        'Warning!',
        'Nama dan nomor HP wajib diisi terlebih dahulu.'
      )
      return
    }

    if (borrowForm.borrowType === 'penyewaan' && !borrowForm.paymentProof) {
      showToast(
        'warning',
        'Warning!',
        'Bukti pembayaran wajib diupload untuk penyewaan.'
      )
      return
    }

    await api.post('/borrowings', {
      itemId: borrowForm.itemId,
      borrowType: borrowForm.borrowType,
      quantity: Number(borrowForm.quantity || 1),
      expectedReturn: borrowForm.expectedReturn,
      notes: borrowForm.notes,
      borrowerName: borrowForm.borrowerName,
      borrowerPhone: borrowForm.borrowerPhone,
      borrowerAddress: borrowForm.borrowerAddress,
      paymentProof: borrowForm.paymentProof,
      paymentProofName: borrowForm.paymentProofName
    })

    setBorrowOpen(false)
    setBorrowForm(emptyBorrowForm)
    setPaymentUploadName('')

    const { data } = await api.get('/items')
    setItems(data || [])

    showToast(
      'success',
      'Success!',
      borrowForm.borrowType === 'penyewaan'
        ? 'Pengajuan penyewaan berhasil dikirim.'
        : 'Pengajuan peminjaman berhasil dikirim.'
    )
  }

  const onSelectFile = async file => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({ ...prev, image: reader.result }))
      setUploadName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const onSelectPaymentFile = async file => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setBorrowForm(prev => ({
        ...prev,
        paymentProof: reader.result,
        paymentProofName: file.name || 'bukti-pembayaran'
      }))
      setPaymentUploadName(file.name || 'bukti-pembayaran')
    }
    reader.readAsDataURL(file)
  }

  const openAddModal = () => {
    setModal('add')
    setForm({
      ...emptyItemForm,
      stock: 0,
      minStock: 0,
      price: 0,
      condition: 'Baik',
      serviceMode: 'both'
    })
    setImageMode('url')
    setUploadName('')
  }

  const openEditModal = item => {
    setModal('edit')
    setForm({
      ...emptyItemForm,
      ...item,
      stock: Number(item.stock || 0),
      minStock: Number(item.minStock || 0),
      price: Number(item.price || 0),
      serviceMode: item.serviceMode || 'both'
    })
    setImageMode('url')
    setUploadName('')
  }

  const openViewModal = item => {
    setModal('view')
    setForm({
      ...emptyItemForm,
      ...item,
      serviceMode: item.serviceMode || 'both'
    })
  }

  const openBorrowModal = (item, borrowType = 'peminjaman') => {
    setBorrowOpen(true)
    setBorrowForm({
      ...emptyBorrowForm,
      itemId: item.id,
      borrowType,
      quantity: 1
    })
    setPaymentUploadName('')
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <style>{`
        @keyframes toastPop {
          0% { opacity: 0; transform: scale(.94) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <CenterToast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Data Barang</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Kelola semua barang inventaris, termasuk jenis layanan pinjam atau sewa'
              : 'Lihat barang yang tersedia dan ajukan layanan sesuai jenis barang'}
          </p>
        </div>

        {isAdmin && (
          <button onClick={openAddModal} className="btn-primary">
            <Plus size={18} /> Tambah Barang
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <p className="text-sm text-gray-600">Total Jenis Barang</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{summary.totalJenis}</p>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
          <p className="text-sm text-gray-600">Total Unit</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{summary.totalUnit}</p>
        </div>

        <div className="card bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100">
          <p className="text-sm text-gray-600">Khusus Pinjam</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{summary.totalBorrowOnly}</p>
        </div>

        <div className="card bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
          <p className="text-sm text-gray-600">Khusus Sewa</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{summary.totalRentOnly}</p>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
          <p className="text-sm text-gray-600">Pinjam & Sewa</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{summary.totalBoth}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px] relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="input pl-10"
              placeholder="Cari barang..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input w-56"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {categoryOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            className="input w-64"
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
          >
            <option value="all">Semua Layanan</option>
            <option value="borrow">Peminjaman</option>
            <option value="rent">Penyewaan</option>
            <option value="both">Peminjaman & Penyewaan</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => {
          const available = Number(item.stock || 0) > 0
          const mode = item.serviceMode || 'both'
          const allowBorrow = mode === 'borrow' || mode === 'both'
          const allowRent = mode === 'rent' || mode === 'both'

          return (
            <div key={item.id} className="card hover:shadow-xl transition-all group">
              <div className="relative overflow-hidden rounded-lg mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform"
                />
                <div
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                    item.stock <= (item.minStock ?? 0)
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  Stok: {item.stock}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.code}</p>
                  </div>

                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full shrink-0">
                    {item.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-gray-500">Lokasi</p>
                    <p className="font-semibold text-gray-800">{item.location}</p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-gray-500">Kondisi</p>
                    <p className="font-semibold text-gray-800">{item.condition}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">Jenis Layanan</p>
                  <p className="font-semibold text-slate-800">{serviceModeLabel(mode)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">Harga / Nilai Barang</p>
                  <p className="font-semibold text-slate-800">
                    Rp {Number(item.price || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => openViewModal(item)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    <Eye size={16} /> Detail
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEditModal(item)}
                        className="btn-icon text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => del(item.id)}
                        className="btn-icon text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>

                {!isAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      disabled={!available || !allowBorrow}
                      onClick={() => openBorrowModal(item, 'peminjaman')}
                      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium transition ${
                        !available || !allowBorrow
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Pinjam
                    </button>

                    <button
                      disabled={!available || !allowRent}
                      onClick={() => openBorrowModal(item, 'penyewaan')}
                      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium transition ${
                        !available || !allowRent
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                      }`}
                    >
                      Sewa
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center text-gray-500 py-10">
          Tidak ada barang yang sesuai dengan filter saat ini.
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-50 overflow-auto">
          <div className="card max-w-2xl w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">
                {modal === 'add'
                  ? 'Tambah Barang'
                  : modal === 'edit'
                  ? 'Edit Barang'
                  : 'Detail Barang'}
              </h3>
              <button
                className="btn-icon"
                onClick={() => {
                  setModal(null)
                  resetItemFormState()
                }}
              >
                ✕
              </button>
            </div>

            {modal === 'view' ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-gray-800 mb-2">Informasi Utama</p>
                    <div className="space-y-2">
                      <p><b>Nama:</b> {form.name}</p>
                      <p><b>Kode:</b> {form.code}</p>
                      <p><b>Kategori:</b> {form.category}</p>
                      <p><b>Lokasi:</b> {form.location}</p>
                      <p><b>Kondisi:</b> {form.condition}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-gray-800 mb-2">Stok & Layanan</p>
                    <div className="space-y-2">
                      <p><b>Stok:</b> {form.stock}</p>
                      <p><b>Minimal Stok:</b> {form.minStock ?? 0}</p>
                      <p><b>Harga:</b> Rp {Number(form.price || 0).toLocaleString('id-ID')}</p>
                      <p><b>Layanan:</b> {serviceModeLabel(form.serviceMode || 'both')}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <img
                    src={form.image}
                    alt={form.name}
                    className="w-full h-72 object-cover rounded-2xl"
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-2 gap-3">
                <input
                  className="input col-span-2"
                  placeholder="Nama"
                  value={form.name || ''}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />

                <input
                  className="input"
                  placeholder="Kode"
                  value={form.code || ''}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                />

                <input
                  className="input"
                  placeholder="Kategori"
                  value={form.category || ''}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                />

                <input
                  className="input"
                  placeholder="Lokasi"
                  value={form.location || ''}
                  onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                />

                <select
                  className="input"
                  value={form.condition || 'Baik'}
                  onChange={e => setForm(prev => ({ ...prev, condition: e.target.value }))}
                >
                  <option value="Baik">Baik</option>
                  <option value="Kurang Baik">Kurang Baik</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                </select>

                <div className="col-span-1">
                  <label className="text-sm text-gray-600">Stok</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.stock ?? 0}
                    onChange={e => setForm(prev => ({ ...prev, stock: +e.target.value }))}
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-sm text-gray-600">Minimal Stok</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.minStock ?? 0}
                    onChange={e => setForm(prev => ({ ...prev, minStock: +e.target.value }))}
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-sm text-gray-600">Harga / Nilai Barang</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.price ?? 0}
                    onChange={e => setForm(prev => ({ ...prev, price: +e.target.value }))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm text-gray-600 block mb-1">Jenis Layanan Barang</label>
                  <select
                    className="input"
                    value={form.serviceMode || 'both'}
                    onChange={e => setForm(prev => ({ ...prev, serviceMode: e.target.value }))}
                  >
                    <option value="borrow">Hanya untuk Peminjaman</option>
                    <option value="rent">Hanya untuk Penyewaan</option>
                    <option value="both">Bisa Peminjaman & Penyewaan</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        imageMode === 'url'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Pakai URL
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        imageMode === 'upload'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageMode === 'url' ? (
                    <input
                      className="input"
                      placeholder="URL Gambar"
                      value={form.image || ''}
                      onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                    />
                  ) : (
                    <label className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => onSelectFile(e.target.files?.[0])}
                      />
                      <div className="input cursor-pointer text-gray-600">
                        {uploadName || 'Pilih file gambar'}
                      </div>
                    </label>
                  )}
                </div>

                {form.image && (
                  <div className="col-span-2">
                    <img
                      src={form.image}
                      alt="preview"
                      className="w-full h-44 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="col-span-2 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setModal(null)
                      resetItemFormState()
                    }}
                  >
                    Batal
                  </button>
                  <button className="btn-primary">Simpan</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {borrowOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 overflow-auto z-50">
          <div className="card max-w-2xl w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">
                Form {borrowForm.borrowType === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'}
              </h3>
              <button
                className="btn-icon"
                onClick={() => {
                  setBorrowOpen(false)
                  setBorrowForm(emptyBorrowForm)
                  setPaymentUploadName('')
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitBorrow} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Barang</label>
                <input
                  className="input"
                  value={items.find(i => i.id === borrowForm.itemId)?.name || ''}
                  disabled
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Nama</label>
                <input
                  className="input"
                  value={borrowForm.borrowerName}
                  onChange={e =>
                    setBorrowForm(prev => ({ ...prev, borrowerName: e.target.value }))
                  }
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">No. HP</label>
                <input
                  className="input"
                  value={borrowForm.borrowerPhone}
                  onChange={e =>
                    setBorrowForm(prev => ({ ...prev, borrowerPhone: e.target.value }))
                  }
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-600">Alamat</label>
                <input
                  className="input"
                  value={borrowForm.borrowerAddress}
                  onChange={e =>
                    setBorrowForm(prev => ({ ...prev, borrowerAddress: e.target.value }))
                  }
                  placeholder="Alamat peminjam / penyewa"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Jumlah</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={borrowForm.quantity}
                  onChange={e =>
                    setBorrowForm(prev => ({ ...prev, quantity: +e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Tanggal Rencana Kembali</label>
                <input
                  className="input"
                  type="date"
                  value={borrowForm.expectedReturn}
                  onChange={e =>
                    setBorrowForm(prev => ({
                      ...prev,
                      expectedReturn: e.target.value
                    }))
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-600">Catatan Keperluan</label>
                <input
                  className="input"
                  placeholder="Keperluan peminjaman / penyewaan"
                  value={borrowForm.notes}
                  onChange={e =>
                    setBorrowForm(prev => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>

              {borrowForm.borrowType === 'penyewaan' && (
                <>
                  <div className="col-span-2 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <p className="font-semibold text-violet-900">
                      Upload Bukti Pembayaran
                    </p>
                    <p className="text-sm text-violet-700 mt-1">
                      Untuk penyewaan, bukti pembayaran wajib dikirim sebelum pengajuan diproses admin.
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => onSelectPaymentFile(e.target.files?.[0])}
                      />
                      <div className="input cursor-pointer text-gray-600">
                        {paymentUploadName || 'Upload bukti pembayaran'}
                      </div>
                    </label>
                  </div>

                  {borrowForm.paymentProof && (
                    <div className="col-span-2">
                      <img
                        src={borrowForm.paymentProof}
                        alt="Bukti Pembayaran"
                        className="w-full h-52 object-cover rounded-2xl border border-gray-200"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setBorrowOpen(false)
                    setBorrowForm(emptyBorrowForm)
                    setPaymentUploadName('')
                  }}
                >
                  Batal
                </button>
                <button className="btn-primary">
                  Ajukan {borrowForm.borrowType === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}