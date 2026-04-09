import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool, { testMysqlConnection } from './db/mysql.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '30mb' }))

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret_super_secret_replace_me'
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')

const files = {
  users: path.join(dataDir, 'users.json'),
  items: path.join(dataDir, 'items.json'),
  transactions: path.join(dataDir, 'transactions.json'),
  borrowings: path.join(dataDir, 'borrowings.json'),
  publicReturns: path.join(dataDir, 'publicReturns.json'),
  publicConfig: path.join(dataDir, 'publicConfig.json')
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8')
  }
}

function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function normalizeServiceMode(value) {
  const raw = String(value || 'both').toLowerCase().trim()

  if (raw === 'pinjam') return 'borrow'
  if (raw === 'peminjaman') return 'borrow'
  if (raw === 'borrow') return 'borrow'
  if (raw === 'sewa') return 'rent'
  if (raw === 'penyewaan') return 'rent'
  if (raw === 'rent') return 'rent'
  if (raw === 'both') return 'both'
  if (raw === 'keduanya') return 'both'
  if (raw === 'pinjam_dan_sewa') return 'both'

  return 'both'
}

function normalizeBorrowType(value) {
  const raw = String(value || 'peminjaman').toLowerCase().trim()

  if (raw === 'rent') return 'penyewaan'
  if (raw === 'sewa') return 'penyewaan'
  if (raw === 'penyewaan') return 'penyewaan'
  if (raw === 'borrow') return 'peminjaman'
  if (raw === 'pinjam') return 'peminjaman'
  if (raw === 'peminjaman') return 'peminjaman'

  return 'peminjaman'
}

function initDataFiles() {
  ensureDir(dataDir)

  ensureFile(files.users, [
    {
      id: 1,
      username: 'admin',
      password: 'admin',
      role: 'admin',
      fullName: 'Administrator',
      email: 'admin@inventory.com',
      status: 'active',
      joinDate: '2024-01-15'
    }
  ])

  ensureFile(files.items, [
    {
      id: 1,
      name: 'Laptop Ngawi',
      code: 'LPT-001',
      category: 'Elektronik',
      stock: 5,
      minStock: 2,
      condition: 'Baik',
      location: 'Gudang A',
      price: 25000000,
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400',
      serviceMode: 'both'
    },
    {
      id: 2,
      name: 'Proyektor Amba',
      code: 'PRJ-001',
      category: 'Elektronik',
      stock: 3,
      minStock: 1,
      condition: 'Baik',
      location: 'Gudang B',
      price: 8500000,
      image: 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=400',
      serviceMode: 'both'
    },
    {
      id: 3,
      name: 'Kursi Kantor',
      code: 'FRN-001',
      category: 'Furniture',
      stock: 20,
      minStock: 5,
      condition: 'Baik',
      location: 'Gudang A',
      price: 3500000,
      image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400',
      serviceMode: 'borrow'
    },
    {
      id: 4,
      name: 'Lemari Razan',
      code: 'FRN-002',
      category: 'Furniture',
      stock: 5,
      minStock: 2,
      condition: 'Baik',
      location: 'Gudang C',
      price: 5200000,
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400',
      serviceMode: 'borrow'
    },
    {
      id: 5,
      name: 'Printer',
      code: 'PRT-001',
      category: 'Elektronik',
      stock: 8,
      minStock: 3,
      condition: 'Baik',
      location: 'Gudang B',
      price: 4200000,
      image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400',
      serviceMode: 'rent'
    },
    {
      id: 6,
      name: 'Mouse Logitech',
      code: 'ACC-001',
      category: 'Aksesoris',
      stock: 15,
      minStock: 10,
      condition: 'Baik',
      location: 'Gudang A',
      price: 350000,
      image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
      serviceMode: 'both'
    }
  ])

  ensureFile(files.transactions, [
    {
      id: 1,
      itemId: 1,
      itemName: 'Laptop Ngawi',
      type: 'in',
      quantity: 5,
      date: '2025-10-01',
      userId: 1,
      userName: 'Administrator',
      notes: 'Pembelian baru dari supplier',
      totalPrice: 125000000
    }
  ])

  ensureFile(files.borrowings, [])
  ensureFile(files.publicReturns, [])
  ensureFile(files.publicConfig, {
    rentalQrisLink: 'https://example.com/qris',
    rentalQrisImage: '',
    adminWhatsappNumber: '',
    whatsappApiUrl: '',
    whatsappApiToken: '',
    whatsappMessageTemplate:
      'Halo Admin, ada pengajuan penyewaan baru atas nama {{name}} untuk barang {{itemName}} sejumlah {{quantity}} unit. Bukti pembayaran sudah diupload.'
  })
}

