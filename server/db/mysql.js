import dotenv from 'dotenv'

dotenv.config()

let mysqlLib = null
let pool = null
let mysqlDriverError = null

async function loadMysqlLibrary() {
  if (mysqlLib) return mysqlLib

  try {
    const mysqlModule = await import('mysql2/promise')
    mysqlLib = mysqlModule.default || mysqlModule
    return mysqlLib
  } catch (error) {
    mysqlDriverError = error
    return null
  }
}

function buildMysqlConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    namedPlaceholders: true
  }
}

async function getPool() {
  if (pool) return pool

  const mysql = await loadMysqlLibrary()

  if (!mysql) {
    const driverError = mysqlDriverError?.message || 'Driver mysql2 belum terpasang'
    throw new Error(`MySQL driver tidak tersedia. ${driverError}`)
  }

  pool = mysql.createPool(buildMysqlConfig())
  return pool
}

export async function testMysqlConnection() {
  const activePool = await getPool()
  const connection = await activePool.getConnection()

  try {
    const [rows] = await connection.query('SELECT DATABASE() AS nama_database, NOW() AS waktu_server')
    return {
      success: true,
      database: rows?.[0]?.nama_database || process.env.DB_NAME || 'inventory',
      serverTime: rows?.[0]?.waktu_server || null
    }
  } finally {
    connection.release()
  }
}

export async function query(sql, params = []) {
  const activePool = await getPool()
  const [rows] = await activePool.query(sql, params)
  return rows
}

export async function execute(sql, params = []) {
  const activePool = await getPool()
  const [result] = await activePool.execute(sql, params)
  return result
}

const lazyPool = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'query') {
        return async (...args) => {
          const activePool = await getPool()
          return activePool.query(...args)
        }
      }

      if (prop === 'execute') {
        return async (...args) => {
          const activePool = await getPool()
          return activePool.execute(...args)
        }
      }

      if (prop === 'getConnection') {
        return async (...args) => {
          const activePool = await getPool()
          return activePool.getConnection(...args)
        }
      }

      if (prop === 'end') {
        return async (...args) => {
          if (!pool) return null
          return pool.end(...args)
        }
      }

      return undefined
    }
  }
)

export default lazyPool