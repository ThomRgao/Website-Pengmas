import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret_super_secret_replace_me'
const PORT = process.env.PORT || 5000

let publicConfig = {
  rentalQrLink: 'https://example.com/penyewaan'
}

let users = [
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
]

let items = [
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
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400'
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
    image: 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=400'
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
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400'
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
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400'
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
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400'
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
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400'
  }
]

let transactions = [
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
  },
  {
    id: 2,
    itemId: 2,
    itemName: 'Proyektor Amba',
    type: 'out',
    quantity: 1,
    date: '2025-10-15',
    userId: 1,
    userName: 'Administrator',
    notes: 'Peminjaman untuk presentasi client'
  },
  {
    id: 3,
    itemId: 3,
    itemName: 'Kursi Kantor',
    type: 'in',
    quantity: 10,
    date: '2025-10-10',
    userId: 1,
    userName: 'Administrator',
    notes: 'Restok furniture',
    totalPrice: 35000000
  },
  {
    id: 4,
    itemId: 5,
    itemName: 'Printer',
    type: 'out',
    quantity: 2,
    date: '2025-10-20',
    userId: 1,
    userName: 'Administrator',
    notes: 'Distribusi ke cabang'
  }
]

let borrowings = [
  {
    id: 1,
    borrowType: 'peminjaman',
    itemId: 1,
    itemName: 'Laptop Ngawi',
    borrowerName: 'Sanzy',
    borrowerEmail: 'sanzy@inventory.com',
    borrowerPhone: '081234567890',
    borrowerInstitution: 'Divisi IT',
    borrowerAddress: 'Ngawi',
    identityNumber: '3276010101010001',
    identityPhoto: '',
    quantity: 1,
    status: 'borrowed',
    notes: 'Untuk project development',
    submittedAt: '2025-10-18',
    approvedAt: '2025-10-20',
    borrowDate: '2025-10-20',
    expectedReturn: '2025-10-27',
    returnDate: null,
    durationDays: 7,
    returnRequested: false,
    returnRequestDate: null,
    conditionOnReturn: '',
    returnNotes: '',
    returnPhoto: ''
  },
  {
    id: 2,
    borrowType: 'penyewaan',
    itemId: 2,
    itemName: 'Proyektor Amba',
    borrowerName: 'Dina',
    borrowerEmail: 'dina@inventory.com',
    borrowerPhone: '081111111111',
    borrowerInstitution: 'Humas',
    borrowerAddress: 'Madiun',
    identityNumber: '3276010101010002',
    identityPhoto: '',
    quantity: 1,
    status: 'returned',
    notes: 'Presentasi client XYZ',
    submittedAt: '2025-10-12',
    approvedAt: '2025-10-15',
    borrowDate: '2025-10-15',
    expectedReturn: '2025-10-20',
    returnDate: '2025-10-20',
    durationDays: 5,
    returnRequested: true,
    returnRequestDate: '2025-10-20',
    conditionOnReturn: 'Baik',
    returnNotes: 'Dikembalikan langsung ke petugas',
    returnPhoto: ''
  }
]

let publicReturns = []

function nextId(list) {
  return list.length ? Math.max(...list.map(x => x.id)) + 1 : 1
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
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

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
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

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Invalid payload' })
  }

  const uIndex = users.findIndex(u => u.id === req.user.id)

  if (uIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (users[uIndex].password !== currentPassword) {
    return res.status(400).json({ success: false, message: 'Password saat ini salah' })
  }

  users[uIndex].password = newPassword
  return res.json({ success: true })
})

app.get('/api/public-config', (_req, res) => {
  res.json(publicConfig)
})

app.put('/api/public-config/rental-qr', auth, isAdmin, (req, res) => {
  const { rentalQrLink } = req.body
  publicConfig.rentalQrLink = rentalQrLink || ''
  res.json(publicConfig)
})

app.get('/api/items', (_req, res) => {
  res.json(items)
})

app.post('/api/items', auth, isAdmin, (req, res) => {
  const id = nextId(items)
  const item = {
    id,
    ...req.body,
    stock: Number(req.body.stock || 0),
    minStock: Number(req.body.minStock || 0)
  }

  items.push(item)
  res.json(item)
})

app.put('/api/items/:id', auth, isAdmin, (req, res) => {
  const id = +req.params.id

  items = items.map(i =>
    i.id === id
      ? {
          ...i,
          ...req.body,
          stock: Number(req.body.stock ?? i.stock ?? 0),
          minStock: Number(req.body.minStock ?? i.minStock ?? 0)
        }
      : i
  )

  res.json(items.find(i => i.id === id))
})

app.delete('/api/items/:id', auth, isAdmin, (req, res) => {
  const id = +req.params.id
  items = items.filter(i => i.id !== id)
  res.json({ ok: true })
})

app.get('/api/transactions', auth, isAdmin, (_req, res) => {
  res.json(transactions)
})

app.post('/api/transactions/in', auth, isAdmin, (req, res) => {
  const { itemId, quantity, notes, totalPrice } = req.body
  const item = items.find(i => i.id === +itemId)

  if (!item) return res.status(404).json({ error: 'Item not found' })

  item.stock += +quantity

  const trans = {
    id: nextId(transactions),
    itemId: +itemId,
    itemName: item.name,
    type: 'in',
    quantity: +quantity,
    date: todayISO(),
    userId: req.user.id,
    userName: req.user.fullName,
    notes,
    totalPrice: totalPrice || 0
  }

  transactions = [trans, ...transactions]
  res.json(trans)
})

