import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Package,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  RefreshCcw
} from 'lucide-react'
import api from '../api'

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

export default function ItemsIn() {
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState({
    itemId: '',
    quantity: 1,
    notes: '',
    totalPrice: 0
  })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

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

    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }))
    }, 2600)

    return () => clearTimeout(timer)
  }, [toast.open])

  const load = async () => {
    setLoading(true)

    try {
      const [i, t] = await Promise.all([
        api.get('/items'),
        api.get('/transactions')
      ])

      setItems(i.data || [])
      setTransactions(t.data || [])
    } catch (err) {
      showToast(
        'error',
        'Gagal memuat data',
        err?.response?.data?.error || err?.message || 'Data barang masuk gagal dimuat.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    const txIn = transactions.filter(t => t.type === 'in')

    return {
      itemsIn: txIn.reduce((s, t) => s + Number(t.quantity || 0), 0),
      transIn: txIn.length,
      totalNilai: txIn.reduce((s, t) => s + Number(t.totalPrice || 0), 0)
    }
  }, [transactions])

  const selectedItem = useMemo(() => {
    return items.find(item => String(item.id) === String(form.itemId)) || null
  }, [items, form.itemId])

  const resetForm = () => {
    setForm({
      itemId: '',
      quantity: 1,
      notes: '',
      totalPrice: 0
    })
  }

  const openAddModal = () => {
    resetForm()
    setOpen(true)
  }

  const closeAddModal = () => {
    if (saving) return
    setOpen(false)
    resetForm()
  }

  const submit = async e => {
    e.preventDefault()

    if (saving) return

    if (!form.itemId) {
      showToast(
        'warning',
        'Warning!',
        'Pilih barang terlebih dahulu.'
      )
      return
    }

    if (Number(form.quantity || 0) < 1) {
      showToast(
        'warning',
        'Warning!',
        'Jumlah barang masuk minimal 1.'
      )
      return
    }

    if (Number(form.totalPrice || 0) < 0) {
      showToast(
        'warning',
        'Warning!',
        'Total harga tidak boleh minus.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        itemId: form.itemId,
        quantity: Number(form.quantity || 1),
        notes: form.notes || '',
        totalPrice: Number(form.totalPrice || 0)
      }

      const { data } = await api.post('/transactions/in', payload)

      setTransactions(prev => [data, ...prev])
      setOpen(false)
      resetForm()

      const { data: itemsNew } = await api.get('/items')
      setItems(itemsNew || [])

      showToast(
        'success',
        'Success!',
        'Barang masuk berhasil dicatat dan stok berhasil diperbarui.'
      )
    } catch (err) {
      showToast(
        'error',
        'Gagal menyimpan',
        err?.response?.data?.error || err?.message || 'Barang masuk gagal disimpan.'
      )
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-800">Barang Masuk</h1>
          <p className="text-gray-600 mt-1">
            Catat barang masuk ke inventaris dan update stok secara otomatis
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={load}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCcw size={18} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>

          <button
            onClick={openAddModal}
            className="btn-primary"
          >
            <Plus size={18} />
            Tambah Barang Masuk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 text-white rounded-xl">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Masuk</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.itemsIn} unit
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl">
              <Package size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transaksi Masuk</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.transIn}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 text-white rounded-xl">
              Rp
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Nilai Masuk</p>
              <p className="text-xl font-bold text-gray-800">
                Rp {Number(stats.totalNilai || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Riwayat Barang Masuk
        </h3>

        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold text-gray-700">Tanggal</th>
              <th className="text-left p-3 font-semibold text-gray-700">Nama Barang</th>
              <th className="text-left p-3 font-semibold text-gray-700">Jumlah</th>
              <th className="text-left p-3 font-semibold text-gray-700">Petugas</th>
              <th className="text-left p-3 font-semibold text-gray-700">Keterangan</th>
              <th className="text-left p-3 font-semibold text-gray-700">Total Harga</th>
            </tr>
          </thead>

          <tbody>
            {transactions
              .filter(t => t.type === 'in')
              .map(trans => (
                <tr
                  key={trans.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-3 text-gray-700">{trans.date}</td>
                  <td className="p-3 font-medium text-gray-800">{trans.itemName}</td>
                  <td className="p-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      +{trans.quantity}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{trans.userName}</td>
                  <td className="p-3 text-gray-600">{trans.notes || '-'}</td>
                  <td className="p-3 text-gray-700 font-medium">
                    {Number(trans.totalPrice || 0) > 0
                      ? `Rp ${Number(trans.totalPrice || 0).toLocaleString('id-ID')}`
                      : '-'}
                  </td>
                </tr>
              ))}

            {transactions.filter(t => t.type === 'in').length === 0 && (
              <tr>
                <td className="p-6 text-gray-500" colSpan={6}>
                  {loading ? 'Memuat data...' : 'Belum ada riwayat barang masuk.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-50">
          <div className="card max-w-xl w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Tambah Barang Masuk
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pilih barang dan jumlah stok yang masuk ke inventaris.
                </p>
              </div>

              <button
                className="btn-icon"
                onClick={closeAddModal}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Pilih Barang
                </label>
                <select
                  className="input mt-1"
                  value={form.itemId}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      itemId: e.target.value
                    }))
                  }
                >
                  <option value="">Pilih Barang</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.code} | Stok: {item.stock}
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="font-semibold text-slate-800">
                    {selectedItem.name}
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                    <p><b>Kode:</b> {selectedItem.code}</p>
                    <p><b>Kategori:</b> {selectedItem.category}</p>
                    <p><b>Lokasi:</b> {selectedItem.location}</p>
                    <p><b>Stok saat ini:</b> {selectedItem.stock}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Jumlah Masuk
                  </label>
                  <input
                    className="input mt-1"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        quantity: e.target.value
                      }))
                    }
                    placeholder="Jumlah"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Total Harga
                  </label>
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    value={form.totalPrice}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        totalPrice: e.target.value
                      }))
                    }
                    placeholder="Opsional"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Catatan
                </label>
                <textarea
                  className="input mt-1 min-h-[100px] resize-none"
                  value={form.notes}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))
                  }
                  placeholder="Contoh: Pembelian baru, hibah, perbaikan stok, dll."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeAddModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Barang Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}