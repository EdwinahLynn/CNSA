require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

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

const app = express();
connectDB();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

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
  const isDbError = err.name === 'MongoNetworkError' ||
    err.name === 'MongooseError' ||
    err.name === 'MongoNotConnectedError' ||
    err.message?.includes('ECONNREFUSED') ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('not connected');

  if (isDbError) {
    return res.json(req.method === 'GET' ? [] : { message: 'Database not available' });
  }

  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CNSA API running on port ${PORT}`));
