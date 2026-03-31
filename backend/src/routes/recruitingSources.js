const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.request().query('SELECT RecruitSourceID AS _id, RecruitSourceID, SourceName, SourceType FROM RecruitingSource')).recordset);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('sourceName', sql.VarChar(100), req.body.sourceName)
    .input('sourceType', sql.VarChar(50),  req.body.sourceType)
    .query('INSERT INTO RecruitingSource (SourceName, SourceType) OUTPUT INSERTED.* VALUES (@sourceName, @sourceType)');
  res.status(201).json(result.recordset[0]);
});

module.exports = router;
