const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.request().query('SELECT PositionID AS _id, PositionID, PositionName FROM Position')).recordset);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('name', sql.VarChar(50), req.body.positionName)
    .query('INSERT INTO Position (PositionName) OUTPUT INSERTED.* VALUES (@name)');
  res.status(201).json(result.recordset[0]);
});

module.exports = router;
