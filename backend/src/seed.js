/**
 * Creates the initial CNSA_ADMIN user.
 * Run once after initdb: node src/seed.js
 */
require('dotenv').config();
const sql    = require('mssql');
const bcrypt = require('bcryptjs');

async function seed() {
  const pool = await sql.connect({
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, database: process.env.DB_NAME,
    options: { encrypt: false, trustServerCertificate: true }
  });

  const exists = await pool.request()
    .input('username', sql.VarChar(50), 'admin')
    .query('SELECT UserID FROM Users WHERE Username = @username');

  if (exists.recordset.length > 0) {
    console.log('Admin user already exists.');
  } else {
    const hash = await bcrypt.hash('admin123', 12);
    await pool.request()
      .input('hash', sql.VarChar(255), hash)
      .query(`INSERT INTO Users (Username, PasswordHash, Role) VALUES ('admin', @hash, 'CNSA_ADMIN')`);
    console.log('Created admin user — username: admin / password: admin123');
    console.log('CHANGE THIS PASSWORD after first login!');
  }

  await pool.close();
}

seed().catch(console.error);
