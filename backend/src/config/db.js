const sql = require('mssql');

const config = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
    console.log(`SQL Server Connected: ${process.env.DB_SERVER} / ${process.env.DB_NAME}`);
  }
  return pool;
};

const connectDB = async () => {
  try {
    await getPool();
  } catch (err) {
    console.warn(`SQL Server not available: ${err.message}`);
    console.warn('Running without database — mock data only.');
  }
};

module.exports = { connectDB, getPool, sql };