initDataFiles()

function getUsers() {
  return readJson(files.users, [])
}
function saveUsers(data) {
  writeJson(files.users, data)
}

function getItems() {
  const rows = readJson(files.items, [])
  return rows.map(item => ({
    ...item,
    serviceMode: normalizeServiceMode(item.serviceMode || item.availableFor || item.type || 'both')
  }))
}
function saveItems(data) {
  const normalized = (data || []).map(item => ({
    ...item,
    serviceMode: normalizeServiceMode(item.serviceMode || item.availableFor || item.type || 'both')
  }))
  writeJson(files.items, normalized)
}

function getTransactions() {
  return readJson(files.transactions, [])
}
function saveTransactions(data) {
  writeJson(files.transactions, data)
}

function getBorrowings() {
  const rows = readJson(files.borrowings, [])
  return rows.map(row => ({
    ...row,
    borrowType: normalizeBorrowType(row.borrowType || 'peminjaman'),
    requestedBorrowDate: row.requestedBorrowDate || row.borrowDate || '',
    returnRequestStatus: row.returnRequestStatus || (row.status === 'return_requested' ? 'pending' : null),
    returnRequestedAt: row.returnRequestedAt || null,
    returnVerifiedAt: row.returnVerifiedAt || null,
    returnVerifiedBy: row.returnVerifiedBy || null,
    paymentProof: row.paymentProof || '',
    paymentProofName: row.paymentProofName || '',
    paymentStatus: row.paymentStatus || (normalizeBorrowType(row.borrowType) === 'penyewaan' ? 'pending_verification' : null),
    whatsappStatus: row.whatsappStatus || null,
    whatsappResponse: row.whatsappResponse || null,
    returnPhoto: row.returnPhoto || '',
    conditionOnReturn: row.conditionOnReturn || '',
    returnNotes: row.returnNotes || '',
    linkedReturnId: row.linkedReturnId || null
  }))
}
function saveBorrowings(data) {
  writeJson(files.borrowings, data)
}

function getPublicReturns() {
  return readJson(files.publicReturns, [])
}
function savePublicReturns(data) {
  writeJson(files.publicReturns, data)
}

function getPublicConfig() {
  const cfg = readJson(files.publicConfig, {
    rentalQrisLink: '',
    rentalQrisImage: '',
    adminWhatsappNumber: '',
    whatsappApiUrl: '',
    whatsappApiToken: '',
    whatsappMessageTemplate: ''
  })

  return {
    rentalQrisLink: cfg.rentalQrisLink || cfg.rentalQrLink || '',
    rentalQrisImage: cfg.rentalQrisImage || '',
    adminWhatsappNumber: cfg.adminWhatsappNumber || '',
    whatsappApiUrl: cfg.whatsappApiUrl || '',
    whatsappApiToken: cfg.whatsappApiToken || '',
    whatsappMessageTemplate:
      cfg.whatsappMessageTemplate ||
      'Halo Admin, ada pengajuan penyewaan baru atas nama {{name}} untuk barang {{itemName}} sejumlah {{quantity}} unit. Bukti pembayaran sudah diupload.'
  }
}
function savePublicConfig(data) {
  writeJson(files.publicConfig, data)
}

