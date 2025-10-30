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
