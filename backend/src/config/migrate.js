/**
 * Migration: add CoachID to Player and Users tables
 * Run: node src/config/migrate.js
 */
require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true }
};

async function migrate() {
  const pool = await sql.connect(config);

  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME='Player' AND COLUMN_NAME='CoachID'
    )
    ALTER TABLE Player ADD CoachID INT NULL REFERENCES Coach(CoachID)
  `);
  console.log('Player.CoachID — done');

  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME='Users' AND COLUMN_NAME='CoachID'
    )
    ALTER TABLE Users ADD CoachID INT NULL REFERENCES Coach(CoachID)
  `);
  console.log('Users.CoachID — done');

  await pool.close();
  console.log('Migration complete.');
}

migrate().catch(console.error);
