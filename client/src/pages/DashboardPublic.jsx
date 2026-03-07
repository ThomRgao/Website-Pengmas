import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ShieldCheck,
  QrCode,
  Upload,
  Camera,
  Package,
  RotateCcw,
  CheckCircle2,
  X,
  Search,
  ChevronDown
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api'

const emptyBorrowForm = {
  borrowType: 'peminjaman',
  itemId: '',
  quantity: 1,
  expectedReturn: '',
  notes: '',
  borrowerName: '',
  borrowerEmail: '',
  borrowerPhone: '',
  borrowerInstitution: '',
  borrowerAddress: '',
  identityNumber: '',
  identityPhoto: ''
}

const emptyReturnForm = {
  itemId: '',
  returnerName: '',
  returnerPhone: '',
  conditionOnReturn: 'Baik',
  returnNotes: '',
  returnPhoto: ''
}

function SuccessToast({ open, title, message, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-[2px] px-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[26px] bg-[#c8f1d4] shadow-2xl border border-emerald-200 animate-[toastPop_.28s_ease-out]">
        <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-4 border-emerald-200 flex items-center justify-center shadow-md">
          <CheckCircle2 size={26} className="text-emerald-700" />
        </div>

        <div className="absolute right-10 top-3 w-3 h-3 rounded-full bg-emerald-900/60"></div>
        <div className="absolute right-24 top-10 w-12 h-12 rounded-full bg-emerald-900/50"></div>
        <div className="absolute right-4 top-3 w-28 h-28 rounded-full bg-emerald-900/45"></div>
        <div className="absolute left-3 bottom-2 w-10 h-10 rounded-full bg-emerald-900/35"></div>
        <div className="absolute left-0 bottom-0 w-5 h-5 rounded-full bg-emerald-900/45"></div>
        <div className="absolute left-12 bottom-8 w-2.5 h-2.5 rounded-full bg-emerald-900/50"></div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/70 hover:bg-white text-emerald-900 flex items-center justify-center transition"
        >
          <X size={18} />
        </button>

        <div className="pl-20 sm:pl-28 pr-14 sm:pr-16 py-6 sm:py-8">
          <h3 className="text-2xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            {title}
          </h3>
          <p className="mt-2 text-base sm:text-xl font-semibold text-emerald-900/80">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPublic() {
  const [items, setItems] = useState([])
  const [config, setConfig] = useState({ rentalQrLink: '' })

  const [borrowModalOpen, setBorrowModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)

  const [borrowForm, setBorrowForm] = useState(emptyBorrowForm)
  const [returnForm, setReturnForm] = useState(emptyReturnForm)

  const [borrowPreviewName, setBorrowPreviewName] = useState('')
  const [returnPreviewName, setReturnPreviewName] = useState('')

  const [toast, setToast] = useState({
    open: false,
    title: '',
    message: ''
  })

  const [returnSearch, setReturnSearch] = useState('')
  const [returnDropdownOpen, setReturnDropdownOpen] = useState(false)
  const returnPickerRef = useRef(null)

  const load = async () => {
    const [i, c] = await Promise.all([
      api.get('/items'),
      api.get('/public-config')
    ])
    setItems(i.data || [])
    setConfig(c.data || { rentalQrLink: '' })
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!toast.open) return
    const t = setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }))
    }, 2600)
    return () => clearTimeout(t)
  }, [toast.open])

  useEffect(() => {
    const onClickOutside = e => {
      if (
        returnDropdownOpen &&
        returnPickerRef.current &&
        !returnPickerRef.current.contains(e.target)
      ) {
        setReturnDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [returnDropdownOpen])

  const availableItems = useMemo(
    () => items.filter(i => Number(i.stock || 0) > 0),
    [items]
  )

  const showToast = (title, message) => {
    setToast({
      open: true,
      title,
      message
    })
  }

  const openBorrowModal = (item, borrowType) => {
    setBorrowForm({
      ...emptyBorrowForm,
      itemId: item.id,
      borrowType
    })
    setBorrowPreviewName('')
    setBorrowModalOpen(true)
  }

  const selectedReturnItem = useMemo(() => {
    return items.find(i => String(i.id) === String(returnForm.itemId)) || null
  }, [items, returnForm.itemId])

  const filteredReturnItems = useMemo(() => {
    const q = returnSearch.trim().toLowerCase()
    if (!q) return items

    return items.filter(item => {
      const text = [item.name, item.code, item.category, item.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(q)
    })
  }, [items, returnSearch])

  const handleSelectReturnItem = item => {
    setReturnForm(prev => ({ ...prev, itemId: item.id }))
    setReturnSearch(item.name)
    setReturnDropdownOpen(false)
  }

  const handleBorrowImage = file => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setBorrowForm(prev => ({ ...prev, identityPhoto: reader.result }))
      setBorrowPreviewName(file.name || 'Foto diambil dari kamera')
    }
    reader.readAsDataURL(file)
  }

  const handleReturnImage = file => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setReturnForm(prev => ({ ...prev, returnPhoto: reader.result }))
      setReturnPreviewName(file.name || 'Foto diambil dari kamera')
    }
    reader.readAsDataURL(file)
  }

  const submitBorrow = async e => {
    e.preventDefault()

    if (
      !borrowForm.borrowerName ||
      !borrowForm.borrowerPhone ||
      !borrowForm.borrowerInstitution ||
      !borrowForm.identityNumber ||
      !borrowForm.identityPhoto
    ) {
      alert('Lengkapi identitas dan upload/foto kartu identitas.')
      return
    }

    await api.post('/borrowings', borrowForm)

    const isRental = borrowForm.borrowType === 'penyewaan'
    setBorrowModalOpen(false)
    setBorrowForm(emptyBorrowForm)
    setBorrowPreviewName('')
    await load()

    showToast(
      isRental ? 'Penyewaan berhasil dikirim!' : 'Peminjaman berhasil dikirim!',
      isRental
        ? 'Form penyewaan Anda telah berhasil dikirim ke admin.'
        : 'Form peminjaman Anda telah berhasil dikirim ke admin.'
    )
  }

  const submitReturn = async e => {
    e.preventDefault()

    if (
      !returnForm.itemId ||
      !returnForm.returnerName ||
      !returnForm.returnerPhone ||
      !returnForm.returnPhoto
    ) {
      alert('Lengkapi data pengembalian dan upload/foto barang.')
      return
    }

    await api.post('/returns-public', {
      itemId: returnForm.itemId,
      returnerName: returnForm.returnerName,
      returnerPhone: returnForm.returnerPhone,
      conditionOnReturn: returnForm.conditionOnReturn,
      returnNotes: returnForm.returnNotes,
      returnPhoto: returnForm.returnPhoto
    })

    setReturnModalOpen(false)
    setReturnForm(emptyReturnForm)
    setReturnPreviewName('')
    setReturnSearch('')
    await load()

    showToast(
      'Pengembalian berhasil dikirim!',
      'Form pengembalian barang Anda telah berhasil dikirim ke admin.'
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes toastPop {
          0% { opacity: 0; transform: scale(.94) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <SuccessToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      />

      <section className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-md shrink-0"></div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 tracking-tight truncate">
                Layanan Peminjaman Inventaris
              </h1>
              <p className="text-sm text-slate-500">
                Lihat barang yang tersedia, ajukan peminjaman atau penyewaan, lalu kirim pengembalian.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setReturnModalOpen(true)}
              className="btn-secondary"
            >
              <RotateCcw size={18} />
              Form Pengembalian
            </button>

            <Link to="/login" className="btn-primary">
              <ShieldCheck size={18} />
              Login Admin
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <section className="rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white overflow-hidden relative shadow-xl">
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/10 -translate-y-10 translate-x-16"></div>
          <div className="absolute left-0 bottom-0 w-40 h-40 rounded-full bg-white/10 -translate-x-12 translate-y-10"></div>

          <div className="relative px-5 sm:px-8 py-8 sm:py-10 md:px-12 md:py-14 grid grid-cols-1 lg:grid-cols-[1.4fr_.8fr] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white text-sm font-semibold backdrop-blur-sm">
                <Package size={16} />
                Dashboard Publik
              </span>

              <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                Website peminjaman publik yang simpel, jelas, dan mudah dipakai
              </h2>

              <p className="mt-4 text-white/85 text-base sm:text-lg max-w-2xl">
                Pengunjung cukup memilih barang yang tersedia, lalu tekan tombol
                <span className="font-bold"> Peminjaman </span>
                atau
                <span className="font-bold"> Penyewaan</span>. Untuk pengembalian, gunakan form khusus yang tersedia di halaman ini.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-2xl bg-white/15 px-5 py-4 min-w-[160px] backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Barang tersedia</p>
                  <p className="text-3xl font-extrabold">{availableItems.length}</p>
                </div>
                <div className="rounded-2xl bg-white/15 px-5 py-4 min-w-[160px] backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Total barang</p>
                  <p className="text-3xl font-extrabold">{items.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 sm:p-6 border border-white/15">
              <h3 className="text-xl font-bold">Alur Penggunaan</h3>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <p className="font-semibold">Pilih barang</p>
                    <p className="text-sm text-white/80">Lihat ketersediaan stok langsung dari card barang.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <p className="font-semibold">Isi form</p>
                    <p className="text-sm text-white/80">Lengkapi identitas lalu pilih upload foto atau foto langsung.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <p className="font-semibold">Kirim pengembalian</p>
                    <p className="text-sm text-white/80">Cari barang, lalu upload foto atau ambil foto barang langsung.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Data Barang</h2>
            <p className="text-slate-500">
              Tekan tombol di masing-masing barang untuk memilih layanan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map(item => {
              const available = Number(item.stock || 0) > 0

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-[26px] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                          available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {available ? 'Tersedia' : 'Tidak Tersedia'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-extrabold text-slate-800">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-500">{item.code}</p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold shrink-0">
                        {item.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">Lokasi</p>
                        <p className="font-semibold text-slate-800">{item.location}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">Stok</p>
                        <p className="font-semibold text-slate-800">{item.stock}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <p className="text-slate-500">Kondisi</p>
                      <p className="font-semibold text-slate-800">{item.condition}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        disabled={!available}
                        onClick={() => openBorrowModal(item, 'peminjaman')}
                        className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold transition ${
                          available
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Peminjaman
                      </button>

                      <button
                        disabled={!available}
                        onClick={() => openBorrowModal(item, 'penyewaan')}
                        className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold transition ${
                          available
                            ? 'bg-violet-600 text-white hover:bg-violet-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Penyewaan
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {borrowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] p-3 sm:p-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                    Form {borrowForm.borrowType === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Lengkapi data dengan benar sebelum mengirim.
                  </p>
                </div>
                <button
                  onClick={() => setBorrowModalOpen(false)}
                  className="btn-icon shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto px-4 sm:px-6 py-5">
                <form onSubmit={submitBorrow} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {borrowForm.borrowType === 'penyewaan' && (
                    <div className="md:col-span-2 rounded-[24px] border border-violet-100 bg-violet-50 p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <QrCode size={20} className="text-violet-700" />
                        <p className="font-bold text-violet-900">QR Penyewaan</p>
                      </div>

                      {config?.rentalQrLink ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                              config.rentalQrLink
                            )}`}
                            alt="QR Penyewaan"
                            className="rounded-2xl border border-violet-200 bg-white p-3 w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] object-contain"
                          />
                          <a
                            href={config.rentalQrLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-violet-700 hover:underline break-all text-center"
                          >
                            {config.rentalQrLink}
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          QR penyewaan belum diatur admin.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600">Barang</label>
                    <input
                      className="input"
                      value={items.find(i => String(i.id) === String(borrowForm.itemId))?.name || ''}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">Nama Lengkap</label>
                    <input
                      className="input"
                      value={borrowForm.borrowerName}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, borrowerName: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">No. Identitas</label>
                    <input
                      className="input"
                      value={borrowForm.identityNumber}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, identityNumber: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">Email</label>
                    <input
                      className="input"
                      value={borrowForm.borrowerEmail}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, borrowerEmail: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">No. HP</label>
                    <input
                      className="input"
                      value={borrowForm.borrowerPhone}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, borrowerPhone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600">Instansi / Divisi</label>
                    <input
                      className="input"
                      value={borrowForm.borrowerInstitution}
                      onChange={e =>
                        setBorrowForm(prev => ({
                          ...prev,
                          borrowerInstitution: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600">Alamat</label>
                    <input
                      className="input"
                      value={borrowForm.borrowerAddress}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, borrowerAddress: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">Jumlah</label>
                    <input
                      type="number"
                      min={1}
                      className="input"
                      value={borrowForm.quantity}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, quantity: +e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">Rencana Tanggal Kembali</label>
                    <input
                      type="date"
                      className="input"
                      value={borrowForm.expectedReturn}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, expectedReturn: e.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600">Keperluan</label>
                    <input
                      className="input"
                      value={borrowForm.notes}
                      onChange={e =>
                        setBorrowForm(prev => ({ ...prev, notes: e.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600 mb-2 block">
                      Foto Kartu Identitas
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="w-full">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleBorrowImage(e.target.files?.[0])}
                        />
                        <div className="input cursor-pointer text-slate-600 flex items-center gap-2">
                          <Upload size={16} />
                          Upload foto identitas
                        </div>
                      </label>

                      <label className="w-full">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => handleBorrowImage(e.target.files?.[0])}
                        />
                        <div className="input cursor-pointer text-slate-600 flex items-center gap-2">
                          <Camera size={16} />
                          Foto langsung
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">
                      {borrowPreviewName || 'Belum ada foto dipilih'}
                    </p>
                  </div>

                  {borrowForm.identityPhoto && (
                    <div className="md:col-span-2">
                      <img
                        src={borrowForm.identityPhoto}
                        alt="Identitas"
                        className="w-full h-56 object-cover rounded-[22px] border border-slate-200"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn-secondary justify-center"
                      onClick={() => setBorrowModalOpen(false)}
                    >
                      Batal
                    </button>
                    <button className="btn-primary justify-center">
                      Kirim {borrowForm.borrowType === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] p-3 sm:p-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                    Form Pengembalian
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Cari barang dari data barang, lalu upload foto atau ambil foto barang langsung.
                  </p>
                </div>
                <button
                  onClick={() => setReturnModalOpen(false)}
                  className="btn-icon shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto px-4 sm:px-6 py-5">
                <form onSubmit={submitReturn} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2" ref={returnPickerRef}>
                    <label className="text-sm text-slate-600">Cari Barang</label>

                    <div className="relative mt-1">
                      <div
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 bg-white ${
                          returnDropdownOpen
                            ? 'border-blue-400 ring-2 ring-blue-500/30'
                            : 'border-gray-200'
                        }`}
                      >
                        <Search size={16} className="text-slate-400 shrink-0" />
                        <input
                          className="flex-1 outline-none bg-transparent text-slate-700 min-w-0"
                          placeholder="Cari berdasarkan nama barang..."
                          value={returnSearch}
                          onChange={e => {
                            setReturnSearch(e.target.value)
                            setReturnDropdownOpen(true)
                            setReturnForm(prev => ({ ...prev, itemId: '' }))
                          }}
                          onFocus={() => setReturnDropdownOpen(true)}
                        />
                        <button
                          type="button"
                          onClick={() => setReturnDropdownOpen(v => !v)}
                          className="text-slate-500 shrink-0"
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>

                      {returnDropdownOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                          <div className="max-h-72 overflow-auto">
                            {filteredReturnItems.length === 0 && (
                              <div className="px-4 py-4 text-sm text-slate-500">
                                Barang tidak ditemukan
                              </div>
                            )}

                            {filteredReturnItems.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectReturnItem(item)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800">
                                      {item.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      {item.code} • {item.category}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedReturnItem && (
                      <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="font-bold text-slate-800">{selectedReturnItem.name}</p>
                        <p className="text-sm text-slate-500">
                          {selectedReturnItem.code} • {selectedReturnItem.category} • {selectedReturnItem.location}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">Nama Pengembali</label>
                    <input
                      className="input"
                      value={returnForm.returnerName}
                      onChange={e =>
                        setReturnForm(prev => ({ ...prev, returnerName: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">No. HP</label>
                    <input
                      className="input"
                      value={returnForm.returnerPhone}
                      onChange={e =>
                        setReturnForm(prev => ({ ...prev, returnerPhone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600">Kondisi Barang</label>
                    <select
                      className="input"
                      value={returnForm.conditionOnReturn}
                      onChange={e =>
                        setReturnForm(prev => ({
                          ...prev,
                          conditionOnReturn: e.target.value
                        }))
                      }
                    >
                      <option value="Baik">Baik</option>
                      <option value="Kurang Baik">Kurang Baik</option>
                      <option value="Perlu Pemeriksaan">Perlu Pemeriksaan</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600">Catatan Pengembalian</label>
                    <input
                      className="input"
                      value={returnForm.returnNotes}
                      onChange={e =>
                        setReturnForm(prev => ({ ...prev, returnNotes: e.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600 mb-2 block">
                      Foto Barang yang Dikembalikan
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="w-full">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleReturnImage(e.target.files?.[0])}
                        />
                        <div className="input cursor-pointer text-slate-600 flex items-center gap-2">
                          <Upload size={16} />
                          Upload foto barang
                        </div>
                      </label>

                      <label className="w-full">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => handleReturnImage(e.target.files?.[0])}
                        />
                        <div className="input cursor-pointer text-slate-600 flex items-center gap-2">
                          <Camera size={16} />
                          Foto langsung
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">
                      {returnPreviewName || 'Belum ada foto dipilih'}
                    </p>
                  </div>

                  {returnForm.returnPhoto && (
                    <div className="md:col-span-2">
                      <img
                        src={returnForm.returnPhoto}
                        alt="Foto Pengembalian"
                        className="w-full h-56 object-cover rounded-[22px] border border-slate-200"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn-secondary justify-center"
                      onClick={() => {
                        setReturnModalOpen(false)
                        setReturnSearch('')
                        setReturnDropdownOpen(false)
                      }}
                    >
                      Batal
                    </button>
                    <button className="btn-primary justify-center">
                      Kirim Pengembalian
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}