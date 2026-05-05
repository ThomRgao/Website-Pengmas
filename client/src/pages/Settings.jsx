import React, { useEffect, useState } from 'react'
import { Eye, EyeOff, QrCode, MessageCircle, Link2, Image as ImageIcon, Phone } from 'lucide-react'
import api from '../api'

const logoDesa = '/logo-desa.png'

export default function Settings() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'Indonesia')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const [rentalQrisLink, setRentalQrisLink] = useState('')
  const [rentalQrisImage, setRentalQrisImage] = useState('')
  const [adminWhatsappNumber, setAdminWhatsappNumber] = useState('')
  const [whatsappApiUrl, setWhatsappApiUrl] = useState('')
  const [whatsappApiToken, setWhatsappApiToken] = useState('')
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState(
    'Halo Admin, ada pengajuan penyewaan baru atas nama {{name}} untuk barang {{itemName}} sejumlah {{quantity}} unit. Bukti pembayaran sudah diupload.'
  )

  const [savingQris, setSavingQris] = useState(false)
  const [qrisMsg, setQrisMsg] = useState(null)
  const [qrisUploadName, setQrisUploadName] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('lang', language)
      window.dispatchEvent(new CustomEvent('lang-changed', { detail: { lang: language } }))
    } catch {}
  }, [language])

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get('/public-config')
      setRentalQrisLink(data?.rentalQrisLink || data?.rentalQrLink || '')
      setRentalQrisImage(data?.rentalQrisImage || '')
      setAdminWhatsappNumber(data?.adminWhatsappNumber || '')
      setWhatsappApiUrl(data?.whatsappApiUrl || '')
      setWhatsappApiToken(data?.whatsappApiToken || '')
      setWhatsappMessageTemplate(
        data?.whatsappMessageTemplate ||
          'Halo Admin, ada pengajuan penyewaan baru atas nama {{name}} untuk barang {{itemName}} sejumlah {{quantity}} unit. Bukti pembayaran sudah diupload.'
      )
    })()
  }, [])

  const normalizeWhatsappNumber = value => {
    const raw = String(value || '').trim()
    const digits = raw.replace(/\D/g, '')

    if (!digits) return ''

    if (digits.startsWith('0')) {
      return `62${digits.slice(1)}`
    }

    if (digits.startsWith('62')) {
      return digits
    }

    return digits
  }

  const submitPassword = async e => {
    e.preventDefault()
    setPwMsg(null)

    if (!currentPassword || !newPassword) {
      setPwMsg({ type: 'error', text: 'Lengkapi semua kolom' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Konfirmasi password tidak sama' })
      return
    }

    try {
      setSavingPw(true)
      const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
      if (data?.success) {
        setPwMsg({ type: 'success', text: 'Password berhasil diubah' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPwMsg({ type: 'error', text: data?.message || 'Gagal mengubah password' })
      }
    } catch (err) {
      setPwMsg({
        type: 'error',
        text: err?.response?.data?.error || err?.response?.data?.message || 'Gagal mengubah password'
      })
    } finally {
      setSavingPw(false)
    }
  }

  const onSelectQrisImage = file => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setRentalQrisImage(reader.result)
      setQrisUploadName(file.name || 'qris-image')
    }
    reader.readAsDataURL(file)
  }

  const saveQris = async e => {
    e.preventDefault()
    setQrisMsg(null)

    try {
      setSavingQris(true)

      const cleanAdminWhatsappNumber = normalizeWhatsappNumber(adminWhatsappNumber)

      const { data } = await api.put('/public-config/qris', {
        rentalQrisLink,
        rentalQrisImage,
        adminWhatsappNumber: cleanAdminWhatsappNumber,
        whatsappApiUrl,
        whatsappApiToken,
        whatsappMessageTemplate
      })

      setRentalQrisLink(data?.rentalQrisLink || '')
      setRentalQrisImage(data?.rentalQrisImage || '')
      setAdminWhatsappNumber(data?.adminWhatsappNumber || '')
      setWhatsappApiUrl(data?.whatsappApiUrl || '')
      setWhatsappApiToken(data?.whatsappApiToken || '')
      setWhatsappMessageTemplate(data?.whatsappMessageTemplate || '')
      setQrisMsg({ type: 'success', text: 'Pengaturan QRIS dan WhatsApp admin berhasil disimpan' })
    } catch (err) {
      setQrisMsg({
        type: 'error',
        text: err?.response?.data?.error || 'Gagal menyimpan pengaturan QRIS / WhatsApp'
      })
    } finally {
      setSavingQris(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-600 mt-1">
          Kelola pengaturan akun admin, QRIS penyewaan, dan integrasi WhatsApp admin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-white border border-slate-200 shadow-sm mx-auto mb-4 overflow-hidden flex items-center justify-center p-2">
              <img
                src={logoDesa}
                alt="Logo Desa Cimaragas"
                className="w-full h-full object-contain"
              />
            </div>

            <h3 className="text-xl font-bold text-gray-800">{user.fullName}</h3>
            <p className="text-gray-600">{user.username}</p>
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 bg-purple-100 text-purple-700">
              Administrator
            </span>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold mb-3">Preferensi</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Bahasa</label>
              <select className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="Indonesia">Indonesia</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="text-blue-600" />
            <h3 className="text-lg font-bold">QRIS Penyewaan & WhatsApp Admin</h3>
          </div>

          <form onSubmit={saveQris} className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Link2 size={16} />
                  Link QRIS
                </label>
                <input
                  className="input"
                  value={rentalQrisLink}
                  onChange={e => setRentalQrisLink(e.target.value)}
                  placeholder="https://link-qris-atau-deeplink-pembayaran"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone size={16} />
                  Nomor WhatsApp Admin
                </label>
                <input
                  className="input"
                  value={adminWhatsappNumber}
                  onChange={e => setAdminWhatsappNumber(e.target.value)}
                  placeholder="Contoh: 6282288277920"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gunakan format internasional tanpa tanda +. Contoh: 628xxxxxxxxxx.
                  Jika mengetik 08xxxxxxxxxx, sistem akan otomatis menyimpan menjadi 628xxxxxxxxxx.
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <MessageCircle size={16} />
                  URL API WhatsApp
                </label>
                <input
                  className="input"
                  value={whatsappApiUrl}
                  onChange={e => setWhatsappApiUrl(e.target.value)}
                  placeholder="https://domain-api-whatsapp/send-message"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Token API WhatsApp</label>
                <input
                  className="input"
                  type="password"
                  value={whatsappApiToken}
                  onChange={e => setWhatsappApiToken(e.target.value)}
                  placeholder="Opsional, isi jika API WhatsApp memakai token"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <ImageIcon size={16} />
                Upload Gambar QRIS
              </label>
              <label className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => onSelectQrisImage(e.target.files?.[0])}
                />
                <div className="input cursor-pointer text-gray-600">
                  {qrisUploadName || 'Pilih gambar QRIS'}
                </div>
              </label>
            </div>

            <div>
              <label className="text-sm text-gray-600">Template Pesan WhatsApp</label>
              <textarea
                className="input min-h-[120px]"
                value={whatsappMessageTemplate}
                onChange={e => setWhatsappMessageTemplate(e.target.value)}
                placeholder="Gunakan placeholder {{name}}, {{itemName}}, {{quantity}}, {{type}}, {{expectedReturn}}"
              />
              <p className="text-xs text-gray-500 mt-2">
                Placeholder yang bisa dipakai: {'{{name}}'}, {'{{itemName}}'}, {'{{quantity}}'}, {'{{type}}'}, {'{{expectedReturn}}'}
              </p>
            </div>

            {(rentalQrisImage || rentalQrisLink || adminWhatsappNumber) && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex flex-col items-center gap-3">
                {(rentalQrisImage || rentalQrisLink) && (
                  <>
                    {rentalQrisImage ? (
                      <img
                        src={rentalQrisImage}
                        alt="QRIS Penyewaan"
                        className="rounded-xl border border-blue-200 bg-white p-2 max-w-[260px] max-h-[260px] object-contain"
                      />
                    ) : (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          rentalQrisLink
                        )}`}
                        alt="QRIS Penyewaan"
                        className="rounded-xl border border-blue-200 bg-white p-2"
                      />
                    )}
                  </>
                )}

                {rentalQrisLink && (
                  <p className="text-sm text-blue-700 break-all text-center">{rentalQrisLink}</p>
                )}

                {adminWhatsappNumber && (
                  <p className="text-sm text-blue-800 text-center">
                    Notifikasi penyewaan akan diarahkan ke nomor admin:{' '}
                    <b>{normalizeWhatsappNumber(adminWhatsappNumber)}</b>
                  </p>
                )}

                {whatsappApiUrl ? (
                  <p className="text-sm text-emerald-700 text-center">
                    API WhatsApp sudah dikonfigurasi.
                  </p>
                ) : (
                  <p className="text-sm text-amber-700 text-center">
                    URL API WhatsApp belum diisi. Sistem tetap bisa membuka WhatsApp manual melalui dashboard publik.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button className="btn-primary" disabled={savingQris}>
                {savingQris ? 'Menyimpan...' : 'Simpan Pengaturan QRIS & WhatsApp'}
              </button>
              {qrisMsg && (
                <span className={`${qrisMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'} text-sm font-medium`}>
                  {qrisMsg.text}
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="card lg:col-span-3">
          <h3 className="text-lg font-bold mb-3">Ubah Password</h3>
          <form onSubmit={submitPassword} className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Password Saat Ini</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showCur ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCur(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCur ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Password Baru</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showCfm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCfm(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCfm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="md:col-span-3 flex items-center gap-3">
              <button className="btn-primary" disabled={savingPw}>
                {savingPw ? 'Menyimpan...' : 'Simpan Password'}
              </button>
              {pwMsg && (
                <span className={`${pwMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'} text-sm font-medium`}>
                  {pwMsg.text}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}