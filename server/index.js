import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import pool, { testMysqlConnection } from './db/mysql.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '30mb' }))

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret_super_secret_replace_me'
const PORT = Number(process.env.PORT || 5000)

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

function cleanBase64Image(value) {
  if (!value) return ''
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed.startsWith('data:image/')) return ''
  return trimmed
}

function fillTemplate(template, payload) {
  let text = String(template || '')
  Object.keys(payload || {}).forEach(key => {
    const val = payload[key] == null ? '' : String(payload[key])
    text = text.replaceAll(`{{${key}}}`, val)
  })
  return text
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

function mapUserRow(row) {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    joinDate: row.join_date
  }
}

function mapItemRow(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    stock: Number(row.stock || 0),
    minStock: Number(row.min_stock || 0),
    condition: row.condition,
    location: row.location,
    price: Number(row.price || 0),
    image: row.image,
    serviceMode: normalizeServiceMode(row.service_mode)
  }
}

function mapTransactionRow(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    type: row.type,
    quantity: Number(row.quantity || 0),
    date: row.date,
    userId: row.user_id,
    userName: row.user_name,
    notes: row.notes || '',
    totalPrice: Number(row.total_price || 0)
  }
}

function mapBorrowingRow(row) {
  return {
    id: row.id,
    borrowType: normalizeBorrowType(row.borrow_type),
    itemId: row.item_id,
    itemName: row.item_name,
    borrowerName: row.borrower_name,
    borrowerPhone: row.borrower_phone,
    borrowerAddress: row.borrower_address || '',
    quantity: Number(row.quantity || 0),
    status: row.status,
    notes: row.notes || '',
    submittedAt: row.submitted_at,
    requestedBorrowDate: row.requested_borrow_date || row.borrow_date || '',
    approvedAt: row.approved_at,
    borrowDate: row.borrow_date,
    expectedReturn: row.expected_return,
    returnDate: row.return_date,
    durationDays: Number(row.duration_days || 0),
    linkedReturnId: row.linked_return_id,
    returnRequestStatus: row.return_request_status,
    returnRequestedAt: row.return_requested_at,
    returnVerifiedAt: row.return_verified_at,
    returnVerifiedBy: row.return_verified_by,
    returnPhoto: row.return_photo || '',
    conditionOnReturn: row.condition_on_return || '',
    returnNotes: row.return_notes || '',
    paymentProof: row.payment_proof || '',
    paymentProofName: row.payment_proof_name || '',
    paymentStatus: row.payment_status || null,
    whatsappStatus: row.whatsapp_status || null,
    whatsappResponse: row.whatsapp_response || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapPublicReturnRow(row) {
  return {
    id: row.id,
    type: row.type,
    borrowingId: row.borrowing_id,
    itemId: row.item_id,
    itemName: row.item_name,
    borrowType: normalizeBorrowType(row.borrow_type),
    returnerName: row.returner_name,
    returnerPhone: row.returner_phone,
    conditionOnReturn: row.condition_on_return || 'Baik',
    returnNotes: row.return_notes || '',
    returnPhoto: row.return_photo || '',
    submittedAt: row.submitted_at,
    status: row.status,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapPublicConfigRow(row) {
  return {
    rentalQrisLink: row?.rental_qris_link || '',
    rentalQrisImage: row?.rental_qris_image || '',
    adminWhatsappNumber: row?.admin_whatsapp_number || '',
    whatsappApiUrl: row?.whatsapp_api_url || '',
    whatsappApiToken: row?.whatsapp_api_token || '',
    whatsappMessageTemplate:
      row?.whatsapp_message_template ||
      'Halo Admin, ada pengajuan penyewaan baru atas nama {{name}} untuk barang {{itemName}} sejumlah {{quantity}} unit. Bukti pembayaran sudah diupload.'
  }
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      full_name VARCHAR(150),
      email VARCHAR(150),
      status VARCHAR(50),
      join_date DATE
    );

    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(100) NOT NULL UNIQUE,
      category VARCHAR(100),
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      condition VARCHAR(50),
      location VARCHAR(150),
      price BIGINT NOT NULL DEFAULT 0,
      image TEXT,
      service_mode VARCHAR(50) NOT NULL DEFAULT 'both'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
      item_name VARCHAR(200),
      type VARCHAR(20) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      date DATE,
      user_id INTEGER,
      user_name VARCHAR(150),
      notes TEXT,
      total_price BIGINT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS borrowings (
      id SERIAL PRIMARY KEY,
      borrow_type VARCHAR(50) NOT NULL,
      item_id INTEGER REFERENCES items(id) ON DELETE RESTRICT,
      item_name VARCHAR(200),
      borrower_name VARCHAR(150),
      borrower_phone VARCHAR(100),
      borrower_address TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      notes TEXT,
      submitted_at DATE,
      requested_borrow_date DATE,
      approved_at DATE,
      borrow_date DATE,
      expected_return DATE,
      return_date DATE,
      duration_days INTEGER NOT NULL DEFAULT 0,
      linked_return_id INTEGER,
      return_request_status VARCHAR(50),
      return_requested_at DATE,
      return_verified_at DATE,
      return_verified_by VARCHAR(150),
      return_photo TEXT,
      condition_on_return VARCHAR(50),
      return_notes TEXT,
      payment_proof TEXT,
      payment_proof_name VARCHAR(255),
      payment_status VARCHAR(50),
      whatsapp_status VARCHAR(50),
      whatsapp_response JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public_returns (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50),
      borrowing_id INTEGER REFERENCES borrowings(id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES items(id) ON DELETE RESTRICT,
      item_name VARCHAR(200),
      borrow_type VARCHAR(50),
      returner_name VARCHAR(150),
      returner_phone VARCHAR(100),
      condition_on_return VARCHAR(50),
      return_notes TEXT,
      return_photo TEXT,
      submitted_at DATE,
      status VARCHAR(50),
      verified_at DATE,
      verified_by VARCHAR(150),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public_config (
      id SERIAL PRIMARY KEY,
      rental_qris_link TEXT,
      rental_qris_image TEXT,
      admin_whatsapp_number VARCHAR(50),
      whatsapp_api_url TEXT,
      whatsapp_api_token TEXT,
      whatsapp_message_template TEXT
    );
  `)

  await pool.query(
    `
    INSERT INTO users (username, password, role, full_name, email, status, join_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (username)
    DO UPDATE SET
      password = EXCLUDED.password,
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      status = EXCLUDED.status,
      join_date = EXCLUDED.join_date
    `,
    ['admin', 'admin', 'admin', 'Administrator', 'admin@inventory.com', 'active', '2024-01-15']
  )

  await pool.query(
    `
    INSERT INTO public_config (
      id,
      rental_qris_link,
      rental_qris_image,
      admin_whatsapp_number,
      whatsapp_api_url,
      whatsapp_api_token,
      whatsapp_message_template
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (id)
    DO NOTHING
    `,
    [
      1,
      'https://example.com/qris',
      '',
      '',
      '',
      '',
      'Halo Admin, ada pengajuan penyewaan baru atas nama {{name}} untuk barang {{itemName}} sejumlah {{quantity}} unit. Bukti pembayaran sudah diupload.'
    ]
  )

  const itemCountResult = await pool.query('SELECT COUNT(*)::int AS total FROM items')
  const totalItems = itemCountResult.rows[0]?.total || 0

  if (totalItems === 0) {
    await pool.query(
      `
      INSERT INTO items (name, code, category, stock, min_stock, condition, location, price, image, service_mode)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10),
        ($11,$12,$13,$14,$15,$16,$17,$18,$19,$20),
        ($21,$22,$23,$24,$25,$26,$27,$28,$29,$30),
        ($31,$32,$33,$34,$35,$36,$37,$38,$39,$40),
        ($41,$42,$43,$44,$45,$46,$47,$48,$49,$50),
        ($51,$52,$53,$54,$55,$56,$57,$58,$59,$60)
      `,
      [
        'Laptop Ngawi', 'LPT-001', 'Elektronik', 5, 2, 'Baik', 'Gudang A', 25000000, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400', 'both',
        'Proyektor Amba', 'PRJ-001', 'Elektronik', 3, 1, 'Baik', 'Gudang B', 8500000, 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=400', 'both',
        'Kursi Kantor', 'FRN-001', 'Furniture', 20, 5, 'Baik', 'Gudang A', 3500000, 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400', 'borrow',
        'Lemari Razan', 'FRN-002', 'Furniture', 5, 2, 'Baik', 'Gudang C', 5200000, 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400', 'borrow',
        'Printer', 'PRT-001', 'Elektronik', 8, 3, 'Baik', 'Gudang B', 4200000, 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400', 'rent',
        'Mouse Logitech', 'ACC-001', 'Aksesoris', 15, 10, 'Baik', 'Gudang A', 350000, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 'both'
      ]
    )
  }

  const transactionCountResult = await pool.query('SELECT COUNT(*)::int AS total FROM transactions')
  const totalTransactions = transactionCountResult.rows[0]?.total || 0

  if (totalTransactions === 0) {
    await pool.query(
      `
      INSERT INTO transactions (item_id, item_name, type, quantity, date, user_id, user_name, notes, total_price)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [1, 'Laptop Ngawi', 'in', 5, '2025-10-01', 1, 'Administrator', 'Pembelian baru dari supplier', 125000000]
    )
  }
}

async function getUsers() {
  const result = await pool.query('SELECT * FROM users ORDER BY id ASC')
  return result.rows.map(mapUserRow)
}

async function getItems() {
  const result = await pool.query('SELECT * FROM items ORDER BY id ASC')
  return result.rows.map(mapItemRow)
}

async function getTransactions() {
  const result = await pool.query('SELECT * FROM transactions ORDER BY id DESC')
  return result.rows.map(mapTransactionRow)
}

async function getBorrowings() {
  const result = await pool.query('SELECT * FROM borrowings ORDER BY id DESC')
  return result.rows.map(mapBorrowingRow)
}

async function getPublicReturns() {
  const result = await pool.query('SELECT * FROM public_returns ORDER BY id DESC')
  return result.rows.map(mapPublicReturnRow)
}

async function getPublicConfig() {
  const result = await pool.query('SELECT * FROM public_config WHERE id = 1 LIMIT 1')
  return mapPublicConfigRow(result.rows[0])
}

async function findBorrowingRowById(id) {
  const result = await pool.query('SELECT * FROM borrowings WHERE id = $1 LIMIT 1', [Number(id)])
  return result.rows[0] || null
}

async function findItemRowById(id) {
  const result = await pool.query('SELECT * FROM items WHERE id = $1 LIMIT 1', [Number(id)])
  return result.rows[0] || null
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
    const headers = { 'Content-Type': 'application/json' }

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

async function createPublicReturnRequest({
  borrowingId,
  itemId,
  returnerName,
  returnerPhone,
  conditionOnReturn,
  returnNotes,
  returnPhoto
}) {
  const normalizedReturnPhoto = cleanBase64Image(returnPhoto)

  let borrowingRow = null

  if (borrowingId) {
    const result = await pool.query(
      'SELECT * FROM borrowings WHERE id = $1 LIMIT 1',
      [Number(borrowingId)]
    )
    borrowingRow = result.rows[0] || null
  }

  if (!borrowingRow && itemId) {
    const result = await pool.query(
      `
      SELECT *
      FROM borrowings
      WHERE item_id = $1
        AND status = 'borrowed'
      ORDER BY COALESCE(updated_at, created_at, NOW()) DESC, id DESC
      LIMIT 1
      `,
      [Number(itemId)]
    )
    borrowingRow = result.rows[0] || null
  }

  if (!borrowingRow) {
    return {
      ok: false,
      status: 400,
      error: 'Data peminjaman aktif tidak ditemukan. Pilih barang beserta nama peminjam yang sedang aktif.'
    }
  }

  if (borrowingRow.status !== 'borrowed') {
    return {
      ok: false,
      status: 400,
      error: 'Barang yang dipilih sudah tidak berada dalam status dipinjam / disewa.'
    }
  }

  if (borrowingRow.return_request_status === 'pending') {
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

  const insertReturn = await pool.query(
    `
    INSERT INTO public_returns (
      type,
      borrowing_id,
      item_id,
      item_name,
      borrow_type,
      returner_name,
      returner_phone,
      condition_on_return,
      return_notes,
      return_photo,
      submitted_at,
      status,
      verified_at,
      verified_by,
      created_at,
      updated_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()
    )
    RETURNING *
    `,
    [
      'return-request',
      borrowingRow.id,
      borrowingRow.item_id,
      borrowingRow.item_name,
      borrowingRow.borrow_type,
      returnerName,
      returnerPhone,
      conditionOnReturn || 'Baik',
      returnNotes || '',
      normalizedReturnPhoto,
      todayISO(),
      'pending_verification',
      null,
      null
    ]
  )

  const returnRow = insertReturn.rows[0]

  await pool.query(
    `
    UPDATE borrowings
    SET
      linked_return_id = $1,
      return_request_status = $2,
      return_requested_at = $3,
      return_photo = $4,
      condition_on_return = $5,
      return_notes = $6,
      updated_at = NOW()
    WHERE id = $7
    `,
    [
      returnRow.id,
      'pending',
      todayISO(),
      normalizedReturnPhoto,
      conditionOnReturn || 'Baik',
      returnNotes || '',
      borrowingRow.id
    ]
  )

  const updatedBorrowing = await findBorrowingRowById(borrowingRow.id)

  return {
    ok: true,
    status: 200,
    payload: {
      success: true,
      message: 'Permintaan pengembalian berhasil dikirim dan menunggu verifikasi admin',
      borrowing: mapBorrowingRow(updatedBorrowing),
      returnRow: mapPublicReturnRow(returnRow)
    }
  }
}

async function verifyBorrowingReturnById({ borrowingId, adminName, adminUserId }) {
  const borrowingRow = await findBorrowingRowById(borrowingId)

  if (!borrowingRow) {
    return {
      ok: false,
      status: 404,
      error: 'Not found'
    }
  }

  if (borrowingRow.status !== 'borrowed') {
    return {
      ok: false,
      status: 400,
      error: 'Status tidak valid untuk verifikasi pengembalian'
    }
  }

  if (borrowingRow.return_request_status !== 'pending') {
    return {
      ok: false,
      status: 400,
      error: 'Belum ada form pengembalian yang diajukan'
    }
  }

  const itemRow = await findItemRowById(borrowingRow.item_id)

  if (!itemRow) {
    return {
      ok: false,
      status: 404,
      error: 'Item not found'
    }
  }

  await pool.query('BEGIN')

  try {
    await pool.query(
      `
      UPDATE borrowings
      SET
        status = $1,
        return_date = $2,
        return_request_status = $3,
        return_verified_at = $4,
        return_verified_by = $5,
        payment_proof = '',
        payment_proof_name = '',
        return_photo = '',
        updated_at = NOW()
      WHERE id = $6
      `,
      [
        'returned',
        todayISO(),
        'verified',
        todayISO(),
        adminName,
        borrowingRow.id
      ]
    )

    await pool.query(
      `
      UPDATE items
      SET stock = stock + $1
      WHERE id = $2
      `,
      [Number(borrowingRow.quantity || 0), borrowingRow.item_id]
    )

    if (borrowingRow.linked_return_id) {
      await pool.query(
        `
        UPDATE public_returns
        SET
          status = $1,
          verified_at = $2,
          verified_by = $3,
          return_photo = '',
          updated_at = NOW()
        WHERE id = $4
        `,
        ['verified', todayISO(), adminName, borrowingRow.linked_return_id]
      )
    }

    const transactionInsert = await pool.query(
      `
      INSERT INTO transactions (
        item_id,
        item_name,
        type,
        quantity,
        date,
        user_id,
        user_name,
        notes,
        total_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        borrowingRow.item_id,
        borrowingRow.item_name,
        'in',
        Number(borrowingRow.quantity || 0),
        todayISO(),
        adminUserId,
        adminName,
        borrowingRow.borrow_type === 'penyewaan'
          ? 'Pengembalian penyewaan diverifikasi admin'
          : 'Pengembalian peminjaman diverifikasi admin',
        0
      ]
    )

    await pool.query('COMMIT')

    const updatedBorrowing = await findBorrowingRowById(borrowingRow.id)

    return {
      ok: true,
      status: 200,
      payload: {
        success: true,
        message: 'Pengembalian berhasil diverifikasi',
        borrowing: mapBorrowingRow(updatedBorrowing),
        transaction: mapTransactionRow(transactionInsert.rows[0])
      }
    }
  } catch (error) {
    await pool.query('ROLLBACK')
    return {
      ok: false,
      status: 500,
      error: error?.message || 'Gagal memverifikasi pengembalian'
    }
  }
}

async function bootstrapMysqlConnection() {
  try {
    const status = await testMysqlConnection()
    console.log('PostgreSQL connected:', status)
  } catch (error) {
    console.error('PostgreSQL connection failed:', error?.message || error)
  }
}

app.get('/api/db-status', async (_req, res) => {
  try {
    const result = await pool.query('SELECT current_database() AS database_name, NOW() AS server_time')
    return res.json({
      success: true,
      message: 'Koneksi database PostgreSQL berhasil',
      database: result?.rows?.[0]?.database_name || process.env.DB_NAME || 'inventory',
      serverTime: result?.rows?.[0]?.server_time || null,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432)
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Koneksi database PostgreSQL gagal',
      error: error?.message || 'Unknown database error'
    })
  }
})

app.get('/api/debug/users', async (_req, res) => {
  const users = await getUsers()
  res.json(users.map(u => ({
    id: u.id,
    username: u.username,
    password: u.password,
    role: u.role,
    fullName: u.fullName,
    email: u.email
  })))
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const loginValue = String(username || '').trim()

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE (username = $1 OR email = $1)
        AND password = $2
      LIMIT 1
      `,
      [loginValue, String(password || '')]
    )

    const userRow = result.rows[0]

    if (!userRow) {
      return res.status(401).json({ error: 'Username/email atau password admin salah' })
    }

    if (userRow.role !== 'admin') {
      return res.status(403).json({ error: 'Login hanya untuk admin' })
    }

    const user = mapUserRow(userRow)
    const token = signToken(user)

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: error?.message || 'Internal server error' })
  }
})

app.post('/api/auth/change-password', auth, isAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Invalid payload' })
  }

  const currentUser = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.user.id])
  const user = currentUser.rows[0]

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (user.password !== currentPassword) {
    return res.status(400).json({ success: false, message: 'Password saat ini salah' })
  }

  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, req.user.id])

  return res.json({ success: true })
})