function nextId(list) {
  return list.length ? Math.max(...list.map(x => Number(x.id) || 0)) + 1 : 1
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function nowISODateTime() {
  return new Date().toISOString()
}

function diffDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const a = new Date(startDate)
  const b = new Date(endDate)
  const ms = b.getTime() - a.getTime()
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      username: user.username,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.replace('Bearer ', '').trim()

  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
}

function isItemAllowedForType(item, borrowType) {
  const mode = normalizeServiceMode(item?.serviceMode || 'both')
  const type = normalizeBorrowType(borrowType)

  if (mode === 'both') return true
  if (mode === 'borrow' && type === 'peminjaman') return true
  if (mode === 'rent' && type === 'penyewaan') return true

  return false
}

function fillTemplate(template, payload) {
  let text = String(template || '')
  Object.keys(payload || {}).forEach(key => {
    const val = payload[key] == null ? '' : String(payload[key])
    text = text.replaceAll(`{{${key}}}`, val)
  })
  return text
}

function cleanBase64Image(value) {
  if (!value) return ''
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed.startsWith('data:image/')) return ''
  return trimmed
}

function clearBorrowingMediaFields(borrowing) {
  if (!borrowing) return

  borrowing.paymentProof = ''
  borrowing.paymentProofName = ''
  borrowing.returnPhoto = ''
  borrowing.updatedAt = nowISODateTime()
}

function clearPublicReturnMediaFields(returnRow) {
  if (!returnRow) return

  returnRow.returnPhoto = ''
  returnRow.updatedAt = nowISODateTime()
}

function findActiveBorrowingForReturn({ borrowingId, itemId }) {
  const borrowings = getBorrowings()

  let targetBorrowing = null

  if (borrowingId) {
    targetBorrowing = borrowings.find(
      b => String(b.id) === String(borrowingId)
    )
  }

  if (!targetBorrowing && itemId) {
    const itemBorrowings = borrowings
      .filter(b => b.itemId === Number(itemId) && b.status === 'borrowed')
      .sort((a, b) => {
        const da = new Date(b.updatedAt || b.createdAt || b.approvedAt || 0).getTime()
        const db = new Date(a.updatedAt || a.createdAt || a.approvedAt || 0).getTime()
        return da - db
      })

    if (itemBorrowings.length) {
      targetBorrowing = itemBorrowings[0]
    }
  }

  return {
    borrowings,
    targetBorrowing
  }
}

function createPublicReturnRequest({
  borrowingId,
  itemId,
  returnerName,
  returnerPhone,
  conditionOnReturn,
  returnNotes,
  returnPhoto
}) {
  const { borrowings, targetBorrowing } = findActiveBorrowingForReturn({
    borrowingId,
    itemId
  })

  const publicReturns = getPublicReturns()
  const normalizedReturnPhoto = cleanBase64Image(returnPhoto)

  if (!targetBorrowing) {
    return {
      ok: false,
      status: 400,
      error: 'Data peminjaman aktif tidak ditemukan. Pilih barang beserta nama peminjam yang sedang aktif.'
    }
  }

  if (targetBorrowing.status !== 'borrowed') {
    return {
      ok: false,
      status: 400,
      error: 'Barang yang dipilih sudah tidak berada dalam status dipinjam / disewa.'
    }
  }

  if (targetBorrowing.returnRequestStatus === 'pending') {
    return {
      ok: false,
      status: 400,
      error: 'Pengembalian untuk data ini sudah diajukan dan sedang menunggu verifikasi admin.'
    }
  }

  if (!returnerName || !returnerPhone) {
    return {
      ok: false,
      status: 400,
      error: 'Nama pengembali dan no HP wajib diisi.'
    }
  }

  if (!normalizedReturnPhoto) {
    return {
      ok: false,
      status: 400,
      error: 'Foto barang yang dikembalikan wajib diupload.'
    }
  }

  const row = {
    id: nextId(publicReturns),
    type: 'return-request',
    borrowingId: targetBorrowing.id,
    itemId: targetBorrowing.itemId,
    itemName: targetBorrowing.itemName,
    borrowType: targetBorrowing.borrowType,
    returnerName,
    returnerPhone,
    conditionOnReturn: conditionOnReturn || 'Baik',
    returnNotes: returnNotes || '',
    returnPhoto: normalizedReturnPhoto,
    submittedAt: todayISO(),
    status: 'pending_verification',
    verifiedAt: null,
    verifiedBy: null,
    createdAt: nowISODateTime(),
    updatedAt: nowISODateTime()
  }

  targetBorrowing.linkedReturnId = row.id
  targetBorrowing.returnRequestStatus = 'pending'
  targetBorrowing.returnRequestedAt = todayISO()
  targetBorrowing.returnPhoto = normalizedReturnPhoto
  targetBorrowing.conditionOnReturn = conditionOnReturn || 'Baik'
  targetBorrowing.returnNotes = returnNotes || ''
  targetBorrowing.updatedAt = nowISODateTime()

  publicReturns.unshift(row)

  savePublicReturns(publicReturns)
  saveBorrowings(borrowings)

  return {
    ok: true,
    status: 200,
    payload: {
      success: true,
      message: 'Permintaan pengembalian berhasil dikirim dan menunggu verifikasi admin',
      borrowing: targetBorrowing,
      returnRow: row
    }
  }
}

