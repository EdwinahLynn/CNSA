const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const getPool = async () => pool;

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to Supabase PostgreSQL');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};

module.exports = { connectDB, getPool };
