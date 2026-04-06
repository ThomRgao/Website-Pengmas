import React, { useEffect, useMemo, useState } from 'react'
import {
  Check,
  X,
  Eye,
  RefreshCcw
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

export default function Borrowing() {
  const [borrowings, setBorrowings] = useState([])
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const bRes = await api.get('/borrowings')
      setBorrowings(bRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    const total = borrowings.length
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
  }, [borrowings])

  const rows = useMemo(() => {
    if (filter === 'all') return borrowings

    if (filter === 'return-pending') {
      return borrowings.filter(
        b => b.status === 'borrowed' && b.returnRequestStatus === 'pending'
      )
    }

    return borrowings.filter(b => b.status === filter)
  }, [borrowings, filter])

  const approve = async id => {
    await api.patch(`/borrowings/${id}/approve`)
    await load()
  }

  const reject = async id => {
    await api.patch(`/borrowings/${id}/reject`)
    await load()
  }

  const verifyReturn = async id => {
    await api.post(`/borrowings/${id}/verify-return`)
    await load()
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tracking Peminjam</h1>
        <p className="text-gray-600 mt-1">
          Kelola pengajuan peminjaman, penyewaan, bukti pembayaran, dan verifikasi pengembalian barang
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200">
          <p className="text-sm text-gray-600">Total Pengajuan</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <p className="text-sm text-gray-600">Pending ACC</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending}</p>
        </div>

        <div className="card bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
          <p className="text-sm text-gray-600">Sedang Berjalan</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.active}</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <p className="text-sm text-gray-600">Menunggu Verifikasi Return</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.returnPending}</p>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
          <p className="text-sm text-gray-600">Sudah Dikembalikan</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.returned}</p>
        </div>
      </div>

      <div className="card flex flex-wrap gap-3 items-center justify-between">
        <select
          className="input w-full sm:w-80"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">Semua Data</option>
          <option value="pending">Pending</option>
          <option value="borrowed">Sedang Dipinjam / Disewa</option>
          <option value="return-pending">Menunggu Verifikasi Return</option>
          <option value="returned">Dikembalikan</option>
          <option value="rejected">Ditolak</option>
        </select>

        <button onClick={load} className="btn-secondary">
          <RefreshCcw size={16} />
          Refresh Data
        </button>
      </div>

      <div className="card p-0 overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 font-semibold text-gray-700">Nama</th>
                <th className="text-left p-4 font-semibold text-gray-700">Jenis</th>
                <th className="text-left p-4 font-semibold text-gray-700">Barang</th>
                <th className="text-left p-4 font-semibold text-gray-700">Tanggal</th>
                <th className="text-left p-4 font-semibold text-gray-700">Kontak</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Return</th>
                <th className="text-left p-4 font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(row => (
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
                      <p><span className="font-medium">Pinjam:</span> {row.borrowDate || '-'}</p>
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

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setDetail(row)}
                        className="btn-icon text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={16} />
                      </button>

                      {row.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approve(row.id)}
                            className="px-3 py-1 rounded-lg bg-green-600 text-white inline-flex items-center gap-1"
                          >
                            <Check size={16} /> Setujui
                          </button>
                          <button
                            onClick={() => reject(row.id)}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white inline-flex items-center gap-1"
                          >
                            <X size={16} /> Tolak
                          </button>
                        </>
                      )}

                      {row.status === 'borrowed' && row.returnRequestStatus === 'pending' && (
                        <button
                          onClick={() => verifyReturn(row.id)}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white inline-flex items-center gap-1"
                        >
                          <Check size={16} /> Verifikasi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={8}>
                    {loading ? 'Memuat data...' : 'Tidak ada data'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <button className="btn-icon shrink-0" onClick={() => setDetail(null)}>
                  ✕
                </button>
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
                        <p><b>Tanggal Pinjam / Sewa:</b> {detail.borrowDate || '-'}</p>
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