app.get('/api/public-config', async (_req, res) => {
  res.json(await getPublicConfig())
})

app.put('/api/public-config/qris', auth, isAdmin, async (req, res) => {
  const current = await getPublicConfig()
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
    whatsappMessageTemplate: whatsappMessageTemplate ?? current.whatsappMessageTemplate ?? ''
  }

  await pool.query(
    `
    UPDATE public_config
    SET
      rental_qris_link = $1,
      rental_qris_image = $2,
      admin_whatsapp_number = $3,
      whatsapp_api_url = $4,
      whatsapp_api_token = $5,
      whatsapp_message_template = $6
    WHERE id = 1
    `,
    [
      updated.rentalQrisLink,
      updated.rentalQrisImage,
      updated.adminWhatsappNumber,
      updated.whatsappApiUrl,
      updated.whatsappApiToken,
      updated.whatsappMessageTemplate
    ]
  )

  res.json(updated)
})

app.put('/api/public-config/rental-qr', auth, isAdmin, async (req, res) => {
  const current = await getPublicConfig()
  const { rentalQrLink, rentalQrisLink } = req.body

  const updatedLink = rentalQrisLink || rentalQrLink || current.rentalQrisLink || ''

  await pool.query(
    'UPDATE public_config SET rental_qris_link = $1 WHERE id = 1',
    [updatedLink]
  )

  res.json({
    ...current,
    rentalQrisLink: updatedLink
  })
})

