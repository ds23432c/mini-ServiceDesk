const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'root',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'servicedesk',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  ssl:
    process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined
});

module.exports = pool;
