import React, { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import api from '../api'

export default function Settings(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [language, setLanguage] = useState('Indonesia')
  const [theme, setTheme] = useState(localStorage.getItem('theme')||'light')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const applyTheme = t=>{
    const root = document.documentElement
    if(t==='dark'){ root.classList.add('dark') } else { root.classList.remove('dark') }
  }

  useEffect(()=>{ applyTheme(theme) },[])

  const saveTheme = async ()=>{
    setSavingTheme(true)
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    await new Promise(r=>setTimeout(r,200))
    setSavingTheme(false)
  }

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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Pengaturan</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola pengaturan akun dan sistem</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{user.fullName}</h3>
            <p className="text-gray-600 dark:text-gray-300">{user.username}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${user.role==='admin'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>{user.role==='admin'?'Administrator':'User'}</span>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold mb-3">Preferensi</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Bahasa</label>
              <select className="input" value={language} onChange={e=>setLanguage(e.target.value)}>
                <option>Indonesia</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Tema</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={()=>setTheme('light')} className={`px-4 py-2 rounded-xl border ${theme==='light'?'bg-blue-600 text-white border-blue-600':'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'}`}>Terang</button>
                <button type="button" onClick={()=>setTheme('dark')} className={`px-4 py-2 rounded-xl border ${theme==='dark'?'bg-blue-600 text-white border-blue-600':'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'}`}>Gelap</button>
                <button onClick={saveTheme} className="btn-primary ml-auto" disabled={savingTheme}>{savingTheme?'Menyimpan...':'Simpan Tema'}</button>
              </div>
            </div>
          </div>
        </div>
        <div className="card lg:col-span-3">
          <h3 className="text-lg font-bold mb-3">Ubah Password</h3>
          <form onSubmit={submitPassword} className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Password Saat Ini</label>
              <div className="relative">
                <input className="input pr-10" type={showCur?'text':'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
                <button type="button" onClick={()=>setShowCur(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  {showCur ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Password Baru</label>
              <div className="relative">
                <input className="input pr-10" type={showNew?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
                <button type="button" onClick={()=>setShowNew(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Konfirmasi Password Baru</label>
              <div className="relative">
                <input className="input pr-10" type={showCfm?'text':'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                <button type="button" onClick={()=>setShowCfm(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
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
