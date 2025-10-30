const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { auth } = require('../middlewares/auth')
const db = require('../db')
const secret = process.env.JWT_SECRET || 'secret'

router.post('/login', async (req,res)=>{
  const { username, password } = req.body
  const u = await db.users.getByUsername(username)
  if(!u) return res.status(400).json({ success:false, message:'User tidak ditemukan' })
  const ok = await bcrypt.compare(password, u.passwordHash)
  if(!ok) return res.status(400).json({ success:false, message:'Password salah' })
  const token = jwt.sign({ id:u.id, role:u.role, username:u.username, fullName:u.fullName }, secret, { expiresIn:'7d' })
  res.json({ success:true, token, user:{ id:u.id, role:u.role, username:u.username, fullName:u.fullName } })
})

router.post('/change-password', auth, async (req,res)=>{
  const { currentPassword, newPassword } = req.body
  if(!currentPassword || !newPassword) return res.status(400).json({ success:false, message:'Invalid payload' })
  const user = await db.users.getById(req.user.id)
  if(!user) return res.status(404).json({ success:false, message:'User not found' })
  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if(!ok) return res.status(400).json({ success:false, message:'Password saat ini salah' })
  const hash = await bcrypt.hash(newPassword, 10)
  await db.users.updatePassword(req.user.id, hash)
  res.json({ success:true })
})

module.exports = router
