
# Inventory App — React (Vite) + Express

Modern, aesthetic, animated inventory & borrowing system with role-based access (admin & user). 
Design follows your provided component style (custom classes like `card`, `btn-primary`, `input`, etc.) and Tailwind utilities.

## Features
- Auth: Login & Register (demo creds: **admin/admin**, **user/user**).
- Roles:
  - **User**: Dashboard, Data Barang, Barang Masuk, Barang Keluar, Riwayat Peminjaman, Laporan, Analytics (read only), Pengaturan.
  - **Admin**: Semua menu user + Manajemen User (CRUD).
- Beautiful sidebar + topbar, modern cards, gradients, subtle animations (Framer Motion).
- Mock data and REST API (Express) with JWT auth (in-memory for quick start).
- Ready to export/extend (items, transactions, borrowings).

## Quick Start
1. **Install Node 18+** (or 20+ recommended).
2. **Install deps** (from project root):
   ```bash
   npm run install:all
   ```
3. **Run dev (client + server concurrently):**
   ```bash
   npm run dev
   ```
   - Server: http://localhost:5000
   - Client: http://localhost:5173
4. **Login demo:**
   - Admin: `admin` / `admin`
   - User: `user` / `user`

> Data is stored in-memory for simplicity. Restarting the server resets state. 
> Replace with a real DB later (Mongo/Postgres) if needed.

## Build for Production (client only)
```bash
npm run build
```

## Environment (optional)
Copy `server/.env.sample` to `server/.env` and adjust `JWT_SECRET` if you want a custom secret.

---

### Project Structure
```
inventory-fullstack/
  client/         # React + Vite + Tailwind + Framer Motion
  server/         # Express + JWT + in-memory data
  package.json    # root scripts to run both
```

Enjoy! 🎉