app.get('/api/items', async (_req, res) => {
  res.json(await getItems())
})

app.post('/api/items', auth, isAdmin, async (req, res) => {
  const result = await pool.query(
    `
    INSERT INTO items (
      name,
      code,
      category,
      stock,
      min_stock,
      condition,
      location,
      price,
      image,
      service_mode
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      req.body.name,
      req.body.code,
      req.body.category || '',
      Number(req.body.stock || 0),
      Number(req.body.minStock || 0),
      req.body.condition || 'Baik',
      req.body.location || '',
      Number(req.body.price || 0),
      req.body.image || '',
      normalizeServiceMode(req.body.serviceMode || 'both')
    ]
  )

  res.json(mapItemRow(result.rows[0]))
})

app.put('/api/items/:id', auth, isAdmin, async (req, res) => {
  const existing = await findItemRowById(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Item not found' })

  const result = await pool.query(
    `
    UPDATE items
    SET
      name = $1,
      code = $2,
      category = $3,
      stock = $4,
      min_stock = $5,
      condition = $6,
      location = $7,
      price = $8,
      image = $9,
      service_mode = $10
    WHERE id = $11
    RETURNING *
    `,
    [
      req.body.name ?? existing.name,
      req.body.code ?? existing.code,
      req.body.category ?? existing.category,
      Number(req.body.stock ?? existing.stock ?? 0),
      Number(req.body.minStock ?? existing.min_stock ?? 0),
      req.body.condition ?? existing.condition,
      req.body.location ?? existing.location,
      Number(req.body.price ?? existing.price ?? 0),
      req.body.image ?? existing.image,
      normalizeServiceMode(req.body.serviceMode ?? existing.service_mode ?? 'both'),
      Number(req.params.id)
    ]
  )

  res.json(mapItemRow(result.rows[0]))
})

app.delete('/api/items/:id', auth, isAdmin, async (req, res) => {
  await pool.query('DELETE FROM items WHERE id = $1', [Number(req.params.id)])
  res.json({ ok: true })
})

app.get('/api/transactions', auth, isAdmin, async (_req, res) => {
  res.json(await getTransactions())
})

app.post('/api/transactions/in', auth, isAdmin, async (req, res) => {
  const { itemId, quantity, notes, totalPrice } = req.body
  const item = await findItemRowById(itemId)

  if (!item) return res.status(404).json({ error: 'Item not found' })

  await pool.query('BEGIN')

  try {
    await pool.query(
      'UPDATE items SET stock = stock + $1 WHERE id = $2',
      [Number(quantity), Number(itemId)]
    )

    const transResult = await pool.query(
      `
      INSERT INTO transactions (
        item_id,
        item_name,
        type,
        quantity,
        date,
        user_id,
        user_name,
        notes,
        total_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        Number(itemId),
        item.name,
        'in',
        Number(quantity),
        todayISO(),
        req.user.id,
        req.user.fullName,
        notes || '',
        Number(totalPrice || 0)
      ]
    )

    await pool.query('COMMIT')
    res.json(mapTransactionRow(transResult.rows[0]))
  } catch (error) {
    await pool.query('ROLLBACK')
    res.status(500).json({ error: error?.message || 'Gagal menambah stok' })
  }
})

