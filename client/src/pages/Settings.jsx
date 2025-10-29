
import React from 'react'

export default function Settings(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
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
            <div><label className="text-sm text-gray-600">Bahasa</label><select className="input"><option>Indonesia</option><option>English</option></select></div>
            <div><label className="text-sm text-gray-600">Tema</label><select className="input"><option>Terang</option><option>Gelap</option></select></div>
          </div>
          <div className="mt-4">
            <button className="btn-primary">Simpan Perubahan</button>
          </div>
        </div>
      </div>
    </div>
  )
}