function verifyBorrowingReturnById({ borrowingId, adminName, adminUserId }) {
  const id = Number(borrowingId)
  const borrowings = getBorrowings()
  const items = getItems()
  const transactions = getTransactions()
  const publicReturns = getPublicReturns()

  const borrowing = borrowings.find(x => x.id === id)
  if (!borrowing) {
    return {
      ok: false,
      status: 404,
      error: 'Not found'
    }
  }

  if (borrowing.status !== 'borrowed') {
    return {
      ok: false,
      status: 400,
      error: 'Status tidak valid untuk verifikasi pengembalian'
    }
  }

  if (borrowing.returnRequestStatus !== 'pending') {
    return {
      ok: false,
      status: 400,
      error: 'Belum ada form pengembalian yang diajukan'
    }
  }

  const item = items.find(i => i.id === borrowing.itemId)
  if (!item) {
    return {
      ok: false,
      status: 404,
      error: 'Item not found'
    }
  }

  borrowing.status = 'returned'
  borrowing.returnDate = todayISO()
  borrowing.returnRequestStatus = 'verified'
  borrowing.returnVerifiedAt = todayISO()
  borrowing.returnVerifiedBy = adminName
  borrowing.updatedAt = nowISODateTime()

  item.stock += Number(borrowing.quantity)

  let linkedReturn = null

  if (borrowing.linkedReturnId) {
    linkedReturn = publicReturns.find(r => r.id === borrowing.linkedReturnId)
    if (linkedReturn) {
      linkedReturn.status = 'verified'
      linkedReturn.verifiedAt = todayISO()
      linkedReturn.verifiedBy = adminName
      linkedReturn.updatedAt = nowISODateTime()
    }
  }

  const trans = {
    id: nextId(transactions),
    itemId: borrowing.itemId,
    itemName: borrowing.itemName,
    type: 'in',
    quantity: Number(borrowing.quantity),
    date: todayISO(),
    userId: adminUserId,
    userName: adminName,
    notes:
      borrowing.borrowType === 'penyewaan'
        ? 'Pengembalian penyewaan diverifikasi admin'
        : 'Pengembalian peminjaman diverifikasi admin'
  }

  transactions.unshift(trans)

  clearBorrowingMediaFields(borrowing)
  clearPublicReturnMediaFields(linkedReturn)

  saveItems(items)
  saveBorrowings(borrowings)
  saveTransactions(transactions)
  savePublicReturns(publicReturns)

  return {
    ok: true,
    status: 200,
    payload: {
      success: true,
      message: 'Pengembalian berhasil diverifikasi',
      borrowing,
      transaction: trans
    }
  }
}