app.post('/api/transactions/out', auth, isAdmin, async (req, res) => {
  const { itemId, quantity, notes } = req.body
  const item = await findItemRowById(itemId)

  if (!item) return res.status(404).json({ error: 'Item not found' })
  if (Number(item.stock || 0) < Number(quantity)) {
    return res.status(400).json({ error: 'Stok tidak cukup' })
  }

  await pool.query('BEGIN')

  try {
    await pool.query(
      'UPDATE items SET stock = stock - $1 WHERE id = $2',
      [Number(quantity), Number(itemId)]
    )

    const transResult = await pool.query(
      `
      INSERT INTO transactions (
        item_id,
        item_name,
        type,
        quantity,
        date,
        user_id,
        user_name,
        notes,
        total_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        Number(itemId),
        item.name,
        'out',
        Number(quantity),
        todayISO(),
        req.user.id,
        req.user.fullName,
        notes || '',
        0
      ]
    )

    await pool.query('COMMIT')
    res.json(mapTransactionRow(transResult.rows[0]))
  } catch (error) {
    await pool.query('ROLLBACK')
    res.status(500).json({ error: error?.message || 'Gagal mengurangi stok' })
  }
})

app.get('/api/borrowings', async (_req, res) => {
  res.json(await getBorrowings())
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

  const config = await getPublicConfig()
  const normalizedBorrowType = normalizeBorrowType(borrowType || 'peminjaman')
  const item = await findItemRowById(itemId)
  const requestedBorrowDate = borrowDate || todayISO()
  const submittedAt = todayISO()
  const normalizedPaymentProof = cleanBase64Image(paymentProof)

  if (!item) return res.status(404).json({ error: 'Item tidak ditemukan' })

  const mappedItem = mapItemRow(item)

  if (!isItemAllowedForType(mappedItem, normalizedBorrowType)) {
    return res.status(400).json({
      error: normalizedBorrowType === 'penyewaan'
        ? 'Barang ini tidak tersedia untuk penyewaan'
        : 'Barang ini tidak tersedia untuk peminjaman'
    })
  }

  if (!borrowerName || !borrowerPhone) {
    return res.status(400).json({ error: 'Nama dan no HP wajib diisi' })
  }

  if (!expectedReturn) {
    return res.status(400).json({ error: 'Tanggal pengembalian wajib diisi' })
  }

  if (expectedReturn < requestedBorrowDate) {
    return res.status(400).json({ error: 'Tanggal pengembalian tidak boleh lebih awal dari tanggal pinjam' })
  }

  if (Number(quantity || 0) < 1) {
    return res.status(400).json({ error: 'Jumlah minimal harus 1' })
  }

  if (normalizedBorrowType === 'penyewaan' && !normalizedPaymentProof) {
    return res.status(400).json({ error: 'Bukti pembayaran wajib diupload untuk penyewaan' })
  }

  const insertBorrowing = await pool.query(
    `
    INSERT INTO borrowings (
      borrow_type,
      item_id,
      item_name,
      borrower_name,
      borrower_phone,
      borrower_address,
      quantity,
      status,
      notes,
      submitted_at,
      requested_borrow_date,
      approved_at,
      borrow_date,
      expected_return,
      return_date,
      duration_days,
      linked_return_id,
      return_request_status,
      return_requested_at,
      return_verified_at,
      return_verified_by,
      return_photo,
      condition_on_return,
      return_notes,
      payment_proof,
      payment_proof_name,
      payment_status,
      whatsapp_status,
      whatsapp_response,
      created_at,
      updated_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,NOW(),NOW()
    )
    RETURNING *
    `,
    [
      normalizedBorrowType,
      Number(itemId),
      item.name,
      borrowerName,
      borrowerPhone,
      borrowerAddress || '',
      Number(quantity || 1),
      'pending',
      notes || '',
      submittedAt,
      requestedBorrowDate,
      null,
      null,
      expectedReturn || '',
      null,
      diffDays(requestedBorrowDate, expectedReturn),
      null,
      null,
      null,
      null,
      null,
      '',
      '',
      '',
      normalizedPaymentProof || '',
      paymentProofName || '',
      normalizedBorrowType === 'penyewaan' ? 'pending_verification' : null,
      null,
      null
    ]
  )

  let borrowingRow = insertBorrowing.rows[0]

  if (normalizedBorrowType === 'penyewaan') {
    const borrowing = mapBorrowingRow(borrowingRow)

    const waResult = await sendWhatsappNotification({
      config,
      borrowing
    })

    const whatsappStatus = waResult.success
      ? 'sent'
      : waResult.skipped
      ? 'skipped'
      : 'failed'

    const updateWa = await pool.query(
      `
      UPDATE borrowings
      SET whatsapp_status = $1, whatsapp_response = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [whatsappStatus, JSON.stringify(waResult), borrowingRow.id]
    )

    borrowingRow = updateWa.rows[0]
  }

  res.json(mapBorrowingRow(borrowingRow))
})

