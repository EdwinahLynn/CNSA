require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Wrap async route handlers so unhandled promise rejections go to the error handler
const asyncSafe = (router) => {
  router.stack.forEach((layer) => {
    if (layer.route) {
      layer.route.stack.forEach((handler) => {
        const orig = handler.handle;
        handler.handle = (req, res, next) =>
          Promise.resolve(orig(req, res, next)).catch(next);
      });
    }
  });
  return router;
};

// Convert PascalCase SQL Server field names to camelCase for the frontend
// e.g. SchoolID → schoolId, SchoolName → schoolName
const toCamel = (s) =>
  s === '_id' ? '_id' : s.charAt(0).toLowerCase() + s.slice(1).replace(/ID$/, 'Id');

const camelizeKeys = (obj) => {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), camelizeKeys(v)])
    );
  }
  return obj;
};

const app = express();
connectDB();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Auto-camelCase all JSON responses
app.use((req, res, next) => {
  const orig = res.json.bind(res);
  res.json = (data) => orig(camelizeKeys(data));
  next();
});

app.use('/api/auth',              asyncSafe(require('./routes/auth')));
app.use('/api/schools',           asyncSafe(require('./routes/schools')));
app.use('/api/players',           asyncSafe(require('./routes/players')));
app.use('/api/coaches',           asyncSafe(require('./routes/coaches')));
app.use('/api/teams',             asyncSafe(require('./routes/teams')));
app.use('/api/stadiums',          asyncSafe(require('./routes/stadiums')));
app.use('/api/games',             asyncSafe(require('./routes/games')));
app.use('/api/injuries',          asyncSafe(require('./routes/injuries')));
app.use('/api/scholarships',      asyncSafe(require('./routes/scholarships')));
app.use('/api/positions',         asyncSafe(require('./routes/positions')));
app.use('/api/recruiting-sources',asyncSafe(require('./routes/recruitingSources')));
app.use('/api/reports',           asyncSafe(require('./routes/reports')));

// Global error handler — return empty data when DB is unavailable so pages don't break
app.use((err, req, res, next) => {
  const isDbError =
    err.message?.includes('ECONNREFUSED') ||
    err.message?.includes('Failed to connect') ||
    err.message?.includes('Connection is closed') ||
    err.code === 'ECONNREFUSED' ||
    err.name === 'ConnectionError';

  if (isDbError) {
    return res.json(req.method === 'GET' ? [] : { message: 'Database not available' });
  }

  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CNSA API running on port ${PORT}`));