async function sendWhatsappNotification({ config, borrowing }) {
  const apiUrl = String(config?.whatsappApiUrl || '').trim()
  const apiToken = String(config?.whatsappApiToken || '').trim()
  const adminWhatsappNumber = String(config?.adminWhatsappNumber || '').trim()

  if (!apiUrl || !adminWhatsappNumber) {
    return {
      success: false,
      skipped: true,
      message: 'WhatsApp API belum dikonfigurasi lengkap'
    }
  }

  const message = fillTemplate(config?.whatsappMessageTemplate, {
    name: borrowing.borrowerName || '-',
    itemName: borrowing.itemName || '-',
    quantity: borrowing.quantity || 0,
    type: borrowing.borrowType || '-',
    expectedReturn: borrowing.expectedReturn || '-'
  })

  try {
    const headers = {
      'Content-Type': 'application/json'
    }

    if (apiToken) {
      headers.Authorization = `Bearer ${apiToken}`
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: adminWhatsappNumber,
        phone: adminWhatsappNumber,
        number: adminWhatsappNumber,
        message,
        text: message,
        caption: message,
        borrowerName: borrowing.borrowerName,
        itemName: borrowing.itemName,
        quantity: borrowing.quantity,
        paymentProof: borrowing.paymentProof || '',
        paymentProofName: borrowing.paymentProofName || ''
      })
    })

    let body = null
    try {
      body = await response.json()
    } catch {
      body = null
    }

    return {
      success: response.ok,
      skipped: false,
      status: response.status,
      body
    }
  } catch (error) {
    return {
      success: false,
      skipped: false,
      message: error?.message || 'Gagal menghubungi WhatsApp API'
    }
  }
}

async function bootstrapMysqlConnection() {
  try {
    const status = await testMysqlConnection()
    console.log('MySQL connected:', status)
  } catch (error) {
    console.error('MySQL connection failed:', error?.message || error)
  }
}

app.get('/api/db-status', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS database_name, NOW() AS server_time')
    return res.json({
      success: true,
      message: 'Koneksi database MySQL berhasil',
      database: rows?.[0]?.database_name || process.env.DB_NAME || 'inventory',
      serverTime: rows?.[0]?.server_time || null,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306)
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Koneksi database MySQL gagal',
      error: error?.message || 'Unknown database error'
    })
  }
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const users = getUsers()
  const user = users.find(u => u.username === username && u.password === password)

  if (!user) {
    return res.status(401).json({ error: 'Username atau password admin salah' })
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Login hanya untuk admin' })
  }

  const token = signToken(user)

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email
    }
  })
})

app.post('/api/auth/change-password', auth, isAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body
  const users = getUsers()

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Invalid payload' })
  }

  const userIndex = users.findIndex(u => u.id === req.user.id)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (users[userIndex].password !== currentPassword) {
    return res.status(400).json({ success: false, message: 'Password saat ini salah' })
  }

  users[userIndex].password = newPassword
  saveUsers(users)

  return res.json({ success: true })
})

app.get('/api/public-config', (_req, res) => {
  res.json(getPublicConfig())
})

app.put('/api/public-config/qris', auth, isAdmin, (req, res) => {
  const current = getPublicConfig()
  const {
    rentalQrisLink,
    rentalQrisImage,
    adminWhatsappNumber,
    whatsappApiUrl,
    whatsappApiToken,
    whatsappMessageTemplate
  } = req.body

  const updated = {
    ...current,
    rentalQrisLink: rentalQrisLink ?? current.rentalQrisLink ?? '',
    rentalQrisImage: rentalQrisImage ?? current.rentalQrisImage ?? '',
    adminWhatsappNumber: adminWhatsappNumber ?? current.adminWhatsappNumber ?? '',
    whatsappApiUrl: whatsappApiUrl ?? current.whatsappApiUrl ?? '',
    whatsappApiToken: whatsappApiToken ?? current.whatsappApiToken ?? '',
    whatsappMessageTemplate:
      whatsappMessageTemplate ?? current.whatsappMessageTemplate ?? ''
  }

  savePublicConfig(updated)
  res.json(updated)
})

