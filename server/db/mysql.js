import dotenv from 'dotenv'
import pkg from 'pg'

dotenv.config()

const { Pool } = pkg

let pgPool = null

function buildPostgresConfig() {
  const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true'

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory',
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_CONNECTION_LIMIT || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  }
}

function getPool() {
  if (pgPool) return pgPool

  pgPool = new Pool(buildPostgresConfig())

  pgPool.on('error', error => {
    console.error('PostgreSQL pool error:', error?.message || error)
  })

  return pgPool
}

export async function testMysqlConnection() {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const result = await client.query(
      'SELECT current_database() AS nama_database, NOW() AS waktu_server'
    )

    return {
      success: true,
      database: result?.rows?.[0]?.nama_database || process.env.DB_NAME || 'inventory',
      serverTime: result?.rows?.[0]?.waktu_server || null
    }
  } finally {
    client.release()
  }
}

export async function query(sql, params = []) {
  const pool = getPool()
  const result = await pool.query(sql, params)
  return result.rows
}

export async function execute(sql, params = []) {
  const pool = getPool()
  return pool.query(sql, params)
}

const lazyPool = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'query') {
        return async (sql, params = []) => {
          const pool = getPool()
          return pool.query(sql, params)
        }
      }

      if (prop === 'connect') {
        return async () => {
          const pool = getPool()
          return pool.connect()
        }
      }

      if (prop === 'end') {
        return async () => {
          if (!pgPool) return null
          return pgPool.end()
        }
      }

      return undefined
    }
  }
)

export default lazyPool