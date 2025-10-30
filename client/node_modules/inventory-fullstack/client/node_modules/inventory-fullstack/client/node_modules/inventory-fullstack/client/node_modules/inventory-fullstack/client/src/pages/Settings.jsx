import React, { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import api from '../api'

export default function Settings(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'Indonesia')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  useEffect(()=>{
    try{
      localStorage.setItem('lang', language)
      window.dispatchEvent(new CustomEvent('lang-changed', { detail: { lang: language } }))
    }catch{}
  },[language])

  const submitPassword = async e=>{
    e.preventDefault()
    setPwMsg(null)
    if(!currentPassword || !newPassword){ setPwMsg({type:'error',text:'Lengkapi semua kolom'}); return }
    if(newPassword!==confirmPassword){ setPwMsg({type:'error',text:'Konfirmasi password tidak sama'}); return }
    try{
      setSavingPw(true)
      const { data } = await api.post('/auth/change-password',{ currentPassword, newPassword })
      if(data?.success){
        setPwMsg({type:'success',text:'Password berhasil diubah'})
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      }else{
        setPwMsg({type:'error',text:data?.message||'Gagal mengubah password'})
      }
    }catch(err){
      setPwMsg({type:'error',text: err?.response?.data?.error || err?.response?.data?.message || 'Gagal mengubah password'})
    }finally{
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-600 mt-1">Kelola pengaturan akun dan sistem</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800">{user.fullName}</h3>
            <p className="text-gray-600">{user.username}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${user.role==='admin'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>{user.role==='admin'?'Administrator':'User'}</span>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold mb-3">Preferensi</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Bahasa</label>
              <select className="input" value={language} onChange={e=>setLanguage(e.target.value)}>
                <option value="Indonesia">Indonesia</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card lg:col-span-3">
          <h3 className="text-lg font-bold mb-3">Ubah Password</h3>
          <form onSubmit={submitPassword} className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Password Saat Ini</label>
              <div className="relative">
                <input className="input pr-10" type={showCur?'text':'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
                <button type="button" onClick={()=>setShowCur(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showCur ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Password Baru</label>
              <div className="relative">
                <input className="input pr-10" type={showNew?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
                <button type="button" onClick={()=>setShowNew(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Konfirmasi Password Baru</label>
              <div className="relative">
                <input className="input pr-10" type={showCfm?'text':'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                <button type="button" onClick={()=>setShowCfm(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showCfm ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <div className="md:col-span-3 flex items-center gap-3">
              <button className="btn-primary" disabled={savingPw}>{savingPw?'Menyimpan...':'Simpan Password'}</button>
              {pwMsg && (<span className={`${pwMsg.type==='success'?'text-emerald-600':'text-red-600'} text-sm font-medium`}>{pwMsg.text}</span>)}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
