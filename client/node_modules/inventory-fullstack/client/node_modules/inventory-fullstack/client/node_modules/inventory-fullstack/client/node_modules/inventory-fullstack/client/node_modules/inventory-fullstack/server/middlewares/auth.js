const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET || 'secret'
exports.auth = (req,res,next)=>{
  const h = req.headers.authorization||''
  const token = h.startsWith('Bearer ')?h.slice(7):null
  if(!token) return res.status(401).json({error:'unauthorized'})
  try{
    const payload = jwt.verify(token, secret)
    req.user = { id: payload.id, role: payload.role, username: payload.username, fullName: payload.fullName }
    next()
  }catch(e){
    return res.status(401).json({error:'invalid token'})
  }
}