app.put('/api/public-config/rental-qr', auth, isAdmin, (req, res) => {
  const current = getPublicConfig()
  const { rentalQrLink, rentalQrisLink } = req.body

  const updated = {
    ...current,
    rentalQrisLink: rentalQrisLink || rentalQrLink || current.rentalQrisLink || ''
  }

  savePublicConfig(updated)
  res.json(updated)
})

app.get('/api/items', (_req, res) => {
  res.json(getItems())
})

app.post('/api/items', auth, isAdmin, (req, res) => {
  const items = getItems()

  const item = {
    id: nextId(items),
    ...req.body,
    stock: Number(req.body.stock || 0),
    minStock: Number(req.body.minStock || 0),
    price: Number(req.body.price || 0),
    serviceMode: normalizeServiceMode(req.body.serviceMode || 'both')
  }

  items.push(item)
  saveItems(items)
  res.json(item)
})

app.put('/api/items/:id', auth, isAdmin, (req, res) => {
  const id = Number(req.params.id)
  const items = getItems()

  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Item not found' })

  items[idx] = {
    ...items[idx],
    ...req.body,
    stock: Number(req.body.stock ?? items[idx].stock ?? 0),
    minStock: Number(req.body.minStock ?? items[idx].minStock ?? 0),
    price: Number(req.body.price ?? items[idx].price ?? 0),
    serviceMode: normalizeServiceMode(req.body.serviceMode ?? items[idx].serviceMode ?? 'both')
  }

  saveItems(items)
  res.json(items[idx])
})

app.delete('/api/items/:id', auth, isAdmin, (req, res) => {
  const id = Number(req.params.id)
  const items = getItems().filter(i => i.id !== id)
  saveItems(items)
  res.json({ ok: true })
})

app.get('/api/transactions', auth, isAdmin, (_req, res) => {
  res.json(getTransactions())
})

app.post('/api/transactions/in', auth, isAdmin, (req, res) => {
  const { itemId, quantity, notes, totalPrice } = req.body
  const items = getItems()
  const transactions = getTransactions()

  const item = items.find(i => i.id === Number(itemId))
  if (!item) return res.status(404).json({ error: 'Item not found' })

  item.stock += Number(quantity)

  const trans = {
    id: nextId(transactions),
    itemId: Number(itemId),
    itemName: item.name,
    type: 'in',
    quantity: Number(quantity),
    date: todayISO(),
    userId: req.user.id,
    userName: req.user.fullName,
    notes: notes || '',
    totalPrice: Number(totalPrice || 0)
  }

  transactions.unshift(trans)
  saveItems(items)
  saveTransactions(transactions)

  res.json(trans)
})

app.post('/api/transactions/out', auth, isAdmin, (req, res) => {
  const { itemId, quantity, notes } = req.body
  const items = getItems()
  const transactions = getTransactions()

  const item = items.find(i => i.id === Number(itemId))
  if (!item) return res.status(404).json({ error: 'Item not found' })
  if (item.stock < Number(quantity)) {
    return res.status(400).json({ error: 'Stok tidak cukup' })
  }

  item.stock -= Number(quantity)

  const trans = {
    id: nextId(transactions),
    itemId: Number(itemId),
    itemName: item.name,
    type: 'out',
    quantity: Number(quantity),
    date: todayISO(),
    userId: req.user.id,
    userName: req.user.fullName,
    notes: notes || ''
  }

  transactions.unshift(trans)
  saveItems(items)
  saveTransactions(transactions)

  res.json(trans)
})

app.get('/api/borrowings', (_req, res) => {
  res.json(getBorrowings())
})