app.patch('/api/borrowings/:id/approve', auth, isAdmin, async (req, res) => {
  const borrowingRow = await findBorrowingRowById(req.params.id)
  if (!borrowingRow) return res.status(404).json({ error: 'Not found' })
  if (borrowingRow.status !== 'pending') {
    return res.status(400).json({ error: 'Status tidak valid' })
  }

  const itemRow = await findItemRowById(borrowingRow.item_id)
  if (!itemRow) return res.status(404).json({ error: 'Item not found' })

  if (!isItemAllowedForType(mapItemRow(itemRow), borrowingRow.borrow_type)) {
    return res.status(400).json({ error: 'Jenis layanan barang tidak sesuai' })
  }

  if (Number(itemRow.stock || 0) < Number(borrowingRow.quantity || 0)) {
    return res.status(400).json({ error: 'Stok tidak cukup' })
  }

  await pool.query('BEGIN')

  try {
    await pool.query(
      `UPDATE items SET stock = stock - $1 WHERE id = $2`,
      [Number(borrowingRow.quantity || 0), borrowingRow.item_id]
    )

    const updateBorrowing = await pool.query(
      `
      UPDATE borrowings
      SET
        status = $1,
        approved_at = $2,
        borrow_date = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      ['borrowed', todayISO(), borrowingRow.requested_borrow_date || todayISO(), borrowingRow.id]
    )

    await pool.query(
      `
      INSERT INTO transactions (
        item_id,
        item_name,
        type,
        quantity,
        date,
        user_id,
        user_name,
        notes,
        total_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        borrowingRow.item_id,
        borrowingRow.item_name,
        'out',
        Number(borrowingRow.quantity || 0),
        todayISO(),
        req.user.id,
        req.user.fullName,
        `${borrowingRow.borrow_type === 'penyewaan' ? 'Penyewaan' : 'Peminjaman'} disetujui`,
        0
      ]
    )

    await pool.query('COMMIT')
    res.json(mapBorrowingRow(updateBorrowing.rows[0]))
  } catch (error) {
    await pool.query('ROLLBACK')
    res.status(500).json({ error: error?.message || 'Gagal menyetujui pengajuan' })
  }
})

