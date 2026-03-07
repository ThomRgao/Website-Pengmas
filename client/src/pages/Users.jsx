import React, { useEffect, useMemo, useState } from 'react'
import {
  Check,
  X,
  Undo2,
  ClipboardList,
  UserCircle2,
  History,
  Eye
} from 'lucide-react'
import api from '../api'

export default function UsersPage() {
  const [borrowings, setBorrowings] = useState([])
  const [detail, setDetail] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const { data } = await api.get('/borrowings')
    setBorrowings(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(
    () => ({
      total: borrowings.length,
      active: borrowings.filter(b => b.status === 'borrowed').length,
      pending: borrowings.filter(b => b.status === 'pending').length,
      returnRequested: borrowings.filter(
        b => b.status === 'borrowed' && b.returnRequested
      ).length
    }),
    [borrowings]
  )

  const rows = useMemo(() => {
    if (filter === 'all') return borrowings
    if (filter === 'return-requested') {
      return borrowings.filter(b => b.status === 'borrowed' && b.returnRequested)
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

  const doReturn = async id => {
    await api.post(`/borrowings/${id}/return`)
    await load()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tracking Pengguna</h1>
          <p className="text-gray-600 mt-1">
            Pantau identitas peminjam, riwayat pengajuan, durasi pinjam, dan pengembalian barang
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 text-white rounded-xl">
              <ClipboardList size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pengajuan</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl">
              <UserCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sedang Dipinjam</p>
              <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl">
              <History size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Verifikasi</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 text-white rounded-xl">
              <Undo2 size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Permintaan Kembali</p>
              <p className="text-2xl font-bold text-gray-800">{stats.returnRequested}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <select className="input w-64" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Semua Data</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="borrowed">Sedang Dipinjam</option>
            <option value="returned">Sudah Dikembalikan</option>
            <option value="rejected">Ditolak</option>
            <option value="return-requested">Minta Pengembalian</option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3">Peminjam</th>
              <th className="text-left p-3">Barang</th>
              <th className="text-left p-3">Identitas</th>
              <th className="text-left p-3">Durasi</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Riwayat</th>
              <th className="text-left p-3">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div>
                    <p className="font-medium text-gray-800">{row.borrowerName || '-'}</p>
                    <p className="text-sm text-gray-500">{row.borrowerInstitution || '-'}</p>
                  </div>
                </td>

                <td className="p-3">
                  <div>
                    <p className="font-medium text-gray-800">{row.itemName}</p>
                    <p className="text-sm text-gray-500">{row.quantity} unit</p>
                  </div>
                </td>

                <td className="p-3 text-gray-600">
                  <div className="space-y-1">
                    <p>{row.identityNumber || '-'}</p>
                    <p>{row.borrowerPhone || '-'}</p>
                    <p>{row.borrowerEmail || '-'}</p>
                  </div>
                </td>

                <td className="p-3 text-gray-600">
                  <div className="space-y-1">
                    <p>Rencana: {row.durationDays || 0} hari</p>
                    <p>Pengajuan: {row.submittedAt || '-'}</p>
                    <p>Jatuh tempo: {row.expectedReturn || '-'}</p>
                  </div>
                </td>

                <td className="p-3">
                  <div className="space-y-2">
                    {row.status === 'pending' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                        Pending
                      </span>
                    )}

                    {row.status === 'borrowed' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                        Dipinjam
                      </span>
                    )}

                    {row.status === 'returned' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        Dikembalikan
                      </span>
                    )}

                    {row.status === 'rejected' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                        Ditolak
                      </span>
                    )}

                    {row.returnRequested && row.status === 'borrowed' && (
                      <div className="text-xs text-amber-600 font-semibold">
                        Minta pengembalian
                      </div>
                    )}
                  </div>
                </td>

                <td className="p-3 text-gray-600">
                  <div className="space-y-1">
                    <p>ACC: {row.approvedAt || '-'}</p>
                    <p>Kembali: {row.returnDate || '-'}</p>
                    <p>Req return: {row.returnRequestDate || '-'}</p>
                  </div>
                </td>

                <td className="p-3">
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

                    {row.status === 'borrowed' && (
                      <button
                        onClick={() => doReturn(row.id)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white inline-flex items-center gap-1"
                      >
                        <Undo2 size={16} /> Konfirmasi Kembali
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={7}>
                  Tidak ada data tracking pengguna
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 overflow-auto">
          <div className="card max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Detail Tracking Pengguna</h3>
              <button className="btn-icon" onClick={() => setDetail(null)}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-800 mb-1">Identitas Peminjam</p>
                <p><b>Nama:</b> {detail.borrowerName || '-'}</p>
                <p><b>No. Identitas:</b> {detail.identityNumber || '-'}</p>
                <p><b>Email:</b> {detail.borrowerEmail || '-'}</p>
                <p><b>No. HP:</b> {detail.borrowerPhone || '-'}</p>
                <p><b>Instansi:</b> {detail.borrowerInstitution || '-'}</p>
                <p><b>Alamat:</b> {detail.borrowerAddress || '-'}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">Informasi Peminjaman</p>
                <p><b>Barang:</b> {detail.itemName}</p>
                <p><b>Jumlah:</b> {detail.quantity} unit</p>
                <p><b>Keperluan:</b> {detail.notes || '-'}</p>
                <p><b>Tanggal Pengajuan:</b> {detail.submittedAt || '-'}</p>
                <p><b>Tanggal Pinjam:</b> {detail.borrowDate || '-'}</p>
                <p><b>Jatuh Tempo:</b> {detail.expectedReturn || '-'}</p>
                <p><b>Durasi:</b> {detail.durationDays || 0} hari</p>
              </div>

              <div className="col-span-2">
                <p className="font-semibold text-gray-800 mb-1">Riwayat Pengembalian</p>
                <p><b>Request Pengembalian:</b> {detail.returnRequested ? 'Ya' : 'Belum'}</p>
                <p><b>Tanggal Request Return:</b> {detail.returnRequestDate || '-'}</p>
                <p><b>Kondisi Saat Dikembalikan:</b> {detail.conditionOnReturn || '-'}</p>
                <p><b>Catatan Return:</b> {detail.returnNotes || '-'}</p>
                <p><b>Tanggal Kembali Final:</b> {detail.returnDate || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}