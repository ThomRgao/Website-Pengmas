import React, { useEffect, useMemo, useState } from 'react'
import {
  Check,
  X,
  Eye,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react'
import api from '../api'

function statusLabel(row) {
  if (row.status === 'pending') return 'Pending'
  if (row.status === 'borrowed' && row.returnRequestStatus === 'pending') return 'Menunggu Verifikasi Return'
  if (row.status === 'borrowed') return 'Dipinjam / Disewa'
  if (row.status === 'returned') return 'Dikembalikan'
  if (row.status === 'rejected') return 'Ditolak'
  return row.status || '-'
}

function statusBadgeClass(row) {
  if (row.status === 'pending') return 'bg-amber-100 text-amber-700'
  if (row.status === 'borrowed' && row.returnRequestStatus === 'pending') return 'bg-blue-100 text-blue-700'
  if (row.status === 'borrowed') return 'bg-violet-100 text-violet-700'
  if (row.status === 'returned') return 'bg-emerald-100 text-emerald-700'
  if (row.status === 'rejected') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function borrowTypeLabel(type) {
  if (type === 'penyewaan') return 'Penyewaan'
  return 'Peminjaman'
}

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function canHideFromTracking(row) {
  if (!row) return false
  if (row.status === 'returned') return true
  if (row.status === 'rejected') return true
  return false
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

export default function Borrowing() {
  const [borrowings, setBorrowings] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({
    id: null,
    type: ''
  })

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  })

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

  const load = async (
    targetPage = page,
    targetFilter = filter,
    targetSearch = search,
    targetLimit = limit
  ) => {
    setLoading(true)

    try {
      const bRes = await api.get('/borrowings', {
        params: {
          page: targetPage,
          limit: targetLimit,
          filter: targetFilter,
          search: targetSearch
        }
      })

      const responseRows = bRes.data?.data || []
      const responsePagination =
        bRes.data?.pagination || {
          page: targetPage,
          limit: targetLimit,
          total: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false
        }

      setBorrowings(responseRows)
      setPagination(responsePagination)
      setPage(responsePagination.page || targetPage)
    } catch (err) {
      showToast(
        'error',
        'Gagal memuat data',
        err?.response?.data?.error || err?.message || 'Data pengajuan gagal dimuat.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1, filter, search, limit)
  }, [])

  const stats = useMemo(() => {
    const total = pagination.total || 0
    const pending = borrowings.filter(b => b.status === 'pending').length
    const active = borrowings.filter(b => b.status === 'borrowed').length
    const returnPending = borrowings.filter(
      b => b.status === 'borrowed' && b.returnRequestStatus === 'pending'
    ).length
    const returned = borrowings.filter(b => b.status === 'returned').length

    return {
      total,
      pending,
      active,
      returnPending,
      returned
    }
  }, [borrowings, pagination.total])

  const isProcessing = (id, type = '') => {
    if (!actionLoading.id) return false
    if (String(actionLoading.id) !== String(id)) return false
    if (!type) return true
    return actionLoading.type === type
  }

  const handleFilterChange = value => {
    setFilter(value)
    setPage(1)
    load(1, value, search, limit)
  }

  const handleLimitChange = value => {
    const nextLimit = Number(value || 10)

    setLimit(nextLimit)
    setPage(1)
    load(1, filter, search, nextLimit)
  }

  const submitSearch = e => {
    e.preventDefault()
    setPage(1)
    load(1, filter, search, limit)
  }

  const clearSearch = () => {
    setSearch('')
    setPage(1)
    load(1, filter, '', limit)
  }

  const refreshData = () => {
    load(page, filter, search, limit)
  }

  const goPrev = () => {
    if (!pagination.hasPrev || loading || actionLoading.id) return
    load(page - 1, filter, search, limit)
  }

  const goNext = () => {
    if (!pagination.hasNext || loading || actionLoading.id) return
    load(page + 1, filter, search, limit)
  }

  const approve = async id => {
    if (actionLoading.id) return

    setActionLoading({
      id,
      type: 'approve'
    })

    try {
      await api.patch(`/borrowings/${id}/approve`)
      await load(page, filter, search, limit)

      showToast(
        'success',
        'Success!',
        'Pengajuan berhasil disetujui dan stok barang berhasil dikurangi.'
      )
    } catch (err) {
      showToast(
        'error',
        'Gagal menyetujui',
        err?.response?.data?.error || err?.message || 'Pengajuan gagal disetujui.'
      )
    } finally {
      setActionLoading({
        id: null,
        type: ''
      })
    }
  }

  const reject = async id => {
    if (actionLoading.id) return

    setActionLoading({
      id,
      type: 'reject'
    })

    try {
      await api.patch(`/borrowings/${id}/reject`)
      await load(page, filter, search, limit)

      showToast(
        'success',
        'Success!',
        'Pengajuan berhasil ditolak.'
      )
    } catch (err) {
      showToast(
        'error',
        'Gagal menolak',
        err?.response?.data?.error || err?.message || 'Pengajuan gagal ditolak.'
      )
    } finally {
      setActionLoading({
        id: null,
        type: ''
      })
    }
  }

  const verifyReturn = async id => {
    if (actionLoading.id) return

    setActionLoading({
      id,
      type: 'verify-return'
    })

    try {
      await api.post(`/borrowings/${id}/verify-return`)
      await load(page, filter, search, limit)

      showToast(
        'success',
        'Success!',
        'Pengembalian berhasil diverifikasi dan stok barang sudah dikembalikan.'
      )
    } catch (err) {
      showToast(
        'error',
        'Gagal verifikasi return',
        err?.response?.data?.error || err?.message || 'Pengembalian gagal diverifikasi.'
      )
    } finally {
      setActionLoading({
        id: null,
        type: ''
      })
    }
  }

  const hideFromTracking = async row => {
    if (actionLoading.id) return

    if (!canHideFromTracking(row)) {
      showToast(
        'warning',
        'Belum bisa dihapus',
        'Data hanya bisa dihapus dari Tracking jika statusnya sudah dikembalikan atau ditolak.'
      )
      return
    }

    const ok = confirm(
      'Hapus data ini dari menu Tracking Peminjam?\n\nData tidak akan hilang dari database dan laporan.'
    )

    if (!ok) return

    setActionLoading({
      id: row.id,
      type: 'hide-tracking'
    })

    try {
      await api.patch(`/borrowings/${row.id}/hide-from-tracking`)
      setDetail(null)

      const nextPage =
        borrowings.length === 1 && page > 1
          ? page - 1
          : page

      await load(nextPage, filter, search, limit)

      showToast(
        'success',
        'Berhasil dihapus dari Tracking',
        'Data berhasil dihapus.'
      )
    } catch (err) {
      showToast(
        'error',
        'Gagal menghapus dari Tracking',
        err?.response?.data?.error || err?.message || 'Data gagal disembunyikan dari Tracking.'
      )
    } finally {
      setActionLoading({
        id: null,
        type: ''
      })
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
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

      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tracking Peminjam</h1>
        <p className="text-gray-600 mt-1">
          Kelola pengajuan peminjaman, penyewaan, bukti pembayaran, dan verifikasi pengembalian barang
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Data yang sudah dikembalikan atau ditolak akan otomatis disembunyikan dari tracking setelah 7 hari, tetapi tetap tersimpan untuk laporan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200">
          <p className="text-sm text-gray-600">Total Pengajuan</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-2">Semua data sesuai filter</p>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <p className="text-sm text-gray-600">Pending ACC</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-2">Di halaman ini</p>
        </div>

        <div className="card bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
          <p className="text-sm text-gray-600">Sedang Berjalan</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-2">Di halaman ini</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <p className="text-sm text-gray-600">Menunggu Verifikasi Return</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.returnPending}</p>
          <p className="text-xs text-gray-500 mt-2">Di halaman ini</p>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
          <p className="text-sm text-gray-600">Sudah Dikembalikan</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.returned}</p>
          <p className="text-xs text-gray-500 mt-2">Di halaman ini</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_auto] gap-3 items-center">
          <form onSubmit={submitSearch} className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              className="input pl-10 pr-28"
              placeholder="Cari nama, no HP, alamat, barang, jenis, atau catatan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading || !!actionLoading.id}
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-red-600 hover:underline"
                disabled={loading || !!actionLoading.id}
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !!actionLoading.id}
            >
              Cari
            </button>
          </form>

          <select
            className="input w-full xl:w-80"
            value={filter}
            onChange={e => handleFilterChange(e.target.value)}
            disabled={loading || !!actionLoading.id}
          >
            <option value="all">Semua Data Aktif Tracking</option>
            <option value="pending">Pending</option>
            <option value="borrowed">Sedang Dipinjam / Disewa</option>
            <option value="return-pending">Menunggu Verifikasi Return</option>
            <option value="returned">Dikembalikan</option>
            <option value="rejected">Ditolak</option>
          </select>

          <button
            onClick={refreshData}
            className="btn-secondary"
            disabled={loading || !!actionLoading.id}
          >
            <RefreshCcw size={16} />
            {loading ? 'Memuat...' : 'Refresh Data'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="text-sm text-gray-600">
            Menampilkan halaman <b>{pagination.page}</b> dari <b>{pagination.totalPages}</b> • Total <b>{pagination.total}</b> data aktif tracking
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Data per halaman</span>
            <select
              className="input w-28"
              value={limit}
              onChange={e => handleLimitChange(e.target.value)}
              disabled={loading || !!actionLoading.id}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 font-semibold text-gray-700">Nama</th>
                <th className="text-left p-4 font-semibold text-gray-700">Jenis</th>
                <th className="text-left p-4 font-semibold text-gray-700">Barang</th>
                <th className="text-left p-4 font-semibold text-gray-700">Tanggal</th>
                <th className="text-left p-4 font-semibold text-gray-700">Kontak</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Return</th>
                <th className="text-left p-4 font-semibold text-gray-700">Total Sewa</th>
                <th className="text-left p-4 font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {borrowings.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 align-top"
                >
                  <td className="p-4">
                    <p className="font-medium text-gray-800">{row.borrowerName}</p>
                    <p className="text-sm text-gray-500">
                      {row.borrowType === 'penyewaan' ? 'Penyewa' : 'Peminjam'}
                    </p>
                  </td>

                  <td className="p-4 text-gray-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{borrowTypeLabel(row.borrowType)}</span>
                      <span className="text-sm text-gray-500">
                        {row.borrowType === 'penyewaan' ? 'Perlu bukti bayar' : 'Tanpa bukti bayar'}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 text-gray-700">
                    <p className="font-medium">{row.itemName}</p>
                    <p className="text-sm text-gray-500">{row.quantity} unit</p>
                  </td>

                  <td className="p-4 text-gray-700">
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Pinjam:</span> {row.borrowDate || row.requestedBorrowDate || '-'}</p>
                      <p><span className="font-medium">Kembali:</span> {row.expectedReturn || '-'}</p>
                    </div>
                  </td>

                  <td className="p-4 text-gray-700">
                    <p>{row.borrowerPhone || '-'}</p>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      {row.borrowerAddress || '-'}
                    </p>
                  </td>

                  <td className="p-4 text-gray-700">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadgeClass(row)}`}>
                      {statusLabel(row)}
                    </span>
                  </td>

                  <td className="p-4 text-gray-700">
                    <div className="space-y-1 text-sm">
                      <p>
                        Request:{' '}
                        <span className="font-medium">
                          {row.returnRequestStatus === 'pending'
                            ? 'Sudah diajukan'
                            : row.returnRequestStatus === 'verified'
                            ? 'Sudah diverifikasi'
                            : 'Belum ada'}
                        </span>
                      </p>
                      <p className="text-gray-500">
                        Tgl request: {row.returnRequestedAt || '-'}
                      </p>
                      <p className="text-gray-500">
                        Tgl verifikasi: {row.returnVerifiedAt || '-'}
                      </p>
                    </div>
                  </td>

                  <td className="p-4 text-gray-700">
                    {row.borrowType === 'penyewaan' ? (
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-violet-700">
                          {formatRupiah(row.rentalTotalPrice)}
                        </p>
                        <p className="text-gray-500">
                          {row.rentalDurationDays || row.durationDays || 0} hari
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setDetail(row)}
                        className="btn-icon text-slate-600 hover:bg-slate-50"
                        disabled={!!actionLoading.id}
                        title="Lihat detail"
                      >
                        <Eye size={16} />
                      </button>

                      {row.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approve(row.id)}
                            disabled={!!actionLoading.id}
                            className="px-3 py-1 rounded-lg bg-green-600 text-white inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <Check size={16} />
                            {isProcessing(row.id, 'approve') ? 'Memproses...' : 'Setujui'}
                          </button>

                          <button
                            onClick={() => reject(row.id)}
                            disabled={!!actionLoading.id}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <X size={16} />
                            {isProcessing(row.id, 'reject') ? 'Memproses...' : 'Tolak'}
                          </button>
                        </>
                      )}

                      {row.status === 'borrowed' && row.returnRequestStatus === 'pending' && (
                        <button
                          onClick={() => verifyReturn(row.id)}
                          disabled={!!actionLoading.id}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Check size={16} />
                          {isProcessing(row.id, 'verify-return') ? 'Memproses...' : 'Verifikasi'}
                        </button>
                      )}

                      {canHideFromTracking(row) && (
                        <button
                          onClick={() => hideFromTracking(row)}
                          disabled={!!actionLoading.id}
                          className="px-3 py-1 rounded-lg bg-slate-700 text-white inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Hapus dari menu Tracking, data tetap ada di laporan"
                        >
                          <Trash2 size={16} />
                          {isProcessing(row.id, 'hide-tracking') ? 'Menghapus...' : 'Hapus Tracking'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {borrowings.length === 0 && (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={9}>
                    {loading ? 'Memuat data...' : 'Tidak ada data aktif di menu tracking'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Halaman <b>{pagination.page}</b> dari <b>{pagination.totalPages}</b> • Total <b>{pagination.total}</b> data aktif tracking
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={!pagination.hasPrev || loading || !!actionLoading.id}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>

            <button
              onClick={goNext}
              disabled={!pagination.hasNext || loading || !!actionLoading.id}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] p-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-6xl bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800">
                    Detail Pengajuan
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Detail lengkap peminjaman / penyewaan dan pengembaliannya
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canHideFromTracking(detail) && (
                    <button
                      className="px-3 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={() => hideFromTracking(detail)}
                      disabled={!!actionLoading.id}
                    >
                      <Trash2 size={16} />
                      {isProcessing(detail.id, 'hide-tracking') ? 'Menghapus...' : 'Hapus dari Tracking'}
                    </button>
                  )}

                  <button className="btn-icon shrink-0" onClick={() => setDetail(null)}>
                    ✕
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                      <p className="text-lg font-bold text-slate-800 mb-4">
                        Data Pengaju
                      </p>
                      <div className="space-y-3 text-sm">
                        <p><b>Nama:</b> {detail.borrowerName}</p>
                        <p><b>No. HP:</b> {detail.borrowerPhone || '-'}</p>
                        <p><b>Alamat:</b> {detail.borrowerAddress || '-'}</p>
                        <p><b>Jenis:</b> {borrowTypeLabel(detail.borrowType)}</p>
                        <p><b>Status:</b> {statusLabel(detail)}</p>
                        <p><b>Disembunyikan dari Tracking:</b> {detail.hiddenFromTrackingAt || 'Belum'}</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                      <p className="text-lg font-bold text-slate-800 mb-4">
                        Data Barang
                      </p>
                      <div className="space-y-3 text-sm">
                        <p><b>Barang:</b> {detail.itemName}</p>
                        <p><b>Jumlah:</b> {detail.quantity}</p>
                        <p><b>Keperluan:</b> {detail.notes || '-'}</p>
                        <p><b>Submitted:</b> {detail.submittedAt || '-'}</p>
                        <p><b>Disetujui:</b> {detail.approvedAt || '-'}</p>
                        <p><b>Tanggal Pinjam / Sewa:</b> {detail.borrowDate || detail.requestedBorrowDate || '-'}</p>
                        <p><b>Tanggal Kembali:</b> {detail.expectedReturn || '-'}</p>
                        <p><b>Durasi:</b> {detail.durationDays || 0} hari</p>
                        <p><b>Tanggal Return Final:</b> {detail.returnDate || '-'}</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                      <p className="text-lg font-bold text-slate-800 mb-4">
                        Data Pengembalian
                      </p>
                      <div className="space-y-3 text-sm">
                        <p><b>Status Request Return:</b> {detail.returnRequestStatus || '-'}</p>
                        <p><b>Tanggal Request:</b> {detail.returnRequestedAt || '-'}</p>
                        <p><b>Tanggal Verifikasi:</b> {detail.returnVerifiedAt || '-'}</p>
                        <p><b>Diverifikasi Oleh:</b> {detail.returnVerifiedBy || '-'}</p>
                        <p><b>Kondisi Saat Kembali:</b> {detail.conditionOnReturn || '-'}</p>
                        <p><b>Catatan Return:</b> {detail.returnNotes || '-'}</p>
                      </div>
                    </div>

                    {detail.borrowType === 'penyewaan' && (
                      <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-5">
                        <p className="text-lg font-bold text-violet-900 mb-4">
                          Data Penyewaan
                        </p>
                        <div className="space-y-3 text-sm">
                          <p><b>Status Pembayaran:</b> {detail.paymentStatus || '-'}</p>
                          <p><b>Status WhatsApp:</b> {detail.whatsappStatus || '-'}</p>
                          <p><b>Nama File Bukti:</b> {detail.paymentProofName || '-'}</p>
                          <p><b>Durasi Sewa:</b> {detail.rentalDurationDays || detail.durationDays || 0} hari</p>
                          <p><b>Total Sewa:</b> {formatRupiah(detail.rentalTotalPrice)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {detail.borrowType === 'penyewaan' && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-3">Bukti Pembayaran</p>
                        {detail.paymentProof ? (
                          <img
                            src={detail.paymentProof}
                            alt="Bukti Pembayaran"
                            className="w-full h-[320px] object-cover rounded-2xl border border-gray-200"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Belum ada bukti pembayaran</div>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-800 mb-3">Foto Barang Pengembalian</p>
                      {detail.returnPhoto ? (
                        <img
                          src={detail.returnPhoto}
                          alt="Barang Dikembalikan"
                          className="w-full h-[320px] object-cover rounded-2xl border border-gray-200"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">Belum ada foto pengembalian</div>
                      )}
                    </div>

                    {detail.whatsappResponse && (
                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                        <p className="text-lg font-bold text-slate-800 mb-3">
                          Response WhatsApp API
                        </p>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words">
{JSON.stringify(detail.whatsappResponse, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5">
                      <p className="text-lg font-bold text-amber-900 mb-2">
                        Catatan Tracking
                      </p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Tombol hapus di halaman ini hanya menyembunyikan data dari menu Tracking Peminjam.
                        Data tetap tersimpan di database dan tetap bisa dipakai untuk laporan.
                        Data status dikembalikan atau ditolak juga akan otomatis disembunyikan dari Tracking setelah 7 hari.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}