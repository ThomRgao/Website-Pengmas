let users = [
  { id: 1, username: 'admin', fullName: 'Administrator', role: 'admin', passwordHash: '$2b$10$CaxuR8m3u2oQyp6r2rIhjuj1yL3k0t2Eo3mY0y0b3sYb2O7c3iM7e' },
  { id: 2, username: 'user', fullName: 'sanzy', role: 'user', passwordHash: '$2b$10$CaxuR8m3u2oQyp6r2rIhjuj1yL3k0t2Eo3mY0y0b3sYb2O7c3iM7e' }
]
module.exports = {
  getById: async id => users.find(x=>String(x.id)===String(id)),
  getByUsername: async u => users.find(x=>x.username===u),
  updatePassword: async (id, passwordHash) => {
    const i = users.findIndex(x=>String(x.id)===String(id))
    if(i>-1) users[i].passwordHash = passwordHash
    return true
  }
}
