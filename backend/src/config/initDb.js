/**
 * Creates the CNSA database and all tables.
 * Run once: npm run initdb
 */
require('dotenv').config();
const sql = require('mssql');
const fs  = require('fs');
const path = require('path');

const masterConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,
  database: 'master',
  options:  { encrypt: false, trustServerCertificate: true }
};

async function init() {
  const pool = await sql.connect(masterConfig);

  // Create database if it doesn't exist
  await pool.request().query(`
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${process.env.DB_NAME}')
    CREATE DATABASE [${process.env.DB_NAME}]
  `);
  console.log(`Database '${process.env.DB_NAME}' ready.`);

  await pool.close();

  // Now connect to the CNSA database and run schema
  const cnsa = await sql.connect({
    ...masterConfig,
    database: process.env.DB_NAME
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Split on GO statements (SQL Server batch separator)
  const batches = schema.split(/^\s*GO\s*$/im).filter(b => b.trim());
  for (const batch of batches) {
    if (batch.trim()) {
      await cnsa.request().query(batch);
    }
  }

  console.log('All tables created successfully.');
  await cnsa.close();
}

init().catch(err => {
  console.error('Init failed:', err.message);
  process.exit(1);
});
