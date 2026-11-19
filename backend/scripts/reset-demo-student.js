const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const hash = await bcrypt.hash('password', 10);
  await pool.query('UPDATE users SET password = ? WHERE email = ?', [hash, 'jubayer@lullpathagar.edu']);
  await pool.end();
  console.log('Demo student password refreshed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