app.patch('/api/borrowings/:id/reject', auth, isAdmin, async (req, res) => {
  const borrowingRow = await findBorrowingRowById(req.params.id)
  if (!borrowingRow) return res.status(404).json({ error: 'Not found' })
  if (borrowingRow.status !== 'pending') {
    return res.status(400).json({ error: 'Status tidak valid' })
  }

  const result = await pool.query(
    `
    UPDATE borrowings
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    ['rejected', borrowingRow.id]
  )

  res.json(mapBorrowingRow(result.rows[0]))
})

app.post('/api/borrowings/:id/request-return', async (req, res) => {
  const result = await createPublicReturnRequest({
    borrowingId: Number(req.params.id),
    itemId: null,
    returnerName: req.body.returnerName,
    returnerPhone: req.body.returnerPhone,
    conditionOnReturn: req.body.conditionOnReturn,
    returnNotes: req.body.returnNotes,
    returnPhoto: req.body.returnPhoto
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.post('/api/borrowings/:id/verify-return', auth, isAdmin, async (req, res) => {
  const result = await verifyBorrowingReturnById({
    borrowingId: req.params.id,
    adminName: req.user.fullName,
    adminUserId: req.user.id
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.post('/api/borrowings/:id/return', auth, isAdmin, async (req, res) => {
  const borrowingRow = await findBorrowingRowById(req.params.id)

  if (!borrowingRow) return res.status(404).json({ error: 'Not found' })

  if (borrowingRow.return_request_status !== 'pending') {
    return res.status(400).json({
      error: 'Pengembalian harus melalui form terlebih dahulu sebelum diverifikasi admin'
    })
  }

  return res.status(400).json({
    error: 'Gunakan endpoint verifikasi pengembalian, bukan konfirmasi langsung'
  })
})

app.get('/api/returns-public', auth, isAdmin, async (_req, res) => {
  res.json(await getPublicReturns())
})

app.post('/api/returns-public', async (req, res) => {
  const result = await createPublicReturnRequest({
    borrowingId: req.body.borrowingId,
    itemId: req.body.itemId,
    returnerName: req.body.returnerName,
    returnerPhone: req.body.returnerPhone,
    conditionOnReturn: req.body.conditionOnReturn,
    returnNotes: req.body.returnNotes,
    returnPhoto: req.body.returnPhoto
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.post('/api/returns-public/:id/verify', auth, isAdmin, async (req, res) => {
  const returnResult = await pool.query(
    'SELECT * FROM public_returns WHERE id = $1 LIMIT 1',
    [Number(req.params.id)]
  )
  const row = returnResult.rows[0]

  if (!row) {
    return res.status(404).json({ error: 'Data return tidak ditemukan' })
  }

  const result = await verifyBorrowingReturnById({
    borrowingId: row.borrowing_id,
    adminName: req.user.fullName,
    adminUserId: req.user.id
  })

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }

  return res.json(result.payload)
})

app.get('/', (_req, res) => res.send('Inventory API OK'))

async function startServer() {
  await initDatabase()
  await bootstrapMysqlConnection()

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer().catch(error => {
  console.error('Failed to start server:', error?.message || error)
  process.exit(1)
})