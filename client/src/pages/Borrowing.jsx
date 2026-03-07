import React, { useEffect, useMemo, useState } from 'react'
import { Check, X, Undo2, Eye } from 'lucide-react'
import api from '../api'

export default function Borrowing() {
  const [borrowings, setBorrowings] = useState([])
  const [publicReturns, setPublicReturns] = useState([])
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)

  const load = async () => {
    const [bRes, rRes] = await Promise.all([
      api.get('/borrowings'),
      api.get('/returns-public')
    ])
    setBorrowings(bRes.data || [])
    setPublicReturns(rRes.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => {
    let merged = [...borrowings]

    if (filter === 'return-requested') {
      return publicReturns
    }

    if (filter === 'all') return merged
    return merged.filter(b => b.status === filter)
  }, [borrowings, publicReturns, filter])

  const approve = async id => {
    await api.patch(`/borrowings/${id}/approve`)
    await load()
  }

  const reject = async id => {
    await api.patch(`/borrowings/${id}/reject`)
    await load()
  }

  const confirmReturn = async id => {
    await api.post(`/borrowings/${id}/return`)
    await load()
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tracking Peminjam</h1>
        <p className="text-gray-600 mt-1">
          Lihat identitas, foto kartu identitas, data pengajuan, dan pengembalian publik
        </p>
      </div>

      <div className="card">
        <select
          className="input w-full sm:w-72"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">Semua Data Peminjaman</option>
          <option value="pending">Pending</option>
          <option value="borrowed">Dipinjam</option>
          <option value="returned">Dikembalikan</option>
          <option value="rejected">Ditolak</option>
          <option value="return-requested">Data Pengembalian Publik</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 font-semibold text-gray-700">Peminjam / Pengembali</th>
                <th className="text-left p-4 font-semibold text-gray-700">Jenis</th>
                <th className="text-left p-4 font-semibold text-gray-700">Barang</th>
                <th className="text-left p-4 font-semibold text-gray-700">Instansi / Keterangan</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(row => {
                const isPublicReturn = row.type === 'public-return'

                return (
                  <tr key={`${isPublicReturn ? 'ret' : 'bor'}-${row.id}`} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    <td className="p-4">
                      <p className="font-medium text-gray-800">
                        {isPublicReturn ? row.returnerName : row.borrowerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isPublicReturn ? row.returnerPhone : row.borrowerPhone}
                      </p>
                    </td>

                    <td className="p-4 text-gray-700 capitalize">
                      {isPublicReturn ? 'pengembalian' : row.borrowType}
                    </td>

                    <td className="p-4 text-gray-700">
                      {row.itemName} {row.quantity ? `(${row.quantity} unit)` : ''}
                    </td>

                    <td className="p-4 text-gray-700">
                      {isPublicReturn ? (row.returnNotes || '-') : (row.borrowerInstitution || '-')}
                    </td>

                    <td className="p-4 text-gray-700">
                      {isPublicReturn ? 'Menunggu Verifikasi' : row.status}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setDetail(row)}
                          className="btn-icon text-slate-600 hover:bg-slate-50"
                        >
                          <Eye size={16} />
                        </button>

                        {!isPublicReturn && row.status === 'pending' && (
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

                        {!isPublicReturn && row.status === 'borrowed' && (
                          <button
                            onClick={() => confirmReturn(row.id)}
                            className="px-3 py-1 rounded-lg bg-blue-600 text-white inline-flex items-center gap-1"
                          >
                            <Undo2 size={16} /> Konfirmasi Kembali
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={6}>
                    Tidak ada data
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
                    Detail lengkap data yang dipilih
                  </p>
                </div>
                <button className="btn-icon shrink-0" onClick={() => setDetail(null)}>
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-6">
                {detail.type === 'public-return' ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-3 text-sm">
                      <p><b>Nama Pengembali:</b> {detail.returnerName}</p>
                      <p><b>No. HP:</b> {detail.returnerPhone}</p>
                      <p><b>Barang:</b> {detail.itemName}</p>
                      <p><b>Kondisi Barang:</b> {detail.conditionOnReturn}</p>
                      <p><b>Catatan:</b> {detail.returnNotes || '-'}</p>
                      <p><b>Tanggal Submit:</b> {detail.submittedAt || '-'}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800 mb-3">Foto Barang Pengembalian</p>
                      {detail.returnPhoto ? (
                        <img
                          src={detail.returnPhoto}
                          alt="Barang Dikembalikan"
                          className="w-full h-[420px] object-cover rounded-2xl border border-gray-200"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">Belum ada foto pengembalian</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-3 text-sm">
                      <p><b>Nama:</b> {detail.borrowerName}</p>
                      <p><b>Email:</b> {detail.borrowerEmail || '-'}</p>
                      <p><b>HP:</b> {detail.borrowerPhone}</p>
                      <p><b>Instansi:</b> {detail.borrowerInstitution}</p>
                      <p><b>Alamat:</b> {detail.borrowerAddress || '-'}</p>
                      <p><b>No Identitas:</b> {detail.identityNumber}</p>
                      <p><b>Jenis:</b> {detail.borrowType}</p>
                      <p><b>Barang:</b> {detail.itemName}</p>
                      <p><b>Jumlah:</b> {detail.quantity}</p>
                      <p><b>Keperluan:</b> {detail.notes || '-'}</p>
                      <p><b>Rencana Kembali:</b> {detail.expectedReturn || '-'}</p>
                      <p><b>Durasi:</b> {detail.durationDays || 0} hari</p>
                      <p><b>Status:</b> {detail.status}</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="font-semibold text-gray-800 mb-3">Foto Kartu Identitas</p>
                        {detail.identityPhoto ? (
                          <img
                            src={detail.identityPhoto}
                            alt="Kartu Identitas"
                            className="w-full h-[320px] object-cover rounded-2xl border border-gray-200"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Belum ada foto identitas</div>
                        )}
                      </div>

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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}