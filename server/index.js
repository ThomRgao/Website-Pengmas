
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret_super_secret_replace_me';
const PORT = process.env.PORT || 5000;

let users = [
  { id: 1, username: 'admin', password: 'admin', role: 'admin', fullName: 'Administrator', email: 'admin@inventory.com', status: 'active', joinDate: '2024-01-15' },
  { id: 2, username: 'user', password: 'user', role: 'user', fullName: 'Sanzy', email: 'user@inventory.com', status: 'active', joinDate: '2024-03-20' },
  { id: 3, username: 'user2', password: 'user2', role: 'user', fullName: 'Sanzy', email: 'sanzy@inventory.com', status: 'active', joinDate: '2024-05-10' },
];

let items = [
  { id: 1, name: 'Laptop Ngawi', code: 'LPT-001', category: 'Elektronik', stock: 5, minStock: 2, condition: 'Baik', location: 'Gudang A', price: 25000000, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400' },
  { id: 2, name: 'Proyektor Amba', code: 'PRJ-001', category: 'Elektronik', stock: 3, minStock: 1, condition: 'Baik', location: 'Gudang B', price: 8500000, image: 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=400' },
  { id: 3, name: 'Kursi Kantor', code: 'FRN-001', category: 'Furniture', stock: 20, minStock: 5, condition: 'Baik', location: 'Gudang A', price: 3500000, image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400' },
  { id: 4, name: 'Lemari Razan', code: 'FRN-002', category: 'Furniture', stock: 5, minStock: 2, condition: 'Baik', location: 'Gudang C', price: 5200000, image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400' },
  { id: 5, name: 'Printer', code: 'PRT-001', category: 'Elektronik', stock: 8, minStock: 3, condition: 'Baik', location: 'Gudang B', price: 4200000, image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400' },
  { id: 6, name: 'Mouse Logitech', code: 'ACC-001', category: 'Aksesoris', stock: 15, minStock: 10, condition: 'Baik', location: 'Gudang A', price: 350000, image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400' },
];

let transactions = [
  { id: 1, itemId: 1, itemName: 'Laptop Ngawi', type: 'in', quantity: 5, date: '2025-10-01', userId: 1, userName: 'Administrator', notes: 'Pembelian baru dari supplier', totalPrice: 125000000 },
  { id: 2, itemId: 2, itemName: 'Proyektor Amba', type: 'out', quantity: 1, date: '2025-10-15', userId: 2, userName: 'Sanzy', notes: 'Peminjaman untuk presentasi client' },
  { id: 3, itemId: 3, itemName: 'Kursi Kantor ', type: 'in', quantity: 10, date: '2025-10-10', userId: 1, userName: 'Administrator', notes: 'Restok furniture', totalPrice: 35000000 },
  { id: 4, itemId: 5, itemName: 'Printer', type: 'out', quantity: 2, date: '2025-10-20', userId: 2, userName: 'Sanzy', notes: 'Distribusi ke cabang' },
];

let borrowings = [
  { id: 1, itemId: 1, itemName: 'Laptop Ngawi', userId: 2, userName: 'Sanzy', borrowDate: '2025-10-20', returnDate: null, expectedReturn: '2025-10-27', quantity: 1, status: 'borrowed', notes: 'Untuk project development' },
  { id: 2, itemId: 2, itemName: 'Proyektor Amba', userId: 2, userName: 'Sanzy', borrowDate: '2025-10-15', returnDate: '2025-10-20', expectedReturn: '2025-10-20', quantity: 1, status: 'returned', notes: 'Presentasi client XYZ' },
  { id: 3, itemId: 5, itemName: 'Printer', userId: 3, userName: 'Sanzy', borrowDate: '2025-10-18', returnDate: null, expectedReturn: '2025-10-25', quantity: 1, status: 'borrowed', notes: 'Kebutuhan administrasi' },
  { id: 4, itemId: 1, itemName: 'Laptop Ngawi', userId: 3, userName: 'Sanzy', borrowDate: '2025-10-10', returnDate: '2025-10-17', expectedReturn: '2025-10-17', quantity: 1, status: 'returned', notes: 'Training karyawan baru' },
];

// --- Helpers ---
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, username: user.username, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });
}
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Username atau password salah' });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName, email: user.email } });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username & password wajib' });
  const exists = users.some(u => u.username === username);
  if (exists) return res.status(400).json({ error: 'username sudah dipakai' });
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser = { id, username, password, fullName: fullName || username, email: email || `${username}@example.com`, role: 'user', status: 'active', joinDate: new Date().toISOString().slice(0,10) };
  users.push(newUser);
  const token = signToken(newUser);
  res.json({ token, user: { id, username, role: 'user', fullName: newUser.fullName, email: newUser.email } });
});

