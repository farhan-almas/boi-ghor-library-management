
const mysql = require('mysql2/promise');
require('dotenv').config();

const mode = process.env.DB_MODE || 'local';

const config = mode === 'tidb'
  ? {
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT || 4000),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'boi_ghor_db',
      ssl: process.env.TIDB_ENABLE_SSL === 'true'
        ? { minVersion: 'TLSv1.2' }
        : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'boi_ghor_db',
    };

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