app.post('/api/transactions/out', auth, isAdmin, (req, res) => {
  const { itemId, quantity, notes } = req.body
  const item = items.find(i => i.id === +itemId)

  if (!item) return res.status(404).json({ error: 'Item not found' })
  if (item.stock < +quantity) return res.status(400).json({ error: 'Stok tidak cukup' })

  item.stock -= +quantity

  const trans = {
    id: nextId(transactions),
    itemId: +itemId,
    itemName: item.name,
    type: 'out',
    quantity: +quantity,
    date: todayISO(),
    userId: req.user.id,
    userName: req.user.fullName,
    notes
  }

  transactions = [trans, ...transactions]
  res.json(trans)
})

app.get('/api/borrowings', (_req, res) => {
  res.json(borrowings)
})

app.post('/api/borrowings', (req, res) => {
  const {
    borrowType,
    itemId,
    quantity,
    expectedReturn,
    notes,
    borrowerName,
    borrowerEmail,
    borrowerPhone,
    borrowerInstitution,
    borrowerAddress,
    identityNumber,
    identityPhoto
  } = req.body

  const item = items.find(i => i.id === +itemId)

  if (!item) return res.status(404).json({ error: 'Item tidak ditemukan' })

  if (!borrowerName || !borrowerPhone || !borrowerInstitution || !identityNumber) {
    return res.status(400).json({
      error: 'Nama, no HP, instansi, dan no identitas wajib diisi'
    })
  }

  if (!identityPhoto) {
    return res.status(400).json({ error: 'Foto kartu identitas wajib diupload' })
  }

  const submittedAt = todayISO()
  const durationDays = diffDays(submittedAt, expectedReturn)

  const b = {
    id: nextId(borrowings),
    borrowType: borrowType || 'peminjaman',
    itemId: +itemId,
    itemName: item.name,
    borrowerName,
    borrowerEmail: borrowerEmail || '',
    borrowerPhone,
    borrowerInstitution,
    borrowerAddress: borrowerAddress || '',
    identityNumber,
    identityPhoto,
    quantity: +quantity || 1,
    status: 'pending',
    notes: notes || '',
    submittedAt,
    approvedAt: null,
    borrowDate: null,
    expectedReturn: expectedReturn || '',
    returnDate: null,
    durationDays,
    returnRequested: false,
    returnRequestDate: null,
    conditionOnReturn: '',
    returnNotes: '',
    returnPhoto: ''
  }

  borrowings = [b, ...borrowings]
  res.json(b)
})

app.get('/api/returns-public', auth, isAdmin, (_req, res) => {
  res.json(publicReturns)
})

app.post('/api/returns-public', (req, res) => {
  const {
    itemId,
    returnerName,
    returnerPhone,
    conditionOnReturn,
    returnNotes,
    returnPhoto
  } = req.body

  const item = items.find(i => i.id === +itemId)
  if (!item) return res.status(404).json({ error: 'Barang tidak ditemukan' })

  if (!returnerName || !returnerPhone || !returnPhoto) {
    return res.status(400).json({ error: 'Nama, no HP, dan foto barang wajib diisi' })
  }

  const row = {
    id: nextId(publicReturns),
    type: 'public-return',
    itemId: item.id,
    itemName: item.name,
    returnerName,
    returnerPhone,
    conditionOnReturn: conditionOnReturn || 'Baik',
    returnNotes: returnNotes || '',
    returnPhoto,
    submittedAt: todayISO()
  }

  publicReturns = [row, ...publicReturns]
  res.json(row)
})

app.patch('/api/borrowings/:id/approve', auth, isAdmin, (req, res) => {
  const id = +req.params.id
  const b = borrowings.find(x => x.id === id)

  if (!b) return res.status(404).json({ error: 'Not found' })
  if (b.status !== 'pending') return res.status(400).json({ error: 'Status tidak valid' })

  const item = items.find(i => i.id === b.itemId)
  if (!item) return res.status(404).json({ error: 'Item not found' })
  if (item.stock < b.quantity) return res.status(400).json({ error: 'Stok tidak cukup' })

  item.stock -= b.quantity
  b.status = 'borrowed'
  b.approvedAt = todayISO()
  b.borrowDate = todayISO()

  const trans = {
    id: nextId(transactions),
    itemId: b.itemId,
    itemName: b.itemName,
    type: 'out',
    quantity: b.quantity,
    date: b.borrowDate,
    userId: req.user.id,
    userName: req.user.fullName,
    notes: `${b.borrowType === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'} disetujui`
  }

  transactions = [trans, ...transactions]
  res.json(b)
})

app.patch('/api/borrowings/:id/reject', auth, isAdmin, (req, res) => {
  const id = +req.params.id
  const b = borrowings.find(x => x.id === id)

  if (!b) return res.status(404).json({ error: 'Not found' })
  if (b.status !== 'pending') return res.status(400).json({ error: 'Status tidak valid' })

  b.status = 'rejected'
  res.json(b)
})

app.post('/api/borrowings/:id/return', auth, isAdmin, (req, res) => {
  const id = +req.params.id
  const b = borrowings.find(x => x.id === id)

  if (!b) return res.status(404).json({ error: 'Not found' })
  if (b.status !== 'borrowed') return res.status(400).json({ error: 'Status tidak valid' })

  b.status = 'returned'
  b.returnDate = todayISO()

  const item = items.find(i => i.id === b.itemId)
  if (item) item.stock += b.quantity

  const trans = {
    id: nextId(transactions),
    itemId: b.itemId,
    itemName: b.itemName,
    type: 'in',
    quantity: b.quantity,
    date: b.returnDate,
    userId: req.user.id,
    userName: req.user.fullName,
    notes: 'Barang dikembalikan'
  }

  transactions = [trans, ...transactions]
  res.json(b)
})

app.get('/', (_req, res) => res.send('Inventory API OK'))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))