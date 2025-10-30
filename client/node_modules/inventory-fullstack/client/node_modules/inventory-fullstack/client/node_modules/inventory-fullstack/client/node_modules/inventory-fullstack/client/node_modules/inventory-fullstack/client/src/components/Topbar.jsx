import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Menu, Bell, AlertTriangle, Clock, CheckCircle2, XCircle, User as UserIcon, Package } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

const READ_KEY = 'notif_read_keys_v2'

function localISO(d=new Date()){
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
function parseISO(iso){
  if(!iso) return null
  const [y,m,d] = iso.split('-').map(Number)
  return new Date(y, (m||1)-1, d||1)
}
function daysBetween(aISO, bISO){
  const a = parseISO(aISO)
  const b = parseISO(bISO)
  if(!a || !b) return 0
  const ms = a.getTime() - b.getTime()
  return Math.round(ms/(1000*60*60*24))
}
function loadSet(){
  try{ return new Set(JSON.parse(localStorage.getItem(READ_KEY)||'[]')) }catch{ return new Set() }
}
function saveSet(s){
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(s)))
}

export default function Topbar({ user, onToggleSidebar }) {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [borrowings, setBorrowings] = useState([])
  const [loading, setLoading] = useState(false)
  const [readVersion, setReadVersion] = useState(0)
  const bellWrapRef = useRef(null)
  const today = localISO()

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    nav('/login')
  }

  const loadData = async ()=>{
    setLoading(true)
    try{
      const reqs = [api.get('/borrowings')]
      if (user?.role === 'admin') reqs.push(api.get('/items'))
      const [bRes, iRes] = await Promise.allSettled(reqs)
      if (bRes.status === 'fulfilled') setBorrowings(bRes.value.data||[])
      if (iRes?.status === 'fulfilled') setItems(iRes.value.data||[])
    } finally { setLoading(false) }
  }

  useEffect(()=>{ 
    loadData()
    const iv = setInterval(loadData, 60000)
    const onVis = ()=>{ if (document.visibilityState==='visible') loadData() }
    document.addEventListener('visibilitychange', onVis)
    return ()=>{ clearInterval(iv); document.removeEventListener('visibilitychange', onVis) }
  },[])

  // Tutup dropdown saat klik di luar
  useEffect(()=>{
    const onClickOutside = (e)=>{
      if (open && bellWrapRef.current && !bellWrapRef.current.contains(e.target)) {
        // saat menutup -> tandai sebagai dibaca
        markAllVisibleAsRead()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return ()=>document.removeEventListener('mousedown', onClickOutside)
  },[open]) // eslint-disable-line

  const readSet = useMemo(()=>loadSet(),[readVersion])

  // KUMPULKAN NOTIFIKASI (TANPA FILTER READSET)
  const notifications = useMemo(()=>{
    const list = []
    const add = n => list.push(n)

    if (user?.role === 'admin') {
      // Admin: pending requests + stok menipis
      borrowings.filter(b=>b.status==='pending').forEach(b=>{
        const key = `pend:${b.id}:${today}`
        add({ key, type:'info', title:'Permintaan Peminjaman', desc:`${b.userName} mengajukan ${b.itemName} (${b.quantity} unit).`, href:'/items-out', icon:<UserIcon size={16}/> })
      })
      items.filter(it=>Number(it.stock||0) <= Number(it.minStock||0)).forEach(it=>{
        const key = `stocklow:${it.id}:${today}`
        add({ key, type:'warn', title:'Stok Menipis', desc:`${it.name} stok ${it.stock} (min ${it.minStock}).`, href:'/items', icon:<Package size={16}/> })
      })
    } else {
      // User: ACC/ditolak + jatuh tempo/terlambat
      borrowings.forEach(b=>{
        if (String(b.userId)!==String(user?.id)) return

        // ACC / Ditolak (sekali)
        const kApproved = `st:${b.id}:ok`
        const kRejected = `st:${b.id}:rej`
        if (b.status==='borrowed') {
          add({ key:kApproved, type:'success', title:'Pengajuan Disetujui', desc:`${b.itemName} disetujui (${b.quantity} unit).`, href:'/borrowing', icon:<CheckCircle2 size={16}/> })
        }
        if (b.status==='rejected') {
          add({ key:kRejected, type:'error', title:'Pengajuan Ditolak', desc:`${b.itemName} ditolak.`, href:'/borrowing', icon:<XCircle size={16}/> })
        }

        // Jatuh tempo
        if (b.status==='borrowed' && b.expectedReturn) {
          const left = daysBetween(b.expectedReturn, today)
          if (left < 0) {
            const key = `due:${b.id}:over:${today}`
            add({ key, type:'error', title:'Terlambat Pengembalian', desc:`${b.itemName} terlambat ${Math.abs(left)} hari.`, href:'/borrowing', icon:<AlertTriangle size={16}/> })
          } else if (left === 0) {
            const key = `due:${b.id}:today:${today}`
            add({ key, type:'warn', title:'Jatuh Tempo Hari Ini', desc:`${b.itemName} harus kembali hari ini.`, href:'/borrowing', icon:<Clock size={16}/> })
          } else if (left <= 2) {
            const key = `due:${b.id}:soon:${today}`
            add({ key, type:'info', title:'Jatuh Tempo Dekat', desc:`${b.itemName} ${left} hari lagi jatuh tempo.`, href:'/borrowing', icon:<Clock size={16}/> })
          }
        }
      })
    }

    const weight = { error:0, warn:1, info:2, success:3 }
    return list.sort((a,b)=>weight[a.type]-weight[b.type])
  },[borrowings,items,user,today])

  // Badge merah: hanya hitung yang belum dibaca
  const unreadCount = useMemo(()=>{
    return notifications.reduce((n,x)=> n + (readSet.has(x.key)?0:1), 0)
  },[notifications, readSet])

  // Tandai semua notifikasi yang sedang terlihat sebagai read
  const markAllVisibleAsRead = ()=>{
    const s = loadSet()
    notifications.forEach(n=>s.add(n.key))
    saveSet(s)
    setReadVersion(v=>v+1)
  }

  // Klik tombol bel (toggle). Saat MENUTUP, tandai read.
  const toggleBell = ()=>{
    if (open) markAllVisibleAsRead()
    setOpen(o=>!o)
  }

  const onClickItem = ()=>{
    // menutup + tandai read
    markAllVisibleAsRead()
    setOpen(false)
  }

  const pill = t => t==='error'?'bg-red-50 text-red-700 border border-red-200'
    : t==='warn'?'bg-amber-50 text-amber-700 border border-amber-200'
    : t==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-blue-50 text-blue-700 border border-blue-200'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-10">
      <button onClick={onToggleSidebar} className="btn-icon"><Menu size={18}/></button>
      <div className="flex items-center gap-3">
        <div className="relative" ref={bellWrapRef}>
          <button className="btn-icon relative" onClick={toggleBell}>
            <Bell size={18}/>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                {unreadCount>99?'99+':unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-[360px] max-h-[70vh] overflow-auto rounded-xl bg-white shadow-lg border border-gray-100 p-2">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500">Notifikasi</div>
              {loading && <div className="p-3 text-sm text-gray-500">Memuat...</div>}
              {!loading && notifications.length===0 && <div className="p-4 text-sm text-gray-500">Tidak ada notifikasi</div>}
              {!loading && notifications.map(n=>(
                <Link to={n.href} key={n.key} className={`flex items-start gap-3 p-3 rounded-lg mb-1 hover:bg-gray-50 ${pill(n.type)}`} onClick={onClickItem}>
                  <div className="mt-[2px]">{n.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="text-xs mt-0.5">{n.desc}</div>
                  </div>
                </Link>
              ))}
              <div className="flex items-center justify-between gap-2 p-2">
                <Link to={user?.role==='admin'?'/items-out':'/borrowing'} className="text-xs text-blue-600 hover:underline" onClick={onClickItem}>Lihat halaman terkait</Link>
                <button className="text-xs text-gray-500 hover:text-gray-700" onClick={onClickItem}>Tandai semua dibaca</button>
              </div>
            </div>
          )}
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-tight">{user.fullName}</p>
          <button onClick={logout} className="text-xs text-red-600 hover:underline">Logout</button>
        </div>
      </div>
    </header>
  )
}