app.post('/api/borrowings', async (req, res) => {
  const {
    borrowType,
    itemId,
    quantity,
    borrowDate,
    expectedReturn,
    notes,
    borrowerName,
    borrowerPhone,
    borrowerAddress,
    paymentProof,
    paymentProofName
  } = req.body

  const items = getItems()
  const borrowings = getBorrowings()
  const config = getPublicConfig()

  const normalizedBorrowType = normalizeBorrowType(borrowType || 'peminjaman')
  const item = items.find(i => i.id === Number(itemId))
  const requestedBorrowDate = borrowDate || todayISO()
  const submittedAt = todayISO()
  const normalizedPaymentProof = cleanBase64Image(paymentProof)

  if (!item) return res.status(404).json({ error: 'Item tidak ditemukan' })

  if (!isItemAllowedForType(item, normalizedBorrowType)) {
    return res.status(400).json({
      error: normalizedBorrowType === 'penyewaan'
        ? 'Barang ini tidak tersedia untuk penyewaan'
        : 'Barang ini tidak tersedia untuk peminjaman'
    })
  }

  if (!borrowerName || !borrowerPhone) {
    return res.status(400).json({
      error: 'Nama dan no HP wajib diisi'
    })
  }

  if (!expectedReturn) {
    return res.status(400).json({
      error: 'Tanggal pengembalian wajib diisi'
    })
  }

  if (expectedReturn < requestedBorrowDate) {
    return res.status(400).json({
      error: 'Tanggal pengembalian tidak boleh lebih awal dari tanggal pinjam'
    })
  }

  if (Number(quantity || 0) < 1) {
    return res.status(400).json({
      error: 'Jumlah minimal harus 1'
    })
  }

  if (normalizedBorrowType === 'penyewaan' && !normalizedPaymentProof) {
    return res.status(400).json({
      error: 'Bukti pembayaran wajib diupload untuk penyewaan'
    })
  }

  const borrowing = {
    id: nextId(borrowings),
    borrowType: normalizedBorrowType,
    itemId: Number(itemId),
    itemName: item.name,
    borrowerName,
    borrowerPhone,
    borrowerAddress: borrowerAddress || '',
    quantity: Number(quantity || 1),
    status: 'pending',
    notes: notes || '',
    submittedAt,
    requestedBorrowDate,
    approvedAt: null,
    borrowDate: null,
    expectedReturn: expectedReturn || '',
    returnDate: null,
    durationDays: diffDays(requestedBorrowDate, expectedReturn),
    linkedReturnId: null,
    returnRequestStatus: null,
    returnRequestedAt: null,
    returnVerifiedAt: null,
    returnVerifiedBy: null,
    returnPhoto: '',
    conditionOnReturn: '',
    returnNotes: '',
    paymentProof: normalizedPaymentProof || '',
    paymentProofName: paymentProofName || '',
    paymentStatus: normalizedBorrowType === 'penyewaan' ? 'pending_verification' : null,
    whatsappStatus: null,
    whatsappResponse: null,
    createdAt: nowISODateTime(),
    updatedAt: nowISODateTime()
  }

  if (normalizedBorrowType === 'penyewaan') {
    const waResult = await sendWhatsappNotification({
      config,
      borrowing
    })

    borrowing.whatsappStatus = waResult.success
      ? 'sent'
      : waResult.skipped
      ? 'skipped'
      : 'failed'

    borrowing.whatsappResponse = waResult
  }

  borrowings.unshift(borrowing)
  saveBorrowings(borrowings)

  res.json(borrowing)
})

