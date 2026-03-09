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
  ChevronDown,
  HandCoins,
  Wallet,
  Sparkles,
  MapPin,
  Boxes,
  BadgeCheck,
  Info,
  AlertTriangle
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
  borrowerPhone: '',
  borrowerAddress: '',
  paymentProof: '',
  paymentProofName: ''
}

const emptyReturnForm = {
  itemId: '',
  returnerName: '',
  returnerPhone: '',
  conditionOnReturn: 'Baik',
  returnNotes: '',
  returnPhoto: ''
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

function serviceModeLabel(mode) {
  if (mode === 'borrow') return 'Peminjaman'
  if (mode === 'rent') return 'Penyewaan'
  return 'Peminjaman & Penyewaan'
}

function canBorrow(item) {
  const mode = String(item?.serviceMode || 'both')
  return mode === 'borrow' || mode === 'both'
}

function canRent(item) {
  const mode = String(item?.serviceMode || 'both')
  return mode === 'rent' || mode === 'both'
}

function conditionBadgeClass(condition) {
  if (condition === 'Baik') return 'bg-emerald-100 text-emerald-700'
  if (condition === 'Kurang Baik') return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

function openWhatsAppAdminWithMessage(message) {
  const waUrl = `https://wa.me/6282288277920?text=${encodeURIComponent(message)}`
  window.open(waUrl, '_blank', 'noopener,noreferrer')
}

export default function DashboardPublic() {
  const [items, setItems] = useState([])
  const [borrowings, setBorrowings] = useState([])
  const [config, setConfig] = useState({
    rentalQrisLink: '',
    rentalQrisImage: '',
    adminWhatsappNumber: '6282288277920'
  })

  const [selectedService, setSelectedService] = useState('')
  const [borrowModalOpen, setBorrowModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState(null)
  const [borrowForm, setBorrowForm] = useState(emptyBorrowForm)
  const [returnForm, setReturnForm] = useState(emptyReturnForm)

  const [paymentPreviewName, setPaymentPreviewName] = useState('')
  const [returnPreviewName, setReturnPreviewName] = useState('')

  const [toast, setToast] = useState({
    open: false,
    type: 'success',
    title: '',
    message: ''
  })

  const [returnSearch, setReturnSearch] = useState('')
  const [returnDropdownOpen, setReturnDropdownOpen] = useState(false)
  const returnPickerRef = useRef(null)

  const showToast = (type, title, message) => {
    setToast({
      open: true,
      type,
      title,
      message
    })
  }

  const load = async () => {
    const [i, c, b] = await Promise.all([
      api.get('/items'),
      api.get('/public-config'),
      api.get('/borrowings')
    ])
    setItems(i.data || [])
    setConfig(
      c.data || {
        rentalQrisLink: '',
        rentalQrisImage: '',
        adminWhatsappNumber: '6282288277920'
      }
    )
    setBorrowings(b.data || [])
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

  const filteredItemsByService = useMemo(() => {
    if (!selectedService) return []

    if (selectedService === 'peminjaman') {
      return availableItems.filter(item => canBorrow(item))
    }

    if (selectedService === 'penyewaan') {
      return availableItems.filter(item => canRent(item))
    }

    return []
  }, [availableItems, selectedService])

  const selectedReturnItem = useMemo(() => {
    return items.find(i => String(i.id) === String(returnForm.itemId)) || null
  }, [items, returnForm.itemId])

  const filteredReturnItems = useMemo(() => {
    const q = returnSearch.trim().toLowerCase()
    if (!q) return items

    return items.filter(item => {
      const text = [item.name, item.code, item.category, item.location, item.condition]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(q)
    })
  }, [items, returnSearch])

  const chooseService = service => {
    setSelectedService(service)
    setSelectedItem(null)
    setBorrowModalOpen(false)
    setBorrowForm({
      ...emptyBorrowForm,
      borrowType: service
    })

    showToast(
      'info',
      service === 'peminjaman' ? 'Mode peminjaman dipilih' : 'Mode penyewaan dipilih',
      service === 'peminjaman'
        ? 'Sekarang daftar barang menampilkan item yang bisa dipinjam.'
        : 'Sekarang daftar barang menampilkan item yang bisa disewa.'
    )
  }

  const openBorrowModal = item => {
    if (!selectedService) {
      showToast(
        'warning',
        'Warning!',
        'Pilih dulu layanan peminjaman atau penyewaan sebelum memilih barang.'
      )
      return
    }

    setSelectedItem(item)
    setBorrowForm({
      ...emptyBorrowForm,
      itemId: item.id,
      borrowType: selectedService
    })
    setPaymentPreviewName('')
    setBorrowModalOpen(true)
  }

  const handleSelectReturnItem = item => {
    setReturnForm(prev => ({
      ...prev,
      itemId: item.id
    }))
    setReturnSearch(item.name)
    setReturnDropdownOpen(false)

    showToast(
      'info',
      'Barang dipilih',
      `${item.name} siap dimasukkan ke form pengembalian.`
    )
  }

  const handlePaymentImage = file => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setBorrowForm(prev => ({
        ...prev,
        paymentProof: reader.result,
        paymentProofName: file.name || 'Bukti pembayaran'
      }))
      setPaymentPreviewName(file.name || 'Bukti pembayaran')
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

  const buildWhatsAppMessage = payload => {
    return (
      `Halo Admin, ada pengajuan ${payload.borrowType === 'penyewaan' ? 'penyewaan' : 'peminjaman'} baru.\n\n` +
      `Nama: ${payload.borrowerName}\n` +
      `No. HP: ${payload.borrowerPhone}\n` +
      `Barang: ${selectedItem?.name || '-'}\n` +
      `Jumlah: ${payload.quantity}\n` +
      `Alamat: ${payload.borrowerAddress || '-'}\n` +
      `Rencana Kembali: ${payload.expectedReturn || '-'}\n` +
      `Keperluan: ${payload.notes || '-'}\n\n` +
      `${payload.borrowType === 'penyewaan' ? 'Bukti pembayaran sudah diupload.' : 'Mohon dicek ya.'}`
    )
  }

  const submitBorrow = async e => {
    e.preventDefault()

    if (!borrowForm.itemId) {
      showToast(
        'warning',
        'Warning!',
        'Barang belum dipilih. Silakan pilih barang terlebih dahulu.'
      )
      return
    }

    if (!borrowForm.borrowerName || !borrowForm.borrowerPhone) {
      showToast(
        'warning',
        'Warning!',
        'Lengkapi nama dan nomor HP.'
      )
      return
    }

    if (Number(borrowForm.quantity || 0) < 1) {
      showToast(
        'warning',
        'Warning!',
        'Jumlah minimal harus 1.'
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

    const payload = {
      borrowType: borrowForm.borrowType,
      itemId: borrowForm.itemId,
      quantity: Number(borrowForm.quantity || 1),
      expectedReturn: borrowForm.expectedReturn,
      notes: borrowForm.notes,
      borrowerName: borrowForm.borrowerName,
      borrowerPhone: borrowForm.borrowerPhone,
      borrowerAddress: borrowForm.borrowerAddress,
      paymentProof: borrowForm.paymentProof,
      paymentProofName: borrowForm.paymentProofName
    }

    await api.post('/borrowings', payload)

    const isRental = borrowForm.borrowType === 'penyewaan'
    const waMessage = buildWhatsAppMessage(payload)

    setBorrowModalOpen(false)
    setSelectedItem(null)
    setBorrowForm(emptyBorrowForm)
    setPaymentPreviewName('')
    await load()

    showToast(
      'success',
      'Success!',
      isRental
        ? 'Form penyewaan berhasil dikirim. WhatsApp admin akan dibuka.'
        : 'Form peminjaman berhasil dikirim.'
    )

    if (isRental) {
      setTimeout(() => {
        openWhatsAppAdminWithMessage(waMessage)
      }, 500)
    }
  }

  const submitReturn = async e => {
    e.preventDefault()

    if (!returnForm.itemId) {
      showToast(
        'warning',
        'Warning!',
        'Pilih dulu barang yang ingin dikembalikan.'
      )
      return
    }

    if (!returnForm.returnerName || !returnForm.returnerPhone) {
      showToast(
        'warning',
        'Warning!',
        'Lengkapi nama pengembali dan nomor HP.'
      )
      return
    }

    if (!returnForm.returnPhoto) {
      showToast(
        'warning',
        'Warning!',
        'Foto barang yang dikembalikan wajib diupload.'
      )
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
      'success',
      'Success!',
      'Form pengembalian berhasil dikirim dan menunggu verifikasi admin.'
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes toastPop {
          0% { opacity: 0; transform: scale(.94) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes softFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }

        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .service-fade-up {
          animation: fadeSlideUp .35s ease-out;
        }

        .service-float {
          animation: softFloat 2.4s ease-in-out infinite;
        }
      `}</style>

      <CenterToast
        open={toast.open}
        type={toast.type}
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
                Layanan Peminjaman & Penyewaan Inventaris
              </h1>
              <p className="text-sm text-slate-500">
                Pilih jenis layanan, ajukan barang, lalu kirim form pengembalian saat barang dikembalikan.
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

          <div className="relative px-5 sm:px-8 py-8 sm:py-10 md:px-12 md:py-14 grid grid-cols-1 lg:grid-cols-[1.35fr_.95fr] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white text-sm font-semibold backdrop-blur-sm">
                <Package size={16} />
                Dashboard Publik
              </span>

              <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                Inventaris Barang
              </h2>

              <p className="mt-4 text-white/85 text-base sm:text-lg max-w-2xl">
                Pilih layanan yang diinginkan, lalu sistem akan menampilkan barang sesuai pilihan Anda.
                Untuk penyewaan, QRIS dan bukti pembayaran akan muncul otomatis di form.
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
              <h3 className="text-xl font-bold">Alur Singkat</h3>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <p className="font-semibold">Pilih layanan</p>
                    <p className="text-sm text-white/80">Tentukan dulu mau peminjaman atau penyewaan.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <p className="font-semibold">Pilih barang</p>
                    <p className="text-sm text-white/80">Daftar barang otomatis menyesuaikan pilihan layanan.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <p className="font-semibold">Kirim pengembalian</p>
                    <p className="text-sm text-white/80">Pilih barang dari semua data barang, lalu kirim form ke admin.</p>
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
              Pilih dulu peminjaman atau penyewaan agar daftar barang menyesuaikan.
            </p>
          </div>

          <div className="service-fade-up rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  <Sparkles size={14} />
                  Pilih Mode Layanan
                </div>
                <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-800">
                  Mau pinjam atau sewa?
                </h3>
                <p className="text-slate-500 mt-1 text-sm sm:text-base">
                  Klik salah satu tombol di bawah. Setelah dipilih, daftar barang akan langsung berubah.
                </p>
              </div>

              <div className="text-left lg:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">
                  Mode Aktif
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-800">
                  {selectedService
                    ? selectedService === 'peminjaman'
                      ? 'Peminjaman'
                      : 'Penyewaan'
                    : 'Belum dipilih'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => chooseService('peminjaman')}
                className={`group relative overflow-hidden rounded-[24px] border p-5 sm:p-6 text-left transition-all duration-300 ${
                  selectedService === 'peminjaman'
                    ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100 scale-[1.01]'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md'
                }`}
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full transition ${
                  selectedService === 'peminjaman' ? 'bg-blue-200/50' : 'bg-blue-100/30'
                }`} />
                <div className="relative">
                  <div className={`service-float w-14 h-14 rounded-2xl flex items-center justify-center ${
                    selectedService === 'peminjaman'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    <HandCoins size={24} />
                  </div>

                  <div className="mt-5">
                    <p className={`text-xl font-extrabold ${
                      selectedService === 'peminjaman' ? 'text-blue-800' : 'text-slate-800'
                    }`}>
                      Peminjaman
                    </p>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      Cocok untuk barang yang dipakai sementara lalu dikembalikan sesuai jadwal.
                    </p>
                  </div>

                  <div className="mt-5">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      selectedService === 'peminjaman'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedService === 'peminjaman' ? 'Sedang dipilih' : 'Pilih mode ini'}
                    </span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => chooseService('penyewaan')}
                className={`group relative overflow-hidden rounded-[24px] border p-5 sm:p-6 text-left transition-all duration-300 ${
                  selectedService === 'penyewaan'
                    ? 'border-violet-300 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-lg shadow-violet-100 scale-[1.01]'
                    : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/60 hover:shadow-md'
                }`}
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full transition ${
                  selectedService === 'penyewaan' ? 'bg-violet-200/50' : 'bg-violet-100/30'
                }`} />
                <div className="relative">
                  <div className={`service-float w-14 h-14 rounded-2xl flex items-center justify-center ${
                    selectedService === 'penyewaan'
                      ? 'bg-violet-600 text-white'
                      : 'bg-violet-100 text-violet-700'
                  }`}>
                    <Wallet size={24} />
                  </div>

                  <div className="mt-5">
                    <p className={`text-xl font-extrabold ${
                      selectedService === 'penyewaan' ? 'text-violet-800' : 'text-slate-800'
                    }`}>
                      Penyewaan
                    </p>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      Cocok untuk barang sewa dengan QRIS dan upload bukti pembayaran sebelum diproses.
                    </p>
                  </div>

                  <div className="mt-5">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      selectedService === 'penyewaan'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedService === 'penyewaan' ? 'Sedang dipilih' : 'Pilih mode ini'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {!selectedService && (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-xl font-bold text-slate-700">
                Pilih dulu layanan di atas
              </p>
              <p className="text-slate-500 mt-2">
                Setelah memilih <b>peminjaman</b> atau <b>penyewaan</b>, daftar barang akan langsung tampil di bawah ini.
              </p>
            </div>
          )}

          {selectedService && (
            <div className="service-fade-up grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItemsByService.map(item => {
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

                      <div className="pt-2">
                        <button
                          disabled={!available}
                          onClick={() => openBorrowModal(item)}
                          className={`w-full inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold transition ${
                            available
                              ? selectedService === 'peminjaman'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-violet-600 text-white hover:bg-violet-700'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {selectedService === 'peminjaman'
                            ? 'Lanjutkan Peminjaman'
                            : 'Lanjutkan Penyewaan'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selectedService && filteredItemsByService.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-xl font-bold text-slate-700">
                Belum ada barang untuk {selectedService === 'peminjaman' ? 'peminjaman' : 'penyewaan'}
              </p>
              <p className="text-slate-500 mt-2">
                Silakan tambahkan atau ubah jenis layanan barang dari admin.
              </p>
            </div>
          )}
        </section>
      </main>

      {borrowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] p-3 sm:p-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-4xl bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                    Form {borrowForm.borrowType === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Form otomatis menyesuaikan dengan layanan yang sudah dipilih.
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
                        <p className="font-bold text-violet-900">QRIS Penyewaan</p>
                      </div>

                      {config?.rentalQrisImage || config?.rentalQrisLink ? (
                        <div className="flex flex-col items-center gap-3">
                          {config?.rentalQrisImage ? (
                            <img
                              src={config.rentalQrisImage}
                              alt="QRIS Penyewaan"
                              className="rounded-2xl border border-violet-200 bg-white p-3 w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] object-contain"
                            />
                          ) : (
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                                config.rentalQrisLink
                              )}`}
                              alt="QRIS Penyewaan"
                              className="rounded-2xl border border-violet-200 bg-white p-3 w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] object-contain"
                            />
                          )}

                          {config?.rentalQrisLink && (
                            <a
                              href={config.rentalQrisLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-violet-700 hover:underline break-all text-center"
                            >
                              {config.rentalQrisLink}
                            </a>
                          )}

                          <p className="text-sm text-violet-800 text-center">
                            Setelah submit, WhatsApp admin akan dibuka ke: <b>6282288277920</b>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          QRIS penyewaan belum diatur admin.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600">Barang</label>
                    <input
                      className="input"
                      value={selectedItem?.name || ''}
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

                  {borrowForm.borrowType === 'penyewaan' && (
                    <>
                      <div className="md:col-span-2">
                        <label className="text-sm text-slate-600 mb-2 block">
                          Bukti Pembayaran
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="w-full">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handlePaymentImage(e.target.files?.[0])}
                            />
                            <div className="input cursor-pointer text-slate-600 flex items-center gap-2">
                              <Upload size={16} />
                              Upload bukti pembayaran
                            </div>
                          </label>

                          <label className="w-full">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={e => handlePaymentImage(e.target.files?.[0])}
                            />
                            <div className="input cursor-pointer text-slate-600 flex items-center gap-2">
                              <Camera size={16} />
                              Foto langsung bukti
                            </div>
                          </label>
                        </div>

                        <p className="text-xs text-slate-500 mt-2">
                          {paymentPreviewName || 'Belum ada bukti pembayaran dipilih'}
                        </p>
                      </div>

                      {borrowForm.paymentProof && (
                        <div className="md:col-span-2">
                          <img
                            src={borrowForm.paymentProof}
                            alt="Bukti Pembayaran"
                            className="w-full h-56 object-cover rounded-[22px] border border-slate-200"
                          />
                        </div>
                      )}
                    </>
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
            <div className="w-full max-w-4xl bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                    Form Pengembalian
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Semua barang ditampilkan. Pilih barang yang ingin dikembalikan dengan tampilan yang lebih lengkap.
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
                    <label className="text-sm text-slate-600 font-medium">
                      Pilih Barang yang Ingin Dikembalikan
                    </label>

                    <div className="relative mt-2">
                      <div
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 bg-white shadow-sm transition ${
                          returnDropdownOpen
                            ? 'border-blue-400 ring-4 ring-blue-500/15'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Search size={17} className="text-slate-500" />
                        </div>

                        <input
                          className="flex-1 outline-none bg-transparent text-slate-700 min-w-0"
                          placeholder="Cari berdasarkan nama barang, kode, kategori, atau lokasi..."
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
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 transition"
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>

                      {returnDropdownOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 rounded-[24px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-sm font-semibold text-slate-700">
                              Pilih barang dari daftar berikut
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Menampilkan {filteredReturnItems.length} barang
                            </p>
                          </div>

                          <div className="max-h-[360px] overflow-auto p-3 space-y-3">
                            {filteredReturnItems.length === 0 && (
                              <div className="px-4 py-8 text-sm text-slate-500 text-center">
                                Barang tidak ditemukan
                              </div>
                            )}

                            {filteredReturnItems.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectReturnItem(item)}
                                className="w-full text-left rounded-[22px] border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition p-3"
                              >
                                <div className="flex items-start gap-4">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                                  />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="font-extrabold text-slate-800 truncate">
                                          {item.name}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                          {item.code}
                                        </p>
                                      </div>

                                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                                        {item.category}
                                      </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600 flex items-center gap-2">
                                        <MapPin size={13} />
                                        <span className="truncate">{item.location}</span>
                                      </div>

                                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600 flex items-center gap-2">
                                        <Boxes size={13} />
                                        <span>Stok: {item.stock}</span>
                                      </div>

                                      <div
                                        className={`rounded-xl px-3 py-2 flex items-center gap-2 font-medium ${conditionBadgeClass(item.condition)}`}
                                      >
                                        <BadgeCheck size={13} />
                                        <span>{item.condition}</span>
                                      </div>
                                    </div>

                                    <div className="mt-3">
                                      <span className="inline-flex items-center rounded-full px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold">
                                        {serviceModeLabel(item.serviceMode || 'both')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedReturnItem && (
                      <div className="mt-4 rounded-[24px] border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
                        <div className="flex items-start gap-4">
                          <img
                            src={selectedReturnItem.image}
                            alt={selectedReturnItem.name}
                            className="w-24 h-24 rounded-2xl object-cover border border-blue-200 shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xl font-extrabold text-slate-800">
                                  {selectedReturnItem.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {selectedReturnItem.code}
                                </p>
                              </div>

                              <span className="px-3 py-1 rounded-full bg-white text-blue-700 text-xs font-bold border border-blue-200">
                                {selectedReturnItem.category}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div className="rounded-2xl bg-white/80 p-3 border border-blue-100">
                                <p className="text-slate-500">Lokasi</p>
                                <p className="font-semibold text-slate-800">
                                  {selectedReturnItem.location}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-white/80 p-3 border border-blue-100">
                                <p className="text-slate-500">Stok</p>
                                <p className="font-semibold text-slate-800">
                                  {selectedReturnItem.stock}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-white/80 p-3 border border-blue-100">
                                <p className="text-slate-500">Kondisi</p>
                                <p className="font-semibold text-slate-800">
                                  {selectedReturnItem.condition}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <span className="inline-flex items-center rounded-full px-3 py-1 bg-white text-slate-700 text-xs font-semibold border border-blue-200">
                                {serviceModeLabel(selectedReturnItem.serviceMode || 'both')}
                              </span>
                            </div>
                          </div>
                        </div>
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