import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  namedPlaceholders: true
})

export async function testMysqlConnection() {
  const connection = await pool.getConnection()
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
  const [rows] = await pool.query(sql, params)
  return rows
}

export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params)
  return result
}

export default pool