app.patch('/api/borrowings/:id/approve', auth, isAdmin, (req, res) => {
  const id = Number(req.params.id)
  const borrowings = getBorrowings()
  const items = getItems()
  const transactions = getTransactions()

  const borrowing = borrowings.find(x => x.id === id)
  if (!borrowing) return res.status(404).json({ error: 'Not found' })
  if (borrowing.status !== 'pending') {
    return res.status(400).json({ error: 'Status tidak valid' })
  }

  const item = items.find(i => i.id === borrowing.itemId)
  if (!item) return res.status(404).json({ error: 'Item not found' })

  if (!isItemAllowedForType(item, borrowing.borrowType)) {
    return res.status(400).json({ error: 'Jenis layanan barang tidak sesuai' })
  }

  if (item.stock < Number(borrowing.quantity)) {
    return res.status(400).json({ error: 'Stok tidak cukup' })
  }

  item.stock -= Number(borrowing.quantity)
  borrowing.status = 'borrowed'
  borrowing.approvedAt = todayISO()
  borrowing.borrowDate = borrowing.requestedBorrowDate || todayISO()
  borrowing.updatedAt = nowISODateTime()

  const trans = {
    id: nextId(transactions),
    itemId: borrowing.itemId,
    itemName: borrowing.itemName,
    type: 'out',
    quantity: Number(borrowing.quantity),
    date: todayISO(),
    userId: req.user.id,
    userName: req.user.fullName,
    notes: `${borrowing.borrowType === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'} disetujui`
  }

  transactions.unshift(trans)

  saveItems(items)
  saveBorrowings(borrowings)
  saveTransactions(transactions)

  res.json(borrowing)
})

app.patch('/api/borrowings/:id/reject', auth, isAdmin, (req, res) => {
  const id = Number(req.params.id)
  const borrowings = getBorrowings()

  const borrowing = borrowings.find(x => x.id === id)
  if (!borrowing) return res.status(404).json({ error: 'Not found' })
  if (borrowing.status !== 'pending') {
    return res.status(400).json({ error: 'Status tidak valid' })
  }

  borrowing.status = 'rejected'
  borrowing.updatedAt = nowISODateTime()
  saveBorrowings(borrowings)

  res.json(borrowing)
})

app.post('/api/borrowings/:id/request-return', (req, res) => {
  const id = Number(req.params.id)
  const {
    returnerName,
    returnerPhone,
    conditionOnReturn,
    returnNotes,
    returnPhoto
  } = req.body

  const result = createPublicReturnRequest({
    borrowingId: id,
    itemId: null,
    returnerName,
    returnerPhone,
    conditionOnReturn,
    returnNotes,
    returnPhoto
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.post('/api/borrowings/:id/verify-return', auth, isAdmin, (req, res) => {
  const result = verifyBorrowingReturnById({
    borrowingId: req.params.id,
    adminName: req.user.fullName,
    adminUserId: req.user.id
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.post('/api/borrowings/:id/return', auth, isAdmin, (req, res) => {
  const id = Number(req.params.id)
  const borrowings = getBorrowings()
  const borrowing = borrowings.find(x => x.id === id)

  if (!borrowing) return res.status(404).json({ error: 'Not found' })

  if (borrowing.returnRequestStatus !== 'pending') {
    return res.status(400).json({
      error: 'Pengembalian harus melalui form terlebih dahulu sebelum diverifikasi admin'
    })
  }

  return res.status(400).json({
    error: 'Gunakan endpoint verifikasi pengembalian, bukan konfirmasi langsung'
  })
})

app.get('/api/returns-public', auth, isAdmin, (_req, res) => {
  const rows = getPublicReturns()
  res.json(rows)
})

app.post('/api/returns-public', (req, res) => {
  const {
    borrowingId,
    itemId,
    returnerName,
    returnerPhone,
    conditionOnReturn,
    returnNotes,
    returnPhoto
  } = req.body

  const result = createPublicReturnRequest({
    borrowingId,
    itemId,
    returnerName,
    returnerPhone,
    conditionOnReturn,
    returnNotes,
    returnPhoto
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.post('/api/returns-public/:id/verify', auth, isAdmin, (req, res) => {
  const id = Number(req.params.id)
  const publicReturns = getPublicReturns()
  const row = publicReturns.find(r => r.id === id)

  if (!row) {
    return res.status(404).json({ error: 'Data return tidak ditemukan' })
  }

  const result = verifyBorrowingReturnById({
    borrowingId: row.borrowingId,
    adminName: req.user.fullName,
    adminUserId: req.user.id
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.get('/', (_req, res) => res.send('Inventory API OK'))

bootstrapMysqlConnection().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
})