app.get('/api/items', auth, (req, res) => res.json(items));

app.post('/api/items', auth, isAdmin, (req, res) => {
  const id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
  const item = { id, ...req.body };
  items.push(item);
  res.json(item);
});

app.put('/api/items/:id', auth, isAdmin, (req, res) => {
  const id = +req.params.id;
  items = items.map(i => i.id === id ? { ...i, ...req.body } : i);
  res.json(items.find(i => i.id === id));
});

app.delete('/api/items/:id', auth, isAdmin, (req, res) => {
  const id = +req.params.id;
  items = items.filter(i => i.id !== id);
  res.json({ ok: true });
});

app.get('/api/transactions', auth, (req, res) => res.json(transactions));

app.post('/api/transactions/in', auth, (req, res) => {
  const { itemId, quantity, notes, totalPrice } = req.body;
  const item = items.find(i => i.id === +itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.stock += +quantity;
  const trans = { id: transactions.length ? Math.max(...transactions.map(t=>t.id))+1 : 1, itemId: +itemId, itemName: item.name, type: 'in', quantity: +quantity, date: new Date().toISOString().slice(0,10), userId: req.user.id, userName: req.user.fullName, notes, totalPrice: totalPrice || 0 };
  transactions = [trans, ...transactions];
  res.json(trans);
});

app.post('/api/transactions/out', auth, (req, res) => {
  const { itemId, quantity, notes } = req.body;
  const item = items.find(i => i.id === +itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.stock < +quantity) return res.status(400).json({ error: 'Stok tidak cukup' });
  item.stock -= +quantity;
  const trans = { id: transactions.length ? Math.max(...transactions.map(t=>t.id))+1 : 1, itemId: +itemId, itemName: item.name, type: 'out', quantity: +quantity, date: new Date().toISOString().slice(0,10), userId: req.user.id, userName: req.user.fullName, notes };
  transactions = [trans, ...transactions];
  res.json(trans);
});

app.get('/api/borrowings', auth, (req, res) => res.json(borrowings));

app.post('/api/borrowings', auth, (req, res) => {
  const { itemId, quantity, expectedReturn, notes } = req.body;
  const item = items.find(i => i.id === +itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.stock < +quantity) return res.status(400).json({ error: 'Stok tidak cukup' });
  item.stock -= +quantity;
  const b = { id: borrowings.length ? Math.max(...borrowings.map(x=>x.id))+1 : 1, itemId: +itemId, itemName: item.name, userId: req.user.id, userName: req.user.fullName, borrowDate: new Date().toISOString().slice(0,10), returnDate: null, expectedReturn, quantity: +quantity, status: 'borrowed', notes };
  borrowings = [b, ...borrowings];
  res.json(b);
});

app.post('/api/borrowings/:id/return', auth, (req, res) => {
  const id = +req.params.id;
  const b = borrowings.find(x => x.id === id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  if (b.status === 'returned') return res.status(400).json({ error: 'Sudah dikembalikan' });
  b.status = 'returned';
  b.returnDate = new Date().toISOString().slice(0,10);
  const item = items.find(i => i.id === b.itemId);
  if (item) item.stock += b.quantity;
  res.json(b);
});

app.get('/api/users', auth, isAdmin, (req, res) => res.json(users.map(({password, ...u})=>u)));

app.post('/api/users', auth, isAdmin, (req, res) => {
  const { username, password, role='user', fullName, email, status='active' } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username & password wajib' });
  if (users.some(u => u.username === username)) return res.status(400).json({ error: 'username sudah dipakai' });
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const user = { id, username, password, role, fullName: fullName || username, email: email || `${username}@example.com`, status, joinDate: new Date().toISOString().slice(0,10) };
  users.push(user);
  const { password: pw, ...safe } = user;
  res.json(safe);
});

app.put('/api/users/:id', auth, isAdmin, (req, res) => {
  const id = +req.params.id;
  users = users.map(u => u.id === id ? { ...u, ...req.body } : u);
  const { password, ...safe } = users.find(u => u.id === id) || {};
  res.json(safe);
});

app.delete('/api/users/:id', auth, isAdmin, (req, res) => {
  const id = +req.params.id;
  users = users.filter(u => u.id !== id);
  res.json({ ok: true });
});

app.get('/', (_req,res)=>res.send('Inventory API OK'));
app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
