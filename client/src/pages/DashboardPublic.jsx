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
  AlertTriangle,
  CalendarDays,
  UserRound,
  Phone,
  ZoomIn,
  ZoomOut,
  ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api'

const todayISO = () => new Date().toISOString().slice(0, 10)

const emptyBorrowForm = {
  borrowType: 'peminjaman',
  itemId: '',
  quantity: 1,
  borrowDate: todayISO(),
  expectedReturn: '',
  notes: '',
  borrowerName: '',
  borrowerPhone: '',
  borrowerAddress: '',
  paymentProof: '',
  paymentProofName: ''
}

const emptyReturnForm = {
  borrowingId: '',
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

function borrowTypeLabel(type) {
  if (type === 'penyewaan') return 'Penyewaan'
  return 'Peminjaman'
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
  const [qrisViewerOpen, setQrisViewerOpen] = useState(false)
  const [qrisZoom, setQrisZoom] = useState(1)

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

  const getRentalQrisSrc = () => {
    if (config?.rentalQrisImage) return config.rentalQrisImage
    if (config?.rentalQrisLink) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        config.rentalQrisLink
      )}`
    }
    return ''
  }

  const clampZoom = value => Math.min(4, Math.max(1, Number(value || 1)))

  const closeQrisViewer = () => {
    setQrisViewerOpen(false)
    setQrisZoom(1)
  }

  const changeQrisZoom = delta => {
    setQrisZoom(prev => clampZoom(prev + delta))
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

  useEffect(() => {
    const onKeydown = e => {
      if (e.key === 'Escape' && qrisViewerOpen) {
        closeQrisViewer()
      }
    }

    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [qrisViewerOpen])

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

  const activeBorrowings = useMemo(() => {
    return borrowings.filter(
      b =>
        b.status === 'borrowed' &&
        b.returnRequestStatus !== 'pending'
    )
  }, [borrowings])

  const activeReturnableRows = useMemo(() => {
    return activeBorrowings
      .map(borrowing => {
        const item = items.find(i => String(i.id) === String(borrowing.itemId))
        if (!item) return null

        return {
          borrowingId: borrowing.id,
          itemId: item.id,
          itemName: item.name,
          itemCode: item.code,
          itemCategory: item.category,
          itemLocation: item.location,
          itemCondition: item.condition,
          itemImage: item.image,
          itemServiceMode: item.serviceMode || 'both',
          borrowerName: borrowing.borrowerName || '-',
          borrowerPhone: borrowing.borrowerPhone || '-',
          borrowerAddress: borrowing.borrowerAddress || '-',
          quantity: Number(borrowing.quantity || 0),
          borrowType: borrowing.borrowType || 'peminjaman',
          borrowDate: borrowing.borrowDate || borrowing.requestedBorrowDate || '-',
          expectedReturn: borrowing.expectedReturn || '-',
          notes: borrowing.notes || '',
          rawBorrowing: borrowing,
          rawItem: item
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        const da = new Date(
          b.rawBorrowing?.updatedAt ||
            b.rawBorrowing?.createdAt ||
            b.rawBorrowing?.approvedAt ||
            0
        ).getTime()

        const db = new Date(
          a.rawBorrowing?.updatedAt ||
            a.rawBorrowing?.createdAt ||
            a.rawBorrowing?.approvedAt ||
            0
        ).getTime()

        return da - db
      })
  }, [activeBorrowings, items])

  const selectedReturnRow = useMemo(() => {
    return (
      activeReturnableRows.find(
        row => String(row.borrowingId) === String(returnForm.borrowingId)
      ) || null
    )
  }, [activeReturnableRows, returnForm.borrowingId])

  const filteredReturnRows = useMemo(() => {
    const q = returnSearch.trim().toLowerCase()

    if (!q) return activeReturnableRows

    return activeReturnableRows.filter(row => {
      const text = [
        row.itemName,
        row.itemCode,
        row.itemCategory,
        row.itemLocation,
        row.itemCondition,
        row.borrowerName,
        row.borrowerPhone,
        row.borrowType
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(q)
    })
  }, [activeReturnableRows, returnSearch])

  const chooseService = service => {
    setSelectedService(service)
    setSelectedItem(null)
    setBorrowModalOpen(false)
    setBorrowForm({
      ...emptyBorrowForm,
      borrowType: service,
      borrowDate: todayISO()
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
      borrowType: selectedService,
      borrowDate: todayISO()
    })
    setPaymentPreviewName('')
    setBorrowModalOpen(true)
  }

  const handleSelectReturnRow = row => {
    setReturnForm(prev => ({
      ...prev,
      borrowingId: row.borrowingId,
      itemId: row.itemId
    }))

    setReturnSearch(`${row.itemName} - ${row.borrowerName}`)
    setReturnDropdownOpen(false)

    showToast(
      'info',
      'Data pengembalian dipilih',
      `${row.itemName} sedang dipinjam oleh ${row.borrowerName}.`
    )
  }

  const compressImageToDataUrl = file =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve('')
        return
      }

      const reader = new FileReader()

      reader.onerror = () => {
        reject(new Error('File tidak bisa dibaca'))
      }

      reader.onload = () => {
        const img = new Image()

        img.onerror = () => {
          reject(new Error('Gambar tidak valid'))
        }

        img.onload = () => {
          const maxWidth = 1600
          const maxHeight = 1600
          let { width, height } = img

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          let quality = 0.82
          let result = canvas.toDataURL('image/jpeg', quality)

          while (result.length > 3500000 && quality > 0.45) {
            quality -= 0.08
            result = canvas.toDataURL('image/jpeg', quality)
          }

          resolve(result)
        }

        img.src = reader.result
      }

      reader.readAsDataURL(file)
    })

  const handlePaymentImage = async file => {
    if (!file) return

    try {
      const compressedImage = await compressImageToDataUrl(file)

      setBorrowForm(prev => ({
        ...prev,
        paymentProof: compressedImage,
        paymentProofName: file.name || 'Bukti pembayaran'
      }))

      setPaymentPreviewName(file.name || 'Bukti pembayaran')

      showToast(
        'success',
        'Bukti pembayaran siap',
        'Gambar berhasil diproses dan dioptimalkan untuk dikirim.'
      )
    } catch (error) {
      setBorrowForm(prev => ({
        ...prev,
        paymentProof: '',
        paymentProofName: ''
      }))
      setPaymentPreviewName('')
      showToast(
        'error',
        'Upload bukti gagal',
        error?.message || 'File gambar bukti pembayaran gagal diproses.'
      )
    }
  }

  const handleReturnImage = async file => {
    if (!file) return

    try {
      const compressedImage = await compressImageToDataUrl(file)

      setReturnForm(prev => ({ ...prev, returnPhoto: compressedImage }))
      setReturnPreviewName(file.name || 'Foto diambil dari kamera')

      showToast(
        'success',
        'Foto pengembalian siap',
        'Foto berhasil diproses dan dioptimalkan untuk dikirim.'
      )
    } catch (error) {
      setReturnForm(prev => ({ ...prev, returnPhoto: '' }))
      setReturnPreviewName('')
      showToast(
        'error',
        'Upload foto gagal',
        error?.message || 'Foto pengembalian gagal diproses.'
      )
    }
  }

  const buildWhatsAppMessage = payload => {
    return (
      `Halo Admin, ada pengajuan ${payload.borrowType === 'penyewaan' ? 'penyewaan' : 'peminjaman'} baru.\n\n` +
      `Nama: ${payload.borrowerName}\n` +
      `No. HP: ${payload.borrowerPhone}\n` +
      `Barang: ${selectedItem?.name || '-'}\n` +
      `Jumlah: ${payload.quantity}\n` +
      `Alamat: ${payload.borrowerAddress || '-'}\n` +
      `Tanggal Pinjam: ${payload.borrowDate || '-'}\n` +
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

    if (!borrowForm.borrowDate) {
      showToast(
        'warning',
        'Warning!',
        'Tanggal peminjaman / penyewaan wajib diisi.'
      )
      return
    }

    if (!borrowForm.expectedReturn) {
      showToast(
        'warning',
        'Warning!',
        'Tanggal pengembalian wajib diisi.'
      )
      return
    }

    if (borrowForm.expectedReturn < borrowForm.borrowDate) {
      showToast(
        'warning',
        'Warning!',
        'Tanggal pengembalian tidak boleh lebih awal dari tanggal peminjaman.'
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
      borrowDate: borrowForm.borrowDate,
      expectedReturn: borrowForm.expectedReturn,
      notes: borrowForm.notes,
      borrowerName: borrowForm.borrowerName,
      borrowerPhone: borrowForm.borrowerPhone,
      borrowerAddress: borrowForm.borrowerAddress,
      paymentProof: borrowForm.paymentProof,
      paymentProofName: borrowForm.paymentProofName
    }

    try {
      await api.post('/borrowings', payload)

      const isRental = borrowForm.borrowType === 'penyewaan'
      const waMessage = buildWhatsAppMessage(payload)

      setBorrowModalOpen(false)
      setSelectedItem(null)
      setBorrowForm({
        ...emptyBorrowForm,
        borrowDate: todayISO()
      })
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
    } catch (err) {
      showToast(
        'error',
        'Gagal mengirim',
        err?.response?.data?.error || 'Terjadi kesalahan saat mengirim pengajuan.'
      )
    }
  }

  const submitReturn = async e => {
    e.preventDefault()

    if (!returnForm.borrowingId) {
      showToast(
        'warning',
        'Warning!',
        'Pilih dulu data peminjaman yang ingin dikembalikan.'
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

    try {
      await api.post('/returns-public', {
        borrowingId: returnForm.borrowingId,
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
      setReturnDropdownOpen(false)
      await load()

      showToast(
        'success',
        'Success!',
        'Form pengembalian berhasil dikirim dan menunggu verifikasi admin.'
      )
    } catch (err) {
      showToast(
        'error',
        'Pengembalian gagal',
        err?.response?.data?.error || 'Terjadi kesalahan saat mengirim form pengembalian.'
      )
    }
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

      {qrisViewerOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/75 backdrop-blur-sm px-4 py-6 sm:p-8">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
            <div className="mb-4 flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/10 px-4 py-3 text-white shadow-lg backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/75">QRIS Penyewaan</p>
                <p className="truncate text-base font-extrabold sm:text-lg">
                  Klik tombol zoom untuk memperbesar atau memperkecil
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeQrisZoom(-0.25)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  title="Perkecil QRIS"
                >
                  <ZoomOut size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => changeQrisZoom(0.25)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  title="Perbesar QRIS"
                >
                  <ZoomIn size={18} />
                </button>

                <button
                  type="button"
                  onClick={closeQrisViewer}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md sm:p-6">
              <div className="flex min-h-full items-center justify-center">
                <img
                  src={getRentalQrisSrc()}
                  alt="QRIS Penyewaan"
                  className="max-w-none rounded-[28px] border border-white/15 bg-white shadow-2xl transition-transform duration-200"
                  style={{
                    transform: `scale(${qrisZoom})`,
                    transformOrigin: 'center center',
                    width: 'min(380px, 82vw)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="rounded-2xl bg-white/15 px-5 py-4 min-w-[160px] backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Sedang Dipinjam</p>
                  <p className="text-3xl font-extrabold">{activeBorrowings.length}</p>
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
                    <p className="font-semibold">Isi tanggal pinjam & kembali</p>
                    <p className="text-sm text-white/80">Lengkapi tanggal pemakaian supaya pengajuan lebih jelas.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center shrink-0">4</div>
                  <div>
                    <p className="font-semibold">Pilih data pinjam saat return</p>
                    <p className="text-sm text-white/80">Saat pengembalian, pilih barang sekaligus nama peminjam aktifnya.</p>
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
                    className="group rounded-[28px] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-52 object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent"></div>

                      <div className="absolute top-4 right-4 flex flex-wrap gap-2 justify-end">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                          <Boxes size={13} />
                          Stok {item.stock}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${conditionBadgeClass(item.condition)}`}>
                          <BadgeCheck size={13} />
                          {item.condition}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-slate-400 font-medium">{item.code}</p>
                        </div>

                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          selectedService === 'penyewaan'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedService === 'penyewaan' ? 'Disewa' : 'Dipinjam'}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Boxes size={16} className="text-slate-400" />
                          <span>{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-slate-400" />
                          <span>{serviceModeLabel(item.serviceMode)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => openBorrowModal(item)}
                        disabled={!available}
                        className={`mt-6 w-full rounded-[18px] py-3.5 px-4 text-sm font-bold transition-all duration-300 ${
                          available
                            ? selectedService === 'penyewaan'
                              ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {selectedService === 'penyewaan' ? 'Lanjutkan Penyewaan' : 'Lanjutkan Peminjaman'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {borrowModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm px-4 py-4 sm:p-6 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-[32px] overflow-hidden bg-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] border border-slate-200">
              <div className={`px-6 sm:px-8 py-5 border-b border-slate-100 ${
                borrowForm.borrowType === 'penyewaan'
                  ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                      borrowForm.borrowType === 'penyewaan'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {borrowForm.borrowType === 'penyewaan' ? <Wallet size={14} /> : <HandCoins size={14} />}
                      {borrowForm.borrowType === 'penyewaan' ? 'Form Penyewaan' : 'Form Peminjaman'}
                    </p>
                    <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-800">
                      {borrowForm.borrowType === 'penyewaan' ? 'Form Penyewaan' : 'Form Peminjaman'}
                    </h3>
                    <p className="text-slate-500 mt-1">
                      Form otomatis menyesuaikan dengan layanan yang sudah dipilih.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBorrowModalOpen(false)}
                    className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 flex items-center justify-center shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <form onSubmit={submitBorrow} className="space-y-6">
                  {borrowForm.borrowType === 'penyewaan' && (
                    <div className="rounded-[28px] border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 sm:p-6">
                      <div className="flex items-center gap-2 text-violet-700 font-extrabold">
                        <QrCode size={18} />
                        QRIS Penyewaan
                      </div>

                      {!!getRentalQrisSrc() && (
                        <div className="mt-4">
                          <div className="mx-auto w-full max-w-[320px] rounded-[24px] border border-violet-200 bg-white p-4 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setQrisViewerOpen(true)}
                              className="group block w-full"
                            >
                              <img
                                src={getRentalQrisSrc()}
                                alt="QRIS Penyewaan"
                                className="mx-auto w-full max-w-[220px] rounded-[20px] border border-violet-200 shadow-sm transition duration-300 group-hover:scale-[1.02]"
                              />
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQrisViewerOpen(true)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100 transition"
                              >
                                <ZoomIn size={16} />
                                Zoom / Pop Up
                              </button>

                              
                            </div>
                          </div>

                          <p className="mt-4 text-center text-sm font-medium text-violet-700">
                            Setelah submit, WhatsApp admin akan dibuka ke: <b>{config?.adminWhatsappNumber || '6282288277920'}</b>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Barang</label>
                    <input
                      type="text"
                      value={selectedItem?.name || ''}
                      readOnly
                      className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-700 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">Nama Lengkap</label>
                      <input
                        type="text"
                        value={borrowForm.borrowerName}
                        onChange={e => setBorrowForm(prev => ({ ...prev, borrowerName: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">No. HP</label>
                      <input
                        type="text"
                        value={borrowForm.borrowerPhone}
                        onChange={e => setBorrowForm(prev => ({ ...prev, borrowerPhone: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        placeholder="Masukkan nomor HP"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Alamat</label>
                    <input
                      type="text"
                      value={borrowForm.borrowerAddress}
                      onChange={e => setBorrowForm(prev => ({ ...prev, borrowerAddress: e.target.value }))}
                      className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      placeholder="Masukkan alamat"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">Jumlah</label>
                      <input
                        type="number"
                        min="1"
                        value={borrowForm.quantity}
                        onChange={e => setBorrowForm(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div className={`rounded-[18px] border px-4 py-3.5 text-sm font-semibold ${
                      borrowForm.borrowType === 'penyewaan'
                        ? 'border-violet-200 bg-violet-50 text-violet-700'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        Lengkapi tanggal pinjam dan tanggal kembali
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">
                        Tanggal Peminjaman / Penyewaan
                      </label>
                      <input
                        type="date"
                        value={borrowForm.borrowDate}
                        onChange={e => setBorrowForm(prev => ({ ...prev, borrowDate: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">Tanggal Pengembalian</label>
                      <input
                        type="date"
                        value={borrowForm.expectedReturn}
                        onChange={e => setBorrowForm(prev => ({ ...prev, expectedReturn: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Keperluan / Catatan</label>
                    <textarea
                      rows="4"
                      value={borrowForm.notes}
                      onChange={e => setBorrowForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 resize-none"
                      placeholder="Tulis keperluan penggunaan barang"
                    />
                  </div>

                  {borrowForm.borrowType === 'penyewaan' && (
                    <div className="rounded-[24px] border border-dashed border-violet-300 bg-violet-50/70 p-5">
                      <label className="block text-sm font-extrabold text-violet-700">
                        Upload Bukti Pembayaran
                      </label>

                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-violet-600 text-white px-5 py-3 font-bold cursor-pointer hover:bg-violet-700 transition">
                          <Upload size={18} />
                          Pilih gambar bukti
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handlePaymentImage(e.target.files?.[0])}
                          />
                        </label>

                        <div className="min-w-0">
                          <p className="text-sm text-violet-700 font-semibold break-all">
                            {paymentPreviewName || 'Belum ada file dipilih'}
                          </p>
                          <p className="text-xs text-violet-500 mt-1">
                            Gambar akan dioptimalkan otomatis agar submit lebih stabil.
                          </p>
                        </div>
                      </div>

                      {!!borrowForm.paymentProof && (
                        <div className="mt-4">
                          <img
                            src={borrowForm.paymentProof}
                            alt="Preview bukti pembayaran"
                            className="w-full max-w-xs rounded-[20px] border border-violet-200 bg-white shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBorrowModalOpen(false)}
                      className="w-full sm:w-auto rounded-[18px] border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      className={`w-full sm:flex-1 rounded-[18px] px-6 py-3.5 font-bold text-white transition ${
                        borrowForm.borrowType === 'penyewaan'
                          ? 'bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                      }`}
                    >
                      {borrowForm.borrowType === 'penyewaan' ? 'Kirim Form Penyewaan' : 'Kirim Form Peminjaman'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {returnModalOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm px-4 py-4 sm:p-6 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-[32px] overflow-hidden bg-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] border border-slate-200">
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700">
                      <RotateCcw size={14} />
                      Form Pengembalian
                    </p>
                    <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-800">
                      Form Pengembalian
                    </h3>
                    <p className="text-slate-500 mt-1">
                      Pilih barang dan peminjam aktif yang ingin dikembalikan.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(false)}
                    className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 flex items-center justify-center shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <form onSubmit={submitReturn} className="space-y-6">
                  <div className="space-y-2" ref={returnPickerRef}>
                    <label className="text-sm font-semibold text-slate-600">
                      Cari barang / peminjam aktif
                    </label>

                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={returnSearch}
                        onChange={e => {
                          setReturnSearch(e.target.value)
                          setReturnDropdownOpen(true)
                        }}
                        onFocus={() => setReturnDropdownOpen(true)}
                        className="w-full rounded-[18px] border border-slate-200 pl-12 pr-12 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        placeholder="Cari nama barang, kode, nama peminjam, atau nomor HP"
                      />
                      <button
                        type="button"
                        onClick={() => setReturnDropdownOpen(prev => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        <ChevronDown size={18} />
                      </button>
                    </div>

                    {returnDropdownOpen && (
                      <div className="mt-3 max-h-80 overflow-auto rounded-[22px] border border-slate-200 bg-white shadow-xl">
                        {filteredReturnRows.length > 0 ? (
                          filteredReturnRows.map(row => (
                            <button
                              key={row.borrowingId}
                              type="button"
                              onClick={() => handleSelectReturnRow(row)}
                              className="w-full px-4 py-4 text-left hover:bg-blue-50 transition border-b last:border-b-0 border-slate-100"
                            >
                              <div className="flex items-start gap-4">
                                <img
                                  src={row.itemImage}
                                  alt={row.itemName}
                                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-extrabold text-slate-800">{row.itemName}</p>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                      row.borrowType === 'penyewaan'
                                        ? 'bg-violet-100 text-violet-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {borrowTypeLabel(row.borrowType)}
                                    </span>
                                  </div>

                                  <p className="text-sm text-slate-500 mt-1">
                                    {row.itemCode} • {row.itemCategory} • {row.itemLocation}
                                  </p>

                                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1">
                                      <UserRound size={14} />
                                      {row.borrowerName}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <Phone size={14} />
                                      {row.borrowerPhone}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-slate-500">
                            Data peminjaman aktif tidak ditemukan.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedReturnRow && (
                    <div className="rounded-[24px] border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <img
                          src={selectedReturnRow.itemImage}
                          alt={selectedReturnRow.itemName}
                          className="w-24 h-24 rounded-2xl object-cover border border-blue-200 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xl font-extrabold text-slate-800">
                                {selectedReturnRow.itemName}
                              </p>
                              <p className="text-sm text-slate-500">
                                {selectedReturnRow.itemCode}
                              </p>
                            </div>

                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                              selectedReturnRow.borrowType === 'penyewaan'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {borrowTypeLabel(selectedReturnRow.borrowType)}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                            <div>
                              <p className="font-semibold text-slate-700">Peminjam</p>
                              <p>{selectedReturnRow.borrowerName}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">No. HP</p>
                              <p>{selectedReturnRow.borrowerPhone}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">Tanggal Pinjam</p>
                              <p>{selectedReturnRow.borrowDate || '-'}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">Rencana Kembali</p>
                              <p>{selectedReturnRow.expectedReturn || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">Nama Pengembali</label>
                      <input
                        type="text"
                        value={returnForm.returnerName}
                        onChange={e => setReturnForm(prev => ({ ...prev, returnerName: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        placeholder="Masukkan nama pengembali"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">No. HP</label>
                      <input
                        type="text"
                        value={returnForm.returnerPhone}
                        onChange={e => setReturnForm(prev => ({ ...prev, returnerPhone: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        placeholder="Masukkan nomor HP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">Kondisi</label>
                      <select
                        value={returnForm.conditionOnReturn}
                        onChange={e => setReturnForm(prev => ({ ...prev, conditionOnReturn: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="Baik">Baik</option>
                        <option value="Kurang Baik">Kurang Baik</option>
                        <option value="Rusak">Rusak</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">Catatan Pengembalian</label>
                      <textarea
                        rows="4"
                        value={returnForm.returnNotes}
                        onChange={e => setReturnForm(prev => ({ ...prev, returnNotes: e.target.value }))}
                        className="w-full rounded-[18px] border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 resize-none"
                        placeholder="Tulis catatan kondisi barang saat dikembalikan"
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-dashed border-blue-300 bg-blue-50/70 p-5">
                    <label className="block text-sm font-extrabold text-blue-700">
                      Upload Foto Barang yang Dikembalikan
                    </label>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-blue-600 text-white px-5 py-3 font-bold cursor-pointer hover:bg-blue-700 transition">
                        <Camera size={18} />
                        Ambil / pilih foto
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => handleReturnImage(e.target.files?.[0])}
                        />
                      </label>

                      <div className="min-w-0">
                        <p className="text-sm text-blue-700 font-semibold break-all">
                          {returnPreviewName || 'Belum ada foto dipilih'}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          Foto akan dioptimalkan otomatis agar submit lebih stabil.
                        </p>
                      </div>
                    </div>

                    {!!returnForm.returnPhoto && (
                      <div className="mt-4">
                        <img
                          src={returnForm.returnPhoto}
                          alt="Preview foto pengembalian"
                          className="w-full max-w-xs rounded-[20px] border border-blue-200 bg-white shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setReturnModalOpen(false)}
                      className="w-full sm:w-auto rounded-[18px] border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      className="w-full sm:flex-1 rounded-[18px] bg-blue-600 hover:bg-blue-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition"
                    >
                      Kirim Form Pengembalian
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: .6rem;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          border-radius: 18px;
          padding: .9rem 1.2rem;
          font-weight: 800;
          box-shadow: 0 10px 30px rgba(59, 130, 246, .18);
        }

        .btn-primary:hover {
          filter: brightness(.98);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: .6rem;
          background: white;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: .9rem 1.2rem;
          font-weight: 800;
          box-shadow: 0 10px 30px rgba(15, 23, 42, .05);
        }

        .btn-secondary:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  )
}